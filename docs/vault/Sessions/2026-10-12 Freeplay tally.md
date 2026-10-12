---
livedocs: snapshot
---

# 2026-10-12 Freeplay tally (Feel Engineer — Lane B: THE TALLY ships)

Snapshot session note (never checked). Branch `fp-tally`, worktree `gw-f1` (outside the repo root),
base main `4e14d64`, `npm install`, `npm run build` + preview on **port 4920**, ports 4920+ only;
main untouched; every artifact checkpointed by commit+push on `fp-tally` (never `--no-verify`).
Executes Lane B of [[Reference/Action Plan 2026-10-12]] per [[Concepts/Freeplay Exploration]]
candidate B and [[Reference/Freeplay Feasibility]] §3 — the detector math is the spike's
(`tools/spike-freehouse.mjs` T4: air/room/fall probes over the trace) promoted to product.

## What shipped (commits `freeplay: …`)

1. **`src/tally/detectors.ts` + `src/tally/tape.ts`** — five badges as PURE functions of the trace
   (`tallyFromTrace`): air > `AIR_MIN_S` 0.25 s; clean catch (flight + `RUNOUT_MIN_M` 0.15 m of
   held ground); room crossing (declared `RoomRect` parcels — none shipped, so nothing fires
   until the house frame exists); chain fall (an AIRBORNE sustained descent, below); booster/
   spring spend (a one-step gain past `SPEND_MIN_GAIN_MPS` = 3·g·FIXED_DT). The page tape
   (`TallyTape`) samples `state()` once per step beside the juice feed — read-only into the sim,
   the firewall pattern's third instance; the sheet derives at the terminal edge, OUTSIDE the loop.
2. **The tail on EVERY result bar** — `tallyLines` (pure, `src/ui/result.ts`) fills
   `#gw-result-tally` with ≤3 stock lines: `earned — air ×2 · clean catch` / `first chain fall —
   earned` / the named line's record with the daily's `your own runs on this device only` verbatim
   (`RECORDS_HONESTY`). Campaign included, stars untouched — the sheet fills during the tutorial.
3. **Personal records** — `src/save/records.ts` rides `settings.records` (deliberately UNDER
   `settings`: the merge law carries settings by reference and would drop an unknown top-level
   key; `SAVE_VERSION` stays 2). Firsts read BEFORE the badge write; named lines key on the
   player cup's mm-quantised seat — the same anchor `World` reifies as the capture volume.
4. **The sweep + the CI line** — `tools/tally-sweep.mjs` (k02-order-table idiom): 30 par builds +
   6 sandbox references + a placeable BOOSTER-FARM through the shipped `replayRun({record:true})`
   and the shipped detectors. Measured max **4** badges/run (kitchen05's par: air+catch+fall+
   spend), farm **3**, cap `BADGE_CAP_PER_RUN` = **6**; `npm run tally:sweep` gates in CI after
   `replay:all`. Sweep-time correction, published: the first pass read the spike's dy-drop rule
   in world units and granted 2–3 chain falls per campaign run off ROLLING deck descents — the
   sheet lying by generosity; the shipped reading is airborne-only (the 37-rig table re-measured
   with it is the commit's evidence).
5. **The sandbox application** — a placed cup + a finish mints the NAMED record (the
   `name this line` chip, one chip/one input/one save); the next launch on that cup seat races
   your-best via `cachedGhostTrace` (the par machinery on the stored build — no new truth;
   `GhostMode` `'record'`, bar re-worded `ghost: your line`; the cup moved off the seat lifts
   the record and the par line returns); and the share page's run-cam (`ReplayDirector`, seek
   law intact, states at `floor(t/dt)`) mounts on the sandbox result under the panel, reduced-
   motion keeping the static end-hold.

## The gates, in order

- **Red-first, as the feasibility note's measurement ordered**: `tests/unit/tally.test.ts` was
  run RED (module absent — load error, then the hash claim itself stands on the atlas receipt)
  BEFORE `src/tally` existed, GREEN after: kitchen01's par hashes `d32417dc` — the shipped atlas
  receipt — with the tally tape mounted INLINE on the step loop and without; event streams equal
  across repeats; the page tape step-equal to `replayRun({ record: true })`. THE TALLY is a
  probe, not a participant.
- `npm run replay:all` 30 rungs all verified (byte-same); `replay:all` unchanged throughout —
  NO movement to report; the whole campaign/sandbox suite runs with the tally mounted everywhere.
- Units 930/930 (48 files, +13); e2e `tests/e2e/tally.spec.ts` 2/2 — the fresh campaign run's
  tail, and the acceptance session: five straights + a placed cup + a finish MINTS
  “the spillway” whose GHOST (`__gwGhostState().mode === 'record'`) races the next attempt with
  the film mounted on the sandbox result. Full e2e: see the PR run.
- CI unblocked en route: main was RED at `4e14d64` on `npm run typecheck` — the freehouse spike
  scene called the optional `rung.parBuild()` (`src/dev/scenes/freehouse.ts`, TS2722, shipped in
  the feasibility merge). Fixed in a separate commit (`freeplay: …`-adjacent, harness-only, no
  behaviour); the PR would otherwise have been red before it started. Flagged here for the
  Systems Engineer: the merge that claimed "no shipped file touched" moved the typecheck gate.

## Law check

Input law: the tally derives from the tape, owns no bodies, never steps — and the tape is exactly
what `replayRun({record:true})` records, so freedom recorded as data remains its own receipt.
Audio/juice firewall: the tally tail speaks at the terminal edge with the same fields the panel
already prints; `sound.finishRun` untouched. Device honesty: every record number carries the
daily's sentence verbatim. `livedocs`: `Modules/tally` new (the law's home), `Modules/ui`,
`Modules/save`, `Modules/replay` reconciled, Decision Log 2026-10-12 (THE TALLY law).
