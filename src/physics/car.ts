/**
 * The Gravity Works car — one chassis, two wheel models (the stage-1 bake-off).
 *
 * Variant "wheelColliders": four real cylinder colliders with tyre friction,
 * riding on stiff tyre springs and PD-centred under their chassis mounts
 * (no joints — see jointedStep's note on why they were dropped).
 * Variant "raycastWheels": chassis only; four suspension rays per step with
 * manual spring/damper forces.
 *
 * Same chassis body, same mass, same rolling-resistance law, so the bake-off
 * compares only the wheel model. All numbers are SIM units (see sim.ts).
 */
import {
  FIXED_DT,
  G_SIM,
  RAPIER,
  qrot,
  quatFromBasis,
  v,
  vadd,
  vcross,
  vdot,
  vlen,
  vnorm,
  vscale,
  vsub,
  type Vec,
  type Quat,
} from './sim.ts';


export type CarVariant = 'wheelColliders' | 'raycastWheels';

export const CAR = {
  halfL: 0.375, // sim metres, along local x (forward)
  halfH: 0.1, // local y (up)
  halfW: 0.175, // local z (right)
  density: 860, // -> ~40 kg sim ~= 0.04 kg world at 1:64 toy volume
  wheelR: 0.15,
  wheelHalfW: 0.04,
  wheelX: 0.27,
  wheelY: -0.25, // hangs below the chassis: wheel top flush with chassis bottom
                 // (overlapping wheel/chassis colliders deadlock revolute joints)
  wheelZ: 0.185,
  wheelDensity: 1500,
  // Tyre grip. Free PD-held wheels cannot brake-lock the CAR (the chassis
  // rides the contact-normal rays, and a zero-error PD transmits no static
  // force), so the joint-era reason for mu 0.05 does not apply: higher grip
  // only makes wheels spin up to rolling faster instead of scrub-slipping.
  wheelFriction: 0.35,
  chassisFriction: 0.01,
  // ---- the strut --------------------------------------------------------
  // ONE spring + ONE damper per mount, solved IMPLICITLY over the step (see
  // `strutImpulse`) and SYMMETRIC: the same rate pushes at the loop bottom
  // and pulls at the apex, stopped at each end of its travel. A real toy's
  // wheel line is rigid in both directions (a moulded tyre on a solid axle,
  // no wishbones), so the strut's job is to hold the chassis on its wheel
  // line through a full inverted orbit. A push-only strut free-falls the
  // chassis off the deck in the loop's upper half, and an EXPLICIT spring
  // cannot hold 6 g at 120 Hz and stay stable at the same time — that wall
  // ("the loop is a suspension slew-rate problem", session log 2026-10-05)
  // was a property of the integrator, not of the physics. With the implicit
  // solve, k is set by physics and not by the timestep.
  suspRest: 0.16,
  // Tyre/axle rate. The toy's running gear is a moulded tyre on a solid axle:
  // almost no travel, almost no compliance, and a load path that is close to
  // KINEMATIC. With the implicit solve a rate this high is stable, and it is
  // what carries the ~6 g loop bottom without the chassis sinking far enough
  // to lose the deck (the sink that used to end every loop run).
  suspK: 200000,
  // Two-sided damper, read along the STRUT AXIS, never the contact normal
  // (see the damper note in supportStep). Light: a plastic tyre has almost no
  // hysteresis, and the implicit solve's own numerical damping already lands
  // the assembly near critical at this rate.
  suspC: 800,
  // DROOP STOP: the tension end of the travel — how far the chassis may
  // separate from its wheel line before the axle runs out of something to
  // pull on. It is the clip's flex plus the tyre's squash, so it is small;
  // the stage-2 value of 0.15 (5.7 cm world on this car) was an ESCAPE HATCH
  // that let a genuinely inverted car free-fall away from the deck through the
  // apex. It must not go to the other extreme either: at 0.03 the strut went
  // SLACK over any convex crest (a gap lip, a chord joint), the chassis then
  // landed on its own floor and chattered — force 0, 0, 0, 22 kN, 0 — and the
  // feel track's car rode the rest of the track on its underside.
  droopMax: 0.08,
  // Lateral tyre grip (scrub) — deliberately small: the CHANNEL does the
  // steering, not the tyres (see the rail-contact block in `supportStep`).
  // A Hot Wheels car is guided by its wheels touching the U-channel walls;
  // tyre scrub only shows up as drag. Measured without any wall contact no
  // tyre model keeps the car on a flat yaw arc: nothing couples velocity to
  // the track direction (the deck normal is vertical there), and every
  // grip/alignment scheme invented in this session either spiralled the car
  // or pinned it at the joint.
  latFriction: 0.25,
  // Channel geometry: the virtual wheel side face (|z| = wheelZ +
  // wheelHalfW = .225) clears the rail lip's inner face (.22) by `railSlack`.
  // A feeler ray of `railSlack + railLook` at `railBand` height above the
  // deck reports wall contact; see supportStep for the response.
  railSlack: 0.0035, // wheel side face (|z| .225) vs rail lip inner face (.22)
  railBand: 0.2, // sim above the deck hit point: mid-height of the lip band
  railLook: 0.05, // look-range beyond slack: the wall force ramps over this
  rollDamp: 0.35, // anti-roll torque budget (fraction of support impulse x track width)
  rollCut: 0.85, // fraction of the estimated roll rate cancelled each step
  railK: 30000, // channel wall stiffness (ramps over the look range)
  railC: 900, // local outward dashpot on the wheel-side/wall contact
  // Self-aligning torque strength (friction-circle fraction) — see the note
  // in supportStep.
  alignGrip: 0.15,
  armRest: 0.25, // variant a spring arm rest length (attach -> wheel centre)
  armK: 25000,
  rideH: 0.4, // chassis centre height above floor at spawn
} as const;

/** Stage-2 loop-gate energy audit hook: accumulates per-step mechanical work
 *  (sim J) by mechanism WHILE ENABLED (see the session log 2026-10-05 - the
 *  entry-loss finding that pinned the honest threshold). Off costs one
 *  boolean test per impulse. */
/**
 * TEST-ONLY crutch-ablation switches (`tests/unit/ablation.test.ts`). These
 * exist so "is this crutch load-bearing?" is a MEASUREMENT, not folklore —
 * the stage-2 review's complexity-debt finding: every physics fix cured a
 * symptom of the previous one and no test would go red if one were deleted.
 * Defaults are the shipped configuration; every ablation flips ONE term and
 * the test restores immediately. Never read by anything but the ablation
 * matrix — reading a default-valued switch changes no float and no hash.
 */
