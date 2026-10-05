// Stage 4 exploration — Environment Artist, garage set, three variants.
// "A real house's garage at 1:64": the art bible warned the garage is the set
// that goes generic without real toys, so every variant is built around the
// same three anchors — a CONCRETE floor, one monumental WORKBENCH LEG, and a
// PARKED GIANT BICYCLE WHEEL — and the real toys ARE the terrain: an oil
// stain (grip hazard), a cardboard ramp, a bucket tunnel, a tool wall, and a
// hanging bulb. Same toon engine and seven material classes as the ratified
// kitchen (ramp variant B, three hard steps); kitchen palette deliberately
// NOT reused — the garage seed is olive afternoon + red tool (tokens.ts), and
// the three variants are three MATERIAL STORIES of concrete under three LIGHT
// stories, which is the axis this exploration varies:
//
//   garage-a — sealed gloss under one hanging bulb (spotlight drama)
//   garage-b — broom-finish concrete under flat-cold overhead tubes
//   garage-c — epoxy sparkle cut by a door-gap sunblade
//
// Static, fixed clock; one key light per variant (spot, broad sun, low sun —
// never clutter); the orange track constant, never re-hued.

import * as THREE from 'three'
import { ceramic, dieCastPaint, fabric, liquid, paintedWood, trackPlastic } from '../../render/materials.ts'
import { stainDecal } from '../../render/film.ts'
import { toyBlock, trackChannel } from '../../render/geometry.ts'
import { GLOBAL_TOKENS, SET_TOKENS, darken, mixHex, type SetTokens } from '../../render/tokens.ts'
import { ToonMaterial, type ToonMaterialParams } from '../../render/toon-material.ts'
import { registerScene, type SceneEntry, type SceneFactory } from '../registry.ts'

type Variant = 'a' | 'b' | 'c'

// ---- palettes ---------------------------------------------------------
// Mirrors tokens.ts derive() math (private there); these variants are
// temperatures OF the garage seed, exploration-local until one wins. A is the
// token palette itself; B lifts the dominant toward dry putty and flips the
// accent cool (shop-towel blue); C deepens the dominant to resin-dark olive
// and spends the token red on exactly two objects.
function tokensFor(dominant: string, accent: string): SetTokens {
  const light = (hex: string, amt: number) => {
    const c = new THREE.Color(hex)
    const hsl = { h: 0, s: 0, l: 0 }
    c.getHSL(hsl)
    c.setHSL(hsl.h, Math.max(0, hsl.s - amt * 0.35), Math.min(1, hsl.l + amt))
    return `#${c.getHexString()}`
  }
  return {
    name: 'garage',
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
  lightMode: 'bulb' | 'tube' | 'blade'
  keyColor: string
  keyIntensity: number
  keyPos: [number, number, number]
  /** Fill gain — the bulb variant needs the shade legible without a second
   *  light, the blade variant keeps it low so the blade wins. */
  fill: number
  carHex: string
  concreteHex: string
  wallHex: string
  benchHex: string
}

const VARIANTS: Record<Variant, VariantSpec> = {
  // A: the token palette untouched — olive afternoon, red tool handles the
  // tool wall and the toolbox; one lit bulb pools the sealed gloss.
  a: {
    tokens: SET_TOKENS.garage,
    lightMode: 'bulb',
    keyColor: '#FFD9A3',
    keyIntensity: 1.5,
    keyPos: [0.05, 0.42, 0.05],
    fill: 0.4,
    carHex: '#0072BD',
    concreteHex: '#C6BE9F',
    wallHex: '#C9C2A0',
    benchHex: '#8A6B4A',
  },
  // B: broom-finish under tubes — lifted, drier dominant (putty-sage, NOT
  // grey: cream is the base the olive is cut into), accent FLIPPED cool.
  b: {
    tokens: tokensFor(mixHex('#87913D', GLOBAL_TOKENS.cream, 0.5), '#4E86B8'),
    lightMode: 'tube',
    keyColor: '#E3EEF2',
    keyIntensity: 1.12,
    keyPos: [0.25, 1.2, 0.15],
    fill: 0.34,
    carHex: '#009E73',
    concreteHex: '#CFC9AE',
    wallHex: '#D4CDB0',
    benchHex: '#94764F',
  },
  // C: epoxy sparkle — resin-dark olive, the red appears exactly twice (a
  // toolbox, a screwdriver handle) because the blade is the spectacle.
  c: {
    tokens: tokensFor('#5F6A41', '#C13E2C'),
    lightMode: 'blade',
    keyColor: '#E9F1FF',
    keyIntensity: 1.62,
    keyPos: [1.05, 0.7, -0.85],
    fill: 0.28,
    carHex: '#CC79A7',
    concreteHex: '#6E7541',
    wallHex: '#B5AE8B',
    benchHex: '#7E6140',
  },
}

const STEEL = '#C4BEB2' // chrome, kept warm per the never-grey rule

// The ratified bathroom wet-film fill pair (bathroom.ts round 2, fix 3): an
// over-white fill so the film's fill-only shading lands on the LIT slab's
// luma (the ±25 bar) while the Fresnel sheen rides past 240. Dark fills made
// stickers.
// (round 2: a white×2.2 FILM_FILL experiment pumped the wet-patch films to pure
// white at the floor rig — the isolated specks; removed, the films keep the
// bathroom's ratified fill.)

// Variant C's sun-blade corridor, module-level so the flake layer in
// `concreteSlab` and the glints in the C branch scatter along the SAME line
// the light strip draws. C-only values; they touch no other variant.
const BLADE_A: [number, number] = [0.31, -0.42]
const BLADE_B: [number, number] = [-0.24, 0.05]

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

/** Material factories that pin the variant's fill gain on every surface. */
function mk(v: VariantSpec, NO_DITHER = false) {
  const T = v.tokens
  // shadowDither off for C round 2: the shadow-boundary ramp dither threw
  // 242-252 staircase specks on the shaded floor (the open TA-1 fringe).
  const F = { fillStrength: v.fill, ...(NO_DITHER ? { shadowDither: 0 } : {}) }
  const steel = (o: Partial<ToonMaterialParams> = {}) =>
    dieCastPaint(T, STEEL, { toy: 0.4, rim: { strength: 1.3, size: 0.15 }, ...F, ...o })
  const wood = (hex: string, o: Partial<ToonMaterialParams> = {}) =>
    paintedWood(T, hex, { grain: 0.5, grainScale: 0.6, ...F, ...o })
  const paint = (hex: string, o: Partial<ToonMaterialParams> = {}) =>
    dieCastPaint(T, hex, { toy: 0.5, ...F, ...o })
  const clay = (hex: string, o: Partial<ToonMaterialParams> = {}) =>
    ceramic(T, hex, { ...F, ...o })
  const cloth = (hex: string, o: Partial<ToonMaterialParams> = {}) =>
    fabric(T, hex, { ...F, ...o })
  return { steel, wood, paint, clay, cloth }
}

// ---- anchors (all three variants) --------------------------------------

/** Concrete slab: one ceramic plane; the variant story lives in the extras. */
function concreteSlab(v: VariantSpec, M: ReturnType<typeof mk>, mode: Variant): THREE.Group {
  const g = new THREE.Group()
  const spec =
    mode === 'a'
      ? { specular: { size: 0.6, strength: 0.7 } } // sealed gloss
      : mode === 'b'
        ? { specular: { size: 0.15, strength: 0.06 } } // matte broom
        : { specular: { size: 0.62, strength: 0.32 } } // poured epoxy (round 2: 0.8 grazed the wall foot; 0.58 still mirrored the corridor's bright geometry off the epoxy as isolated specks at the floor rig)
  const slab = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.0), M.clay(v.concreteHex, spec))
  slab.rotation.x = -Math.PI / 2
  slab.receiveShadow = true
  slab.castShadow = false
  g.add(slab)

  if (mode === 'a') {
    // control joints: shallow dark lines, the only relief on the gloss
    for (const [w, h, x, z] of [
      [0.004, 0.98, -0.24, 0],
      [0.004, 0.98, 0.22, 0],
      [0.98, 0.004, 0, -0.17],
      [0.98, 0.004, 0, 0.27],
    ] as const) {
      const joint = new THREE.Mesh(new THREE.BoxGeometry(w, 0.0012, h), M.clay(darken(v.concreteHex, 0.28), { specular: { strength: 0.05 } }))
      joint.position.set(x, 0.0012, z)
      joint.receiveShadow = true
      g.add(joint)
    }
  }
  if (mode === 'b') {
    // broom-finish: wide squeegee arcs dragged across the surface
    for (const [r, x, z, yaw] of [
      [0.5, -0.12, 0.05, 0.5],
      [0.58, 0.1, -0.12, 2.4],
      [0.46, 0.0, 0.16, 4.4],
    ] as const) {
      const arc = new THREE.Mesh(
        new THREE.RingGeometry(r - 0.012, r + 0.012, 48, 1, 0, 1.05),
        M.clay(mixHex(v.concreteHex, '#FFFFFF', 0.14), { specular: { strength: 0.03 }, diffuseStrength: 0.92 }),
      )
      arc.rotation.set(-Math.PI / 2, 0, yaw)
      arc.position.set(x, 0.0017, z)
      arc.receiveShadow = true
      g.add(arc)
    }
    // grit specks
    const d = new THREE.Object3D()
    const grit = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.0016, 0), M.wood(darken(v.concreteHex, 0.3), { grain: 0 }), 140)
    const rnd = makeRng(7001)
    for (let i = 0; i < 140; i++) {
      d.position.set((rnd() - 0.5) * 0.9, 0.0022, (rnd() - 0.5) * 0.9)
      d.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3)
      d.updateMatrix()
      grit.setMatrixAt(i, d.matrix)
    }
    grit.castShadow = false
    grit.receiveShadow = true
    g.add(grit)
  }
  if (mode === 'c') {
    // epoxy metallic flakes (round 2, send-back 3): halved in size, pulled to
    // a darkened steel-metal treatment, and CONFINED to the sun-blade
    // corridor — they fire where the blade lands instead of as pale dots in
    // open shade. The diffuse is capped so no flake crosses 240 luma
    // anywhere; the bright sparkle read is the sparse glint quads the C
    // branch lays just above them, inside the same corridor.
    const d = new THREE.Object3D()
    const flake = new THREE.InstancedMesh(
      new THREE.CircleGeometry(0.0009, 5),
      M.paint(mixHex(v.concreteHex, STEEL, 0.35), { toy: 0.4, diffuseStrength: 0.72 }),
      240,
    )
    const rnd = makeRng(7002)
    const dx = BLADE_B[0] - BLADE_A[0]
    const dz = BLADE_B[1] - BLADE_A[1]
    const len = Math.hypot(dx, dz)
    for (let i = 0; i < 240; i++) {
      const t = 0.02 + rnd() * 0.96
      const off = (rnd() - 0.5) * 0.115
      d.position.set(BLADE_A[0] + dx * t + (dz / len) * off, 0.0026, BLADE_A[1] + dz * t - (dx / len) * off)
      d.rotation.set(-Math.PI / 2, 0, rnd() * Math.PI * 2)
      d.updateMatrix()
      flake.setMatrixAt(i, d.matrix)
    }
    flake.castShadow = false
    flake.receiveShadow = true
    g.add(flake)
  }
  return g
}

