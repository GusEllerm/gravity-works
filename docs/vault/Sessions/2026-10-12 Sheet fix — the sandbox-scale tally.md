---
livedocs: snapshot
---
# 2026-10-12 Sheet fix — the sandbox-scale tally (Feel Engineer: the PAINT verdict, measured out)

Snapshot session note (never checked). Branch `fp-sheetfix`, worktree `gw-f5` (outside the repo root), base main
`4978ec7`, `npm install`, live probes on **port 4960** only; main untouched; every artifact checkpointed by
commit+push on `fp-sheetfix` (never `--no-verify`). Executes the sharp edge (a) of
[[Sessions/2026-10-12 Sheet re-probe]] §Verdict — "re-sweep detector thresholds against the SIX sandbox
reference builds, not only campaign pars" — and answers its §Freeplay-with-no-rung ENG flags. No sim code moved:
`replay:all` 30/30 byte-same at every commit, the atlas receipts unchanged.

## What shipped (commits `freeplay: …`)

1. **`da9222f` RED-FIRST** — `tools/tally-fixtures.ts`: the six sheet-re-probe NAMED LINES reconstructed from
   the journal's grammars (the journal carried no payloads/build bytes, so each fixture states its
   reconstruction: lamp-run 2.658 s ∼ journal 2.80, sink-hop 2.550 ∼ 2.58, **slick-skip 3.033 ∼ 3.13 — the
   film-kept jump-fly-land run**, to-the-door 0.667 = 0.67, the garden tour dies 2.517 ∼ 2.55, the first
   probe's kitchen booster→loop→straight FINISHES 2.533 — the line exists, see the flag below), inside a
   deterministic 48-cell grammar grid per sandbox (launch verb × release height 0.24/0.28/0.32 × deck scale
   × cup ownership; the grid skips the sandbox-reference cell, 6 × 48 = 288 fixture rigs). `tally-sweep`
   now plays **325 rigs** (30 campaign pars + 6 sandbox references + 288 fixtures + BOOSTER-FARM) once, and
   re-scores every trace against the five-threshold candidate grid per scale — a pure re-scoring door
   (`thresholds` on `tallyFromTrace`, default = shipped constant, the page never passes it). At the shipped
   campaign-scale bars the extended sweep printed exactly the re-probe's verdict: **degenerates 0/325,
   jump-and-land mints 1/142** (sandbox 0/116), and the film-kept unit fixture went RED as required.
2. **`4a100e5` THE RETUNE** — `AIR_MIN_S` 0.25 → **0.05**, `CATCH_MIN_AIR_S` 0.15 → **0.09**;
   `RUNOUT_MIN_M` 0.15, `FALL_MIN_S` 0.15, `FALL_MIN_DROP_M` 0.06 and the noise-floor spend bar unchanged.
   Chosen from the flight histogram, not vibes: across every rig trace the airborne segments are bimodal —
   **deck seams 289 segments, none above 0.0125 s; real gap flights 144 segments, all ≥ 0.1 s (0.108–0.117);
   the void between holds nothing**. The pair sits mid-void (4× above the worst seam, 2× under the shortest
   flight); mint on jump-and-land rigs **142/142** (was 1/142), per-run max 4, **degenerates 0/325** (the
   baseline was 0/325 too — the cap law never depended on the deaf bars), BOOSTER-FARM still exactly 3
   badges / 3 spend (the 3/run law survives; `SPEND_MIN_GAIN_MPS` untouched — spend never fired anywhere in
   the re-probe because campaign geometry farms it, not play, and that law is arithmetic). The gate now also
   fails any jump-and-land rig minting no air+catch (the sheet-fix law). Published table: [[Modules/tally]].
   Suite: 932 unit tests green; `replay:all` 30/30 byte-same; e2e tally/ghosts/determinism green.

## THE ENG FLAG — answered: not the tally, not the ghost; a real launch-path law, escalated

The re-probe's two physics-flag claims (kitchen's unreproducible 2.84 s finish; the bedroom 2.80/2.83/2.83/2.80
split "correlated with record-ghost state") were reproduced on both sides, headless and on the built page
(port 4960):

- **The tally/tape mounts nothing that steps.** The kitchen-sandbox 5-straight+cup build hashes `b9479e90`
  with the tape sampling `state()` INLINE every step; a second World winding the record build INTERLEAVED at
  browser pacing (2 live steps : 32 wind steps per macrotask) hashes the same; `__gwGhostState` OFF/par/record
  all hash the same. Hash-neutrality stands, and the re-probe's correlation with `ghost: your line` was a red
  herring — the launch NUMBER, not the mode, is the variable.
- **What is real:** the SAME serialized build replays **337 steps (2.8083 s) from a fresh `World.create`, but
  339 steps (2.8250 s, `121319e0`) after any `World.launch()`→`reset()`** — the Retry path. Reproduced headless
  on current main AND byte-identically on pre-tally main `ec95e72`: the car removed-and-re-added at reset
  enters the collider order differently, the suspension settles ~0.1 mm apart at step 0 (the traces differ at
  step 1: `grounded 0/1`), the run lands 2 steps late at the cup. It is the collider-order law the FIRST
  probe already met ("Piece-order rebuilds moved my kitchen time 2.84 → 2.72"), caught in the launch path.
  Measured consequences: `Why the same build always runs the same way` is true of replays and FALSE of the
  second live launch of a session; a your-best ghost beats the live car it records by ~0.02 s (the bedroom
  split's whole story: fresh launches minted 2.80, retries 2.83); and the share link after a FRESH launch
  prints `verified · matches the link` while the SAME build's link after one RETRY FAILS its own replay
  (both observed live, port 4960).
- **What is a probe-method difference, stated as such:** the kitchen 2.84 s finish is NOT lost geometry — the
  reconstructed line finishes 2.533 s headless today, and every order variant of it finishes (2.34–2.53);
  the re-probe's deaths were its x=2.55 own-cup overshoot trap plus the retry law above, not a regression.
  The garden "byte-identical 2.55 s" sighting is the death-point law, reproduced by fixture (dies 2.517,
  zero badges).
- **Escalation (the most important sentence):** `World.reset()` is not launch-deterministic. Until a launch
  re-seats the car in creation order (or rebuilds the sim), a RETRY is a different run wearing the same
  build bytes — share-hash mismatch included. Fixing it is the World/physics owner's call; this branch
  changes no sim code and ships nothing on top of the finding. Decision Log 2026-10-12 "the retry-law
  finding" carries the receipts.

## Numbers to restate on any future threshold change

325 rigs · cap 6 · degenerates 0/325 · farm 3 (3 spend) · jump-and-land mints 142/142 · flight histogram:
seams ≤ 0.0125 s / flights ≥ 0.1 s / void between. `node tools/tally-sweep.mjs --gate` prints it all.
