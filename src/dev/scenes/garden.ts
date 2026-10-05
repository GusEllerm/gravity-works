// Stage 4 exploration — Environment Artist, garden set, three variants.
//
// The FIRST OUTDOOR SET: the light regime changes, not just the palette. Every
// set so far is one indoor key through a window with the set's hue as fill; a
// garden has a SUN and a SKY, and the sky is the fill. That is the whole
// experiment here — three sun angles, three grounds, one track line each.
// Kitchen conventions are kept (material classes, three-step ramp, one key,
// two-band fill, flat non-gradient backdrop, orange track, 1:64 car); kitchen,
// bathroom and BEDROOM palettes are not, and the garden's own token seed
// (magenta dusk / chartreuse firefly, Concepts/Art Bible §Light "garden =
// dusk") is treated as a hypothesis to test outdoors, not an order — B is its
// golden-hour cousin, C wears the magenta as gnome-hat paint, A ignores it.
//
//   garden-a — LAWN under a high summer sun: mown stripes, hard short shadows,
//              watering can as an arch over the deck, sprinkler frozen mid-pop.
//   garden-b — PAVING SLABS at golden hour: a trellis palisade raking long
//              shadow bars across the deck, drain pipe as the tunnel mouth.
//   garden-c — MULCH BED under overcast: soft dome light, bark-chip ground,
//              gnome statue + a gnome parade, pipe as a culvert in the berm.
//
// Outdoors needs two things the bible does not have yet, both FLAGGED not
// decided: a flat SKY value instead of a room wall (never-list "no gradient
// sky" still holds — it is one color), and a chunky SUN DISC as geometry
// (never-list "no lens flare" still holds — it is a disc, not a flare).
// The shadow story changes too: outdoors shadows are SKY-LIT, so the shadow
// tint and the sky-side fill band are pulled toward the sky value, not the
// set's dominant hue (§Light's rule is an indoor rule). See the note.
//
// Static: fixed clock, nothing animates. Throwaway dev scene.

import * as THREE from 'three'
import { ceramic, dieCastPaint, fabric, glass, liquid, paintedWood, trackPlastic } from '../../render/materials.ts'
import { toyBlock, trackChannel } from '../../render/geometry.ts'
import { createLightingRig } from '../../render/lighting.ts'
import { GLOBAL_TOKENS, SET_TOKENS, clampLightness, darken, lighten, mixHex, shiftHex, type SetTokens } from '../../render/tokens.ts'
import { ToonMaterial } from '../../render/toon-material.ts'
import { registerScene, type SceneEntry, type SceneFactory } from '../registry.ts'

type Variant = 'a' | 'b' | 'c'

type FillBag = {
  fillHigh: string
  fillLow: string
  fillStrength: number
  shadowTint: string
}

interface VariantSpec {
  tokens: SetTokens
  /** The flat sky value — the outdoor replacement for a room wall. */
  sky: string
  sunColor: string
  sunIntensity: number
  /** Directional-light position: its length encodes the sun's ANGLE, which is
   *  the one thing an outdoor set is actually choosing. */
  sunPos: [number, number, number]
  /** PCF disc radius: 0.5 = hard high-noon edges, 9 = overcast mush-with-direction. */
  shadowRadius: number
  fillStrength: number
  /** How far shade is pulled to the SKY instead of the set hue (0..1). */
  skyInfluence: number
  carHex: string
  /** Ground: the variant's material story in one hex. */
  groundHex: string
}

/** Mirror of tokens.ts derive() with the ONE outdoor substitution: the
 *  background slot IS the sky (flat, never a gradient). */
function tokensFor(dominant: string, accent: string, sky: string): SetTokens {
  return {
    name: 'garden',
    dominant,
    accent,
    fillHigh: lighten(dominant, 0.3),
    fillLow: mixHex(darken(dominant, 0.42), GLOBAL_TOKENS.cream, 0.25),
    shadowTint: mixHex(lighten(dominant, 0.08), GLOBAL_TOKENS.cream, 0.3),
    ground: mixHex(GLOBAL_TOKENS.cream, dominant, 0.3),
    background: sky,
    track: GLOBAL_TOKENS.trackOrange,
  }
}

const VARIANTS: Record<Variant, VariantSpec> = {
  // A — lawn, high sun. A fresh-cut green dominant (the token chartreuse is
  // too yellow and too dry for a lawn in June), terracotta accent worn only
  // by the pot and the can. Sun near the top of the frame at 58°: shadows
  // are short, black-edged and tell you exactly where every prop stands.
  a: {
    tokens: tokensFor('#71AC43', '#C4623C', '#BFDCEB'),
    sky: '#BFDCEB',
    sunColor: '#FFF8EA',
    sunIntensity: 1.3,
    sunPos: [1.2, 0.75, 0.35],
    shadowRadius: 0.4,
    fillStrength: 0.3,
    skyInfluence: 0.42,
    carHex: '#0072BD',
    groundHex: '#71AC43',
  },
  // B — paving slabs, golden hour. Rose-gold dominant, deliberately NOT
  // kitchen's butter gold (#EFAF4B): redder, lower, and it dies in violet
  // because the sky is still in the shadows. The token garden chartreuse is
  // kept as the accent (vine, hose). Sun at 15° from frame left: everything
  // becomes a bar.
  b: {
    tokens: tokensFor('#CD815F', SET_TOKENS.garden.accent, '#BFD3DF'),
    sky: '#BFD3DF',
    sunColor: '#FFAE63',
    sunIntensity: 1.2,
    sunPos: [-1.05, 0.3, -1.3],
    shadowRadius: 2,
    fillStrength: 0.3,
    skyInfluence: 0.6,
    carHex: '#009E73',
    groundHex: '#C9B79E',
  },
  // C — mulch bed, overcast. Dusty sage dominant, silver-green sky, a high
  // weak key with a big soft radius: one direction survives only as a
  // gradient of softness across the ground. The token magenta survives as
  // gnome hats and mushroom caps — the only saturated thing in the frame.
  // (NB: this sage sits near the unused garage seed #87913D — AD note.)
  c: {
    tokens: tokensFor('#8E9B79', SET_TOKENS.garden.dominant, '#C6D2CB'),
    sky: '#C6D2CB',
    sunColor: '#F0F4EE',
    sunIntensity: 1.0,
    sunPos: [0.4, 1.35, 0.3],
    shadowRadius: 6,
    fillStrength: 0.46,
    skyInfluence: 0.5,
    carHex: '#0072BD',
    groundHex: '#5D4E3D',
  },
}

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

/** Stone is not one of the seven classes. Closest is `ceramic` with the
 *  specular turned almost off and the saturation pre-cut (ceramic lifts sat
 *  by +10 %). Flagged for the AD: widen the ceramic class to "ceramic/stone"
 *  or add stone as an eighth class — see the exploration note. */
function stone(v: VariantSpec, fill: FillBag, hex: string, toy = 0.1): ToonMaterial {
  return ceramic(v.tokens, shiftHex(hex, 0, -0.1, 0.01), {
    ...fill,
    specular: { size: 0.6, strength: 0.07 },
    rim: { strength: 0.1, size: 0.5 },
    toy,
  })
}

