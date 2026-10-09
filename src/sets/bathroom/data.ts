/**
 * The bathroom set as DATA — the same pattern `src/sets/kitchen/data.ts`
 * establishes (Level Designer's minimal art port, stage 4 bathroom ladder):
 * pure numbers where they can be, the RATIFIED look — variant A (porcelain
 * cathedral), 14/15 at both canonical cameras per
 * `docs/vault/Reference/Review 2026-10-08 Stage 4 bathroom+bedroom.md`,
 * migrated out of the throwaway exploration `src/dev/scenes/bathroom.ts`
 * (bath-a; variants B/C stay in the dev scene, withdrawn/ratified-elsewhere
 * per the review).
 *
 * What the port is and is not (the AD's one "must not lose" clause):
 * - the PORCELAIN BASES and the deep tinted-aqua FILL ride the token values
 *   below (`BATHROOM_TOKENS`), entered at token/material level;
 * - the ceramic THREE-BAND RAMP is NOT repeated here: it belongs to the
 *   ceramic class in `src/render/materials.ts` (stage-3 decision 5 forbids
 *   per-scene ramp hacks — the kitchen set follows the same rule). The
 *   ratified stills were rendered with a scene-side ramp override
 *   (thresholds [0.28, 0.72], softness 0.06) that the class does not carry
 *   (class: [0.25, 0.62], softness 0.08). That delta is set FRICTION, not a
 *   tuning to hide: it is recorded in
 *   `Sessions/2026-10-08 Stage 4 - bathroom ladder.md` and belongs to the
 *   art/TA lane, not to this port.
 * - the KEY LIGHT was scene-owned in the dev scene (a cool 45° key
 *   `#DDE9F6` @ 1.22 with a tight 4096 map); the production rig is
 *   `src/render/lighting.ts`, which takes exactly those dials as options —
 *   `KEYLIGHT` below is the recommended rig-options row so a staging scene
 *   can pass them. Deviating from it re-opens the wash.
 *
 * Scale discipline unchanged from the kitchen: set space == world space at
 * 1:64 (the car is ~47 mm; the tub is a cottage). The two dressing positions
 * the migration moved (towel stack, and nothing else) are documented in
 * place; every other prop keeps the ratified dev-scene pose. The orange
 * track constant rides the global tokens and is never re-hued.
 */
import { GLOBAL_TOKENS, SET_TOKENS, darken, lighten, mixHex } from '../../render/tokens.ts'
import type { SetTokens } from '../../render/tokens.ts'

/** The set's dress scale: the exploration authored in world metres, so the
 *  migration bakes 1.0 (every constant below is already world-space). */
export const SET_SCALE = 1

/** The send-back token palette, verbatim from the ratified dev scene:
 *  `SET_TOKENS.bathroom` with the fill pulled deep into the aqua dominant
 *  (fix 2 — shadows bite with hue) and the background wall held under the
 *  blown line. This is where the AD's "deep tinted-aqua fill" enters. */
const _base = SET_TOKENS.bathroom
export const BATHROOM_TOKENS: SetTokens = {
  ..._base,
  fillHigh: mixHex(_base.dominant, '#FFFFFF', 0.45),
  fillLow: mixHex(darken(_base.dominant, 0.55), GLOBAL_TOKENS.cream, 0.12),
  shadowTint: mixHex(darken(_base.dominant, 0.22), GLOBAL_TOKENS.cream, 0.08),
  background: mixHex(lighten(mixHex(_base.dominant, GLOBAL_TOKENS.cream, 0.55), 0.18), _base.dominant, 0.35),
}

/** The floor the set is dressed on: the tile-over-ground disc the canonical
 *  cameras read as endless. The bounds every socket and hazard must live
 *  inside. */
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

/** Surface colors (the send-back-adjusted bases: fix 1 pulled them ~8-10 %
 *  darker than round 1; keep them — the AD's exposure bars were measured
 *  against these). */
