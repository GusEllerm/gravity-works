/**
 * Hazard-zone tests (stage 3, Feel Engineer). The contract under test:
 * `src/world/hazards.ts` turns level DATA into cuboid grip zones; the car
 * samples a wheel's zone membership AT THAT WHEEL'S CONTACT POINT
 * (`GripField`/`WheelSupport` in `src/physics/car.ts`) and the consumers are
 * the friction-circle-budgeted self-aligning torque, the rolling-resistance
 * magnitude (mean grip), the per-wheel rolling-share YAW (a straddled patch
 * drags more on the dry side — tank steering), and, for the wheel-collider
 * variant, that wheel's live tyre friction.
 *
 * The proofs the brief demands:
 *  - same build/seed THROUGH a zone vs WITHOUT it -> divergent hash AND
 *    measurably more lateral slip in-zone (half-patch entry: the honest
 *    lateral signature a channel-guided toy can show — see Modules/hazards);
 *  - L04's par build still finishes (its hash is in fact bit-identical to
 *    the no-zone replay: the par line is grip-independent BY DATA PLACEMENT,
 *    which is what Concepts/Levels always claimed);
 *  - hazard code is hash-neutral everywhere it is not touched: a zone with
 *    factor 1 replayed at a far-away position equals the zone-free run to
 *    the bit, and every shipped harness hash is unchanged (pinned in
 *    `ablation.test.ts`).
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { initRapier } from '../../src/physics/sim.ts';
import { KitRig } from '../../src/feel/kittrack.ts';
import { chain } from '../../src/track/build.ts';
import { simulate, ROLL_COEF } from '../../src/feel/run.ts';
import { replayRun } from '../../src/replay/replay.ts';
import { World } from '../../src/world/world.ts';
import { KITCHEN04, kitchen04GroundBuild } from '../../src/world/levels/kitchen04.level.ts';
import { KITCHEN01 } from '../../src/world/levels/kitchen01.level.ts';
import {
  HazardField,
  WET_ZONE_HALF_HEIGHT,
  zonesFromLevel,
} from '../../src/world/hazards.ts';

beforeAll(() => initRapier());

describe('hazard zones are data (src/world/hazards.ts)', () => {
  it("normalises the LD's WetPatch to the cuboid zone contract", () => {
    const zones = zonesFromLevel(KITCHEN04);
    expect(zones).toHaveLength(1);
    const z = zones[0]!;
    expect(z.shape.kind).toBe('cuboid');
    expect(z.frictionFactor).toBe(0.5); // the brief's "halves grip"
    expect(z.source).toBe('tap');
    expect(z.shape.half.y).toBe(WET_ZONE_HALF_HEIGHT);
    // the centre sits ON the ground line's deck (the decked-over sink)
    expect(HazardField.contains(z, z.shape.center)).toBe(true);
  });

  it('factorAt is 1 outside every zone and the product inside', () => {
    const field = HazardField.fromLevel(KITCHEN04);
    const c = field.zones[0]!.shape.center;
    expect(field.factorAt({ x: c.x, y: c.y, z: c.z })).toBe(0.5);
    expect(field.factorAt({ x: c.x + 10, y: c.y, z: c.z })).toBe(1);
    // flying ABOVE the contact band is not "on the patch"
    expect(field.factorAt({ x: c.x, y: c.y + WET_ZONE_HALF_HEIGHT + 0.01, z: c.z })).toBe(1);
    // hazard-free levels have no zones at all
    expect(HazardField.fromLevel(KITCHEN01).zones).toHaveLength(0);
  });
});

/** The same level data with the hazard rows swapped (never a new file: the
 *  hash identity under test is (level, build, seed), and `hazards` is part
 *  of the level). */
function withHazards(level: typeof KITCHEN04, hazards: readonly unknown[]) {
  return { ...level, hazards } as typeof KITCHEN04;
}