/** One sun, one sky-fill. Everything the outdoor regime is, lives here. */
function shell(v: VariantSpec, shadowExtent = 1.15): { scene: THREE.Scene; fill: FillBag } {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(v.sky)
  const rig = createLightingRig(v.tokens, {
    keyIntensity: v.sunIntensity,
    keyPosition: v.sunPos,
    accentMix: 0.22,
    fillStrength: v.fillStrength,
    shadowRadius: v.shadowRadius,
    shadowExtent,
  })
  rig.key.color.set(v.sunColor)
  scene.add(rig.key)
  return {
    scene,
    // OUTDOOR DEVIATION (flag, not a decision): §Light says the fill comes
    // from the set's dominant hue. Outdoors the fill is the sky, so the
    // sky-side band and the shadow tint are pulled toward the sky value.
    fill: {
      fillHigh: mixHex(rig.fillHigh, v.sky, 0.55),
      fillLow: mixHex(rig.fillLow, v.sky, 0.22),
      fillStrength: v.fillStrength,
      shadowTint: mixHex(rig.shadowTint, v.sky, v.skyInfluence),
    },
  }
}

/** Declare the SUN (not the rig's stock key) to every material so shadowed
 *  pixels tint toward the sky instead of blackening. */
function declareSun(scene: THREE.Scene, v: VariantSpec): void {
  scene.traverse((obj) => {
    if (obj instanceof THREE.Mesh || obj instanceof THREE.InstancedMesh) {
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
      for (const m of mats) if (m instanceof ToonMaterial) m.setKeyLight(v.sunColor, v.sunIntensity)
    }
  })
}

/** The sun as a PROP: a flat disc standing on the sun's own bearing. Chunky
 *  (4° across, not 0.5°) because the bible says chunky over accurate, and it
 *  is geometry, not a flare — the never-list is intact. */
function sunDisc(v: VariantSpec, fill: FillBag, camPos: readonly [number, number, number], r = 0.05, at?: readonly [number, number, number]): THREE.Mesh {
  const d = at ? new THREE.Vector3(...at) : new THREE.Vector3(...v.sunPos).normalize().multiplyScalar(1.45)
  const m = new THREE.Mesh(
    new THREE.CircleGeometry(r, 40),
    paintedWood(v.tokens, mixHex('#FFF7E0', v.sunColor, 0.5), { ...fill, grain: 0, diffuseStrength: 1.7 }),
  )
  m.position.copy(d)
  m.lookAt(new THREE.Vector3(...camPos))
  m.castShadow = false
  m.receiveShadow = false
  return m
}

/** The garden's replacement for a room wall: a hedge band at the horizon, so
 *  the world stops somewhere and the sky stays flat above it. */
function hedge(v: VariantSpec, fill: FillBag, leafHex: string, flowerHex: string, h = 0.2): THREE.Group {
  const t = v.tokens
  const g = new THREE.Group()
  // NB toyBlock's cornerRadius must stay under half the WIDTH or the rounded
  // rect inverts and the mesh comes out inside-out (a 3.6 x 0.3 slab with
  // r = 0.16 did exactly that).
  const mass = new THREE.Mesh(toyBlock(3.6, h, 0.3, 0.06, 0.03, 6), fabric(t, leafHex, { ...fill, toy: 0.3, grain: 0.3, grainScale: 0.2 }))
  mass.position.y = h / 2 - 0.03
  props(mass)
  g.add(mass)
  const clumps = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.085, 1), fabric(t, lighten(leafHex, 0.12), { ...fill, toy: 0.25 }), 60)
  const d = new THREE.Object3D()
  const rnd = makeRng(9091)
  for (let i = 0; i < 60; i++) {
    d.position.set((rnd() - 0.5) * 3.4, h - 0.1 + (rnd() - 0.5) * (h - 0.06), 0.05 + rnd() * 0.1)
    d.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3)
    d.scale.setScalar(0.35 + rnd() * 0.55)
    d.updateMatrix()
    clumps.setMatrixAt(i, d.matrix)
  }
  props(clumps)
  g.add(clumps)
  const bloomMat = fabric(t, flowerHex, { ...fill, rim: { strength: 0.5, size: 0.6 } })
  const blooms = new THREE.InstancedMesh(new THREE.SphereGeometry(0.012, 10, 8), bloomMat, 14)
  for (let i = 0; i < 14; i++) {
    d.position.set((rnd() - 0.5) * 3.0, h - 0.08 + rnd() * 0.08, 0.14)
    d.rotation.set(0, 0, 0)
    d.scale.setScalar(0.7 + rnd() * 0.6)
    d.updateMatrix()
    blooms.setMatrixAt(i, d.matrix)
  }
  props(blooms)
  g.add(blooms)
  return g
}

// ---- grounds (the material story of each variant) ----------------------

/** LAWN: fabric with pile mottle + mown stripes + instanced blades the low
 *  light can comb. Stripes are the miniature cue — a lawn you can read the
 *  mower's path in is a lawn someone cares about. */
function lawn(v: VariantSpec, fill: FillBag, radius = 2.6): THREE.Group {
  const t = v.tokens
  const g = new THREE.Group()
  const sward = new THREE.Mesh(
    new THREE.CircleGeometry(radius, 96),
    fabric(t, mixHex(v.groundHex, GLOBAL_TOKENS.cream, 0.12), { ...fill, toy: 0.32, grain: 0.5, grainScale: 0.07, rim: { strength: 0.38, size: 0.9 } }),
  )
  sward.rotation.x = -Math.PI / 2
  sward.receiveShadow = true
  g.add(sward)
  // Mown stripes only in the mowable middle of the set: at 0.09 m pitch they
  // moiré into zebra banding when they run to the horizon under a low camera.
  for (let i = -3; i <= 3; i++) {
    const stripe = new THREE.Mesh(
      new THREE.PlaneGeometry(2.4, 0.16),
      fabric(t, i % 2 ? lighten(v.groundHex, 0.022) : darken(v.groundHex, 0.02), { ...fill, toy: 0.2, grain: 0.2 }),
    )
    stripe.rotation.x = -Math.PI / 2
    stripe.position.set(0, 0.0006, i * 0.17)
    stripe.receiveShadow = true
    stripe.castShadow = false
    g.add(stripe)
  }
  return g
}

/** Instanced blades along the track corridor (never on the deck). A blade is
 *  ~1 cm: grass reads by density, not by size — a 3 cm blade is a wheat field
 *  at this scale and swallows the car. */
