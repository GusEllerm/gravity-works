/**
 * PORCH 02 — "The Open Door" (the CHOICE: laze along the deck line, or pop
 * the showy launch at the door mouth — and the lazy line is the fast one,
 * the family lesson restaged on the porch's own clocks).
 *
 * The door assembly stands open and the screen stands shut: the ratified
 * set gives this room its one socketed signature, the threshold pair
 * `door.in`/`door.out` (`PORCH_SOCKET_FRAMES`). The ride THROUGH the door is
 * STAGING — the bathroom-drain / garden-bore / garage-wheel pattern, and
 * this rung exports the pair as `propSockets` through its own mount so the
 * ask is stated against real numbers (the bedroom03 convention): the pair's
 * travel tangent is +z, ACROSS the +x lane the level chains along, and a
 * bore ride still wants ask #4's prop-socket seating and ask #1's drivable
 * yaw behind a lane-crossing anchor (the porch ask, session log). The RUNG
 * is not blocked: both authored lines finish, on BOTH mountings.
 *
 * The two lines are the tray's whole union (5 pieces, none spare) and ONE
 * swap apart — the reach-sum law's equality: the deck line rolls
 * `straight → straight → drop → straight`; the DOOR line spends the lip on
 * the same hole (`straight → gapLip → drop → straight`) and pays the pop.
 * Because the swap piece is span-equal (the lip's span IS the ladder's
 * 0.11 m straight, kitchen02's law), BOTH lines end on the same deck plane:
 * the lazy line 1.10 vs the arc 1.15 chained, and on the BUILDER-ANCHORED
 * mount both STILL reach the cup and the lazy one still wins (bathroom02's
 * "ask #2b bites LESS" property, this time BY CONSTRUCTION of the reach-sum
 * equality — the anchored truth this ladder can honestly promise for its
 * choice rung). Whole-tray orders finish every order the test samples — the
 * union sums are order-invariant, so this tray is whole-order-invariant
 * like kitchen02's (the choice rung that is NOT the bathroom02 sweep class:
 * the porch spends L02's union, not the 39-of-60 one).
 *
 * The fail stream is the porch's promise: the chute caps every wrong-build
 * death at ~1.3 s in kitchen02's four clocked families (enumerated by
 * `tmp/porch-sweep.mjs`, pinned by the ladder test) — nothing crawls,
 * nothing dies past the cup, and the weave's shade across the void teaches
 * the doctrine while they fall.
 */
import * as THREE from 'three';
import type { Build } from '../../track/build.ts';
import type { Socket } from '../../track/socket.ts';
import {
  PORCH_GEOM,
  PORCH_STRAIGHT,
  THRESHOLD_GAP,
  porchChute,
  porchLevel,
  registerPorch,
  type PorchLevel,
} from './porch01.level.ts';
import { lay, startSocketFromBuild } from './kitchen01.level.ts';
import { porchSetPlacement, transformByPlacement } from '../setPlacement.ts';
import { PORCH_SOCKET_FRAMES } from '../../sets/porch/data.ts';

export const PORCH02_ID = 'porch02';

function parBuild(): Build {
  return lay(
    [
      { def: 'ramp', params: porchChute() }, // the hall-side step (fixture)
      { def: 'straight', params: { length: PORCH_STRAIGHT } }, // tray: the deck plank
      { def: 'straight', params: { length: PORCH_STRAIGHT } }, // tray: the deck plank
      { def: 'drop', params: THRESHOLD_GAP.drop }, // tray: the threshold + its catch
      { def: 'straight', params: { length: PORCH_STRAIGHT } }, // tray: the plank to the cup
      { def: 'finishCup' }, // fixture
    ],
    PORCH02_ID,
    1,
  );
}

/** The DOOR line: the same run with the lip spent on the hole — the showy
 *  launch aimed past the door mouth (staging; the pair exported below).
 *  Kept as data so the test can prove both lines finish on both mountings
 *  and which clock wins (it is not this one). */
export function porch02DoorBuild(): Build {
  return lay(
    [
      { def: 'ramp', params: porchChute() },
      { def: 'straight', params: { length: PORCH_STRAIGHT } }, // the deck plank, same seating
      { def: 'gapLip', params: THRESHOLD_GAP.lip }, // the pop the CHOICE is about
      { def: 'drop', params: THRESHOLD_GAP.drop }, // the same threshold catch
      { def: 'straight', params: { length: PORCH_STRAIGHT } },
      { def: 'finishCup' },
    ],
    PORCH02_ID,
    1,
  );
}

/** The threshold pair as PLACED by this level's set mount (the
 *  `BOWL_SOCKET_FRAMES` convention): the frames ride `porchSetPlacement`
 *  into world space so a future bank seats wherever the room stands. */
function doorSockets(): Record<string, Socket> {
  const p = porchSetPlacement(PORCH02_ID);
  if (!p) throw new Error(`porch02: no porch set placement registered`);
  const out: Record<string, Socket> = {};
  for (const [name, f] of Object.entries(PORCH_SOCKET_FRAMES)) {
    if (!name.startsWith('door.')) continue;
    out[name] = {
      pos: new THREE.Vector3(...transformByPlacement(p, f.pos[0], f.pos[1], f.pos[2])),
      tangent: new THREE.Vector3(...f.tangent),
      up: new THREE.Vector3(0, 1, 0),
    };
  }
  return out;
}

export const PORCH02: PorchLevel = registerPorch(
  porchLevel({
    id: PORCH02_ID,
    name: 'The Open Door',
    set: 'porch',
    seed: 1,
    startSocket: startSocketFromBuild(parBuild(), PORCH_GEOM.release * PORCH_GEOM.rampBlend),
    // 4 of the 5 tray pieces are placed on the par (deck) line — measured,
    // regenerate via `npm run pars`.
    par: { pieces: 4, time: 1.2 },
    maxTime: 12,
    // the tray IS the union of the two lines — 5 pieces, none spare.
    tray: { straight: 3, gapLip: 1, drop: 1 },
    // the door line's piece: the par (deck) line never places a `gapLip`,
    // so without this declaration the piece the CHOICE exists for would
    // seat at kit defaults and break the reach-sum equality both lines and
    // the whole-order gate are measured on (the stage-3 coherence rule).
    trayParams: { gapLip: THRESHOLD_GAP.lip },
    fixtures: { ramp: 1, finishCup: 1 },
    propSockets: doorSockets(),
    parBuild,
  }),
);
