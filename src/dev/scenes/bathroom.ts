// Stage 4 exploration — Environment Artist, bathroom set, three variants.
// "A real house's bathroom at 1:64": the room is built at house scale (tile
// grid, wall, drain), the car is the 4.6 cm toy, so every everyday object is
// terrain. Same toon engine and material classes as the kitchen, deliberately
// NOT its palette strategy: the kitchen is one warm sun-key with a mint accent
// resting on gold; these three rooms each hang their accent somewhere else
// (in shade, in a bulb row, in a puddle) and two of them run cool, which the
// art bible allows when the set's story says so.
//
//   bath-a — porcelain cathedral: tile grid + clawfoot tub, cool north window
//   bath-b — the warm bathmat: plank floor + pedestal sink under a bulb row
//   bath-c — glass shower wall: big cool tile, tub behind a glass panel
//
// Each variant shows: floor + one wall + anchor prop (tub or sink), the three
// giant everyday props (rubber duck, toothbrush, soap dish), a straight toy
// track riding through, and the drain as a tunnel mouth. Static, fixed clock.

import * as THREE from 'three'
import { ceramic, dieCastPaint, fabric, glass, liquid, paintedWood, trackPlastic } from '../../render/materials.ts'
import { toyBlock, trackChannel } from '../../render/geometry.ts'
import { GLOBAL_TOKENS, SET_TOKENS, darken, lighten, mixHex, type SetTokens } from '../../render/tokens.ts'
import { ToonMaterial, type ToonMaterialParams } from '../../render/toon-material.ts'
import { stainDecal } from '../../render/film.ts'
import { registerScene, type SceneEntry, type SceneFactory } from '../registry.ts'

type Variant = 'a' | 'b' | 'c'

// ---- palettes ---------------------------------------------------------
// Mirrors tokens.ts derive() math (that function is private to the tokens
// file; these variants are temperatures OF the bathroom seed, exploration-
// local until one wins). A is the token palette itself, untouched.
function tokensFor(dominant: string, accent: string): SetTokens {
  const light = (hex: string, amt: number) => {
    // lighten = shift toward white with a sat haircut; tokens.ts math via
    // shiftHex is imported indirectly through mixHex/darken only — mirror it
    const c = new THREE.Color(hex)
    const hsl = { h: 0, s: 0, l: 0 }
    c.getHSL(hsl)
    c.setHSL(hsl.h, Math.max(0, hsl.s - amt * 0.35), Math.min(1, hsl.l + amt))
    return `#${c.getHexString()}`
  }
  return {
    name: 'bathroom',
    dominant,
    accent,
    fillHigh: light(dominant, 0.3),
    fillLow: mixHex(darken(dominant, 0.42), GLOBAL_TOKENS.cream, 0.25),
    shadowTint: mixHex(light(dominant, 0.08), GLOBAL_TOKENS.cream, 0.3),
    ground: mixHex(GLOBAL_TOKENS.cream, dominant, 0.3),
    background: light(mixHex(dominant, GLOBAL_TOKENS.cream, 0.55), 0.18),
    track: GLOBAL_TOKENS.trackOrange,
  }
}

interface VariantSpec {
  tokens: SetTokens
  keyColor: string
  keyIntensity: number
  keyPos: [number, number, number]
  carHex: string
  tileHex: string
  groutHex: string
  wallHex: string
  porcelain: string
  /**
   * Stage-4 send-back (2026-10-08 review, fixes 1/2/4/5), variant A only —
   * when set these overrides ride the floor/wall/tub ceramics and the track
   * run: the ratified stage-3 ceramic exposure (third band pushed to a high
   * threshold so full brightness only lands on truly key-facing walls), a
   * deeper fill so shadows tint and bite, and shadowDither 0 — the scene-side
   * half of ticket TA-1, the ramp/shadow dither speckle on grazing faces
   * (tub flank, track side walls). Undefined for B/C: they render exactly
   * as committed.
   */
  ceramicTune?: Partial<ToonMaterialParams>
  woodTune?: Partial<ToonMaterialParams>
  trackTune?: Partial<ToonMaterialParams>
  /** Grout gets its own diffuseStrength (fix 2: earn darks in the tile lines). */
  groutDiffuse?: number
  /** Cool drain shaft (fix 2: tinted darks, never warm near-black). */
  drainHexes?: [string, string]
  /** Sunlit window pane tone/exposure (fix 1: brightest region, not blown). */
  paneHex?: string
  paneDiffuse?: number
}

// A's token palette, send-back-adjusted (fix 2): fill pulled deep into the
// aqua dominant so shadows bite with hue, and the flat background wall held
// under the blown line — the porcelain-cathedral wash was the background and
// the wall as much as the ceramic.
const A_TOKENS: SetTokens = (() => {
  const base = SET_TOKENS.bathroom
  return {
    ...base,
    fillHigh: mixHex(base.dominant, '#FFFFFF', 0.45),
    fillLow: mixHex(darken(base.dominant, 0.55), GLOBAL_TOKENS.cream, 0.12),
    shadowTint: mixHex(darken(base.dominant, 0.22), GLOBAL_TOKENS.cream, 0.08),
    background: mixHex(lighten(mixHex(base.dominant, GLOBAL_TOKENS.cream, 0.55), 0.18), base.dominant, 0.35),
  }
})()