function blades(v: VariantSpec, fill: FillBag, line: [THREE.Vector3, THREE.Vector3], seed: number, count = 520, bladeHex?: string): THREE.InstancedMesh {
  const t = v.tokens
  const geo = new THREE.ConeGeometry(0.003, 0.008, 4)
  const m = new THREE.InstancedMesh(geo, fabric(t, bladeHex ?? mixHex(v.groundHex, '#FFF6D8', 0.045), { ...fill, toy: 0.3 }), count)
  const d = new THREE.Object3D()
  const rnd = makeRng(seed)
  const dir = line[1].clone().sub(line[0]).normalize()
  const nrm = new THREE.Vector3(-dir.z, 0, dir.x)
  for (let i = 0; i < count; i++) {
    const along = rnd()
    const side = (rnd() < 0.5 ? -1 : 1) * (0.045 + rnd() * 0.26)
    d.position.copy(line[0]).lerp(line[1], along).addScaledVector(nrm, side)
    d.rotation.set((rnd() - 0.5) * 0.5, rnd() * Math.PI, (rnd() - 0.5) * 0.6)
    d.scale.set(1, 0.6 + rnd() * 1.1, 1)
    d.updateMatrix()
    m.setMatrixAt(i, d.matrix)
  }
  props(m, false)
  return m
}

/** PAVING: irregular-but-settled slabs on a sand bed, lawn beyond the edge.
 *  Reads as the ceramic class (see `stone`) — the flag is in the note. */
function paving(v: VariantSpec, fill: FillBag): THREE.Group {
  const t = v.tokens
  const g = new THREE.Group()
  const bed = new THREE.Mesh(toyBlock(1.16, 0.008, 1.16, 0.01, 0.003), stone(v, fill, darken(v.groundHex, 0.45)))
  bed.position.y = -0.003
  props(bed, false, true)
  g.add(bed)
  const size = 0.157
  const gap = 0.011
  const n = 7
  const geo = toyBlock(size, 0.006, size, 0.005, 0.002)
  const slabs = new THREE.InstancedMesh(geo, stone(v, fill, v.groundHex, 0.14), n * n)
  const d = new THREE.Object3D()
  const rnd = makeRng(31415)
  let i = 0
  for (let a = 0; a < n; a++) {
    for (let b = 0; b < n; b++) {
      d.position.set((a - (n - 1) / 2) * (size + gap), 0.003 + (rnd() - 0.5) * 0.0012, (b - (n - 1) / 2) * (size + gap))
      d.rotation.set(0, (rnd() - 0.5) * 0.035, 0)
      d.updateMatrix()
      slabs.setMatrixAt(i++, d.matrix)
    }
  }
  props(slabs, false, true)
  g.add(slabs)
  // moss plugs in three joints — the ground's own accent, and a grip patch
  const mossMat = fabric(t, mixHex(v.tokens.accent, '#4F6B30', 0.7), { ...fill, toy: 0.35, rim: { strength: 0.5, size: 0.8 } })
  const moss = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.016, 1), mossMat, 9)
  for (let k = 0; k < 9; k++) {
    d.position.set((rnd() - 0.5) * 0.9, 0.0055, (rnd() - 0.5) * 0.9)
    d.rotation.set(0, rnd() * 3, 0)
    d.scale.set(0.6 + rnd() * 0.5, 0.2, 0.6 + rnd() * 0.5)
    d.updateMatrix()
    moss.setMatrixAt(k, d.matrix)
  }
  props(moss, false, true)
  g.add(moss)
  return g
}

/** MULCH: a displaced bark bed that flattens under the track, plus instanced
 *  chips. Soft-body LOOK only (no cloth sim) — same trick the bedroom's duvet
 *  used, with a bank instead of quilting. */
function mulchBed(v: VariantSpec, fill: FillBag, line: [THREE.Vector3, THREE.Vector3], height: (x: number, z: number) => number): THREE.Group {
  const t = v.tokens
  const g = new THREE.Group()
  const geo = new THREE.PlaneGeometry(2.6, 2.6, 84, 84)
  const pos = geo.attributes.position as THREE.BufferAttribute
  for (let i = 0; i < pos.count; i++) pos.setZ(i, height(pos.getX(i), -pos.getY(i)))
  geo.computeVertexNormals()
  const bed = new THREE.Mesh(geo, fabric(t, v.groundHex, { ...fill, toy: 0.3, grain: 0.55, grainScale: 0.12, rim: { strength: 0.4, size: 0.9 } }))
  bed.rotation.x = -Math.PI / 2
  props(bed, false)
  g.add(bed)
  // bark chips: chunky flattened flakes, kept clear of the deck corridor
  const d = new THREE.Object3D()
  const rnd = makeRng(2718)
  const dir = line[1].clone().sub(line[0]).normalize()
  const nrm = new THREE.Vector3(-dir.z, 0, dir.x)
  const flakes = new THREE.InstancedMesh(
    toyBlock(0.009, 0.003, 0.005, 0.0012, 0.0007),
    paintedWood(t, mixHex(v.groundHex, '#3E2E22', 0.35), { ...fill, grain: 0.5, grainScale: 1.4, toy: 0.3 }),
    1100,
  )
  for (let i = 0; i < 1100; i++) {
    const along = rnd()
    let side = (rnd() - 0.5) * 1.5
    if (Math.abs(side) < 0.05) side += side < 0 ? -0.05 : 0.05
    const p = line[0].clone().lerp(line[1], along).addScaledVector(nrm, side)
    d.position.set(p.x, height(p.x, p.z) + 0.0015, p.z)
    d.rotation.set((rnd() - 0.5) * 0.7, rnd() * Math.PI, (rnd() - 0.5) * 0.5)
    d.scale.setScalar(0.7 + rnd() * 0.5)
    d.updateMatrix()
    flakes.setMatrixAt(i, d.matrix)
  }
  props(flakes, false)
  g.add(flakes)
  return g
}

/** Stepping stones: the dry path the gnomes march on. */
function steppingStones(v: VariantSpec, fill: FillBag, from: [number, number], to: [number, number], height: (x: number, z: number) => number, n = 6): THREE.Group {
  const g = new THREE.Group()
  const rnd = makeRng(5566)
  for (let i = 0; i < n; i++) {
    const s = i / (n - 1)
    const px = from[0] + (to[0] - from[0]) * s + (rnd() - 0.5) * 0.02
    const pz = from[1] + (to[1] - from[1]) * s + (rnd() - 0.5) * 0.02
    const stoneG = new THREE.Mesh(
      new THREE.CylinderGeometry(0.034 + rnd() * 0.008, 0.036, 0.007, 7),
      stone(v, fill, mixHex(v.groundHex, '#CFC7B4', 0.55), 0.12),
    )
    stoneG.position.set(px, height(px, pz) + 0.001, pz)
    stoneG.rotation.y = rnd() * 3
    props(stoneG)
    g.add(stoneG)
  }
  return g
}

/** Pebble path: a gravel crossing laid across the deck — a grip change the
 *  car reads before it hits it. */
