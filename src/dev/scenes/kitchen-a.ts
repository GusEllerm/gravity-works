// Stage 1 exploration — Environment Artist A: kitchen-counter style tile.
// "Sunday morning on the toy table": a monumental cereal bowl as the banked
// turn, a stack of books as the launch ramp, a dripping tap frozen mid-drip,
// and the lived-in debris of breakfast — toast with two bites gone, a mint
// mug that left its ring twice, a trail of crumbs, a pencil, and three
// sugar cubes pressed into service as a track support with one more cubed
// checkpoint on the landing straight. One gold key, long shadows tinted
// toward gold by the tokens; the shadow-side fill is nudged toward the
// kitchen's mint accent so the cool side of the ramp reads against the warm
// key. Six material classes, no new shaders, no animation (fixed clock).

import * as THREE from 'three'
import { bowlForm, toyBlock } from '../../render/geometry.ts'
import { ceramic, dieCastPaint, liquid, paintedWood, trackPlastic } from '../../render/materials.ts'
import { GLOBAL_TOKENS, SET_TOKENS, darken, mixHex } from '../../render/tokens.ts'
import { ToonMaterial } from '../../render/toon-material.ts'
import { registerScene, type SceneEntry, type SceneFactory } from '../registry.ts'

const tokens = SET_TOKENS.kitchen
const KEY_INTENSITY = 1.25

// Mint-leaning fill: the set's gold dominant cooled a touch toward its mint
// accent on the shadow side, so light reads warmer than shade by hue as well
// as value. Both values stay generated from tokens — nothing hand-picked.
const FILL_HIGH = mixHex(tokens.fillHigh, tokens.accent, 0.22)
const FILL_LOW = mixHex(darken(tokens.fillLow, 0.06), tokens.accent, 0.12)

// Small deterministic PRNG for crumb scatter (renders must be reproducible).
function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ---------------------------------------------------------------------------
// Local prop generators (scene-owned; not promoted to shared geometry)
// ---------------------------------------------------------------------------

/** Half-eaten toast: a rounded square with two bite scallops in one edge. */
function toastForm(): THREE.BufferGeometry {
  const hw = 0.023
  const cr = 0.0045
  const shape = new THREE.Shape()
  shape.moveTo(-hw + cr, -hw)
  shape.lineTo(hw - cr, -hw)
  shape.quadraticCurveTo(hw, -hw, hw, -hw + cr) // bottom-right corner
  // Right edge carries the two bites: inward (clockwise) scallops while the
  // outline travels +y, so each bite cuts into the slice.
  shape.lineTo(hw, -0.0155)
  shape.absarc(hw, -0.006, 0.0095, -Math.PI / 2, Math.PI / 2, true)
  shape.lineTo(hw, 0.005)
  shape.absarc(hw, 0.011, 0.006, -Math.PI / 2, Math.PI / 2, true)
  shape.lineTo(hw, hw - cr)
  shape.quadraticCurveTo(hw, hw, hw - cr, hw) // top-right corner
  shape.lineTo(-hw + cr, hw)
  shape.quadraticCurveTo(-hw, hw, -hw, hw - cr) // top-left corner
  shape.lineTo(-hw, -hw + cr)
  shape.quadraticCurveTo(-hw, -hw, -hw + cr, -hw) // bottom-left corner
  shape.closePath()
  const bevel = 0.0016
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.009 - 2 * bevel,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 2,
    curveSegments: 8,
    steps: 1,
  })
  geo.rotateX(-Math.PI / 2)
  geo.translate(0, bevel, 0)
  geo.computeVertexNormals()
  return geo
}

/** Mug lathe: straight tapered walls, a thick rim, a recessed inner floor. */
function mugForm(): THREE.BufferGeometry {
  const pts: THREE.Vector2[] = []
  pts.push(new THREE.Vector2(0.0001, 0))
  pts.push(new THREE.Vector2(0.023, 0))
  pts.push(new THREE.Vector2(0.025, 0.002))
  pts.push(new THREE.Vector2(0.03, 0.072)) // outer wall, slight flare
  pts.push(new THREE.Vector2(0.03, 0.075))
  pts.push(new THREE.Vector2(0.026, 0.075)) // rim top
  pts.push(new THREE.Vector2(0.026, 0.07))
  pts.push(new THREE.Vector2(0.0225, 0.05)) // inner wall
  pts.push(new THREE.Vector2(0.0225, 0.048))
  pts.push(new THREE.Vector2(0.0001, 0.046)) // inner floor
  const geo = new THREE.LatheGeometry(pts, 40)
  geo.computeVertexNormals()
  return geo
}

