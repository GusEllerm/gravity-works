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
 * Measured 2026-10-05 (npm run feel, honest rigs, ROLL_COEF = 0.12, after
 * the SIM_SCALE velocity-mapping fix - toWorldSpeed divided by sqrt(S)
 * instead of S, which had inflated every reported speed 3.16x and silently
 * tuned mu against a lie):
 *   free-drop: wheelColliders 0.00 m | raycastWheels 0.00 m (symmetry)
 *   drop-ramp: wheelColliders 2.49 m | raycastWheels 2.49 m
 *   - the §7.1 target of ~2.5 m is now MET (2.49 m, within 1%).
 *   feel track: raycastWheels COMPLETES (3.31 s) with the cup requiring deck
 *         contact, not just proximity; wheelColliders DNF unchanged.
 *   loop: the honest gate (inverted + deck-loaded + speed floor AT the apex)
 *         is in place and the 1.41 R ballistic-interior exploit is CLOSED
 *         (see the loop-gate describe below); the bisected shipped-friction
 *         threshold on the friction-aware loop rig is 2.30 R — inside the
 *         §7.1 band, now ASSERTED via bracketed wings, not prose.
 *   determinism: bit-identical state hashes across repeat runs  PASS
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { feelTrackRun, loopGateWings, loopThreshold, loopTry, simulate, ROLL_COEF, rampRollRun, rollRun, APEX_UP_MAX, APEX_SPEED_EPS, APEX_FORCE_MIN } from '../../src/feel/run.ts';
import { LOOP_BAND_OVER_R, LOOP_GATE_BRACKET_OVER_R, LOOP_RADIUS, loopRig } from '../../src/feel/feeltrack.ts';
import { initRapier, quant } from '../../src/physics/sim.ts';

beforeAll(async () => {
  await initRapier();
}, 60_000);

/** The bible target: roll ~2.5 m (world) from a 30 cm drop. */
const TARGET_ROLL_M = 2.5;

/**
 * Launch-artifact tripwires for the free-drop rig — NOT measurements (the
 * symmetric rig's honest reading is ~0 m by momentum conservation; see the
 * file header). Renamed from MEASURED_DROP_ROLL_* at the stage-2 review,
 * which correctly objected that a 0.0 tripwire band does not deserve the
 * name MEASURED. The drop-ramp pins below are the measured values.
 */
const FREE_DROP_LAUNCH_TRIPWIRE_RAYCAST_M = 0.0;
const FREE_DROP_LAUNCH_TRIPWIRE_WHEEL_M = 0.0;
const MEASURED_RAMP_ROLL_RAYCAST_M = 2.49;
const MEASURED_RAMP_ROLL_WHEEL_M = 2.49;

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
    expect(d).toBeLessThan(FREE_DROP_LAUNCH_TRIPWIRE_RAYCAST_M + 0.2);
  }, 120_000);

  it('wheel-collider variant: finite travel after touchdown, deterministic', () => {
    const a = rollRun('wheelColliders');
    const b = rollRun('wheelColliders');
    expect(a.rollDistance).not.toBeNull();
    expect(Number.isFinite(a.rollDistance as number)).toBe(true);
    expect(a.rollDistance as number).toBeLessThan(FREE_DROP_LAUNCH_TRIPWIRE_WHEEL_M + 0.2);
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

  it('wheel-collider variant rolls within one band of the raycast variant', () => {
    const d = rampRollRun('wheelColliders').rollDistance as number;
    expect(Number.isFinite(d)).toBe(true);
    expect(d).toBeGreaterThanOrEqual(0.85 * TARGET_ROLL_M);
    expect(d).toBeLessThanOrEqual(MEASURED_RAMP_ROLL_WHEEL_M * DRIFT_TOL);
    // 2026-10-05: measured 2.49 m - the same as the raycast variant. The
    // earlier 2.59 m "plough gap" against 8.46 m was the sqrt-S speed-map
    // bug inflating the raycast number; both variants now report the same
    // honest travel.
  }, 120_000);
});