function pebbles(v: VariantSpec, fill: FillBag, from: [number, number], to: [number, number], width: number, count: number, seed: number, hex: string): THREE.InstancedMesh {
  const m = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.0016, 0), stone(v, fill, hex, 0.1), count)
  const d = new THREE.Object3D()
  const rnd = makeRng(seed)
  const a = new THREE.Vector3(from[0], 0, from[1])
  const b = new THREE.Vector3(to[0], 0, to[1])
  const dir = b.clone().sub(a)
  const len = dir.length()
  dir.normalize()
  const perp = new THREE.Vector3(-dir.z, 0, dir.x)
  for (let i = 0; i < count; i++) {
    const p = a.clone().addScaledVector(dir, rnd() * len).addScaledVector(perp, (rnd() - 0.5) * width)
    d.position.set(p.x, 0.004, p.z)
    d.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3)
    d.scale.set(0.8 + rnd() * 0.9, 0.45, 0.8 + rnd() * 0.9)
    d.updateMatrix()
    m.setMatrixAt(i, d.matrix)
  }
  props(m, false, true)
  return m
}

// ---- giant garden props ------------------------------------------------

/** Watering can, authored spout-along-+x: the spout arcs 0.2 m over the deck
 *  and the rose hangs there with four frozen droplets. In A it is the ARCH
 *  the track drives under; in B a monolith; in C tipped over. */
function wateringCan(v: VariantSpec, fill: FillBag, bodyHex: string, upright = true): THREE.Group {
  const t = v.tokens
  const g = new THREE.Group()
  const metal = dieCastPaint(t, bodyHex, { ...fill, toy: 0.55, rim: { strength: 0.42, size: 0.2 } })
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.056, 0.118, 30), metal)
  body.position.y = 0.061
  props(body)
  g.add(body)
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.062, 0.005, 8, 30), metal)
  rim.rotation.x = Math.PI / 2
  rim.position.y = 0.12
  props(rim)
  g.add(rim)
  const topHandle = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.005, 8, 26, Math.PI), metal)
  topHandle.position.y = 0.121
  props(topHandle)
  g.add(topHandle)
  const backHandle = new THREE.Mesh(new THREE.TorusGeometry(0.032, 0.005, 8, 18, Math.PI), metal)
  backHandle.rotation.z = Math.PI / 2
  backHandle.position.set(-0.06, 0.078, 0)
  props(backHandle)
  g.add(backHandle)
  const spout = new THREE.Mesh(
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.05, 0.042, 0),
        new THREE.Vector3(0.104, 0.13, 0),
        new THREE.Vector3(0.162, 0.19, 0),
        new THREE.Vector3(0.226, 0.178, 0),
      ]),
      48,
      0.0105,
      10,
      false,
    ),
    metal,
  )
  props(spout)
  g.add(spout)
  const rose = new THREE.Mesh(new THREE.CylinderGeometry(0.021, 0.017, 0.013, 22), metal)
  rose.position.set(0.236, 0.176, 0)
  rose.rotation.z = -0.45
  props(rose)
  g.add(rose)
  if (upright) {
    // four droplets frozen on their way down onto the deck — the stop-motion
    // beat (Concepts/Feel), and a free hazard-timer for a track
    for (const i of [0, 1, 2, 3]) {
      const drop = new THREE.Mesh(new THREE.SphereGeometry(0.0022, 8, 7), liquid(t, mixHex(v.sky, '#FFFFFF', 0.7), { ...fill, opacity: 0.45, specular: { size: 0.16, strength: 0.7 } }))
      drop.position.set(0.236 - i * 0.0015, 0.16 - i * 0.04, (i - 1.5) * 0.004)
      drop.scale.y = 1.4
      props(drop, false, false)
      g.add(drop)
    }
  }
  return g
}

/** Trellis panel, authored facing +z. Vertical laths + one X: with a low sun
 *  off its face it throws bars across whatever deck lies behind it. */
function trellis(v: VariantSpec, fill: FillBag, w: number, h: number, leafHex: string, flowerHex: string): THREE.Group {
  const t = v.tokens
  const g = new THREE.Group()
  const woodMat = paintedWood(t, '#BC9465', { ...fill, grain: 0.45, grainScale: 0.5 })
  for (const px of [-w / 2, w / 2]) {
    const post = new THREE.Mesh(toyBlock(0.024, h, 0.024, 0.007, 0.003), woodMat)
    post.position.set(px, h / 2, 0)
    props(post)
    g.add(post)
  }
  for (const py of [h - 0.016, 0.04]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(w + 0.02, 0.022, 0.016), woodMat)
    rail.position.set(0, py, 0)
    props(rail)
    g.add(rail)
  }
  for (let i = 1; i < 5; i++) {
    const lathe = new THREE.Mesh(new THREE.BoxGeometry(0.013, h - 0.02, 0.01), woodMat)
    lathe.position.set(-w / 2 + (i * w) / 5, h / 2, 0)
    props(lathe)
    g.add(lathe)
  }
  const diag = Math.hypot(w, h)
  for (const s of [1, -1]) {
    const lathe = new THREE.Mesh(new THREE.BoxGeometry(diag, 0.012, 0.01), woodMat)
    lathe.position.set(0, h / 2, -0.006)
    lathe.rotation.z = s * Math.atan2(h, w)
    props(lathe)
    g.add(lathe)
  }
  // vine: instanced leaves climbing one post, three flowers in the accent
  const d = new THREE.Object3D()
  const rnd = makeRng(1123)
  const leaves = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.014, 0), fabric(t, leafHex, { ...fill, toy: 0.3 }), 54)
  for (let i = 0; i < 54; i++) {
    const s = i / 54
    d.position.set(-w / 2 + 0.03 * Math.sin(s * 22) + s * w * 0.35, 0.03 + s * (h - 0.05), 0.014 + (rnd() - 0.5) * 0.012)
    d.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3)
    d.scale.set(1 + rnd() * 0.8, 0.4, 1 + rnd() * 0.6)
    d.updateMatrix()
    leaves.setMatrixAt(i, d.matrix)
  }
  props(leaves)
  g.add(leaves)
  const flowers = new THREE.InstancedMesh(new THREE.SphereGeometry(0.014, 10, 8), fabric(t, flowerHex, { ...fill, rim: { strength: 0.5, size: 0.5 } }), 4)
  for (let i = 0; i < 4; i++) {
    d.position.set(-w / 2 + 0.06 + rnd() * w * 0.3, 0.1 + rnd() * (h - 0.15), 0.024)
    d.rotation.set(0, 0, 0)
    d.scale.setScalar(0.8 + rnd() * 0.5)
    d.updateMatrix()
    flowers.setMatrixAt(i, d.matrix)
  }
  props(flowers)
  g.add(flowers)
  return g
}

/** Garden gnome on a plinth — the statue of this set. Hat in whatever hue the
 *  variant's accent policy allows, beard in the warm neutral. */
