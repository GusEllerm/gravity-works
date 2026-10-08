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
  GAR_GEOM,
  GAR_STRAIGHT,
  garageLevel,
  registerGarage,
  type GarageLevel,
} from './garage01.level.ts';

export const GARAGE05_ID = 'garage05';

/** THE PINNED ENCORE DIP — see `bedroom05.level.ts` for the lineage (the
 *  ladder's step on the porch threshold's long lead, span 0.3566 m). */
export const ENCORE_DIP = { height: 0.12, angle: 45, radius: 0.02, lead: 0.11 };

function parBuild(): Build {
  return lay(
    [
      { def: 'ramp', params: kitchenRamp(0.26) }, // the finale's shelf (fixture)
      { def: 'drop', params: ENCORE_DIP }, // tray: floor cut ONE — ridden
      { def: 'straight', params: { length: GAR_STRAIGHT } }, // tray: the plate between
      { def: 'drop', params: ENCORE_DIP }, // tray: floor cut TWO — ridden, the film lies in its mouth
      { def: 'landing', params: KITCHEN_GAP.landing }, // tray: the run-out catch
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
      { def: 'ramp', params: kitchenRamp(0.26) },
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
      { def: 'ramp', params: kitchenRamp(0.26) },
      { def: 'booster' },
      { def: 'drop', params: ENCORE_DIP },
      { def: 'straight', params: { length: GAR_STRAIGHT } },
      { def: 'landing', params: KITCHEN_GAP.landing },
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
    startSocket: startSocketFromBuild(parBuild(), GAR_GEOM.release * GAR_GEOM.rampBlend),
    // measured on the par build (regenerate via `npm run pars`)
    par: { pieces: 4, time: 3.05 },
    maxTime: 12,
    tray: { drop: 2, straight: 2, landing: 1, booster: 1 },
    trayParams: { booster: {} },
    fixtures: { ramp: 1, finishCup: 1 },
    hazards: [shopFilm()],
    parBuild,
  }),
);
