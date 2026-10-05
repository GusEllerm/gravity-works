// Stage 4 — the PRODUCTION bedroom set, staged for canonical renders.
// This is `src/sets/bedroom` (the permanent set) under the lighting rig and
// the framing of the ratified variant-B stills (hero-b/close-b), plus the
// render staging the set deliberately does not own: one parked car and the
// one decorative orange run the exploration threaded through the room (the
// built track comes from the kit in the game; here the run only carries the
// still). Run with
//   ?harness=1&scene=bedroom-set&shot=hero&post=on
// The focus falls back to the SceneEntry `focus` — the parked car, the
// shot's protagonist, for every shot (the §7.3 car-following band holds; it
// follows the SHOT's car).
//
// The lamp is the one light story the kitchen does not have: the rig's
// shadow-casting directional key sits AT the lamp bulb (one light direction
// explains every shadow, the ratified hero-b shadow geometry), and the set's
// own PointLight practical adds the warm pool near the shade — lit, not
// painted. Everything beyond its reach stays indigo fill, which is what
// "lamp-lit dusk" measures as: the darkest histogram in the set, all darks
// tinted (the never-list holds).

import * as THREE from 'three'
import { dieCastPaint, fabric, trackPlastic } from '../../render/materials.ts'
import { toyBlock, trackChannel } from '../../render/geometry.ts'
import { GLOBAL_TOKENS, SET_TOKENS, clampLightness, darken, mixHex } from '../../render/tokens.ts'
import { applyKeyLight, createLightingRig } from '../../render/lighting.ts'
import { buildBedroomSet, LAMP, STAGING } from '../../sets/bedroom/index.ts'
import { registerScene, type SceneEntry, type SceneFactory } from '../registry.ts'

const tokens = SET_TOKENS.bedroom
// The dusk rig: one lamp key, low and at the lamp (the exploration's
// ratified light position), a weak fill pulled only slightly toward the
// amber accent — variant B earned the set's darkest histogram precisely
// because this fill stays low and indigo.
const rig = createLightingRig(tokens, {
  keyIntensity: 0.8,
  keyPosition: [LAMP.bulb[0], LAMP.bulb[1] + 0.008, LAMP.bulb[2]],
  accentMix: 0.16,
  fillStrength: 0.2,
  shadowRadius: 4,
})

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

/** The ratified variant-B car (bluish green — the AD's "best car read in
 *  the stage", Okabe-Ito-clean, nothing in the orange family). */
function car(): THREE.Group {
  const g = new THREE.Group()
  const fill = { fillHigh: rig.fillHigh, fillLow: rig.fillLow, shadowTint: rig.shadowTint, fillStrength: rig.fillStrength }
  const body = new THREE.Mesh(toyBlock(0.075, 0.028, 0.034, 0.01, 0.004), dieCastPaint(tokens, '#1D9A74', { ...fill, toy: 0.4 }))
  props(body)
  g.add(body)
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.062, 0.004, 0.011), dieCastPaint(tokens, '#F6E9D2', fill))
  stripe.position.y = 0.027
  props(stripe)
  g.add(stripe)
  const wheelGeo = new THREE.CylinderGeometry(0.009, 0.009, 0.006, 18)
  wheelGeo.rotateX(Math.PI / 2)
  const wheelMat = fabric(tokens, TYRE_BROWN, { ...fill, rim: { strength: 0.25, size: 0.6 } })
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

/** The staging run as a vector pair (data is world-space, run 0). */
const RUN_A = new THREE.Vector3(...STAGING.trackRuns[0]!.a)
const RUN_B = new THREE.Vector3(...STAGING.trackRuns[0]!.b)
const RUN_DIR = RUN_B.clone().sub(RUN_A).normalize()

function trackAt(t: number, y = 0): THREE.Vector3 {
  return RUN_A.clone().lerp(RUN_B, t).setY(y)
}

/** The still's car: parked at the data's staging parameter, wheels in the
 *  groove, yaw along the run (the +z lookAt convention, then the quarter
 *  turn the car's authoring needs). */
function stagedCar(): THREE.Group {
  const c = car()
  const p = trackAt(STAGING.car.t, 0.0045)
  c.position.copy(p)
  c.lookAt(p.x + RUN_DIR.x, p.y + RUN_DIR.y, p.z + RUN_DIR.z)
  c.rotateY(-Math.PI / 2)
  return c
}

function bedroomSetScene(): SceneFactory {
  return (ctx): SceneEntry => {
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(darken(mixHex(tokens.background, tokens.dominant, 0.5), 0.3))
    scene.add(rig.key)

    // the permanent set — data + generators, the lamp practical included
    const set = buildBedroomSet(THREE, { tokens, rig })
    scene.add(set.group)

    // render staging: the one decorative run and the parked car
    const runMat = trackPlastic(tokens, GLOBAL_TOKENS.trackOrange, {
      fillHigh: rig.fillHigh,
      fillLow: rig.fillLow,
      shadowTint: rig.shadowTint,
      fillStrength: rig.fillStrength,
      toy: 0.2,
    })
    const run = new THREE.Mesh(trackChannel(RUN_A.distanceTo(RUN_B) - 0.008), runMat)
    run.position.copy(RUN_A.clone().lerp(RUN_B, 0.5))
    run.lookAt(RUN_B)
    props(run)
    scene.add(run)

    const hero = stagedCar()
    scene.add(hero)

    applyKeyLight(scene, rig)

    const camera = new THREE.PerspectiveCamera(ctx.rig.fov, 16 / 9, ctx.rig.near, ctx.rig.far)
    camera.position.set(...ctx.rig.position)
    camera.lookAt(new THREE.Vector3(...ctx.rig.target))
    // the tilt-shift focus rides the SHOT's car in every frame (art bible
    // §Camera; the kitchen's floor-shot exception is not needed here — the
    // bedroom's one car sits in the low camera's band already)
    const focus: readonly [number, number, number] = [hero.position.x, 0.02, hero.position.z]
    return { scene, camera, focus, tokens }
  }
}

registerScene('bedroom-set', bedroomSetScene())
