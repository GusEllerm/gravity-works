/**
 * BATHROOM 01 — "The Drip" (the set's first rung: the wet patch enters).
 *
 * The bathroom ladder opens the way the kitchen ladder's hazard rung ended:
 * the porcelain floor is wet beside the drain sink, and a wet patch HALVES
 * GRIP (`gripFactor: 0.5`, the same live zone hook kitchen04 proved —
 * [[Modules/hazards]]). The lesson this rung adds over L04 is the bathroom
 * concept's own sentence — a wet patch is RIDDEN AROUND, not THROUGH: the
 * fast line never has a wheel in the puddle. The par line is the kitchen
 * L01's proven three-piece flight over the sink (launch, catch, roll-out),
 * it FLIES the patch, and it replays BIT-IDENTICAL wet vs dry (grip-
 * independence by construction — airborne wheels report no contact). The
 * THROUGH line is the hazard PROBE, not a route: two decks laid across the
 * sink roll straight through the puddle, the hash diverges, and the wet run
 * is the honest low-drag number the L04 pass measured ([[Modules/hazards]]
 * §What grip actually scales — on channel straights "grip loss" shows up as
 * LOW DRAG and the patch-edge drag yaw, and the "slides wide" failure mode
 * is ask #1's blocked lateral half). The card states exactly that; the rung
 * does not pretend at a force the solver does not have.
 *
 * This file also carries the SHARED bathroom authoring kit — the
 * `BathroomLevel` data shape (the kitchen/bedroom seam with the set id
 * swapped) and `bathroomLevel`/`registerBathroom`, mirrors of
 * `kitchenLevel`/`registerBedroom`. The placement math (`lay`, `kitchenRamp`,
 * `startSocketFromBuild`, `trayCount`) is imported from
 * `kitchen01.level.ts` — the family's kit, as the bedroom file says of it.
 * The one bathroom addition is `wetPatchOverSeam`: the hazard-zone centre
 * derived from a build's own deck seam (the kitchen04 convention — a zone
 * is centred where a DECKED line would roll, so the par line's flight
 * cannot touch it), used by all four rungs.
 */
import type { Build } from '../../track/build.ts';
import type { PieceKind, PieceParams } from '../../track/pieces.ts';
import type { Socket } from '../../track/socket.ts';
import type { Level } from '../level.ts';
import { KitRig } from '../../feel/kittrack.ts';
import { registerLevel } from './feeltrack.level.ts';
import {
  KITCHEN_GAP,
  kitchenRamp,
  lay,
  startSocketFromBuild,
  trayCount,
  type WetPatch,
} from './kitchen01.level.ts';

/** A bathroom level: the contract's `Level` plus the tray/fixture/parBuild
 *  metadata, exactly the kitchen/bedroom seam (Concepts/Levels §The data
 *  model). */
export interface BathroomLevel extends Level {
  set: 'bathroom';
  /** What the player may place, per kind. The tray. Sum = `budget`. */
  tray: Partial<Record<PieceKind, number>>;
  /** Geometry for a tray kind the PAR line never places (the `levelTrayParams`
   *  seam — same rule as the kitchen/bedroom). */
  trayParams?: Partial<Record<PieceKind, PieceParams>>;
  /** The reference build — fixtures plus the designer's line. */
  parBuild(): Build;
  sandbox?: boolean;
  /** Pieces the level ships built-in. Not in the tray; part of parBuild. */
  fixtures?: Partial<Record<PieceKind, number>>;
  /** Live grip zones (the kitchen04 hook; par lines are grip-independent). */
  hazards?: readonly WetPatch[];
  /** Named prop sockets the Environment Artist builds to (variant A: none). */
  propSockets?: Record<string, Socket>;
}

/** Fill the contract fields from the tray (mirror of `kitchenLevel`). */
export function bathroomLevel(
  def: Omit<BathroomLevel, 'budget' | 'placeholderBuild' | 'par'> & {
    par: { time: number; pieces?: number };
    budget?: number;
  },
): BathroomLevel {
  return {
    ...def,
    par: { pieces: def.par.pieces ?? trayCount(def.tray), time: def.par.time },
    budget: def.sandbox ? (def.budget ?? 999) : trayCount(def.tray),
    placeholderBuild: def.parBuild,
  };
}

/** Register on the shared level registry and keep the bathroom type. */
export function registerBathroom(level: BathroomLevel): BathroomLevel {
  registerLevel(level);
  return level;
}

/** The start-ramp release convention, shared across the bathroom ladder
 *  (the feel rigs': 0.9 of the descending blend of `kitchenRamp`'s −12°). */
