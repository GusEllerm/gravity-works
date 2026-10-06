/**
 * GARAGE 02 — "Mezzanine" (the CHOICE rung: the workbench line vs the
 * floor line — the AD's ported variant-B beat as a level idea).
 *
 * The garage's second stage is the workbench: the round-2 verdict dropped
 * the bench top INTO frame as furniture and explicitly ported variant B's
 * mezzanine beat — "the best level idea in the exploration" — into the
 * ratified geometry, and this rung spends it on a REAL trade-off: the
 * tray offers both ways across the same run. The HIGH line — the workbench
 * deck, three `straight`s, the wheels never leave the bench shelf — is the
 * par and (measured) the FAST one: pure rolling, no catch to bleed speed,
 * exactly the bedroom02 plateau lesson re-staged on the bench top. The
 * FLOOR line drops off the bench edge (the `drop` catch), catches soft on
 * the `landing` and runs the garage floor on the last deck — it finishes
 * too (chained model), and the catch costs it time. Both lines live in the
 * tray (5 pieces, none spare — the union of the two routes), and the
 * card's honesty is the family's: against the ANCHORED cup (ask #2b) only
 * the high line reliably reaches, which the test pins as measured.
 *
 * In the ROOM the line choice reads as height: mounted under the run, the
 * high deck crosses the workbench line of the ratified frame and the low
 * deck runs the floor past the tipped bucket and the toolbox — the
 * mezzanine is staging made legible, never a fake verb (the AD's own
 * carry-forward rule this ladder keeps obeying).
 *
 * `trayParams` carries `drop`/`landing`: the par (high) line never places
 * them, so without the declaration the two pieces the CHOICE exists for
 * would seat at kit defaults and build a different descent than the one
 * both lines were measured on (the stage-3 coherence rule, Concepts/Levels
 * §The tray ⊇ parBuild rule — the "from the first par placement" default
 * can only see pieces the par actually places).
 */
import type { Build } from '../../track/build.ts';
import {
  kitchenRamp,
  lay,
  startSocketFromBuild,
} from './kitchen01.level.ts';
import {
  GAR_GEOM,
  GAR_STRAIGHT,
  SHOP_GAP,
  garageLevel,
  registerGarage,
  type GarageLevel,
} from './garage01.level.ts';

export const GARAGE02_ID = 'garage02';

/** The floor line's catcher: the kitchen gap's proven soft catch (level
 *  0.24, 12°) — the bench-to-floor pillow, staged. */
const FLOOR_CATCH = SHOP_GAP.landing;

function parBuild(): Build {
  return lay(
    [
      { def: 'ramp', params: kitchenRamp(0.28) }, // up to the workbench shelf (fixture)
      { def: 'straight', params: { length: GAR_STRAIGHT } }, // tray: the bench deck
      { def: 'straight', params: { length: GAR_STRAIGHT } }, // tray: the bench deck
      { def: 'straight', params: { length: GAR_STRAIGHT } }, // tray: to the cup, still high
      { def: 'finishCup' }, // fixture
    ],
    GARAGE02_ID,
    1,
  );
}

/** The FLOOR line: drop off the bench edge, catch soft, run the garage
 *  floor. Kept as data so the test can prove both lines finish (chained) —
 *  and which clock wins (it is not this one). */
export function garage02FloorBuild(): Build {
  return lay(
    [
      { def: 'ramp', params: kitchenRamp(0.28) },
      { def: 'straight', params: { length: GAR_STRAIGHT } }, // the bench deck, same seating
      { def: 'drop', params: SHOP_GAP.drop }, // off the bench edge
      { def: 'landing', params: FLOOR_CATCH }, // the soft catch at floor level
      { def: 'straight', params: { length: GAR_STRAIGHT } }, // the floor run
      { def: 'finishCup' },
    ],
    GARAGE02_ID,
    1,
  );
}

export const GARAGE02: GarageLevel = registerGarage(
  garageLevel({
    id: GARAGE02_ID,
    name: 'Mezzanine',
    set: 'garage',
    seed: 1,
    startSocket: startSocketFromBuild(parBuild(), GAR_GEOM.release * GAR_GEOM.rampBlend),
    // 3 of the 5 tray pieces are placed on the par (high) line — measured,
    // regenerate via `npm run pars`.
    par: { pieces: 3, time: 2.4 },
    maxTime: 12,
    tray: { straight: 3, drop: 1, landing: 1 },
    trayParams: { drop: SHOP_GAP.drop, landing: FLOOR_CATCH },
    fixtures: { ramp: 1, finishCup: 1 },
    parBuild,
  }),
);
