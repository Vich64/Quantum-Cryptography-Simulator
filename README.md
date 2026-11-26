# Quantum Cryptography Simulator (BB84)

A game-style web app that teaches the BB84 quantum key distribution protocol to complete beginners. It is built from the Team 6 project proposal (Quantum Computing course, CADT).

Everything is explained the way you would explain it to a kid:
- a photon is a **light stick** that points one way;
- a filter (basis) is a pair of **magic glasses**: **+ glasses** or **× glasses**;
- a bit is a **number**, and the error rate counts **mistakes**.

The "grown-up words" are shown at the end of the Story and in the Lab.

| Tab | What you do |
|---|---|
| 📖 **Story** | A 7-page comic with Alice, Bob and Eve the spy, explaining the whole idea plus classical vs quantum (proposal feature 1: Learn). |
| 🎮 **Missions** | Four levels that earn up to 3 stars each. Each one unlocks after the one before it. |
| 🔬 **Photon Lab** | The full step-by-step simulator for 8–256 photons (feature 2), including the easy 8-photon example from slide 12. Tap a photon to follow it and see its Qiskit circuit. |
| 🕵️ **Spy Lab** | Turn Eve on and set how many photons she peeks at (0–100%), add channel noise, and see the mistakes against the 11% spy line (feature 3). It also shows: Alice & Bob's **estimate** of how much Eve read next to the truth, a **spy map** of exactly which photons Eve touched and which of them show up as mistakes, how many final key bits Eve knows, a **Clever Eve** preset that hides under 11%, a chart of the chance to spot Eve against the number of checked bits, and a 0→100% sweep against theory. |
| 🏆 **Boss Quiz** | 5 kid-friendly questions, worth up to 3 stars (extra feature). |

The four missions:
1. **Read the light sticks.** Read 6 sticks using a cheat sheet, then press "look" with the right and wrong glasses. Each look is a real Qiskit measurement: the right glasses always give 0, the wrong ones give a coin flip.
2. **Be Bob: make a key.** Pick Bob's glasses for 8 photons. Qiskit measures them, Alice reveals her glasses, you tap the matches, and you get the secret key.
3. **Spy hunt.** Three detective cases with 96 photons each. Eve may or may not be hiding. You compare the checked numbers and decide whether a spy was there (feature 3).
4. **Secret message.** Make a 128-photon key, type a word, watch it get locked with XOR, see that Eve only gets nonsense, then watch Bob unlock it (feature 4).

Stars are saved in the browser (localStorage), so progress survives a page reload on the same computer.

## How it is built

| Layer | Folder | Tech |
|---|---|---|
| Quantum logic | `backend/bb84.py` | Qiskit + Qiskit Aer (stabilizer simulator) |
| Backend API | `backend/main.py` | FastAPI |
| Website | `frontend/` | React + Vite, Tailwind CSS, Recharts |

Each photon is one one-qubit circuit. Alice uses `X` to write bit 1 and `H` to switch to the × filter. Eve, if she reads the photon, measures in a guessed filter and re-sends it in that filter. Bob uses `H` for the × filter, then `M` to measure. With channel noise `p`, each photon gets an extra `X` (a bit flip) just before Bob's measurement with probability `p`. Every photon of a run goes to `AerSimulator` in one batch, with 1 shot each.

### Answering "how much did Eve read, and where?" (teacher feedback, 19 Nov)

| Question | How the app answers it | Fields in the `/api/run` result |
|---|---|---|
| Is a run under 11% "safe"? | No: it means the error rate is low enough to **continue**, not that there was no spy. The Spy Lab shows how many final key bits Eve's copy matches, and explains privacy amplification as the real-world fix. | `status` (`accepted` = OK to continue), `eve_known_key_bits` (Eve's bit = Alice's, in the key), `eve_sure_key_bits` (right glasses), `eve_key_bits_read` |
| How much did Eve read (0%? 20%?) | Each photon Eve reads gives an error 1 time in 4, so Alice and Bob estimate `f ≈ 4 × QBER`, with a rough 95% range from the number of checked bits (Wilson interval × 4). Shown next to the true value. | `estimated_eve_fraction = min(1, 4 × estimated_qber)`, `estimated_eve_range` |
| Which positions did she touch? | The **spy map**: one cell per kept photon, coloured (a) touched and caught in a checked bit, (b) touched and wrong but hidden in the key, (c) touched but no error, (d) never touched (plus noise-only errors). It lists the caught positions, e.g. #2, #3, #5. | per photon: `eve_read`, `eve_changed`, `eve_caught`, `is_check`, `in_key`, `error`, `noise_flip` |
| Can a clever Eve stay under 11%? | Yes: reading about 40% gives ≈ 0.25 × 40% = 10% errors. The **Clever Eve** button sets the largest share that stays under the line (lower when there is noise). | |
| Does checking more bits help? | Yes ("repetition"): the chance that at least one of Eve's errors is checked is `P = 1 − (1 − 0.25·f)^n` for `n` checked bits, drawn as a chart. | |
| Isn't some error just noise? | The `noise_percent` slider flips Bob's result with probability `p`. Alice and Bob cannot tell noise from Eve, so every error counts as possible spying, and noise makes the Eve estimate too high. | `noise_fraction`, per photon `noise_flip` |

