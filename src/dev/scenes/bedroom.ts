// Stage 4 exploration — Environment Artist, bedroom set, three variants.
//
// The bedroom at 1:64: the floor beside the bed is a canyon, a pillow is a
// plateau, a stack of picture books is a pyramid, a charging cable is a
// snake you hop over, and an overturned mug is a tunnel. One toy track runs
// STRAIGHT through each variant; what changes is the three things a set
// chooses: material story, light, palette.
//
//   A — carpet pile (fabric with pile toy/grain + instanced tufts), morning
//       sunbeam through a curtained window, amber-dominant with indigo shade.
//   B — hardwood planks (painted wood, long low-frequency grain + seams),
//       lamp-lit dusk from a floor lamp at frame right, deep indigo palette.
//   C — duvet fabric as terrain (a displaced stitch-seamed bedspread you
//       drive over), pre-dawn nightlight key low and dim, indigo + amber.
//
// Conventions borrowed from src/sets/kitchen (materials, rig, scale
// discipline, stain-free flat walls); the palette is NOT borrowed — the
// kitchen is gold, the bedroom is indigo (art bible §Light: nightlight).
// Static: fixed clock, nothing animates. Throwaway dev scene.

import * as THREE from 'three'
import { ceramic, dieCastPaint, fabric, paintedWood, trackPlastic } from '../../render/materials.ts'
import { toyBlock, trackChannel } from '../../render/geometry.ts'
import { createLightingRig, applyKeyLight, fillFromRig } from '../../render/lighting.ts'
import type { LightingRig } from '../../render/lighting.ts'
import { GLOBAL_TOKENS, SET_TOKENS, clampLightness, darken, mixHex } from '../../render/tokens.ts'
import { registerScene, type SceneEntry, type SceneFactory } from '../registry.ts'

const tokens = SET_TOKENS.bedroom

/** Deterministic pseudo-random (fixed seed — the clock never moves). */
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

// The straight toy track every variant is threaded through (world units,
// kitchen scale): a diagonal across the floor beside the bed.
const TRACK_A = new THREE.Vector3(-0.32, 0, 0.17)
const TRACK_B = new THREE.Vector3(0.32, 0, -0.12)
const trackDir = TRACK_B.clone().sub(TRACK_A).normalize()
/** Point on the track line at parameter t (0 = far left, 1 = right edge). */
function trackAt(t: number, y = 0): THREE.Vector3 {
  return TRACK_A.clone().lerp(TRACK_B, t).setY(y)
}
// yaw that maps a prop's local +x onto the track direction (props are
// authored length-along-x; TRACK_YAW is the lookAt-style +z convention)
const TRACK_XYAW = Math.atan2(-trackDir.z, trackDir.x)

// ---- shared props -----------------------------------------------------

/** The ratified car trim (cars.ts conventions): chunky beveled body, fat
 *  wheels outside the flanks, one raised cream stripe, Okabe-Ito seed. */
function car(colorHex: string, fill: FillBag): THREE.Group {
  const g = new THREE.Group()
  const body = new THREE.Mesh(toyBlock(0.075, 0.028, 0.034, 0.01, 0.004), dieCastPaint(tokens, colorHex, { ...fill, toy: 0.4 }))
  props(body)
  g.add(body)
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.062, 0.004, 0.011), dieCastPaint(tokens, '#F6E9D2', fill))
  stripe.position.y = 0.027
  g.add(stripe)
  const wheelGeo = new THREE.CylinderGeometry(0.009, 0.009, 0.006, 18)
  wheelGeo.rotateX(Math.PI / 2)
  const wheelMat = fabric(tokens, clampLightness('#4A3527'), { ...fill, rim: { strength: 0.25, size: 0.6 } })
  for (const [x, z] of [[0.024, 0.017], [-0.024, 0.017], [0.024, -0.017], [-0.024, -0.017]] as const) {
    const w = new THREE.Mesh(wheelGeo, wheelMat)
    w.position.set(x, 0.009, z)
    props(w, true, false)
    g.add(w)
  }
  g.scale.setScalar(0.62)
  return g
}