/** Teardrop lathe for the frozen drip (point up, belly down). */
function dripForm(): THREE.BufferGeometry {
  const pts: THREE.Vector2[] = [
    new THREE.Vector2(0.0001, 0.0085),
    new THREE.Vector2(0.0028, 0.0062),
    new THREE.Vector2(0.0048, 0.0036),
    new THREE.Vector2(0.0053, 0.0016),
    new THREE.Vector2(0.0038, 0.0002),
    new THREE.Vector2(0.0001, 0.0),
  ]
  const geo = new THREE.LatheGeometry(pts, 20)
  geo.computeVertexNormals()
  return geo
}

/**
 * Continuous banked turn: one smooth ribbon swept along the path with a
 * per-point bank angle. For the wrap we drop the rails and extrude the
 * channel's outer hull — a thick, chunky, fully-banked slab reads better
 * at thumbnail than hairline half-walls; the straights keep the U-channel.
 */
function bankedChannel(
  path: (t: number) => THREE.Vector3,
  rollAt: (t: number) => number,
  sections: number,
  width = 0.055,
  thickness = 0.012,
): THREE.BufferGeometry {
  const hw = width / 2
  const profile: ReadonlyArray<readonly [number, number]> = [
    [-hw, 0],
    [hw, 0],
    [hw, thickness],
    [-hw, thickness],
  ]
  const up = new THREE.Vector3(0, 1, 0)
  const rings: Array<{ c: THREE.Vector3; s: THREE.Vector3; u: THREE.Vector3 }> = []
  for (let i = 0; i <= sections; i++) {
    const t = i / sections
    const c = path(t)
    const d = path(Math.min(t + 0.001, 1))
      .sub(path(Math.max(t - 0.001, 0)))
      .normalize()
    const s = up.clone().cross(d).normalize()
    const u = d.clone().cross(s).normalize()
    const q = new THREE.Quaternion().setFromAxisAngle(d, rollAt(t))
    rings.push({ c, s: s.applyQuaternion(q), u: u.applyQuaternion(q) })
  }
  const pos: number[] = []
  const at = (i: number, k: number): THREE.Vector3 => {
    const r = rings[i]!
    const [pu, pv] = profile[k]!
    return r.c.clone().addScaledVector(r.s, pu).addScaledVector(r.u, pv)
  }
  for (let i = 0; i < sections; i++) {
    for (let k = 0; k < profile.length; k++) {
      const k2 = (k + 1) % profile.length
      const a = at(i, k)
      const b = at(i, k2)
      const c = at(i + 1, k2)
      const e = at(i + 1, k)
      pos.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z)
      pos.push(a.x, a.y, a.z, c.x, c.y, c.z, e.x, e.y, e.z)
    }
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  geo.computeVertexNormals()
  return geo
}

// ---------------------------------------------------------------------------
// The vignette
// ---------------------------------------------------------------------------

const straight =
  (a: THREE.Vector3, b: THREE.Vector3) =>
  (t: number): THREE.Vector3 =>
    a.clone().lerp(b, t)

