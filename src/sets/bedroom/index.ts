/**
 * The production bedroom set — the stage-4 set of Gravity Works, built to
 * the RATIFIED look: variant B (lamp-lit dusk hardwood), 13/13 at both
 * canonical cameras per
 * `docs/vault/Reference/Review 2026-10-08 Stage 4 bathroom+bedroom.md`,
 * migrated out of the throwaway exploration `src/dev/scenes/bedroom.ts`.
 *
 * `buildBedroomSet(THREE, opts)` returns `{ group, sockets, hazardZones,
 * floor, staging }` — the same SetInstance surface the kitchen exports and
 * the shell consumes (see `src/sets/index.ts`): solid boxes for the
 * placement guard come from the named props, the drawer bore carries the
 * named socket pair, the prop list is data + generators — no file, no mesh,
 * no texture; every prop is a material class from `src/render/materials.ts`
 * entered with the set's tokens (tinted-shadow discipline: the shade term
 * is the indigo `shadowTint`, never a black fill; the never-list holds).
 *
 * One deliberate deviation from the kitchen's "no lights" contract, demanded
 * by the AD's caveat that no single prop may carry the frame: the lamp is a
 * PRACTICAL — a real `THREE.PointLight` mounted at `LAMP.bulb`, inside the
 * shade, so the warm pool is lit, not painted. The rig's shadow-casting key
 * sits at the same origin in the render scene (one light direction explains
 * every shadow, art bible §Light); the point light adds falloff warmth near
 * the shade and nothing beyond `LAMP.reach` (the toon shader's punctual gate
 * in `src/render/toon-material.ts` guarantees it adds no key-strength tint
 * wash — directional-only scenes are byte-identical).
 *
 * The three mid-distance story props that keep the cable snake from
 * carrying the frame alone (AD caveat, engineered):
 * 1. the book pyramid, with visible cream page cores (paper class, grain 0)
 *    between tight-packed cover blocks — the blob read and its grazing
 *    dither fringe are gone;
 * 2. the lamp practical, lighting the scene as a point light at dusk;
 * 3. the half-open dresser drawer, hung a credit card (`CARD_GAP`) under
 *    its rail line — a portal-dark slit and a bored cabinet: the future
 *    tunnel affordance, as sockets (`drawer.in` / `drawer.out`).
 *
 * The set contains no cars and no track: the rig is `src/render/lighting.ts`
 * (plus the lamp practical), the cars belong to the car system, and the
 * staging scene `src/dev/scenes/bedroom-set.ts` is where they meet.
 */

import * as THREE_NS from 'three'
import { ceramic, dieCastPaint, fabric, paintedWood } from '../../render/materials.ts'
import { toyBlock } from '../../render/geometry.ts'
import { applyKeyLight, fillFromRig } from '../../render/lighting.ts'
import type { LightingRig } from '../../render/lighting.ts'
import { SET_TOKENS, darken, lighten } from '../../render/tokens.ts'
import type { SetTokens } from '../../render/tokens.ts'
import {
  BED,
  BOOK_PYRAMID,
  CABLE,
  DRAWER_SOCKET_FRAMES,
  DRESSER,
  DESK,
  FLOOR,
  HAZARDS,
  HOMEWORK,
  LAMP,
  SEAMS,
  SET_SCALE,
  STAGING,
} from './data.ts'

export * from './data.ts'

export interface BedroomSetOptions {
  tokens?: SetTokens
  /** Lighting rig whose fill bands the materials ride (art bible §Light). */
  rig?: LightingRig
}

export interface BedroomSetSocket {
  pos: THREE_NS.Vector3
  tangent: THREE_NS.Vector3
  up: THREE_NS.Vector3
}

export interface BedroomSet {
  group: THREE_NS.Group
  /** Named prop sockets, world-space — the drawer bore pair. */
  sockets: Record<string, BedroomSetSocket>
  /** Variant B ratifies none; the field exists for the SetInstance surface. */
  hazardZones: Record<string, { id: string; kind: string; center: { x: number; y: number; z: number }; radius: number; gripFactor: number; source: string }>
  floor: typeof FLOOR
  staging: typeof STAGING
  /** The lamp practical — the set's one light (see the header note). */
  lampLight: THREE_NS.PointLight
}

