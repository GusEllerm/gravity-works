/**
 * Stage-2 feel harness tests — honest rigs (stage-1 review findings 1, 6, 7).
 *
 * Two roll rigs are reported, both with NO launch velocity:
 *
 *  1. FREE-DROP rig (`rollRun`): chassis released from rest 0.3 m (world)
 *     above the flat deck, 2 m of true world-metre deck down-deck of the
 *     ramp run-out; the metric is wheel-centre travel AFTER touchdown.
 *     A symmetric vertical drop carries zero horizontal momentum, so the
 *     physically honest reading is ~0.00 m for both variants — by
 *     construction this rig cannot roll 2.5 m and never will; the stage-1
 *     "0.28 / 0.61 m" were a launch velocity + a mislabelled 0.2 m offset
 *     + a buried-car creep, not rolling.
 *
 *  2. DROP-RAMP rig (`rampRollRun`): the brief §7.1 metric — released from
 *     rest at the top of the 30 cm drop ramp, wheel-centre travel from
 *     touchdown to stop. THIS is where the ~2.5 m target lives.
 *
 * Measured 2026-10-04 (npm run feel, honest rigs, ROLL_COEF = 0.02):
 *   free-drop: wheelColliders 0.00 m | raycastWheels 0.00 m
 *   drop-ramp: wheelColliders 5.87 m | raycastWheels 8.46 m
 *   target ~2.5 m NOT yet met — currently an OVERSHOOT: mu = 0.02 was tuned
 *   on the broken stage-1 rig and puts the ideal (d = h/mu) near 15 m; seam
 *   stitching + spring losses cut that to 8.46 m, and variant a's real
 *   wheel colliders plough the chord slabs down to 5.87 m. ROLL_COEF
 *   re-tuning and the track kit's stitched colliders are expected to close
 *   the gap to ~2.5 m. The assertions below are floors/tripwires that
 *   remain GREEN the day the target is met (the stage-1 tripwire was
 *   inverted — it failed on success, finding 6).
 *
 *   loop: completion still unmeasurable on the provisional track (target
 *         2.50 r +-10%); feel track: both variants still DNF.
 *   determinism: bit-identical state hashes across repeat runs  PASS
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { feelTrackRun, rampRollRun, rollRun } from '../../src/feel/run.ts';
import { initRapier, quant } from '../../src/physics/sim.ts';

beforeAll(async () => {
  await initRapier();
}, 60_000);

/** The bible target: roll ~2.5 m (world) from a 30 cm drop. */
const TARGET_ROLL_M = 2.5;

/**
 * Honest measured values on the honest rigs, 2026-10-04 (npm run feel).
 * See the file header for what each rig is and why the free-drop number is
 * zero by symmetry. Kit colliders + ROLL_COEF re-tuning are expected to
 * move the drop-ramp numbers DOWN toward the target; the free-drop pins are
 * launch-artifact tripwires (~0 + 0.2 m creep band), not ceilings on
 * legitimate progress (review finding 6).
 */
const MEASURED_DROP_ROLL_RAYCAST_M = 0.0;
const MEASURED_DROP_ROLL_WHEEL_M = 0.0;
const MEASURED_RAMP_ROLL_RAYCAST_M = 8.46;
const MEASURED_RAMP_ROLL_WHEEL_M = 5.87;

/** Regression band: +/-15% of today's measured value on the same rig. */
const DRIFT_TOL = 1.15;

describe('feel harness determinism', () => {
  it('produces bit-identical state hashes across repeat runs (raycast)', () => {
    const a = feelTrackRun('raycastWheels');
    const b = feelTrackRun('raycastWheels');
    expect(a.hash).toBe(b.hash);
    expect(a.hash).toMatch(/^[0-9a-f]{8}$/);
  }, 120_000);

  it('produces bit-identical state hashes across repeat runs (wheel colliders)', () => {
    const a = rollRun('wheelColliders');
    const b = rollRun('wheelColliders');
    expect(a.hash).toBe(b.hash);
  }, 120_000);
});

