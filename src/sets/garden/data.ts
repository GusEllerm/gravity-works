/**
 * The garden set as DATA — the same pattern `src/sets/kitchen/data.ts` and
 * `src/sets/bedroom/data.ts` establish (Environment Artist, stage 4): pure
 * numbers, no three import, the one page levels and the render harness read
 * without pulling in three.
 *
 * Built to the RATIFIED look — variant B, paving slabs at golden hour, per
 * `docs/vault/Reference/Review 2026-10-08 Stage 4 garden.md` (13/13 both
 * canonical cameras), migrated out of the throwaway exploration
 * `src/dev/scenes/garden.ts` (garden-b).
 *
 * This is the studio's FIRST OUTDOOR set, and what it adds over every room
 * is the LIGHT REGIME, which lives in data before it lives in a scene:
 * - `SUN` is the key: a directional light with a legible low bearing, its
 *   own WARM golden-hour color (never the indoor key color), hard-ish
 *   shadows (radius 2, not the indoor 4);
 * - `SKY` is the FILL: outdoors the shade is sky-lit, so the rig's fill
 *   bands and — per the AD's rule the production set must implement — the
 *   SHADOW TINT derive from the sky value, not the set's dominant hue
 *   (`createLightingRig({ sky })` in `src/render/lighting.ts`). The variant-B
 *   exploration measured warm-olive shade because only the indoor tint rule
 *   existed; the sky-derived tint is this set's reason to exist in numbers.
 * - the sun-disc rule the renders argued for (draw the sun as geometry ONLY
 *   when it is low enough to sit inside the canonical frame — flat disc, no
 *   flare) is honored here: `SUN.disc` sits on the key's bearing just above
 *   the hedge line and is inside the hero rig `CAMERAS.hero` frames. The
 *   bible amendment itself is the Documentarian's to make (session log).
 *
 * The AD's carry-forwards, engineered in, not deferred:
 * 1. the pipe mouth is yawed OFF the track axis and its bore albedo raised
 *    (dark BUILT BY LIGHT, not painted — the bedroom felt lesson) so the bore
 *    disc stops outweighing the car;
 * 2. the snail carries a visible shell spiral (three diminishing whorl
 *    rings), not a pink bead;
 * 3. the joint moss is authored at NAMED joint crossings at a size the hero
 *    camera resolves (the chartreuse ground accent, also a grip patch);
 * 4. the watering can is galvanized die-cast with a three-step ramp band and
 *    a lit rim, its silhouette reading at the hero camera (backlit, so the
 *    rim is its face);
 * 5. the trellis has visible post feet (stone pads) — no floating lattice;
 * 6. `CAMERAS` ships the garden's own establishing/hero/floor rigs; the hero
 *    frames the sun disc AND the trellis shadow bars together (the ratified
 *    hero-b composition, now a set rig, not a borrowed kitchen one).
 *
 * Carry-forwards from the stage-wide list, honored where cheap: the wind
 * suggestion is ONE leaning sprig in the terracotta pot (static), the one
 * non-green mid-distance prop IS that pot, and the gravel is a laid,
 * staggered pattern with kerb stones — designed infill, never noise.
 *
 * Scale discipline unchanged: set space == world space, 1:64. The deck is
 * FLUSH with the lawn (top at `DECK_Y` = 6 mm) — the floor camera lives
 * 35 mm off the ground, and raised patios are banned by geometry, not taste
 * (the AD's floor-rig law the exploration discovered the hard way).
 */

/** The set's dress scale: the exploration authored in world metres, so the
 *  migration bakes 1.0 (every constant below is already world-space). */
export const SET_SCALE = 1

/** The flat sky value — the outdoor replacement for a room wall. ONE color,
 *  never a gradient (the never-list holds outdoors); `SUN.disc` is geometry,
 *  not a flare (same clause). */
export const SKY = '#BFD3DF'

