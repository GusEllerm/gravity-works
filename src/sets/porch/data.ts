/**
 * The porch set as DATA — the same pattern `src/sets/garden/data.ts` and
 * `src/sets/garage/data.ts` establish (Environment Artist, stage 4), ported
 * out of the RATIFIED exploration variant A (sunday morning) per
 * `docs/vault/Reference/Review 2026-10-09 porch judging.md` (15/15, no
 * send-back; the exploration lived in `src/dev/scenes/porch.ts` on
 * stage5-porch-explore and is throwaway).
 *
 * THE SET IS THE THRESHOLD: a plank deck between the house door and the
 * yard, and its ONE KEY STORY is the screen-door mesh weave combed by the
 * low morning sun as a single parallelogram of grid shadow across the warm
 * planks (judge's must-not-lose item 1). The light regime is the garden's,
 * ported indoors-by-half: `SUN` is a low WARM directional key raking from
 * frame left (~14° elevation, the breakfast gold `#FFE3B8`, never the
 * indoor lamp key), and the FLAT SKY is the fill — the rig is built with
 * `createLightingRig({ keyColor: SUN.color, sky: SKY, … })`, so the fill
 * bands and the shadow tint derive from the sky value (the AD note-2
 * lineage). The porch adds ONE dial the garden did not need:
 * `SHADOW_TINT_SKY_LIFT` — cast shade is a big soft share of this frame, so
 * the rig's deepened-sky tint at census depth measures in the BLACKISH
 * channel-spread band; the lift carries more of the sky's own light into
 * the tint (still sky-hued, still shade) and is the exact knob the
 * exploration's round 3 needed to take A to 0.000 % blackish.
 *
 * The must-not-lose list, item by item (Review 2026-10-09 porch judging):
 * 1. the weave-shadow parallelogram — the screen-door mesh bars CAST (the
 *    set architecture IS the shadow; `SHADOW_TINT_SKY_LIFT` keeps the seams
 *    out of the census soot band);
 * 2. AD-2 accent-inside-the-band — geraniums + the doormat band, never
 *    above the rail (the lantern sits dark at the step, never hung);
 * 3. the gutter flume laid AT DECK HEIGHT in the band — the signature
 *    affordance, non-solid like the garden's gravel so the lane can cross
 *    it (item 6 of the ladder handover below);
 * 4. the sneakers as the scale joke — RESIZED to shoe scale (they read as
 *    bricks at build camera at the exploration's scale; the port condition
 *    is `SHOES.scale`, not the exploration's brick numbers);
 * 5. warm-neutral planks (`PLANK.hex` stays the A ground; nothing here
 *    greys it — variant C's lesson);
 * 6. the hero rig re-aimed at the door-mouth + step (`CAMERAS.hero`, the
 *    garden precedent: hero frames the story, floor obeys the 35 mm law).
 *
 * LADDER HANDOVER (no levels yet — the ladder crew follows this set):
 * - sockets: the threshold pair `door.in`/`door.out` (a car entering the
 *   hall-side mouth exits onto the deck, the drawer/pipe-pair convention)
 *   plus `step.out`, the deck→yard seam at the stoam's front edge;
 * - the guard-box split: rails/posts/lantern/chime/planters are dress
 *   solids; the deck, walls, door assembly and the FLUME are shell
 *   (non-solid) — the door mouth stays fully buildable and the lane can
 *   cross the flume exactly as the garden lane crosses the gravel;
 * - hazards ship EMPTY: the weave shadow is read-only rhythm (judge line
 *   1) and the flume's trickle is a TIMING tell, not a grip zone — a
 *   level-side `wetPatch` over the drown-off is the bathroom ask #6 shape
 *   if a rung ever wants the slick;
 * - fixtures: set geometry carries the room; a rung's own built-in track
 *   pieces stay per-level `fixtures` quotas (`src/track/build.ts`
 *   `fixtureQuota`) exactly as in the other five rooms — the set's
 *   recommendation for the corridor rungs is in the session log.
 *
 * Scale discipline unchanged: set space == world space, 1:64. The deck is
 * FLUSH with the stoam and the yard within millimetres (top at `DECK_Y`
 * = 5 mm) — the floor camera lives 35 mm off the ground and raised patios
 * are banned by geometry, not taste.
 */