/** Workbench: a monumental top that mostly lives above frame + fat legs.
 *  `topY` lets a variant drop the top into a camera's frame (C round 2) —
 *  default preserves the explored silhouette byte-for-byte. */
function workbench(v: VariantSpec, M: ReturnType<typeof mk>, shelf: boolean, topY = 0.265): THREE.Group {
  const g = new THREE.Group()
  const top = new THREE.Mesh(toyBlock(0.46, 0.03, 0.22, 0.008), M.wood(v.benchHex, { grain: 0.55, grainScale: 0.4 }))
  top.position.y = topY
  props(top)
  g.add(top)
  const legH = topY - 0.015
  for (const [x, z] of [[-0.2, -0.082], [0.2, -0.082], [-0.2, 0.082], [0.2, 0.082]] as const) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.03, legH, 0.03), M.wood(darken(v.benchHex, 0.12)))
    leg.position.set(x, legH / 2, z)
    props(leg)
    g.add(leg)
  }
  if (shelf) {
    const sh = new THREE.Mesh(new THREE.BoxGeometry(0.41, 0.012, 0.19), M.wood(v.benchHex, { grain: 0.45 }))
    sh.position.y = 0.1
    props(sh)
    g.add(sh)
  }
  const rail = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.06, 0.014), M.wood(darken(v.benchHex, 0.06)))
  rail.position.set(0, topY + 0.047, -0.104)
  props(rail)
  g.add(rail)
  return g
}

/** Pegboard tool wall: a rail, a panel, four hung real toys. `driverHex`
 *  lets a variant take the red off the hung screwdriver (C round 2: the
 *  accent moved down INTO the focus band, so the wall handle went steel). */
