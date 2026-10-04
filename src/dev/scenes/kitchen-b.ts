// Stage 1 exploration — Environment Artist B, kitchen style tile.
// "Sunday morning on the toy table": a monumental cereal bowl (the banked
// turn), a book-stack ramp shimed up by a pencil, a mug with its ring, a
// toast soldier leaning on the mug, a tap frozen mid-drip over a wet patch.
// One gold key with long soft shadows, mint-leaning fill, six material
// classes from the shared system. Static — fixed clock, nothing animates.

import * as THREE from 'three'
import { ceramic, dieCastPaint, fabric, liquid, paintedWood, trackPlastic } from '../../render/materials.ts'
import { toyBlock, trackChannel } from '../../render/geometry.ts'
import { GLOBAL_TOKENS, SET_TOKENS, darken, mixHex } from '../../render/tokens.ts'
import { ToonMaterial } from '../../render/toon-material.ts'
import { registerScene, type SceneEntry, type SceneFactory } from '../registry.ts'

const tokens = SET_TOKENS.kitchen
const KEY_INTENSITY = 1.3

// Mint-leaning soft fill: the token fill (gold-derived) nudged toward the
// kitchen's mint accent so shadows breathe cool against the gold key.
const FILL_HIGH = darken(mixHex(tokens.fillHigh, '#8FCEBB', 0.4), 0.06)
const FILL_LOW = mixHex(tokens.fillLow, '#6FB9A2', 0.25)

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

const fillOver = () => ({
  fillHigh: FILL_HIGH,
  fillLow: FILL_LOW,
  shadowTint: mixHex(tokens.shadowTint, tokens.dominant, 0.3),
})

// ---- props ------------------------------------------------------------

function mug(): THREE.Group {
  const g = new THREE.Group()
  const mat = ceramic(tokens, '#F2E6CC', fillOver())
  mat.side = THREE.DoubleSide
  // open-top cup: outer wall up, inner floor, back down the inside
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
  props(body)
  g.add(body)
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.016, 0.0045, 10, 24), ceramic(tokens, '#F2E6CC', fillOver()))
  handle.position.set(0.038, 0.036, 0)
  handle.rotation.y = Math.PI / 2
  props(handle)
  g.add(handle)
  // coffee left inside
  const coffee = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0285, 0.0285, 0.002, 32),
    liquid(tokens, '#8A5A32', { ...fillOver(), opacity: 0.92, liquid: 0.12 }),
  )
  coffee.position.y = 0.05
  g.add(coffee)
  return g
}

function bookStack(): THREE.Group {
  const g = new THREE.Group()
  const covers: Array<[string, number, number]> = [
    ['#C2643F', 0.02, 0.4], // terracotta
    ['#EFE0C0', 0.017, -0.25], // paper cream
    ['#5FB49C', 0.019, 0.15], // mint — the set's accent
  ]
  let y = 0
  covers.forEach(([c, h, ry], i) => {
    const b = new THREE.Mesh(
      toyBlock(0.17, h!, 0.125, 0.004, 0.0015),
      paintedWood(tokens, c!, { ...fillOver(), grain: i === 1 ? 0.25 : 0.45 }),
    )
    b.position.set(i * 0.004, y + h! / 2, i * 0.003)
    b.rotation.y = ry!
    props(b)
    g.add(b)
    y += h!
  })
  // ramp book, tilted, propped on a pencil shim
  const ramp = new THREE.Mesh(
    toyBlock(0.17, 0.019, 0.125, 0.004, 0.0015),
    paintedWood(tokens, '#D9883B', { ...fillOver(), grain: 0.5 }),
  )
  ramp.position.set(0.005, y + 0.015, 0.012)
  ramp.rotation.x = -0.24
  ramp.rotation.y = -0.1
  props(ramp)
  g.add(ramp)
  // the pencil shim — someone built this
  const pencil = pencilProp()
  pencil.position.set(0.012, y + 0.025, 0.055)
  pencil.rotation.set(0, 0.35, Math.PI / 2)
  g.add(pencil)
  return g
}