/** Park a car on the track groove floor at parameter t. */
function carOnTrack(colorHex: string, t: number, fill: FillBag): THREE.Group {
  const c = car(colorHex, fill)
  c.position.copy(trackAt(t, 0.0045))
  c.rotation.y = TRACK_XYAW
  return c
}

/** Straight orange track run between two points (deck bottom on y=0 plane). */
function trackRun(mat: THREE.Material): THREE.Mesh {
  const mid = TRACK_A.clone().lerp(TRACK_B, 0.5)
  const m = new THREE.Mesh(trackChannel(TRACK_A.distanceTo(TRACK_B) - 0.008), mat)
  m.position.copy(mid)
  m.lookAt(TRACK_B)
  props(m)
  return m
}

/** Overturned mug — the tunnel. Axis laid along the track, mouth facing
 *  down-track so the tunnel runs straight through the prop. */
function mugTunnel(fill: FillBag, scale: number, mouthDownTrack = false, color = '#E2D3E4'): THREE.Group {
  const outer = new THREE.Group()
  const yaw = new THREE.Group()
  // the group origin is the closed end; the mouth sits 0.102*scale along the
  // mug axis. Default: mouth faces UP-track toward the arriving car.
  yaw.rotation.y = mouthDownTrack ? TRACK_XYAW : TRACK_XYAW + Math.PI
  outer.add(yaw)
  const mat = ceramic(tokens, color, fill) // pale lilac bedroom mug
  mat.side = THREE.DoubleSide
  const g = new THREE.Group()
  g.scale.setScalar(scale)
  const pts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.031, 0.0),
    new THREE.Vector2(0.033, 0.004),
    new THREE.Vector2(0.034, 0.055),
    new THREE.Vector2(0.035, 0.066),
    new THREE.Vector2(0.030, 0.066),
    new THREE.Vector2(0.029, 0.008),
    new THREE.Vector2(0.0, 0.008),
  ]
  const body = new THREE.Mesh(new THREE.LatheGeometry(pts, 40), mat)
  body.rotation.z = -Math.PI / 2 // +y (mouth) -> +x before yaw
  props(body)
  g.add(body)
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.016, 0.0045, 10, 24), ceramic(tokens, color, fill))
  handle.rotation.y = Math.PI / 2
  handle.position.set(0, 0.038, -0.036) // sticks up-track, clear of the bore
  props(handle)
  g.add(handle)
  yaw.add(g)
  return outer
}

/** Charging-cable snake: a white rubber tube snaking along a curve. The
 *  optional bump parameter lifts the cable over the track deck — a speed
 *  bump the car pops over. */
function cableSnake(points: Array<[number, number, number]>, fill: FillBag, headAtEnd = true): THREE.Group {
  const g = new THREE.Group()
  const curve = new THREE.CatmullRomCurve3(points.map(([x, y, z]) => new THREE.Vector3(x, y, z)))
  const cord = new THREE.Mesh(new THREE.TubeGeometry(curve, 72, 0.0075, 10, false), fabric(tokens, '#EFEAE2', { ...fill, rim: { strength: 0.55, size: 0.85, color: '#FFF1DA' } }))
  props(cord)
  g.add(cord)
  if (headAtEnd) {
    const p = curve.getPointAt(1)
    const tan = curve.getTangentAt(1)
    const head = new THREE.Mesh(toyBlock(0.026, 0.011, 0.013, 0.004), dieCastPaint(tokens, '#CFC9BE', { ...fill, toy: 0.4 }))
    head.position.copy(p).addScaledVector(tan, 0.014)
    head.lookAt(p.clone().add(tan))
    props(head)
    g.add(head)
  }
  return g
}

/** Pillow plateau: one chunky seam-beaded cushion. */
function pillow(fill: FillBag): THREE.Group {
  const g = new THREE.Group()
  const cushion = new THREE.Mesh(toyBlock(0.27, 0.082, 0.2, 0.05, 0.028, 8), fabric(tokens, '#E7DFC9', { ...fill, rim: { strength: 0.45, size: 0.8, color: '#FFF1DA' } }))
  props(cushion)
  g.add(cushion)
  const seam = new THREE.Mesh(new THREE.TorusGeometry(0.105, 0.006, 8, 40), fabric(tokens, '#E3D8C4', fill))
  seam.rotation.x = -Math.PI / 2
  seam.scale.set(1.24, 1, 0.92)
  seam.position.y = 0.041
  props(seam)
  g.add(seam)
  return g
}

