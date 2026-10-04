// Stage 1 exploration: three car looks (A blocky sedan, B streamliner,
// C haulback wagon), each on a short orange-track segment over a neutral
// warm floor so 1:64 scale reads. All procedural — toyBlock / lathe / box
// only, die-cast paint class, one stripe each in thin geometry (a proud
// band or a raised shell, never a decal). Registered as `car-a/b/c`.
//
// Hues come from the tokens machinery (shiftHex over Okabe–Ito
// colorblind-safe seeds): blue, bluish green, reddish purple — the three
// stay distinct for colorblind players and none sits in the orange track's
// hue family (art bible §Color: the track is the brand constant).

import * as THREE from 'three'
import { dieCastPaint, fabric, glass, paintedWood, trackPlastic } from '../../render/materials.ts'
import { toyBlock, trackChannel } from '../../render/geometry.ts'
import { GLOBAL_TOKENS, SET_TOKENS, shiftHex } from '../../render/tokens.ts'
import { ToonMaterial } from '../../render/toon-material.ts'
import { registerScene, type SceneEntry, type SceneFactory } from '../registry.ts'

export type CarKey = 'a' | 'b' | 'c'

// High-chroma bodies from colorblind-safe seeds, nudged through the tokens
// hue/sat/light machinery so they read as toy paint, not data-viz swatches.
const CAR_BLUE = shiftHex('#0072B2', 0.0, 0.12, 0.05) // sedan
const CAR_GREEN = shiftHex('#009E73', 0.0, 0.1, 0.0) // streamliner
const CAR_MAGENTA = shiftHex('#CC79A7', 0.03, 0.32, -0.02) // haulback
const STRIPE = '#EFDCB8' // warm cream/putty, one per car
const RUBBER = '#4A3527' // dark warm brown — never black (never list)

const tokens = SET_TOKENS.kitchen
const KEY_INTENSITY = 1.25
const YAW = -0.45 // three-quarter to the hero cam, broadside to the floor cam

function setProps(mesh: THREE.Mesh, cast: boolean, receive: boolean): void {
  mesh.castShadow = cast
  mesh.receiveShadow = receive
}

/** Flat-shade helper for stripes: a proud band wrapping the body flanks. */
function stripeBand(length: number, height: number, throughWidth: number, y: number): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(length, height, throughWidth),
    dieCastPaint(tokens, STRIPE, { toy: 0.25, rim: { strength: 0.22, size: 0.2 } }),
  )
  mesh.position.y = y
  setProps(mesh, false, false)
  return mesh
}

function addWheels(car: THREE.Group, radius: number, xs: readonly [number, number], zOff: number): void {
  const width = Math.max(0.005, radius * 0.74)
  const tyreGeo = new THREE.CylinderGeometry(radius, radius, width, 20)
  tyreGeo.rotateX(Math.PI / 2) // axle along z, car length along x
  const hubGeo = new THREE.CylinderGeometry(radius * 0.4, radius * 0.4, width + 0.001, 12)
  hubGeo.rotateX(Math.PI / 2)
  const rubber = fabric(tokens, RUBBER, { rim: { strength: 0.3, size: 0.65 } })
  const hub = dieCastPaint(tokens, STRIPE, { toy: 0.2, specular: { size: 0.08, strength: 0.7 } })
  for (const x of xs) {
    for (const z of [zOff, -zOff]) {
      const tyre = new THREE.Mesh(tyreGeo, rubber)
      // wheel bottoms at car-space y = 0
      tyre.position.set(x, radius, z)
      setProps(tyre, true, false)
      car.add(tyre)
      const cap = new THREE.Mesh(hubGeo, hub)
      cap.position.set(x, radius, z)
      setProps(cap, false, false)
      car.add(cap)
    }
  }
}

// ---------------------------------------------------------------- car A —
// chunky beveled wedge sedan: fat toyBlock body, raked cabin with a glass
// band, a roof rack of cross bars, thick wheels riding outside the flanks.

