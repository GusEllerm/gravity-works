/**
 * Thin, rendering-agnostic Rapier wrapper for Gravity Works.
 *
 * Scale: visual scale is 1:64 but we simulate big and heavy. SIM_SCALE S = 10:
 *   length_sim  = S * length_world
 *   mass_sim    = S^3 * mass_world      (density is scale-invariant)
 *   gravity_sim = S * g                 (keeps wall-clock time identical)
 *   speed_sim   = S * speed_world       (v = g*t with time unchanged: NOT
 *                                        sqrt(S) — sqrt(S) is the mapping for
 *                                        the OTHER scaling, same-g/longer-
 *                                        time, and using it here inflated
 *                                        every reported speed by sqrt(S)=3.16
 *                                        — the stage-2 loop-gate audit found
 *                                        an apex-speed floor thereby bogus-
 *                                        passing: the sim speed of a car that
 *                                        never HELD the loop read 3.16x over
 *                                        the sqrt(g r) floor once divided by
 *                                        the wrong factor.)
 * So a 0.05 kg toy behaves, to the digit, like a ~50 kg object 75 cm long
 * falling in 10g — which is what the f32 solver likes. All conversions live
 * here; see docs/vault/Concepts/Feel.md "Physics scale factor".
 */
import RAPIER from '@dimforge/rapier3d-compat';

export { RAPIER };

export const SIM_SCALE = 10;
export const S = SIM_SCALE;
export const S2 = S * S;
export const G_WORLD = 9.81;
export const G_SIM = G_WORLD * S;
export const WORLD_MASS_KG = 0.05;

/** Fixed timestep — never variable (brief §7.1). */
export const FIXED_DT = 1 / 120;
/** State hash cadence: every 10 steps (brief §7.1). */
export const HASH_INTERVAL = 10;

export type Vec = { x: number; y: number; z: number };
export type Quat = { w: number; x: number; y: number; z: number };

export const v = (x: number, y: number, z: number): Vec => ({ x, y, z });
export const vadd = (a: Vec, b: Vec): Vec => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
export const vsub = (a: Vec, b: Vec): Vec => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
export const vscale = (a: Vec, k: number): Vec => ({ x: a.x * k, y: a.y * k, z: a.z * k });
export const vdot = (a: Vec, b: Vec): number => a.x * b.x + a.y * b.y + a.z * b.z;
export const vcross = (a: Vec, b: Vec): Vec => ({
  x: a.y * b.z - a.z * b.y,
  y: a.z * b.x - a.x * b.z,
  z: a.x * b.y - a.y * b.x,
});
export const vlen = (a: Vec): number => Math.sqrt(vdot(a, a));
export const vnorm = (a: Vec): Vec => {
  const l = vlen(a);
  return l > 0 ? vscale(a, 1 / l) : v(0, 0, 0);
};

/** Rodrigues rotation of a around axis k (unit) by angle a. */
export function vrot(a: Vec, axis: Vec, angle: number): Vec {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return vadd(
    vadd(vscale(a, c), vscale(vcross(axis, a), s)),
    vscale(axis, vdot(axis, a) * (1 - c)),
  );
}

/** Quaternion whose columns are (f, u, f x u) — a body-local frame. */
export function quatFromBasis(f: Vec, u: Vec): Quat {
  const r = vnorm(vcross(f, u));
  const ff = vnorm(f);
  const uu = vcross(r, ff); // re-orthogonalised column y
  const m = [ff.x, uu.x, r.x, ff.y, uu.y, r.y, ff.z, uu.z, r.z]; // row-major
  const tr = m[0] + m[4] + m[8];
  let q: Quat;
  if (tr > 0) {
    const s4 = Math.sqrt(tr + 1) * 2;
    q = { w: 0.25 * s4, x: (m[7] - m[5]) / s4, y: (m[2] - m[6]) / s4, z: (m[3] - m[1]) / s4 };
  } else if (m[0] > m[4] && m[0] > m[8]) {
    const s4 = Math.sqrt(1 + m[0] - m[4] - m[8]) * 2;
    q = { w: (m[7] - m[5]) / s4, x: 0.25 * s4, y: (m[1] + m[3]) / s4, z: (m[2] + m[6]) / s4 };
  } else if (m[4] > m[8]) {
    const s4 = Math.sqrt(1 + m[4] - m[0] - m[8]) * 2;
    q = { w: (m[2] - m[6]) / s4, x: (m[1] + m[3]) / s4, y: 0.25 * s4, z: (m[5] + m[7]) / s4 };
  } else {
    const s4 = Math.sqrt(1 + m[8] - m[0] - m[4]) * 2;
    q = { w: (m[3] - m[1]) / s4, x: (m[2] + m[6]) / s4, y: (m[7] + m[5]) / s4, z: 0.25 * s4 };
  }
  const n = Math.sqrt(q.w * q.w + q.x * q.x + q.y * q.y + q.z * q.z);
  return { w: q.w / n, x: q.x / n, y: q.y / n, z: q.z / n };
}