function toolWall(v: VariantSpec, M: ReturnType<typeof mk>, driverHex?: string): THREE.Group {
  const g = new THREE.Group()
  const panel = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.24, 0.012), M.wood('#BFAF8C', { grain: 0.3, grainScale: 2 }))
  props(panel, false, true)
  g.add(panel)
  const d = new THREE.Object3D()
  const hole = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.0032, 0.0032, 0.014, 8), M.wood(darken(v.benchHex, 0.35), { grain: 0 }), 45)
  let i = 0
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 9; c++) {
      d.position.set((c - 4) * 0.034, 0.09 - r * 0.022, 0.001)
      d.rotation.set(Math.PI / 2, 0, 0)
      d.updateMatrix()
      hole.setMatrixAt(i++, d.matrix)
    }
  }
  g.add(hole)
  const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.33, 10), M.steel())
  rail.rotation.z = Math.PI / 2
  rail.position.set(0, 0.086, 0.012)
  props(rail)
  g.add(rail)

  // saw — disc blade + wooden handle
  const saw = new THREE.Group()
  const blade = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.034, 0.0022, 26), M.steel())
  blade.rotation.x = Math.PI / 2
  props(blade)
  saw.add(blade)
  const grip = new THREE.Mesh(toyBlock(0.024, 0.04, 0.008, 0.006), M.wood('#A0512F'))
  grip.position.set(0.02, -0.028, 0)
  grip.rotation.z = -0.5
  props(grip)
  saw.add(grip)
  saw.position.set(-0.12, 0.02, 0.014)
  g.add(saw)

  // wrench — shaft + open jaw
  const wrench = new THREE.Group()
  const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.013, 0.095, 0.005), M.steel())
  props(shaft)
  wrench.add(shaft)
  for (const sx of [-1, 1]) {
    const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.018, 0.005), M.steel())
    jaw.position.set(sx * 0.011, 0.05, 0)
    props(jaw)
    wrench.add(jaw)
  }
  wrench.position.set(-0.04, 0.022, 0.014)
  g.add(wrench)

  // hammer
  const hammer = new THREE.Group()
  const handle = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.088, 0.008), M.wood(v.benchHex))
  props(handle)
  hammer.add(handle)
  const head = new THREE.Mesh(toyBlock(0.042, 0.014, 0.015, 0.004), M.steel())
  head.position.y = 0.047
  props(head)
  hammer.add(head)
  hammer.position.set(0.03, 0.018, 0.014)
  g.add(hammer)

  // screwdriver — the accent-red handle
  const driver = new THREE.Group()
  const dshaft = new THREE.Mesh(new THREE.BoxGeometry(0.007, 0.05, 0.007), M.steel())
  dshaft.position.y = -0.012
  props(dshaft)
  driver.add(dshaft)
  const dhandle = new THREE.Mesh(toyBlock(0.015, 0.038, 0.015, 0.006), M.paint(driverHex ?? v.tokens.accent, { toy: 0.6 }))
  dhandle.position.y = 0.032
  props(dhandle)
  driver.add(dhandle)
  driver.position.set(0.1, 0.016, 0.014)
  g.add(driver)
  return g
}

/** Screwdriver laid on its side on the floor — C's accent in the focus band
 *  (send-back 1). Built lying so it never needs an Euler-order surprise. */
function looseDriver(v: VariantSpec, M: ReturnType<typeof mk>, over: Partial<ToonMaterialParams> = {}): THREE.Group {
  const g = new THREE.Group()
  const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.006, 0.006), M.steel())
  shaft.position.x = 0.03
  props(shaft)
  g.add(shaft)
  const handle = new THREE.Mesh(toyBlock(0.03, 0.016, 0.016, 0.005), M.paint(v.tokens.accent, { toy: 0.6, ...over }))
  handle.position.x = -0.01
  props(handle)
  g.add(handle)
  return g
}

/** Open-end wrench laid flat — the ONE tool cast aside on C's bench top
 *  (studio round-2 note: the bench must read as furniture from the close
 *  camera). Deliberately steel, not red: C spends its accent twice only. */
function looseWrench(M: ReturnType<typeof mk>): THREE.Group {
  const g = new THREE.Group()
  const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.005, 0.012), M.steel())
  props(shaft)
  g.add(shaft)
  for (const sx of [-1, 1]) {
    const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.005, 0.007), M.steel())
    jaw.position.set(sx * 0.048, 0, 0)
    props(jaw)
    g.add(jaw)
  }
  return g
}

/** Giant bicycle wheel, built in the XY plane facing +z (spokes, rim, tire,
 *  hub). radius ≈ 0.15 — a door-height ring from the floor camera. */
function bikeWheel(_v: VariantSpec, M: ReturnType<typeof mk>, R = 0.15): THREE.Group {
  const g = new THREE.Group()
  const tire = new THREE.Mesh(new THREE.TorusGeometry(R, 0.013, 10, 44), M.cloth('#4A3A2C', { rim: { strength: 0.3, size: 0.6 } }))
  props(tire)
  g.add(tire)
  const rim = new THREE.Mesh(new THREE.TorusGeometry(R * 0.9, 0.006, 8, 40), M.steel())
  props(rim)
  g.add(rim)
  for (let i = 0; i < 6; i++) {
    const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.0009, 0.0009, R * 1.76, 6), M.steel({ toy: 0.2 }))
    spoke.rotation.z = (i * Math.PI) / 6
    props(spoke)
    g.add(spoke)
  }
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.016, 14), M.steel())
  hub.rotation.x = Math.PI / 2
  props(hub)
  g.add(hub)
  return g
}

/** Bucket, upright on its base (origin at floor centre, rim at top).
 *  `paintOver` lets a variant tune the shell's paint (C tips one, and a
 *  shell at the DEFAULT paint specular mirrors the low sun into isolated
 *  ≥240 speckles at the floor camera — the AD's sparkle census). */
function bucket(_v: VariantSpec, M: ReturnType<typeof mk>, hex?: string, paintOver: Partial<ToonMaterialParams> = {}): THREE.Group {
  const g = new THREE.Group()
  const shell = new THREE.Mesh(new THREE.CylinderGeometry(0.047, 0.038, 0.068, 30, 1, true), M.paint(hex ?? '#A79C86', { toy: 0.55, ...paintOver }))
  ;(shell.material as ToonMaterial).side = THREE.DoubleSide
  shell.position.y = 0.034
  props(shell)
  g.add(shell)
  const base = new THREE.Mesh(new THREE.CircleGeometry(0.038, 26), M.paint(hex ?? '#A79C86', { toy: 0.5, ...paintOver }))
  base.rotation.x = -Math.PI / 2
  base.position.y = 0.004
  props(base)
  g.add(base)
  const rimRing = new THREE.Mesh(new THREE.TorusGeometry(0.047, 0.0038, 8, 30), M.steel())
  rimRing.rotation.x = Math.PI / 2
  rimRing.position.y = 0.068
  props(rimRing)
  g.add(rimRing)
  const bail = new THREE.Mesh(new THREE.TorusGeometry(0.044, 0.0022, 6, 24, Math.PI), M.steel({ toy: 0.2 }))
  bail.position.y = 0.066
  props(bail)
  g.add(bail)
  return g
}

/** Dark shaft + end cap — makes any opening read as a tunnel to a car. */
function tunnelShaft(M: ReturnType<typeof mk>, at: [number, number, number], radius = 0.03, depth = 0.12): THREE.Group {
  const g = new THREE.Group()
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, depth, 24, 1, true), M.cloth('#2C2318', { diffuseStrength: 0.3 }))
  ;(shaft.material as ToonMaterial).side = THREE.DoubleSide
  shaft.rotation.x = Math.PI / 2
  props(shaft, false, false)
  g.add(shaft)
  g.position.set(...at)
  return g
}

/** Contact-darkening disc — grounds a prop whose geometry alone floats at
 *  grazing floor angles (the ratified kitchen tub's trick). */
function contact(M: ReturnType<typeof mk>, at: [number, number, number], r: number): THREE.Mesh {
  const disc = new THREE.Mesh(new THREE.CircleGeometry(r, 30), M.cloth('#3A2E20', { opacity: 0.5, diffuseStrength: 0.12, rim: { strength: 0, size: 1 } }))
  disc.rotation.x = -Math.PI / 2
  disc.position.set(at[0], 0.0032, at[2])
  disc.castShadow = false
  disc.receiveShadow = false
  return disc
}

