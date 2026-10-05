/**
 * The production bathroom set — the stage-4 set of Gravity Works, built to
 * the RATIFIED look: variant A (porcelain cathedral), 14/15 at both
 * canonical cameras per
 * `docs/vault/Reference/Review 2026-10-08 Stage 4 bathroom+bedroom.md`,
 * migrated out of the throwaway exploration `src/dev/scenes/bathroom.ts`
 * (bath-a) as a MINIMAL art port by the Level Designer alongside the
 * bathroom ladder (the studio had no idle Environment Artist for the port;
 * the friction that implies is logged in
 * `Sessions/2026-10-08 Stage 4 - bathroom ladder.md`).
 *
 * `buildBathroomSet(THREE, opts)` returns the same SetInstance surface the
 * kitchen and bedroom export: `{ group, sockets, hazardZones, floor,
 * staging }`. Solid boxes for the placement guard come from the named props
 * under `dress`; the floor/wall/tile surfaces live under `shell` and are
 * never solids; the wet-patch films live under `wet-patch-films` and are
 * never solids (the `src/sets/index.ts` §SetInstance naming convention).
 * The prop list is data + generators — every prop is a material class from
 * `src/render/materials.ts` entered with the set's tokens (tinted-shadow
 * discipline: the shade term is the deep aqua `shadowTint`, never a black
 * fill; the never-list holds — the drain's darks are tinted, fix 2).
 *
 * The class ramps are the CLASSES' (header note in `./data.ts`): this file
 * passes specular/fill/dither per-material tunes only, exactly like the
 * kitchen's bowl entry. The set contains no lights, no cars and no track:
 * the rig is `src/render/lighting.ts` (pass the `KEYLIGHT` row from
 * `./data.ts` as its options), the cars belong to the car system, and the
 * staging scene is where they meet for renders.
 */
import * as THREE_NS from 'three'
import { ceramic, dieCastPaint, fabric, liquid, paintedWood } from '../../render/materials.ts'
import { toyBlock } from '../../render/geometry.ts'
import { stainDecal } from '../../render/film.ts'
import { applyKeyLight, fillFromRig } from '../../render/lighting.ts'
import type { LightingRig } from '../../render/lighting.ts'
import { SET_TOKENS, darken } from '../../render/tokens.ts'
import type { SetTokens } from '../../render/tokens.ts'
import { PROP_CALLOUTS } from '../../ui/callouts.ts'
import {
  DRIPS,
  DRAIN,
  FLOOR,
  MATERIAL_TUNES,
  SOCKETS,
  HAZARDS,
  SOAPDISH,
  SET_SCALE,
  STAGING,
  SURFACES,
  TILES,
  TOOTHBRUSH,
  TOWELS,
  TUB,
} from './data.ts'

export * from './data.ts'

// The set's prop callouts, registered here the way `src/ui/callouts.ts`
// documents ("each set's prop module registers here"). The wet patch is
// THE lesson the kitchen era's playtester never found (Playtest G walled
// on kitchen04 for nine tries over what the puddle means); the bathroom
// ladder's rung 01 is authored around the same sentence, so the line goes
// on the record with the porcelain.
PROP_CALLOUTS['prop:wetPatch'] = 'Wet tile halves grip — put your line around it, not through it.'

export interface BathroomSetOptions {
  tokens?: SetTokens
  /** Lighting rig whose fill bands the materials ride (art bible §Light). */
  rig?: LightingRig
}

export interface BathroomSetSocket {
  pos: THREE_NS.Vector3
  tangent: THREE_NS.Vector3
  up: THREE_NS.Vector3
}