export const __ABLATE = {
  /** Wishbone compliance lead gain (shipped 1.5; the pre-audit law ran 2
   *  and paid for the rotor mode with a true-rate damper). */
  wishboneLead: 1.5,
  /** True-rate rotor damper across the wishbone authority (shipped on). */
  rotorDamper: true,
  /** Conjugate (normal-read, normal-pushed) strut damper law (shipped on);
   *  false = the naive axis-read law the audit named as pump-and-burn. */
  conjDamper: true,
  /** Misalignment sanity gate on alignment steering (shipped on); false =
   *  steer on the mean normal at ANY misalignment. */
  misalignGate: true,
};

export const WORK: Record<string, number> & { on?: boolean } = {};
function addWork(name: string, dke: number): void {
  if (WORK.on) WORK[name] = (WORK[name] ?? 0) + dke;
}

/** Exact KE delta (sim J) of a linear impulse of signed magnitude `j` along
 *  a line whose body-point velocity along that line is `vn` and whose
 *  effective mass along it is `mEff`: j*vn + j^2/(2 mEff). KE is quadratic,
 *  so summing these in application order over a step equals that step's KE
 *  change from those impulses EXACTLY — which is what makes the energy
 *  audit's residual the solver's own work and nothing else. */
function pointDke(j: number, vn: number, mEff: number): number {
  return j * vn + (j * j) / (2 * mEff);
}

/** Exact KE delta of a torque impulse on a body with principal inertias I
 *  (chassis frame): t·w + (1/2) t·Iw^-1 t. */
function torqueDke(chassis: RAPIER.RigidBody, quat: Quat, I: Vec, t: Vec): number {
  const w = chassis.angvel();
  const tL = qrot({ w: quat.w, x: -quat.x, y: -quat.y, z: -quat.z }, t);
  const accL = v(tL.x / I.x, tL.y / I.y, tL.z / I.z);
  return vdot(t, w) + 0.5 * vdot(t, qrot(quat, accL));
}

export interface Pose {
  p: Vec;
  f: Vec;
  u: Vec;
}

export interface Car {
  variant: CarVariant;
  chassis: RAPIER.RigidBody;
  wheels: RAPIER.RigidBody[];
  attach: Vec[]; // wheel attach points in chassis-local coords
  quat0: Quat;
  mass: number;
  /** Previous step's deck-plane normal (see the deck-alignment torque). */
  deckPrev: Vec;
  /** Lagged deck-frame angular velocity estimate. */
  deckPrevW: Vec;
}

const WHEEL_LOCAL: Vec[] = [
  v(CAR.wheelX, CAR.wheelY, CAR.wheelZ),
  v(CAR.wheelX, CAR.wheelY, -CAR.wheelZ),
  v(-CAR.wheelX, CAR.wheelY, CAR.wheelZ),
  v(-CAR.wheelX, CAR.wheelY, -CAR.wheelZ),
];

// variant b suspension attach points: the AXLE line (the same line variant a's
// physical wheel bodies sit on), so the two variants put the same support
// polygon under the same chassis.
const ATTACH_LOCAL: Vec[] = [
  v(CAR.wheelX, CAR.wheelY, CAR.wheelZ),
  v(CAR.wheelX, CAR.wheelY, -CAR.wheelZ),
  v(-CAR.wheelX, CAR.wheelY, CAR.wheelZ),
  v(-CAR.wheelX, CAR.wheelY, -CAR.wheelZ),
];

// Rapier cylinders are Y-aligned; spin this quaternion (90 deg about X) into
// the wheel collider so the axle lies along body-local z (a rolling wheel).
const WHEEL_AXLE_QUAT = { w: Math.SQRT1_2, x: Math.SQRT1_2, y: 0, z: 0 };

/** Default bake-off launch speed (sim units); roll rigs pass 0. */
export const DEFAULT_LAUNCH_SPEED = 3;

export interface SpawnOpts {
  /** Forward release speed (sim). 0 = pure free-drop, no launch. */
  launchSpeed?: number;
}

export function spawnCar(
  world: RAPIER.World,
  variant: CarVariant,
  pose: Pose,
  opts: SpawnOpts = {},
): Car {
  const up = vadd(pose.p, vscale(pose.u, CAR.rideH));
  const q = quatFromBasis(pose.f, pose.u);
  const chassisDesc = RAPIER.RigidBodyDesc.dynamic()
    .setTranslation(up.x, up.y, up.z)
    .setRotation(q)
    .setCcdEnabled(true); // prevents tunnelling thin loop walls at >20 m/s;
  // viscous-contact cost only applies to sliding bodies, not this sprung one
  chassisDesc.canSleep = false; // sleep freezes bodies mid-sim (probe31: a
  // rolling car parked itself at v=6.8 with a frozen position)
  const chassis = world.createRigidBody(chassisDesc);
  world.createCollider(
    RAPIER.ColliderDesc.cuboid(CAR.halfL, CAR.halfH, CAR.halfW)
      .setDensity(CAR.density)
      .setFriction(CAR.chassisFriction)
      .setRestitution(0)
      // group: chassis = bit1; collide with track, NOT with the wheel bodies
      .setCollisionGroups(0x0002_fffd),
    chassis,
  );

  const wheels: RAPIER.RigidBody[] = [];
  if (variant === 'wheelColliders') {
    for (const a of WHEEL_LOCAL) {
      const wp = vadd(up, qrot(q, a));
      const wheelDesc = RAPIER.RigidBodyDesc.dynamic()
        .setTranslation(wp.x, wp.y, wp.z);
      wheelDesc.canSleep = false;
      const wheel = world.createRigidBody(wheelDesc);
      world.createCollider(
        RAPIER.ColliderDesc.cylinder(CAR.wheelHalfW, CAR.wheelR)
          .setRotation(WHEEL_AXLE_QUAT)
          .setDensity(CAR.wheelDensity)
          .setFriction(CAR.wheelFriction)
          .setRestitution(0)
          // group: wheel = bit2, filter excludes bit2 (other wheels) and
          // bit1 (own chassis) — so wheels collide with the TRACK for real.
          // (Stage 1 shipped filter 0 here, i.e. telemetry-only bodies that
          // touched nothing; that was not a wheel-collider model at all.
          // With real contacts this variant ploughs on the chord slabs —
          // documented in Modules/physics.md, and precisely why the track
          // kit's stitched colliders are the point.)
          .setCollisionGroups(0x0004_fff9),
        wheel,
      );
      wheels.push(wheel);
    }
  }
  // Launch-gate release: start rolling without slip (variant a) at a small
  // forward speed; identical for both variants so the bake-off is fair.
  // Roll-drop rigs pass launchSpeed 0 for a true free fall.
  const v0 = opts.launchSpeed ?? DEFAULT_LAUNCH_SPEED;
  chassis.setLinvel(vscale(pose.f, v0), true);
  for (const wn of wheels) {
    wn.setLinvel(vscale(pose.f, v0), true);
    wn.setAngvel(v(0, 0, -v0 / CAR.wheelR), true);
  }
  return { variant, chassis, wheels, attach: variant === 'raycastWheels' ? ATTACH_LOCAL : WHEEL_LOCAL, quat0: q, mass: chassis.mass(), deckPrev: v(0, 1, 0), deckPrevW: v(0, 0, 0) };
}