describe('L04: the hazard bites the ground line and not the par line', () => {
  it('the par build finishes with the zone live — bit-identical to the dry replay', async () => {
    const wet = await replayRun(KITCHEN04, KITCHEN04.parBuild());
    const dry = await replayRun(withHazards(KITCHEN04, []), KITCHEN04.parBuild());
    expect(wet.status).toBe('finished');
    // the par line FLIES the patch (Concepts/Levels §Hazards as data): with
    // no wheel contact inside the zone the grip field reports 1 everywhere
    // and the solver is bit-for-bit the dry one — grip-independence as a
    // HASH FACT, not a claim.
    expect(wet.hash).toBe(dry.hash);
  }, 30_000);

  it('the same build/seed through the zone diverges in hash and still finishes', async () => {
    const wet = await replayRun(KITCHEN04, kitchen04GroundBuild());
    const dry = await replayRun(withHazards(KITCHEN04, []), kitchen04GroundBuild());
    expect(wet.status).toBe('finished');
    expect(dry.status).toBe('finished');
    expect(wet.hash).not.toBe(dry.hash);
    // the wet patch is LOW-DRAG plastic: the measured in-patch effect on a
    // straight is higher roll speed (halved rolling resistance) — the
    // level's "speed-management question" the Levels note promised
    expect(wet.time).toBeLessThan(dry.time);
  }, 30_000);

  it('a zone nobody touches is bit-nothing: factor-1 or far away = dry hash', async () => {
    const base = await replayRun(withHazards(KITCHEN04, []), kitchen04GroundBuild());
    // (a) real code path, all-1 factors: the grip multipliers are exact 1s
    const neutral = await replayRun(
      withHazards(KITCHEN04, [{ ...KITCHEN04.hazards![0]!, gripFactor: 1 }]),
      kitchen04GroundBuild(),
    );
    expect(neutral.hash).toBe(base.hash);
    // (b) a real wet zone, placed far away: never sampled inside
    const away = await replayRun(
      withHazards(KITCHEN04, [{ ...KITCHEN04.hazards![0]!, center: { x: 99, y: 0, z: 99 } }]),
      kitchen04GroundBuild(),
    );
    expect(away.hash).toBe(base.hash);
  }, 60_000);
});

/**
 * The lateral-slip proof. A U-channel KINEMATICALLY bounds lateral slide
 * (Modules/physics: "the channel steers; tyre scrub doesn't"), so a wet
 * patch cannot make a rail-guided toy slide wide on a straight — the honest
 * in-zone lateral signature is the DRAG DIFFERENTIAL across the patch
 * EDGE: the wet-side wheels drag less, the car yaws toward the dry side,
 * and the wheel slip angles rise. Half-patch entry: the zone covers only
 * the z > 0 half of the deck.
 */
describe('measurably more lateral slip in-zone (half-patch rig)', () => {
  function slipRun(wet: boolean) {
    const rig = new KitRig(
      chain(['straight'], { params: { straight: { length: 4 } }, levelId: 'haz-slip', seed: 7 }),
      10,
    );
    const zone = {
      id: 'halfPatch',
      shape: {
        kind: 'cuboid' as const,
        center: { x: 1.9, y: 0, z: 0.26 },
        // tall-enough band, and a lateral edge BETWEEN the wheel lines
        // (wheel planes at |z| ~ 0.0185 m): the z > 0 side is wet,
        // the z < 0 side is not — a straddled patch edge for the whole run
        half: { x: 1.65, y: WET_ZONE_HALF_HEIGHT + 0.05, z: 0.25 },
      },
      frictionFactor: 0.5,
    };
    const field = new HazardField(wet ? [zone] : []);
    return simulate(rig, {
      variant: 'raycastWheels',
      coef: ROLL_COEF,
      timeout: 2.5,
      releasePose: rig.poseAt(0.25),
      launchSpeed: 26, // 2.6 m/s world — through the patch and done inside the window
      gripAt: wet ? (p) => field.factorAt({ x: p.x / 10, y: p.y / 10, z: p.z / 10 }) : undefined,
    });
  }

  it('diverges in hash and raises the mean wheel slip angle', () => {
    const dry = slipRun(false);
    const wet = slipRun(true);
    expect(dry.hash).not.toBe(wet.hash);
    const drySlip = dry.slipAngleSum / dry.slipSamples;
    const wetSlip = wet.slipAngleSum / wet.slipSamples;
    expect(wet.slipSamples).toBeGreaterThan(50);
    // (calibrated against the measured dry/wet pair — Modules/hazards)
    expect(drySlip).toBeLessThan(0.05);
    expect(wetSlip).toBeGreaterThan(drySlip * 1.4);
  });

  it('the wheel-collider variant takes it through the live tyre friction (both variants finish the L04 ground line)', async () => {
    for (const variant of ['raycastWheels', 'wheelColliders'] as const) {
      const w = await World.create(KITCHEN04, kitchen04GroundBuild(), { visuals: false, variant });
      w.launch();
      while (w.stepCount < 15 * 120 && w.status === 'running') w.step();
      expect(w.status).toBe('finished');
      w.dispose();
    }
  }, 60_000);
});
