/**
 * The garage set as DATA — the bathroom minimal-port pattern applied by the
 * Environment Artist (stage 4): the RATIFIED variant C (epoxy sparkle,
 * door-gap sunblade, bike-wheel tunnel), 12/13 at both exploration cameras
 * per `docs/vault/Reference/Review 2026-10-08 Stage 4 garage.md`, migrated
 * out of the throwaway exploration `src/dev/scenes/garage.ts` (garage-c)
 * with the geometry VERBATIM and every number below traceable to the dev
 * C-branch line it came from. Variants A (light alternate) and B (parked
 * mezzanine) stay in the dev scene; B's two ported beats — the under-bench
 * witness car and the dropped bench top — are already in C's ratified
 * geometry (round-2 fixes 1/2).
 *
 * What the port keeps (the AD's must-not-lose clauses, all measured in the
 * ratified pixels): the EARNED TINTED DARKS — C is the darkest room in the
 * house (hero-c 10.05 % / close-c 17.9 % sub-60, zero blackish), and every
 * dial below that could lift them (fill gain, shadow dither, the flake
 * confinement) is ported at the ratified value; the BIKE-WHEEL TUNNEL read
 * (stood up dead-centre on the straight, capped shaft behind it); the ONE
 * TOOL CAST ASIDE (the steel wrench on the dropped bench top); the HANGING
 * BULB PRACTICAL (bulb geometry + warm bounce disc — the first non-
 * directional practical story in a ratified set).
 *
 * The three non-blocking carry-forwards from the AD's final verdict are
 * PAID here, at data level, and only here (header note in ./index.ts):
 * - note 1 (bulb at hero): the hang MOVED from (-0.05, 0.145, -0.24) to
 *   BULB.position below and the bounce disc is enlarged 0.075 → 0.09. At
 *   the hero rig the bulb now projects at ~(682, 61) px against the wheel
 *   ring spanning x 708–1265 with the hub at (946, 136): it clears the
 *   ring's left edge in BOTH rigs instead of triangulating onto the hub.
 * - note 2 (blade as ribbon): a wide low-chroma FEATHER underlay softens
 *   the strip's sides, the run's color is mixed a notch toward neutral,
 *   and a short BRIDGE segment between the wash and the run kills the
 *   single hard brightness STEP at the segment seam.
 * - note 3 (stain film, take two): opacity softened 0.5 → 0.45 (and the
 *   drips 0.55 → 0.48) with size grown 0.055 → 0.062 so the perimeter
 *   gradient is proportionally wider, and a GENTLE fill lift (white×1.35,
 *   half of the bathroom's 2.2 the round-2 probe rejected at full value)
 *   carries the Fresnel streak over the 240 bar instead of the base tone.
 *
 * The ramp CLASSES are untouched (stage-3 decision 5): this file and
 * ./index.ts pass per-material tunes only, exactly like the kitchen's bowl
 * entry. The set contains no lights, no cars and no track: the rig is
 * `src/render/lighting.ts` — INDOOR regime, no sky (the garden's outdoor
 * sun/sky substitution does not apply to a garage; the "sun" here is a
 * lie-strip and the key is the roller-door gap) — and the `KEYLIGHT` row
 * below is the ratified dev C key expressed as rig options. The cars and
 * the one staging run belong to the staging scene
 * (`src/dev/scenes/garage-set.ts`), which is where the stills are made.
 *
 * Scale discipline unchanged: set space == world space at 1:64; the orange
 * track constant rides the global tokens and is never re-hued.
 */
import { GLOBAL_TOKENS, SET_TOKENS, darken, lighten, mixHex } from '../../render/tokens.ts'
import type { SetTokens } from '../../render/tokens.ts'

/** The set's dress scale: the exploration authored in world metres, so the
 *  migration bakes 1.0 (every constant below is already world-space). */
export const SET_SCALE = 1