function buildSedan(): THREE.Group {
  const car = new THREE.Group()
  const body = new THREE.Mesh(
    toyBlock(0.076, 0.024, 0.038, 0.009, 0.004),
    dieCastPaint(tokens, CAR_BLUE),
  )
  body.position.y = 0.006
  setProps(body, true, true)
  car.add(body)
  car.add(stripeBand(0.05, 0.0055, 0.039, 0.0165))

  const cabin = new THREE.Group()
  cabin.position.set(-0.010, 0.030, 0)
  cabin.rotation.z = 0.12 // windshield raked back
  const shell = new THREE.Mesh(
    toyBlock(0.034, 0.016, 0.034, 0.011, 0.003),
    dieCastPaint(tokens, shiftHex(CAR_BLUE, 0, 0, -0.06)),
  )
  setProps(shell, true, false)
  cabin.add(shell)
  const greenhouse = new THREE.Mesh(
    toyBlock(0.027, 0.010, 0.036, 0.009, 0.002),
    glass(tokens, '#CFEDE4', { rim: { strength: 0.4, size: 0.3 } }),
  )
  greenhouse.position.y = 0.004
  cabin.add(greenhouse)
  const barMat = dieCastPaint(tokens, STRIPE, { toy: 0.2 })
  for (const bx of [-0.009, 0, 0.009]) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.0026, 0.0024, 0.030), barMat)
    bar.position.set(bx, 0.0174, 0)
    setProps(bar, false, false)
    cabin.add(bar)
  }
  car.add(cabin)

  addWheels(car, 0.0095, [-0.0245, 0.0245], 0.0165)
  return car
}

// ---------------------------------------------------------------- car B —
// streamliner: one continuous lathe teardrop (single profile, nose to tail),
// flattened and flat-bottomed, its stripe a raised phi-limited shell of the
// same profile, bubble canopy in glass, wheels tucked at the flank line.

// One continuous teardrop profile read as a direction: a blunt quarter-
// ellipse nose at +x, a parallel midbody, a long near-linear needle tail.
function teardropRadius(x: number): number {
  const R = 0.0175
  if (x > 0.024) {
    const u = (x - 0.024) / 0.018
    return Math.max(0.0004, R * Math.sqrt(Math.max(0, 1 - u * u)))
  }
  if (x > 0.006) return R
  const s = Math.max(0, (x + 0.042) / 0.048) // tail
  return Math.max(0.0004, R * Math.pow(s, 0.9))
}

function streamlinerBody(radiusOffset: number, phiStart: number, phiLength: number, floorY: number): THREE.BufferGeometry {
  const L = 0.084
  const pts: THREE.Vector2[] = []
  const N = 20
  for (let i = 0; i <= N; i++) {
    const x = L / 2 - (i / N) * L
    pts.push(new THREE.Vector2(teardropRadius(x) + radiusOffset, x))
  }
  const geo = new THREE.LatheGeometry(pts, 44, phiStart, phiLength)
  geo.rotateZ(-Math.PI / 2) // spin axis -> x
  geo.scale(1, 0.7, 1) // squash the tube into a body
  geo.translate(0, 0.0155, 0) // ride height: axis above the wheel centers
  // cut the underside flat so tucked wheels show below the floor line
  const pos = geo.attributes.position as THREE.BufferAttribute
  for (let i = 0; i < pos.count; i++) {
    if (pos.getY(i) < floorY) pos.setY(i, floorY)
  }
  geo.computeVertexNormals()
  return geo
}

function buildStreamliner(): THREE.Group {
  const car = new THREE.Group()
  const body = new THREE.Mesh(streamlinerBody(0, 0, Math.PI * 2, 0.0078), dieCastPaint(tokens, CAR_GREEN))
  setProps(body, true, true)
  car.add(body)
  // speedster stripe: the same profile offset 0.5 mm proud, only the top
  // 0.9 rad of the spin (LatheGeometry starts phi at +z, so the crown of
  // the turned body sits at 3pi/2 after the spin axis tilts onto x)
  const stripeMat = dieCastPaint(tokens, STRIPE, { toy: 0.2, rim: { strength: 0.22, size: 0.2 } })
  stripeMat.side = THREE.DoubleSide // open phi-limited shell, as for bowlForm
  const stripe = new THREE.Mesh(
    streamlinerBody(0.0005, 1.5 * Math.PI - 0.45, 0.9, 0.0084),
    stripeMat,
  )
  setProps(stripe, false, false)
  car.add(stripe)
  const canopy = new THREE.Mesh(
    new THREE.SphereGeometry(0.0068, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2),
    glass(tokens, '#CFEDE4', { rim: { strength: 0.45, size: 0.3 } }),
  )
  canopy.position.set(0.01, 0.0235, 0)
  car.add(canopy)

  addWheels(car, 0.0085, [-0.026, 0.026], 0.0165)
  return car
}

// ---------------------------------------------------------------- car C —
// haulback: tall two-box wagon silhouette, raked hatch, beltline stripe —
// and the one absurd detail: a tiny working roof ladder in cream cast metal.

