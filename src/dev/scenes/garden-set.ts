// Stage 4 — the PRODUCTION garden set, staged for canonical renders. This is
// `src/sets/garden` (the permanent set) under the lighting rig and framing of
// the ratified variant-B stills (hero-b/close-b), plus the render staging the
// set deliberately does not own: two parked cars and the one decorative run
// the exploration threaded across the patio. Run with
//   ?harness=1&scene=garden-set&shot=hero&post=on
//
// THE SUN REGIME, staged: one low WARM directional key (`SUN` — its length
// encodes the ~13° golden-hour elevation, its color a tint that is never the
// indoor breakfast key) and the SKY as the fill: the rig is built with
// `sky: SKY`, which is what pulls the shadow tint sky-side (the mechanism
// the variant-B pixels promised and did not measure). There is no practical
// here — the garden mounts NO point light, so the punctual gate stays a
// compile-time no-op and this scene takes the pure directional math the
// kitchen baselines are made of (tests/unit/garden-lighting.test.ts).
//
// The sun disc is geometry, not a light (the bible rule the renders argued
// for): the shell's flat disc is billboarded at the shot camera so it reads
// as a disc from every rig, and the hero rig is the composition that proves
// the rule — disc AND trellis shadow bars in one frame (the ratified hero-b).

import * as THREE from 'three'
import { dieCastPaint, fabric, trackPlastic } from '../../render/materials.ts'
import { toyBlock, trackChannel } from '../../render/geometry.ts'
import { GLOBAL_TOKENS, SET_TOKENS, clampLightness } from '../../render/tokens.ts'
import { applyKeyLight, createLightingRig } from '../../render/lighting.ts'
import { buildGardenSet, SKY, SKY_INFLUENCE, STAGING, SUN, FILL_STRENGTH } from '../../sets/garden/index.ts'
import { registerScene, type SceneEntry, type SceneFactory } from '../registry.ts'

const tokens = SET_TOKENS.garden
// The golden-hour rig: one low warm sun, sky-derived fill and shadow tint
// (see the header note), a slightly crisper shadow edge than the indoor
// default, and an ortho box wide enough to carry the trellis bars across
// the whole deck.
const rig = createLightingRig(tokens, {
  keyIntensity: SUN.intensity,
  keyPosition: SUN.pos,
  keyColor: SUN.color,
  sky: SKY,
  skyInfluence: SKY_INFLUENCE,
  accentMix: 0.22,
  fillStrength: FILL_STRENGTH,
  shadowRadius: SUN.shadowRadius,
  shadowExtent: SUN.shadowExtent,
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

/** The ratified variant-B cars (Okabe-Ito green hero, blue witness — the
 *  exploration's palette call, nothing in the orange family). */
function car(hex: string): THREE.Group {
  const g = new THREE.Group()
  const fill = { fillHigh: rig.fillHigh, fillLow: rig.fillLow, shadowTint: rig.shadowTint, fillStrength: rig.fillStrength }
  const body = new THREE.Mesh(toyBlock(0.075, 0.028, 0.034, 0.01, 0.004), dieCastPaint(tokens, hex, { ...fill, toy: 0.4 }))
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

function gardenSetScene(): SceneFactory {
  return (ctx): SceneEntry => {
    const scene = new THREE.Scene()
    // The flat sky: ONE color, never a gradient (the never-list holds
    // outdoors; the hedge band is where the world stops).
    scene.background = new THREE.Color(SKY)
    scene.add(rig.key)

    // the permanent set — data + generators, sun disc included
    const set = buildGardenSet(THREE, { tokens, rig })
    scene.add(set.group)
    set.sunDisc.lookAt(new THREE.Vector3(...ctx.rig.position))

    // render staging: the one decorative run and the two parked cars
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

    const hero = car('#009E73')
    const p = RUN_A.clone().lerp(RUN_B, STAGING.car.t)
    hero.position.copy(p)
    hero.lookAt(p.x + RUN_DIR.x, p.y + RUN_DIR.y, p.z + RUN_DIR.z)
    hero.rotateY(-Math.PI / 2)
    scene.add(hero)

    // the witness, parked off the run in the near grass stripe (the
    // ratified hero-b second car, kept for the establishing read)
    const witness = car('#0072BD')
    const wOff = new THREE.Vector3(-RUN_DIR.z, 0, RUN_DIR.x).multiplyScalar(-0.1)
    witness.position.copy(RUN_A.clone().lerp(RUN_B, 0.12)).add(wOff)
    witness.position.y = RUN_A.y + 0.004
    witness.rotation.y = Math.atan2(-RUN_DIR.z, RUN_DIR.x) + 0.5
    scene.add(witness)

    applyKeyLight(scene, rig)

    const camera = new THREE.PerspectiveCamera(ctx.rig.fov, 16 / 9, ctx.rig.near, ctx.rig.far)
    camera.position.set(...ctx.rig.position)
    camera.lookAt(new THREE.Vector3(...ctx.rig.target))
    // the tilt-shift focus rides the SHOT's car in every frame (art bible
    // §Camera — the car-following band follows the SHOT's car)
    const focus: readonly [number, number, number] = [hero.position.x, 0.02, hero.position.z]
    return { scene, camera, focus, tokens }
  }
}

registerScene('garden-set', gardenSetScene())
