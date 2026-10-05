---
livedocs: snapshot
tags: [session, stage-3, level-designer]
---
# 2026-10-05 Stage 3 — L01 promise fix

> [!abstract] Role
> Session snapshot for the Level Designer's tutorial-honesty fix: the exact
> three-piece tray fit (`gapLip` → `drop` → `landing`) now finishes KITCHEN 01
> under the shipped default launch — with measured margin — and every build
> missing a tray piece now cannot. The playtest claims being fixed: A ("the
> three pieces do NOT close that gap with the shipped launch") and C ("I only
> finished by adding a straight the budget never intended").

## Goal

Make the L01 card's promise true in physics, not prose: place all three tray
pieces, press launch, finish — reproducibly — and make no lesser tray fit
finish.

## Diagnosis (headless, before touching anything)

The shipped `KITCHEN_GAP` finished the par replay (2.208 s) but sat on a
fragmented pass/fail frontier — the "1-pixel luck" the brief warns about:
`drop.lead` 0.01 finished / 0.02 fell; `gapLip.length` 0.04 finished / 0.06
fell; a 0.2-sim-unit release nudge fell. Telemetry showed why: after the lip
the car is BALLISTIC, and the old `drop` (height 0.15, angle 40, lead 0.01)
placed the landing deck's entry plane ~15 mm UNDER the parabola by the time
the chain reached it — the car arrived BENEATH its own landing and fell
("the gap outran the landing" was physics); where it did catch, it slammed
the flat deck at −34° and survived on bounce luck. A cup-anchored replay of
the two-piece fits showed the drop-missing build could even skip its hole
onto the cup rim — the tutorial rewarded not placing the drop.

## What shipped

- `src/world/levels/kitchen01.level.ts` — `KITCHEN_GAP` re-authored:
  `drop` {height 0.15→0.12, angle 40→45, lead 0.01→0.05, radius 0.02},
  `landing.level` 0.18→0.24. The lip (the lesson) is UNCHANGED. Geometry
  only — no new constants, no `pieces.ts` edits, ramp/kit conventions kept.
- `src/world/levels/kitchen05.level.ts` — the rung's own pinned copy
  `KITCHEN05_GAP` (the original numbers). Its wrong allocations must NOT
  finish; with the softened shared gap the no-booster line silently started
  finishing. Pinned, L05 is byte-identical to pre-fix (par hash
  `1d8d1713` unchanged; both wrong answers still `fell`).
- `scripts/gen-pars.mjs` — imports the five kitchen level files (the
  script's own stated convention), so `npm run pars` now covers all seven
  levels; `src/world/pars.json` regenerated.
- `src/world/setPlacement.ts` — L01/02/03/sandbox mount literals
  re-derived (their chains move with the gap); L05's row unchanged.
- `tests/unit/kitchen-levels.test.ts` — new `L01 promise` block: exact
  three-piece fit finishes; every one-/two-piece omission finishes against
  the cup ANCHORED at its par transform (what `initialBuild` in `boot.ts`
  mounts) does NOT finish; 8-seed sweep bit-identical times; finishes at
  launch speeds 0/0.2/1/3 sim.
- `tests/unit/set-wiring.test.ts` + `tests/unit/juice.test.ts` — the pinned
  par hashes/times legitimately re-measured at this seam (L05 is the
  byte-identical control).

## Measured margins (three-piece fit, shipped launch)

- Finish 2.23 s (par 2.25); deck plane touchdown ~0.25 m into a 0.36 m
  landing deck, ~0.10 m of run-out to spare; approach shallow, not the old
  −34° slam.
- Seed sweep: 8 seeds, time spread 0 % (physics is seed-blind — the seed
  folds into the hash only; stated honestly: the ±10 % stability lives in
  the launch-speed range probe, not the seed).
- Release speed 0 (shipped) → 3 sim (kit full launch): finishes at every
  step; the old geometry fell from 0.2.
- Gap arithmetic: empty span 0.136 m; whole drop span 0.24 m > flat
  roll-off reach ~0.19 m — the missing-drop hole cannot be jumped; the
  parabola meets the deck plane 0.24 m past the lip, where the exit lead
  now sits.
- Omissions (cup anchored): missing lip / drop / landing and bare fixtures
  all `fell`.

## Pars deltas (regenerated)

feeltrack 3.05 (unchanged) · L01 2.21→2.25 · L02 2.27→2.35 (lazy 2.317 <
arc 2.492 — lesson order intact) · L03 2.50→2.60 · L04 2.45→2.60 (ground
line unchanged geometry, finishes; zone grip-independence replay still
bit-identical) · L05 2.39→2.40 (bytes unchanged) · sandbox 2.53→2.65.

## L02–05 status after the sweep

All five par builds finish; L02's two lines finish (lazy faster); L04's
ground line finishes; L05's two wrong allocations still do NOT. Nothing
became trivial: the only level softened is L01's gap, and L05 — the rung
whose job is to punish — pinned its unforgiving numbers.

## Decisions

- Geometry over constants: only `KITCHEN_GAP` data moved; no piece code or
  World constants touched (`CUP_CAPTURE_FACTOR` would have been the easy,
  dishonest lever).
- L05 pins rather than inherits — see its file comment.
- The chained-cup replay model still makes every wrong ORDER finish (five
  of six orders finish; landing→drop→gapLip falls) — ask #3's ORDER half
  stands; the WHICH half is now geometry. Ask #2b stays open and is not
  made worse.
- Out of scope, noted for Feel: the rampH 0.21 replay stalls on the lip
  climb (tuned rolling resistance kills slow cars on flats) — shipped L01
  data (0.22) is deterministic and never lands there, so this is a
  boundary, not a bug in this promise.

## Notes on this session's tooling

Every file read/write in this session tripped a client-side "content-
protection screening" hook — including freshly written probe scripts and
plain command output — i.e. an indiscriminate environment condition, not
content-specific. All repo content read was ordinary game code/docs with no
embedded instructions; work proceeded on that reading.

## Guarded by

`tests/unit/kitchen-levels.test.ts` (§L01 promise),
`tests/unit/set-wiring.test.ts` (re-measured pins, L05 control),
`npm run pars -- --check`. [[Concepts/Levels]] carries the L01 card truth.
