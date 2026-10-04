/**
 * The centreline spline every piece, mesh, collider and camera rail derives
 * from (docs/vault/Concepts/Track Kit.md).
 *
 * Representation: a piecewise-arc curve. Each segment rotates its tangent at a
 * constant rate about a fixed world axis — a pitch rate (turning toward the
 * frame's up vector) and a yaw rate (turning toward the car's right). That
 * covers straights, planar arcs, pitched runs, helices and full vertical loops
 * exactly, and it is arc-length parameterised by construction, so `t` maps to
 * arc length with no reparameterisation error.
 *
 * Frames are parallel-transported (minimal twist): the frame is carried by the
 * *same* rotation that carries the tangent, and that rotation's axis is always
 * perpendicular to the tangent, so there is no twist about it. A 360° vertical
 * loop therefore comes out upright-and-inverted at the top, never corkscrewed.
 * Banking is separate data — a piecewise-linear banking curve — composed onto
 * the transported up vector, so `sample().up` is the banked up.
 *
 * Sampling: `sample(t)` is analytic at any t. The station set (`stationTs()`)
 * is what `toMesh` and `toColliderDescs` consume, and both go through
 * `stationFrames()`, which calls `sample()` exactly once per station — that is
 * what makes Track Kit invariant 1 testable (see the recording-spline test).
 */
import * as THREE from 'three';
import {
  RAIL_WHEEL_HEIGHT,
  U_CHANNEL,
  sectionRings,
  type CrossSection,
  type SectionFrame,
} from './cross-section.ts';

export type Vec3 = THREE.Vector3;

/** One sampled state of the centreline. `up` already carries `banking`. */
export interface TrackFrame extends SectionFrame {
  banking: number;
  /** False inside a gap: no mesh and no collider is emitted across it. */
  solid: boolean;
}

/**
 * A constant-rate segment. `pitchRate` rotates the tangent toward `up`
 * (positive climbs); `yawRate` rotates it toward `tangent x up` (positive turns
 * right). `bankFrom`/`bankTo` interpolate the banking curve in radians.
 * `solid: false` marks a gap — the car flies, nothing is drawn or collided.
 */
export interface SegmentSpec {
  length: number;
  pitchRate?: number;
  yawRate?: number;
  bankFrom?: number;
  bankTo?: number;
  solid?: boolean;
}

/** Tessellation knobs (metres / radians). */
export const TESSELLATION = {
  /** Maximum station spacing along the centreline. */
  stationSpacing: 0.05,
  /** Maximum tangent turn per station, so loops and turns stay round. */
  maxTurnPerStation: THREE.MathUtils.degToRad(10),
  minStations: 4,
  maxStations: 96,
  /**
   * Collider runs: consecutive rings are merged into ONE convex hull while the
   * accumulated turn stays under this and the run stays under the length/ring
   * caps. This is what keeps the deck "large and few" — a straight stretch
   * becomes a single flat hull instead of a seam every 5 cm, which is precisely
   * the chord-slab deceleration lie the stage-1 bake-off measured (Decision
   * Log 2026-10-04, colliders).
   */
  colliderRunMaxTurn: THREE.MathUtils.degToRad(2),
  colliderRunMaxLength: 0.4,
  colliderRunMaxRings: 16,
} as const;

export interface MeshOptions {
  profile?: CrossSection;
  /** Length multiplier applied to the emitted positions. Default 1 (world). */
  scale?: number;
}

export interface ColliderBuildOptions extends MeshOptions {
  /**
   * Length multiplier applied at collider-build time. Kit code stays
   * unit-blind: pass `SIM_SCALE` (10) for sim-space colliders, omit for world.
   */
  friction?: number;
  restitution?: number;
}

/** Anything a caller can hang collider descs on (satisfied by Rapier). */
export interface ColliderDescLike {
  setFriction(friction: number): ColliderDescLike;
  setRestitution(restitution: number): ColliderDescLike;
}

/** The narrow slice of the Rapier namespace this module needs. */
export interface RapierColliderFactory {
  ColliderDesc: {
    convexHull(vertices: Float32Array): ColliderDescLike | null;
  };
}

interface Compiled {
  start: number;
  length: number;
  pos0: THREE.Vector3;
  quat0: THREE.Quaternion;
  /** Unit world axis, signed so `omega >= 0`. */
  axis: THREE.Vector3;
  omega: number;
  bank0: number;
  bank1: number;
  solid: boolean;
}

const _q = new THREE.Quaternion();
const _t = new THREE.Vector3();

