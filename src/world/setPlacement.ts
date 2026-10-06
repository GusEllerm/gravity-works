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

/** ---- bedroom (stage 4) -------------------------------------------------
 * The bedroom set is dressed around the FLOOR DISC centred on the set origin
 * (`FLOOR` in `src/sets/bedroom/data.ts`), so the mount rule is the kitchen
 * standard one step removed: the level chains along +x from the world origin
 * exactly as the kitchen rungs do, and the set slides to sit UNDER the lane —
 * centred on the run (x = the par rail's midpoint, so the floor disc contains
 * the whole rail), BACK (−z, so the corridor clears the props) and DOWN so
 * (a) the floor's top surface sits 5 mm below the LOWEST finish deck of any
 *     authored line of the rung (the same `DECK_CLEARANCE` contract as the
 *     kitchen counter, with one bedroom-stage addition: a choice level's
 *     floor cannot bury a line the player can actually run, so the row is
 *     `min(par, alternates).finishDeckY − 0.005` — identical to the kitchen
 *     rule wherever the par line is the low one. The y values below are
 *     recomputed from the live builds by `tests/unit/bedroom-levels.test.ts`);
 * (b) the props clear the corridor: the lived-in homework (`HOMEWORK`, the
 *     set's one floor-band detail within 15 cm of the run axis) ends up at
 *     least 10 cm off the lane and every named solid clears the track line
 *     (guard-box tested in `tests/unit/bedroom-levels.test.ts`).
 * Yaw 0 on every rung: the ratified canonical frames are the hero frames,
 * and the drawer bore NEVER enters the corridor — the tunnel line is a
 * blocked rung (Concepts/Levels §Piece requests, the bedroom asks), not a
 * placement the level could solve by rotating the room into the set's own
 * bed and pyramid. */
const BEDROOM_ROWS: Record<string, readonly [number, number, number]> = {
  bedroom01: [1.0912, -0.41177, -0.15],
  bedroom02: [1.0727, -0.47419, -0.15],
  bedroom03: [1.1825, -0.42567, -0.15],
  bedroom04: [1.2165, -0.44809, -0.15],
};

/** The mount transform for one bedroom level id (null = no placement — the
 *  canonical-origin fallback the set-inspection entry (`?set=bedroom`) uses,
 *  where there is no level line to dress against). */
export function bedroomSetPlacement(levelId: string): SetPlacement | null {
  const row = BEDROOM_ROWS[levelId];
  return row ? { position: [row[0], row[1], row[2]], yaw: 0 } : null;
}

/** ---- bathroom (stage 4) -------------------------------------------------
 * The bathroom set is dressed around its own floor disc (`FLOOR` in
 * `src/sets/bathroom/data.ts`), so the mount rule is the bedroom's, one row
 * each: centred on the run (x = the par rail's midpoint so the disc contains
 * the whole rail), BACK by `BATH_AXIS_OFFSET` (−z) and DOWN so the tile
 * floor's top surface sits 5 mm under the LOWEST authored line's finish deck
 * (a choice level's floor cannot bury a line the player can run — the rows
 * are recomputed from the live builds by `tests/unit/bathroom-levels.test.ts`).
 * Yaw 0 on every rung: variant A's prop cluster spans ±0.29 m of the set
 * origin around the DEV track the room was dressed on, so any yaw that would
 * map a wet-patch film onto a lane-centred hazard zone also swings the TUB
 * onto the corridor (measured while authoring bathroom01 — the fix is one
 * lane-crossing wetPatch anchor, ask #6, not a rotation of the room). */
export const BATH_AXIS_OFFSET = 0.25;

const BATH_ROWS: Record<string, readonly [number, number, number]> = {
  bathroom01: [0.9711, -0.40809, -BATH_AXIS_OFFSET],
  bathroom02: [1.0912, -0.46809, -BATH_AXIS_OFFSET],
  bathroom03: [1.1825, -0.42567, -BATH_AXIS_OFFSET],
  bathroom04: [1.2165, -0.44809, -BATH_AXIS_OFFSET],
};

/** The mount transform for one bathroom level id (null = no placement — the
 *  canonical-origin fallback a `?set=bathroom` inspection entry would use). */
export function bathroomSetPlacement(levelId: string): SetPlacement | null {
  const row = BATH_ROWS[levelId];
  return row ? { position: [row[0], row[1], row[2]], yaw: 0 } : null;
}

/** ---- garden (stage 4) ---------------------------------------------------
 * The garden set is dressed around its own patio disc (`DECK` in
 * `src/sets/garden/data.ts`), so the mount rule is the bedroom/bathroom
 * rule one step further along: the level chains along +x from the world
 * origin exactly as the other rungs do, and the set slides to sit UNDER
 * the lane — centred on the run (x = the par rail's midpoint; the 1.15 m
 * deck radius holds the driveable MIDDLE of every rail — on the longest
 * rung's ends the flush lawn stands in for the paving, which the flat-deck
 * law makes a look, never a bump), BACK (−z) by `GARDEN_AXIS_OFFSET` and
 * DOWN so the paving's finish surface (`DECK_Y` above the set origin, the
 * flush-deck floor-camera law) sits 5 mm below the LOWEST authored line's
 * finish deck — same `DECK_CLEARANCE` contract as the counter/floor/tile
 * rows, with the deck's own 6 mm surface height carried explicitly so the
 * derivation stays readable. Rows recomputed from the live builds by
 * `tests/unit/garden-levels.test.ts`.
 * The offset is the widest of the four sets (0.52 m) because variant B's
 * dress stands all AROUND the deck, including a hose coil coiled in a sun
 * stripe FORWARD of the set origin (set z +0.24, its torus reaching +0.39):
 * at this row the hose's near edge lands at world z −0.13 and every other
 * guard solid clears ≥ 37 cm (measured from the live group boxes by
 * `tests/unit/garden-levels.test.ts`). The paving's forward edge lands at
 * +0.06 — just outside the drive corridor, so the car rolls on slabs the
 * whole way across (flush deck: the floor-camera law holds at any offset;
 * this one is chosen for the guard boxes, not the pixels).
 * Yaw 0 on every rung: the ratified hero frames the sun disc and the
 * trellis bars in one composition, the bore is deliberately yawed OFF the
 * track axis by the set itself (the AD's focal fix — a level yaw would undo
 * it and swing the can onto the corridor), and the shadow bars must keep
 * running ACROSS the lane exactly as the ratified floor camera frames them. */
export const GARDEN_AXIS_OFFSET = 0.52;

const GARDEN_ROWS: Record<string, readonly [number, number, number]> = {
  garden01: [0.97115, -0.41409, -GARDEN_AXIS_OFFSET],
  garden02: [1.09123, -0.47409, -GARDEN_AXIS_OFFSET],
  garden03: [1.1825, -0.43167, -GARDEN_AXIS_OFFSET],
  garden04: [1.21654, -0.45409, -GARDEN_AXIS_OFFSET],
};

/** The mount transform for one garden level id (null = no placement — the
 *  canonical-origin fallback the `?set=garden` inspection entry uses). */
export function gardenSetPlacement(levelId: string): SetPlacement | null {
  const row = GARDEN_ROWS[levelId];
  return row ? { position: [row[0], row[1], row[2]], yaw: 0 } : null;
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