export function qrot(q: Quat, a: Vec): Vec {
  const qv = v(q.x, q.y, q.z);
  const t = vcross(qv, a);
  return vadd(vadd(a, vscale(t, 2 * q.w)), vscale(vcross(qv, t), 2));
}

// ---- world lifecycle -------------------------------------------------------

let rapierReady: Promise<void> | null = null;
export function initRapier(): Promise<void> {
  if (!rapierReady) rapierReady = RAPIER.init();
  return rapierReady;
}

export function createWorld(): RAPIER.World {
  const world = new RAPIER.World(v(0, -G_SIM, 0));
  world.timestep = FIXED_DT;
  return world;
}

/** Static compound-convex collider set (slab boxes) from builder output. */
export function addStaticBoxes(
  world: RAPIER.World,
  boxes: readonly { center: Vec; half: Vec; quat: Quat }[],
  friction = 0.6,
): RAPIER.Collider[] {
  const body = world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
  return boxes.map((b) =>
    world.createCollider(
      RAPIER.ColliderDesc.cuboid(b.half.x, b.half.y, b.half.z)
        .setTranslation(b.center.x, b.center.y, b.center.z)
        .setRotation(b.quat)
        .setFriction(friction)
        .setRestitution(0)
        // Track = explicit membership bit0, filter all. Not the default
        // all-ones group: the suspension rays exclude the car's wheel group
        // (bit2) by a membership predicate, and an all-ones track matches
        // that mask too — which silently filtered the TRACK out of every
        // variant-a support ray (the car fell onto its chassis box).
        .setCollisionGroups(0x0001_ffff),
      body,
    ),
  );
}

/** Static trimesh collider from builder output (friction = toy plastic). */
export function addStaticTrimesh(
  world: RAPIER.World,
  vertices: Float32Array,
  indices: Uint32Array,
  friction = 0.05,
): RAPIER.Collider {
  const body = world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
  return world.createCollider(RAPIER.ColliderDesc.trimesh(vertices, indices).setFriction(friction), body);
}

// ---- determinism hashing ---------------------------------------------------

const FNV_PRIME = 0x01000193;

function fnvMix(h: number, word: number): number {
  let x = (h ^ (word >>> 0)) >>> 0;
  x = Math.imul(x, FNV_PRIME) >>> 0;
  return x;
}

/**
 * Poison words for non-finite state. `Math.round(NaN) | 0` is 0, so a naive
 * quantisation would hash a NaN-diverged run identically to a run parked at
 * exactly 0 — the determinism test would pass on dead state (stage-1 review
 * finding 7). NaN and each infinity get their own word instead; a hash that
 * contains them can never equal a healthy run's.
 */
export const QUANT_NAN_WORD = 0x7a7a_01c0 >>> 0;
export const QUANT_POSINF_WORD = 0x7a7a_01c1 >>> 0;
export const QUANT_NEGINF_WORD = 0x7a7a_01c2 >>> 0;

/** Quantise a float to a stable 32-bit word (position step 1e-4, quat 1e-5). */
export function quant(x: number, step: number): number {
  if (Number.isNaN(x)) return QUANT_NAN_WORD;
  if (x === Infinity) return QUANT_POSINF_WORD;
  if (x === -Infinity) return QUANT_NEGINF_WORD;
  const q = Math.round(x / step) | 0;
  return q >>> 0;
}

/**
 * FNV-1a state hash: folds every given dynamic body's quantised transform
 * into an accumulator. Call every HASH_INTERVAL steps over the run's car
 * bodies (creation order = deterministic).
 */
export function hashBodies(bodies: readonly RAPIER.RigidBody[], prev: number): number {
  let h = prev >>> 0;
  for (const rb of bodies) {
    const p = rb.translation();
    const r = rb.rotation();
    h = fnvMix(h, quant(p.x, 1e-4));
    h = fnvMix(h, quant(p.y, 1e-4));
    h = fnvMix(h, quant(p.z, 1e-4));
    h = fnvMix(h, quant(r.x, 1e-5));
    h = fnvMix(h, quant(r.y, 1e-5));
    h = fnvMix(h, quant(r.z, 1e-5));
    h = fnvMix(h, quant(r.w, 1e-5));
  }
  return h >>> 0;
}

export function hashHex(h: number): string {
  return (h >>> 0).toString(16).padStart(8, '0');
}

/** One fixed step; the scenario loop decides when to call hashState (every HASH_INTERVAL). */
export function stepWorld(world: RAPIER.World): void {
  world.step();
}

// ---- unit conversions to world (1:64 toy) units ----------------------------

export const toWorldDist = (dSim: number): number => dSim / S;
/** v_world = v_sim / S: length x S with time unchanged (g x S) makes velocity
 *  scale at S, not sqrt(S).) */
export const toWorldSpeed = (vSim: number): number => vSim / S;
/** momentum/impulse: mass x S^3 and velocity x S => j_world = j_sim / S^4. */
export const toWorldImpulse = (jSim: number): number => jSim / (S2 * S2);
