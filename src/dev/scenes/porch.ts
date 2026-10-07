// Stage 5 exploration — Art Director, PORCH set, three variants.
//
// The sixth set is a THRESHOLD: the plank deck between the house door and the
// yard, where toy cars cross from indoors to outdoors. Kitchen conventions
// hold (seven material classes, three-step ramp, one key + two-band fill,
// flat non-gradient backdrop, orange track never re-hued, 1:64 car); kitchen,
// garden and garage palettes are not reused — the porch seed is slate-blue
// storm + lantern amber (tokens.ts), and this exploration asks what the
// threshold actually IS by making each variant a genuinely different room:
//
//   porch-a — MORNING SIDELIGHT through the screen door: a dry sun-porch.
//             Low gold key rakes through the screen mesh and lays its weave
//             as a long shadow grid on bleached planks. The house is awake.
//   porch-b — DUSK LANTERN: an evening room under one amber practical hung
//             in the focus band, deep dusk sky over the rail, chalk hopscotch
//             still on the boards, the front door open with the hall lamp on.
//   porch-c — RAINY OVERHANG: a storm shelter. The roof keeps the deck dry
//             except where the gutter flume drowns off onto the lane; rain
//             falls ONLY beyond the eaves line, and the door is shut.
//
// Same six props in all three — house wall with door + screen door, railing +
// posts, downspout + gutter flume, lantern, wind chime, planter + the kid's
// shoes — each doing a different job, so the comparison is about ground,
// light and palette, not prop inventory. The AD-2 rule from the garage review
// is honored by construction: the accent is spent INSIDE the focus band in
// every variant (A the doormat band + geraniums, B the lantern itself, C the
// rain boots), never hung above the rail.
//
// Geometry law learned the hard way in round 0: `toyBlock` RESTS on local
// y = 0 (unlike BoxGeometry, which centers). Every toyBlock below is placed
// by its BOTTOM face. The floor-camera law holds too: the driveable deck
// stays a few millimetres off y = 0.
//
// Static: fixed clock, nothing animates. Throwaway dev scene.

import * as THREE from 'three'
import { ceramic, dieCastPaint, fabric, glass, liquid, paintedWood, trackPlastic } from '../../render/materials.ts'
import { toyBlock, trackChannel } from '../../render/geometry.ts'
import { applyKeyLight, createLightingRig, fillFromRig } from '../../render/lighting.ts'
import { GLOBAL_TOKENS, SET_TOKENS, clampLightness, darken, lighten, mixHex, type SetTokens } from '../../render/tokens.ts'
import { registerScene, type SceneEntry, type SceneFactory } from '../registry.ts'

type Variant = 'a' | 'b' | 'c'

interface VariantSpec {
  tokens: SetTokens
  /** Flat sky/wall value behind everything — never a gradient. */
  background: string
  keyColor: string
  keyIntensity: number
  keyPos: [number, number, number]
  shadowRadius: number
  fillStrength: number
  /** The porch is half-outdoor: the fill and shadow tint take a cut of the
   *  sky value through the rig's outdoor branch (garden rule). */
  sky: string
  skyFillMix: number
  skyInfluence: number
  skyFillShade: number
  fillShadeDepth: number
  carHex: string
  plankHex: string
  wallHex: string
  yardHex: string
  /** What the interior behind the door opening looks like. */
  interiorHex: string
  interiorGlow: number
}

/** Mirror of tokens.ts derive() (private there), porch-labelled. */
function tokensFor(dominant: string, accent: string): SetTokens {
  return {
    name: 'porch',
    dominant,
    accent,
    fillHigh: lighten(dominant, 0.3),
    fillLow: mixHex(darken(dominant, 0.42), GLOBAL_TOKENS.cream, 0.25),
    shadowTint: mixHex(lighten(dominant, 0.08), GLOBAL_TOKENS.cream, 0.3),
    ground: mixHex(GLOBAL_TOKENS.cream, dominant, 0.3),
    background: lighten(mixHex(dominant, GLOBAL_TOKENS.cream, 0.55), 0.18),
    track: GLOBAL_TOKENS.trackOrange,
  }
}

const STEEL = '#8F887A' // galvanized, kept warm per the never-grey rule, and
// noticeably darker than the stage-1 chrome: at 1:64 a galvanized gutter is a
// weathered band, not a mirror (round-1 note).

const VARIANTS: Record<Variant, VariantSpec> = {
  // A — the sun-porch. The token slate dominant stays (it is a north-facing
  // deck that the morning finally reaches), warmed entirely by the KEY, not
  // by re-hueing the room: low gold at ~17° raking from frame left.
  a: {
    tokens: SET_TOKENS.porch,
    background: '#B7D4E2',
    keyColor: '#FFE3B8',
    keyIntensity: 1.42,
    keyPos: [-1.05, 0.32, 0.78],
    shadowRadius: 2.2,
    fillStrength: 0.28,
    sky: '#B7D4E2',
    skyFillMix: 0.4,
    skyInfluence: 0.45,
    skyFillShade: 0,
    fillShadeDepth: 0.72,
    carHex: '#0072BD',
    plankHex: '#BD9666',
    wallHex: '#7C93A6',
    yardHex: '#7C9A58',
    interiorHex: '#7A6650',
    interiorGlow: 0.35,
  },
  // B — the evening room. Dominant deepened toward the dusk sky (the day's
  // slate gone dusk-slate), the token amber spent ON the lantern and its
  // pool only. The key's BEARING is the lantern's: shadows radiate away
  // from the lamp, so the practical reads as the source. The planks sit a
  // stop darker than A's — round 0's B rendered high-key, which is how you
  // lose a dusk.
  b: {
    tokens: tokensFor(mixHex('#6C8AA6', '#2E4159', 0.5), SET_TOKENS.porch.accent),
    background: '#2E4159',
    keyColor: '#FFC08A',
    keyIntensity: 1.35,
    keyPos: [0.72, 0.55, 0.3],
    shadowRadius: 3,
    fillStrength: 0.26,
    sky: '#3E5A78',
    skyFillMix: 0.45,
    skyInfluence: 0.75,
    skyFillShade: 0.1,
    fillShadeDepth: 1.0,
    carHex: '#CC79A7',
    plankHex: '#7D6C58',
    wallHex: '#6F7F96',
    yardHex: '#5A6E60',
    interiorHex: '#A8703C',
    interiorGlow: 0.9,
  },
  // C — the storm shelter. The token slate lifted toward storm blue-grey,
  // the amber spent TWICE only (boots, lantern glass that was lit yesterday);
  // everything else is wet slate and washed chalk.
  c: {
    tokens: tokensFor(mixHex('#6C8AA6', '#3E5A78', 0.35), SET_TOKENS.porch.accent),
    background: '#8DA1B2',
    keyColor: '#E8F1F8',
    keyIntensity: 1.05,
    keyPos: [0.45, 1.15, 0.65],
    shadowRadius: 7,
    fillStrength: 0.36,
    sky: '#7E96AB',
    skyFillMix: 0.5,
    skyInfluence: 0.65,
    skyFillShade: 0.1,
    fillShadeDepth: 0.82,
    carHex: '#009E73',
    plankHex: '#757063',
    wallHex: '#75869A',
    yardHex: '#5A6E64',
    interiorHex: '#5C6878',
    interiorGlow: 0.3,
  },
}

