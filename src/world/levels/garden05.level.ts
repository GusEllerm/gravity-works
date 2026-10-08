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
 * it finishes at the par's hash for one wasted piece; mid-line it finishes
 * SLOW (the stage-6 brevity trim, below) — never the fast line.
 *
 * THE STAGE-6 BREVITY TRIM (playtest DD: "the 05 rungs stretch that same
 * verb… trim garden05/garage05 toward porch-level brevity"): the rung moves
 * to the ladder's fail-timing CHUTE (−29°/0.24 m — kitchen02/03's and the
 * porch's own release tool), which deletes the −12° ramp's ~1.7 s crawl:
 * the rail, the dips, the plank and the ORDER lesson's PAY side are
 * untouched, the clock goes 3.05 → 1.35 s (measured 1.342), and every
 * omission still falls — EARLIER (~1.1–1.5 s bands, the fail-timing law).
 * Three laws flip with the release and are re-stated as measured, not
 * papered: at chute speed the car CARRIES the two adjacent dips —
 * deck-first finishes ~0.03 s behind the par (porch05's own exception
 * idiom: an order that finishes must still be LATE to matter); the
 * two-plank mid bridge finishes slow, never fast; and the booster SPENT
 * AND THE LINE RIDDEN (the five-piece) overshoots the catch and falls —
 * the buy is a substitution for the far crossing, never an addition. The
 * promise law (every omission falls), the decoy's tail-hash law, the
 * EARLY/LATE booster law and the flown film all survive untouched.
 */
import type { Build } from '../../track/build.ts';
import { PIECE_KINDS, type PieceKind } from '../../track/pieces.ts';
import { KitRig, rampLevelForDrop } from '../../feel/kittrack.ts';
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
 *  ladder's step on the porch threshold's long lead, span 0.3566 m). The
 *  stage-6 brevity trim keeps the dip EXACTLY (same span law) and moves
 *  only the release; the run-out catch moves to a sink-SOFTER 21° face at
 *  the ladder's 0.18 m level — the face the chute's faster arrival holds
 *  (measured: the old 12° face lets the trimmed par overshoot the cup, and
 *  a 0.20/0.24 deck moves the anchored cup out of the booster line's
 *  reach — the 0.18 level keeps the booster law's chain geometry). */
export const ENCORE_DIP = { height: 0.12, angle: 45, radius: 0.02, lead: 0.11 };

/** The rung's PINNED chute (stage-6 brevity trim): −29° at the 0.24 m drop
 *  — the ladder's fail-timing tool (kitchen02/03, the porch chutes), tuned
 *  so the ridden double crossing still finishes (0.16 m `fell`, 0.26 m
 *  finished but bought no extra law). Par 1.342 s; the 0.12 blend is the
 *  fail-timing convention, so the release seam rides 0.9 of THAT blend. */
const GARD05_CHUTE_BLEND = 0.12;
function garden05Chute() {
  return { angle: -29, blend: GARD05_CHUTE_BLEND, level: rampLevelForDrop(0.24, -29, GARD05_CHUTE_BLEND, 0.9 * GARD05_CHUTE_BLEND) };
}

/** The trim's catch face: the sink-softer 21° landing at the ladder's
 *  0.18 m level (see `ENCORE_DIP`'s note) — ONE geometry, par, omissions
 *  and all. */
const ENCORE_CATCH = { level: 0.18, angle: 21, blend: 0.06 };

function parBuild(): Build {
  return lay(
    [
      { def: 'ramp', params: garden05Chute() }, // the fail-timing shelf (fixture) — the brevity trim
      { def: 'drop', params: ENCORE_DIP }, // tray: crossing ONE — ridden
      { def: 'straight', params: { length: GARD_STRAIGHT } }, // tray: the plank between
      { def: 'drop', params: ENCORE_DIP }, // tray: crossing TWO — ridden, under the far bars
      { def: 'landing', params: ENCORE_CATCH }, // tray: the run-out catch
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
      { def: 'ramp', params: garden05Chute() },
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
      { def: 'ramp', params: garden05Chute() },
      { def: 'booster' },
      { def: 'drop', params: ENCORE_DIP },
      { def: 'straight', params: { length: GARD_STRAIGHT } },
      { def: 'landing', params: ENCORE_CATCH },
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
    startSocket: startSocketFromBuild(parBuild(), GARD_GEOM.release * GARD05_CHUTE_BLEND),
    // measured on the par build (regenerate via `npm run pars`); the
    // stage-6 brevity trim moves the clock 3.05 → 1.35 (measured 1.342)
    par: { pieces: 4, time: 1.4 },
    maxTime: 12,
    tray: { drop: 2, straight: 2, landing: 1, booster: 1 },
    trayParams: { booster: {} },
    fixtures: { ramp: 1, finishCup: 1 },
    hazards: [sprinklerFilm()],
    parBuild,
  }),
);

// ---- the garden sandbox -----------------------------------------------------
//
// The set's no-budget room, mirroring `kitchen-sandbox` exactly: every piece
// unlocked (`sandbox: true`, budget 999 — "no budget" with the number the
// contract demands), NOT a campaign rung (invisible to `CAMPAIGN`, nobody's
// next, addressable by `?level=` like every off-ladder rig), and the
// reference build is one clean lap of the gap verbs at THIS ladder's own
// geometry: the 02-rung shelf (ramp 0.28), the ladder's single 0.2 m
// straight seating, the shared `KITCHEN_GAP`. Measured: 2.733 s.

export const GARDEN_SANDBOX_ID = 'garden-sandbox';

function sandboxBuild(): Build {
  return lay(
    [
      { def: 'ramp', params: kitchenRamp(0.28) }, // the shelf (fixture)
      { def: 'straight', params: { length: GARD_STRAIGHT } }, // the deck before the gap
      { def: 'gapLip', params: KITCHEN_GAP.lip }, // the launch
      { def: 'drop', params: KITCHEN_GAP.drop }, // the gap + catch
      { def: 'landing', params: KITCHEN_GAP.landing }, // the run-out
      { def: 'straight', params: { length: GARD_STRAIGHT } }, // ride to the cup
      { def: 'finishCup' }, // fixture
    ],
    GARDEN_SANDBOX_ID,
    1,
  );
}

const EVERY_PIECE = Object.fromEntries(PIECE_KINDS.map((kind: PieceKind) => [kind, 99]));

export const GARDEN_SANDBOX: GardenLevel = registerGarden(
  gardenLevel({
    id: GARDEN_SANDBOX_ID,
    name: 'Garden sandbox',
    set: 'garden',
    seed: 1,
    startSocket: startSocketFromBuild(sandboxBuild(), GARD_GEOM.release * GARD_GEOM.rampBlend),
    budget: 999, // no budget; the contract wants a number
    par: { pieces: 5, time: 2.75 }, // measured 2.733 s on the lap (regenerate via pars)
    maxTime: 20,
    sandbox: true,
    tray: EVERY_PIECE,
    fixtures: { ramp: 1, finishCup: 1 },
    parBuild: sandboxBuild,
  }),
);
