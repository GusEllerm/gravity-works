/**
 * Crutch-ablation matrix (stage-2 review MAJOR: "every fix is documented,
 * none is removal-tested"). Each case flips ONE switch of the exported
 * test-only `__ABLATE` config in `src/physics/car.ts` (see its doc —
 * env-var-free, restored after every case) and re-runs the shipped feel
 * track plus the loop rig at the threshold row. The results table lives in
 * `docs/vault/Modules/physics.md` §Ablation; THIS file is its evidence.
 *
 * What the assertions PIN:
 *  - a crutch measured DNF here is LOAD-BEARING: it cannot be deleted
 *    without this test going red;
 *  - a crutch measured "completes, small delta" is NOT load-bearing for
 *    completion, and the delta band catches the day it starts mattering;
 *  - a crutch measured bit-identical is INERT on every rig we ship today —
 *    exactly the kind of term the review called folklore until measured.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { __ABLATE } from '../../src/physics/car.ts';
import { feelTrackRun, loopTry, ROLL_COEF } from '../../src/feel/run.ts';
import { LOOP_RADIUS } from '../../src/feel/feeltrack.ts';

beforeAll(async () => {
  const { initRapier } = await import('../../src/physics/sim.ts');
  await initRapier();
}, 60_000);

/** Shipped configuration — restored after EVERY case. */
const SHIPPED = { ...__ABLATE };
afterAll(() => Object.assign(__ABLATE, SHIPPED));

// The matrix itself is the four `it` cases below — each asserts its own
// measured verdict (see the table in Modules/physics.md §Crutch ablation).

const runFeel = () => feelTrackRun('raycastWheels');

describe('crutch-ablation matrix', () => {
  it('the shipped configuration completes the feel track (baseline)', () => {
    const r = runFeel();
    expect(r.completed).toBe(true);
    expect(r.timeToFinish!).toBeLessThan(3.6);
    expect(r.hash).toBe('90d4cd69'); // the published feel-table hash: the
    // __ABLATE hook itself must not perturb a single float when untouched
  }, 120_000);

  it('wishbone lead 1.5 is load-bearing: lead 2 does not finish at all', () => {
    Object.assign(__ABLATE, { wishboneLead: 2 });
    try {
      expect(runFeel().completed).toBe(false);
      // and it costs the loop the threshold row too (feel track lead runs
      // level into the ring, where the rotor mode slams every riser)
      expect(loopTry('raycastWheels', LOOP_RADIUS, 2.4 * LOOP_RADIUS, ROLL_COEF)).toBe(false);
    } finally {
      Object.assign(__ABLATE, SHIPPED);
    }
  }, 240_000);

  it('the rotor damper is load-bearing: off, the feel track is DNF', () => {
    Object.assign(__ABLATE, { rotorDamper: false });
    try {
      expect(runFeel().completed).toBe(false);
      expect(loopTry('raycastWheels', LOOP_RADIUS, 2.4 * LOOP_RADIUS, ROLL_COEF)).toBe(false);
    } finally {
      Object.assign(__ABLATE, SHIPPED);
    }
  }, 240_000);

  it('the conjugate damper law is load-bearing on the LOOP metric and cheap on the feel track', () => {
    Object.assign(__ABLATE, { conjDamper: false });
    try {
      const r = runFeel();
      // Feel-track completion barely notices the naive law (+0.07 s measured
      // — the pump-and-burn repays itself on a track without a sustained
      // ring climb)...
      expect(r.completed).toBe(true);
      expect(r.timeToFinish!).toBeGreaterThan(3.28);
      expect(r.timeToFinish!).toBeLessThan(3.55);
      // ...but at the loop threshold row the naive law LOSES the lap: the
      // audit's +1.9/-3.2 J/kg pump-and-burn eats exactly the margin the
      // 2.4 R row runs on. This is why the law stays.
      expect(loopTry('raycastWheels', LOOP_RADIUS, 2.4 * LOOP_RADIUS, ROLL_COEF)).toBe(false);
    } finally {
      Object.assign(__ABLATE, SHIPPED);
    }
  }, 240_000);

  it('the misalignment gate is INERT on every shipped rig (bit-identical)', () => {
    const base = runFeel();
    Object.assign(__ABLATE, { misalignGate: false });
    try {
      const r = runFeel();
      // The gate never fires on the feel track or the loop rig — the car
      // never exceeds ~49 deg of deck misalignment there, so the hash is
      // bit-identical. It is stage-3 insurance (banked yaw arcs), not a
      // crutch today; if the day it matters, this goes red and earns a
      // measured story.
      expect(r.hash).toBe(base.hash);
      expect(loopTry('raycastWheels', LOOP_RADIUS, 2.4 * LOOP_RADIUS, ROLL_COEF)).toBe(true);
    } finally {
      Object.assign(__ABLATE, SHIPPED);
    }
  }, 240_000);
});