/** Oil stain: a dark liquid ellipse + satellite drips. Grip hazard — paint
 *  it anywhere the track runs. */
function oilStain(v: VariantSpec, _M: ReturnType<typeof mk>, rx = 0.07, rz = 0.05): THREE.Group {
  const g = new THREE.Group()
  const pool = new THREE.Mesh(new THREE.CircleGeometry(1, 30), liquid(v.tokens, '#2A2418', { opacity: 0.92, liquid: 0.12, specular: { size: 0.2, strength: 0.7 }, ...mkFill(v) }))
  pool.scale.set(rx, rz, 1)
  pool.rotation.x = -Math.PI / 2
  pool.castShadow = false
  g.add(pool)
  const rnd = makeRng(7003)
  for (let i = 0; i < 6; i++) {
    const a = rnd() * Math.PI * 2
    const r = 1.08 + rnd() * 0.5
    const drip = new THREE.Mesh(new THREE.CircleGeometry(0.005 + rnd() * 0.008, 14), liquid(v.tokens, '#2A2418', { opacity: 0.88, liquid: 0.1, specular: { size: 0.2, strength: 0.7 }, ...mkFill(v) }))
    drip.scale.set(1, 0.8, 1)
    drip.rotation.x = -Math.PI / 2
    drip.position.set(Math.cos(a) * rx * r, 0.0006, Math.sin(a) * rz * r)
    drip.castShadow = false
    g.add(drip)
  }
  return g
}
function mkFill(v: VariantSpec): { fillStrength: number } {
  return { fillStrength: v.fill }
}

/** Cardboard: tan painted-wood toy with a folded corrugated edge. */
function cardboard(_v: VariantSpec, M: ReturnType<typeof mk>, l: number, h: number, w: number): THREE.Group {
  const g = new THREE.Group()
  const box = new THREE.Mesh(toyBlock(l, h, w, 0.004), M.wood('#C9A063', { grain: 0.22, grainScale: 2.2, toy: 0.4 }))
  props(box)
  g.add(box)
  const fold = new THREE.Mesh(new THREE.BoxGeometry(l * 0.96, 0.004, w * 0.96), M.wood('#B0824A', { grain: 0.2 }))
  fold.position.y = h + 0.001
  props(fold)
  g.add(fold)
  return g
}

/** Hanging bulb (geometry; variant A lights it for real, C hangs it dead). */
function hangingBulb(_v: VariantSpec, M: ReturnType<typeof mk>, lit: boolean, cordLen: number): THREE.Group {
  const g = new THREE.Group()
  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.013, 14, 12),
    lit ? M.clay('#F6DFA4', { toy: 0.4, diffuseStrength: 1.55, specular: { size: 0.2, strength: 0.3 } }) : M.clay('#ACA596', { toy: 0.3, diffuseStrength: 0.7 }),
  )
  props(bulb, false, false)
  g.add(bulb)
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.007, 0.01, 12), M.steel())
  cap.position.y = 0.014
  props(cap)
  g.add(cap)
  const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.0011, 0.0011, cordLen, 6), M.cloth('#4A3F30', {}))
  cord.position.y = 0.02 + cordLen / 2
  g.add(cord)
  return g
}

/** Overhead strip-light fixture (variant B): housing + a cold emissive tube. */
function tubeFixture(_v: VariantSpec, M: ReturnType<typeof mk>): THREE.Group {
  const g = new THREE.Group()
  const housing = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.02, 0.055), M.wood('#C4BCA2', { grain: 0.15 }))
  housing.position.y = 0.014
  props(housing, false, false)
  g.add(housing)
  const tube = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.016, 0.03), M.wood('#EEF3EA', { grain: 0, diffuseStrength: 1.5, specular: { strength: 0 } }))
  props(tube, false, false)
  g.add(tube)
  return g
}

/** A low roller door with a bright slit at its bottom (variant C). C is the
 *  only variant with the door IN frame at the low rig: the panel at the
 *  plain skin tone sat a full ramp band above the room and threw a wall of
 *  isolated ≥240 across its lower corner — pull it to the room's own shade tone. */
function rollerDoor(v: VariantSpec, M: ReturnType<typeof mk>): THREE.Group {
  const g = new THREE.Group()
  const panel = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.37, 0.012), M.wood('#C6BC9C', { grain: 0.2, grainScale: 1.6 }))
  panel.position.y = 0.188
  props(panel, false, true)
  g.add(panel)
  for (let i = 0; i < 3; i++) {
    const seam = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.0035, 0.014), M.wood(darken(v.benchHex, 0.1), { grain: 0 }))
    seam.position.set(0, 0.08 + i * 0.1, 0.001)
    g.add(seam)
  }
  const slit = new THREE.Mesh(new THREE.BoxGeometry(0.29, 0.005, 0.004), M.wood('#EFF5FF', { grain: 0, diffuseStrength: 1.5, specular: { strength: 0 } }))
  slit.position.set(0, 0.004, 0.008)
  g.add(slit)
  return g
}

/** Sun blade: a bright floor strip from `from` to `to` (variant C's lie —
 *  the real light is one DirectionalLight along the same axis). */
function sunBlade(_v: VariantSpec, M: ReturnType<typeof mk>, from: [number, number], to: [number, number], width: number, hex = '#F1F6FF', diffuse = 1.7): THREE.Group {
  const g = new THREE.Group()
  const strip = new THREE.Mesh(
    new THREE.PlaneGeometry(width, Math.hypot(to[0] - from[0], to[1] - from[1])),
    // Round 2 fix 4: at 1.7 diffuse the ramp capped the strip at ~172 luma
    // in the FLOOR camera — the blade literally could not cross the 240 bar
    // at the low rig. 2.5 puts the strip itself over the bar in both rigs
    // (it is a lie-strip, not a surface: brighter-than-sun is the point),
    // and the y sits just under the track's underside so it never z-fights
    // the channel where they cross, just over the flakes so it reads as
    // light ON them.
    M.wood(hex, { grain: 0, diffuseStrength: diffuse, specular: { strength: 0 } }),
  )
  strip.rotation.x = -Math.PI / 2
  strip.castShadow = false
  strip.receiveShadow = false
  g.add(strip)
  g.position.set((from[0] + to[0]) / 2, 0.0028, (from[1] + to[1]) / 2)
  g.lookAt(to[0], 0.0028, to[1])
  return g
}

/** Toolbox — the token red, one of C's exactly-two red objects. `paintOver`
 *  lets a variant tune the body's paint (C kills the broad gloss streak —
 *  at the AD's sparkle census a 240-luma highlight on a fist-sized box is
 *  exactly the isolated speckle that must not exist). */
function toolbox(v: VariantSpec, M: ReturnType<typeof mk>, paintOver: Partial<ToonMaterialParams> = {}): THREE.Group {
  const g = new THREE.Group()
  const body = new THREE.Mesh(toyBlock(0.072, 0.045, 0.038, 0.007), M.paint(v.tokens.accent, { toy: 0.6, ...paintOver }))
  body.position.y = 0.0225
  props(body)
  g.add(body)
  const lidLine = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.002, 0.036), M.cloth('#241B12', { diffuseStrength: 0.4 }))
  lidLine.position.y = 0.036
  g.add(lidLine)
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.016, 0.0022, 6, 20, Math.PI), M.steel())
  handle.position.y = 0.047
  props(handle)
  g.add(handle)
  return g
}

