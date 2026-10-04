/**
 * Kit-track rigs: turn a track-kit `Build` into the thing the feel harness
 * simulates — one fixed body carrying the pieces' convex colliders at
 * `SIM_SCALE`, plus arc-length queries (frames, rail, nearest-point
 * projection) over the reified chain.
 *
 * Successor to the chord-slab feeltrack builder (see `Modules/feel.md` —
 * the slab code lives in git history; its seams were the subject of the
 * stage-1/2 collider findings). Everything derived here comes from the SAME
 * spline samples the kit's meshes use: what you see is what you hit
 * (Track Kit invariant 1), which is the whole point of moving the rigs onto
 * kit geometry.
 */
import * as THREE from 'three';
import { RAPIER } from '../physics/sim.ts';
import { reify, type Build } from '../track/build.ts';
import { captureVolume } from '../track/pieces.ts';
import { RAIL_WHEEL_HEIGHT } from '../track/cross-section.ts';
import type { TrackFrame, TrackSpline } from '../track/spline.ts';
import type { Pose } from '../physics/car.ts';

/** Toy-plastic deck friction (matches the kit's own rolling tests). */
export const TRACK_FRICTION = 0.05;

/** Explicit track collision group (see `Modules/physics` gotchas). */
export const TRACK_GROUP = 0x0001_fffd;
// membership bit0 | filter everything EXCEPT bit1 (the chassis): a raycast
// chassis is a pure-ray body — the moment it could physically touch the kit
// hulls it hoovered the loop circle's 3 mm chord risers and anchored there
// (measured: inelastic stall at the loop bottom at exactly 1:64 clearances).
// Physical WHEELS (bit2) still hit the track — the bake-off needs variant a
// to ride the real hulls, rails included.

/** Named arc-length marks (world metres from the build's start). */
export type Marks = Record<string, number>;

/**
 * Arc-length index over a reified build: the concatenation of every placed
 * piece's spline, in canonical `seq` order.
 */
export class KitRig {
  readonly splines: TrackSpline[];
  /** World-arc position where each spline starts. */
  readonly starts: number[];
  readonly length: number;
  marks: Marks = {};
  /** Rail samples for projection (built lazily, `spacing` apart). */
  private railPts: THREE.Vector3[] | null = null;
  private railSpacing = 0;

  readonly build: Build;
  readonly simScale: number;

  constructor(build: Build, simScale: number) {
    this.build = build;
    this.simScale = simScale;
    const r = reify(build);
    this.splines = r.splines;
    this.starts = [];
    let acc = 0;
    for (const s of r.splines) {
      this.starts.push(acc);
      acc += s.length;
    }
    this.length = acc;
  }

  /** World frame at world-arc `s` (clamped). */
  frameAt(s: number): TrackFrame {
    const c = THREE.MathUtils.clamp(s, 0, this.length - 1e-9);
    let i = this.starts.length - 1;
    for (let k = 0; k < this.starts.length; k++) {
      if (c < this.starts[k]! + this.splines[k]!.length) {
        i = k;
        break;
      }
    }
    const local = (c - this.starts[i]!) / this.splines[i]!.length;
    return this.splines[i]!.sample(local);
  }

  /** Spawn pose for `spawnCar` (sim-space position, unit axes). */
  poseAt(s: number): Pose {
    const f = this.frameAt(s);
    const k = this.simScale;
    return {
      p: { x: f.pos.x * k, y: f.pos.y * k, z: f.pos.z * k },
      f: { x: f.tangent.x, y: f.tangent.y, z: f.tangent.z },
      u: { x: f.up.x, y: f.up.y, z: f.up.z },
    };
  }

  /** World point of a mark. */
  markPos(name: string): THREE.Vector3 {
    return this.frameAt(this.marks[name] ?? 0).pos;
  }

  /** Spawn the build's colliders on one fixed body in a Rapier world. */
  addColliders(world: RAPIER.World): RAPIER.Collider[] {
    const body = world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
    const out: RAPIER.Collider[] = [];
    for (const spline of this.splines) {
      const descs = spline.toColliderDescs(RAPIER, {
        scale: this.simScale,
        friction: TRACK_FRICTION,
        restitution: 0,
      }) as RAPIER.ColliderDesc[];
      for (const desc of descs) {
        desc.setCollisionGroups(TRACK_GROUP);
        out.push(world.createCollider(desc, body));
      }
    }
    return out;
  }

