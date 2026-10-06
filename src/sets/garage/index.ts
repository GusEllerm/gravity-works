/**
 * The production garage set — the stage-4 set of Gravity Works, built to the
 * RATIFIED look: variant C (epoxy sparkle, door-gap sunblade, bike-wheel
 * tunnel), 12/13 at both exploration cameras per
 * `docs/vault/Reference/Review 2026-10-08 Stage 4 garage.md`, migrated out
 * of the throwaway exploration `src/dev/scenes/garage.ts` (garage-c) as a
 * MINIMAL VERBATIM port by the Environment Artist (the bathroom pattern:
 * dev-scene geometry line-for-line, tokens at registry level, INDOOR
 * lighting regime — not the garden's sun/sky substitution).
 *
 * `buildGarageSet(THREE, opts)` returns the same SetInstance surface the
 * kitchen, bedroom and bathroom export: `{ group, sockets, hazardZones,
 * floor, staging }`. Solid boxes for the placement guard come from the
 * named props under `dress`; the slab/ground/wall surfaces live under
 * `shell` and are never solids; the stain films live under
 * `wet-patch-films` and are never solids (the `src/sets/index.ts`
 * §SetInstance naming convention).
 *
 * VERBATIM means: every prop here is the dev C-branch mesh with the dev
 * pose, except the THREE named data-level moves of the AD's carry-forwards
 * (each documented at its data row in ./data.ts): the BULB hang moved and
 * its bounce disc enlarged (note 1); the BLADE gained a feather underlay
 * and a bridge segment and its run took a notch less chroma (note 2); the
 * STAIN film's perimeter softened and its fill lifted gently (note 3).
 * Everything that earned the ratified histogram — the flake confinement,
 * the wire dims, the dropped bench, the capped tunnel, the single steel
 * tool cast aside, the shade-deep fill — is ported unchanged.
 *
 * The prop list is data + generators — every prop is a material class from
 * `src/render/materials.ts` entered with the set's tokens (tinted-shadow
 * discipline: the shade term is the deep olive `shadowTint`, never a black
 * fill; the never-list holds — C's darks are the darkest AND the tinted-est
 * in the house). The class ramps are the CLASSES' — this file passes
 * per-material tunes only. The set contains no lights, no cars and no
 * track: the rig is `src/render/lighting.ts` (pass the `KEYLIGHT` row from
 * ./data.ts as its options), the cars belong to the car system, and the
 * staging scene (`src/dev/scenes/garage-set.ts`) is where they meet.
 */
import * as THREE_NS from 'three'
import { ceramic, dieCastPaint, fabric, paintedWood, trackPlastic } from '../../render/materials.ts'
import { toyBlock } from '../../render/geometry.ts'
import { stainDecal } from '../../render/film.ts'
import { applyKeyLight, fillFromRig } from '../../render/lighting.ts'
import type { LightingRig } from '../../render/lighting.ts'
import type { ToonMaterial, ToonMaterialParams } from '../../render/toon-material.ts'
import { darken } from '../../render/tokens.ts'
import type { SetTokens } from '../../render/tokens.ts'
import {
  BENCH_TOOL,
  BLADE,
  BLADE_A,
  BLADE_B,
  BULB,
  CAN,
  DOOR,
  FLAKES,
  FLOOR,
  GARAGE_TOKENS,
  GLINTS,
  HAZARDS,
  LOOSE_DRIVER,
  MATERIAL_TUNES,
  PROPS,
  SET_SCALE,
  SHELL,
  SOCKETS,
  STAIN,
  STAGING,
  SURFACES,
  TOOLBOX,
  TOOL_WALL,
  WHEEL,
  WORKBENCH,
} from './data.ts'

export * from './data.ts'

export interface GarageSetOptions {
  tokens?: SetTokens
  /** Lighting rig whose fill bands the materials ride (art bible §Light). */
  rig?: LightingRig
}

export interface GarageSetSocket {
  pos: THREE_NS.Vector3
  tangent: THREE_NS.Vector3
  up: THREE_NS.Vector3
}