describe('loop gate honesty (stage-2 audit)', () => {
  // The stage-2 audit (session log 2026-10-05): the old gate counted any
  // state whose ARC PROJECTION passed the exit station. A car released at
  // 1.41 R flew ballistically through the loop interior - never inverted,
  // never touching the deck - and the global rail projection teleported
  // its arc past the exit. The hardened gate demands, AT the apex: chassis
  // inverted (upY <= APEX_UP_MAX), deck structurally LOADED (support
  // force >= APEX_FORCE_MIN, not mere ray proximity), and speed at or
  // above the dry-loop floor sqrt(g r) (1 + APEX_SPEED_EPS).
  const R = 0.09; // a radius at which the car geometry is non-degenerate

  it('the exploit that passed at 1.41 R is closed on both variants', () => {
    // The exact family of run that the old gate scored as a 1.41 R lap.
    expect(loopTry('raycastWheels', R, 1.41 * R, 0.12)).toBe(false);
    expect(loopTry('wheelColliders', R, 1.41 * R, 0.12)).toBe(false);
  }, 120_000);

  it('gate physics constants encode the theory, not a plucked number', () => {
    // inverted at the apex is half-way or worse (cos 120 deg = -0.5)
    expect(APEX_UP_MAX).toBeLessThanOrEqual(-0.5);
    // the speed floor is sqrt(g r) with only a small sampling margin
    expect(APEX_SPEED_EPS).toBeGreaterThan(0);
    expect(APEX_SPEED_EPS).toBeLessThan(0.1);
    // "deck loaded" must be far above a settled car's idle m*g_sim and
    // far above anything a grazing ray hit can fake
    expect(APEX_FORCE_MIN).toBeGreaterThanOrEqual(400);
  });

  // The 2026-10-06 energy audit closed the injection that used to sit under
  // this number (tools/feel.mjs `audit`, and the session log): the ring-entry
  // contact solved its GEOMETRY reading as a velocity-free position
  // projection, which spent k*u*dt as fresh kinetic energy - +1.03 J/kg in
  // ONE step at the ramp-to-ring junction, about half the energy of the whole
  // lap. With the guide contact solved as a capped, work-conjugate bump and
  // the strut damper made provably dissipative, the threshold moved onto the
  // theory's own ground: what the drop can honestly PAY for.
  //
  // What the grid measures now, stated plainly (raycast variant; the jointed
  // variant agrees at every height asserted below):
  //
  //   h/R   2.0  2.2  2.3  2.4  2.5  2.6  2.8  3.0  3.5  4.0 ... 7.0
  //        n    n    Y    Y    n    Y    Y    n    n    Y  ...  Y
  //
  // The bisected threshold (friction-aware loop rig, shipped ROLL_COEF —
  // the one canonical rig, see Modules/feel.md §Loop threshold) is 2.30 R,
  // inside the §7.1 band asserted via LOOP_BAND_OVER_R below. The
  // mid-window n rows are real and stay stated: at some releases the first
  // ring chord lands in the wheel's bounce phase where the entry bump eats
  // the margin (apexContact fires, apexFloor does not). That phase
  // sensitivity is chassis-suspension physics, not a scoring artifact - a
  // dip row proves the gate can say NO at a height ABOVE the threshold,
  // which no energy-gaming solver ever needed to do. Because the predicate
  // is monotone only IN PRACTICE, the bisection runs inside an explicitly
  // bracketed window whose wings are probed every run (low wing FAILS, high
  // wing COMPLETES): the converged value is a completion edge, not a dip
  // artifact — the stage-2 review's MAJOR was that the old bisect was
  // checked only for FINITENESS and its bracket spanned the dip structure.
  it('loop threshold is bounded honestly - and its witnesses are real', () => {
    for (const variant of ['raycastWheels', 'wheelColliders'] as const) {
      // Bracket wings, probed on the spot (monotone direction: higher
      // release -> completes). If either wing flips, the bracket is no
      // longer honest ground for a bisection and this goes red.
      const wings = loopGateWings(variant, LOOP_RADIUS);
      expect(wings.low, 'low wing must fail').toBe(false);
      expect(wings.high, 'high wing must complete').toBe(true);
      // The true bisection inside the asserted bracket.
      const t = loopThreshold(variant, LOOP_RADIUS, {
        lo: LOOP_GATE_BRACKET_OVER_R[0] * LOOP_RADIUS,
        hi: LOOP_GATE_BRACKET_OVER_R[1] * LOOP_RADIUS,
        iters: 7,
      });
      // THE accept line (§7.1, asserted not prose): the converged, witness-
      // proven, shipped-friction threshold lands in the [2.25, 2.75] R band.
      expect(t.heightOverR).toBeGreaterThanOrEqual(LOOP_BAND_OVER_R[0]);
      expect(t.heightOverR).toBeLessThanOrEqual(LOOP_BAND_OVER_R[1]);
      // Measured edge, both variants: 2.2 R of drop fails, 2.4 R completes.
      expect(loopTry(variant, LOOP_RADIUS, 2.2 * LOOP_RADIUS, ROLL_COEF)).toBe(false);
      expect(loopTry(variant, LOOP_RADIUS, 2.4 * LOOP_RADIUS, ROLL_COEF)).toBe(true);
      // The number is only worth anything if a completing lap had to PROVE it:
      // inverted attitude, deck loaded, and the exit witness, all in one run.
      const rig = loopRig(2.4 * LOOP_RADIUS, LOOP_RADIUS);
      const run = simulate(rig, {
        variant,
        coef: ROLL_COEF,
        timeout: 8,
        exitAt: rig.marks.loopEnd + 0.4,
        exitX: rig.poseAt(rig.marks.loopEnd + 0.4).p.x / 10,
        apexAt: rig.marks.loopApex,
        apexRadius: LOOP_RADIUS,
      });
      expect(run.completed).toBe(true);
      expect(run.witnesses.apexContact).toBe(true);
      expect(run.witnesses.apexFloor).toBe(true);
      expect(run.witnesses.exit).toBe(true);
      // and the speed it proved at the apex is above the sqrt(gR) floor
      expect(run.apexSpeed).not.toBeNull();
      expect(run.apexSpeed!).toBeGreaterThanOrEqual(Math.sqrt(9.81 * LOOP_RADIUS));
    }
  }, 240_000);

  // The old 7 R "ceiling" (arriving too fast throws the car out of the ring)
  // was itself part of the injection story: the same solver step that handed
  // the car energy at entry also kicked it off the deck at exit, and the two
  // artifacts framed a window that the honest contacts do not have. With the
  // audited solver the car holds the ring at every release through 7 R - the
  // physical up-stop ceiling is still OPEN engineering, and saying so in a
  // test is what keeps "no ceiling" from being read as a claim about real
  // cars, which fly out of loops exactly when v^2/R drops below g.
  it('the audited solver holds the ring through 7 R - the old ceiling was solver-made', () => {
    expect(loopTry('raycastWheels', LOOP_RADIUS, 7.0 * LOOP_RADIUS, ROLL_COEF)).toBe(true);
    expect(loopTry('wheelColliders', LOOP_RADIUS, 7.0 * LOOP_RADIUS, ROLL_COEF)).toBe(true);
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
    // The gap jump must actually be FLEEN: the landing impulse was 0.0000
    // for all of stage 2 because (a) the airborne window compared a world
    // x against an arc length and never opened, (b) the flight streak was
    // checked on the landing step itself, where it has already reset, and
    // (c) the landing deck sat ABOVE the lip's ballistic arc, so the car
    // rode the landing face instead of landing on it. All three are fixed
    // (arc-vs-x in run.ts, running-max streak, and a kit `drop` catch piece
    // in the chain); the metric now reads a real impulse off a real ~0.2 s
    // flight.
    expect(r.landingImpulse).toBeGreaterThan(0);
    const again = feelTrackRun('raycastWheels');
    expect(again.hash).toBe(r.hash);
  }, 120_000);
});
