// SPIKE (fp-downhill, Lane A) — THE DOWNHILL at hardware GL: the house frame
// (six ratified sets mounted at their canonical deck altitudes, joined by the
// authored drop-and-catch connector legs) under the HOUSE CAMERA law study.
//
//   /?harness=1&scene=downhill&cam=house|A1|Aleg|A2|B1|Bleg|B2&size=960x540
//
// The camera law: the farewell crane's DWELL -> MOVE grammar (`CRANE_DWELL` /
// `CRANE_MOVE` in src/pages/farewell.ts) made spatial — the room-graph
// (`roomGraph` in ./downhill-frame.ts) says which deck is next DOWN, and a
// hand-written hand-off is one pair of dwell poses plus one leg pose. The leg
// pose rides the crane-legs haze (`CRANE_HAZE.density`, FogExp2 — the lesson
// in Sessions/2026-10-11 Round3 tail: fog ships by REFERENCE swap, never by
// in-place mutation). Handoffs captured here: A = garage -> kitchen,
// B = kitchen -> bedroom. Nothing here ships.

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
import { CRANE_HAZE, CRANE_CLEAR } from '../../pages/farewell.ts'
import { layout, campaignYStats } from './downhill-frame.ts'
import { registerScene, type SceneEntry, type SceneFactory } from '../registry.ts'

const builders = {
  garage: buildGarageSet,
  kitchen: buildKitchenSet,
  bedroom: buildBedroomSet,
  bathroom: buildBathroomSet,
  garden: buildGardenSet,
  porch: buildPorchSet,
} as const

function shadowed(obj: THREE.Object3D): void {
  obj.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.castShadow = true
      o.receiveShadow = true
    }
  })
}

function downhillScene(): SceneFactory {
  return (): SceneEntry => {
    const rig = createLightingRig(SET_TOKENS.kitchen, { accentMix: 0.4, fillStrength: 0.07 })
    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#efe0c8')
    scene.add(rig.key)

    const frame = layout()
    const placeY = Object.fromEntries(campaignYStats().map((s) => [s.room, s.placeYMedian])) as Record<string, number>

    for (const deck of frame.decks) {
      const set = builders[deck.room](THREE, { tokens: SET_TOKENS[deck.room], rig })
      // the set slides UNDER its deck exactly as it does under its campaign
      // lane: centred on the run (rail midpoint ~ +1.2 m of chain), down by
      // its own measured placement-altitude statistic
      set.group.position.set(deck.x + 1.2, deck.alt + (placeY[deck.room] ?? -0.45), 0)
      shadowed(set.group)
      scene.add(set.group)
      const track = buildTrackMeshes(deck.build)
      shadowed(track)
      scene.add(track)
    }
    for (const leg of frame.legs) {
      const track = buildTrackMeshes(leg.build) // the connector fixture
      shadowed(track)
      scene.add(track)
    }
    // the world floor: the frame's ground plane (porch at 0)
    const floor = new THREE.Mesh(
      new THREE.BoxGeometry(2 * frame.floor.half[0], 2 * frame.floor.half[1], 2 * frame.floor.half[2]),
      new THREE.MeshStandardMaterial({ color: '#efe0c8', roughness: 1 }),
    )
    floor.position.set(...frame.floor.center)
    floor.receiveShadow = true
    scene.add(floor)
    applyKeyLight(scene, rig)

    // ---- the hand-written hand-offs (the camera-law study) --------------------
    const byRoom = Object.fromEntries(frame.decks.map((d) => [d.room, d]))
    const dock = (room: string): [THREE.Vector3, THREE.Vector3] => {
      const d = byRoom[room]!
      return [
        new THREE.Vector3(d.center[0] + 1.1, d.alt + 0.65, -1.9),
        new THREE.Vector3(d.center[0], d.center[1] + 0.1, 0),
      ]
    }
    const leg = (a: string, b: string): [THREE.Vector3, THREE.Vector3] => {
      const A = byRoom[a]!
      const B = byRoom[b]!
      return [
        new THREE.Vector3((A.center[0] + B.center[0]) / 2, (A.alt + B.alt) / 2 + 0.9, -2.8),
        new THREE.Vector3((A.center[0] + B.center[0]) / 2, (A.alt + B.alt) / 2 - 0.2, 0),
      ]
    }
    const cams: Record<string, { eye: THREE.Vector3; focus: THREE.Vector3; fog: number }> = {
      house: {
        eye: new THREE.Vector3(9, 6.4, -12),
        focus: new THREE.Vector3(9, 1.2, 0),
        fog: CRANE_HAZE.density * 0.35, // thin house haze across the whole section
      },
      A1: { eye: dock('garage')[0], focus: dock('garage')[1], fog: CRANE_CLEAR.density },
      Aleg: { eye: leg('garage', 'kitchen')[0], focus: leg('garage', 'kitchen')[1], fog: CRANE_HAZE.density },
      A2: { eye: dock('kitchen')[0], focus: dock('kitchen')[1], fog: CRANE_CLEAR.density },
      B1: { eye: dock('kitchen')[0], focus: dock('kitchen')[1], fog: CRANE_CLEAR.density },
      Bleg: { eye: leg('kitchen', 'bedroom')[0], focus: leg('kitchen', 'bedroom')[1], fog: CRANE_HAZE.density },
      B2: { eye: dock('bedroom')[0], focus: dock('bedroom')[1], fog: CRANE_CLEAR.density },
    }
    const camName = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('cam') ?? 'house' : 'house'
    const cam = cams[camName] ?? cams.house!
    // fog by REFERENCE (the three.js lesson: in-place fog mutation never
    // reaches compiled shaders)
    if (cam.fog > 0) scene.fog = new THREE.FogExp2('#efe0c8', cam.fog)

    const camera = new THREE.PerspectiveCamera(40, 16 / 9, 0.05, 240)
    camera.position.copy(cam.eye)
    camera.lookAt(cam.focus)
    return { scene, camera, focus: [cam.focus.x, cam.focus.y, cam.focus.z], tokens: SET_TOKENS.kitchen }
  }
}

registerScene('downhill', downhillScene())
