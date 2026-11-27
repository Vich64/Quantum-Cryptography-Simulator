"""Checks the simulator against the success table in the proposal (section 3)."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import bb84  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from main import app  # noqa: E402

client = TestClient(app)


def test_slide12_example_gives_key_00101():
    r = bb84.run_bb84(8, seed=1, **bb84.SLIDE12_EXAMPLE)
    kept = [p["index"] for p in r["photons"] if p["same_filter"]]
    assert kept == [1, 4, 5, 7, 8]
    assert r["sifted_key"] == [0, 0, 1, 0, 1]
    # with no Eve, Bob's bits on kept photons equal Alice's
    assert all(p["bob_bit"] == p["alice_bit"] for p in r["photons"] if p["same_filter"])


def test_about_half_the_photons_are_kept():
    r = bb84.run_bb84(4000, seed=7)
    assert 0.46 <= r["keep_rate"] <= 0.54


def test_no_eve_means_zero_errors_and_same_key():
    for seed in range(20):
        r = bb84.run_bb84(256, seed=seed)
        assert r["kept_errors"] == 0
        assert r["status"] == "accepted"
        assert r["keys_match"]


def test_eve_on_every_photon_gives_about_25_percent_errors():
    r = bb84.run_bb84(4000, eve_fraction=1.0, seed=11)
    assert 0.21 <= r["actual_qber"] <= 0.29


def test_eve_is_rejected_above_11_percent():
    rejected = sum(bb84.run_bb84(256, eve_fraction=1.0, check_fraction=0.5, seed=s)["status"] == "rejected" for s in range(30))
    assert rejected >= 29  # with 256 photons and half the kept bits checked, Eve is caught essentially always


def test_partial_eve_scales_errors():
    r = bb84.run_bb84(4000, eve_fraction=0.4, seed=3)
    assert 0.06 <= r["actual_qber"] <= 0.14  # theory: 0.25 * 0.4 = 0.10


def test_same_seed_same_result():
    a = bb84.run_bb84(64, eve_fraction=0.5, seed=42)
    b = bb84.run_bb84(64, eve_fraction=0.5, seed=42)
    assert a == b


def test_api_run_and_validation():
    r = client.post("/api/run", json={"n_photons": 16, "eve_on": True, "eve_percent": 100, "seed": 5})
    assert r.status_code == 200
    assert len(r.json()["photons"]) == 16
    assert client.post("/api/run", json={"n_photons": 4}).status_code == 422
    r = client.post("/api/run", json={"preset": "slide12"})
    assert r.json()["sifted_key"] == [0, 0, 1, 0, 1]


def test_api_player_chosen_filters():
    body = {"alice_bits": [0, 1, 1, 0, 1, 0, 0, 1], "alice_filters": list("+x++xx+x"), "bob_filters": list("++x+x++x")}
    r = client.post("/api/run", json=body)
    assert r.status_code == 200
    assert r.json()["sifted_key"] == [0, 0, 1, 0, 1]
    bad = dict(body, bob_filters=list("++x+x++"))  # 7 entries
    assert client.post("/api/run", json=bad).status_code == 422


def test_api_measure_right_and_wrong_glasses():
    right = {client.get("/api/measure", params={"bit": 1, "alice_filter": "x", "bob_filter": "x"}).json()["bob_bit"] for _ in range(20)}
    assert right == {1}
    wrong = {client.get("/api/measure", params={"bit": 1, "alice_filter": "x", "bob_filter": "+"}).json()["bob_bit"] for _ in range(40)}
    assert wrong == {0, 1}  # coin flip: both outcomes appear (chance of failing ~1e-12)


def test_api_circuit():
    r = client.get("/api/circuit", params={"alice_bit": 1, "alice_filter": "x", "bob_filter": "+", "eve_filter": "x"})
    assert r.status_code == 200
    assert "H" in r.json()["circuit"]


# ---- Teacher feedback (19 Nov): noise, Eve estimate, spy map ----


def test_noise_zero_gives_no_errors_without_eve():
    for seed in range(10):
        r = bb84.run_bb84(256, noise_fraction=0.0, seed=seed)
        assert r["kept_errors"] == 0
        assert not any(p["noise_flip"] for p in r["photons"])


def test_noise_p_gives_about_p_errors():
    r = bb84.run_bb84(4000, noise_fraction=0.05, seed=21)
    assert 0.035 <= r["actual_qber"] <= 0.065
    # without Eve every mistake comes from noise
    assert all(p["noise_flip"] for p in r["photons"] if p["error"])
    assert r["estimated_eve_fraction"] > 0  # noise looks like Eve to Alice and Bob


def test_estimated_eve_fraction_tracks_truth():
    for f, seed in [(0.0, 4), (0.4, 5), (1.0, 6)]:
        r = bb84.run_bb84(4000, eve_fraction=f, check_fraction=0.5, seed=seed)
        assert abs(r["estimated_eve_fraction"] - f) <= 0.12
        lo, hi = r["estimated_eve_range"]
        assert lo <= r["estimated_eve_fraction"] <= hi


def test_eve_caught_flags_and_known_key_bits():
    r = bb84.run_bb84(2000, eve_fraction=0.4, seed=8)
    for p in r["photons"]:
        assert p["eve_caught"] == (p["eve_read"] and p["error"])
    touched = [p for p in r["photons"] if p["eve_read"] and p["same_filter"]]
    caught = [p for p in touched if p["eve_caught"]]
    assert 0.17 <= len(caught) / len(touched) <= 0.33  # about 1 in 4 touched photons shows a mistake
    known = sum(p["eve_read"] and p["in_key"] and p["eve_bit"] == p["alice_bit"] for p in r["photons"])
    assert r["eve_known_key_bits"] == known > 0
    assert r["eve_sure_key_bits"] <= r["eve_known_key_bits"] <= r["eve_key_bits_read"]


def test_clever_eve_stays_under_the_limit():
    # reading ~40% gives ~10% errors, just under the 11% line, yet Eve learns many key bits
    r = bb84.run_bb84(4000, eve_fraction=0.4, check_fraction=0.5, seed=9)
    assert r["status"] == "accepted"
    assert r["eve_known_key_bits"] > 0.25 * len(r["alice_key"])


def test_api_noise_and_sweep():
    r = client.post("/api/run", json={"n_photons": 64, "noise_percent": 10, "seed": 3})
    assert r.status_code == 200
    assert r.json()["noise_fraction"] == 0.1
    assert client.post("/api/run", json={"n_photons": 64, "noise_percent": 60}).status_code == 422
    s = client.get("/api/sweep", params={"n_photons": 100, "noise_percent": 5, "seed": 1}).json()
    assert abs(s["points"][0]["theory"] - 0.05) < 1e-9