/** Book pyramid: a ziggurat of picture books (n, n-1, ... 1 rows square).
 *  Books lean a little — someone stacked this, a bookcase did not. */
function bookPyramid(base: number, fill: FillBag, seed: number, palette: string[]): THREE.Group {
  const g = new THREE.Group()
  const rnd = makeRng(seed)
  const h = 0.017
  const foot = 0.052
  let y = 0
  for (let k = 0; k < base; k++) {
    const n = base - k
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const b = new THREE.Mesh(toyBlock(foot, h, foot * 0.82, 0.004, 0.0015), paintedWood(tokens, palette[(k + i + j) % palette.length]!, { ...fill, grain: 0.45 }))
        b.position.set((i - (n - 1) / 2) * foot * 1.12, y + h / 2, (j - (n - 1) / 2) * foot * 0.94)
        b.rotation.y = (rnd() - 0.5) * 0.16
        props(b)
        g.add(b)
      }
    }
    y += h
  }
  return g
}

/** One leaning book — the ramp a pyramid always offers the track. */
function rampBook(fill: FillBag, color: string): THREE.Mesh {
  const b = new THREE.Mesh(toyBlock(0.16, 0.015, 0.115, 0.004, 0.0015), paintedWood(tokens, color, { ...fill, grain: 0.5 }))
  props(b)
  return b
}

// ---- variant scenes ----------------------------------------------------

type FillBag = ReturnType<typeof fillFromRig>

function groundWall(scene: THREE.Scene, wallColor: string, fill: FillBag): void {
  // flat cream-indigo wall behind — catches long shadows, never a gradient
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(20, 4), paintedWood(tokens, wallColor, { ...fill, grain: 0.06, grainScale: 0.05, diffuseStrength: 0.85 }))
  wall.position.set(0, 1.6, -0.6)
  wall.receiveShadow = true
  scene.add(wall)
}

function shell(keyPos: readonly [number, number, number], keyIntensity: number, accentMix: number, fillStrength: number, background: string): { scene: THREE.Scene; fill: FillBag; rig: LightingRig } {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(background)
  const rig = createLightingRig(tokens, { keyIntensity, keyPosition: keyPos, accentMix, fillStrength, shadowRadius: 4 })
  scene.add(rig.key)
  return { scene, fill: fillFromRig(rig), rig }
}

function finish(scene: THREE.Scene, rig: LightingRig): void {
  applyKeyLight(scene, rig)
}

function camera(ctx: { rig: { position: [number, number, number]; target: [number, number, number]; fov: number; near: number; far: number } }): THREE.PerspectiveCamera {
  const c = new THREE.PerspectiveCamera(ctx.rig.fov, 16 / 9, ctx.rig.near, ctx.rig.far)
  c.position.set(...ctx.rig.position)
  c.lookAt(new THREE.Vector3(...ctx.rig.target))
  return c
}

// ---- variant A: carpet pile, morning sunbeam, amber --------------------

