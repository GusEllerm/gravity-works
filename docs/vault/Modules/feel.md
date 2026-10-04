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

## Stage 2 — the kit track, first blood (2026-10-04)

The provisional track is gone from the feel rigs. `src/feel/feeltrack.ts`
builds the feel track as a `PieceDef` **chain** through
`src/track/desugar.ts`, and `src/feel/kittrack.ts` (`KitRig`) owns the
world: one **merged** static collider per piece (a mesh *union*, never a
family of overlapping boxes — a compound is an island farm for the CCD
raycasts), collision-group bit discipline, an arc-indexed centreline for
metrics, and the uniform-arc **camera rail**.

Measured on this geometry (sim constants of the day: `suspC` 550,
`RAIL_K` 30000 @ `RAIL_SLACK` 3.5 mm, `ALIGN_GRIP` 0.15, `ROLL_COEF` 0.12):

| metric | raycast variant | wheel-collider variant |
|---|---|---|
| roll from 0.3 m drop-ramp (§7.1) | **2.65 m** — target 2.5 ±10% ✓ | 2.65 m ✓ |
| feel-track completion | **completes, 3.07 s** drop→loop→gap→landing→cup | DNF (see findings) |
| min loop height / radius, R = 0.03 | **1.41 R** | **2.85 R** |
| peak speed | 1.94 m/s | — (DNF) |

Findings that cost real debugging and must not be re-learned:

- **The chassis is physically inert against the track.** The raycast car may
  only touch the deck with its four wheel colliders; while `TRACK_GROUP`'s
  filter mask included the chassis bit, the hull-vs-chassis contacts were
  silently carrying the car through loop chords and ramps ("hoovering") and
  every suspension number measured a lie. `0x0001_fffd` is the load-bearing
  constant of this module.
- **Channel rails steer; tyre scrub doesn't.** A feeler ray per wheel mount
  at the **lip mid-band height** (0.020 m — one at deck level reaches
  nothing, the deck side faces sit *below* the lips) applies a progressive
  spring + fraction dashpot along the wall normal, with outward-velocity
  damping, and a friction-circle-budgeted self-aligning axle torque. Tuning
  the band height was worth more than two hours of controller work.
- **Bump stops need a speed gate.** The loop is a 19-step chord staircase
  (3 mm risers); a full-stop catcher firing on every gentle chord climb
  dumps forward KE inelastically and stalls the car mid-loop. The stop now
  claims the contact only for fast impacts (impact speed > 6.6 sim) or deep
  compression; the suspension spring alone carries slow sustained climbs.
- **Banked yaw arcs are the open boundary.** Mid-run yawed arcs (bank/curve
  at 1–1.5 m/s) defeat every pure-raycast lateral model tried — tyre scrub,
  caster trail, weathervane, wall springs — by ploughing or ring-roll. The
  feel track therefore builds the 9° bank + mirrored counter-curve as the
  post-cup run-out (built, colliding, railable; the timed run ends at the
  cup), and crossing banked arcs is the acceptance question for the
  wheel-collider variant, whose tyres physically touch the lips.
- **Layout**: `ramp → straight → loop → gapLip → landing → finishCup →
  bank → curve`, drop 0.45 m (a 0.3 m drop cannot feed both the loop
  gate and the gap jump; the §7.1 roll rig keeps its canonical 0.3 m).

`src/camera/run-camera.ts` is the §7.3 run camera: pure class over the rail,
0.4 s speed-scaled lead, 150 ms positional lag, ~350 ms rotational lag aimed
at the *lead* frame — the turn is begun before the eye arrives. Every filter
is the step-independent exponential form; guarded by `tests/unit/camera.test.ts`.

### Cross-reference (systems engineer, 2026-10-05)

The world level registry (`src/world/levels/feeltrack.level.ts`) now desugars
`FEEL_TRACK_KINDS` + `FEEL_PARAMS` from this module directly (both exported)
instead of duplicating geometry, so retuning a constant here moves the
level, its replay hash and the share links automatically;
`tests/unit/feeltrack-level.test.ts` asserts the two routes reify to
identical splines and collider hulls.