const A_CERAMIC: Partial<ToonMaterialParams> = {
  ramp: { steps: [0.55, 0.78, 1.0], thresholds: [0.28, 0.72], softness: 0.06 },
  specular: { size: 0.5, strength: 0.16 },
  fillStrength: 0.16,
  shadowDither: 0,
}
const A_WOOD: Partial<ToonMaterialParams> = { fillStrength: 0.14, shadowDither: 0 }
const A_TRACK: Partial<ToonMaterialParams> = {
  ramp: { steps: [0.66, 1.0], thresholds: [0.36], softness: 0.02 },
  shadowDither: 0,
}
/** Stain-film fill pair, over-white: see the wet drips in variant A. */
const FILM_FILL = new THREE.Color('#FFFFFF').multiplyScalar(2.2)

const VARIANTS: Record<Variant, VariantSpec> = {
  // A: the token palette itself — aqua dominant, duck-yellow accent kept OUT
  // of the sun (it glows in the shaded pool water and the duck in shade).
  a: {
    // Send-back round 2 (2026-10-08): bases ~8-10 % darker (fix 1), grout and
    // drain pulled to tinted darks (fix 2). Key and hues untouched — the same
    // porcelain cathedral, just not overexposed.
    tokens: A_TOKENS,
    keyColor: '#DDE9F6',
    keyIntensity: 1.22,
    keyPos: [-0.85, 0.85, 0.7],
    carHex: '#0072BD',
    tileHex: '#DCEAE6',
    groutHex: '#9DBDBA',
    wallHex: '#C8DBD8',
    porcelain: '#E3E8DF',
    ceramicTune: A_CERAMIC,
    woodTune: A_WOOD,
    trackTune: A_TRACK,
    groutDiffuse: 0.5,
    drainHexes: ['#1F3E44', '#16303A'],
    paneHex: '#D8EAF4',
    paneDiffuse: 1.15,
  },
  // B: warm bathmat — clay-oak dominant (NOT kitchen gold: deeper, redder,
  // and lit by bulbs not sun), accent flipped COOL (teal towels) — the
  // inverse of kitchen's "warm room, cool thing".
  b: {
    tokens: tokensFor('#B27048', '#3FA6AE'),
    keyColor: '#FFD7A0',
    keyIntensity: 1.22,
    keyPos: [0.7, 0.5, 0.95],
    carHex: '#009E73',
    tileHex: '#A06B47',
    groutHex: '#74462C',
    wallHex: '#D8B78E',
    porcelain: '#EDDFC8',
  },
  // C: glass shower — the coldest read: a steel-blue dominant, the accent
  // (duck yellow) allowed ONLY in one small sunstruck prop + puddle film.
  c: {
    tokens: tokensFor('#3E93B4', '#F4C84B'),
    keyColor: '#CBE4F4',
    keyIntensity: 1.5,
    keyPos: [0.95, 0.8, 0.35],
    carHex: '#CC79A7',
    tileHex: '#CFE0E6',
    groutHex: '#9BB6C2',
    wallHex: '#C4D8E0',
    porcelain: '#EDF3F4',
  },
}

// ---- helpers ----------------------------------------------------------

function makeRng(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

function props(mesh: THREE.Object3D, cast = true, receive = true): void {
  mesh.castShadow = cast
  mesh.receiveShadow = receive
  mesh.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.castShadow = cast
      o.receiveShadow = receive
    }
  })
}

// ---- shared giant-everyday props ---------------------------------------

/** Rubber duck, terrain height ≈ a cottage (0.13 m at 1:64). The body keeps
 *  the classic duck yellow in every variant — a teal duck names nothing. */
function duck(v: VariantSpec, at: [number, number, number], yaw = 0): THREE.Group {
  const t = v.tokens
  const g = new THREE.Group()
  const rubber = dieCastPaint(t, '#F4C84B', {
    toy: 0.6,
    rim: { strength: 0.35, size: 0.2 },
    specular: { size: 0.08, strength: 0.45, color: '#FFFDF6' },
  })
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.05, 20, 14), rubber)
  body.scale.set(1.2, 0.88, 1)
  body.position.y = 0.044
  props(body)
  g.add(body)
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.027, 16, 12), rubber)
  head.position.set(0.05, 0.078, 0)
  props(head)
  g.add(head)
  const beak = new THREE.Mesh(
    new THREE.ConeGeometry(0.011, 0.024, 8),
    dieCastPaint(t, '#E08A2E', { toy: 0.5, specular: { size: 0.08, strength: 0.5 } }),
  )
  beak.position.set(0.077, 0.076, 0)
  beak.rotation.z = -Math.PI / 2
  props(beak)
  g.add(beak)
  const eye = new THREE.Mesh(new THREE.SphereGeometry(0.0045, 10, 8), fabric(t, '#33231A', {}))
  eye.position.set(0.061, 0.086, 0.015)
  g.add(eye)
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.014, 0.03, 8), rubber)
  tail.position.set(-0.068, 0.058, 0)
  tail.rotation.z = Math.PI / 2 + 0.5
  props(tail)
  g.add(tail)
  g.position.set(...at)
  g.rotation.y = yaw
  return g
}