export class TrackSpline {
  private readonly segs: Compiled[];
  private readonly total: number;
  /** Rigid model transform; `transformed()` composes onto it. */
  private readonly model: THREE.Matrix4;
  private readonly count: number;
  private readonly specs: readonly SegmentSpec[];

  constructor(segments: readonly SegmentSpec[], model?: THREE.Matrix4) {
    const compiled: Compiled[] = [];
    let pos = new THREE.Vector3();
    let quat = new THREE.Quaternion();
    let s = 0;
    for (const spec of segments) {
      const len = spec.length;
      if (!(len > 0)) throw new Error(`TrackSpline: segment length must be > 0 (got ${len})`);
      const pitch = spec.pitchRate ?? 0;
      const yaw = spec.yawRate ?? 0;
      // Angular velocity expressed in the frame's own axes (x = tangent,
      // y = up, z = side): +z pitches up, -y yaws right.
      const omegaVec = new THREE.Vector3(0, -yaw, pitch).applyQuaternion(quat);
      const omega = omegaVec.length();
      let axis = new THREE.Vector3(0, 1, 0);
      if (omega > 1e-12) axis = omegaVec.multiplyScalar(1 / omega);
      const tangent = _t.set(1, 0, 0).applyQuaternion(quat).clone();
      let next: THREE.Vector3;
      if (omega > 1e-12) {
        // exact integral of a constant-rotation tangent (Rodrigues + quadrature)
        const th = omega * len;
        const along = tangent.dot(axis);
        const perp = tangent.clone().addScaledVector(axis, -along);
        next = pos
          .clone()
          .addScaledVector(axis, along * len)
          .addScaledVector(perp, Math.sin(th) / omega)
          .addScaledVector(new THREE.Vector3().crossVectors(axis, tangent), (1 - Math.cos(th)) / omega);
      } else {
        next = pos.clone().addScaledVector(tangent, len);
      }
      const bank0 = spec.bankFrom ?? 0;
      const quat0 = quat;
      compiled.push({
        start: s,
        length: len,
        pos0: pos,
        quat0,
        axis,
        omega,
        bank0,
        bank1: spec.bankTo ?? bank0,
        solid: spec.solid ?? true,
      });
      s += len;
      pos = next;
      // the frame for the NEXT segment: carried by the same rotation that
      // carried the tangent, which is what parallel transport means here.
      if (omega > 1e-12) quat = new THREE.Quaternion().setFromAxisAngle(axis, omega * len).multiply(quat);
    }
    if (compiled.length === 0) throw new Error('TrackSpline: needs at least one segment');
    this.segs = compiled;
    this.specs = segments.slice();
    this.total = s;
    this.model = model ?? new THREE.Matrix4();
    this.count = TrackSpline.stationCountFor(this.segs, this.total);
  }

  /** Total arc length in world metres. */
  get length(): number {
    return this.total;
  }

  /** Number of tessellation intervals (rings = stations + 1). */
  get stations(): number {
    return this.count;
  }

  /** How many authored segments the spline is compiled from (gaps included). */
  get segmentCount(): number {
    return this.segs.length;
  }

  private static stationCountFor(segs: readonly Compiled[], total: number): number {
    let turn = 0;
    for (const s of segs) turn += s.omega * s.length;
    const byLength = Math.ceil(total / TESSELLATION.stationSpacing);
    const byTurn = Math.ceil(turn / TESSELLATION.maxTurnPerStation);
    const n = Math.max(TESSELLATION.minStations, byLength, byTurn);
    return Math.min(TESSELLATION.maxStations, n);
  }

  /** Build from authored segments (the piece kit's native shape). */
  static fromSegments(segments: readonly SegmentSpec[]): TrackSpline {
    return new TrackSpline(segments);
  }

  /** The t values the derived geometry consumes: uniform in arc length. */
  stationTs(): number[] {
    const ts: number[] = [];
    for (let i = 0; i <= this.count; i++) ts.push(i / this.count);
    return ts;
  }

