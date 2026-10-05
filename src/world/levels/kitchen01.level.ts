/**
 * KITCHEN 01 — "Book Drop" (the tutorial).
 *
 * PROMPT §9.3, almost word for word: a start on a book stack (a `ramp`), a
 * finish cup on the counter, ONE gap, and exactly three pieces in the tray —
 * gapLip, drop, landing — which fit the gap in one intended order (lip ->
 * drop -> landing: launch, catch, roll out). Placing all three finishes the
 * level; that claim is not prose, it is `tests/unit/kitchen-levels.test.ts`.
 *
 * This file also carries the SHARED kitchen authoring kit that
 * `kitchen02..05` import: `lay` (per-instance piece placement — the kit's
 * `chain` keys params by KIND, so any level that reuses a kind with different
 * parameters must place pieces through `fitSocket` directly; same socket math,
 * pure), `startSocketFromBuild` (the car's release pose, taken on the start
 * ramp's descending blend exactly like the feel rig's `marks.start`, and —
 * unlike `feeltrack.level.ts`'s helper — converted from the rig's SIM-space
 * pose to the WORLD-space socket `World.spawnCar` expects), and the
 * `KitchenLevel` data shape (Level + tray/parBuild/hazard metadata — the
 * per-kind budget and reference build the pars script will read once the
 * Systems Engineer lands `npm run pars`; see Concepts/Levels).
 */
import * as THREE from 'three';
import { PIECES, type PieceKind, type PieceParams } from '../../track/pieces.ts';
import { fitSocket } from '../../track/snap.ts';
import { transformSocket, type Socket } from '../../track/socket.ts';
import type { Build, PlacedPiece } from '../../track/build.ts';
import { KitRig, rampLevelForDrop } from '../../feel/kittrack.ts';
import { SIM_SCALE } from '../../physics/sim.ts';
import type { Level } from '../level.ts';
import { registerLevel } from './feeltrack.level.ts';

// ---- the shared kitchen authoring kit --------------------------------------

/** One placement: a piece kind with ITS OWN parameters (a kind may appear
 *  more than once in a build with different params — `chain` cannot express
 *  that, `lay` can). */
export interface PlacedSpec {
  def: PieceKind;
  params?: PieceParams;
}

/** Lay placements end to end with pure socket math (identical math to
 *  `chain`, but per-instance params). Deterministic: same input, same bytes. */
export function lay(list: readonly PlacedSpec[], levelId: string, seed: number): Build {
  let cursor: Socket = {
    pos: new THREE.Vector3(),
    tangent: new THREE.Vector3(1, 0, 0),
    up: new THREE.Vector3(0, 1, 0),
  };
  const pieces: PlacedPiece[] = [];
  list.forEach((piece, index) => {
    const params = piece.params ?? {};
    const [inSocket, outSocket] = PIECES[piece.def].sockets(params);
    const transform = fitSocket(cursor, inSocket);
    pieces.push({ def: piece.def, params, transform, seq: index });
    cursor = transformSocket(outSocket, transform);
  });
  return { levelId, pieces, seed };
}

/** The car's release: world-space pose at arc `s` of a build, on the start
 *  ramp's descending blend (the feel rigs' `marks.start` convention — the
 *  in-socket is level deck and the tuned rolling resistance outranks gravity
 *  there; see `feeltrack.level.ts`'s note). `KitRig.poseAt` returns a SIM-space
 *  position, so the position comes back down by `SIM_SCALE` — the socket
 *  field is world metres, which is what `World.spawnCar` multiplies up. */
export function startSocketFromBuild(build: Build, s: number): Socket {
  const rig = new KitRig(build, SIM_SCALE);
  const frame = rig.frameAt(s);
  return {
    pos: frame.pos.clone(),
    tangent: frame.tangent.clone(),
    up: frame.up.clone(),
  };
}

/** A `ramp` sized so the car is released exactly `height` world-metres above
 *  the deck it lands on (measured from the release pose, the feel rigs'
 *  convention). */