export interface WheelSupport {
  grounded: boolean;
  /** Sum of the suspension spring forces applied along contact normals this
   *  step (sim N; a settled car on flat deck reads its own weight m*g_sim).
   *  The loop gate uses it to prove the deck is LOADED, not merely in ray
   *  range — a flying car's rays hit the deck too. */
  force: number;
  /** Mean DECK GRIP multiplier over this step's wheel contacts (1 = dry).
   *  `gripAt` samples a hazard field (see `src/world/hazards.ts`) at each
   *  aligned contact point; a wheel in a wet patch contributes that zone's
   *  `frictionFactor`, so a car straddling a zone edge gets the linear
   *  blend of its wheels' factors. The friction-circle-budgeted deck
   *  forces (the axle-scrub self-aligning torque) and the rolling-
   *  resistance impulse are the consumers. With no zones — or a car fully
   *  outside them — every factor is exactly 1 and every product through
   *  this field is bit-identical to the dry solver (`x * 1 === x`): that
   *  is what keeps hazard code hash-neutral on hazard-free levels, which
   *  `tests/unit/hazards.test.ts` pins. */
  grip: number;
  /** Per-mount deck grip (index = mount order of `Car.attach`): the
   *  `gripAt` factor sampled at THAT wheel's contact point this step; 1
   *  for a wheel out of contact or outside every zone. Consumers: the
   *  aggregate `grip` average, variant a's live tyre friction, and the
   *  juice hooks (`src/juice`). */
  gripPerWheel: readonly number[];
  /** Per-mount deck-contact flag (aligned wheel-deck contact this step):
   *  the denominator of `grip` and the set of wheels the rolling-share
   *  yaw term may act on. */
  contactPerWheel: readonly boolean[];
  /** Per-mount LATERAL SLIP ANGLE (rad, signed): the angle between the
   *  wheel's travelling direction and its rolling direction in the
   *  chassis frame, from the body-frame velocity AT the mount; 0 for a
   *  wheel not in deck contact. Pure read — no force law consumes it, it
   *  exists so the squeal hook and the hazard tests carry numbers, not
   *  magic. */
  slipPerWheel: readonly number[];
}

/** Per-contact deck-grip query in SIM-space metres (the car module is
 *  unit-blind like every other force law here). `src/world/hazards.ts`
 *  owns the world-space field; callers adapt the units. */
export type GripField = (contactSimPos: Vec) => number;

/** Per-step update. Both variants apply spring/damper forces — jointed
 *  bodies were dropped entirely (see `jointedStep` below); the a/b labels
 *  here are historical and mean nothing. */
export function carStep(world: RAPIER.World, car: Car, gripAt?: GripField): WheelSupport {
  if (car.variant === 'raycastWheels') return supportStep(world, car, gripAt);
  return jointedStep(world, car, gripAt);
}

function chassisFrame(car: Car): { pos: Vec; quat: Quat; up: Vec } {
  const t = car.chassis.translation();
  const r = car.chassis.rotation();
  const quat: Quat = { w: r.w, x: r.x, y: r.y, z: r.z };
  return { pos: v(t.x, t.y, t.z), quat, up: qrot(quat, v(0, 1, 0)) };
}

/** Principal (box) inertias of the chassis, chassis frame, sim units. */
function principalInertias(mass: number): Vec {
  return v(
    (mass / 3) * (CAR.halfH * CAR.halfH + CAR.halfW * CAR.halfW),
    (mass / 3) * (CAR.halfL * CAR.halfL + CAR.halfW * CAR.halfW),
    (mass / 3) * (CAR.halfL * CAR.halfL + CAR.halfH * CAR.halfH),
  );
}

/**
 * Effective mass of the chassis seen by a unit impulse along `dir` applied at
 * `point`: 1 / (n·n/m + (r x n)ᵀ I⁻¹ (r x n)). Every stage-1/2 strut used
 * `mass / 4` for this, which is right only for a pure heave mode; at a corner
 * of this chassis the rotational term nearly doubles the share, and getting it
 * right is what keeps a four-mount sequential scheme from over- or
 * under-reacting the loop's load transfer.
 */
function mountMass(mass: number, quat: Quat, com: Vec, point: Vec, dir: Vec): number {
  const r = vsub(point, com);
  const rxn = vcross(r, dir);
  const inv = { w: quat.w, x: -quat.x, y: -quat.y, z: -quat.z };
  const l = qrot(inv, rxn);
  const I = principalInertias(mass);
  return 1 / (1 / mass + (l.x * l.x) / I.x + (l.y * l.y) / I.y + (l.z * l.z) / I.z);
}

/**
 * The strut impulse (sim N s) that SOLVES the spring over the step instead of
 * stepping it: backward Euler on the mount's compression coordinate gives
 *
 *   j = m k dt (u - dt v) / (m + k dt^2)
 *
 * which is unconditionally stable for ANY k — so the strut rate is set by the
 * toy's physics (a moulded tyre carries a 6 g loop bottom) and not by the
 * 120 Hz explicit-stability ceiling, and the k -> infinity limit is a rigid
 * contact (position projection), never a catapult. `u` is the travel-limited
 * compression (negative on the droop stop), `v` the mount's velocity along the
 * force direction, positive separating. This is what was missing when the loop
 * gate read "suspension slew rate": an explicit spring's force capacity is
 * k*travel (5.1 g at the old k) and its authority omega = sqrt(4k/m) gave
 * barely one force cycle per lap at any k that stayed stable — the wall was
 * the integrator, not the physics (session log 2026-10-05).
 */
function strutImpulse(mEff: number, u: number, v: number): number {
  const k = CAR.suspK;
  const dt = FIXED_DT;
  return (mEff * k * dt * (u - dt * v)) / (mEff + k * dt * dt);
}