/** Toothbrush — a felled redwood with a bristle brush-head (0.19 m). */
function toothbrush(v: VariantSpec, at: [number, number, number], rot: [number, number, number], hex = '#4FB3A9'): THREE.Group {
  const t = v.tokens
  const g = new THREE.Group()
  const handle = new THREE.Mesh(
    toyBlock(0.155, 0.009, 0.017, 0.006, 0.002),
    dieCastPaint(t, hex, { toy: 0.45 }),
  )
  props(handle)
  g.add(handle)
  const neck = new THREE.Mesh(
    toyBlock(0.045, 0.011, 0.015, 0.005, 0.002),
    dieCastPaint(t, hex, { toy: 0.45 }),
  )
  neck.position.set(0.086, 0.006, 0)
  neck.rotation.z = 0.22
  props(neck)
  g.add(neck)
  const bristles = new THREE.Mesh(
    toyBlock(0.04, 0.012, 0.014, 0.005, 0.002),
    fabric(t, '#F4EFE2', {}),
  )
  bristles.position.set(0.102, 0.017, 0)
  bristles.rotation.z = 0.22
  props(bristles)
  g.add(bristles)
  g.position.set(...at)
  g.rotation.set(...rot)
  return g
}

/** Soap dish: shallow lathe saucer + a pastel soap bar. */
function soapDish(v: VariantSpec, at: [number, number, number], soapHex = '#E9A9B8'): THREE.Group {
  const t = v.tokens
  const g = new THREE.Group()
  const mat = ceramic(t, v.porcelain, {})
  mat.side = THREE.DoubleSide
  const pts = [
    new THREE.Vector2(0.0, 0.004),
    new THREE.Vector2(0.024, 0.004),
    new THREE.Vector2(0.05, 0.009),
    new THREE.Vector2(0.058, 0.016),
    new THREE.Vector2(0.054, 0.016),
    new THREE.Vector2(0.046, 0.01),
    new THREE.Vector2(0.022, 0.006),
    new THREE.Vector2(0.0, 0.006),
  ]
  const dish = new THREE.Mesh(new THREE.LatheGeometry(pts, 36), mat)
  props(dish)
  g.add(dish)
  const soap = new THREE.Mesh(
    toyBlock(0.042, 0.02, 0.032, 0.011, 0.004),
    ceramic(t, soapHex, { toy: 0.3 }),
  )
  soap.position.set(0.002, 0.012, 0)
  soap.rotation.y = 0.3
  props(soap)
  g.add(soap)
  g.position.set(...at)
  return g
}

/** Folded towel stack. */
function towel(v: VariantSpec, hex: string, w = 0.09): THREE.Group {
  const t = v.tokens
  const g = new THREE.Group()
  const mat = fabric(t, hex, {})
  const f1 = new THREE.Mesh(toyBlock(w, 0.007, w * 0.62, 0.008, 0.002), mat)
  f1.position.y = 0.0035
  props(f1, true, true)
  g.add(f1)
  const f2 = new THREE.Mesh(toyBlock(w * 0.88, 0.006, w * 0.55, 0.008, 0.002), mat)
  f2.position.set(0.002, 0.0095, 0.001)
  f2.rotation.y = 0.18
  props(f2, true, true)
  g.add(f2)
  return g
}

/** The drain: chrome ring, dark shaft, grate bars — the tunnel mouth. */
function drain(v: VariantSpec, at: [number, number, number]): THREE.Group {
  const t = v.tokens
  const g = new THREE.Group()
  const [shaftHex, depthHex] = v.drainHexes ?? ['#33241B', '#241812']
  const chrome = dieCastPaint(t, '#C8CDD2', { rim: { strength: 1.4, size: 0.15 }, toy: 0.4 })
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.021, 0.005, 10, 32), chrome)
  ring.rotation.x = -Math.PI / 2
  ring.position.y = 0.004
  props(ring)
  g.add(ring)
  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.02, 0.07, 28, 1, true),
    fabric(t, shaftHex, { diffuseStrength: 0.4 }),
  )
  ;(shaft.material as ToonMaterial).side = THREE.DoubleSide
  shaft.position.y = -0.031
  g.add(shaft)
  const depth = new THREE.Mesh(new THREE.CircleGeometry(0.02, 24), fabric(t, depthHex, { diffuseStrength: 0.2 }))
  depth.rotation.x = -Math.PI / 2
  depth.position.y = -0.065
  g.add(depth)
  for (let i = -1; i <= 1; i++) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.0035, 0.0045), chrome)
    bar.position.set(0, 0.005, i * 0.009)
    props(bar)
    g.add(bar)
  }
  g.position.set(...at)
  return g
}

/** Clawfoot-free bathtub: ovalized lathe shell with a FLAT bottom and steep
 * walls (a cereal bowl says "breakfast"; a bath says "drain tunnel"). */