function bedroomA(): SceneFactory {
  return (ctx): SceneEntry => {
    // morning sun, low from the curtained window at frame right
    const { scene, fill, rig } = shell([1.2, 0.3, 0.2], 1.0, 0.45, 0.32, mixHex(tokens.background, tokens.accent, 0.2))
    groundWall(scene, mixHex(tokens.background, tokens.accent, 0.25), fill)

    // carpet pile — fabric class with the toy/grain pile mottle; the pile
    // story is VISUAL only (grip is a playtest question, not a shader)
    const carpet = new THREE.Mesh(
      new THREE.CircleGeometry(1.4, 72),
      fabric(tokens, '#B77F4C', { ...fill, toy: 0.3, grain: 0.35, grainScale: 0.35, rim: { strength: 0.45, size: 0.9, color: '#FFE0AE' } }),
    )
    carpet.rotation.x = -Math.PI / 2
    carpet.receiveShadow = true
    scene.add(carpet)

    // instanced carpet tufts reading as pile where the sun grazes the track
    const tufts = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.006, 0), fabric(tokens, '#DCAE7C', { ...fill, toy: 0.2, grain: 0.2 }), 90)
    {
      const d = new THREE.Object3D()
      const rnd = makeRng(401)
      for (let i = 0; i < 90; i++) {
        const t = rnd() * 0.6
        const p = trackAt(t)
        d.position.set(p.x + (rnd() - 0.5) * 0.02, 0.001, p.z - (0.05 + rnd() * 0.12)) // far side only: the floor camera lives here
        d.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3)
        d.scale.set(0.35, 0.25, 0.35)
        d.updateMatrix()
        tufts.setMatrixAt(i, d.matrix)
      }
    }
    props(tufts, false)
    scene.add(tufts)

    // anchor: the bed edge up-left — the cliff this whole floor sits beside
    const bed = new THREE.Group()
    const mattress = new THREE.Mesh(toyBlock(1.15, 0.2, 0.72, 0.05, 0.02, 8), fabric(tokens, '#CDBDD4', fill))
    props(mattress)
    bed.add(mattress)
    const sheet = new THREE.Mesh(toyBlock(1.1, 0.03, 0.66, 0.04, 0.012, 6), fabric(tokens, tokens.accent, { ...fill, rim: { strength: 0.5, size: 0.7 } }))
    sheet.position.set(-0.06, 0.205, 0.03)
    sheet.rotation.y = 0.04
    props(sheet)
    bed.add(sheet)
    bed.position.set(-0.72, 0, -0.62)
    bed.rotation.y = 0.48
    scene.add(bed)

    // morning curtains at frame right — the gap throws the sunbeam lane
    for (const [z, w] of [[-0.62, 0.62], [0.62, 0.62]] as const) {
      const cur = new THREE.Mesh(new THREE.PlaneGeometry(w, 1.5), fabric(tokens, '#F5EBD8', { ...fill, rim: { strength: 0.35, size: 0.6 } }))
      cur.material.side = THREE.DoubleSide
      cur.position.set(0.58, 0.7, z)
      cur.rotation.y = -Math.PI / 2 - 0.12
      cur.receiveShadow = true
      scene.add(cur)
    }

    // terrain: pillow plateau down-right, cable snake speed bump on the
    // track, overturned mug tunnel up-track
    const pil = pillow(fill)
    pil.position.set(0.3, 0.041, -0.32)
    pil.rotation.y = -0.5
    scene.add(pil)

    const mug = mugTunnel(fill, 1.35, false)
    mug.position.copy(trackAt(0.36, 0.0505)) // mouth up-track at t~0.20; flank toward the floor camera
    scene.add(mug)

    const cable = cableSnake(
      [
        [0.44, 0.0075, -0.3],
        [0.3, 0.0075, -0.15],
        [0.16, 0.018, -0.047], // lifted: the speed bump across the track
        [0.08, 0.0075, -0.14],
        [-0.04, 0.0075, -0.24],
      ],
      fill,
    )
    scene.add(cable)

    const trackMat = trackPlastic(tokens, GLOBAL_TOKENS.trackOrange, { ...fill, toy: 0.2 })
    scene.add(trackRun(trackMat))

    // car past the tunnel, in the sharp band, tunnel behind it
    scene.add(carOnTrack('#1F6FB6', 0.62, fill))

    // lived-in: a lost toy block by the pillow, a dust bunny in its shade
    const block = new THREE.Mesh(toyBlock(0.02, 0.02, 0.02, 0.004), dieCastPaint(tokens, tokens.accent, { ...fill, toy: 0.5 }))
    block.position.set(0.17, 0.01, -0.22)
    block.rotation.y = 0.7
    props(block)
    scene.add(block)
    const bunny = new THREE.Mesh(new THREE.IcosahedronGeometry(0.012, 1), fabric(tokens, '#E8DCC6', { ...fill, rim: { strength: 0.6, size: 0.9 } }))
    bunny.position.set(0.15, 0.008, -0.42)
    bunny.scale.set(1.2, 0.6, 1)
    props(bunny)
    scene.add(bunny)

    finish(scene, rig)
    return { scene, camera: camera(ctx), focus: [trackAt(0.21, 0.02).x, 0.02, trackAt(0.21, 0.02).z], tokens }
  }
}

