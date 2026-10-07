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
 * PLACE VERDICT (playtest Q round 2: "Booster fits nowhere I could find" —
 * 4 tries, quit): the booster's useful socket is the BOOT CHAIN HEAD — the
 * ramp's open exit, the ring the builder already defaults to (its boot
 * `chainHeadIndex` target) and the socket where a held booster reports
 * `fits here` on the fixture-only rail (probe: the tray-seated booster
 * `snapSocket`s there on `initialBuild`). The wall was the ORDER story,
 * not the fit. Measured: mid-chain FINISHES but pays +0.11 s (pinned as
 * `kitchen05MidBoosterBuild`, the second intended line), LAST FALLS (the
 * literal place-last tray build, pinned as `kitchen05LastBoosterBuild`,
 * wrong answer C), EARLY is the fast line. So on this rung the booster
 * does NOT belong mid-chain — it belongs FIRST in the tray line, straight
 * off the ramp, exactly where `parBuild` puts it: buy the speed while it
 * still has two gaps to cross. The only shipped copy that reads as a
 * placement ORDER — the `booster` first-sight callout in
 * `src/ui/callouts.ts` — used to say "in the middle of a run" and now
 * names the EARLY placement (K5 is the booster's only campaign tray;
 * there is no per-level hint render seam — see the level declaration
 * note below and the session log `2026-10-09 Stage 4 - K5 booster +
 * fixture reading`).
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

/** L05's gap, PINNED to the ORIGINAL tutorial-gap numbers (drop height 0.15,
 *  angle 40, lead 0.01; landing level 0.18). The shared `KITCHEN_GAP` was
 *  re-authored for the L01 three-piece promise (see `kitchen01.level.ts`);
 *  this level's lesson is the OPPOSITE kind of honesty — its two WRONG
 *  allocations must NOT finish, and they were measured against these numbers.
 *  A forgiving gap silently un-teaches the trade-off: with the softened
 *  shared gap the no-booster line STARTED finishing, so rung 5 carries its
 *  own copy — deliberately unforgiving, because this is the level that
 *  punishes wrong choices, not the tutorial that forgives first ones.
 *  Re-measure both wrong answers against any change here
 *  (`tests/unit/kitchen-levels.test.ts`). */
const KITCHEN05_GAP = {
  lip: { length: 0.02, angle: 10, blend: 0.05 },
  drop: { height: 0.15, angle: 40, radius: 0.02, lead: 0.01 },
  landing: { level: 0.18, angle: 12, blend: 0.06 },
} as const;
function parBuild(): Build {
  return lay(
    [
      { def: 'ramp', params: kitchenRamp(0.3) }, // the books (fixture)
      { def: 'booster', params: { power: 1.1 } }, // tray: the ONE speed purchase
      { def: 'gapLip', params: KITCHEN05_GAP.lip }, // tray: gap 1 launch
      { def: 'drop', params: KITCHEN05_GAP.drop }, // tray: gap 1 + catch
      { def: 'gapLip', params: KITCHEN05_GAP.lip }, // tray: gap 2 launch
      { def: 'drop', params: KITCHEN05_GAP.drop }, // tray: gap 2
      { def: 'landing', params: KITCHEN05_GAP.landing }, // tray: the ONE soft catch
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
      { def: 'gapLip', params: KITCHEN05_GAP.lip },
      { def: 'drop', params: KITCHEN05_GAP.drop },
      { def: 'gapLip', params: KITCHEN05_GAP.lip },
      { def: 'drop', params: KITCHEN05_GAP.drop },
      { def: 'landing', params: KITCHEN05_GAP.landing },
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
      { def: 'gapLip', params: KITCHEN05_GAP.lip },
      { def: 'drop', params: KITCHEN05_GAP.drop },
      { def: 'landing', params: KITCHEN05_GAP.landing },
      { def: 'booster', params: { power: 1.1 } },
      { def: 'gapLip', params: KITCHEN05_GAP.lip },
      { def: 'drop', params: KITCHEN05_GAP.drop },
      { def: 'finishCup' },
    ],
    KITCHEN05_ID,
    1,
  );
}