export function kitchenRamp(height: number, angleDeg = KITCHEN_GEOM.rampAngle): PieceParams {
  return {
    angle: angleDeg,
    blend: KITCHEN_GEOM.rampBlend,
    level: rampLevelForDrop(height, angleDeg, KITCHEN_GEOM.rampBlend, KITCHEN_GEOM.release * KITCHEN_GEOM.rampBlend),
  };
}

/** The release point: this fraction into the start ramp's first blend. */
export const KITCHEN_GEOM = {
  rampAngle: -12,
  rampBlend: 0.08,
  release: 0.9,
} as const;

/** The kitchen gap, as authored for the tutorial and reused by name in later
 *  rungs — the same lip/catch/roll-out combo the feel track measures, at the
 *  size a first level can forgive.
 *
 *  STAGE-3 RE-AUTHOR (L01 promise fix — the old numbers were a 1-pixel win).
 *  The playtest finding was that the exact three-piece tray fit did NOT close
 *  the gap with the shipped launch, and the replay data says why: the piece
 *  geometry assumes the car follows the drop's catch ARC, but after the lip
 *  the car is ballistic — a parabola. Launched at ~1.3 m/s and +10 deg off
 *  the 0.22 m book stack, it crosses the deck plane ~0.24 m from the lip and
 *  ~30 deg nose-down; the old `drop` (height 0.15, angle 40, lead 0.01) put
 *  the landing deck's ENTRY plane ~15 mm BELOW that parabola by the time the
 *  chain reached it, so the car arrived under the deck and fell (the deck was
 *  placed where the arc says the car is, not where the parabola says it is),
 *  or slammed the flat deck at -34 deg and survived only by luck — the pass
 *  set was fragmented (drop.lead 0.01 finished, 0.02 fell; lip.length 0.04
 *  finished, 0.06 fell).
 *
 *  The three numbers below are measured to make the PARABOLA meet the DECK:
 *  - `drop` height 0.12 / angle 45 / lead 0.05: the shallower step (0.12) puts
 *    the deck plane into the parabola's sink, not under it; the steeper 45 deg
 *    keeps the EMPTY span short (0.136 m — the ballistic crossing lands ON the
 *    exit lead deck with ~40 mm of solid deck behind it) while the two 0.05
 *    leads make the WHOLE drop span (0.24 m) longer than a flat roll-off can
 *    fly (reach ~0.19 m), so a build MISSING the drop cannot skip the hole on
 *    a bounce into the cup — the tray fit is enforced by geometry.
 *  - `landing` level 0.24 (was 0.18): a 0.36 m soft catch — touchdown lands
 *    ~0.25 m inside a deck that still has ~0.10 m of run-out to the cup-side
 *    blend; ±10 % of release speed moves touchdown by millimetres, not off.
 *  - `lip` unchanged: the 10 deg launch is the lesson; the fix was under the
 *    car, not at it.
 *  Measured margin at the shipped default launch (speed 0, ramp 0.22 m):
 *  finish 2.23 s; 8-seed sweep bit-stable in time (0 % spread; the seed is
 *  folded into the hash only); launch jitter 0-0.1 m/s finishes; every
 *  one- and two-piece omission against the cup anchored at its par transform
 *  fails (`tests/unit/kitchen-levels.test.ts`). See Concepts/Levels §L01 card
 *  and the session log `2026-10-05 Stage 3 - L01 promise fix`. */
export const KITCHEN_GAP = {
  lip: { length: 0.02, angle: 10, blend: 0.05 },
  drop: { height: 0.12, angle: 45, radius: 0.02, lead: 0.05 },
  landing: { level: 0.24, angle: 12, blend: 0.06 },
} as const;

/** A wet patch — the kitchen hazard as DATA. `World` does not yet read zones
 *  (see Concepts/Levels §Hazards as data — this is the ask to the Feel
 *  Engineer); the field is the convention the builder/physics will consume,
 *  and the level's par line is designed to be grip-independent in the
 *  meantime. */
