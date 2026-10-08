/**
 * BATHROOM 05 — "Twin Drains" (the encore rung: the DOUBLE CROSSING, wet).
 *
 * The bathroom's ladder crossed one sink per rung; every rung of this
 * room ships its water, and the encore keeps that promise on the ride —
 * the room's founding law (`bathroom01`: a wet patch is RIDDEN AROUND)
 * moved from launch to crossing: the live film sits IN sink two's mouth
 * at the waterline a bridged deck would roll, and the par's wheel crosses
 * that circle AIRBORNE — a ridden dip is still a flight — so the par
 * replays BIT-IDENTICAL wet vs dry (pinned), while the decked PROBE (0.3 m
 * spans the tray cannot seat) rolls THROUGH the film and runs wet-FASTER
 * (measured): the honest low-drag delta, and the toll stays theoretical
 * exactly as bathroom01's does — the through-build is not buyable at the
 * tray's ONE straight geometry.
 *
 * The line is the encore family's: `drop → straight → drop → landing` from
 * the finale's height (ramp 0.26), the rung's pinned `ENCORE_DIP` (the
 * ladder's 0.12 m step on the porch THRESHOLD's long lead — span 0.3566,
 * longer than a roll-off flies, so EVERY omission FALLS, 11/11 pinned).
 * Tray = par's four + ONE DECOY `straight` + ONE TEMPTATION `booster`:
 * spent EARLY (`bathroom05BoosterBuild`) the booster buys the second sink
 * whole — 4 placed, faster than the ride, the pinned hidden line; spent
 * LAST it is decoration at the par's own clock. The card's sentence stays
 * the room's: the water is a tell, the tray is the test.
 */
import type { Build } from '../../track/build.ts';
import { PIECE_KINDS, type PieceKind } from '../../track/pieces.ts';
import { KitRig } from '../../feel/kittrack.ts';
import {
  KITCHEN_GAP,
  kitchenRamp,
  lay,
  startSocketFromBuild,
  type WetPatch,
} from './kitchen01.level.ts';
import {
  BATH_GEOM,
  BATH_STRAIGHT,
  bathroomLevel,
  registerBathroom,
  type BathroomLevel,
} from './bathroom01.level.ts';

export const BATHROOM05_ID = 'bathroom05';

/** THE PINNED ENCORE DIP — see `bedroom05.level.ts` for the lineage (the
 *  ladder's step on the porch threshold's long lead, span 0.3566 m). */
export const ENCORE_DIP = { height: 0.12, angle: 45, radius: 0.02, lead: 0.11 };

function parBuild(): Build {
  return lay(
    [
      { def: 'ramp', params: kitchenRamp(0.26) }, // the finale's shelf (fixture)
      { def: 'drop', params: ENCORE_DIP }, // tray: sink ONE — ridden
      { def: 'straight', params: { length: BATH_STRAIGHT } }, // tray: the tile between
      { def: 'drop', params: ENCORE_DIP }, // tray: sink TWO — ridden, the film lives in its mouth
      { def: 'landing', params: KITCHEN_GAP.landing }, // tray: the run-out catch
      { def: 'finishCup' }, // fixture
    ],
    BATHROOM05_ID,
    1,
  );
}

/** The hazard PROBE, not a player route (the bathroom01 convention): ride
 *  sink one as the par does, then BRIDGE sink two with two 0.3 m decks the
 *  tray cannot seat — the decked version of crossing two. Rolls through
 *  the film: diverges wet and finishes wet-FASTER (low drag,
 *  [[Modules/hazards]]). */
export function bathroom05ProbeBuild(): Build {
  return lay(
    [
      { def: 'ramp', params: kitchenRamp(0.26) },
      { def: 'drop', params: ENCORE_DIP },
      { def: 'straight', params: { length: 0.3 } },
      { def: 'straight', params: { length: 0.3 } },
      { def: 'landing', params: { level: 0.2, angle: 12, blend: 0.06 } },
      { def: 'finishCup' },
    ],
    BATHROOM05_ID,
    1,
  );
}

/** THE BOOSTER LINE (exported, pinned): the EARLY spend buys the second
 *  sink whole — 4 placed pieces, a faster clock than the ride's. Spend
 *  the SAME piece last and the run is the par's own, one piece poorer. */
