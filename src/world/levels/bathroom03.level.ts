/**
 * BATHROOM 03 — "Tub Wall" (the TRADE-OFF: height over the wall, or the
 * splash-patch route).
 *
 * The tub wall is the tallest deck in the house and the line comes off it
 * with real air. The PAR takes the HIGH route: the hard `drop` catch onto
 * the dry tile deck — the same launch, the shorter, DRIER catch (4 of the
 * 5 tray pieces; the faster measured line, grip-neutral to the bit because
 * its wheels are never inside the splash band). The SPLASH route swaps the
 * `drop` for the long soft `landing` whose mouth sits low in the wet zone —
 * the catch rolls through the splash patch: it finishes (chained model,
 * ask #2b — against the ANCHORED cup it does not reach, and the card says
 * so), the wet replay DIVERGES from the dry, and the honest delta is the
 * low-drag one [[Modules/hazards]] measures on straights, not a slide-wide
 * failure the channel kinematics forbid. Height vs splash is the lesson;
 * both clocks and both hashes are in the test.
 *
 * The zone is centred on the SOFT line's own landing deck (the kitchen04
 * convention run backwards — here the wet deck IS an authored line, not a
 * probe: the par flies over that x with its hard catch BELOW the band, so
 * the par stays grip-independent while the splash line is legitimately
 * wet). The tray ⊇ par invariant holds: one 0.2 m `straight` geometry on
 * both lines, `trayParams` declares the `landing` the par never places.
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
  BATH_GEOM,
  BATH_STRAIGHT,
  DRAIN_GAP,
  bathroomLevel,
  registerBathroom,
  type BathroomLevel,
} from './bathroom01.level.ts';

export const BATHROOM03_ID = 'bathroom03';

/** The splash route's catcher: the longer, gentler landing whose deck
 *  dips into the wet zone — the piece the par line never places, declared
 *  in `trayParams` so it seats at this geometry (bedroom03's SOFT twin). */
const SPLASH_CATCH = { level: 0.32, angle: 12, blend: 0.06 };

function parBuild(): Build {
  return lay(
    [
      { def: 'ramp', params: kitchenRamp(0.3) }, // the tub wall top (fixture)
      { def: 'straight', params: { length: BATH_STRAIGHT } }, // tray: the rim deck
      { def: 'gapLip', params: DRAIN_GAP.lip }, // tray: the launch off the wall
      { def: 'drop', params: DRAIN_GAP.drop }, // tray: the HARD, DRY catch
      { def: 'straight', params: { length: BATH_STRAIGHT } }, // tray: the run-out
      { def: 'finishCup' }, // fixture
    ],
    BATHROOM03_ID,
    1,
  );
}

/** The SPLASH line: the same launch, the soft `landing` whose deck sits in
 *  the wet zone. Both lines finish in the chained model; the hard catch is
 *  the faster clock, and the soft line's hash is the wet one (asserted in
 *  `tests/unit/bathroom-levels.test.ts`). */
export function bathroom03SplashBuild(): Build {
  return lay(
    [
      { def: 'ramp', params: kitchenRamp(0.3) },
      { def: 'straight', params: { length: BATH_STRAIGHT } },
      { def: 'gapLip', params: DRAIN_GAP.lip },
      { def: 'landing', params: SPLASH_CATCH }, // the soft catch, low in the splash
      { def: 'straight', params: { length: BATH_STRAIGHT } },
      { def: 'finishCup' },
    ],
    BATHROOM03_ID,
    1,
  );
}

/** The splash patch: centred ON the soft line's landing deck (a wheel
 *  rolling the splash route is inside the band; the par's hard-catch deck
 *  crosses the same x 9+ cm BELOW the band, and its wheels are airborne
 *  over its first half — grip-neutral by measurement, pinned wet==dry by
 *  the ladder test). */
function splashPatch(): WetPatch {
  const build = bathroom03SplashBuild();
  const rig = new KitRig(build, 1);
  // deep on the soft catcher's own deck (piece 3: ramp, straight, gapLip,
  // landing) — 0.26 m in, past the PAR line's `drop` step-top: the first
  // draft's mid-entry centre let the par's wheel crossing the step graze
  // the band (measured par wet != dry, 2.642 vs 2.667), because both lines
  // share the launch; deep on the soft deck the par crosses only on its
  // LOW catch deck, 9+ cm under the band (pinned wet == dry by the test).
  const p = rig.frameAt(rig.starts[3]! + 0.26).pos;
  return {
    id: 'splashPatch',
    kind: 'wetPatch',
    center: { x: p.x, y: p.y, z: p.z },
    radius: 0.12,
    gripFactor: 0.5,
    source: 'tub',
  };
}

export const BATHROOM03: BathroomLevel = registerBathroom(
  bathroomLevel({
    id: BATHROOM03_ID,
    name: 'Tub Wall',
    set: 'bathroom',
    seed: 1,
    startSocket: startSocketFromBuild(parBuild(), BATH_GEOM.release * BATH_GEOM.rampBlend),
    // 4 of the 5 tray pieces are placed on the par (hard, dry) line —
    // measured, regenerate via `npm run pars`.
    par: { pieces: 4, time: 2.7 },
    maxTime: 12,
    tray: { straight: 2, gapLip: 1, drop: 1, landing: 1 },
    trayParams: { landing: SPLASH_CATCH },
    fixtures: { ramp: 1, finishCup: 1 },
    hazards: [splashPatch()],
    parBuild,
  }),
);
