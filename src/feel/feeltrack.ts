/**
 * PROVISIONAL stage-1 feel track — hand-coded, self-contained, throwaway.
 * This is NOT the stage-2 track kit; it exists only to bake off the two car
 * wheel models and to source the feel-metric tests. Do not build on it.
 *
 * Everything is WORLD units (1:64 toy world) in the *_ constant tables and is
 * multiplied by SIM_SCALE when geometry is emitted. A centreline is integrated
 * segment by segment (pitch/yaw/bank rates), then a solid channel cross-section
 * is swept along it into a trimesh: what you see is what you hit.
 */
import { S, quatFromBasis, v, vadd, vcross, vdot, vlen, vnorm, vrot, vscale, vsub, type Quat, type Vec } from '../physics/sim.ts';

// ---- channel cross-section (world units) -----------------------------------
export const CH_HALF_WIDTH = 0.032; // interior half-width
export const CH_WALL_HEIGHT = 0.05;
export const CH_THICKNESS = 0.022;

// ---- feel track (world units) -----------------------------------------------
export const DROP_HEIGHT = 0.3; // the brief's 30 cm drop
export const DROP_RAMP_ANGLE = 12; // deg
export const ENTRY_STRAIGHT = 0.9;
export const TURN_RADIUS = 0.55;
export const TURN_ANGLE = 100; // deg of yaw in the banked turn
export const BANK_ANGLE = 30; // deg
export const BANK_RAMP_LEN = 0.3; // world length to roll the bank in/out
export const MID_STRAIGHT = 0.45;
export const LOOP_RADIUS = 0.07; // threshold radius: completable from DROP_HEIGHT
export const LOOP_EXIT_STRAIGHT = 0.55;
export const LIP_ANGLE = 8; // deg, upward
export const LIP_LEN = 0.35;
export const GAP_LENGTH = 0.3;
export const LANDING_ANGLE = 8; // deg, downward, flattens out
export const LANDING_LEN = 0.3;
export const FINISH_STRAIGHT = 0.9;

// ---- roll-test track ---------------------------------------------------------
export const ROLL_FLAT_LENGTH = 6.5; // plenty for the ~2.5 m roll target

// ---- loop-test track -----------------------------------------------------------
export const LOOP_TEST_RAMP_ANGLE = 12; // deg
export const LOOP_TEST_BLEND = 0.35; // world length of the pitch blends

export interface Pose {
  p: Vec;
  f: Vec;
  u: Vec;
}

export interface BoxShape {
  center: Vec;
  half: Vec;
  quat: Quat;
}

export interface BuiltTrack {
  /** swept convex slabs — the brief's "compound convex colliders" */
  boxes: BoxShape[];
  poses: Pose[];
  /** named poses: index into poses + derived world position */
  marks: Record<string, Pose>;
}

interface Seg {
  len: number; // sim units
  pitch?: number; // total deg, + = climbing (rotate f toward u)
  yaw?: number; // total deg about u
  bank?: number; // total roll deg about f (bank in/out)
  ds?: number; // sim step
  skip?: boolean; // advance the frame, emit no triangles (the gap)
}

const D2R = Math.PI / 180;

/**
 * Sweep a solid U-channel along an integrated centreline as box slabs.
 * (Trimesh edges in rapier3d-compat 0.21 grip rolling bodies; convex slabs
 * roll clean and are the brief's sanctioned alternative.)
 */