function buildHaulback(): THREE.Group {
  const car = new THREE.Group()
  const body = new THREE.Mesh(
    toyBlock(0.072, 0.022, 0.038, 0.008, 0.004),
    dieCastPaint(tokens, CAR_MAGENTA),
  )
  body.position.y = 0.005
  setProps(body, true, true)
  car.add(body)
  car.add(stripeBand(0.048, 0.0055, 0.039, 0.016))

  const cabin = new THREE.Group()
  cabin.position.set(-0.012, 0.027, 0)
  cabin.rotation.z = 0.08
  const shell = new THREE.Mesh(
    toyBlock(0.042, 0.015, 0.035, 0.01, 0.003),
    dieCastPaint(tokens, CAR_MAGENTA),
  )
  setProps(shell, true, false)
  cabin.add(shell)
  const greenhouse = new THREE.Mesh(
    toyBlock(0.034, 0.010, 0.037, 0.009, 0.002),
    glass(tokens, '#CFEDE4', { rim: { strength: 0.4, size: 0.3 } }),
  )
  greenhouse.position.y = 0.004
  cabin.add(greenhouse)

  // the small surprising detail: a roof ladder you could actually climb
  const cast = dieCastPaint(tokens, STRIPE, { toy: 0.2 })
  for (const z of [-0.013, 0.013]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.034, 0.0018, 0.0018), cast)
    rail.position.set(0, 0.0185, z)
    setProps(rail, false, false)
    cabin.add(rail)
  }
  for (const rx of [-0.011, 0, 0.011]) {
    const rung = new THREE.Mesh(new THREE.BoxGeometry(0.0022, 0.0018, 0.0278), cast)
    rung.position.set(rx, 0.0185, 0)
    setProps(rung, false, false)
    cabin.add(rung)
  }
  for (const lx of [-0.015, 0.015]) {
    for (const lz of [-0.013, 0.013]) {
      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.0018, 0.005, 0.0018), cast)
      foot.position.set(lx, 0.0165, lz)
      cabin.add(foot)
    }
  }
  car.add(cabin)

  addWheels(car, 0.0095, [-0.024, 0.024], 0.0165)
  return car
}

const CAR_BUILDERS: Record<CarKey, () => THREE.Group> = {
  a: buildSedan,
  b: buildStreamliner,
  c: buildHaulback,
}

function carScene(key: CarKey): SceneFactory {
  return (ctx): SceneEntry => {
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(tokens.background)

    // one key light, warm breakfast gold (the bible's light)
    const key1 = new THREE.DirectionalLight(GLOBAL_TOKENS.keyLight, KEY_INTENSITY)
    key1.position.set(0.55, 0.7, 0.35)
    key1.castShadow = true
    key1.shadow.mapSize.set(2048, 2048)
    key1.shadow.camera.left = -1.8
    key1.shadow.camera.right = 1.8
    key1.shadow.camera.top = 1.8
    key1.shadow.camera.bottom = -1.8
    key1.shadow.camera.near = 0.1
    key1.shadow.camera.far = 3.5
    key1.shadow.bias = -0.0004
    key1.shadow.normalBias = 0.002
    key1.shadow.radius = 3
    scene.add(key1)

    // neutral warm floor so the toy scale reads
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(0.9, 56),
      paintedWood(tokens, tokens.ground, { grain: 0.35 }),
    )
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    scene.add(ground)

    // a short run of the brand-orange track, the car centred on it
    const run = new THREE.Group()
    run.position.set(0.02, 0, -0.02)
    run.rotation.y = YAW
    const trackGeo = trackChannel(0.42)
    trackGeo.rotateY(Math.PI / 2) // run along x, then yaw with the group
    const track = new THREE.Mesh(
      trackGeo,
      trackPlastic(tokens, GLOBAL_TOKENS.trackOrange, { toy: 0.2 }),
    )
    setProps(track, true, true)
    run.add(track)
    const car = CAR_BUILDERS[key]()
    car.position.y = 0.0045 // wheels seated in the channel
    run.add(car)
    scene.add(run)

    // someone lives here: three toast crumbs off the line
    const crumbMat = paintedWood(tokens, '#DDBE8E', { grain: 0.5 })
    const crumbGeo = new THREE.BoxGeometry(0.0026, 0.0018, 0.0022)
    for (const [cx, cz, cyaw] of [
      [-0.12, -0.1, 0.6],
      [0.1, -0.13, 1.9],
      [-0.14, 0.07, 2.8],
    ] as const) {
      const crumb = new THREE.Mesh(crumbGeo, crumbMat)
      crumb.position.set(cx, 0.0009, cz)
      crumb.rotation.y = cyaw
      setProps(crumb, true, false)
      scene.add(crumb)
    }

    // tell every ToonMaterial the key light so dark bands tint, not blacken
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

registerScene('car-a', carScene('a'))
registerScene('car-b', carScene('b'))
registerScene('car-c', carScene('c'))
