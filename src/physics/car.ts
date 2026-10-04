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
  // suspension: variant b full spring; variant a support spring at the axle
  // (revolute joints alone are too soft in Rapier's solver to carry the
  // chassis — measured: 0.3 m sag, chassis ploughs through slabs)
  suspRest: 0.42,
  suspK: 12000,
  suspC: 550,
  // Push-side force ceiling. A 6g+ loop-bottom load has to fit inside the
  // travel x rate envelope (k * suspRest = 5040 at suspK 12000), so this
  // ceiling only bites on hard landings. The PULL side has its own, much
  // smaller cap (droopMaxForce) - an airborne car must never be reeled in
  // hard by a long leash.
  suspMaxForce: 20000,
  droopMaxForce: 6000,
  // DROOP STOP (the tension side of the strut): pulled along the ray toward
  // the deck hit once the strut extends past suspRest by up to droopMax.
  // A push-only strut cannot run a loop inverted: hung d below the deck line
  // (this car d ~ 0.83 r at the loop radius), gravity OVERSHOOTS the apex
  // centripetal demand and the chassis free-falls away from the deck — the
  // "passes the loop, never runs it" failure. A real (rigid-wheeled) toy is
  // tension-constrained to orbit its wheel line; droopK enforces that, and
  // droopMax bounds the leash so a genuinely airborne car is not reeled in
  // (no maglev: beyond rest+droopMax the strut is slack, forceless).
  // The droop side is the axle tether: a real toy's chassis is
  // kinematically forbidden from getting away from its wheel line (the
  // axle carries tension directly). The leash must be LONGER than the
  // chassis's own droop sag off the wheel line (wheelY + rest geometry =
  // ~0.55 sim), or it goes slack in exactly the tension quadrants of a
  // loop and the car free-falls through the apex (measured: peel-off at
  // ph ~150 with the wheels 3 mm off the deck). With that travel comes a
  // lower rate so the stop stays sub-critical and cannot catapult
  // (see the tension note in supportStep).
  droopK: 90000,
  // Damper sized to THAT spring (zeta ~0.5 at the stop), not to suspC:
  // against droopK 400000 the suspC-scaled damper is zeta 0.04, and an
  // undamped hard stop is a catapult (see the tension note in supportStep).
  droopC: 1050, // zeta ~0.4 at droopK
  droopMax: 0.15,
  bumpSpeed: 6.6, // sim m/s: one step of full-throttle spring dV — see the catcher note
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
export const WORK: Record<string, number> & { on?: boolean } = {};
function work(name: string, imp: Vec, vel: Vec): void {
  if (!WORK.on) return;
  WORK[name] = (WORK[name] ?? 0) + (imp.x * vel.x + imp.y * vel.y + imp.z * vel.z);
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

// variant b suspension attach points (on the chassis box itself)
const ATTACH_LOCAL: Vec[] = [
  v(CAR.wheelX, -0.1, CAR.wheelZ),
  v(CAR.wheelX, -0.1, -CAR.wheelZ),
  v(-CAR.wheelX, -0.1, CAR.wheelZ),
  v(-CAR.wheelX, -0.1, -CAR.wheelZ),
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
}

/** Per-step update. Variant b applies spring/damper forces; a relies on joints. */
export function carStep(world: RAPIER.World, car: Car): WheelSupport {
  if (car.variant === 'raycastWheels') return supportStep(world, car);
  return jointedStep(world, car);
}

function chassisFrame(car: Car): { pos: Vec; quat: Quat; up: Vec } {
  const t = car.chassis.translation();
  const r = car.chassis.rotation();
  const quat: Quat = { w: r.w, x: r.x, y: r.y, z: r.z };
  return { pos: v(t.x, t.y, t.z), quat, up: qrot(quat, v(0, 1, 0)) };
}

/** Shared chassis support: contact-normal spring+damper at each mount. */
function supportStep(world: RAPIER.World, car: Car): WheelSupport {
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
  for (let k = 0; k < car.attach.length; k++) {
    const aLocal = car.attach[k]!;
    const attach = vadd(pos, qrot(quat, aLocal));
    const down = vscale(qrot(quat, v(0, -1, 0)), 1);
    const ray = new RAPIER.Ray(attach, down);
    // Never support the chassis on a wheel body (variant a): ignore bit2.
    const pred = car.wheels.length > 0
      ? (c: RAPIER.Collider): boolean => (c.collisionGroups() >>> 16 & 0x4) === 0
      : undefined;
    const hit = world.castRayAndGetNormal(ray, CAR.suspRest + 0.35, true, undefined, undefined, undefined, car.chassis, pred);
    if (hit === null) continue;
    const toi = hit.timeOfImpact;
    const compression = CAR.suspRest - toi;
    // Bump stop: inside the last stretch of travel, cancel the approach
    // velocity outright. Without it a >5 m/s landing walks the chassis
    // through the deck faster than the explicit spring can react, and a
    // buried chassis anchors on slab end-faces (nose plough). Measured on
    // the kit ramps this catcher is also what makes the ramp->flat valley
    // crossing CLEAN (roll metric 2.64 m with it, 1.47 m stalled without
    // the full-stop — the spring/damper alone soak the deck approach over
    // many steps and the car never recovers it). Two tried "improvements"
    // regressed it: a tighter toi<0.08 window and a >1.5 m/s speed gate.
    if (toi < 0.14) {
      const nB = v(hit.normal.x, hit.normal.y, hit.normal.z);
      const upB = qrot(quat, v(0, 1, 0));
      if (vdot(nB, upB) > 0.7) {
        const vb = car.chassis.velocityAtPoint(attach);
        const vn = vdot(v(vb.x, vb.y, vb.z), nB);
        // The catcher fires only where the spring could NOT react in time:
        // a faster approach than one step's full-throttle spring dV, or a
        // compression already past most of the travel. Letting the spring
        // otherwise do its job matters: a loop circle is a ~19-step
        // staircase of chords (rings cannot merge — each turns ~19 deg), so
        // the deck approaches the car continuously at a few cm/s, and a
        // full-stop bump stop there dumps that climb — i.e. forward speed —
        // inelastically every step (measured: stall at the loop bottom).
        if (vn < 0 && (vn < -CAR.bumpSpeed || compression > 0.75 * CAR.suspRest)) {
          { const imp = vscale(nB, -vn * car.chassis.mass() / 4); work('catch', imp, v(vb.x, vb.y, vb.z)); car.chassis.applyImpulseAtPoint(imp, attach, true); }
        }
      }
    }
    if (compression <= 0) {
      // DROOP-STOP side of the strut. The damper is two-sided physics (a
      // real strut damps both ways); the pull is the droop stop, zero until
      // the arm passes rest, maxed at droopMax past the rest length.
      const nD = v(hit.normal.x, hit.normal.y, hit.normal.z);
      const upD = qrot(quat, v(0, 1, 0));
      if (-compression <= CAR.droopMax && vdot(nD, upD) > 0.7) {
        grounded = true;
        const mc = car.chassis.mass() / 4;
        const vb = car.chassis.velocityAtPoint(attach);
        const v3 = v(vb.x, vb.y, vb.z);
        // strut-axis extension rate, as on the compression side
        const relA = vdot(v3, down);
        const dampFrac = Math.min(1, (CAR.droopC * FIXED_DT) / mc);
        { const imp = vscale(down, -relA * dampFrac * mc); work('droopD', imp, v3); car.chassis.applyImpulseAtPoint(imp, attach, true); }
        const t = Math.min(CAR.droopK * -compression, CAR.droopMaxForce);
        { const imp = vscale(nD, -t * FIXED_DT); work('droopT', imp, v3); car.chassis.applyImpulseAtPoint(imp, attach, true); }
        normImpulse += t * FIXED_DT;
        springForce += t;
        deckN = vadd(deckN, nD); deckHits++;
      } else if (-compression <= CAR.droopMax) {
        // guide-side droop stop: undamped, budget-clamped (see the filtered
        // contact note below the push branch)
        const t = Math.min(CAR.droopK * -compression, CAR.droopMaxForce);
        car.chassis.applyImpulseAtPoint(vscale(nD, -t * FIXED_DT), attach, true);
        springForce += t;
        grounded = true;
        deckN = vadd(deckN, nD); deckHits++;
      }
      continue;
    }
    const n0 = v(hit.normal.x, hit.normal.y, hit.normal.z);
    const upW = qrot(quat, v(0, 1, 0));
    if (vdot(n0, upW) < 0.7) {
      // FILTERED CONTACT (loop-wall facing / unaligned orbit). The stage-1
      // model dropped these hits wholesale ("seam/edge hits are not
      // support") — fine on flat ground, fatal inside a loop where it
      // starves the orbit of centripetal load and denies the aligning
      // torque: the chassis can never rotate onto a wall it is pushing on.
      // A push-only, undamped, budget-clamped normal spring aligns and
      // supports without re-introducing the riser plough — the plough was
      // the velocity cancellation on these hits, which stays excluded.
      if (compression > 0) {
        const f = Math.min(CAR.suspK * compression, CAR.suspMaxForce);
        { const imp = vscale(n0, f * FIXED_DT); const lv0 = car.chassis.linvel(); work('guideS', imp, v(lv0.x, lv0.y, lv0.z)); car.chassis.applyImpulseAtPoint(imp, attach, true); }
        springForce += f;
        grounded = true;
        deckN = vadd(deckN, n0); deckHits++;
      }
      // Deliberately UNVIGORED: along the normal a damper here is the
      // riser plough; and a skim at deck height would find soft sand where
      // the car should bounce. Align-only, push/pull-only, budget-clamped.
      continue; // never the support/anti-roll/feeler path
    }
    grounded = true;
    const mc = car.chassis.mass() / 4;
    const vb = car.chassis.velocityAtPoint(attach);
    const v3 = v(vb.x, vb.y, vb.z);
    const relV = vdot(v3, n0);
    const side = aLocal.z >= 0 ? 1 : 0;
    sideSum[side] += relV;
    sideN[side] = n0;
    sidePt[side] = attach;
    // Push along the CONTACT NORMAL: a support force tilted with body pitch
    // creates slope drag that can exactly balance gravity and stall the car.
    // The DAMPER is different: it measures the STRUT EXTENSION RATE (velocity
    // along the strut axis = the ray direction), never the contact-normal
    // velocity. Along the normal it reads the car's own orbital motion
    // wherever the deck curves (v·sin(turn angle)) and the fraction-velocity
    // cancellation then brakes the suspension against steady cornering -
    // measured: violent loop pumping that throws the car off the deck past
    // ph ~250 at any energy above threshold. Along the axis, a car tracking
    // the deck has ~zero extension rate anywhere: straights, valleys, ramps,
    // loops, and the damper stops fighting the geometry it is meant to
    // settle. Semi-implicit damper first, then the explicit spring term.
    const dampFrac = Math.min(1, (CAR.suspC * FIXED_DT) / mc);
    const relA = vdot(v3, down);
    { const imp = vscale(down, -relA * dampFrac * mc); work('damp', imp, v3); car.chassis.applyImpulseAtPoint(imp, attach, true); }
    const f = Math.min(Math.max(CAR.suspK * compression, 0), CAR.suspMaxForce);
    { const imp = vscale(n0, f * FIXED_DT); work('spring', imp, v3); car.chassis.applyImpulseAtPoint(imp, attach, true); }
    normImpulse += f * FIXED_DT;
    springForce += f;
    deckN = vadd(deckN, n0); deckHits++;

    // Channel-contact feeler (the actual steering mechanism — see
    // CAR.railSlack): a short lateral ray at rail-lip height, out from this
    // wheel's centre plane. The deck hit gives the contact patch; +n *
    // railBand lands in the lip's vertical band; a hit nearer than the
    // wheel-side clearance means this wheel has reached the channel wall.
    // The wall FORCE is applied once per side at the centre of mass after
    // the mount loop — see the note there.
    const contact = vadd(attach, vscale(down, toi));
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
          // look range, not with the (tiny) clearance — measured教训: a
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
          const dFrac = Math.min(0.5, (CAR.railC * FIXED_DT) / mc);
          if (vOut > 0) car.chassis.applyImpulseAtPoint(vscale(railN, vOut * dFrac * mc), pc, true);
          const rf = Math.min(CAR.railK * pen, CAR.suspMaxForce);
          car.chassis.applyImpulseAtPoint(vscale(railN, rf * FIXED_DT), pc, true);
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
    const raw = vscale(vcross(car.deckPrev, nBar), 2 / FIXED_DT); // raw frame spin
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
    const pTerm = em > 1e-6 && em < 0.85 ? vscale(vnorm(err), Math.min(em, 0.35) * 40) : v(0, 0, 0);
    // Tensor-correct authority: this chassis's roll inertia is ~4x smaller
    // than its pitch inertia (flat, wide box), so a scalar-I torque law
    // overdrives ROLL ninefold - measured: the roll mode exploded to
    // -58 rad/s about the apex and threw the car sideways off the deck.
    // Transform dw to chassis frame, scale by the principal inertias,
    // transform back.
    const mass = car.chassis.mass();
    // box collider cuboid(halfL, halfH, halfW): principal inertias
    const Ix = (mass / 3) * (CAR.halfH * CAR.halfH + CAR.halfW * CAR.halfW);
    const Iy = (mass / 3) * (CAR.halfL * CAR.halfL + CAR.halfW * CAR.halfW);
    const Iz = (mass / 3) * (CAR.halfL * CAR.halfL + CAR.halfH * CAR.halfH);
    const Ivec = v(Ix, Iy, Iz);
    const dwW = vsub(vadd(wDeck, pTerm), wc);
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
    if (jm > 1e-9) car.chassis.applyTorqueImpulse(j, true);
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
      car.chassis.applyTorqueImpulse(vscale(fwd, -Math.sign(rollRate) * j), true);
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
          const budget = CAR.alignGrip * normImpulse * CAR.wheelX;
          const j = Iy * (wantW - wUp);
          const jm = Math.min(Math.abs(j), budget);
          if (jm > 1e-9) car.chassis.applyTorqueImpulse(vscale(up, Math.sign(j) * jm), true);
        }
      }
    }
  }
  return { grounded, force: springForce };
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
function jointedStep(world: RAPIER.World, car: Car): WheelSupport {
  const support = supportStep(world, car);
  const { pos, quat } = chassisFrame(car);
  for (let k = 0; k < 4; k++) {
    const wheel = car.wheels[k];
    const wp0 = wheel.translation();
    const wp = v(wp0.x, wp0.y, wp0.z);
    // PD centring under the mount, clamped (an unclamped PD flings wheels;
    // see probe39 note). The stage-1 clamp ceiling (25 sim/s^2) sat BELOW the
    // chassis ramp acceleration (~60), so the wheels lagged metres behind
    // their mounts and fell off the deck on kit hulls — the "variant a rolls
    // 0.7 m on kit colliders" number was wheel scatter, not the car. Re-
    // trimmed around a ~6 Hz critically-damped strut with a 300 accel clamp.
    const attach = vadd(pos, qrot(quat, car.attach[k]));
    const mw = wheel.mass();
    const lv = wheel.linvel();
    const cv = car.chassis.linvel();
    const clamp = (x: number): number => Math.min(Math.max(x, -0.25), 0.25);
    const fx = clamp(attach.x - wp.x) * mw * 1400 - (lv.x - cv.x) * mw * 60;
    const fz = clamp(attach.z - wp.z) * mw * 1400 - (lv.z - cv.z) * mw * 60;
    if (Number.isFinite(fx) && Number.isFinite(fz)) {
      wheel.applyImpulse(
        v(Math.min(Math.max(fx, -mw * 300), mw * 300) * FIXED_DT, 0,
          Math.min(Math.max(fz, -mw * 300), mw * 300) * FIXED_DT), true,
      );
    }
  }
  return { grounded: support.grounded, force: support.force };
}

/**
 * Rolling resistance + bearing friction, the one tuned loss term (brief §7.1).
 * A constant deceleration coeff (dimensionless, "effective mu") applied along
 * the horizontal velocity while grounded: F = -m * coeff * g_sim * vhat.
 * Tuned so a 30 cm drop on flat track rolls ~2.5 m in WORLD units.
 */
export function applyRollingResistance(car: Car, grounded: boolean, coeff: number): void {
  if (!grounded || coeff <= 0) return;
  const lv = car.chassis.linvel();
  const hv = v(lv.x, 0, lv.z);
  const l = Math.sqrt(vdot(hv, hv));
  if (l < 0.05) return;
  const f = car.chassis.mass() * coeff * G_SIM * FIXED_DT;
  { const imp = vscale(hv, -f / l); work('roll', imp, v(lv.x, lv.y, lv.z)); car.chassis.applyImpulse(imp, true); }
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