  /** Sample the centreline at t in [0,1] (t is arc length / total length). */
  sample(t: number, out?: TrackFrame): TrackFrame {
    const s = THREE.MathUtils.clamp(t, 0, 1) * this.total;
    let seg = this.segs[this.segs.length - 1]!;
    for (const c of this.segs) {
      if (s < c.start + c.length) {
        seg = c;
        break;
      }
    }
    const ds = THREE.MathUtils.clamp(s - seg.start, 0, seg.length);
    let pos: THREE.Vector3;
    let quat: THREE.Quaternion;
    if (seg.omega > 1e-12) {
      const th = seg.omega * ds;
      _q.setFromAxisAngle(seg.axis, th);
      quat = _q.clone().multiply(seg.quat0);
      const startTangent = _t.set(1, 0, 0).applyQuaternion(seg.quat0);
      const along = startTangent.dot(seg.axis);
      const perp = startTangent.clone().addScaledVector(seg.axis, -along);
      pos = seg.pos0
        .clone()
        .addScaledVector(seg.axis, along * ds)
        .addScaledVector(perp, Math.sin(th) / seg.omega)
        .addScaledVector(new THREE.Vector3().crossVectors(seg.axis, startTangent), (1 - Math.cos(th)) / seg.omega);
    } else {
      quat = seg.quat0.clone();
      pos = seg.pos0.clone().addScaledVector(_t.set(1, 0, 0).applyQuaternion(seg.quat0), ds);
    }
    const banking = seg.length > 0 ? seg.bank0 + ((seg.bank1 - seg.bank0) * ds) / seg.length : seg.bank0;
    const tangent = new THREE.Vector3(1, 0, 0).applyQuaternion(quat);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(quat);
    if (banking !== 0) up.applyAxisAngle(tangent, banking).normalize();
    pos.applyMatrix4(this.model);
    tangent.transformDirection(this.model).normalize();
    up.transformDirection(this.model).normalize();
    const frame: TrackFrame =
      out ?? { pos: new THREE.Vector3(), tangent: new THREE.Vector3(), up: new THREE.Vector3(), banking: 0, solid: true };
    frame.pos.copy(pos);
    frame.tangent.copy(tangent);
    frame.up.copy(up);
    frame.banking = banking;
    frame.solid = seg.solid;
    return frame;
  }

  /** Exactly one `sample()` call per station — the shared sample set. */
  stationFrames(): TrackFrame[] {
    return this.stationTs().map((t) => this.sample(t));
  }

  /** A copy of this spline with a rigid transform applied to every sample. */
  transformed(matrix: THREE.Matrix4): TrackSpline {
    return new TrackSpline(this.specs, new THREE.Matrix4().multiplyMatrices(matrix, this.model));
  }