/**
 * `strutImpulse` WITHOUT the velocity term: the same implicit (stable,
 * position-projecting) spring, but it asks nothing of the body's existing
 * motion. That is the right law for a surface the car is merely ALIGNED to —
 * a steep loop-wall face, a channel wall — where cancelling the approach
 * velocity would cancel forward speed instead (the riser plough), while an
 * undamped EXPLICIT spring at a useful rate is a catapult.
 */
function alignImpulse(mEff: number, k: number, u: number): number {
  const dt = FIXED_DT;
  return (k * u * dt * mEff) / (mEff + k * dt * dt);
}

/** Shared chassis support: contact-normal spring+damper at each mount. */
function supportStep(world: RAPIER.World, car: Car, gripAt?: GripField): WheelSupport {
  const { pos, quat } = chassisFrame(car);
  let grounded = false;
  let normImpulse = 0;
  // Sum of the ABSOLUTE normal strut load applied this step (push or pull);
  // the loop gate's apex-contact proof reads it — a flying car's rays hit
  // the deck at zero load, a car running the loop is loaded against the deck
  // whether its struts are compressed (fast apex) or on the droop stop
  // (threshold apex).
  let springForce = 0;
  const sideSum = [0, 0]; // per-side sums of contact-normal mount velocity
  const sideN: (Vec | null)[] = [null, null];
  const sidePt: (Vec | null)[] = [null, null];
  // running deck-frame estimate for the alignment torque above
  let deckN = v(0, 0, 0);
  let deckHits = 0;
  // Deck-grip bookkeeping (see `WheelSupport.grip`): sum/count of the
  // frictionFactor at THIS step's aligned wheel contacts; stays 1 while no
  // zone is touched (dry is the exact no-op, not an approximation).
  let gripSum = 0;
  let gripCount = 0;
  const gripW = [1, 1, 1, 1];
  const slipW = [0, 0, 0, 0];
  const contactW = [false, false, false, false];
  const quatInv = { w: quat.w, x: -quat.x, y: -quat.y, z: -quat.z };
  for (let k = 0; k < car.attach.length; k++) {
    const aLocal = car.attach[k]!;
    const attach = vadd(pos, qrot(quat, aLocal));
    const down = vscale(qrot(quat, v(0, -1, 0)), 1);
    const ray = new RAPIER.Ray(attach, down);
    // Never support the chassis on a wheel body (variant a): ignore bit2.
    const pred = car.wheels.length > 0
      ? (c: RAPIER.Collider): boolean => (c.collisionGroups() >>> 16 & 0x4) === 0
      : undefined;
    const hit = world.castRayAndGetNormal(ray, CAR.suspRest + CAR.droopMax + 0.02, true, undefined, undefined, undefined, car.chassis, pred);
    if (hit === null) continue;
    const toi = hit.timeOfImpact;
    const compression = CAR.suspRest - toi;
    if (compression < -CAR.droopMax) continue; // beyond the droop stop: slack
    const n0 = v(hit.normal.x, hit.normal.y, hit.normal.z);
    // A surface's BACK face is not a running surface. A ray that reaches a
    // deck from underneath (a loop's own chords pass over its exit run) hits
    // the slab's underside first, and pushing along that normal drives the car
    // INTO the track — the failure that read as "the car fell through the
    // loop" long before it ever touched anything. If the hit normal points the
    // same way the ray travels, the car is under that piece, not on it.
    if (vdot(n0, down) > 0) continue;
    const upW = qrot(quat, v(0, 1, 0));
    const aligned = vdot(n0, upW) > 0.7;
    const vb = car.chassis.velocityAtPoint(attach);
    const v3 = v(vb.x, vb.y, vb.z);
    const travel = Math.max(compression, -CAR.droopMax);
    const mN = mountMass(car.chassis.mass(), quat, pos, attach, n0);
    // SPRING along the CONTACT NORMAL, solved over the step (see
    // `strutImpulse`). The normal — not the strut axis — is the direction a
    // real tyre/axle path pushes in, and a support force tilted with body
    // pitch creates slope drag that can exactly balance gravity and stall the
    // car. Push (compression > 0, the loop bottom) and pull (the droop stop,
    // the inverted half of a loop) are the SAME law: the axle carries both.
    // Past the travel stops the term is clamped, which is what makes a
    // buried chassis impossible to ignore — the hull itself reports toi ~ 0,
    // so k*suspRest holds the car ON the deck instead of letting the ray
    // fall off its underside and drop the car into the void (the sink that
    // used to end every loop run).
    if (!aligned) {
      // FILTERED CONTACT (loop-wall facing / unaligned orbit). The stage-1
      // model dropped these hits wholesale ("seam/edge hits are not
      // support") — fine on flat ground, fatal inside a loop where it
      // starves the orbit of centripetal load and denies the aligning
      // torque. The pre-audit model solved them as a VELOCITY-FREE position
      // projection, and the per-step energy audit (node tools/feel.mjs
      // audit) named that as THE injection: at ring entry the ray reads
      // the corner between the ramp run-out and the first rising chord at
      // toi ~ 0.03 with a 59°-tilted normal, so "compression" = 0.13 is a
      // GEOMETRY READING, NOT PENETRATION — and a projection with no
      // velocity feedback spends k·u·dt as pure new velocity, HALF OF IT
      // ALONG THE TRACK. Measured: ONE step of it, +1.03 J/kg — the whole
      // ~1 J/kg the threshold was short by. The honest contact is a step
      // BUMP: the same implicit strut spring, but its position term capped
      // at the rate the car actually CLOSES the geometry (reclaiming 14 cm
      // in one step is a 15 m/s shove — a wall, and the audit's exit-
      // junction slam at the other end of the ring). The cap makes the
      // bump inelastic and bounded by the KE present, which also de-
      // phases the bounce lottery at the first chord: the bump now costs
      // the lap a fraction of a J/kg wherever it happens, instead of
      // paying or fining the car ~1 J/kg depending on which seam it hits.
      const vClose = Math.max(0, -vdot(v3, n0));
      const jg = strutImpulse(mN, Math.min(travel, FIXED_DT * vClose), vdot(v3, n0));
      { addWork('guide', pointDke(jg, vdot(v3, n0), mN)); car.chassis.applyImpulseAtPoint(vscale(n0, jg), attach, true); }
      springForce += Math.abs(jg) / FIXED_DT;
      grounded = true;
      deckN = vadd(deckN, n0);
      deckHits++;
      continue; // never the damper/anti-roll/feeler path
    }
    grounded = true;
    const vN = vdot(v3, n0);
    const side = aLocal.z >= 0 ? 1 : 0;
    sideSum[side] += vN;
    sideN[side] = n0;
    sidePt[side] = attach;
    // DAMPER: force and rate on the SAME LINE — the contact normal — reading
    // the velocity conjugate to the spring's own coordinate (the ray's toi).
    // The law is then a pure damper on one coordinate and its work is
    // identically -c(v·n)^2·frac <= 0: a car riding the deck has v·n ~ 0
    // (velocity along the deck tangent) so it is silent on straights,
    // valleys, ramps and loops — the claim the old axis-reading note made,
    // now true BY CONSTRUCTION instead of only when attitude already
    // matched the deck. Wherever attitude LAGGED (ring entry, every
    // transition) the axis reading v·down mistook orbital speed for
    // extension rate and braked the car through the shock; the wishbone
    // torque below then paid attitude back, and the pair ran as a pump-and-
    // burn loop — measured audit flows of +1.9 J/kg in against -3.2 J/kg
    // burned per lap AT threshold, with the car's translational energy as
    // the fuel. (Reading the extension rate v·n/(n·down) but pushing along
    // the axis was also tried: injective through its cross terms —
    // conjugacy needs force and rate collinear, which is the normal.)
    // Implicit fraction: c*dt/(m+c*dt) cannot overshoot 1.
    const mA = mountMass(car.chassis.mass(), quat, pos, attach, n0);
    const dDir = __ABLATE.conjDamper ? n0 : down;
    const vD = vdot(v3, dDir);
    const jd = -vD * mA * (CAR.suspC * FIXED_DT) / (mA + CAR.suspC * FIXED_DT);
    { addWork('damp', pointDke(jd, vD, mA)); car.chassis.applyImpulseAtPoint(vscale(dDir, jd), attach, true); }
    const js = strutImpulse(mN, travel, vN);
    { addWork('strut', pointDke(js, vN, mN)); car.chassis.applyImpulseAtPoint(vscale(n0, js), attach, true); }
    normImpulse += Math.abs(js);
    springForce += Math.abs(js) / FIXED_DT;
    deckN = vadd(deckN, n0);
    deckHits++;

    // Channel-contact feeler (the actual steering mechanism — see
    // CAR.railSlack): a short lateral ray at rail-lip height, out from this
    // wheel's centre plane. The deck hit gives the contact patch; +n *
    // railBand lands in the lip's vertical band; a hit nearer than the
    // wheel-side clearance means this wheel has reached the channel wall.
    // The wall FORCE is applied once per side at the centre of mass after
    // the mount loop — see the note there.
    const contact = vadd(attach, vscale(down, toi));
    contactW[k] = true;
    if (gripAt) {
      const gK = gripAt(contact);
      gripW[k] = gK;
      gripSum += gK;
      gripCount += 1;
    }
    // Lateral slip angle AT THE CONTACT PATCH (body-frame velocity at the
    // mount: z = lateral, x = rolling direction). Read-only telemetry.
    {
      const vBody = qrot(quatInv, v3);
      slipW[k] = Math.atan2(vBody.z, vBody.x);
    }
    const bandP = vadd(contact, vscale(n0, CAR.railBand));
    const latC = qrot(quat, v(0, 0, aLocal.z >= 0 ? 1 : -1));
    const out0 = vsub(latC, vscale(n0, vdot(latC, n0)));
    const outL = Math.sqrt(vdot(out0, out0));
    // The direction must stay essentially horizontal: at extreme roll the
    // chassis z axis tilts toward -y and the "lateral" ray points DOWN —
    // measured: the spring then punches the car upward through the deck
    // plane every contact step (a violent vertical energy pump). Guard it.
    if (outL > 0.3 && Math.abs(out0.y / outL) < 0.5) {
      const outD = vscale(out0, 1 / outL);
      const hit2 = world.castRay(new RAPIER.Ray(bandP, outD), CAR.railSlack + CAR.railLook, true, undefined, undefined, undefined, car.chassis, pred);
      if (hit2 !== null) {
        const toi2 = Math.max(hit2.timeOfImpact, 0);
        const pen = CAR.railSlack - toi2; // > 0 once the wheel side passes the wall
        if (pen > 0) {
          // Progressive channel wall: force ramps with PENETRATION over the
          // look range, not with the (tiny) clearance — measured lesson: a
          // spring whose full force lands within the 0.35 mm clearance is
          // either too weak to hold the wheel out of the lip (ploughed 25 mm
          // and fell off the bank's inside) or, when replaced by outright
          // velocity cancellation, an impulse machine that brakes the car at
          // every curvature-sign junction (4 m/s -> 0.2 m/s in 0.2 s). A
          // compliant wall lets the car sag ~2 mm in a steady bank and
          // ramps smoothly when a junction asks for more.
          const pc = vadd(bandP, vscale(outD, Math.max(toi2, 0.001)));
          const vc = car.chassis.velocityAtPoint(pc);
          const vOut = vc.x * outD.x + vc.y * outD.y + vc.z * outD.z;
          const railN = vscale(outD, -1);
          const mWall = mountMass(car.chassis.mass(), quat, pos, pc, outD);
          const dFrac = Math.min(0.5, (CAR.railC * FIXED_DT) / mWall);
          if (vOut > 0) {
            const jw = vOut * dFrac * mWall; // along railN = -outD
            { addWork('rail', pointDke(jw, -vOut, mWall)); car.chassis.applyImpulseAtPoint(vscale(railN, jw), pc, true); }
          }
          // Compliant wall: implicit align spring (no velocity term), so a
          // curvature junction sags the wall a little and ramps instead of
          // braking the car dead (see `alignImpulse`).
          {
            const jk = alignImpulse(mWall, CAR.railK, pen);
            const vc2 = car.chassis.velocityAtPoint(pc);
            addWork('rail', pointDke(jk, -(vc2.x * outD.x + vc2.y * outD.y + vc2.z * outD.z), mWall));
            car.chassis.applyImpulseAtPoint(vscale(railN, jk), pc, true);
          }
        }
      }
    }
  }
  // Deck-alignment strut torque — the moment transfer a push-only strut
  // cannot provide. A real car's wheels are pinned near the deck line, so
  // the deck plane DEFINES the chassis attitude through rigid wishbones.
  // The raycast chassis touches nowhere, and inside a loop the deck frame
  // rotates at v/r (tens of rad/s at this toy radius) with nothing to turn
  // it — measured: pitch lag at the loop bottom turned half the entry
  // energy into damper heat within ten steps, throwing the car off the
  // deck. Track the deck-plane normal (mean of this step's contact
  // normals), and drive the chassis angular state toward that frame with a
  // damped torque budgeted by the step's contact load — the same modelling
  // family and friction-circle discipline as the anti-roll and
  // self-aligning torques below: it can turn attitude INTO the track,
  // never push the car along it.
  if (deckHits >= 2) {
    const nBar = vnorm(deckN);
    const upC = qrot(quat, v(0, 1, 0));
    const err = vcross(upC, nBar); // axis * sin(error)
    const raw = vscale(vcross(car.deckPrev, nBar), __ABLATE.wishboneLead / FIXED_DT); // raw frame spin, with lead
    // The deck frame's TRUE rate (no lead). The rate side of the
    // correction below converges toward the LEAD target wDeck — which the
    // pre-audit law set at TWICE the deck rate to hide its own lag. That
    // factor 2 reads as a clean lap on the loop rig's pitched run-in but
    // from a level entry (the feel track's ring bottom) it spins the
    // chassis to twice the ring rate, every riser then met is a ~1 J/kg
    // slam, and the rotor energy is repaid to the solver as heat. A true-
    // rate damper across the same authority removes exactly that rotor
    // mode (it is silent when the car tracks the deck) and lets the lead
    // come down from 2 to an honest 1.5 — the compliance lead a soft
    // wishbone legitimately needs to track a turning frame.
    const rawTrue = vscale(vcross(car.deckPrev, nBar), 1 / FIXED_DT);
    // Wishbones are not perfect joints: the estimate (and the correction)
    // runs through a first-order lag, because the collider chord staircase
    // rotates the raw normal in 10-deg spikes and an unfiltered wWant
    // back-flips the car at ramp valleys (measured: wy spikes to -80).
    const a = 0.3;
    const wDeck = vadd(vscale(car.deckPrevW, 1 - a), vscale(raw, a));
    const wc = car.chassis.angvel();
    const em = vlen(err);
    // Sanity gate: past ~50 deg of misalignment the mean normal is no
    // longer a trustworthy frame (the rays are reading chord faces, not
    // treads), and steering on it reverse-rotates the car - measured on
    // the loop's upper rise, where an unclamped alignment REVERSED the
    // pitch mid-climb. Below the gate it is exact.
    const pTerm = em > 1e-6 && (__ABLATE.misalignGate ? em < 0.85 : true) ? vscale(vnorm(err), Math.min(em, 0.35) * 40) : v(0, 0, 0);
    // Tensor-correct authority: this chassis's roll inertia is ~4x smaller
    // than its pitch inertia (flat, wide box), so a scalar-I torque law
    // overdrives ROLL ninefold - measured: the roll mode exploded to
    // -58 rad/s about the apex and threw the car sideways off the deck.
    // Transform dw to chassis frame, scale by the principal inertias,
    // transform back.
    const mass = car.chassis.mass();
    // box collider cuboid(halfL, halfH, halfW): principal inertias
    const Ivec = principalInertias(mass);
    // 0.15/step toward the true deck rate: the rotor damper of the note
    // above; work-negative whenever the car over-rotates, silent when it
    // tracks.
    const rotor = __ABLATE.rotorDamper ? vscale(vsub(rawTrue, wc), 0.15) : v(0, 0, 0);
    const dwW = vadd(vsub(vadd(wDeck, pTerm), wc), rotor);
    const rq = { w: quat.w, x: quat.x, y: quat.y, z: quat.z };
    const inv = { w: rq.w, x: -rq.x, y: -rq.y, z: -rq.z };
    const dwL = qrot(inv, dwW);
    const jL = v(dwL.x * Ivec.x * 0.5, dwL.y * Ivec.y * 0.5, dwL.z * Ivec.z * 0.5);
    let j = qrot(rq, jL);
    // the wishbone's honest moment limit: contact force x structural arm
    // (a real suspension transfers attitude moment structurally, not
    // through the friction circle - force x arm, clamped by what the
    // contacts can actually carry)
    const budget = springForce * FIXED_DT * CAR.halfL;
    const jm = vlen(j);
    if (jm > budget) j = vscale(j, budget / jm);
    if (jm > 1e-9) { addWork('wishbone', torqueDke(car.chassis, rq, Ivec, j)); car.chassis.applyTorqueImpulse(j, true); }
    car.deckPrev = nBar;
    car.deckPrevW = wDeck;
  }
  // Anti-roll damper. The mounts sit BELOW the chassis centre of mass, so
  // the spring layout carries an inverted-pendulum roll term — gravity's
  // roll demand eats the geometric spring spread and the chassis roll mode
  // is only marginally stable: measured as roll ringing (12° to 60°) and
  // hops mid-bank where the banking ramp (~5 Hz at these speeds) matches
  // the feeble roll natural frequency. Mount dampers barely touch roll
  // (small lateral lever), so damp the mode directly as a torque about the
  // chassis FORWARD axis: estimate the roll rate from the two sides' mean
  // contact-normal mount velocities and cancel most of it, budgeted by the
  // support impulse across the track width (an anti-roll bar does no more).
  if (grounded && sideN[0] !== null && sideN[1] !== null) {
    const rollRate = (sideSum[1] - sideSum[0]) / (2 * CAR.wheelZ * 2);
    const Ix = (car.chassis.mass() / 12) * (4 * CAR.halfH * CAR.halfH + 4 * CAR.halfW * CAR.halfW);
    const budget = CAR.rollDamp * normImpulse * 2 * CAR.wheelZ;
    const j = Math.min(Math.abs(rollRate) * Ix * CAR.rollCut, budget);
    if (j > 1e-9) {
      const fwd = qrot(quat, v(1, 0, 0));
      const jt = vscale(fwd, -Math.sign(rollRate) * j);
      { addWork('antiroll', torqueDke(car.chassis, quat, v(
        (car.chassis.mass() / 3) * (CAR.halfH * CAR.halfH + CAR.halfW * CAR.halfW),
        (car.chassis.mass() / 3) * (CAR.halfL * CAR.halfL + CAR.halfW * CAR.halfW),
        (car.chassis.mass() / 3) * (CAR.halfL * CAR.halfL + CAR.halfH * CAR.halfH),
      ), jt)); car.chassis.applyTorqueImpulse(jt, true); }
    }
  }
  // Axle-scrub self-aligning torque. A rigid-axle car pushed from behind
  // through a slot is a pushed hockey stick: position-bounded (the channel)
  // but yaw-unstable, and on the kit bank the chassis yaw ran to −90 deg
  // against a +45 track (measured) before the rails spun it off the deck.
  // Real axles resist this — scrubbing a solid axle across its wheels
  // produces a torque that turns the axle toward its travel direction.
  // Model it: drive the chassis heading toward the (horizontal) velocity,
  // about the chassis up axis, budgeted by the friction circle like any
  // other tyre force.
  // Mean grip of this step's wheel contacts (exactly 1.0 when dry: a sum
  // of integer-counted 1s divided by its own count is exact in IEEE754).
  const gripAvg = gripCount > 0 ? gripSum / gripCount : 1;
  if (grounded) {
    const lvv = car.chassis.linvel();
    const hSp = Math.sqrt(lvv.x * lvv.x + lvv.z * lvv.z);
    if (hSp > 2) {
      // gate: > ~0.2 m/s world; below, "travel direction" is suspension noise
      const fwdH = qrot(quat, v(1, 0, 0));
      const fl = Math.sqrt(fwdH.x * fwdH.x + fwdH.z * fwdH.z);
      if (fl > 0.2) {
        const cros = (fwdH.x * lvv.z - fwdH.z * lvv.x) / (fl * hSp);
        const dot = (fwdH.x * lvv.x + fwdH.z * lvv.z) / (fl * hSp);
        const dpsi = Math.atan2(cros, dot);
        if (Math.abs(dpsi) > 0.03) {
          const up = qrot(quat, v(0, 1, 0));
          const av = car.chassis.angvel();
          const wUp = av.x * up.x + av.y * up.y + av.z * up.z;
          const wantW = Math.min(Math.max(-dpsi * 6, -5), 5);
          const Iy = (car.chassis.mass() / 12) * (4 * CAR.halfL * CAR.halfL + 4 * CAR.halfW * CAR.halfW);
          // Friction circle: the weathervane torque is a TYRE force, so a
          // wet zone's gripFactor scales its budget (dry gripAvg === 1 ===
          // bit-identical to the pre-hazard solver).
          const budget = CAR.alignGrip * normImpulse * CAR.wheelX * gripAvg;
          const j = Iy * (wantW - wUp);
          const jm = Math.min(Math.abs(j), budget);
          if (jm > 1e-9) {
            const jt = vscale(up, Math.sign(j) * jm);
            { const m = car.chassis.mass(); addWork('scrub', torqueDke(car.chassis, quat, v(
              (m / 3) * (CAR.halfH * CAR.halfH + CAR.halfW * CAR.halfW),
              (m / 3) * (CAR.halfL * CAR.halfL + CAR.halfW * CAR.halfW),
              (m / 3) * (CAR.halfL * CAR.halfL + CAR.halfH * CAR.halfH),
            ), jt)); car.chassis.applyTorqueImpulse(jt, true); }
          }
        }
      }
    }
  }
  return { grounded, force: springForce, grip: gripAvg, gripPerWheel: gripW, slipPerWheel: slipW, contactPerWheel: contactW };
}