export function bathroom05BoosterBuild(): Build {
  return lay(
    [
      { def: 'ramp', params: kitchenRamp(0.26) },
      { def: 'booster' },
      { def: 'drop', params: ENCORE_DIP },
      { def: 'straight', params: { length: BATH_STRAIGHT } },
      { def: 'landing', params: KITCHEN_GAP.landing },
      { def: 'finishCup' },
    ],
    BATHROOM05_ID,
    1,
  );
}

/** The film IN sink two's mouth: dip TWO's mid-span at the waterline a
 *  bridged deck rolls (the bathroom01 seam law on a ridden dip). The par's
 *  wheel crosses the circle AIRBORNE — a dipped ride is a flight — and the
 *  probe's roll through it (the ladder test). */
function drainFilm(): WetPatch {
  const rig = new KitRig(parBuild(), 1);
  const mouth = rig.frameAt(rig.starts[3] + 0.001).pos; // sink two's entry seam
  const mid = rig.frameAt(rig.starts[3] + 0.25).pos; // mid-span of its mouth
  return {
    id: 'drainFilm',
    kind: 'wetPatch',
    center: { x: mid.x, y: mouth.y + 0.017, z: 0 },
    radius: 0.1,
    gripFactor: 0.5,
    source: 'tub',
  };
}

export const BATHROOM05: BathroomLevel = registerBathroom(
  bathroomLevel({
    id: BATHROOM05_ID,
    name: 'Twin Drains',
    set: 'bathroom',
    seed: 1,
    startSocket: startSocketFromBuild(parBuild(), BATH_GEOM.release * BATH_GEOM.rampBlend),
    // measured on the par build (regenerate via `npm run pars`)
    par: { pieces: 4, time: 3.05 },
    maxTime: 12,
    tray: { drop: 2, straight: 2, landing: 1, booster: 1 },
    trayParams: { booster: {} },
    fixtures: { ramp: 1, finishCup: 1 },
    hazards: [drainFilm()],
    parBuild,
  }),
);

// ---- the bathroom sandbox -----------------------------------------------------
//
// The set's no-budget room, mirroring `kitchen-sandbox` exactly: every piece
// unlocked (`sandbox: true`, budget 999 — "no budget" with the number the
// contract demands), NOT a campaign rung (invisible to `CAMPAIGN`, nobody's
// next, addressable by `?level=` like every off-ladder rig), and the
// reference build is one clean lap of the gap verbs at THIS ladder's own
// geometry: the 02-rung shelf (ramp 0.28), the ladder's single 0.2 m
// straight seating, the shared `KITCHEN_GAP`. Measured: 2.733 s.

export const BATHROOM_SANDBOX_ID = 'bathroom-sandbox';

function sandboxBuild(): Build {
  return lay(
    [
      { def: 'ramp', params: kitchenRamp(0.28) }, // the shelf (fixture)
      { def: 'straight', params: { length: BATH_STRAIGHT } }, // the deck before the gap
      { def: 'gapLip', params: KITCHEN_GAP.lip }, // the launch
      { def: 'drop', params: KITCHEN_GAP.drop }, // the gap + catch
      { def: 'landing', params: KITCHEN_GAP.landing }, // the run-out
      { def: 'straight', params: { length: BATH_STRAIGHT } }, // ride to the cup
      { def: 'finishCup' }, // fixture
    ],
    BATHROOM_SANDBOX_ID,
    1,
  );
}

const EVERY_PIECE = Object.fromEntries(PIECE_KINDS.map((kind: PieceKind) => [kind, 99]));

export const BATHROOM_SANDBOX: BathroomLevel = registerBathroom(
  bathroomLevel({
    id: BATHROOM_SANDBOX_ID,
    name: 'Bathroom sandbox',
    set: 'bathroom',
    seed: 1,
    startSocket: startSocketFromBuild(sandboxBuild(), BATH_GEOM.release * BATH_GEOM.rampBlend),
    budget: 999, // no budget; the contract wants a number
    par: { pieces: 5, time: 2.75 }, // measured 2.733 s on the lap (regenerate via pars)
    maxTime: 20,
    sandbox: true,
    tray: EVERY_PIECE,
    fixtures: { ramp: 1, finishCup: 1 },
    parBuild: sandboxBuild,
  }),
);
