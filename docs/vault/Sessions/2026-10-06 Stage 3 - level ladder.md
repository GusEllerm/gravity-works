---
livedocs: snapshot
tags: [session]
---
# 2026-10-06 Stage 3 - level ladder

## Goal

Design the kitchen five (`kitchen01`–`kitchen05`) + the kitchen sandbox as
pure level data with per-kind budgets and reference builds, prove every par
build finishes headless, and fill the Level Ladder.

## What was done

- `src/world/levels/kitchen01.level.ts` … `kitchen05.level.ts`: five levels
  + `kitchen-sandbox`, self-registering on the shared registry.
  `kitchen01` also carries the shared authoring kit (`lay` for per-instance
  params, `startSocketFromBuild`, the `KitchenLevel`/`WetPatch` shapes);
  `kitchen05` also carries the sandbox and the two measured wrong-answer
  builds of the trade-off.
- `tests/unit/kitchen-levels.test.ts`: every parBuild replayed through
  `replayRun` must be `finished` (all six, green first try after tuning),
  plus contracts (budget = tray, release on a slope), L02's two lines and
  L04's ground line finishing, and L05's two wrong allocations NOT finishing.
- Docs: [[Concepts/Levels]] (design cards, socket + hazard conventions,
  asks #1–#3), [[Reference/Level Ladder]] rewritten with the table.

## Measured (the honest physics map this design sailed by)

Probed with the shipped rig (raycast car, `ROLL_COEF` 0.12, headless `World`
via `src/replay`), ~90 builds:

- Drivable: `ramp`, `straight`, `gapLip`→`drop`→`landing` gap combos, `drop`
  alone as a gap at ≥ ~1 m/s, `booster` (Δv along travel, power param),
  `finishCup` capture; loop/pitch geometry known-good from stage 2.
- NOT drivable mid-run, both car variants, radii 0.6–2.5 m, ~0.9–2.4 m/s,
  bank 0–25°: `curve`, `bigCurve`, `sbend`, `bank` — plough off the outer
  wall, or hit the straight→yaw seam and lose essentially all forward energy
  in one step (the car crawls away at 0.03 m/s and times out). Matches
  `Modules/feel.md`'s "banked yaw arcs are the open boundary"; the
  wheel-collider variant behaved identically at the `World` level.
- The L01 "exactly one tray order finishes" spec is unreachable at any swept
  parameter (all six orders finish, or none do): gap pieces are
  speed-tolerant. L01 ships the weaker TRUE claim ("finish by placing all
  three" — proved) and the ask is recorded (Levels ask #3).
- Par times: L01 2.21, L02 2.27 (alt line 2.40), L03 2.50, L04 2.45 (ground
  alt 2.35), L05 2.39 (no-booster `fell`, late-booster `fell`,
  between-gaps booster 2.50).

## Decisions

- Tray/fixture split and `KitchenLevel` live in the level files (contract
  `Level` not extended — not my file); `budget` = tray total,
  `placeholderBuild()` = par build, so share/replay see no new seam.
- L02/L03 deliver their yaw halves as fixture geometry past the cup (the
  feel track's precedent) and the rungs are marked BLOCKED, not the levels.
- L04's par line flies the wet patch so the par is grip-independent while
  the zone hook is pending; the hazard ships as data (`wetPatch`).
- Recorded in the Decision Log: the tray/fixture model, and the
  blocked-rung-but-not-blocked-level call.

## Next

- Feel Engineer on ask #1 (yaw steering) — one data edit re-lights L02/L03.
- Systems Engineer: `npm run pars` (this table's times are hand-measured),
  `Level.finishSocket`, the grip-zone hook, and the one-line
  `src/boot.ts` import to register the kitchen rungs in the game.
- Playtest: can three fresh players finish L01–L03 unaided (stage-3 accept)?