function gnome(v: VariantSpec, fill: FillBag, hatHex: string, plinth = true): THREE.Group {
  const t = v.tokens
  const g = new THREE.Group()
  if (plinth) {
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.038, 0.018, 24), stone(v, fill, mixHex(t.ground, '#B9AE9C', 0.6)))
    base.position.y = 0.009
    props(base)
    g.add(base)
    g.position.y = 0.018
  }
  const coat = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.029, 0.056, 22), fabric(t, mixHex(t.ground, '#5C6E86', 0.6), { ...fill, rim: { strength: 0.4, size: 0.7 } }))
  coat.position.y = 0.028
  props(coat)
  g.add(coat)
  for (const px of [-0.012, 0.012]) {
    const boot = new THREE.Mesh(toyBlock(0.018, 0.011, 0.015, 0.004, 0.002), dieCastPaint(t, '#4A3527', { ...fill, toy: 0.4 }))
    boot.position.set(px, 0.006, 0.012)
    props(boot)
    g.add(boot)
  }
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.019, 18, 14), ceramic(t, '#E9C9A8', { ...fill, specular: { size: 0.5, strength: 0.14 } }))
  head.position.y = 0.064
  props(head)
  g.add(head)
  // Beard: a rounded mass hanging off the face, pushed clear of the coat so
  // the front view names "gnome" and not "chess pawn". A cone reads as a
  // party-hat brim from below; a squashed sphere reads as hair.
  const beard = new THREE.Mesh(new THREE.SphereGeometry(0.016, 16, 12), fabric(t, '#E4D8C2', { ...fill, rim: { strength: 0.5, size: 0.8 } }))
  beard.position.set(0, 0.054, 0.014)
  beard.scale.set(0.9, 1.35, 0.75)
  props(beard)
  g.add(beard)
  const hat = new THREE.Mesh(new THREE.ConeGeometry(0.023, 0.06, 18), dieCastPaint(t, hatHex, { ...fill, toy: 0.5 }))
  hat.position.y = 0.1
  hat.rotation.z = -0.12
  props(hat)
  g.add(hat)
  return g
}

/** Drain pipe, authored with its axis along x and the MOUTH at -x: a tunnel
 *  with a dark bore, a stone barrel, a strap, a saddle and a downpipe coming
 *  in over the top. B's hero; C's culvert. */
function drainPipe(v: VariantSpec, fill: FillBag, len: number, at: [number, number, number], yaw: number, r = 0.046, riserOn = true): THREE.Group {
  const t = v.tokens
  const g = new THREE.Group()
  const shellMat = stone(v, fill, '#C0B299', 0.12)
  shellMat.side = THREE.DoubleSide
  const barrelGeo = new THREE.CylinderGeometry(r, r, len, 32, 1, true)
  barrelGeo.rotateZ(Math.PI / 2)
  const barrel = new THREE.Mesh(barrelGeo, shellMat)
  barrel.position.y = r
  props(barrel)
  g.add(barrel)
  const innerGeo = new THREE.CylinderGeometry(r - 0.007, r - 0.007, len - 0.012, 26, 1, true)
  innerGeo.rotateZ(Math.PI / 2)
  const innerMat = fabric(t, '#3A2C22', { ...fill, diffuseStrength: 0.3 })
  innerMat.side = THREE.DoubleSide
  const inner = new THREE.Mesh(innerGeo, innerMat)
  inner.position.y = r
  props(inner, false, false)
  g.add(inner)
  // bore stop, set back inside the mouth so the tunnel has a dark end wall
  const stop = new THREE.Mesh(new THREE.CircleGeometry(r - 0.007, 26), fabric(t, '#241A14', { ...fill, diffuseStrength: 0.16 }))
  stop.rotation.y = -Math.PI / 2
  stop.position.set(len / 2 - 0.075, r, 0)
  props(stop, false, false)
  g.add(stop)
  const lip = new THREE.Mesh(new THREE.TorusGeometry(r, 0.005, 10, 32), shellMat)
  lip.rotation.y = Math.PI / 2
  lip.position.set(-len / 2, r, 0)
  props(lip)
  g.add(lip)
  const strap = new THREE.Mesh(new THREE.TorusGeometry(r + 0.004, 0.0045, 8, 26), dieCastPaint(t, '#9A8F7C', { ...fill, toy: 0.4 }))
  strap.rotation.y = Math.PI / 2
  strap.position.set(0, r, 0)
  props(strap)
  g.add(strap)
  // A culvert lying in a bed needs no saddles, and a saddle at the mouth end
  // reads as a blockage inside the tunnel from a low camera — so the supports
  // sit on the far half only.
  for (const px of [len / 2 - 0.05, len / 2 - 0.005]) {
    const saddle = new THREE.Mesh(toyBlock(0.03, 0.028, 0.05, 0.007, 0.003), stone(v, fill, '#AFA391'))
    saddle.position.set(px, 0.014, 0)
    props(saddle)
    g.add(saddle)
  }
  if (riserOn) {
    // the downpipe that feeds it — a vertical column with an elbow collar
    const riser = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.42, r * 0.42, 0.2, 20), stone(v, fill, '#C6B9A2', 0.1))
    riser.position.set(-len / 2 + 0.1, r + 0.13, -0.005)
    props(riser)
    g.add(riser)
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.56, r * 0.5, 0.022, 20), shellMat)
    collar.position.set(-len / 2 + 0.1, r + 0.042, -0.005)
    props(collar)
    g.add(collar)
  }
  g.position.set(at[0], at[1], at[2])
  g.rotation.y = yaw
  return g
}

/** Pop-up sprinkler with five droplets frozen across the deck — A's hazard,
 *  and the answer to "what does a track WANT outdoors". */
function sprinkler(v: VariantSpec, fill: FillBag, yaw: number): THREE.Group {
  const t = v.tokens
  const g = new THREE.Group()
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.014, 0.03, 16), trackPlastic(t, mixHex(t.ground, '#5C7F4A', 0.5), { ...fill, toy: 0.4 }))
  body.position.y = 0.015
  props(body)
  g.add(body)
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.011, 0.009, 16), trackPlastic(t, '#4E6B3E', { ...fill, toy: 0.4 }))
  cap.position.y = 0.034
  props(cap)
  g.add(cap)
  for (let i = 0; i < 4; i++) {
    const s = i / 3
    const drop = new THREE.Mesh(new THREE.SphereGeometry(0.0022, 8, 7), liquid(t, mixHex(v.sky, '#FFFFFF', 0.7), { ...fill, opacity: 0.45, specular: { size: 0.16, strength: 0.7 } }))
    drop.position.set(0.01 + s * 0.095, 0.038 + 0.046 * Math.sin(s * 2.2), 0)
    drop.scale.set(1, 1.5, 1)
    props(drop, false, false)
    g.add(drop)
  }
  g.rotation.y = yaw
  return g
}

/** Coil of hose: the accent object for B, and a hose is a sleeping python at
 *  this scale. */
function hoseCoil(v: VariantSpec, fill: FillBag, hex: string): THREE.Group {
  const g = new THREE.Group()
  const mat = trackPlastic(v.tokens, hex, { ...fill, toy: 0.35 })
  ;[0.052, 0.076, 0.1].forEach((r, i) => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.0095, 10, 34), mat)
    ring.rotation.x = -Math.PI / 2
    ring.position.y = 0.01 + i * 0.006
    ring.rotation.z = i * 0.4
    props(ring)
    g.add(ring)
  })
  const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.011, 0.03, 14), dieCastPaint(v.tokens, '#B9AE97', { ...fill, toy: 0.4 }))
  nozzle.position.set(0.09, 0.012, 0.03)
  nozzle.rotation.set(Math.PI / 2, 0, 0.6)
  props(nozzle)
  g.add(nozzle)
  return g
}