function pencilProp(): THREE.Group {
  const g = new THREE.Group()
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0042, 0.0042, 0.11, 6),
    dieCastPaint(tokens, '#EFC23A', { ...fillOver(), toy: 0.4 }),
  )
  props(body)
  g.add(body)
  const wood = new THREE.Mesh(
    new THREE.ConeGeometry(0.0042, 0.012, 6),
    paintedWood(tokens, '#DDB98A', { ...fillOver(), grain: 0.2 }),
  )
  wood.position.y = 0.061
  props(wood)
  g.add(wood)
  const lead = new THREE.Mesh(new THREE.ConeGeometry(0.0016, 0.005, 6), fabric(tokens, '#4A3527', fillOver()))
  lead.position.y = 0.0685
  g.add(lead)
  const eraser = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0044, 0.0044, 0.008, 6),
    ceramic(tokens, '#E29A8A', { ...fillOver(), specular: { size: 0.5, strength: 0.3 } }),
  )
  eraser.position.y = -0.058
  props(eraser)
  g.add(eraser)
  return g
}

function toast(): THREE.Group {
  const g = new THREE.Group()
  const slice = new THREE.Mesh(
    toyBlock(0.041, 0.04, 0.012, 0.01, 0.003),
    paintedWood(tokens, '#E3A75B', { ...fillOver(), grain: 0.85 }),
  )
  props(slice)
  g.add(slice)
  // bitten corner: crumb-colour patch where a bite is missing
  const bite = new THREE.Mesh(
    new THREE.CircleGeometry(0.008, 20),
    paintedWood(tokens, '#EFCF92', { ...fillOver(), grain: 0.15 }),
  )
  bite.position.set(0.013, 0.011, 0.0063)
  g.add(bite)
  return g
}

function tap(): THREE.Group {
  const g = new THREE.Group()
  const brass = dieCastPaint(tokens, '#C9A45E', { ...fillOver(), toy: 0.5, rim: { strength: 0.42, size: 0.15 } })
  const riser = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.013, 0.21, 24), brass)
  riser.position.y = 0.105
  props(riser)
  g.add(riser)
  const elbow = new THREE.Mesh(new THREE.SphereGeometry(0.0125, 20, 16), brass)
  elbow.position.y = 0.21
  props(elbow)
  g.add(elbow)
  const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.0085, 0.009, 0.12, 24), brass)
  spout.position.set(0.054, 0.21, 0)
  spout.rotation.z = Math.PI / 2
  props(spout)
  g.add(spout)
  const lip = new THREE.Mesh(new THREE.CylinderGeometry(0.0095, 0.008, 0.012, 24), brass)
  lip.position.set(0.108, 0.203, 0)
  props(lip)
  g.add(lip)
  // the frozen drip
  const drop = new THREE.Mesh(
    new THREE.SphereGeometry(0.009, 16, 12),
    liquid(tokens, '#C2DFD2', { ...fillOver(), opacity: 0.85 }),
  )
  drop.scale.y = 1.4
  drop.position.set(0.108, 0.03, 0)
  g.add(drop)
  return g
}

function wetPatch(): THREE.Group {
  const g = new THREE.Group()
  const patch = new THREE.Mesh(
    new THREE.SphereGeometry(0.038, 28, 12),
    liquid(tokens, '#8FB7A5', { ...fillOver(), opacity: 0.45, liquid: 0.15 }),
  )
  patch.scale.y = 0.05
  patch.position.y = 0.001
  patch.receiveShadow = true
  g.add(patch)
  // the drip's splash, frozen — a crown ring on the puddle
  const splash = new THREE.Mesh(
    new THREE.TorusGeometry(0.008, 0.001, 8, 28),
    liquid(tokens, '#BCD8CC', { ...fillOver(), opacity: 0.9 }),
  )
  splash.rotation.x = -Math.PI / 2
  splash.position.y = 0.0035
  g.add(splash)
  return g
}

