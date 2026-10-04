// Stage 1 exploration: three toon ramp variants (A hard cel, B banded soft,
// C painterly), same three test props — a die-cast beveled car with stripe,
// a cereal-bowl lathe form, and an orange track channel. Registered as
// `materials-a`, `materials-b`, `materials-c` for the render harness.

import * as THREE from 'three'
import { ceramic, dieCastPaint, fabric, paintedWood, trackPlastic } from '../../render/materials.ts'
import { bowlForm, toyBlock, trackChannel } from '../../render/geometry.ts'
import { GLOBAL_TOKENS, SET_TOKENS } from '../../render/tokens.ts'
import type { ToonMaterialParams, ToonRamp } from '../../render/toon-material.ts'
import { ToonMaterial } from '../../render/toon-material.ts'
import { registerScene, type SceneEntry, type SceneFactory } from '../registry.ts'

export type RampKey = 'a' | 'b' | 'c'

interface RampVariant {
  /** The ramp shared by every material in the variant — the thing under test. */
  ramp: ToonRamp
  /** Rim strength multiplier (harder cels read with a hotter rim). */
  rimScale: number
  /** Dip-paint toy treatment amount. */
  toy: number
}

export const RAMP_VARIANTS: Record<RampKey, RampVariant> = {
  // A — hard cel: two instant steps, hot chrome rim, full dip-paint.
  a: { ramp: { steps: [0.45, 1.0], thresholds: [0.5], softness: 0.01 }, rimScale: 1.4, toy: 0.6 },
  // B — three hard steps: a deliberate middle band, moderate everything.
  b: { ramp: { steps: [0.42, 0.7, 1.0], thresholds: [0.25, 0.62], softness: 0.03 }, rimScale: 1.0, toy: 0.3 },
  // C — painterly: three wide-soft steps, tinted shadows, quiet rim.
  c: { ramp: { steps: [0.6, 0.85, 1.0], thresholds: [0.2, 0.55], softness: 0.3 }, rimScale: 0.5, toy: 0.1 },
}

const tokens = SET_TOKENS.kitchen
const KEY_INTENSITY = 1.25

function setProps(mesh: THREE.Object3D, cast: boolean, receive: boolean): void {
  mesh.castShadow = cast
  mesh.receiveShadow = receive
}

function buildProps(variant: RampVariant): THREE.Group {
  const group = new THREE.Group()
  const over = (extra: ToonMaterialParams): ToonMaterialParams => ({ ramp: variant.ramp, ...extra })

  // 1. Die-cast car-like beveled block with a cream stripe and dark wheels.
  const car = new THREE.Group()
  const body = new THREE.Mesh(
    toyBlock(0.075, 0.028, 0.034, 0.01, 0.004),
    dieCastPaint(tokens, '#E0442B', over({ toy: variant.toy, rim: { strength: 0.3 * variant.rimScale, size: 0.18 } })),
  )
  setProps(body, true, true)
  car.add(body)
  const stripe = new THREE.Mesh(
    new THREE.BoxGeometry(0.062, 0.004, 0.011),
    dieCastPaint(tokens, '#F6E9D2', over({ toy: variant.toy * 0.5, rim: { strength: 0.2 * variant.rimScale, size: 0.2 } })),
  )
  stripe.position.y = 0.027
  setProps(stripe, false, false)
  car.add(stripe)
  const wheelGeo = new THREE.CylinderGeometry(0.009, 0.009, 0.006, 20)
  wheelGeo.rotateX(Math.PI / 2)
  const wheelMat = fabric(tokens, '#4A3527', over({ rim: { strength: 0.25 * variant.rimScale, size: 0.6 } }))
  for (const [x, z] of [[0.024, 0.017], [-0.024, 0.017], [0.024, -0.017], [-0.024, -0.017]] as const) {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat)
    wheel.position.set(x, 0.009, z)
    setProps(wheel, true, false)
    car.add(wheel)
  }
  car.position.set(-0.185, 0, 0.02)
  car.rotation.y = 0.5
  group.add(car)

  // 2. Cereal-bowl lathe form in cream ceramic.
  const bowlMat = ceramic(tokens, '#EFE4CE', over({ rim: { strength: 0.18 * variant.rimScale, size: 0.4 } }))
  bowlMat.side = THREE.DoubleSide
  const bowl = new THREE.Mesh(bowlForm(0.062, 0.034, 0.0045), bowlMat)
  setProps(bowl, true, true)
  bowl.position.set(0.0, 0, -0.02)
  group.add(bowl)

  // 3. Orange track segment, the brand constant, on a diagonal.
  const track = new THREE.Mesh(
    trackChannel(0.26),
    trackPlastic(tokens, GLOBAL_TOKENS.trackOrange, over({
      toy: variant.toy * 0.6,
      rim: { strength: 0.12 * variant.rimScale, size: 0.5 },
    })),
  )
  setProps(track, true, true)
  track.position.set(0.185, 0, 0.02)
  track.rotation.y = -0.65
  group.add(track)
  return group
}

function rampScene(variantKey: RampKey): SceneFactory {
  return (ctx): SceneEntry => {
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(tokens.background)

    // One key light, warm breakfast gold, long shadow — the bible's light.
    const key = new THREE.DirectionalLight(GLOBAL_TOKENS.keyLight, KEY_INTENSITY)
    key.position.set(0.55, 0.7, 0.35)
    key.castShadow = true
    key.shadow.mapSize.set(2048, 2048)
    key.shadow.camera.left =  -1.8
    key.shadow.camera.right = 1.8
    key.shadow.camera.top = 1.8
    key.shadow.camera.bottom =  -1.8
    key.shadow.camera.near = 0.1
    key.shadow.camera.far = 3.5
    key.shadow.bias = -0.0004
    key.shadow.normalBias = 0.002
    key.shadow.radius = 3
    scene.add(key)

    // Painted-wood turntable so the grain generator shows in every shot.
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(1.3, 56),
      paintedWood(tokens, tokens.ground, { ramp: variantRamp(variantKey), grain: 0.35 }),
    )
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    scene.add(ground)
    scene.add(buildProps(RAMP_VARIANTS[variantKey]))

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

function variantRamp(key: RampKey): ToonRamp {
  return RAMP_VARIANTS[key].ramp
}

registerScene('materials-a', rampScene('a'))
registerScene('materials-b', rampScene('b'))
registerScene('materials-c', rampScene('c'))
