/**
 * BEDROOM 01 — "Cable Dip" (the set's first rung: RIDE OVER, DON'T FLY).
 *
 * The kitchen tutorial taught the LAUNCH verb (lip -> drop -> landing). The
 * bedroom rung re-frames the family's vocabulary around the set's fourth
 * voice: the charging cable that snakes across the floor. A cable is not a
 * gap — you do not launch at a cable, you SLOW and ride over it. The level
 * says that in geometry: there is no `gapLip` in the tray and none in the
 * par build. The deck steps DOWN for the cable (the `drop` piece IS the
 * dip: a step, a catch, a roll-out) between two `straight`s, and the exact
 * three-piece fit finishes — a launch line is not merely slower here, it is
 * unbuyable (the tray holds no lip).
 *
 * The geometry is deliberately the stage-3-coherent LAZY LINE the kitchen
 * ladder already proved (ramp 0.28, one 0.2 m `straight` geometry, the
 * re-authored `KITCHEN_GAP` drop): the rung borrows a measured-safe catch so
 * the NEW lesson — no lip, ride over — is the only thing under test.
 * Measured numbers: `npm run pars` and `tests/unit/bedroom-levels.test.ts`.
 *
 * This file also carries the SHARED bedroom authoring kit — the `BedroomLevel`
 * data shape (the kitchen's `KitchenLevel` seam with the set id swapped; see
 * Concepts/Levels §The data model for why the contract still has no per-kind
 * budget) and `bedroomLevel`/`registerBedroom`, mirrors of `kitchenLevel`/
 * `registerKitchen`. The placement math (`lay`, `kitchenRamp`,
 * `startSocketFromBuild`, `trayCount`) is imported from `kitchen01.level.ts`
 * — it is the shared authoring kit that file carries, not kitchen design.
 */
import type { Build } from '../../track/build.ts';
import type { PieceKind, PieceParams } from '../../track/pieces.ts';
import type { Socket } from '../../track/socket.ts';
import type { Level } from '../level.ts';
import { registerLevel } from './feeltrack.level.ts';
import {
  KITCHEN_GAP,
  kitchenRamp,
  lay,
  startSocketFromBuild,
  trayCount,
} from './kitchen01.level.ts';

/** A bedroom level: the contract's `Level` plus the tray/fixture/parBuild
 *  metadata, exactly the kitchen seam (Concepts/Levels §The data model). */
export interface BedroomLevel extends Level {
  set: 'bedroom';
  /** What the player may place, per kind. The tray. Sum = `budget`. */
  tray: Partial<Record<PieceKind, number>>;
  /** Geometry for a tray kind the PAR line never places (the `levelTrayParams`
   *  seam — same rule as the kitchen: one geometry per kind, declared here
   *  when the par build does not carry it). */
  trayParams?: Partial<Record<PieceKind, PieceParams>>;
  /** The reference build — fixtures plus the designer's line. */
  parBuild(): Build;
  sandbox?: boolean;
  /** Pieces the level ships built-in. Not in the tray; part of parBuild. */
  fixtures?: Partial<Record<PieceKind, number>>;
  /** Named prop sockets the Environment Artist builds to (the drawer bore). */
  propSockets?: Record<string, Socket>;
}

/** Fill the contract fields from the tray (mirror of `kitchenLevel`). */
export function bedroomLevel(
  def: Omit<BedroomLevel, 'budget' | 'placeholderBuild' | 'par'> & {
    par: { time: number; pieces?: number };
    budget?: number;
  },
): BedroomLevel {
  return {
    ...def,
    par: { pieces: def.par.pieces ?? trayCount(def.tray), time: def.par.time },
    budget: def.sandbox ? (def.budget ?? 999) : trayCount(def.tray),
    placeholderBuild: def.parBuild,
  };
}

/** Register on the shared level registry and keep the bedroom type. */
export function registerBedroom(level: BedroomLevel): BedroomLevel {
  registerLevel(level);
  return level;
}

/** The bed-side book-pile start ramp: the release convention is the feel
 *  rigs' (0.9 of the descending blend), the geometry `kitchenRamp`'s. */
export const BEDROOM_GEOM = {
  rampAngle: -12,
  rampBlend: 0.08,
  release: 0.9,
} as const;

/** ONE straight geometry across the bedroom ladder: 0.2 m — one step longer
 *  than the 0.18 m lazy-line deck the stage-3 coherence pass proved, kept as
 *  this ladder's single seating (a tray seats a kind at ONE geometry). The
 *  04 rung is the deliberate exception and carries its own 0.3 m run-out
 *  (see its file); the B2-redesigned 02 likewise seats its own 0.4 m decks
 *  (`BEDROOM02_STRAIGHT`) — a mattress wants two spans, not five. */
export const BEDROOM_STRAIGHT = 0.2;

/** The cable dip: the deck STEPS DOWN for the cable and the `drop` piece's
 *  catch rolls the car back up to speed — the same re-authored `KITCHEN_GAP`
 *  drop the kitchen ladder's lazy lines ride (0.12 m step, 45°, 0.05 leads),
 *  chosen so the missing-piece holes are the measured 0.136 m empty span
 *  and not a designer's guess. */
export const CABLE_DIP = {
  drop: KITCHEN_GAP.drop,
} as const;

export const BEDROOM01_ID = 'bedroom01';

function parBuild(): Build {
  return lay(
    [
      { def: 'ramp', params: kitchenRamp(0.28) }, // the book pile below the lamp (fixture)
      { def: 'straight', params: { length: BEDROOM_STRAIGHT } }, // tray: the deck before the cable
      { def: 'drop', params: CABLE_DIP.drop }, // tray: THE DIP — the cable rides here
      { def: 'straight', params: { length: BEDROOM_STRAIGHT } }, // tray: ride out to the cup
      { def: 'finishCup' }, // fixture
    ],
    BEDROOM01_ID,
    1,
  );
}

export const BEDROOM01: BedroomLevel = registerBedroom(
  bedroomLevel({
    id: BEDROOM01_ID,
    name: 'Cable Dip',
    set: 'bedroom',
    seed: 1,
    startSocket: startSocketFromBuild(parBuild(), BEDROOM_GEOM.release * BEDROOM_GEOM.rampBlend),
    par: { time: 2.35 }, // measured on the par build (regenerate via `npm run pars`)
    maxTime: 12,
    // no `gapLip` anywhere: the lesson is that a cable is ridden over, not
    // flown. The whole tray is the par line (3 = budget, all load-bearing).
    tray: { straight: 2, drop: 1 },
    fixtures: { ramp: 1, finishCup: 1 },
    parBuild,
  }),
);
