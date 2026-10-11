/**
 * PORCH 05 — "The Crossing" (the campaign's last rung: two thresholds, one
 * tray, two authored routes, and the shortcut home arrives late).
 *
 * The fantasy the whole house was built to walk out of: HALL to DECK to
 * YARD in one timed run. Two thresholds stand on the line — the door
 * mouth's drop and the stoam's step — and the tray buys both crossings
 * with four pieces: two `gapLip`s (identical geometry, laid as two
 * instances — the coherence rule) and two catchers, the hard `drop` and
 * the soft `landing` (rung 03's SINK, span-matched to the drop by the
 * reach-sum law, so WHICH catcher lands on WHICH threshold is a choice
 * that ends at the same cup either way).
 *
 * The two INTENDED routes finish on BOTH mountings — chained and
 * builder-anchored, test-pinned — and the clock ranks them honestly:
 * the SINK-FIRST line (par) softens the mouth and slingshots the dip into
 * a hard catch of the step (~1.19 s); the CATCH-FIRST line pops the mouth
 * hard and runs out soft over the stoam (~1.39 s, the same pop the ladder
 * opened with, spent on the last threshold). Same multiset, same end
 * plane — the dy bookkeeping is additive and the spans are equal, so both
 * routes deck-to-deck under the one anchored cup BY CONSTRUCTION.
 *
 * ROUND 3 — THE THRESHOLDS GET A RIM (the 2026-10-11 round-3 verdict,
 * cheapest point 1: "give the finale a blocked-rim moment — the k02
 * machinery already exists, point it at porch05's last gap"). The physics
 * is UNTOUCHED (the par replay hash `1e367c94` survives the change
 * BYTE-IDENTICAL — `tests/unit/porch-guard.test.ts` pins it, `replay:all`
 * 30/30); what changed is the BUILD TABLE: the rung declares two
 * `blockedRims` (`src/world/level.ts`, the same blocked-rim LAW as
 * kitchen02's `blockedGoalSeat`, pointed at the thresholds instead of the
 * cup) — the DOOR MOUTH's void column and the STOAM's mouth lip — so a
 * seat whose deck would bridge a threshold FLAT is refused at the ring and
 * the refusal NAMES the obstacle ("blocked — the stoam is in the way",
 * "blocked — the door mouth is in the way"). porch03's doctrine, enforced
 * as placement law: the sink must never become a universal bridge, and
 * every tray order that crossed a threshold on one piece's flat deck now
 * cannot be built at all. Re-measured over ALL 24 click orders / 12
 * distinct seatings (`scripts/porch05-order-table.mjs`): the whole-tray
 * dump seats NOTHING past three pieces in any order — every naive seating
 * meets at least one honest rim refusal (usually the final ask over the
 * stoam) and the partial line it leaves FALLS; the only seatings that
 * cross are the two AUTHORED orders — sink-first pays ★★★ (`1e367c94`,
 * 1.192 s) and catch-first pays ★★☆ — and no naive order earns any star
 * at all. The crossing can no longer be placed around; it must be
 * CROSSING: pop the threshold, catch it, choose the catcher.
 *
 * Beyond this rung `nextInCampaign('porch05') === null`: the campaign ends
 * where the house ends — outside, in the morning, the chime still swinging
 * over the porch the player just crossed.
 */
import type { Build } from '../../track/build.ts';
import { PIECE_KINDS, type PieceKind } from '../../track/pieces.ts';
import {
  PORCH_GEOM,
  THRESHOLD_GAP,
  porchChute,
  porchLevel,
  PORCH_STRAIGHT,
  PORCH_SINK,
  registerPorch,
  type PorchLevel,
} from './porch01.level.ts';
import { lay, startSocketFromBuild } from './kitchen01.level.ts';

export const PORCH05_ID = 'porch05';

function parBuild(): Build {
  return lay(
    [
      { def: 'ramp', params: porchChute() }, // the hall-side step (fixture)
      { def: 'gapLip', params: THRESHOLD_GAP.lip }, // tray: the door-mouth pop
      { def: 'landing', params: PORCH_SINK }, // tray: the mouth, SOFT-caught — the dip that slingshots
      { def: 'gapLip', params: THRESHOLD_GAP.lip }, // tray: the stoam pop (same geometry — laid by instance)
      { def: 'drop', params: THRESHOLD_GAP.drop }, // tray: the step, HARD-caught
      { def: 'finishCup' }, // fixture — the cup on the yard side
    ],
    PORCH05_ID,
    1,
  );
}

/** The CATCH-FIRST route: the authored alternate — hard on the mouth,
 *  soft over the step. Both routes finish (chained AND anchored,
 *  test-pinned); the catch-first clock pays the slam it skipped at the
 *  mouth twice over by the stoam. */
export function porch05CatchFirstBuild(): Build {
  return lay(
    [
      { def: 'ramp', params: porchChute() },
      { def: 'gapLip', params: THRESHOLD_GAP.lip },
      { def: 'drop', params: THRESHOLD_GAP.drop }, // the mouth, HARD-caught
      { def: 'gapLip', params: THRESHOLD_GAP.lip },
      { def: 'landing', params: PORCH_SINK }, // the step, SOFT-caught — the run-out
      { def: 'finishCup' },
    ],
    PORCH05_ID,
    1,
  );
}