/**
 * The RATIFIED variant-C palette — `tokensFor('#5F6A41', '#C13E2C')` from
 * the dev scene, ported verbatim. The dev `light(hex, amt)` helper is
 * arithmetically `lighten` from `src/render/tokens.ts` (same HSL shift:
 * s −amt·0.35, l +amt), so this derivation is byte-identical to the
 * exploration's; it lives HERE because the registry reads tokens from the
 * registration row, not from a scene (bathroom pattern).
 * Resolves to: dominant #5F6A41 resin olive, fillHigh a milky sage, fillLow
 * a deep cream-cut olive shadow floor, shadowTint the AD's earned-tint
 * clause in one hex, background a lifted sage paper.
 */
const C_DOMINANT = '#5F6A41'
const C_ACCENT = SET_TOKENS.garage.accent // #C13E2C — the token red, unchanged
const light = (hex: string, amt: number): string => lighten(hex, amt)

export const GARAGE_TOKENS: SetTokens = {
  name: 'garage',
  dominant: C_DOMINANT,
  accent: C_ACCENT,
  fillHigh: light(C_DOMINANT, 0.3),
  fillLow: mixHex(darken(C_DOMINANT, 0.42), GLOBAL_TOKENS.cream, 0.25),
  shadowTint: mixHex(light(C_DOMINANT, 0.08), GLOBAL_TOKENS.cream, 0.3),
  ground: mixHex(GLOBAL_TOKENS.cream, C_DOMINANT, 0.3),
  background: light(mixHex(C_DOMINANT, GLOBAL_TOKENS.cream, 0.55), 0.18),
  track: GLOBAL_TOKENS.trackOrange,
}

/** The floor the set is dressed on: the beyond-slab ground disc (the dev
 *  scene's r-1.4 circle). The bounds every socket and hazard must live
 *  inside; the epoxy slab itself is a 1.0 m square inside it. */
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

/** Surface colors — the ratified C-branch skin tones verbatim (the door's
 *  panel tone and the wall tone were both PULLED DOWN to the room's own
 *  shade in round 2 because at the plain skin tone they clamped the ramp
 *  into isolated specks; keep them). */
export const SURFACES = {
  concrete: '#6E7541', // poured epoxy slab (the dev variant concreteHex, NOT the token dominant)
  wall: '#B5AE8B', // back wall, C's 0.85-diffuse shade tone
  bench: '#7E6140', // workbench wood
  steel: '#C4BEB2', // chrome, kept warm per the never-grey rule
  tire: '#4A3A2C',
  cord: '#4A3F30',
  bulbDead: '#ACA596', // the practical hangs UNLIT — the bounce disc is its light
  tunnel: '#2C2318',
  tunnelCap: '#241C12',
  doorPanel: '#C6BC9C',
  doorSlit: '#EFF5FF',
  slitDiffuse: 1.5,
  pegboard: '#BFAF8C',
  cardboard: '#C9A063',
  cardboardFold: '#B0824A',
  can: '#B9A7D6',
  bucketTipped: '#A08E72',
  rag: '#8A8A60',
  carHero: '#CC79A7', // Okabe-Ito pink — the studio's C hero car
  carWitness: '#0072BD',
  carStripe: '#F6E9D2',
  /** Epoxy specular: the round-2 value (0.8 grazed the wall foot, 0.58
   *  mirrored the corridor into specks — 0.62/0.32 is what was ratified). */
  slabSpecular: { size: 0.62, strength: 0.32 },
} as const

/**
 * Recommended `createLightingRig` options for garage staging scenes — the
 * ratified dev C key as rig dials (INSTRUMENTED INDOOR regime: a cool key
 * through the roller-door gap, NOT the garden's sky regime; the rig owns
 * the key since the garden pass and a staging scene that skips these
 * gets the warm stock key and the wash comes back). `shadowBias` is not a
 * rig dial (the rig ships −0.0002); the staging scene assigns
 * `rig.key.shadow.bias = KEYLIGHT.shadowBias` with the bias pair the
 * ratified frustum was rendered with — same convention the bathroom's
 * KEYLIGHT row declares.
 */