/** Deterministic pseudo-random (fixed seed — the clock never moves). */
function makeRng(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

export function buildBedroomSet(T = THREE_NS, opts: BedroomSetOptions = {}): BedroomSet {
  const tokens = opts.tokens ?? SET_TOKENS.bedroom
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
  group.name = 'bedroom-set'

  // ---- the shell: floor, board seams, backdrop (never a guard solid —
  // it lives outside the `dress` group the guard collects from) ----------
  const shell = new T.Group()
  shell.name = 'shell'
  group.add(shell)

  // Hardwood at the LOW grain frequency the TA backlog names for big
  // surfaces — long lazy streaks; the floor is the set's only big grain
  // surface and every prop below keeps its grain finer or flat.
  const floor = new T.Mesh(
    new T.CircleGeometry(FLOOR.radius, 72),
    paintedWood(tokens, '#A8804F', { ...fillOver(), grain: 0.55, grainScale: 0.06 }),
  )
  floor.name = 'bedroom-floor'
  floor.rotation.x = -Math.PI / 2
  floor.receiveShadow = true
  shell.add(floor)

  // board seams: data strips, not a texture — the rhythm the car ticks over
  for (let i = 0; i < SEAMS.count; i++) {
    const seam = new T.Mesh(
      new T.BoxGeometry(2.8, 0.0015, 0.0035),
      paintedWood(tokens, darken('#A8804F', 0.28), { ...fillOver(), grain: 0 }),
    )
    seam.name = `board-seam-${i}`
    seam.position.set(0, 0.0008, (i - (SEAMS.count - 1) / 2) * SEAMS.spacing + SEAMS.offset)
    seam.receiveShadow = true
    shell.add(seam)
  }

  const wall = new T.Mesh(
    new T.PlaneGeometry(20, 4),
    paintedWood(tokens, darken(tokens.background, 0.22), { ...fillOver(), grain: 0.06, grainScale: 0.05, diffuseStrength: 0.85 }),
  )
  wall.name = 'back-wall'
  wall.position.set(0, 1.6, -0.6)
  wall.receiveShadow = true
  shell.add(wall)

  // ---- the dress (world scale; SET_SCALE is 1 — data is world-space) ------
  const dress = new T.Group()
  dress.name = 'dress'
  dress.scale.setScalar(SET_SCALE)
  group.add(dress)

  const wood = (hex: string, grain = 0.5, grainScale = 0.3) => paintedWood(tokens, hex, { ...fillOver(), grain, grainScale })
  const brass = dieCastPaint(tokens, '#C9A45E', { ...fillOver(), toy: 0.5, rim: { strength: 0.42, size: 0.15 } })

  // ---- the desk: the floating slab, paid for (AD material note) -----------
  const desk = new T.Group()
  desk.name = 'desk'
  {
    const top = new T.Mesh(toyBlock(DESK.top.size[0], DESK.top.size[1], DESK.top.size[2], 0.02, 0.006, 8), wood('#9A7549'))
    top.name = 'desk-top'
    top.position.set(DESK.top.center[0], DESK.topY - DESK.top.size[1], DESK.top.center[2])
    props(top)
    desk.add(top)
    const legH = DESK.topY - DESK.top.size[1]
    for (const [x, z] of DESK.legs) {
      const leg = new T.Mesh(toyBlock(0.045, legH, 0.045, 0.012, 0.005), wood('#8F6C42', 0.5, 0.5))
      leg.name = `desk-leg-${x}-${z}`
      leg.position.set(x, 0, z)
      props(leg)
      desk.add(leg)
    }
    // apron rails under the top — the support lines the AD's material note
    // asked the slab to carry
    for (const [ax, az, sx, sz] of [
      [DESK.top.center[0], DESK.top.center[2] - DESK.top.size[2] / 2 + 0.015, DESK.top.size[0] - 0.06, 0.02],
      [DESK.top.center[0], DESK.top.center[2] + DESK.top.size[2] / 2 - 0.015, DESK.top.size[0] - 0.06, 0.02],
    ] as const) {
      const rail = new T.Mesh(toyBlock(sx, 0.035, sz, 0.008, 0.003), wood('#8F6C42', 0.45, 0.4))
      rail.name = 'desk-apron'
      rail.position.set(ax, legH - 0.035 - 0.002, az)
      props(rail)
      desk.add(rail)
    }
  }
  dress.add(desk)

  // ---- the lamp practical: the set's one light, standing in it -------------
  const lamp = new T.Group()
  lamp.name = 'lamp'
  {
    const base = new T.Mesh(new T.CylinderGeometry(0.05, 0.058, 0.014, 28), brass)
    base.name = 'lamp-base'
    base.position.y = 0.007
    props(base)
    lamp.add(base)
    const pole = new T.Mesh(new T.CylinderGeometry(0.006, 0.006, 0.22, 12), brass)
    pole.name = 'lamp-pole'
    pole.position.y = 0.12
    props(pole)
    lamp.add(pole)
    const shade = new T.Mesh(new T.ConeGeometry(0.062, 0.055, 26, 1, true), ceramic(tokens, '#F0C878', { ...fillOver(), diffuseStrength: 1.15 }))
    shade.name = 'lamp-shade'
    shade.material.side = T.DoubleSide
    shade.position.y = LAMP.shadeY
    props(shade, false, false)
    lamp.add(shade)
    const glow = new T.Mesh(new T.CircleGeometry(0.034, 24), paintedWood(tokens, '#FFDFA0', { ...fillOver(), grain: 0, diffuseStrength: 1.35 }))
    glow.name = 'lamp-glow'
    glow.rotation.x = Math.PI / 2
    glow.position.y = LAMP.bulb[1] - LAMP.position[1] + 0.006
    lamp.add(glow)
    // the practical. No shadow map: the rig's key (same origin) owns every
    // cast shadow, and the punctual gate in the toon shader keeps this
    // light's falloff from re-adding the key's tint past its reach.
    const bulb = new T.PointLight('#FFC078', LAMP.intensity, LAMP.reach, LAMP.decay)
    bulb.name = 'lamp-practical'
    bulb.castShadow = false
    bulb.position.set(LAMP.bulb[0] - LAMP.position[0], LAMP.bulb[1], LAMP.bulb[2] - LAMP.position[2])
    lamp.add(bulb)
    lamp.userData.pointLight = bulb
    lamp.position.set(...LAMP.position)
    lamp.rotation.y = LAMP.yaw
  }
  dress.add(lamp)

  // ---- the dresser: half-open drawer, card-sized gap (future tunnel) -------
  const dresser = new T.Group()
  dresser.name = 'dresser'
  {
    const body = new T.Mesh(toyBlock(DRESSER.size.width, DRESSER.size.height, DRESSER.size.depth, 0.012, 0.004, 8), wood('#8F6C42', 0.5, 0.35))
    body.name = 'dresser-body'
    props(body)
    dresser.add(body)
    // the bore: the portal-dark interior of the opening (deep indigo felt —
    // tinted, never black: the never-list holds in the darkest slit)
    const felt = fabric(tokens, darken(tokens.dominant, 0.35), fillOver())
    const bore = new T.Mesh(new T.BoxGeometry(DRESSER.size.width - 0.02, DRESSER.gap + 0.03, 0.0012), felt)
    bore.name = 'dresser-bore'
    bore.position.set(0, DRESSER.boreY, DRESSER.size.depth / 2 + 0.0006)
    props(bore, false)
    dresser.add(bore)
    // the drawer: pulled half out and hung a full `CARD_GAP` below the top
    // of its opening — a card-sized daylight slit between the drawer's top
    // edge and the opening's upper jaw, portal-dark at dusk
    const drawer = new T.Group()
    drawer.name = 'dresser-drawer'
    const boxH = 0.03
    const box = new T.Mesh(toyBlock(DRESSER.size.width - 0.016, boxH, DRESSER.size.depth - 0.03, 0.006, 0.002, 6), wood('#A8804F', 0.45, 0.5))
    box.name = 'drawer-box'
    props(box)
    drawer.add(box)
    const front = new T.Mesh(toyBlock(DRESSER.size.width - 0.004, boxH + 0.006, 0.012, 0.008, 0.003, 6), wood('#9A7549', 0.45, 0.4))
    front.name = 'drawer-front'
    front.position.set(0, 0, (DRESSER.size.depth - 0.03) / 2 + 0.004)
    props(front)
    drawer.add(front)
    const pull = new T.Mesh(new T.SphereGeometry(0.006, 12, 8), brass)
    pull.name = 'drawer-pull'
    pull.position.set(0, boxH / 2, (DRESSER.size.depth - 0.03) / 2 + 0.011)
    props(pull)
    drawer.add(pull)
    // hung: drawer top edge sits one card below the opening's top jaw
    drawer.position.set(0, DRESSER.boreY + (DRESSER.gap + 0.03) / 2 - DRESSER.gap - boxH, DRESSER.pull / 2)
    dresser.add(drawer)
    // the rail the drawer slides on, spanning the opening's upper jaw
    const rail = new T.Mesh(new T.BoxGeometry(DRESSER.size.width - 0.02, 0.004, DRESSER.size.depth - 0.02), wood('#7A5A38', 0.3, 0.5))
    rail.name = 'drawer-rail'
    rail.position.set(0, DRESSER.boreY + (DRESSER.gap + 0.03) / 2 + 0.002, 0.004)
    props(rail, false)
    dresser.add(rail)
  }
  dresser.position.set(...DRESSER.position)
  dresser.rotation.y = DRESSER.yaw
  dress.add(dresser)

  // ---- the book pyramid: a stack of BOOKS, not a voxel blob ----------------
  // The AD's material demerit named two failures: the blob silhouette and
  // the dither fringe on its white volumes. Fix, per book: a cream PAPER
  // CORE (flat, grain 0 — the fringe needs grazing grain and the paper
  // class carries none) inset inside a slightly larger cover block, rows
  // packed to a 2 mm page seam. The silhouette reads cover/page/cover/page
  // at 200 px, which is exactly what a pyramid of picture books is.
  const pyramid = new T.Group()
  pyramid.name = 'book-pyramid'
  {
    const { foot, height: bh, depthRatio } = BOOK_PYRAMID.book
    const depth = foot * depthRatio
    const pageMat = paintedWood(tokens, '#F2EAD6', { ...fillOver(), grain: 0 })
    const rnd = makeRng(BOOK_PYRAMID.seed)
    let y = 0
    for (let k = 0; k < BOOK_PYRAMID.base; k++) {
      const n = BOOK_PYRAMID.base - k
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          const b = new T.Group()
          b.name = `pyramid-book-${k}-${i}-${j}`
          const cover = new T.Mesh(toyBlock(foot, bh, depth, 0.004, 0.0015), wood(BOOK_PYRAMID.palette[(k + i + j) % BOOK_PYRAMID.palette.length]!, 0.25, 0.6))
          cover.name = 'book-cover'
          props(cover)
          b.add(cover)
          // pages OUTSIDE the cover silhouette (a sharp box inside a beveled
          // toyBlock pokes its corners through the rounded flanks — the
          // checkerboard-cube misread): the cream plate stands 1.5 mm proud
          // all round and sits a hair under the cover height, so every book
          // reads cover-face + page-edge, which is what a picture book is
          const pages = new T.Mesh(new T.BoxGeometry(foot + 0.003, bh - 0.004, depth + 0.003), pageMat)
          pages.name = 'book-pages'
          pages.position.y = bh / 2 - 0.001
          props(pages)
          b.add(pages)
          b.position.set((i - (n - 1) / 2) * foot * 1.05, y, (j - (n - 1) / 2) * depth * 1.05)
          b.rotation.y = (rnd() - 0.5) * 0.09
          pyramid.add(b)
        }
      }
      y += bh
    }
  }
  dress.add(pyramid)

  // one leaning book — the ramp the pyramid always offers the track (the
  // exploration's pose, migrated unchanged: high end on the second tier,
  // low end welded to the deck)
  const rampBook = new T.Mesh(toyBlock(0.16, 0.015, 0.115, 0.004, 0.0015), wood('#C4B493', 0.15, 0.5))
  rampBook.name = 'pyramid-ramp-book'
  rampBook.rotation.order = 'YXZ'
  rampBook.position.set(-0.145, 0.022, 0.045)
  rampBook.rotation.set(0.33, 1.69, 0)
  props(rampBook)
  dress.add(rampBook)
  pyramid.position.set(...BOOK_PYRAMID.position)
  pyramid.rotation.y = BOOK_PYRAMID.yaw
  dress.add(pyramid)

  // ---- the cable snake, sitting up and facing the track (A's port) ----------
  const cable = new T.Group()
  cable.name = 'cable-snake'
  {
    const curve = new T.CatmullRomCurve3(CABLE.points.map(([x, y, z]) => new T.Vector3(x, y, z)))
    const cord = new T.Mesh(
      new T.TubeGeometry(curve, 72, 0.0075, 10, false),
      fabric(tokens, '#EFEAE2', { ...fillOver(), rim: { strength: 0.55, size: 0.85, color: '#FFF1DA' } }),
    )
    cord.name = 'cable-cord'
    props(cord)
    cable.add(cord)
    const p = curve.getPointAt(1)
    const tan = curve.getTangentAt(1)
    const head = new T.Mesh(toyBlock(0.026, 0.011, 0.013, 0.004), dieCastPaint(tokens, '#CFC9BE', { ...fillOver(), toy: 0.4 }))
    head.name = 'cable-head'
    head.position.copy(p).addScaledVector(tan, 0.014)
    head.lookAt(p.clone().add(tan))
    props(head)
    cable.add(head)
  }
  dress.add(cable)

  // ---- the bed foot: the anchor, with variant C's spring ask re-homed -------
  // AD: the bed-spring mechanic survives independently of withdrawn variant
  // C — production homes it here as a mattress edge over a box skirt, a
  // dark slat gap, and two brass coils peeking at the foot. A level can
  // later harvest the hinge; the set only has to SHOW it.
  const bed = new T.Group()
  bed.name = 'bed-foot'
  {
    const rail = new T.Mesh(toyBlock(0.85, 0.13, 0.045, 0.02, 0.008), wood('#9A7549'))
    rail.name = 'footboard-rail'
    rail.position.y = 0.15
    props(rail)
    bed.add(rail)
    for (const px of [-0.38, 0.38]) {
      const post = new T.Mesh(toyBlock(0.045, 0.22, 0.045, 0.012, 0.005), wood('#8F6C42', 0.5, 0.5))
      post.name = 'footboard-post'
      post.position.set(px, 0.11, 0)
      props(post)
      bed.add(post)
    }
    const skirt = new T.Mesh(toyBlock(0.8, 0.1, 0.46, 0.012, 0.004, 6), fabric(tokens, '#565B9E', fillOver()))
    skirt.name = 'bed-skirt'
    skirt.position.set(0, 0, -0.25)
    props(skirt)
    bed.add(skirt)
    const slat = new T.Mesh(new T.BoxGeometry(0.74, 0.012, 0.4), fabric(tokens, darken(tokens.dominant, 0.35), fillOver()))
    slat.name = 'bed-slat-gap'
    slat.position.set(0, 0.106, -0.25)
    props(slat, false)
    bed.add(slat)
    const mattress = new T.Mesh(toyBlock(0.78, 0.055, 0.44, 0.03, 0.012, 6), fabric(tokens, '#CDBDD4', { ...fillOver(), rim: { strength: 0.4, size: 0.7 } }))
    mattress.name = 'mattress-edge'
    mattress.position.set(0, 0.112, -0.25)
    props(mattress)
    bed.add(mattress)
    for (const cx of [-0.2, 0.2]) {
      const coil = new T.Mesh(new T.TorusGeometry(0.018, 0.0035, 8, 20), brass)
      coil.name = 'bed-spring'
      coil.position.set(cx, 0.106, -0.045)
      coil.rotation.x = Math.PI / 2
      props(coil)
      bed.add(coil)
    }
  }
  bed.position.set(...BED.position)
  bed.rotation.y = BED.yaw
  dress.add(bed)

  // ---- the homework, abandoned mid-sentence: lived-in, INSIDE the band -----
  const homework = new T.Group()
  homework.name = 'homework'
  {
    const notebook = new T.Mesh(new T.BoxGeometry(0.12, 0.004, 0.15), paintedWood(tokens, '#DDD2BA', { ...fillOver(), grain: 0.08 }))
    notebook.name = 'notebook'
    notebook.position.set(HOMEWORK.notebook.position[0], HOMEWORK.notebook.position[1], HOMEWORK.notebook.position[2])
    notebook.rotation.y = HOMEWORK.notebook.yaw
    notebook.receiveShadow = true
    homework.add(notebook)
    const pencil = new T.Mesh(new T.CylinderGeometry(0.005, 0.005, 0.09, 6), paintedWood(tokens, '#EFC23A', { ...fillOver(), grain: 0.3 }))
    pencil.name = 'pencil'
    pencil.position.set(...HOMEWORK.pencil.position)
    pencil.rotation.set(Math.PI / 2, 0, 0.9)
    props(pencil)
    homework.add(pencil)
  }
  dress.add(homework)

  // a lost toy block by the pyramid — small, cheap, second lived-in beat
  const block = new T.Mesh(toyBlock(0.02, 0.02, 0.02, 0.004), dieCastPaint(tokens, lighten(tokens.accent, 0.05), { ...fillOver(), toy: 0.5 }))
  block.name = 'lost-toy-block'
  block.position.set(0.02, 0, 0.12)
  block.rotation.y = 0.7
  props(block)
  dress.add(block)

  // ---- sockets + hazards ----------------------------------------------------
  const sockets: Record<string, BedroomSetSocket> = {}
  for (const [name, f] of Object.entries(DRAWER_SOCKET_FRAMES)) {
    sockets[name] = {
      pos: new T.Vector3(...f.pos),
      tangent: new T.Vector3(...f.tangent),
      up: new T.Vector3(...f.up),
    }
  }

  // declare the key to every ToonMaterial so dark bands tint, not blacken
  if (opts.rig) applyKeyLight(group, opts.rig)

  return {
    group,
    sockets,
    hazardZones: { ...HAZARDS },
    floor: FLOOR,
    staging: STAGING,
    lampLight: lamp.userData.pointLight as THREE_NS.PointLight,
  }
}
