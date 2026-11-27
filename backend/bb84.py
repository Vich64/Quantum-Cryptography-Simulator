"""BB84 quantum key distribution, simulated with Qiskit.

Follows the project proposal (section 6.7): each photon is a one-qubit circuit.
  - Alice writes bit 1 with an X gate and switches to the x filter with an H gate.
  - Eve (optional) measures in a random filter, then re-sends a photon in her filter.
  - Channel noise (optional) flips Bob's result with an X gate just before he measures.
  - Bob switches to the x filter with an H gate and measures.

Filters (bases) are stored as 0 = "+" (straight) and 1 = "x" (diagonal).
"""

from __future__ import annotations

import math
import secrets

import numpy as np
from qiskit import QuantumCircuit
from qiskit_aer import AerSimulator

QBER_LIMIT = 0.11  # Shor-Preskill: BB84 is proven safe only below ~11 % errors
FILTER_SYMBOL = {0: "+", 1: "x"}

# X, H and measurement are Clifford operations, so the stabilizer method is exact and fast.
_SIM = AerSimulator(method="stabilizer")

# The worked example from the proposal (section 6.5) and slide 12.
SLIDE12_EXAMPLE = {
    "alice_bits": [0, 1, 1, 0, 1, 0, 0, 1],
    "alice_bases": [0, 1, 0, 0, 1, 1, 0, 1],
    "bob_bases": [0, 0, 1, 0, 1, 0, 0, 1],
}


def photon_circuit(
    alice_bit: int, alice_basis: int, bob_basis: int, eve_basis: int | None = None, noise_flip: bool = False
) -> QuantumCircuit:
    """Build the circuit for one photon. Classical bit 0 = Bob's result, bit 1 = Eve's result.

    noise_flip: the channel/detector flips Bob's result (a Pauli X applied after Bob's filter,
    so it flips the bit in either filter). Alice and Bob cannot tell this apart from Eve.
    """
    qc = QuantumCircuit(1, 2, name="photon")
    # 1. Alice prepares the photon
    if alice_bit:
        qc.x(0)
    if alice_basis:
        qc.h(0)
    qc.barrier(label="channel")
    # 2. Eve intercepts and re-sends (intercept-resend attack)
    if eve_basis is not None:
        if eve_basis:
            qc.h(0)
        qc.measure(0, 1)
        if eve_basis:  # re-send her result written in her own filter
            qc.h(0)
        qc.barrier(label="Eve")
    # 3. Bob reads with his filter
    if bob_basis:
        qc.h(0)
    if noise_flip:
        qc.x(0)
    qc.measure(0, 0)
    return qc


def _validate_bits(name: str, values, n: int) -> list[int]:
    if len(values) != n:
        raise ValueError(f"{name} must have {n} entries, got {len(values)}")
    out = [int(v) for v in values]
    if any(v not in (0, 1) for v in out):
        raise ValueError(f"{name} may only contain 0 and 1")
    return out


def wilson_interval(errors: int, n: int, z: float = 1.96) -> tuple[float, float]:
    """Rough 95 % range for an error rate measured from n checked bits (Wilson score interval)."""
    if n == 0:
        return (0.0, 1.0)
    q = errors / n
    denom = 1 + z * z / n
    centre = (q + z * z / (2 * n)) / denom
    half = z * math.sqrt(q * (1 - q) / n + z * z / (4 * n * n)) / denom
    return (max(0.0, centre - half), min(1.0, centre + half))


