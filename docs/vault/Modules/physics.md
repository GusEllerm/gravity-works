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
  (`SIM_SCALE = 10`, see [[Feel#Physics scale factor]]). Time is
  scale-invariant, so conversions scale at S: world→sim velocity **x S** and
  impulse x S^4; `toWorldSpeed` divides by S — an earlier `sqrt(S)` version
  inflated every reported speed 3.16x and poisoned every speed-domain
  tuning (ROLL_COEF, the loop apex floor); see the 2026-10-05 session note.
- `src/physics/car.ts` — `spawnCar(world, variant, pose)` + `carStep(world,
  car, gripAt?)`. The optional `gripAt` is the per-wheel-contact HAZARD
  hook (`GripField`, sim-space): sampled at each aligned wheel contact into
  `WheelSupport.gripPerWheel` / `.grip` / `.contactPerWheel` (plus the
  read-only `slipPerWheel` lateral-slip angles), consumed by the
  self-aligning budget, by `applyRollingResistance`’s per-wheel shares
  (magnitude at the mean grip + yaw at the deviations), and — variant a
  only — by the live tyre friction. Uniform grip is bit-identical to the
  no-hook solver; see [[hazards]] for the measured consumers and the
  hash-neutrality discipline. Variants: `wheelColliders` (a) and `raycastWheels` (b). Also exports
  `__ABLATE` — the TEST-ONLY crutch switchboard read by
  `tests/unit/ablation.test.ts` and nothing else (defaults = shipped config,
  reading an untouched switch changes no float; see §Crutch ablation below).
  Collision groups
  are explicit and load-bearing (stage-2 fixes): track `0x0001_fffd`, chassis
  `0x0002_fffd`, wheels `0x0004_fff9` — wheels hit the track for real, never
  their own chassis, and the TRACK filter excludes the chassis bit so the
  raycast car never physically touches it either (a ray-only body by
  construction; leaving the chassis in made hull contacts silently carry the
  car through loop chords — "hoovering"); the track no longer uses the
  default all-ones group
  because it matched the suspension rays' wheel-exclusion predicate and was
  silently filtered out of every variant-a support ray (the car fell onto
  its chassis box — see Engine gotchas).
- The tracks and scenario runners these run on live in `src/feel` — see
  [[feel]]. `tools/feel.mjs` (`npm run feel`) prints the comparison table.

## Variant design (stage 1, bake-off outcome)

Both variants carry the chassis on **explicit coil springs along the track
contact normal**, computed from `castRayAndGetNormal` at four mounts (the
  SPRING pushes along the contact normal; the DAMPER measures the strut-axis
  extension rate, never contact-normal velocity — along the normal it reads
  the car's own orbital motion wherever the deck curves and brakes the
  suspension against steady cornering, measured on loops)
(`supportStep`). Pushing along the normal, not chassis-up, is load-bearing:
a pitch-tilted support force creates slope drag that exactly cancels gravity
and stalls the car on any incline (found by measurement, not theory).
Stage 2 adds three more channels for the kit track: U-channel rail contact
(per-mount feeler rays at lip-band height — the steering of record), an
anti-roll torque about the chassis forward axis (rolled mass is the whole
chassis, so force-couple bars are ill-conditioned on slopes), and a
friction-circle-budgeted self-aligning axle torque; see [[feel]] stage-2
notes.

The strut's GEOMETRY was reconciled to the car's real axle line on 2026-10-05
and the old numbers were fictions: `ATTACH_LOCAL` sits at `CAR.wheelY` (−0.25
sim, the axle plane) rather than somewhere above it; `suspRest` is 0.16 (the
wheel radius plus the static sag — the previous 0.42 was a "virtual wheel"
radius no part of the car has); `droopMax` is 0.08. That last one is a balance,
not a constant: at 0.15 the strut is a LEASH that lets an inverted car free-fall
away from the deck through a loop apex and land back on the track (it was
completing laps the witnesses should have refused), and at 0.03 it goes SLACK
over any convex crest — a gap lip or a chord joint — after which the chassis
rides the rest of the course on its own floor with the support force chattering
0, 0, 0, 22 kN, 0. Support rays also reject back-face hits (`dot(n, down) > 0`),
without which a wheel ray reading a loop chord from underneath pushed the car
through the deck.

- **Variant b (raycastWheels)** — chassis-only body; the four rays are the
  wheels. Winner: rolls true down the drop (peak 7.25 m/s world ≈ free-fall
  7.7), no contact path, no sleep/joint pathologies.
- **Variant a (wheelColliders)** — four free **cylinder** wheel bodies with
  **real colliders and tyre friction** (μ 0.05, group `0x0004_fff9`) riding
  under their mounts on a clamped PD plus the same contact-normal support
  springs. Stage 1 shipped this variant with a filter-0 collision group —
  telemetry masses touching nothing — which made the "wheel-collider
  variant measured" claim false (review finding 2); stage 2 made it honest.
  With real contacts it ploughs the chord-slab stitching: on the drop-ramp
  roll rig it stops 2.6 m (31 %) short of the raycast variant (5.87 vs
  8.46 m). That plough is a property of the hand-chorded provisional track,
  not something to tune around — it is precisely why the track kit's
  stitched convex colliders are a stage-2 deliverable.

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
  (Honest caveat now that variant a has real wheel contacts: chord slabs
  roll clean for *sprung raycast* bodies; free *wheel cylinders* still
  plough each slab end-face — see the variant a note above.)
- Collision-group **predicates match membership masks, and the default
  group is all-ones**: the suspension rays exclude the wheel group with
  `groups >>> 16 & 0x4`, which also matched the default-grouped TRACK — so
  every variant-a support ray filtered the track out and the "dropped" car
  fell onto its chassis box. All world colliders now carry explicit
  memberships (`addStaticBoxes` sets `0x0001_ffff`).
- A symmetric vertical free-drop carries zero horizontal momentum: the
  honest 30 cm drop-on-flat rig rolls ~0.00 m for any collider. The brief's
  "rolls ~2.5 m from a 30 cm drop" is a drop-**ramp** release measurement
  (`rampRollRun`), not a vertical drop — stage 1 conflated the two.
- CCD on *rolling/sliding* bodies applies viscous predictive braking; CCD is
  enabled on the chassis only (belt-and-braces against tunnelling thin loop
  walls) and off on wheel bodies.

## Measured vs targets (2026-10-04, honest rigs)

Stage-1's roll numbers were rig artifacts (a 3 sim/s launch velocity, a 0.2 m
offset labelled "2 m", and measurement from `flatEnd` instead of touchdown —
review finding 1). Re-measured on honest rigs: no launch velocity, true
world-metre decks, wheel-centre travel after touchdown.

| metric                       | target        | wheelColliders | raycastWheels |
|------------------------------|---------------|----------------|---------------|
| roll — free-drop rig         | ≈2.5 m (not observable here — 0 by symmetry) | 0.00 m | 0.00 m |
| roll — drop-ramp rig (§7.1)  | ≈2.5 m        | 5.87 m         | 8.46 m        |
| feel peak speed              | —             | 12.57 m/s      | 7.25 m/s      |
| feel track                   | finish        | DNF            | DNF           |
| loop threshold               | 2.50 r ±10 %  | unmeasurable   | unmeasurable  |
| determinism                  | equal hashes  | pass           | pass          |

Stage-1 → stage-2 movement stated plainly: wheelColliders 0.28 m → 0.00/5.87
(it previously never had supported wheels or working support rays at all —
the 0.28 was a chassis dropped on the deck sliding 0.08 m); raycastWheels
0.61 m → 0.00/8.46 — **materially moved, and the stage-1 number never
measured rolling**: the car sank below the deck plane and the reported 0.61 m
was buried-car creep to the timeout. The drop-ramp overshoot (8.46 vs 2.5)
is ROLL_COEF history: μ = 0.02 was tuned against the broken rig; the ideal
roll from a 30 cm drop is d ≈ h/μ ≈ 15 m, so μ needs re-tuning up toward the
0.1 ballpark, with chord-slab seam + spring losses and (variant a) wheel
plough pulling the other way. Loop landing sink is unchanged and still
blocks the 2.5 r bisect — stage-2 suspension/track-kit item.

## Verdict

**raycastWheels still wins the bake-off** — it is the only variant that runs
the feel track's first half at plausible speed, and it still DNFs late. The
comparison is now honest on both sides: variant a has genuine wheel
colliders and loses ~31 % of its roll to chord-slab plough, exactly as
predicted from the joint-era probes. Recommend raycastWheels as the stage-2
base; re-run the bake-off on track-kit colliders once they exist.

**Re-run on track-kit colliders — done (stage 2, kit-integration round
onward).** On the kit's merged-run hulls the two variants now agree at every
shipped metric (feel track completes 3.31 s both, roll 2.47 m both, loop
gate 2.30 R both — table in [[feel]]); the chord-slab plough was indeed a
property of the retired geometry, not of variant a. The remaining variant-a
open question is banked-yaw crossing (its tyres physically touch the lips),
and sizing the loop piece for the collider variant is a stage-3 carry-in
([[Home]] Deferred).

## Solver energy honesty (stage-2 audit, 2026-10-06)

`node tools/feel.mjs audit [hR] [arc0 arc1]` prints a per-step ledger — total
specific energy, per-contact-site work, and the unexplained remainder. Use it
before believing any lap. Three laws it enforced into `src/physics/car.ts`:

1. **Every support impulse needs its velocity term.** A position projection
   (`k·u` into one step, no velocity feedback) is a pure energy source when
   `u` is a geometry reading rather than a penetration; the ring-entry guide
   contact minted +1.03 J/kg in a single step this way and the threshold
   rode on it. The guide branch is now the aligned-path implicit spring
   with its push-out capped at the closing rate — an inelastic bump whose
   work is bounded by the KE actually present.
2. **Damper force and damper rate must be collinear.** Reading the
   extension rate along one axis while pushing along another charges every
   attitude lag into "suspension heat" and lets a second element pump it
   back — the audit saw damper −3.2 / wishbone +1.9 J/kg ringing per lap
   through the ring chords. Both are work-conjugate now.
3. **Rate targets may lead the deck, never double it.** The deck-alignment
   law's pre-audit `2/dt` factor stored 23 J of chassis rotor against a
   1.6 J/kg lap budget; lead is 1.5 with a true-rate damper killing the
   over-rotation mode. A soft wishbone may need lead — a stiff one would
   not; measure before either multiplier ships.

The instrumented sites (`WORK`, `addWork`, `pointDke`/`torqueDke` in
`car.ts`) are zero-cost unless `WORK.on`; keep new impulse sites registered
there so the audit stays exhaustive rather than anecdotal.

## Crutch ablation matrix (stage-2 fix crew, 2026-10-06)

The stage-2 review's complexity-debt finding: the wishbone/rotor/conjugate/
gate stack grew fix-on-symptom and **no test would go red if a crutch were
deleted**. `__ABLATE` in `car.ts` (test-only, exported, env-var-free) lets
`tests/unit/ablation.test.ts` flip ONE term at a time and re-measure. This
is the table that turns folklore into evidence; rerun the test and update
it alongside any tuning change.

| crutch disabled | feel-track finish | loop rig @ 2.4 R | verdict |
|---|---|---|---|
| — (shipped) | **3.31 s** (`90d4cd69`) | Y | baseline |
| wishbone lead 1.5 → 2 | **DNF** | n | **LOAD-BEARING** — the doubled lead stores the rotor mode the damper then burns; every riser becomes a ~1 J/kg slam |
| rotor damper off | **DNF** | n | **LOAD-BEARING** — without it the lead-1.5 target itself over-rotates; the pair (lead 1.5 + damper) is one mechanism |
| conjugate damper law → naive axis read | 3.38 s (+0.07 s) | **n** | **LOAD-BEARING on the loop metric** — barely visible on the feel track, but the pump-and-burn (audit: +1.9 / −3.2 J/kg per lap) eats exactly the margin the 2.4 R row runs on |
| misalignment gate off | bit-identical hash | Y | **INERT on every shipped rig** — the car never exceeds ~49° deck misalignment on the feel track or loop rig; it is stage-3 banked-yaw insurance, not a crutch today |

Reading: the lead/damper pair and the conjugate law are structural —
deleting either loses the feel track outright or loses the loop threshold.
The misalignment gate is the one term carrying no measured load today;
keep it only until stage 3 either gives it a measured story or the
ablation goes red proving it can go. The audit column of the wishbone
crutch (positive net work in the sub-2.25 R phase window, see
[[feel]] §Loop threshold) is the one known place the pair still pumps —
pinned by the bracket floor, not by faith.