export const KEYLIGHT = {
  keyColor: '#E9F1FF',
  keyIntensity: 1.62,
  keyPosition: [1.05, 0.7, -0.85] as const,
  shadowMapSize: 2048,
  shadowExtent: 1.6,
  shadowRadius: 4,
  /** The dev C sun's bias pair for the widened frustum. */
  shadowBias: -0.0004,
  /** Variant C's shade legibility gain — the blade must win, so it runs
   *  BELOW the rig default (0.32). This is the dial that earns the room's
   *  darkest-in-the-house darks; do not lift it. */
  fillStrength: 0.28,
} as const

/** Material-level tunes the ratified variant entered per material CALL.
 *  `shadowDither: 0` on every ToonMaterial is round-2 fix 3's global half:
 *  the shadow-boundary ramp dither threw 242–252 staircase specks on the
 *  shaded epoxy (the open TA-1 fringe) — the flake layer carries the
 *  sparkle read instead. */
export const MATERIAL_TUNES = {
  shadowDither: 0,
  paintToy: 0.5,
  steelToy: 0.4,
  woodGrain: 0.5,
  woodGrainScale: 0.6,
} as const

/** The sun-blade corridor axis, module-level so the flakes, the glints and
 *  the strip scatter along the SAME line the light lies on (dev verbatim). */
export const BLADE_A: readonly [number, number] = [0.31, -0.42]
export const BLADE_B: readonly [number, number] = [-0.24, 0.05]
/** Where the dim wash hands over to the bright run (dev: 30 % along). */
export const BLADE_SPLIT = 0.3

/** The blade as the AD's carry-forward note 2 asks to see it: a RIBBON of
 *  light, not a track of orange-lit steps. Four strips, longest-first in
 *  draw order (see ./index.ts for the y-stack): the feather softens the
 *  SIDES, the neutral mix drops the CHROMA a notch, the bridge kills the
 *  STEP at the wash/run seam. */
export const BLADE = {
  width: 0.075,
  featherWidth: 0.14,
  /** y-stack: feather under everything, run under bridge under wash. */
  y: { feather: 0.0026, run: 0.0027, bridge: 0.0028, wash: 0.0029 },
  wash: { from: 0, to: BLADE_SPLIT, diffuse: 0.62, color: mixHex(SURFACES.concrete, '#F1F6FF', 0.4) },
  bridge: { from: 0.24, to: 0.4, diffuse: 1.3, color: '#F1F6FF' },
  run: { from: BLADE_SPLIT, to: 1, diffuse: 2.5, color: mixHex('#F1F6FF', '#FFFFFF', 0.1) },
  feather: { diffuse: 0.5, color: mixHex(SURFACES.concrete, '#F1F6FF', 0.18) },
} as const

/** Epoxy metallic flakes: 240 halved-size quads CONFINED to the corridor
 *  (round-2 fix 3) — they fire where the blade lands, not as pale dots. */
export const FLAKES = {
  count: 240,
  seed: 7002,
  radius: 0.0009,
  y: 0.0026,
  tStart: 0.02,
  tSpan: 0.96,
  lateral: 0.115,
  color: mixHex(SURFACES.concrete, SURFACES.steel, 0.35),
  diffuseStrength: 0.72,
} as const

/** Sparse glint quads inside the corridor's SHARP middle third only. */
export const GLINTS = {
  count: 30,
  seed: 7006,
  radius: 0.0026,
  y: 0.0036,
  tStart: 0.42,
  tSpan: 0.3,
  color: mixHex(SURFACES.concrete, '#F4F8FF', 0.5),
  diffuseStrength: 0.55,
} as const