type FillBag = ReturnType<typeof fillFromRig>

// The door is the set's CENTER of gravity (and sits near x = -0.05 so the
// canonical hero rig frames the threshold, not an empty deck).
const DOOR = { x0: -0.12, x1: 0.02, top: 0.32 }

// ---- helpers ----------------------------------------------------------

function makeRng(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

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

/** The room: sky background, one key through the rig's outdoor branch (the
 *  porch is half-outdoor — shade over the rail is sky-lit), no clutter. */
function shell(v: VariantSpec): { scene: THREE.Scene; fill: FillBag; rig: ReturnType<typeof createLightingRig> } {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(v.background)
  const rig = createLightingRig(v.tokens, {
    keyIntensity: v.keyIntensity,
    keyPosition: v.keyPos,
    keyColor: v.keyColor,
    accentMix: 0.22,
    fillStrength: v.fillStrength,
    shadowRadius: v.shadowRadius,
    shadowExtent: 1.4,
    sky: v.sky,
    skyFillMix: v.skyFillMix,
    skyInfluence: v.skyInfluence,
    skyFillShade: v.skyFillShade,
    fillShadeDepth: v.fillShadeDepth,
  })
  scene.add(rig.key)
  // OUTDOOR-HALF shadow tint (AD note 2 lineage, round 2 finding): the rig's
  // deepened-sky tint at census depth measures (31,35,39) — a TINTED hue with
  // a channel spread of 8, which the census files as blackish. Cast shade on
  // this set is a big soft share of the frame, so the tint carries more of
  // the sky's own light: still sky-hued, still shade, but with a spread the
  // never-list audit can read as colour, not soot.
  const fill = fillFromRig(rig)
  return { scene, fill: { ...fill, shadowTint: mixHex(fill.shadowTint, mixHex(v.sky, '#FFFFFF', 0.6), 0.85) }, rig }
}

// ---- the porch shell (shared geometry, variant palettes) ----------------

/** Plank deck: x -0.56..0.56, z -0.30..0.43, top at y = 5 mm (floor-camera
 *  law). Seams read because the bed under the planks is darker. */
function deck(v: VariantSpec, fill: FillBag): THREE.Group {
  const g = new THREE.Group()
  const bed = new THREE.Mesh(toyBlock(1.16, 0.004, 0.78, 0.006, 0.001), paintedWood(v.tokens, darken(v.plankHex, 0.10), { ...fill, grain: 0.3, grainScale: 0.4 }))
  bed.position.y = -0.002
  props(bed, false, true)
  g.add(bed)
  const geo = toyBlock(1.14, 0.005, 0.05, 0.004, 0.001)
  const mats = [
    paintedWood(v.tokens, v.plankHex, { ...fill, grain: 0.5, grainScale: 0.35, toy: 0.15 }),
    paintedWood(v.tokens, lighten(v.plankHex, 0.03), { ...fill, grain: 0.5, grainScale: 0.35, toy: 0.15 }),
  ]
  const d = new THREE.Object3D()
  mats.forEach((m, ri) => {
    const mesh = new THREE.InstancedMesh(geo, m, 7)
    for (let i = 0; i < 7; i++) {
      d.position.set(0, 0, -0.285 + (ri * 7 + i) * 0.055)
      d.rotation.set(0, 0, 0)
      d.updateMatrix()
      mesh.setMatrixAt(i, d.matrix)
    }
    props(mesh, false, true)
    g.add(mesh)
  })
  return g
}

/** House wall on -z (x -1.15..0.85, y 0..0.62 — wide and tall enough that no
 *  canonical camera sees "porch floating in a field"), a door opening at
 *  x -0.12..0.02, a window right of it, and the dark (or lamp-lit) hall
 *  behind the opening. ALL toyBlock placements are by bottom face. */
function houseWall(v: VariantSpec, fill: FillBag): THREE.Group {
  const t = v.tokens
  const g = new THREE.Group()
  const wood = paintedWood(t, v.wallHex, { ...fill, grain: 0.4, grainScale: 0.3, toy: 0.1 })
  const z = -0.312
  const panels: Array<[number, number, number, number]> = [
    // [x0, x1, y0, y1]
    [-1.15, DOOR.x0 - 0.01, 0, 0.62],
    [DOOR.x1 + 0.01, 0.85, 0, 0.62],
    [DOOR.x0 - 0.01, DOOR.x1 + 0.01, DOOR.top, 0.62],
  ]
  for (const [x0, x1, y0, y1] of panels) {
    const p = new THREE.Mesh(toyBlock(x1 - x0, y1 - y0, 0.03, 0.008, 0.002), wood)
    p.position.set((x0 + x1) / 2, y0, z)
    props(p)
    g.add(p)
  }
  // clapboard relief rows FLUSH with the wall face, read as seam LINES
  // (round 0 left them proud of the face and the key lit them as bricks)
  const d = new THREE.Object3D()
  const segs: Array<[number, number, number]> = []
  for (let y = 0.03; y < DOOR.top + 0.02; y += 0.048) {
    segs.push([-0.64, 1.02, y], [0.43, 0.84, y])
  }
  for (let y = 0.37; y < 0.62; y += 0.048) segs.push([-0.15, 2.0, y])
  const seamMat = paintedWood(t, darken(v.wallHex, 0.14), { ...fill, grain: 0.3, toy: 0.05 })
  const boards = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.026, 0.012), seamMat, segs.length)
  segs.forEach(([cx, w, y], i) => {
    d.position.set(cx, y, -0.306)
    d.scale.set(w, 1, 1)
    d.rotation.set(0, 0, 0)
    d.updateMatrix()
    boards.setMatrixAt(i, d.matrix)
  })
  props(boards, false, true)
  g.add(boards)
  // door casing
  const casing = paintedWood(t, lighten(v.wallHex, 0.22), { ...fill, grain: 0.35 })
  for (const cx of [DOOR.x0 - 0.016, DOOR.x1 + 0.016]) {
    const jamb = new THREE.Mesh(toyBlock(0.026, DOOR.top + 0.02, 0.02, 0.005, 0.001), casing)
    jamb.position.set(cx, 0, -0.3)
    props(jamb)
    g.add(jamb)
  }
  const head = new THREE.Mesh(toyBlock(0.21, 0.026, 0.02, 0.005, 0.001), casing)
  head.position.set((DOOR.x0 + DOOR.x1) / 2, DOOR.top, -0.3)
  props(head)
  g.add(head)
  // the hall behind the opening: a warm dark (or a lamp-lit hall in B)
  const back = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.34), fabric(t, v.interiorHex, { ...fill, diffuseStrength: v.interiorGlow, rim: { strength: 0, size: 0.5 } }))
  back.position.set(-0.05, 0.17, -0.335)
  props(back, false, false)
  g.add(back)
  // window right of the door: frame, sill, glass
  const glassMat = glass(t, mixHex(v.sky, '#FFFFFF', 0.35), { ...fill, opacity: 0.4 })
  const pane = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.14), glassMat)
  pane.position.set(0.38, 0.28, -0.296)
  g.add(pane)
  for (const [cx, yBottom, w, h] of [[0.38, 0.34, 0.24, 0.02], [0.38, 0.202, 0.24, 0.02], [0.272, 0.2, 0.02, 0.16], [0.488, 0.2, 0.02, 0.16], [0.38, 0.205, 0.012, 0.15]] as const) {
    const bar = new THREE.Mesh(toyBlock(w, h, 0.018, 0.004, 0.001), casing)
    bar.position.set(cx, yBottom, -0.296)
    props(bar)
    g.add(bar)
  }
  const sill = new THREE.Mesh(toyBlock(0.28, 0.016, 0.04, 0.005, 0.001), casing)
  sill.position.set(0.38, 0.19, -0.286)
  props(sill)
  g.add(sill)
  // a short RETURN wall on the left: the porch is a corner of the house, and
  // without it the establishing rig sees "porch floating in a field"
  const ret = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.62, 0.52), wood)
  ret.position.set(-1.14, 0.31, -0.05)
  props(ret)
  g.add(ret)
  return g
}

