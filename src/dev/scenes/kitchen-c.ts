// Stage 1 exploration: kitchen style tile C — the Technical Artist's draft.
// The point is an audit of the system, not artistry: a kitchen vignette
// composed ONLY from the shared generators in src/render/geometry.ts and the
// seven material classes in src/render/materials.ts, lit by one gold key
// with long tinted shadows and a mint-tinged fill. The one bespoke primitive
// is a mug ring (a thin torus) — the brief's story detail. What the system
// cannot express (the tap, the drip, the toast) is deliberately absent and
// reported in the session note rather than hand-rolled around.
//
// Registered as `kitchen-c` for the render harness; auto-discovered from
// src/dev/scenes/. Deterministic: fixed clock, no time-dependent uniforms.

import * as THREE from 'three'
import { bowlForm, toyBlock, trackChannel } from '../../render/geometry.ts'
import { ceramic, dieCastPaint, fabric, paintedWood, trackPlastic } from '../../render/materials.ts'
import { GLOBAL_TOKENS, SET_TOKENS, mixHex } from '../../render/tokens.ts'
import { ToonMaterial, type ToonMaterialParams } from '../../render/toon-material.ts'
import { registerScene, type SceneEntry, type SceneFactory } from '../registry.ts'

const tokens = SET_TOKENS.kitchen
const KEY_INTENSITY = 1.45

// The brief's light recipe: gold key + MINT fill. The token-derived fill is
// pure dominant (gold-on-gold); mixing the set's accent into it is a
// per-set art decision, done here with the tokens' own mixHex so it cannot
// drift from the palette math. If this reads well it belongs in tokens.
const mintFill: Pick<ToonMaterialParams, 'fillHigh' | 'fillLow'> = {
  fillHigh: mixHex(tokens.fillHigh, tokens.accent, 0.4),
  fillLow: mixHex(tokens.fillLow, tokens.accent, 0.3),
}

function mesh(
  geo: THREE.BufferGeometry,
  mat: THREE.Material,
  opts: { pos?: [number, number, number]; rot?: [number, number, number]; cast?: boolean; receive?: boolean },
): THREE.Mesh {
  const m = new THREE.Mesh(geo, mat)
  if (opts.pos) m.position.set(...opts.pos)
  if (opts.rot) m.rotation.set(...opts.rot)
  m.castShadow = opts.cast ?? true
  m.receiveShadow = opts.receive ?? true
  return m
}

// Painted-wood counter floor: the grain class doing the work on the biggest
// surface in frame.
function floor(): THREE.Mesh {
  const mat = paintedWood(tokens, tokens.ground, { ...mintFill, grain: 0.7 })
  const m = mesh(new THREE.CircleGeometry(1.2, 56), mat, { rot: [-Math.PI / 2, 0, 0], cast: false })
  return m
}

// The stack-of-books ramp, straight off the brief's affordance row. Every
// book is a beveled toyBlock in the painted-wood class (the bible puts
// books there); one book wears the set's mint accent.
function bookStack(): THREE.Group {
  const g = new THREE.Group()
  const book = (
    l: number, h: number, w: number, color: string, y: number, rotY = 0, grain = 0.22,
  ): THREE.Mesh =>
    mesh(toyBlock(l, h, w, 0.005), paintedWood(tokens, color, { ...mintFill, grain }), { pos: [0, y, 0], rot: [0, rotY, 0] })
  g.add(book(0.17, 0.026, 0.12, tokens.accent, 0)) // mint cover
  g.add(book(0.16, 0.023, 0.11, '#F0E2C4', 0.026, 0.1)) // cream paperback
  g.add(book(0.155, 0.021, 0.115, '#C75B3A', 0.049, -0.07)) // warm terracotta
  g.position.set(-0.02, 0, -0.40)
  return g
}

// The top book, pulled off the stack and laid down as the ramp into the
// track start — big shape, one function, reads at thumbnail.
function rampBook(): THREE.Mesh {
  const mat = paintedWood(tokens, '#D9663B', { ...mintFill, grain: 0.2 })
  const geo = toyBlock(0.26, 0.013, 0.115, 0.005)
  geo.rotateY(-Math.PI / 2) // length along +z: it runs down onto the track
  return mesh(geo, mat, { pos: [0, 0.042, -0.27], rot: [0.3, 0, 0] })
}

