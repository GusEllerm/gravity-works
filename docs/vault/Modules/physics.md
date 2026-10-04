---
livedocs: module
tags: [module, physics]
---
# Modules/physics

Rendering-agnostic Rapier wrapper + the two stage-1 car variants. No Three.js,
no DOM — safe under Vitest (node) and `tools/feel.mjs` alike.

## Files

- `src/physics/sim.ts` — Rapier init, `createWorld()` (120 Hz fixed step,
  gravity `G_SIM = 98.1`, solver knobs), static box track spawning, FNV-1a
  state hash every `HASH_INTERVAL` steps, world↔sim conversion helpers
  (`SIM_SCALE = 10`, see [[Feel#Physics scale factor]]).
- `src/physics/car.ts` — `spawnCar(world, variant, pose)` + `carStep()`.
  Variants: `wheelColliders` (a) and `raycastWheels` (b).
- The tracks and scenario runners these run on live in `src/feel` — see
  [[feel]]. `tools/feel.mjs` (`npm run feel`) prints the comparison table.

## Variant design (stage 1, bake-off outcome)

Both variants carry the chassis on **explicit coil springs along the track
contact normal**, computed from `castRayAndGetNormal` at four mounts
(`supportStep`). Pushing along the normal, not chassis-up, is load-bearing:
a pitch-tilted support force creates slope drag that exactly cancels gravity
and stalls the car on any incline (found by measurement, not theory).

- **Variant b (raycastWheels)** — chassis-only body; the four rays are the
  wheels. Winner: rolls true down the drop (peak 7.25 m/s world ≈ free-fall
  7.7), no contact path, no sleep/joint pathologies.
- **Variant a (wheelColliders)** — adds four free wheel bodies (real mass +
  rotational inertia) under their mounts via a clamped PD, colliding with the
  world in their own group. Loser on every metric.

## Why variant a has no revolute joints (measured, do not re-litigate casually)

Revolute-jointed wheel support was implemented first and failed in three
distinct, reproducible ways on Rapier 3D 0.21.0 at 120 Hz / SIM_SCALE 10:

1. **Brake-lock equilibria.** With tyre friction μ (product ≈ 0.03) the
   static friction cone can hold the whole car on a 12° slope — the holding
   force the wheels need is *under* the cone ceiling, so the solver finds a
   no-slip-at-rest solution and the car never rolls. A no-slip release
   (v₀ with matched ω) dodges it; any down-slope drift re-traps it.
2. **Position-joint softness.** Joint-transmitted chassis load path sinks
   the chassis/wheels 0.05–0.3 sim into the track slabs; once below the deck
   the rays hit slab *undersides* (filtered) and every support force turns
   off — permanent stuck states (nose-plough anchoring on slab end faces).
3. **Pitch↔spin coupling.** The joint ties wheel ride-height to chassis
   pitch; rolling energy drains through any damper on that path (measured:
   release spin ω = 20 dies in 8 steps).

Spring-held free wheels (no joints) avoid all three. That is the shipped
variant a. Joints are absent from the codebase on purpose.

## Engine gotchas logged (Rapier 0.21.0 compat)

- `castRayAndGetNormal(ray, maxToi, solid, flags, groups, excludeCollider,
  excludeRigidBody, predicate)` — passing the rigid body in the **predicate
  slot** (arg 8) silently excludes nothing, so every support ray hit the car
  itself; hours of ghost bugs followed.
- Body **sleep** freezes position while `linvel()` keeps reporting the last
  velocity — `canSleep = false` on all car bodies; the frozen-velocity output
  had masqueraded as "friction lock" in earlier probes.
- Default solver (4 iterations) under-converges load chains; raised to
  `numSolverIterations = 20`, `numInternalPgsIterations = 4`.
- Trimesh track surfaces grip rolling bodies (edge plough); chord **box
  slabs** roll clean — the track is compound convex boxes, not a trimesh.
- CCD on *rolling/sliding* bodies applies viscous predictive braking; CCD is
  enabled on the chassis only (belt-and-braces against tunnelling thin loop
  walls) and off on wheel bodies.

## Measured vs targets (2026-10-03)

| metric            | target        | wheelColliders | raycastWheels |
|-------------------|---------------|----------------|---------------|
| roll (0.3 m drop) | ≈2.5 m        | 0.28 m         | 0.61 m        |
| feel peak speed   | —             | 2.66 m/s       | 7.25 m/s      |
| feel track        | finish        | DNF            | DNF           |
| loop threshold    | 2.50 r ±10 %  | unmeasurable   | unmeasurable  |
| determinism       | equal hashes  | pass           | pass          |

Honest misses: the roll test bleeds energy through the chord-slab seam
stitching + spring damping (measured deceleration ≈ 2.5× the tuned rolling
resistance term), and the post-ramp landing sinks the chassis into the deck
far enough that support rays start inside geometry — the car never enters
the loop, so the 2.5 r threshold bisect cannot run. Both are stage-2
suspension/track-stitching tuning items, tracked in the session log.

## Verdict

**raycastWheels wins the stage-1 bake-off** on every measured metric, and is
the only variant that runs the feel track's first half at plausible speed.
Recommend raycastWheels as the stage-2 base.