export function buildTrack(segs: Seg[]): BuiltTrack {
  const w = CH_HALF_WIDTH * S;
  const hWall = CH_WALL_HEIGHT * S;
  const t = CH_THICKNESS * S;

  const boxes: BoxShape[] = [];
  const poses: Pose[] = [];
  const marks: Record<string, Pose> = {};
  const poseBad: boolean[] = [];

  let p = v(0, 0, 0);
  let f: Vec = v(1, 0, 0);
  let u: Vec = v(0, 1, 0);
  poses.push({ p, f, u });
  poseBad.push(false);

  for (const seg of segs) {
    const ds = seg.ds ?? 0.15;
    const steps = Math.max(1, Math.round(seg.len / ds));
    const dPitch = (seg.pitch ?? 0) * D2R / steps;
    const dYaw = (seg.yaw ?? 0) * D2R / steps;
    const dBank = (seg.bank ?? 0) * D2R / steps;
    const h = seg.len / steps;
    for (let i = 0; i < steps; i++) {
      const r = vnorm(vcross(f, u));
      if (dPitch !== 0) {
        f = vrot(f, r, dPitch);
        u = vrot(u, r, dPitch);
      }
      const uu = vnorm(u);
      if (dYaw !== 0) f = vrot(f, uu, dYaw);
      if (dBank !== 0) u = vrot(u, vnorm(f), dBank);
      u = vnorm(u);
      f = vnorm(f);
      p = vadd(p, vscale(f, h));
      poses.push({ p, f, u });
      poseBad.push(!!seg.skip);
    }
  }

  // Emit one chord slab per consecutive pose pair (shared corners => no ridges).
  const halfT = t / 2;
  for (let i = 0; i + 1 < poses.length; i++) {
    if (poseBad[i] || poseBad[i + 1]) continue;
    const a = poses[i];
    const b = poses[i + 1];
    const d = vsub(b.p, a.p);
    const len = vlen(d);
    if (len < 1e-6) continue;
    const fc = vscale(d, 1 / len);
    const uc0 = vnorm(vadd(a.u, b.u));
    // u_c orthogonal to f_c in the plane of the two ups
    const uc = vnorm(vsub(uc0, vscale(fc, vdot(uc0, fc))));
    const q = quatFromBasis(fc, uc);
    const mid = vadd(a.p, vscale(d, 0.5));
    const halfL = len * 0.6;
    boxes.push({ center: vadd(mid, vscale(uc, -halfT)), half: v(halfL, halfT, w + t), quat: q });
    for (const side of [-1, 1]) {
      const rc = vcross(fc, uc);
      boxes.push({
        center: vadd(vadd(mid, vscale(rc, side * (w + t / 2))), vscale(uc, (hWall - t) / 2)),
        half: v(halfL, (hWall + t) / 2, t / 2),
        quat: q,
      });
    }
  }
  return { boxes, poses, marks };
}

function mark(t: BuiltTrack, name: string, poseIndex: number): void {
  t.marks[name] = t.poses[poseIndex];
}

/** Length (sim) of the constant-slope part of a blended drop ramp for a target drop. */
function dropRampLength(dropSim: number, angleDeg: number, blendSim: number): number {
  const s = Math.sin(angleDeg * D2R);
  const blendDrop = blendSim * Math.sin((angleDeg / 2) * D2R);
  return Math.max(0.5, (dropSim - 2 * blendDrop) / s);
}

/** segs of the shared 30 cm drop ramp (start flat -> angle -> flat). */
function dropRampSegs(angleDeg: number, dropSim: number, blendSim: number): Seg[] {
  const flatLen = dropRampLength(dropSim, angleDeg, blendSim);
  return [
    { len: blendSim, pitch: -angleDeg, ds: 0.1 },
    { len: flatLen, ds: 1.0 },
    { len: blendSim, pitch: angleDeg, ds: 0.1 },
  ];
}

const blendOutSeg = (angleDeg: number, lenSim: number): Seg => ({ len: lenSim, pitch: angleDeg });