/** Roof: no-cast ceiling (the key must reach the deck), beams, two corner
 *  posts, fascia. The eaves line at z = 0.44 is the rain boundary in C. */
function roofAndRail(v: VariantSpec, fill: FillBag): THREE.Group {
  const t = v.tokens
  const g = new THREE.Group()
  const wood = paintedWood(t, lighten(v.wallHex, 0.14), { ...fill, grain: 0.35, grainScale: 0.5 })
  const ceil = new THREE.Mesh(new THREE.BoxGeometry(1.16, 0.016, 0.78), wood)
  ceil.position.set(0, 0.47, 0.05)
  ceil.castShadow = false
  ceil.receiveShadow = true
  g.add(ceil)
  const fascia = new THREE.Mesh(toyBlock(1.18, 0.055, 0.02, 0.008, 0.002), wood)
  fascia.position.set(0, 0.44, 0.438)
  props(fascia)
  g.add(fascia)
  const beam = new THREE.Mesh(toyBlock(1.16, 0.03, 0.03, 0.006, 0.002), wood)
  beam.position.set(0, 0.432, 0.42)
  props(beam)
  g.add(beam)
  for (const px of [-0.56, 0.56]) {
    const post = new THREE.Mesh(toyBlock(0.022, 0.455, 0.022, 0.006, 0.002), wood)
    post.position.set(px, 0, 0.41)
    props(post)
    g.add(post)
  }
  // railings: top rail, mid rail, chunky balusters; the front run breaks for
  // the step at x 0.02..0.20
  const railRuns: Array<[number, number, number, number, 'x' | 'z']> = [
    [-0.56, -0.01, 0.41, 0.41, 'x'],
    [0.21, 0.56, 0.41, 0.41, 'x'],
    [-0.56, -0.56, -0.28, 0.38, 'z'],
    [0.56, 0.56, -0.28, 0.38, 'z'],
  ]
  const balMat = paintedWood(t, lighten(v.wallHex, 0.1), { ...fill, grain: 0.3 })
  const d = new THREE.Object3D()
  const balusters = new THREE.InstancedMesh(toyBlock(0.013, 0.09, 0.013, 0.004, 0.001), balMat, 48)
  let bi = 0
  for (const [x0, x1, z0, z1, axis] of railRuns) {
    const len = axis === 'x' ? x1 - x0 : z1 - z0
    const mid: [number, number] = [(x0 + x1) / 2, (z0 + z1) / 2]
    for (const yBottom of [0.142, 0.052]) {
      const rail = new THREE.Mesh(toyBlock(axis === 'x' ? len : 0.016, 0.014, axis === 'x' ? 0.016 : len, 0.004, 0.001), wood)
      rail.position.set(mid[0], yBottom, mid[1])
      props(rail)
      g.add(rail)
    }
    const n = Math.max(2, Math.round(len / 0.055))
    for (let i = 0; i <= n; i++) {
      const off = len * (i / n)
      d.position.set(axis === 'x' ? x0 + off : x0, 0.055, axis === 'x' ? z0 : z0 + off)
      d.rotation.set(0, 0, 0)
      d.updateMatrix()
      if (bi < 48) balusters.setMatrixAt(bi++, d.matrix)
    }
  }
  balusters.count = bi
  props(balusters)
  g.add(balusters)
  // the step: flush concrete stoam (floor-camera law again)
  const step = new THREE.Mesh(toyBlock(0.2, 0.004, 0.1, 0.008, 0.001), ceramic(t, mixHex(GLOBAL_TOKENS.cream, v.tokens.dominant, 0.4), { ...fill, specular: { size: 0.6, strength: 0.06 }, toy: 0.08 }))
  step.position.set(0.11, 0, 0.51)
  props(step, false, true)
  g.add(step)
  return g
}

/** The yard beyond the rail: one flat ground disc + one hedge band for a
 *  horizon (never a gradient): the world stops somewhere in every frame.
 *  OUTDOOR HALF of the porch rule (garden's AD note 2, applied): the ground
 *  is pure outdoors, so its SHADE takes the sky's fill hard — round 1's
 *  out-of-focus lawn corners measured near-black-NEUTRAL without it. */