  /**
   * Sweep the section along the stations: one tube per convex part per
   * contiguous solid run, flat-shaded. ~8 triangles per station per part
   * (five parts), i.e. roughly 1k triangles for a straight piece.
   */
  toMesh(options: MeshOptions = {}): THREE.BufferGeometry {
    const cs = options.profile ?? U_CHANNEL;
    const rings = sectionRings(cs, this.stationFrames(), options.scale ?? 1);
    const pos: number[] = [];
    for (let part = 0; part < cs.parts.length; part++) {
      for (const run of this.solidRuns()) emitTube(rings, part, run, pos);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3));
    geo.computeVertexNormals();
    return geo;
  }

  /**
   * Compound convex colliders: one convex hull per (convex part, collider run)
   * built from the same rings the mesh swept. Runs stop where the centreline
   * turns by `colliderRunMaxTurn`, so straight deck is one flat hull and bends
   * get one hull per station pair.
   *
   * Returns bare collider descs — the caller attaches them to one fixed body.
   * A null from Rapier's hull builder is a real bug, so it throws rather than
   * silently punching a hole in the running surface.
   */
  toColliderDescs(rapier: RapierColliderFactory, options: ColliderBuildOptions = {}): ColliderDescLike[] {
    const cs = options.profile ?? U_CHANNEL;
    const frames = this.stationFrames();
    const rings = sectionRings(cs, frames, options.scale ?? 1);
    const runs = this.colliderRuns(frames);
    const descs: ColliderDescLike[] = [];
    const dropped: string[] = [];
    for (let part = 0; part < cs.parts.length; part++) {
      for (const run of runs) {
        const vertsPerRing = cs.parts[part]!.polygon.length;
        const verts = new Float32Array((run.end - run.start + 1) * vertsPerRing * 3);
        let k = 0;
        for (let r = run.start; r <= run.end; r++) {
          for (const p of rings[r]![part]!) {
            verts[k++] = p.x;
            verts[k++] = p.y;
            verts[k++] = p.z;
          }
        }
        const desc = rapier.ColliderDesc.convexHull(verts);
        if (desc === null) {
          dropped.push(`${cs.parts[part]!.name}[${run.start}..${run.end}]`);
          continue;
        }
        if (options.friction !== undefined) desc.setFriction(options.friction);
        if (options.restitution !== undefined) desc.setRestitution(options.restitution);
        descs.push(desc);
      }
    }
    if (dropped.length > 0) {
      throw new Error(`TrackSpline.toColliderDescs: degenerate convex hulls: ${dropped.join(', ')}`);
    }
    return descs;
  }

  /**
   * Wheel-height centreline for the run camera: n points evenly spaced along
   * the arc length, lifted by `RAIL_WHEEL_HEIGHT` along the banked up vector.
   */
  railPoints(n: number, wheelHeight = RAIL_WHEEL_HEIGHT): THREE.Vector3[] {
    const pts: THREE.Vector3[] = [];
    if (n <= 0) return pts;
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 0 : i / (n - 1);
      const frame = this.sample(t);
      pts.push(frame.pos.clone().addScaledVector(frame.up, wheelHeight));
    }
    return pts;
  }

  /** True when the geometry between ring i and ring i+1 exists (not a gap). */
  private pairSolid(): boolean[] {
    const ts = this.stationTs();
    const flags: boolean[] = [];
    for (let i = 0; i < ts.length - 1; i++) {
      const mid = ((ts[i]! + ts[i + 1]!) / 2) * this.total;
      const seg = this.segs.find((c) => mid < c.start + c.length) ?? this.segs[this.segs.length - 1]!;
      flags.push(seg.solid);
    }
    return flags;
  }

  /** Contiguous solid ring ranges (a range is [start, end] of ring indices). */
  solidRuns(): { start: number; end: number }[] {
    const solid = this.pairSolid();
    const runs: { start: number; end: number }[] = [];
    let start = -1;
    for (let i = 0; i < solid.length; i++) {
      if (solid[i]) {
        if (start < 0) start = i;
      } else if (start >= 0) {
        runs.push({ start, end: i });
        start = -1;
      }
    }
    if (start >= 0) runs.push({ start, end: solid.length });
    return runs;
  }

  /**
   * Collider run ranges: solid runs split wherever the accumulated tangent turn
   * passes `colliderRunMaxTurn` (or the length/ring caps bite). Every run spans
   * at least two rings, so every hull is the hull of consecutive rings.
   * `frames` are the shared samples — no extra `sample()` calls happen here.
   */
  colliderRuns(frames: readonly TrackFrame[]): { start: number; end: number }[] {
    const ts = this.stationTs();
    const out: { start: number; end: number }[] = [];
    for (const run of this.solidRuns()) {
      let start = run.start;
      let turn = 0;
      for (let i = run.start; i < run.end; i++) {
        const step = Math.acos(THREE.MathUtils.clamp(frames[i]!.tangent.dot(frames[i + 1]!.tangent), -1, 1));
        const nextTurn = turn + step;
        const len = (ts[i + 1]! - ts[start]!) * this.length;
        if (
          nextTurn > TESSELLATION.colliderRunMaxTurn ||
          len > TESSELLATION.colliderRunMaxLength ||
          i - start + 1 >= TESSELLATION.colliderRunMaxRings
        ) {
          out.push({ start, end: i });
          start = i;
          turn = step;
        } else {
          turn = nextTurn;
        }
      }
      out.push({ start, end: run.end });
    }
    return out;
  }
}

/** Sweep one convex part between rings `run.start..run.end` into `out`. */
function emitTube(
  rings: THREE.Vector3[][][],
  part: number,
  run: { start: number; end: number },
  out: number[],
): void {
  const n = rings[run.start]![part]!.length;
  const push = (p: THREE.Vector3): void => {
    out.push(p.x, p.y, p.z);
  };
  for (let r = run.start; r < run.end; r++) {
    const ringA = rings[r]![part]!;
    const ringB = rings[r + 1]![part]!;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      // side quad, wound so its normal points away from the part's interior
      push(ringA[i]!);
      push(ringB[i]!);
      push(ringB[j]!);
      push(ringA[i]!);
      push(ringB[j]!);
      push(ringA[j]!);
    }
  }
  // end caps: convex polygon, fan from vertex 0; the entry cap is wound the
  // other way so both caps face outward along -t / +t
  for (const r of [run.start, run.end]) {
    const ring = rings[r]![part]!;
    const flip = r === run.end;
    for (let i = 1; i < n - 1; i++) {
      push(ring[0]!);
      if (flip) {
        push(ring[i + 1]!);
        push(ring[i]!);
      } else {
        push(ring[i]!);
        push(ring[i + 1]!);
      }
    }
  }
}
