/**
 * KITCHEN 03 — "The Bowl" (the set's signature affordance).
 *
 * The cereal bowl is the kitchen's banked turn, and it is the set's biggest
 * LIE-ADMIT: the bowl is BUILT (its rim is a `bank` + counter-`curve` pair —
 * colliding, railable, socketed) and the timed line runs PAST it into the cup
 * on the counter, because a banked yaw arc is not steerable mid-run by either
 * shipped car (Concepts/Levels §Piece request 1; the stage-2 feel notes name
 * it as the open boundary). The bowl's rim sockets (`bowl.in` / `bowl.out`,
 * exported below) are the convention the Environment Artist builds to: the
 * rim's tangent line-geometry must pass through these two world sockets, so
 * the day steering lands, dropping a bank piece between them is a data edit,
 * not a remodel. Until then the level teaches the gap verbs at speed, with
 * the bowl visibly waiting.
 *
 * STAGE-3 WIRING (Systems Engineer): the rim fixtures are no longer chained
 * off the end of the timed line — they are SEATED ON THE SET's rim sockets.
 * `parBuild` lays the timed chain, then adds the `bank`/`curve` pair at the
 * transforms that put the bank's out-socket exactly on the placed
 * `bowl.in` frame and the counter-arc's out-socket on the placed `bowl.out`
 * frame (`BOWL_SOCKET_FRAMES` from `src/sets/kitchen/data.ts`, carried into
 * this level's world by `kitchenSetPlacement`). So the bowl in L03 IS the
 * set's bowl: the fixtures ride the set's bowl wherever the level mounts
 * the set. The timed chain's transforms are byte-identical to the old
 * chained fixtures (the car never touched them), so every kitchen par hash
 * is unchanged — pinned in `tests/unit/set-wiring.test.ts`.
 */
import * as THREE from 'three';
import { PIECES } from '../../track/pieces.ts';
import { fitSocket } from '../../track/snap.ts';
import { transformSocket } from '../../track/socket.ts';
import type { Build, PlacedPiece } from '../../track/build.ts';
import type { Socket } from '../../track/socket.ts';
import { rampLevelForDrop } from '../../feel/kittrack.ts';
import { BOWL_SOCKET_FRAMES } from '../../sets/kitchen/data.ts';
import { kitchenSetPlacement, placementMatrix } from '../setPlacement.ts';
import {
  KITCHEN_GEOM,
  lay,
  registerKitchen,
  kitchenLevel,
  startSocketFromBuild,
  type KitchenLevel,
} from './kitchen01.level.ts';

export const KITCHEN03_ID = 'kitchen03';

/** The bowl's rim in kit language: a 120-degree, 25-degree-banked arc at rim
 *  radius, closed by a flat counter-arc that returns the yaw to zero (the
 *  feel track's bank+curve pairing rule: banking flattens at sockets but yaw
 *  does not, so a bank needs its mirror). FIXTURE geometry — the timed run
 *  ends at the cup before it. */
export const KITCHEN03_BOWL = {
  bank: { radius: 0.12, angle: 120, bank: 25 },
  counter: { radius: 0.12, angle: -120 },
} as const;

