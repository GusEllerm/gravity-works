---
tags: [module]
---
# src/feel (track builders and scenario runners)

> [!abstract] Role
> The headless feel track: procedural track colliders and the physics-only scenario runners that measure cars against the Feel bible's targets. Provisional stage-1 track — the real feel track lands at stage 2.

## What it does

`src/feel/feeltrack.ts` builds tracks as chord-slab box colliders: `buildTrack(segs)` sweeps a U-channel along a frame-integrated centreline and emits, per pose pair, one floor slab plus two wall slabs (the brief's sanctioned "compound convex colliders" — trimesh edges in rapier3d-compat 0.21 grip rolling bodies). Three products: `buildFeelTrack()` (drop → straight → banked turn → loop at threshold radius → gap jump → landing ramp → finish cup), `buildRollTrack()` (flat deck for the 30 cm-drop roll test), and `buildLoopTrack(releaseHeight, radius)` (release-ramp + loop for the 2.5 r threshold bisect). Geometry constants (`DROP_HEIGHT`, `LOOP_RADIUS`, `TURN_RADIUS`, ...) are exported here and are the single source for scenario numbers.

`src/feel/run.ts` runs those tracks headless — no rendering, no Three.js — so it behaves identically under Vitest (node), `tools/feel.mjs` and later the browser: `runScenario(opts)` steps the fixed 120 Hz world with one car and returns a `RunResult` (time to finish, peak speed, apex speed vs theoretical minimum, landing impulse, roll distance, FNV-1a state hash); `feelTrackRun(variant)`, `rollRun(variant)` and `loopThreshold(variant, radius, opts)` are the three canned measurements; `setRollCoef(c)` tunes the rolling-resistance term.

`tools/feel.mjs` (npm script `feel`) runs both car variants from `src/physics/car.ts` through all three measurements and prints the bake-off comparison table, including a determinism check (same run twice → equal hashes).

## How it works

Everything is in sim space via `src/physics/sim.ts` helpers (`SIM_SCALE = 10`, see [[Feel#Physics scale factor]]); results are converted back to world metres with `toWorldDist` / `toWorldSpeed`. The roll test is deliberately *not* the feel track's big ramp — it is a 0.3 m world free drop onto flat deck, measured after 2 m of settle. Known provisional flaws carried into stage 2: chord-slab seam stitching and post-ramp landing sink bleed roll energy (0.61 m measured vs ≈ 2.5 m target), so the loop bisect currently cannot run — see [[physics]] for the measured table.

Guarded by `tests/unit/feel.test.ts` (run-twice determinism, roll smoke, scenario smoke).

## Depends on / used by

Depends on `src/physics` only. Used by `tools/feel.mjs`, `tests/unit/feel.test.ts`, and the Feel Engineer's tuning loop; stage 2 replaces the provisional track here.
