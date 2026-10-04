---
livedocs: snapshot
tags: [session, stage-2, feel, physics]
---
# 2026-10-04 Stage 2 - feel engineer: honest rigs

Scope: stage-1 review findings **1, 2, 4, 6, 7** (the roll rig, the fake
wheel-collider variant, dead code, the inverted tripwire, the NaN hash). Files:
`src/physics/sim.ts`, `src/physics/car.ts`, `src/feel/run.ts`,
`tools/feel.mjs`, `tests/unit/feel.test.ts`, plus the measured claims in
[[physics]] (and the rig/`setRollCoef` claims in [[feel]], broken by my
deletions).

## Honest roll numbers (before → after)

Stage 1's roll figures were rig artifacts: `spawnCar` always imparted a 3 sim/s
launch velocity, the "2 m deck" was 2 sim units (0.2 m world), and the metric
was measured from `flatEnd` instead of from touchdown. All three fixed
(`launchSpeed` release option, `ROLL_DECK_OFFSET_M = 2` in true world metres,
wheel-centre reference point tracked from first touchdown).

| metric                                          | stage 1 (artifact) | stage 2 honest (wheelColliders → , raycastWheels →) |
|-------------------------------------------------|--------------------|------------------------------------------------------|
| roll — free-drop rig (vertical, no launch)      | 0.28 / 0.61 m      | **0.00 / 0.00 m**                                    |
| roll — drop-ramp rig (brief §7.1, from rest)    | never existed      | **5.87 / 8.46 m** (target ≈ 2.5 m)                   |
| feel track peak speed                           | 2.66 / 7.25 m/s    | **12.57** / 7.25 m/s                                 |
| feel track finish / loop threshold              | DNF / unmeasurable | DNF / unmeasurable (unchanged)                       |
| determinism (repeat-run hashes)                 | pass               | pass (`ba08aa61` / `20354e5a`, both `=repeat`)        |

Stated plainly, as required: **the raycast roll number moved materially** —
0.61 m → 0.00 m (free-drop) / 8.46 m (drop-ramp). The stage-1 number never
measured rolling; it was buried-car creep at v ≈ 0.31 to the 30 s timeout, as
the review's probe found. The raycast feel-run hash is bit-identical to stage 1
(`20354e5a`) — its dynamics are untouched, which is the regression signal.

Two facts owned honestly:

1. **A symmetric vertical free-drop rolls ~0 m for any collider** — zero
   horizontal momentum by construction. The brief's "rolls ~2.5 m from a 30 cm
   drop" is a drop-**ramp** release metric, so the harness now runs and prints
   both rigs (`rollDrop`, `rollRamp`) instead of hiding which one the target
   belongs to.
2. **The 2.5 m target is currently MISSED BY OVERSHOOT.** μ = 0.02
   (`ROLL_COEF`) was tuned against the broken rig; ideal physics says
   d ≈ h/μ ≈ 15 m, and seam + spring losses bring the honest measurement to
   8.46 m (raycast) / 5.87 m (real wheels). Re-tuning μ is an open item, not a
   stealth edit made here — the table must stay readable while the rigs were
   being fixed.

## What changed in the physics

- **Variant a got the colliders it always claimed** (finding 2): the four
  wheel bodies are now cylinders (axle along local z) with tyre friction
  μ 0.05 in collision group `0x0004_fff9`, hitting the track for real.
  Measured on the drop-ramp rig they plough the chord-slab end faces and stop
  2.59 m (31 %) short of the raycast variant (5.87 vs 8.46 m). Documented as
  the WHY of the track kit, not tuned around.
- **Bug found while doing it — the track was invisible to variant a's support
  rays**: `addStaticBoxes` left track colliders on Rapier's default all-ones
  collision group, and the suspension-ray predicate excludes the wheel group
  by membership mask — which the all-ones track matched. Variant a's springs
  had therefore never fired; the "dropped" car fell onto its chassis box
  (this is the mechanism behind the review's "stops at step 73, 0.08 m").
  Track now carries explicit membership `0x0001_ffff`. With support working,
  variant a's feel-track peak went 2.66 → 12.57 m/s.
- `quant()` in the state hash now maps NaN and each infinity to distinct
  poison words instead of `| 0` → 0 (finding 7); pinned by a unit test.
- Dead code gone (finding 4): `setRollCoef` deleted (`ROLL_COEF` is now a
  constant), `RunOpts.startOffset` deleted.
- Tripwire un-inverted (finding 6): `tests/unit/feel.test.ts` no longer fails
  when roll hits ~2.5 m. The drop-ramp tests use an acceptance floor at 85 %
  of target plus a drift-band ceiling around the pinned honest values; the
  free-drop test keeps a +0.2 m launch-artifact tripwire. All named measured
  constants are in the test header with the target stated.

## Verification

- `npm run typecheck` clean; `npx vitest run` 13/13 pass.
- `npm run feel` (final code): table as above; both hashes `=repeat`.

## Open / handoffs

- `ROLL_COEF` re-tune toward ~2.5 m on the drop-ramp rig (μ ballpark 0.1),
  alongside the track kit's stitched colliders — director/kit interaction.
- Post-ramp landing sink still blocks the loop 2.5 r bisect (stage-2
  suspension item, unchanged from stage 1).
- The loop-threshold rows in the table ran with the fixed groups and are
  still DNF/unmeasurable — the sink, not the groups, owns that.
