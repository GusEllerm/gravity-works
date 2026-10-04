/**
 * The track cross-section: ONE U-channel profile swept along every piece's
 * centreline (see docs/vault/Concepts/Track Kit.md). Nothing else is allowed
 * to define what a piece's section looks like.
 *
 * The profile is authored in **section coordinates**: `x` is the lateral axis
 * (positive to the car's right, i.e. along `tangent x up`), `y` is vertical
 * with the deck's running surface exactly at `y = 0`. So the centreline spline
 * *is* the surface the car's wheels touch at the centreline, and everything
 * else hangs off it.
 *
 * The profile is stored as a list of **convex parts** (rectangles) whose union
 * is the U-channel, rather than one polygon with concavities. That is what
 * makes the collider generator possible: the convex hull of two consecutive
 * rings of a *convex* part is a valid Rapier convex collider, so a piece's
 * collider is a compound of one hull per (part, run) — the same rings the mesh
 * sweeps, never a chord-slab trimesh (Decision Log 2026-10-04, colliders).
 *
 * All numbers are world metres (1:64 toy scale); physics converts to sim units
 * at collider-build time via the `scale` option of `toColliderDescs`.
 */
import * as THREE from 'three';

// ---- named parameters ------------------------------------------------------

/** Half-width of the running deck (interior of the channel). */
export const DECK_HALF_WIDTH = 0.026;
/** Half-width over the outer face of the rail walls. */
export const TRACK_HALF_WIDTH = 0.034;
/** Deck slab thickness (deck top surface is y = 0). */
export const DECK_THICKNESS = 0.006;
/** Deck top surface to the top of the rail lips. */
export const RAIL_HEIGHT = 0.022;
/** How far a rail lip overhangs the deck from the wall's inner face. */
export const RAIL_LIP_REACH = 0.004;
/** Rail lip thickness (vertical extent of the lip). */
export const RAIL_LIP_THICKNESS = 0.006;

/** Wheel-centre height above the deck used for the camera rail. */
export const RAIL_WHEEL_HEIGHT = 0.015;

/** Wall thickness implied by the two half-widths (documented, not authored). */
export const RAIL_WALL_THICKNESS = TRACK_HALF_WIDTH - DECK_HALF_WIDTH;

// ---- profile data ----------------------------------------------------------

export interface ProfilePart {
  /** Stable name, used in collider diagnostics and tests. */
  readonly name: string;
  /** Convex polygon in section coords, counter-clockwise, closed implicitly. */
  readonly polygon: readonly THREE.Vector2[];
  /** True for the part the wheels actually run on (the deck). */
  readonly rolling: boolean;
}

export interface CrossSection {
  readonly name: string;
  readonly parts: readonly ProfilePart[];
}

function rect(x0: number, x1: number, y0: number, y1: number): THREE.Vector2[] {
  // counter-clockwise in (x right, y up)
  return [new THREE.Vector2(x0, y0), new THREE.Vector2(x1, y0), new THREE.Vector2(x1, y1), new THREE.Vector2(x0, y1)];
}

const DW = DECK_HALF_WIDTH;
const TW = TRACK_HALF_WIDTH;
const DT = DECK_THICKNESS;
const RH = RAIL_HEIGHT;
const LR = RAIL_LIP_REACH;
const LT = RAIL_LIP_THICKNESS;

/**
 * The one U-channel: deck + two side walls + two rail lips. The five convex
 * parts tile the section exactly (they meet on shared faces, never overlap),
 * so sweeping them is also a watertight-enough mesh for a toy piece.
 */
export const U_CHANNEL: CrossSection = {
  name: 'u-channel',
  parts: [
    { name: 'deck', polygon: rect(-DW, DW, -DT, 0), rolling: true },
    { name: 'rail-left', polygon: rect(-TW, -DW, -DT, RH), rolling: false },
    { name: 'lip-left', polygon: rect(-DW, -DW + LR, RH - LT, RH), rolling: false },
    { name: 'rail-right', polygon: rect(DW, TW, -DT, RH), rolling: false },
    { name: 'lip-right', polygon: rect(DW - LR, DW, RH - LT, RH), rolling: false },
  ],
};

// ---- sweeping --------------------------------------------------------------

/** Minimal view of a spline frame — `TrackSpline.sample()` satisfies it. */
export interface SectionFrame {
  pos: THREE.Vector3;
  tangent: THREE.Vector3;
  up: THREE.Vector3;
}

const _side = new THREE.Vector3();

/**
 * One point of a profile ring placed in the world by a frame. Lateral axis is
 * `tangent x up` (the car's right), vertical axis is the frame's (already
 * banked) up vector.
 */
export function ringPoint(
  cs: CrossSection,
  partIndex: number,
  vertexIndex: number,
  frame: SectionFrame,
  out = new THREE.Vector3(),
): THREE.Vector3 {
  const p = cs.parts[partIndex]!.polygon[vertexIndex]!;
  _side.crossVectors(frame.tangent, frame.up).normalize();
  return out
    .copy(frame.pos)
    .addScaledVector(_side, p.x)
    .addScaledVector(frame.up, p.y);
}

/**
 * The rings the mesh and the colliders are both built from:
 * `rings[ring][part][vertex]`. This is the single place section geometry
 * becomes world geometry, so the two generators cannot drift apart
 * (Track Kit invariant 1).
 */
export function sectionRings(
  cs: CrossSection,
  frames: readonly SectionFrame[],
  scale = 1,
): THREE.Vector3[][][] {
  return frames.map((frame) =>
    cs.parts.map((_, partIndex) =>
      cs.parts[partIndex]!.polygon.map((_, vertexIndex) =>
        ringPoint(cs, partIndex, vertexIndex, frame).multiplyScalar(scale),
      ),
    ),
  );
}
