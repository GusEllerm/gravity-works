/**
 * BATHROOM 02 — "Rim or Drain" (the CHOICE rung: the lazy rim line vs the
 * showy straight into the tunnel mouth).
 *
 * The drain sink sits on the line and the tray offers both ways across it.
 * The LAZY line — the `drop`'s stepped catch between two tile `straight`s,
 * the deck dips and rolls — is the par, and it is the one the builder
 * anchors (measured, both mountings: `tests/unit/bathroom-levels.test.ts`).
 * The SHOWY line launches off the rim (`gapLip`) and drives the straight
 * toward the drain — the tunnel mouth of the concept note is STAGING (the
 * set's drain prop stands where a heroic line would land), not a bore: no
 * tunnel piece exists, and the kitchen bowl's blocked-rung honesty applies
 * (the drain is a plain anchor; nothing snaps to it — Concepts/Levels
 * §Props expose sockets). Same lesson shape kitchen02 taught with counter
 * decks, re-staged on tile: the fast line is the lazy one, and the tray
 * makes both buildable. The wet tile beside the sink is the rung's TELLS
 * (the set's films + ask #6), and neither line's deck enters the zone
 * band — this rung ships no live grip zone on purpose; grip returns as a
 * MECHANIC in 03's splash.
 *
 * `trayParams` carries `gapLip`/`landing`: the par (lazy) line never
 * places them, so without the declaration the two pieces the CHOICE exists
 * for would seat at kit defaults and build a different launch than the one
 * both lines were measured on (the stage-3 coherence rule).
 */
import type { Build } from '../../track/build.ts';
import {
  kitchenRamp,
  lay,
  startSocketFromBuild,
} from './kitchen01.level.ts';
import {
  BATH_GEOM,
  BATH_STRAIGHT,
  DRAIN_GAP,
  bathroomLevel,
  registerBathroom,
  type BathroomLevel,
} from './bathroom01.level.ts';

export const BATHROOM02_ID = 'bathroom02';

function parBuild(): Build {
  return lay(
    [
      { def: 'ramp', params: kitchenRamp(0.28) }, // the tiled shelf (fixture)
      { def: 'straight', params: { length: BATH_STRAIGHT } }, // tray: the rim deck
      { def: 'drop', params: DRAIN_GAP.drop }, // tray: THE DIP — the lazy catch over the sink
      { def: 'straight', params: { length: BATH_STRAIGHT } }, // tray: the dry run-out
      { def: 'finishCup' }, // fixture
    ],
    BATHROOM02_ID,
    1,
  );
}

/** The SHOWY line: launch off the rim edge and drive the straight at the
 *  drain. Kept as data so the test can prove it finishes (chained model)
 *  and which clock wins (it is not this one). */
export function bathroom02DrainBuild(): Build {
  return lay(
    [
      { def: 'ramp', params: kitchenRamp(0.28) },
      { def: 'straight', params: { length: BATH_STRAIGHT } }, // the rim deck, same seating
      { def: 'gapLip', params: DRAIN_GAP.lip }, // the launch toward the drain
      { def: 'drop', params: DRAIN_GAP.drop }, // the sink flown
      { def: 'landing', params: DRAIN_GAP.landing }, // the landing past the mouth
      { def: 'finishCup' },
    ],
    BATHROOM02_ID,
    1,
  );
}

export const BATHROOM02: BathroomLevel = registerBathroom(
  bathroomLevel({
    id: BATHROOM02_ID,
    name: 'Rim or Drain',
    set: 'bathroom',
    seed: 1,
    startSocket: startSocketFromBuild(parBuild(), BATH_GEOM.release * BATH_GEOM.rampBlend),
    // 3 of the 5 tray pieces are placed on the par (lazy) line — measured,
    // regenerate via `npm run pars`.
    par: { pieces: 3, time: 2.35 },
    maxTime: 12,
    tray: { straight: 2, gapLip: 1, drop: 1, landing: 1 },
    trayParams: { gapLip: DRAIN_GAP.lip, landing: DRAIN_GAP.landing },
    fixtures: { ramp: 1, finishCup: 1 },
    parBuild,
  }),
);
