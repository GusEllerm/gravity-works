/**
 * The production GARDEN set — the studio's first outdoor room, built to the
 * RATIFIED look: variant B (paving slabs at golden hour), 13/13 at both
 * canonical cameras per
 * `docs/vault/Reference/Review 2026-10-08 Stage 4 garden.md`, migrated out of
 * the throwaway exploration `src/dev/scenes/garden.ts` (garden-b).
 *
 * `buildGardenSet(THREE, opts)` returns `{ group, sockets, hazardZones,
 * ground, staging, sunDisc }` — the SetInstance surface the registry consumes
 * (see `src/sets/index.ts`). The shell group (`shell`, non-solid) carries
 * lawn, patio, hedge, gravel band and the sun disc; the `dress` group carries
 * the guard-solid props (trellis, pipe, can, gnome, hose, pot).
 *
 * THE NEW LIGHT REGIME, in one paragraph: indoors the rig's key is a lamp or
 * a window and the fill bands derive from the set's dominant. Outdoors the
 * key IS the sun — a low, WARM directional (`SUN`, its length encoding the
 * elevation, its radius the hard-ish edge) — and the sky is the fill: the
 * rig is built with `createLightingRig({ keyColor: SUN.color, sky: SKY,
 * skyInfluence: … })`, which pulls the sky-side band AND the shadow tint
 * toward the sky value. That second one is the mechanism the variant-B
 * concept claimed and its pixels contradicted (measured warm-olive shade);
 * the production set implements the sky-derived tint so the census says so.
 * The toon shader is NOT touched: the punctual-gate precedent holds —
 * directional-only scenes take byte-identical math (the kitchen visual
 * baselines gate it; `tests/unit/garden-lighting.test.ts` proves the rig and
 * the gate, and `?set=garden` never mounts a point light).
 *
 * The sun disc is GEOMETRY, not a flare (never-list intact): a flat disc on
 * the key's bearing, only allowed because a ~13° sun sits inside the hero
 * frame — the bible rule is flagged for the Documentarian in the session
 * log, and `CAMERAS.hero` is the rig that proves it.
 *
 * The set contains no cars and no track: the rig is `src/render/lighting.ts`,
 * the cars belong to the car system, and the staging scene
 * `src/dev/scenes/garden-set.ts` is where they meet.
 */

import * as THREE_NS from 'three'
import { ceramic, dieCastPaint, fabric, paintedWood, trackPlastic } from '../../render/materials.ts'
import { toyBlock } from '../../render/geometry.ts'
import { applyKeyLight, fillFromRig } from '../../render/lighting.ts'
import type { LightingRig } from '../../render/lighting.ts'
import { SET_TOKENS, darken, lighten, mixHex } from '../../render/tokens.ts'
import type { SetTokens } from '../../render/tokens.ts'
import {
  DECK,
  DECK_Y,
  GRAVEL,
  HEDGE,
  HOSE,
  GNOME,
  HAZARDS,
  JOINT_MOSS,
  LAWN,
  PATIO,
  STONE_FILL_SCALE,
  PETAL,
  PIPE,
  PIPE_SOCKET_FRAMES,
  POT,
  SET_SCALE,
  SNAIL,
  STAGING,
  SUN,
  TRELLIS,
  WATERING_CAN,
} from './data.ts'

export * from './data.ts'

export interface GardenSetOptions {
  tokens?: SetTokens
  /** Lighting rig whose fill bands the materials ride (art bible §Light). */
  rig?: LightingRig
}

export interface GardenSetSocket {
  pos: THREE_NS.Vector3
  tangent: THREE_NS.Vector3
  up: THREE_NS.Vector3
}

export interface GardenSet {
  group: THREE_NS.Group
  /** Named prop sockets, world-space — the drain-pipe bore pair. */
  sockets: Record<string, GardenSetSocket>
  /** Variant B ratifies none; the field exists for the SetInstance surface. */
  hazardZones: Record<string, { id: string; kind: string; center: { x: number; y: number; z: number }; radius: number; gripFactor: number; source: string }>
  ground: typeof DECK
  staging: typeof STAGING
  /** The flat sun-disc mesh (shell geometry; the staging scene billboards
   *  it to the shot camera). Not a light — the rig's key is the light. */
  sunDisc: THREE_NS.Mesh
}