export interface BathroomSet {
  group: THREE_NS.Group
  /** Named prop sockets — variant A declares none (see `SOCKETS` in data). */
  sockets: Record<string, BathroomSetSocket>
  /** Hazard zone data in the level `WetPatch` shape — variant A ships none
   *  as set data; the live zones are level data (kitchen04 convention). */
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

export function buildBathroomSet(T = THREE_NS, opts: BathroomSetOptions = {}): BathroomSet {
  const tokens = opts.tokens ?? SET_TOKENS.bathroom
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
  group.name = 'bathroom-set'

  // ---- the shell: ground, tile floors, the one wall (never guard solids —
  // they live outside the `dress` group the guard collects from) ----------
  const shell = new T.Group()
  shell.name = 'shell'
  group.add(shell)

  const ground = new T.Mesh(
    new T.CircleGeometry(FLOOR.radius, 72),
    paintedWood(tokens, darken(tokens.ground, 0.08), { ...fillOver(), grain: 0.25, grainScale: 0.25, fillStrength: MATERIAL_TUNES.fillStrengthWood }),
  )
  ground.name = 'bathroom-ground'
  ground.rotation.x = -Math.PI / 2
  ground.receiveShadow = true
  shell.add(ground)

  const wall = new T.Mesh(
    new T.PlaneGeometry(20, 4),
    paintedWood(tokens, SURFACES.wall, { ...fillOver(), grain: 0.08, grainScale: 0.2, diffuseStrength: 0.9, fillStrength: MATERIAL_TUNES.fillStrengthWood }),
  )
  wall.name = 'back-wall'
  wall.position.set(0, 1.6, TILES.backWall.z)
  wall.receiveShadow = true
  shell.add(wall)

  /** Tile floor/wall: instanced squares over a grout plane, checker
   *  accents every third one (the ratified grid; the wall takes none). */
  function tiles(
    name: string,
    cfg: { n: number; size: number; accentEvery?: number; wall?: boolean },
  ): THREE_NS.Group {
    const isWall = cfg.wall ?? false
    const g = new T.Group()
    g.name = name
    const span = cfg.n * cfg.size
    const grout = new T.Mesh(
      new T.PlaneGeometry(span, span),
      paintedWood(tokens, SURFACES.grout, {
        ...fillOver(),
        grain: 0.12,
        grainScale: 0.3,
        diffuseStrength: SURFACES.groutDiffuse,
        fillStrength: MATERIAL_TUNES.fillStrengthWood,
      }),
    )
    if (!isWall) grout.rotation.x = -Math.PI / 2
    grout.receiveShadow = true
    g.add(grout)
    const geo = new T.BoxGeometry(cfg.size - 0.004, cfg.size - 0.004, 0.0025)
    if (!isWall) geo.rotateX(Math.PI / 2)
    const base = new T.InstancedMesh(
      geo,
      ceramic(tokens, SURFACES.tile, {
        ...fillOver(),
        specular: { ...MATERIAL_TUNES.tileSpecular },
        fillStrength: MATERIAL_TUNES.fillStrengthCeramic,
        shadowDither: 0,
      }),
      cfg.n * cfg.n,
    )
    base.castShadow = false
    base.receiveShadow = true
    const acc = new T.InstancedMesh(
      geo,
      ceramic(tokens, SURFACES.tileAccent, { ...fillOver(), fillStrength: MATERIAL_TUNES.fillStrengthCeramic, shadowDither: 0 }),
      cfg.n,
    )
    acc.receiveShadow = true
    const d = new T.Object3D()
    let bi = 0
    let ai = 0
    const every = cfg.accentEvery ?? 0
    for (let i = 0; i < cfg.n; i++) {
      for (let j = 0; j < cfg.n; j++) {
        const a = (i - (cfg.n - 1) / 2) * cfg.size
        const b = (j - (cfg.n - 1) / 2) * cfg.size
        if (isWall) d.position.set(a, b, 0.0015)
        else d.position.set(a, 0.0015, b)
        d.updateMatrix()
        base.setMatrixAt(bi++, d.matrix)
        if (every && i % every === 0 && j % every === 0 && ai < cfg.n) {
          if (isWall) d.position.z = 0.002
          else d.position.y = 0.0018
          d.updateMatrix()
          acc.setMatrixAt(ai++, d.matrix)
        }
        d.rotation.set(0, 0, 0)
      }
    }
    acc.count = ai
    g.add(base, acc)
    return g
  }

  const floorTiles = tiles('tile-floor', TILES.floor)
  floorTiles.position.y = TILES.floor.y
  shell.add(floorTiles)
  const wallTiles = tiles('tile-wall', { ...TILES.wall, wall: true })
  wallTiles.position.set(...TILES.wall.position)
  shell.add(wallTiles)

  // the window cue on the back wall: the brightest region, not blown (fix 1)
  {
    const win = new T.Group()
    win.name = 'window'
    const pane = new T.Mesh(
      new T.PlaneGeometry(0.2, 0.26),
      paintedWood(tokens, SURFACES.pane, { ...fillOver(), grain: 0, diffuseStrength: SURFACES.paneDiffuse, specular: { strength: 0 } }),
    )
    win.add(pane)
    const frameMat = paintedWood(tokens, '#F5EFE0', { ...fillOver(), grain: 0.15 })
    const bars: Array<[number, number, number, number]> = [
      [0.21, 0.014, 0, 0.13],
      [0.21, 0.014, 0, -0.13],
      [0.014, 0.27, -0.1, 0],
      [0.014, 0.27, 0.1, 0],
      [0.01, 0.26, 0, 0],
      [0.2, 0.01, 0, 0],
    ]
    for (const [w, h, x, y] of bars) {
      const bar = new T.Mesh(new T.BoxGeometry(w, h, 0.012), frameMat)
      bar.position.set(x, y, 0.006)
      props(bar, false, true)
      win.add(bar)
    }
    win.position.set(...TILES.window.position)
    shell.add(win)
  }

  // ---- the dress (world scale; SET_SCALE is 1 — data is world-space) ------
  const dress = new T.Group()
  dress.name = 'dress'
  dress.scale.setScalar(SET_SCALE)
  group.add(dress)

  const porcelain = () =>
    ceramic(tokens, SURFACES.porcelain, {
      ...fillOver(),
      specular: { ...MATERIAL_TUNES.porcelainSpecular },
      shadowTint: mixShadowTint(),
      fillStrength: MATERIAL_TUNES.fillStrengthCeramic,
      shadowDither: 0,
    })
  function mixShadowTint(): string {
    // the tub's own core shadow reads as a band, not a cream wash (the
    // exploration's shade blend of the set tint with the dominant)
    const a = new T.Color(fill.shadowTint)
    const b = new T.Color(tokens.dominant)
    return `#${a.lerp(b, 0.28).getHexString()}`
  }

  // ---- the bathtub — the anchor (straight wall, flat bottom) ---------------
  const tub = new T.Group()
  tub.name = 'bathtub'
  {
    const mat = porcelain()
    mat.side = T.DoubleSide
    const R = TUB.radius, H = TUB.height, w = TUB.wall
    const pts: THREE_NS.Vector2[] = [
      new THREE_NS.Vector2(0.0001, 0.004),
      new THREE_NS.Vector2(R * 0.9, 0.004),
      new THREE_NS.Vector2(R * 0.98, 0.007),
      new THREE_NS.Vector2(R * 0.98, H - 0.014),
      new THREE_NS.Vector2(R + 0.003, H + 0.001),
      new THREE_NS.Vector2(R - w * 0.3, H + w * 0.5),
      new THREE_NS.Vector2(R - w, H - 0.004),
      new THREE_NS.Vector2(R * 0.9, H - 0.016),
      new THREE_NS.Vector2(R * 0.9, 0.016),
      new THREE_NS.Vector2(0.0001, 0.014),
    ]
    const shellMesh = new T.Mesh(new T.LatheGeometry(pts, 52), mat)
    shellMesh.name = 'tub-shell'
    shellMesh.scale.z = TUB.zScale
    props(shellMesh)
    tub.add(shellMesh)
    // contact-darkening FILM — the lathe foot alone did not ground the tub
    // (named *film: grounding film is never a guard solid, the kitchen rule)
    const contact = new T.Mesh(
      new T.CircleGeometry(R * 1.22, 36),
      fabric(tokens, darken(fill.shadowTint, 0.45), { ...fillOver(), opacity: 0.55, diffuseStrength: 0.1, rim: { strength: 0, size: 1 } }),
    )
    contact.name = 'tub-contact-film'
    contact.rotation.x = -Math.PI / 2
    contact.scale.z = TUB.zScale
    contact.position.y = 0.0035
    contact.castShadow = false
    contact.receiveShadow = false
    tub.add(contact)
    // a rolled towel over the rim — someone's about to get in
    const roll = new T.Mesh(new T.CylinderGeometry(0.015, 0.015, 0.1, 18), fabric(tokens, tokens.accent, fillOver()))
    roll.name = 'tub-rim-towel'
    roll.rotation.z = Math.PI / 2
    roll.rotation.y = 0.06
    roll.position.set(...TUB.rimTowel.position)
    props(roll)
    tub.add(roll)
    // the pool with frozen ripple rings (stop-motion cadence, Concepts/Feel)
    const pool = new T.Mesh(
      new T.CylinderGeometry(R - 0.012, R - 0.02, 0.003, 44),
      liquid(tokens, mixWater(), { ...fillOver(), opacity: 0.8, liquid: 0.4 }),
    )
    pool.name = 'tub-water'
    pool.scale.z = TUB.zScale
    pool.position.y = H * TUB.waterLevel
    tub.add(pool)
    const waterHex = mixWater()
    function mixWater(): string {
      const a = new T.Color(tokens.dominant)
      return `#${a.lerp(new T.Color('#FFFFFF'), 0.45).getHexString()}`
    }
    const d = new T.Object3D()
    const rings = new T.InstancedMesh(
      new T.TorusGeometry(0.007, 0.0015, 6, 22),
      liquid(tokens, new T.Color(waterHex).lerp(new T.Color('#FFFFFF'), 0.5).getHexString(), { ...fillOver(), opacity: 0.7 }),
      5,
    )
    rings.name = 'tub-ripples'
    const rnd = makeRng(6404)
    for (let i = 0; i < 5; i++) {
      const a = rnd() * Math.PI * 2
      const r = 0.012 + rnd() * 0.05
      d.position.set(Math.cos(a) * r, H * TUB.waterLevel + 0.002, Math.sin(a) * r * TUB.zScale)
      d.rotation.set(-Math.PI / 2 + (rnd() - 0.5) * 0.3, 0, rnd() * 3)
      d.updateMatrix()
      rings.setMatrixAt(i, d.matrix)
    }
    tub.add(rings)
  }
  tub.position.set(...TUB.position)
  dress.add(tub)

  // the duck — floating IN the bath, the scale joke (terrain-height rubber)
  {
    const g = new T.Group()
    g.name = 'rubber-duck'
    const rubber = dieCastPaint(tokens, '#F4C84B', {
      ...fillOver(),
      toy: 0.6,
      rim: { strength: 0.35, size: 0.2 },
      specular: { size: 0.08, strength: 0.45, color: '#FFFDF6' },
    })
    const body = new T.Mesh(new T.SphereGeometry(0.05, 20, 14), rubber)
    body.scale.set(1.2, 0.88, 1)
    body.position.y = 0.044
    props(body)
    g.add(body)
    const head = new T.Mesh(new T.SphereGeometry(0.027, 16, 12), rubber)
    head.position.set(0.05, 0.078, 0)
    props(head)
    g.add(head)
    const beak = new T.Mesh(
      new T.ConeGeometry(0.011, 0.024, 8),
      dieCastPaint(tokens, '#E08A2E', { ...fillOver(), toy: 0.5, specular: { size: 0.08, strength: 0.5 } }),
    )
    beak.position.set(0.077, 0.076, 0)
    beak.rotation.z = -Math.PI / 2
    props(beak)
    g.add(beak)
    const eye = new T.Mesh(new T.SphereGeometry(0.0045, 10, 8), fabric(tokens, '#33231A', fillOver()))
    eye.position.set(0.061, 0.086, 0.015)
    g.add(eye)
    const tail = new T.Mesh(new T.ConeGeometry(0.014, 0.03, 8), rubber)
    tail.position.set(-0.068, 0.058, 0)
    tail.rotation.z = Math.PI / 2 + 0.5
    props(tail)
    g.add(tail)
    g.position.set(...TUB.duck.position)
    g.rotation.y = TUB.duck.yaw
    dress.add(g)
  }

  // the toothbrush — a felled redwood propped against the wall
  {
    const g = new T.Group()
    g.name = 'toothbrush'
    const handle = new T.Mesh(toyBlock(0.155, 0.009, 0.017, 0.006, 0.002), dieCastPaint(tokens, TOOTHBRUSH.hex, { ...fillOver(), toy: 0.45 }))
    props(handle)
    g.add(handle)
    const neck = new T.Mesh(toyBlock(0.045, 0.011, 0.015, 0.005, 0.002), dieCastPaint(tokens, TOOTHBRUSH.hex, { ...fillOver(), toy: 0.45 }))
    neck.position.set(0.086, 0.006, 0)
    neck.rotation.z = 0.22
    props(neck)
    g.add(neck)
    const bristles = new T.Mesh(toyBlock(0.04, 0.012, 0.014, 0.005, 0.002), fabric(tokens, '#F4EFE2', fillOver()))
    bristles.position.set(0.102, 0.017, 0)
    bristles.rotation.z = 0.22
    props(bristles)
    g.add(bristles)
    g.position.set(...TOOTHBRUSH.position)
    g.rotation.set(...TOOTHBRUSH.rotation)
    dress.add(g)
  }

  // the soap dish — shallow lathe saucer, pastel bar
  {
    const g = new T.Group()
    g.name = 'soap-dish'
    const mat = porcelain()
    mat.side = T.DoubleSide
    const pts = [
      new THREE_NS.Vector2(0.0, 0.004),
      new THREE_NS.Vector2(0.024, 0.004),
      new THREE_NS.Vector2(0.05, 0.009),
      new THREE_NS.Vector2(0.058, 0.016),
      new THREE_NS.Vector2(0.054, 0.016),
      new THREE_NS.Vector2(0.046, 0.01),
      new THREE_NS.Vector2(0.022, 0.006),
      new THREE_NS.Vector2(0.0, 0.006),
    ]
    const dish = new T.Mesh(new T.LatheGeometry(pts, 36), mat)
    dish.name = 'dish'
    props(dish)
    g.add(dish)
    const soap = new T.Mesh(toyBlock(0.042, 0.02, 0.032, 0.011, 0.004), ceramic(tokens, SOAPDISH.soapHex, { ...fillOver(), toy: 0.3 }))
    soap.name = 'soap'
    soap.position.set(0.002, 0.012, 0)
    soap.rotation.y = 0.3
    props(soap)
    g.add(soap)
    g.position.set(...SOAPDISH.position)
    dress.add(g)
  }

  // the folded towel stack (the documented position move — off the lane)
  {
    const g = new T.Group()
    g.name = 'towel-stack'
    const mat = fabric(tokens, tokens.dominant, fillOver())
    const w = TOWELS.width
    const f1 = new T.Mesh(toyBlock(w, 0.007, w * 0.62, 0.008, 0.002), mat)
    f1.position.y = 0.0035
    props(f1)
    g.add(f1)
    const f2 = new T.Mesh(toyBlock(w * 0.88, 0.006, w * 0.55, 0.008, 0.002), mat)
    f2.position.set(0.002, 0.0095, 0.001)
    f2.rotation.y = 0.18
    props(f2)
    g.add(f2)
    g.position.set(...TOWELS.position)
    g.rotation.y = TOWELS.yaw
    dress.add(g)
  }

  // the drain — the tunnel mouth: chrome ring, tinted shaft, grate bars
  {
    const g = new T.Group()
    g.name = 'drain'
    const chrome = dieCastPaint(tokens, '#C8CDD2', { ...fillOver(), rim: { strength: 1.4, size: 0.15 }, toy: 0.4 })
    const ring = new T.Mesh(new T.TorusGeometry(DRAIN.ringRadius, 0.005, 10, 32), chrome)
    ring.rotation.x = -Math.PI / 2
    ring.position.y = 0.004
    props(ring)
    g.add(ring)
    const shaft = new T.Mesh(
      new T.CylinderGeometry(0.02, 0.02, 0.07, 28, 1, true),
      fabric(tokens, SURFACES.drainShaft, { ...fillOver(), diffuseStrength: 0.4 }),
    )
    shaft.name = 'drain-shaft'
    shaft.material.side = T.DoubleSide
    shaft.position.y = -0.031
    g.add(shaft)
    const depth = new T.Mesh(new T.CircleGeometry(0.02, 24), fabric(tokens, SURFACES.drainDepth, { ...fillOver(), diffuseStrength: 0.2 }))
    depth.name = 'drain-depth'
    depth.rotation.x = -Math.PI / 2
    depth.position.y = -0.065
    g.add(depth)
    for (let i = -1; i <= 1; i++) {
      const bar = new T.Mesh(new T.BoxGeometry(0.04, 0.0035, 0.0045), chrome)
      bar.position.set(0, 0.005, i * 0.009)
      props(bar)
      g.add(bar)
    }
    g.position.set(...DRAIN.position)
    dress.add(g)
  }

  // the wet-patch FILMS — fix 3's pair, tile base tone + soft SDF edge +
  // Fresnel sheen, LIFTED ABOVE the tile tops (at the film default 0.6 mm
  // they hide inside the floor slab). Decorative at set space; the live
  // grip zones are level data (header; ask #6 lines the two up).
  {
    const films = new T.Group()
    films.name = 'wet-patch-films'
    const filmFill = new T.Color('#FFFFFF').multiplyScalar(DRIPS.fillLift)
    for (const [i, row] of DRIPS.rows.entries()) {
      const drip = stainDecal(tokens, {
        kind: 'wetPatch',
        color: DRIPS.color,
        opacity: DRIPS.opacity,
        size: row.size,
        sheen: DRIPS.sheen,
        lift: DRIPS.lift,
        fillHigh: filmFill,
        fillLow: filmFill,
      })
      drip.name = `wet-drip-film-${i}`
      drip.position.set(row.position[0], drip.position.y, row.position[1])
      films.add(drip)
    }
    dress.add(films)
  }

  // ---- sockets + hazards ----------------------------------------------------
  const sockets: Record<string, BathroomSetSocket> = {}
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
