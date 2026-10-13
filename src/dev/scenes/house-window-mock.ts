// HOUSE ART MOCK (`eval-h4-art`, Evaluation 2026-10-13 art of the house, item 5).
// The PROPOSAL, rendered: the front door cross-section where a window IS the
// room's own doorframe — each deck wears a doorway in its own set palette
// (posts + lintel + a sill plank to carry the room's sill props) standing
// exactly where the deck is, and BEHIND every doorway the room's own ratified
// set is mounted at the deck's offset (the dressing pass re-run at frame
// offsets, not a new material language). The camera is `homePose` — the SAME
// pure pose the front door parks its crane at — so this is the home screen
// with its three plan lines on, nothing else changed.
//
//   ?harness=1&scene=house-window-mock        (also: &voidfog=on — plan line 2)

import * as THREE from 'three'
import { createLightingRig, applyKeyLight, type LightingRig } from '../../render/lighting.ts'
import { SET_TOKENS } from '../../render/tokens.ts'
import { paintedWood } from '../../render/materials.ts'
import { toyBlock } from '../../render/geometry.ts'
import { buildKitchenSet } from '../../sets/kitchen/index.ts'
import { buildBedroomSet } from '../../sets/bedroom/index.ts'
import { buildBathroomSet } from '../../sets/bathroom/index.ts'
import { buildGardenSet } from '../../sets/garden/index.ts'
import { buildGarageSet } from '../../sets/garage/index.ts'
import { buildPorchSet } from '../../sets/porch/index.ts'
import { buildTrackMeshes } from '../../world/world.ts'
import { houseLayout } from '../../world/house-frame.ts'
import {
  kitchenSetPlacement,
  bedroomSetPlacement,
  bathroomSetPlacement,
  gardenSetPlacement,
  garageSetPlacement,
  porchSetPlacement,
  placeSet,
} from '../../world/setPlacement.ts'
import { homePose } from '../../camera/house-camera.ts'
import { registerScene, type SceneEntry, type SceneFactory } from '../registry.ts'

const BUILDERS = {
  garage: buildGarageSet,
  kitchen: buildKitchenSet,
  bedroom: buildBedroomSet,
  bathroom: buildBathroomSet,
  garden: buildGardenSet,
  porch: buildPorchSet,
} as const

const PLACERS: Record<string, (id: string) => { position: [number, number, number]; yaw: number } | null> = {
  garage: garageSetPlacement,
  kitchen: kitchenSetPlacement,
  bedroom: bedroomSetPlacement,
  bathroom: bathroomSetPlacement,
  garden: gardenSetPlacement,
  porch: porchSetPlacement,
}

function shadowed(obj: THREE.Object3D): void {
  obj.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.castShadow = true
      o.receiveShadow = true
    }
  })
}

/** THE DOLLHOUSE CUT: at cross-section altitudes a set's big backdrop geometry
 *  (walls, floor discs, slabs — anything wider than 0.85 m or taller than
 *  0.45 m) reads as a flat coloured band across the section, so the mock
 *  culls it and the deck wears a room SHELF instead (plan line 1's honest
 *  cost: the dressing pass at frame offsets must state which meshes survive
 *  the frame camera). */
function dollhouseCut(group: THREE.Object3D): void {
  const box = new THREE.Box3()
  const victims: THREE.Object3D[] = []
  group.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return
    const geo = o.geometry.clone()
    geo.computeBoundingBox()
    if (geo.boundingBox) {
      box.copy(geo.boundingBox).applyMatrix4(o.matrixWorld)
      const s = box.getSize(new THREE.Vector3())
      if (Math.max(s.x, s.z) > 0.85 || s.y > 0.45) victims.push(o)
    }
    geo.dispose()
  })
  for (const v of victims) v.parent?.remove(v)
}

/** THE WINDOW TREATMENT: the room's own doorframe — chunky painted-wood posts
 *  in the set's DOMINANT, an accent lintel, and a forward sill plank (the
 *  sill the tour UI already prints its star line on, now as geometry the
 *  set's own dressing can dress). Standing at the deck's own x-centre on the
 *  track plane, wide enough to frame the run-through. */
