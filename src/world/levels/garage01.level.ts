/**
 * GARAGE 01 — "The Stain" (the set's first rung: the oil-stain grip hazard
 * enters, and the patch IS the lesson).
 *
 * The garage ladder opens the way the bathroom ladder's first rung opened:
 * the epoxy floor carries a slick FILM beside the blade's dark edge and a
 * wet patch HALVES GRIP (`gripFactor: 0.5`, the live-zone hook
 * kitchen04/bathroom01 proved — [[Modules/hazards]]). The lesson this rung
 * adds is the ratified set's own physics: the AD's hazard-affordance
 * scoreboard shipped the oil stain as "the one prop in the set that must
 * BITE", and round 2 gave it a SPECULAR FILM (wet-patch treatment, not a
 * decal) — so the stain reads BEFORE it bites, and the fast line never has
 * a wheel in the sheen: the patch is flown, not driven. The par line is the
 * kitchen L01 / bathroom01 proven three-piece flight (launch, catch,
 * roll-out), it FLIES the patch, and it replays BIT-IDENTICAL wet vs dry
 * (airborne wheels report no contact). The THROUGH line is the hazard
 * PROBE, not a route: two decks laid across the seam roll straight through
 * the film, the hash diverges, and the wet run is the honest low-drag
 * number ([[Modules/hazards]] — on channel straights "grip loss" shows up
 * as LOW DRAG; the "slides wide" failure mode is ask #1's blocked lateral
 * half). The card says exactly that; the tray holds no `straight`, so the
 * stain-crossing line is not buildable in-game.
 *
 * This file also carries the SHARED garage authoring kit — the
 * `GarageLevel` data shape (the kitchen/bedroom/bathroom/garden seam with
 * the set id swapped) and `garageLevel`/`registerGarage`, mirrors of
 * `gardenLevel`/`registerGarden`. The placement math (`lay`, `kitchenRamp`,
 * `startSocketFromBuild`, `trayCount`, `wetPatchOverSeam`) is imported from
 * the family's kit — `wetPatchOverSeam` from `bathroom01.level.ts`, the
 * zone-centring convention every hazard rung uses.
 *
 * ONE deliberate deviation from the family pattern: the `prop:oilStain`
 * first-sight callout registers HERE, in the level module, because the set
 * module (`src/sets/garage/index.ts`, the Environment Artist's ratified
 * port) declares no `PROP_CALLOUTS` row — the STAIN row in the set DATA is
 * decoration and no callout line was ported with it. The bathroom/garden
 * precedent is registration in the set module; the session log carries the
 * ask to move this line there, and until it lands the rung's lesson must
 * still be in the help manifest, so the level registers it.
 */
import type { Build } from '../../track/build.ts';
import type { PieceKind, PieceParams } from '../../track/pieces.ts';
import type { Socket } from '../../track/socket.ts';
import type { Level } from '../level.ts';
import { PROP_CALLOUTS } from '../../ui/callouts.ts';
import {
  KITCHEN_GAP,
  kitchenRamp,
  lay,
  startSocketFromBuild,
  trayCount,
  type WetPatch,
} from './kitchen01.level.ts';
import { registerLevel } from './feeltrack.level.ts';
import { wetPatchOverSeam } from './bathroom01.level.ts';

// The hazard's first-sight line (see header: registered at the level until
// the set module carries it — the bathroom `prop:wetPatch` shape, one line).
PROP_CALLOUTS['prop:oilStain'] = 'Oil sheen halves grip — put your line around it, not through it.';

/** A garage level: the contract's `Level` plus the tray/fixture/parBuild
 *  metadata, exactly the kitchen/bedroom/bathroom/garden seam
 *  (Concepts/Levels §The data model). */
export interface GarageLevel extends Level {
  set: 'garage';
  /** What the player may place, per kind. The tray. Sum = `budget`. */
  tray: Partial<Record<PieceKind, number>>;
  /** Geometry for a tray kind the PAR line never places (the `levelTrayParams`
   *  seam — same rule as the rest of the family). */
  trayParams?: Partial<Record<PieceKind, PieceParams>>;
  /** The reference build — fixtures plus the designer's line. */
  parBuild(): Build;
  sandbox?: boolean;
  /** Pieces the level ships built-in. Not in the tray; part of parBuild. */
  fixtures?: Partial<Record<PieceKind, number>>;
  /** Live grip zones (the kitchen04 hook; par lines are grip-independent). */
  hazards?: readonly WetPatch[];
  /** Named prop sockets the Environment Artist builds to — the ratified
   *  variant C declares NONE (`SOCKETS = {}` in `src/sets/garage/data.ts`):
   *  the bike-wheel tunnel is a goal-line STORY, not a bore a piece can
   *  seat in (the bathroom drain convention; the tunnel ask is in the
   *  session log). */
  propSockets?: Record<string, Socket>;
}

