/**
 * The kitchen set as DATA — the one page the levels and the render harness
 * read without pulling in three.js. Environment-owned (PROMPT §4.1: "a set's
 * pitch, props, lighting pass, signature affordance and hazard"), derived
 * from the chosen reference tile (`src/dev/scenes/kitchen-b.ts` staging,
 * re-dressed per the stage-1 review keeps) with every constant in WORLD
 * metres (set space == world space here; the internal 1.06 dress scale from
 * the tile is baked into the numbers below, so nothing downstream multiplies
 * a transform).
 *
 * Conventions this file is built TO (Concepts/Levels §Conventions):
 * - the bowl rim carries the named sockets `bowl.in` / `bowl.out`; its
 *   centreline is a planar arc of the KITCHEN03_BOWL bank radius (0.12),
 *   swept 120 degrees, flat at the sockets (the kit's bank piece is flat
 *   and unbanked at t=0/t=1 — the rim sockets mirror that exactly);
 * - the tap's drip point is a plain anchor (nothing snaps to it) and the
 *   wet patch below it is HAZARD data in the level `WetPatch` shape.
 *
 * Pure numbers only — no three import — so vitest can hash the set's data
 * half in Node and the browser identically.
 */

/** The reference staging was dressed at 1.06× inside the tile's vignette
 *  group; the set bakes that scale into world-space constants instead. */
export const SET_SCALE = 1.06

/** The tile-B bowl profile (radius / height / wall, tile-local metres) the
 *  lathe generator reproduces — the chosen reference's silhouette. */
const TILE_BOWL = { radius: 0.098, height: 0.054, wall: 0.005 } as const

/** Rim centreline radius in world metres — the L03 bank radius the artist
 *  builds to (KITCHEN03_BOWL.bank.radius). The lathe profile is scaled so
 *  the rim top's mid-wall circle lands exactly on this radius. */
export const BOWL_RIM_RADIUS = 0.12

/** World scale of the tile-B bowl profile: (R − w/2)·s = BOWL_RIM_RADIUS. */
export const BOWL_PROFILE_SCALE = BOWL_RIM_RADIUS / (TILE_BOWL.radius - TILE_BOWL.wall / 2)

/** The bowl, world-space: position, profile extents, and the rim height the
 *  sockets sit on (rim-top crown = height + wall/2). */
export const BOWL = {
  position: [-0.035 * SET_SCALE, 0, -0.045 * SET_SCALE] as const,
  /** Outer radius at the rim. */
  radius: TILE_BOWL.radius * BOWL_PROFILE_SCALE,
  height: TILE_BOWL.height * BOWL_PROFILE_SCALE,
  wall: TILE_BOWL.wall * BOWL_PROFILE_SCALE,
  /** Y of the rim crown at the centreline radius — the socket height. */
  rimY: (TILE_BOWL.height + TILE_BOWL.wall / 2) * BOWL_PROFILE_SCALE,
} as const

/** The rim arc that carries the two sockets, mirroring the L03 fixture pair
 *  (a +120°, 25°-banked `bank` closed by a flat −120° counter-`curve`): the
 *  car enters at `bowl.in` and leaves at `bowl.out`, travelling the arc with
 *  DECREASING angle — tangent(a) = (sin a, 0, −cos a) — which is the exact
 *  tangent/up convention the level's derived socket poses carry (verified
 *  against `KITCHEN03.propSockets` in `tests/unit/kitchen-set.test.ts`).
 *  `bankDeg` documents the arc's mid-sweep bank (flat at the sockets); the
 *  sockets themselves are unbanked because the rim's crown is level — the
 *  future bank piece brings its own banking. */
export const BOWL_ARC = {
  startDeg: 45,
  endDeg: -75,
  sweepDeg: 120,
  bankDeg: 25,
} as const

/** The tap, world-space. The drip anchor is the local spout-lip offset
 *  (0.108, 0.03, 0) rotated by the yaw and lifted by the scale — computed
 *  here once so the hazard centre and the frozen-drip mesh cannot drift. */