/** The workbench — furniture now, not architecture: the top DROPPED to
 *  table height (studio round-2 note 1) so the close rig takes in its
 *  front edge, the full leg run and a strip of grained top. */
export const WORKBENCH = {
  position: [-0.24, 0, -0.26] as const,
  topY: 0.185,
  top: { w: 0.46, h: 0.03, d: 0.22 },
  legs: [
    [-0.2, -0.082],
    [0.2, -0.082],
    [-0.2, 0.082],
    [0.2, 0.082],
  ] as const,
  legSize: 0.03,
  rail: { y: 0.185 + 0.047, z: -0.104 },
} as const

/** The ONE tool cast aside — steel, deliberately not red (C spends its
 *  accent twice only: toolbox and nothing else since the hung driver's
 *  handle went steel). */
export const BENCH_TOOL = {
  position: [-0.2, 0.2025, -0.31] as const,
  yaw: 0.55,
} as const

/** The pegboard tool wall at 0.44 m — the AD-2 ticket's exhibit A: it pays
 *  NOTHING at either camera and is kept for set completeness only. The
 *  hung screwdriver's handle is STEEL (fix 1: the accent lives in the
 *  band, not above it). */
export const TOOL_WALL = {
  position: [-0.24, 0.44, -0.44] as const,
  driverHandle: SURFACES.steel,
} as const

/** The bench-top "someone was here" can. */
export const CAN = { position: [-0.16, 0.2, -0.24] as const }

/** The toolbox — the token red INSIDE the focus band (fix 1), parked on
 *  the straight just clear of the blade's band-line, its chrome dimmed so
 *  the bail stops throwing a ≥240 dash over its own red. */
export const TOOLBOX = {
  position: [0.065, 0.004, -0.09] as const,
  paint: { toy: 0.28, specular: { size: 0.5, strength: 0.18 } },
  rimCap: 0.3,
  specCap: 0.25,
} as const

/** The loose red-handled driver, laid on its side beside the straight. */
export const LOOSE_DRIVER = {
  position: [0.03, 0.011, -0.13] as const,
  yaw: 0.6,
  toy: 0.3,
  rimCap: 0.3,
  specCap: 0.25,
} as const

/** The low roller door — the blade's lie. Its slats come down off the
 *  ramp knee at C's key (round-2 note 3, dev verbatim). */
export const DOOR = {
  position: [0.31, 0, -0.442] as const,
  panelDiffuse: 0.8,
  slitDiffuse: 1.0,
} as const

/** The hanging bulb PRACTICAL (studio note 2 + AD carry-forward 1): hung
 *  clear of the wheel's projected ring at BOTH rigs, with an enlarged
 *  honest-bounce disc under it. The bulb is UNLIT geometry; the disc is
 *  the light story (clearly dimmer than the blade — the room has one key). */
export const BULB = {
  position: [-0.12, 0.185, -0.255] as const,
  roll: 0.04,
  cordLen: 0.3,
  /** The dev hang, kept on the record: (-0.05, 0.145, -0.24) projected
   *  onto the wheel hub at the hero rig (the AD's WEAK gating item). */
  devPosition: [-0.05, 0.145, -0.24] as const,
  bounce: { radius: 0.09, color: mixHex(SURFACES.concrete, '#F4DBA8', 0.26), diffuse: 1.12, specularStrength: 0.1, y: 0.0019 },
} as const

/** The bike-wheel TUNNEL — the ratified goal line, stood up dead-centre on
 *  the straight. The wire parts are dimmed (round-2 note 3: the full-
 *  chrome ring and 0.9 mm spokes threw isolated ≥240 dashes once the
 *  wheel sat sharp in the floor rig's band); the tire keeps its cloth
 *  matte and the hub its normal steel. */