/** Fill the contract fields from the tray (mirror of `gardenLevel`). */
export function garageLevel(
  def: Omit<GarageLevel, 'budget' | 'placeholderBuild' | 'par'> & {
    par: { time: number; pieces?: number };
    budget?: number;
  },
): GarageLevel {
  return {
    ...def,
    par: { pieces: def.par.pieces ?? trayCount(def.tray), time: def.par.time },
    budget: def.sandbox ? (def.budget ?? 999) : trayCount(def.tray),
    placeholderBuild: def.parBuild,
  };
}

/** Register on the shared level registry and keep the garage type. */
export function registerGarage(level: GarageLevel): GarageLevel {
  registerLevel(level);
  return level;
}

/** The start-ramp release convention, shared across the garage ladder
 *  (the feel rigs': 0.9 of the descending blend of `kitchenRamp`'s −12°). */
export const GAR_GEOM = {
  rampAngle: -12,
  rampBlend: 0.08,
  release: 0.9,
} as const;

/** ONE straight geometry across garage01..03: 0.2 m — the family ladder's
 *  seating, kept so every rung's tray seats one kind at one size. Rung 04
 *  is the deliberate exception and carries the 0.3 m whole-tray sweep
 *  geometry the capstone gate lives at (bathroom04/garden04's pattern). */
export const GAR_STRAIGHT = 0.2;

/** The tool-chest gap: the shared `KITCHEN_GAP` numbers are the garage
 *  ladder's drop too (the geometry economy the bedroom, bathroom and garden
 *  passes established — the rung lessons, not the hole, are the new thing). */
export const SHOP_GAP = KITCHEN_GAP;

export const GARAGE01_ID = 'garage01';

function parBuild(): Build {
  return lay(
    [
      { def: 'ramp', params: kitchenRamp(0.22) }, // the oil-drum shelf (fixture)
      { def: 'gapLip', params: SHOP_GAP.lip }, // tray: the launch over the stain
      { def: 'drop', params: SHOP_GAP.drop }, // tray: the gap span + catch
      { def: 'landing', params: SHOP_GAP.landing }, // tray: the clean run-out
      { def: 'finishCup' }, // fixture
    ],
    GARAGE01_ID,
    1,
  );
}

/** The hazard PROBE, not a player route (the kitchen04/bathroom01
 *  convention): two decks laid across the sink of the shop roll straight
 *  THROUGH the oil film — this is the build the hazard test replays wet vs
 *  dry (hash diverges, wet is fractionally FASTER: channel kinematics make
 *  "halved grip" on a straight LOW DRAG, [[Modules/hazards]]). The tray
 *  holds no `straight` at all, so the stain-crossing line is not buildable
 *  in-game — flying AROUND the film is the only line the tray affords.
 *  Exported as data so the tests can replay it. */
export function garage01ProbeBuild(): Build {
  return lay(
    [
      { def: 'ramp', params: kitchenRamp(0.22) },
      // 0.3 m decks (the bathroom01 probe's seating): the seam — and the
      // zone's x-range — must START past the `drop`'s sloped step, or the
      // par's own wheel crossing the step-top grazes the zone band.
      { def: 'straight', params: { length: 0.3 } },
      { def: 'straight', params: { length: 0.3 } },
      { def: 'finishCup' },
    ],
    GARAGE01_ID,
    1,
  );
}

export const GARAGE01: GarageLevel = registerGarage(
  garageLevel({
    id: GARAGE01_ID,
    name: 'The Stain',
    set: 'garage',
    seed: 1,
    startSocket: startSocketFromBuild(parBuild(), GAR_GEOM.release * GAR_GEOM.rampBlend),
    par: { time: 2.25 }, // measured on the par build (regenerate via `npm run pars`)
    maxTime: 12,
    // the tray IS the par line's multiset (3 = budget, all load-bearing);
    // no `straight` in the tray: the through-stain line stays a probe.
    tray: { gapLip: 1, drop: 1, landing: 1 },
    fixtures: { ramp: 1, finishCup: 1 },
    hazards: [wetPatchOverSeam(garage01ProbeBuild(), 2, 'shopStain', 'oilStain')],
    parBuild,
  }),
);

/** The zone-centring convention lives in ONE implementation
 *  (`wetPatchOverSeam`, `bathroom01.level.ts`); rungs 02–04 import it here
 *  so the garage ladder reads as one kit. */
export { wetPatchOverSeam };