// One orange track run diagonal through every frame — the brand constant,
// never re-hued, and the reader's path through the vignette.
function trackRun(): THREE.Mesh {
  const mat = trackPlastic(tokens, GLOBAL_TOKENS.trackOrange, { ...mintFill, toy: 0.25 })
  return mesh(trackChannel(0.82), mat, { pos: [0, 0, 0.07] })
}

// The cereal bowl as oversized scale cue: ceramic class, two-sided lathe
// form, sitting just off the track where the banked turn will live.
function bowl(): THREE.Mesh {
  const mat = ceramic(tokens, '#F0E5CD', { ...mintFill })
  mat.side = THREE.DoubleSide
  return mesh(bowlForm(0.095, 0.04), mat, { pos: [0.22, 0, -0.16] })
}

// Toy car: die-cast body + cream stripe + fabric tires, all toyBlock / box /
// cylinder, parked mid-track for the floor shot's focus band.
function car(): THREE.Group {
  const g = new THREE.Group()
  g.add(mesh(toyBlock(0.075, 0.026, 0.036, 0.009, 0.004), dieCastPaint(tokens, '#E0442B', { ...mintFill }), { pos: [0, 0, 0] }))
  g.add(mesh(new THREE.BoxGeometry(0.062, 0.003, 0.012), dieCastPaint(tokens, '#F2DFC2', { ...mintFill, toy: 0.25, specular: { size: 0.24, strength: 0.3 } }), { pos: [0, 0.025, 0], cast: false }))
  const wheelGeo = new THREE.CylinderGeometry(0.0095, 0.0095, 0.006, 18)
  wheelGeo.rotateX(Math.PI / 2)
  const wheelMat = fabric(tokens, '#4A3527', { ...mintFill, rim: { strength: 0.3, size: 0.6 } })
  for (const [x, z] of [[0.024, 0.018], [-0.024, 0.018], [0.024, -0.018], [-0.024, -0.018]] as const) {
    g.add(mesh(wheelGeo, wheelMat, { pos: [x, 0.0095, z] }))
  }
  // Face along the track (local +x -> world +z inside the rotated world).
  g.rotation.y = -Math.PI / 2
  g.position.set(0, 0.004, -0.02)
  return g
}

// The story detail, as the brief allows: a ring from a mug, a thin torus
// lying flat — the only bespoke primitive in the tile. Two crumb blocks
// (beveled toyBlocks) sit beside it. Someone was here for breakfast.
function storyDetail(): THREE.Group {
  const g = new THREE.Group()
  const ringMat = ceramic(tokens, '#B07A45', {
    ...mintFill,
    specular: { size: 0.5, strength: 0.12 },
    rim: { strength: 0.08, size: 0.5 },
  })
  g.add(mesh(new THREE.TorusGeometry(0.036, 0.0016, 6, 40), ringMat, { pos: [-0.17, 0.0016, 0.27], rot: [-Math.PI / 2, 0, 0], cast: false }))
  const crumbMat = paintedWood(tokens, '#E8CE9E', { ...mintFill, grain: 0.3 })
  g.add(mesh(toyBlock(0.009, 0.005, 0.008, 0.002, 0.001), crumbMat, { pos: [-0.115, 0, 0.315], rot: [0, 0.6, 0] }))
  g.add(mesh(toyBlock(0.007, 0.004, 0.007, 0.002, 0.001), crumbMat, { pos: [-0.135, 0, 0.345], rot: [0, 1.9, 0] }))
  return g
}

const kitchenScene: SceneFactory = (ctx): SceneEntry => {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(tokens.background)

  // One gold breakfast key, low enough for the bible's long shadows; the
  // world group is yawed so the run cuts across them.
  const key = new THREE.DirectionalLight(GLOBAL_TOKENS.keyLight, KEY_INTENSITY)
  key.position.set(-0.95, 0.52, -0.75)
  key.castShadow = true
  key.shadow.mapSize.set(4096, 4096)
  key.shadow.camera.left = -0.85
  key.shadow.camera.right = 0.85
  key.shadow.camera.top = 0.85
  key.shadow.camera.bottom = -0.85
  key.shadow.camera.near = 0.4
  key.shadow.camera.far = 3
  key.shadow.bias = -0.0002
  key.shadow.normalBias = 0.0025
  key.shadow.radius = 4
  scene.add(key)

  const world = new THREE.Group()
  world.rotation.y = 0.42 // yaw the run diagonally through the frame
  world.add(floor(), bookStack(), rampBook(), trackRun(), bowl(), car(), storyDetail())
  scene.add(world)

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

registerScene('kitchen-c', kitchenScene)
