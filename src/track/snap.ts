/**
 * Snapping and canonical ordering — pure functions, no world state
 * (docs/vault/Concepts/Track Kit.md invariant 4: a build must be reproducible
 * from (level, build, seed) alone).
 *
 * Two entry points, deliberately different:
 *
 * - `fitSocket(target, source)` is the *exact* placement: the rigid transform
 *   that carries `source`'s frame onto `target`'s. Used to hang a piece's local
 *   in-socket on a world target. It cannot fail, so it must not be mistaken for
 *   a legality check.
 * - `snapSocket(a, b)` is the *gate*: given two sockets already expressed in the
 *   same space (a builder dragging a piece near a target), it returns the
 *   corrective transform when the candidate is within tolerance and `null`
 *   when it is not. Tolerances are the constants below.
 */
import * as THREE from 'three';
import { rollAngle, socketGap, socketMatrix, tangentAngle, type Socket } from './socket.ts';
import type { PlacedPiece } from './build.ts';

/** How close a dragged socket origin must sit to its target (metres). */
export const SNAP_TRANSLATION_TOL = 0.01;
/** How parallel the travel directions must be (radians). */
export const SNAP_ANGLE_TOL = THREE.MathUtils.degToRad(4);
/** How much residual twist between the up vectors is still a snap (radians). */
export const SNAP_ROLL_TOL = THREE.MathUtils.degToRad(6);

const _inv = new THREE.Matrix4();

/** Exact rigid transform carrying `source`'s frame onto `target`'s. */
export function fitSocket(target: Socket, source: Socket): THREE.Matrix4 {
  const toWorld = socketMatrix(target);
  const fromLocal = socketMatrix(source);
  return toWorld.multiply(_inv.copy(fromLocal).invert());
}

/**
 * The corrective transform that seats socket `b` on socket `a`, or null when
 * `b` is too far away, too angled, or twisted. Pure: neither socket is
 * mutated, and the same pair always yields the same answer.
 */
export function snapSocket(a: Socket, b: Socket): THREE.Matrix4 | null {
  if (socketGap(a, b) > SNAP_TRANSLATION_TOL) return null;
  if (tangentAngle(a, b) > SNAP_ANGLE_TOL) return null;
  if (rollAngle(a, b) > SNAP_ROLL_TOL) return null;
  return fitSocket(a, b);
}

/**
 * Canonical build order: ascending `seq`, stable for equal keys, returned as a
 * new array so callers cannot alias the input.
 */
export function canonicalBuild(order: PlacedPiece[]): PlacedPiece[] {
  return order.map((piece, index) => ({ piece, index })).sort((x, y) => {
    const d = x.piece.seq - y.piece.seq;
    return d !== 0 ? d : x.index - y.index;
  }).map(({ piece }) => piece);
}