/** The SUN: the one key, low and warm. The direction is the set — shadow
 *  bars from the trellis run the depth of the patio, and every form is
 *  explained by where its shadow goes. Length of `pos` encodes the elevation
 *  (~13°): only a sun this low can sit inside the canonical frame, which is
 *  what licenses the disc. */
export const SUN = {
  pos: [-1.05, 0.3, -1.3] as const,
  /** Golden-hour amber — a WARM key tint, never white, never the indoor
   *  breakfast color. */
  color: '#FFAE63',
  intensity: 1.2,
  /** Hard-ish: crisper than the indoor 4, softened just off knife-edge. */
  shadowRadius: 2,
  /** Ortho half-extent wide enough for the trellis bars across the deck. */
  shadowExtent: 1.3,
  /** The sun AS GEOMETRY: a flat 4°-chunky disc on the key's bearing, just
   *  above the hedge line, inside the hero frame. No flare, no glow. */
  disc: { pos: [-0.72, 0.15, -1.62] as const, radius: 0.055 },
} as const

/** The fill gain the materials ride (the rig passes it through). Slightly
 *  above the indoor default: an open sky is a BIGGER fill source than a
 *  room, and the sun regime must keep legible but WARM-fills — never black
 *  fill — under every shadow. */
export const FILL_STRENGTH = 0.3

/** How far the shadow tint and the sky band take the sky value. 0.6 is the
 *  number that makes the AD's claim measurable: the 40–90 luma band must
 *  lean sky (blue up, red down), not warm-olive like variant-B's pixels.
 *  The rig's sky term is the sky hue at SHADE DEPTH (deepened, saturated),
 *  because a shadow is sky light that lost its sun — see `createLightingRig`
 *  in `src/render/lighting.ts`. */
export const SKY_INFLUENCE = 0.6

/** The bounds every socket and hazard must live inside: the patio disc.
 *  The lawn and hedge live in the shell beyond it, non-solid. */
export const DECK = {
  shape: 'circle' as const,
  center: { x: 0, z: 0 },
  radius: 1.15,
} as const

/** True when a world-space point lies inside the deck bounds. */
export function insideDeck(x: number, z: number, margin = 0): boolean {
  const dx = x - DECK.center.x
  const dz = z - DECK.center.z
  return Number.isFinite(dx) && Number.isFinite(dz) && dx * dx + dz * dz <= (DECK.radius - margin) ** 2
}

/** The deck's finish height — FLUSH with the lawn within millimetres, per
 *  the floor-camera law (every driveable surface within a few mm of y = 0). */
export const DECK_Y = 0.006

/** The lawn the patio floats INTO (one flat disc, low-frequency grain; the
 *  lawn is the set's only big grain surface and every prop stays finer). */
export const LAWN = { radius: 2.6, hex: '#7C9550' } as const

/** The patio: settled slabs on a sand bed. `seed` pins the settle — the
 *  same patio was laid by the same gardener every render. */
export const PATIO = {
  bed: { size: 1.16 },
  slab: { size: 0.157, gap: 0.011, count: 7 },
  hex: '#C9B79E',
  seed: 31415,
} as const

/** Joint moss at NAMED joint crossings (carry-forward 3: claimed in the
 *  concept, invisible in the exploration frames — so the joints are authored
 *  at points on the slab seam grid, each a cluster the hero camera resolves
 *  at ~3 cm across). The chartreuse ground accent + a grip patch. */
export const JOINT_MOSS = {
  patches: [
    [-0.157, 0.079],
    [0.168, -0.171],
    [-0.325, -0.4],
  ] as const,
  /** Cluster offsets inside each patch (world metres, seed-free by design). */
  clumps: [
    [0, 0, 1],
    [0.021, 0.008, 0.7],
    [-0.017, 0.011, 0.55],
  ] as const,
} as const

/** The hedge band at the horizon — the garden's wall. The world stops here
 *  and the sky stays flat above it. */