/** Terracotta pot with a seedling — the accent vessel (A). */
function pot(v: VariantSpec, fill: FillBag, hex: string, leafHex: string): THREE.Group {
  const t = v.tokens
  const g = new THREE.Group()
  const pts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.031, 0.0),
    new THREE.Vector2(0.035, 0.004),
    new THREE.Vector2(0.05, 0.078),
    new THREE.Vector2(0.056, 0.082),
    new THREE.Vector2(0.056, 0.088),
    new THREE.Vector2(0.05, 0.088),
    new THREE.Vector2(0.045, 0.08),
    new THREE.Vector2(0.03, 0.008),
    new THREE.Vector2(0.0, 0.006),
  ]
  const mat = ceramic(t, hex, { ...fill, specular: { size: 0.5, strength: 0.12 }, toy: 0.2 })
  mat.side = THREE.DoubleSide
  const vessel = new THREE.Mesh(new THREE.LatheGeometry(pts, 32), mat)
  props(vessel)
  g.add(vessel)
  const soil = new THREE.Mesh(new THREE.CircleGeometry(0.044, 24), fabric(t, darken(v.groundHex, 0.4), { ...fill, toy: 0.4 }))
  soil.rotation.x = -Math.PI / 2
  soil.position.y = 0.078
  g.add(soil)
  for (let i = 0; i < 3; i++) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.016, 12, 8), fabric(t, leafHex, { ...fill, toy: 0.3 }))
    leaf.position.set(Math.cos((i / 3) * 6.28) * 0.014, 0.105 + i * 0.008, Math.sin((i / 3) * 6.28) * 0.012)
    leaf.scale.set(1, 0.5, 1.4)
    leaf.rotation.y = i
    props(leaf)
    g.add(leaf)
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.0022, 0.0022, 0.03, 6), fabric(t, mixHex(leafHex, '#8C7A4A', 0.4), fill))
    stem.position.set(Math.cos((i / 3) * 6.28) * 0.01, 0.093, Math.sin((i / 3) * 6.28) * 0.008)
    props(stem)
    g.add(stem)
  }
  return g
}

/** Two mushrooms: the accent's honest small dose (C). */
function mushrooms(v: VariantSpec, fill: FillBag, capHex: string): THREE.Group {
  const t = v.tokens
  const g = new THREE.Group()
  for (const [px, s] of [[0, 1], [0.019, 0.7]] as const) {
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.004 * s, 0.005 * s, 0.016 * s, 12), ceramic(t, '#EFE6D4', { ...fill, specular: { strength: 0.08 } }))
    stem.position.set(px, 0.008 * s, 0)
    props(stem)
    g.add(stem)
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.0095 * s, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), ceramic(t, capHex, { ...fill, specular: { size: 0.5, strength: 0.2 } }))
    cap.position.set(px, 0.0155 * s, 0)
    props(cap)
    g.add(cap)
  }
  return g
}

/** A snail crossing the paving — the lived-in detail that is also a slow
 *  motorist in the way of the run. */
function snail(v: VariantSpec, fill: FillBag, yaw: number): THREE.Group {
  const t = v.tokens
  const g = new THREE.Group()
  const body = new THREE.Mesh(toyBlock(0.034, 0.008, 0.015, 0.003, 0.002), fabric(t, '#DCC9AE', { ...fill, rim: { strength: 0.5, size: 0.8 } }))
  body.position.y = 0
  props(body)
  g.add(body)
  const shell = new THREE.Mesh(new THREE.SphereGeometry(0.0105, 16, 12), ceramic(t, mixHex(t.ground, '#C9976A', 0.4), { ...fill, toy: 0.5, specular: { size: 0.4, strength: 0.16 } }))
  shell.position.set(-0.005, 0.013, 0)
  shell.scale.set(1, 0.85, 1)
  props(shell)
  g.add(shell)
  const whorl = new THREE.Mesh(new THREE.ConeGeometry(0.0045, 0.009, 10), ceramic(t, mixHex(t.ground, '#8E6242', 0.6), { ...fill, toy: 0.5 }))
  whorl.position.set(-0.007, 0.022, 0)
  whorl.rotation.x = 0.5
  props(whorl)
  g.add(whorl)
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.0058, 12, 10), fabric(t, '#E4D3BA', fill))
  head.position.set(0.017, 0.0065, 0)
  props(head)
  g.add(head)
  for (const pz of [-0.0025, 0.0025]) {
    const horn = new THREE.Mesh(new THREE.CylinderGeometry(0.001, 0.001, 0.009, 6), fabric(t, '#DCC9AE', fill))
    horn.position.set(0.019, 0.013, pz)
    horn.rotation.z = -0.4
    props(horn, false, false)
    g.add(horn)
  }
  g.rotation.y = yaw
  return g
}

/** A glass marble in the grass: a child was here. The one glass prop, and it
 *  is 24 mm across — no sorting risk the bathroom's wall would have. */
function marble(v: VariantSpec, fill: FillBag): THREE.Group {
  const t = v.tokens
  const g = new THREE.Group()
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.006, 20, 16), glass(t, mixHex(v.sky, '#FFFFFF', 0.55), { ...fill, opacity: 0.72, diffuseStrength: 0.5 }))
  ball.position.y = 0.006
  g.add(ball)
  const swirl = new THREE.Mesh(new THREE.TorusGeometry(0.0032, 0.0009, 6, 20), fabric(t, t.accent, fill))
  swirl.position.y = 0.006
  swirl.rotation.set(0.6, 0.4, 0)
  props(swirl, false, false)
  g.add(swirl)
  return g
}

/** Worm on the stone path — the overcast garden's own slow traffic. */
function worm(v: VariantSpec, fill: FillBag, at: [number, number, number]): THREE.Group {
  const t = v.tokens
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.005, 0),
    new THREE.Vector3(0.02, 0.006, 0.006),
    new THREE.Vector3(0.042, 0.005, -0.004),
    new THREE.Vector3(0.06, 0.012, 0.002),
  ])
  const m = new THREE.Mesh(new THREE.TubeGeometry(curve, 30, 0.0024, 8, false), fabric(t, mixHex(t.accent, '#C9B49B', 0.8), { ...fill, rim: { strength: 0.45, size: 0.7 } }))
  props(m)
  const g = new THREE.Group()
  g.add(m)
  g.position.set(...at)
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

/** The straight orange run, laid where the two endpoints say (y included). */
function trackRun(v: VariantSpec, a: THREE.Vector3, b: THREE.Vector3, fill: FillBag): THREE.Mesh {
  const m = new THREE.Mesh(trackChannel(a.distanceTo(b) - 0.008), trackPlastic(v.tokens, GLOBAL_TOKENS.trackOrange, { ...fill, toy: 0.2 }))
  m.position.copy(a).lerp(b, 0.5)
  m.lookAt(b)
  props(m)
  return m
}