/** ONE straight geometry for the timed line (0.15 m, twice — the same total
 *  counter deck the old 0.1 + 0.2 pair laid, 0.30 m).
 *  STAGE-3 LADDER-COHERENCE FIX: with two different straight lengths in the
 *  par chain the tray could not place the line at all — the tray carries ONE
 *  geometry per kind (`levelTrayParams` reads the kind's FIRST placement and
 *  the builder seats every held straight with it), so the run got two 0.1 m
 *  straights and a par line 0.1 m shorter than the one the cup is anchored
 *  against. The tray is now the exact multiset the par build places — 2
 *  `straight`, `gapLip`, `drop`, `landing`, five pieces, budget 5 — and
 *  `trayParityBuild` is byte-identical to `parBuild`: the bowl line is a
 *  build, not a brochure.
 *
 *  STAGE-5 K3 RE-SWEEP (playtests AA + BB — the bowl WALLED two strangers
 *  back to back: AA 4 builds to the 3★, BB 6 builds and quit). WHY the
 *  lesson stopped being discoverable (headless re-sweep of the old
 *  geometry, every chainable build of the tray — session log
 *  `2026-10-10 Stage 5 - K3 re-sweep`): the −12°/0.3 m shared ramp's ~2 s
 *  crawl put EVERY death at 2.58–2.96 s (ramp-end arrival + the constant
 *  ~0.4 s fall — the K2 fail-timing law, never executed on this rung), and
 *  the old spans left ~0.15 m of reach slack, so the tray was
 *  UNDER-determined: 15 of the 4-piece subsets FINISHED (every order
 *  omitting one `straight` or the `gapLip` still landed on the cup plane)
 *  and the whole-tray orders all finished too — a stranger's first tries
 *  (2–4-piece bridges and the K1 fit, never a blind full-tray order) died
 *  late, invisibly and identically, and the completers were a minority
 *  pattern nobody tried first. The short-window layout (playtest Z's
 *  finding, Home ledger) compounded it: at 1280x633 every death happened
 *  below the fold at t ≈ 2 s.
 *
 *  THE GEOMETRY NOW (all level-local; the ladder deviations are the K2
 *  precedent, like L04's gap):
 *    ramp — a short steep chute (0.34 m at −29°, 0.12 m blend), the kit's
 *      fail-timing tool. The whole timed line moves nearer the start
 *      (exit x 0.78 vs the old 1.52, cup x 2.18 vs 2.50) and the set's
 *      placement rule re-centres the counter under it, while the whole
 *      death clock moves from 2.6–3.0 s down to ≤ 1.8 s;
 *    one `straight` geometry, 0.22 m — and the lip's SPAN equals it (the
 *      equality law from kitchen02's fail-timing pass), so a missing deck
 *      piece and a missing launch leave the SAME 0.22 m belly hole;
 *    `drop` — kitchen02's proven numbers: a 0.10 m step, 0.125 m leads
 *      (pair bellies die, pop catches land);
 *    `landing` — a SHALLOW sink (level 0.26, 8°): 0.377 m of span, 0.045 m
 *      of finish-plane drop. NOT the tutorial's soft catch — the old
 *      KITCHEN_GAP geometry was the forgiving gap whose omissions hop;
 *      here the sink's own span is the hole a missing `landing` leaves.
 *  Tray, budget and the par multiset are UNCHANGED (2 `straight`,
 *  `gapLip`, `drop`, `landing` = 5 = par): the 5-piece full line is the
 *  pay-off again.
 *
 *  WHAT FAILING TEACHES (measured on the shipped builder mount, EVERY
 *  chainable build enumerated — 171 builds, seeds 1–6 + launch jitter):
 *    ~1.05–1.15 s — bare ramps and 1–2-piece builds fly off the chute end
 *      at the rail;
 *    ~1.3–1.6 s   — 3-piece bridges land IN the void a rail-length out;
 *    ~1.6–1.8 s   — every 4-piece build (one piece short) dies at the
 *      doorstep: at the first hole (a deck/lip omitted — belly) or at the
 *      far end of the sink (a crossing omitted) — on screen, at counter
 *      height, the cup in frame;
 *  NO ≤ 4-piece build finishes (151/151 subsets fall — the strongest
 *  anti-cheat the bowl has had), 59–60/60 whole-tray orders finish (the
 *  single order `s,s,d,g,l` is the pinned borderline: it falls at 1.63 s on
 *  the seed-1 default and completes on several other seeds/jitters — the
 *  porch03 wedge family announced early), no failing build is airborne
 *  past the cup mouth any more, and the failure note names the kind each
 *  build actually lacks (the stock-tail rule). Par line: measured 1.475 s
 *  (par 1.50); flat orders run 1.4–1.7 (beatable par, the K2/K4
 *  precedent). */

/** L03's own launch ramp: the fail-timing tool (kitchen02's finding — the
 *  death clock is ramp-end arrival + the constant fall; the shared
 *  −12°/0.3 m ramp's ~2 s crawl was this level's clustering engine). */
const L03_RAMP_BLEND = 0.12;
const L03_RAMP = {
  angle: -29,
  blend: L03_RAMP_BLEND,
  level: rampLevelForDrop(0.34, -29, L03_RAMP_BLEND, KITCHEN_GEOM.release * L03_RAMP_BLEND),
};

/** ONE straight geometry: 0.22 m — past the measured pop-flight reach, so
 *  a hole it leaves is never flown back over. */
const L03_STRAIGHT = 0.22;

/** L03's `gapLip` — deck-lengthened so its SPAN equals the straight's
 *  (the equality law): a missing lip leaves the same belly hole as a
 *  missing deck piece. Launch stays 12°. */
const L03_LIP = { length: 0.1507, angle: 12, blend: 0.05 };

