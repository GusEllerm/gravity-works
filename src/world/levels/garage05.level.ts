/**
 * GARAGE 05 — "Spill Course" (the encore rung: the DOUBLE CROSSING, at speed).
 *
 * The garage's ladder crossed one floor cut per rung. The encore crosses
 * the shop lane TWICE on one line — `drop → straight → drop → landing`
 * from the FINALE's height (ramp 0.26) — on the rung's pinned
 * `ENCORE_DIP` (the ladder's 0.12 m step on the porch THRESHOLD's long
 * lead, span 0.3566 m, longer than a roll-off flies at this release), so
 * EVERY piece is load-bearing: eleven one-, two- and three-piece
 * omissions FALL (pinned), the strongest promise-law claim the room has
 * ever shipped. The oil lives IN the second cut's mouth at the waterline a
 * bridged deck would roll — the ridden dip carries the wheel through that
 * x AIRBORNE, so the par replays bit-identical wet vs dry (pinned), while
 * the decked PROBE (0.3 m spans the tray cannot seat) rolls through the
 * film and runs wet-FASTER: the honest low-drag delta, garage02's and
 * bathroom01's law moved onto the ride. The toll is theoretical exactly as
 * garage02's is — the through-build is not buyable at the tray's ONE
 * straight geometry.
 *
 * This is the garage's own idiom, not a transplant: the room's voice is
 * SPEED (garage01's dyno release, garage03's oil lane), and the encore
 * sells it at its counter. The tray is par's four + a DECOY `straight` +
 * a TEMPTATION `booster`, and the shop sells the speed BOTH ways: spent
 * EARLY (`garage05BoosterBuild`, exported) the booster buys the second
 * crossing whole — 4 placed pieces, faster than the ride's clock, the
 * pinned hidden line (`porch03`'s bounce law); spent LAST it is trim at
 * the par's own clock and hash — kitchen05's rule, quoted in the room
 * that taught the verb. Buy it late and you paid for nothing; buy it
 * early and the second dip is a crossing you never had to catch.
 *
 * THE STAGE-6 BREVITY TRIM (playtest DD: "the 05 rungs stretch that same
 * verb… trim garden05/garage05 toward porch-level brevity"): the rung moves
 * to the ladder's fail-timing CHUTE (−29°/0.24 m — kitchen02/03's and the
 * porch's own release tool), which deletes the −12° ramp's ~1.7 s crawl:
 * the rail, the dips, the plank and the SPEED voice are untouched, the
 * clock goes 3.05 → 1.40 s (measured 1.358), and every omission still
 * falls — EARLIER (1.07–1.45 s bands, the fail-timing law). Two ORDER laws
 * flip with the release and are re-stated as measured, not papered: at
 * chute speed the car CARRIES the two adjacent cuts — deck-first now
 * finishes at the PAR+0.05 clock (porch05's own exception idiom: an order
 * that finishes must still be LATE to matter) — and the two-plank mid
 * bridge finishes slow, never fast. The promise law (every omission
 * falls), the decoy's tail law, the booster law and the flown film all
 * survive the trim untouched.
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
  GAR_GEOM,
  GAR_STRAIGHT,
  garageLevel,
  registerGarage,
  type GarageLevel,
} from './garage01.level.ts';

export const GARAGE05_ID = 'garage05';

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
const GAR05_CHUTE_BLEND = 0.12;
function garage05Chute() {
  return { angle: -29, blend: GAR05_CHUTE_BLEND, level: rampLevelForDrop(0.24, -29, GAR05_CHUTE_BLEND, 0.9 * GAR05_CHUTE_BLEND) };
}

/** The trim's catch face: the sink-softer 21° landing at the ladder's
 *  0.18 m level (see `ENCORE_DIP`'s note) — ONE geometry, par, omissions
 *  and all. */
const ENCORE_CATCH = { level: 0.18, angle: 21, blend: 0.06 };

function parBuild(): Build {
  return lay(
    [
      { def: 'ramp', params: garage05Chute() }, // the fail-timing shelf (fixture) — the brevity trim
      { def: 'drop', params: ENCORE_DIP }, // tray: floor cut ONE — ridden
      { def: 'straight', params: { length: GAR_STRAIGHT } }, // tray: the plate between
      { def: 'drop', params: ENCORE_DIP }, // tray: floor cut TWO — ridden, the film lies in its mouth
      { def: 'landing', params: ENCORE_CATCH }, // tray: the run-out catch
      { def: 'finishCup' }, // fixture
    ],
    GARAGE05_ID,
    1,
  );
}

/** The hazard PROBE, not a player route (the garage02 convention): ride
 *  cut one as the par does, then BRIDGE cut two with two 0.3 m decks the
 *  tray cannot seat — the decked version of crossing two. Rolls through
 *  the film: diverges wet, finishes, and wet is FASTER (low drag,
 *  [[Modules/hazards]]). */