/** A point on the track line at parameter t, offset along its normal. */
function near(a: THREE.Vector3, b: THREE.Vector3, t: number, off = 0): THREE.Vector3 {
  const d = b.clone().sub(a).normalize()
  return a.clone().lerp(b, t).add(new THREE.Vector3(-d.z, 0, d.x).multiplyScalar(off))
}

/** Yaw that maps a prop's local +x onto the line's normal (spouts, hoses). */
function normalYaw(a: THREE.Vector3, b: THREE.Vector3): number {
  const d = b.clone().sub(a).normalize()
  return Math.atan2(-d.x, -d.z)
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

// ---- variant A: lawn, high sun, hard shadows ----------------------------

function gardenA(): SceneFactory {
  return (ctx): SceneEntry => {
    const v = VARIANTS.a
    const { scene, fill } = shell(v, 1.0)
    const CAN = 0.7
    const A = new THREE.Vector3(-0.34, 0, 0.22)
    const B = new THREE.Vector3(0.36, 0, -0.14)
    const yaw = Math.atan2(-(B.z - A.z), B.x - A.x)
    const nYaw = normalYaw(A, B)

    scene.add(lawn(v, fill))
    scene.add(blades(v, fill, [A, B], 4101, 560))
    const hedgeG = hedge(v, fill, '#4E7C41', lighten(v.tokens.accent, 0.15))
    hedgeG.position.set(0, 0, -1.9)
    scene.add(hedgeG)
    // No sun disc in A — and that is a FINDING, not an omission: at the
    // canonical floor camera (3.5 cm high) a high sun sits far outside the
    // 35° frame, so a noon garden carries its sun in the SHADOW EDGE, not in
    // a disc. Only a low sun (variant B) can ever be in shot.

    // the arch: the can stands off the far side of the deck and its spout
    // arcs over the track, rose and all, dripping on the racing line
    const can = wateringCan(v, fill, '#7E8C84')
    can.scale.setScalar(CAN)
    can.position.copy(near(A, B, 0.45, -(0.245 * CAN - 0.02)))
    can.rotation.y = nYaw
    scene.add(can)

    // gnome statue keeping a distant watch (statue, not character)
    const statue = gnome(v, fill, darken(v.tokens.accent, 0.28), false)
    statue.scale.setScalar(0.85)
    statue.position.set(-0.42, 0, -0.12)
    statue.rotation.y = 0.9
    scene.add(statue)

    // gravel crossing the deck at an angle: a grip change you can see coming
    scene.add(pebbles(v, fill, [-0.42, -0.06], [0.1, 0.2], 0.05, 1200, 707, '#8E8471'))

    // the hazard: a pop-up sprinkler one hand-width off the racing line,
    // frozen mid-pop with five droplets across the deck
    const spr = sprinkler(v, fill, nYaw)
    spr.position.copy(near(A, B, 0.45, -0.075))
    scene.add(spr)

    // terracotta pots: the accent, kept off the floor camera's nose
    const p1 = pot(v, fill, v.tokens.accent, '#6E9C46')
    p1.position.set(0.2, 0.001, -0.44)
    p1.rotation.y = 0.4
    scene.add(p1)
    const p2 = pot(v, fill, darken(v.tokens.accent, 0.16), '#6E9C46')
    p2.position.set(0.29, 0.001, -0.35)
    p2.rotation.y = 1.6
    scene.add(p2)

    scene.add(trackRun(v, A, B, fill))
    const hero = car(v, fill, v.carHex)
    scene.add(placeOnTrack(hero, A, B, 0.62, 0.004))
    const witness = car(v, fill, '#009E73')
    witness.position.set(-0.26, 0.004, 0.33)
    witness.rotation.y = yaw + 1.4
    scene.add(witness)

    // lived-in: a glass marble in the sward, one displaced pebble off the path
    const mb = marble(v, fill)
    mb.position.set(-0.18, 0.001, 0.02)
    scene.add(mb)
    scene.add(pebbles(v, fill, [0.2, 0.14], [0.22, 0.17], 0.02, 5, 991, '#8E8471'))

    declareSun(scene, v)
    return { scene, camera: cam(ctx), focus: [hero.position.x, 0.02, hero.position.z], tokens: v.tokens }
  }
}

// ---- variant B: paving, golden hour, long bars --------------------------

function gardenB(): SceneFactory {
  return (ctx): SceneEntry => {
    const v = VARIANTS.b
    const { scene, fill } = shell(v, 1.3)
    const DECK = 0.006
    const A = new THREE.Vector3(-0.3, DECK, 0.26)
    const B = new THREE.Vector3(0.1, DECK, -0.2)
    const yaw = Math.atan2(-(B.z - A.z), B.x - A.x)
    const dir = B.clone().sub(A).normalize()

    // lawn beyond the patio edge. The slab lies FLUSH with the lawn (a 6 mm
    // curb, not a platform): the canonical floor camera lives 35 mm off the
    // ground, and a raised patio puts it inside the floor — a raised deck is
    // a camera-hostile set decision, found the hard way.
    const surround = new THREE.Mesh(
      new THREE.CircleGeometry(2.6, 96),
      fabric(v.tokens, '#7C9550', { ...fill, toy: 0.3, grain: 0.4, grainScale: 0.18 }),
    )
    surround.rotation.x = -Math.PI / 2
    surround.receiveShadow = true
    scene.add(surround)
    scene.add(paving(v, fill))
    const hedgeG = hedge(v, fill, '#5E7A44', v.tokens.accent)
    hedgeG.position.set(0, 0, -1.9)
    scene.add(hedgeG)
    // The sun, IN shot: a low sun is the only one a floor camera can see, and
    // it is the reason this variant is the golden-hour one. Placed on the
    // key's bearing, just above the hedge line.
    scene.add(sunDisc(v, fill, ctx.rig.position, 0.055, [-0.72, 0.15, -1.62]))

    // the trellis palisade, squared up to the low sun so it throws bars
    const tre = trellis(v, fill, 0.5, 0.34, mixHex(v.tokens.accent, '#5F7F37', 0.35), v.tokens.dominant)
    tre.position.set(-0.52, 0, -0.24)
    tre.rotation.y = Math.PI / 2
    scene.add(tre)

    // the drain pipe: the tunnel mouth the straight ends in. The pipe lies
    // BEYOND the deck end with its mouth facing back up-track, so the bore
    // stays out of the sun and reads as a hole in the world.
    const pipeAt = B.clone().add(dir.clone().multiplyScalar(0.175))
    const pipe = drainPipe(v, fill, 0.36, [pipeAt.x, DECK, pipeAt.z], yaw)
    scene.add(pipe)

    // hose coil in the accent, coiled in the sun stripe
    const coil = hoseCoil(v, fill, v.tokens.accent)
    coil.position.set(-0.14, DECK, 0.24)
    scene.add(coil)

    // gnome statue sitting in a shadow bar, facing the deck
    const statue = gnome(v, fill, darken(v.tokens.accent, 0.2))
    statue.position.set(0.34, DECK, 0.02)
    statue.rotation.y = -1.1
    scene.add(statue)

    // the can, a monolith against the far slabs
    const can = wateringCan(v, fill, '#9FA892', false)
    can.scale.setScalar(0.8)
    can.position.set(-0.34, DECK, -0.4)
    can.rotation.y = -0.5
    scene.add(can)

    scene.add(pebbles(v, fill, [-0.5, -0.3], [0.5, -0.44], 0.09, 420, 808, '#9A8F79'))

    scene.add(trackRun(v, A, B, fill))
    const hero = car(v, fill, v.carHex)
    scene.add(placeOnTrack(hero, A, B, 0.55, DECK + 0.004))
    const witness = car(v, fill, '#0072BD')
    witness.position.copy(near(A, B, 0.12, -0.1))
    witness.position.y = DECK + 0.004
    witness.rotation.y = yaw + 0.5
    scene.add(witness)

    // lived-in: a snail mid-crossing on the warm slab, one petal beside it
    const sn = snail(v, fill, yaw - 0.6)
    sn.position.set(-0.14, DECK, -0.02)
    scene.add(sn)
    const petal = new THREE.Mesh(new THREE.SphereGeometry(0.012, 12, 8), fabric(v.tokens, v.tokens.dominant, { ...fill, toy: 0.3 }))
    petal.position.set(-0.06, DECK + 0.001, 0.02)
    petal.scale.set(1.4, 0.16, 0.9)
    petal.rotation.y = 0.7
    props(petal, false)
    scene.add(petal)

    declareSun(scene, v)
    return { scene, camera: cam(ctx), focus: [hero.position.x, 0.04, hero.position.z], tokens: v.tokens }
  }
}

// ---- variant C: mulch, overcast, soft ----------------------------------

function gardenC(): SceneFactory {
  return (ctx): SceneEntry => {
    const v = VARIANTS.c
    const { scene, fill } = shell(v, 1.15)
    const A = new THREE.Vector3(-0.36, 0, 0.14)
    const B = new THREE.Vector3(0.3, 0, -0.24)
    const yaw = Math.atan2(-(B.z - A.z), B.x - A.x)
    const dir = B.clone().sub(A).normalize()

    // the mulch bed rises into a bank behind the track and flattens under it
    // — a berm that WANTS to be a hill ramp (see the note)
    const height = (x: number, z: number): number => {
      const d = Math.abs(new THREE.Vector3(x, 0, z).sub(A).cross(dir).y)
      const fade = THREE.MathUtils.smoothstep(d, 0.08, 0.32)
      const bank = THREE.MathUtils.smoothstep(-z, 0.06, 0.62) * 0.055
      return fade * (bank + 0.008 + 0.006 * Math.sin(x * 2.2) * Math.cos(z * 1.7))
    }
    scene.add(mulchBed(v, fill, [A, B], height))
    const hedgeG = hedge(v, fill, '#66795C', v.tokens.accent)
    hedgeG.position.set(0, 0, -1.9)
    scene.add(hedgeG)

    // dry stone path across the bed, and the gnome parade marching along it
    scene.add(steppingStones(v, fill, [-0.36, 0.24], [0.1, -0.12], height, 5))
    const chief = gnome(v, fill, mixHex(v.tokens.accent, GLOBAL_TOKENS.cream, 0.15))
    chief.position.set(-0.3, height(-0.3, 0.04) + 0.012, 0.04)
    chief.rotation.y = -2.4
    scene.add(chief)
    for (let i = 0; i < 4; i++) {
      const p = new THREE.Vector3(-0.32 + i * 0.127, 0, 0.21 - i * 0.107)
      const g = gnome(v, fill, mixHex(v.tokens.accent, '#D8AFBC', 0.25 * i), false)
      g.position.set(p.x, height(p.x, p.z) + 0.013, p.z)
      g.rotation.y = -0.7 + (i === 2 ? 0.32 : 0) // the third one is crooked
      g.scale.setScalar(0.6)
      scene.add(g)
    }

    // the culvert: the same pipe prop doing the opposite job — the track runs
    // PAST it and an alternate line runs THROUGH it, in the shade of the bank
    const culvertAt = near(A, B, 1.0, -0.12)
    const pipe = drainPipe(v, fill, 0.26, [culvertAt.x, height(culvertAt.x, culvertAt.z) - 0.006, culvertAt.z], yaw + Math.PI / 2, 0.044, false)
    scene.add(pipe)

    // the trellis, laid back as a bench against the bank
    const tre = trellis(v, fill, 0.44, 0.36, mixHex(v.tokens.dominant, '#7E8F5F', 0.5), v.tokens.accent)
    tre.position.set(-0.32, height(-0.32, -0.42), -0.42)
    tre.rotation.set(-0.4, 0.3, 0)
    scene.add(tre)

    // the offered ramp: a plank laid from the deck up the bank — the hill
    // ramp this variant is asking the track system for
    const plankAt = near(A, B, 0.68, -0.3)
    const plank = new THREE.Mesh(toyBlock(0.3, 0.011, 0.075, 0.006, 0.002), paintedWood(v.tokens, '#B99263', { ...fill, grain: 0.5, grainScale: 0.5 }))
    plank.position.set(plankAt.x, height(plankAt.x, plankAt.z) * 0.7 + 0.014, plankAt.z)
    plank.rotation.order = 'YXZ'
    plank.rotation.set(0, yaw + Math.PI / 2, 0.2)
    props(plank)
    scene.add(plank)

    // the overturned can: a mouth in the mulch, story finished
    const can = wateringCan(v, fill, '#9AA78F', false)
    can.position.set(-0.14, 0.062, 0.3)
    can.rotation.set(Math.PI / 2 - 0.15, 0.4, 0)
    scene.add(can)

    const shroom = mushrooms(v, fill, mixHex(v.tokens.accent, GLOBAL_TOKENS.cream, 0.2))
    shroom.position.set(-0.42, height(-0.42, -0.34), -0.34)
    scene.add(shroom)
    const wm = worm(v, fill, [0.04, 0.004, -0.08])
    wm.rotation.y = 0.4
    scene.add(wm)

    scene.add(trackRun(v, A, B, fill))
    const hero = car(v, fill, v.carHex)
    scene.add(placeOnTrack(hero, A, B, 0.48, 0.004))
    const witness = car(v, fill, '#009E73')
    witness.position.set(-0.3, 0.004, -0.3)
    witness.rotation.y = yaw - 1.2
    scene.add(witness)

    declareSun(scene, v)
    return { scene, camera: cam(ctx), focus: [hero.position.x, 0.02, hero.position.z], tokens: v.tokens }
  }
}

registerScene('garden-a', gardenA())
registerScene('garden-b', gardenB())
registerScene('garden-c', gardenC())
