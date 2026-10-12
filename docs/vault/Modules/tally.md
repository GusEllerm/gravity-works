---
livedocs: module
tags: [module, tally, freeplay]
---
# Modules/tally

> [!abstract] Role
> THE TALLY (freeplay program Lane B, [[Concepts/Freeplay Exploration]] candidate B,
> [[Reference/Freeplay Feasibility]] §3): badge detectors as pure functions of the recorded
> trace, the run-local tape that feeds them, the save's personal records, and the CI sweep that
> keeps the thresholds honest. Owner: Feel Engineer. THE TALLY LAW (Decision Log 2026-10-12):
> **badges are approvals physics granted; the thresholds are swept in CI.** Nothing is scored
> that the sim did not decide, and nothing here may reach the sim.

## What it does

`src/tally/detectors.ts` — the five badges, each a PURE function of a `TallySample` list
(structurally the `TraceSample` of `src/replay/replay.ts`, so the page tape and the Node trace
yield identical event streams — asserted step-for-step in `tests/unit/tally.test.ts`).
`tallyFromTrace(trace, { rooms?, thresholds? })` walks the tape once (the
`thresholds` door is sweep-only — the page never passes it, an absent key reads the
shipped constant) and grants: **air** (an airborne segment
outlasting `AIR_MIN_S` = 0.25 s, granted at the touchdown the flight ends on — the spike's rule
from `tools/spike-freehouse.mjs` T4), **clean catch** (a flight of `CATCH_MIN_AIR_S` whose
touchdown is followed by `RUNOUT_MIN_M` of held ground — the run-out is measured off the tape,
so the badge is the landing the physics carried, not a deck the builder labelled), **chain fall**
(an AIRBORNE descent of `FALL_MIN_S` and `FALL_MIN_DROP_M` — the airborne reading is deliberate:
the first sweep measured wheels-on-deck descents granting 2–3 badges per campaign run, which is
the sheet lying by generosity, so a rolling downhill is gravity's daily job and grants nothing),
**room crossing** (the parcel `roomAt` returns changes between declared `RoomRect`s — a level
that has not declared rooms has nothing to cross, which is the honest campaign/sandbox answer
until the house-frame table of Lane A exists), and **booster spend** (a one-step speed gain above
`SPEND_MIN_GAIN_MPS` = 3·g·`FIXED_DT`, computed from what gravity can add per step, the
`JUMP_MIN_TAKEOFF_VY` idiom — a launcher impulse the tape cannot not show). `tallyCounts` folds
events into the sheet shape. The detectors read poses and speeds; they own no bodies, step
nothing, and are read-only into the trace — the firewall pattern's third instance after
`src/juice/layer.ts` and the car rig.

`src/tally/tape.ts` — `TallyTape`: the run-local buffer `src/boot.ts` fills with one sample per
physics step (`reset()` at launch beside the witnesses' reset, `sample(state())` inside the step
loop where the juice feed already reads the pair). Its only write is into its own array; the
hash-neutrality proof is below. The terminal edge in `src/boot.ts` derives the run's events OUTSIDE
the step loop and hands them to `tallyLines` in `src/ui/result.ts` — the result bar's **tally
tail**, three lines max in the stock voice: what this run earned (`earned — air ×2 · clean catch`),
what the device had never seen (`first chain fall — earned` — the retroactive-forward hook, read
BEFORE the save write), and the named line's record (`on “the spillway” — personal best 2.11 s ·
your own runs on this device only`). It renders in `#gw-result-tally`; an empty tail stays
hidden — the panel never prints a badge the run did not earn.

`src/save/records.ts` — the save's PERSONAL RECORDS: `settings.records` riding the v2 envelope by
the `settings.sound`/`settings.ghosts` technique (deliberately UNDER `settings`, not top-level:
`normalizeEnvelope` rebuilds the envelope key by key and would silently drop an unknown
top-level key on a later merge, but carries `settings` through by reference — `SAVE_VERSION`
stays 2, no migrade). `accumulateBadges` adds this run's counts and returns the kinds the save
had NEVER seen (the tail's line 2); `recordNamedLine` mints or beats a `NamedLine`
(name, best finished time, the build that ran it, canonical `serialize` bytes) keyed by
`lineAnchorKey` — the sandbox line's identity is WHERE the player's cup sits (quantised to mm),
because the cup the physics captured IN is the line's anchor (the same `fixtureQuota` occurrence
rule the builder uses separates the fixture's cup from the player's; `World` reifies the LAST
`finishCup` as the capture volume, so a placed cup genuinely re-anchors the verdict —
[[Reference/Freeplay Feasibility]] §5/T5). `RECORDS_HONESTY` is the daily's device-honesty
sentence (`dailyChipLine`) reused VERBATIM — a caveat that drifts per surface is a caveat being
hidden, and there is no server to hide behind.

The sandbox application lives in `src/boot.ts`: at the terminal edge a finished sandbox run
whose build holds a player-placed cup reads/records the line (`readNamedLine`,
`recordNamedLine`); a NAMED line with no name yet gets the **`name this line` chip**
(`#gw-result-name`/`#gw-result-name-chip` — one chip, one input, one save); the NEXT launch on
that cup seat races **your-best** — `ensureRecordGhost` winds the stored build through
`cachedGhostTrace` (the par ghost's `TapeRecorder` machinery, `Modules/replay`) and mounts it as
`GhostMode` `'record'`, the bar re-worded `ghost: your line`; a par wind never evicts a line, and
moving the cup off the seat lifts the record and returns the par line. A finished sandbox run
also mounts the share page's **run-cam**: `makeRunCam` assembles a `RunTrace` from the tapes
(the car list + the per-step `RunCamera` poses `src/boot.ts` records on sandbox pages), and
`ReplayDirector` plays it under the result panel — the seek law intact (states at
`floor(t/dt)`, no physics stepped), reduced motion keeps the static end-hold (the motion law).
The debug seam `__gwTally` reports events, badge counts, the line key, and whether the film is
mounted.

`tools/tally-sweep.mjs` — THE SWEEP, k02-order-table idiom, at TWO SCALES since the
sheet-fix fixtures of 2026-10-12 (the sheet re-probe's verdict: the tally was PAINT —
the thresholds were swept only where campaign air lives, and sandbox-scale air is
invisible to the sheet). 325 rigs: every campaign par build, the six sandbox reference
builds, **288 sandbox-scale fixture builds** (`tools/tally-fixtures.ts` — the six
probe-named lines inside a deterministic 48-cell grammar grid per sandbox: launch verb
× release height × deck scale × cup ownership; the grid replaces the sandbox-reference
cell with the named line), and a placeable BOOSTER-FARM rig (every other deck a
booster) — all played through the shipped `replayRun({ record: true })` and scored by
the shipped detectors. Report 1 is the per-rig table at the shipped thresholds;
report 2 re-scores every trace against the five-threshold candidate grid PER SCALE
(air+catch mint rate on jump-and-land runs — finished, a flight ≥ 0.08 s, ≥ 0.15 m of
carried ground after touchdown — the per-run max, and the degenerate count over
`BADGE_CAP_PER_RUN` = **6**). At the campaign-scale thresholds the extended sweep
measures degenerates **0/325** and jump-and-land mints **1/142** — the PAINT verdict,
quantified; `--gate` fails on a rig over cap, on the farm's 3-spend law moving, or on
any jump-and-land rig minting no air+catch (the sheet-fix law: what the eyes see, the
sheet must grant). **The published sweep at the retuned shipped thresholds
(`AIR_MIN_S` 0.25 → 0.05, `CATCH_MIN_AIR_S` 0.15 → 0.09, the other three unchanged —
Decision Log 2026-10-12 "the sheet-fix retune"): degenerates 0/325 (cap 6; 0/325 was
also the baseline at the campaign-scale thresholds), farm 3 badges — 3 spend, the
3/run law intact — and jump-and-land mints 142/142, up from 1/142: the PAINT verdict,
fixed by measurement.** The one-variable candidate grid (minted jump-and-land rigs /
total per scale; degenerates 0 and farm 3 in every row — no candidate farms the sheet):

| knob | values swept | campaign mint (26 rigs) | sandbox mint (116 rigs) |
|---|---|---|---|
| `AIR_MIN_S` | 0.25 | 1/26 | 0/116 |
| `AIR_MIN_S` | 0.15 | 3/26 | 0/116 |
| `AIR_MIN_S` | 0.10 / 0.05 / 0.02 | 26/26 | 116/116 |
| `CATCH_MIN_AIR_S` | 0.15 | 3/26 | 0/116 |
| `CATCH_MIN_AIR_S` | 0.12 | 7/26 | 0/116 |
| `CATCH_MIN_AIR_S` | 0.10 / 0.09 / 0.08 | 26/26 | 116/116 |
| `RUNOUT_MIN_M` | 0.15 / 0.10 | 26/26 | 116/116 |
| `RUNOUT_MIN_M` | 0.20 | 26/26 | 110/116 |
| `RUNOUT_MIN_M` | 0.30 | 18/26 | 82/116 |
| `FALL_MIN_S` | 0.15 (shipped) | 26/26 | 116/116 |
| `FALL_MIN_S` | 0.12 | 26/26 | 116/116 (campaign max/run rises 4→6, badges 67→75 — generosity inflation kept out) |
| `FALL_MIN_S` | 0.10 | 26/26 | 116/116 (badges 95 campaign / 632 sandbox, sandbox max/run 4) |
| `FALL_MIN_DROP_M` | 0.06 / 0.08 / 0.10 | 26/26 | 116/116 |

The air/catch rows at the OLD bars are the re-probe's deafness, row and all: sandbox
mint 0/116. The chosen pair sits in the measured void between the seam population
(≤ 0.0125 s, 289 segments) and the flight population (≥ 0.1 s, 144 segments) — the
flight histogram has NOTHING between. thresholds changed ⇒ re-sweep and restate the numbers here.

## Proofs

`tests/unit/tally.test.ts` — the per-badge truth tables (each fires on its approval, silent on
its near-miss); the **hash-neutrality gate** (kitchen01's par hashes to its atlas receipt
`d32417dc` with the tape mounted INLINE in the same stepper and without, event streams equal
across repeats, the page tape equal to `replayRun({ record: true })`'s trace — the feasibility
note's §3 measurement promoted to a permanent gate; it went RED before `src/tally` existed);
`tallyLines` three-line law; the records rules (a first reported exactly once, a line beaten only
on a faster finish, garbage under `settings.records` reads absent, `SAVE_VERSION` pin).
`tests/e2e/tally.spec.ts` — a fresh campaign run's result bar carries its tail, and the sandbox
session: five straights + a placed cup + a finish MINTS a named record whose GHOST races the
next attempt (`__gwGhostState().mode === 'record'`), with the film mounted on the sandbox result.
`replay:all` (30/30) and the determinism atlas run with the tally mounted everywhere — the
whole-suite byte-same claim is the receipt, not a promise.

## Depends on / used by

Reads `src/replay/replay.ts` types, `src/physics/sim.ts` constants, `src/save/save.ts` merges,
`src/track/build.ts` (quota, serialize) and `src/feel/kittrack.ts` cup geometry via boot;
presents through `src/ui/result.ts`. Used by `src/boot.ts` (terminal edge, launch, frame loop)
and `tools/tally-sweep.mjs`. It is used BY nothing that steps: the sim never imports this module.
