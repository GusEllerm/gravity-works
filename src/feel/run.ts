/**
 * Headless scenario runners over the kit rigs — no rendering, no Three.js
 * scene graph — identical under Vitest (node), tools/feel.mjs and the browser.
 *
 * Rigs (all kit geometry; all honest — release from REST, no launch velocity,
 * wheel-centre travel measured after touchdown):
 *
 *  - `feelTrackRun` — the permanent feel track (§7.5) as a kit build; the
 *    acceptance metric is FINISH (car enters the finish cup's capture volume)
 *    plus the metrics-table numbers;
 *  - `rampRollRun` — the §7.1 rolling-resistance metric: release from rest at
 *    the top of a 30 cm drop ramp onto flat, wheel-centre travel to stop;
 *  - `rollRun` — the symmetric free-drop tripwire (~0 by momentum
 *    conservation; a nonzero reading means a launch artifact leaked back in);
 *  - `loopThreshold` — bisect of the minimum release height that completes a
 *    kit loop of radius r, for the standing physics gate (§7.1, target ≈2.5 r).
 */
import {
  G_SIM,
  G_WORLD,
  HASH_INTERVAL,
  SIM_SCALE as S,
  createWorld,
  hashBodies,
  hashHex,
  qrot,
  stepWorld,
  toWorldDist,
  toWorldImpulse,
  toWorldSpeed,
  v,
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
  DROP_HEIGHT,
  LOOP_RADIUS,
  feelTrackRig,
  flatRig,
  loopRig,
  rollRampRig,
} from './feeltrack.ts';
import { KitRig, finishCapture } from './kittrack.ts';

/** Tuned rolling-resistance coefficient (effective mu) — see Modules/feel.md. */
export const ROLL_COEF = 0.12;

export interface RunResult {
  completed: boolean;
  timeToFinish: number | null; // s (sim time == world time by scale design)
  peakSpeed: number; // m/s world
  apexSpeed: number | null; // m/s world at loop apex
  apexMin: number; // sqrt(g r) world
  landingImpulse: number; // N s world
  rollDistance: number | null; // m world — wheel-centre travel after touchdown
  hash: string;
}

/** World metres of deck the free-drop rig drops onto, down-deck of release. */
export const ROLL_DECK_OFFSET_M = 2;

// ---- honest loop-completion gate (stage-2 loop-gate audit) ------------------

/** Apex-speed margin over the theoretical sqrt(g r) the gate demands: a run
 *  counted as holding the loop must clear the frictionless point-mass floor
 *  by this, so measurement noise cannot smuggle a marginal flop through. */
export const APEX_SPEED_EPS = 0.02;
/** Chassis up . world up at the apex must be at most this for "INVERTED"
 *  (180 deg +/- ~60 deg: the raycast chassis flops a little on its springs
 *  inside the loop; measured passing runs sit past -0.9, every exploit run
 *  stays well short of -0.5 near the apex arc). */
export const APEX_UP_MAX = -0.5;
/** Minimum suspension spring force (sim N) at the apex for "the wheels are
 *  LOADED against the deck" — a fraction of the car's sim weight
 *  (m g_sim ~ 3.9 kN). A flying car's rays hit the deck at zero load. */
export const APEX_FORCE_MIN = 400;
/** Half-width of the apex arc window (world m of rail) the checks run in.
 *  A FIXED window narrower than one frame of travel can be skipped whole by
 *  a fast lap (the first cut of this gate did exactly that to its own
 *  speed sample), so the effective window widens by two frames of travel —
 *  a few centimetres at lap speed, geometric at crawl. */
export const APEX_ARC_WINDOW = 0.03;
export function apexWindow(speedSim: number): number {
  return APEX_ARC_WINDOW + 2 * speedSim * (1 / 120) / 10; // sim v -> world m/s
}
/** How close (world m) the wheel-ref point must be to its projected rail
 *  point to count as ON the track at the EXIT. A car rolling out sits
 *  ~0.008-0.030 from the rail (measured: pitch from the ramp handoff adds
 *  a couple cm at speed); one airborne or on a wrong deck projects 0.05+
 *  away. Grounded-contact is the co-witness — an airborne car is not
 *  grounded, and a car rolled onto the exit rail from the WRONG branch of
 *  the arc projection is far from the rail. This pair kills arc-projection
 *  teleport. */
