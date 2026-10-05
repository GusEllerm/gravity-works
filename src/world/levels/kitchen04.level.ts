/**
 * KITCHEN 04 — "The Tap" (the set's hazard enters).
 *
 * The dripping tap wets a patch of counter, and the patch HALVES GRIP. As
 * data that is this level's `hazards` entry (a `WetPatch`: centre, radius,
 * `gripFactor: 0.5`) — since stage 3 the `World` DOES read zones, through
 * `src/world/hazards.ts` (the ask to the Feel Engineer, one per-contact
 * grip region hook, delivered). What the LEVEL
 * already does with the convention is the design: the par line FLIES the sink
 * and lands past the wet patch, so the par build is grip-independent and
 * provably finishes today; the ground line decks straight over the sink with
 * two loose straights and drives through the patch — it finishes today (dry),
 * and once the zone hook exists it becomes the level's speed-management
 * question. Affordance before hazard, per the progression rule: the tap
 * drips visibly upstream of the patch at all five canonical cameras.
 */
import { KitRig } from '../../feel/kittrack.ts';
import type { Build } from '../../track/build.ts';
import {
  KITCHEN_GAP,
  KITCHEN_GEOM,
  kitchenRamp,
  lay,
  registerKitchen,
  kitchenLevel,
  startSocketFromBuild,
  type KitchenLevel,
  type WetPatch,
} from './kitchen01.level.ts';

export const KITCHEN04_ID = 'kitchen04';

/** ONE straight geometry for the level: 0.3 m, the size the GROUND line has
 *  always decked the sink with. The par line used to chain a 0.35 straight —
 *  a second geometry for a kind the tray holds twice — and the tray carries
 *  one geometry per kind (`levelTrayParams` → the builder's held piece), so
 *  the par line was not placeable: the player's third straight was the ground
 *  line's 0.3 and the run-out came up 5 cm shorter than the par. The par
 *  straight is now the ground line's number instead of the other way round,
 *  deliberately: `wetPatch()` centres the zone on the GROUND build's seam,
 *  so leaving that build byte-identical leaves the patch, the tap's yaw and
 *  the par's grip-independence claim (par wet == par dry, bit-for-bit —
 *  `tests/unit/hazards.test.ts`) exactly where the stage-3 fix put them.
 *  Measured: par finishes 2.517 s, wet hash == dry hash; ground line 2.292 s
 *  wet, unchanged bytes. */
const L04_STRAIGHT = 0.3;

/** Piece indices in the par chain (for the wet-patch placement maths). */

function parBuild(): Build {
  return lay(
    [
      { def: 'ramp', params: kitchenRamp(0.26) }, // the books (fixture)
      { def: 'gapLip', params: KITCHEN_GAP.lip }, // tray: the sink's edge
      { def: 'drop', params: KITCHEN_GAP.drop }, // tray: the sink
      { def: 'landing', params: KITCHEN_GAP.landing }, // tray
      { def: 'straight', params: { length: L04_STRAIGHT } }, // tray: past the wet
      { def: 'finishCup' }, // fixture
    ],
    KITCHEN04_ID,
    1,
  );
}

/** The ground line: two straights deck the sink and drive through the patch.
 *  Exported as data so the test can prove it is a real second route. */
export function kitchen04GroundBuild(): Build {
  return lay(
    [
      { def: 'ramp', params: kitchenRamp(0.26) },
      { def: 'straight', params: { length: L04_STRAIGHT } },
      { def: 'straight', params: { length: L04_STRAIGHT } },
      { def: 'finishCup' },
    ],
    KITCHEN04_ID,
    1,
  );
}

/** The wet patch sits on the landing's level run — deck the ground line
 *  drives across and the par line flies past. Centred from the GROUND
 *  build's straight seam — the decked-over sink's middle. (Stage-3
 *  placement fix, Feel Engineer: this used to be centred from the PAR
 *  rig's landing run, which — now the zone hook exists — sits ON the par
 *  line's own deck and contradicts this file's own design claim. The
 *  hazard contract (Concepts/Levels §Hazards as data) is "the PAR line is
 *  grip-independent"; measured with the hook live, this centre gives
 *  par wet == par dry bit-for-bit, and the ground line wet diverges and
 *  still finishes. See Modules/world §Hazards.) */
function wetPatch(): WetPatch {
  const build = kitchen04GroundBuild();
  const rig = new KitRig(build, 10);
  const p = rig.frameAt(rig.starts[2]!).pos;
  return {
    id: 'sinkSplash',
    kind: 'wetPatch',
    center: { x: p.x, y: p.y, z: p.z },
    radius: 0.14,
    gripFactor: 0.5,
    source: 'tap',
  };
}

export const KITCHEN04: KitchenLevel = registerKitchen(
  kitchenLevel({
    id: KITCHEN04_ID,
    name: 'The Tap',
    set: 'kitchen',
    seed: 1,
    startSocket: startSocketFromBuild(parBuild(), KITCHEN_GEOM.release * KITCHEN_GEOM.rampBlend),
    par: { pieces: 4, time: 2.52 }, // the par line places 4 of the 5 tray pieces (measured — regenerate via pars)
    maxTime: 12,
    tray: { gapLip: 1, drop: 1, landing: 1, straight: 2 },
    fixtures: { ramp: 1, finishCup: 1 },
    hazards: [wetPatch()],
    parBuild,
  }),
);
