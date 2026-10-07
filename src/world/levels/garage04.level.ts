/**
 * GARAGE 04 — "Last Lap" (the capstone: everything, one tray, no guesses —
 * with the garage's two signatures combined, the oil stain LIVE under the
 * flight and the mezzanine HEIGHT that starts it).
 *
 * Every garage verb on one line: the floor deck run (02's floor work), the
 * launch off the bench lip (02's showy half / 03's speed line), the gap
 * dip-and-catch (01's flight verb on the ground), and the soft run-out —
 * four pieces, the WHOLE tray, all load-bearing. The Playtest-G lesson as
 * architecture: the tray IS the par line's exact multiset, and with every
 * kit socket flat a whole-tray chain's reach is an order-invariant sum, so
 * EVERY ORDER finishes (24/24 gate, test-gated exactly like kitchen04's,
 * bedroom04's, bathroom04's and garden04's — this rung deliberately
 * inherits that sweep's seating, the 0.3 m run-out, because its lesson IS
 * the order-invariant whole-tray sum). Your ORDERING is the line you pick
 * and the clock is the reward; the par ORDER is beatable (measured).
 *
 * The COMBINE half that makes this the garage's capstone and not a re-run
 * is the brief's own pair — stain + height: the line STARTS at the work-
 * bench height rung 02 taught (ramp 0.26, the mid mezzanine shelf) and
 * crosses a live oil zone under the flight window (01's hazard, centred by
 * the bathroom04 convention on where a decked line would roll — the probe
 * build below), so the room's two lessons meet on one line. Because every
 * whole-tray order crosses the film airborne or on the low catch deck, the
 * rung's claim is the strongest in the ladder: par replays BIT-IDENTICAL
 * wet vs dry and the dry sweep doubles as the wet sweep (asserted). The
 * tell is the sheen in the blade's dark edge; the toll is only for a line
 * the tray cannot build. The garage's last rung (stage 5 opened the porch
 * beyond it — `nextInCampaign('garage04') === 'porch01'`), under the ratified
 * door-gap sunblade — the wheel tunnel stands at the end of the straight,
 * staging, exactly as ratified.
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
  SHOP_GAP,
  garageLevel,
  registerGarage,
  type GarageLevel,
} from './garage01.level.ts';

export const GARAGE04_ID = 'garage04';

/** The run-out geometry, pinned to the kitchen-L04/bedroom04/bathroom04/
 *  garden04 sweep's 0.3 m (header): the order-invariance proof lives at
 *  this seating. */
const SWEEP_STRAIGHT = 0.3;

function parBuild(): Build {
  return lay(
    [
      { def: 'ramp', params: kitchenRamp(0.26) }, // the workbench shelf (fixture — the HEIGHT half)
      { def: 'straight', params: { length: SWEEP_STRAIGHT } }, // tray: the deck run
      { def: 'gapLip', params: SHOP_GAP.lip }, // tray: the launch
      { def: 'drop', params: SHOP_GAP.drop }, // tray: the gap's dip-and-catch
      { def: 'landing', params: SHOP_GAP.landing }, // tray: the soft run-out
      { def: 'finishCup' }, // fixture
    ],
    GARAGE04_ID,
    1,
  );
}

/** The hazard PROBE, not a player route (the kitchen04 convention): ONE
 *  long deck laid across the gap rolls straight through the oil film the
 *  par flies. The tray cannot build it (its `straight` seats at 0.3, not
 *  0.62) — the film stays a TELLS-not-a-TOLL for every buildable line.
 *  Exported as data so the tests can replay it. */
export function garage04ProbeBuild(): Build {
  return lay(
    [
      { def: 'ramp', params: kitchenRamp(0.26) },
      { def: 'straight', params: { length: 0.62 } },
      { def: 'straight', params: { length: 0.15 } },
      { def: 'finishCup' },
    ],
    GARAGE04_ID,
    1,
  );
}

/** The stain: centred above the gap's mouth — the par line's LANDING-entry
 *  x, at the DECKED (probe) y, by the bathroom04/garden04 rule (a seam-
 *  centred zone lets the par's `drop` step-top graze the band; this centre
 *  starts the zone x-range past the step — par crosses on the low catch
 *  deck only — while the probe's long deck is still high and wet under it
 *  at that x). */
function oilCrossing(): WetPatch {
  const rig = new KitRig(parBuild(), 1);
  const x = rig.frameAt(rig.starts[4]! + 0.06).pos.x; // into the par's landing
  const y = rig.frameAt(rig.starts[1]!).pos.y; // the decked/ramp-exit deck line
  return {
    id: 'oilCrossing',
    kind: 'wetPatch',
    center: { x, y, z: 0 },
    radius: 0.14,
    gripFactor: 0.5,
    source: 'oilStain',
  };
}

export const GARAGE04: GarageLevel = registerGarage(
  garageLevel({
    id: GARAGE04_ID,
    name: 'Last Lap',
    set: 'garage',
    seed: 1,
    startSocket: startSocketFromBuild(parBuild(), GAR_GEOM.release * GAR_GEOM.rampBlend),
    par: { time: 2.7 }, // the whole tray placed — measured, regenerate via `npm run pars`
    maxTime: 12,
    // the tray IS the answer: 4 pieces, every one load-bearing.
    tray: { straight: 1, gapLip: 1, drop: 1, landing: 1 },
    fixtures: { ramp: 1, finishCup: 1 },
    hazards: [oilCrossing()],
    parBuild,
  }),
);