export const SURFACES = {
  tile: '#DCEAE6',
  grout: '#9DBDBA',
  wall: '#C8DBD8',
  porcelain: '#E3E8DF',
  /** The checker accent: a NEAR-TILE tint (fix 3 — the saturated cyan
   *  squares that read as stickers are gone; the wet hazard is FILM). */
  tileAccent: mixHex('#DCEAE6', _base.dominant, 0.22),
  /** Sunlit window pane: the brightest region, not blown (fix 1). */
  pane: '#D8EAF4',
  paneDiffuse: 1.15,
  /** Grout carries its own diffuse (fix 2: earn darks in the tile lines). */
  groutDiffuse: 0.5,
  /** The drain shaft/depth: tinted darks, never warm near-black (fix 2). */
  drainShaft: '#1F3E44',
  drainDepth: '#16303A',
} as const

/** Material-level tunes the ratified variant entered per material CALL
 *  (glaze sheen, fill gain, grout diffuse) — the class ramps are untouched
 *  (header). The scene-side halves of fixes 4/5 (the 4096 shadow map, the
 *  ±0.7 m frustum, the track's non-self-casting rails) belong to the rig/
 *  staging scene and are in `KEYLIGHT` or the session log. */
export const MATERIAL_TUNES = {
  ceramicSpecular: { size: 0.5, strength: 0.16 },
  tileSpecular: { size: 0.5, strength: 0.26 },
  porcelainSpecular: { size: 0.5, strength: 0.22 },
  fillStrengthCeramic: 0.16,
  fillStrengthWood: 0.14,
} as const

/** Recommended `createLightingRig` options for bathroom staging scenes —
 *  the ratified dev key expressed as rig dials (the rig owns the key since
 *  the garden pass; a staging scene that skips these gets the warm stock
 *  key and the wash comes back). */
export const KEYLIGHT = {
  keyColor: '#DDE9F6',
  keyIntensity: 1.22,
  keyPosition: [-0.85, 0.85, 0.7] as const,
  shadowMapSize: 4096,
  shadowExtent: 0.7,
  shadowRadius: 1,
  /** The dev scene's bias pair for the tightened frustum. */
  shadowBias: -0.0012,
} as const

/** The tile grids (instanced squares over a grout plane, checker accent
 *  every third one — the ratified floor; the wall grid takes no accents). */
export const TILES = {
  floor: { n: 12, size: 0.075, accentEvery: 3, y: 0.001 },
  wall: { n: 9, size: 0.075, position: [0, 0.34, -0.44] as const },
  backWall: { z: -0.45 },
  window: { position: [-0.26, 0.4, -0.44] as const },
} as const

/** The clawfoot-free bathtub — the anchor. Straight outer wall (a flared
 *  bowl silhouette reads "cereal"), water at 0.6 of the rim, a rolled
 *  towel over the rim, and the duck FLOATING in the water (the scale joke:
 *  a yellow airship over the focus band). */
export const TUB = {
  position: [-0.155, 0, -0.06] as const,
  /** Lathe profile extents (world metres): radius, height, wall, z-squash. */
  radius: 0.085,
  height: 0.095,
  wall: 0.007,
  zScale: 1.9,
  waterLevel: 0.6,
  duck: { position: [-0.155, 0.052, -0.04] as const, yaw: 0.7 },
  rimTowel: { position: [0.01, 0.103, -0.148] as const },
} as const

/** The drain: chrome ring, tinted shaft, grate bars — the tunnel mouth the
 *  straight line ends in (Concept.md). Floor-mounted, off the lane. */
export const DRAIN = {
  position: [0.065, 0, -0.295] as const,
  ringRadius: 0.021,
} as const

/** The toothbrush propped against the wall — the 20 cm ladder nobody
 *  climbs. */
export const TOOTHBRUSH = {
  position: [0.235, 0.082, -0.33] as const,
  rotation: [0, -0.45, 1.12] as const,
  hex: '#4FB3A9',
} as const

/** The soap dish on the tile. POSITION DATA MOVE (documented, with the
 *  towel stack): the dev pose (z 0.12) sat beside the DEV track; under the
 *  production lane it would edge into the corridor guard boxes. It now
 *  rests behind the lane, same prop, same story. */
export const SOAPDISH = {
  position: [0.2, 0.003, -0.24] as const,
  soapHex: '#E9A9B8',
} as const