function tub(v: VariantSpec, waterHex: string, water = true): THREE.Group {
  const t = v.tokens
  const g = new THREE.Group()
  const mat = ceramic(t, v.porcelain, {
    specular: { size: 0.5, strength: 0.22 },
    // keep the CLASS ramp (three bands): a lifted-ramp porcelain shaded as
    // white-as-lit reads as a hole in the floor, not a vessel.
    shadowTint: mixHex(t.shadowTint, t.dominant, 0.28),
    ...(v.ceramicTune ?? {}),
  })
  mat.side = THREE.DoubleSide
  const R = 0.085, H = 0.095, w = 0.007
  // STRAIGHT outer wall to the floor — a flared bowl silhouette reads
  // "cereal" and floats; a bath's wall is a wall.
  const pts: THREE.Vector2[] = [
    new THREE.Vector2(0.0001, 0.004),
    new THREE.Vector2(R * 0.9, 0.004),
    new THREE.Vector2(R * 0.98, 0.007),
    new THREE.Vector2(R * 0.98, H - 0.014),
    new THREE.Vector2(R + 0.003, H + 0.001),
    new THREE.Vector2(R - w * 0.3, H + w * 0.5),
    new THREE.Vector2(R - w, H - 0.004),
    new THREE.Vector2(R * 0.9, H - 0.016),
    new THREE.Vector2(R * 0.9, 0.016),
    new THREE.Vector2(0.0001, 0.014),
  ]
  const shell = new THREE.Mesh(new THREE.LatheGeometry(pts, 52), mat)
  shell.scale.z = 1.9
  props(shell)
  g.add(shell)
  // contact-darkening disc — the lathe foot alone did not ground the tub
  const contact = new THREE.Mesh(
    new THREE.CircleGeometry(R * 1.22, 36),
    fabric(t, darken(t.shadowTint, 0.45), { opacity: 0.55, diffuseStrength: 0.1, rim: { strength: 0, size: 1 } }),
  )
  contact.rotation.x = -Math.PI / 2
  contact.scale.z = 1.9
  contact.position.y = 0.0035
  contact.castShadow = false
  contact.receiveShadow = false
  g.add(contact)
  // a rolled towel over the rim — someone's about to get in
  const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.1, 18), fabric(t, t.accent, {}))
  roll.rotation.z = Math.PI / 2
  roll.rotation.y = 0.06
  roll.position.set(0.01, H + 0.008, -0.148)
  props(roll)
  g.add(roll)
  if (water) {
    const pool = new THREE.Mesh(
      new THREE.CylinderGeometry(R - 0.012, R - 0.02, 0.003, 44),
      liquid(t, waterHex, { opacity: 0.8, liquid: 0.4 }),
    )
    pool.scale.z = 1.9
    pool.position.y = H * 0.6
    g.add(pool)
    const d = new THREE.Object3D()
    const rings = new THREE.InstancedMesh(
      new THREE.TorusGeometry(0.007, 0.0015, 6, 22),
      liquid(t, mixHex(waterHex, '#FFFFFF', 0.5), { opacity: 0.7 }),
      5,
    )
    const rnd = makeRng(6404)
    for (let i = 0; i < 5; i++) {
      const a = rnd() * Math.PI * 2
      const r = 0.012 + rnd() * 0.05
      d.position.set(Math.cos(a) * r, H * 0.6 + 0.002, Math.sin(a) * r * 1.9)
      d.rotation.set(-Math.PI / 2 + (rnd() - 0.5) * 0.3, 0, rnd() * 3)
      d.updateMatrix()
      rings.setMatrixAt(i, d.matrix)
    }
    g.add(rings)
  }
  return g
}

/** Pedestal sink: basin lathe on a column, chrome pop-up + small tap. */
function sink(v: VariantSpec): THREE.Group {
  const t = v.tokens
  const g = new THREE.Group()
  const mat = ceramic(t, v.porcelain, { specular: { size: 0.5, strength: 0.32 } })
  mat.side = THREE.DoubleSide
  const column = new THREE.Mesh(
    new THREE.CylinderGeometry(0.042, 0.048, 0.16, 28),
    ceramic(t, v.porcelain, {}),
  )
  column.position.y = 0.08
  props(column)
  g.add(column)
  const pts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.05, 0.0),
    new THREE.Vector2(0.062, 0.012),
    new THREE.Vector2(0.068, 0.042),
    new THREE.Vector2(0.062, 0.042),
    new THREE.Vector2(0.056, 0.014),
    new THREE.Vector2(0.0, 0.008),
  ]
  const basin = new THREE.Mesh(new THREE.LatheGeometry(pts, 40), mat)
  basin.position.y = 0.16
  props(basin)
  g.add(basin)
  const chrome = dieCastPaint(t, '#C8CDD2', { rim: { strength: 1.3, size: 0.15 }, toy: 0.45 })
  const riser = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.009, 0.06, 18), chrome)
  riser.position.set(0, 0.232, -0.04)
  props(riser)
  g.add(riser)
  const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.006, 0.034, 16), chrome)
  spout.position.set(0, 0.26, -0.023)
  spout.rotation.x = Math.PI / 2.6
  props(spout)
  g.add(spout)
  return g
}