function yard(v: VariantSpec, fill: FillBag): THREE.Group {
  const g = new THREE.Group()
  const skyFill = { ...fill, fillHigh: mixHex(fill.fillHigh, v.sky, 0.55) }
  const ground = new THREE.Mesh(new THREE.CircleGeometry(2.6, 64), fabric(v.tokens, v.yardHex, { ...skyFill, toy: 0.25, grain: 0.4, grainScale: 0.12 }))
  ground.rotation.x = -Math.PI / 2
  ground.position.y = -0.005
  ground.receiveShadow = true
  g.add(ground)
  const hedge = new THREE.Mesh(toyBlock(4.4, 0.64, 0.3, 0.08, 0.02), fabric(v.tokens, mixHex(v.yardHex, '#3A5442', 0.4), { ...skyFill, toy: 0.3, grain: 0.35, grainScale: 0.2 }))
  hedge.position.set(-0.2, 0.32, -1.45)
  props(hedge)
  g.add(hedge)
  // side bands so the horizon closes left and right of the house too
  for (const [hx, hz, ry] of [[1.6, -0.3, Math.PI / 2], [-1.85, -0.3, Math.PI / 2]] as const) {
    const sideH = new THREE.Mesh(toyBlock(3.2, 0.66, 0.3, 0.08, 0.02), fabric(v.tokens, mixHex(v.yardHex, '#3A5442', 0.4), { ...skyFill, toy: 0.3, grain: 0.35, grainScale: 0.2 }))
    sideH.position.set(hx, 0.28, hz)
    sideH.rotation.y = ry
    props(sideH)
    g.add(sideH)
  }
  return g
}

/** Door: planked shed door with a knob, hinged at the left jamb. */
function door(v: VariantSpec, fill: FillBag, open: number): THREE.Group {
  const t = v.tokens
  const pivot = new THREE.Group()
  pivot.position.set(DOOR.x0 - 0.004, 0, -0.3)
  const wood = paintedWood(t, mixHex('#5D4534', v.wallHex, 0.3), { ...fill, grain: 0.55, grainScale: 0.8, toy: 0.15 })
  const panel = new THREE.Mesh(toyBlock(0.142, DOOR.top, 0.014, 0.004, 0.001), wood)
  panel.position.set(0.075, 0, 0)
  props(panel)
  pivot.add(panel)
  // planked shed door: battens + one Z-brace break the big flat catch that
  // round 2 rendered as one saturated slab under a warm key
  const batten = paintedWood(t, mixHex('#4A3728', v.wallHex, 0.25), { ...fill, grain: 0.5, grainScale: 1.2, toy: 0.1 })
  for (const bx of [0.018, 0.056, 0.094, 0.132]) {
    const b = new THREE.Mesh(toyBlock(0.009, DOOR.top - 0.012, 0.003, 0.002, 0.0008), batten)
    b.position.set(bx, 0.008, 0.009)
    props(b)
    pivot.add(b)
  }
  const brace = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.011, 0.003), batten)
  brace.position.set(0.075, 0.15, 0.009)
  brace.rotation.z = 0.28
  props(brace)
  pivot.add(brace)
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.006, 12, 10), dieCastPaint(t, '#C8B07E', { ...fill, toy: 0.5 }))
  knob.position.set(0.128, 0.16, 0.012)
  props(knob)
  pivot.add(knob)
  pivot.rotation.y = open
  return pivot
}

/** Screen door: frame + instanced fine mesh grid whose bars DO cast — the
 *  weave the morning key combs across the deck in A. Chunky at 6 mm pitch:
 *  a real 1 mm mesh would blur to a grey veil under PCF. */
function screenDoor(v: VariantSpec, fill: FillBag, open: number): THREE.Group {
  const t = v.tokens
  const pivot = new THREE.Group()
  pivot.position.set(DOOR.x0 - 0.004, 0, -0.282)
  const frameMat = paintedWood(t, lighten(v.wallHex, 0.25), { ...fill, grain: 0.3 })
  for (const [cx, yBottom, w, h] of [[0.075, 0.294, 0.142, 0.014], [0.075, 0, 0.142, 0.014], [0.006, 0, 0.012, 0.308], [0.144, 0, 0.012, 0.308]] as const) {
    const bar = new THREE.Mesh(toyBlock(w, h, 0.012, 0.003, 0.001), frameMat)
    bar.position.set(cx, yBottom, 0)
    props(bar)
    pivot.add(bar)
  }
  // mesh weave: vertical + horizontal bars (BoxGeometry centered in Y)
  const d = new THREE.Object3D()
  const nV = Math.floor(0.13 / 0.006)
  const nH = Math.floor(0.28 / 0.006)
  const meshMat = dieCastPaint(t, '#8E9896', { ...fill, toy: 0.3, diffuseStrength: 0.8 })
  const weave = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), meshMat, nV + nH)
  let i = 0
  for (let k = 0; k < nV; k++) {
    d.position.set(0.008 + k * 0.006, 0.163, 0)
    d.scale.set(0.0014, 0.29, 0.0012)
    d.rotation.set(0, 0, 0)
    d.updateMatrix()
    weave.setMatrixAt(i++, d.matrix)
  }
  for (let k = 0; k < nH; k++) {
    d.position.set(0.075, 0.02 + k * 0.006, 0)
    d.scale.set(0.13, 0.0014, 0.0012)
    d.rotation.set(0, 0, 0)
    d.updateMatrix()
    weave.setMatrixAt(i++, d.matrix)
  }
  weave.castShadow = true
  weave.receiveShadow = false
  pivot.add(weave)
  pivot.rotation.y = open
  return pivot
}

/** Downspout against the wall: riser + elbow, discharging over the flume. */
function downspout(v: VariantSpec, fill: FillBag, x: number): THREE.Group {
  const t = v.tokens
  const g = new THREE.Group()
  const metal = dieCastPaint(t, STEEL, { ...fill, toy: 0.5, specular: { size: 0.35, strength: 0.5 }, rim: { strength: 0.3, size: 0.2 } })
  const riser = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.16, 18), metal)
  riser.position.set(x, 0.38, -0.28)
  props(riser)
  g.add(riser)
  const elbow = new THREE.Mesh(new THREE.SphereGeometry(0.016, 16, 12), metal)
  elbow.position.set(x, 0.3, -0.28)
  props(elbow)
  g.add(elbow)
  const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.014, 0.05, 16), metal)
  spout.position.set(x, 0.293, -0.26)
  spout.rotation.x = Math.PI / 2
  props(spout)
  g.add(spout)
  const strap = new THREE.Mesh(new THREE.TorusGeometry(0.016, 0.003, 8, 16), metal)
  strap.position.set(x, 0.44, -0.272)
  props(strap)
  g.add(strap)
  return g
}

/** The GUTTER FLUME — this set's signature affordance, laid at deck height
 *  (AD-2: the affordance lives IN the focus band, not on the roofline).
 *  Rectangular galvanized trough; the water job differs per variant. */