export interface WetPatch {
  id: string;
  kind: 'wetPatch';
  /** World-space centre (metres). */
  center: { x: number; y: number; z: number };
  radius: number;
  /** Deck grip multiplier inside the patch (0.5 = the brief's "halves grip"). */
  gripFactor: number;
  /** The prop that drips there (art tells), e.g. "tap". */
  source: string;
}

/** A kitchen level: the contract's `Level` plus what the ladder, the builder
 *  tray and the pars script need — the tray (per-kind budget; its total IS
 *  `budget`), the designer's reference build, and level metadata.
 *  `placeholderBuild()` stays the contract seam and returns the par build. */
export interface KitchenLevel extends Level {
  set: 'kitchen';
  /** What the player may place, per kind. The tray. Sum = `budget`. */
  tray: Partial<Record<PieceKind, number>>;
  /** The reference build — fixtures plus the designer's line. `npm run pars`
   *  replays this and regenerates `par.time`. */
  parBuild(): Build;
  /** True for the sandbox variant (no budget). */
  sandbox?: boolean;
  /** Pieces the level ships built-in (start prop, cup, scenery). Not in the
   *  tray; part of `parBuild`'s geometry. */
  fixtures?: Partial<Record<PieceKind, number>>;
  hazards?: readonly WetPatch[];
  /** Named sockets exposed by props (the bowl rim — Concepts/Levels). */
  propSockets?: Record<string, Socket>;
}

/** Sum a tray map. */
export function trayCount(tray: Partial<Record<PieceKind, number>>): number {
  return Object.values(tray).reduce((sum, n) => sum + (n ?? 0), 0);
}

/** Fill the contract fields from the tray: budget = tray total (the sandbox
 *  passes its own big number), par.pieces = tray total, and the
 *  `placeholderBuild()` seam returns the par build. */
export function kitchenLevel(
  def: Omit<KitchenLevel, 'budget' | 'placeholderBuild' | 'par'> & {
    par: { time: number; pieces?: number };
    /** Sandbox only: the contract wants a number where there is no budget. */
    budget?: number;
  },
): KitchenLevel {
  return {
    ...def,
    par: { pieces: def.par.pieces ?? trayCount(def.tray), time: def.par.time },
    budget: def.sandbox ? (def.budget ?? 999) : trayCount(def.tray),
    placeholderBuild: def.parBuild,
  };
}

/** Register on the shared level registry and keep the kitchen type. */
export function registerKitchen(level: KitchenLevel): KitchenLevel {
  registerLevel(level);
  return level;
}

// ---- KITCHEN 01 -------------------------------------------------------------

export const KITCHEN01_ID = 'kitchen01';

function parBuild(): Build {
  return lay(
    [
      { def: 'ramp', params: kitchenRamp(0.22) }, // the book stack (fixture)
      { def: 'gapLip', params: KITCHEN_GAP.lip }, // tray 1: the launch
      { def: 'drop', params: KITCHEN_GAP.drop }, // tray 2: the gap + its catch
      { def: 'landing', params: KITCHEN_GAP.landing }, // tray 3: the roll-out
      { def: 'finishCup' }, // the counter cup (fixture)
    ],
    KITCHEN01_ID,
    1,
  );
}

export const KITCHEN01: KitchenLevel = registerKitchen(
  kitchenLevel({
    id: KITCHEN01_ID,
    name: 'Book Drop',
    set: 'kitchen',
    seed: 1,
    startSocket: startSocketFromBuild(parBuild(), KITCHEN_GEOM.release * KITCHEN_GEOM.rampBlend),
    par: { time: 2.23 }, // measured on the par build (regenerate via pars)
    maxTime: 12,
    tray: { gapLip: 1, drop: 1, landing: 1 },
    fixtures: { ramp: 1, finishCup: 1 },
    parBuild,
  }),
);