/** Tile floor/wall: instanced squares over a grout plane, checker accents. */
function tiles(
  v: VariantSpec,
  opts: { n: number; size: number; accentEvery?: number; wall?: boolean; accentHex?: string },
): THREE.Group {
  const t = v.tokens
  const wall = opts.wall ?? false
  const g = new THREE.Group()
  const span = opts.n * opts.size
  const grout = new THREE.Mesh(
    new THREE.PlaneGeometry(span, span),
    paintedWood(t, v.groutHex, {
      grain: 0.12,
      grainScale: 0.3,
      diffuseStrength: 0.85,
      ...(v.woodTune ?? {}),
      ...(v.groutDiffuse !== undefined ? { diffuseStrength: v.groutDiffuse } : {}),
    }),
  )
  if (!wall) grout.rotation.x = -Math.PI / 2
  grout.receiveShadow = true
  g.add(grout)
  const geo = new THREE.BoxGeometry(opts.size - 0.004, opts.size - 0.004, 0.0025)
  if (!wall) geo.rotateX(Math.PI / 2)
  const base = new THREE.InstancedMesh(
    geo,
    ceramic(t, v.tileHex, { specular: { size: 0.5, strength: 0.26 }, ...(v.ceramicTune ?? {}) }),
    opts.n * opts.n,
  )
  base.castShadow = false
  base.receiveShadow = true
  const acc = new THREE.InstancedMesh(
    geo,
    ceramic(t, opts.accentHex ?? mixHex(t.dominant, t.background, 0.35), { ...(v.ceramicTune ?? {}) }),
    opts.n,
  )
  acc.receiveShadow = true
  const d = new THREE.Object3D()
  let bi = 0
  let ai = 0
  const every = opts.accentEvery ?? 0
  for (let i = 0; i < opts.n; i++) {
    for (let j = 0; j < opts.n; j++) {
      const a = (i - (opts.n - 1) / 2) * opts.size
      const b = (j - (opts.n - 1) / 2) * opts.size
      if (wall) d.position.set(a, b, 0.0015)
      else d.position.set(a, 0.0015, b)
      d.updateMatrix()
      base.setMatrixAt(bi++, d.matrix)
      if (every && i % every === 0 && j % every === 0 && ai < opts.n) {
        if (wall) d.position.z = 0.002
        else d.position.y = 0.0018
        d.updateMatrix()
        acc.setMatrixAt(ai++, d.matrix)
      }
      d.rotation.set(0, 0, 0)
    }
  }
  acc.count = ai
  g.add(base, acc)
  return g
}

/** Plank floor (variant B): warm boards with a board-gap plane under. */
function planks(v: VariantSpec): THREE.Group {
  const t = v.tokens
  const g = new THREE.Group()
  const under = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.4), paintedWood(t, v.groutHex, { grain: 0.2, grainScale: 0.3 }))
  under.rotation.x = -Math.PI / 2
  under.receiveShadow = true
  g.add(under)
  const w = 0.088
  for (let i = 0; i < 12; i++) {
    const plank = new THREE.Mesh(
      new THREE.BoxGeometry(1.3, 0.0035, w - 0.004),
      paintedWood(t, i % 2 ? v.tileHex : mixHex(v.tileHex, t.dominant, 0.18), { grain: 0.55, grainScale: 0.35 }),
    )
    plank.position.set(0, 0.0018, (i - 5.5) * w)
    plank.receiveShadow = true
    plank.castShadow = false
    g.add(plank)
  }
  return g
}

/** Plush bathmat: two fabric slabs with a stitched step edge. */
function bathmat(v: VariantSpec, hex: string): THREE.Group {
  const t = v.tokens
  const g = new THREE.Group()
  const mat = fabric(t, hex, { rim: { strength: 0.55, size: 0.8 } })
  const base = new THREE.Mesh(toyBlock(0.3, 0.008, 0.21, 0.02, 0.003), mat)
  base.position.y = 0.004
  props(base, false, true)
  g.add(base)
  const pile = new THREE.Mesh(toyBlock(0.27, 0.007, 0.18, 0.02, 0.003), fabric(t, mixHex(hex, '#FFFFFF', 0.16), {}))
  pile.position.set(0.002, 0.011, 0.001)
  props(pile, false, true)
  g.add(pile)
  // stitch band across the middle — the track cuts it in half in the hero
  const band = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.002, 0.19), fabric(t, mixHex(hex, t.dominant, 0.4), {}))
  band.position.set(-0.09, 0.0145, 0)
  g.add(band)
  return g
}

/** Window cue on the back wall: bright frame + mullion cross. */
function windowOnWall(v: VariantSpec, at: [number, number, number], cool = true): THREE.Group {
  const t = v.tokens
  const g = new THREE.Group()
  const pane = new THREE.Mesh(
    new THREE.PlaneGeometry(0.2, 0.26),
    paintedWood(t, v.paneHex ?? (cool ? '#EAF4FA' : '#FFEBC8'), {
      grain: 0,
      diffuseStrength: v.paneDiffuse ?? 1.5,
      specular: { strength: 0 },
    }),
  )
  g.add(pane)
  const frameMat = paintedWood(t, '#F5EFE0', { grain: 0.15 })
  const bars: Array<[number, number, number, number]> = [
    [0.21, 0.014, 0, 0.13],
    [0.21, 0.014, 0, -0.13],
    [0.014, 0.27, -0.1, 0],
    [0.014, 0.27, 0.1, 0],
    [0.01, 0.26, 0, 0],
    [0.2, 0.01, 0, 0],
  ]
  for (const [w, h, x, y] of bars) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.012), frameMat)
    bar.position.set(x, y, 0.006)
    props(bar, false, true)
    g.add(bar)
  }
  g.position.set(...at)
  return g
}

