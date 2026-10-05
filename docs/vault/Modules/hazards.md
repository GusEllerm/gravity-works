---
livedocs: module
tags: [module, hazards]
---
# Modules/hazards

> [!abstract] Role
> Hazard zones: the level DATA (the Level Designer's wet patch) normalised
> into world-space grip regions, and the per-wheel-contact hook the physics
> consumes. The tap's wet patch "halves grip" (PROMPT §6) — this module is
> the sentence that makes grammatical in the solver. Owner: Feel Engineer
> (stage 3, ask #2a of [[Concepts/Levels]]).

## What it does

- `src/world/hazards.ts` — `HazardZone` (id, `CuboidShape`,
  `frictionFactor`, optional `source`), `zonesFromLevel` / `zoneFromHazard`
  (normalises the authored `WetPatch` {center, radius, gripFactor} to the
  cuboid form: a square circumscribing the drip circle, `WET_ZONE_HALF_HEIGHT`
  = 2 cm tall — the contact band a wheel touch must fall inside), and
  `HazardField.factorAt` (the product of containing zones' factors; 1
  outside). The wetPatch `center` is a DECK point: a car flying over the
  patch reports no aligned wheel contact at all, so flight is grip-neutral
  by construction — KITCHEN 04's par line needs no exemption clause.
- The physics consumer is `GripField` / `WheelSupport` in
  `src/physics/car.ts`: `carStep(world, car, gripAt?)` samples the field at
  EVERY ALIGNED WHEEL CONTACT (`gripPerWheel`, plus `contactPerWheel` and
  the read-only `slipPerWheel` lateral-slip angles), and
  `applyRollingResistance(car, grounded, coef, support?)` applies each
  wheel's SHARE of the drag scaled at that wheel.

## What grip actually scales (measured — do not re-guess)

The raycast car's deck-friction channels are the ones the solver actually
has; a wet zone scales exactly these:

1. **Rolling resistance magnitude** — `coef × mean contact grip`. The kit's
   "effective mu" law IS a friction coefficient; water lowers it, so the
   patch is a LOW-DRAG strip. Measured on the KITCHEN 04 ground build (the
   hazard PROBE — not a player route since the L04 learnability pass, see
   [[Concepts/Levels]] §L04 card):
   2.350 s dry → 2.292 s wet. On the probe this effect is the whole story.
2. **Per-wheel drag differential → yaw** — a wheel in-zone drags less than
   a wheel out: the straddled patch edges tank-steer the car toward the
   DRY side (the yaw component only; pitch/roll parts of a drag offset
   belong to the attitude laws). Zero under uniform grip — guarded exactly.
3. **The self-aligning (weathervane) torque budget** — friction-circle
   authority × mean grip.
4. **Variant a's live tyre friction** — `wheelColliders` wheels are real
   colliders; a wheel whose contact is in-zone gets
   `collider.setFriction(CAR.wheelFriction × gripK)`.

## The lateral-slip truth (channel kinematics)

**A U-channel bounds lateral slide kinematically** ("the channel steers;
tyre scrub doesn't", [[physics]]). On a straight, "slides wide on wet" is
NOT reachable — the rail carries any lateral demand grip-independently, and
the wet patch's honest lateral signature is the DRAG-DIFFERENTIAL yaw above.
Measured (half-patch rig, `tests/unit/hazards.test.ts`: straight deck, wet
band covering only z > 0, 2.6 m/s release): mean wheel slip angle **2.38°
dry → 3.98° wet (1.67×)**, heading yaw 0° → 1.77°, hash `b4e6c7b7` →
`9a80d935`. The big "slides wide" failure mode needs an un-channeled or
steerable surface — the same blocked boundary as ask #1 (mid-run yaw arcs).
When that lands, the grip hook is already the right consumer: nothing here
changes.

## Hash-neutrality discipline

`gripAt` undefined → the force laws are literally untouched. Zones present
but untouched → every factor is exactly 1.0, `x * 1 === x` bit-for-bit,
and the yaw term's guard skips on exactly-zero deviations. Proven by: the
pinned harness hashes unchanged (`ablation.test.ts`), the factor-1 and
far-away zone variants replaying to the dry hash, and KITCHEN 04's par line
being bit-identical wet/dry (its line flies the patch — grip-independence
as a hash fact).

## L04 placement fix (stage 3)

`wetPatch()` in `kitchen04.level.ts` centred the patch on the PAR rig's
landing run, which with the hook live sits ON the par line's own deck and
contradicts the file's own design claim ("the par line flies past"). The
centre is now derived from the GROUND build's straight seam — the decked
sink's middle — where the ground probe drives through it. Measured after the
fix: par wet == par dry bit-for-bit (2.450 s, `7adc07a8`), ground line
diverges (2.350 → 2.292 s, `772b9e30` → `fce78ea5`), both finish. Flagged
for Level Designer review.

REVIEWED (L04 learnability pass, Playtest G): the placement stands — the
learnability pass moved no geometry and no hazard data, only the tray (the
spare `straight` came out; the tray is now the par line's exact multiset).
The reviewed card states the anchored truth: no line a player can
BUILD touches the zone (the sink is flown), so the zone's in-game role is
the drip TELLS and its grip physics live in the probe replay.

## Guarded by

`tests/unit/hazards.test.ts` — normalisation, `factorAt`, L04 par bit-
identity, ground-probe hash divergence + finish, untouched-zone bit-nothing,
the half-patch lateral-slip measurement, and both car variants finishing
the ground probe.

## Depends on / used by

`src/world/world.ts` (wiring: one `HazardField` per World, `gripAt` arrow
into `carStep`, support into `applyRollingResistance`; `WorldState.car`
carries the `grip`/`slip`/`velocity` telemetry), `src/feel/run.ts`
(`SimOpts.gripAt` + slip telemetry in `RunResult`), `src/juice` (the
hazard tell projects a velocity ray at these zone boxes — see [[juice]]).
See [[world]], [[physics]], [[feel]].
