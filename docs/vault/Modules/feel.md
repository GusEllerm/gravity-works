---
tags: [module]
---
# src/feel (track builders and scenario runners)

> [!abstract] Role
> The headless feel track: procedural track colliders and the physics-only scenario runners that measure cars against the Feel bible's targets. Provisional stage-1 track — the real feel track lands at stage 2.

## What it does

`src/feel/feeltrack.ts` builds tracks as chord-slab box colliders: `buildTrack(segs)` sweeps a U-channel along a frame-integrated centreline and emits, per pose pair, one floor slab plus two wall slabs (the brief's sanctioned "compound convex colliders" — trimesh edges in rapier3d-compat 0.21 grip rolling bodies). Three products: `buildFeelTrack()` (drop → straight → banked turn → loop at threshold radius → gap jump → landing ramp → finish cup), `buildRollTrack()` (30 cm drop ramp onto a long flat deck, for the two roll rigs), and `buildLoopTrack(releaseHeight, radius)` (release-ramp + loop for the 2.5 r threshold bisect). Geometry constants (`DROP_HEIGHT`, `LOOP_RADIUS`, `TURN_RADIUS`, ...) are exported here and are the single source for scenario numbers.

`src/feel/run.ts` runs those tracks headless — no rendering, no Three.js — so it behaves identically under Vitest (node), `tools/feel.mjs` and later the browser: `runScenario(opts)` steps the fixed 120 Hz world with one car and returns a `RunResult` (time to finish, peak speed, apex speed vs theoretical minimum, landing impulse, roll distance, FNV-1a state hash); `feelTrackRun(variant)`, `rollRun(variant)`, `rampRollRun(variant)` and `loopThreshold(variant, radius, opts)` are the canned measurements. Rolling resistance is the constant `ROLL_COEF` (the stage-1 `setRollCoef` setter was dead code and is gone; re-tuning the constant is an open stage-2 item — it was tuned against the broken stage-1 rig).

`tools/feel.mjs` (npm script `feel`) runs both car variants from `src/physics/car.ts` through all the measurements and prints the bake-off comparison table, including a determinism check (same run twice → equal hashes).

## How it works

Everything is in sim space via `src/physics/sim.ts` helpers (`SIM_SCALE = 10`, see [[Feel#Physics scale factor]]); results are converted back to world metres with `toWorldDist` / `toWorldSpeed`. Two honest roll rigs (stage-2 review fixes): `rollRun` free-drops the car from rest 0.3 m world above the flat deck, 2 m of true world-metre deck down-deck of the ramp run-out, and reports wheel-centre travel after touchdown — which for a symmetric vertical drop is ~0.00 m by momentum conservation, for any collider; `rampRollRun` measures the brief §7.1 metric — released from rest at the top of the 30 cm drop ramp, wheel-centre travel to stop (5.87/8.46 m measured vs ≈ 2.5 m target; ROLL_COEF re-tuning + stitched track-kit colliders are the open items). Known provisional flaws carried into stage 2: chord-slab seam stitching, real-wheel plough on slab end faces, and post-ramp landing sink — the sink still blocks the loop bisect — see [[physics]] for the measured table.

Guarded by `tests/unit/feel.test.ts` (run-twice determinism, roll smoke, scenario smoke).

## Depends on / used by

Depends on `src/physics` only. Used by `tools/feel.mjs`, `tests/unit/feel.test.ts`, and the Feel Engineer's tuning loop; stage 2 replaces the provisional track here.
