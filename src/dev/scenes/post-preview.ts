// Stage 3 — kitchen tile B, INTEGRATED re-render.
//
// This is the stage-1 send-back made concrete (Decision Log 2026-10-04): the
// chosen tile-B composition (unchanged geometry and staging — it is the set
// reference) re-rendered through the systems the send-back named:
//
//   grading to tile A's value range  → post stack (grade from tokens) — this
//                                      file only supplies the scene; run it
//                                      with post=on for the finals
//   bowl-interior glaze              → the backface-normal fix plus the
//                                      ceramic saturation lift (materials.ts)
//   wet patch as FILM, not cutout    → stainDecal films (film.ts) replace
//                                      tile B's squashed-sphere puddle, torus
//                                      mug ring and splash crown
//   brighter tyres                   → clampLightness contact floor (tokens)
//   mug pull-back                    → the mug + toast soldier sit deeper in
//                                      the frame (deeper z, less screen mass)
//   lighting rig                     → createLightingRig replaces the hand-
//                                      tuned per-scene fill: the fill gain is
//                                      a parameter and reaches the mint
//
// It is deliberately a fork of src/dev/scenes/kitchen-b.ts, not an edit to
// it: the stage-1 file must keep rendering the exact "before" frames the
// integration is reviewed against. The fork lives under src/dev/scenes/
// because that is the registry's plug-in point, and it carries the focus
// point of the shot in its SceneEntry so `post=on` centres the band on the
// car riding the bowl.

import * as THREE from 'three'
import { ceramic, dieCastPaint, fabric, liquid, paintedWood, trackPlastic } from '../../render/materials.ts'
import { toyBlock, trackChannel } from '../../render/geometry.ts'
import { GLOBAL_TOKENS, SET_TOKENS, clampLightness, darken, mixHex } from '../../render/tokens.ts'
import { applyKeyLight, createLightingRig, fillFromRig } from '../../render/lighting.ts'
import { stainDecal } from '../../render/film.ts'
import { registerScene, type SceneEntry, type SceneFactory } from '../registry.ts'

const tokens = SET_TOKENS.kitchen
const rig = createLightingRig(tokens, { accentMix: 0.4 })

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

const fillOver = () => fillFromRig(rig)

// ---- props (staging copied from kitchen-b unless the send-back moved it) --

function mug(): THREE.Group {
  const g = new THREE.Group()
  const mat = ceramic(tokens, '#F2E6CC', fillOver())
  mat.side = THREE.DoubleSide
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
    ['#C2643F', 0.02, 0.4],
    ['#EFE0C0', 0.017, -0.25],
    ['#5FB49C', 0.019, 0.15],
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
  const ramp = new THREE.Mesh(
    toyBlock(0.17, 0.019, 0.125, 0.004, 0.0015),
    paintedWood(tokens, '#D9883B', { ...fillOver(), grain: 0.5 }),
  )
  ramp.position.set(0.005, y + 0.015, 0.012)
  ramp.rotation.x = -0.24
  ramp.rotation.y = -0.1
  props(ramp)
  g.add(ramp)
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
  const drop = new THREE.Mesh(
    new THREE.SphereGeometry(0.009, 16, 12),
    liquid(tokens, '#C2DFD2', { ...fillOver(), opacity: 0.85 }),
  )
  drop.scale.y = 1.4
  drop.position.set(0.108, 0.03, 0)
  g.add(drop)
  return g
}

// The wet patch, as FILM: a stain quad with a splash-ring film on it — the
// send-back's central line. It takes the floor's lighting contract instead
// of owning a squashed sphere.
function wetPatchFilms(): THREE.Group {
  const g = new THREE.Group()
  const fill = fillOver()
  const patch = stainDecal(tokens, {
    kind: 'wetPatch',
    color: '#7FA393',
    opacity: 0.4,
    size: 0.045,
    sheen: 0.6,
    ...fill,
  })
  g.add(patch)
  const splash = stainDecal(tokens, {
    kind: 'splashRing',
    color: '#CFEADF',
    opacity: 0.55,
    size: 0.008,
    width: 0.0016,
    sheen: 0.3,
    lift: 0.0002,
    ...fill,
  })
  g.add(splash)
  return g
}

function mugRingFilm(): THREE.Mesh {
  return stainDecal(tokens, {
    kind: 'mugRing',
    color: '#B98A5C',
    opacity: 0.6,
    size: 0.034,
    width: 0.0042,
    ...fillOver(),
  })
}

// Tyres ride the warm-brown lightness floor — the silhouette hole is gone.
const TYRE_BROWN = clampLightness('#4A3527')

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
  const wheelMat = fabric(tokens, TYRE_BROWN, { ...fillOver(), rim: { strength: 0.25, size: 0.6 } })
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

