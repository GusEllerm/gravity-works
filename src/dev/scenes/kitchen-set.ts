// Stage 3 — the PRODUCTION kitchen set, staged for canonical renders.
// This is `src/sets/kitchen` (the permanent set) under the lighting rig and
// the fixed framing of the tile-B integration reference, plus the render
// staging the set deliberately does not own: three parked cars and two
// decorative orange runs (the built track comes from the kit in the game;
// here the runs only carry the reference composition). Run with
//   ?harness=1&scene=kitchen-set&shot=hero&post=on
// The `focus=car` value in the render brief parses to null in
// `parseFocusParam`, which makes the harness fall back to the `focus` this
// SceneEntry carries — the car riding the bowl rim, exactly the tilt-shift
// subject of the reference.

import * as THREE from 'three'
import { dieCastPaint, fabric, trackPlastic } from '../../render/materials.ts'
import { toyBlock, trackChannel } from '../../render/geometry.ts'
import { GLOBAL_TOKENS, SET_TOKENS, clampLightness } from '../../render/tokens.ts'
import { applyKeyLight, createLightingRig } from '../../render/lighting.ts'
import { buildKitchenSet, bowlArcPoint, STAGING } from '../../sets/kitchen/index.ts'
import { registerScene, type SceneEntry, type SceneFactory } from '../registry.ts'

const tokens = SET_TOKENS.kitchen
const rig = createLightingRig(tokens, { accentMix: 0.4 })

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

// Tyres ride the warm-brown lightness floor (stage-1 send-back).
const TYRE_BROWN = clampLightness('#4A3527')

/** The tile-B stand-in car for set renders (the car-a re-render through the
 *  kitchen grade is the car scene's job — this keeps the set reference's
 *  silhouette byte-comparable). */
function car(): THREE.Group {
  const g = new THREE.Group()
  const body = new THREE.Mesh(
    toyBlock(0.075, 0.028, 0.034, 0.01, 0.004),
    dieCastPaint(tokens, '#E0442B', { fillHigh: rig.fillHigh, fillLow: rig.fillLow, shadowTint: rig.shadowTint, fillStrength: rig.fillStrength, toy: 0.4 }),
  )
  props(body)
  g.add(body)
  const stripe = new THREE.Mesh(
    new THREE.BoxGeometry(0.062, 0.004, 0.011),
    dieCastPaint(tokens, '#F6E9D2', { fillHigh: rig.fillHigh, fillLow: rig.fillLow, shadowTint: rig.shadowTint, fillStrength: rig.fillStrength }),
  )
  stripe.position.y = 0.027
  props(stripe)
  g.add(stripe)
  const wheelGeo = new THREE.CylinderGeometry(0.009, 0.009, 0.006, 18)
  wheelGeo.rotateX(Math.PI / 2)
  const wheelMat = fabric(tokens, TYRE_BROWN, { fillHigh: rig.fillHigh, fillLow: rig.fillLow, shadowTint: rig.shadowTint, fillStrength: rig.fillStrength, rim: { strength: 0.25, size: 0.6 } })
  for (const [x, z] of [
    [0.024, 0.017],
    [-0.024, 0.017],
    [0.024, -0.017],
    [-0.024, -0.017],
  ] as const) {
    const w = new THREE.Mesh(wheelGeo, wheelMat)
    w.position.set(x, 0.009, z)
    props(w, true, false)
    g.add(w)
  }
  g.scale.setScalar(0.62)
  return g
}

/** A straight decorative track run from a to b (deck at a.y/b.y). */
function trackRun(a: readonly number[], b: readonly number[], mat: THREE.Material): THREE.Mesh {
  const va = new THREE.Vector3(...a)
  const vb = new THREE.Vector3(...b)
  const m = new THREE.Mesh(trackChannel(Math.max(va.distanceTo(vb) - 0.008, 0.02)), mat)
  m.position.copy(va).lerp(vb, 0.5)
  m.lookAt(vb)
  props(m)
  return m
}

function kitchenSetScene(): SceneFactory {
  return (ctx): SceneEntry => {
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(tokens.background)
    scene.add(rig.key)

    // the permanent set — data + generators, no lights, no cars
    const set = buildKitchenSet(THREE, { tokens, rig })
    scene.add(set.group)

    // render staging: the two decorative orange runs and three parked cars —
    // the composition the reference frames (the built track comes from the
    // kit in the game; these runs only carry the still)
    const runMat = trackPlastic(tokens, GLOBAL_TOKENS.trackOrange, { fillHigh: rig.fillHigh, fillLow: rig.fillLow, shadowTint: rig.shadowTint, fillStrength: rig.fillStrength, toy: 0.2 })
    for (const run of STAGING.trackRuns) scene.add(trackRun(run.a, run.b, runMat))

    // a car caught mid-descent on the ramp run
    {
      const runner = car()
      const a = new THREE.Vector3(...STAGING.trackRuns[0]!.a)
      const b = new THREE.Vector3(...STAGING.trackRuns[0]!.b)
      runner.position.lerpVectors(a, b, 0.62)
      runner.position.y += 0.004
      const d = b.clone().sub(a).normalize()
      runner.lookAt(runner.position.x + d.x, runner.position.y + d.y, runner.position.z + d.z)
      runner.rotateY(-Math.PI / 2)
      scene.add(runner)
    }

    // a car racing out along the flat run — the floor camera's hero
    {
      const racer2 = car()
      const a = new THREE.Vector3(...STAGING.trackRuns[1]!.a)
      const b = new THREE.Vector3(...STAGING.trackRuns[1]!.b)
      racer2.position.lerpVectors(a, b, 0.45)
      racer2.position.y += 0.0035
      const d = b.clone().sub(a).normalize()
      racer2.lookAt(racer2.position.x + d.x, racer2.position.y + d.y, racer2.position.z + d.z)
      racer2.rotateY(-Math.PI / 2)
      scene.add(racer2)
    }

    // the car riding the bowl's banked rim — the story of the set, parked
    // on the rim centreline inside the socket arc (the tilt-shift subject).
    // It faces along the rim in the reference's direction — the car is
    // parked where Sunday stopped it, not committed to the bowl.in→out line
    const [rx, ry, rz] = bowlArcPoint(STAGING.rimCar.angleDeg)
    const racer = car()
    racer.position.set(rx, ry - 0.006, rz)
    const a = (STAGING.rimCar.angleDeg * Math.PI) / 180
    racer.lookAt(rx - Math.sin(a) * 0.06, ry - 0.006, rz + Math.cos(a) * 0.06)
    racer.rotateY(-Math.PI / 2)
    racer.rotateX(STAGING.rimCar.bank)
    scene.add(racer)

    applyKeyLight(scene, rig)

    const camera = new THREE.PerspectiveCamera(ctx.rig.fov, 16 / 9, ctx.rig.near, ctx.rig.far)
    camera.position.set(...ctx.rig.position)
    camera.lookAt(new THREE.Vector3(...ctx.rig.target))
    return { scene, camera, focus: [rx, ry + 0.006, rz], tokens }
  }
}

registerScene('kitchen-set', kitchenSetScene())
