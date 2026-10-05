/**
 * The bedroom set as DATA — the same pattern `src/sets/kitchen/data.ts`
 * establishes (Environment Artist, stage 4): pure numbers, no three import,
 * the one page levels and the render harness read without pulling in three.
 * Built to the RATIFIED look — variant B, lamp-lit dusk hardwood, per
 * `docs/vault/Reference/Review 2026-10-08 Stage 4 bathroom+bedroom.md`
 * (13/13, both canonical cameras pass), migrated out of the throwaway
 * exploration `src/dev/scenes/bedroom.ts` (bedroomB).
 *
 * What production added over the exploration (the AD's caveats, engineered
 * in, not deferred):
 * - the BOOK PYRAMID is no longer a voxel blob — every book carries visible
 *   cream page bands (paper class, flat, no grain: the dither fringe was
 *   grazing grain), see `BOOK_PYRAMID.tiers`;
 * - the LAMP is a practical: `LAMP.bulb` is the world point the set mounts a
 *   real THREE.PointLight at, so the pool is lit, not painted (the rig key
 *   sits at the same origin for the ratified long lamp shadows);
 * - the DESK DRAWER is pulled half-open with a card-sized daylight gap —
 *   the future tunnel affordance. `DRAWER_SOCKET_FRAMES` (`drawer.in` /
 *   `drawer.out`) are the sockets a tunnel level will snap through, and
 *   `CARD_GAP` is the clearance they are built to.
 *
 * Scale discipline unchanged from the kitchen: set space == world space,
 * 1:64 (a 0.85 m credit card is a `CARD_GAP` ≈ 13 mm slit; the car is ~47 mm
 * long). The palette is NOT the kitchen's — indigo dominant, nightlight
 * amber accent, per the art bible time-of-day table; the orange track
 * constant rides the global tokens and is never re-hued.
 */

/** The set's dress scale: the exploration authored in world metres, so the
 *  migration bakes 1.0 (every constant below is already world-space). */
export const SET_SCALE = 1

/** The floor the set is dressed on: the hardwood disc the canonical cameras
 *  read as endless. The bounds every socket and hazard must live inside. */
export const FLOOR = {
  shape: 'circle' as const,
  center: { x: 0, z: 0 },
  radius: 1.4,
} as const

/** True when a world-space point lies inside the floor bounds. */
export function insideFloor(x: number, z: number, margin = 0): boolean {
  const dx = x - FLOOR.center.x
  const dz = z - FLOOR.center.z
  return Number.isFinite(dx) && Number.isFinite(dz) && dx * dx + dz * dz <= (FLOOR.radius - margin) ** 2
}

/** A credit card (85.6 mm) at 1:64 — the daylight gap of the half-open
 *  drawer and the clearance the `drawer.*` sockets are authored to. */
export const CARD_GAP = 0.856 / 64

/** The lamp practical, world-space: the stand at the desk foot and the
 *  `bulb` point the set's PointLight occupies (inside the shade, just below
 *  its rim). The rig's directional key sits at the same origin in the
 *  render scene so one light direction explains every shadow (art bible
 *  §Light); the point light adds the warm pool that says the lamp is ON. */
export const LAMP = {
  position: [0.2, 0, -0.16] as const,
  yaw: -0.4,
  /** Shade rim height; the bulb sits just under it. */
  shadeY: 0.25,
  bulb: [0.2, 0.232, -0.16] as const,
  /** Practical reach (PointLight.distance cutoff) and strength. Tuned
   *  STEEP (decay 2.4) and SHORT (reach 0.6): the ratified variant-B
   *  histogram was earned by ONE lamp key, and r186 punctual scale has no
   *  4π normalization — a slow falloff re-adds ~1.0 luma across the whole
   *  floor and re-lights the stage-3 wash. This shape adds a lit pool
   *  within a hand's reach of the shade and a few hundredths beyond the
   *  desk foot: pool where the lamp IS, dusk everywhere else. */
  reach: 0.6,
  intensity: 0.1,
  decay: 2.4,
} as const

/** The desk — the anchor that replaced the exploration's floating slab:
 *  FOUR visible legs and an apron rail, the top low enough (0.34) to enter
 *  the canonical frames so the support is never invisible (the AD's material
 *  note on variant B). */
export const DESK = {
  /** Top surface height; legs + apron carry it visibly. */
  topY: 0.34,
  top: { center: [0.44, 0.34, -0.38] as const, size: [0.36, 0.03, 0.42] as const },
  legs: [
    [0.29, -0.23],
    [0.59, -0.23],
    [0.29, -0.53],
    [0.59, -0.53],
  ] as const,
} as const

/** The dresser by the back wall, left of the pyramid — the prop that turns
 *  the AD's "drawer-front tunnel" ask into data. The drawer is pulled half
 *  out and hung `CARD_GAP` under its rail line: a daylight slit along the
 *  flank, portal-dark at dusk. The cabinet body is bored through along the
 *  drawer axis so a future tunnel level has a real bore to snap to. */