export function garage05ProbeBuild(): Build {
  return lay(
    [
      { def: 'ramp', params: garage05Chute() },
      { def: 'drop', params: ENCORE_DIP },
      { def: 'straight', params: { length: 0.3 } },
      { def: 'straight', params: { length: 0.3 } },
      { def: 'landing', params: { level: 0.2, angle: 12, blend: 0.06 } },
      { def: 'finishCup' },
    ],
    GARAGE05_ID,
    1,
  );
}

/** THE BOOSTER LINE (exported, pinned): the EARLY spend buys the second
 *  crossing whole — 4 placed pieces, a faster clock than the ride's; the
 *  SAME piece spent LAST is decoration at the par's own hash. */
export function garage05BoosterBuild(): Build {
  return lay(
    [
      { def: 'ramp', params: garage05Chute() },
      { def: 'booster' },
      { def: 'drop', params: ENCORE_DIP },
      { def: 'straight', params: { length: GAR_STRAIGHT } },
      { def: 'landing', params: ENCORE_CATCH },
      { def: 'finishCup' },
    ],
    GARAGE05_ID,
    1,
  );
}

/** The film IN cut two's mouth: centred on dip TWO's mid-span at the
 *  waterline a decked bridge rolls (the bathroom01 seam law, applied to
 *  the ridden dip). The par's wheels cross the circle airborne — no
 *  aligned contact — and the probe's roll through it (the ladder test). */
function shopFilm(): WetPatch {
  const rig = new KitRig(parBuild(), 1);
  const mouth = rig.frameAt(rig.starts[3] + 0.001).pos; // cut two's entry seam
  const mid = rig.frameAt(rig.starts[3] + 0.25).pos; // mid-span of its hole
  return {
    id: 'shopFilm',
    kind: 'wetPatch',
    center: { x: mid.x, y: mouth.y + 0.017, z: 0 },
    radius: 0.1,
    gripFactor: 0.5,
    source: 'oilStain',
  };
}

export const GARAGE05: GarageLevel = registerGarage(
  garageLevel({
    id: GARAGE05_ID,
    name: 'Spill Course',
    set: 'garage',
    seed: 1,
    startSocket: startSocketFromBuild(parBuild(), GAR_GEOM.release * GAR05_CHUTE_BLEND),
    // measured on the par build (regenerate via `npm run pars`); the
    // stage-6 brevity trim moves the clock 3.05 → 1.35 (measured 1.342)
    par: { pieces: 4, time: 1.4 },
    maxTime: 12,
    tray: { drop: 2, straight: 2, landing: 1, booster: 1 },
    trayParams: { booster: {} },
    fixtures: { ramp: 1, finishCup: 1 },
    hazards: [shopFilm()],
    parBuild,
  }),
);

// ---- the garage sandbox -----------------------------------------------------
//
// The set's no-budget room, mirroring `kitchen-sandbox` exactly: every piece
// unlocked (`sandbox: true`, budget 999 — "no budget" with the number the
// contract demands), NOT a campaign rung (invisible to `CAMPAIGN`, nobody's
// next, addressable by `?level=` like every off-ladder rig), and the
// reference build is one clean lap of the gap verbs at THIS ladder's own
// geometry: the 02-rung shelf (ramp 0.28), the ladder's single 0.2 m
// straight seating, the shared `KITCHEN_GAP`. Measured: 2.733 s.

export const GARAGE_SANDBOX_ID = 'garage-sandbox';

function sandboxBuild(): Build {
  return lay(
    [
      { def: 'ramp', params: kitchenRamp(0.28) }, // the shelf (fixture)
      { def: 'straight', params: { length: GAR_STRAIGHT } }, // the deck before the gap
      { def: 'gapLip', params: KITCHEN_GAP.lip }, // the launch
      { def: 'drop', params: KITCHEN_GAP.drop }, // the gap + catch
      { def: 'landing', params: KITCHEN_GAP.landing }, // the run-out
      { def: 'straight', params: { length: GAR_STRAIGHT } }, // ride to the cup
      { def: 'finishCup' }, // fixture
    ],
    GARAGE_SANDBOX_ID,
    1,
  );
}

const EVERY_PIECE = Object.fromEntries(PIECE_KINDS.map((kind: PieceKind) => [kind, 99]));

export const GARAGE_SANDBOX: GarageLevel = registerGarage(
  garageLevel({
    id: GARAGE_SANDBOX_ID,
    name: 'Garage sandbox',
    set: 'garage',
    seed: 1,
    startSocket: startSocketFromBuild(sandboxBuild(), GAR_GEOM.release * GAR_GEOM.rampBlend),
    budget: 999, // no budget; the contract wants a number
    par: { pieces: 5, time: 2.75 }, // measured 2.733 s on the lap (regenerate via pars)
    maxTime: 20,
    sandbox: true,
    tray: EVERY_PIECE,
    fixtures: { ramp: 1, finishCup: 1 },
    parBuild: sandboxBuild,
  }),
);