/** L03's `drop` — kitchen02's stage-4 fail-timing pair: a 0.10 m step
 *  (below the ladder's 0.12) with 0.125 m leads. */
const L03_DROP = { height: 0.1, angle: 45, radius: 0.02, lead: 0.125 };

/** L03's `landing` — a shallow sink, NOT the tutorial's soft catch (see
 *  the header: the soft catch made 4-piece guesses finishable). */
const L03_LANDING = { level: 0.26, angle: 8, blend: 0.06 };

/** The rim fixtures, seated THROUGH the set's sockets (the seam this level's
 *  block comment describes). Each fixture is placed so its OUT-socket lands
 *  on the placed set frame — the same relation the old chain-derived sockets
 *  had, now sourced from the set instead of derived from the chain. */
function bowlFixtures(startSeq: number): PlacedPiece[] {
  const placement = kitchenSetPlacement(KITCHEN03_ID);
  if (!placement) throw new Error(`kitchen03: no kitchen set placement registered`);
  const m = placementMatrix(placement);
  const placed = (frame: { pos: readonly number[]; tangent: readonly number[]; up: readonly number[] }): Socket => ({
    pos: new THREE.Vector3(...frame.pos).applyMatrix4(m),
    tangent: new THREE.Vector3(...frame.tangent).transformDirection(m),
    up: new THREE.Vector3(...frame.up).transformDirection(m),
  });
  const [bankIn, bankOut] = PIECES.bank.sockets(KITCHEN03_BOWL.bank);
  const [, counterOut] = PIECES.curve.sockets(KITCHEN03_BOWL.counter);
  void bankIn; // the bank's in-socket hangs off the rim's start — nothing seats on it yet
  const bankTransform = fitSocket(placed(BOWL_SOCKET_FRAMES['bowl.in']), bankOut);
  const curveTransform = fitSocket(placed(BOWL_SOCKET_FRAMES['bowl.out']), counterOut);
  return [
    { def: 'bank', params: KITCHEN03_BOWL.bank, transform: bankTransform, seq: startSeq }, // the bowl
    { def: 'curve', params: KITCHEN03_BOWL.counter, transform: curveTransform, seq: startSeq + 1 }, // rim closed
  ];
}

function parBuild(): Build {
  const timed = lay(
    [
      { def: 'ramp', params: L03_RAMP }, // the books (fixture) — the stage-5 chute
      { def: 'straight', params: { length: L03_STRAIGHT } }, // tray: the counter lip
      { def: 'gapLip', params: L03_LIP }, // tray
      { def: 'drop', params: L03_DROP }, // tray
      { def: 'landing', params: L03_LANDING }, // tray
      { def: 'straight', params: { length: L03_STRAIGHT } }, // tray: past the bowl
      { def: 'finishCup' }, // fixture: the cup BEFORE the rim line
    ],
    KITCHEN03_ID,
    1,
  );
  return { ...timed, pieces: [...timed.pieces, ...bowlFixtures(timed.pieces.length)] };
}

/** The bowl rim's two sockets, world-space — the SET's frames placed by this
 *  level's set mount (Concepts/Levels §Props expose sockets; the mesh passes
 *  through them by the set's own contract, `tests/unit/kitchen-set.test.ts`). */
function bowlSockets(): Record<string, Socket> {
  const build = parBuild();
  const bank = build.pieces.find((p) => p.def === 'bank')!;
  const counter = build.pieces.find((p) => p.def === 'curve' && p.seq > bank.seq)!;
  const [, rimOut] = PIECES.bank.sockets(bank.params);
  const [, counterOut] = PIECES.curve.sockets(counter.params);
  return {
    'bowl.in': transformSocket(rimOut, bank.transform),
    'bowl.out': transformSocket(counterOut, counter.transform),
  };
}

export const KITCHEN03: KitchenLevel = registerKitchen(
  kitchenLevel({
    id: KITCHEN03_ID,
    name: 'The Bowl',
    set: 'kitchen',
    seed: 1,
    startSocket: startSocketFromBuild(parBuild(), KITCHEN_GEOM.release * L03_RAMP_BLEND),
    par: { pieces: 5, time: 1.5 }, // the par line places the WHOLE 5-piece tray (measured 1.475 — regenerate via pars)
    maxTime: 12,
    tray: { straight: 2, gapLip: 1, drop: 1, landing: 1 },
    fixtures: { ramp: 1, finishCup: 1, bank: 1, curve: 1 },
    propSockets: bowlSockets(),
    parBuild,
  }),
);