// ---- variant B: hardwood, lamp-lit dusk, deep indigo --------------------

function bedroomB(): SceneFactory {
  return (ctx): SceneEntry => {
    // one floor lamp at frame right, barely above the floor — dusk room,
    // long lamp shadows, indigo everywhere the light does not reach
    const { scene, fill, rig } = shell([0.2, 0.24, -0.14], 0.95, 0.16, 0.2, darken(mixHex(tokens.background, tokens.dominant, 0.5), 0.3))
    groundWall(scene, darken(tokens.background, 0.22), fill)

    // hardwood floor: warm-cool oak boards with hairline seams
    const boards = new THREE.Group()
    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(1.4, 72),
      paintedWood(tokens, '#A8804F', { ...fill, grain: 0.55, grainScale: 0.06 }),
    )
    floor.rotation.x = -Math.PI / 2
    floor.receiveShadow = true
    boards.add(floor)
    for (let i = -4; i <= 4; i++) {
      const seam = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.0015, 0.0035), paintedWood(tokens, darken('#A8804F', 0.28), { ...fill, grain: 0 }))
      seam.position.set(0, 0.0008, i * 0.175 + 0.05)
      seam.receiveShadow = true
      boards.add(seam)
    }
    scene.add(boards)

    // anchor: the desk — two chunky legs and a crossbeam; the desktop
    // itself lives above the frame, and the lamp stands at its foot
    function deskLeg(x: number, z: number): void {
      const leg = new THREE.Mesh(toyBlock(0.085, 0.5, 0.085, 0.014, 0.006), paintedWood(tokens, '#9A7549', { ...fill, grain: 0.5, grainScale: 0.3 }))
      leg.position.set(x, 0.25, z)
      props(leg)
      scene.add(leg)
    }
    deskLeg(0.30, -0.3)
    deskLeg(0.52, -0.12)
    // the desktop lives above the frame; no crossbeam — a beam between two
    // off-frame legs reads as floating furniture at the canonical cameras

    // the lamp itself — the set's single light, standing in it
    const lamp = new THREE.Group()
    const brass = dieCastPaint(tokens, '#C9A45E', { ...fill, toy: 0.5 })
    const lbase = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.058, 0.014, 28), brass)
    lbase.position.y = 0.007
    props(lbase)
    lamp.add(lbase)
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.22, 12), brass)
    pole.position.y = 0.12
    props(pole)
    lamp.add(pole)
    const shade = new THREE.Mesh(new THREE.ConeGeometry(0.062, 0.055, 26, 1, true), ceramic(tokens, '#F0C878', { ...fill, diffuseStrength: 1.15 }))
    shade.material.side = THREE.DoubleSide
    shade.position.y = 0.25
    props(shade, false, false)
    lamp.add(shade)
    const glow = new THREE.Mesh(new THREE.CircleGeometry(0.034, 24), paintedWood(tokens, '#FFDFA0', { ...fill, grain: 0, diffuseStrength: 1.35 }))
    glow.rotation.x = Math.PI / 2
    glow.position.y = 0.226
    lamp.add(glow)
    lamp.position.set(0.2, 0, -0.16)
    lamp.rotation.y = -0.4
    scene.add(lamp)

    // terrain: book pyramid mid-left with one book leaning to the track as
    // its ramp; the cable snake dozes in a coil beside it
    const pyr = bookPyramid(3, fill, 707, ['#4A4F9E', '#E4D8BE', '#DFA24A'])
    pyr.position.set(-0.14, 0, -0.05)
    pyr.rotation.y = 0.35
    scene.add(pyr)
    const ramp = rampBook(fill, '#C4B493')
    ramp.rotation.order = 'YXZ'
    ramp.position.set(-0.145, 0.022, 0.045)
    ramp.rotation.set(0.33, 1.69, 0) // high end on the second tier, low end welded to the deck
    scene.add(ramp)

    const cable = cableSnake(
      [
        [0.28, 0.0075, -0.3],
        [0.1, 0.0075, -0.26],
        [-0.02, 0.0075, -0.32],
        [-0.05, 0.04, -0.4],
        [-0.02, 0.07, -0.45], // the snake sits up, facing the track
      ],
      fill,
    )
    scene.add(cable)

    // bed foot peeks in at back left — the anchor is a leg, the bed a wall
    const footboard = new THREE.Group()
    const rail = new THREE.Mesh(toyBlock(0.85, 0.13, 0.045, 0.02, 0.008), paintedWood(tokens, '#9A7549', { ...fill, grain: 0.5, grainScale: 0.3 }))
    rail.position.y = 0.15
    props(rail)
    footboard.add(rail)
    for (const px of [-0.38, 0.38]) {
      const post = new THREE.Mesh(toyBlock(0.045, 0.22, 0.045, 0.012, 0.005), paintedWood(tokens, '#8F6C42', { ...fill, grain: 0.5, grainScale: 0.5 }))
      post.position.set(px, 0.11, 0)
      props(post)
      footboard.add(post)
    }
    footboard.position.set(-0.5, 0, -0.55)
    footboard.rotation.y = 0.4
    scene.add(footboard)

    const trackMat = trackPlastic(tokens, GLOBAL_TOKENS.trackOrange, { ...fill, toy: 0.2 })
    scene.add(trackRun(trackMat))

    scene.add(carOnTrack('#1D9A74', 0.55, fill))

    // lived-in: the kid's homework, abandoned mid-sentence under the lamp
    const notebook = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.004, 0.15), paintedWood(tokens, '#DDD2BA', { ...fill, grain: 0.08 }))
    notebook.position.set(0.1, 0.002, -0.34)
    notebook.rotation.y = 0.3
    notebook.receiveShadow = true
    scene.add(notebook)
    const pencil = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.09, 6), paintedWood(tokens, '#EFC23A', { ...fill, grain: 0.3 }))
    pencil.position.set(0.14, 0.005, -0.29)
    pencil.rotation.set(Math.PI / 2, 0, 0.9)
    props(pencil)
    scene.add(pencil)

    finish(scene, rig)
    const p = trackAt(0.55)
    return { scene, camera: camera(ctx), focus: [p.x, 0.02, p.z], tokens }
  }
}