export const DRESSER = {
  position: [-0.42, 0, -0.3] as const,
  /** Yaw about +y; the drawer pulls along local +z toward the track. */
  yaw: 0.55,
  size: { width: 0.17, height: 0.17, depth: 0.115 } as const,
  /** The drawer bore: centre height and the card-sized clearance. */
  boreY: 0.095,
  gap: CARD_GAP,
  /** How far the drawer front stands out (half open). */
  pull: 0.075,
} as const

/** The drawer bore axis in world space — unit vector of local +z rotated
 *  by the yaw (three's R_y: z-local → (sin yaw, 0, cos yaw)). */
export const DRAWER_AXIS: readonly [number, number, number] = [
  Math.sin(DRESSER.yaw),
  0,
  Math.cos(DRESSER.yaw),
]

function drawerPoint(alongDepth: number): readonly [number, number, number] {
  // local offset along the drawer axis, measured from the dresser centre
  return [
    DRESSER.position[0] + DRAWER_AXIS[0] * alongDepth,
    DRESSER.boreY,
    DRESSER.position[2] + DRAWER_AXIS[2] * alongDepth,
  ]
}

/** The named drawer sockets as plain number frames (the Vector3 form is
 *  built in `buildBedroomSet`; the data form keeps this file three-free).
 *  Convention mirrors the bowl rim pair: `tangent` is the direction of
 *  travel, `up` [0,1,0], the gap clearance is `DRESSER.gap`. A car that
 *  enters `drawer.in` exits `drawer.out` through the bored cabinet. */
export const DRAWER_SOCKET_FRAMES = {
  'drawer.in': {
    pos: drawerPoint(DRESSER.size.depth / 2 + 0.045),
    tangent: DRAWER_AXIS,
    up: [0, 1, 0] as const,
  },
  'drawer.out': {
    pos: drawerPoint(-(DRESSER.size.depth / 2 + 0.045)),
    tangent: [-DRAWER_AXIS[0], 0, -DRAWER_AXIS[2]] as const,
    up: [0, 1, 0] as const,
  },
} as const

/** The book pyramid — the ziggurat whose blob read cost variant B its
 *  material point. Three tiers (3×3, 2×2, 1), every book a cover block in
 *  the indigo/cream/amber palette plus TWO flat cream page bands (fore-edge
 *  and top edge, paper class, grain 0 — the flat faces are what the dither
 *  fringe cannot reappear on). `seed` pins the lean: the stack was built by
 *  a kid, not a bookcase. */
export const BOOK_PYRAMID = {
  position: [-0.14, 0, -0.05] as const,
  yaw: 0.35,
  base: 3,
  book: { foot: 0.052, height: 0.017, depthRatio: 0.82 } as const,
  palette: ['#4A4F9E', '#E4D8BE', '#DFA24A'] as const,
  seed: 707,
} as const

/** The bed foot, back-left: the anchor. Production keeps the footboard and
 *  answers withdrawn variant C's spring ask AT THE SKIRT: a mattress edge
 *  floats over a box skirt with a dark slat gap and two brass spring coils
 *  peeking at the foot — the mechanic a level can later harvest. */
export const BED = {
  position: [-0.5, 0, -0.55] as const,
  yaw: 0.4,
} as const

/** The charging-cable snake, sitting up and facing the track (variant A's
 *  port, the prop the AD says no frame may lean on alone — which is exactly
 *  why production ships two more story props beside it). */
export const CABLE = {
  points: [
    [0.28, 0.0075, -0.3],
    [0.1, 0.0075, -0.26],
    [-0.02, 0.0075, -0.32],
    [-0.05, 0.04, -0.4],
    [-0.02, 0.07, -0.45],
  ] as const,
} as const

/** The homework abandoned mid-sentence — the lived-in detail, deliberately
 *  moved INTO the floor camera's focus band (the stage-3 carry-forward the
 *  AD filed with the production set). */
export const HOMEWORK = {
  notebook: { position: [0.05, 0.002, -0.085] as const, yaw: 0.3 },
  pencil: { position: [0.115, 0.005, -0.055] as const },
} as const

/** Hardwood board seams (data strips, never a texture): lines across the
 *  floor at `spacing`, offset so the track crosses them at a rhythm. */
export const SEAMS = {
  spacing: 0.175,
  offset: 0.05,
  count: 9,
} as const

/** The ratified variant declares NO hazard zone (the cable bump is a track
 *  ask, not a grip zone — the AD's scoreboard keeps it hazard-free), but the
 *  SetInstance surface carries the field for every set, so it is here,
 *  empty and typed. */
export const HAZARDS = {} as const

/** Decorative staging only — the one straight run the exploration threaded
 *  through variant B and where its car sits for the stills (the AD's "best
 *  car read in the stage"). NOT sockets; levels never import these. */
export const STAGING = {
  trackRuns: [
    {
      a: [-0.32, 0, 0.17] as const,
      b: [0.32, 0, -0.12] as const,
    },
  ],
  /** The still's car: parameter on run 0 (the exploration's hero read). */
  car: { run: 0, t: 0.55 },
} as const
