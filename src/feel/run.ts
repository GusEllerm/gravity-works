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
  type GripField,
} from '../physics/car.ts';
import {
  DROP_HEIGHT,
  LOOP_GATE_BRACKET_OVER_R,
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
  /**
   * Loop rigs only: which gate witness decided the run. `completed` alone
   * cannot tell a car that failed the apex from one that held the apex and
   * then could not get out, and that distinction is the whole argument of the
   * loop gate, so it is reported rather than inferred from a boolean.
   */
  witnesses: { apexContact: boolean; apexFloor: boolean; exit: boolean };
  hash: string;
  /** Sum of max-|wheel-slip-angle| (rad) over the run, and the sample
   *  count (steps with deck contact and > ~1 m/s world — AT SPEED, where
   *  "travel direction" means anything; below it the angle is suspension
   *  jitter). `slipAngleSum / slipSamples` is the run's mean LATERAL SLIP;
   *  the hazard test proves a wet patch raises it. */
  slipAngleSum: number;
  slipSamples: number;
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

/**
 * The car's WHEEL LINE, rigidly attached to the chassis (sim space): the mean
 * of the four axle points, which by symmetry is the chassis centre pushed down
 * the car's own up axis by the axle offset.
 *
 * It is deliberately NOT the mean of variant a's wheel BODY positions, even
 * though those bodies exist. A real cylinder rolling on the kit's stitched
 * chord slabs sometimes wedges - the stage-1 note calls it ploughing - and a
 * wedged wheel body then sits still at 0 velocity while the car rolls on
 * (measured: one wheel stopped dead on the loop rig's run-in, its velocity
 * pinned to zero by the solver from step ~50, ending up a metre behind the
 * car). Reading the car's position off that body made the loop gate blind: the
 * apex witness looked for the car a metre away from where it was, so variant a
 * could not complete a loop at any release height. The gate measures the car;
 * the wheel bodies are part of the model being measured, not its odometer.
 */
function wheelRef(car: Car): { x: number; y: number; z: number } {
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
  /**
   * x (m world) the car must be PAST to count as having left the loop. The arc
   * projection alone cannot say this: a car parked in a ring corner with its
   * wheels on a chord projects onto whatever deck is nearest in arc, so an
   * orbiting car kept advancing `arc`. Position is not fooled.
   */
  exitX?: number;
  /** Per-wheel-contact deck-grip field (SIM-space; hazard zones). Omitted
   *  or all-1 = bit-identical to the dry solver — see `WheelSupport.grip`
   *  in `src/physics/car.ts`. */
  gripAt?: GripField;
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
  let landImpulse = 0;
  let slipSum = 0;
  let slipSamples = 0;
  let prevVy = 0;
  let airborneSteps = 0;
  let stoppedSteps = 0;
  let finished = false;
  let exitPassed = false;
  let touchdownX: { x: number; y: number; z: number } | null = null;
  let gapStartX: number | null = null;
  let airStepsMax = 0;
  let distance = 0;
  // Honest loop-state machine (see the gate constants above): the apex must
  // be HELD (inverted + deck loaded + above the speed floor) before any arc
  // past the exit counts as completion.
  const apexMinSim = Math.sqrt(G_SIM * (opts.apexRadius ?? LOOP_RADIUS) * S) * (1 + APEX_SPEED_EPS);
  let apexContact = false;
  let apexSpeedMin: number | null = null;
  // The top quarter, recognised by attitude; see the witness below.
  let apexVisited = false;
  let apexRegionClosed = false;
  // Height of the ring's apex, world m. Attitude alone cannot say "at the
  // apex": a car tumbling end-over-end in the ring's BOTTOM corner reads
  // inverted there too, and its near-zero linear speed then sinks the apex
  // floor of a lap that actually went over the top at 1.6 m/s (measured: the
  // threshold grid's verdicts flickered with release height for exactly this
  // reason). The partner condition is the DECK's attitude at the nearest rail
  // point — the ring's own surface is pointing down there — rather than a
  // height band, because a height band has to be paid for out of the car's
  // sag and ride height and is then marginal by millimetres on a track whose
  // loop sits at a different elevation from the rig's (the feel track's apex
  // witness was missed by 2 mm for exactly that reason, while the same lap on
  // the loop rig witnessed fine).

  for (let step = 0; step < maxSteps; step++) {
    const support = carStep(world, car, opts.gripAt);
    applyRollingResistance(car, support.grounded, opts.coef, support);
    stepWorld(world);
    if (step % HASH_INTERVAL === 0) hash = hashBodies(bodies, hash);

    const speed = carSpeed(car);
    if (speed > peak) peak = speed;
    const fwdSpeed = Math.abs(car.chassis.linvel().x);
    if (support.grounded && speed > 10) {
      // Lateral slip telemetry AT SPEED (> ~1 m/s world): below it the
      // angle is suspension jitter, not slip (the 0.2 m/s weathervane gate
      // is for torque, not for a telemetry mean). Pure read.
      slipSum += Math.max(
        Math.abs(support.slipPerWheel[0]!),
        Math.abs(support.slipPerWheel[1]!),
        Math.abs(support.slipPerWheel[2]!),
        Math.abs(support.slipPerWheel[3]!),
      );
      slipSamples += 1;
    }

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
    const rq2 = car.chassis.rotation();
    const apexUpNow = qrot({ w: rq2.w, x: rq2.x, y: rq2.y, z: rq2.z }, v(0, 1, 0)).y;

    if (opts.apexAt !== undefined) {
      // "At the apex" is stated as ATTITUDE, not as projected arc: upY <=
      // -cos(45 deg) IS the ring's top quarter, and unlike the arc projection
      // it cannot jump. The projection on this rig is genuinely jumpy (a car on
      // the ascent has two decks roughly the same distance away - its own chord
      // and the run-in it came in on - and the nearest-point search flips
      // between them), which made an arc window open and close at random and
      // the apex witness appear and vanish between neighbouring release
      // heights. The three conditions must also hold AT ONE INSTANT: inverted,
      // touching, carrying a real deck load. Reading the load as "the biggest
      // force anywhere in the region" and the attitude as "whatever it was at
      // the closest approach" was the other stage-2 hole: a car that PRESSes
      // through the bottom and then FLIES across the top ballistically was
      // inverted at its closest approach with a big load on file, and passed on
      // two unrelated moments. The speed that counts is the slowest supported
      // inverted sample - the speed at which the deck was really holding the
      // car upside down - taken on the FIRST trip through the top quarter, so a
      // car that goes over at 1.6 m/s, cannot get out and rolls back through at
      // a crawl is not retroactively disqualified for a lap it did drive.
      const deckUpY = rig.frameAt(proj.arc).up.y;
      const nearTop = apexUpNow <= -Math.SQRT1_2 && deckUpY <= -Math.SQRT1_2;
      if (nearTop) apexVisited = true;
      else if (apexVisited) apexRegionClosed = true;
      if (!apexRegionClosed && nearTop && onRail
        && apexUpNow <= APEX_UP_MAX && support.grounded && support.force >= APEX_FORCE_MIN) {
        apexContact = true;
        if (apexSpeedMin === null || speed < apexSpeedMin) apexSpeedMin = speed;
      }
    }

    // landing impulse after the gap: biggest positive vy jump while airborne
    if (opts.gapAt !== undefined) {
      const vy = carVel(car).y;
      // The window used to compare the wheel's WORLD X against an ARC
      // length (`gapAt`): true on the loop rig, whose arc runs nearly
      // along x, and never on the feel track, where the ring and the
      // bank eat the difference - the airborne window never opened, and
      // the landing impulse read a flat zero even when the car flew the
      // whole gap. The arc projection is the honest coordinate.
      // (The earlier fix compared WORLD X to an ARC length - never true
      // on the feel track. The arc projection itself cannot be used
      // either: mid-flight the nearest-rail search flips between the
      // catch slope and the ring behind it, which is the documented
      // jumpiness. What IS stable: the x of the gap's start pose.)
      if (gapStartX === null) gapStartX = rig.poseAt(opts.gapAt).p.x / S;
      const airborne = !support.grounded && ref.x / S > gapStartX - 0.05;
      airborneSteps = airborne ? airborneSteps + 1 : 0;
      // The step the car TOUCHES DOWN is by definition not airborne, and
      // the vy jump happens exactly on that step - gating on the CURRENT
      // airborne streak asks for a step that cannot exist and the metric
      // read zero forever ("gap too small to measure"). The streak has to
      // be the flight BEFORE the jump: a running max over the window.
      if (airborneSteps > airStepsMax) airStepsMax = airborneSteps;
      if (airStepsMax > 12 && vy - prevVy > 0.3) {
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
          witnesses: {
            apexContact,
            apexFloor: apexSpeedMin !== null && apexSpeedMin >= apexMinSim,
            exit: false,
          },
          slipAngleSum: slipSum,
          slipSamples,
          peakSpeed: toWorldSpeed(peak),
          apexSpeed: apexSpeedMin === null ? null : toWorldSpeed(apexSpeedMin),
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
    if (opts.exitAt !== undefined && apexContact
      && apexSpeedMin !== null && apexSpeedMin >= apexMinSim
      && proj.arc > opts.exitAt
      && (opts.exitX === undefined || ref.x / S > opts.exitX - 0.02)) {
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
    slipAngleSum: slipSum,
    slipSamples,
    peakSpeed: toWorldSpeed(peak),
    apexSpeed: apexSpeedMin === null ? null : toWorldSpeed(apexSpeedMin),
    apexMin: Math.sqrt(G_WORLD * (opts.apexRadius ?? LOOP_RADIUS)),
    landingImpulse: toWorldImpulse(landImpulse),
    rollDistance: touchdownX === null ? null : toWorldDist(distance),
    witnesses: {
      apexContact,
      apexFloor: apexSpeedMin !== null && apexSpeedMin >= apexMinSim,
      exit: exitPassed,
    },
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
 *
 * The predicate "completes at h" is NOT globally monotone (suspension-phase
 * dips, documented in `Modules/feel.md`) — a bisection on it is only honest
 * inside a bracket whose wings are asserted by the caller (or by
 * `loopGateWings` below). The shipped-friction gate brackets at
 * `LOOP_GATE_BRACKET_OVER_R`: the completion edge the bisection converges to
 * is the fail->pass boundary INSIDE the bracket, and the wing probes prove
 * the bracket spans a real edge rather than a dip artifact.
 */
export function loopThreshold(
  variant: CarVariant,
  radius: number,
  opts: { coef?: number; iters?: number; lo?: number; hi?: number } = {},
): { height: number; heightOverR: number } {
  const coef = opts.coef ?? ROLL_COEF;
  let lo = opts.lo ?? 1.4 * radius;
  let hi = opts.hi ?? 4.5 * radius;
  if (!loopTry(variant, radius, hi, coef)) return { height: NaN, heightOverR: NaN };
  for (let i = 0; i < (opts.iters ?? 11); i++) {
    const mid = (lo + hi) / 2;
    if (loopTry(variant, radius, mid, coef)) hi = mid;
    else lo = mid;
  }
  return { height: hi, heightOverR: hi / radius };
}

/**
 * The wing probes of the shipped-friction gate bracket: the low wing must
 * FAIL and the high wing must COMPLETE (monotone direction: higher release
 * -> completes). True iff the bracket spans a real completion edge; the
 * bisected `loopThreshold` value is only meaningful when this holds.
 */
export function loopGateWings(
  variant: CarVariant,
  radius: number,
  opts: { coef?: number } = {},
): { low: boolean; high: boolean } {
  const coef = opts.coef ?? ROLL_COEF;
  return {
    low: loopTry(variant, radius, LOOP_GATE_BRACKET_OVER_R[0] * radius, coef),
    high: loopTry(variant, radius, LOOP_GATE_BRACKET_OVER_R[1] * radius, coef),
  };
}

export function loopTry(variant: CarVariant, radius: number, height: number, coef: number): boolean {
  const rig = loopRig(height, radius);
  return simulate(rig, {
    variant,
    coef,
    timeout: 8,
    exitAt: rig.marks.loopEnd! + 0.4,
    exitX: rig.poseAt(rig.marks.loopEnd! + 0.4).p.x / S,
    apexAt: rig.marks.loopApex,
    apexRadius: radius,
  }).completed;
}

export const TRACK_CONSTANTS = { DROP_HEIGHT, LOOP_RADIUS };