// ---- variant C: duvet terrain, pre-dawn nightlight, indigo + amber ------

function bedroomC(): SceneFactory {
  return (ctx): SceneEntry => {
    // the whole floor IS the bed: a duvet you drive over, lit by the amber
    // nightlight low at frame right in the last hour before dawn
    const { scene, fill, rig } = shell([0.45, 0.16, -0.25], 0.95, 0.55, 0.26, darken(mixHex(tokens.background, tokens.dominant, 0.55), 0.3))
    groundWall(scene, darken(mixHex(tokens.background, tokens.dominant, 0.6), 0.12), fill)

    // duvet terrain: soft-body LOOK only — sine quilting that flattens
    // along the track line so the track itself stays straight
    function quilt(x: number, z: number): number {
      const mid = new THREE.Vector3(x, 0, z)
      const d = Math.abs(new THREE.Vector3().crossVectors(trackDir, mid.clone().sub(TRACK_A)).y)
      const fade = THREE.MathUtils.smoothstep(d, 0.09, 0.3)
      return fade * (0.017 * Math.sin(x * 2.5) * Math.cos(z * 2.1) + 0.009 * Math.sin(x * 5.1 + 1.7) + 0.007)
    }
    const duvetGeo = new THREE.PlaneGeometry(2.8, 2.8, 90, 90)
    {
      const pos = duvetGeo.attributes.position as THREE.BufferAttribute
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i)
        const y = pos.getY(i) // plane rotated -90 later: y maps to -z
        pos.setZ(i, quilt(x, -y))
      }
      duvetGeo.computeVertexNormals()
    }
    const duvet = new THREE.Mesh(duvetGeo, fabric(tokens, mixHex(tokens.ground, tokens.dominant, 0.45), { ...fill, rim: { strength: 0.5, size: 0.8, color: '#C6CAF0' } }))
    duvet.rotation.x = -Math.PI / 2
    props(duvet, false)
    scene.add(duvet)
    // stitch seams — the quilting lines the darning machine left
    const stitchMat = fabric(tokens, darken(tokens.ground, 0.22), fill)
    for (const off of [-0.26, 0.24]) {
      const pts: THREE.Vector3[] = []
      for (let i = 0; i <= 40; i++) {
        const x = -1.3 + (2.6 * i) / 40
        const z = off + 0.06 * Math.sin(x * 2.3)
        pts.push(new THREE.Vector3(x, quilt(x, z) + 0.0016, z))
      }
      const seam = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, 0.0022, 6, false), stitchMat)
      props(seam, false)
      scene.add(seam)
    }

    // anchor: the headboard the duvet rolls over, up-left
    const head = new THREE.Group()
    const hboard = new THREE.Mesh(toyBlock(0.95, 0.4, 0.05, 0.02, 0.008), paintedWood(tokens, '#7A5A38', { ...fill, grain: 0.5, grainScale: 0.3 }))
    hboard.position.y = 0.2
    props(hboard)
    head.add(hboard)
    head.position.set(-0.55, 0, -0.56)
    head.rotation.y = 0.42
    scene.add(head)

    // terrain: pillow plateau mid-right, a lone slid-off picture book,
    // a cable snake riding a fold, a mug half-sunk in the soft ground
    const pil = pillow(fill)
    pil.position.set(0.22, quilt(0.22, -0.2) + 0.041, -0.2)
    pil.rotation.y = -0.4
    scene.add(pil)

    const book2 = new THREE.Mesh(toyBlock(0.14, 0.016, 0.11, 0.004, 0.0015), paintedWood(tokens, tokens.dominant, { ...fill, grain: 0.45 }))
    book2.position.set(-0.24, quilt(-0.24, -0.21) + 0.005, -0.21)
    book2.rotation.y = -0.25
    props(book2)
    scene.add(book2)

    const cable = cableSnake(
      [
        [0.5, 0.008, 0.12],
        [0.33, 0.014, 0.05],
        [0.17, 0.018, -0.03], // speed bump on a duvet fold across the track
        [0.0, 0.01, -0.08],
        [-0.18, 0.008, -0.12],
        [-0.3, 0.008, -0.05],
      ],
      fill,
    )
    scene.add(cable)

    const mug = mugTunnel(fill, 1.25, true, '#DCCCE0')
    mug.position.copy(trackAt(0.6, quilt(0.17, -0.06) + 0.045)) // mouth down-track at t~0.75, facing the cameras
    scene.add(mug)

    const trackMat = trackPlastic(tokens, GLOBAL_TOKENS.trackOrange, { ...fill, toy: 0.2 })
    scene.add(trackRun(trackMat))

    scene.add(carOnTrack('#B26BA4', 0.5, fill))

    // the light source, small and honest: a nightlight plugged into the
    // baseboard at frame right, the set's amber worn by one object
    const nightlight = new THREE.Group()
    const nlBody = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.034, 0.05, 20), ceramic(tokens, '#EFE7DA', fill))
    nlBody.position.y = 0.025
    props(nlBody)
    nightlight.add(nlBody)
    const nlGlow = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.018, 20), paintedWood(tokens, tokens.accent, { ...fill, grain: 0, diffuseStrength: 1.25 }))
    nlGlow.position.y = 0.045
    nightlight.add(nlGlow)
    nightlight.position.set(0.45, 0, -0.3)
    scene.add(nightlight)

    // lived-in: glasses left on the pillow, lenses fogged to glass class
    const specs = new THREE.Group()
    const wire = dieCastPaint(tokens, '#B7A98E', { ...fill, toy: 0.3 })
    for (const sx of [-0.014, 0.014]) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.011, 0.0016, 8, 24), wire)
      ring.position.set(sx, 0, 0)
      props(ring, false, false)
      specs.add(ring)
    }
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.0016, 0.002), wire)
    props(bridge, false, false)
    specs.add(bridge)
    specs.position.set(0.22, quilt(0.22, -0.2) + 0.082, -0.16)
    specs.rotation.set(-Math.PI / 2, 0, 0.5)
    scene.add(specs)

    finish(scene, rig)
    const p = trackAt(0.42)
    return { scene, camera: camera(ctx), focus: [p.x, 0.02, p.z], tokens }
  }
}

registerScene('bedroom-a', bedroomA())
registerScene('bedroom-b', bedroomB())
registerScene('bedroom-c', bedroomC())