API endpoints:

- `POST /api/run` takes `{n_photons, eve_on, eve_percent, check_percent, noise_percent?, seed?, preset?}`. It can also take fixed `alice_bits`, `alice_filters` and `bob_filters` lists, which the game uses when the player picks Bob's glasses.
- `GET /api/measure` sends one photon and does one look. Mission 1 uses it for the right-vs-wrong glasses coin flip.
- `GET /api/sweep?n_photons=&noise_percent=&seed=` runs 11 runs with Eve at 0%, 10%, … 100%.
- `GET /api/circuit`
- `GET /api/health`

## Run it locally (Windows / PowerShell)

You need Python 3.10+ and Node.js 18+.

**1. Backend (first time only):**

```powershell
cd backend
python -m venv .venv
.venv\Scripts\python -m pip install -r requirements.txt
```

**2. Frontend (first time only):**

```powershell
cd frontend
npm install
npm run build
```

**3. Start it.** This one command serves both the API and the built website:

```powershell
cd backend
.venv\Scripts\python -m uvicorn main:app --port 8000
```

Then open http://localhost:8000.

**While editing the frontend**, use two terminals for hot reload. Run the backend as in step 3, plus:

```powershell
cd frontend
npm run dev
```

Then open http://localhost:5173. Vite forwards `/api` to port 8000.

## Check that it works

1. **Automated tests.** These check the proposal's success table, section 3:

   ```powershell
   cd backend
   .venv\Scripts\python -m pytest -q
   ```

   All 17 should pass. They cover:
   - the slide 12 example gives the key 0 0 1 0 1
   - about 50% of photons are kept
   - 0% errors without Eve
   - about 25% errors when Eve reads every photon
   - the key is rejected above 11%
   - partial Eve scales the error rate
   - the same seed gives the same result
   - the API works and rejects bad input
   - player-chosen glasses work
   - right glasses always read correctly, while wrong glasses give both 0 and 1
   - noise 0 gives 0 errors without Eve, and noise `p` gives about `p` errors
   - the Eve estimate `4 × QBER` is close to the true Eve share for large runs
   - `eve_caught` and the known-key-bit counts match the per-photon data
   - a clever Eve at 40% stays under 11% yet knows many key bits
   - the API accepts `noise_percent` on `/api/run` and `/api/sweep`
2. **In the browser:**
   - Footer: it should say "Simulator online (Qiskit …)".
   - Missions: play Mission 1 to 4 in order. Each one ends with a "Mission complete!" screen, and the ★ counter at the top goes up.
     - In Mission 1, the + glasses button always gives 0, while the × button gives a mix of 0s and 1s.
     - In Mission 2, tapping exactly the matching columns gives "Perfect!" and 3 stars.
   - Photon Lab: click **⭐ Easy 8-photon example**, then **Next step** ×2. Photons 1, 4, 5, 7, 8 have matching glasses and their numbers are `00101`.
   - Photon Lab: set 256 photons with Eve off and press **Send** and **Skip to the key**. You should see 0% mistakes, **Few mistakes: OK to go on**, and identical keys.
   - Spy Lab: let Eve listen at 100% with 256 photons. You should see roughly 20–30% mistakes and **Too many mistakes! Key thrown away**. **Try 0% → 100%** should draw the purple line following the grey theory line up to about 25%.
   - Spy Lab: press **Clever Eve (40%)** and send 256 photons. The run is usually accepted, yet the warning shows how many key bits Eve knows, the estimate sits near 40%, and the spy map shows only about 1 in 4 of her photons as mistakes.
   - Spy Lab: turn Eve off and set noise to 5%. You should see a few amber "noise" squares and an Eve estimate above 0%.
   - To reset stars, clear the site's data for localhost:8000 in your browser.

## Deploy (Vercel + Render, as in the proposal)

**Backend on Render:**
1. Create a new Web Service and set the root directory to `backend`.
2. Build command: `pip install -r requirements.txt`.
3. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`.
4. Set the env var `ALLOWED_ORIGINS=https://<your-app>.vercel.app`.

**Frontend on Vercel:**
1. Set the root directory to `frontend`. The framework preset is Vite.
2. Set the env var `VITE_API_URL=https://<your-backend>.onrender.com`.

Or deploy only the backend after running `npm run build`. FastAPI serves `frontend/dist` itself.

## Known limits

- Eve uses one attack (intercept-and-resend), as stated in the proposal. Noise is a simple bit flip on Bob's result. There is no photon loss, and the app explains but does not run error correction or privacy amplification.
- The Eve estimate `4 × QBER` assumes all errors come from Eve. With noise it over-estimates, and with few checked bits its range is wide.
- With few photons only a few bits are checked, so Eve can slip through by luck. With 128+ photons she is caught almost every time.
- A true one-time pad needs one key bit per message bit, so the message length is limited by the key. 256 photons give about 96 key bits, which is roughly 12 characters.
- In Mission 3 Eve can still, rarely, get lucky and make fewer than 1-in-10 mistakes. The game then tells the player she got lucky, and marks their answer by the evidence they saw.
- Stars are stored per browser only. There are no accounts and no shared leaderboard.
