/**
 * Headless scenario runners + metrics for the stage-1 bake-off. No rendering,
 * no Three.js — physics only, so this runs identically under Vitest (node),
 * tools/feel.mjs and (later) the browser.
 */
import {
  SIM_SCALE as S,
  addStaticBoxes,
  createWorld,
  hashBodies,
  hashHex,
  HASH_INTERVAL,
  stepWorld,
  toWorldDist,
  toWorldImpulse,
  toWorldSpeed,
  v,
  vsub,
  G_WORLD,
} from '../physics/sim.ts';
import {
  applyRollingResistance,
  carSpeed,
  carStep,
  carVel,
  spawnCar,
  type CarVariant,
} from '../physics/car.ts';
import {
  buildFeelTrack,
  buildLoopTrack,
  buildRollTrack,
  DROP_HEIGHT,
  DROP_RAMP_ANGLE,
  LOOP_RADIUS,
} from './feeltrack.ts';

/** Tuned rolling-resistance coefficient (effective mu) — see Feel.md metrics. */
export let ROLL_COEF = 0.02;
export function setRollCoef(c: number): void {
  ROLL_COEF = c;
}

export interface RunResult {
  completed: boolean;
  timeToFinish: number | null; // s (sim time == world time by scale design)
  peakSpeed: number; // m/s world
  apexSpeed: number | null; // m/s world at loop apex
  apexMin: number; // sqrt(g r) world
  landingImpulse: number; // N s world
  rollDistance: number | null; // m world (roll scenario)
  hash: string;
}

interface RunOpts {
  track: ReturnType<typeof buildFeelTrack>;
  variant: CarVariant;
  coef: number; // rolling-resistance coefficient
  timeout: number; // s
  scenario: 'feel' | 'roll';
  startOffset?: number; // sim units along the track from pose 0
}

export function runScenario(opts: RunOpts): RunResult {
  const { track, variant, coef, timeout, scenario } = opts;
  const world = createWorld();
  addStaticBoxes(world, track.boxes);

  let start = track.poses[opts.startOffset ?? 4] ?? track.poses[0];
  if (scenario === 'roll' && track.marks.flatEnd !== undefined) {
    // The roll test is a 0.3 m (world) free drop onto the flat deck, 2 m of
    // deck before the measured stretch - NOT the feel track's big ramp.
    const fe = track.marks.flatEnd;
    start = {
      p: { x: fe.p.x + 2, y: fe.p.y + 0.3 * S, z: 0 },
      f: { x: 1, y: 0, z: 0 },
      u: { x: 0, y: 1, z: 0 },
    };
  }
  const car = spawnCar(world, variant, start);
  const hashBodiesList = [car.chassis, ...car.wheels];

  const finish = track.marks.finish;
  const apex = track.marks.loopApex;
  const gapStart = track.marks.gapStart;
  const flatEnd = track.marks.flatEnd;

  const maxSteps = Math.round(timeout * 120);
  let hash = 0x811c9dc5 >>> 0;
  let peak = 0;
  let apexSpeed: number | null = null;
  let landImpulse = 0;
  let prevVy = 0;
  let airborneSteps = 0;
  let stoppedSteps = 0;
  let finished = false;

  for (let step = 0; step < maxSteps; step++) {
    const support = carStep(world, car);
    applyRollingResistance(car, support.grounded, coef);
    stepWorld(world);
    if (step % HASH_INTERVAL === 0) hash = hashBodies(hashBodiesList, hash);

    const t = car.chassis.translation();
    const pos = v(t.x, t.y, t.z);
    const speed = carSpeed(car);
    if (speed > peak) peak = speed;

    // loop apex: first measurement near the apex pose, high in the loop
    if (
      apexSpeed === null &&
      apex !== undefined &&
      Math.abs(pos.x - apex.p.x) < 0.6 &&
      pos.y > apex.p.y - 0.3
    ) {
      apexSpeed = speed;
    }

    // landing: after the gap, a big positive jump in vertical velocity
    const vy = carVel(car).y;
    if (gapStart !== undefined && pos.x > gapStart.p.x - 0.5) {
      const grounded = support.grounded;
      airborneSteps = grounded ? 0 : airborneSteps + 1;
      if (airborneSteps > 12 && vy - prevVy > 0.3) {
        const j = car.chassis.mass() * (vy - prevVy);
        if (j > landImpulse) landImpulse = j;
      }
    }
    prevVy = vy;

    if (finish !== undefined) {
      const d = vsub(pos, finish.p);
      if (d.x * d.x + d.y * d.y + d.z * d.z < 0.36 * 0.36) {
        finished = true;
        hash = hashBodies(hashBodiesList, hash);
        return {
          completed: true,
          timeToFinish: step / 120,
          peakSpeed: toWorldSpeed(peak),
          apexSpeed: apexSpeed === null ? null : toWorldSpeed(apexSpeed),
          apexMin: Math.sqrt(G_WORLD * LOOP_RADIUS),
          landingImpulse: toWorldImpulse(landImpulse),
          rollDistance: null,
          hash: hashHex(hash),
        };
      }
    }

    if (scenario === 'roll') {
      if (speed < 0.08) stoppedSteps++;
      else stoppedSteps = 0;
      if (stoppedSteps > 40) {
        break;
      }
    }
    // fell off the set
    if (t.y < -8) break;
  }

  const t = car.chassis.translation();
  let rollDistance: number | null = null;
  if (scenario === 'roll' && track.marks.flatEnd !== undefined) {
    rollDistance = toWorldDist(Math.max(0, t.x - flatEnd.p.x));
  }
  return {
    completed: finished,
    timeToFinish: null,
    peakSpeed: toWorldSpeed(peak),
    apexSpeed: apexSpeed === null ? null : toWorldSpeed(apexSpeed),
    apexMin: Math.sqrt(G_WORLD * LOOP_RADIUS),
    landingImpulse: toWorldImpulse(landImpulse),
    rollDistance,
    hash: hashHex(hash),
  };
}