def run_bb84(
    n_photons: int,
    eve_fraction: float = 0.0,
    check_fraction: float = 0.25,
    noise_fraction: float = 0.0,
    seed: int | None = None,
    alice_bits=None,
    alice_bases=None,
    bob_bases=None,
) -> dict:
    """Run one full BB84 exchange and return every photon plus the summary.

    eve_fraction:   share of photons Eve reads (0 = no Eve, 1 = every photon).
    check_fraction: share of the kept bits Alice and Bob reveal publicly to estimate errors.
                    Those bits are thrown away; the rest become the key.
    noise_fraction: chance that the channel flips Bob's result on any photon (bit-flip noise).
    """
    if n_photons < 1:
        raise ValueError("n_photons must be at least 1")
    if not 0.0 <= eve_fraction <= 1.0:
        raise ValueError("eve_fraction must be between 0 and 1")
    if not 0.0 <= check_fraction <= 1.0:
        raise ValueError("check_fraction must be between 0 and 1")
    if not 0.0 <= noise_fraction <= 0.5:
        raise ValueError("noise_fraction must be between 0 and 0.5")

    seed = secrets.randbelow(2**31 - 1) if seed is None else int(seed)
    rng = np.random.default_rng(seed)
    n = n_photons

    # Step 1-2 inputs: random bits and filters (or fixed ones for the worked example)
    a_bits = _validate_bits("alice_bits", alice_bits, n) if alice_bits is not None else rng.integers(0, 2, n).tolist()
    a_bases = _validate_bits("alice_bases", alice_bases, n) if alice_bases is not None else rng.integers(0, 2, n).tolist()
    b_bases = _validate_bits("bob_bases", bob_bases, n) if bob_bases is not None else rng.integers(0, 2, n).tolist()

    # Eve reads an exact share of the photons, chosen at random, each with a random filter
    n_eve = int(round(eve_fraction * n))
    eve_set = set(rng.choice(n, size=n_eve, replace=False).tolist()) if n_eve else set()
    e_bases = [int(rng.integers(0, 2)) if i in eve_set else None for i in range(n)]

    # Channel noise: each photon's result is flipped with probability noise_fraction.
    # (Only drawn when noise is on, so noise-free runs give exactly the same results as before.)
    flips = (rng.random(n) < noise_fraction).tolist() if noise_fraction > 0 else [False] * n

    # Run every photon on Qiskit Aer, one shot each
    circuits = [photon_circuit(a_bits[i], a_bases[i], b_bases[i], e_bases[i], flips[i]) for i in range(n)]
    result = _SIM.run(circuits, shots=1, memory=True, seed_simulator=seed).result()
    outcomes = [result.get_memory(i)[0] for i in range(n)]  # e.g. "01" -> clbit1 clbit0
    b_bits = [int(s[-1]) for s in outcomes]
    e_bits = [int(s[-2]) if e_bases[i] is not None else None for i, s in enumerate(outcomes)]

    # Step 3: compare filters publicly, keep matches
    kept = [i for i in range(n) if a_bases[i] == b_bases[i]]
    n_kept = len(kept)

    # Step 4: reveal a random sample of kept bits to estimate the error rate
    if n_kept >= 2:
        n_check = min(max(1, int(round(check_fraction * n_kept))), n_kept - 1)
    else:
        n_check = 0
    check_set = set(rng.choice(kept, size=n_check, replace=False).tolist()) if n_check else set()

    errors_kept = [i for i in kept if a_bits[i] != b_bits[i]]
    errors_check = [i for i in errors_kept if i in check_set]
    key_idx = [i for i in kept if i not in check_set]
    alice_key = [a_bits[i] for i in key_idx]
    bob_key = [b_bits[i] for i in key_idx]

    estimated_qber = len(errors_check) / n_check if n_check else None
    actual_qber = len(errors_kept) / n_kept if n_kept else None
    # Each photon Eve reads gives a 1/4 chance of an error, so errors ~ f/4  =>  f ~ 4 * errors.
    # (Alice and Bob cannot tell noise from Eve, so noise makes this guess too high.)
    estimated_eve_fraction = min(1.0, 4 * estimated_qber) if estimated_qber is not None else None
    if n_check:
        lo, hi = wilson_interval(len(errors_check), n_check)
        estimated_eve_range = [min(1.0, 4 * lo), min(1.0, 4 * hi)]
    else:
        estimated_eve_range = None

    # What Eve learned about the final key: her copy of a key bit equals Alice's bit.
    # On photons where she used the right glasses she is sure; on the others she got it by luck.
    eve_key_read = [i for i in key_idx if e_bases[i] is not None]
    eve_known = [i for i in eve_key_read if e_bits[i] == a_bits[i]]
    eve_sure = [i for i in eve_key_read if e_bases[i] == a_bases[i]]

    if n_check == 0:
        status = "too_short"
    elif estimated_qber <= QBER_LIMIT:
        status = "accepted"
    else:
        status = "rejected"

    photons = []
    for i in range(n):
        eb = e_bases[i]
        photons.append(
            {
                "index": i + 1,
                "alice_bit": a_bits[i],
                "alice_filter": FILTER_SYMBOL[a_bases[i]],
                "eve_read": eb is not None,
                "eve_filter": FILTER_SYMBOL[eb] if eb is not None else None,
                "eve_bit": e_bits[i],
                # the photon Eve re-sends differs from Alice's when Eve used the other filter
                "eve_changed": eb is not None and eb != a_bases[i],
                "bob_filter": FILTER_SYMBOL[b_bases[i]],
                "bob_bit": b_bits[i],
                "same_filter": a_bases[i] == b_bases[i],
                "is_check": i in check_set,
                "in_key": i in key_idx,
                "noise_flip": bool(flips[i]),
                "error": a_bits[i] != b_bits[i] and a_bases[i] == b_bases[i],
                # Eve touched this kept photon and it shows up as a mistake (checked or not)
                "eve_caught": eb is not None and a_bases[i] == b_bases[i] and a_bits[i] != b_bits[i],
            }
        )

    return {
        "seed": seed,
        "n_photons": n,
        "eve_fraction": eve_fraction,
        "eve_count": n_eve,
        "check_fraction": check_fraction,
        "noise_fraction": noise_fraction,
        "photons": photons,
        "kept_count": n_kept,
        "keep_rate": n_kept / n,
        "check_count": n_check,
        "check_errors": len(errors_check),
        "kept_errors": len(errors_kept),
        "estimated_qber": estimated_qber,
        "actual_qber": actual_qber,
        "estimated_eve_fraction": estimated_eve_fraction,
        "estimated_eve_range": estimated_eve_range,
        "eve_key_bits_read": len(eve_key_read),
        "eve_known_key_bits": len(eve_known),
        "eve_sure_key_bits": len(eve_sure),
        "qber_limit": QBER_LIMIT,
        "status": status,
        "sifted_key": [a_bits[i] for i in kept],
        "alice_key": alice_key,
        "bob_key": bob_key,
        "keys_match": alice_key == bob_key,
    }