function gutterFlume(v: VariantSpec, fill: FillBag, at: [number, number], len: number, yaw: number, water: 'none' | 'trickle' | 'full'): THREE.Group {
  const t = v.tokens
  const g = new THREE.Group()
  const metal = dieCastPaint(t, STEEL, { ...fill, toy: 0.5, specular: { size: 0.35, strength: 0.5 } })
  const dark = fabric(t, '#4A5560', { ...fill, diffuseStrength: 0.4 })
  const floor = new THREE.Mesh(toyBlock(len, 0.004, 0.048, 0.004, 0.001), dark)
  floor.position.y = 0.005
  props(floor, false, true)
  g.add(floor)
  for (const pz of [-0.024, 0.024]) {
    const side = new THREE.Mesh(toyBlock(len, 0.02, 0.007, 0.003, 0.001), metal)
    side.position.set(0, 0.005, pz)
    props(side)
    g.add(side)
  }
  for (const px of [-len / 2, len / 2]) {
    const cap = new THREE.Mesh(toyBlock(0.006, 0.02, 0.055, 0.003, 0.001), metal)
    cap.position.set(px, 0.005, 0)
    props(cap)
    g.add(cap)
  }
  if (water !== 'none') {
    const surface = new THREE.Mesh(new THREE.PlaneGeometry(len - 0.012, water === 'full' ? 0.044 : 0.026), liquid(t, mixHex(v.sky, '#FFFFFF', 0.4), { ...fill, opacity: 0.6, specular: { size: 0.24, strength: 1.0 } }))
    surface.rotation.x = -Math.PI / 2
    surface.position.y = water === 'full' ? 0.0155 : 0.0115
    props(surface, false, false)
    g.add(surface)
  }
  g.position.set(at[0], 0, at[1])
  g.rotation.y = yaw
  return g
}

/** Lantern: die-cast frame, glass chimney. Lit = the chimney itself carries
 *  the diffuseStrength trick the garden's sun disc uses: it is geometry, not
 *  a flare, and it is the KEY's namesake. */
function lantern(v: VariantSpec, fill: FillBag, lit: boolean): THREE.Group {
  const t = v.tokens
  const g = new THREE.Group()
  const metal = dieCastPaint(t, mixHex('#4E5A50', STEEL, 0.4), { ...fill, toy: 0.55, rim: { strength: 0.4, size: 0.2 } })
  const base = new THREE.Mesh(toyBlock(0.03, 0.008, 0.03, 0.006, 0.002), metal)
  base.position.y = 0
  props(base)
  g.add(base)
  const chimney = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.013, 0.026, 18), lit ? ceramic(t, '#FFD98A', { ...fill, diffuseStrength: 1.45, specular: { size: 0.3, strength: 0.4 } }) : glass(t, mixHex(v.sky, '#FFFFFF', 0.5), { ...fill, opacity: 0.4 }))
  chimney.position.y = 0.024
  props(chimney, true, false)
  g.add(chimney)
  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.014, 18), metal)
  cap.position.y = 0.043
  props(cap)
  g.add(cap)
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.011, 0.0025, 8, 18, Math.PI), metal)
  handle.position.y = 0.051
  props(handle)
  g.add(handle)
  return g
}

/** Wind chime hung under the door's lintel: tubes, clapper, sail. The
 *  pendulum gate sits over the line at the head of the lane. */
function windChime(v: VariantSpec, fill: FillBag, sway: number): THREE.Group {
  const t = v.tokens
  const g = new THREE.Group()
  const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.0012, 0.0012, 0.17, 6), fabric(t, '#6E6353', fill))
  cord.position.y = 0.085
  g.add(cord)
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.016, 0.008, 16), dieCastPaint(t, '#7A6B52', { ...fill, toy: 0.5, grain: 0.4 }))
  props(hub)
  g.add(hub)
  const alu = dieCastPaint(t, mixHex(STEEL, '#FFFFFF', 0.2), { ...fill, toy: 0.3, specular: { size: 0.08, strength: 1.1 } })
  const lens = [0.055, 0.048, 0.062, 0.042, 0.052]
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.0035, 0.0035, lens[i], 10), alu)
    tube.position.set(Math.cos(a) * 0.012, -0.024 - lens[i] / 2, Math.sin(a) * 0.012)
    props(tube)
    g.add(tube)
    const link = new THREE.Mesh(new THREE.CylinderGeometry(0.0008, 0.0008, 0.016, 4), fabric(t, '#6E6353', fill))
    link.position.set(Math.cos(a) * 0.012, -0.008, Math.sin(a) * 0.012)
    g.add(link)
  }
  const clapper = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.004, 14), dieCastPaint(t, STEEL, { ...fill, toy: 0.4 }))
  clapper.position.y = -0.038
  props(clapper)
  g.add(clapper)
  const sail = new THREE.Mesh(toyBlock(0.02, 0.026, 0.002, 0.005, 0.0008), ceramic(t, mixHex(v.tokens.accent, '#F4E6CC', 0.35), { ...fill, specular: { size: 0.5, strength: 0.15 } }))
  sail.position.y = -0.088
  props(sail)
  g.add(sail)
  g.rotation.z = sway
  return g
}

/** Planter: ceramic pot, soil, geraniums — the accent vessel. */
function planter(v: VariantSpec, fill: FillBag, potHex: string, bloomHex: string, bloom: number): THREE.Group {
  const t = v.tokens
  const g = new THREE.Group()
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.032, 0.06, 22), ceramic(t, potHex, { ...fill, specular: { size: 0.5, strength: 0.14 }, toy: 0.15 }))
  pot.position.y = 0.03
  props(pot)
  g.add(pot)
  const soil = new THREE.Mesh(new THREE.CircleGeometry(0.037, 20), fabric(t, '#4A3A2C', { ...fill, toy: 0.4 }))
  soil.rotation.x = -Math.PI / 2
  soil.position.y = 0.058
  g.add(soil)
  const leaves = new THREE.Mesh(new THREE.SphereGeometry(0.04, 14, 10), fabric(t, mixHex(v.yardHex, '#4E6B3A', 0.5), { ...fill, toy: 0.3, grain: 0.3 }))
  leaves.position.y = 0.082
  leaves.scale.set(1, 0.7, 1)
  props(leaves)
  g.add(leaves)
  const d = new THREE.Object3D()
  const rnd = makeRng(4242)
  const blooms = new THREE.InstancedMesh(new THREE.SphereGeometry(0.009, 10, 8), fabric(t, bloomHex, { ...fill, rim: { strength: 0.5, size: 0.5 } }), bloom)
  for (let i = 0; i < bloom; i++) {
    d.position.set((rnd() - 0.5) * 0.06, 0.1 + rnd() * 0.02, (rnd() - 0.5) * 0.06)
    d.scale.setScalar(0.8 + rnd() * 0.5)
    d.rotation.set(0, 0, 0)
    d.updateMatrix()
    blooms.setMatrixAt(i, d.matrix)
  }
  props(blooms)
  g.add(blooms)
  return g
}