export const BATH_GEOM = {
  rampAngle: -12,
  rampBlend: 0.08,
  release: 0.9,
} as const;

/** ONE straight geometry across bathroom01..03: 0.2 m — the bedroom
 *  ladder's seating, kept so every rung's tray seats one kind at one size.
 *  Rung 04 is the deliberate exception and carries the 0.3 m whole-tray
 *  sweep geometry the kitchen L04 pass proved (see its file). */
export const BATH_STRAIGHT = 0.2;

/** The drain sink: the shared `KITCHEN_GAP` numbers are the bathroom
 *  ladder's drop too (the geometry economy the bedroom pass established —
 *  the rung lessons, not the hole, are the new thing). */
export const DRAIN_GAP = KITCHEN_GAP;

/** A wet patch centred on a build's own deck seam (the kitchen04
 *  convention, Concepts/Levels §Hazards as data): piece `index`'s ENTRY
 *  frame is a point a DECKED line rolls over, so centring the zone there
 *  keeps the par line's FLIGHT over the puddle grip-neutral by construction
 *  (airborne wheels report no aligned contact). The set's porcelain floor
 *  sits 5 mm below that deck at every bathroom mount, so the film TELLS lie
 *  a hand's width in front of the zone — ask #6 (the lane-crossing
 *  wetPatch anchor) lines the two up exactly. */
export function wetPatchOverSeam(
  build: Build,
  index: number,
  id: string,
  source: string,
  radius = 0.14,
  gripFactor = 0.5,
): WetPatch {
  const rig = new KitRig(build, 1);
  const p = rig.frameAt(rig.starts[index]!).pos;
  return {
    id,
    kind: 'wetPatch',
    center: { x: p.x, y: p.y, z: p.z },
    radius,
    gripFactor,
    source,
  };
}

export const BATHROOM01_ID = 'bathroom01';

function parBuild(): Build {
  return lay(
    [
      { def: 'ramp', params: kitchenRamp(0.22) }, // the toilet-lid shelf (fixture)
      { def: 'gapLip', params: DRAIN_GAP.lip }, // tray: the launch over the puddle
      { def: 'drop', params: DRAIN_GAP.drop }, // tray: the drain sink's span
      { def: 'landing', params: DRAIN_GAP.landing }, // tray: the dry run-out
      { def: 'finishCup' }, // fixture
    ],
    BATHROOM01_ID,
    1,
  );
}

/** The hazard PROBE, not a player route (the kitchen04 lesson, stated the
 *  same way): two decks laid OVER the sink roll straight THROUGH the wet
 *  patch — this is the build the hazard test replays wet vs dry (hash
 *  diverges, wet is fractionally FASTER: channel kinematics make "halved
 *  grip" on a straight LOW DRAG, [[Modules/hazards]]). The tray holds no
 *  `straight` at all, so the puddle-crossing line is not buildable in-game
 *  — riding AROUND (flying) the patch is the only line the tray affords.
 *  Exported as data so the tests can replay it. */
export function bathroom01ProbeBuild(): Build {
  return lay(
    [
      { def: 'ramp', params: kitchenRamp(0.22) },
      // 0.3 m decks (the kitchen04 probe's seating): the seam — and the
      // zone's x-range — must START past the `drop`'s sloped step, or the
      // par's own wheel crossing the step-top grazes the zone band (the
      // first draft's 0.25 decks did exactly that; measured par wet != dry
      // 2.208 vs 2.233, fixed to bit-identity at 0.3).
      { def: 'straight', params: { length: 0.3 } },
      { def: 'straight', params: { length: 0.3 } },
      { def: 'finishCup' },
    ],
    BATHROOM01_ID,
    1,
  );
}

export const BATHROOM01: BathroomLevel = registerBathroom(
  bathroomLevel({
    id: BATHROOM01_ID,
    name: 'The Drip',
    set: 'bathroom',
    seed: 1,
    startSocket: startSocketFromBuild(parBuild(), BATH_GEOM.release * BATH_GEOM.rampBlend),
    par: { time: 2.25 }, // measured on the par build (regenerate via `npm run pars`)
    maxTime: 12,
    // the tray IS the par line's multiset (3 = budget, all load-bearing);
    // no `straight` in the tray: the through-puddle line stays a probe.
    tray: { gapLip: 1, drop: 1, landing: 1 },
    fixtures: { ramp: 1, finishCup: 1 },
    hazards: [wetPatchOverSeam(bathroom01ProbeBuild(), 2, 'drainSplash', 'tubRim')],
    parBuild,
  }),
);
