/**
 * The production PORCH set — the studio's sixth room and its THRESHOLD,
 * built to the RATIFIED look: variant A (sunday morning, screen-door weave
 * combed across warm planks), 15/15 at the judging per
 * `docs/vault/Reference/Review 2026-10-09 porch judging.md`, migrated out of
 * the throwaway exploration `src/dev/scenes/porch.ts` (porch-a) on
 * stage5-porch-explore.
 *
 * `buildPorchSet(THREE, opts)` returns `{ group, sockets, hazardZones,
 * ground, staging }` — the SetInstance surface the registry consumes (see
 * `src/sets/index.ts`). The shell group (`shell`, non-solid) carries the
 * yard, deck, walls, the DOOR ASSEMBLY (cased opening, open leaf, shut
 * screen with its casting weave — the door mouth stays buildable), the
 * roof, the flush stoam and the gutter flume (a lane may cross it as the
 * garden lane crosses the gravel); the `dress` group carries the guard-
 * solid props (rails + posts, downspout, chime, lantern, planters).
 *
 * THE LIGHT REGIME is the garden's, ported indoors-by-half — `SUN` is a low
 * warm directional key and the flat SKY is the fill (`createLightingRig({
 * keyColor: SUN.color, sky: SKY, … })` in the staging scene), plus the
 * porch's one addition, `porchFillFromRig`: the shadow tint's SKY LIFT the
 * exploration's round 3 proved necessary to keep this set's big soft cast
 * shade out of the census BLACKISH band. The toon shader is NOT touched —
 * directional-only, the punctual gate stays a compile-time no-op and this
 * set takes the same byte-identical math the kitchen baselines gate.
 *
 * The set contains no cars and no track: the rig is `src/render/lighting.ts`,
 * the cars belong to the car system, and the staging scene
 * `src/dev/scenes/porch-set.ts` is where they meet.
 *
 * Geometry law carried from the exploration: `toyBlock` RESTS on local
 * y = 0 — every placement below is by BOTTOM face.
 */

import * as THREE_NS from 'three'
import { PROP_CALLOUTS } from '../../ui/callouts.ts'
import { ceramic, dieCastPaint, fabric, glass, liquid, paintedWood } from '../../render/materials.ts'
import { toyBlock } from '../../render/geometry.ts'
import { applyKeyLight, fillFromRig } from '../../render/lighting.ts'
import type { LightingRig } from '../../render/lighting.ts'
import { GLOBAL_TOKENS, SET_TOKENS, darken, lighten, mixHex } from '../../render/tokens.ts'
import type { SetTokens } from '../../render/tokens.ts'
import {
  CHIME,
  DECK,
  DOORMAT,
  DOOR,
  DOWNSPOUT,
  DRIPS,
  FLUME,
  LANTERN,
  HAZARDS,
  PLANK,
  PLANTERS,
  PORCH_SOCKET_FRAMES,
  RAILS,
  ROOF,
  SET_SCALE,
  SHADOW_TINT_SKY_LIFT,
  SHOES,
  SKY,
  STAGING,
  STEP,
  STEEL,
  WALL,
  WINDOW,
  YARD,
} from './data.ts'

export * from './data.ts'

// The porch's prop callouts, registered the way `src/ui/callouts.ts`
// documents (the garden `prop:shadowBars` precedent, applied to the set's
// own key light): the weave is the porch's read-only rhythm and the flume
// is its affordance. One line each, on the record.
PROP_CALLOUTS['prop:weaveShadow'] = "The checked grid is the screen door's shade — same boards, same grip. Drive through the light."
PROP_CALLOUTS['prop:gutterFlume'] = "The rain gutter runs along the boards — a crossing, not a cliff."

export interface PorchSetOptions {
  tokens?: SetTokens
  /** Lighting rig whose fill bands the materials ride (art bible §Light). */
  rig?: LightingRig
}

export interface PorchSetSocket {
  pos: THREE_NS.Vector3
  tangent: THREE_NS.Vector3
  up: THREE_NS.Vector3
}