export interface GarageSet {
  group: THREE_NS.Group
  /** Named prop sockets — variant C declares none (see `SOCKETS` in data). */
  sockets: Record<string, GarageSetSocket>
  /** Hazard zone data in the level `WetPatch` shape — the set ships none;
   *  the live zones are level data (kitchen04 convention, as bathroom). */
  hazardZones: Record<string, { id: string; kind: string; center: { x: number; y: number; z: number }; radius: number; gripFactor: number; source: string }>
  floor: typeof FLOOR
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

export function buildGarageSet(T = THREE_NS, opts: GarageSetOptions = {}): GarageSet {
  const tokens = opts.tokens ?? GARAGE_TOKENS
  const fill = opts.rig
    ? fillFromRig(opts.rig)
    : { fillHigh: tokens.fillHigh, fillLow: tokens.fillLow, shadowTint: tokens.shadowTint }
  const fillOver = () => ({ ...fill })
  // The dev C-branch `F` bag: the rig's fill bands plus the global
  // shadowDither 0 (round-2 fix 3's global half — MATERIAL_TUNES header).
  const F = { ...fillOver(), shadowDither: MATERIAL_TUNES.shadowDither }

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

  // ---- material factories (dev `mk(v, true)` verbatim, rig bands in) ------
  const steel = (o: Partial<ToonMaterialParams> = {}) =>
    dieCastPaint(tokens, SURFACES.steel, { toy: MATERIAL_TUNES.steelToy, rim: { strength: 1.3, size: 0.15 }, ...F, ...o })
  const wood = (hex: string, o: Partial<ToonMaterialParams> = {}) =>
    paintedWood(tokens, hex, { grain: MATERIAL_TUNES.woodGrain, grainScale: MATERIAL_TUNES.woodGrainScale, ...F, ...o })
  const paint = (hex: string, o: Partial<ToonMaterialParams> = {}) =>
    dieCastPaint(tokens, hex, { toy: MATERIAL_TUNES.paintToy, ...F, ...o })
  const clay = (hex: string, o: Partial<ToonMaterialParams> = {}) =>
    ceramic(tokens, hex, { ...F, ...o })
  const cloth = (hex: string, o: Partial<ToonMaterialParams> = {}) =>
    fabric(tokens, hex, { ...F, ...o })

  const group = new T.Group()
  group.name = 'garage-set'

  // ---- the shell: ground beyond the slab, the epoxy floor, the one wall
  // (never guard solids — they live outside the `dress` group) -------------
  const shell = new T.Group()
  shell.name = 'shell'
  group.add(shell)

  const ground = new T.Mesh(
    new T.CircleGeometry(SHELL.ground.radius, 72),
    wood(darken(tokens.ground, SHELL.ground.darken), { grain: SHELL.ground.diffuseGrain, grainScale: SHELL.ground.grainScale }),
  )
  ground.name = 'garage-ground'
  ground.rotation.x = -Math.PI / 2
  ground.receiveShadow = true
  shell.add(ground)

  const wall = new T.Mesh(
    new T.PlaneGeometry(20, 4),
    wood(SURFACES.wall, { grain: SHELL.wall.grain, grainScale: SHELL.wall.grainScale, diffuseStrength: SHELL.wall.diffuseStrength }),
  )
  wall.name = 'back-wall'
  wall.position.set(...SHELL.wall.position)
  wall.receiveShadow = true
  shell.add(wall)

  // ---- the dress (world scale; SET_SCALE is 1 — data is world-space) ------
  const dress = new T.Group()
  dress.name = 'dress'
  dress.scale.setScalar(SET_SCALE)
  group.add(dress)

  // ---- the epoxy slab + its confined flake layer (dev concreteSlab c) -----
  const slab = new T.Mesh(new T.PlaneGeometry(1.0, 1.0), clay(SURFACES.concrete, { specular: { ...SURFACES.slabSpecular } }))
  slab.name = 'epoxy-slab'
  slab.rotation.x = -Math.PI / 2
  slab.receiveShadow = true
  slab.castShadow = false
  shell.add(slab)
  {
    const d = new T.Object3D()
    const flake = new T.InstancedMesh(
      new T.CircleGeometry(FLAKES.radius, 5),
      paint(FLAKES.color, { toy: 0.4, diffuseStrength: FLAKES.diffuseStrength }),
      FLAKES.count,
    )
    flake.name = 'epoxy-flakes'
    const rnd = makeRng(FLAKES.seed)
    const dx = BLADE_B[0] - BLADE_A[0]
    const dz = BLADE_B[1] - BLADE_A[1]
    const len = Math.hypot(dx, dz)
    for (let i = 0; i < FLAKES.count; i++) {
      const t = FLAKES.tStart + rnd() * FLAKES.tSpan
      const off = (rnd() - 0.5) * FLAKES.lateral
      d.position.set(BLADE_A[0] + dx * t + (dz / len) * off, FLAKES.y, BLADE_A[1] + dz * t - (dx / len) * off)
      d.rotation.set(-Math.PI / 2, 0, rnd() * Math.PI * 2)
      d.updateMatrix()
      flake.setMatrixAt(i, d.matrix)
    }
    flake.castShadow = false
    flake.receiveShadow = true
    shell.add(flake)
  }

  // ---- the workbench — furniture at table height (dev workbench, shelf
  // false, topY 0.185: the studio's round-2 note 1, dropped into frame) -----
  {
    const g = new T.Group()
    g.name = 'workbench'
    const top = new T.Mesh(
      toyBlock(WORKBENCH.top.w, WORKBENCH.top.h, WORKBENCH.top.d, 0.008),
      wood(SURFACES.bench, { grain: 0.55, grainScale: 0.4 }),
    )
    top.position.y = WORKBENCH.topY
    props(top)
    g.add(top)
    const legH = WORKBENCH.topY - 0.015
    for (const [x, z] of WORKBENCH.legs) {
      const leg = new T.Mesh(new T.BoxGeometry(WORKBENCH.legSize, legH, WORKBENCH.legSize), wood(darken(SURFACES.bench, 0.12)))
      leg.position.set(x, legH / 2, z)
      props(leg)
      g.add(leg)
    }
    const rail = new T.Mesh(new T.BoxGeometry(0.46, 0.06, 0.014), wood(darken(SURFACES.bench, 0.06)))
    rail.position.set(0, WORKBENCH.rail.y, WORKBENCH.rail.z)
    props(rail)
    g.add(rail)
    g.position.set(...WORKBENCH.position)
    dress.add(g)

    // The ONE tool cast aside on the dropped top — the hand-sized object in
    // both rigs (studio round-2 note; must-not-lose clause).
    const benchTool = new T.Group()
    benchTool.name = 'bench-wrench'
    const shaft = new T.Mesh(new T.BoxGeometry(0.09, 0.005, 0.012), steel())
    props(shaft)
    benchTool.add(shaft)
    for (const sx of [-1, 1]) {
      const jaw = new T.Mesh(new T.BoxGeometry(0.016, 0.005, 0.007), steel())
      jaw.position.set(sx * 0.048, 0, 0)
      props(jaw)
      benchTool.add(jaw)
    }
    benchTool.position.set(...BENCH_TOOL.position)
    benchTool.rotation.y = BENCH_TOOL.yaw
    dress.add(benchTool)
  }

  // ---- the pegboard tool wall (AD-2's exhibit A: it lives above the band
  // and pays nothing; kept for set completeness; hung driver STEEL) ---------
  {
    const g = new T.Group()
    g.name = 'tool-wall'
    const panel = new T.Mesh(new T.BoxGeometry(0.36, 0.24, 0.012), wood(SURFACES.pegboard, { grain: 0.3, grainScale: 2 }))
    props(panel, false, true)
    g.add(panel)
    const d = new T.Object3D()
    const hole = new T.InstancedMesh(new T.CylinderGeometry(0.0032, 0.0032, 0.014, 8), wood(darken(SURFACES.bench, 0.35), { grain: 0 }), 45)
    let i = 0
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 9; c++) {
        d.position.set((c - 4) * 0.034, 0.09 - r * 0.022, 0.001)
        d.rotation.set(Math.PI / 2, 0, 0)
        d.updateMatrix()
        hole.setMatrixAt(i++, d.matrix)
      }
    }
    g.add(hole)
    const rail = new T.Mesh(new T.CylinderGeometry(0.004, 0.004, 0.33, 10), steel())
    rail.rotation.z = Math.PI / 2
    rail.position.set(0, 0.086, 0.012)
    props(rail)
    g.add(rail)

