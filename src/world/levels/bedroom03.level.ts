/**
 * BEDROOM 03 — "Pyramid Air" (the set's signature, and the tunnel dream).
 *
 * The book pyramid is the tallest thing on the floor and the drawer bore is
 * the set's one tunnel — this rung is the TRADE-OFF between the two lines
 * off the pyramid edge. The PAR line is the HARD catch: launch off the
 * pyramid (`gapLip`), take the `drop`'s stepped catch onto the desk deck,
 * roll out (4 of the 5 tray pieces, the faster measured line). The SOFT
 * line swaps the `drop` for the `landing` — the same launch, a shallower
 * catch, a slower run-out (also finish, also asserted). Which catch you
 * BUY with the launch is the lesson: one launch, two catchers, different
 * clocks.
 *
 * THE TUNNEL THAT IS NOT (yet): the half-open drawer would be the third
 * line — a straight run THROUGH the bore, the daylight gap at both ends.
 * It stays a fixture-side dream for the same two reasons the kitchen bowl
 * line did: (a) the builder cannot seat a piece on a PROP socket (ask #4),
 * and (b) the bore never touches the level corridor — the dresser sits
 * behind the +x line the set mounts against, and its `drawer.in` tangent
 * points OUT of the bore (`+DRAWER_AXIS` at the front face), against the
 * in-then-through travel direction the bowl-socket convention states. The
 * pair is exported as `propSockets` on this level anyway, placed exactly as
 * this level mounts the set — the ask to the Environment Artist is one
 * tangent flip plus a lane-crossing anchor, not a remodel. See
 * Concepts/Levels §Piece requests (bedroom asks) and the session log.
 */
import type { Build } from '../../track/build.ts';
import * as THREE from 'three';
import type { Socket } from '../../track/socket.ts';
import { DRAWER_SOCKET_FRAMES } from '../../sets/bedroom/data.ts';
import { bedroomSetPlacement, transformByPlacement } from '../setPlacement.ts';
import {
  KITCHEN_GAP,
  kitchenRamp,
  lay,
  startSocketFromBuild,
} from './kitchen01.level.ts';
import {
  BEDROOM_GEOM,
  BEDROOM_STRAIGHT,
  CABLE_DIP,
  bedroomLevel,
  registerBedroom,
  type BedroomLevel,
} from './bedroom01.level.ts';

export const BEDROOM03_ID = 'bedroom03';

/** The soft alternative's catcher: a LONGER, gentler run-out than the hard
 *  `drop` deck (0.32 m of deck at 12°) — the piece the par line never
 *  places, declared in `trayParams` so it seats at this geometry. */
const SOFT = { level: 0.32, angle: 12, blend: 0.06 };

function parBuild(): Build {
  return lay(
    [
      { def: 'ramp', params: kitchenRamp(0.3) }, // the pyramid top (fixture)
      { def: 'straight', params: { length: BEDROOM_STRAIGHT } }, // tray: the pyramid deck
      { def: 'gapLip', params: KITCHEN_GAP.lip }, // tray: the launch off the books
      { def: 'drop', params: CABLE_DIP.drop }, // tray: the HARD catch onto the desk deck
      { def: 'straight', params: { length: BEDROOM_STRAIGHT } }, // tray: the run-out
      { def: 'finishCup' }, // fixture
    ],
    BEDROOM03_ID,
    1,
  );
}

/** The SOFT line: the same launch, the `landing` instead of the `drop`.
 *  Both lines finish; the hard catch is the faster clock (the trade-off is
 *  measured, not asserted — `tests/unit/bedroom-levels.test.ts`). */
export function bedroom03SoftBuild(): Build {
  return lay(
    [
      { def: 'ramp', params: kitchenRamp(0.3) },
      { def: 'straight', params: { length: BEDROOM_STRAIGHT } },
      { def: 'gapLip', params: KITCHEN_GAP.lip },
      { def: 'landing', params: SOFT }, // the soft catch
      { def: 'straight', params: { length: BEDROOM_STRAIGHT } },
      { def: 'finishCup' },
    ],
    BEDROOM03_ID,
    1,
  );
}

/** The drawer bore's two sockets, world-space — the SET's frames carried by
 *  this level's mount (the bowl-rim convention, Concepts/Levels §Props
 *  expose sockets). Staging data for the blocked tunnel line, and the
 *  numbers the Environment Artist's tangent/anchor ask is stated against. */
function drawerSockets(): Record<string, Socket> {
  const placement = bedroomSetPlacement(BEDROOM03_ID);
  if (!placement) throw new Error(`bedroom03: no bedroom set placement registered`);
  const out: Record<string, Socket> = {};
  for (const [name, f] of Object.entries(DRAWER_SOCKET_FRAMES)) {
    out[name] = {
      pos: new THREE.Vector3(...transformByPlacement(placement, ...f.pos)),
      tangent: new THREE.Vector3(...f.tangent),
      up: new THREE.Vector3(0, 1, 0),
    };
  }
  return out;
}

export const BEDROOM03: BedroomLevel = registerBedroom(
  bedroomLevel({
    id: BEDROOM03_ID,
    name: 'Pyramid Air',
    set: 'bedroom',
    seed: 1,
    startSocket: startSocketFromBuild(parBuild(), BEDROOM_GEOM.release * BEDROOM_GEOM.rampBlend),
    // 4 of the 5 tray pieces are placed on the par line — measured.
    par: { pieces: 4, time: 2.7 },
    maxTime: 12,
    tray: { straight: 2, gapLip: 1, drop: 1, landing: 1 },
    trayParams: { landing: SOFT },
    fixtures: { ramp: 1, finishCup: 1 },
    propSockets: drawerSockets(),
    parBuild,
  }),
);
