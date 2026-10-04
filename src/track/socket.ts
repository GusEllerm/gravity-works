/**
 * Sockets: a piece endpoint with a frame. One convention governs the whole kit
 * (docs/vault/Concepts/Track Kit.md):
 *
 * - A socket's `tangent` is the **direction of travel** at that end of the
 *   spline, so an in-socket and the previous piece's out-socket are *parallel*
 *   when mated, not facing each other.
 * - `up` is the frame's banked up vector; pieces are designed so banking is
 *   zero at both endpoints, which is what lets a banked piece mate with a flat
 *   one without a twist.
 * - Local piece space is right-handed with x = tangent, y = up, z = tangent x up
 *   (the car's right) — the same basis `quatFromBasis` uses in `src/physics`.
 */
import * as THREE from 'three';
import type { TrackSpline } from './spline.ts';

export interface Socket {
  pos: THREE.Vector3;
  tangent: THREE.Vector3;
  up: THREE.Vector3;
}

/** The rigid transform whose columns are the socket's basis (x, y, z). */
export function socketMatrix(s: Socket, out = new THREE.Matrix4()): THREE.Matrix4 {
  const z = new THREE.Vector3().crossVectors(s.tangent, s.up).normalize();
  const y = new THREE.Vector3().crossVectors(z, s.tangent).normalize();
  return out.makeBasis(s.tangent.clone().normalize(), y, z).setPosition(s.pos.x, s.pos.y, s.pos.z);
}

/** The socket at spline parameter t, in the spline's own space. */
export function socketAt(spline: TrackSpline, t: number): Socket {
  const f = spline.sample(t);
  return { pos: f.pos.clone(), tangent: f.tangent.clone(), up: f.up.clone() };
}

/** [in, out] endpoints of a spline. */
export function splineSockets(spline: TrackSpline): [Socket, Socket] {
  return [socketAt(spline, 0), socketAt(spline, 1)];
}

/** Apply a rigid transform to a socket. */
export function transformSocket(s: Socket, m: THREE.Matrix4): Socket {
  return {
    pos: s.pos.clone().applyMatrix4(m),
    tangent: s.tangent.clone().transformDirection(m).normalize(),
    up: s.up.clone().transformDirection(m).normalize(),
  };
}

/** How far apart two socket origins are (metres). */
export function socketGap(a: Socket, b: Socket): number {
  return a.pos.distanceTo(b.pos);
}

/** Angle in radians between two sockets' travel directions. */
export function tangentAngle(a: Socket, b: Socket): number {
  return a.tangent.angleTo(b.tangent);
}

/**
 * Residual twist in radians once the tangents are aligned: the angle between
 * the ups after rotating b's up about b's tangent onto a's hemisphere.
 */
export function rollAngle(a: Socket, b: Socket): number {
  const axis = new THREE.Vector3().crossVectors(b.tangent, a.tangent);
  if (axis.lengthSq() < 1e-18) return a.up.angleTo(b.up);
  const moved = b.up.clone().applyAxisAngle(axis.normalize(), b.tangent.angleTo(a.tangent));
  // project both ups onto the plane perpendicular to the shared tangent
  const n = a.tangent.clone().normalize();
  const pa = a.up.clone().addScaledVector(n, -a.up.dot(n)).normalize();
  const pb = moved.addScaledVector(n, -moved.dot(n)).normalize();
  return pa.angleTo(pb);
}