export interface PorchSet {
  group: THREE_NS.Group
  /** Named prop sockets, world-space — the threshold pair + the step. */
  sockets: Record<string, PorchSetSocket>
  /** Variant A ratifies none; the field exists for the SetInstance surface. */
  hazardZones: Record<string, { id: string; kind: string; center: { x: number; y: number; z: number }; radius: number; gripFactor: number; source: string }>
  ground: typeof DECK
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

/** The porch's ONE fill path: the rig's fill bag with the shadow tint's
 *  SKY LIFT applied (see `SHADOW_TINT_SKY_LIFT` in data.ts — the census
 *  finding that keeps this set's big soft cast shade readable as sky
 *  COLOUR instead of filing as soot). Every material in the set AND the
 *  staging scene's cars and track ride this, so the lift cannot drift
 *  between the set and its renders. */
export function porchFillFromRig(rig: LightingRig): {
  fillHigh: string
  fillLow: string
  shadowTint: string
  fillStrength?: number
  fillShadeDepth?: number
} {
  const fill = fillFromRig(rig)
  return {
    ...fill,
    shadowTint: mixHex(fill.shadowTint, mixHex(SKY, '#FFFFFF', 0.6), SHADOW_TINT_SKY_LIFT),
  }
}

export function buildPorchSet(T = THREE_NS, opts: PorchSetOptions = {}): PorchSet {
  const tokens = opts.tokens ?? SET_TOKENS.porch
  const fill = opts.rig
    ? porchFillFromRig(opts.rig)
    // no rig (levels, not renders): the rig-less bag carries NO gain, so
    // every material rides the shader's 0.25 constant exactly as before.
    : { fillHigh: tokens.fillHigh, fillLow: tokens.fillLow, shadowTint: tokens.shadowTint, fillStrength: undefined }
  // The fully-outdoor ground takes the sky's fill harder (the exploration's
  // round-1 lawn-corner fix, promoted to the data-driven `YARD.skyFillMix`).
  const yardFill = { ...fill, fillHigh: mixHex(fill.fillHigh, SKY, YARD.skyFillMix) }
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
  group.name = 'porch-set'

  const shell = new T.Group()
  shell.name = 'shell'
  group.add(shell)

  const dress = new T.Group()
  dress.name = 'dress'
  dress.scale.setScalar(SET_SCALE)
  group.add(dress)

  // ---- the yard: the world beyond the rail (shell, non-solid) -----------
  {
    const g = new T.Group()
    g.name = 'yard'
    const ground = new T.Mesh(new T.CircleGeometry(YARD.radius, 64), fabric(tokens, YARD.hex, { ...yardFill, toy: 0.25, grain: 0.4, grainScale: 0.12 }))
    ground.name = 'yard-ground'
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -0.005
    ground.receiveShadow = true
    g.add(ground)
    const hedgeMat = fabric(tokens, mixHex(YARD.hex, '#3A5442', 0.4), { ...yardFill, toy: 0.3, grain: 0.35, grainScale: 0.2 })
    const hedge = new T.Mesh(toyBlock(4.4, 0.64, 0.3, 0.08, 0.02), hedgeMat)
    hedge.position.set(-0.2, YARD.hedgeY, YARD.hedgeZ)
    props(hedge)
    g.add(hedge)
    // side bands so the horizon closes left and right of the house too
    for (const [hx, hz] of [
      [1.6, -0.3],
      [-1.85, -0.3],
    ] as const) {
      const side = new T.Mesh(toyBlock(3.2, 0.66, 0.3, 0.08, 0.02), hedgeMat)
      side.position.set(hx, 0.28, hz)
      side.rotation.y = Math.PI / 2
      props(side)
      g.add(side)
    }
    shell.add(g)
  }

  // ---- the plank deck (shell; flush at DECK_Y, the floor-camera law) -----
  {
    const g = new T.Group()
    g.name = 'deck'
    const bed = new T.Mesh(
      toyBlock(1.16, 0.004, 0.78, 0.006, 0.001),
      paintedWood(tokens, darken(PLANK.hex, 0.1), { ...fillOver(), grain: 0.3, grainScale: 0.4 }),
    )
    bed.name = 'deck-bed'
    bed.position.y = -0.002
    props(bed, false, true)
    g.add(bed)
    const geo = toyBlock(PLANK.x.to - PLANK.x.from, 0.005, 0.05, 0.004, 0.001)
    const mats = [
      paintedWood(tokens, PLANK.hex, { ...fillOver(), grain: 0.5, grainScale: 0.35, toy: 0.15 }),
      paintedWood(tokens, lighten(PLANK.hex, PLANK.lift), { ...fillOver(), grain: 0.5, grainScale: 0.35, toy: 0.15 }),
    ]
    const d = new T.Object3D()
    mats.forEach((m, ri) => {
      const mesh = new T.InstancedMesh(geo, m, 7)
      for (let i = 0; i < 7; i++) {
        d.position.set(0, 0, PLANK.z0 + (ri * 7 + i) * PLANK.pitch)
        d.rotation.set(0, 0, 0)
        d.updateMatrix()
        mesh.setMatrixAt(i, d.matrix)
      }
      mesh.name = `deck-planks-${ri}`
      props(mesh, false, true)
      g.add(mesh)
    })
    shell.add(g)
  }

  // ---- the house wall: panels, flush seams, casing, hall, window ----------
  {
    const g = new T.Group()
    g.name = 'house-wall'
    const wood = paintedWood(tokens, WALL.hex, { ...fillOver(), grain: 0.4, grainScale: 0.3, toy: 0.1 })
    const panels: Array<[number, number, number, number]> = [
      // [x0, x1, y0, y1]
      [WALL.x.from, DOOR.x0 - 0.01, 0, WALL.top],
      [DOOR.x1 + 0.01, WALL.x.to, 0, WALL.top],
      [DOOR.x0 - 0.01, DOOR.x1 + 0.01, DOOR.top, WALL.top],
    ]
    for (const [x0, x1, y0, y1] of panels) {
      const p = new T.Mesh(toyBlock(x1 - x0, y1 - y0, 0.03, 0.008, 0.002), wood)
      p.position.set((x0 + x1) / 2, y0, WALL.z)
      props(p)
      g.add(p)
    }
    // clapboard relief rows FLUSH with the wall face, read as seam LINES
    // (round 0 left them proud of the face and the key lit them as bricks)
    const d = new T.Object3D()
    const segs: Array<[number, number, number]> = []
    for (let y = WALL.seam.y0; y < DOOR.top + 0.02; y += WALL.seam.pitch) {
      segs.push([-0.64, 1.02, y], [0.43, 0.84, y])
    }
    for (let y = 0.37; y < WALL.top; y += WALL.seam.pitch) segs.push([-0.15, 2.0, y])
    const seamMat = paintedWood(tokens, darken(WALL.hex, 0.14), { ...fillOver(), grain: 0.3, toy: 0.05 })
    const boards = new T.InstancedMesh(new T.BoxGeometry(1, 0.026, 0.012), seamMat, segs.length)
    segs.forEach(([cx, w, y], i) => {
      d.position.set(cx, y, WALL.seam.z)
      d.scale.set(w, 1, 1)
      d.rotation.set(0, 0, 0)
      d.updateMatrix()
      boards.setMatrixAt(i, d.matrix)
    })
    boards.name = 'clapboard-seams'
    props(boards, false, true)
    g.add(boards)
    // door casing
    const casing = paintedWood(tokens, lighten(WALL.hex, 0.22), { ...fillOver(), grain: 0.35 })
    for (const cx of [DOOR.x0 - 0.016, DOOR.x1 + 0.016]) {
      const jamb = new T.Mesh(toyBlock(0.026, DOOR.top + 0.02, 0.02, 0.005, 0.001), casing)
      jamb.position.set(cx, 0, -0.3)
      props(jamb)
      g.add(jamb)
    }
    const head = new T.Mesh(toyBlock(0.21, 0.026, 0.02, 0.005, 0.001), casing)
    head.position.set((DOOR.x0 + DOOR.x1) / 2, DOOR.top, -0.3)
    props(head)
    g.add(head)
    // the hall behind the opening: a warm dark whose dark is a LOW ALBEDO,
    // not black paint (diffuseStrength 0.35 — the house is awake)
    const back = new T.Mesh(
      new T.PlaneGeometry(0.18, 0.34),
      fabric(tokens, WALL.interiorHex, { ...fillOver(), diffuseStrength: WALL.interiorGlow, rim: { strength: 0, size: 0.5 } }),
    )
    back.name = 'hall-pocket'
    back.position.set(-0.05, 0.17, -0.335)
    props(back, false, false)
    g.add(back)
    // window right of the door: frame, sill, glass
    const glassMat = glass(tokens, mixHex(SKY, '#FFFFFF', 0.35), { ...fillOver(), opacity: 0.4 })
    const pane = new T.Mesh(new T.PlaneGeometry(WINDOW.pane.w, WINDOW.pane.h), glassMat)
    pane.name = 'window-glass'
    pane.position.set(WINDOW.center[0], WINDOW.center[1], WINDOW.z)
    g.add(pane)
    for (const [cx, yBottom, w, h] of [
      [0.38, 0.34, 0.24, 0.02],
      [0.38, 0.202, 0.24, 0.02],
      [0.272, 0.2, 0.02, 0.16],
      [0.488, 0.2, 0.02, 0.16],
      [0.38, 0.205, 0.012, 0.15],
    ] as const) {
      const bar = new T.Mesh(toyBlock(w, h, 0.018, 0.004, 0.001), casing)
      bar.position.set(cx, yBottom, WINDOW.z)
      props(bar)
      g.add(bar)
    }
    const sill = new T.Mesh(toyBlock(0.28, 0.016, 0.04, 0.005, 0.001), casing)
    sill.position.set(0.38, 0.19, -0.286)
    props(sill)
    g.add(sill)
    // the short RETURN wall: the porch is a corner of the house, and without
    // it the establishing rig sees "porch floating in a field"
    const ret = new T.Mesh(new T.BoxGeometry(0.03, WALL.top, 0.52), wood)
    ret.name = 'return-wall'
    ret.position.set(-1.14, WALL.top / 2, -0.05)
    props(ret)
    g.add(ret)
    shell.add(g)
  }

  // ---- the door assembly: open leaf + SHUT screen with the casting weave -
  // SHELL geometry on purpose (the ladder handover): the door mouth stays
  // fully buildable and the weave — the set's key light — casts from inside
  // the non-solid shell, so no guard box ever sits in the threshold.
  {
    const g = new T.Group()
    g.name = 'door-assembly'
    // the planked shed door, open onto the yard (battens + one Z-brace keep
    // the round-2 "saturated slab" from coming back)
    const pivot = new T.Group()
    pivot.name = 'storm-door'
    pivot.position.set(DOOR.x0 - 0.004, 0, -0.3)
    const doorWood = paintedWood(tokens, mixHex('#5D4534', WALL.hex, 0.3), { ...fillOver(), grain: 0.55, grainScale: 0.8, toy: 0.15 })
    const panel = new T.Mesh(toyBlock(0.142, DOOR.top, 0.014, 0.004, 0.001), doorWood)
    panel.position.set(0.075, 0, 0)
    props(panel)
    pivot.add(panel)
    const batten = paintedWood(tokens, mixHex('#4A3728', WALL.hex, 0.25), { ...fillOver(), grain: 0.5, grainScale: 1.2, toy: 0.1 })
    for (const bx of [0.018, 0.056, 0.094, 0.132]) {
      const b = new T.Mesh(toyBlock(0.009, DOOR.top - 0.012, 0.003, 0.002, 0.0008), batten)
      b.position.set(bx, 0.008, 0.009)
      props(b)
      pivot.add(b)
    }
    const brace = new T.Mesh(new T.BoxGeometry(0.15, 0.011, 0.003), batten)
    brace.position.set(0.075, 0.15, 0.009)
    brace.rotation.z = 0.28
    props(brace)
    pivot.add(brace)
    const knob = new T.Mesh(new T.SphereGeometry(0.006, 12, 10), dieCastPaint(tokens, '#C8B07E', { ...fillOver(), toy: 0.5 }))
    knob.position.set(0.128, 0.16, 0.012)
    props(knob)
    pivot.add(knob)
    pivot.rotation.y = DOOR.open
    g.add(pivot)
    // the SCREEN door: shut, and its mesh bars CAST — the 6 mm weave the
    // morning combs as the parallelogram (must-not-lose 1: THE key story)
    const screen = new T.Group()
    screen.name = 'screen-door'
    screen.position.set(DOOR.x0 - 0.004, 0, DOOR.screenZ)
    const frameMat = paintedWood(tokens, lighten(WALL.hex, 0.25), { ...fillOver(), grain: 0.3 })
    for (const [cx, yBottom, w, h] of [
      [0.075, 0.294, 0.142, 0.014],
      [0.075, 0, 0.142, 0.014],
      [0.006, 0, 0.012, 0.308],
      [0.144, 0, 0.012, 0.308],
    ] as const) {
      const bar = new T.Mesh(toyBlock(w, h, 0.012, 0.003, 0.001), frameMat)
      bar.position.set(cx, yBottom, 0)
      props(bar)
      screen.add(bar)
    }
    // mesh weave: vertical + horizontal bars (BoxGeometry centered in Y)
    const d = new T.Object3D()
    const nV = Math.floor(0.13 / DOOR.mesh.pitch)
    const nH = Math.floor(0.28 / DOOR.mesh.pitch)
    const meshMat = dieCastPaint(tokens, DOOR.mesh.hex, { ...fillOver(), toy: 0.3, diffuseStrength: 0.8 })
    const weave = new T.InstancedMesh(new T.BoxGeometry(1, 1, 1), meshMat, nV + nH)
    weave.name = 'screen-weave'
    let i = 0
    for (let k = 0; k < nV; k++) {
      d.position.set(0.008 + k * DOOR.mesh.pitch, 0.163, 0)
      d.scale.set(0.0014, 0.29, 0.0012)
      d.rotation.set(0, 0, 0)
      d.updateMatrix()
      weave.setMatrixAt(i++, d.matrix)
    }
    for (let k = 0; k < nH; k++) {
      d.position.set(0.075, 0.02 + k * DOOR.mesh.pitch, 0)
      d.scale.set(0.13, 0.0014, 0.0012)
      d.rotation.set(0, 0, 0)
      d.updateMatrix()
      weave.setMatrixAt(i++, d.matrix)
    }
    weave.castShadow = true
    weave.receiveShadow = false
    screen.add(weave)
    g.add(screen)
    shell.add(g)
  }

  // ---- the roof: no-cast ceiling, fascia, beam, corner posts --------------
  {
    const g = new T.Group()
    g.name = 'roof'
    const wood = paintedWood(tokens, lighten(WALL.hex, 0.14), { ...fillOver(), grain: 0.35, grainScale: 0.5 })
    const ceil = new T.Mesh(new T.BoxGeometry(1.16, 0.016, 0.78), wood)
    ceil.name = 'ceiling'
    ceil.position.set(0, ROOF.ceilingY, 0.05)
    ceil.castShadow = false // the key must reach the deck — casting ceiling
    ceil.receiveShadow = true // would erase the weave parallelogram
    g.add(ceil)
    const fascia = new T.Mesh(toyBlock(1.18, 0.055, 0.02, 0.008, 0.002), wood)
    fascia.position.set(0, 0.44, ROOF.fasciaZ)
    props(fascia)
    g.add(fascia)
    const beam = new T.Mesh(toyBlock(1.16, 0.03, 0.03, 0.006, 0.002), wood)
    beam.position.set(0, 0.432, ROOF.beamZ)
    props(beam)
    g.add(beam)
    shell.add(g)
    for (const px of ROOF.posts) {
      const post = new T.Mesh(toyBlock(0.022, ROOF.height, 0.022, 0.006, 0.002), wood)
      post.name = 'corner-post'
      post.position.set(px, 0, 0.41)
      props(post)
      dress.add(post)
    }
  }

  // ---- the railings (dress solids — the corridor's edges) -----------------
  {
    const g = new T.Group()
    g.name = 'railings'
    const wood = paintedWood(tokens, lighten(WALL.hex, 0.14), { ...fillOver(), grain: 0.35, grainScale: 0.5 })
    const balMat = paintedWood(tokens, lighten(WALL.hex, 0.1), { ...fillOver(), grain: 0.3 })
    const d = new T.Object3D()
    const balusters = new T.InstancedMesh(toyBlock(0.013, 0.09, 0.013, 0.004, 0.001), balMat, 48)
    let bi = 0
    for (const run of RAILS.runs) {
      const [x0, x1, z0, z1] = run.axis === 'x' ? [run.x0, run.x1, RAILS.z, RAILS.z] : [run.x, run.x, run.z0, run.z1]
      const len = run.axis === 'x' ? x1 - x0 : z1 - z0
      const mid: [number, number] = [(x0 + x1) / 2, (z0 + z1) / 2]
      for (const yBottom of [0.142, 0.052]) {
        const rail = new T.Mesh(toyBlock(run.axis === 'x' ? len : 0.016, 0.014, run.axis === 'x' ? 0.016 : len, 0.004, 0.001), wood)
        rail.position.set(mid[0], yBottom, mid[1])
        props(rail)
        g.add(rail)
      }
      const n = Math.max(2, Math.round(len / RAILS.balusterPitch))
      for (let i = 0; i <= n; i++) {
        const off = len * (i / n)
        d.position.set(run.axis === 'x' ? x0 + off : x0, 0.055, run.axis === 'x' ? z0 : z0 + off)
        d.rotation.set(0, 0, 0)
        d.updateMatrix()
        if (bi < 48) balusters.setMatrixAt(bi++, d.matrix)
      }
    }
    balusters.count = bi
    props(balusters)
    g.add(balusters)
    dress.add(g)
  }

  // ---- the flush stoam (shell — driveable, floor-camera law) --------------
  {
    const step = new T.Mesh(
      toyBlock(STEP.w, 0.004, STEP.d, 0.008, 0.001),
      ceramic(tokens, mixHex(GLOBAL_TOKENS.cream, tokens.dominant, 0.4), { ...fillOver(), specular: { size: 0.6, strength: 0.06 }, toy: 0.08 }),
    )
    step.name = 'step-stoam'
    step.position.set(STEP.center[0], 0, STEP.center[1])
    props(step, false, true)
    shell.add(step)
  }

  // ---- the gutter flume (shell — the lane may cross it) + downspout ------
  {
    const g = new T.Group()
    g.name = 'gutter-flume'
    const metal = dieCastPaint(tokens, STEEL, { ...fillOver(), toy: 0.5, specular: { size: 0.35, strength: 0.5 } })
    const dark = fabric(tokens, '#4A5560', { ...fillOver(), diffuseStrength: 0.4 })
    const floor = new T.Mesh(toyBlock(FLUME.length, 0.004, 0.048, 0.004, 0.001), dark)
    floor.position.y = 0.005
    props(floor, false, true)
    g.add(floor)
    for (const pz of [-0.024, 0.024]) {
      const side = new T.Mesh(toyBlock(FLUME.length, 0.02, 0.007, 0.003, 0.001), metal)
      side.position.set(0, 0.005, pz)
      props(side)
      g.add(side)
    }
    for (const px of [-FLUME.length / 2, FLUME.length / 2]) {
      const cap = new T.Mesh(toyBlock(0.006, 0.02, 0.055, 0.003, 0.001), metal)
      cap.position.set(px, 0.005, 0)
      props(cap)
      g.add(cap)
    }
    // A's water: last night's rain, a TRICKLE in the trough (the timing
    // tell; the drown-off wet patch is a level-side ask, see data.ts)
    const surface = new T.Mesh(
      new T.PlaneGeometry(FLUME.length - 0.012, 0.026),
      liquid(tokens, mixHex(SKY, '#FFFFFF', 0.4), { ...fillOver(), opacity: 0.6, specular: { size: 0.24, strength: 1.0 } }),
    )
    surface.rotation.x = -Math.PI / 2
    surface.position.y = 0.0115
    props(surface, false, false)
    g.add(surface)
    g.position.set(FLUME.center[0], 0, FLUME.center[1])
    g.rotation.y = FLUME.yaw
    shell.add(g)
  }
  {
    // the drip line from the elbow — four drops frozen at the fixed clock
    const g = new T.Group()
    g.name = 'drip-line'
    const mat = liquid(tokens, mixHex(SKY, '#FFFFFF', 0.7), { ...fillOver(), opacity: 0.5, specular: { size: 0.16, strength: 0.8 } })
    for (let i = 0; i < DRIPS.count; i++) {
      const drop = new T.Mesh(new T.SphereGeometry(0.0022, 8, 7), mat)
      drop.position.set(DRIPS.at[0] + (i - (DRIPS.count - 1) / 2) * DRIPS.spread * 0.3, 0.26 - i * 0.06, DRIPS.at[1] + (i - (DRIPS.count - 1) / 2) * DRIPS.spread)
      drop.scale.y = 1.5
      props(drop, false, false)
      g.add(drop)
    }
    shell.add(g)
    // the downspout itself (riser + elbow + spout + strap) is a dress solid
    const p = new T.Group()
    p.name = 'downspout'
    const metal = dieCastPaint(tokens, STEEL, { ...fillOver(), toy: 0.5, specular: { size: 0.35, strength: 0.5 }, rim: { strength: 0.3, size: 0.2 } })
    const riser = new T.Mesh(new T.CylinderGeometry(0.014, 0.014, 0.16, 18), metal)
    riser.position.set(DOWNSPOUT.x, 0.38, -0.28)
    props(riser)
    p.add(riser)
    const elbow = new T.Mesh(new T.SphereGeometry(0.016, 16, 12), metal)
    elbow.position.set(DOWNSPOUT.x, 0.3, -0.28)
    props(elbow)
    p.add(elbow)
    const spout = new T.Mesh(new T.CylinderGeometry(0.012, 0.014, 0.05, 16), metal)
    spout.position.set(DOWNSPOUT.x, 0.293, -0.26)
    spout.rotation.x = Math.PI / 2
    props(spout)
    p.add(spout)
    const strap = new T.Mesh(new T.TorusGeometry(0.016, 0.003, 8, 16), metal)
    strap.position.set(DOWNSPOUT.x, 0.44, -0.272)
    props(strap)
    p.add(strap)
    dress.add(p)
  }

  // ---- the chime, hung under the lintel (static — the pendulum sim is a
  // level-side Feel ask, not a set animation) ------------------------------
  {
    const g = new T.Group()
    g.name = 'wind-chime'
    const cord = new T.Mesh(new T.CylinderGeometry(0.0012, 0.0012, 0.17, 6), fabric(tokens, '#6E6353', fillOver()))
    cord.position.y = 0.085
    g.add(cord)
    const hub = new T.Mesh(new T.CylinderGeometry(0.014, 0.016, 0.008, 16), dieCastPaint(tokens, '#7A6B52', { ...fillOver(), toy: 0.5, grain: 0.4 }))
    props(hub)
    g.add(hub)
    const alu = dieCastPaint(tokens, mixHex(STEEL, '#FFFFFF', 0.2), { ...fillOver(), toy: 0.3, specular: { size: 0.08, strength: 1.1 } })
    const lens = [0.055, 0.048, 0.062, 0.042, 0.052]
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2
      const tube = new T.Mesh(new T.CylinderGeometry(0.0035, 0.0035, lens[i], 10), alu)
      tube.position.set(Math.cos(a) * 0.012, -0.024 - lens[i] / 2, Math.sin(a) * 0.012)
      props(tube)
      g.add(tube)
      const link = new T.Mesh(new T.CylinderGeometry(0.0008, 0.0008, 0.016, 4), fabric(tokens, '#6E6353', fillOver()))
      link.position.set(Math.cos(a) * 0.012, -0.008, Math.sin(a) * 0.012)
      g.add(link)
    }
    const clapper = new T.Mesh(new T.CylinderGeometry(0.009, 0.009, 0.004, 14), dieCastPaint(tokens, STEEL, { ...fillOver(), toy: 0.4 }))
    clapper.position.y = -0.038
    props(clapper)
    g.add(clapper)
    const sail = new T.Mesh(toyBlock(0.02, 0.026, 0.002, 0.005, 0.0008), ceramic(tokens, mixHex(tokens.accent, '#F4E6CC', 0.35), { ...fillOver(), specular: { size: 0.5, strength: 0.15 } }))
    sail.position.y = -0.088
    props(sail)
    g.add(sail)
    g.position.set(...CHIME.position)
    dress.add(g)
  }

