// SPIKE (eng-free, freeplay feasibility) — the whole house in one harness
// scene: all six permanent sets instanced at their house parcels, each
// carrying its 04 room's par-build track, under the kitchen key rig. Used by
// tools/spike-freehouse-gl.mjs to MEASURE the house-scale frame cost on
// hardware GL; the parcel layout matches tools/spike-freehouse.mjs (ROOM_AT).
//
//   /?harness=1&scene=freehouse&perf=200&size=960x540
//
// Spike code: a wide crane camera stands in for the house-scale grammar
// (the canonical per-set cameras are per-set by construction — see the
// feasibility note); nothing here ships.

import * as THREE from 'three'
import { createLightingRig, applyKeyLight } from '../../render/lighting.ts'
import { SET_TOKENS } from '../../render/tokens.ts'
import { buildKitchenSet } from '../../sets/kitchen/index.ts'
import { buildBedroomSet } from '../../sets/bedroom/index.ts'
import { buildBathroomSet } from '../../sets/bathroom/index.ts'
import { buildGardenSet } from '../../sets/garden/index.ts'
import { buildGarageSet } from '../../sets/garage/index.ts'
import { buildPorchSet } from '../../sets/porch/index.ts'
import { buildTrackMeshes } from '../../world/world.ts'
import { LEVELS } from '../../world/levels/feeltrack.level.ts'
import type { Build } from '../../track/build.ts'
import { registerScene, type SceneEntry, type SceneFactory } from '../registry.ts'

const ROOMS = ['kitchen', 'bedroom', 'bathroom', 'garden', 'garage', 'porch'] as const
/** Parcels — the SAME layout the headless spike steps (spike-freehouse.mjs). */
const ROOM_AT: Record<string, readonly [number, number]> = {
  kitchen: [4, 0],
  bedroom: [12, 0],
  bathroom: [20, 0],
  garden: [4, 7],
  garage: [12, 7],
  porch: [20, 7],
}

function shifted(build: Build, dx: number, dz: number): Build {
  const T = new THREE.Matrix4().makeTranslation(dx, 0, dz)
  return { ...build, pieces: build.pieces.map((p) => ({ ...p, transform: T.clone().multiply(p.transform) })) }
}

function shadowed(obj: THREE.Object3D): void {
  obj.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.castShadow = true
      o.receiveShadow = true
    }
  })
}

function freehouseScene(): SceneFactory {
  return (): SceneEntry => {
    const rig = createLightingRig(SET_TOKENS.kitchen, { accentMix: 0.4, fillStrength: 0.07 })
    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#efe0c8')
    scene.add(rig.key)

    const builders = {
      kitchen: buildKitchenSet,
      bedroom: buildBedroomSet,
      bathroom: buildBathroomSet,
      garden: buildGardenSet,
      garage: buildGarageSet,
      porch: buildPorchSet,
    } as const

    for (const room of ROOMS) {
      const [dx, dz] = ROOM_AT[room]!
      const set = builders[room](THREE, { tokens: SET_TOKENS[room], rig })
      set.group.position.set(dx, 0, dz)
      shadowed(set.group)
      scene.add(set.group)
      const rung = LEVELS[`${room}04`]
      // A rung's PAR BUILD is optional in the `Level` shape (the rigs have
      // none); the spike only shifts a track when the room's 04 rung ships
      // one — the optional-call the type asks for, behavior unchanged.
      if (rung?.parBuild) {
        const track = buildTrackMeshes(shifted(rung.parBuild(), dx, dz))
        shadowed(track)
        scene.add(track)
      }
    }
    applyKeyLight(scene, rig)

    // the house crane: the whole parcel field in one frame (the spike's
    // stand-in for a house-scale camera law — per-set canon does not extend
    // to this extent by construction)
    const camera = new THREE.PerspectiveCamera(40, 16 / 9, 0.05, 200)
    camera.position.set(13, 7.5, -9)
    camera.lookAt(new THREE.Vector3(13, -0.4, 3.5))
    return { scene, camera, focus: [13, -0.3, 3.5], tokens: SET_TOKENS.kitchen }
  }
}

registerScene('freehouse', freehouseScene())