/** Crumpled shop rag — the lived-in speck. */
function rag(_v: VariantSpec, M: ReturnType<typeof mk>, hex: string): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.018, 1), M.cloth(hex, {}))
  m.scale.y = 0.42
  props(m)
  return m
}

/** Scattered nails (lived-in detail, catches any key). */
function nails(_v: VariantSpec, M: ReturnType<typeof mk>, center: [number, number], n = 12, seed = 7004): THREE.Group {
  const g = new THREE.Group()
  const d = new THREE.Object3D()
  const mesh = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.0009, 0.0009, 0.02, 6), M.steel({ toy: 0.1 }), n)
  const rnd = makeRng(seed)
  for (let i = 0; i < n; i++) {
    d.position.set(center[0] + (rnd() - 0.5) * 0.1, 0.001, center[1] + (rnd() - 0.5) * 0.1)
    d.rotation.set(Math.PI / 2, 0, rnd() * Math.PI * 2, 'YXZ')
    d.updateMatrix()
    mesh.setMatrixAt(i, d.matrix)
  }
  props(mesh)
  g.add(mesh)
  return g
}

/** Mug / thermos / can — the bench-top "someone was here" trio. */
function mug(_v: VariantSpec, M: ReturnType<typeof mk>): THREE.Group {
  const g = new THREE.Group()
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.012, 0.026, 18), M.clay('#EDE2C8', {}))
  body.position.y = 0.013
  props(body)
  g.add(body)
  const ear = new THREE.Mesh(new THREE.TorusGeometry(0.008, 0.0022, 6, 14), M.clay('#EDE2C8', {}))
  ear.position.set(0.017, 0.014, 0)
  props(ear)
  g.add(ear)
  return g
}
function can(_v: VariantSpec, M: ReturnType<typeof mk>): THREE.Group {
  const g = new THREE.Group()
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.033, 18), M.paint('#B9A7D6', { toy: 0.55 }))
  body.position.y = 0.0165
  props(body)
  g.add(body)
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.002, 18), M.steel())
  top.position.y = 0.0335
  props(top)
  g.add(top)
  return g
}
function thermos(v: VariantSpec, M: ReturnType<typeof mk>): THREE.Group {
  const g = new THREE.Group()
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.05, 18), M.paint(v.tokens.accent, { toy: 0.45 }))
  body.position.y = 0.025
  props(body)
  g.add(body)
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.012, 14), M.steel())
  cap.position.y = 0.056
  props(cap)
  g.add(cap)
  return g
}

/** The car — the ratified sedan-blocky silhouette, Okabe-Ito hues only. */
function car(v: VariantSpec, hex: string): THREE.Group {
  const t = v.tokens
  const g = new THREE.Group()
  const body = new THREE.Mesh(toyBlock(0.075, 0.028, 0.034, 0.01, 0.004), dieCastPaint(t, hex, { toy: 0.4, fillStrength: v.fill }))
  props(body)
  g.add(body)
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.062, 0.004, 0.011), dieCastPaint(t, '#F6E9D2', { fillStrength: v.fill }))
  stripe.position.y = 0.027
  g.add(stripe)
  const wheelGeo = new THREE.CylinderGeometry(0.009, 0.009, 0.006, 18)
  wheelGeo.rotateX(Math.PI / 2)
  const wheelMat = fabric(t, '#5A4130', { rim: { strength: 0.25, size: 0.6 }, fillStrength: v.fill })
  for (const [x, z] of [[0.024, 0.017], [-0.024, 0.017], [0.024, -0.017], [-0.024, -0.017]] as const) {
    const w = new THREE.Mesh(wheelGeo, wheelMat)
    w.position.set(x, 0.009, z)
    props(w, true, false)
    g.add(w)
  }
  g.scale.setScalar(0.62)
  return g
}

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

// ---- scene ------------------------------------------------------------