export function feelTrackRun(variant: CarVariant): RunResult {
  return runScenario({
    track: buildFeelTrack(),
    variant,
    coef: ROLL_COEF,
    timeout: 12,
    scenario: 'feel',
  });
}

export function rollRun(variant: CarVariant): RunResult {
  return runScenario({
    track: buildRollTrack(),
    variant,
    coef: ROLL_COEF,
    timeout: 30,
    scenario: 'roll',
  });
}

/**
 * Bisect the minimum release height (m world) from which the car completes a
 * loop of the given radius. Criterion = drives past the loop exit. Run with
 * coef = 0: this measures the solver's loop physics against theory; with game
 * friction the same bisection lands near 2.8-2.9 r (recorded in the metrics).
 */
export function loopThreshold(
  variant: CarVariant,
  radius: number,
  opts: { coef?: number; iters?: number } = {},
): { height: number; heightOverR: number } {
  const coef = opts.coef ?? 0;
  let lo = 1.6 * radius;
  let hi = 4.5 * radius;
  if (!loopTry(variant, radius, hi, coef)) return { height: NaN, heightOverR: NaN };
  for (let i = 0; i < (opts.iters ?? 11); i++) {
    const mid = (lo + hi) / 2;
    if (loopTry(variant, radius, mid, coef)) hi = mid;
    else lo = mid;
  }
  return { height: hi, heightOverR: hi / radius };
}

function loopTry(variant: CarVariant, radius: number, height: number, coef: number): boolean {
  return loopCompleted(buildLoopTrack(height, radius), variant, coef);
}

function loopCompleted(track: ReturnType<typeof buildLoopTrack>, variant: CarVariant, coef: number): boolean {
  const world = createWorld();
  addStaticBoxes(world, track.boxes);
  const car = spawnCar(world, variant, track.poses[Math.min(8, track.poses.length - 1)]);
  const exit = track.marks.loopEnd;
  const maxSteps = 6 * 120;
  for (let step = 0; step < maxSteps; step++) {
    const support = carStep(world, car);
    applyRollingResistance(car, support.grounded, coef);
    stepWorld(world);
    const t = car.chassis.translation();
    if (t.x > exit.p.x + 0.25 && t.y > -1) return true;
    if (t.y < -6) return false;
  }
  return false;
}

export const TRACK_CONSTANTS = { DROP_HEIGHT, DROP_RAMP_ANGLE, LOOP_RADIUS };
