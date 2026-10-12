/**
 * THE TALLY — badge detectors as PURE functions of a recorded trace
 * (Freeplay program Lane B, [[Concepts/Freeplay Exploration]] candidate B,
 * [[Reference/Freeplay Feasibility]] §3). Every badge is an APPROVAL the
 * physics already granted: nothing here scores anything the sim did not
 * decide, and nothing here touches the sim. The detector math is the
 * spike's (`tools/spike-freehouse.mjs` T4 — 7 events / 1.4 ms /
 * hash-neutral), promoted to product: the probes read `TraceSample` lists
 * (the tape) and nothing else — no bodies, no stepping, no wall clocks.
 * THE TALLY LAW (Decision Log 2026-10-12): badges are approvals physics
 * granted; the thresholds are swept in CI (`tools/tally-sweep.mjs`) so a
 * single rig cannot farm the sheet.
 */
import { FIXED_DT } from '../physics/sim.ts';

/** The minimal per-step view the detectors read — structurally the
 *  `TraceSample` of `src/replay/replay.ts` (world metres, quaternion
 *  x,y,z,w). Kept structural so the page tape and the Node trace both
 *  satisfy it without an import cycle. */
export interface TallySample {
  t: number;
  pos: [number, number, number];
  quat: [number, number, number, number];
  speed: number;
  grounded: boolean;
}

export type BadgeKind = 'air' | 'catch' | 'crossing' | 'chainFall' | 'spend';

export const BADGE_KINDS: readonly BadgeKind[] = ['air', 'catch', 'crossing', 'chainFall', 'spend'];

export const BADGE_WORDS: Record<BadgeKind, string> = {
  air: 'air',
  catch: 'clean catch',
  crossing: 'room crossing',
  chainFall: 'chain fall',
  spend: 'booster spend',
};

/** One granted approval: when it landed and what it measured (seconds /
 *  metres, per kind). `room` carries the room name in `label`. */
export interface TallyEvent {
  kind: BadgeKind;
  /** Sim time of the approving step (the landing, the crossing, the spend). */
  t: number;
  /** What the badge measured: air time / run-out / fall time / speed gain
   *  (world units), or the room name for a crossing. */
  value: number;
  label?: string;
}

/** A room's parcel on the floor plane (the spike's `roomOf`, stated as
 *  data — the house-frame table's future rows). A level that has not
 *  declared rooms has no crossings to grant: `rooms` stays empty and the
 *  crossing detector never fires, which is the honest campaign/sandbox
 *  answer (one room, nothing to cross). */
