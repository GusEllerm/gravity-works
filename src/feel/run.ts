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
  qrot,
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
  CAR,
  spawnCar,
  type Car,
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
export const ROLL_COEF = 0.02;

export interface RunResult {
  completed: boolean;
  timeToFinish: number | null; // s (sim time == world time by scale design)
  peakSpeed: number; // m/s world
  apexSpeed: number | null; // m/s world at loop apex
  apexMin: number; // sqrt(g r) world
  landingImpulse: number; // N s world
  rollDistance: number | null; // m world — wheel-centre travel after touchdown (roll scenario)
  hash: string;
}

interface RunOpts {
  track: ReturnType<typeof buildFeelTrack>;
  variant: CarVariant;
  coef: number; // rolling-resistance coefficient
  timeout: number; // s
  scenario: 'feel' | 'roll' | 'ramp';
}

/**
 * World metres of deck between the roll-drop release point and `flatEnd`
 * (the ramp's run-out). The stage-1 rig wrote `+2` in SIM units here —
 * 0.2 m, not the 2 m the comment claimed — and measured from `flatEnd`,
 * folding that offset into the result. It is now a world-metre constant and
 * the measurement starts at touchdown instead.
 */
export const ROLL_DECK_OFFSET_M = 2;

/**
 * x of the wheel-centre reference point (m... sim units): variant a averages
 * its four real wheel-body centres; variant b has no wheel bodies, so use
 * the point rigidly attached to the chassis at the axle-plane height
 * (CAR.wheelY below the chassis centre — the same plane the real wheels of
 * variant a ride in).
 */
function wheelRefX(car: Car): number {
  if (car.wheels.length > 0) {
    let sx = 0;
    for (const w of car.wheels) sx += w.translation().x;
    return sx / car.wheels.length;
  }
  const t = car.chassis.translation();
  const r = car.chassis.rotation();
  const off = qrot({ w: r.w, x: r.x, y: r.y, z: r.z }, v(0, CAR.wheelY, 0));
  return t.x + off.x;
}

export function runScenario(opts: RunOpts): RunResult {
  const { track, variant, coef, timeout, scenario } = opts;
  const world = createWorld();
  addStaticBoxes(world, track.boxes);

  let start = track.poses[4] ?? track.poses[0];
  if (scenario === 'roll' && track.marks.flatEnd !== undefined) {
    // The roll test is a TRUE free drop: no launch velocity, chassis dropped
    // flat from DROP_HEIGHT (0.3 m world) above the deck, ROLL_DECK_OFFSET_M
    // (2 m world) down-deck of the ramp run-out, then measured from
    // touchdown. Stage 1 faked this with spawnCar's v0 = 3 launch and a
    // 0.2 m "deck offset" measured from flatEnd (review finding 1).
    // Honest consequence, measured: a symmetric vertical drop converts no
    // drop energy into forward travel - both variants roll ~0.00 m on this
    // rig. The brief's "rolls ~2.5 m from a 30 cm drop" is the RAMP metric
    // (scenario 'ramp' / rampRollRun); it is reported alongside, not hidden.
    const fe = track.marks.flatEnd;
    start = {
      p: { x: fe.p.x + ROLL_DECK_OFFSET_M * S, y: fe.p.y + DROP_HEIGHT * S, z: 0 },
      f: { x: 1, y: 0, z: 0 },
      u: { x: 0, y: 1, z: 0 },
    };
  }
  const car = spawnCar(world, variant, start, {
    launchSpeed: scenario === 'feel' ? undefined : 0,
  });
  const hashBodiesList = [car.chassis, ...car.wheels];

  const finish = track.marks.finish;
  const apex = track.marks.loopApex;
  const gapStart = track.marks.gapStart;

  const maxSteps = Math.round(timeout * 120);
  let hash = 0x811c9dc5 >>> 0;
  let peak = 0;
  let apexSpeed: number | null = null;
  let landImpulse = 0;
  let prevVy = 0;
  let airborneSteps = 0;
  let stoppedSteps = 0;
  let finished = false;
  let touchdownX: number | null = null; // wheel-centre x (sim) at first touchdown

  for (let step = 0; step < maxSteps; step++) {
    const support = carStep(world, car);
    applyRollingResistance(car, support.grounded, coef);
    stepWorld(world);
    if (step % HASH_INTERVAL === 0) hash = hashBodies(hashBodiesList, hash);

    const t = car.chassis.translation();
    const pos = v(t.x, t.y, t.z);
    const speed = carSpeed(car);
    if (speed > peak) peak = speed;

    // roll/ramp rigs: touchdown = first step the suspension finds support
    if (scenario !== 'feel' && touchdownX === null && support.grounded) {
      touchdownX = wheelRefX(car);
      stoppedSteps = 0;
    }

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

    if (scenario !== 'feel') {
      if (touchdownX === null) continue; // still in free fall
      if (speed < 0.08) stoppedSteps++;
      else stoppedSteps = 0;
      if (stoppedSteps > 40) {
        break;
      }
    }
    // fell off the set
    if (t.y < -8) break;
  }

  let rollDistance: number | null = null;
  if (scenario !== 'feel' && touchdownX !== null) {
    // Honest measure: wheel-centre travel since touchdown (stage 1 measured
    // from flatEnd and included the pre-release launch offset).
    rollDistance = toWorldDist(Math.abs(wheelRefX(car) - touchdownX));
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
 * The brief §7.1 metric done honestly: release FROM REST at the top of the
 * 30 cm drop ramp (no launch velocity, same reference pose index as the feel
 * track's start), roll down onto the flat, and report wheel-centre travel
 * from touchdown to stop. This is the rig the ~2.5 m target is actually
 * about; the vertical 'roll' drop above can only ever measure ~0 m of
 * forward travel (a symmetric drop carries zero horizontal momentum).
 */
export function rampRollRun(variant: CarVariant): RunResult {
  return runScenario({
    track: buildRollTrack(),
    variant,
    coef: ROLL_COEF,
    timeout: 30,
    scenario: 'ramp',
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
