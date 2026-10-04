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
import { BOWL_SOCKET_FRAMES } from '../../sets/kitchen/data.ts';
import { kitchenSetPlacement, placementMatrix } from '../setPlacement.ts';
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
      { def: 'ramp', params: kitchenRamp(0.3) }, // the books (fixture)
      { def: 'straight', params: { length: 0.1 } }, // tray
      { def: 'gapLip', params: KITCHEN_GAP.lip }, // tray
      { def: 'drop', params: KITCHEN_GAP.drop }, // tray
      { def: 'landing', params: KITCHEN_GAP.landing }, // tray
      { def: 'straight', params: { length: 0.2 } }, // tray: past the bowl
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
    startSocket: startSocketFromBuild(parBuild(), KITCHEN_GEOM.release * KITCHEN_GEOM.rampBlend),
    par: { time: 2.5 }, // measured (regenerate via pars)
    maxTime: 12,
    tray: { straight: 2, gapLip: 1, drop: 1, landing: 1 },
    fixtures: { ramp: 1, finishCup: 1, bank: 1, curve: 1 },
    propSockets: bowlSockets(),
    parBuild,
  }),
);