/** The car — the ratified sedan-blocky silhouette, Okabe-Ito hues only. */
function car(v: VariantSpec): THREE.Group {
  const t = v.tokens
  const g = new THREE.Group()
  const body = new THREE.Mesh(toyBlock(0.075, 0.028, 0.034, 0.01, 0.004), dieCastPaint(t, v.carHex, { toy: 0.4 }))
  props(body)
  g.add(body)
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.062, 0.004, 0.011), dieCastPaint(t, '#F6E9D2', {}))
  stripe.position.y = 0.027
  g.add(stripe)
  const wheelGeo = new THREE.CylinderGeometry(0.009, 0.009, 0.006, 18)
  wheelGeo.rotateX(Math.PI / 2)
  const wheelMat = fabric(t, '#5A4130', { rim: { strength: 0.25, size: 0.6 } })
  for (const [x, z] of [[0.024, 0.017], [-0.024, 0.017], [0.024, -0.017], [-0.024, -0.017]] as const) {
    const w = new THREE.Mesh(wheelGeo, wheelMat)
    w.position.set(x, 0.009, z)
    props(w, true, false)
    g.add(w)
  }
  g.scale.setScalar(0.62)
  return g
}

/** Straight toy-track run a→b (deck riding the floor plane y≈0.003). */
function trackRun(a: THREE.Vector3, b: THREE.Vector3, mat: THREE.Material): THREE.Mesh {
  const m = new THREE.Mesh(trackChannel(Math.max(a.distanceTo(b) - 0.008, 0.02)), mat)
  m.position.copy(a).lerp(b, 0.5)
  m.lookAt(b)
  props(m)
  return m
}

function placeCar(g: THREE.Group, from: THREE.Vector3, to: THREE.Vector3, t: number, deckY: number): void {
  g.position.lerpVectors(from, to, t)
  g.position.y = deckY
  const d = to.clone().sub(from).normalize()
  g.lookAt(g.position.x + d.x, g.position.y, g.position.z + d.z)
  g.rotateY(-Math.PI / 2)
}

// ---- scenes -----------------------------------------------------------