/** Deterministic pseudo-random (fixed seed — the clock never moves). */
function makeRng(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

export function buildGardenSet(T = THREE_NS, opts: GardenSetOptions = {}): GardenSet {
  const tokens = opts.tokens ?? SET_TOKENS.garden
  const fill = opts.rig
    ? fillFromRig(opts.rig)
    // no rig (levels, not renders): the rig-less bag carries NO gain, so
    // every material rides the shader's 0.25 constant exactly as before.
    : { fillHigh: tokens.fillHigh, fillLow: tokens.fillLow, shadowTint: tokens.shadowTint, fillStrength: undefined }
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

  /** Stone: the AD widened the bible's ceramic class to "ceramic/stone"
   *  (specular near zero, saturation pre-cut) rather than mint an eighth
   *  class — this helper is that ruling in code. */
  function stone(hex: string, toy = 0.1): THREE_NS.ShaderMaterial {
    return ceramic(tokens, hex, {
      ...fillOver(),
      // Round 1: the stone class spends its own share of the sky fill (see
      // STONE_FILL_SCALE in data.ts); 1 rides the rig gain byte-identically.
      fillStrength: (fill.fillStrength ?? 0.25) * STONE_FILL_SCALE,
      specular: { size: 0.6, strength: 0.07 },
      rim: { strength: 0.1, size: 0.5 },
      toy,
      // ceramic clamps grain unless a toy treatment carries it
      ...(toy > 0 ? { grain: 0.25, grainScale: 0.8 } : {}),
    })
  }

  const group = new T.Group()
  group.name = 'garden-set'

  // ---- the shell: ground, patio, horizon, sky furniture (never a guard
  // solid — it lives outside the `dress` group the guard collects from) ----
  const shell = new T.Group()
  shell.name = 'shell'
  group.add(shell)

  // The lawn the patio floats INTO. One flat disc, the set's only big grain
  // surface (long lazy streaks; every prop stays finer or flat).
  const lawn = new T.Mesh(
    new T.CircleGeometry(LAWN.radius, 96),
    fabric(tokens, LAWN.hex, { ...fillOver(), toy: 0.3, grain: 0.4, grainScale: 0.18 }),
  )
  lawn.name = 'garden-lawn'
  lawn.rotation.x = -Math.PI / 2
  lawn.receiveShadow = true
  shell.add(lawn)

  // The patio: sand bed + settled slabs (instanced, seeded settle). FLUSH
  // with the lawn within 6 mm — the floor-camera law, see data.ts.
  const bed = new T.Mesh(toyBlock(PATIO.bed.size, 0.008, PATIO.bed.size, 0.01, 0.003), stone(darken(PATIO.hex, 0.45)))
  bed.name = 'patio-bed'
  bed.position.y = -0.003
  props(bed, false, true)
  shell.add(bed)
  {
    const { size, gap, count } = PATIO.slab
    const d = new T.Object3D()
    const rnd = makeRng(PATIO.seed)
    const slabs = new T.InstancedMesh(toyBlock(size, 0.006, size, 0.005, 0.002), stone(PATIO.hex, 0.14), count * count)
    let i = 0
    for (let a = 0; a < count; a++) {
      for (let b = 0; b < count; b++) {
        d.position.set(((a - (count - 1) / 2) * (size + gap)), DECK_Y - 0.003 + (rnd() - 0.5) * 0.0012, (b - (count - 1) / 2) * (size + gap))
        d.rotation.set(0, (rnd() - 0.5) * 0.035, 0)
        d.updateMatrix()
        slabs.setMatrixAt(i++, d.matrix)
      }
    }
    slabs.name = 'patio-slabs'
    props(slabs, false, true)
    shell.add(slabs)
  }

  // Joint moss at the NAMED joint crossings (carry-forward 3): clusters on
  // the seam grid, ~3 cm across — the size the hero camera resolves. The
  // chartreuse ground accent, dark-free by construction.
  {
    const d = new T.Object3D()
    const moss = new T.InstancedMesh(new T.IcosahedronGeometry(0.016, 1), fabric(tokens, mixHex(tokens.accent, '#4F6B30', 0.7), { ...fillOver(), toy: 0.35, rim: { strength: 0.5, size: 0.8 } }), JOINT_MOSS.patches.length * JOINT_MOSS.clumps.length)
    let i = 0
    for (const [px, pz] of JOINT_MOSS.patches) {
      for (const [cx, cz, cs] of JOINT_MOSS.clumps) {
        d.position.set(px + cx, DECK_Y - 0.0005, pz + cz)
        d.rotation.set(0, (cx * 97 + cz * 41) % 3, 0)
        d.scale.set(1.55 * cs, 0.22, 1.55 * cs)
        d.updateMatrix()
        moss.setMatrixAt(i++, d.matrix)
      }
    }
    moss.name = 'joint-moss'
    props(moss, false, true)
    shell.add(moss)
  }

  // The laid gravel crossing — designed infill, not noise: fixed row pitch
  // across, fixed pitch along, alternate rows half-pitch staggered, and a
  // kerb line of flat stones on both edges. The pattern is the "laid path"
  // read the exploration's uniform scatter never earned.
  {
    const a = new T.Vector3(GRAVEL.from[0], 0, GRAVEL.from[1])
    const b = new T.Vector3(GRAVEL.to[0], 0, GRAVEL.to[1])
    const dir = b.clone().sub(a)
    const len = dir.length()
    dir.normalize()
    const perp = new T.Vector3(-dir.z, 0, dir.x)
    const rnd = makeRng(GRAVEL.seed)
    const rows = Math.floor(GRAVEL.width / GRAVEL.rowPitch)
    const along = Math.floor(len / GRAVEL.alongPitch)
    const stones = new T.InstancedMesh(new T.IcosahedronGeometry(0.0016, 0), stone(GRAVEL.hex, 0.1), rows * along)
    const d = new T.Object3D()
    let i = 0
    for (let r = 0; r < rows; r++) {
      const side = (r - (rows - 1) / 2) * GRAVEL.rowPitch
      for (let k = 0; k < along; k++) {
        // the stagger: alternate rows shift half a pitch — a weave, not a grid
        const off = (k + (r % 2) * 0.5) * GRAVEL.alongPitch
        const p = a.clone().addScaledVector(dir, off + (rnd() - 0.5) * 2 * GRAVEL.jitter).addScaledVector(perp, side + (rnd() - 0.5) * 2 * GRAVEL.jitter)
        d.position.set(p.x, DECK_Y - 0.0005, p.z)
        d.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3)
        d.scale.set(0.8 + rnd() * 0.6, 0.45, 0.8 + rnd() * 0.6)
        d.updateMatrix()
        stones.setMatrixAt(i++, d.matrix)
      }
    }
    stones.name = 'gravel-field'
    props(stones, false, true)
    shell.add(stones)
    // kerb stones: the band's two edges, laid flat, half-overlapping
    const kerbs = new T.InstancedMesh(toyBlock(0.026, 0.007, 0.02, 0.004, 0.002), stone(GRAVEL.kerbHex, 0.12), 2 * (Math.floor(len / 0.05) + 1))
    let j = 0
    for (const edge of [-1, 1]) {
      for (let k = 0; k <= Math.floor(len / 0.05); k++) {
        const p = a.clone().addScaledVector(dir, k * 0.05).addScaledVector(perp, edge * (GRAVEL.width / 2 + 0.011))
        d.position.set(p.x, DECK_Y - 0.0002, p.z)
        d.rotation.set(0, Math.atan2(dir.z, dir.x) + (rnd() - 0.5) * 0.25, 0)
        d.scale.setScalar(1)
        d.updateMatrix()
        kerbs.setMatrixAt(j++, d.matrix)
      }
    }
    kerbs.name = 'gravel-kerbs'
    props(kerbs, true, true)
    shell.add(kerbs)
  }

  // The hedge: the garden's wall. One mass, instanced clumps, a few blooms
  // in the accent — the world stops here and the sky stays flat above it.
  {
    const g = new T.Group()
    g.name = 'hedge'
    const h = HEDGE.height
    const mass = new T.Mesh(toyBlock(3.6, h, 0.3, 0.06, 0.03, 6), fabric(tokens, HEDGE.leaf, { ...fillOver(), toy: 0.3, grain: 0.3, grainScale: 0.2 }))
    mass.position.y = h / 2 - 0.03
    props(mass)
    g.add(mass)
    const d = new T.Object3D()
    const rnd = makeRng(HEDGE.seed)
    const clumps = new T.InstancedMesh(new T.IcosahedronGeometry(0.085, 1), fabric(tokens, lighten(HEDGE.leaf, 0.12), { ...fillOver(), toy: 0.25 }), HEDGE.clumps)
    for (let i = 0; i < HEDGE.clumps; i++) {
      d.position.set((rnd() - 0.5) * 3.4, h - 0.1 + (rnd() - 0.5) * (h - 0.06), 0.05 + rnd() * 0.1)
      d.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3)
      d.scale.setScalar(0.35 + rnd() * 0.55)
      d.updateMatrix()
      clumps.setMatrixAt(i, d.matrix)
    }
    props(clumps)
    g.add(clumps)
    const blooms = new T.InstancedMesh(new T.SphereGeometry(0.012, 10, 8), fabric(tokens, HEDGE.flower, { ...fillOver(), rim: { strength: 0.5, size: 0.6 } }), HEDGE.blooms)
    for (let i = 0; i < HEDGE.blooms; i++) {
      d.position.set((rnd() - 0.5) * 3.0, h - 0.08 + rnd() * 0.08, 0.14)
      d.rotation.set(0, 0, 0)
      d.scale.setScalar(0.7 + rnd() * 0.6)
      d.updateMatrix()
      blooms.setMatrixAt(i, d.matrix)
    }
    props(blooms)
    g.add(blooms)
    g.position.set(0, 0, HEDGE.z)
    shell.add(g)
  }

  // The sun AS GEOMETRY: a flat disc on the key's bearing, just above the
  // hedge line — licensed only because a ~13° sun sits inside the canonical
  // frame (the bible rule, flagged for the Documentarian). Never-list clean:
  // no flare, no glow, one flat diffuse-lifted color.
  const sunDisc = new T.Mesh(
    new T.CircleGeometry(SUN.disc.radius, 40),
    paintedWood(tokens, mixHex('#FFF7E0', SUN.color, 0.5), { ...fillOver(), grain: 0, diffuseStrength: 1.7 }),
  )
  sunDisc.name = 'sun-disc'
  sunDisc.position.set(...SUN.disc.pos)
  sunDisc.castShadow = false
  sunDisc.receiveShadow = false
  shell.add(sunDisc)

  // The snail mid-crossing, WITH its spiral (carry-forward 2): three
  // diminishing whorl rings on the shell, so the slow motorist reads as a
  // snail at 200 px and not a pink bead.
  {
    const g = new T.Group()
    g.name = 'snail'
    const body = new T.Mesh(toyBlock(0.034, 0.008, 0.015, 0.003, 0.002), fabric(tokens, '#DCC9AE', { ...fillOver(), rim: { strength: 0.5, size: 0.8 } }))
    props(body)
    g.add(body)
    const shellMat = ceramic(tokens, mixHex(tokens.ground, '#C9976A', 0.4), { ...fillOver(), toy: 0.5, specular: { size: 0.4, strength: 0.16 } })
    const wh = new T.Mesh(new T.SphereGeometry(0.0105, 16, 12), shellMat)
    wh.position.set(-0.005, 0.013, 0)
    wh.scale.set(1, 0.85, 1)
    props(wh)
    g.add(wh)
    const whorlMat = ceramic(tokens, mixHex(tokens.ground, '#8E6242', 0.6), { ...fillOver(), toy: 0.5 })
    for (const [r, tube] of [[0.0082, 0.0011], [0.0056, 0.001], [0.003, 0.0009]] as const) {
      const ring = new T.Mesh(new T.TorusGeometry(r, tube, 6, 18), whorlMat)
      ring.position.set(-0.005, 0.0202, 0)
      ring.rotation.x = -Math.PI / 2 + 0.35
      ring.scale.set(1, 1, 0.4)
      props(ring, false, false)
      g.add(ring)
    }
    const head = new T.Mesh(new T.SphereGeometry(0.0058, 12, 10), fabric(tokens, '#E4D3BA', fillOver()))
    head.position.set(0.017, 0.0065, 0)
    props(head)
    g.add(head)
    for (const pz of [-0.0025, 0.0025]) {
      const horn = new T.Mesh(new T.CylinderGeometry(0.001, 0.001, 0.009, 6), fabric(tokens, '#DCC9AE', fillOver()))
      horn.position.set(0.019, 0.013, pz)
      horn.rotation.z = -0.4
      props(horn, false, false)
      g.add(horn)
    }
    g.position.set(...SNAIL.position)
    g.rotation.y = SNAIL.yaw
    shell.add(g)
  }

  // one fallen petal in the dominant — the deck's own confetti
  {
    const petal = new T.Mesh(new T.SphereGeometry(0.012, 12, 8), fabric(tokens, tokens.dominant, { ...fillOver(), toy: 0.3 }))
    petal.name = 'fallen-petal'
    petal.position.set(...PETAL.position)
    petal.scale.set(1.4, 0.16, 0.9)
    petal.rotation.y = PETAL.yaw
    props(petal, false)
    shell.add(petal)
  }

  // ---- the dress (guard solids; world scale — SET_SCALE is 1) ------------
  const dress = new T.Group()
  dress.name = 'dress'
  dress.scale.setScalar(SET_SCALE)
  group.add(dress)

  const wood = (hex: string, grain = 0.45, grainScale = 0.5) => paintedWood(tokens, hex, { ...fillOver(), grain, grainScale })

  // The trellis palisade: the shadow-bar machine. Carry-forward 5: both
  // post feet carry stone pads, so the lattice is visibly standing on
  // something and its bars on the deck are visibly ITS.
  {
    const g = new T.Group()
    g.name = 'trellis'
    const { w, h } = TRELLIS
    const woodMat = wood('#BC9465')
    for (const px of [-w / 2, w / 2]) {
      const foot = new T.Mesh(new T.CylinderGeometry(0.032, 0.036, 0.012, 18), stone('#AFA391', 0.1))
      foot.name = 'trellis-foot'
      foot.position.set(px, 0.006, 0)
      props(foot)
      g.add(foot)
      const post = new T.Mesh(toyBlock(0.024, h, 0.024, 0.007, 0.003), woodMat)
      post.position.set(px, h / 2, 0)
      props(post)
      g.add(post)
    }
    for (const py of [h - 0.016, 0.04]) {
      const rail = new T.Mesh(new T.BoxGeometry(w + 0.02, 0.022, 0.016), woodMat)
      rail.position.set(0, py, 0)
      props(rail)
      g.add(rail)
    }
    for (let i = 1; i < 5; i++) {
      const lathe = new T.Mesh(new T.BoxGeometry(0.013, h - 0.02, 0.01), woodMat)
      lathe.position.set(-w / 2 + (i * w) / 5, h / 2, 0)
      props(lathe)
      g.add(lathe)
    }
    const diag = Math.hypot(w, h)
    for (const s of [1, -1]) {
      const lathe = new T.Mesh(new T.BoxGeometry(diag, 0.012, 0.01), woodMat)
      lathe.position.set(0, h / 2, -0.006)
      lathe.rotation.z = s * Math.atan2(h, w)
      props(lathe)
      g.add(lathe)
    }
    // the vine up one post, three blooms in the dominant
    const d = new T.Object3D()
    const rnd = makeRng(TRELLIS.seed)
    const leaves = new T.InstancedMesh(new T.IcosahedronGeometry(0.014, 0), fabric(tokens, TRELLIS.leaf, { ...fillOver(), toy: 0.3 }), 54)
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
    const flowers = new T.InstancedMesh(new T.SphereGeometry(0.014, 10, 8), fabric(tokens, TRELLIS.flower, { ...fillOver(), rim: { strength: 0.5, size: 0.5 } }), 4)
    for (let i = 0; i < 4; i++) {
      d.position.set(-w / 2 + 0.06 + rnd() * w * 0.3, 0.1 + rnd() * (h - 0.15), 0.024)
      d.rotation.set(0, 0, 0)
      d.scale.setScalar(0.8 + rnd() * 0.5)
      d.updateMatrix()
      flowers.setMatrixAt(i, d.matrix)
    }
    props(flowers)
    g.add(flowers)
    g.position.set(...TRELLIS.position)
    g.rotation.y = TRELLIS.yaw
    dress.add(g)
  }

  // The drain pipe: the tunnel mouth, yawed OFF the track axis AND off the
  // sun (the mouth normal faces away from the key, so the bore goes dark by
  // LIGHT — a sun-facing bore was the exploration's own named rule-break)
  // with its base colors raised out of the painted-black zone.
  {
    const g = new T.Group()
    g.name = 'drain-pipe'
    const r = PIPE.radius
    const len = PIPE.length
    const shellMat = stone('#C0B299', 0.12)
    shellMat.side = T.DoubleSide
    const barrelGeo = new T.CylinderGeometry(r, r, len, 32, 1, true)
    barrelGeo.rotateZ(Math.PI / 2)
    const barrel = new T.Mesh(barrelGeo, shellMat)
    barrel.position.y = r
    props(barrel)
    g.add(barrel)
    const innerGeo = new T.CylinderGeometry(r - 0.007, r - 0.007, len - 0.012, 26, 1, true)
    innerGeo.rotateZ(Math.PI / 2)
    const innerMat = fabric(tokens, PIPE.boreHex, { ...fillOver(), diffuseStrength: 0.45 })
    innerMat.side = T.DoubleSide
    const inner = new T.Mesh(innerGeo, innerMat)
    inner.position.y = r
    props(inner, false, false)
    g.add(inner)
    // bore stop, set back inside the mouth: a dark END wall whose dark is
    // the fill-only term (raised albedo, missing light), not black paint
    const stop = new T.Mesh(new T.CircleGeometry(r - 0.007, 26), fabric(tokens, PIPE.stopHex, { ...fillOver(), diffuseStrength: 0.32 }))
    stop.rotation.y = -Math.PI / 2
    stop.position.set(len / 2 - 0.075, r, 0)
    props(stop, false, false)
    g.add(stop)
    const lip = new T.Mesh(new T.TorusGeometry(r, 0.005, 10, 32), shellMat)
    lip.rotation.y = Math.PI / 2
    lip.position.set(-len / 2, r, 0)
    props(lip)
    g.add(lip)
    const strap = new T.Mesh(new T.TorusGeometry(r + 0.004, 0.0045, 8, 26), dieCastPaint(tokens, '#9A8F7C', { ...fillOver(), toy: 0.4 }))
    strap.name = 'pipe-strap'
    strap.rotation.y = Math.PI / 2
    strap.position.set(0, r, 0)
    props(strap)
    g.add(strap)
    for (const px of [len / 2 - 0.05, len / 2 - 0.005]) {
      const saddle = new T.Mesh(toyBlock(0.03, 0.028, 0.05, 0.007, 0.003), stone('#AFA391'))
      saddle.position.set(px, 0.014, 0)
      props(saddle)
      g.add(saddle)
    }
    // the downpipe that feeds it, with an elbow collar given its own class
    // read (carry-forward 4b: the collar was undifferentiated plastic)
    const riser = new T.Mesh(new T.CylinderGeometry(r * 0.42, r * 0.42, 0.2, 20), stone('#C6B9A2', 0.1))
    riser.position.set(-len / 2 + 0.1, r + 0.13, -0.005)
    props(riser)
    g.add(riser)
    const collar = new T.Mesh(new T.CylinderGeometry(r * 0.56, r * 0.5, 0.022, 20), dieCastPaint(tokens, '#9A8F7C', { ...fillOver(), toy: 0.4 }))
    collar.name = 'pipe-collar'
    collar.position.set(-len / 2 + 0.1, r + 0.042, -0.005)
    props(collar)
    g.add(collar)
    g.position.set(...PIPE.center)
    g.rotation.y = PIPE.yaw
    dress.add(g)
  }

  // The watering can, a monolith against the far slabs — galvanized with a
  // three-step ramp band, and a lit rim, because the hero camera has the sun
  // behind it and the RIM is the silhouette's face (carry-forward 4).
  {
    const g = new T.Group()
    g.name = 'watering-can'
    const metal = dieCastPaint(tokens, WATERING_CAN.hex, {
      ...fillOver(),
      toy: 0.55,
      ramp: { steps: [0.55, 0.95, 1.15], thresholds: [0.3, 0.72], softness: 0.05 },
      rim: { strength: 0.5, size: 0.2 },
    })
    const body = new T.Mesh(new T.CylinderGeometry(0.062, 0.056, 0.118, 30), metal)
    body.position.y = 0.061
    props(body)
    g.add(body)
    const rim = new T.Mesh(new T.TorusGeometry(0.062, 0.005, 8, 30), metal)
    rim.rotation.x = Math.PI / 2
    rim.position.y = 0.12
    props(rim)
    g.add(rim)
    const topHandle = new T.Mesh(new T.TorusGeometry(0.05, 0.005, 8, 26, Math.PI), metal)
    topHandle.position.y = 0.121
    props(topHandle)
    g.add(topHandle)
    const backHandle = new T.Mesh(new T.TorusGeometry(0.032, 0.005, 8, 18, Math.PI), metal)
    backHandle.rotation.z = Math.PI / 2
    backHandle.position.set(-0.06, 0.078, 0)
    props(backHandle)
    g.add(backHandle)
    const spout = new T.Mesh(
      new T.TubeGeometry(
        new T.CatmullRomCurve3([
          new T.Vector3(0.05, 0.042, 0),
          new T.Vector3(0.104, 0.13, 0),
          new T.Vector3(0.162, 0.19, 0),
          new T.Vector3(0.226, 0.178, 0),
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
    const rose = new T.Mesh(new T.CylinderGeometry(0.021, 0.017, 0.013, 22), metal)
    rose.position.set(0.236, 0.176, 0)
    rose.rotation.z = -0.45
    props(rose)
    g.add(rose)
    g.position.set(...WATERING_CAN.position)
    g.rotation.y = WATERING_CAN.yaw
    g.scale.setScalar(WATERING_CAN.scale)
    dress.add(g)
  }

  // The gnome statue, seated in a shadow bar (the ratified B placement)
  {
    const g = new T.Group()
    g.name = 'gnome-statue'
    const base = new T.Mesh(new T.CylinderGeometry(0.032, 0.038, 0.018, 24), stone(mixHex(tokens.ground, '#B9AE9C', 0.6)))
    base.position.y = 0.009
    props(base)
    g.add(base)
    g.position.y = 0.018
    const coat = new T.Mesh(new T.CylinderGeometry(0.02, 0.029, 0.056, 22), fabric(tokens, mixHex(tokens.ground, '#5C6E86', 0.6), { ...fillOver(), rim: { strength: 0.4, size: 0.7 } }))
    coat.position.y = 0.028
    props(coat)
    g.add(coat)
    for (const px of [-0.012, 0.012]) {
      const boot = new T.Mesh(toyBlock(0.018, 0.011, 0.015, 0.004, 0.002), dieCastPaint(tokens, '#4A3527', { ...fillOver(), toy: 0.4 }))
      boot.position.set(px, 0.006, 0.012)
      props(boot)
      g.add(boot)
    }
    const head = new T.Mesh(new T.SphereGeometry(0.019, 18, 14), ceramic(tokens, '#E9C9A8', { ...fillOver(), specular: { size: 0.5, strength: 0.14 } }))
    head.position.y = 0.064
    props(head)
    g.add(head)
    const beard = new T.Mesh(new T.SphereGeometry(0.016, 16, 12), fabric(tokens, '#E4D8C2', { ...fillOver(), rim: { strength: 0.5, size: 0.8 } }))
    beard.position.set(0, 0.054, 0.014)
    beard.scale.set(0.9, 1.35, 0.75)
    props(beard)
    g.add(beard)
    const hat = new T.Mesh(new T.ConeGeometry(0.023, 0.06, 18), dieCastPaint(tokens, darken(tokens.accent, 0.2), { ...fillOver(), toy: 0.5 }))
    hat.position.y = 0.1
    hat.rotation.z = -0.12
    props(hat)
    g.add(hat)
    g.position.set(...GNOME.position)
    g.rotation.y = GNOME.yaw
    dress.add(g)
  }

  // The hose coil in the accent, coiled in a sun stripe
  {
    const g = new T.Group()
    g.name = 'hose-coil'
    const mat = trackPlastic(tokens, HOSE.hex, { ...fillOver(), toy: 0.35 })
    for (const [i, r] of [0.052, 0.076, 0.1].entries()) {
      const ring = new T.Mesh(new T.TorusGeometry(r, 0.0095, 10, 34), mat)
      ring.rotation.x = -Math.PI / 2
      ring.position.y = 0.01 + i * 0.006
      ring.rotation.z = i * 0.4
      props(ring)
      g.add(ring)
    }
    const nozzle = new T.Mesh(new T.CylinderGeometry(0.008, 0.011, 0.03, 14), dieCastPaint(tokens, '#B9AE97', { ...fillOver(), toy: 0.4 }))
    nozzle.position.set(0.09, 0.012, 0.03)
    nozzle.rotation.set(Math.PI / 2, 0, 0.6)
    props(nozzle)
    g.add(nozzle)
    g.position.set(...HOSE.position)
    dress.add(g)
  }

  // The terracotta pot — the one non-green mid-distance prop, and the host
  // of the wind suggestion: ONE seedling sprig leaning one way, static.
  {
    const g = new T.Group()
    g.name = 'terracotta-pot'
    const pts = [
      new T.Vector2(0.0, 0.0),
      new T.Vector2(0.031, 0.0),
      new T.Vector2(0.035, 0.004),
      new T.Vector2(0.05, 0.078),
      new T.Vector2(0.056, 0.082),
      new T.Vector2(0.056, 0.088),
      new T.Vector2(0.05, 0.088),
      new T.Vector2(0.045, 0.08),
      new T.Vector2(0.03, 0.008),
      new T.Vector2(0.0, 0.006),
    ]
    const mat = ceramic(tokens, POT.hex, { ...fillOver(), specular: { size: 0.5, strength: 0.12 }, toy: 0.2 })
    mat.side = T.DoubleSide
    const vessel = new T.Mesh(new T.LatheGeometry(pts, 32), mat)
    props(vessel)
    g.add(vessel)
    const soil = new T.Mesh(new T.CircleGeometry(0.044, 24), fabric(tokens, darken(PATIO.hex, 0.55), { ...fillOver(), toy: 0.4 }))
    soil.rotation.x = -Math.PI / 2
    soil.position.y = 0.078
    g.add(soil)
    // the sprig: one stem, two leaves, the whole wind story in one lean
    const sprig = new T.Group()
    sprig.name = 'leaning-sprig'
    const stem = new T.Mesh(new T.CylinderGeometry(0.0022, 0.0028, 0.075, 6), fabric(tokens, mixHex(POT.leaf, '#8C7A4A', 0.4), fillOver()))
    stem.position.y = 0.0375
    props(stem)
    sprig.add(stem)
    for (const [s, dir] of [[1, 1], [0.75, -1]] as const) {
      const leaf = new T.Mesh(new T.SphereGeometry(0.014 * s, 12, 8), fabric(tokens, POT.leaf, { ...fillOver(), toy: 0.3 }))
      leaf.position.set(0.012 * dir, 0.055 + 0.012 * s, 0)
      leaf.scale.set(1, 0.45, 1.5)
      leaf.rotation.y = dir > 0 ? 0.5 : -0.8
      props(leaf)
      sprig.add(leaf)
    }
    sprig.position.y = 0.078
    sprig.rotation.z = POT.lean
    sprig.rotation.y = 0.6
    g.add(sprig)
    g.position.set(...POT.position)
    g.rotation.y = POT.yaw
    dress.add(g)
  }

  // ---- sockets + hazards --------------------------------------------------
  const sockets: Record<string, GardenSetSocket> = {}
  for (const [name, f] of Object.entries(PIPE_SOCKET_FRAMES)) {
    sockets[name] = {
      pos: new T.Vector3(...f.pos),
      tangent: new T.Vector3(...f.tangent),
      up: new T.Vector3(...f.up),
    }
  }

  // Declare the SUN (the rig's warm key) to every ToonMaterial so dark
  // bands tint toward the SKY value, never blacken — see the header note.
  if (opts.rig) applyKeyLight(group, opts.rig)

  return {
    group,
    sockets,
    hazardZones: { ...HAZARDS },
    ground: DECK,
    staging: STAGING,
    sunDisc,
  }
}
