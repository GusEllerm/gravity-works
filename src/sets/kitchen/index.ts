/**
 * The production kitchen set — the hero set of Gravity Works, built to the
 * chosen reference (`docs/explorations/kitchen/hero-b-integrated.png`, tile
 * B won with keeps from tile A: gold density, sugar-cube supports, bitten
 * toast / crumb trail / dropped pencil, the cereal-box cliff).
 *
 * `buildKitchenSet(THREE, opts)` returns `{ group, sockets, hazardZones }`
 * (plus the counter bounds and the decorative staging the canonical renders
 * re-use). Everything is data + generators: no file, no mesh, no texture —
 * every prop is one of the seven material classes from
 * `src/render/materials.ts` (see `Modules/sets-kitchen` for the inventory),
 * repeats are instanced, and the two stain meshes are the TA's film class,
 * never cutout geometry. The set contains no lights and no cars: the rig is
 * `src/render/lighting.ts`, the cars belong to the car system; the staging
 * scene `src/dev/scenes/kitchen-set.ts` is where they meet for renders.
 *
 * Sockets and hazard zones are the contract the kitchen levels consume
 * (`Concepts/Levels` §Conventions): positions derive from `./data.ts`, which
 * is built to the L03 bowl-rim numbers and the L04 wet-patch shape. The
 * builder is a pure function of its inputs — two calls produce byte-identical
 * geometry (hash-tested in `tests/unit/kitchen-set.test.ts`).
 */

import * as THREE_NS from 'three'
import { ceramic, dieCastPaint, fabric, liquid, paintedWood } from '../../render/materials.ts'
import { toyBlock } from '../../render/geometry.ts'
import { stainDecal } from '../../render/film.ts'
import { applyKeyLight, fillFromRig } from '../../render/lighting.ts'
import type { LightingRig } from '../../render/lighting.ts'
import { SET_TOKENS, darken, mixHex } from '../../render/tokens.ts'
import type { SetTokens } from '../../render/tokens.ts'
import {
  BOWL,
  BOWL_SOCKET_FRAMES,
  COUNTER,
  HAZARDS,
  SET_SCALE,
  STAGING,
  TAP,
} from './data.ts'

export * from './data.ts'

export interface KitchenSetOptions {
  tokens?: SetTokens
  /** Lighting rig whose fill bands the materials ride (art bible §Light). */
  rig?: LightingRig
}

export interface KitchenSetSocket {
  pos: THREE_NS.Vector3
  tangent: THREE_NS.Vector3
  up: THREE_NS.Vector3
}

export interface KitchenSet {
  group: THREE_NS.Group
  /** Named prop sockets, world-space — currently the bowl rim pair. */
  sockets: Record<string, KitchenSetSocket>
  /** Hazard zone data in the level `WetPatch` shape, world-space. */
  hazardZones: Record<string, { id: string; kind: string; center: { x: number; y: number; z: number }; radius: number; gripFactor: number; source: string }>
  counter: typeof COUNTER
  staging: typeof STAGING
}