function bathroomScene(variant: Variant): SceneFactory {
  return (ctx): SceneEntry => {
    const v = VARIANTS[variant]
    const t = v.tokens
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(t.background)

    const key = new THREE.DirectionalLight(v.keyColor, v.keyIntensity)
    key.position.set(...v.keyPos)
    key.castShadow = true
    const shadowMapSize = variant === 'a' ? 4096 : 2048
    key.shadow.mapSize.set(shadowMapSize, shadowMapSize)
    // Fix 4/5 (scene side): the shadow frustum was ±1.2 m — 0.59 mm/texel at
    // 2048 (2.4 m span), coarser than the track's own mm-scale rail lips, so
    // the rail-cap and tub-flank shadow lines quantized to per-texel zigzags
    // that read as dither speckle. Everything that casts near the deck fits
    // ±0.7 m; at 4096 that is 0.34 mm/texel and those edges go sub-pixel.
    const sh = variant === 'a' ? 0.7 : 1.2
    key.shadow.camera.left = -sh
    key.shadow.camera.right = sh
    key.shadow.camera.top = sh
    key.shadow.camera.bottom = -sh
    key.shadow.camera.near = 0.1
    key.shadow.camera.far = 4
    key.shadow.bias = variant === 'a' ? -0.0012 : -0.0004
    key.shadow.normalBias = 0.006
    // Fix 4/5 (scene side): the speckle lives where PCF returns MID-range
    // coverage (tub-lip line on the flank, rail penumbra on the track deck) —
    // any per-pixel resolve there reads as dither. A tight radius makes the
    // tap coverage binary so edges land clean; toon wants a hard edge anyway.
    key.shadow.radius = variant === 'a' ? 1 : 4
    scene.add(key)

    // ground beyond the tiles
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(1.4, 72),
      paintedWood(t, darken(t.ground, 0.08), { grain: 0.25, grainScale: 0.25, ...(v.woodTune ?? {}) }),
    )
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    scene.add(ground)

    // the one wall
    const wall = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 4),
      paintedWood(t, v.wallHex, { grain: 0.08, grainScale: 0.2, diffuseStrength: 0.9, ...(v.woodTune ?? {}) }),
    )
    wall.position.set(0, 1.6, -0.45)
    wall.receiveShadow = true
    scene.add(wall)

    const set = new THREE.Group()
    scene.add(set)

    // the track's line: straight down the room, x drifting +0.04
    const trackA = new THREE.Vector3(0.0, 0.003, 0.34)
    const trackB = new THREE.Vector3(0.04, 0.003, -0.265)
    const trackMat = trackPlastic(t, GLOBAL_TOKENS.trackOrange, { toy: 0.2, ...(v.trackTune ?? {}) })

    // hero car on the line — the tilt-shift focus point
    const heroCar = car(v)
    placeCar(heroCar, trackA, trackB, variant === 'b' ? 0.4 : 0.55, 0.0126)
    set.add(heroCar)

    if (variant === 'a') {
      // ---- A: porcelain cathedral -------------------------------------
      // Fix 3 (send-back): the checker accent squares were a saturated flat
      // cyan that read as stickers/liquid — muted to a near-tile tint tone.
      // The wet hazard itself is now FILM (stainDecal below), not paint.
      const floor = tiles(v, { n: 12, size: 0.075, accentEvery: 3, accentHex: mixHex(v.tileHex, t.dominant, 0.22) })
      floor.position.y = 0.001
      set.add(floor)
      const wallTiles = tiles(v, { n: 9, size: 0.075, accentEvery: 0, wall: true })
      wallTiles.position.set(0, 0.34, -0.44)
      set.add(wallTiles)
      set.add(windowOnWall(v, [-0.26, 0.4, -0.44]))

      const tubA = tub(v, mixHex(t.dominant, '#FFFFFF', 0.45))
      tubA.position.set(-0.155, 0, -0.06)
      set.add(tubA)
      set.add(duck(v, [-0.155, 0.052, -0.04], 0.7)) // floating IN the bath, rings around it
      set.add(toothbrush(v, [0.235, 0.082, -0.33], [0, -0.45, 1.12], '#4FB3A9')) // propped against the wall
      set.add(soapDish(v, [0.2, 0.003, 0.12]))
      const towels = towel(v, t.dominant, 0.085)
      towels.position.set(-0.05, 0.003, 0.23)
      towels.rotation.y = 0.4
      set.add(towels)
      set.add(drain(v, [0.065, 0, -0.295]))
      // Fix 3: the wet hazard is a stain FILM — tile base tone, soft SDF
      // edge, Fresnel sheen streaks (the ratified mug-ring treatment), not a
      // flat cyan rectangle. Two drips below the tub rim and beside the
      // tunnel mouth, both on OPEN SUN LIT TILE — a film half under the
      // track slab reads as nothing, and the old saturated accent squares
      // that faked it are muted to a near-tile tone above. The fill pair is
      // lifted near-white so the film's fill-only shading lands within the
      // ±25-luma band of the LIT tile it lies on, and it lifts ABOVE the
      // tile tops (0.0038) — at the film default of 6e-4 it hid in the slab.
      const drips: Array<[number, number, number]> = [
        [0.085, 0.1, 0.035],
        [0.105, -0.075, 0.03],
      ]
      for (const [dx, dz, size] of drips) {
        const drip = stainDecal(t, {
          kind: 'wetPatch',
          color: mixHex(v.tileHex, t.dominant, 0.55),
          opacity: 0.45,
          size,
          sheen: 1,
          lift: 0.0045,
          // boosted white fill pair: the film's fill-only shading lands on
          // the LIT tile's luma (the ±25 bar) while the Fresnel streaks ride
          // past 240 — dark-fill films sank into stickers, and plain-white
          // fills at alpha ≥ 0.45 blew the ±25 bar on the interior.
          fillHigh: FILM_FILL,
          fillLow: FILM_FILL,
        })
        drip.position.set(dx, drip.position.y, dz)
        set.add(drip)
      }
    } else if (variant === 'b') {
      // ---- B: the warm bathmat -----------------------------------------
      set.add(planks(v))
      const mat = bathmat(v, mixHex(t.accent, '#E8D9BC', 0.35))
      mat.position.set(0.13, 0.004, 0.0)
      mat.rotation.y = 0.12
      set.add(mat)

      const sinkG = sink(v)
      sinkG.position.set(-0.14, 0, -0.2)
      sinkG.rotation.y = 0.25
      set.add(sinkG)
      // the vanity bulb row (geometry, not lights — one key only)
      const bulbMat = ceramic(t, '#F3DFA8', { toy: 0.45, specular: { size: 0.3, strength: 0.25 } })
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.012, 0.014), dieCastPaint(t, '#B98A55', { toy: 0.4 }))
      bar.position.set(-0.14, 0.42, -0.42)
      props(bar)
      set.add(bar)
      for (let i = 0; i < 4; i++) {
        const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.013, 12, 10), bulbMat)
        bulb.position.set(-0.14 + (i - 1.5) * 0.048, 0.405, -0.415)
        props(bulb)
        set.add(bulb)
      }
      const mirror = new THREE.Mesh(
        new THREE.PlaneGeometry(0.13, 0.16),
        glass(t, '#D9E9E6', { opacity: 0.5, diffuseStrength: 0.5, specular: { size: 0.04, strength: 1.6 } }),
      )
      mirror.position.set(-0.14, 0.3, -0.44)
      set.add(mirror)

      set.add(duck(v, [0.17, 0.019, 0.07], 3.0)) // sitting on the bathmat, facing the car
      set.add(toothbrush(v, [-0.095, 0.068, -0.245], [0, 0.55, 1.02], '#D96B8A')) // propped against the sink column
      set.add(soapDish(v, [-0.19, 0.2, -0.185], '#F0C77A')) // on the basin rim, mid-story
      const stack = towel(v, t.accent, 0.08)
      stack.position.set(0.21, 0.004, -0.16)
      stack.rotation.y = -0.3
      set.add(stack)
      // cotton ball — the lived-in speck
      const ball = new THREE.Mesh(new THREE.IcosahedronGeometry(0.011, 1), fabric(t, '#D8C3A2', { diffuseStrength: 0.7 }))
      ball.position.set(0.075, 0.011, 0.16)
      props(ball)
      set.add(ball)
      set.add(drain(v, [0.075, 0, -0.3]))
    } else {
      // ---- C: glass shower wall -----------------------------------------
      const floor = tiles(v, { n: 8, size: 0.11, accentEvery: 0, accentHex: mixHex(v.tileHex, t.dominant, 0.2) })
      floor.position.y = 0.001
      set.add(floor)

      const tubC = tub(v, mixHex(t.dominant, '#FFFFFF', 0.55))
      tubC.position.set(-0.09, 0, -0.13)
      set.add(tubC)

      // the glass wall: ONE clear pane on chrome posts — the transparent
      // plane the other two variants do not have, framing the wet half
      const pane = new THREE.Mesh(
        new THREE.PlaneGeometry(0.34, 0.3),
        glass(t, '#A8D4E4', { opacity: 0.48, specular: { size: 0.05, strength: 1.5 } }),
      )
      ;(pane.material as ToonMaterial).side = THREE.DoubleSide
      pane.position.set(-0.09, 0.19, -0.16)
      set.add(pane)
      const railMat = dieCastPaint(t, '#C4CACF', { rim: { strength: 1.3, size: 0.15 }, toy: 0.4 })
      const topRail = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.35, 14), railMat)
      topRail.rotation.z = Math.PI / 2
      topRail.position.set(-0.09, 0.34, -0.16)
      props(topRail)
      set.add(topRail)
      for (const px of [-0.258, 0.078]) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.31, 12), railMat)
        post.position.set(px, 0.185, -0.16)
        props(post)
        set.add(post)
      }
      // shower riser + head behind the glass
      const riser = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.3, 16), railMat)
      riser.position.set(-0.19, 0.19, -0.34)
      props(riser)
      set.add(riser)
      const head = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.03, 0.014, 20), railMat)
      head.position.set(-0.19, 0.33, -0.31)
      head.rotation.x = 0.6
      props(head)
      set.add(head)
      // three frozen droplets mid-fall — the stop-motion beat
      for (const [dx, dy] of [[0.004, 0.29], [-0.006, 0.24], [0.002, 0.19]] as const) {
        const drop = new THREE.Mesh(
          new THREE.SphereGeometry(0.006, 10, 8),
          liquid(t, mixHex(t.dominant, '#FFFFFF', 0.55), { opacity: 0.8 }),
        )
        drop.scale.y = 1.4
        drop.position.set(-0.19 + dx, dy, -0.3)
        set.add(drop)
      }

      set.add(duck(v, [-0.09, 0.052, -0.075], 3.0)) // floating in the bath, under the spray line
      set.add(toothbrush(v, [0.2, 0.005, -0.02], [0, 0.5, 0], '#7FA8C9')) // laid flat on the big tile
      set.add(soapDish(v, [0.14, 0.003, -0.24], '#9CC9A8'))
      // shampoo tower leaning on the wall — a billboard for the drain line
      const shampoo = new THREE.Group()
      const bottle = new THREE.Mesh(
        toyBlock(0.05, 0.19, 0.036, 0.012, 0.005),
        dieCastPaint(t, mixHex(t.accent, t.dominant, 0.3), { toy: 0.5 }),
      )
      props(bottle)
      shampoo.add(bottle)
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.014, 0.02, 14), railMat)
      cap.position.set(0, 0.2, 0)
      props(cap)
      shampoo.add(cap)
      shampoo.position.set(0.2, 0.004, -0.32)
      shampoo.rotation.set(0.06, -0.5, 0.05)
      set.add(shampoo)
      set.add(drain(v, [0.062, 0, -0.298]))
    }

    const trackMesh = trackRun(trackA, trackB, trackMat)
    if (variant === 'a') {
      // Fix 5 (scene side): a 6 mm rail lip can't be resolved by ANY shadow
      // map we can afford — its footprint speckles the deck edge at exactly
      // the rejected dither signature (ticket TA-1 is the systemic cure).
      // Variant A therefore grounds the track with the tub's own trick — a
      // tinted contact FILM — instead of a self-cast shadow.
      props(trackMesh, false, true)
      const contact = new THREE.Mesh(
        new THREE.PlaneGeometry(0.063, trackA.distanceTo(trackB) - 0.004),
        fabric(t, darken(t.shadowTint, 0.3), { opacity: 0.4, diffuseStrength: 0.12, rim: { strength: 0, size: 1 } }),
      )
      contact.geometry.rotateX(-Math.PI / 2)
      contact.position.copy(trackA).lerp(trackB, 0.5)
      contact.position.y = 0.0042
      contact.quaternion.copy(trackMesh.quaternion)
      contact.receiveShadow = false
      set.add(contact)
    }
    set.add(trackMesh)

    // a second car parked where the shot wants a witness
    {
      const second = car({ ...v, carHex: variant === 'a' ? '#009E73' : variant === 'b' ? '#0072BD' : '#009E73' })
      const p: [number, number, number] = variant === 'a' ? [0.19, 0.0126, -0.2] : variant === 'b' ? [-0.05, 0.0126, -0.12] : [0.16, 0.0126, 0.12]
      second.position.set(...p)
      second.lookAt(trackB.x, p[1], trackB.z)
      second.rotateY(-Math.PI / 2)
      set.add(second)
    }

    // Tell every ToonMaterial the key light so dark bands tint, not blacken.
    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh || obj instanceof THREE.InstancedMesh) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
        for (const m of mats) {
          if (m instanceof ToonMaterial) m.setKeyLight(v.keyColor, v.keyIntensity)
        }
      }
    })

    const camera = new THREE.PerspectiveCamera(ctx.rig.fov, 16 / 9, ctx.rig.near, ctx.rig.far)
    camera.position.set(...ctx.rig.position)
    camera.lookAt(new THREE.Vector3(...ctx.rig.target))
    return { scene, camera, focus: [heroCar.position.x, heroCar.position.y + 0.01, heroCar.position.z], tokens: t }
  }
}

registerScene('bath-a', bathroomScene('a'))
registerScene('bath-b', bathroomScene('b'))
registerScene('bath-c', bathroomScene('c'))
