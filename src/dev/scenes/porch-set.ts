// Stage 5 — the PRODUCTION porch set, staged for canonical renders. This is
// `src/sets/porch` (the permanent set) under the lighting rig and framing of
// the RATIFIED variant-A stills (the sunday-morning room, 15/15 at the
// judging), plus the render staging the set deliberately does not own: the
// one decorative run from the door mouth to the step and the two cars the
// exploration staged on it. Run with
//   ?harness=1&scene=porch-set&shot=hero&post=on
//
// THE MORNING-SUN REGIME, staged: one low WARM directional key (`SUN` —
// ~14° elevation, the breakfast gold `#FFE3B8`, never the indoor lamp key)
// raking THROUGH the shut screen door, and the flat SKY as the fill (the
// garden's regime, ported indoors-by-half: `sky: SKY` pulls the fill bands
// and the shadow tint sky-side). The porch's one addition is
// `porchFillFromRig`: the shadow tint's SKY LIFT that keeps this set's big
// soft cast shade out of the census BLACKISH band (the round-3 finding in
// `src/sets/porch/data.ts`). There is no practical here — A's lantern sits
// dark at the step — so the set mounts NO point light, the punctual gate
// stays a compile-time no-op, and this scene takes the pure directional
// math the kitchen baselines are made of.
//
// THE KEY LIGHT IS GEOMETRY: the weave-shadow parallelogram is cast by the
// screen door's own 6 mm mesh bars (`screen-weave` in the set's shell), not
// by a shader trick — no new shader features were needed for the port; the
// garden's `fillShadeDepth` precedent is what carries the floor camera.

import * as THREE from 'three'
import { dieCastPaint, fabric, trackPlastic } from '../../render/materials.ts'
import { toyBlock, trackChannel } from '../../render/geometry.ts'
import { GLOBAL_TOKENS, SET_TOKENS, clampLightness } from '../../render/tokens.ts'
import { applyKeyLight, createLightingRig } from '../../render/lighting.ts'
import { registerScene, type SceneEntry, type SceneFactory } from '../registry.ts'
import {
  ACCENT_MIX,
  buildPorchSet,
  FILL_SHADE_DEPTH,
  FILL_STRENGTH,
  porchFillFromRig,
  SKY,
  SKY_FILL_MIX,
  SKY_FILL_SHADE,
  SKY_INFLUENCE,
  STAGING,
  SUN,
} from '../../sets/porch/index.ts'

const tokens = SET_TOKENS.porch
// The sunday-morning rig: one low warm sun through the screen door, the
// sky-derived fill and shadow tint with the porch's lift applied inside
// `porchFillFromRig` (see the header note), a hard-ish shadow edge a touch
// crisper than the indoor default, and an ortho box wide enough to carry
// the weave parallelogram AND the rail bars across the whole deck.
const rig = createLightingRig(tokens, {
  keyIntensity: SUN.intensity,
  keyPosition: SUN.pos,
  keyColor: SUN.color,
  sky: SKY,
  skyInfluence: SKY_INFLUENCE,
  skyFillMix: SKY_FILL_MIX,
  skyFillShade: SKY_FILL_SHADE,
  fillShadeDepth: FILL_SHADE_DEPTH,
  accentMix: ACCENT_MIX,
  fillStrength: FILL_STRENGTH,
  shadowRadius: SUN.shadowRadius,
  shadowExtent: SUN.shadowExtent,
})
// Every material in this scene — set AND staging — rides the SAME lifted
// fill, so the shadow tint cannot drift between the room and its cars.
const fill = porchFillFromRig(rig)

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

/** The ratified variant-A cars (Okabe-Ito blue hero, green witness — the
 *  exploration's palette call, nothing in the orange family). */
function car(hex: string): THREE.Group {
  const g = new THREE.Group()
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

function porchSetScene(): SceneFactory {
  return (ctx): SceneEntry => {
    const scene = new THREE.Scene()
    // The flat sky: ONE color, never a gradient (the never-list holds on a
    // sun-porch; the hedge bands are where the world stops).
    scene.background = new THREE.Color(SKY)
    scene.add(rig.key)

    // the permanent set — data + generators, weave included
    const set = buildPorchSet(THREE, { tokens, rig })
    scene.add(set.group)

    // render staging: the one decorative run from the door mouth to the
    // step (the threshold IS the start gate) and the two cars
    const run = new THREE.Mesh(trackChannel(RUN_A.distanceTo(RUN_B) - 0.008), trackPlastic(tokens, GLOBAL_TOKENS.trackOrange, { ...fill, toy: 0.2 }))
    run.position.copy(RUN_A.clone().lerp(RUN_B, 0.5))
    run.lookAt(RUN_B)
    props(run)
    scene.add(run)

    const hero = car('#0072BD')
    const p = RUN_A.clone().lerp(RUN_B, STAGING.car.t)
    hero.position.copy(p)
    hero.lookAt(p.x + RUN_DIR.x, p.y + RUN_DIR.y, p.z + RUN_DIR.z)
    hero.rotateY(-Math.PI / 2)
    scene.add(hero)

    // the witness, kicked off beside the mat (the other kid is late)
    const witness = car('#009E73')
    witness.position.set(...STAGING.witness.position)
    witness.rotation.y = STAGING.witness.yaw
    scene.add(witness)

    applyKeyLight(scene, rig)

    const camera = new THREE.PerspectiveCamera(ctx.rig.fov, 16 / 9, ctx.rig.near, ctx.rig.far)
    camera.position.set(...ctx.rig.position)
    camera.lookAt(new THREE.Vector3(...ctx.rig.target))
    // the tilt-shift focus rides the SHOT's car in every frame (art bible
    // §Camera — the car-following band follows the SHOT's car)
    const focus: readonly [number, number, number] = [hero.position.x, 0.03, hero.position.z]
    return { scene, camera, focus, tokens }
  }
}

registerScene('porch-set', porchSetScene())