export const HEDGE = { z: -1.9, height: 0.2, leaf: '#5E7A44', flower: '#A8C24E', seed: 9091, clumps: 60, blooms: 14 } as const

/** The trellis palisade, squared up to the low sun so it throws the ratified
 *  shadow bars — set architecture made of shadow. Carry-forward 5: BOTH
 *  post feet are paved in stone pads, so the lattice is visibly standing on
 *  something and its bars are visibly ITS. */
export const TRELLIS = {
  position: [-0.52, 0, -0.24],
  yaw: Math.PI / 2,
  w: 0.5,
  h: 0.34,
  leaf: '#7F9B45',
  flower: '#CD815F',
  seed: 1123,
} as const

/** The drain pipe — the tunnel mouth the straight ends in, and the garden's
 *  named socket pair (the set-architecture mirror of the bedroom drawer
 *  bore). Carry-forward 1, engineered twice: the mouth is yawed `offAxis`
 *  OFF the track axis (the ratified bore disc faced the hero camera and
 *  outweighed the car), and the bore albedo is raised out of the painted-
 *  black zone — a bore faces away from a low sun goes dark by LIGHT (its
 *  fill-only term), which is what the never-list asks for. */
export const PIPE = {
  /** Barrel centre, world-space, sitting on the deck. */
  center: [0.215, DECK_Y, -0.332] as const,
  /** Track-axis yaw MINUS the off-axis correction (the AD's focal ask): the
   *  mouth normal ends up facing AWAY from the key (the bore goes dark by
   *  light, never sun-facing) and away from the hero camera (the bore disc
   *  no longer outweighs the car). */
  yaw: 0.4047,
  length: 0.36,
  radius: 0.046,
  /** Bore-lining and bore-stop base colors: warm browns whose dark is made
   *  of missing light, not of black paint. */
  boreHex: '#5A4636',
  stopHex: '#6B5645',
} as const

/** Unit vector of the pipe's local +x under its yaw (three's R_y: x-local →
 *  (cos yaw, 0, −sin yaw)). */
export const PIPE_AXIS: readonly [number, number, number] = [Math.cos(PIPE.yaw), 0, -Math.sin(PIPE.yaw)]

/** One point on the pipe axis, `along` metres from the barrel centre. */
function pipePoint(along: number): readonly [number, number, number] {
  return [
    PIPE.center[0] + PIPE_AXIS[0] * along,
    PIPE.center[1] + PIPE.radius,
    PIPE.center[2] + PIPE_AXIS[2] * along,
  ]
}

/** The named pipe sockets as plain number frames (Vector3 form built in
 *  `buildGardenSet`). Convention mirrors the drawer pair: `tangent` is the
 *  direction of travel, `up` [0,1,0]; a car entering `pipe.in` at the mouth
 *  exits `pipe.out` through the barrel. */
export const PIPE_SOCKET_FRAMES = {
  'pipe.in': {
    pos: pipePoint(-(PIPE.length / 2 + 0.04)),
    tangent: PIPE_AXIS,
    up: [0, 1, 0] as const,
  },
  'pipe.out': {
    pos: pipePoint(PIPE.length / 2 + 0.04),
    tangent: [-PIPE_AXIS[0], 0, -PIPE_AXIS[2]] as const,
    up: [0, 1, 0] as const,
  },
} as const

/** The gravel crossing — a laid, staggered pattern (carry-forward: pebbles
 *  are designed infill, not noise): fixed row pitch ACROSS the band, fixed
 *  pitch ALONG it, alternate rows offset half a pitch, and a kerb line of
 *  flat stones on both edges. The pattern is what reads as "laid path" at
 *  200 px where the exploration's uniform-random scatter read as leaf litter. */
