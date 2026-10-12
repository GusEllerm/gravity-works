/**
 * SPIKE (fp-downhill, Lane A "the Downhill") — THE HOUSE FRAME.
 *
 * One pure table + layout used by THREE consumers on this spike branch:
 * `tools/spike-downhill.mjs` (headless THE NUMBER), `src/dev/scenes/downhill.ts`
 * (hardware-GL scene) and `tools/spike-downhill-gl.mjs`. Nothing here ships;
 * no campaign file is touched.
 *
 * Derivation (see the note): the campaign's y-statistics are FLAT — every
 * room's setPlacement rows and finish decks sit within ~0.06 m of y = −0.44
 * (all 30 rungs start at y ≈ −0.007 and finish ~0.43 m LOWER). So the data
 * says: each room is authored ~one internal drop TALL, and the ladder never
 * stacks rooms. The frame therefore canonises:
 *
 *   deck altitude(r) = (5 − rank) · STEP,  STEP = INTERNAL_DROP + dropH
 *
 * where INTERNAL_DROP is the measured median campaign internal descent
 * (startSocket y − finishDeckY over all 30 rungs + 6 sandboxes) and dropH is
 * the CONNECTOR's authored `drop` height — one kit-default drop (0.25 m)
 * between the deck that ends one room and the deck that starts the next.
 * porch = 0 (the floor of the world), garage top = the mezzanine launch.
 * Ranks follow the campaign prose ladder (garage bench → kitchen counter →
 * bedroom shelf → bathroom tile → garden paving → porch planks).
 */
import * as THREE from 'three';
import { PIECES } from '../../track/pieces.ts'
import { socketMatrix, transformSocket, type Socket } from '../../track/socket.ts'
import type { Build, PlacedPiece } from '../../track/build.ts'
import { CAMPAIGN_LADDER } from '../../world/campaign.ts'
import { getLevel } from '../../world/levels/feeltrack.level.ts'
import {
  kitchenSetPlacement,
  bedroomSetPlacement,
  bathroomSetPlacement,
  gardenSetPlacement,
  garageSetPlacement,
  porchSetPlacement,
} from '../../world/setPlacement.ts'

/** Downhill order: launched at the top, drains at the bottom. */
export const DESCENT_ORDER = ['garage', 'kitchen', 'bedroom', 'bathroom', 'garden', 'porch'] as const
export type FrameRoom = (typeof DESCENT_ORDER)[number]

/** The kit's default `drop` height — the connector's ballistic step. */
export const KIT_DROP_H = 0.25;

const PLACERS: Record<string, (id: string) => { position: [number, number, number] } | null> = {
  kitchen: kitchenSetPlacement,
  bedroom: bedroomSetPlacement,
  bathroom: bathroomSetPlacement,
  garden: gardenSetPlacement,
  garage: garageSetPlacement,
  porch: porchSetPlacement,
};

const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];

/** A level's par build (the atlas guarantees the 04s and sandboxes have one). */
function parOf(level: { id: string; parBuild?: () => Build }): Build {
  const f = level.parBuild;
  if (!f) throw new Error(`downhill-frame: ${level.id} has no par build`);
  return f.call(level);
}

/** The in-socket y of a build's finish deck (the tests' finishDeckY law). */
function finishDeckY(build: Build): number {
  const cup = build.pieces.find((p) => p.def === 'finishCup')!;
  const [inSocket] = PIECES.finishCup.sockets(cup.params);
  return transformSocket(inSocket, cup.transform).pos.y;
}

export interface RoomYStats {
  room: string;
  placeYMedian: number;
  deckYMedian: number;
  startYMedian: number;
  internalDropMedian: number;
}

