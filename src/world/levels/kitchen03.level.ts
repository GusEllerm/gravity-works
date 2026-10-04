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
 */
import { PIECES } from '../../track/pieces.ts';
import { transformSocket } from '../../track/socket.ts';
import type { Build } from '../../track/build.ts';
import type { Socket } from '../../track/socket.ts';
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

function parBuild(): Build {
  return lay(
    [
      { def: 'ramp', params: kitchenRamp(0.3) }, // the books (fixture)
      { def: 'straight', params: { length: 0.1 } }, // tray
      { def: 'gapLip', params: KITCHEN_GAP.lip }, // tray
      { def: 'drop', params: KITCHEN_GAP.drop }, // tray
      { def: 'landing', params: KITCHEN_GAP.landing }, // tray
      { def: 'straight', params: { length: 0.2 } }, // tray: past the bowl
      { def: 'finishCup' }, // fixture: the cup BEFORE the rim line
      { def: 'bank', params: KITCHEN03_BOWL.bank }, // fixture: the bowl
      { def: 'curve', params: KITCHEN03_BOWL.counter }, // fixture: rim closed
    ],
    KITCHEN03_ID,
    1,
  );
}

/** The bowl rim's two sockets, world-space, derived from the par build — the
 *  Environment Artist's build target (Concepts/Levels §Props expose sockets). */
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