/** The set's dress scale: the exploration authored in world metres, so the
 *  migration bakes 1.0 (every constant below is already world-space). */
export const SET_SCALE = 1

/** The flat sky value — the half-outdoor replacement for a room wall. ONE
 *  color, never a gradient (the never-list holds); no sun disc here — the
 *  morning sun of A sits outside the canonical frame, so the bible's
 *  draw-the-sun rule is simply not exercised. */
export const SKY = '#B7D4E2'

/** The MORNING SUN: the one key, low (~14°) and gold, raking from frame
 *  left THROUGH the shut screen door. The direction is the set — the weave
 *  it combs across the deck is the picture. */
export const SUN = {
  pos: [-1.05, 0.32, 0.78] as const,
  /** Breakfast gold — a WARM key tint, never white, never the indoor
   *  `keyLight` cream. */
  color: '#FFE3B8',
  intensity: 1.42,
  /** Hard-ish, like the garden's sun: crisper than the indoor 4. */
  shadowRadius: 2.2,
  /** Ortho half-extent wide enough for the whole deck plus the rails. */
  shadowExtent: 1.4,
} as const

/** How far the fill bands are pulled toward the set's accent. The
 *  exploration value (A spends the amber in-band only, so the pull stays
 *  modest). */
export const ACCENT_MIX = 0.22

/** The fill gain the materials ride. Slightly below the garden's 0.3 — a
 *  roofed deck sees less of the open sky than a patio, but the shade under
 *  the eaves must stay WARM-filled, never black fill. */
export const FILL_STRENGTH = 0.28

/** Sky-FILL MIX: how far the rig's sky-side fill band is pulled toward the
 *  flat sky value (`skyFillMix` in `createLightingRig`). The A number: the
 *  deck is half-under-roof, so LESS of the sky's brightness lands in shade
 *  than on the open patio (0.4 vs the garden's 0.55). */
export const SKY_FILL_MIX = 0.4

/** Sky-FILL SHADE DEPTH: shipped at 0 — the flat horizon sky (the garden
 *  measured this dial as a global dimmer; A's census does not need it). */
export const SKY_FILL_SHADE = 0

/** How far the shadow tint takes the sky value. 0.45 is the A number —
 *  lower than the garden's 0.6 because the SKY LIFT below does the
 *  census-side work (see `SHADOW_TINT_SKY_LIFT`). */
export const SKY_INFLUENCE = 0.45

/** Fill SHADE DEPTH (`fillShadeDepth` on the rig, `uFillShadeDepth` in the
 *  shader): the fraction of the sky fill a SHADOWED fragment keeps. The
 *  garden's knob spent harder (0.72 vs 0.6) because on a roofed deck the
 *  weave parallelogram must CROSS the 60-luma census line while the sunlit
 *  planks beside it stay at their ratified 131–152 medTone — lit pixels
 *  stay bit-identical; only the shade drinks less sky. */
export const FILL_SHADE_DEPTH = 0.72

/** Shadow-tint SKY LIFT (the porch's one addition to the garden's regime,
 *  the exploration's round-3 finding): the fraction the rig's shadow tint
 *  is mixed toward the sky lifted 60 % to white. Cast shade is a big soft
 *  share of this frame, and the rig's deepened-sky tint at census depth
 *  has a channel spread the census files as BLACKISH (it measured
 *  (31,35,39) — a spread of 8, in the soot band); the lift keeps the tint
 *  sky-hued and shaded but readable as COLOUR, which is what took variant
 *  A's frames to 0.000 % blackish. Applied in `porchFillFromRig` — the ONE
 *  fill path for every material in the set and the staging scene. */