function buildProps(mats: {
  track: ToonMaterial
  wood: (color: string, grain?: number) => ToonMaterial
  ceramic: (color: string) => ToonMaterial
}): THREE.Group {
  const group = new THREE.Group()

  // --- The bowl: the hero. Monumental ceramic, the banked turn's centre.
  const BOWL = new THREE.Vector3(0.02, 0, -0.02)
  const bowl = new THREE.Mesh(bowlForm(0.08, 0.052, 0.005), ceramic(tokens, '#F6EEDC', { fillHigh: FILL_HIGH, fillLow: FILL_LOW, rim: { strength: 0.24, size: 0.45 } }))
  bowl.material.side = THREE.DoubleSide
  bowl.position.copy(BOWL)
  bowl.castShadow = true
  bowl.receiveShadow = true
  group.add(bowl)

  // --- The banked turn: one thick ribbon hugging the rim, entering from the
  // right at theta 0 and sweeping the bowl's front, ending exactly where the
  // exit straight begins — a butt joint, the language of snapped track.
  const arcPoint = (t: number): THREE.Vector3 => {
    const theta = THREE.MathUtils.degToRad(100 * t)
    const r = 0.084 - 0.002 * Math.sin(Math.PI * t)
    const y = 0.056 - 0.003 * Math.sin(Math.PI * t)
    return new THREE.Vector3(BOWL.x + r * Math.cos(theta), y, BOWL.z + r * Math.sin(theta))
  }
  // Steep, narrow, lifted off the rim: at the low floor camera the bowl's
  // silhouette stays readable under the track instead of fusing with it.
  const bankAt = (): number => 0.62
  const arc = new THREE.Mesh(bankedChannel(arcPoint, bankAt, 96, 0.05, 0.009), mats.track)
  arc.castShadow = true
  arc.receiveShadow = true
  group.add(arc)

  // --- Book stack = launch ramp (four chunky painted-wood "books").
  const books = new THREE.Group()
  const bookSpecs = [
    { h: 0.024, yaw: 0.07, color: '#B95A33', dx: 0.004, dz: 0.002 },
    { h: 0.019, yaw: -0.05, color: '#EFE2C6', dx: -0.003, dz: 0.004 },
    { h: 0.027, yaw: 0.12, color: '#5FB49C', dx: 0.005, dz: -0.003 },
    { h: 0.018, yaw: 0.02, color: '#D89B45', dx: -0.004, dz: -0.005 },
  ]
  let by = 0
  for (const b of bookSpecs) {
    const book = new THREE.Mesh(toyBlock(0.135, b.h, 0.095, 0.0035), mats.wood(b.color, 0.15))
    book.position.set(b.dx, by + b.h / 2, b.dz)
    book.rotation.y = b.yaw
    book.castShadow = true
    book.receiveShadow = true
    books.add(book)
    by += b.h
  }
  books.position.set(0.335, 0, -0.02)
  group.add(books)

  // --- Entry: a flat launch section laid along the top book, then a
  // descending run whose bank ramps up to meet the ribbon's 0.62 rad at
  // theta 0 — a butt joint at the book's edge, the language of snapped track.
  const launchA = new THREE.Vector3(0.345, by + 0.003, -0.024)
  const launchB = new THREE.Vector3(0.262, by + 0.003, -0.024)
  const launch = new THREE.Mesh(
    bankedChannel(straight(launchA, launchB), () => 0.05, 4, 0.05, 0.009),
    mats.track,
  )
  launch.castShadow = true
  launch.receiveShadow = true
  group.add(launch)

  const entryB = arcPoint(0)
  const entry = new THREE.Mesh(
    bankedChannel(straight(launchB, entryB), (t) => 0.05 + (0.62 - 0.05) * t * t, 20, 0.05, 0.009),
    mats.track,
  )
  entry.castShadow = true
  entry.receiveShadow = true
  group.add(entry)

  // --- Exit run: same swept ribbon, banking back down from the ribbon's
  // 0.62 rad to nearly flat as it reaches the counter and the sugar-cube
  // checkpoint.
  const exitT = 1
  const exitP = arcPoint(exitT)
  const exitDir = arcPoint(Math.min(exitT + 0.01, 1)).sub(arcPoint(Math.max(exitT - 0.01, 0))).normalize()
  const exitFlat = new THREE.Vector3(exitDir.x, 0, exitDir.z).normalize()
  const exitEnd = new THREE.Vector3(exitP.x + exitFlat.x * 0.19, 0.0005, exitP.z + exitFlat.z * 0.19)
  const exitPath = straight(exitP, exitEnd)
  const exit = new THREE.Mesh(
    bankedChannel(exitPath, (t) => 0.62 - (0.62 - 0.06) * Math.min(1, t * 2.2), 16, 0.05, 0.009),
    mats.track,
  )
  exit.castShadow = true
  exit.receiveShadow = true
  group.add(exit)

  // --- The sugar cubes: a stack pressing under the exit ramp, one cubed
  // checkpoint on the landing, one fallen by the toast. The surprise.
  const cubeGeo = toyBlock(0.013, 0.013, 0.013, 0.0024)
  const cubeMat = mats.wood('#F4EADB', 0.0)
  const cubes = new THREE.InstancedMesh(cubeGeo, cubeMat, 5)
  cubes.castShadow = true
  cubes.receiveShadow = true
  const dummy = new THREE.Object3D()
  const u = 0.09 / 0.19
  const underX = exitP.x + exitFlat.x * 0.09
  const underZ = exitP.z + exitFlat.z * 0.09
  const underY = exitP.y + (exitEnd.y - exitP.y) * u
  const cubePlacements: Array<[number, number, number, number]> = [
    // x, z, y (center), yaw — the support stack, top cube "springy" into the track
    [underX, underZ, 0.0065, 0.12],
    [underX, underZ, 0.019, -0.18],
    [underX, underZ, underY - 0.0035, 0.42],
    // checkpoint cube on the track near the end
    [exitP.x + exitFlat.x * 0.155, exitP.z + exitFlat.z * 0.155, exitP.y + (exitEnd.y - exitP.y) * (0.155 / 0.19) + 0.0075, 0.5],
    // one fallen from the packet, by the toast
    [0.21, -0.11, 0.0065, 0.7],
  ]
  cubePlacements.forEach(([x, z, y, yaw], i) => {
    dummy.position.set(x, y, z)
    dummy.rotation.set(0, yaw, 0)
    dummy.updateMatrix()
    cubes.setMatrixAt(i, dummy.matrix)
  })
  dummy.rotation.set(0, 0, 0)
  group.add(cubes)

  // --- The tap, mid-drip: a gooseneck tube, a mint lever, a liquid teardrop
  // frozen in the air and the wet patch it has already made.
  const tap = new THREE.Group()
  const metal = dieCastPaint(tokens, '#AD9F85', { fillHigh: FILL_HIGH, fillLow: FILL_LOW })
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.017, 0.019, 0.008, 24), metal)
  base.position.set(0, 0.004, 0)
  base.castShadow = true
  tap.add(base)
  const spout = new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.0, 0),
      new THREE.Vector3(0, 0.09, 0),
      new THREE.Vector3(0, 0.124, 0.006),
      new THREE.Vector3(0, 0.128, 0.022),
      new THREE.Vector3(0, 0.118, 0.036),
    ]),
    36,
    0.0075,
    12,
    false,
  )
  const spoutMesh = new THREE.Mesh(spout, metal)
  spoutMesh.castShadow = true
  tap.add(spoutMesh)
  const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.0085, 0.0095, 0.014, 14), dieCastPaint(tokens, tokens.accent, { fillHigh: FILL_HIGH, fillLow: FILL_LOW }))
  knob.position.set(0, 0.133, 0.004)
  knob.castShadow = true
  tap.add(knob)
  const lever = new THREE.Mesh(toyBlock(0.03, 0.005, 0.008, 0.0025), metal)
  lever.position.set(0.019, 0.138, 0.004)
  lever.rotation.z = -0.16
  lever.castShadow = true
  tap.add(lever)
  tap.position.set(-0.05, 0, -0.26)
  group.add(tap)

  const waterMat = liquid(tokens, mixHex(tokens.fillHigh, tokens.accent, 0.28), { fillHigh: FILL_HIGH, fillLow: FILL_LOW, liquid: 0.2 })
  const drip = new THREE.Mesh(dripForm(), waterMat)
  drip.position.set(-0.05, 0.066, -0.224)
  drip.scale.setScalar(1.35)
  group.add(drip)

  const patch = new THREE.Mesh(new THREE.CircleGeometry(0.034, 28), liquid(tokens, mixHex(darken(tokens.ground, 0.26), tokens.accent, 0.28), { fillHigh: FILL_HIGH, fillLow: FILL_LOW, liquid: 0.25, opacity: 1 }))
  patch.rotation.x = -Math.PI / 2
  patch.rotation.z = 0.7
  patch.scale.set(1.25, 0.8, 1)
  patch.position.set(-0.05, 0.0016, -0.222)
  group.add(patch)

  // --- Mug, twice-ringed: mint ceramic (the fridge echo), coffee surface.
  const mug = new THREE.Mesh(mugForm(), mats.ceramic(tokens.accent))
  mug.position.set(0.27, 0, 0.13)
  mug.rotation.y = -1.2
  mug.castShadow = true
  mug.receiveShadow = true
  group.add(mug)
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.016, 0.0045, 10, 24), mats.ceramic(tokens.accent))
  handle.position.set(0.27 + 0.031, 0.045, 0.13)
  handle.rotation.y = Math.PI / 2 - 1.2
  handle.castShadow = true
  group.add(handle)
  const coffee = new THREE.Mesh(new THREE.CircleGeometry(0.0215, 28), liquid(tokens, '#9A5B33', { fillHigh: FILL_HIGH, fillLow: FILL_LOW, liquid: 0.12 }))
  coffee.rotation.x = -Math.PI / 2
  coffee.position.set(0.27, 0.06, 0.13)
  group.add(coffee)

  // Two rings where the mug has sat: one by its shoulder, one back by the
  // toast — the mug has been carried across the whole table this morning.
  const ringMat = paintedWood(tokens, '#BE8B52', { grain: 0.04, fillHigh: FILL_HIGH, fillLow: FILL_LOW, ramp: { steps: [0.72, 1.0], thresholds: [0.5], softness: 0.3 } })
  const ringGeo = new THREE.RingGeometry(0.0235, 0.029, 44)
  for (const [rx, rz, ry] of [[0.215, 0.175, 0.3], [0.135, -0.075, 1.1]] as const) {
    const ring = new THREE.Mesh(ringGeo, ringMat)
    ring.rotation.x = -Math.PI / 2
    ring.rotation.z = ry
    ring.position.set(rx, 0.0017, rz)
    group.add(ring)
  }

  // --- The toast, half gone, set down beside the mug.
  const toast = new THREE.Mesh(toastForm(), mats.wood('#D89C50', 0.5))
  toast.position.set(0.145, 0.004, -0.1)
  toast.rotation.y = -0.5
  toast.castShadow = true
  toast.receiveShadow = true
  group.add(toast)

  // --- Pencil, left where it was dropped, yawed across the crumb trail.
  const pencil = new THREE.Group()
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.0038, 0.0038, 0.125, 6), mats.wood('#E8B34E', 0.08))
  body.rotation.z = Math.PI / 2
  body.castShadow = true
  pencil.add(body)
  const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.0005, 0.0038, 0.014, 6), mats.wood('#D9A867', 0))
  tip.rotation.z = -Math.PI / 2
  tip.position.x = 0.0695
  pencil.add(tip)
  const graphite = new THREE.Mesh(new THREE.CylinderGeometry(0.0004, 0.0011, 0.005, 6), paintedWood(tokens, '#4A3F35', { grain: 0, fillHigh: FILL_HIGH, fillLow: FILL_LOW }))
  graphite.rotation.z = -Math.PI / 2
  graphite.position.x = 0.076
  pencil.add(graphite)
  const ferrule = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.008, 10), metal)
  ferrule.rotation.z = Math.PI / 2
  ferrule.position.x = -0.066
  pencil.add(ferrule)
  const eraser = new THREE.Mesh(new THREE.CylinderGeometry(0.0038, 0.0038, 0.007, 10), mats.ceramic('#DD9A84'))
  eraser.rotation.z = Math.PI / 2
  eraser.position.x = -0.073
  pencil.add(eraser)
  pencil.position.set(-0.05, 0.0039, 0.185)
  pencil.rotation.y = -0.4
  group.add(pencil)

  // --- Crumb trail from the toast to the landing straight, plus a few
  // cereal loops spilled near the books. Both instanced.
  const rng = mulberry32(7)
  const crumb = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.0024, 0), mats.wood('#C89050', 0), 26)
  crumb.castShadow = true
  let ci = 0
  const placeCrumb = (x: number, z: number, s: number): void => {
    dummy.position.set(x, 0.0018 + 0.001 * s, z)
    dummy.rotation.set(rng() * 3, rng() * 3, rng() * 3)
    dummy.scale.setScalar(0.6 + s * 0.7)
    dummy.updateMatrix()
    crumb.setMatrixAt(ci++, dummy.matrix)
  }
  for (let i = 0; i < 18; i++) {
    const t = i / 17
    // quadratic bezier: toast, right of the bowl -> clearing the front -> pencil
    const x = (1 - t) * (1 - t) * 0.145 + 2 * (1 - t) * t * 0.03 + t * t * -0.045
    const z = (1 - t) * (1 - t) * -0.1 + 2 * (1 - t) * t * 0.17 + t * t * 0.185
    placeCrumb(x + (rng() - 0.5) * 0.018, z + (rng() - 0.5) * 0.018, rng())
  }
  for (let i = 0; i < 8; i++) {
    placeCrumb(0.24 + rng() * 0.06 - 0.03, -0.075 + rng() * 0.06, rng() * 0.7)
  }
  dummy.scale.setScalar(1)
  group.add(crumb)

  const loopGeo = new THREE.TorusGeometry(0.0055, 0.0024, 8, 16)
  const loops = new THREE.InstancedMesh(loopGeo, mats.wood('#E3A54E', 0.1), 4)
  loops.castShadow = true
  const loopAt: Array<[number, number, number]> = [[0.235, -0.088, 0.2], [0.22, -0.072, 1.1], [0.252, -0.062, 2.3], [0.207, -0.101, 0.8]]
  loopAt.forEach(([lx, lz, ly], i) => {
    dummy.position.set(lx, 0.0024, lz)
    dummy.rotation.set(Math.PI / 2, 0, ly)
    dummy.updateMatrix()
    loops.setMatrixAt(i, dummy.matrix)
  })
  dummy.rotation.set(0, 0, 0)
  group.add(loops)

  // --- The cereal box, half behind the scene: the bible's cliff, and the
  // back-left silhouette the establishing shot is missing.
  const box = new THREE.Group()
  const carton = new THREE.Mesh(toyBlock(0.16, 0.21, 0.055, 0.006), mats.wood('#E9B13F', 0.12))
  carton.castShadow = true
  carton.receiveShadow = true
  box.add(carton)
  const band = new THREE.Mesh(new THREE.BoxGeometry(0.135, 0.038, 0.002), ceramic(tokens, tokens.accent, { fillHigh: FILL_HIGH, fillLow: FILL_LOW }))
  band.position.set(0, 0.045, 0.029)
  box.add(band)
  box.position.set(-0.24, 0, -0.23)
  box.rotation.y = 0.65
  group.add(box)

  return group
}