    // saw — disc blade + wooden handle
    const saw = new T.Group()
    const blade = new T.Mesh(new T.CylinderGeometry(0.034, 0.034, 0.0022, 26), steel())
    blade.rotation.x = Math.PI / 2
    props(blade)
    saw.add(blade)
    const grip = new T.Mesh(toyBlock(0.024, 0.04, 0.008, 0.006), wood('#A0512F'))
    grip.position.set(0.02, -0.028, 0)
    grip.rotation.z = -0.5
    props(grip)
    saw.add(grip)
    saw.position.set(-0.12, 0.02, 0.014)
    g.add(saw)

    // wrench — shaft + open jaw
    const wrench = new T.Group()
    const wshaft = new T.Mesh(new T.BoxGeometry(0.013, 0.095, 0.005), steel())
    props(wshaft)
    wrench.add(wshaft)
    for (const sx of [-1, 1]) {
      const jaw = new T.Mesh(new T.BoxGeometry(0.01, 0.018, 0.005), steel())
      jaw.position.set(sx * 0.011, 0.05, 0)
      props(jaw)
      wrench.add(jaw)
    }
    wrench.position.set(-0.04, 0.022, 0.014)
    g.add(wrench)

    // hammer
    const hammer = new T.Group()
    const handle = new T.Mesh(new T.BoxGeometry(0.01, 0.088, 0.008), wood(SURFACES.bench))
    props(handle)
    hammer.add(handle)
    const head = new T.Mesh(toyBlock(0.042, 0.014, 0.015, 0.004), steel())
    head.position.y = 0.047
    props(head)
    hammer.add(head)
    hammer.position.set(0.03, 0.018, 0.014)
    g.add(hammer)

