/**
 * GARDEN 01 — "Shadow Bars" (the set's first rung: teaching the EYE, not
 * the wheel — the sun-shadow line).
 *
 * The garden's one mechanic nobody has taught yet is free: the trellis
 * throws shadow bars across the paving and the SHADED SIDE IS COOLER —
 * literally, the sky-tinted fill lives there (`SKY_INFLUENCE` in
 * `src/sets/garden/data.ts`), and the ratified hero rig frames the sun disc
 * and the bars in one shot. The lesson this rung adds is a CAMERA reading,
 * not a physics one: a shadow is set architecture the eye uses to measure
 * the deck, and a shadow must NEVER be a hazard (the concept's line, kept
 * by the ratified set — `HAZARDS` ships empty). So the rung ships NO live
 * zone at all, and the card says the sentence the bars cannot: cool strip,
 * warm strip, same stone, same grip. `prop:shadowBars` in the set module is
 * that sentence in one line.
 *
 * The physics is the ladder's proven floor — the kitchen L01 / bathroom01
 * three-piece flight over the gap (`gapLip`→`drop`→`landing`), the same
 * 0.22 shelf, the same `KITCHEN_GAP` numbers (the geometry economy the
 * bedroom and bathroom passes established: the rung lessons are the new
 * thing, not the hole). What is new is only where the eye learns to look.
 *
 * This file also carries the SHARED garden authoring kit — the
 * `GardenLevel` data shape (the kitchen/bedroom/bathroom seam with the set
 * id swapped) and `gardenLevel`/`registerGarden`, mirrors of
 * `bathroomLevel`/`registerBathroom`. The placement math (`lay`,
 * `kitchenRamp`, `startSocketFromBuild`, `trayCount`, `wetPatchOverSeam`)
 * is imported from the family's kit — `wetPatchOverSeam` from
 * `bathroom01.level.ts`, the zone-centring convention rungs 03/04 use.
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
  type WetPatch,
} from './kitchen01.level.ts';

/** A garden level: the contract's `Level` plus the tray/fixture/parBuild
 *  metadata, exactly the kitchen/bedroom/bathroom seam (Concepts/Levels
 *  §The data model). */
export interface GardenLevel extends Level {
  set: 'garden';
  /** What the player may place, per kind. The tray. Sum = `budget`. */
  tray: Partial<Record<PieceKind, number>>;
  /** Geometry for a tray kind the PAR line never places (the `levelTrayParams`
   *  seam — same rule as the kitchen/bedroom/bathroom). */
  trayParams?: Partial<Record<PieceKind, PieceParams>>;
  /** The reference build — fixtures plus the designer's line. */
  parBuild(): Build;
  sandbox?: boolean;
  /** Pieces the level ships built-in. Not in the tray; part of parBuild. */
  fixtures?: Partial<Record<PieceKind, number>>;
  /** Live grip zones (the kitchen04 hook; par lines are grip-independent).
   *  Rung 01 ships none ON PURPOSE — the shadow bars are the rung's lesson
   *  and a shadow is never a hazard (the concept's law, kept). */
  hazards?: readonly WetPatch[];
  /** Named prop sockets the Environment Artist builds to — the drain-pipe
   *  bore pair rides the set's `PIPE_SOCKET_FRAMES` (rung 02 exports them
   *  through its mount the way bedroom03 exported the drawer pair). */
  propSockets?: Record<string, Socket>;
}

/** Fill the contract fields from the tray (mirror of `bathroomLevel`). */
export function gardenLevel(
  def: Omit<GardenLevel, 'budget' | 'placeholderBuild' | 'par'> & {
    par: { time: number; pieces?: number };
    budget?: number;
  },
): GardenLevel {
  return {
    ...def,
    par: { pieces: def.par.pieces ?? trayCount(def.tray), time: def.par.time },
    budget: def.sandbox ? (def.budget ?? 999) : trayCount(def.tray),
    placeholderBuild: def.parBuild,
  };
}

/** Register on the shared level registry and keep the garden type. */
export function registerGarden(level: GardenLevel): GardenLevel {
  registerLevel(level);
  return level;
}

/** The start-ramp release convention, shared across the garden ladder
 *  (the feel rigs': 0.9 of the descending blend of `kitchenRamp`'s −12°). */
export const GARD_GEOM = {
  rampAngle: -12,
  rampBlend: 0.08,
  release: 0.9,
} as const;

/** ONE straight geometry across garden01..03: 0.2 m — the bedroom/bathroom
 *  ladder's seating, kept so every rung's tray seats one kind at one size.
 *  Rung 04 is the deliberate exception and carries the 0.3 m whole-tray
 *  sweep geometry the capstone gate lives at. */
export const GARD_STRAIGHT = 0.2;

/** The drain gap: the shared `KITCHEN_GAP` numbers are the garden ladder's
 *  drop too (the geometry economy — the garden's NEW verbs are the sun
 *  reading, the bore staging and the sprinkler zone, not a new hole). */
export const BORE_GAP = KITCHEN_GAP;

export const GARDEN01_ID = 'garden01';

function parBuild(): Build {
  return lay(
    [
      { def: 'ramp', params: kitchenRamp(0.22) }, // the potting-bench shelf (fixture)
      { def: 'gapLip', params: BORE_GAP.lip }, // tray: the launch off the bench
      { def: 'drop', params: BORE_GAP.drop }, // tray: the gap span + catch
      { def: 'landing', params: BORE_GAP.landing }, // tray: the roll-out past the bars
      { def: 'finishCup' }, // fixture
    ],
    GARDEN01_ID,
    1,
  );
}

export const GARDEN01: GardenLevel = registerGarden(
  gardenLevel({
    id: GARDEN01_ID,
    name: 'Shadow Bars',
    set: 'garden',
    seed: 1,
    startSocket: startSocketFromBuild(parBuild(), GARD_GEOM.release * GARD_GEOM.rampBlend),
    par: { time: 2.25 }, // measured on the par build (regenerate via `npm run pars`)
    maxTime: 12,
    // the tray IS the par line's multiset (3 = budget, all load-bearing).
    tray: { gapLip: 1, drop: 1, landing: 1 },
    fixtures: { ramp: 1, finishCup: 1 },
    // NO hazards: the trellis bars are the rung's whole story and a shadow
    // is read-only rhythm (the ratified set's own `HAZARDS = {}`).
    parBuild,
  }),
);