export const WHEEL = {
  position: [0.045, 0.14, -0.283] as const,
  radius: 0.15,
  wireDim: { rim: 0.2, spec: 0.1, diffuse: 0.6, colorScale: 0.72 },
  shaft: { position: [0.045, 0.02, -0.36] as const, radius: 0.034, depth: 0.16 },
  cap: { position: [0.045, 0.02, -0.4395] as const, radius: 0.036 },
} as const

/** The oil stain as a FILM at the blade's dark edge (AD carry-forward 3,
 *  take two): the wet-patch treatment with a SOFTER perimeter (lower
 *  opacity, wider gradient) and a gentle fill lift that carries the
 *  Fresnel STREAK over the 240 bar — never the bathroom's white×2.2 pair,
 *  which the round-2 probe saw as pure-white puddle fill. */
export const STAIN = {
  filmTone: mixHex(SURFACES.concrete, '#2A2418', 0.28),
  position: [-0.09, -0.14] as const,
  size: 0.062,
  opacity: 0.45,
  sheen: 1,
  lift: 0.0042,
  fillLift: 1.35,
  drips: [
    { position: [-0.02, -0.19] as const, size: 0.011, opacity: 0.48 },
    { position: [-0.15, -0.11] as const, size: 0.009, opacity: 0.48 },
  ],
} as const

/** The tipped bucket + its lid, the cardboard, the rag and the nail spill
 *  (dev poses verbatim; the spill's ten pins stop mirroring the sun —
 *  round-2 note 3, the probe's true culprit). */
export const PROPS = {
  bucket: { position: [-0.17, 0.04, 0.14] as const, rollZ: Math.PI / 2 - 0.15, yawY: -Math.PI / 2, paintSpec: { size: 0.5, strength: 0.22 }, rimCap: 0.35 },
  lid: { position: [-0.1, 0.004, 0.18] as const, roll: 0.8, radius: 0.044 },
  cardboard: { size: [0.12, 0.06, 0.1] as const, position: [-0.3, 0.004, 0.2] as const, yaw: 0.2 },
  rag: { position: [0.12, 0.006, -0.08] as const },
  nails: { center: [0.22, 0.1] as const, count: 10, seed: 7103, dim: { rim: 0.2, spec: 0.12, diffuse: 0.6 } },
} as const

/** The shell: the beyond-slab ground and the one back wall (never guard
 *  solids — they live outside the `dress` group). */
export const SHELL = {
  ground: { radius: 1.4, diffuseGrain: 0.1, grainScale: 0.25, darken: 0.16 },
  wall: { position: [0, 1.6, -0.45] as const, diffuseStrength: 0.85, grain: 0.04, grainScale: 0.1 },
} as const

/** The ratified variant places NO named prop socket — the wheel tunnel is
 *  a goal-line STORY, not a bore a piece can seat in (no tunnel piece
 *  exists; the bathroom drain convention). The field exists for the
 *  SetInstance surface. */
export const SOCKETS = {} as const

/** The stain FILMS are decoration at set space; live grip zones are level
 *  data (kitchen04/bathroom convention). Empty and typed. */
export const HAZARDS = {} as const

/** Decorative staging only — the one straight the exploration threaded
 *  down the room and where its hero car sits for the stills. NOT sockets;
 *  levels never import these (there are no garage levels yet). */
export const STAGING = {
  trackRuns: [
    {
      a: [0.0, 0.003, 0.34] as const,
      b: [0.045, 0.003, -0.27] as const,
    },
  ],
  /** The hero car's still pose: parameter on run 0 (dev placeCar t). */
  car: { run: 0, t: 0.64, y: 0.0126 },
  /** The witness, parked under the bench (fix 2 — the one car in the band
   *  is the hero; the witness sits in shade behind the legs). */
  witness: { position: [-0.4, 0.0126, -0.24] as const, lookAt: [-0.44, 0.0126, -0.4] as const },
  /** The tilt-shift focus point (dev note 3: the band centres on the
   *  corridor itself, not on the hero car). */
  focus: [0.02, 0.02, -0.3] as const,
} as const