function car(): THREE.Group {
  const g = new THREE.Group()
  const body = new THREE.Mesh(
    toyBlock(0.075, 0.028, 0.034, 0.01, 0.004),
    dieCastPaint(tokens, '#E0442B', { ...fillOver(), toy: 0.4 }),
  )
  props(body)
  g.add(body)
  const stripe = new THREE.Mesh(
    new THREE.BoxGeometry(0.062, 0.004, 0.011),
    dieCastPaint(tokens, '#F6E9D2', fillOver()),
  )
  stripe.position.y = 0.027
  g.add(stripe)
  const wheelGeo = new THREE.CylinderGeometry(0.009, 0.009, 0.006, 18)
  wheelGeo.rotateX(Math.PI / 2)
  const wheelMat = fabric(tokens, '#4A3527', { ...fillOver(), rim: { strength: 0.25, size: 0.6 } })
  for (const [x, z] of [[0.024, 0.017], [-0.024, 0.017], [0.024, -0.017], [-0.024, -0.017]] as const) {
    const w = new THREE.Mesh(wheelGeo, wheelMat)
    w.position.set(x, 0.009, z)
    props(w, true, false)
    g.add(w)
  }
  g.scale.setScalar(0.62)
  return g
}

/** A straight track run from a to b, laid along the line (deck at a.y/b.y). */
function trackRun(a: THREE.Vector3, b: THREE.Vector3, mat: THREE.Material): THREE.Mesh {
  const m = new THREE.Mesh(trackChannel(Math.max(a.distanceTo(b) - 0.008, 0.02)), mat)
  m.position.copy(a).lerp(b, 0.5)
  m.lookAt(b)
  props(m)
  return m
}

function crumbs(): THREE.InstancedMesh {
  const n = 16
  const mesh = new THREE.InstancedMesh(
    new THREE.IcosahedronGeometry(0.0035, 0),
    paintedWood(tokens, '#E8C58A', { ...fillOver(), grain: 0.2 }),
    n,
  )
  const dummy = new THREE.Object3D()
  const rnd = makeRng(20261003)
  for (let i = 0; i < n; i++) {
    const a = rnd() * Math.PI * 2
    const r = 0.02 + rnd() * 0.075
    dummy.position.set(Math.cos(a) * r, 0.0022 + rnd() * 0.002, Math.sin(a) * r)
    dummy.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3)
    dummy.scale.setScalar(0.22 + rnd() * 0.3)
    dummy.updateMatrix()
    mesh.setMatrixAt(i, dummy.matrix)
  }
  props(mesh)
  return mesh
}

// ---- scene ------------------------------------------------------------

