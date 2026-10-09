// PROGRAM T1.3 — the PRODUCTION bathroom set, finally staged for canonical
// renders. The design evaluation's §1 finding named this row's absence:
// "the bathroom has no production still scene and no rig row at all (it
// rides the provisional kitchen fallback) — the 14/15 porcelain cathedral
// exists only on the two exploration tiles; in the game it is a mint void
// with a tile island." This scene closes that evidence gap the way the
// garage/bedroom/garden/porch rows already do: `src/sets/bathroom` (the
// permanent set, tub/ducks/tiles and all) under the ratified dev-A key
// (`KEYLIGHT` in the set data), plus the render staging the set does not
// own — one decorative orange run (STAGING) and the one parked car, the
// variant-A hue the 14/15 tile carried. Run with
//   ?harness=1&scene=bathroom-set&shot=hero&post=on
// The canonical rigs are the set's own (`CAMERAS` in `sets/bathroom/data`,
// resolved through `setCameras`); the focus law puts the band on the
// shot's car (floor shot) or the tub waterline (the money affordance).

import * as THREE from 'three'
import { dieCastPaint, fabric, trackPlastic } from '../../render/materials.ts'
import { toyBlock, trackChannel } from '../../render/geometry.ts'
import { GLOBAL_TOKENS } from '../../render/tokens.ts'
import { applyKeyLight, createLightingRig } from '../../render/lighting.ts'
import { buildBathroomSet, BATHROOM_TOKENS, CAMERAS, KEYLIGHT, STAGING, TUB } from '../../sets/bathroom/index.ts'
import { registerScene, type SceneEntry, type SceneFactory } from '../registry.ts'

const tokens = BATHROOM_TOKENS
// the ratified dev-A north window: cool key, tightened frustum (the 4096
// map + 0.7 m extent that earned the exploration's crisp tile seams)
const rig = createLightingRig(tokens, {
  keyIntensity: KEYLIGHT.keyIntensity,
  keyPosition: KEYLIGHT.keyPosition,
  keyColor: KEYLIGHT.keyColor,
  shadowMapSize: KEYLIGHT.shadowMapSize,
  shadowExtent: KEYLIGHT.shadowExtent,
  shadowRadius: KEYLIGHT.shadowRadius,
})
// the dev A bias pair for the tightened frustum (KEYLIGHT's non-dial half,
// the bathroom convention the exploration frames were rendered with)
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

/** The variant-A car — the blue sedan the 14/15 cathedral tile carried. */
function car(): THREE.Group {
  const g = new THREE.Group()
  const fill = {
    fillHigh: rig.fillHigh,
    fillLow: rig.fillLow,
    shadowTint: rig.shadowTint,
    fillStrength: rig.fillStrength,
    fillShadeDepth: rig.fillShadeDepth,
  }
  const body = new THREE.Mesh(toyBlock(0.075, 0.028, 0.034, 0.01, 0.004), dieCastPaint(tokens, '#0072BD', { ...fill, toy: 0.4 }))
  props(body)
  g.add(body)
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.062, 0.004, 0.011), dieCastPaint(tokens, '#F6E9D2', fill))
  stripe.position.y = 0.027
  props(stripe)
  g.add(stripe)
  const wheelGeo = new THREE.CylinderGeometry(0.009, 0.009, 0.006, 18)
  wheelGeo.rotateX(Math.PI / 2)
  const wheelMat = fabric(tokens, '#4A3527', { ...fill, rim: { strength: 0.25, size: 0.6 } })
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
  return g
}

function bathroomSetScene(): SceneFactory {
  return (ctx): SceneEntry => {
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(tokens.background)
    scene.add(rig.key)

    // the permanent set — tile grids, wall, window, tub, duck, sink, drain
    const set = buildBathroomSet(THREE, { tokens, rig })
    scene.add(set.group)

    // render staging: the one decorative run through the room (STAGING —
    // the exploration's hero line; the built track comes from the kit in
    // the game)
    const runA = new THREE.Vector3(...STAGING.trackRuns[0]!.a)
    const runB = new THREE.Vector3(...STAGING.trackRuns[0]!.b)
    const run = new THREE.Mesh(
      trackChannel(Math.max(runA.distanceTo(runB) - 0.008, 0.02)),
      trackPlastic(tokens, GLOBAL_TOKENS.trackOrange, { toy: 0.2 }),
    )
    run.position.copy(runA.clone().lerp(runB, 0.5))
    run.lookAt(runB)
    props(run)
    scene.add(run)

    // the hero car on the straight at the ratified still pose
    const hero = car()
    hero.position.lerpVectors(runA, runB, STAGING.car.t)
    hero.position.y = runA.y + 0.008
    const dir = runB.clone().sub(runA).normalize()
    hero.lookAt(hero.position.x + dir.x, hero.position.y, hero.position.z + dir.z)
    hero.rotateY(-Math.PI / 2)
    scene.add(hero)

    // the rig is the SET's own row (`CAMERAS` — the T1.3 rig row this scene
    // exists alongside; `setCameras` resolves it, no forked numbers here)
    void CAMERAS
    const camera = new THREE.PerspectiveCamera(ctx.rig.fov, 1600 / 900, ctx.rig.near, ctx.rig.far)
    camera.position.set(...ctx.rig.position)
    camera.lookAt(...ctx.rig.target)
    applyKeyLight(scene, rig)

    // §7.3's focus law: the band centred on the shot's protagonist — the
    // tub waterline (the cathedral's affordance) everywhere except the
    // floor rig, which lives on the car in the band
    const isFloorShot = Math.abs(ctx.rig.position[1] - 0.038) < 1e-9
    const focus = isFloorShot
      ? ([hero.position.x, hero.position.y + 0.01, hero.position.z] as const)
      : ([TUB.position[0], 0.06, TUB.position[2]] as const)
    return { scene, camera, focus, tokens }
  }
}

registerScene('bathroom-set', bathroomSetScene())