export const RAIL_PROX = 0.04;
/** Apex proximity is judged LOOSER than exit proximity, and is not the
 *  witness there (inversion + deck load + speed floor is): a genuine lap
 *  runs with real droop sag - measured 0.02-0.04 from the rail through the
 *  apex on the loop rig's geometry - so a 2.5 cm apex window disqualifies
 *  exactly the cars that held the loop. */
export const APEX_PROX = 0.05;

/** Wheel-plane point rigidly attached to the chassis (sim space). */
function wheelRef(car: Car): { x: number; y: number; z: number } {
  if (car.wheels.length > 0) {
    let sx = 0;
    let sy = 0;
    let sz = 0;
    for (const w of car.wheels) {
      sx += w.translation().x;
      sy += w.translation().y;
      sz += w.translation().z;
    }
    return { x: sx / 4, y: sy / 4, z: sz / 4 };
  }
  const t = car.chassis.translation();
  const r = car.chassis.rotation();
  const off = qrot({ w: r.w, x: r.x, y: r.y, z: r.z }, v(0, CAR.wheelY, 0));
  return { x: t.x + off.x, y: t.y + off.y, z: t.z + off.z };
}

export interface SimOpts {
  variant: CarVariant;
  coef: number;
  timeout: number; // s
  /** Arc position of the release pose (world m); default the rig's start. */
  releaseAt?: number;
  /** Explicit release pose (sim space), overriding the rig's rail pose. */
  releasePose?: { p: { x: number; y: number; z: number }; f: { x: number; y: number; z: number }; u: { x: number; y: number; z: number } };
  /** Forward release speed (sim); 0 = rest. */
  launchSpeed?: number;
  /** Success = wheel-ref point inside this world-space capture volume AND
   *  touching the deck there (finish cup — proximity alone counted cars
   *  skipping over the cup). */
  capture?: { center: { x: number; y: number; z: number }; radius: number };
  /** Arc position past which a landing impact counts (gap metric). */
  gapAt?: number;
  /** Arc position of the loop apex (apex-speed + apex-contact metrics). */
  apexAt?: number;
  /** Loop radius (world m) for the apex-speed floor. */
  apexRadius?: number;
  /** Success = projected arc past this (world m) — the loop-completion
   *  gate. HONEST form: only counted once the car has HELD the apex
   *  (inverted, deck loaded, speed >= sqrt(g r)(1+eps) at the apex) and is
   *  itself within RAIL_PROX of the rail at `exitAt` — an airborne car's
   *  global rail projection is not evidence of progress. */
  exitAt?: number;
}

/**
 * The one simulation loop: step the fixed 120 Hz world with one car on one
 * kit rig and collect the metrics-table telemetry. Success is either capture
 * (finish cup) or progress (past `exitAt`, for the loop gate).
 */