export const SHADOW_TINT_SKY_LIFT = 0.85

/** The bounds every socket and hazard must live inside: the driveable deck
 *  disc. The planks are rectangular (x ±0.56, z −0.30…0.43); the disc is
 *  the largest circle that sits inside the rails and still reaches the
 *  threshold and the stoam. */
export const DECK = {
  shape: 'circle' as const,
  center: { x: 0, z: 0.05 },
  radius: 0.62,
} as const

/** True when a world-space point lies inside the deck bounds. */
export function insideDeck(x: number, z: number, margin = 0): boolean {
  const dx = x - DECK.center.x
  const dz = z - DECK.center.z
  return Number.isFinite(dx) && Number.isFinite(dz) && dx * dx + dz * dz <= (DECK.radius - margin) ** 2
}

/** The deck's finish height — FLUSH with the stoam and the yard within
 *  millimetres, per the floor-camera law. */
export const DECK_Y = 0.005

/** The plank deck: 14 warm bleached planks (must-not-lose 5: the A ground
 *  stays WARM — never grey it) on a darker bed so the seams read, laid
 *  across x at a fixed 55 mm pitch from z −0.285. The bed albedo is the
 *  exploration's round-2 fix: `darken(plank, 0.10)`, NOT the 0.42 that
 *  measured inside the census BLACKISH band. */
export const PLANK = {
  x: { from: -0.57, to: 0.57 },
  z0: -0.285,
  pitch: 0.055,
  count: 14,
  hex: '#BD9666',
  /** The two alternating plank materials (the grain-variety read). */
  lift: 0.03,
} as const

/** The house wall on −z: panels around the door opening, FLUSH clapboard
 *  seam rows (round 0 left them PROUD and the key lit them as bricks), the
 *  door casing, the hall behind the opening (a warm dark at diffuse 0.35 —
 *  the awake house, not a black hole), and a short return wall closing the
 *  left of the establishing frame ("porch floating in a field" fix). */
export const WALL = {
  z: -0.312,
  x: { from: -1.15, to: 0.85 },
  top: 0.62,
  hex: '#7C93A6',
  /** The hall behind the door: warm dark, `diffuseStrength` carries the
   *  "inside is awake" tell. */
  interiorHex: '#7A6650',
  interiorGlow: 0.35,
  /** Clapboard seam rows: pitch, height, and the flush z they lie at. */
  seam: { y0: 0.03, pitch: 0.048, z: -0.306 },
} as const

/** The door opening and its two leaves. THE DOOR stands OPEN onto the yard
 *  and the SCREEN stays SHUT — the whole light story is the weave (must-
 *  not-lose 1). */
export const DOOR = {
  x0: -0.12,
  x1: 0.02,
  top: 0.32,
  /** The planked shed door, yawed open (pivot at the left jamb). */
  open: -1.15,
  /** The screen door: shut, at the opening's deck side. */
  screenZ: -0.282,
  /** The mesh weave: 6 mm bar pitch — chunky ON PURPOSE (a real 1 mm mesh
   *  blurs to a grey veil under PCF; 6 mm is what combs the parallelogram). */
  mesh: { pitch: 0.006, hex: '#8E9896' },
} as const

/** The window right of the door (frame, sill, glass) and the geranium box
 *  standing ON the sill — the amber's first in-band spend. */
export const WINDOW = {
  center: [0.38, 0.28] as const,
  pane: { w: 0.2, h: 0.14 },
  z: -0.296,
} as const

/** The roof: a NO-CAST ceiling (the key must reach the deck through the
 *  door mouth — casting ceiling is how you lose the parallelogram), fascia,
 *  front beam and two corner posts. */
export const ROOF = {
  ceilingY: 0.47,
  height: 0.455,
  fasciaZ: 0.438,
  beamZ: 0.42,
  posts: [-0.56, 0.56] as const,
} as const

/** The railings: four runs (the front run breaks for the step at x
 *  0.02…0.20), each a top rail, a mid rail and chunky balusters at a fixed
 *  pitch. The rails/posts are DRESS solids — the corridor's edges. */