def expected_qber(eve_fraction: float, noise_fraction: float = 0.0) -> float:
    """Theory: Eve makes an error on 1/4 of the photons she reads; noise then flips a share p of all results."""
    e = 0.25 * eve_fraction
    return e * (1 - noise_fraction) + (1 - e) * noise_fraction


def run_sweep(n_photons: int = 400, steps: int = 11, seed: int | None = None, noise_fraction: float = 0.0) -> dict:
    """Error rate in the kept bits as Eve reads 0 % -> 100 % of photons."""
    seed = secrets.randbelow(2**31 - 1) if seed is None else int(seed)
    points = []
    for k in range(steps):
        f = k / (steps - 1)
        r = run_bb84(n_photons, eve_fraction=f, check_fraction=0.0, seed=seed + k, noise_fraction=noise_fraction)
        points.append(
            {
                "eve_percent": round(f * 100),
                "measured": r["actual_qber"],
                "theory": expected_qber(f, noise_fraction),
                "keep_rate": r["keep_rate"],
            }
        )
    return {"seed": seed, "n_photons": n_photons, "noise_fraction": noise_fraction, "qber_limit": QBER_LIMIT, "points": points}


def measure_once(alice_bit: int, alice_basis: int, bob_basis: int) -> int:
    """Send one photon and let Bob read it once (a fresh random outcome every call)."""
    result = _SIM.run(photon_circuit(alice_bit, alice_basis, bob_basis), shots=1, memory=True).result()
    return int(result.get_memory(0)[0][-1])


def circuit_text(alice_bit: int, alice_basis: int, bob_basis: int, eve_basis: int | None = None) -> str:
    return str(photon_circuit(alice_bit, alice_basis, bob_basis, eve_basis).draw(output="text"))