/** y-statistics of the campaign's setPlacement rows + par decks, per room. */
export function campaignYStats(): RoomYStats[] {
  const ids = [...CAMPAIGN_LADDER, 'kitchen-sandbox', 'bedroom-sandbox', 'bathroom-sandbox', 'garden-sandbox', 'garage-sandbox', 'porch-sandbox'];
  const rows: Record<string, { place: number[]; deck: number[]; start: number[] }> = {};
  for (const id of ids) {
    const room = id.replace(/-sandbox$/, '').replace(/\d.*$/, '');
    const lvl = getLevel(id);
    const p = PLACERS[room]?.(id);
    (rows[room] ??= { place: [], deck: [], start: [] });
    if (p) rows[room]!.place.push(p.position[1]);
    rows[room]!.deck.push(finishDeckY(parOf(lvl)));
    rows[room]!.start.push(lvl.startSocket.pos.y);
  }
  return Object.entries(rows).map(([room, r]) => ({
    room,
    placeYMedian: median(r.place),
    deckYMedian: median(r.deck),
    startYMedian: median(r.start),
    internalDropMedian: median(r.start.map((s, i) => s - r.deck[i]!)),
  }));
}

/** Measured median campaign INTERNAL descent (start deck → finish deck). */
export const INTERNAL_DROP = median(campaignYStats().map((r) => r.internalDropMedian));

/** The canonical floor-to-floor step at a connector drop height. */
export const deckStep = (dropH: number): number => INTERNAL_DROP + dropH;

/** Canonical deck altitudes: porch 0 → garage top, at connector dropH. */
export function deckAlts(dropH: number): Record<FrameRoom, number> {
  const step = deckStep(dropH);
  const alt = {} as Record<FrameRoom, number>;
  DESCENT_ORDER.forEach((room, i) => (alt[room] = (DESCENT_ORDER.length - 1 - i) * step));
  return alt;
}

export interface Deck {
  room: FrameRoom;
  rung: string;
  rank: number;
  alt: number;
  x: number;
  center: [number, number, number];
  build: Build;
  entry: Socket;
  exit: Socket;
  cup: { center: [number, number, number]; radius: number };
  bounds: { min: [number, number, number]; max: [number, number, number] };
}

export interface Leg {
  from: FrameRoom;
  to: FrameRoom;
  dropH: number;
  build: Build;
  end: Socket;
}

export interface FrameLayout {
  dropH: number;
  step: number;
  decks: Deck[];
  legs: Leg[];
  start: Socket;
  floor: { center: [number, number, number]; half: [number, number, number] };
}

const shifted = (build: Build, dx: number, dy: number, dz: number): Build => {
  const T = new THREE.Matrix4().makeTranslation(dx, dy, dz);
  return { ...build, pieces: build.pieces.map((p) => ({ ...p, transform: T.clone().multiply(p.transform) })) };
};

/** Lay a piece list head-to-tail starting AT socket `start` (the builder's
 *  mating law: next piece transform = parentOut · localIn⁻¹); returns the
 *  laid pieces and the out-socket of the last one. */
function chainPieces(start: Socket, pieces: { def: string; params: Record<string, number> }[]): { laid: PlacedPiece[]; end: Socket } {
  const laid: PlacedPiece[] = [];
  let cursor = start;
  for (const p of pieces) {
    const def = PIECES[p.def as keyof typeof PIECES]!;
    const [inS, outS] = def.sockets(p.params as never);
    const inLocal = socketMatrix(inS);
    const T = socketMatrix(cursor).multiply(inLocal.clone().invert());
    laid.push({ def: p.def, params: p.params as never, seq: laid.length, transform: T } as PlacedPiece);
    cursor = transformSocket(outS, T);
  }
  return { laid, end: cursor };
}

/** The full frame: six ratified 04 sets mounted at deck altitudes on a
 *  descending +x line, joined by authored drop-and-catch connector legs. */