export const GRAVEL = {
  from: [-0.5, -0.3] as const,
  to: [0.5, -0.44] as const,
  /** Width across the band and the two pitches of the laid pattern. */
  width: 0.085,
  rowPitch: 0.021,
  alongPitch: 0.013,
  /** Jitter is ±1.5 mm of settle, not scatter — same seed every render. */
  jitter: 0.0015,
  seed: 707,
  hex: '#9A8F79',
  kerbHex: '#B3A78F',
} as const

/** The watering can, standing monolith-like against the far slabs. Carry-
 *  forward 4: pulled off flat grey-green — galvanized die-cast with a
 *  THREE-step ramp band; and because the hero camera has the sun behind it,
 *  a lit rim is the can's face: the silhouette must read at hero scale. */
export const WATERING_CAN = {
  position: [-0.36, DECK_Y, -0.42],
  yaw: -0.5,
  scale: 0.85,
  hex: '#B4BABE',
} as const

/** The gnome statue, seated in a shadow bar, facing the deck (the ratified
 *  B placement). */
export const GNOME = { position: [0.34, DECK_Y, 0.02], yaw: -1.1 } as const

/** The hose coil in the accent, coiled in a sun stripe. */
export const HOSE = { position: [-0.14, DECK_Y, 0.24], hex: '#A8C24E' } as const

/** The terracotta pot — the ONE non-green mid-distance prop, and the host
 *  of the wind suggestion: a single seedling sprig leaning one way, static.
 *  Terracotta is the dominant's own family, so the frame keeps exactly one
 *  warm outlier away from the lawn. */
export const POT = {
  position: [0.46, DECK_Y, -0.44],
  yaw: 0.5,
  hex: '#B4653F',
  leaf: '#6E9C46',
  /** The lean (radians about z) — the whole wind story, one static sprig. */
  lean: 0.55,
} as const

/** The snail mid-crossing, now WITH a shell spiral (carry-forward 2: three
 *  diminishing whorl rings, or it stays a pink bead). */
export const SNAIL = { position: [-0.14, DECK_Y, -0.02], yaw: 0.25 } as const

/** One fallen petal beside the snail — the dominant's own confetti. */
export const PETAL = { position: [-0.06, DECK_Y + 0.001, 0.02], yaw: 0.7 } as const

/** Variant B ratifies NO hazard zone (the shadow bars are hazard-free
 *  rhythm; the sprinkler pop-up gate the AD ported is a track ask, not a
 *  grip zone), but the SetInstance surface carries the field for every set,
 *  so it is here, empty and typed. */
export const HAZARDS = {} as const

/** Decorative staging only — the one straight the ratified hero-b threaded
 *  across the patio and where its car sits for the stills. NOT sockets;
 *  levels never import these. */
export const STAGING = {
  trackRuns: [
    {
      a: [-0.3, DECK_Y, 0.26] as const,
      b: [0.1, DECK_Y, -0.2] as const,
    },
  ],
  /** The still's car: parameter on run 0 (the exploration's hero read). */
  car: { run: 0, t: 0.55 },
} as const

/** The garden's OWN canonical camera rigs (carry-forward 6: none of the
 *  exploration frames were set rigs). Consumed through `SET_SHOTS` in
 *  `src/dev/cameras.ts` so the harness and the game camera list read ONE
 *  list, sourced from the set.
 * - establishing: the whole patio, hedge horizon, track visible;
 * - hero: THE ratified composition — the sun disc AND the trellis shadow
 *   bars in one frame with the car on the focus band (hero-b, now a rig);
 * - floor: 35 mm off the deck, a car in the tilt-shift band, the slab joints
 *   and the laid gravel resolving. */
export const CAMERAS = {
  establishing: { position: [0.75, 0.5, 0.95], target: [0, 0.04, -0.08], fov: 35, near: 0.01, far: 12 },
  hero: { position: [0.3, 0.15, 0.36], target: [0.02, 0.04, -0.02], fov: 35, near: 0.01, far: 12 },
  floor: { position: [0.16, 0.035, 0.3], target: [0, 0.03, -0.02], fov: 35, near: 0.005, far: 12 },
} as const