export const PORCH05: PorchLevel = registerPorch(
  porchLevel({
    id: PORCH05_ID,
    name: 'The Crossing',
    set: 'porch',
    seed: 1,
    startSocket: startSocketFromBuild(parBuild(), PORCH_GEOM.release * PORCH_GEOM.rampBlend),
    par: { time: 1.2 }, // the whole tray placed — measured, regenerate via `npm run pars`
    maxTime: 12,
    // the tray IS the answer: two pops, two catchers, 4 pieces, all
    // load-bearing; the tray seats ONE geometry per kind (the two lips are
    // the same parameters, laid as two instances — the coherence rule).
    tray: { gapLip: 2, drop: 1, landing: 1 },
    fixtures: { ramp: 1, finishCup: 1 },
    /** THE THRESHOLD RIMS (round 3 — see the header): named placement
     *  guards, boxes only, no collider, no physics read. Both numbers are
     *  literals (the `setPlacement` precedent) measured off the AUTHORED
     *  seatings with the k02 margin law (every authored seating clears
     *  every rim by ≥ 2 mm; every refused dump seating overlaps by
     *  ≥ 2 mm — re-measured from the live builds and pinned by
     *  `tests/unit/porch-guard.test.ts`):
     *
     *  - `door mouth` — the void column of the FIRST threshold: x spans
     *    the 6 mm of clear air between the chute's deck end (0.455) and
     *    the authored catcher's entry (0.565) with 4 mm pulled off each
     *    deck, y from the porch deck's surface (−0.19) down through the
     *    step to just under the catch deck (−0.28). The authored pop lip
     *    clears it by 4 mm in y (its lowest point sits above the column
     *    top); a `drop`/`landing` seated flat at the chute's end overlaps
     *    by more than 100 mm and is refused.
     *  - `stoam` — the LAST GAP's mouth lip: the final 5 mm of the step
     *    (x 1.016 → the yard deck's start 1.021), y from 5 mm above the
     *    yard deck (−0.376) to 5 mm above the porch deck a bridging deck
     *    floats at (−0.266). The sink's tail deck reaching across the
     *    threshold (max 1.019) overlaps the lip by 3 mm and is refused;
     *    a pop lip's deck END stops 4 mm short of the lip and seats
     *    (catch-first keeps its pop), and the authored catchers start
     *    2 mm past it (2 mm is exactly kitchen02's ratified clearance). */
    blockedRims: [
      { name: 'door mouth', min: [0.459, -0.28, -0.1], max: [0.561, -0.192, 0.1] },
      { name: 'stoam', min: [1.016, -0.376, -0.1], max: [1.021, -0.266, 0.1] },
    ],
    parBuild,
  }),
);

// ---- the porch sandbox -----------------------------------------------------
//
// The set's no-budget room, mirroring `kitchen-sandbox` exactly: every piece
// unlocked (`sandbox: true`, budget 999 — "no budget" with the number the
// contract demands), NOT a campaign rung (invisible to `CAMPAIGN`, nobody's
// next, addressable by `?level=` like every off-ladder rig), and the
// reference build is one clean lap of the PORCH verbs at this ladder's own
// geometry: the chute, the threshold pop, the sink that carries, the pinned
// step and ONE 0.11 m plank seating. Measured: 1.158 s.

export const PORCH_SANDBOX_ID = 'porch-sandbox';

function sandboxBuild(): Build {
  return lay(
    [
      { def: 'ramp', params: porchChute() }, // the hall-side step (fixture) — the chute tool
      { def: 'gapLip', params: THRESHOLD_GAP.lip }, // the door-mouth pop
      { def: 'landing', params: PORCH_SINK }, // the dipped plank — sink and CARRY
      { def: 'drop', params: THRESHOLD_GAP.drop }, // the threshold step
      { def: 'straight', params: { length: PORCH_STRAIGHT } }, // the plank to the cup
      { def: 'finishCup' }, // fixture
    ],
    PORCH_SANDBOX_ID,
    1,
  );
}

const EVERY_PIECE = Object.fromEntries(PIECE_KINDS.map((kind: PieceKind) => [kind, 99]));

export const PORCH_SANDBOX: PorchLevel = registerPorch(
  porchLevel({
    id: PORCH_SANDBOX_ID,
    name: 'Porch sandbox',
    set: 'porch',
    seed: 1,
    startSocket: startSocketFromBuild(sandboxBuild(), PORCH_GEOM.release * PORCH_GEOM.rampBlend),
    budget: 999, // no budget; the contract wants a number
    par: { pieces: 4, time: 1.2 }, // measured 1.158 s on the lap (regenerate via pars)
    maxTime: 20,
    sandbox: true,
    tray: EVERY_PIECE,
    fixtures: { ramp: 1, finishCup: 1 },
    parBuild: sandboxBuild,
  }),
);