/** The provisional feel track: drop, straight, banked turn, loop, gap, landing, finish. */
export function buildFeelTrack(): BuiltTrack {
  const blend = 0.5; // sim units of blend on the drop ramp
  const turnLen = TURN_RADIUS * TURN_ANGLE * D2R * S;
  const loopLen = 2 * Math.PI * LOOP_RADIUS * S;
  const segs: Seg[] = [
    ...dropRampSegs(DROP_RAMP_ANGLE, DROP_HEIGHT * S, blend),
    { len: ENTRY_STRAIGHT * S, ds: 0.5 },
    { len: BANK_RAMP_LEN * S, bank: BANK_ANGLE, ds: 0.2 },
    { len: turnLen, yaw: TURN_ANGLE, ds: 0.25 },
    { len: BANK_RAMP_LEN * S, bank: -BANK_ANGLE, ds: 0.2 },
    { len: MID_STRAIGHT * S, ds: 0.5 },
    { len: loopLen, pitch: 360, ds: 0.1 },
    { len: LOOP_EXIT_STRAIGHT * S, ds: 0.4 },
    { len: LIP_LEN * S, pitch: LIP_ANGLE, ds: 0.15 },
    { len: GAP_LENGTH * S, skip: true },
    { len: LANDING_LEN * S, pitch: -LANDING_ANGLE, ds: 0.15 },
    blendOutSeg(LANDING_ANGLE, 0.2 * S),
    { len: FINISH_STRAIGHT * S, ds: 0.5 },
  ];
  const t = buildTrack(segs);
  // marks by walking the segment list
  const dsOf = (s: Seg): number => Math.max(1, Math.round(s.len / (s.ds ?? 0.15)));
  let idx = 0;
  const adv = (n: number): void => {
    idx += n;
  };
  for (const s of segs) {
    const before = idx;
    adv(dsOf(s));
    if (s.skip) mark(t, 'gapStart', before);
    if (s.pitch === -LANDING_ANGLE) mark(t, 'landStart', before);
    if (s.pitch === LIP_ANGLE) mark(t, 'lipEnd', idx);
    if (s.pitch === 360) {
      mark(t, 'loopStart', before);
      mark(t, 'loopApex', before + Math.round(dsOf(s) / 2));
      mark(t, 'loopEnd', idx);
    }
  }
  mark(t, 'start', 0);
  mark(t, 'finish', t.poses.length - 6);
  return t;
}

/** Ramp down onto a long flat — the rolling-resistance test track. */
export function buildRollTrack(): BuiltTrack {
  const blend = 0.5;
  const segs: Seg[] = [
    ...dropRampSegs(DROP_RAMP_ANGLE, DROP_HEIGHT * S, blend),
    { len: ROLL_FLAT_LENGTH * S, ds: 1.0 },
  ];
  const t = buildTrack(segs);
  const nBlend = Math.round(blend / 0.1);
  const nFlat = Math.round(dropRampLength(DROP_HEIGHT * S, DROP_RAMP_ANGLE, blend) / 1.0);
  mark(t, 'flatEnd', 1 + nBlend + nFlat + nBlend);
  mark(t, 'start', 0);
  return t;
}

/** Steep ramp (height H) -> flat -> full vertical loop of radius r, exit flat at y=0. */
export function buildLoopTrack(releaseHeight: number, radius: number): BuiltTrack {
  const blend = LOOP_TEST_BLEND * S;
  const s = Math.sin(LOOP_TEST_RAMP_ANGLE * D2R);
  const flatRun = 0.7 * S;
  const loopLen = 2 * Math.PI * radius * S;
  const rampLen = (releaseHeight * S - 2 * blend * Math.sin((LOOP_TEST_RAMP_ANGLE / 2) * D2R)) / s;
  const segs: Seg[] = [
    { len: blend, pitch: -LOOP_TEST_RAMP_ANGLE, ds: 0.2 },
    { len: Math.max(0.5, rampLen), ds: 0.8 },
    { len: blend, pitch: LOOP_TEST_RAMP_ANGLE, ds: 0.2 },
    { len: flatRun, ds: 0.5 },
    { len: loopLen, pitch: 360, ds: 0.1 },
    { len: 0.4 * S, ds: 0.3 },
  ];
  const t = buildTrack(segs);
  // shift so the loop bottom (end of the ramp blends) sits at y = 0
  const nBlend = Math.max(1, Math.round(blend / 0.1));
  const nRamp = Math.max(1, Math.round(Math.max(0.5, rampLen) / 0.8));
  const flatIdx = 1 + nBlend + nRamp + nBlend;
  const dy = t.poses[Math.min(flatIdx, t.poses.length - 1)].p.y;
  for (const b of t.boxes) b.center = vadd(b.center, v(0, -dy, 0));
  for (const pose of t.poses) pose.p = vadd(pose.p, v(0, -dy, 0));
  const dsOf = (sg: Seg): number => Math.max(1, Math.round(sg.len / (sg.ds ?? 0.15)));
  let idx = 0;
  for (const sg of segs) {
    const before = idx;
    idx += dsOf(sg);
    if (sg.pitch === 360) {
      mark(t, 'loopStart', before);
      mark(t, 'loopApex', before + Math.round(dsOf(sg) / 2));
      mark(t, 'loopEnd', idx);
    }
  }
  mark(t, 'start', 0);
  mark(t, 'exit', Math.min(flatIdx + dsOf(segs[4]) + 2, t.poses.length - 1));
  return t;
}