/**
 * Variant a step — physical wheel colliders.
 * Each wheel is a free dynamic body with a REAL cylinder collider and tyre
 * friction, touching the track in its own collision group; a clamped PD keeps
 * it under its chassis mount; the chassis itself is carried by the same
 * contact-normal coil springs variant b uses. Wheel angular dynamics emerge
 * from solver friction at the tyre patch.
 *
 * Why not joint-carried wheels? Measured on this Rapier build at 120 Hz,
 * joint load paths either brake-lock the car (the static friction cone
 * holds 70 kg on a 12 degree slope) or sink the chassis and wheels into
 * the track slabs (position-joint softness); see probes 31-43. Springs
 * everywhere was the only stable arrangement, and revolute joints were
 * dropped entirely. That is the bake-off finding for variant a.
 *
 * Known, measured cost of real wheel contacts on THIS provisional track:
 * the wheels plough the chord-slab stitching (each slab end-face is a
 * vertical wall the tyre climbs), bleeding roll distance. That is a defect
 * of the hand-slabbed track, not of the wheel model — the stage-2 track
 * kit's stitched convex colliders exist to remove it.
 */
function jointedStep(world: RAPIER.World, car: Car, gripAt?: GripField): WheelSupport {
  const support = supportStep(world, car, gripAt);
  if (gripAt) {
    // Variant a has REAL tyre-deck friction — the honest per-contact hazard
    // hook is to scale the collider friction of exactly the wheels whose
    // contact sits in a zone. Not bit-identical by construction (the solver
    // sees a different material), which is the POINT: a wet wheel's mu
    // halves. Rapier's default combine rule averages wheel×deck friction,
    // so the effective patch mu falls with the wheel's side of the pair.
    for (let k = 0; k < car.wheels.length; k++) {
      const gK = support.gripPerWheel[k]!;
      const col = car.wheels[k]!.collider(0);
      const want = CAR.wheelFriction * gK;
      if (col && Math.abs(col.friction() - want) > 1e-12) col.setFriction(want);
    }
  }
  const { pos, quat } = chassisFrame(car);
  for (let k = 0; k < 4; k++) {
    const wheel = car.wheels[k];
    // PD centring under the mount, clamped (an unclamped PD flings wheels;
    // see probe39 note). The stage-1 clamp ceiling (25 sim/s^2) sat BELOW the
    // chassis ramp acceleration (~60), so the wheels lagged metres behind
    // their mounts and fell off the deck on kit hulls — the "variant a rolls
    // 0.7 m on kit colliders" number was wheel scatter, not the car. Re-
    // trimmed around a ~6 Hz critically-damped strut with a 300 accel clamp.
    //
    // It used to be one clamped position PD with NO vertical term at all (fy
    // was literally absent), on the theory that the deck's own contact holds
    // the wheel up. Both halves of that were wrong in a loop: on the upper half
    // the deck pushes the wheel DOWN and the chassis hangs below it, so nothing
    // kept the wheel on its axle line and the wheel bodies drifted off the car
    // - vertically and, once the clamp saturated, 0.76 m longitudinally. That
    // matters beyond looks: the gate measures the car at its WHEEL LINE, so on
    // the loop's top variant a's wheels sat far enough off the rail for the
    // apex witness to miss every time, and the variant "could not complete the
    // loop at any release height". That read like a physics failure and was a
    // bookkeeping one.
    const attach = vadd(pos, qrot(quat, car.attach[k]));
    const wp0 = wheel.translation();
    const wp = v(wp0.x, wp0.y, wp0.z);
    const mw = wheel.mass();
    const lv = wheel.linvel();
    // The AXLE is a rigid connection in its own plane: the only freedom a toy
    // axle gives a wheel is travel along the suspension axis. So the coupling
    // is split the same way - velocity-matched across the axle plane (a
    // projection, not a spring, so it cannot saturate), and a spring/damper
    // ALONG the axis (that is the suspension, and it is what a ride height
    // means). The old code used one clamped position PD for all three axes;
    // clamped at 0.25 sim of error and 300 sim/s^2, it could not keep up with
    // the chassis's own ramp acceleration, so the wheel bodies fell up to 0.76
    // m behind the car and never caught up. That is why the vertical term
    // below matters as much as the in-plane one: with a lagging wheel, the
    // gate's wheel-line reference reads a position the car is not at.
    const up = qrot(quat, v(0, 1, 0));
    const rAtt = qrot(quat, car.attach[k]);
    const vAtt = vadd(car.chassis.linvel(), vcross(car.chassis.angvel(), rAtt));
    const dv = vsub(vAtt, lv);
    const axialV = vdot(dv, up);
    const inPlane = vsub(dv, vscale(up, axialV));
    // spring toward the axle line (CAR.wheelY below the mount) along the axis
    const axial = vdot(vsub(wp, attach), up) - CAR.wheelY;
    // Roll without slip. Nothing drives a toy wheel's spin, so if the model
    // lets its angular velocity keep whatever it started with, the deck's
    // friction spends itself spinning the wheel up (a wheel launched at the
    // spawn speed and left at that spin is SLIDING at 30 sim/s), and that
    // friction shows up as a huge drag on the wheel bodies, which then lag the
    // car by half a metre. Enforcing omega = v/r about the axle is the
    // free-rolling idealisation, and it is also what makes the bake-off fair:
    // with it, variant a's longitudinal losses come from the same
    // rolling-resistance law as variant b's, and the difference between the
    // variants is contact GEOMETRY (real cylinders on the chord staircase),
    // which is the thing being compared.
    const fwdAxis = qrot(quat, v(1, 0, 0));
    const axleAxis = qrot(quat, v(0, 0, 1));
    const spinWant = vscale(axleAxis, -vdot(lv, fwdAxis) / CAR.wheelR);
    // Audit book-keeping (WORK.on only): the spin reset is KINEMATIC, so its
    // KE delta is whatever it is — a cylinder's axial inertia is a close
    // enough moment for the ledger (the off-axle components this zeroes are
    // solver-born and land in the audit's residual otherwise).
    if (WORK.on) {
      const aw0 = wheel.angvel();
      const Iw = 0.5 * mw * CAR.wheelR * CAR.wheelR;
      addWork('spin', 0.5 * Iw * (vlen(spinWant) ** 2 - vlen(aw0) ** 2));
    }
    wheel.setAngvel(spinWant, true);
    const imp = vadd(
      vscale(inPlane, mw * 0.9), // velocity match: gain < 1 for stability
      vscale(up, (-axial * 1400 - axialV * 60) * mw * FIXED_DT),
    );
    if (vlen(imp) < mw * 400 * FIXED_DT) {
      { addWork('axle', vdot(imp, lv) + vdot(imp, imp) / (2 * mw)); wheel.applyImpulse(imp, true); }
    }
  }
  return {
    grounded: support.grounded,
    force: support.force,
    grip: support.grip,
    gripPerWheel: support.gripPerWheel,
    slipPerWheel: support.slipPerWheel,
    contactPerWheel: support.contactPerWheel,
  };
}