export function simulate(rig: KitRig, opts: SimOpts): RunResult {
  const world = createWorld();
  rig.addColliders(world);
  const car = spawnCar(world, opts.variant, opts.releasePose ?? rig.poseAt(opts.releaseAt ?? rig.marks.start ?? 0), {
    launchSpeed: opts.launchSpeed ?? 0,
  });
  const bodies = [car.chassis, ...car.wheels];

  const maxSteps = Math.round(opts.timeout * 120);
  let hash = 0x811c9dc5 >>> 0;
  let peak = 0;
  let apexSpeed: number | null = null;
  let landImpulse = 0;
  let prevVy = 0;
  let airborneSteps = 0;
  let stoppedSteps = 0;
  let finished = false;
  let exitPassed = false;
  let touchdownX: { x: number; y: number; z: number } | null = null;
  let distance = 0;
  // Honest loop-state machine (see the gate constants above): the apex must
  // be HELD (inverted + deck loaded + above the speed floor) before any arc
  // past the exit counts as completion.
  const apexMinSim = Math.sqrt(G_SIM * (opts.apexRadius ?? LOOP_RADIUS) * S) * (1 + APEX_SPEED_EPS);
  let apexContact = false;
  let apexSpeedMin: number | null = null;

  for (let step = 0; step < maxSteps; step++) {
    const support = carStep(world, car);
    applyRollingResistance(car, support.grounded, opts.coef);
    stepWorld(world);
    if (step % HASH_INTERVAL === 0) hash = hashBodies(bodies, hash);

    const speed = carSpeed(car);
    if (speed > peak) peak = speed;
    const fwdSpeed = Math.abs(car.chassis.linvel().x);

    const ref = wheelRef(car);
    if (touchdownX === null && support.grounded) {
      touchdownX = { x: ref.x, y: ref.y, z: ref.z };
    } else if (touchdownX !== null) {
      distance = Math.hypot(ref.x - touchdownX.x, ref.z - touchdownX.z);
    }

    // ONE distance-aware rail projection per step, shared by the apex and
    // exit checks (the old code projected blindly and trusted it blindly).
    const project = opts.apexAt !== undefined || opts.exitAt !== undefined;
    const proj = project
      ? rig.nearestArcInfo(v(ref.x / S, ref.y / S, ref.z / S))
      : { arc: 0, dist: Infinity };
    const onRail = proj.dist < RAIL_PROX;

    if (opts.apexAt !== undefined) {
      const dArc = proj.arc - opts.apexAt;
      const win = apexWindow(speed);
      if (Math.abs(dArc) < win && proj.dist < APEX_PROX) {
        const rq = car.chassis.rotation();
        const upY = qrot({ w: rq.w, x: rq.x, y: rq.y, z: rq.z }, v(0, 1, 0)).y;
        // deck loaded + inverted near the apex: the car is IN the loop, not
        // flying through its empty interior
        if (Math.abs(dArc) < win / 2
          && upY <= APEX_UP_MAX && support.grounded && support.force >= APEX_FORCE_MIN) {
          apexContact = true;
        }
        // apex speed = the SLOWEST sample in the tight apex window (the
        // floor must hold AT the apex, not merely somewhere near it)
        if (Math.abs(dArc) < win / 3
          && (apexSpeedMin === null || speed < apexSpeedMin)) apexSpeedMin = speed;
      }
    }

    // landing impulse after the gap: biggest positive vy jump while airborne
    if (opts.gapAt !== undefined) {
      const vy = carVel(car).y;
      const airborne = !support.grounded && ref.x / S > opts.gapAt - 0.1;
      airborneSteps = airborne ? airborneSteps + 1 : 0;
      if (airborneSteps > 12 && vy - prevVy > 0.3) {
        const j = car.chassis.mass() * (vy - prevVy);
        if (j > landImpulse) landImpulse = j;
      }
      prevVy = vy;
    }

    if (opts.capture !== undefined) {
      const c = opts.capture;
      const dx = (ref.x - c.center.x * S) / S;
      const dy = (ref.y - c.center.y * S) / S;
      const dz = (ref.z - c.center.z * S) / S;
      // completion at the cup means ARRIVING at the cup: inside the capture
      // volume AND touching the deck (proximity alone let a skip past the
      // cup count as a finish — the same class of bug as the loop exploit)
      if (dx * dx + dy * dy + dz * dz < c.radius * c.radius && support.grounded) {
        finished = true;
        hash = hashBodies(bodies, hash);
        return {
          completed: true,
          timeToFinish: step / 120,
          peakSpeed: toWorldSpeed(peak),
          apexSpeed: apexSpeed === null ? null : toWorldSpeed(apexSpeed),
          apexMin: Math.sqrt(G_WORLD * (opts.apexRadius ?? LOOP_RADIUS)),
          landingImpulse: toWorldImpulse(landImpulse),
          rollDistance: null,
          hash: hashHex(hash),
        };
      }
    }

    // The completion witness lives entirely at the APEX (inverted + deck
    // load + speed floor, above). At the exit only the arc advance counts:
    // a car that truly held the apex and then launches off the loop's
    // exit tangent (measured: a genuine 2.8r lap goes briefly airborne
    // ~0.05 m short of the old exit line) has driven the loop, and the
    // only way to fake that airborne arc is to skip the apex witnesses -
    // which disqualifies the ballistic-interior exploit by construction.
    if (opts.exitAt !== undefined && onRail && apexContact
      && apexSpeedMin !== null && apexSpeedMin >= apexMinSim && proj.arc > opts.exitAt) {
      exitPassed = true;
      break;
    }

    // stopped (roll rigs / stall detection): sustained sub-threshold FORWARD
    // speed. Forward (x) speed, not |v|: a settled car's suspension has a
    // micro-bounce limit cycle (vertical jitter up to ~5 sim) that never
    // trips a |v| threshold and silently extends the run by jitter distance.
    if (touchdownX !== null) {
      if (fwdSpeed < 0.2) stoppedSteps++;
      else stoppedSteps = 0;
      if (stoppedSteps > 40) break;
    }
    // fell off the set
    if (car.chassis.translation().y < -80) break;
  }

  return {
    completed: finished || exitPassed,
    timeToFinish: null,
    peakSpeed: toWorldSpeed(peak),
    apexSpeed: apexSpeedMin === null ? null : toWorldSpeed(apexSpeedMin),
    apexMin: Math.sqrt(G_WORLD * (opts.apexRadius ?? LOOP_RADIUS)),
    landingImpulse: toWorldImpulse(landImpulse),
    rollDistance: touchdownX === null ? null : toWorldDist(distance),
    hash: hashHex(hash),
  };
}