function doorframe(room: keyof typeof BUILDERS, cx: number, cy: number, cz: number): THREE.Group {
  const T = SET_TOKENS[room]
  const g = new THREE.Group()
  const wood = paintedWood(T, T.dominant)
  const trim = paintedWood(T, T.accent)
  const W = 0.62
  const H = 0.42
  for (const s of [-1, 1]) {
    const post = new THREE.Mesh(toyBlock(0.05, H, 0.06, 0.012), wood)
    post.position.set(cx + (s * W) / 2, cy - H / 2, cz)
    g.add(post)
  }
  const lintel = new THREE.Mesh(toyBlock(W + 0.12, 0.055, 0.07, 0.014), trim)
  lintel.position.set(cx, cy + H / 2 + 0.0275, cz)
  g.add(lintel)
  const sill = new THREE.Mesh(toyBlock(W + 0.16, 0.03, 0.11, 0.01), wood)
  sill.position.set(cx, cy - H / 2 - 0.015, cz + 0.03)
  g.add(sill)
  return g
}

function houseWindowMockScene(): SceneFactory {
  return (ctx): SceneEntry => {
    const layout = houseLayout()
    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#efe0c8')
    // One key (the studio's one-key law survives the house: it is ONE house
    // lit at one time of day); the per-room rigs only tint shadows/fill.
    let keyAdded = false
    for (const deck of layout.decks) {
      const room = deck.room
      const rig: LightingRig = createLightingRig(SET_TOKENS[room], {
        accentMix: 0.4,
        fillStrength: 0.07,
      })
      if (!keyAdded) {
        scene.add(rig.key)
        keyAdded = true
      }
      // THE DRESSING PASS AT FRAME OFFSETS: the room's own set, mounted as
      // its 04 mounts it, translated with its deck (the house-frame rule:
      // translation only — never a re-author).
      const set = BUILDERS[room](THREE, { tokens: SET_TOKENS[room], rig })
      const p = PLACERS[room]?.(deck.rung)
      if (p) placeSet(set.group, p)
      set.group.position.x += deck.x
      set.group.position.y += deck.alt
      set.group.updateMatrixWorld(true)
      dollhouseCut(set.group)
      shadowed(set.group)
      scene.add(set.group)
      applyKeyLight(set.group, rig)
      // the deck's track and the legs (the orange constant, untouched)
      const deckTrack = buildTrackMeshes(deck.build)
      shadowed(deckTrack)
      scene.add(deckTrack)
      // THE WINDOW = THE DOORFRAME (plan line 3) + the room's own shelf
      const shelf = new THREE.Mesh(
        toyBlock(
          Math.max(deck.bounds.max[0] - deck.bounds.min[0], 0.6) + 0.28,
          0.035,
          0.58,
          0.012,
        ),
        paintedWood(SET_TOKENS[room], SET_TOKENS[room].ground),
      )
      shelf.position.set(deck.center[0], deck.center[1] - 0.075, deck.center[2] + 0.12)
      shadowed(shelf)
      scene.add(shelf)
      const frame = doorframe(room, deck.center[0], deck.center[1] + 0.06, deck.center[2] + 0.26)
      shadowed(frame)
      scene.add(frame)
    }
    for (const leg of layout.legs) {
      const track = buildTrackMeshes(leg.build)
      shadowed(track)
      scene.add(track)
    }
    // plan line 2 (optional): the void gets the build-view fog AT THE HOME
    // CAMERA ONLY — a density that reads at the home distance, 0 on decks
    if (new URLSearchParams(location.search).get('voidfog') === 'on') {
      scene.fog = new THREE.FogExp2(new THREE.Color('#efe0c8').getHex(), 0.055)
    }
    const pose = homePose(layout, 35, 16 / 9)
    const camera = new THREE.PerspectiveCamera(35, 16 / 9, 0.01, 400)
    camera.position.set(...pose.eye)
    camera.lookAt(...pose.target)
    void ctx
    return { scene, camera, focus: pose.target, tokens: SET_TOKENS.kitchen }
  }
}

registerScene('house-window-mock', houseWindowMockScene())