  // ---- the lantern, off and leaning by the step (dress) -------------------
  {
    const g = new T.Group()
    g.name = 'lantern'
    const metal = dieCastPaint(tokens, mixHex('#4E5A50', STEEL, 0.4), { ...fillOver(), toy: 0.55, rim: { strength: 0.4, size: 0.2 } })
    const base = new T.Mesh(toyBlock(0.03, 0.008, 0.03, 0.006, 0.002), metal)
    props(base)
    g.add(base)
    const chimney = new T.Mesh(new T.CylinderGeometry(0.011, 0.013, 0.026, 18), glass(tokens, mixHex(SKY, '#FFFFFF', 0.5), { ...fillOver(), opacity: 0.4 }))
    chimney.position.y = 0.024
    props(chimney, true, false)
    g.add(chimney)
    const cap = new T.Mesh(new T.ConeGeometry(0.02, 0.014, 18), metal)
    cap.position.y = 0.043
    props(cap)
    g.add(cap)
    const handle = new T.Mesh(new T.TorusGeometry(0.011, 0.0025, 8, 18, Math.PI), metal)
    handle.position.y = 0.051
    props(handle)
    g.add(handle)
    g.position.set(...LANTERN.position)
    g.rotation.z = LANTERN.lean
    dress.add(g)
  }