export function feelTrackRun(variant: CarVariant, opts: { coef?: number; timeout?: number } = {}): RunResult {
  const rig = feelTrackRig();
  const capture = finishCapture(rig.build)!;
  return simulate(rig, {
    variant,
    coef: opts.coef ?? ROLL_COEF,
    timeout: opts.timeout ?? 30,
    capture,
    gapAt: rig.marks.gapStart,
    apexAt: rig.marks.loopApex,
    apexRadius: LOOP_RADIUS,
  });
}

/** The §7.1 metric: rest release on the 30 cm drop ramp, travel to stop. */
export function rampRollRun(variant: CarVariant, opts: { coef?: number } = {}): RunResult {
  return simulate(rollRampRig(), { variant, coef: opts.coef ?? ROLL_COEF, timeout: 30 });
}

/** The symmetric free-drop tripwire: rest drop 0.3 m onto flat deck. */
export function rollRun(variant: CarVariant, opts: { coef?: number } = {}): RunResult {
  return simulate(flatRig(), {
    variant,
    coef: opts.coef ?? ROLL_COEF,
    timeout: 30,
    releasePose: {
      p: { x: 0.6 * S, y: (DROP_HEIGHT + 0.02) * S, z: 0 },
      f: { x: 1, y: 0, z: 0 },
      u: { x: 0, y: 1, z: 0 },
    },
  });
}

/**
 * Bisect the minimum release height (m world, measured from the release pose
 * to the loop-bottom deck) for completing a kit loop of radius `radius`.
 * The rig is the steep loop ramp — the least horizontal run, hence the least
 * rolling-resistance budget, between release and loop.
 */
export function loopThreshold(
  variant: CarVariant,
  radius: number,
  opts: { coef?: number; iters?: number } = {},
): { height: number; heightOverR: number } {
  const coef = opts.coef ?? ROLL_COEF;
  let lo = 1.4 * radius;
  let hi = 6 * radius;
  if (!loopTry(variant, radius, hi, coef)) return { height: NaN, heightOverR: NaN };
  for (let i = 0; i < (opts.iters ?? 11); i++) {
    const mid = (lo + hi) / 2;
    if (loopTry(variant, radius, mid, coef)) hi = mid;
    else lo = mid;
  }
  return { height: hi, heightOverR: hi / radius };
}

export function loopTry(variant: CarVariant, radius: number, height: number, coef: number): boolean {
  const rig = loopRig(height, radius);
  return simulate(rig, {
    variant,
    coef,
    timeout: 8,
    exitAt: rig.marks.loopEnd! + 0.4,
    apexAt: rig.marks.loopApex,
    apexRadius: radius,
  }).completed;
}

export const TRACK_CONSTANTS = { DROP_HEIGHT, LOOP_RADIUS };