  /** Uniform-arc wheel-height rail over the whole build (world metres).
   *  The returned spacing is the TRUE sample step, (length-eps)/(n-1), never
   *  the requested one: treating the requested 0.01 as the true step when the
   *  build length does not divide by it re-scaled every arc projection by up
   *  to ~1 % and desynchronised railPointAt from frameAt — the straight-line
   *  camera drift. */
  rail(spacing = 0.01): { points: THREE.Vector3[]; spacing: number } {
    if (!this.railPts || Math.abs(this.railSpacing - spacing) > 1e-12) {
      const n = Math.max(2, Math.ceil(this.length / spacing) + 1);
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i < n; i++) {
        const f = this.frameAt((i / (n - 1)) * (this.length - 1e-9));
        pts.push(f.pos.clone().addScaledVector(f.up, RAIL_WHEEL_HEIGHT));
      }
      this.railPts = pts;
      this.railSpacing = (this.length - 1e-9) / (n - 1);
    }
    return { points: this.railPts, spacing: this.railSpacing };
  }

  /** Nearest rail arc-length to a world point (piecewise-linear search).
   *  Global and DISTANCE-BLIND — for any judgement about where the car IS,
   *  prefer nearestArcInfo, which reports how far the point was from the rail
   *  it projected onto. */
  nearestArc(p: { x: number; y: number; z: number }, spacing = 0.01): number {
    return this.nearestArcInfo(p, spacing).arc;
  }

  /** Nearest rail arc AND the distance to the rail there. The distance is
   *  what makes projections honest: a car flying through a loop's empty
   *  interior is ~4 cm from the deck yet projects onto an arc PAST the loop
   *  exit (the stage-2 loop-gate exploit), while a car riding the deck is
   *  always within ~1.5 cm of its own rail point. */
  nearestArcInfo(p: { x: number; y: number; z: number }, spacing = 0.01): { arc: number; dist: number } {
    const { points, spacing: h } = this.rail(spacing);
    let bestD2 = Infinity;
    let bestT = 0;
    let bestI = 0;
    const probe = new THREE.Vector3();
    for (let i = 0; i + 1 < points.length; i++) {
      const a = points[i]!;
      const ab = points[i + 1]!.clone().sub(a);
      const len2 = ab.lengthSq();
      if (len2 < 1e-18) continue;
      const t = THREE.MathUtils.clamp(probe.set(p.x, p.y, p.z).sub(a).dot(ab) / len2, 0, 1);
      const d2 = probe.set(p.x, p.y, p.z).distanceToSquared(a.clone().addScaledVector(ab, t));
      if (d2 < bestD2) {
        bestD2 = d2;
        bestI = i;
        bestT = t;
      }
    }
    return { arc: (bestI + bestT) * h, dist: Math.sqrt(bestD2) };
  }

  /** Rail point at world-arc `s` — LINEARLY INTERPOLATED between the true-
   *  spacing samples. Snapping to the nearest sample (the old round()) made
   *  the camera position stick-slip by up to half a sample on straights and
   *  put it at arc round(s/h)*h_true != s wherever h did not divide the
   *  build length — the arc-length re-projection drift of the run camera. */
  railPointAt(s: number, spacing = 0.01): THREE.Vector3 {
    const { points, spacing: h } = this.rail(spacing);
    const u = THREE.MathUtils.clamp(s / h, 0, points.length - 1);
    const i = Math.min(Math.floor(u), points.length - 2);
    return points[i]!.clone().lerp(points[i + 1]!, u - i);
  }
}

/** World-space capture volume of the build's finish cup, if it has one. */
export function finishCapture(build: Build): { center: THREE.Vector3; radius: number } | null {
  for (const piece of build.pieces) {
    if (piece.def === 'finishCup') {
      const cv = captureVolume(piece.params);
      return {
        center: new THREE.Vector3(cv.center.x, cv.center.y, cv.center.z).applyMatrix4(piece.transform),
        radius: cv.radius,
      };
    }
  }
  return null;
}

/** Descent of a pitch-blend/straight/pitch-blend run (exact arc integral). */
export function pitchBlendRise(blend: number, angleDeg: number): number {
  const a = Math.abs(angleDeg) * (Math.PI / 180);
  return (blend * (1 - Math.cos(a))) / a;
}

/**
 * Level length for a `ramp` piece that descends exactly `height` metres
 * (negative angle = down). `from` is the arc into the first blend where the
 * release pose is taken, so the drop is measured from the RELEASE point.
 */
export function rampLevelForDrop(height: number, angleDeg: number, blend: number, from = 0): number {
  const a = Math.abs(angleDeg) * (Math.PI / 180);
  const inBlend = (blend * (Math.cos((from / blend) * a) - Math.cos(a))) / a;
  const outBlend = pitchBlendRise(blend, angleDeg);
  return (height - inBlend - outBlend) / Math.sin(a);
}