/** Deterministic pseudo-random (fixed seed — the clock never moves). */
function makeRng(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

export function buildKitchenSet(T = THREE_NS, opts: KitchenSetOptions = {}): KitchenSet {
  const tokens = opts.tokens ?? SET_TOKENS.kitchen
  const fill = opts.rig ? fillFromRig(opts.rig) : { fillHigh: tokens.fillHigh, fillLow: tokens.fillLow, shadowTint: tokens.shadowTint }
  const fillOver = () => ({ ...fill })

  function props(mesh: THREE_NS.Object3D, cast = true, receive = true): void {
    mesh.castShadow = cast
    mesh.receiveShadow = receive
    mesh.traverse((o) => {
      if (o instanceof T.Mesh) {
        o.castShadow = cast
        o.receiveShadow = receive
      }
    })
  }

  const group = new T.Group()
  group.name = 'kitchen-set'

  // ---- the counter floor + splashback (world scale, unscaled) -----------
  const counter = new T.Group()
  counter.name = 'counter'
  group.add(counter)

  // Painted wood at the LOW grain frequency the TA backlog named for big
  // surfaces — long lazy streaks, never book-cover speckle at this size.
  const floor = new T.Mesh(
    new T.CircleGeometry(COUNTER.radius, 72),
    paintedWood(tokens, darken(tokens.ground, 0.06), { ...fillOver(), grain: 0.3, grainScale: 0.05 }),
  )
  floor.name = 'counter-floor'
  floor.rotation.x = -Math.PI / 2
  floor.receiveShadow = true
  counter.add(floor)

  const wall = new T.Mesh(
    new T.PlaneGeometry(20, 4),
    paintedWood(tokens, mixHex(tokens.background, tokens.dominant, 0.28), { ...fillOver(), grain: 0.06, grainScale: 0.05, diffuseStrength: 0.85 }),
  )
  wall.name = 'splashback'
  wall.position.set(0, 1.6, -0.6)
  wall.receiveShadow = true
  counter.add(wall)

  // ---- the dress (the tile-B staging scale baked into a group transform) --
  const dress = new T.Group()
  dress.name = 'dress'
  dress.scale.setScalar(SET_SCALE)
  group.add(dress)

  // ---- the monumental cereal bowl — the banked turn ----------------------
  // World profile scale, expressed inside the scaled dress group; the rim
  // crown's mid-wall circle lands EXACTLY on BOWL rim radius 0.12 so the rim
  // mesh passes through the socket poses (Concepts/Levels §props-sockets).
  const bs = BOWL.height / (0.054 * SET_SCALE) // == world profile scale / SET_SCALE
  // The bowl keeps the lathe's ceramic colour but no longer overrides the
  // ramp or the diffuse gain: the stage-3 review (fix 1) moved the band
  // work INTO the ceramic class (three bands, upper threshold at ndl 0.6),
  // and per-scene ramp hacks are exactly the class drift decision 5 forbids.
  // Only the warm shade tint and a quieter glaze sheen stay set-specific —
  // the shade tint deepened to amber with the fix-7 grade so the bowl's own
  // core shadow reads as a band, not a cream wash.
  const bowlMat = ceramic(tokens, '#F0DDB2', {
    ...fillOver(),
    shadowTint: '#C9853E',
    specular: { size: 0.55, strength: 0.22 },
  })
  bowlMat.side = T.DoubleSide
  const bowlPts: THREE_NS.Vector2[] = [new THREE_NS.Vector2(0.0001, 0.001 * bs), new THREE_NS.Vector2(0.06 * bs, 0.001 * bs)]
  {
    const R = 0.098 * bs, H = 0.054 * bs, w = 0.005 * bs, n = 12
    const footR = R * 0.26
    for (let i = 5; i <= n; i++) {
      const t = i / n
      bowlPts.push(new THREE_NS.Vector2(footR + (R - footR) * Math.sqrt(t), Math.max(H * t * (0.88 * t + 0.12), 0.001 * bs)))
    }
    bowlPts.push(new THREE_NS.Vector2(R, H), new THREE_NS.Vector2(R - w / 2, H + w / 2), new THREE_NS.Vector2(R - w, H))
    for (let i = n; i >= 0; i--) {
      const t = i / n
      bowlPts.push(new THREE_NS.Vector2(Math.max((R - w) * Math.sqrt(t), 0.0001), H * 0.05 + (H - H * 0.05) * (0.85 * t * t + 0.15 * t)))
    }
  }
  const bowlGeo = new T.LatheGeometry(bowlPts, 56)
  bowlGeo.computeVertexNormals()
  const bowl = new T.Mesh(bowlGeo, bowlMat)
  bowl.name = 'cereal-bowl'
  props(bowl)
  bowl.position.set(BOWL.position[0] / SET_SCALE, 0, BOWL.position[2] / SET_SCALE)
  dress.add(bowl)

  // milk settled in the bottom, cereal rings floating (the tile's story) —
  // stage-3 fix 2: a set-tinted surface (~85 % brightness) with real wobble,
  // so the liquid class reads as liquid with one highlight, not a flat plate
  const milk = new T.Mesh(
    new T.CylinderGeometry(0.062 * bs, 0.058 * bs, 0.003, 40),
    liquid(tokens, '#EADFC6', { ...fillOver(), opacity: 0.95, liquid: 0.25 }),
  )
  milk.name = 'milk'
  milk.position.set(BOWL.position[0] / SET_SCALE, 0.032 * bs, BOWL.position[2] / SET_SCALE)
  dress.add(milk)

  const rings = new T.InstancedMesh(new T.TorusGeometry(0.0055 * bs, 0.0024 * bs, 8, 18), fabric(tokens, '#E8B063', fillOver()), 6)
  rings.name = 'cereal-rings'
  {
    const d = new T.Object3D()
    const rnd = makeRng(911)
    for (let i = 0; i < 6; i++) {
      const a = rnd() * Math.PI * 2
      const r = (0.012 + rnd() * 0.042) * bs
      d.position.set(BOWL.position[0] / SET_SCALE + Math.cos(a) * r, 0.035 * bs, BOWL.position[2] / SET_SCALE + Math.sin(a) * r)
      d.rotation.set(-Math.PI / 2 + (rnd() - 0.5) * 0.5, 0, rnd() * 3)
      d.updateMatrix()
      rings.setMatrixAt(i, d.matrix)
    }
  }
  props(rings)
  dress.add(rings)

  // ---- props -------------------------------------------------------------

  const mugMat = ceramic(tokens, '#F2E6CC', fillOver())
  mugMat.side = T.DoubleSide

  const mugG = new T.Group()
  mugG.name = 'mug'
  {
    const pts = [
      new THREE_NS.Vector2(0.0, 0.0),
      new THREE_NS.Vector2(0.031, 0.0),
      new THREE_NS.Vector2(0.033, 0.004),
      new THREE_NS.Vector2(0.034, 0.055),
      new THREE_NS.Vector2(0.035, 0.066),
      new THREE_NS.Vector2(0.030, 0.066),
      new THREE_NS.Vector2(0.029, 0.008),
      new THREE_NS.Vector2(0.0, 0.008),
    ]
    const body = new T.Mesh(new T.LatheGeometry(pts, 40), mugMat)
    body.name = 'mug-body'
    props(body)
    mugG.add(body)
    const handle = new T.Mesh(new T.TorusGeometry(0.016, 0.0045, 10, 24), mugMat)
    handle.name = 'mug-handle'
    handle.position.set(0.038, 0.036, 0)
    handle.rotation.y = Math.PI / 2
    props(handle)
    mugG.add(handle)
    const coffee = new T.Mesh(
      new T.CylinderGeometry(0.0285, 0.0285, 0.002, 32),
      liquid(tokens, '#5C3720', { ...fillOver(), opacity: 0.92, liquid: 0.25 }),
    )
    coffee.name = 'coffee'
    coffee.position.y = 0.05
    mugG.add(coffee)
  }
  mugG.position.set(0.225, 0, 0.062)
  // turn the handle away from the canonical cameras: with the old yaw the
  // handle sat between mug and lens, and through the blowout it read as the
  // "standing grey washer" the stage-3 review logged (the ring FILM is a
  // separate object and was always correct — see mug-ring-film below)
  mugG.rotation.y = 1.4
  dress.add(mugG)

  // the ring the mug left — FILM (film.ts), not a torus of liquid.
  // Stage-3 fix 6: the mesh WAS the stainDecal film (checked — no torus is
  // wired); it read as a standing washer because it sat 7 cm from a mug that
  // had been pulled back without it, at coffee-palette grey. Pulled in to
  // the mug's flank and taken to espresso brown so it reads as a stain.
  const mugRing = stainDecal(tokens, { kind: 'mugRing', color: '#8F5B36', opacity: 0.72, size: 0.034, width: 0.0042, ...fillOver() })
  mugRing.name = 'mug-ring-film'
  mugRing.position.set(0.185, mugRing.position.y, 0.082)
  dress.add(mugRing)

  function pencilProp(name: string): THREE_NS.Group {
    const g = new T.Group()
    g.name = name
    const body = new T.Mesh(
      new T.CylinderGeometry(0.0042, 0.0042, 0.11, 6),
      dieCastPaint(tokens, '#EFC23A', { ...fillOver(), toy: 0.4 }),
    )
    body.name = 'pencil-shaft'
    props(body)
    g.add(body)
    const wood = new T.Mesh(new T.ConeGeometry(0.0042, 0.012, 6), paintedWood(tokens, '#DDB98A', { ...fillOver(), grain: 0.2 }))
    wood.name = 'pencil-tip'
    wood.position.y = 0.061
    props(wood)
    g.add(wood)
    const lead = new T.Mesh(new T.ConeGeometry(0.0016, 0.005, 6), fabric(tokens, '#382A1E', fillOver()))
    lead.name = 'pencil-lead'
    lead.position.y = 0.0685
    g.add(lead)
    const eraser = new T.Mesh(
      new T.CylinderGeometry(0.0044, 0.0044, 0.008, 6),
      ceramic(tokens, '#E29A8A', { ...fillOver(), specular: { size: 0.5, strength: 0.3 } }),
    )
    eraser.name = 'pencil-eraser'
    eraser.position.y = -0.058
    props(eraser)
    g.add(eraser)
    return g
  }

  // book stack = ramp — painted wood covers; the cream cover is the paper
  // read (painted-wood class at low grain, the tile's paper convention)
  const books = new T.Group()
  books.name = 'book-stack'
  {
    const covers: Array<[string, number, number]> = [
      ['#BEA88C', 0.02, 0.4], // warm putty — stage-3 fix 7: the spine is no
      // longer in the track's orange hue family; track orange is reserved
      // for track-plastic users (the brand constant must not have company)
      ['#EFE0C0', 0.017, -0.25], // paper cream
      ['#5FB49C', 0.019, 0.15], // mint — the set's accent
    ]
    let y = 0
    covers.forEach(([c, h, ry], i) => {
      const b = new T.Mesh(toyBlock(0.17, h, 0.125, 0.004, 0.0015), paintedWood(tokens, c, { ...fillOver(), grain: i === 1 ? 0.25 : 0.45 }))
      b.name = `book-${i}`
      b.position.set(i * 0.004, y + h / 2, i * 0.003)
      b.rotation.y = ry
      props(b)
      books.add(b)
      y += h
    })
    const ramp = new T.Mesh(toyBlock(0.17, 0.019, 0.125, 0.004, 0.0015), paintedWood(tokens, '#D9883B', { ...fillOver(), grain: 0.5 }))
    ramp.name = 'book-ramp'
    ramp.position.set(0.005, y + 0.015, 0.012)
    ramp.rotation.x = -0.24
    ramp.rotation.y = -0.1
    props(ramp)
    books.add(ramp)
    // the pencil shim — someone built this
    const shim = pencilProp('ramp-shim-pencil')
    shim.position.set(0.012, y + 0.025, 0.055)
    shim.rotation.set(0, 0.35, Math.PI / 2)
    books.add(shim)
  }
  books.position.set(-0.27, 0, 0.17)
  books.rotation.y = 0.42
  dress.add(books)

  // bitten toast soldier LEANING on the mug flank with real contact (the
  // stage-3 review's fix 6 — the mug pull-back left it floating): bottom
  // edge on the counter, top third resting against the ceramic at the
  // bite-side, in the mug-toast sightline the ring now also sits on
  {
    const soldier = new T.Group()
    soldier.name = 'toast-soldier'
    soldier.rotation.order = 'YXZ'
    const slice = new T.Mesh(toyBlock(0.041, 0.04, 0.012, 0.01, 0.003), paintedWood(tokens, '#E3A75B', { ...fillOver(), grain: 0.85 }))
    slice.name = 'toast'
    props(slice)
    soldier.add(slice)
    const bite = new T.Mesh(
      new T.CircleGeometry(0.008, 20),
      paintedWood(tokens, '#EFCF92', { ...fillOver(), grain: 0.15 }),
    )
    bite.name = 'toast-bite'
    bite.position.set(0.013, 0.011, 0.0063)
    soldier.add(bite)
    soldier.position.set(0.1875, 0, 0.1023)
    soldier.rotation.set(-0.45, -0.743, 0) // lean top toward the mug flank, bottom edge grounded
    dress.add(soldier)
  }

  // crumb trail from the toast — instanced
  const crumbs = new T.InstancedMesh(
    new T.IcosahedronGeometry(0.0035, 0),
    paintedWood(tokens, '#E8C58A', { ...fillOver(), grain: 0.2 }),
    16,
  )
  crumbs.name = 'crumb-trail'
  {
    const dummy = new T.Object3D()
    const rnd = makeRng(20261003)
    for (let i = 0; i < 16; i++) {
      const a = rnd() * Math.PI * 2
      const r = 0.02 + rnd() * 0.075
      dummy.position.set(Math.cos(a) * r, 0.0022 + rnd() * 0.002, Math.sin(a) * r)
      dummy.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3)
      dummy.scale.setScalar(0.22 + rnd() * 0.3)
      dummy.updateMatrix()
      crumbs.setMatrixAt(i, dummy.matrix)
    }
  }
  props(crumbs)
  crumbs.position.set(0.185, 0, 0.105)
  dress.add(crumbs)

  // the tap (die-cast) with its frozen drip (liquid), over the wet patch —
  // position from data so the hazard centre and the drip cannot drift
  const tapG = new T.Group()
  tapG.name = 'tap'
  {
    const brass = dieCastPaint(tokens, '#C9A45E', { ...fillOver(), toy: 0.5, rim: { strength: 0.42, size: 0.15 } })
    const riser = new T.Mesh(new T.CylinderGeometry(0.011, 0.013, 0.21, 24), brass)
    riser.name = 'tap-riser'
    riser.position.y = 0.105
    props(riser)
    tapG.add(riser)
    const elbow = new T.Mesh(new T.SphereGeometry(0.0125, 20, 16), brass)
    elbow.name = 'tap-elbow'
    elbow.position.y = 0.21
    props(elbow)
    tapG.add(elbow)
    const spout = new T.Mesh(new T.CylinderGeometry(0.0085, 0.009, 0.12, 24), brass)
    spout.name = 'tap-spout'
    spout.position.set(0.054, 0.21, 0)
    spout.rotation.z = Math.PI / 2
    props(spout)
    tapG.add(spout)
    const lip = new T.Mesh(new T.CylinderGeometry(0.0095, 0.008, 0.012, 24), brass)
    lip.name = 'tap-lip'
    lip.position.set(0.108, 0.203, 0)
    props(lip)
    tapG.add(lip)
    const drop = new T.Mesh(new T.SphereGeometry(0.009, 16, 12), liquid(tokens, '#C2DFD2', { ...fillOver(), opacity: 0.85 }))
    drop.name = 'tap-drip'
    drop.scale.y = 1.4
    drop.position.set(0.108, 0.03, 0)
    tapG.add(drop)
  }
  tapG.position.set(TAP.position[0] / SET_SCALE, 0, TAP.position[2] / SET_SCALE)
  tapG.rotation.y = TAP.yaw
  dress.add(tapG)

  // the wet patch — FILM, three layers: the dense core the reference shows,
  // a wide faint film reaching out to the full hazard radius (splash spread),
  // and the drip's frozen splash crown
  const patchG = new T.Group()
  patchG.name = 'wet-patch-films'
  patchG.position.set(HAZARDS.tapSplash.center.x / SET_SCALE, 0, HAZARDS.tapSplash.center.z / SET_SCALE)
  const spread = stainDecal(tokens, { kind: 'wetPatch', color: '#5A8073', opacity: 0.14, size: HAZARDS.tapSplash.radius / SET_SCALE, sheen: 0.25, lift: 0.0002, ...fillOver() })
  spread.name = 'wet-spread-film'
  patchG.add(spread)
  const patch = stainDecal(tokens, { kind: 'wetPatch', color: '#4F7667', opacity: 0.45, size: 0.045, sheen: 0.5, ...fillOver() })
  patch.name = 'wet-core-film'
  patchG.add(patch)
  const splash = stainDecal(tokens, { kind: 'splashRing', color: '#CFEADF', opacity: 0.4, size: 0.008, width: 0.0016, sheen: 0.3, lift: 0.0002, ...fillOver() })
  splash.name = 'splash-ring-film'
  patchG.add(splash)
  dress.add(patchG)

  // folded mint cloth — the accent, catching the key
  const cloth = new T.Group()
  cloth.name = 'cloth'
  {
    const clothMat = fabric(tokens, tokens.accent, fillOver())
    const c1 = new T.Mesh(toyBlock(0.075, 0.005, 0.055, 0.01, 0.002), clothMat)
    c1.name = 'cloth-fold-0'
    c1.position.y = 0.0025
    props(c1)
    cloth.add(c1)
    const c2 = new T.Mesh(toyBlock(0.062, 0.0045, 0.045, 0.01, 0.002), clothMat)
    c2.name = 'cloth-fold-1'
    c2.position.set(0.002, 0.007, 0.001)
    c2.rotation.y = 0.25
    props(c2)
    cloth.add(c2)
  }
  cloth.position.set(0.3, 0, 0.02)
  cloth.rotation.y = 0.35
  dress.add(cloth)

  // a second pencil, lying across the counter — lived-in, and it leads the
  // floor camera toward the bowl
  const lazyPencil = pencilProp('lazy-pencil')
  lazyPencil.position.set(0.14, 0.0043, -0.19)
  lazyPencil.rotation.set(Math.PI / 2, 0, 1.0)
  dress.add(lazyPencil)

  // cereal-box cliff (tile-A keep) — the establishing silhouette up-left,
  // where it also catches the tap's long shadow
  const cliff = new T.Group()
  cliff.name = 'cereal-box-cliff'
  {
    const carton = new T.Mesh(toyBlock(0.16, 0.21, 0.055, 0.006), paintedWood(tokens, '#E9B13F', { ...fillOver(), grain: 0.12 }))
    carton.name = 'cereal-carton'
    props(carton)
    cliff.add(carton)
    const band = new T.Mesh(new T.BoxGeometry(0.135, 0.038, 0.002), ceramic(tokens, tokens.accent, fillOver()))
    band.name = 'cereal-band'
    band.position.set(0, 0.045, 0.029)
    props(band, true, false)
    cliff.add(band)
  }
  cliff.position.set(-0.47, 0, -0.11)
  cliff.rotation.y = 0.65
  dress.add(cliff)

  // sugar-cube supports (tile-A keep, instanced): a stack pressing under the
  // ramp run, one fallen from the packet by the toast
  const cubes = new T.InstancedMesh(toyBlock(0.013, 0.013, 0.013, 0.0024), paintedWood(tokens, '#F4EADB', { ...fillOver(), grain: 0.05 }), 5)
  cubes.name = 'sugar-cubes'
  {
    const dummy = new T.Object3D()
    const run = STAGING.trackRuns[0]
    const midX = (run.a[0] + run.b[0]) / 2 / SET_SCALE
    const midZ = (run.a[2] + run.b[2]) / 2 / SET_SCALE
    const midY = (run.a[1] + run.b[1]) / 2 / SET_SCALE
    const h = 0.013
    const placements: Array<[number, number, number, number, number]> = [
      // x, z, y (center), tiltZ, tiltY — the support stack under the ramp run
      [midX, midZ, h / 2, 0, 0.12],
      [midX, midZ, (3 * h) / 2, 0, -0.18],
      [midX, midZ, (5 * h) / 2, 0, 0.06],
      // the wedge cube, pressed in — the kid's levelling trick
      [midX + 0.001, midZ, midY - 0.0055, 0.16, 0.42],
      // one fallen from the packet, by the toast
      [0.245, 0.12, h / 2, 0, 0.7],
    ]
    placements.forEach(([x, z, y, tiltZ, tiltY], i) => {
      dummy.position.set(x, y, z)
      dummy.rotation.set(0, tiltY, tiltZ)
      dummy.updateMatrix()
      cubes.setMatrixAt(i, dummy.matrix)
    })
  }
  props(cubes)
  dress.add(cubes)

  // the one small surprising detail: a teaspoon laid across the counter
  // beside the mug ring, handle pointing at the toast — someone was here
  const spoon = new T.Group()
  spoon.name = 'teaspoon'
  {
    const steel = dieCastPaint(tokens, '#CBBF9F', { ...fillOver(), toy: 0.35 })
    const bowlSpoon = new T.Mesh(new T.SphereGeometry(0.011, 18, 10), steel)
    bowlSpoon.name = 'spoon-bowl'
    bowlSpoon.scale.set(1, 0.42, 0.78)
    bowlSpoon.position.set(-0.03, 0.0022, 0)
    props(bowlSpoon)
    spoon.add(bowlSpoon)
    const handle = new T.Mesh(toyBlock(0.048, 0.0022, 0.009, 0.002), steel)
    handle.name = 'spoon-handle'
    handle.position.set(0.008, 0.0011, 0)
    props(handle)
    spoon.add(handle)
  }
  spoon.position.set(0.155, 0.001, 0.015)
  spoon.rotation.y = -0.55
  dress.add(spoon)

  // ---- sockets + hazards --------------------------------------------------
  const sockets: Record<string, KitchenSetSocket> = {}
  for (const [name, f] of Object.entries(BOWL_SOCKET_FRAMES)) {
    sockets[name] = {
      pos: new T.Vector3(...f.pos),
      tangent: new T.Vector3(...f.tangent),
      up: new T.Vector3(...f.up),
    }
  }

  // declare the key to every ToonMaterial so dark bands tint, not blacken
  if (opts.rig) applyKeyLight(group, opts.rig)

  return { group, sockets, hazardZones: { ...HAZARDS }, counter: COUNTER, staging: STAGING }
}
