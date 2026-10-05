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
function mk(v: VariantSpec) {
  const T = v.tokens
  const F = { fillStrength: v.fill }
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
        : { specular: { size: 0.62, strength: 0.8 } } // poured epoxy
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
    // epoxy metallic flakes: flat pentagon confetti, sparse and glinting
    const d = new THREE.Object3D()
    const flake = new THREE.InstancedMesh(
      new THREE.CircleGeometry(0.0018, 5),
      M.paint(mixHex(v.concreteHex, '#E9E7D2', 0.75), { toy: 0.85, rim: { strength: 0.5, size: 0.3 } }),
      260,
    )
    const rnd = makeRng(7002)
    for (let i = 0; i < 260; i++) {
      d.position.set((rnd() - 0.5) * 0.92, 0.0026, (rnd() - 0.5) * 0.92)
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

/** Workbench: a monumental top that mostly lives above frame + fat legs. */
function workbench(v: VariantSpec, M: ReturnType<typeof mk>, shelf: boolean): THREE.Group {
  const g = new THREE.Group()
  const top = new THREE.Mesh(toyBlock(0.46, 0.03, 0.22, 0.008), M.wood(v.benchHex, { grain: 0.55, grainScale: 0.4 }))
  top.position.y = 0.265
  props(top)
  g.add(top)
  for (const [x, z] of [[-0.2, -0.082], [0.2, -0.082], [-0.2, 0.082], [0.2, 0.082]] as const) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.25, 0.03), M.wood(darken(v.benchHex, 0.12)))
    leg.position.set(x, 0.125, z)
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
  rail.position.set(0, 0.312, -0.104)
  props(rail)
  g.add(rail)
  return g
}

/** Pegboard tool wall: a rail, a panel, four hung real toys. */
function toolWall(v: VariantSpec, M: ReturnType<typeof mk>): THREE.Group {
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
  const dhandle = new THREE.Mesh(toyBlock(0.015, 0.038, 0.015, 0.006), M.paint(v.tokens.accent, { toy: 0.6 }))
  dhandle.position.y = 0.032
  props(dhandle)
  driver.add(dhandle)
  driver.position.set(0.1, 0.016, 0.014)
  g.add(driver)
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

/** Enamel bucket, upright on its base (origin at floor centre, rim at top). */
function bucket(_v: VariantSpec, M: ReturnType<typeof mk>, hex?: string): THREE.Group {
  const g = new THREE.Group()
  const shell = new THREE.Mesh(new THREE.CylinderGeometry(0.047, 0.038, 0.068, 30, 1, true), M.paint(hex ?? '#A79C86', { toy: 0.55 }))
  ;(shell.material as ToonMaterial).side = THREE.DoubleSide
  shell.position.y = 0.034
  props(shell)
  g.add(shell)
  const base = new THREE.Mesh(new THREE.CircleGeometry(0.038, 26), M.paint(hex ?? '#A79C86', { toy: 0.5 }))
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

/** A low roller door with a bright slit at its bottom (variant C). */
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
function sunBlade(_v: VariantSpec, M: ReturnType<typeof mk>, from: [number, number], to: [number, number], width: number): THREE.Group {
  const g = new THREE.Group()
  const strip = new THREE.Mesh(
    new THREE.PlaneGeometry(width, Math.hypot(to[0] - from[0], to[1] - from[1])),
    M.wood('#F1F6FF', { grain: 0, diffuseStrength: 1.7, specular: { strength: 0 } }),
  )
  strip.rotation.x = -Math.PI / 2
  strip.castShadow = false
  strip.receiveShadow = false
  g.add(strip)
  g.position.set((from[0] + to[0]) / 2, 0.0022, (from[1] + to[1]) / 2)
  g.lookAt(to[0], 0.0022, to[1])
  return g
}

/** Toolbox — the token red, one of C's exactly-two red objects. */
function toolbox(v: VariantSpec, M: ReturnType<typeof mk>): THREE.Group {
  const g = new THREE.Group()
  const body = new THREE.Mesh(toyBlock(0.072, 0.045, 0.038, 0.007), M.paint(v.tokens.accent, { toy: 0.6 }))
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
    const M = mk(v)
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
      sun.shadow.camera.left = -1.2
      sun.shadow.camera.right = 1.2
      sun.shadow.camera.top = 1.2
      sun.shadow.camera.bottom = -1.2
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
      M.wood(darken(t.ground, 0.08), { grain: 0.25, grainScale: 0.25 }),
    )
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    scene.add(ground)
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(20, 4), M.wood(v.wallHex, { grain: 0.04, grainScale: 0.1, diffuseStrength: 0.9 }))
    wall.position.set(0, 1.6, -0.45)
    wall.receiveShadow = true
    scene.add(wall)

    const set = new THREE.Group()
    scene.add(set)
    set.add(concreteSlab(v, M, variant))

    // the track's line, shared by all three: straight down the room
    const trackA = new THREE.Vector3(0.0, 0.003, 0.34)
    const trackB = new THREE.Vector3(0.045, 0.003, -0.27)
    const trackMat = trackPlastic(t, GLOBAL_TOKENS.trackOrange, { toy: 0.2, fillStrength: v.fill })

    const heroCar = car(v, v.carHex)
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
      set.add(workbench(v, M, false).translateX(-0.24).translateZ(-0.26))
      const tw = toolWall(v, M)
      tw.position.set(-0.24, 0.44, -0.44)
      set.add(tw)
      set.add(can(v, M).translateX(-0.16).translateY(0.283).translateZ(-0.24))
      set.add(toolbox(v, M).translateX(0.2).translateY(0.004).translateZ(0.3))

      // the roller door + the blade of light from its gap
      const door = rollerDoor(v, M)
      door.position.set(0.31, 0, -0.442)
      set.add(door)
      set.add(sunBlade(v, M, [0.3, -0.42], [-0.2, 0.24], 0.034))

      // the dead bulb, swinging-frozen (static: a hair off plumb)
      const bulb = hangingBulb(v, M, false, 0.3)
      bulb.position.set(-0.02, 0.42, -0.05)
      bulb.rotation.z = 0.04
      set.add(bulb)

      // the parked wheel, stood up dead-centre on the straight: the tunnel
      const wheel = bikeWheel(v, M)
      wheel.position.set(0.045, 0.14, -0.283)
      set.add(wheel)
      set.add(tunnelShaft(M, [0.045, 0.02, -0.36], 0.034, 0.16))

      // the oil stain at the blade's dark edge; a tipped bucket + cardboards
      const stain = oilStain(v, M, 0.06, 0.042)
      stain.position.set(-0.035, 0.0025, -0.02)
      set.add(stain)
      const b = bucket(v, M, '#A08E72')
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
      set.add(nails(v, M, [0.22, 0.1], 10, 7103))

      placeCar(heroCar, trackA, trackB, 0.64, 0.0126)
      const second = car(v, '#0072BD')
      second.position.set(-0.1, 0.0126, -0.18)
      second.lookAt(0.045, 0.0126, -0.283)
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
    return { scene, camera, focus: [heroCar.position.x, heroCar.position.y + 0.01, heroCar.position.z], tokens: t }
  }
}

registerScene('garage-a', garageScene('a'))
registerScene('garage-b', garageScene('b'))
registerScene('garage-c', garageScene('c'))