export interface RoomRect {
  name: string;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

// ---- the thresholds (swept, not tuned — tools/tally-sweep.mjs) --------------

/** Air-time a flight must outlast to be air, not a deck seam (s). The
 *  feasibility probe's own number: > 0.25 s. */
export const AIR_MIN_S = 0.25;
/** Flat ground the landing must hold after touchdown to be a CATCH, not a
 *  bounce-and-roll (world m). Half a car length at 1:10 toy scale —
 *  measured: the kit's landing decks carry a caught car 0.30+ m before any
 *  campaign par line turns or slows; a 0.10 bounce-roll never reaches it. */
export const RUNOUT_MIN_M = 0.15;
/** A flight must be a flight first: below `AIR_MIN_S` of air there is no
 *  catch to grant (a grounded wobble is a weld, not a landing). */
export const CATCH_MIN_AIR_S = 0.15;
/** Descent a FALL must span (world m). Every kit `drop` is steeper than
 *  this in one piece; a ramp run-in is not a fall at all. THE CHAIN FALL
 *  is the airborne kind: the physics let go of the car (grounded false)
 *  and kept letting go — a sustained slope descent with wheels on a deck
 *  is gravity doing its daily job, not an approval (the sweep's first
 *  pass measured wheel-on-deck descents granting 2–3 per campaign run —
 *  the sheet lied by generosity; the airborne reading measures 0–1). */
export const FALL_MIN_DROP_M = 0.06;
/** How long the fall must hold (s). The spike's 20-step floor at 120 Hz. */
export const FALL_MIN_S = 0.15;
/** One-step speed GAIN a launcher must beat to be a SPEND, not gravity:
 *  gravity on a slope can add at most `g·FIXED_DT ≈ 0.082` m/s to the
 *  magnitude per step; 3× that is beyond anything a passive deck does and
 *  is below every `booster`/`springLauncher` impulse the kit ships (the
 *  `power` default is 1.8 m/s). Computed from the noise floor, not tuned —
 *  the `JUMP_MIN_TAKEOFF_VY` idiom. */
export const SPEND_MIN_GAIN_MPS = 3 * 9.81 * FIXED_DT;
/** Badge ceiling: no single rig may earn MORE than this in one run — the
 *  gate `tools/tally-sweep.mjs` measures and CI asserts (`--gate`). */
export const BADGE_CAP_PER_RUN = 6;

export interface TallyOptions {
  rooms?: readonly RoomRect[];
}

function roomAt(rooms: readonly RoomRect[], x: number, z: number): string | null {
  for (const r of rooms) {
    if (x >= r.minX && x <= r.maxX && z >= r.minZ && z <= r.maxZ) return r.name;
  }
  return null;
}

/**
 * The sheet for one run: every badge the physics granted, in sim order,
 * derived by one read-only pass over the tape. PURE — the same trace
 * yields the same list on every machine, and the derivation reads no
 * bodies and steps nothing, so mounting it over a live run moves no hash
 * (`tests/unit/tally.test.ts` pins both claims — THE TALLY LAW's proof).
 */
export function tallyFromTrace(
  trace: readonly TallySample[],
  options: TallyOptions = {},
): TallyEvent[] {
  const events: TallyEvent[] = [];
  const rooms = options.rooms ?? [];
  let airStart: number | null = null;
  let airStartY = 0;
  let runoutDist = 0;
  let catchPending = false; // the flight that just touched down was long enough
  let lastRoom: string | null = rooms.length
    ? trace.length
      ? roomAt(rooms, trace[0]!.pos[0], trace[0]!.pos[2])
      : null
    : null;
  for (let i = 0; i < trace.length; i++) {
    const s = trace[i]!;
    const p = i > 0 ? trace[i - 1]! : null;

    // air-time: a grounded->airborne segment that outlasts AIR_MIN_S,
    // granted at the touchdown the flight ends on (the spike's rule).
    if (!s.grounded && airStart === null) {
      airStart = s.t;
      airStartY = s.pos[1];
    }
    if (s.grounded && airStart !== null) {
      const air = s.t - airStart;
      if (air > AIR_MIN_S) events.push({ kind: 'air', t: s.t, value: air });
      // THE CHAIN FALL: the same airborne segment, read for what physics
      // GRANTED — a sustained descent (the car fell for longer than
      // FALL_MIN_S and lower than FALL_MIN_DROP_M). Two approvals from
      // one flight (air AND fall) only when the flight is both long and
      // deeply down; the sweep caps what any rig can farm.
      const drop = airStartY - s.pos[1];
      if (air >= FALL_MIN_S && drop >= FALL_MIN_DROP_M) {
        events.push({ kind: 'chainFall', t: s.t, value: air });
      }
      // the same touchdown opens the clean-catch candidate: only a flight
      // of CATCH_MIN_AIR_S can be caught, and the badge lands only if the
      // landing deck then carries the car RUNOUT_MIN_M of honest ground.
      catchPending = air >= CATCH_MIN_AIR_S;
      runoutDist = 0;
      airStart = null;
    } else if (catchPending && s.grounded) {
      if (s.speed < 0.05) {
        catchPending = false; // the run-out died: a stop is not a catch
      } else {
        if (p) runoutDist += Math.hypot(s.pos[0] - p.pos[0], s.pos[2] - p.pos[2]);
        if (runoutDist >= RUNOUT_MIN_M) {
          events.push({ kind: 'catch', t: s.t, value: runoutDist });
          catchPending = false;
        }
      }
    }

    // booster / spring spend: a one-step speed gain beyond anything gravity
    // can add (the launchers' impulse is a step event the tape shows).
    if (p && s.speed - p.speed > SPEND_MIN_GAIN_MPS) {
      events.push({ kind: 'spend', t: s.t, value: s.speed - p.speed });
    }

    // room-to-room crossing: the parcel the car sits in changes (a trace
    // that leaves every parcel matches nothing and grants nothing).
    if (rooms.length) {
      const room = roomAt(rooms, s.pos[0], s.pos[2]);
      if (room !== null && room !== lastRoom) {
        if (lastRoom !== null) events.push({ kind: 'crossing', t: s.t, value: 0, label: room });
        lastRoom = room;
      }
    }
  }
  return events;
}

/** Collapse a run's events into per-kind counts, in `BADGE_KINDS` order —
 *  the shape the save accumulates and the result tail prints. */
export function tallyCounts(events: readonly TallyEvent[]): Partial<Record<BadgeKind, number>> {
  const counts: Partial<Record<BadgeKind, number>> = {};
  for (const e of events) counts[e.kind] = (counts[e.kind] ?? 0) + 1;
  return counts;
}