/** The kid's shoes by the door — the "someone lives here" beat. In C they
 *  are rubber boots, and they are the variant's amber spend. */
function shoes(v: VariantSpec, fill: FillBag, hex: string, boots: boolean): THREE.Group {
  const t = v.tokens
  const g = new THREE.Group()
  const mat = boots ? fabric(t, hex, { ...fill, rim: { strength: 0.35, size: 0.6 } }) : dieCastPaint(t, hex, { ...fill, toy: 0.3 })
  for (const [pz, rz] of [[0, 0.1], [0.017, -0.35]] as const) {
    const shoe = new THREE.Mesh(toyBlock(0.03, boots ? 0.032 : 0.014, 0.014, 0.005, 0.002), mat)
    shoe.position.set(0, 0.005, pz)
    shoe.rotation.y = rz
    props(shoe)
    g.add(shoe)
    if (!boots) {
      const toe = new THREE.Mesh(toyBlock(0.01, 0.008, 0.013, 0.004, 0.001), dieCastPaint(t, '#EFE3CC', fill))
      toe.position.set(0.016, 0.005, pz)
      toe.rotation.y = rz
      props(toe)
      g.add(toe)
    }
  }
  return g
}

/** Doormat: coir fabric with one accent band — A's in-band accent. */
function doormat(v: VariantSpec, fill: FillBag, band: boolean): THREE.Group {
  const t = v.tokens
  const g = new THREE.Group()
  const mat = new THREE.Mesh(toyBlock(0.12, 0.004, 0.08, 0.006, 0.001), fabric(t, mixHex('#9A7C52', v.tokens.dominant, 0.3), { ...fill, toy: 0.25, grain: 0.5, grainScale: 2.2 }))
  mat.position.set(0, 0.002, 0)
  props(mat, false, true)
  g.add(mat)
  if (band) {
    const strip = new THREE.Mesh(toyBlock(0.1, 0.0015, 0.016, 0.004, 0.0004), fabric(t, v.tokens.accent, { ...fill, rim: { strength: 0.4, size: 0.6 } }))
    strip.position.set(0, 0.0056, 0.014)
    props(strip, false, true)
    g.add(strip)
  }
  return g
}

/** Puddle: the wet-patch treatment — set-tinted liquid darker than the deck
 *  at its core, one bright sheen riding the wobble. */
function puddle(v: VariantSpec, fill: FillBag, at: [number, number], r: number, sheen = 1.0): THREE.Group {
  const g = new THREE.Group()
  const pool = new THREE.Mesh(new THREE.CircleGeometry(r, 28), liquid(v.tokens, mixHex(v.sky, '#2F4356', 0.85), { ...fill, opacity: 0.85, specular: { size: 0.22, strength: sheen } }))
  pool.rotation.x = -Math.PI / 2
  pool.position.set(at[0], 0.0056, at[1])
  pool.receiveShadow = true
  g.add(pool)
  return g
}

/** Rain beyond the eaves: frozen instanced streaks, placed ONLY outside the
 *  roof footprint (x bands beyond |0.56|, or z 0.46..0.95), so the overhang
 *  story is structural, not a shader. */
function rain(v: VariantSpec, fill: FillBag): THREE.InstancedMesh {
  const t = v.tokens
  const mat = liquid(t, mixHex(v.sky, '#FFFFFF', 0.6), { ...fill, opacity: 0.42, diffuseStrength: 1.1, specular: { strength: 0.3, size: 0.3 } })
  const rnd = makeRng(777)
  const zones: Array<[number, number, number, number]> = [
    [-0.72, 0.72, 0.47, 0.95], // the downpour in front of the step
    [0.57, 0.95, -0.28, 0.44], // rain off the right side
    [-0.95, -0.57, -0.28, 0.44], // and the left
  ]
  const per = 90
  const m = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.0007, 0.0009, 0.08, 5), mat, per * 3)
  const d = new THREE.Object3D()
  let i = 0
  for (const [x0, x1, z0, z1] of zones) {
    for (let k = 0; k < per; k++) {
      d.position.set(x0 + rnd() * (x1 - x0), 0.05 + rnd() * 0.55, z0 + rnd() * (z1 - z0))
      d.rotation.set(0.12, 0, -0.06)
      d.scale.setScalar(0.8 + rnd() * 0.6)
      d.updateMatrix()
      m.setMatrixAt(i++, d.matrix)
    }
  }
  m.castShadow = false
  m.receiveShadow = false
  return m
}

/** Drips frozen mid-fall (the stop-motion beat, frozen at the fixed clock). */
function drips(v: VariantSpec, fill: FillBag, at: [number, number], n = 3, spread = 0.03): THREE.Group {
  const g = new THREE.Group()
  const mat = liquid(v.tokens, mixHex(v.sky, '#FFFFFF', 0.7), { ...fill, opacity: 0.5, specular: { size: 0.16, strength: 0.8 } })
  for (let i = 0; i < n; i++) {
    const drop = new THREE.Mesh(new THREE.SphereGeometry(0.0022, 8, 7), mat)
    drop.position.set(at[0] + (i - (n - 1) / 2) * spread * 0.3, 0.26 - i * 0.06, at[1] + (i - (n - 1) / 2) * spread)
    drop.scale.y = 1.5
    props(drop, false, false)
    g.add(drop)
  }
  return g
}

/** Chalk hopscotch: B's boards; in C the same squares, washed and half-gone.
 *  0.052 m squares — at 76 mm the chalk out-shouts the track (round 0). */
function chalk(v: VariantSpec, fill: FillBag, strength: number): THREE.Group {
  const t = v.tokens
  const g = new THREE.Group()
  const mat = paintedWood(t, mixHex(mixHex(t.accent, GLOBAL_TOKENS.cream, 0.45), v.plankHex, 1 - strength * 0.8), { ...fill, diffuseStrength: 0.85 + strength * 0.4, grain: 0.2 })
  for (let i = 0; i < 3; i++) {
    for (const [px, pz, w, h] of [[0, 0.026, 0.054, 0.003], [0, -0.026, 0.054, 0.003], [-0.026, 0, 0.003, 0.056], [0.026, 0, 0.003, 0.056]] as const) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(w, 0.0012, h), mat)
      bar.position.set(0.36 + px, 0.0057, -0.1 + i * 0.06 + pz)
      props(bar, false, true)
      g.add(bar)
    }
  }
  return g
}

// ---- car + track -------------------------------------------------------