  // ---- the geraniums: the amber spent TWICE, both times IN the band ------
  {
    function planter(position: readonly [number, number, number], potMix: number, blooms: number, scale = 1): THREE_NS.Group {
      const g = new T.Group()
      const pot = new T.Mesh(new T.CylinderGeometry(0.042, 0.032, 0.06, 22), ceramic(tokens, mixHex(PLANTERS.potHex, tokens.dominant, potMix), { ...fillOver(), specular: { size: 0.5, strength: 0.14 }, toy: 0.15 }))
      pot.position.y = 0.03
      props(pot)
      g.add(pot)
      const soil = new T.Mesh(new T.CircleGeometry(0.037, 20), fabric(tokens, '#4A3A2C', { ...fillOver(), toy: 0.4 }))
      soil.rotation.x = -Math.PI / 2
      soil.position.y = 0.058
      g.add(soil)
      const leaves = new T.Mesh(new T.SphereGeometry(0.04, 14, 10), fabric(tokens, mixHex(YARD.hex, '#4E6B3A', 0.5), { ...fillOver(), toy: 0.3, grain: 0.3 }))
      leaves.position.y = 0.082
      leaves.scale.set(1, 0.7, 1)
      props(leaves)
      g.add(leaves)
      const d = new T.Object3D()
      const rnd = makeRng(PLANTERS.seed)
      const bloomsMesh = new T.InstancedMesh(new T.SphereGeometry(0.009, 10, 8), fabric(tokens, tokens.accent, { ...fillOver(), rim: { strength: 0.5, size: 0.5 } }), blooms)
      for (let i = 0; i < blooms; i++) {
        d.position.set((rnd() - 0.5) * 0.06, 0.1 + rnd() * 0.02, (rnd() - 0.5) * 0.06)
        d.scale.setScalar(0.8 + rnd() * 0.5)
        d.rotation.set(0, 0, 0)
        d.updateMatrix()
        bloomsMesh.setMatrixAt(i, d.matrix)
      }
      props(bloomsMesh)
      g.add(bloomsMesh)
      g.position.set(...position)
      g.scale.setScalar(scale)
      return g
    }
    const byStep = planter(PLANTERS.byStep.position, PLANTERS.byStep.potMix, PLANTERS.byStep.blooms)
    byStep.name = 'planter-by-step'
    dress.add(byStep)
    const box = planter(PLANTERS.box.position, PLANTERS.box.potMix, PLANTERS.box.blooms, PLANTERS.box.scale)
    box.name = 'planter-window-box'
    dress.add(box)
  }