const TAP_POS: readonly [number, number, number] = [-0.31 * SET_SCALE, 0, -0.2 * SET_SCALE]
const TAP_YAW = -1.2
const DRIP_LOCAL: readonly [number, number] = [0.108, 0.0]
export const TAP = {
  position: TAP_POS,
  yaw: TAP_YAW,
  /** World-space point the frozen drip hangs at. */
  drip: [
    (TAP_POS[0] + (DRIP_LOCAL[0] * Math.cos(TAP_YAW) + DRIP_LOCAL[1] * Math.sin(TAP_YAW)) * SET_SCALE),
    0.03 * SET_SCALE,
    (TAP_POS[2] + (-DRIP_LOCAL[0] * Math.sin(TAP_YAW) + DRIP_LOCAL[1] * Math.cos(TAP_YAW)) * SET_SCALE),
  ] as const,
} as const

/** The counter: a warm-wood round the canonical cameras read as endless
 *  (the reference framing); the bounds every socket and hazard must live
 *  inside. */
export const COUNTER = {
  shape: 'circle' as const,
  center: { x: 0, z: 0 },
  radius: 1.4,
} as const

/** A wet patch in the exact `WetPatch` shape `KitchenLevel.hazards` carries
 *  (`src/world/levels/kitchen01.level.ts`) — drop-in consumable data. The
 *  radius and grip match KITCHEN04's authored hazard; the centre is the
 *  tap's drip point projected onto the counter. */
export const HAZARDS = {
  tapSplash: {
    id: 'tapSplash',
    kind: 'wetPatch' as const,
    center: { x: TAP.drip[0], y: 0, z: TAP.drip[2] },
    radius: 0.14,
    gripFactor: 0.5,
    source: 'tap',
  },
} as const

/** Decorative staging only — the two orange runs the canonical renders show
 *  (tile-B's framing). They are NOT sockets and levels never import them:
 *  the built track comes from the kit. The sugar-cube support stack reads
 *  the midpoint of run 0, which is why the runs live in set data rather
 *  than only in the dev scene. */
export const STAGING = {
  trackRuns: [
    {
      a: [-0.24 * SET_SCALE, 0.09 * SET_SCALE, 0.22 * SET_SCALE],
      // the run end now GROUNDS on the counter (stage-3 review fix 5): the
      // old 0.022 end hung ~1 cm off the surface with a detached shadow.
      b: [-0.1 * SET_SCALE, 0.001 * SET_SCALE, 0.022 * SET_SCALE],
    },
    {
      a: [0.095 * SET_SCALE, 0.02 * SET_SCALE, -0.03 * SET_SCALE],
      b: [0.21 * SET_SCALE, 0.005 * SET_SCALE, -0.06 * SET_SCALE],
    },
  ],
  /** Where the canonical renders park the rim car (stage-3 review fix 3):
   *  AT the `bowl.in` socket angle — wheels on the rim crown, LEVEL like
   *  the named sockets (the crown is level; the old 0.35 bank drove the
   *  body through the ceramic). The dev scene poses it from
   *  `BOWL_SOCKET_FRAMES` directly; these fields document the still. */
  rimCar: { angleDeg: -75, bank: 0 },
} as const

/** True when a world-space point lies inside the counter bounds. */
export function insideCounter(x: number, z: number, margin = 0): boolean {
  const dx = x - COUNTER.center.x
  const dz = z - COUNTER.center.z
  return Number.isFinite(dx) && Number.isFinite(dz) && dx * dx + dz * dz <= (COUNTER.radius - margin) ** 2
}

/** The rim arc's position at a given angle (degrees), world metres. */
export function bowlArcPoint(deg: number): readonly [number, number, number] {
  const a = (deg * Math.PI) / 180
  return [BOWL.position[0] + BOWL_RIM_RADIUS * Math.cos(a), BOWL.rimY, BOWL.position[2] + BOWL_RIM_RADIUS * Math.sin(a)]
}

/** The rim arc's direction-of-travel at a given angle (car moves with
 *  DECREASING angle — see `BOWL_ARC`). */
export function bowlArcTangent(deg: number): readonly [number, number, number] {
  const a = (deg * Math.PI) / 180
  return [Math.sin(a), 0, -Math.cos(a)]
}

/** The named rim sockets as plain number frames (the Vector3 form is built
 *  in `buildKitchenSet`; the data form keeps this file three-free). */
export const BOWL_SOCKET_FRAMES = {
  'bowl.in': {
    pos: bowlArcPoint(BOWL_ARC.startDeg),
    tangent: bowlArcTangent(BOWL_ARC.startDeg),
    up: [0, 1, 0],
  },
  'bowl.out': {
    pos: bowlArcPoint(BOWL_ARC.endDeg),
    tangent: bowlArcTangent(BOWL_ARC.endDeg),
    up: [0, 1, 0],
  },
} as const
