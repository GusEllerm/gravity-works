// Stage 4 — the PRODUCTION garage set, staged for canonical renders. This is
// `src/sets/garage` (the permanent set, ratified variant C) under the lighting
// and framing of the ratified round-2 stills, plus the render staging the set
// deliberately does not own: the two parked cars and the one decorative run
// the exploration threaded down the room. Run with
//   ?harness=1&scene=garage-set&shot=hero&post=on
//
// THE INDOOR REGIME, staged (the bathroom pattern, NOT the garden's sun/sky
// substitution): the rig is `createLightingRig` with the KEYLIGHT row from
// the set — a cool #E9F1FF key at 1.62 from the roller-door azimuth, the
// widened ±1.6 frustum and the dev bias pair (assigned manually below;
// `shadowBias` is not a rig dial). No sky value is passed, so the fill and
// the shadow tint stay on the INDOOR derivation and every other set's
// rig stays byte-identical. The "sun blade" on the floor is the set's
// lie-strip geometry, not a light; the room has exactly one key.
//
// The cars belong to the car system; they are staged here for the stills
// only. The hero carries C's round-2 knee-off treatment VERBATIM (the toy
// gradient capped at 0.25 and the cream roof stripe at 0.55 diffuse — the
// probe exonerated the stripe as a speck source only after the camera-
// matrix fix), and the track runs C's dimmer twin (`stagingTrackPlastic`).

import * as THREE from 'three'
import { dieCastPaint, fabric } from '../../render/materials.ts'
import { toyBlock, trackChannel } from '../../render/geometry.ts'
import { applyKeyLight, createLightingRig } from '../../render/lighting.ts'
import type { ToonMaterial } from '../../render/toon-material.ts'
import {
  buildGarageSet,
  GARAGE_TOKENS,
  KEYLIGHT,
  STAGING,
  SURFACES,
  stagingTrackPlastic,
} from '../../sets/garage/index.ts'
import { registerScene, type SceneEntry, type SceneFactory } from '../registry.ts'

const tokens = GARAGE_TOKENS
const rig = createLightingRig(tokens, {
  keyIntensity: KEYLIGHT.keyIntensity,
  keyPosition: KEYLIGHT.keyPosition,
  keyColor: KEYLIGHT.keyColor,
  shadowMapSize: KEYLIGHT.shadowMapSize,
  shadowExtent: KEYLIGHT.shadowExtent,
  shadowRadius: KEYLIGHT.shadowRadius,
  fillStrength: KEYLIGHT.fillStrength,
})
// the dev C sun's bias pair for the widened frustum (KEYLIGHT's non-dial
// half — the bathroom convention: the rig ships -0.0002, the ratified
// frames were rendered at -0.0004)
rig.key.shadow.bias = KEYLIGHT.shadowBias

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

/** The dev C car — the ratified sedan-blocky silhouette at the studio's
 *  C hue, with the round-2 knee-off treatment applied at build. */
function car(hex: string, kneeOff: boolean): THREE.Group {
  const g = new THREE.Group()
  const fill = {
    fillHigh: rig.fillHigh,
    fillLow: rig.fillLow,
    shadowTint: rig.shadowTint,
    fillStrength: rig.fillStrength,
    fillShadeDepth: rig.fillShadeDepth,
  }
  const body = new THREE.Mesh(toyBlock(0.075, 0.028, 0.034, 0.01, 0.004), dieCastPaint(tokens, hex, { ...fill, toy: 0.4 }))
  props(body)
  g.add(body)
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.062, 0.004, 0.011), dieCastPaint(tokens, SURFACES.carStripe, fill))
  stripe.position.y = 0.027
  props(stripe)
  g.add(stripe)
  const wheelGeo = new THREE.CylinderGeometry(0.009, 0.009, 0.006, 18)
  wheelGeo.rotateX(Math.PI / 2)
  const wheelMat = fabric(tokens, '#5A4130', { ...fill, rim: { strength: 0.25, size: 0.6 } })
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
  if (kneeOff) {
    // dev round-2 note 3, verbatim: the toy gradient comes off the bloom
    // knee and the cream stripe's diffuse drops to 0.55 (A/B keep theirs)
    for (const sub of g.children) {
      const m = (sub as THREE.Mesh).material as ToonMaterial
      if (!m?.uniforms) continue
      if ('uToy' in m.uniforms) m.uniforms.uToy.value = Math.min(m.uniforms.uToy.value as number, 0.25)
      if (m.uniforms.uColor && (m.uniforms.uColor.value as THREE.Color).getHex() === 0xf6e9d2) {
        m.uniforms.uDiffuseStrength.value = 0.55
      }
    }
  }
  g.scale.setScalar(0.62)
  return g
}

function garageSetScene(): SceneFactory {
  return (ctx): SceneEntry => {
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(tokens.background)
    scene.add(rig.key)

    // the permanent set — data + generators, blade, practical included
    const set = buildGarageSet(THREE, { tokens, rig })
    scene.add(set.group)

    // render staging: the one decorative run down the room (dev verbatim:
    // a 0.34 → b -0.27, the straight every C story aims at)
    const runA = new THREE.Vector3(...STAGING.trackRuns[0]!.a)
    const runB = new THREE.Vector3(...STAGING.trackRuns[0]!.b)
    const run = new THREE.Mesh(trackChannel(Math.max(runA.distanceTo(runB) - 0.008, 0.02)), stagingTrackPlastic(tokens, rig))
    run.position.copy(runA.clone().lerp(runB, 0.5))
    run.lookAt(runB)
    props(run)
    scene.add(run)

    // the hero on the straight at the ratified still pose (placeCar t)
    const hero = car(SURFACES.carHero, true)
    hero.position.lerpVectors(runA, runB, STAGING.car.t)
    hero.position.y = STAGING.car.y
    const dir = runB.clone().sub(runA).normalize()
    hero.lookAt(hero.position.x + dir.x, hero.position.y, hero.position.z + dir.z)
    hero.rotateY(-Math.PI / 2)
    scene.add(hero)

    // the witness, parked UNDER the bench (fix 2: one car per band — the
    // under-bench low ground, B's mezzanine port at data level, engine-
    // off, in shade behind a leg at >25 % separation from the hero)
    const witness = car(SURFACES.carWitness, false)
    witness.position.set(...STAGING.witness.position)
    witness.lookAt(...STAGING.witness.lookAt)
    witness.rotateY(-Math.PI / 2)
    scene.add(witness)

    applyKeyLight(scene, rig)

    const camera = new THREE.PerspectiveCamera(ctx.rig.fov, 16 / 9, ctx.rig.near, ctx.rig.far)
    camera.position.set(...ctx.rig.position)
    camera.lookAt(new THREE.Vector3(...ctx.rig.target))
    // the tilt-shift focus sits ON THE CORRIDOR, not on the car (dev round-2
    // note 3: the band centres on the blade so the wheel and the tunnel sit
    // sharp; the census specks were the tap-dithered bloom halo before)
    const focus: readonly [number, number, number] = STAGING.focus
    return { scene, camera, focus, tokens }
  }
}

registerScene('garage-set', garageSetScene())
