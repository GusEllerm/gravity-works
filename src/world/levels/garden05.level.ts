/**
 * GARDEN 05 — "Two Shadows" (the encore rung: the DOUBLE CROSSING, in the
 * eye).
 *
 * The garden's ladder taught the eye: find the line before the tray can.
 * The encore crosses the lane TWICE on one line — `drop → straight → drop
 * → landing` from the finale's height (ramp 0.26) — the rung's pinned
 * `ENCORE_DIP` (the ladder's 0.12 m step on the porch THRESHOLD's long
 * lead, span 0.3566 m, longer than a roll-off flies at this release)
 * making EVERY piece load-bearing: eleven one-, two- and three-piece
 * omissions FALL (pinned), the strongest promise-law claim the room has
 * ever shipped. The eye's work here is WHERE the two holes sit around the
 * plank: deck-first (`straight → drop → drop → landing`) never catches the
 * second sink, and the two dips adjacent strand the run-out — the ORDER is
 * the line. The sprinkler keeps its head on this rung too (the room's
 * verb since garden03): its sprawl lies IN the second crossing's mouth at
 * the waterline a bridged deck would roll, and the ridden dip carries the
 * wheel through that circle AIRBORNE — the par replays bit-identical wet
 * vs dry, and only the unbuyable bridge probe rolls the film and runs
 * wet-faster (garden03's low-drag law, flown).
 *
 * The tray adds the room's first TEMPTATION that is not a verb it just
 * taught: one `booster` beside the DECOY `straight`. Spent EARLY
 * (`garden05BoosterBuild`, exported) it buys the second crossing whole —
 * four pieces, a faster clock than the ride's, the garden's hidden line
 * (`porch03`'s bounce law). Spent LAST it is decoration at the par's own
 * clock and hash — kitchen05's rule re-derived in a room that never had
 * the piece. The decoy straight is the reach law either way: tail-placed
 * it finishes at the par's hash for one wasted piece, mid-line it
 * displaces the second sink and the run falls.
 */
import type { Build } from '../../track/build.ts';
import { KitRig } from '../../feel/kittrack.ts';
import {
  KITCHEN_GAP,
  kitchenRamp,
  lay,
  startSocketFromBuild,
  type WetPatch,
} from './kitchen01.level.ts';
import {
  GARD_GEOM,
  GARD_STRAIGHT,
  gardenLevel,
  registerGarden,
  type GardenLevel,
} from './garden01.level.ts';

export const GARDEN05_ID = 'garden05';

/** THE PINNED ENCORE DIP — see `bedroom05.level.ts` for the lineage (the
 *  ladder's step on the porch threshold's long lead, span 0.3566 m). */
export const ENCORE_DIP = { height: 0.12, angle: 45, radius: 0.02, lead: 0.11 };

function parBuild(): Build {
  return lay(
    [
      { def: 'ramp', params: kitchenRamp(0.26) }, // the finale's shelf (fixture)
      { def: 'drop', params: ENCORE_DIP }, // tray: crossing ONE — ridden
      { def: 'straight', params: { length: GARD_STRAIGHT } }, // tray: the plank between
      { def: 'drop', params: ENCORE_DIP }, // tray: crossing TWO — ridden, under the far bars
      { def: 'landing', params: KITCHEN_GAP.landing }, // tray: the run-out catch
      { def: 'finishCup' }, // fixture
    ],
    GARDEN05_ID,
    1,
  );
}

/** The hazard PROBE, not a player route (the garden03 convention): ride
 *  crossing one as the par does, then BRIDGE crossing two with two 0.3 m
 *  decks the tray cannot seat. Rolls through the sprawl: diverges wet,
 *  finishes, wet is FASTER (low drag, [[Modules/hazards]]). */
export function garden05ProbeBuild(): Build {
  return lay(
    [
      { def: 'ramp', params: kitchenRamp(0.26) },
      { def: 'drop', params: ENCORE_DIP },
      { def: 'straight', params: { length: 0.3 } },
      { def: 'straight', params: { length: 0.3 } },
      { def: 'landing', params: { level: 0.2, angle: 12, blend: 0.06 } },
      { def: 'finishCup' },
    ],
    GARDEN05_ID,
    1,
  );
}

/** THE BOOSTER LINE (exported, pinned): the EARLY spend buys the second
 *  crossing whole — 4 placed pieces, a faster clock than the ride's; the
 *  SAME piece spent LAST is decoration at the par's own hash. */
export function garden05BoosterBuild(): Build {
  return lay(
    [
      { def: 'ramp', params: kitchenRamp(0.26) },
      { def: 'booster' },
      { def: 'drop', params: ENCORE_DIP },
      { def: 'straight', params: { length: GARD_STRAIGHT } },
      { def: 'landing', params: KITCHEN_GAP.landing },
      { def: 'finishCup' },
    ],
    GARDEN05_ID,
    1,
  );
}

/** The sprinkler sprawl IN crossing two's mouth: dip TWO's mid-span at the
 *  waterline a bridged deck rolls (the bathroom01 seam law on a ridden
 *  dip, named for its head — garden03's law of honest zones). The par's
 *  wheel crosses the circle AIRBORNE — a ridden dip is a flight. */
function sprinklerFilm(): WetPatch {
  const rig = new KitRig(parBuild(), 1);
  const mouth = rig.frameAt(rig.starts[3] + 0.001).pos; // crossing two's entry seam
  const mid = rig.frameAt(rig.starts[3] + 0.25).pos; // mid-span of its mouth
  return {
    id: 'sprinklerFilm',
    kind: 'wetPatch',
    center: { x: mid.x, y: mouth.y + 0.017, z: 0 },
    radius: 0.1,
    gripFactor: 0.5,
    source: 'sprinkler',
  };
}

export const GARDEN05: GardenLevel = registerGarden(
  gardenLevel({
    id: GARDEN05_ID,
    name: 'Two Shadows',
    set: 'garden',
    seed: 1,
    startSocket: startSocketFromBuild(parBuild(), GARD_GEOM.release * GARD_GEOM.rampBlend),
    // measured on the par build (regenerate via `npm run pars`)
    par: { pieces: 4, time: 3.05 },
    maxTime: 12,
    tray: { drop: 2, straight: 2, landing: 1, booster: 1 },
    trayParams: { booster: {} },
    fixtures: { ramp: 1, finishCup: 1 },
    hazards: [sprinklerFilm()],
    parBuild,
  }),
);
