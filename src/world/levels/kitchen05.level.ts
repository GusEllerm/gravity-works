/**
 * KITCHEN 05 — "Sunday Run" (everything together, one real trade-off).
 *
 * Two gaps on one line, and a tray that cannot buy both solutions: ONE soft
 * catch (`landing`: 1) for one of the gaps, and the ONLY extra speed in the
 * house (the `booster`). The trade-off is forced and the wrong answers are
 * measured, not asserted: skipping the booster leaves the car a gram of
 * rolling resistance short of the back gap's far rim (`fell`); landing the
 * FRONT gap softly and spending the booster in front of the BACK lip
 * overshoots that gap's catch (`fell`, `kitchen05LateBoosterBuild`). Parking
 * the booster between the gaps finishes but costs ~0.1 s — the par line buys
 * its speed EARLY and lands only the far gap. The par is beatable (a tighter
 * line exists near 2.3 s) but not obvious, which is what the 3-star time is
 * for.
 *
 * This file also registers the kitchen SANDBOX (`kitchen-sandbox`): every
 * piece and prop unlocked, no budget, the reference build being one clean lap
 * of every drivable kitchen verb. Sandbox variants for the other sets follow
 * the same shape in their own ladders.
 */
import type { Build } from '../../track/build.ts';
import type { PieceKind } from '../../track/pieces.ts';
import { PIECE_KINDS } from '../../track/pieces.ts';
import {
  KITCHEN_GAP,
  KITCHEN_GEOM,
  kitchenRamp,
  lay,
  registerKitchen,
  kitchenLevel,
  startSocketFromBuild,
  type KitchenLevel,
} from './kitchen01.level.ts';

export const KITCHEN05_ID = 'kitchen05';

function parBuild(): Build {
  return lay(
    [
      { def: 'ramp', params: kitchenRamp(0.3) }, // the books (fixture)
      { def: 'booster', params: { power: 1.1 } }, // tray: the ONE speed purchase
      { def: 'gapLip', params: KITCHEN_GAP.lip }, // tray: gap 1 launch
      { def: 'drop', params: KITCHEN_GAP.drop }, // tray: gap 1 + catch
      { def: 'gapLip', params: KITCHEN_GAP.lip }, // tray: gap 2 launch
      { def: 'drop', params: KITCHEN_GAP.drop }, // tray: gap 2
      { def: 'landing', params: KITCHEN_GAP.landing }, // tray: the ONE soft catch
      { def: 'finishCup' }, // fixture
    ],
    KITCHEN05_ID,
    1,
  );
}

/** Wrong answer A: the booster never bought/spent — too slow for gap 2's far
 *  rim. Kept as data; the test asserts it does NOT finish (the trade-off is
 *  real, not decorative). */
export function kitchen05NoBoosterBuild(): Build {
  return lay(
    [
      { def: 'ramp', params: kitchenRamp(0.3) },
      { def: 'gapLip', params: KITCHEN_GAP.lip },
      { def: 'drop', params: KITCHEN_GAP.drop },
      { def: 'gapLip', params: KITCHEN_GAP.lip },
      { def: 'drop', params: KITCHEN_GAP.drop },
      { def: 'landing', params: KITCHEN_GAP.landing },
      { def: 'finishCup' },
    ],
    KITCHEN05_ID,
    1,
  );
}

/** Wrong answer B: the landing spent on the FRONT gap and the booster pushed
 *  out to the BACK lip — the extra speed overshoots gap 2's catch. The other
 *  half of the trade-off (both wrong answers fit the tray exactly). */
export function kitchen05LateBoosterBuild(): Build {
  return lay(
    [
      { def: 'ramp', params: kitchenRamp(0.3) },
      { def: 'gapLip', params: KITCHEN_GAP.lip },
      { def: 'drop', params: KITCHEN_GAP.drop },
      { def: 'landing', params: KITCHEN_GAP.landing },
      { def: 'booster', params: { power: 1.1 } },
      { def: 'gapLip', params: KITCHEN_GAP.lip },
      { def: 'drop', params: KITCHEN_GAP.drop },
      { def: 'finishCup' },
    ],
    KITCHEN05_ID,
    1,
  );
}

export const KITCHEN05: KitchenLevel = registerKitchen(
  kitchenLevel({
    id: KITCHEN05_ID,
    name: 'Sunday Run',
    set: 'kitchen',
    seed: 1,
    startSocket: startSocketFromBuild(parBuild(), KITCHEN_GEOM.release * KITCHEN_GEOM.rampBlend),
    par: { time: 2.39 }, // measured on the par build (regenerate via pars)
    maxTime: 12,
    tray: { gapLip: 2, drop: 2, landing: 1, booster: 1 },
    fixtures: { ramp: 1, finishCup: 1 },
    parBuild,
  }),
);

// ---- the kitchen sandbox ----------------------------------------------------

export const KITCHEN_SANDBOX_ID = 'kitchen-sandbox';

/** Everything unlocked; the reference build is one clean lap of every
 *  drivable kitchen verb (and it finishes, like every parBuild here). */
function sandboxBuild(): Build {
  return lay(
    [
      { def: 'ramp', params: kitchenRamp(0.3) },
      { def: 'straight', params: { length: 0.1 } },
      { def: 'gapLip', params: KITCHEN_GAP.lip },
      { def: 'drop', params: KITCHEN_GAP.drop },
      { def: 'landing', params: KITCHEN_GAP.landing },
      { def: 'straight', params: { length: 0.25 } },
      { def: 'finishCup' },
    ],
    KITCHEN_SANDBOX_ID,
    1,
  );
}

const EVERY_PIECE = Object.fromEntries(PIECE_KINDS.map((kind: PieceKind) => [kind, 99]));

export const KITCHEN_SANDBOX: KitchenLevel = registerKitchen(
  kitchenLevel({
    id: KITCHEN_SANDBOX_ID,
    name: 'Kitchen sandbox',
    set: 'kitchen',
    seed: 1,
    startSocket: startSocketFromBuild(sandboxBuild(), KITCHEN_GEOM.release * KITCHEN_GEOM.rampBlend),
    budget: 999, // no budget; the contract wants a number
    par: { pieces: 5, time: 2.53 },
    maxTime: 20,
    sandbox: true,
    tray: EVERY_PIECE,
    fixtures: { ramp: 1, finishCup: 1 },
    parBuild: sandboxBuild,
  }),
);
