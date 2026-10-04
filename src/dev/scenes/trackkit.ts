// Harness scene `trackkit`: the stage-2 track kit's establishing shot — all 13
// kit pieces laid end to end, each seated on the previous piece's exit socket by
// the same socket math the builder will use (`chain` -> `fitSocket`). Nothing is
// hand-placed and nothing is authored twice: every mesh here is
// `TrackSpline.toMesh()` of the same spline the colliders are built from.
//
// This is a kit display, not a level. The params below are display framing —
// the same kinds with smaller numbers so the whole 13-piece chain reads inside
// the canonical establishing frustum; the shipped defaults live in
// `src/track/pieces.ts`.

import * as THREE from 'three'
import { GLOBAL_TOKENS, SET_TOKENS } from '../../render/tokens.ts'
import { paintedWood, trackPlastic } from '../../render/materials.ts'
import { ToonMaterial } from '../../render/toon-material.ts'
import { chain, reify, type Build } from '../../track/build.ts'
import { PIECES, type PieceKind, type PieceParams } from '../../track/pieces.ts'
import { registerScene, type SceneEntry, type SceneFactory } from '../registry.ts'

const tokens = SET_TOKENS.kitchen
const KEY_INTENSITY = 1.25

/** Framing overrides for the display (kit defaults are elsewhere). */
export const DISPLAY_PARAMS: Partial<Record<PieceKind, PieceParams>> = {
  straight: { length: 0.16 },
  curve: { radius: 0.16, angle: 90 },
  bigCurve: { radius: 0.28, angle: 90 },
  sbend: { radius: 0.12, angle: 40 },
  bank: { radius: 0.2, angle: 70, bank: 28 },
  loop: { radius: 0.06, lead: 0.035 },
  drop: { height: 0.17, angle: 45, radius: 0.08, lead: 0.04 },
  ramp: { level: 0.12, angle: 12, blend: 0.06 },
  gapLip: { length: 0.09, angle: 8, blend: 0.05 },
  landing: { level: 0.14, angle: 8, blend: 0.06 },
  booster: { length: 0.13, power: 0.9 },
  springLauncher: { length: 0.1, power: 2.4 },
  finishCup: { length: 0.1, cupRadius: 0.038 },
}

/** Kit order, curled so the chain folds back into frame. */
export const DISPLAY_ORDER: readonly PieceKind[] = [
  'springLauncher',
  'straight',
  'loop',
  'ramp',
  'curve',
  'bigCurve',
  'sbend',
  'bank',
  'drop',
  'gapLip',
  'landing',
  'booster',
  'finishCup',
]

/** The display build — pure data, so a test can hash it. */
export function displayBuild(): Build {
  return chain(DISPLAY_ORDER, { params: DISPLAY_PARAMS, levelId: 'trackkit', seed: 0 })
}

/** World-space bounds of a build's centrelines (used to centre the display). */
export function buildBounds(build: Build): THREE.Box3 {
  const box = new THREE.Box3()
  for (const spline of reify(build).splines) {
    for (const frame of spline.stationFrames()) box.expandByPoint(frame.pos)
  }
  return box
}

/**
 * The canonical establishing frustum covers about 1.2 m across at its target,
 * and 13 end-to-end pieces are longer than that, so the display is uniformly
 * scaled to sit inside `FIT_EXTENT` metres of footprint. Framing only — the
 * pieces themselves stay world-metre, and the build data is untouched.
 */
const FIT_EXTENT = 0.72

function trackkitScene(): SceneFactory {
  return (ctx): SceneEntry => {
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(tokens.background)

    const key = new THREE.DirectionalLight(GLOBAL_TOKENS.keyLight, KEY_INTENSITY)
    key.position.set(0.55, 0.7, 0.35)
    key.castShadow = true
    key.shadow.mapSize.set(2048, 2048)
    key.shadow.camera.left = -1.4
    key.shadow.camera.right = 1.4
    key.shadow.camera.top = 1.4
    key.shadow.camera.bottom = -1.4
    key.shadow.camera.near = 0.1
    key.shadow.camera.far = 3.5
    key.shadow.bias = -0.0004
    key.shadow.normalBias = 0.002
    key.shadow.radius = 3
    scene.add(key)

    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(0.9, 56),
      paintedWood(tokens, tokens.ground, { grain: 0.35 }),
    )
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    scene.add(ground)

    // one material pair: brand orange for the swept channel, a neutral cast
    // shell for the housings, springs and the cup
    const track = trackPlastic(tokens, GLOBAL_TOKENS.trackOrange, { toy: 0.2 })
    const shell = trackPlastic(tokens, '#DCE6EA', { toy: 0.15 })
    shell.side = THREE.DoubleSide // the cup and the plunger are open shells

    const build = displayBuild()
    const bounds = buildBounds(build)
    const centre = bounds.getCenter(new THREE.Vector3())
    const span = bounds.getSize(new THREE.Vector3())
    const fit = Math.min(1, FIT_EXTENT / Math.max(span.x, span.z))
    const display = new THREE.Group()
    display.scale.setScalar(fit)
    display.position.set(-centre.x * fit, -centre.y * fit, -centre.z * fit)

    for (const piece of reify(build).pieces) {
      const placed = new THREE.Group()
      placed.applyMatrix4(piece.transform)
      const def = PIECES[piece.def]
      const sweep = new THREE.Mesh(def.spline(piece.params).toMesh(), track)
      sweep.castShadow = true
      sweep.receiveShadow = true
      placed.add(sweep)
      for (const extra of def.extraGeometries(piece.params)) {
        const mesh = new THREE.Mesh(extra, shell)
        mesh.castShadow = true
        placed.add(mesh)
      }
      display.add(placed)
    }
    scene.add(display)

    // tell every ToonMaterial the key light so dark bands tint, not blacken
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

registerScene('trackkit', trackkitScene())