function kitchenScene(): SceneFactory {
  return (ctx): SceneEntry => {
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(tokens.background)

    // One gold key, low enough for long breakfast shadows cast across frame
    // from the left (the window is behind us and to the left).
    const key = new THREE.DirectionalLight(GLOBAL_TOKENS.keyLight, KEY_INTENSITY)
    key.position.set(-0.62, 0.26, 0.5)
    key.castShadow = true
    key.shadow.mapSize.set(2048, 2048)
    key.shadow.camera.left = -0.9
    key.shadow.camera.right = 0.9
    key.shadow.camera.top = 0.9
    key.shadow.camera.bottom = -0.9
    key.shadow.camera.near = 0.1
    key.shadow.camera.far = 3
    key.shadow.bias = -0.0003
    key.shadow.normalBias = 0.008
    key.shadow.radius = 3
    scene.add(key)

    // Counter: warm wood with the token ground color, the grain generator
    // quietly running so the big floor shape is never flat.
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(0.9, 64),
      paintedWood(tokens, tokens.ground, { grain: 0.35, fillHigh: FILL_HIGH, fillLow: FILL_LOW }),
    )
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    scene.add(ground)

    const trackMat = trackPlastic(tokens, GLOBAL_TOKENS.trackOrange, { fillHigh: FILL_HIGH, fillLow: FILL_LOW })
    const woodCache = new Map<string, ToonMaterial>
    const woodMats = (color: string, grain = 0.5): ToonMaterial => {
      const key = `${color}:${grain}`
      let m = woodCache.get(key)
      if (!m) {
        m = paintedWood(tokens, color, { grain, fillHigh: FILL_HIGH, fillLow: FILL_LOW })
        woodCache.set(key, m)
      }
      return m
    }
    const ceramicMats = (color: string): ToonMaterial =>
      ceramic(tokens, color, { fillHigh: FILL_HIGH, fillLow: FILL_LOW })

    scene.add(buildProps({ track: trackMat, wood: woodMats, ceramic: ceramicMats }))

    // Tell every ToonMaterial the key light so dark bands tint, not blacken.
    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
        for (const m of mats) {
          if (m instanceof ToonMaterial) m.setKeyLight(GLOBAL_TOKENS.keyLight, KEY_INTENSITY)
        }
      }
    })

    const camera = new THREE.PerspectiveCamera(ctx.rig.fov, 16 / 9, ctx.rig.near, ctx.rig.far)
    camera.position.set(...ctx.rig.position)
    camera.lookAt(new THREE.Vector3(...ctx.rig.target))
    return { scene, camera }
  }
}

registerScene('kitchen-a', kitchenScene())