/** The SECOND intended line: the booster parked BETWEEN the gaps — the
 *  mid-chain placement the old callout copy implied. It finishes
 *  (measured 2.500 s vs the par's 2.392) and is the beatable-par
 *  evidence, now data so "both intended K5 lines finish" is a test, not
 *  prose. */
export function kitchen05MidBoosterBuild(): Build {
  return lay(
    [
      { def: 'ramp', params: kitchenRamp(0.3) },
      { def: 'gapLip', params: KITCHEN05_GAP.lip },
      { def: 'drop', params: KITCHEN05_GAP.drop },
      { def: 'booster', params: { power: 1.1 } },
      { def: 'gapLip', params: KITCHEN05_GAP.lip },
      { def: 'drop', params: KITCHEN05_GAP.drop },
      { def: 'landing', params: KITCHEN05_GAP.landing },
      { def: 'finishCup' },
    ],
    KITCHEN05_ID,
    1,
  );
}

/** Wrong answer C: the place-LAST build — every par piece in par order,
 *  the booster saved for the very last socket. This is the build a "place
 *  the booster LAST" hint teaches (and playtest Q's class of attempts).
 *  Measured `fell` 2.467 s — the extra speed arrives after both gaps and
 *  the catch are spent and throws the car past the cup. Pinned so hint
 *  copy can never drift back to implying LAST. */
export function kitchen05LastBoosterBuild(): Build {
  return lay(
    [
      { def: 'ramp', params: kitchenRamp(0.3) },
      { def: 'gapLip', params: KITCHEN05_GAP.lip },
      { def: 'drop', params: KITCHEN05_GAP.drop },
      { def: 'gapLip', params: KITCHEN05_GAP.lip },
      { def: 'drop', params: KITCHEN05_GAP.drop },
      { def: 'landing', params: KITCHEN05_GAP.landing },
      { def: 'booster', params: { power: 1.1 } },
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
    // No `trayParams` and no placement-hint field here BY DESIGN: the par
    // places every tray kind once (so the tray seats each kind at the
    // par's own geometry), and the level data has no hint RENDER seam —
    // the shipped per-piece hint is the `booster` first-sight callout in
    // `src/ui/callouts.ts`, and the place-EARLY verdict that copy must
    // carry is stated at the top of this file.
    fixtures: { ramp: 1, finishCup: 1 },
    parBuild,
  }),
);

// ---- the kitchen sandbox ----------------------------------------------------

export const KITCHEN_SANDBOX_ID = 'kitchen-sandbox';

/** Everything unlocked; the reference build is one clean lap of every
 *  drivable kitchen verb (and it finishes, like every parBuild here). The two
 *  counter straights share ONE geometry (`SB_STRAIGHT`, 0.15 m each): the
 *  sandbox tray unlocks every kind at 99 copies but the builder still seats a
 *  held kind with ONE parameter set (the level's first placement), so a
 *  0.1 + 0.25 pair was a lap the sandbox itself could not re-place.
 *  Measured: 2.667 s, tray parity byte-identical. */
const SB_STRAIGHT = 0.175;

function sandboxBuild(): Build {
  return lay(
    [
      { def: 'ramp', params: kitchenRamp(0.3) },
      { def: 'straight', params: { length: SB_STRAIGHT } },
      { def: 'gapLip', params: KITCHEN_GAP.lip },
      { def: 'drop', params: KITCHEN_GAP.drop },
      { def: 'landing', params: KITCHEN_GAP.landing },
      { def: 'straight', params: { length: SB_STRAIGHT } },
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
    par: { pieces: 5, time: 2.67 },
    maxTime: 20,
    sandbox: true,
    tray: EVERY_PIECE,
    fixtures: { ramp: 1, finishCup: 1 },
    parBuild: sandboxBuild,
  }),
);