function car(v: VariantSpec, fill: FillBag, hex: string): THREE.Group {
  const t = v.tokens
  const g = new THREE.Group()
  const body = new THREE.Mesh(toyBlock(0.075, 0.028, 0.034, 0.01, 0.004), dieCastPaint(t, hex, { ...fill, toy: 0.4 }))
  props(body)
  g.add(body)
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.062, 0.004, 0.011), dieCastPaint(t, '#F6E9D2', fill))
  stripe.position.y = 0.027
  g.add(stripe)
  const wheelGeo = new THREE.CylinderGeometry(0.009, 0.009, 0.006, 18)
  wheelGeo.rotateX(Math.PI / 2)
  const wheelMat = fabric(t, clampLightness('#4A3527'), { ...fill, rim: { strength: 0.25, size: 0.6 } })
  for (const [x, z] of [[0.024, 0.017], [-0.024, 0.017], [0.024, -0.017], [-0.024, -0.017]] as const) {
    const w = new THREE.Mesh(wheelGeo, wheelMat)
    w.position.set(x, 0.009, z)
    props(w, true, false)
    g.add(w)
  }
  g.scale.setScalar(0.62)
  return g
}

function trackRun(v: VariantSpec, a: THREE.Vector3, b: THREE.Vector3, fill: FillBag): THREE.Mesh {
  const m = new THREE.Mesh(trackChannel(a.distanceTo(b) - 0.008), trackPlastic(v.tokens, GLOBAL_TOKENS.trackOrange, { ...fill, toy: 0.2 }))
  m.position.copy(a).lerp(b, 0.5)
  m.lookAt(b)
  props(m)
  return m
}

function placeOnTrack(c: THREE.Group, a: THREE.Vector3, b: THREE.Vector3, t: number, y: number): THREE.Group {
  c.position.lerpVectors(a, b, t)
  c.position.y = y
  c.rotation.y = Math.atan2(-(b.z - a.z), b.x - a.x)
  return c
}

function cam(ctx: { rig: { position: [number, number, number]; target: [number, number, number]; fov: number; near: number; far: number } }): THREE.PerspectiveCamera {
  const c = new THREE.PerspectiveCamera(ctx.rig.fov, 16 / 9, ctx.rig.near, ctx.rig.far)
  c.position.set(...ctx.rig.position)
  c.lookAt(new THREE.Vector3(...ctx.rig.target))
  return c
}

/** Shared furniture every variant gets; returns the track line endpoints.
 *  The line starts in the door mouth (the threshold IS the start gate) and
 *  runs for the step. */
function furnish(v: VariantSpec, scene: THREE.Scene, fill: FillBag, B: THREE.Vector3): [THREE.Vector3, THREE.Vector3] {
  const A = new THREE.Vector3(-0.05, 0.006, -0.28)
  scene.add(yard(v, fill))
  scene.add(deck(v, fill))
  scene.add(houseWall(v, fill))
  scene.add(roofAndRail(v, fill))
  scene.add(downspout(v, fill, 0.34))
  scene.add(trackRun(v, A, B, fill))
  // the mat at the threshold in all three (band only in A, its accent spend)
  const mat = doormat(v, fill, v === VARIANTS.a)
  mat.position.set(-0.05, 0, -0.2)
  scene.add(mat)
  // the chime hangs over the head of the lane in all three
  return [A, B]
}

// ---- variant A: morning sidelight through the screen door ---------------

function porchA(): SceneFactory {
  return (ctx): SceneEntry => {
    const v = VARIANTS.a
    const { scene, fill, rig } = shell(v)
    const [A, B] = furnish(v, scene, fill, new THREE.Vector3(0.2, 0.006, 0.28))

    // the door is open onto the yard; the SCREEN stays shut — the whole
    // light story is the weave combing across the boards
    scene.add(door(v, fill, -1.15))
    scene.add(screenDoor(v, fill, 0))

    // the gutter flume drinks last night's rain: a drip line from the
    // downspout, a trickle in the trough
    scene.add(gutterFlume(v, fill, [0.24, -0.225], 0.42, 0, 'trickle'))
    scene.add(drips(v, fill, [0.34, -0.235], 4, 0.02))

    // chime hung under the lintel, still
    const chime = windChime(v, fill, 0)
    chime.position.set(-0.05, 0.285, -0.25)
    scene.add(chime)

    // the kid's pair, staged beside the mat, waiting to cross the threshold
    const pair = shoes(v, fill, '#C6503C', false)
    pair.position.set(-0.2, 0, -0.17)
    pair.rotation.y = 0.5
    scene.add(pair)

    // geraniums in the accent: one by the step, one in the window box
    const pl = planter(v, fill, mixHex('#B96A45', v.tokens.dominant, 0.3), v.tokens.accent, 9)
    pl.position.set(0.4, 0, 0.24)
    scene.add(pl)
    const boxPl = planter(v, fill, mixHex('#B96A45', v.tokens.dominant, 0.4), v.tokens.accent, 6)
    boxPl.scale.setScalar(0.72)
    boxPl.position.set(0.38, 0.196, -0.27)
    scene.add(boxPl)

    // the lantern, off and leaning by the step — a lamp for later
    const lamp = lantern(v, fill, false)
    lamp.position.set(0.0, 0.005, 0.33)
    lamp.rotation.z = 0.08
    scene.add(lamp)

    const hero = car(v, fill, v.carHex)
    scene.add(placeOnTrack(hero, A, B, 0.52, 0.008))
    const witness = car(v, fill, '#009E73')
    witness.position.set(-0.34, 0.005, -0.02)
    witness.rotation.y = 0.9
    scene.add(witness)

    applyKeyLight(scene, rig)
    return { scene, camera: cam(ctx), focus: [hero.position.x, 0.03, hero.position.z], tokens: v.tokens }
  }
}

// ---- variant B: dusk lantern --------------------------------------------

