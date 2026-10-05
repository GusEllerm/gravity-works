/**
 * Per-level SET PLACEMENT — the stage-3 wiring seam between the kitchen set
 * (a canonical layout owned by the Environment Artist) and the kitchen level
 * files (chains that `lay` from the world origin along +x).
 *
 * The rule the table implements (the EA's stage-3 handover: "the level chains
 * currently start at the world origin and the set is a canonical layout —
 * prop placement per level is the Systems Engineer's call; the data is
 * position-complete for it"):
 *
 * - every kitchen level except KITCHEN 04 mounts the set as a PURE
 *   TRANSLATION: the counter's top surface sits 5 mm BELOW the level's own
 *   finish deck (`finishCup`'s in-socket y), the counter centre under the
 *   middle of the timed rail (up to the cup) and 0.45 m off its axis, so the bowl, the tap and the
 *   book stack stand clear of the corridor the car drives through (checked
 *   per level in `tests/unit/set-wiring.test.ts` against sampled rail points);
 * - KITCHEN 04 additionally YAWS the set (−45°) so the tap's drip anchor —
 *   `TAP.drip` in `src/sets/kitchen/data.ts`, the one constant the frozen
 *   drip mesh and the `tapSplash` film layers are derived from — lands
 *   EXACTLY over the decked-sink seam of the ground build, which is where the
 *   level's authored `sinkSplash` wet-patch zone is centred. The zone never
 *   moves (level data; the physics hook bites exactly where the Feel Engineer
 *   measured it), and no set geometry is edited: the PROP is placed over the
 *   ZONE. That is the L04 tap fix.
 *
 * The set is a VISUAL mount: nothing here creates colliders. Physics reads
 * only (level, build, seed), so the hashes cannot move — proven in
 * `tests/unit/set-wiring.test.ts` and `tests/e2e/set-wiring.spec.ts`.
 *
 * The table is literal numbers (a data file is easier to eyeball than a
 * solver at load time); `tests/unit/set-wiring.test.ts` recomputes every
 * entry from the live level/set data and fails on drift.
 */
import * as THREE from 'three';

export interface SetPlacement {
  /** World-space position of the set group's origin (metres). */
  position: [number, number, number];
  /** Yaw about +y (radians) — 0 for the un-rotated canonical layout. */
  yaw: number;
}

/** The 5 mm gap between the counter's top surface and the level's finish
 *  deck (the tray rests on the counter; the deck rides a hair above it). */
export const DECK_CLEARANCE = 0.005;

/** How far off the run axis the counter centre sits in the standard rule
 *  (the corridor stays clear of the bowl, the tap and the book stack). */
export const AXIS_OFFSET = 0.45;

/** The kitchen levels whose placement is the standard pure translation.
 *  key -> [counter centre x, counter centre y, counter centre z]. */
const STANDARD: Record<string, readonly [number, number, number]> = {
  // x/y re-derived when stage 3 re-authored `KITCHEN_GAP` for the L01
  // three-piece promise (L01 promise fix): L01/02/03 and the sandbox chain
  // the shared gap, so their counter centres moved with the cup; kitchen05
  // pins its original gap numbers and its row is byte-for-byte unchanged.
  // L02 re-derived again at the stage-3 LADDER COHERENCE pass (its two
  // straights are now ONE 0.18 m geometry, so the cup sits 5 mm nearer the
  // start — the centre follows it); the other rows are untouched.
  kitchen01: [0.9111, -0.3980919, AXIS_OFFSET],
  kitchen02: [1.0112, -0.4017658, AXIS_OFFSET],
  kitchen03: [1.2469, -0.4780919, AXIS_OFFSET],
  kitchen05: [1.308, -0.6395241, AXIS_OFFSET],
  'kitchen-sandbox': [1.2719, -0.4780919, AXIS_OFFSET],
};

/** KITCHEN 04 — the tap exception. Yaw −45° and the counter centre solved so
 *  `TAP.drip` maps onto the ground build's decked-sink seam
 *  (1.6353, −0.2668, 0): the drips land IN the authored wet-patch zone. */
const TAP_LEVEL: SetPlacement = {
  position: [1.763891, -0.2667657718454637, 0.277481],
  yaw: -Math.PI / 4,
};

/** The mount transform for one kitchen level id (null = no kitchen placement
 *  registered — the level renders in an empty set space). */
export function kitchenSetPlacement(levelId: string): SetPlacement | null {
  if (levelId === 'kitchen04') return TAP_LEVEL;
  const std = STANDARD[levelId];
  return std ? { position: [std[0], std[1], std[2]], yaw: 0 } : null;
}

/** The rigid transform of a placement (three users: the scene mount, the
 *  L03 socket seating, the guard boxes). */
export function placementMatrix(p: SetPlacement): THREE.Matrix4 {
  const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), p.yaw);
  return new THREE.Matrix4().compose(new THREE.Vector3(...p.position), q, new THREE.Vector3(1, 1, 1));
}

/** Map a set-space point (e.g. `TAP.drip`, a `BOWL_SOCKET_FRAMES` position)
 *  into the world of the level the set is mounted in. Pure — no three. */
export function transformByPlacement(
  p: SetPlacement,
  x: number,
  y: number,
  z: number,
): [number, number, number] {
  const c = Math.cos(p.yaw);
  const s = Math.sin(p.yaw);
  // three's R_y(yaw): x' = x·cos + z·sin, z' = −x·sin + z·cos
  return [p.position[0] + x * c + z * s, p.position[1] + y, p.position[2] - x * s + z * c];
}

/** Apply a placement to a built set group (mutates position/rotation only). */
export function placeSet(group: THREE.Object3D, p: SetPlacement): void {
  group.position.set(...p.position);
  group.rotation.set(0, p.yaw, 0);
}