function kitchenScene(): SceneFactory {
  return (ctx): SceneEntry => {
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(tokens.background)

    // One gold key, low — breakfast sun with long shadows that fly away
    // from camera so the forms read in every rig.
    const key = new THREE.DirectionalLight(GLOBAL_TOKENS.keyLight, KEY_INTENSITY)
    key.position.set(0.9, 0.55, 0.6)
    key.castShadow = true
    key.shadow.mapSize.set(2048, 2048)
    key.shadow.camera.left = -1.2
    key.shadow.camera.right = 1.2
    key.shadow.camera.top = 1.2
    key.shadow.camera.bottom = -1.2
    key.shadow.camera.near = 0.1
    key.shadow.camera.far = 4
    key.shadow.bias = -0.0004
    key.shadow.normalBias = 0.002
    key.shadow.radius = 4
    scene.add(key)

    // warm wood counter, a touch deeper so the key light has somewhere to land
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(1.4, 72),
      paintedWood(tokens, darken(tokens.ground, 0.06), { ...fillOver(), grain: 0.32 }),
    )
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    scene.add(ground)

    // flat cream wall behind — catches the long shadows, never a gradient
    const wall = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 4),
      paintedWood(tokens, mixHex(tokens.background, tokens.dominant, 0.28), { ...fillOver(), grain: 0.06, diffuseStrength: 0.85 }),
    )
    wall.position.set(0, 1.6, -0.6)
    wall.receiveShadow = true
    scene.add(wall)

    // everything that tells the story lives in one group, scaled to fill the
    // canonical frames without touching the shared camera rigs
    const vignette = new THREE.Group()
    vignette.scale.setScalar(1.06)
    scene.add(vignette)

    // monumental cereal bowl — the banked turn. The flared rim self-shadows
    // the wall below it; the bowl's shadow band is set to a bright warm gold
    // so that band reads as ceramic in shade, never grey.
    const bowlMat = ceramic(tokens, '#F0DDB2', {
      ...fillOver(),
      shadowTint: '#FFDFA8',
      ramp: { steps: [0.88, 1.0], thresholds: [0.12], softness: 0.1 },
      specular: { size: 0.55, strength: 0.22 },
      diffuseStrength: 1.15,
    })
    bowlMat.side = THREE.DoubleSide
    // local bowl profile: the shared lathe's dome touches the floor only at
    // its centre and reads as floating; add a flat foot ring at y = 0.001
    const bowlPts: THREE.Vector2[] = [new THREE.Vector2(0.0001, 0.001), new THREE.Vector2(0.06, 0.001)]
    {
      const R = 0.098, H = 0.054, w = 0.005, n = 12
      const footR = R * 0.26
      for (let i = 5; i <= n; i++) {
        const t = i / n
        bowlPts.push(new THREE.Vector2(footR + (R - footR) * Math.sqrt(t), Math.max(H * t * (0.88 * t + 0.12), 0.001)))
      }
      bowlPts.push(new THREE.Vector2(R, H), new THREE.Vector2(R - w / 2, H + w / 2), new THREE.Vector2(R - w, H))
      for (let i = n; i >= 0; i--) {
        const t = i / n
        bowlPts.push(new THREE.Vector2(Math.max((R - w) * Math.sqrt(t), 0.0001), H * 0.05 + (H - H * 0.05) * (0.85 * t * t + 0.15 * t)))
      }
    }
    const bowlGeo = new THREE.LatheGeometry(bowlPts, 56)
    bowlGeo.computeVertexNormals()
    const bowl = new THREE.Mesh(bowlGeo, bowlMat)
    props(bowl)
    bowl.position.set(-0.035, 0, -0.045)
    vignette.add(bowl)

    // a second car, on the ramp, caught mid-descent
    {
      const runner = car()
      const a = new THREE.Vector3(-0.24, 0.09, 0.22)
      const b = new THREE.Vector3(-0.1, 0.022, 0.022)
      runner.position.lerpVectors(a, b, 0.62)
      runner.position.y += 0.004
      const d = b.clone().sub(a).normalize()
      runner.lookAt(runner.position.x + d.x, runner.position.y + d.y, runner.position.z + d.z)
      runner.rotateY(-Math.PI / 2)
      vignette.add(runner)
    }

    // milk settled in the bottom, with a few cereal rings floating
    const milk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.062, 0.058, 0.003, 40),
      liquid(tokens, '#F7EFDE', { ...fillOver(), opacity: 0.95, liquid: 0.08 }),
    )
    milk.position.set(-0.035, 0.032, -0.045)
    vignette.add(milk)
    const rings = new THREE.InstancedMesh(
      new THREE.TorusGeometry(0.0055, 0.0024, 8, 18),
      fabric(tokens, '#E8B063', fillOver()),
      6,
    )
    {
      const d = new THREE.Object3D()
      const rnd = makeRng(911)
      for (let i = 0; i < 6; i++) {
        const a = rnd() * Math.PI * 2
        const r = 0.012 + rnd() * 0.042
        d.position.set(-0.035 + Math.cos(a) * r, 0.035, -0.045 + Math.sin(a) * r)
        d.rotation.set(-Math.PI / 2 + (rnd() - 0.5) * 0.5, 0, rnd() * 3)
        d.updateMatrix()
        rings.setMatrixAt(i, d.matrix)
      }
    }
    props(rings)
    vignette.add(rings)

    // a third car, racing out along the flat run — floor-camera's hero
    {
      const racer2 = car()
      racer2.position.set(0.145, 0.0185, -0.043)
      racer2.lookAt(0.145 + 0.96, 0.0165, -0.043 - 0.25)
      racer2.rotateY(-Math.PI / 2)
      vignette.add(racer2)
    }

    // the car riding the bowl's banked rim — the story of the tile
    const racer = car()
    const psi = -Math.PI * 0.15
    const rx = -0.035 + Math.cos(psi) * 0.088
    const rz = -0.045 + Math.sin(psi) * 0.088
    racer.position.set(rx, 0.045, rz)
    racer.lookAt(rx - Math.sin(psi) * 0.06, 0.045, rz + Math.cos(psi) * 0.06)
    racer.rotateY(-Math.PI / 2)
    racer.rotateX(0.35)
    vignette.add(racer)

    // book-stack ramp up-left behind the bowl, with the orange track down
    const books = bookStack()
    books.position.set(-0.27, 0, 0.17)
    books.rotation.y = 0.42
    vignette.add(books)

    const trackMat = trackPlastic(tokens, GLOBAL_TOKENS.trackOrange, { ...fillOver(), toy: 0.2 })
    const rampTrack = trackRun(new THREE.Vector3(-0.24, 0.09, 0.22), new THREE.Vector3(-0.1, 0.022, 0.022), trackMat)
    vignette.add(rampTrack)
    const flatTrack = trackRun(new THREE.Vector3(0.095, 0.02, -0.03), new THREE.Vector3(0.21, 0.005, -0.06), trackMat)
    vignette.add(flatTrack)

    // mug with its ring, toast soldier leaning on the mug
    const mugG = mug()
    mugG.position.set(0.24, 0, 0.13)
    mugG.rotation.y = -1.7
    vignette.add(mugG)
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.034, 0.0032, 8, 40),
      liquid(tokens, '#B98A5C', { ...fillOver(), opacity: 0.55, liquid: 0 }),
    )
    ring.rotation.x = -Math.PI / 2
    ring.position.set(0.155, 0.0022, 0.185)
    vignette.add(ring)
    const soldier = toast()
    soldier.position.set(0.207, 0.024, 0.113)
    soldier.rotation.set(-0.05, -0.75, -0.5)
    vignette.add(soldier)
    const crumbTrail = crumbs()
    crumbTrail.position.set(0.17, 0, 0.13)
    vignette.add(crumbTrail)

    // the dripping tap, frozen mid-drip, up-left rear; wet patch + splash
    const tapG = tap()
    tapG.position.set(-0.31, 0, -0.2)
    tapG.rotation.y = -1.2
    vignette.add(tapG)
    const patch = wetPatch()
    patch.position.set(-0.271, 0, -0.1)
    vignette.add(patch)

    // folded mint cloth — the accent, catching the key
    const cloth = new THREE.Group()
    const clothMat = fabric(tokens, tokens.accent, fillOver())
    const c1 = new THREE.Mesh(toyBlock(0.075, 0.005, 0.055, 0.01, 0.002), clothMat)
    c1.position.y = 0.0025
    props(c1)
    cloth.add(c1)
    const c2 = new THREE.Mesh(toyBlock(0.062, 0.0045, 0.045, 0.01, 0.002), clothMat)
    c2.position.set(0.002, 0.007, 0.001)
    c2.rotation.y = 0.25
    props(c2)
    cloth.add(c2)
    cloth.position.set(0.30, 0, 0.02)
    cloth.rotation.y = 0.35
    vignette.add(cloth)

    // a second pencil, lying across the counter — lived-in, and it leads
    // the floor camera toward the bowl
    const lazyPencil = pencilProp()
    lazyPencil.position.set(0.14, 0.0043, -0.19)
    lazyPencil.rotation.set(Math.PI / 2, 0, 1.0)
    vignette.add(lazyPencil)

    // Tell every ToonMaterial the key light so dark bands tint, not blacken.
    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh || obj instanceof THREE.InstancedMesh) {
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

registerScene('kitchen-b', kitchenScene())