export const RAILS = {
  /** The front runs live at this z; the side runs carry their own x. */
  z: 0.41,
  balusterPitch: 0.055,
  runs: [
    { axis: 'x' as const, x0: -0.56, x1: -0.01 },
    { axis: 'x' as const, x0: 0.21, x1: 0.56 },
    { axis: 'z' as const, x: -0.56, z0: -0.28, z1: 0.38 },
    { axis: 'z' as const, x: 0.56, z0: -0.28, z1: 0.38 },
  ],
} as const

/** The step: a FLUSH concrete stoam at the break in the front rail (floor-
 *  camera law again — the yard is reached over a flush step, never down a
 *  ledge). */
export const STEP = { center: [0.11, 0.51] as const, w: 0.2, d: 0.1 } as const

/** The yard beyond the rail: one flat ground disc + hedge bands closing the
 *  horizon (never a gradient). The ground is the OUTDOOR HALF of the porch
 *  rule — its fill carries the sky hard (round 1's near-black-NEUTRAL lawn
 *  corners are why `skyFill` is a set constant, not a scene-local hack). */
export const YARD = {
  radius: 2.6,
  hex: '#7C9A58',
  hedgeHex: '#4F6B54',
  hedgeY: 0.32,
  hedgeZ: -1.45,
  /** The fill-high cut toward SKY for everything fully outdoors. */
  skyFillMix: 0.55,
} as const

/** The galvanized metal of the drainage — kept WARM per the never-grey
 *  rule, and noticeably darker than the stage-1 chrome: at 1:64 a
 *  galvanized gutter is a weathered band, not a mirror. */
export const STEEL = '#8F887A'

/** The downspout against the wall: riser, elbow, discharge spout, strap. */
export const DOWNSPOUT = { x: 0.34 } as const

/** The GUTTER FLUME — the signature affordance (must-not-lose 3), laid at
 *  DECK HEIGHT in the focus band, and SHELL geometry (non-solid like the
 *  garden's gravel): a rung's lane may cross it exactly as the garden lane
 *  crosses the gravel. A carries last night's rain as a TRICKLE. */
export const FLUME = {
  center: [0.24, -0.225] as const,
  length: 0.42,
  yaw: 0,
  water: 'trickle' as const,
} as const

/** The drip line from the elbow into the trough — the timing tell, four
 *  drops frozen at the fixed clock. */
export const DRIPS = { at: [0.34, -0.235] as const, count: 4, spread: 0.02 } as const

/** The wind chime hung under the door's lintel. Static here — the pendulum
 *  gate is a level-side sim ask (the Feel crew), not a set animation. */
export const CHIME = { position: [-0.05, 0.285, -0.25] as const } as const

/** The lantern, OFF and leaning by the step — a lamp for later (the evening
 *  grade of this room is variant B, kept out of the set). */
export const LANTERN = { position: [0.0, 0.005, 0.33] as const, lean: 0.08 } as const

/** Geraniums in the accent, spent TWICE and both times INSIDE the focus
 *  band (must-not-lose 2, AD-2): the by-step pot and the window box. */
export const PLANTERS = {
  byStep: { position: [0.4, 0, 0.24] as const, potMix: 0.3, blooms: 9 },
  box: { position: [0.38, 0.196, -0.27] as const, scale: 0.72, potMix: 0.4, blooms: 6 },
  potHex: '#B96A45',
  seed: 4242,
} as const

/** The kid's pair by the door — the scale joke (must-not-lose 4). The
 *  RESIZE is a port condition, not a preference: at the exploration's 30 mm
 *  the shoes read as BRICKS at build camera; `scale` 0.62 puts them at
 *  sneaker scale against the 46 mm car body and keeps the "kicked off mid-
 *  crossing" story readable at 200 px. */
export const SHOES = {
  position: [-0.2, 0, -0.17] as const,
  yaw: 0.5,
  hex: '#C6503C',
  scale: 0.62,
} as const

