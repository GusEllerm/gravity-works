/**
 * GARAGE 03 — "Wheel Tunnel" (the TRADE-OFF: the speed line the tunnel
 * forces, or the floor lane around the oil film — and the lane costs time).
 *
 * The ratified frame's goal line is the stood-up bike wheel dead-centre on
 * the straight ("the best prop read of the stage… should anchor the
 * garage's goal-line levels" — the AD's scoreboard), and a goal line is a
 * LINE, not a hole: the rung's lesson is that the tunnel FORCES the speed
 * line. The PAR takes it: launch off the mezzanine lip straight down the
 * corridor, the hard `drop` catch dry, the whole line aimed at the wheel —
 * grip-neutral to the bit because its wheels fly the oil band. The ALTERN-
 * ATE LANE is the floor route: the same launch into the long soft `landing`
 * whose deck sits low IN the oil film, rolling through the sheen. It finish-
 * es (chained model, ask #2b — against the ANCHORED cup it does not reach,
 * and the card says so), the wet replay DIVERGES from the dry, and the
 * honest delta is the low-drag one [[Modules/hazards]] measures on
 * straights — the film lane beats its own dry run yet STILL loses to the
 * speed line. Speed line vs lane, both clocks, both hashes: that is the
 * trade-off, measured, not asserted.
 *
 * THE TUNNEL THAT IS NOT: there is no bore a piece can seat in — variant C
 * declares no sockets (`SOCKETS = {}` in `src/sets/garage/data.ts`: "the
 * wheel tunnel is a goal-line STORY, not a bore"), so the ride THROUGH the
 * wheel is STAGING, the bathroom drain and garden bore pattern — the wheel
 * stands behind the corridor at every shipped mount (test-pinned from the
 * live set boxes), and a bore ride would need ask #4's prop-socket seating
 * plus a lane-crossing tunnel anchor (the session-log ask, ask #5's shape).
 * The RUNG is not blocked: both authored lines finish and the clocks are
 * the lesson.
 *
 * The zone is centred on the ALTERNATE lane's own landing deck (the
 * bathroom03 convention: here the wet deck IS an authored line, not a
 * probe — the par flies that x with its hard catch BELOW the band, so the
 * par stays grip-independent while the lane is legitimately wet). The
 * tray ⊇ par invariant holds: one 0.2 m `straight` geometry on both lines,
 * `trayParams` declares the `landing` the par never places.
 */
import type { Build } from '../../track/build.ts';
import { KitRig } from '../../feel/kittrack.ts';
import {
  kitchenRamp,
  lay,
  startSocketFromBuild,
  type WetPatch,
} from './kitchen01.level.ts';
import {
  GAR_GEOM,
  GAR_STRAIGHT,
  SHOP_GAP,
  garageLevel,
  registerGarage,
  type GarageLevel,
} from './garage01.level.ts';

export const GARAGE03_ID = 'garage03';

/** The lane's catcher: the longer, gentler landing whose deck dips into
 *  the oil band — the piece the par line never places, declared in
 *  `trayParams` so it seats at this geometry (bathroom03's SPLASH twin). */
const LANE_CATCH = { level: 0.32, angle: 12, blend: 0.06 };

function parBuild(): Build {
  return lay(
    [
      { def: 'ramp', params: kitchenRamp(0.3) }, // the mezzanine top (fixture)
      { def: 'straight', params: { length: GAR_STRAIGHT } }, // tray: the bench deck
      { def: 'gapLip', params: SHOP_GAP.lip }, // tray: the launch down the straight
      { def: 'drop', params: SHOP_GAP.drop }, // tray: the HARD, DRY catch — the speed line
      { def: 'straight', params: { length: GAR_STRAIGHT } }, // tray: the run-out at the wheel
      { def: 'finishCup' }, // fixture
    ],
    GARAGE03_ID,
    1,
  );
}

/** The LANE: the same launch, the soft `landing` whose deck sits in the
 *  oil film. Both lines finish in the chained model; the speed line is the
 *  faster clock, and the lane's hash is the wet one (asserted in
 *  `tests/unit/garage-levels.test.ts`). */
export function garage03OilLaneBuild(): Build {
  return lay(
    [
      { def: 'ramp', params: kitchenRamp(0.3) },
      { def: 'straight', params: { length: GAR_STRAIGHT } },
      { def: 'gapLip', params: SHOP_GAP.lip },
      { def: 'landing', params: LANE_CATCH }, // the soft catch, low in the film
      { def: 'straight', params: { length: GAR_STRAIGHT } },
      { def: 'finishCup' },
    ],
    GARAGE03_ID,
    1,
  );
}

/** The oil film under the lane: centred ON the alternate line's landing
 *  deck, DEEP on its own deck (bathroom03's fix — the first draft's mid-
 *  entry centre let the par's `drop` step-top graze the band, because both
 *  lines share the launch). Deep on the soft deck, the par crosses only on
 *  its LOW catch deck, below the band — grip-neutral by measurement,
 *  pinned wet == dry by the ladder test. */
function oilFilm(): WetPatch {
  const build = garage03OilLaneBuild();
  const rig = new KitRig(build, 1);
  // deep on the soft catcher's own deck (piece 3: ramp, straight, gapLip,
  // landing) — 0.26 m in, past the PAR line's `drop` step-top.
  const p = rig.frameAt(rig.starts[3]! + 0.26).pos;
  return {
    id: 'oilFilm',
    kind: 'wetPatch',
    center: { x: p.x, y: p.y, z: p.z },
    radius: 0.12,
    gripFactor: 0.5,
    source: 'oilStain',
  };
}

export const GARAGE03: GarageLevel = registerGarage(
  garageLevel({
    id: GARAGE03_ID,
    name: 'Wheel Tunnel',
    set: 'garage',
    seed: 1,
    startSocket: startSocketFromBuild(parBuild(), GAR_GEOM.release * GAR_GEOM.rampBlend),
    // 4 of the 5 tray pieces are placed on the par (speed) line — measured,
    // regenerate via `npm run pars`.
    par: { pieces: 4, time: 2.7 },
    maxTime: 12,
    tray: { straight: 2, gapLip: 1, drop: 1, landing: 1 },
    trayParams: { landing: LANE_CATCH },
    fixtures: { ramp: 1, finishCup: 1 },
    hazards: [oilFilm()],
    parBuild,
  }),
);
