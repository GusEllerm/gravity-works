/**
 * BATHROOM 04 — "Full Bath" (the capstone: everything, one tray, no
 * guesses — with the bathroom's own signature, a live wet patch, under the
 * whole line).
 *
 * Every bathroom verb on one line: the tile deck run (02's lazy work), the
 * launch off the sink edge (02's showy half), the drain-sink dip-and-catch
 * (01's flight verb on the ground), and the soft run-out — four pieces, the
 * WHOLE tray, all load-bearing. The Playtest-G lesson as architecture: the
 * tray IS the par line's exact multiset, and with every kit socket flat a
 * whole-tray chain's reach is an order-invariant sum, so EVERY ORDER
 * finishes (24/24 gate, test-gated exactly like kitchen04's and bedroom04's
 * — this rung deliberately inherits that sweep's geometry, the 0.3 m
 * run-out, because its lesson IS the order-invariant whole-tray sum) and
 * the lesson is the clock, not the gate. The par ORDER is beatable
 * (measured), which is what the 3-star time is for.
 *
 * The COMBINE half that makes this the bathroom's capstone and not a
 * re-run: the drain sink's puddle is a live grip zone under the flight
 * window (01's hazard, centred by the kitchen04 convention on where a
 * decked line would roll — the probe build below), and because every
 * whole-tray order crosses the sink airborne or on the low catch deck, the
 * rung's claim is the strongest one in the ladder: par replays
 * BIT-IDENTICAL wet vs dry, and the dry sweep doubles as the wet sweep
 * (asserted). The tell is the porcelain; the toll is only for a line the
 * tray cannot build.
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
  DRAIN_GAP,
  bathroomLevel,
  registerBathroom,
  type BathroomLevel,
} from './bathroom01.level.ts';

export const BATHROOM04_ID = 'bathroom04';

/** The run-out geometry, pinned to the kitchen-L04/bedroom04 sweep's 0.3 m
 *  (header): the order-invariance proof lives at this seating. */
const SWEEP_STRAIGHT = 0.3;

function parBuild(): Build {
  return lay(
    [
      { def: 'ramp', params: kitchenRamp(0.26) }, // the shelf over the washstand (fixture)
      { def: 'straight', params: { length: SWEEP_STRAIGHT } }, // tray: the tile deck run
      { def: 'gapLip', params: DRAIN_GAP.lip }, // tray: the launch
      { def: 'drop', params: DRAIN_GAP.drop }, // tray: the sink's dip-and-catch
      { def: 'landing', params: DRAIN_GAP.landing }, // tray: the soft run-out
      { def: 'finishCup' }, // fixture
    ],
    BATHROOM04_ID,
    1,
  );
}

/** The hazard PROBE, not a player route (the kitchen04 convention): ONE
 *  long deck laid across the sink rolls straight through the puddle the
 *  par flies. The tray cannot build it (its `straight` seats at 0.3, not
 *  0.62) — the patch stays a TELLS-not-a-TOLL for every buildable line.
 *  Exported as data so the tests can replay it. */
export function bathroom04ProbeBuild(): Build {
  return lay(
    [
      { def: 'ramp', params: kitchenRamp(0.26) },
      { def: 'straight', params: { length: 0.62 } },
      { def: 'straight', params: { length: 0.15 } },
      { def: 'finishCup' },
    ],
    BATHROOM04_ID,
    1,
  );
}

/** The puddle: centred directly above the sink mouth — the par line's
 *  LANDING-entry x, at the DECKED (probe) y. Deliberately not the probe's
 *  seam: the first draft centred on the seam and the par's `drop` step-top
 *  grazed the band (measured wet != dry); this centre starts the zone
 *  x-range past the step (par crosses on the low catch deck only) while
 *  the probe's long deck is still high and wet under it at that x. */
function sinkSplash(): WetPatch {
  const rig = new KitRig(parBuild(), 1);
  const x = rig.frameAt(rig.starts[4]! + 0.06).pos.x; // into the par's landing
  const y = rig.frameAt(rig.starts[1]!).pos.y; // the decked/ramp-exit deck line
  return {
    id: 'sinkSplash',
    kind: 'wetPatch',
    center: { x, y, z: 0 },
    radius: 0.14,
    gripFactor: 0.5,
    source: 'tub',
  };
}

export const BATHROOM04: BathroomLevel = registerBathroom(
  bathroomLevel({
    id: BATHROOM04_ID,
    name: 'Full Bath',
    set: 'bathroom',
    seed: 1,
    startSocket: startSocketFromBuild(parBuild(), BATH_GEOM.release * BATH_GEOM.rampBlend),
    par: { time: 2.7 }, // the whole tray placed — measured, regenerate via `npm run pars`
    maxTime: 12,
    // the tray IS the answer: 4 pieces, every one load-bearing.
    tray: { straight: 1, gapLip: 1, drop: 1, landing: 1 },
    fixtures: { ramp: 1, finishCup: 1 },
    hazards: [sinkSplash()],
    parBuild,
  }),
);