/** The doormat at the threshold — the A accent spend (the band only ever in
 *  A; B/C spent their amber elsewhere). */
export const DOORMAT = { position: [-0.05, 0, -0.2] as const, band: true } as const

/** The named sockets as plain number frames (Vector3 form built in
 *  `buildPorchSet`). Convention mirrors the drawer/pipe pairs: `tangent` is
 *  the direction of travel, `up` [0,1,0]. A car entering `door.in` at the
 *  hall-side mouth exits `door.out` onto the deck; `step.out` is the
 *  deck→yard seam over the stoam. All three sit inside `DECK` bounds
 *  (distances from the disc centre 0.35 / 0.29 / 0.54 < 0.62). */
export const PORCH_SOCKET_FRAMES = {
  'door.in': {
    pos: [-0.05, DECK_Y, -0.36] as const,
    tangent: [0, 0, 1] as const,
    up: [0, 1, 0] as const,
  },
  'door.out': {
    pos: [-0.05, DECK_Y, -0.24] as const,
    tangent: [0, 0, 1] as const,
    up: [0, 1, 0] as const,
  },
  'step.out': {
    pos: [0.11, DECK_Y, 0.58] as const,
    tangent: [0, 0, 1] as const,
    up: [0, 1, 0] as const,
  },
} as const

/** Variant A ratifies NO hazard zone — the weave shadow is read-only
 *  rhythm and the flume trickle is a timing tell (the set ships the
 *  SUGGESTION; a level's authored `wetPatch` is the grip). The SetInstance
 *  surface carries the field for every set, so it is here, empty and
 *  typed. */
export const HAZARDS = {} as const

/** Decorative staging only — the one straight the ratified frames ran from
 *  the door mouth to the step, and where the hero car sits for the stills.
 *  NOT sockets; levels never import these. */
export const STAGING = {
  trackRuns: [
    {
      a: [-0.05, DECK_Y, -0.28] as const,
      b: [0.2, DECK_Y, 0.28] as const,
    },
  ],
  /** The still's car: parameter on run 0 (the exploration's hero read —
   *  mid-threshold, inside the weave). */
  car: { run: 0, t: 0.52 },
  /** The witness pair, kicked off beside the mat (the other kid is late). */
  witness: { position: [-0.34, 0.005, -0.02] as const, yaw: 0.9 },
} as const

/** The porch's OWN canonical camera rigs (must-not-lose 6 — the hero
 *  re-aimed at the door-mouth + step is the port condition the judging set,
 *  not an improvement opportunity). Consumed through `SET_SHOTS` in
 *  `src/dev/cameras.ts` so the harness and the game camera list read ONE
 *  list, sourced from the set.
 * - establishing: the CANONICAL kitchen numbers VERBATIM — the ratified
 *   establishing-a frame was shot through them, and re-shooting the ratified
 *   camera byte-comparably is how a production port proves parity (the
 *   garage precedent: only moved rows differ, ratified stills stay);
 * - hero: THE ratified story, re-framed: door-mouth behind, weave
 *   parallelogram in the middle, stoam + yard at the frame's foot, the car
 *   mid-crossing in the focus band. The exploration's own demerit was that
 *   its hero "frames decks, not the threshold"; this rig is that fix;
 * - floor: 35 mm over the flush deck (the floor-camera law), down the lane
 *   toward the door mouth — the weave grid resolving under the car, the
 *   sneakers and the mat band in the near band. */
export const CAMERAS = {
  establishing: { position: [0.62, 0.42, 0.78], target: [0, 0.05, 0], fov: 35, near: 0.01, far: 12 },
  hero: { position: [0.24, 0.19, 0.82], target: [-0.02, 0.08, -0.08], fov: 35, near: 0.01, far: 12 },
  floor: { position: [0.2, 0.045, 0.34], target: [-0.02, 0.03, -0.16], fov: 35, near: 0.005, far: 12 },
} as const