describe('quant() NaN poisoning (review finding 7)', () => {
  it('maps NaN to a distinct poison word, never to the 0 word', () => {
    expect(quant(0, 1e-4)).toBe(0);
    expect(quant(Number.NaN, 1e-4)).not.toBe(0);
    expect(quant(Number.POSITIVE_INFINITY, 1e-4)).not.toBe(0);
    expect(quant(Number.NEGATIVE_INFINITY, 1e-4)).not.toBe(0);
    // distinct from each other and from every finite word they could shadow
    expect(quant(Number.NaN, 1e-4)).not.toBe(quant(Number.POSITIVE_INFINITY, 1e-4));
    expect(quant(Number.NaN, 1e-4)).not.toBe(quant(Number.NEGATIVE_INFINITY, 1e-4));
  });
});

describe('free-drop roll rig (no launch velocity — review finding 1)', () => {
  it('raycast variant: finite travel after touchdown, no launch artifact', () => {
    const r = rollRun('raycastWheels');
    const d = r.rollDistance as number;
    expect(r.rollDistance).not.toBeNull();
    expect(Number.isFinite(d)).toBe(true);
    // Measured 0.00 m; a symmetric vertical drop cannot produce forward
    // travel. The +0.2 m band is a launch-artifact tripwire: if a release
    // velocity ever leaks back into this rig (stage 1 reported 0.61 m of
    // buried creep here), it goes red. No upside-down ceiling on progress:
    // the 2.5 m target is asserted by the drop-ramp rig below.
    expect(d).toBeLessThan(MEASURED_DROP_ROLL_RAYCAST_M + 0.2);
  }, 120_000);

  it('wheel-collider variant: finite travel after touchdown, deterministic', () => {
    const a = rollRun('wheelColliders');
    const b = rollRun('wheelColliders');
    expect(a.rollDistance).not.toBeNull();
    expect(Number.isFinite(a.rollDistance as number)).toBe(true);
    expect(a.rollDistance as number).toBeLessThan(MEASURED_DROP_ROLL_WHEEL_M + 0.2);
    expect(a.hash).toBe(b.hash);
  }, 120_000);
});

describe('drop-ramp roll rig — brief §7.1 metric (target ~2.5 m)', () => {
  it('raycast variant passes the acceptance floor and stays in its drift band', () => {
    const d = rampRollRun('raycastWheels').rollDistance as number;
    expect(Number.isFinite(d)).toBe(true);
    // Acceptance floor: 85% of target. Green today (8.46 m overshoot) AND
    // green the day tuning/kit lands ~2.5 m; red on a stuck car.
    expect(d).toBeGreaterThanOrEqual(0.85 * TARGET_ROLL_M);
    // Regression ceiling: a 15%-worse roll than the pinned honest value
    // means something started stealing energy. (If the kit removes seam
    // losses and this fires while mu is still 0.02, the fix is ROLL_COEF
    // re-tuning, not a band relaxation.)
    expect(d).toBeLessThanOrEqual(MEASURED_RAMP_ROLL_RAYCAST_M * DRIFT_TOL);
  }, 120_000);

  it('wheel-collider variant (REAL wheel colliders + friction) ploughs the chord slabs, as documented', () => {
    const d = rampRollRun('wheelColliders').rollDistance as number;
    expect(Number.isFinite(d)).toBe(true);
    expect(d).toBeGreaterThanOrEqual(0.85 * TARGET_ROLL_M);
    expect(d).toBeLessThanOrEqual(MEASURED_RAMP_ROLL_WHEEL_M * DRIFT_TOL);
    // The plough gap vs the raycast variant (8.46 - 5.87 = 2.59 m, ~31%) is
    // expected on hand-chorded slabs and is a WHY of the track kit, not a
    // bug to tune around. See Modules/physics.md.
  }, 120_000);
});

describe('scenario smoke', () => {
  it('feel-track runs complete without NaN and record a peak speed', () => {
    const r = feelTrackRun('raycastWheels');
    expect(Number.isFinite(r.peakSpeed)).toBe(true);
    expect(r.peakSpeed).toBeGreaterThan(1);
    expect(r.hash).toMatch(/^[0-9a-f]{8}$/);
    // Stage-2 acceptance (PROMPT §7): the raycast car FINISHES the kit
    // feel track — drop, loop, gap jump, landing, into the finish cup —
    // headless on the kit colliders, deterministically.
    expect(r.completed).toBe(true);
    expect((r.timeToFinish as number)).toBeLessThan(10);
    const again = feelTrackRun('raycastWheels');
    expect(again.hash).toBe(r.hash);
  }, 120_000);
});
