/**
 * THE HOUSE FRAME (build 1 of "THE DOWNHILL greenlit", Decision Log 2026-10-12).
 *
 * One pure table + layout: the six ratified sets — each room's own `04` par
 * build, geometry untouched — mounted on a descending +x line at the CANON
 * deck altitudes, joined by AUTHORED DROP-AND-CATCH connectors as fixtures.
 * Ballistic grammar only: no `curve`, no `bank` anywhere (the steering spike
 * crossed zero banked arcs — rooms connect by flight or not at all).
 *
 * The altitude law is the spike's (see [[Reference/Downhill Spike]] §1, the
 * table the Decision Log entry canonised): the campaign's y-statistics are
 * FLAT — every room is authored ≈ one internal drop TALL — so the frame
 * canonises that height instead of inventing one:
 *
 *   deck altitude(r) = (5 − rank) · STEP,  STEP = INTERNAL_DROP + KIT_DROP_H
 *
 * porch = 0 (the floor of the world) → garage mezzanine top = the launch.
 * Ranks follow the prose ladder garage → kitchen → bedroom → bathroom →
 * garden → porch. `tests/unit/house-levels.test.ts` re-derives the table
 * from the live campaign data and fails on drift from the ratified rows
 * (3.432 / 2.745 / 2.059 / 1.373 / 0.686 / 0.000).
 *
 * The connector is the spike's catch, kept because the sweep said so (§2b):
 * one `straight` run-out, one authored `drop` (height = exit y − next entry
 * y, ballistic gap), one `straight` run-in seating 2 cm off the next deck's
 * entry socket. A campaign-style landing trough AFTER the drop made it WORSE
 * (1/6 across the grid); the `drop` piece's own catch arc is the right catch.
 *
 * The world floor slab is the tunnel-law physical body of the feasibility
 * house, SHRUNK: the spike's +60 m slab let a missed deck cruise for 25 s
 * (`Reference/Downhill Spike` D2 — "the 30-s tail is rollout"); the product
 * slab ends 2 m past the frame's x-extent, so a runaway line rolls off the
 * edge of the world and `observe` ends the run honestly within seconds.
 *
 * Nothing here is a campaign edit: the 37 anchors do not move, the 04 builds
 * are read through `getLevel` and TRANSFORMED at layout time only. A house
 * is a NEW id; its receipts are its own.
 */
import * as THREE from 'three';
import { PIECES } from '../track/pieces.ts';
import { socketMatrix, transformSocket, type Socket } from '../track/socket.ts';
import type { Build, PlacedPiece } from '../track/build.ts';
import { CAMPAIGN_LADDER } from './campaign.ts';
import { getLevel } from './levels/feeltrack.level.ts';
import {
  kitchenSetPlacement,
  bedroomSetPlacement,
  bathroomSetPlacement,
  gardenSetPlacement,
  garageSetPlacement,
  porchSetPlacement,
} from './setPlacement.ts';

/** Downhill order: launched at the top, drains at the bottom. */
export const DESCENT_ORDER = ['garage', 'kitchen', 'bedroom', 'bathroom', 'garden', 'porch'] as const;
export type FrameRoom = (typeof DESCENT_ORDER)[number];

/** The kit's default `drop` height — the connector's ballistic step. */
export const KIT_DROP_H = 0.25;

/** THE CANONICAL FRAME: the main run of the greenlit sweep — connector drop
 *  0.25 m at a 40° leg (the grade the spike's canonical receipt was made
 *  at: median 4 rooms, 13/15 runs ≥ 3). 50° exists as the 6/6 full house
 *  and stays a spike row, not a product row. */
export const HOUSE_FRAME = { dropH: KIT_DROP_H, legAngle: 40 } as const;

/** The world floor slab: top surface at y = −0.75 (the tunnel law), ending
 *  2 m past the frame's x-extent (see the header — the shrunk slab law),
 *  4 m of z clear of the decks' axis. */
export const FLOOR_TOP = -0.75;

/** The `04` rung of each room — the ratified set whose geometry every deck
 *  is mounted from. */
export const DECK_RUNG: Record<FrameRoom, string> = {
  garage: 'garage04',
  kitchen: 'kitchen04',
  bedroom: 'bedroom04',
  bathroom: 'bathroom04',
  garden: 'garden04',
  porch: 'porch04',
};

const PLACERS: Record<string, (id: string) => { position: [number, number, number] } | null> = {
  kitchen: kitchenSetPlacement,
  bedroom: bedroomSetPlacement,
  bathroom: bathroomSetPlacement,
  garden: gardenSetPlacement,
  garage: garageSetPlacement,
  porch: porchSetPlacement,
};

const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];