function kitchenIntegratedScene(): SceneFactory {
  return (ctx): SceneEntry => {
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(tokens.background)
    scene.add(rig.key)

    // the counter takes a LOW grain frequency — it is the big surface the
    // backlog named: long lazy streaks, not book-cover speckle
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(1.4, 72),
      paintedWood(tokens, darken(tokens.ground, 0.06), { ...fillOver(), grain: 0.3, grainScale: 0.05 }),
    )
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    scene.add(ground)

    const wall = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 4),
      paintedWood(tokens, mixHex(tokens.background, tokens.dominant, 0.28), { ...fillOver(), grain: 0.06, grainScale: 0.05, diffuseStrength: 0.85 }),
    )
    wall.position.set(0, 1.6, -0.6)
    wall.receiveShadow = true
    scene.add(wall)

    const vignette = new THREE.Group()
    vignette.scale.setScalar(1.06)
    scene.add(vignette)

    // the bowl: saturation-lifted ceramic, DoubleSide, and the bright warm
    // shade band from tile B — with the backface fix the interior glaze is
    // now the glaze tuning doing the work, not a ramp hack
    const bowlMat = ceramic(tokens, '#F0DDB2', {
      ...fillOver(),
      shadowTint: '#FFDFA8',
      ramp: { steps: [0.88, 1.0], thresholds: [0.12], softness: 0.1 },
      specular: { size: 0.55, strength: 0.3 },
      diffuseStrength: 1.15,
    })
    bowlMat.side = THREE.DoubleSide
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

    {
      const racer2 = car()
      racer2.position.set(0.145, 0.0185, -0.043)
      racer2.lookAt(0.145 + 0.96, 0.0165, -0.043 - 0.25)
      racer2.rotateY(-Math.PI / 2)
      vignette.add(racer2)
    }

    // the car riding the bowl's banked rim — the focus subject of every shot
    const racer = car()
    const psi = -Math.PI * 0.15
    const rx = -0.035 + Math.cos(psi) * 0.088
    const rz = -0.045 + Math.sin(psi) * 0.088
    racer.position.set(rx, 0.045, rz)
    racer.lookAt(rx - Math.sin(psi) * 0.06, 0.045, rz + Math.cos(psi) * 0.06)
    racer.rotateY(-Math.PI / 2)
    racer.rotateX(0.35)
    vignette.add(racer)

    const books = bookStack()
    books.position.set(-0.27, 0, 0.17)
    books.rotation.y = 0.42
    vignette.add(books)

    const trackMat = trackPlastic(tokens, GLOBAL_TOKENS.trackOrange, { ...fillOver(), toy: 0.2 })
    const rampTrack = trackRun(new THREE.Vector3(-0.24, 0.09, 0.22), new THREE.Vector3(-0.1, 0.022, 0.022), trackMat)
    vignette.add(rampTrack)
    const flatTrack = trackRun(new THREE.Vector3(0.095, 0.02, -0.03), new THREE.Vector3(0.21, 0.005, -0.06), trackMat)
    vignette.add(flatTrack)

    // the mug, pulled back — the review's composition note: it was stealing
    // the floor frame from the bowl. "Back" means away from the camera (the
    // hero/floor rigs sit at +x,+z), so it now reads as set furniture
    const mugG = mug()
    mugG.position.set(0.24, 0, 0.05)
    mugG.rotation.y = -1.7
    vignette.add(mugG)
    const ring = mugRingFilm()
    ring.position.set(0.185, ring.position.y, 0.085)
    vignette.add(ring)
    const soldier = toast()
    soldier.position.set(0.212, 0.024, 0.07)
    soldier.rotation.set(-0.05, -0.75, -0.5)
    vignette.add(soldier)
    const crumbTrail = crumbs()
    crumbTrail.position.set(0.185, 0, 0.105)
    vignette.add(crumbTrail)

    const tapG = tap()
    tapG.position.set(-0.31, 0, -0.2)
    tapG.rotation.y = -1.2
    vignette.add(tapG)
    const patch = wetPatchFilms()
    patch.position.set(-0.271, 0, -0.1)
    vignette.add(patch)

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

    const lazyPencil = pencilProp()
    lazyPencil.position.set(0.14, 0.0043, -0.19)
    lazyPencil.rotation.set(Math.PI / 2, 0, 1.0)
    vignette.add(lazyPencil)

    applyKeyLight(scene, rig)

    const camera = new THREE.PerspectiveCamera(ctx.rig.fov, 16 / 9, ctx.rig.near, ctx.rig.far)
    camera.position.set(...ctx.rig.position)
    camera.lookAt(new THREE.Vector3(...ctx.rig.target))
    // focus: the car riding the bowl's rim (group scale 1.06 applied)
    return { scene, camera, focus: [rx * 1.06, 0.048, rz * 1.06], tokens }
  }
}

registerScene('kitchen-b-integrated', kitchenIntegratedScene())