function porchB(): SceneFactory {
  return (ctx): SceneEntry => {
    const v = VARIANTS.b
    const { scene, fill, rig } = shell(v)
    const [A, B] = furnish(v, scene, fill, new THREE.Vector3(0.18, 0.006, 0.3))

    scene.add(door(v, fill, -1.9))
    scene.add(screenDoor(v, fill, -2.3))

    // the LANTERN is the light: hung from a cross-line under the beam at the
    // deck's end, IN the focus band, with the key's bearing matching its own
    const lamp = lantern(v, fill, true)
    const cordG = new THREE.Group()
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.001, 0.001, 0.13, 6), fabric(v.tokens, '#4E4638', fill))
    cord.position.y = 0.065
    cordG.add(cord)
    lamp.position.y = -0.065
    cordG.add(lamp)
    cordG.position.set(0.28, 0.43, 0.12)
    scene.add(cordG)

    // the gutter flume dries out across the lane with yesterday's leaves in
    // it; the track crosses it on a plank bridge (the set's dry creek bed)
    scene.add(gutterFlume(v, fill, [0.17, 0.02], 0.54, 0, 'none'))
    const leafMat = paintedWood(v.tokens, mixHex(v.tokens.accent, '#8A5A30', 0.55), { ...fill, toy: 0.3 })
    const d = new THREE.Object3D()
    const rnd = makeRng(5150)
    const leaves = new THREE.InstancedMesh(new THREE.SphereGeometry(0.009, 10, 8), leafMat, 7)
    for (let i = 0; i < 7; i++) {
      d.position.set(0.02 + i * 0.055, 0.011, 0.02 + (rnd() - 0.5) * 0.03)
      d.rotation.set(rnd(), rnd() * 3, rnd())
      d.scale.set(1.3, 0.25, 0.9)
      d.updateMatrix()
      leaves.setMatrixAt(i, d.matrix)
    }
    props(leaves, false, true)
    scene.add(leaves)
    // where the lane meets the trough: a short plank laid across it
    const tAt = 0.02 - A.z
    const tOn = tAt / (B.z - A.z)
    const cross = new THREE.Vector3(A.x + (B.x - A.x) * tOn, 0.016, 0.02)
    const plank = new THREE.Mesh(toyBlock(0.11, 0.01, 0.072, 0.005, 0.001), paintedWood(v.tokens, lighten(v.plankHex, 0.1), { ...fill, grain: 0.45 }))
    plank.position.copy(cross)
    plank.rotation.y = Math.atan2(-(B.z - A.z), B.x - A.x)
    props(plank)
    scene.add(plank)

    // the chime catches the lantern at the door, swaying in the evening air
    const chime = windChime(v, fill, 0.1)
    chime.position.set(-0.05, 0.285, -0.25)
    scene.add(chime)

    // chalk hopscotch glowing faintly under the lamp, shoes kicked off at it
    scene.add(chalk(v, fill, 0.9))
    const pair = shoes(v, fill, '#C6503C', false)
    pair.position.set(0.26, 0, 0.08)
    pair.rotation.y = -0.8
    scene.add(pair)

    const pl = planter(v, fill, mixHex('#B96A45', v.tokens.dominant, 0.55), mixHex(v.tokens.accent, '#5C4A3A', 0.55), 5)
    pl.position.set(0.4, 0, 0.24)
    scene.add(pl)

    const hero = car(v, fill, v.carHex)
    scene.add(placeOnTrack(hero, A, B, 0.5, 0.008))
    const witness = car(v, fill, '#0072BD')
    witness.position.set(-0.06, 0.005, 0.34)
    witness.rotation.y = -2.2
    scene.add(witness)

    applyKeyLight(scene, rig)
    return { scene, camera: cam(ctx), focus: [hero.position.x, 0.03, hero.position.z], tokens: v.tokens }
  }
}

// ---- variant C: rainy overhang ------------------------------------------

function porchC(): SceneFactory {
  return (ctx): SceneEntry => {
    const v = VARIANTS.c
    const { scene, fill, rig } = shell(v)
    const [A, B] = furnish(v, scene, fill, new THREE.Vector3(0.12, 0.006, 0.32))

    // the door is shut against the storm; the screen has blown open and
    // bangs against the wall — the gust the level will time
    scene.add(door(v, fill, 0))
    scene.add(screenDoor(v, fill, -2.6))

    // the storm drain: the downspout pours (frozen stream), the flume runs
    // full and drowns off its low end onto the lane as a grip change
    scene.add(gutterFlume(v, fill, [0.24, -0.225], 0.42, 0, 'full'))
    const stream = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.011, 0.28, 10), liquid(v.tokens, mixHex(v.sky, '#FFFFFF', 0.5), { ...fill, opacity: 0.45, diffuseStrength: 1.2, specular: { size: 0.2, strength: 0.8 } }))
    stream.position.set(0.34, 0.15, -0.245)
    props(stream, false, false)
    scene.add(stream)
    scene.add(puddle(v, fill, [0.06, -0.13], 0.045))
    scene.add(puddle(v, fill, [-0.1, 0.1], 0.032, 0.7))
    // rain-seams: thin sheen lines running down two plank seams
    for (const [px, pz, len] of [[-0.24, 0.06, 0.16], [0.02, 0.2, 0.12]] as const) {
      const seam = new THREE.Mesh(new THREE.PlaneGeometry(0.005, len), liquid(v.tokens, mixHex(v.sky, '#2F4356', 0.3), { ...fill, opacity: 0.45, specular: { size: 0.3, strength: 0.7 } }))
      seam.rotation.x = -Math.PI / 2
      seam.position.set(px, 0.0058, pz)
      seam.receiveShadow = true
      scene.add(seam)
    }

    // the downpour, frozen, ONLY beyond the eaves line
    scene.add(rain(v, fill))

    // the chime is the gust's clock: swung out over the lane
    const chime = windChime(v, fill, -0.42)
    chime.position.set(-0.05, 0.285, -0.25)
    scene.add(chime)

    // washed chalk, the amber spend once (boots), lantern dark and wet
    scene.add(chalk(v, fill, 0.25))
    const boots = shoes(v, fill, v.tokens.accent, true)
    boots.position.set(-0.24, 0, -0.12)
    boots.rotation.y = 0.35
    scene.add(boots)
    const lamp = lantern(v, fill, false)
    lamp.position.set(0.5, 0.36, 0.4)
    scene.add(lamp)

    const pl = planter(v, fill, mixHex('#B96A45', v.tokens.dominant, 0.7), mixHex(v.tokens.accent, '#8A98A8', 0.6), 4)
    pl.position.set(0.4, 0, 0.24)
    scene.add(pl)

    const hero = car(v, fill, v.carHex)
    scene.add(placeOnTrack(hero, A, B, 0.48, 0.008))
    // the witness pair sheltering under the eaves at the post — waiting out
    // the storm: the threshold's story in one parked detail
    for (const [px, rz] of [[0.44, 0.7], [0.49, 0.3]] as const) {
      const w = car(v, fill, px > 0.46 ? '#CC79A7' : '#0072BD')
      w.position.set(px, 0.005, 0.3)
      w.rotation.y = rz
      scene.add(w)
    }

    applyKeyLight(scene, rig)
    return { scene, camera: cam(ctx), focus: [hero.position.x, 0.03, hero.position.z], tokens: v.tokens }
  }
}

registerScene('porch-a', porchA())
registerScene('porch-b', porchB())
registerScene('porch-c', porchC())