/** A level's par build (the atlas guarantees the 04s have one). */
function parOf(level: { id: string; parBuild?: () => Build }): Build {
  const f = level.parBuild;
  if (!f) throw new Error(`house-frame: ${level.id} has no par build`);
  return f.call(level);
}

/** The in-socket y of a build's finish deck (the `tests/unit/*-levels.test.ts`
 *  `finishDeckY` law). */
export function finishDeckY(build: Build): number {
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

/** y-statistics of the campaign's setPlacement rows + par decks, per room —
 *  the derivation of the canon table, re-computable at test time. */
export function campaignYStats(): RoomYStats[] {
  const ids = [
    ...CAMPAIGN_LADDER,
    'kitchen-sandbox', 'bedroom-sandbox', 'bathroom-sandbox',
    'garden-sandbox', 'garage-sandbox', 'porch-sandbox',
  ];
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

/** Measured median campaign INTERNAL descent (start deck → finish deck) —
 *  the height the frame canonises (the spike's 0.4363). */
export const INTERNAL_DROP = median(campaignYStats().map((r) => r.internalDropMedian));

/** The canonical floor-to-floor step at a connector drop height. */
export const deckStep = (dropH: number): number => INTERNAL_DROP + dropH;

/** Canonical deck altitudes: porch 0 → garage mezzanine top. */
export function deckAlts(dropH: number = HOUSE_FRAME.dropH): Record<FrameRoom, number> {
  const step = deckStep(dropH);
  const alt = {} as Record<FrameRoom, number>;
  DESCENT_ORDER.forEach((room, i) => (alt[room] = (DESCENT_ORDER.length - 1 - i) * step));
  return alt;
}

/** One parcel: a room's OWN `04` finish cup placed in the house — the
 *  threshold a downhill run APPROVES by crossing (physics under the shipped
 *  capture law, never a menu checkbox). */
export interface Parcel {
  room: FrameRoom;
  rung: string;
  /** World-metre centre of the cup's capture volume. */
  center: readonly [number, number, number];
  /** Capture radius (world m), as the piece declares it. */
  radius: number;
  /** Deck altitude of the room (the canon table). */
  alt: number;
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
  parcel: Parcel;
  bounds: { min: [number, number, number]; max: [number, number, number] };
}

export interface Leg {
  from: FrameRoom;
  to: FrameRoom;
  dropH: number;
  build: Build;
  end: Socket;
}

export interface HouseLayout {
  dropH: number;
  legAngle: number;
  step: number;
  decks: Deck[];
  legs: Leg[];
  parcels: Parcel[];
  /** The mezzanine release: the garage deck's entry socket. */
  start: Socket;
  /** The world floor slab (world metres — `World` scales it into sim units). */
  floor: { center: [number, number, number]; half: [number, number, number] };
}

const shifted = (build: Build, dx: number, dy: number, dz: number): Build => {
  const T = new THREE.Matrix4().makeTranslation(dx, dy, dz);
  return { ...build, pieces: build.pieces.map((p) => ({ ...p, transform: T.clone().multiply(p.transform) })) };
};

/** Lay piece list end to end starting AT socket `start` (the builder's
 *  mating law); returns the laid pieces and the out-socket of the last. */
function chainPieces(
  start: Socket,
  pieces: { def: string; params: Record<string, number> }[],
): { laid: PlacedPiece[]; end: Socket } {
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

/** THE canonical layout (drop 0.25 @ 40°): six ratified decks on the canon
 *  altitudes, five authored drop-and-catch legs, parcels, the shrunk slab.
 *  Pure and deterministic — same code, same bytes, every machine. */
export function houseLayout(): HouseLayout {
  const { dropH: canonDrop, legAngle } = HOUSE_FRAME;
  const alts = deckAlts(canonDrop);
  const decks: Deck[] = [];
  const legs: Leg[] = [];
  DESCENT_ORDER.forEach((room, rank) => {
    const rung = DECK_RUNG[room];
    const level = getLevel(rung);
    const local = parOf(level);
    const first = local.pieces[0]!;
    const last = local.pieces[local.pieces.length - 1]!;
    const entryLocal = transformSocket(PIECES[first.def].sockets(first.params)[0], first.transform);
    const exitLocal = transformSocket(PIECES[last.def].sockets(last.params)[1], last.transform);
    // deck 0 starts its chain at x = 0; later decks seat their entry 2 cm
    // off the leg's end socket (the builder's seam convention)
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
      legs.push({
        from: prev.room,
        to: room,
        dropH: h,
        build: { levelId: `house-leg-${prev.room}-${room}`, seed: 0, pieces: laid },
        end,
      });
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
      center: [
        (box.min.x + box.max.x) / 2,
        (box.min.y + box.max.y) / 2,
        (box.min.z + box.max.z) / 2,
      ],
      build,
      entry,
      exit,
      parcel: {
        room,
        rung,
        center: [cupPos.x, cupPos.y, cupPos.z],
        radius: cv.radius,
        alt: dy,
      },
      bounds: {
        min: [box.min.x, box.min.y, box.min.z],
        max: [box.max.x, box.max.y, box.max.z],
      },
    });
  });
  // the shrunk slab: top at FLOOR_TOP, ending 2 m past the frame (header)
  const xs = decks.flatMap((d) => [d.bounds.min[0], d.bounds.max[0]]);
  const midX = (Math.min(...xs) + Math.max(...xs)) / 2;
  const spanX = Math.max(...xs) - Math.min(...xs);
  const halfY = 0.5;
  const floor = {
    center: [midX, FLOOR_TOP - halfY, 0] as [number, number, number],
    half: [spanX / 2 + 2, halfY, 4] as [number, number, number],
  };
  return {
    dropH: canonDrop,
    legAngle,
    step: deckStep(canonDrop),
    decks,
    legs,
    parcels: decks.map((d) => d.parcel),
    start: decks[0]!.entry,
    floor,
  };
}

/** Translate a build's piece transforms (house placement; NEVER a campaign
 *  re-author — a translation re-mints a receipt, Feasibility §4). */
export function shiftedBuild(build: Build, dx: number, dy: number, dz = 0): Build {
  return shifted(build, dx, dy, dz);
}

/** The ROOM GRAPH the house camera law rides: nodes = deck parcels, edges =
 *  connector legs (the spike's camera section, kept honest not beautiful). */
export function roomGraph(l: HouseLayout = houseLayout()): {
  nodes: { room: FrameRoom; center: [number, number, number]; alt: number }[];
  edges: { from: FrameRoom; to: FrameRoom; mid: [number, number, number] }[];
} {
  return {
    nodes: l.decks.map((d) => ({ room: d.room, center: d.center, alt: d.alt })),
    edges: l.legs.map((g) => {
      const a = l.decks.find((d) => d.room === g.from)!;
      const b = l.decks.find((d) => d.room === g.to)!;
      return {
        from: g.from,
        to: g.to,
        mid: [(a.center[0] + b.center[0]) / 2, (a.center[1] + b.center[1]) / 2, 0] as [number, number, number],
      };
    }),
  };
}

/** THE PARCEL PROBE (read-only, hash-neutral — the fp pattern, Feasibility
 *  T4): the moving-capture law of `World.observe` applied to EVERY parcel,
 *  a pure fold of sampled car poses into approval events. A parcel is
 *  APPROVED the first sample its centre comes within `CUP_CAPTURE_FACTOR`·r
 *  — and, on the terminal sample only, by the stall branch (a stopped car
 *  nose-in at the bowl mouth, radius + half a car length). Physics, not a
 *  menu checkbox; nothing here writes to a world. */
export interface ParcelSample {
  /** World-metre car centre. */
  pos: readonly [number, number, number];
}

export interface ParcelApproval {
  room: FrameRoom;
  /** 1-based step the approval landed on (sample index + 1). */
  step: number;
  /** Approval seconds. */
  time: number;
}

export function approveParcels(
  parcels: readonly Parcel[],
  samples: Iterable<ParcelSample>,
  opts: { captureFactor: number; stallReachExtra: number; dt: number; stallTerminal?: boolean },
): ParcelApproval[] {
  const approvals: ParcelApproval[] = [];
  const seen = new Set<FrameRoom>();
  let i = 0;
  const capR2 = (r: number) => (r * opts.captureFactor) ** 2;
  const stallR2 = (r: number) => (r * opts.captureFactor + opts.stallReachExtra) ** 2;
  let last: ParcelSample | undefined;
  for (const s of samples) {
    i++;
    for (const p of parcels) {
      if (seen.has(p.room)) continue;
      const dx = s.pos[0] - p.center[0];
      const dy = s.pos[1] - p.center[1];
      const dz = s.pos[2] - p.center[2];
      const d2 = dx * dx + dy * dy + dz * dz;
      if (d2 < capR2(p.radius)) {
        seen.add(p.room);
        approvals.push({ room: p.room, step: i, time: i * opts.dt });
      }
    }
    last = s;
  }
  // the terminal stall branch (the run ENDED stopped): a car parked with its
  // nose in a bowl is IN the bowl — the Playtest G law, per parcel
  if (opts.stallTerminal && last) {
    for (const p of parcels) {
      if (seen.has(p.room)) continue;
      const dx = last.pos[0] - p.center[0];
      const dy = last.pos[1] - p.center[1];
      const dz = last.pos[2] - p.center[2];
      if (dx * dx + dy * dy + dz * dz < stallR2(p.radius)) {
        seen.add(p.room);
        approvals.push({ room: p.room, step: i, time: i * opts.dt });
      }
    }
  }
  return approvals;
}
