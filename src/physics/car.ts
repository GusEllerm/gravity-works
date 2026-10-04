/**
 * The Gravity Works car — one chassis, two wheel models (the stage-1 bake-off).
 *
 * Variant "wheelColliders": four cylinder colliders on free revolute joints.
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
  vscale,
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
  wheelFriction: 0.05, // low so the static-friction cone can never "brake-lock" a wheel
  chassisFriction: 0.01,
  // suspension: variant b full spring; variant a support spring at the axle
  // (revolute joints alone are too soft in Rapier's solver to carry the
  // chassis — measured: 0.3 m sag, chassis ploughs through slabs)
  suspRest: 0.42,
  suspK: 12000,
  suspC: 260,
  suspMaxForce: 9000,
  armRest: 0.25, // variant a spring arm rest length (attach -> wheel centre)
  armK: 25000,
  rideH: 0.4, // chassis centre height above floor at spawn
} as const;

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

export function spawnCar(world: RAPIER.World, variant: CarVariant, pose: Pose): Car {
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
        RAPIER.ColliderDesc.ball(CAR.wheelR)
          .setDensity(CAR.wheelDensity)
          .setFriction(CAR.wheelFriction)
          .setRestitution(0)
          // group: wheel = bit2, collides with nothing (see jointedStep
          // docs): jointed wheels plough their own load path on this build,
          // so variant a's wheels are telemetry bodies - they still add
          // real mass and rotational inertia through the joints.
          .setCollisionGroups(0x0004_0000),
        wheel,
      );
      wheels.push(wheel);
    }
  }
  // Launch-gate release: start rolling without slip (variant a) at a small
  // forward speed; identical for both variants so the bake-off is fair.
  const v0 = 3;
  chassis.setLinvel(vscale(pose.f, v0), true);
  for (const wn of wheels) {
    wn.setLinvel(vscale(pose.f, v0), true);
    wn.setAngvel(v(0, 0, -v0 / CAR.wheelR), true);
  }
  return { variant, chassis, wheels, attach: variant === 'raycastWheels' ? ATTACH_LOCAL : WHEEL_LOCAL, quat0: q, mass: chassis.mass() };
}

export interface WheelSupport {
  grounded: boolean;
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
  for (const aLocal of car.attach) {
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
    // Bump stop: inside the last sliver of travel, cancel the approach
    // velocity outright. Without it a >5 m/s landing walks the chassis
    // through the deck faster than the explicit spring can react, and a
    // buried chassis anchors on slab end-faces (nose plough).
    if (toi < 0.14) {
      const nB = v(hit.normal.x, hit.normal.y, hit.normal.z);
      const upB = qrot(quat, v(0, 1, 0));
      if (vdot(nB, upB) > 0.7) {
        const vb = car.chassis.velocityAtPoint(attach);
        const vn = vdot(v(vb.x, vb.y, vb.z), nB);
        if (vn < 0) car.chassis.applyImpulseAtPoint(vscale(nB, -vn * car.chassis.mass() / 4), attach, true);
      }
    }
    if (compression <= 0) continue;
    const n0 = v(hit.normal.x, hit.normal.y, hit.normal.z);
    const upW = qrot(quat, v(0, 1, 0));
    if (vdot(n0, upW) < 0.7) continue; // seam/edge hits are not support
    grounded = true;
    const mc = car.chassis.mass() / 4;
    const vb = car.chassis.velocityAtPoint(attach);
    const relV = vdot(v(vb.x, vb.y, vb.z), n0);
    // Push along the CONTACT NORMAL: a support force tilted with body pitch
    // creates slope drag that can exactly balance gravity and stall the car.
    // Semi-implicit damper first, then the explicit spring term.
    const dampFrac = Math.min(1, (CAR.suspC * FIXED_DT) / mc);
    car.chassis.applyImpulseAtPoint(vscale(n0, -relV * dampFrac * mc), attach, true);
    const f = Math.min(Math.max(CAR.suspK * compression, 0), CAR.suspMaxForce);
    car.chassis.applyImpulseAtPoint(vscale(n0, f * FIXED_DT), attach, true);
  }
  return { grounded };
}

/**
 * Variant a step — physical wheel colliders.
 * Each wheel is a free dynamic body riding on its own stiff tyre spring and
 * pressed to the surface; a clamped PD keeps it under its chassis mount;
 * the chassis itself is carried by the same contact-normal coil springs
 * variant b uses. Wheel-track contacts are REAL colliders: wheel angular
 * dynamics emerge from solver friction, and the wheel-speed vs ground-speed
 * telemetry differs from variant b by genuine wheel physics.
 *
 * Why not joint-carried wheels? Measured on this Rapier build at 120 Hz,
 * joint load paths either brake-lock the car (the static friction cone
 * holds 70 kg on a 12 degree slope) or sink the chassis and wheels into
 * the track slabs (position-joint softness); see probes 31-43. Springs
 * everywhere was the only stable arrangement, and revolute joints were
 * dropped entirely. That is the bake-off finding for variant a.
 */
function jointedStep(world: RAPIER.World, car: Car): WheelSupport {
  const support = supportStep(world, car);
  const { pos, quat } = chassisFrame(car);
  for (let k = 0; k < 4; k++) {
    const wheel = car.wheels[k];
    const wp0 = wheel.translation();
    const wp = v(wp0.x, wp0.y, wp0.z);
    // PD centring under the mount, clamped (an unclamped PD flings wheels;
    // see probe39 note).
    const attach = vadd(pos, qrot(quat, car.attach[k]));
    const mw = wheel.mass();
    const lv = wheel.linvel();
    const cv = car.chassis.linvel();
    const clamp = (x: number): number => Math.min(Math.max(x, -0.04), 0.04);
    const fx = clamp(attach.x - wp.x) * mw * 625 - (lv.x - cv.x) * mw * 50;
    const fz = clamp(attach.z - wp.z) * mw * 625 - (lv.z - cv.z) * mw * 50;
    if (Number.isFinite(fx) && Number.isFinite(fz)) {
      wheel.applyImpulse(
        v(Math.min(Math.max(fx, -mw * 25), mw * 25) * FIXED_DT, 0,
          Math.min(Math.max(fz, -mw * 25), mw * 25) * FIXED_DT), true,
      );
    }
  }
  return { grounded: support.grounded };
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
  car.chassis.applyImpulse(vscale(hv, -f / l), true);
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
