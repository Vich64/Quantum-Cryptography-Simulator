"""FastAPI backend for the Quantum Cryptography Simulator.

Run locally:  uvicorn main:app --reload --port 8000   (from the backend folder)
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Literal

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

import bb84

MIN_PHOTONS, MAX_PHOTONS = 8, 256

app = FastAPI(title="Quantum Cryptography Simulator API", version="1.0.0")

# Comma-separated list, e.g. "https://my-app.vercel.app". Local dev uses the Vite proxy, so no CORS is needed.
_origins = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",") if o.strip()]
app.add_middleware(CORSMiddleware, allow_origins=_origins, allow_methods=["GET", "POST"], allow_headers=["*"])


class RunRequest(BaseModel):
    n_photons: int = Field(32, ge=MIN_PHOTONS, le=MAX_PHOTONS)
    eve_on: bool = False
    eve_percent: int = Field(100, ge=0, le=100, description="Share of photons Eve reads, when eve_on")
    check_percent: int = Field(25, ge=10, le=50, description="Share of kept bits revealed for the error check")
    noise_percent: float = Field(0, ge=0, le=25, description="Chance (%) that channel noise flips Bob's result")
    seed: int | None = Field(None, ge=0, lt=2**31 - 1)
    preset: Literal["slide12"] | None = None
    # Optional fixed choices (used by the game, where the player picks Bob's glasses).
    # When given, all lists must have the same length (8-256) and n_photons is ignored.
    alice_bits: list[Literal[0, 1]] | None = Field(None, min_length=MIN_PHOTONS, max_length=MAX_PHOTONS)
    alice_filters: list[Literal["+", "x"]] | None = Field(None, min_length=MIN_PHOTONS, max_length=MAX_PHOTONS)
    bob_filters: list[Literal["+", "x"]] | None = Field(None, min_length=MIN_PHOTONS, max_length=MAX_PHOTONS)


TO_BASIS = {"+": 0, "x": 1}


@app.get("/api/health")
def health():
    import qiskit
    import qiskit_aer

    return {"status": "ok", "qiskit": qiskit.__version__, "qiskit_aer": qiskit_aer.__version__}


@app.post("/api/run")
def run(req: RunRequest):
    eve_fraction = req.eve_percent / 100 if req.eve_on else 0.0
    kwargs = {}
    n = req.n_photons
    if req.preset == "slide12":
        kwargs = dict(bb84.SLIDE12_EXAMPLE)
        n = len(kwargs["alice_bits"])
    else:
        fixed = {
            "alice_bits": req.alice_bits,
            "alice_bases": [TO_BASIS[f] for f in req.alice_filters] if req.alice_filters else None,
            "bob_bases": [TO_BASIS[f] for f in req.bob_filters] if req.bob_filters else None,
        }
        fixed = {k: v for k, v in fixed.items() if v is not None}
        if fixed:
            lengths = {len(v) for v in fixed.values()}
            if len(lengths) != 1:
                raise HTTPException(status_code=422, detail="alice_bits, alice_filters and bob_filters must have the same length")
            n = lengths.pop()
            kwargs = fixed
    try:
        return bb84.run_bb84(
            n,
            eve_fraction=eve_fraction,
            check_fraction=req.check_percent / 100,
            noise_fraction=req.noise_percent / 100,
            seed=req.seed,
            **kwargs,
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@app.get("/api/sweep")
def sweep(
    n_photons: int = Query(400, ge=50, le=1000),
    seed: int | None = Query(None, ge=0, lt=2**31 - 100),
    noise_percent: float = Query(0, ge=0, le=25),
):
    return bb84.run_sweep(n_photons=n_photons, seed=seed, noise_fraction=noise_percent / 100)


@app.get("/api/measure")
def measure(
    bit: int = Query(..., ge=0, le=1),
    alice_filter: Literal["+", "x"] = Query(...),
    bob_filter: Literal["+", "x"] = Query(...),
):
    """One photon, one look: used by the game to show that wrong glasses give a coin flip."""
    return {"bob_bit": bb84.measure_once(bit, TO_BASIS[alice_filter], TO_BASIS[bob_filter])}


@app.get("/api/circuit")
def circuit(
    alice_bit: int = Query(..., ge=0, le=1),
    alice_filter: Literal["+", "x"] = Query(...),
    bob_filter: Literal["+", "x"] = Query(...),
    eve_filter: Literal["+", "x"] | None = Query(None),
):
    to_basis = {"+": 0, "x": 1}
    text = bb84.circuit_text(
        alice_bit, to_basis[alice_filter], to_basis[bob_filter], to_basis[eve_filter] if eve_filter else None
    )
    return {"circuit": text}


# Serve the built React site (frontend/dist) from the same server, if it has been built.
_dist = Path(__file__).resolve().parent.parent / "frontend" / "dist"
if _dist.is_dir():
    app.mount("/", StaticFiles(directory=_dist, html=True), name="site")