    // screwdriver — the handle is STEEL in C (fix 1: the accent lives in
    // the focus band on the toolbox only)
    const driver = new T.Group()
    const dshaft = new T.Mesh(new T.BoxGeometry(0.007, 0.05, 0.007), steel())
    dshaft.position.y = -0.012
    props(dshaft)
    driver.add(dshaft)
    const dhandle = new T.Mesh(toyBlock(0.015, 0.038, 0.015, 0.006), paint(TOOL_WALL.driverHandle, { toy: 0.6 }))
    dhandle.position.y = 0.032
    props(dhandle)
    driver.add(dhandle)
    driver.position.set(0.1, 0.016, 0.014)
    g.add(driver)
    g.position.set(...TOOL_WALL.position)
    dress.add(g)
  }

  // ---- the bench-top can ---------------------------------------------------
  {
    const g = new T.Group()
    g.name = 'bench-can'
    const body = new T.Mesh(new T.CylinderGeometry(0.011, 0.011, 0.033, 18), paint(SURFACES.can, { toy: 0.55 }))
    body.position.y = 0.0165
    props(body)
    g.add(body)
    const top = new T.Mesh(new T.CylinderGeometry(0.011, 0.011, 0.002, 18), steel())
    top.position.y = 0.0335
    props(top)
    g.add(top)
    g.position.set(...CAN.position)
    dress.add(g)
  }

  // ---- the toolbox — the token red IN the band (fix 1), chrome dimmed so
  // the bail stops throwing a ≥240 dash over its own red ---------------------
  {
    const g = new T.Group()
    g.name = 'toolbox'
    const body = new T.Mesh(toyBlock(0.072, 0.045, 0.038, 0.007), paint(tokens.accent, { toy: TOOLBOX.paint.toy, specular: { ...TOOLBOX.paint.specular } }))
    body.position.y = 0.0225
    props(body)
    g.add(body)
    const lidLine = new T.Mesh(new T.BoxGeometry(0.07, 0.002, 0.036), cloth('#241B12', { diffuseStrength: 0.4 }))
    lidLine.position.y = 0.036
    g.add(lidLine)
    const handle = new T.Mesh(new T.TorusGeometry(0.016, 0.0022, 6, 20, Math.PI), steel())
    handle.position.y = 0.047
    props(handle)
    g.add(handle)
    for (const kid of g.children) {
      const m = (kid as THREE_NS.Mesh).material as ToonMaterial
      if (m?.uniforms?.uRimStrength) {
        m.uniforms.uRimStrength.value = Math.min(m.uniforms.uRimStrength.value as number, TOOLBOX.rimCap)
        m.uniforms.uSpecStrength.value = Math.min(m.uniforms.uSpecStrength.value as number, TOOLBOX.specCap)
      }
    }
    g.position.set(...TOOLBOX.position)
    dress.add(g)
  }

  // ---- the loose red-handled driver, laid on its side beside the straight --
  {
    const g = new T.Group()
    g.name = 'loose-driver'
    const shaft = new T.Mesh(new T.BoxGeometry(0.05, 0.006, 0.006), steel())
    shaft.position.x = 0.03
    props(shaft)
    g.add(shaft)
    const handle = new T.Mesh(toyBlock(0.03, 0.016, 0.016, 0.005), paint(tokens.accent, { toy: LOOSE_DRIVER.toy }))
    handle.position.x = -0.01
    props(handle)
    g.add(handle)
    for (const kid of g.children) {
      const m = (kid as THREE_NS.Mesh).material as ToonMaterial
      if (m?.uniforms?.uRimStrength) {
        m.uniforms.uRimStrength.value = Math.min(m.uniforms.uRimStrength.value as number, LOOSE_DRIVER.rimCap)
        m.uniforms.uSpecStrength.value = Math.min(m.uniforms.uSpecStrength.value as number, LOOSE_DRIVER.specCap)
      }
    }
    g.position.set(...LOOSE_DRIVER.position)
    g.rotation.y = LOOSE_DRIVER.yaw
    dress.add(g)
  }

  // ---- the roller door with the bright slit at its foot --------------------
  {
    const g = new T.Group()
    g.name = 'roller-door'
    const panel = new T.Mesh(
      new T.BoxGeometry(0.3, 0.37, 0.012),
      wood(SURFACES.doorPanel, { grain: 0.2, grainScale: 1.6, diffuseStrength: DOOR.panelDiffuse }),
    )
    panel.position.y = 0.188
    props(panel, false, true)
    g.add(panel)
    for (let i = 0; i < 3; i++) {
      const seam = new T.Mesh(new T.BoxGeometry(0.3, 0.0035, 0.014), wood(darken(SURFACES.bench, 0.1), { grain: 0, diffuseStrength: DOOR.panelDiffuse }))
      seam.position.set(0, 0.08 + i * 0.1, 0.001)
      g.add(seam)
    }
    const slit = new T.Mesh(
      new T.BoxGeometry(0.29, 0.005, 0.004),
      wood(SURFACES.doorSlit, { grain: 0, diffuseStrength: DOOR.slitDiffuse, specular: { strength: 0 } }),
    )
    slit.position.set(0, 0.004, 0.008)
    g.add(slit)
    g.position.set(...DOOR.position)
    dress.add(g)
  }

  // ---- the sun blade, as AD carry-forward note 2 asks: a RIBBON ----------
  // Four stacked strips along the SAME corridor axis (feather → run →
  // bridge → wash, lowest first). The feather softens the SIDES; the run's
  // color is a notch less chroma; the bridge kills the STEP at the seam.
  {
    const g = new T.Group()
    g.name = 'sun-blade'
    const at = (t: number): [number, number] => [BLADE_A[0] + (BLADE_B[0] - BLADE_A[0]) * t, BLADE_A[1] + (BLADE_B[1] - BLADE_A[1]) * t]
    const strip = (name: string, t0: number, t1: number, width: number, y: number, hex: string, diffuse: number): void => {
      const from = at(t0)
      const to = at(t1)
      const m = new T.Mesh(
        new T.PlaneGeometry(width, Math.hypot(to[0] - from[0], to[1] - from[1])),
        wood(hex, { grain: 0, diffuseStrength: diffuse, specular: { strength: 0 } }),
      )
      m.name = name
      m.rotation.x = -Math.PI / 2
      m.castShadow = false
      m.receiveShadow = false
      const holder = new T.Group()
      holder.position.set((from[0] + to[0]) / 2, y, (from[1] + to[1]) / 2)
      holder.lookAt(to[0], y, to[1])
      holder.add(m)
      g.add(holder)
    }
    strip('blade-feather', 0, 1, BLADE.featherWidth, BLADE.y.feather, BLADE.feather.color, BLADE.feather.diffuse)
    strip('blade-run', BLADE.run.from, BLADE.run.to, BLADE.width, BLADE.y.run, BLADE.run.color, BLADE.run.diffuse)
    strip('blade-bridge', BLADE.bridge.from, BLADE.bridge.to, BLADE.width, BLADE.y.bridge, BLADE.bridge.color, BLADE.bridge.diffuse)
    strip('blade-wash', BLADE.wash.from, BLADE.wash.to, BLADE.width, BLADE.y.wash, BLADE.wash.color, BLADE.wash.diffuse)
    dress.add(g)

    // the sparse glint quads, inside the corridor's sharp middle third only
    const gd = new T.Object3D()
    const glint = new T.InstancedMesh(
      new T.CircleGeometry(GLINTS.radius, 5),
      wood(GLINTS.color, { grain: 0, diffuseStrength: GLINTS.diffuseStrength, specular: { strength: 0 } }),
      GLINTS.count,
    )
    glint.name = 'blade-glints'
    const grnd = makeRng(GLINTS.seed)
    const gdx = BLADE_B[0] - BLADE_A[0]
    const gdz = BLADE_B[1] - BLADE_A[1]
    for (let i = 0; i < GLINTS.count; i++) {
      const gt = GLINTS.tStart + grnd() * GLINTS.tSpan
      gd.position.set(BLADE_A[0] + gdx * gt, GLINTS.y, BLADE_A[1] + gdz * gt)
      gd.rotation.set(-Math.PI / 2, 0, grnd() * Math.PI * 2)
      gd.updateMatrix()
      glint.setMatrixAt(i, gd.matrix)
    }
    glint.castShadow = false
    glint.receiveShadow = false
    dress.add(glint)
  }

  // ---- the hanging bulb PRACTICAL + its bounce disc (AD carry-forward 1:
  // the hang moved so the bulb clears the wheel's projected ring at BOTH
  // rigs, and the disc is enlarged — the practical must be SEEN) ------------
  {
    const g = new T.Group()
    g.name = 'hanging-bulb'
    const bulb = new T.Mesh(new T.SphereGeometry(0.013, 14, 12), clay(SURFACES.bulbDead, { toy: 0.3, diffuseStrength: 0.7 }))
    props(bulb, false, false)
    g.add(bulb)
    const cap = new T.Mesh(new T.CylinderGeometry(0.006, 0.007, 0.01, 12), steel())
    cap.position.y = 0.014
    props(cap)
    g.add(cap)
    const cord = new T.Mesh(new T.CylinderGeometry(0.0011, 0.0011, BULB.cordLen, 6), cloth(SURFACES.cord, {}))
    cord.position.y = 0.02 + BULB.cordLen / 2
    g.add(cord)
    g.position.set(...BULB.position)
    g.rotation.z = BULB.roll
    dress.add(g)

    const bounce = new T.Mesh(
      new T.CircleGeometry(BULB.bounce.radius, 26),
      wood(BULB.bounce.color, { grain: 0, diffuseStrength: BULB.bounce.diffuse, specular: { strength: BULB.bounce.specularStrength } }),
    )
    bounce.name = 'bulb-bounce-disc'
    bounce.rotation.x = -Math.PI / 2
    bounce.position.set(BULB.position[0], BULB.bounce.y, BULB.position[2])
    bounce.castShadow = false
    bounce.receiveShadow = true
    dress.add(bounce)
  }

  // ---- the bike-wheel TUNNEL — the goal line, stood up dead-centre on the
  // straight, with the shadowed back cap (the bucket/tunnel ticket paid) ----
  {
    const g = new T.Group()
    g.name = 'bike-wheel-tunnel'
    const R = WHEEL.radius
    const tire = new T.Mesh(new T.TorusGeometry(R, 0.013, 10, 44), cloth(SURFACES.tire, { rim: { strength: 0.3, size: 0.6 } }))
    props(tire)
    g.add(tire)
    const rim = new T.Mesh(new T.TorusGeometry(R * 0.9, 0.006, 8, 40), steel())
    props(rim)
    g.add(rim)
    for (let i = 0; i < 6; i++) {
      const spoke = new T.Mesh(new T.CylinderGeometry(0.0009, 0.0009, R * 1.76, 6), steel({ toy: 0.2 }))
      spoke.rotation.z = (i * Math.PI) / 6
      props(spoke)
      g.add(spoke)
    }
    const hub = new T.Mesh(new T.CylinderGeometry(0.014, 0.014, 0.016, 14), steel())
    hub.rotation.x = Math.PI / 2
    props(hub)
    g.add(hub)
    // the wire parts (tire rim + ring + 6 spokes = children 0..7) come down
    // off the ≥240 bar; the hub keeps its normal steel (round-2 note 3)
    for (const i of [0, 1, 2, 3, 4, 5, 6, 7]) {
      const m = (g.children[i] as THREE_NS.Mesh).material as ToonMaterial
      if (m.uniforms.uRimStrength) m.uniforms.uRimStrength.value = WHEEL.wireDim.rim
      if (m.uniforms.uSpecStrength) m.uniforms.uSpecStrength.value = WHEEL.wireDim.spec
      if (m.uniforms.uDiffuseStrength) m.uniforms.uDiffuseStrength.value = WHEEL.wireDim.diffuse
      if (m.uniforms.uColor) (m.uniforms.uColor.value as THREE_NS.Color).multiplyScalar(WHEEL.wireDim.colorScale)
    }
    g.position.set(...WHEEL.position)
    dress.add(g)

    // the dark shaft + end cap behind it
    const shaftG = new T.Group()
    shaftG.name = 'tunnel-shaft'
    const shaft = new T.Mesh(new T.CylinderGeometry(WHEEL.shaft.radius, WHEEL.shaft.radius, WHEEL.shaft.depth, 24, 1, true), cloth(SURFACES.tunnel, { diffuseStrength: 0.3 }))
    ;(shaft.material as ToonMaterial).side = T.DoubleSide
    shaft.rotation.x = Math.PI / 2
    props(shaft, false, false)
    shaftG.add(shaft)
    shaftG.position.set(...WHEEL.shaft.position)
    dress.add(shaftG)
    const cap = new T.Mesh(new T.CircleGeometry(WHEEL.cap.radius, 22), cloth(SURFACES.tunnelCap, { diffuseStrength: 0.1, rim: { strength: 0, size: 1 } }))
    cap.name = 'tunnel-cap'
    cap.position.set(...WHEEL.cap.position)
    cap.castShadow = false
    cap.receiveShadow = false
    dress.add(cap)
  }

  // ---- the oil stain: a FILM at the blade's dark edge (AD carry-forward
  // 3, take two: softer perimeter, streak-carrying gentle fill lift). The
  // group is named for the guard convention — films are never solids. ------
  {
    const films = new T.Group()
    films.name = 'wet-patch-films'
    const filmFill = new T.Color('#FFFFFF').multiplyScalar(STAIN.fillLift)
    const main = stainDecal(tokens, {
      kind: 'wetPatch',
      color: STAIN.filmTone,
      opacity: STAIN.opacity,
      size: STAIN.size,
      sheen: STAIN.sheen,
      lift: STAIN.lift,
      fillHigh: filmFill,
      fillLow: filmFill,
    })
    main.name = 'oil-film'
    main.position.set(STAIN.position[0], main.position.y, STAIN.position[1])
    films.add(main)
    for (const [i, drip] of STAIN.drips.entries()) {
      const d = stainDecal(tokens, {
        kind: 'wetPatch',
        color: STAIN.filmTone,
        opacity: drip.opacity,
        size: drip.size,
        sheen: STAIN.sheen,
        lift: STAIN.lift,
        fillHigh: filmFill,
        fillLow: filmFill,
      })
      d.name = `oil-drip-film-${i}`
      d.position.set(drip.position[0], d.position.y, drip.position[1])
      films.add(d)
    }
    dress.add(films)
  }

  // ---- the tipped bucket + lid, cardboard, rag, nail spill (dev poses) ----
  {
    const g = new T.Group()
    g.name = 'tipped-bucket'
    const shellMesh = new T.Mesh(
      new T.CylinderGeometry(0.047, 0.038, 0.068, 30, 1, true),
      paint(SURFACES.bucketTipped, { toy: 0.55, specular: { ...PROPS.bucket.paintSpec } }),
    )
    ;(shellMesh.material as ToonMaterial).side = T.DoubleSide
    shellMesh.position.y = 0.034
    props(shellMesh)
    g.add(shellMesh)
    const base = new T.Mesh(new T.CircleGeometry(0.038, 26), paint(SURFACES.bucketTipped, { toy: 0.5 }))
    base.rotation.x = -Math.PI / 2
    base.position.y = 0.004
    props(base)
    g.add(base)
    const rimRing = new T.Mesh(new T.TorusGeometry(0.047, 0.0038, 8, 30), steel())
    rimRing.rotation.x = Math.PI / 2
    rimRing.position.y = 0.068
    props(rimRing)
    g.add(rimRing)
    const bail = new T.Mesh(new T.TorusGeometry(0.044, 0.0022, 6, 24, Math.PI), steel({ toy: 0.2 }))
    bail.position.y = 0.066
    props(bail)
    g.add(bail)
    // the tipped shell's rim band comes down (round-2 note 3); upright
    // buckets elsewhere in the house keep the bright ring
    for (const kid of g.children) {
      const m = (kid as THREE_NS.Mesh).material as ToonMaterial
      if (m?.uniforms?.uRimStrength) m.uniforms.uRimStrength.value = Math.min(m.uniforms.uRimStrength.value as number, PROPS.bucket.rimCap)
    }
    g.rotation.z = PROPS.bucket.rollZ
    g.rotation.y = PROPS.bucket.yawY
    g.position.set(...PROPS.bucket.position)
    dress.add(g)

    const lid = new T.Mesh(new T.CircleGeometry(PROPS.lid.radius, 24), paint(SURFACES.bucketTipped, { toy: 0.5 }))
    lid.name = 'bucket-lid'
    lid.rotation.x = -Math.PI / 2
    lid.rotation.z = PROPS.lid.roll
    lid.position.set(...PROPS.lid.position)
    props(lid)
    dress.add(lid)

    // flattened cardboard (the mezzanine's future material)
    {
      const boxes = new T.Group()
      boxes.name = 'cardboard'
      const [l, h, w] = PROPS.cardboard.size
      const box = new T.Mesh(toyBlock(l, h, w, 0.004), wood(SURFACES.cardboard, { grain: 0.22, grainScale: 2.2, toy: 0.4 }))
      props(box)
      boxes.add(box)
      const fold = new T.Mesh(new T.BoxGeometry(l * 0.96, 0.004, w * 0.96), wood(SURFACES.cardboardFold, { grain: 0.2 }))
      fold.position.y = h + 0.001
      props(fold)
      boxes.add(fold)
      boxes.position.set(...PROPS.cardboard.position)
      boxes.rotation.y = PROPS.cardboard.yaw
      dress.add(boxes)
    }

    const ragMesh = new T.Mesh(new T.IcosahedronGeometry(0.018, 1), cloth(SURFACES.rag, {}))
    ragMesh.name = 'shop-rag'
    ragMesh.scale.y = 0.42
    props(ragMesh)
    ragMesh.position.set(...PROPS.rag.position)
    dress.add(ragMesh)

    // the nail spill — scattered hardware that stopped mirroring the sun
    {
      const g2 = new T.Group()
      g2.name = 'nail-spill'
      const d = new T.Object3D()
      const mesh = new T.InstancedMesh(new T.CylinderGeometry(0.0009, 0.0009, 0.02, 6), steel({ toy: 0.1 }), PROPS.nails.count)
      const rnd = makeRng(PROPS.nails.seed)
      for (let i = 0; i < PROPS.nails.count; i++) {
        d.position.set(PROPS.nails.center[0] + (rnd() - 0.5) * 0.1, 0.001, PROPS.nails.center[1] + (rnd() - 0.5) * 0.1)
        d.rotation.set(Math.PI / 2, 0, rnd() * Math.PI * 2, 'YXZ')
        d.updateMatrix()
        mesh.setMatrixAt(i, d.matrix)
      }
      props(mesh)
      mesh.traverse((o) => {
        const m = (o as THREE_NS.Mesh).material as ToonMaterial
        if (!m?.uniforms) return
        if (m.uniforms.uRimStrength) m.uniforms.uRimStrength.value = PROPS.nails.dim.rim
        if (m.uniforms.uSpecStrength) m.uniforms.uSpecStrength.value = PROPS.nails.dim.spec
        if (m.uniforms.uDiffuseStrength) m.uniforms.uDiffuseStrength.value = PROPS.nails.dim.diffuse
      })
      g2.add(mesh)
      dress.add(g2)
    }
  }

  // ---- sockets + hazards ---------------------------------------------------
  const sockets: Record<string, GarageSetSocket> = {}
  const frames: Record<string, { pos: readonly number[]; tangent: readonly number[]; up: readonly number[] }> = SOCKETS
  for (const [name, f] of Object.entries(frames)) {
    sockets[name] = {
      pos: new T.Vector3(...f.pos),
      tangent: new T.Vector3(...f.tangent),
      up: new T.Vector3(...f.up),
    }
  }

  // declare the key to every ToonMaterial so dark bands tint, not blacken
  if (opts.rig) applyKeyLight(group, opts.rig)

  return { group, sockets, hazardZones: { ...HAZARDS }, floor: FLOOR, staging: STAGING }
}

/** Re-export the staging-run track material factory the staging scene uses
 *  (dev C's dimmer-diffuse twin: at C's key the orange ramp tops at ≥240
 *  and its dithered AA stair ran the corridor's census tail — the track
 *  keeps its color and comes off the knee). */
export function stagingTrackPlastic(tokens: SetTokens, rig: LightingRig) {
  return trackPlastic(tokens, tokens.track, {
    ...fillFromRig(rig),
    toy: 0.2,
    specular: { size: 0.3, strength: 0.08 },
  })
}