export function layout(dropH: number = KIT_DROP_H, legAngle = 40): FrameLayout {
  const alts = deckAlts(dropH);
  const decks: Deck[] = [];
  const legs: Leg[] = [];
  DESCENT_ORDER.forEach((room, rank) => {
    const rung = `${room}04`;
    const level = getLevel(rung);
    const local = parOf(level);
    // entry/exit of the authored chain (pieces are stored in chain order)
    const first = local.pieces[0]!;
    const last = local.pieces[local.pieces.length - 1]!;
    const entryLocal = transformSocket(PIECES[first.def].sockets(first.params)[0], first.transform);
    const exitLocal = transformSocket(PIECES[last.def].sockets(last.params)[1], last.transform);
    // placement x: deck 0 starts its chain at x = 0; later decks seat their
    // entry 2 cm off the leg's end socket (the builder's seam convention)
    let dx: number;
    if (decks.length === 0) {
      dx = -entryLocal.pos.x;
    } else {
      const prev = decks[decks.length - 1]!;
      const h = Math.max(0.06, prev.exit.pos.y - (alts[room] + entryLocal.pos.y));
      const { laid, end } = chainPieces(prev.exit, [
        { def: 'straight', params: { length: 0.12 } },
        { def: 'drop', params: { height: h, angle: legAngle, radius: 0.1, lead: 0.05 } },
        { def: 'straight', params: { length: 0.12 } },
      ]);
      legs.push({ from: prev.room, to: room, dropH: h, build: { levelId: `downhill-${prev.room}-${room}`, seed: 0, pieces: laid }, end });
      dx = end.pos.x + 0.02 - entryLocal.pos.x;
    }
    const dy = alts[room];
    const M = new THREE.Matrix4().makeTranslation(dx, dy, 0);
    const build = shifted(local, dx, dy, 0);
    const entry = transformSocket(entryLocal, M);
    const exit = transformSocket(exitLocal, M);
    const cup = build.pieces.find((p) => p.def === 'finishCup')!;
    const cv = PIECES.finishCup.captureVolume!(cup.params);
    const cupPos = new THREE.Vector3(cv.center.x, cv.center.y, cv.center.z).applyMatrix4(cup.transform);
    // AABB for the camera graph
    const box = new THREE.Box3();
    for (const p of build.pieces) {
      const s = PIECES[p.def as keyof typeof PIECES]!.spline(p.params);
      for (const f of s.stationFrames()) box.expandByPoint(f.pos.clone().applyMatrix4(p.transform));
    }
    decks.push({
      room,
      rung,
      rank,
      alt: dy,
      x: dx,
      center: [(box.min.x + box.max.x) / 2, (box.min.y + box.max.y) / 2, (box.min.z + box.max.z) / 2],
      build,
      entry,
      exit,
      cup: { center: [cupPos.x, cupPos.y, cupPos.z], radius: cv.radius },
      bounds: {
        min: [box.min.x, box.min.y, box.min.z],
        max: [box.max.x, box.max.y, box.max.z],
      },
    });
  });
  // floor: physical-group slab under the frame (tunnel law, Feasibility §1)
  const xs = decks.flatMap((d) => [d.bounds.min[0], d.bounds.max[0]]);
  const midX = (Math.min(...xs) + Math.max(...xs)) / 2;
  const spanX = Math.max(...xs) - Math.min(...xs);
  const floor = { center: [midX, -1.25, 0] as [number, number, number], half: [spanX / 2 + 60, 0.5, 40] as [number, number, number] };
  const start = decks[0]!.entry;
  return { dropH, step: deckStep(dropH), decks, legs, start, floor };
}

/** The room-graph the house camera law rides: nodes = decks, edges = legs. */
export function roomGraph(l: FrameLayout): { nodes: { room: string; center: [number, number, number]; alt: number }[]; edges: { from: string; to: string; mid: [number, number, number] }[] } {
  return {
    nodes: l.decks.map((d) => ({ room: d.room, center: d.center, alt: d.alt })),
    edges: l.legs.map((g) => {
      const a = l.decks.find((d) => d.room === g.from)!;
      const b = l.decks.find((d) => d.room === g.to)!;
      return { from: g.from, to: g.to, mid: [(a.center[0] + b.center[0]) / 2, (a.center[1] + b.center[1]) / 2, 0] as [number, number, number] };
    }),
  };
}