/**
 * Rolling resistance + bearing friction, the one tuned loss term (brief §7.1).
 * A constant deceleration coeff (dimensionless, "effective mu") applied along
 * the horizontal velocity while grounded: F = -m * coeff * g_sim * vhat.
 * Tuned so a 30 cm drop on flat track rolls ~2.5 m in WORLD units.
 */
export function applyRollingResistance(
  car: Car,
  grounded: boolean,
  coeff: number,
  grip?: { grip: number; gripPerWheel: readonly number[]; contactPerWheel?: readonly boolean[] },
): void {
  if (!grounded || coeff <= 0) return;
  const lv = car.chassis.linvel();
  const hv = v(lv.x, 0, lv.z);
  const l = Math.sqrt(vdot(hv, hv));
  if (l < 0.05) return;
  const f = car.chassis.mass() * coeff * G_SIM * FIXED_DT * (grip ? grip.grip : 1);
  { addWork('rr', -f * l + (f * f) / (2 * car.chassis.mass())); car.chassis.applyImpulse(vscale(hv, -f / l), true); }
  // PER-WHEEL friction, honestly split: each wheel's SHARE of the drag is
  // scaled by the grip at ITS OWN contact (`gripPerWheel`), so a car
  // straddling a wet-patch edge drags more on the dry side — the same
  // tank-steering yaw a real toy gets crossing a slick line. The main
  // impulse above already carries the mean-grip magnitude, so this term
  // adds ONLY the yaw moment of the deviations, about the chassis up
  // axis. Uniform grip (the ONLY state a hazard-free run ever has) makes
  // every deviation exactly zero and the guard skips — dry stays
  // bit-identical.
  if (grip) {
    const mean = grip.grip;
    const share = (car.chassis.mass() / 4) * coeff * G_SIM * FIXED_DT;
    const q = car.chassis.rotation();
    const quatR = { w: q.w, x: q.x, y: q.y, z: q.z };
    let tau = v(0, 0, 0);
    let any = false;
    for (let k = 0; k < 4; k++) {
      if (grip.contactPerWheel && !grip.contactPerWheel[k]) continue; // no patch, no share
      const dg = grip.gripPerWheel[k]! - mean;
      if (dg === 0) continue;
      any = true;
      const r = qrot(quatR, car.attach[k]!);
      tau = vadd(tau, vcross(r, vscale(hv, (-share * dg) / l)));
    }
    if (any) {
      // YAW component only: the pitch/roll parts of a per-wheel drag offset
      // belong to the suspension attitude laws, not to this one.
      const up = qrot(quatR, v(0, 1, 0));
      const j = vscale(up, vdot(up, tau));
      const j2 = vdot(j, j);
      if (j2 > 0) {
        const Iy = (car.chassis.mass() / 12) * (4 * CAR.halfL * CAR.halfL + 4 * CAR.halfW * CAR.halfW);
        const wv = car.chassis.angvel();
        { addWork('rrYaw', vdot(j, wv) + (0.5 * j2) / Iy); car.chassis.applyTorqueImpulse(j, true); }
      }
    }
  }
}

/** World-space speed of the chassis (sim units). */
export function carSpeed(car: Car): number {
  const lv = car.chassis.linvel();
  return Math.sqrt(lv.x * lv.x + lv.y * lv.y + lv.z * lv.z);
}

export function carVel(car: Car): Vec {
  const lv = car.chassis.linvel();
  return v(lv.x, lv.y, lv.z);
}

export { vcross };