/** The folded towel stack. POSITION DATA MOVE (documented, the port's
 *  only one): the dev scene sat it at (-0.05, 0.23), which was beside the
 *  DEV track the room was dressed around; production mounts the set UNDER
 *  a straight +x lane, and that pose straddles the corridor guard boxes.
 *  It now rests left of the tub at the same height — same prop, same
 *  story, off the lane. */
export const TOWELS = {
  position: [-0.32, 0.003, -0.1] as const,
  yaw: 0.4,
  width: 0.085,
} as const

/** The wet-patch FILMS — the ratified fix-3 pair: stainDecal wetPatch
 *  films (tile base tone, soft SDF edge, Fresnel sheen, lifted ABOVE the
 *  tile tops) on open sunlit tile beside the drip line and the tunnel
 *  mouth. They are DECORATION at set space; a level's live grip zone is
 *  level data derived from its own build (the kitchen04 convention), and
 *  the ask to line a film up with a zone centre across a mounted set is
 *  ask #6 (lane-crossing wetPatch anchor) in [[Concepts/Levels]]. */
export const DRIPS = {
  lift: 0.0045,
  color: mixHex('#DCEAE6', _base.dominant, 0.55),
  opacity: 0.45,
  sheen: 1,
  /** The film's fill pair, lifted near-white: the film's fill-only shading
   *  lands within the ±25-luma band of the LIT tile it lies on (fix 3). */
  fillLift: 2.2,
  rows: [
    { position: [0.085, 0.035] as const, size: 0.1 },
    { position: [0.105, -0.075] as const, size: 0.03 },
  ],
} as const

/** The ratified variant places NO named prop socket (the drain is a tunnel
 *  MOUTH story, not a bore a piece can seat in — no tunnel piece exists,
 *  and the kitchen-tap convention says a plain anchor marks, nothing
 *  snaps). The field exists for the SetInstance surface. */
export const SOCKETS = {} as const

/** The set declares its wet-patch FILMS as decoration (`DRIPS`); live grip
 *  zones are level data (kitchen04 convention). Empty and typed for the
 *  SetInstance surface. */
export const HAZARDS = {} as const

/** Decorative staging only — the one straight run the exploration threaded
 *  through variant A and where its hero car sits for the stills. NOT
 *  sockets; levels never import these. */
export const STAGING = {
  trackRuns: [
    {
      a: [0.0, 0.003, 0.34] as const,
      b: [0.04, 0.003, -0.265] as const,
    },
  ],
  /** The still's car: parameter on run 0 (the exploration's hero read). */
  car: { run: 0, t: 0.55 },
} as const

/** The bathroom's canonical rigs (program T1.3 — design evaluation §1/§7 #7:
 *  “the bathroom has no production still scene and NO rig row at all (it
 *  rides the provisional kitchen fallback) … a `bathroom-set` still scene +
 *  a SET_SHOTS rig row (the other five rooms have them)”. The garden/porch
 *  pattern: the numbers live with the SET and `dev/cameras.ts` copies the
 *  row through.
 *  - `establishing` copies the PROVISIONAL kitchen numbers VERBATIM (the
 *    garage/porch precedent: the row the bathroom previously rode through
 *    as the fallback keeps rendering byte-identically; only moved rows
 *    change).
 *  - `hero` is the cathedral money shot the exploration tiles were: the
 *    tub + floating duck + the tile grid receding to the window wall, the
 *    checkered floor seams in the lower third.
 *  - `floor` obeys the studio floor-rig law (35 mm over the flush deck —
 *    here the deck rides at 0.003, so the eye lives at 0.038) looking up
 *    the STAGING lane into the tile island, the car in the focus band. */
export const CAMERAS = {
  establishing: { position: [0.62, 0.42, 0.78], target: [0, 0.05, 0], fov: 35, near: 0.01, far: 12 },
  hero: { position: [0.28, 0.18, 0.34], target: [-0.03, 0.05, -0.08], fov: 35, near: 0.01, far: 12 },
  floor: { position: [0.05, 0.038, 0.2], target: [0.01, 0.028, -0.08], fov: 35, near: 0.005, far: 12 },
} as const