  // ---- the doormat: the threshold's accent band (shell — flat, walkable) --
  {
    const g = new T.Group()
    g.name = 'doormat'
    const mat = new T.Mesh(
      toyBlock(0.12, 0.004, 0.08, 0.006, 0.001),
      fabric(tokens, mixHex('#9A7C52', tokens.dominant, 0.3), { ...fillOver(), toy: 0.25, grain: 0.5, grainScale: 2.2 }),
    )
    mat.position.y = 0.002
    props(mat, false, true)
    g.add(mat)
    if (DOORMAT.band) {
      const strip = new T.Mesh(toyBlock(0.1, 0.0015, 0.016, 0.004, 0.0004), fabric(tokens, tokens.accent, { ...fillOver(), rim: { strength: 0.4, size: 0.6 } }))
      strip.position.set(0, 0.0056, 0.014)
      props(strip, false, true)
      g.add(strip)
    }
    g.position.set(...DOORMAT.position)
    shell.add(g)
  }

  // ---- the kid's pair: the scale joke, RESIZED (must-not-lose 4) ----------
  {
    const g = new T.Group()
    g.name = 'shoes'
    const mat = dieCastPaint(tokens, SHOES.hex, { ...fillOver(), toy: 0.3 })
    for (const [pz, rz] of [
      [0, 0.1],
      [0.017, -0.35],
    ] as const) {
      const shoe = new T.Mesh(toyBlock(0.03, 0.014, 0.014, 0.005, 0.002), mat)
      shoe.position.set(0, 0.005, pz)
      shoe.rotation.y = rz
      props(shoe)
      g.add(shoe)
      const toe = new T.Mesh(toyBlock(0.01, 0.008, 0.013, 0.004, 0.001), dieCastPaint(tokens, '#EFE3CC', fillOver()))
      toe.position.set(0.016, 0.005, pz)
      toe.rotation.y = rz
      props(toe)
      g.add(toe)
    }
    g.position.set(...SHOES.position)
    g.rotation.y = SHOES.yaw
    g.scale.setScalar(SHOES.scale)
    dress.add(g)
  }

  // ---- sockets + hazards --------------------------------------------------
  const sockets: Record<string, PorchSetSocket> = {}
  for (const [name, f] of Object.entries(PORCH_SOCKET_FRAMES)) {
    sockets[name] = {
      pos: new T.Vector3(...f.pos),
      tangent: new T.Vector3(...f.tangent),
      up: new T.Vector3(...f.up),
    }
  }

  // Declare the MORNING SUN (the rig's warm key) to every ToonMaterial so
  // dark bands tint toward the SKY value, never blacken — the garden's
  // sun-regime note, ported indoors-by-half.
  if (opts.rig) applyKeyLight(group, opts.rig)

  return {
    group,
    sockets,
    hazardZones: { ...HAZARDS },
    ground: DECK,
    staging: STAGING,
  }
}
