---
livedocs: snapshot
tags: [session, stage-1]
---
# 2026-10-03 Stage 1 — car physics bake-off (feel engineer)

## Goal

PROMPT.md stage-1 brief: rendering-agnostic Rapier wrapper, provisional feel
track, two car variants (wheel colliders vs raycast wheels), metrics + tests,
winner recommendation. Worktree `gw-feel`, branch `feel-bakeoff`.

## What was done

- `src/physics/sim.ts`: world @ 120 Hz fixed step, SIM_SCALE 10 (see
  [[Feel#Physics scale factor]]), solver iteration raise, FNV-1a state hash
  every 10 steps, world↔sim helpers.
- `src/physics/car.ts`: both variants on contact-normal spring support;
  variant a additionally free wheel bodies (mass+inertia, own collision
  group). Revolute-joint support implemented, measured, rejected — see
  [[physics]] for the three failure modes before anyone re-tries it.
- `src/feel/feeltrack.ts`: feel track (drop → straight → banked turn → loop →
  gap → landing → finish), roll track, loop-test track; chord-slab box
  geometry (trimesh ploughs rolling bodies on this build).
- `src/feel/run.ts` + `tools/feel.mjs` (`npm run feel`): metrics table.
- `tests/unit/feel.test.ts`: determinism (hash-identical repeat runs) PASS;
  roll distance bounded by what actually runs; honest TODOs on unmet targets.

## Metrics (honest)

| metric        | target      | wheelColliders | raycastWheels |
|---------------|-------------|----------------|---------------|
| roll          | ≈2.5 m      | 0.28 m MISS    | 0.61 m MISS   |
| peak (feel)   | —           | 2.66 m/s       | 7.25 m/s      |
| feel track    | finish      | DNF            | DNF           |
| loop thresh.  | 2.5 r ±10 % | unmeasurable   | unmeasurable  |
| determinism   | equal hash  | PASS           | PASS          |

Roll and loop-threshold targets were NOT met. Causes, in one line each:
seam-stitching + spring-damper energy loss dwarfs the tuned rolling term
(≈2.5×); and after the 30 cm ramp landing the chassis sinks into the deck far
enough that support rays start inside slabs, so support switches off and the
car anchors — it never enters any loop to bisect a threshold on.

## Decision

**raycastWheels wins** every measured metric; recommend it as the stage-2
base. (Variant a's wheel bodies survive as telemetry/inertia extras riding on
b's support model — that hybrid IS what variant a runs today.)

## Stage-2 follow-ups (physics)

1. Suspension: softer/longer-travel springs or substep the springs at
   landing (bump-stop currently velocity-cancels below toi 0.14, too abrupt).
2. Track: constant seam spacing across segment boundaries; consider one box
   per blend instead of per-pose pairs at segment ends.
3. Loop test entry: give the deck→loop transition a proper tangent blend.
4. Re-run `npm run feel` after each; the table is the diff.

## Notes

- Body sleep + frozen-`linvel` output masqueraded as "friction locks" for
  hours; `canSleep = false` removed the confound but not the real locks (detailed in [[physics]]).
- Ray API filter-slot mistake (body passed as predicate) silently disabled
  every exclusion — documented in [[physics]].
- Livedocs pre-commit gate: expect failures in this worktree (stamps file
  absent); see commit log.
