// Stage 3 — the PRODUCTION kitchen set, staged for canonical renders.
// This is `src/sets/kitchen` (the permanent set) under the lighting rig and
// the fixed framing of the tile-B integration reference, plus the render
// staging the set deliberately does not own: three parked cars and two
// decorative orange runs (the built track comes from the kit in the game;
// here the runs only carry the reference composition). Run with
//   ?harness=1&scene=kitchen-set&shot=hero&post=on
// The `focus=car` value in the render brief parses to null in
// `parseFocusParam`, which makes the harness fall back to the `focus` this
// SceneEntry carries — the car riding the bowl rim for establishing/hero,
// and the parked focus-band car for the floor shot (stage-3 fix 4; the
// §7.3 car-following band still holds, it just follows the SHOT's car).

import * as THREE from 'three'
import { dieCastPaint, fabric, trackPlastic } from '../../render/materials.ts'
import { toyBlock, trackChannel } from '../../render/geometry.ts'
import { GLOBAL_TOKENS, SET_TOKENS, clampLightness, mixHex } from '../../render/tokens.ts'
import { applyKeyLight, createLightingRig } from '../../render/lighting.ts'
import { BOWL_SOCKET_FRAMES, buildKitchenSet, STAGING } from '../../sets/kitchen/index.ts'
import { canonicalCamera } from '../cameras.ts'
import { registerScene, type SceneEntry, type SceneFactory } from '../registry.ts'
import { LEVELS } from '../../world/levels/feeltrack.level.ts'
import { buildTrackMeshes } from '../../world/world.ts'
import type { PieceKind } from '../../track/pieces.ts'
import { kitchenSetPlacement, placeSet } from '../../world/setPlacement.ts'

const tokens = SET_TOKENS.kitchen
// Stage-3 review fix 7 (grade): the fill gain comes down hard from the rig
// default so cast shadows earn their darks again — the reference frames
// carry core shadows; the first production frames lived entirely above 60.
// The key stays at its 1.3 breakfast value; only the fill pull is the
// scene's, which is also the answer to the AD's "did the rig drift"
// question: the rig itself did not, the set just never paid a shadow budget.
const rig = createLightingRig(tokens, { accentMix: 0.4, fillStrength: 0.07 })
// …and the shadow side of the grade: the token shadow tint sits near cream,
// so a fully-attenuated pixel could never fall below ~70 no matter where the
// fill sat. Mixed toward a deep raw umber (still pulled toward the dominant —
// tinted, never black, the never-list holds) so cast shadows carry a real
// core. Stage-3 fix 7.
rig.shadowTint = mixHex(rig.shadowTint, '#502D10', 0.7)

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
    // &level=<id> — the stage-3 wiring shot list: the real set mounted where
    // THAT level mounts it, carrying THAT level's par build instead of the
    // decorative stand-in runs (the game shell's own camera seam).
    const level = ctx.level ? LEVELS[ctx.level] : undefined
    const setPlacement = level ? kitchenSetPlacement(level.id) : null

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(tokens.background)
    scene.add(rig.key)

    // the permanent set — data + generators, no lights, no cars
    const set = buildKitchenSet(THREE, { tokens, rig })
    if (setPlacement) placeSet(set.group, setPlacement)
    scene.add(set.group)

    if (level) {
      // the level's own reference build, reified the way the game reifies it
      // — including the fixture deck-inlay signal (same table, same rule)
      scene.add(
        buildTrackMeshes((level.parBuild ?? level.placeholderBuild).call(level), {
          fixtures: (level as unknown as { fixtures?: Partial<Record<PieceKind, number>> }).fixtures,
        }),
      )
      // one car parked at the level's release pose — the shot's protagonist
      const runner = car()
      runner.position.copy(level.startSocket.pos)
      runner.lookAt(
        level.startSocket.pos.x + level.startSocket.tangent.x,
        level.startSocket.pos.y + level.startSocket.tangent.y,
        level.startSocket.pos.z + level.startSocket.tangent.z,
      )
      runner.rotateY(-Math.PI / 2)
      scene.add(runner)
      applyKeyLight(scene, rig)

      const camera = new THREE.PerspectiveCamera(ctx.rig.fov, 16 / 9, ctx.rig.near, ctx.rig.far)
      camera.position.set(...ctx.rig.position)
      camera.lookAt(new THREE.Vector3(...ctx.rig.target))
      return { scene, camera, focus: [level.startSocket.pos.x, level.startSocket.pos.y + 0.02, level.startSocket.pos.z], tokens }
    }

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

    // a car racing out along the flat run — background life for the wide
    // frames (stage-3: no longer the floor camera's hero, see floorCar)
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

    // the floor camera's focus-band car (stage-3 review fix 4): the run
    // landings both project into the frame's OUTER thirds from the low rig
    // (the ramp run ends hard left, the flat run exits right), so the AD's
    // "park it on the near run" suggestion cannot also satisfy their own
    // "middle third at 200 px" bar. This stand-in is parked on the counter
    // centreline just clear of the bowl rim — exactly where the ramp run's
    // traffic would roll to a stop — fully visible, and the floor shot
    // re-points its focus at it so the band is sharp across it.
    const floorCar = car()
    const floorCarPos: readonly [number, number, number] = [0.049, 0.0005, 0.086]
    floorCar.position.set(...floorCarPos)
    floorCar.lookAt(floorCarPos[0] + 0.577, floorCarPos[1], floorCarPos[2] - 0.817)
    floorCar.rotateY(-Math.PI / 2)
    scene.add(floorCar)

    // the car riding the bowl's rim — the story of the set (stage-3 review
    // fix 3): seated AT a named socket frame — wheels on the rim crown
    // circle, yaw along the rim tangent, level like the crown itself. The
    // old pose (centreline angle, 6 mm sunk, 0.35 bank) drove the body
    // through the ceramic — the tile-A disease in one prop. `bowl.out` is
    // the seat for the stills: at `bowl.in` the car is geometrically on the
    // crown but projects across the milk disc from the hero height and
    // reads as parked in the soup; on the far side it silhouettes clean.
    const rimPose = BOWL_SOCKET_FRAMES['bowl.out']
    const racer = car()
    racer.position.set(rimPose.pos[0], rimPose.pos[1], rimPose.pos[2])
    racer.lookAt(
      rimPose.pos[0] + rimPose.tangent[0] * 0.06,
      rimPose.pos[1] + rimPose.tangent[1] * 0.06,
      rimPose.pos[2] + rimPose.tangent[2] * 0.06,
    )
    racer.rotateY(-Math.PI / 2)
    scene.add(racer)

    applyKeyLight(scene, rig)

    const camera = new THREE.PerspectiveCamera(ctx.rig.fov, 16 / 9, ctx.rig.near, ctx.rig.far)
    camera.position.set(...ctx.rig.position)
    camera.lookAt(new THREE.Vector3(...ctx.rig.target))
    // the tilt-shift focus: the rim car everywhere EXCEPT the floor shot,
    // which re-points its band at the parked floorCar (stage-3 fix 4 — the
    // canonical floor is "a car in the focus band", and the rim car sits
    // behind the bowl wall from this height). The shot is identified by
    // the rig identity — canonicalCamera returns the one shared object.
    const isFloorShot = ctx.rig === canonicalCamera('floor')
    const focus: readonly [number, number, number] = isFloorShot
      ? [floorCarPos[0], 0.015, floorCarPos[2]]
      : [rimPose.pos[0], rimPose.pos[1] + 0.006, rimPose.pos[2]]
    return { scene, camera, focus, tokens }
  }
}

registerScene('kitchen-set', kitchenSetScene())