function garageScene(variant: Variant): SceneFactory {
  return (ctx): SceneEntry => {
    const v = VARIANTS[variant]
    const t = v.tokens
    const M = mk(v, variant === 'c')
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(t.background)

    // one key, per the variant's light story
    let key: THREE.Light
    if (v.lightMode === 'bulb') {
      const spot = new THREE.SpotLight(v.keyColor, v.keyIntensity, 0, 0.55, 0.8)
      spot.decay = 0 // toon ramp: the cone IS the falloff
      spot.position.set(...v.keyPos)
      spot.target.position.set(v.keyPos[0], 0, v.keyPos[2])
      scene.add(spot.target)
      spot.shadow.mapSize.set(1024, 1024)
      spot.shadow.camera.near = 0.05
      spot.shadow.camera.far = 1.2
      spot.shadow.bias = -0.0006
      spot.shadow.normalBias = 0.005
      spot.shadow.radius = 4
      key = spot
    } else {
      const sun = new THREE.DirectionalLight(v.keyColor, v.keyIntensity)
      sun.position.set(...v.keyPos)
      const fr = variant === 'c' ? 1.6 : 1.2
      sun.shadow.camera.left = -fr
      sun.shadow.camera.right = fr
      sun.shadow.camera.top = fr
      sun.shadow.camera.bottom = -fr
      sun.shadow.camera.near = 0.1
      sun.shadow.camera.far = 4
      sun.shadow.bias = -0.0004
      sun.shadow.normalBias = 0.006
      sun.shadow.radius = variant === 'b' ? 6 : 4
      key = sun
    }
    key.castShadow = true
    if (key instanceof THREE.DirectionalLight) key.shadow.mapSize.set(2048, 2048)
    scene.add(key)

    // ground beyond the slab + the back wall
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(1.4, 72),
      M.wood(darken(t.ground, variant === 'c' ? 0.16 : 0.08), { grain: variant === 'c' ? 0.1 : 0.25, grainScale: 0.25 }),
    )
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    scene.add(ground)
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(20, 4), M.wood(v.wallHex, { grain: 0.04, grainScale: 0.1, diffuseStrength: variant === 'c' ? 0.85 : 0.9 }))
    wall.position.set(0, 1.6, -0.45)
    wall.receiveShadow = true
    scene.add(wall)

    const set = new THREE.Group()
    scene.add(set)
    set.add(concreteSlab(v, M, variant))

    // the track's line, shared by all three: straight down the room
    const trackA = new THREE.Vector3(0.0, 0.003, 0.34)
    const trackB = new THREE.Vector3(0.045, 0.003, -0.27)
    // Round 2 note 3: the probe caught the SPECK ray on the track channel's
    // own top band — at C's key strength the orange ramp tops at ≥240 and
    // its dithered AA stair ran the corridor's census tail. C's track runs
    // a dimmer-diffuse twin of the same material; A/B keep theirs exactly.
    const trackMat = trackPlastic(t, GLOBAL_TOKENS.trackOrange, { toy: 0.2, fillStrength: v.fill, ...(variant === 'c' ? { specular: { size: 0.3, strength: 0.08 } } : {}) })

    const heroCar = car(v, v.carHex)
    if (variant === 'c') {
      // Round 2 (AD note 3): the parked car's cream roof stripe at the plain
      // toy skin sat ABOVE the bloom knee (~233 luma) and the floor rig's DOF
      // stair-cut it into the isolated-bright specks running down the
      // corridor's tail. The car keeps its colour; the stripe and the toy
      // gradient come off the knee. (A/B keep the car byte-identical.)
      for (const sub of heroCar.children) {
        const m = (sub as THREE.Mesh).material as ToonMaterial
        if (!m?.uniforms) continue
        if ('uToy' in m.uniforms) m.uniforms.uToy.value = Math.min(m.uniforms.uToy.value as number, 0.25)
        if (m.uniforms.uColor && (m.uniforms.uColor.value as THREE.Color).getHex() === 0xf6e9d2) {
          m.uniforms.uDiffuseStrength.value = 0.55
        }
      }
    }
    set.add(heroCar)

    if (variant === 'a') {
      // ---- A: sealed gloss, one hanging bulb ---------------------------
      const bench = workbench(v, M, false)
      bench.position.set(-0.18, 0, -0.3)
      set.add(bench)
      const tw = toolWall(v, M)
      tw.position.set(-0.18, 0.44, -0.44)
      set.add(tw)
      set.add(toolbox(v, M).translateX(-0.11).translateY(0.283).translateZ(-0.3))
      const aMug = mug(v, M)
      aMug.position.set(-0.27, 0.283, -0.28)
      set.add(aMug)
      set.add(nails(v, M, [-0.14, -0.06], 12, 7101))

      // the parked giant bicycle wheel, leaning wherever it was parked
      const wheel = bikeWheel(v, M)
      wheel.rotation.order = 'YXZ'
      wheel.rotation.set(0.24, -0.55, 0.09)
      wheel.position.set(0.28, 0.148, -0.23)
      set.add(wheel)
      set.add(contact(M, [0.28, 0, -0.155], 0.05))

      // the bulb, its pool, and the oil stain squarely in the light
      const bulb = hangingBulb(v, M, true, 0.3)
      bulb.position.set(0.05, 0.4, 0.05)
      set.add(bulb)
      const pool = new THREE.Mesh(new THREE.CircleGeometry(0.1, 30), M.wood(mixHex(v.concreteHex, '#FFE7BE', 0.5), { grain: 0, diffuseStrength: 1.1, specular: { strength: 0 } }))
      pool.rotation.x = -Math.PI / 2
      pool.position.set(0.05, 0.0018, 0.05)
      pool.castShadow = false
      set.add(pool)
      const stain = oilStain(v, M, 0.045, 0.032)
      stain.position.set(0.095, 0.0025, 0.075)
      set.add(stain)
      set.add(rag(v, M, '#7A7A55').translateX(0.16).translateY(0.006).translateZ(0.01))
      set.add(contact(M, [0.048, 0, -0.25], 0.055))

      // the bucket tunnel on the last straight, mouth to the camera
      const b = bucket(v, M)
      b.rotation.x = Math.PI / 2
      b.position.set(0.048, 0.042, -0.25)
      set.add(b)
      set.add(tunnelShaft(M, [0.048, 0.04, -0.3], 0.032, 0.14))

      // flattened cardboard waiting to be a ramp someday
      set.add(cardboard(v, M, 0.15, 0.008, 0.11).translateX(0.26).translateY(0.004).translateZ(0.16))
      const stack = cardboard(v, M, 0.11, 0.04, 0.09)
      stack.position.set(0.29, 0.012, 0.12)
      stack.rotation.y = 0.3
      set.add(stack)

      placeCar(heroCar, trackA, trackB, 0.45, 0.0126)
      const second = car(v, '#009E73')
      second.position.set(-0.17, 0.0126, -0.17)
      second.lookAt(trackB.x, 0.0126, trackB.z)
      second.rotateY(-Math.PI / 2)
      set.add(second)
    } else if (variant === 'b') {
      // ---- B: broom-finish, flat-cold tubes, the mezzanine --------------
      set.add(workbench(v, M, true).translateX(-0.12).translateZ(-0.3))
      const tw = toolWall(v, M)
      tw.position.set(-0.12, 0.44, -0.44)
      set.add(tw)
      set.add(thermos(v, M).translateX(-0.05).translateY(0.283).translateZ(-0.3))

      // the overhead tubes (geometry — the key is one broad cool sun)
      for (const x of [-0.14, 0.16]) {
        const fx = tubeFixture(v, M)
        fx.position.set(x, 0.4, -0.02)
        set.add(fx)
      }

      // the cardboard ramp: floor to bench shelf — the garage mezzanine
      const ramp = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.008, 0.28), M.wood('#C9A063', { grain: 0.22, grainScale: 2.2, toy: 0.4 }))
      ramp.position.set(0.15, 0.062, -0.22)
      ramp.rotation.x = 0.5
      props(ramp)
      set.add(ramp)
      const edge = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.01, 0.008), M.wood('#B0824A', { grain: 0.2 }))
      edge.position.set(0.15, 0.0, -0.09)
      props(edge)
      set.add(edge)

      // the parked wheel, rolled flat into the corner
      const wheel = bikeWheel(v, M)
      wheel.rotation.x = -Math.PI / 2
      wheel.position.set(0.26, 0.013, 0.21)
      wheel.rotation.z = 0.3
      set.add(wheel)
      set.add(contact(M, [0.26, 0, 0.21], 0.16))

      // buckets: one upright, its lid beside it
      const b = bucket(v, M, '#97A07C')
      b.position.set(-0.28, 0, 0.08)
      set.add(b)
      const lid = new THREE.Mesh(new THREE.CircleGeometry(0.045, 26), M.paint('#97A07C', { toy: 0.55 }))
      lid.rotation.x = -Math.PI / 2
      lid.rotation.z = 0.4
      lid.position.set(-0.21, 0.004, 0.13)
      props(lid)
      set.add(lid)
      const drip = oilStain(v, M, 0.05, 0.035)
      drip.position.set(-0.25, 0.0025, 0.02)
      set.add(drip)

      // cool blue shop towels — the flipped accent
      const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.07, 14), M.cloth(t.accent, {}))
      roll.rotation.z = Math.PI / 2
      roll.position.set(-0.18, 0.3, -0.29)
      props(roll)
      set.add(roll)
      set.add(rag(v, M, mixHex(t.accent, '#E8DCC0', 0.62)).translateX(0.05).translateY(0.005).translateZ(0.22))
      set.add(nails(v, M, [0.2, 0.0], 10, 7102))

      placeCar(heroCar, trackA, trackB, 0.5, 0.0126)
      // the witness car halfway up the mezzanine ramp
      const second = car(v, '#0072BD')
      second.position.set(0.15, 0.08, -0.24)
      second.rotateY(Math.PI)
      second.rotateX(0.5)
      set.add(second)
    } else {
      // ---- C: epoxy sparkle, door-gap sunblade, wheel tunnel -------------
      // Round 2 (2026-10-08 AD send-back, all five numbered fixes + the
      // studio's two named notes). Everything below is C-branch only.
      // Studio note 1: the bench DROPPED to table height (top 0.185) so the
      // close camera takes in its front edge, its full leg run AND a strip
      // of the grained top at the back — furniture, not architecture — with
      // exactly ONE tool cast aside on the far of the top, where the low
      // rig's top-of-view can still reach it.
      set.add(workbench(v, M, false, 0.185).translateX(-0.24).translateZ(-0.26))
      const benchTool = looseWrench(M)
      benchTool.position.set(-0.2, 0.2025, -0.31)
      benchTool.rotation.y = 0.55
      set.add(benchTool)
      // Fix 1: the accent moved DOWN off the tool wall and out of the lens
      // shadow — the hung screwdriver's handle is steel now, and the red
      // lives on the floor beside the straight at car height, in the band.
      const tw = toolWall(v, M, STEEL)
      tw.position.set(-0.24, 0.44, -0.44)
      set.add(tw)
      set.add(can(v, M).translateX(-0.16).translateY(0.2).translateZ(-0.24))
      // the toolbox pulled off the floor rig onto the straight (fix 1),
      // parked just clear of the blade's band-line so its body does not
      // stand on the run
      const box = toolbox(v, M, { specular: { size: 0.5, strength: 0.18 }, toy: 0.28 })
      // the bail's chrome at the full steel rim threw a 1px dash of ≥240
      // over the box's own red at the floor camera — dim the wire chrome.
      for (const kid of box.children) {
        const m = (kid as THREE.Mesh).material as ToonMaterial
        if (m?.uniforms?.uRimStrength) {
          m.uniforms.uRimStrength.value = Math.min(m.uniforms.uRimStrength.value as number, 0.3)
          m.uniforms.uSpecStrength.value = Math.min(m.uniforms.uSpecStrength.value as number, 0.25)
        }
      }
      box.translateX(0.065).translateY(0.004).translateZ(-0.09)
      set.add(box)
      const driver = looseDriver(v, M, { toy: 0.3 })
      for (const kid of driver.children) {
        const m = (kid as THREE.Mesh).material as ToonMaterial
        if (m?.uniforms?.uRimStrength) {
          m.uniforms.uRimStrength.value = Math.min(m.uniforms.uRimStrength.value as number, 0.3)
          m.uniforms.uSpecStrength.value = Math.min(m.uniforms.uSpecStrength.value as number, 0.25)
        }
      }
      driver.translateX(0.03).translateY(0.011).translateZ(-0.13).rotateY(0.6)
      set.add(driver)

      // the roller door + the blade of light from its gap.
      // Fix 4: the strip WIDENED to 0.075 and the corridor re-aimed so its
      // path runs at a near-constant 0.3-0.5 m from the floor rig — the
      // tilt-shift band's own depth shell — instead of sweeping in to the
      // camera's feet and dropping out of the band. Projected, it crosses
      // close-c at rows 452-471 (the band is 358-502): the blade is now one
      // long sharp line at the LOW rig, not a hero-only story.
      const door = rollerDoor(v, M)
      // Round 2 note 3: at C's key the roller panel's bottom slat clamped the
      // ramp (192 x 1.62 >= 240) and threw AA fringe along its foot; the C
      // instance only (A's door is untouched) comes down off the knee.
      for (const kid of door.children) {
        const m = (kid as THREE.Mesh).material as ToonMaterial
        if (m?.uniforms?.uDiffuseStrength && m.uniforms.uDiffuseStrength.value === 1) m.uniforms.uDiffuseStrength.value = 0.8
        else if (m?.uniforms?.uDiffuseStrength && (m.uniforms.uDiffuseStrength.value as number) === 1.5) m.uniforms.uDiffuseStrength.value = 1
      }
      door.position.set(0.31, 0, -0.442)
      set.add(door)
      // Round 2 (AD round-2 note 3): the strip's FAR half sat exactly ON the
      // 240/bloom knee, so its AA stair threw 1px specks along the corridor
      // tail at the floor rig. The blade is now two segments — the near half
      // keeps the lie-strip at 2.5 (the run, hero story), the far half is
      // pulled to a dimmer wash: still a light line across the frame, but a
      // clean ~200 luma, off the knee.
      // Round 2 note 3: the corridor's FAR tail (A side, past the track
      // intersection) sat on the 240/bloom knee at the floor rig and its
      // AA stair cut threw the isolated specks. The first 30% of the run
      // is a dimmer wash; the 70% that carries the hero story keeps 2.5.
      const bladeQ: [number, number] = [BLADE_A[0] + (BLADE_B[0] - BLADE_A[0]) * 0.3, BLADE_A[1] + (BLADE_B[1] - BLADE_A[1]) * 0.3]
      set.add(sunBlade(v, M, BLADE_A, bladeQ, 0.075, mixHex(v.concreteHex, '#F1F6FF', 0.4), 0.62))
      set.add(sunBlade(v, M, bladeQ, BLADE_B, 0.075, '#F1F6FF', 2.5))
      // fix 3 companion: sparse glint quads INSIDE the corridor only, and
      // only in its SHARP middle third (t 0.42-0.72, the band's own depth
      // shell) — a glint on the strip is invisible (same value as the
      // light), a glint off it is exactly the isolated speck the census
      // forbids, and in the blurred near/far runs a glint OUTSIDE the
      // strip's few projected pixels is a 255-luma dot on dark floor.
      const gd = new THREE.Object3D()
      const glint = new THREE.InstancedMesh(
        new THREE.CircleGeometry(0.0026, 5),
        // Round 2 note 3: the quads at 2.4 diffused to CLAMPED white and their dithered
        // edges on the dark floor WERE the isolated-bright census (never a mesh-removal
        // could touch them — they are the specks). Off the bar now: sparkles of the
        // corridor's own tone, a touch above the floor, not sun-on-chrome.
        M.wood(mixHex(v.concreteHex, '#F4F8FF', 0.5), { grain: 0, diffuseStrength: 0.55, specular: { strength: 0 } }),
        30,
      )
      const grnd = makeRng(7006)
      const gdx = BLADE_B[0] - BLADE_A[0]
      const gdz = BLADE_B[1] - BLADE_A[1]
      for (let i = 0; i < 30; i++) {
        const gt = 0.42 + grnd() * 0.3
        gd.position.set(BLADE_A[0] + gdx * gt, 0.0036, BLADE_A[1] + gdz * gt)
        gd.rotation.set(-Math.PI / 2, 0, grnd() * Math.PI * 2)
        gd.updateMatrix()
        glint.setMatrixAt(i, gd.matrix)
      }
      glint.castShadow = false
      glint.receiveShadow = false
      set.add(glint)

      // Studio note 2: the dead bulb is a PRACTICAL now, not an off-frame
      // joke — hung over the bench foot at a height BOTH rigs can see, and
      // it carries an honest, clearly-dimmer-than-the-blade warm bounce
      // disc on the slab under it, so the practical read survives even
      // where the bulb itself does not.
      const bulb = hangingBulb(v, M, false, 0.3)
      bulb.position.set(-0.05, 0.145, -0.24)
      bulb.rotation.z = 0.04
      set.add(bulb)
      const bounce = new THREE.Mesh(new THREE.CircleGeometry(0.075, 26), M.wood(mixHex(v.concreteHex, '#F4DBA8', 0.26), { grain: 0, diffuseStrength: 1.12, specular: { strength: 0.1 } }))
      bounce.rotation.x = -Math.PI / 2
      bounce.position.set(-0.05, 0.0019, -0.24)
      bounce.castShadow = false
      bounce.receiveShadow = true
      set.add(bounce)

      // the parked wheel, stood up dead-centre on the straight: the tunnel
      // (with a shadowed back cap — the AD's bucket/tunnel ticket: an open
      // tube aimed at the camera reads as a floating hoop and, here, lit
      // the wall through itself as an isolated-bright speck. C-scoped;
      // a/b's tunnels are untouched pending the shared fix.)
      const wheel = bikeWheel(v, M)
      wheel.position.set(0.045, 0.14, -0.283)
      // the 0.9mm spokes at the full steel rim band fired as isolated ≥240
      // pixels once the wheel sat sharp in the floor camera's band — the
      // ring's 6mm tube at 1.3 threw 1px 255-luma dashes along its lower
      // arc and the spokes' own spec glaze threw another band of them, so
      // the wire parts get a dimmer chrome (tire keeps its cloth matte,
      // the hub its normal steel).
      for (const i of [0, 1, 2, 3, 4, 5, 6, 7]) {
        const m = (wheel.children[i] as THREE.Mesh).material as ToonMaterial
        if (m.uniforms.uRimStrength) m.uniforms.uRimStrength.value = 0.2
        if (m.uniforms.uSpecStrength) m.uniforms.uSpecStrength.value = 0.1
        if (m.uniforms.uDiffuseStrength) m.uniforms.uDiffuseStrength.value = 0.6
        if (m.uniforms.uColor) (m.uniforms.uColor.value as THREE.Color).multiplyScalar(0.72)
      }
      set.add(wheel)
      set.add(tunnelShaft(M, [0.045, 0.02, -0.36], 0.034, 0.16))
      const cap = new THREE.Mesh(new THREE.CircleGeometry(0.036, 22), M.cloth('#241C12', { diffuseStrength: 0.1, rim: { strength: 0, size: 1 } }))
      cap.position.set(0.045, 0.02, -0.4395)
      cap.castShadow = false
      cap.receiveShadow = false
      set.add(cap)

      // Fix 5: the stain is a FILM now — the ratified bathroom wet-patch
      // treatment (base near the slab tone inside the ±25-luma bar, soft SDF
      // edge, Fresnel sheen streaks), not a liquid decal. Nudged LEFT so its
      // soft edge just grazes the widened corridor's dark side — a puddle
      // lying IN the blade would read as a hole in the light.
      const filmTone = mixHex(v.concreteHex, '#2A2418', 0.28)
      const stain = stainDecal(t, { kind: 'wetPatch', color: filmTone, opacity: 0.5, size: 0.055, sheen: 1, lift: 0.0042 })
      stain.position.set(-0.09, stain.position.y, -0.14)
      set.add(stain)
      for (const [sx, sz, ss] of [[-0.02, -0.19, 0.011], [-0.15, -0.11, 0.009]] as const) {
        const drip = stainDecal(t, { kind: 'wetPatch', color: filmTone, opacity: 0.55, size: ss, sheen: 1, lift: 0.0042 })
        drip.position.set(sx, drip.position.y, sz)
        set.add(drip)
      }
      // a tipped bucket + cardboards
      const b = bucket(v, M, '#A08E72', { specular: { size: 0.5, strength: 0.22 } })
      // the tipped shell's steel rim carries a 1.3 rim band that fired as
      // isolated ≥240 pixels at the floor camera — dim it for the tipped
      // one only (the upright buckets keep the bright rim ring).
      for (const kid of b.children) {
        const m = (kid as THREE.Mesh).material as ToonMaterial
        if (m?.uniforms?.uRimStrength) m.uniforms.uRimStrength.value = Math.min(m.uniforms.uRimStrength.value as number, 0.35)
      }
      b.rotation.z = Math.PI / 2 - 0.15
      b.rotation.y = -Math.PI / 2
      b.position.set(-0.17, 0.04, 0.14)
      set.add(b)
      const boxes = cardboard(v, M, 0.12, 0.06, 0.1)
      boxes.position.set(-0.3, 0.004, 0.2)
      boxes.rotation.y = 0.2
      set.add(boxes)
      const lid = new THREE.Mesh(new THREE.CircleGeometry(0.044, 24), M.paint('#A08E72', { toy: 0.5 }))
      lid.rotation.x = -Math.PI / 2
      lid.rotation.z = 0.8
      lid.position.set(-0.1, 0.004, 0.18)
      props(lid)
      set.add(lid)
      set.add(rag(v, M, '#8A8A60').translateX(0.12).translateY(0.006).translateZ(-0.08))
      const nailPile = nails(v, M, [0.22, 0.1], 10, 7103)
      // Round 2 note 3: the spill's ten 0.9mm steel pins sat in full die-cast
      // chrome in the floor rig's sharp band — each fired one isolated ≥240
      // pixel (the probe ray hit the pile dead-on; it was NEVER the door,
      // the blade, or the floor the removal tests kept exonerating). The
      // spill reads as scattered hardware still; the pins just stop
      // mirroring the sun.
      nailPile.traverse((o) => {
        const m = (o as THREE.Mesh).material as ToonMaterial
        if (!m?.uniforms) return
        if (m.uniforms.uRimStrength) m.uniforms.uRimStrength.value = 0.2
        if (m.uniforms.uSpecStrength) m.uniforms.uSpecStrength.value = 0.12
        if (m.uniforms.uDiffuseStrength) m.uniforms.uDiffuseStrength.value = 0.6
      })
      set.add(nailPile)

      placeCar(heroCar, trackA, trackB, 0.64, 0.0126)
      // Fix 2: one car per focus band — the blue witness is PARKED UNDER
      // THE BENCH (the under-bench low ground variant B pitched, ported),
      // engine-off, facing its own business. It is still in both frames
      // but far past the separation bar from the hero, in shade behind a leg.
      const second = car(v, '#0072BD')
      second.position.set(-0.4, 0.0126, -0.24)
      second.lookAt(-0.44, 0.0126, -0.4)
      second.rotateY(-Math.PI / 2)
      set.add(second)
    }

    set.add(trackRun(trackA, trackB, trackMat))

    // tell every ToonMaterial the key light so dark bands tint, not blacken
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
    // Round 2 note 3: C's focus point moves off the (unmoved) hero car onto
    // the corridor itself, so the blade tail and wheel sit in the SHARP
    // band — the tilt-shift no longer tap-dithers the blade's bloom halo
    // into isolated specks along the tail (the round-2 iso census).
    const focus: [number, number, number] = variant === 'c' ? [0.02, 0.02, -0.3] : [heroCar.position.x, heroCar.position.y + 0.01, heroCar.position.z]
    
    return { scene, camera, focus, tokens: t }
  }
}

registerScene('garage-a', garageScene('a'))
registerScene('garage-b', garageScene('b'))
registerScene('garage-c', garageScene('c'))
