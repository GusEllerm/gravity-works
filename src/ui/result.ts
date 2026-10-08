/**
 * The end-of-run result panel (brief §9.1: "See the result: stars, time,
 * pieces, and a one-line physics note when it failed"). It is a PANEL AT THE
 * END of a run — §5.11 forbids panels over the set during one — so `boot.ts`
 * shows it only on a terminal status and hides it again on launch or edit.
 *
 * Two halves, deliberately separated:
 *
 * 1. The recorder + note (pure). `World.observe` reports WHICH ending
 *    happened (finished / fell / stalled / timeout — `hazard` joins when the
 *    stage-3 hazards ship) but not WHY, and the why must come from state we
 *    actually have. The recorder therefore samples the interpolable
 *    `WorldState` stream during the run and keeps seven honestly-derived
 *    witnesses (docs/vault/Modules/ui.md carries this coverage map):
 *
 *    - apex witness — the highest point reached and the speed there. For a
 *      vertical climb of height c the ring radius is ~c/2 and the
 *      contact-at-apex floor is v >= sqrt(g r) (brief §1 "the minimum speed
 *      to hold a loop"), so `sqrt(g * climb / 2)` is a computed floor, not a
 *      tuned constant.
 *    - touchdown witness — chassis pitch (from the quaternion) at the last
 *      air-to-ground transition. Nose-down past the deck's tolerance is a
 *      nose-first landing (brief §1's own example).
 *    - airborne witness — duration of the final flight segment, plus the
 *      takeoff seam: when it began and its VERTICAL speed (a one-step rate
 *      of the same position stream). A long flight before a fall is only a
 *      jump if the car left the deck RISING (stage-4 note fix, playtest K).
 *    - pitch-at-rest witness — chassis pitch on the last grounded sample:
 *      a car stopped nose-high ran out going uphill.
 *    - last-push witness — the time of the last speed GAIN (any gain: a
 *      launcher impulse or gravity): "where force last touched this run".
 *
 *    `physicsNote` reads ONLY these witnesses plus the result object. Any
 *    combination it cannot explain falls to the catch-all line rather than
 *    inventing precision — a note is never printed that the evidence could
 *    not have produced.
 *
 * 2. The panel (DOM). Plain accessible DOM like the builder: real text,
 *    aria-live, no panel chrome beyond the world palette, shown once per run.
 */
import { starsFor, starGlyphs, type Par, type RunResult } from '../world/stars.ts';
import type { PieceKind } from '../track/pieces.ts';
import { AIM_WALK_COPY } from './callouts.ts';
import type { AimHint } from './builder.ts';

// ---- witnesses --------------------------------------------------------------

/** The one structural slice of `WorldState` the recorder needs. */
export interface RunSample {
  time: number;
  car: {
    pos: { x: number; y: number; z: number };
    quat: { w: number; x: number; y: number; z: number };
    speed: number;
    grounded: boolean;
  };
}

export interface RunEvidence {
  /** Chassis y at the first sample of the run (world m). */
  startY: number;
  apexY: number;
  apexTime: number;
  /** Speed at the highest point (m/s). */
  apexSpeed: number;
  /** Chassis pitch at the last air-to-ground touchdown (rad, +=nose-up). */
  lastTouchdownPitch: number | null;
  /** Chassis pitch on the last GROUNDED sample (rad). */
  lastGroundedPitch: number | null;
  /** Duration of the final airborne segment (s). */
  finalAirtime: number;
  /** Time the final airborne segment BEGAN (s), or null if the run ended
   *  grounded. Stage-4 note derivation (playtest K, "'flew off — a long
   *  jump' on a run that never crossed the gap"): the long-jump line needs
   *  to know WHEN the car went quiet, not just that it was quiet for long —
   *  every fall off any counter-height deck is airborne ~0.4 s, so airtime
   *  alone calls every drive-off a jump (measured: the bare-kitchen01 rerun
   *  of playtest K, air 0.433 s, rise 0.000 m, takeoff vy −0.13 m/s —
   *  indistinguishable from a real lip jump by duration). */
  finalTakeoffTime: number | null;
  /** Vertical speed at the FIRST sample of the final airborne segment
   *  (world m/s, +=up), or null. Derived from the same position stream the
   *  apex witness already reads (one step's y delta across the FIXED_DT the
   *  recorder is fed) — no new state. The ballistic identity
   *  `vy² = 2 g · rise` makes it the rise witness's twin: a launched jump
   *  leaves the deck RISING, a drive-off is already falling. */
  finalTakeoffVy: number | null;
  /** Time of the last speed increase (s), or null if the car never gained. */
  lastPushTime: number | null;
}

/** World gravity, m/s^2 — the note's floor formula uses real g, not a knob. */
export const NOTE_G = 9.81;
/** Climb below this is not a loop, it is a hump (world m). */
export const APEX_MIN_CLIMB = 0.02;
/** Pitch beyond which a touchdown counts as nose-first (rad, ~20 deg). */
export const NOSE_FIRST_PITCH = -(20 * Math.PI) / 180;
/** Pitch above which a stopped car was "going uphill" (rad, ~10 deg). */
export const UPHILL_PITCH = (10 * Math.PI) / 180;
/** Airtime precondition of the long-jump line — never the whole of it (see
 *  `JUMP_MIN_TAKEOFF_VY`): every fall from counter height is airborne ~0.4 s,
 *  so duration alone printed "a long jump" on cars that never crossed a gap
 *  (playtest K). */
export const LONG_FLIGHT = 0.35;
/** Takeoff-rise floor of the long-jump line (world m/s, vertical speed at
 *  the airborne seam). Computed from the estimator's own noise, not tuned:
 *  the witness is a one-step position rate, so a dead-level drive-off reads
 *  0 ± g·FIXED_DT ≈ 0.08 m/s; the floor sits at 1.5× that. Measured: every
 *  kitchen fall replays (bare kitchen01 = playtest K's rerun, L03/L04
 *  drive-offs, gapLip-no-landing sink deaths) reads −0.13…−0.24 — the kit
 * *flattens every piece's exit tangent (pieces.ts `gapLip`), so nothing in
 *  the shipped game can honestly claim "the gap outran the landing" on a
 *  RISELESS flight, and no shipped build should print the line. A future
 *  piece that launches upward crosses the floor honestly. */
export const JUMP_MIN_TAKEOFF_VY = 0.12;

/** Pitch of a chassis quaternion: the local +x axis, in radians, +=nose-up. */
export function pitchOfQuat(q: { w: number; x: number; y: number; z: number }): number {
  // forward = q * (1,0,0), exact for a unit quaternion
  const fx = q.w * q.w + q.x * q.x - q.y * q.y - q.z * q.z;
  const fy = 2 * (q.x * q.y + q.w * q.z);
  const fz = 2 * (q.x * q.z - q.w * q.y);
  return Math.atan2(fy, Math.hypot(fx, fz));
}

export function emptyEvidence(startY = 0): RunEvidence {
  return {
    startY,
    apexY: startY,
    apexTime: 0,
    apexSpeed: 0,
    lastTouchdownPitch: null,
    lastGroundedPitch: null,
    finalAirtime: 0,
    finalTakeoffTime: null,
    finalTakeoffVy: null,
    lastPushTime: null,
  };
}

export interface RunRecorder {
  /** Zero the witnesses at a launch (call with the state AT release). */
  reset(first: RunSample): void;
  /** Feed one post-step state. Samples outside [0, +) of the run are ignored
   * by design: the recorder is reset per launch. */
  sample(s: RunSample): void;
  evidence(): RunEvidence;
}

export function createRunRecorder(): RunRecorder {
  let ev = emptyEvidence();
  let prev: RunSample | null = null;

  return {
    reset(first) {
      ev = emptyEvidence(first.car.pos.y);
      prev = first;
    },
    sample(s) {
      const p = prev;
      prev = s;
      if (s.car.pos.y > ev.apexY) {
        ev.apexY = s.car.pos.y;
        ev.apexTime = s.time;
        ev.apexSpeed = s.car.speed;
      }
      const dt = p ? Math.max(0, s.time - p.time) : 0;
      if (!s.car.grounded) {
        if (p && p.car.grounded) {
          // the grounded -> airborne seam marks the START of the final
          // flight: when it began and how fast it was RISING (one-step y
          // rate of the same position stream the apex witness reads — zero
          // new state). A mid-flight touch re-marks it, so the witnesses
          // always describe the FINAL airborne segment.
          ev.finalTakeoffTime = s.time;
          ev.finalTakeoffVy = dt > 0 ? (s.car.pos.y - p.car.pos.y) / dt : 0;
        }
        ev.finalAirtime += dt;
      }
      if (s.car.grounded) {
        ev.lastGroundedPitch = pitchOfQuat(s.car.quat);
        if (p && !p.car.grounded) ev.lastTouchdownPitch = pitchOfQuat(s.car.quat);
        ev.finalAirtime = 0; // only the FINAL airborne segment survives
      }
      if (p && s.car.speed > p.car.speed + 1e-4) ev.lastPushTime = s.time;
    },
    evidence() {
      return ev;
    },
  };
}

// ---- the note ---------------------------------------------------------------

/**
 * The one-line physics note. Failure lines by evidence priority — see the
 * map at the top of this file and in docs/vault/Modules/ui.md:
 *
 *   hazard touched        -> "a hazard took the run" (which one, once props report it)
 *   fell, nose-down touchdown -> fell off nose-first (ACTIONABLE tail:
 *                              each advice half only names a kind the
 *                              player can act on now — see
 *                              `actionableKinds` below)
 *   any slow-at-apex      -> fell off / stalled — too slow at the top of the loop
 *   fell after a long flight that ROSE off the deck -> fell off after a long jump
 *   fell otherwise        -> fell off ("the set" retired from player copy —
 *                              an internal word, playtest R; the head verb
 *                              is unchanged and still EQUALS the status
 *                              line) with a stock-shaped ADD tail naming
 *                              the kinds the tray still holds (stage-5 B2
 *                              pass 2, playtest AA — see THE DRIVE-OFF
 *                              TAIL below)
 *   stalled nose-high     -> stalled going uphill
 *   stalled after a push  -> stalled after its last push
 *   stalled otherwise     -> stalled on the flat (friction won)
 *   timeout               -> timed out — shorten the line or give it more speed
 *   anything unexplained  -> the catch-all (never a guess)
 *
 * STAGE 3 VOCABULARY PASS (playtest E "snapped vs seated"; G "status line
 * says seated with a flew-off verdict"). One verb per physics event, and
 * the note's head verb now EQUALS the shell's status-line verb in
 * `runStatusLine` (boot.ts) — the two places a player reads the same end:
 *
 *   event                     verb (status line = note head)
 *   cup capture               finished ("seated" belongs to the CUP now:
 *                             world.ts stall-capture; it is banned from the
 *                             placement ghost, renamed `reversed` there)
 *   leaving the set           fell off  (never also "flew off"/"landed")
 *   stopped, no grip left     stalled   (never also "ran out")
 *   clock                     timed out
 *   piece meets socket        snapped / reversed / invalid / blocked
 *                             (builder ghost states — placement words, no
 *                             longer sharing vocabulary with physics)
 *
 * A finished run gets no note — the panel already shows what finishing looked
 * like (§11: text never explains what a picture shows).
 *
 * BUILD-AWARE NOTES (stage 4, playtest M item: "'lower the lip' advice when I
 * had NO lip placed"; EXTENDED by playtest Q item 5: "'flatten the landing'
 * when Landing isn't in the tray (L2!)"). `actionableKinds` is the set of
 * piece KINDS the player can act on RIGHT NOW: kinds in the build that just
 * ran PLACED, plus kinds with stock still LEFT in the level's tray (plumbed
 * from `src/boot.ts` — UI-side derivation only; the physics, and therefore
 * the run hash, never see it). The rule: a note's ADVICE TAIL may only name
 * a kind the player can act on now — in build or in tray. A tail naming a
 * piece that is neither placed nor placeable is not advice, it is noise
 * (Q's K2: "flatten the landing" with no landing anywhere reachable). Each
 * advice half is gated by ITS OWN kind: the nose-first line prints
 * `flatten the landing` only when a landing is placed or still in the tray
 * and `lower the lip` only when a gapLip is; the stalled-on-the-flat line
 * names the booster only when the booster is actionable. When no actionable
 * kind can carry a tail the line keeps its honest head with no tail —
 * evidence without invented precision. `null` (no builder context — a
 * shared/replay page) keeps the shipped lines unchanged: with no knowledge
 * of the tray the gate stays permissive. Every tail stays admissible for
 * the evidence that printed it: a note is never printed that the run could
 * not have produced.
 *
 * PHRASING HONESTY (round 5, playtest W: a drop-only build that never placed
 * a Landing got "flatten the landing" and read it as a LIE — no landing to
 * flatten existed in the build). The gate above is logically honest but the
 * CRITIQUE verbs ("flatten", "lower") describe a piece the player is assumed
 * to have built, so a tray-only tail must not wear them. The three-way
 * truth per advice half: PLACED in the build that just ran → the critique
 * phrasing stands ("flatten the landing", "lower the lip"); TRAY-ONLY
 * (stocked, not placed) → ADD phrasing ("add a flat landing", "add a lip");
 * neither → the half is dropped, as before. `placedKinds` (the kinds in the
 * build that ran, from `placedKindsFor` in `src/boot.ts`) carries the split;
 * unknown (`null`) stays permissive and keeps the shipped critique wording.
 * Sibling sweep: the booster tail was already add-shaped ("add a booster")
 * — honest for a tray-only booster (place one) and for a placed one (add
 * another); the loop/uphill/last-push lines name no kinds at all, and the
 * long-jump line's "the gap outran the landing" is descriptive (evidence-
 * gated, never advice) — the critique-verb trap was only "flatten the
 * landing" / "lower the lip".
 *
 * THE DRIVE-OFF TAIL (stage-5 B2 pass 2, playtest AA: six different
 * bedroom02 builds, six deaths under the SAME tailless "the line let go
 * before the cup"). The builds differed mainly in WHICH pieces the tray
 * still held, and the tailless note never said so — "no advice text
 * differentiated my six builds". The plain drive-off branch — fell with no
 * other evidence — now carries an ADD tail naming the kinds with stock
 * LEFT in the tray (`stockedKinds`, `stockedKindsFor` in boot: tray count
 * minus what the build placed): "…; add a drop or a landing" when the
 * crossing pieces are still in the tray, "…; add a straight" when the
 * spare is a deck. This is the three-way rule at its strictest: the tail
 * can ONLY name a kind with tray stock (a used-up or absent kind never
 * appears — so it is always ADD-shaped, never a critique of a piece the
 * build has no more of), and the list PRINTS DIFFERENTLY per build, which
 * is what turns AA's six guesses into one informed retry: the deck-only
 * death lists the two crossing pieces (bridge the pillow — the lesson),
 * the almost-right line lists exactly the missing deck. Unknown stock
 * (`null` — shared/replay pages, no builder context) keeps the bare head
 * exactly as shipped.
 *
 * THE WHERE TAIL (stage 6, kitchen03's SECOND wall — playtests BB and DD, the
 * same rung, two strangers, six launches each: "the only snap is a curve exit
 * the game itself says is blocked — furniture is in the way", "building
 * backwards from the cup runs off-table", "] swaps to the car's start
 * point"). The drive-off tail names the KIND the tray still holds, which is
 * honest but LOCALITY-FREE: DD obeyed it six times and each time seated the
 * named kind at whichever end the ring happened to mark, so the advice kept
 * extending a line that pointed away from the cup. The rule this pass adds:
 * an ADD tail that names a kind ALSO names the end that kind extends —
 * `aimHint` (`builder.aimHint()` in `src/boot.ts`) is the far open exit of the
 * START-CONNECTED chain, the same socket `chainHeadIndex` aims the boot ring
 * at (playtest N's law: that socket IS the head of the par line), so the
 * sentence is a fact about the build graph, never a guess about intent: "add
 * a straight or a lip · place at: end of the pre-built ramp". The walk phrase
 * (`AIM_WALK_COPY`, shared with the builder's blocked line so one key keeps
 * one wording) appears ONLY when the ring marks some other end — teaching a
 * key the player does not need is noise. The tail rides the drive-off branch
 * ONLY: the nose-first family's advice is a HOW about a piece already placed
 * (the `flippedKinds` law above), and telling a player to place something
 * while telling them to re-place something is one sentence too many. Unknown
 * (`null` — a shared/replay page, no builder) keeps the shipped line exactly.
 *
 * HOW PHRASING (stage 5, playtest BB item 3: the nose-first tail "names a
 * change but never says HOW — Rotate only flips"). When the advice target
 * is a landing that was PLACED-AND-ROTATED, the nose-first line says the
 * RECIPE instead of the verdict — `re-place it flat (no R)`. That state
 * arrives as `flippedKinds` (from `flippedKindsFor(level, build)` in
 * `src/boot.ts`, the builder's amber reversed-fit test read back off the
 * build data): a landing in that set was mounted bent, so telling the
 * player to "flatten" it repeats the instruction that just failed. A
 * placed-and-straight landing keeps the plain `flatten the landing`; a
 * tray-only kind keeps its ADD wording; an unknown set (no builder
 * context) keeps the shipped wording like every other gate here.
 */
export function physicsNote(
  result: RunResult,
  ev: RunEvidence,
  actionableKinds: ReadonlySet<PieceKind> | null = null,
  placedKinds: ReadonlySet<PieceKind> | null = null,
  goalNoun: string | null = null,
  stockedKinds: ReadonlySet<PieceKind> | null = null,
  flippedKinds: ReadonlySet<PieceKind> | null = null,
  aimHint: AimHint | null = null,
): string {
  if (result.status === 'finished') return '';
  if (result.hazardsTouched > 0) return 'a hazard took the run — line up to miss it';

  /** Can the player act on this kind right now? null = unknown = permissive. */
  const canAct = (k: PieceKind): boolean => actionableKinds === null || actionableKinds.has(k);
  /** Is this kind in the build that just ran? Only then does CRITIQUE
   *  phrasing ("flatten it", "lower it") describe something that exists to
   *  critique; a tray-only kind gets ADD phrasing instead (playtest W). */
  const isPlaced = (k: PieceKind): boolean => placedKinds === null || placedKinds.has(k);
  /** Was this kind PLACED-AND-ROTATED (the builder's amber reversed fit)?
   *  Only then does the landing advice carry the HOW (playtest BB item 3:
   *  "flatten the landing names a change but never says HOW — Rotate only
   *  flips"): the rotated landing is flattened by RE-PLACING it without R,
   *  and saying so beats telling a player to flatten something the last R
   *  press just bent. Unknown (`null` — shared pages) keeps the plain
   *  shipped verb, the same permissive rule `isPlaced` follows. */
  const isRotated = (k: PieceKind): boolean => flippedKinds !== null && flippedKinds.has(k);

  const climb = ev.apexY - ev.startY;
  const apexFloor = Math.sqrt(NOTE_G * (climb / 2));
  const tooSlowAtApex = climb > APEX_MIN_CLIMB && ev.apexSpeed < apexFloor;

  /**
   * THE WHERE TAIL (stage 6, kitchen03's SECOND wall — playtests BB and DD,
   * the same rung, two strangers, six launches each: "the only snap is a
   * curve exit the game itself says is blocked — furniture is in the way",
   * "building backwards from the cup runs off-table", "] swaps to the car's
   * start point"). An ADD tail names a KIND and no PLACE, so DD obeyed it six
   * times and each time seated the named kind at whichever end the ring
   * happened to mark — extending a line that pointed away from the cup.
   * `builder.aimHint()` (plumbed in `src/boot.ts`) is the far open exit of the
   * START-CONNECTED chain, the socket `chainHeadIndex` aims the boot ring at
   * (playtest N's law: that socket IS the head of the par line) — so the
   * sentence states a fact about the build graph, never a guess about intent:
   * "add a straight or a lip · place at: end of the pre-built ramp". The walk
   * phrase (`AIM_WALK_COPY`, shared with the builder's blocked line so one key
   * keeps one wording) appears ONLY when the ring marks some other end —
   * teaching a key the player does not need is noise.
   *
   * TWO rules bound it, and they are why it is not simply glued to every
   * failure line: it rides an ADD tail ONLY (a critique — "flatten the
   * landing", "lower the lip", "re-place it flat (no R)" — is advice about a
   * piece already on the track, and "place something" stacked on "re-place
   * something" is one sentence too many), and `null` (`aimHint` unknown: a
   * shared or replay page, no builder) leaves the shipped line byte-identical.
   */
  const whereTail =
    aimHint === null
      ? ''
      : ` · place at: ${aimHint.label}${aimHint.ringHere ? '' : ` · ${AIM_WALK_COPY}`}`;

  if (result.status === 'fell') {
    if (ev.lastTouchdownPitch !== null && ev.lastTouchdownPitch < NOSE_FIRST_PITCH) {
      // each half of the advice names only a piece the player can reach
      // NOW (playtest M: no lip placed; playtest Q: no landing in the tray)
      // and PHRASES it by where that piece lives: critique verbs only for
      // pieces actually in the build, add- verbs for tray stock (playtest
      // W: "flatten the landing" on a build with no landing placed read
      // as a lie even though the gate had made it logically true)
      const advice = [
        canAct('landing')
          ? isPlaced('landing')
            ? isRotated('landing')
              ? 're-place it flat (no R)'
              : 'flatten the landing'
            : 'add a flat landing'
          : null,
        canAct('gapLip') ? (isPlaced('gapLip') ? 'lower the lip' : 'add a lip') : null,
      ].filter((s): s is string => s !== null);
      // THE WHERE TAIL rides this line when — and only when — a half of the
      // advice is an ADD ("add a flat landing", "add a lip"): playtest BB's
      // kitchen03 notes ARE this line, and each time the named kind landed on
      // the wrong end because nothing said which end. A CRITIQUE half
      // ("flatten…", "lower…", "re-place…") is about a piece already on the
      // track, and it stands exactly as shipped.
      const adding = advice.some((a) => a.startsWith('add '));
      return advice.length > 0
        ? `fell off nose-first — ${advice.join(' or ')}${adding ? whereTail : ''}`
        : 'fell off nose-first';
    }
    if (tooSlowAtApex) return 'fell off — too slow at the top of the loop; give it more height before it';
    // Stage-4 (playtest K: "'flew off — a long jump' on a run that never
    // crossed the gap"): airtime alone cannot tell a launched jump from a
    // drive-off — every fall off a counter is airborne ~0.4 s. The line
    // needs the rise witness too: a flight only "outran a landing" if the
    // deck LAUNCHED it upward (see JUMP_MIN_TAKEOFF_VY for the measurement).
    if (ev.finalAirtime > LONG_FLIGHT && ev.finalTakeoffVy !== null && ev.finalTakeoffVy > JUMP_MIN_TAKEOFF_VY) {
      return 'fell off after a long jump — the gap outran the landing';
    }
    // HEAD-NOUN HONESTY (stage 5, playtest AA: "'the line let go before the
    // cup' fired where no cup was visible"): the noun names the level's ACTUAL
    // goal fixture (`goalNounFor`, the fixtures table the target sweep speaks);
    // null keeps the shipped "cup" — honest for every level that shipped.
    // DRIVE-OFF TAIL (same playtest): fell with no other evidence — the car
    // was running and the LINE ended. Name what the tray STILL HOLDS: only
    // kinds with stock left may be named (strictest ADD-only reading), and
    // the list differs per build — six different wrong builds must not read
    // as one undifferentiated line. Unknown stock keeps the head alone.
    const head = `fell off — the line let go before the ${goalNoun ?? 'cup'}`;
    if (stockedKinds === null) return head;
    const named = ([
      ['straight', 'a straight'],
      ['drop', 'a drop'],
      ['gapLip', 'a lip'],
      ['landing', 'a landing'],
    ] as [PieceKind, string][])
      .filter(([k]) => stockedKinds.has(k))
      .map(([, w]) => w);
    if (named.length === 0) return head; // tray spent or empty — nothing honest to add
    const list =
      named.length === 1 ? named[0]! : `${named.slice(0, -1).join(', ')} or ${named[named.length - 1]!}`;
    // THE WHERE TAIL (stage 6, kitchen03's second wall — playtest DD: "the
    // only snap is a curve exit the game itself says is blocked — furniture is
    // in the way… building backwards from the cup runs off-table… ] swaps to
    // the car's start point"). The kind tail was honest but LOCALITY-FREE, so
    // six builds went and added the named kind AT THE WRONG END. The build
    // graph knows the end the next piece extends the line from — the far open
    // end of the start-connected chain, the same socket the boot ring is
    // bound to (playtest N's law) — so the note NAMES it, and names the key
    // that walks there only when the visible ring is on some other end
    // (nothing in this tail is a guess: `aimHint` is read off the build, and
    // an unknown/null hint leaves the shipped line exactly as it was).
    // THE WHERE TAIL (see `whereTail`): the kind list is honest but
    // LOCALITY-FREE, so the sentence also names the end the kind goes on.
    return `${head}; add ${list}${whereTail}`;
  }
  if (result.status === 'stalled') {
    if (tooSlowAtApex) return 'stalled — too slow at the top of the loop; give it more height before it';
    if (ev.lastGroundedPitch !== null && ev.lastGroundedPitch > UPHILL_PITCH) {
      return 'stalled going uphill — more speed or a shorter climb';
    }
    if (ev.lastPushTime !== null) {
      return 'stalled after its last push — the track ahead needs less than it gave';
    }
    // the booster is named only when the player can actually place one
    // (playtest Q's K5 wall: a tray without a booster must not be told to
    // buy one — the same fault as the unreachable landing advice). The
    // sibling-phrase sweep kept this tail as-is: "add a booster" is ALREADY
    // add-shaped, honest for a tray-only booster (place one) and a placed
    // one alike (add another) — no critique verb to lie.
    return canAct('booster')
      ? 'stalled on the flat — friction won; start higher or add a booster'
      : 'stalled on the flat — friction won; start higher';
  }
  if (result.status === 'timeout') {
    return 'timed out — shorten the line or give it more speed';
  }
  if (result.status === 'hazard') {
    // a hazard status without a counted touch should not happen; honest line
    return 'a hazard took the run — line up to miss it';
  }
  return 'physics said no somewhere this note cannot see — change one thing and try again';
}

// ---- the panel --------------------------------------------------------------

export interface ResultModel {
  stars: 0 | 1 | 2 | 3;
  time: number;
  piecesUsed: number;
  note: string;
  status: RunResult['status'];
  /** The par the run was scored against — the panel shows it beside both
   * tallies so the star rules are legible, not folklore (playtest B: "the
   * rules behind the stars are opaque"). */
  par: Par;
  /** The best star count the save ALREADY held on this level before this
   * run (playtest J: "N pieces — par M" is meaningless on a re-run of a
   * level whose stars are earned — the par is no longer a target there).
   * `>= 1` marks the run a replay; the shell reads it from the save BEFORE
   * `recordStars` writes this run's best (see `Modules/ui`). */
  bestStarsBefore: number;
}

/** Stars + note for one finished-or-not run: the panel's whole content.
 *  `actionableKinds` (kinds placed in the build that ran, plus kinds with
 *  stock left in the level's tray) gates the note's advice tails,
 *  `placedKinds` (the kinds actually in the build) phrases them,
 *  `flippedKinds` (the kinds placed in a reversed mount) makes the
 *  nose-first landing tail HOW-capable, `goalNoun` is the
 *  level's goal-fixture noun (`goalNounFor` in `src/boot.ts`), and `stockedKinds`
 *  (kinds with tray stock LEFT) carries the drive-off ADD tail — see `physicsNote`;
 *  none of them reaches the physics. */
export function resultModel(
  result: RunResult,
  par: Par,
  ev: RunEvidence,
  bestStarsBefore = 0,
  actionableKinds: ReadonlySet<PieceKind> | null = null,
  placedKinds: ReadonlySet<PieceKind> | null = null,
  goalNoun: string | null = null,
  stockedKinds: ReadonlySet<PieceKind> | null = null,
  flippedKinds: ReadonlySet<PieceKind> | null = null,
  /** Where the drive-off tail sends the player next (`builder.aimHint()` in
   *  `src/boot.ts`, the far open end of the start-connected chain) — UI-side
   *  advice only, the physics and the run hash never see it. */
  aimHint: AimHint | null = null,
): ResultModel {
  return {
    stars: starsFor(result, par),
    time: result.time,
    piecesUsed: result.piecesUsed,
    note: physicsNote(result, ev, actionableKinds, placedKinds, goalNoun, stockedKinds, flippedKinds, aimHint),
    status: result.status,
    par,
    bestStarsBefore,
  };
}

const STAR_RULES = 'Stars: finish the run · stay at or under par pieces · stay at or under par time';

/**
 * The star rules with THIS level's par numbers filled in — the line a
 * player reads BEFORE the first run (the level select's per-rung rules line
 * and the level's first-boot one-liner; playtest N: "the star rules only
 * appear after a run"). The panel keeps the static `STAR_RULES` phrasing;
 * this is the same three lines stated as one countable sentence.
 */
export function starRulesLine(par: Par): string {
  // one plain clause where a first-timer FIRST meets the word (playtests R+S:
  // "unexplained par times (what clock?)" / "par 2.65 s is meaningless noise")
  return `Stars: finish the run · at or under ${par.pieces} pieces (par) · at or under ${formatTime(par.time)} (par = the target time for this run)`;
}

/**
 * The panel's three explanatory lines, pure (unit-tested): the piece tally
 * and the time against their par lines, and the static star rule. The ✓/✗
 * marks appear only on a finished run — an unfinished one has 0 stars by
 * rule 1 and the note already says why (the marks would be noise).
 *
 * REPLAY HONESTY (playtest J: "N pieces — par M" meaningless on a re-run of
 * an already-starred level; playtest K: the numbers read half-true next to
 * the run's own story). On a FINISHED run of a level whose stars are already
 * earned, the par is not a target anymore — the lines lead with the run's
 * own numbers and mark the par as a clean verdict, `beat par ✓` / `over par`
 * (the par stays visible in parentheses: a verdict one cannot check is not
 * honest). A FAILURE keeps the failure rules exactly as written — unmarked
 * tallies plus the note, replay or not: on a failed run par is still the
 * target the NEXT attempt aims at.
 */
export function outcomeLines(model: ResultModel): { pieces: string; time: string; rules: string } {
  const finished = model.status === 'finished';
  if (finished && model.bestStarsBefore >= 1) {
    const verdict = (ok: boolean): string => (ok ? 'beat par ✓' : 'over par');
    return {
      pieces: `${model.piecesUsed} pieces — ${verdict(model.piecesUsed <= model.par.pieces)} (par ${model.par.pieces})`,
      time: `${formatTime(model.time)} — ${verdict(model.time <= model.par.time)} (par ${formatTime(model.par.time)})`,
      rules: STAR_RULES,
    };
  }
  const mark = (ok: boolean): string => (finished ? (ok ? ' ✓' : ' ✗') : '');
  return {
    pieces: `${model.piecesUsed} pieces — par ${model.par.pieces}${mark(model.piecesUsed <= model.par.pieces)}`,
    time: `${formatTime(model.time)} — par ${formatTime(model.par.time)}${mark(model.time <= model.par.time)}`,
    rules: STAR_RULES,
  };
}

export function formatTime(seconds: number): string {
  return `${Math.max(0, seconds).toFixed(2)} s`;
}

export interface ResultPanel {
  element: HTMLElement;
  /** The as-built retry: one click back to Launch (wired by the shell). */
  retry: HTMLButtonElement;
  /** On to the next rung of the ladder (wired by the shell; hidden when
   * this level has no next). */
  next: HTMLButtonElement;
  /** "Share this run" (wired by the shell; playtest AA: "I'd send replays
   * to a friend if the game would hand me a link"). The button produces a
   * `#s=` link; the row beside it carries the visible-link fallback and the
   * share-card PNG once a link exists. */
  share: HTMLButtonElement;
  /** The row holding the link input, the card button and the note. */
  shareRow: HTMLElement;
  /** The visible link (readonly, select-on-click) the shell fills after a
   * share press — the no-clipboard fallback. */
  shareUrl: HTMLInputElement;
  /** The card-PNG download (shell-wired; shown once a link exists). */
  shareCard: HTMLButtonElement;
  /** One honest line about the link: copied / copy it yourself / failed. */
  shareNote: HTMLElement;
  /** Retire the last run's share artifacts (a new run invalidates them). */
  resetShare(): void;
  show(model: ResultModel): void;
  hide(): void;
}

function panelButton(id: string, label: string, parent: HTMLElement): HTMLButtonElement {
  const b = document.createElement('button');
  b.id = id;
  b.type = 'button';
  b.textContent = label;
  // FOCUS POLICY (playtests P+Q, same law as the builder's toolbar): the
  // panel's buttons BLUR after activation, so the Enter that dismissed or
  // retried is never also the Enter that re-fires them — "Enter both
  // re-launches and dismisses the win overlay" was focus parked on a
  // panel button. After activation focus is the world's again.
  b.addEventListener('click', () => {
    if (document.activeElement === b) b.blur();
  });
  // no inline style: the panel's whole look lives in `src/ui/shell.css`,
  // where a `@media (max-height: …)` rule can actually shrink it (inline
  // styles outrank the stylesheet, and the playtest J viewport-safe pass
  // needs the compact-at-small-heights override to win).
  parent.appendChild(b);
  return b;
}

function makePanel(): {
  root: HTMLElement;
  stars: HTMLElement;
  time: HTMLElement;
  pieces: HTMLElement;
  rules: HTMLElement;
  note: HTMLElement;
  retry: HTMLButtonElement;
  next: HTMLButtonElement;
  share: HTMLButtonElement;
  shareRow: HTMLElement;
  shareUrl: HTMLInputElement;
  shareCard: HTMLButtonElement;
  shareNote: HTMLElement;
} {
  const root = document.createElement('div');
  root.id = 'gw-result';
  root.setAttribute('role', 'status');
  root.setAttribute('aria-live', 'polite');
  root.hidden = true;
  // over the world, never over a run: shown only at run end (§5.11). Warm
  // paper palette, no drop shadow (§5.10). CENTRED over the stage and
  // VIEWPORT-ANCHORED on show (see `createResultPanel`): pinned to a stage
  // corner, the panel landed off-viewport whenever the reader had scrolled
  // to look at the world (the deployed-page "invisible result" finding,
  // 3/3 playtesters); the stage-5 AA pass replaced the scroll-into-view fix
  // with a fixed-position anchor so being seen never costs a scroll.
  // VIEWPORT-SAFE (playtest J: at ~960x540 the panel outran the fold and
  // the Next button was cut off): every pixel of the panel is styled in
  // `src/ui/shell.css`, which caps it with max-height + overflow (the
  // scroll is a backstop) and switches to a compact layout at short
  // viewports, so BOTH buttons sit inside the window WITHOUT scrolling —
  // asserted at 960x540 in `tests/e2e/result.spec.ts`.
  const stars = document.createElement('p');
  stars.id = 'gw-result-stars';
  const time = document.createElement('p');
  time.id = 'gw-result-time';
  const pieces = document.createElement('p');
  pieces.id = 'gw-result-pieces';
  const rules = document.createElement('p');
  rules.id = 'gw-result-rules';
  const note = document.createElement('p');
  note.id = 'gw-result-note';
  const buttons = document.createElement('div');
  buttons.id = 'gw-result-buttons';
  const retry = panelButton('gw-result-retry', 'Retry', buttons);
  retry.setAttribute('aria-label', 'Retry this build from the start');
  const next = panelButton('gw-result-next', 'Next level', buttons);
  next.setAttribute('aria-label', 'Play the next level');
  // THE SHARE BUTTON LIVES ON THE PANEL (playtest AA item 1: "no share
  // button exists anywhere" while the whole `#s=` machinery was dead code
  // one import away). It rides the SAME button row (no extra panel line —
  // the viewport-safe 960x540 law from playtest J stays intact), and its
  // label names the thing it hands you: this run, as a link.
  const share = panelButton('gw-result-share', 'Share this run', buttons);
  share.setAttribute('aria-label', 'Copy a link to this run');
  // the share row: visible link + card download, revealed only once a link
  // exists (before the first press the panel shows just the buttons)
  const shareRow = document.createElement('div');
  shareRow.id = 'gw-result-share-row';
  shareRow.hidden = true;
  const shareUrl = document.createElement('input');
  shareUrl.id = 'gw-result-share-url';
  shareUrl.type = 'text';
  shareUrl.readOnly = true;
  shareUrl.setAttribute('aria-label', 'Share link for this run');
  shareUrl.addEventListener('focus', () => shareUrl.select());
  const shareCard = panelButton('gw-result-share-card', 'Card PNG', shareRow);
  shareCard.setAttribute('aria-label', 'Download the share card image');
  const shareNote = document.createElement('p');
  shareNote.id = 'gw-result-share-note';
  shareNote.setAttribute('role', 'status');
  shareNote.setAttribute('aria-live', 'polite');
  shareRow.prepend(shareUrl, shareNote);
  root.append(stars, time, pieces, rules, note, buttons, shareRow);
  return {
    root, stars, time, pieces, rules, note, retry, next,
    share, shareRow, shareUrl, shareCard, shareNote,
  };
}

/**
 * The panel over the world. One per game shell; `show` fills it (and reveals
 * it), `hide` removes it from view. It never appears during a run — the
 * shell only calls `show` on a terminal status.
 */
export function createResultPanel(host: HTMLElement): ResultPanel {
  const {
    root, stars, time, pieces, rules, note, retry, next,
    share, shareRow, shareUrl, shareCard, shareNote,
  } = makePanel();
  host.appendChild(root);
  return {
    element: root,
    retry,
    next,
    share,
    shareRow,
    shareUrl,
    shareCard,
    shareNote,
    resetShare() {
      shareRow.hidden = true;
      shareUrl.value = '';
      shareCard.hidden = true;
      shareNote.hidden = true;
    },
    show(model) {
      stars.textContent = starGlyphs(model.stars);
      // role=img + label so a screen reader says "2 of 3 stars", not "star star star"
      stars.setAttribute('role', 'img');
      stars.setAttribute('aria-label', `${model.stars} of 3 stars`);
      const lines = outcomeLines(model);
      time.textContent = lines.time;
      pieces.textContent = lines.pieces;
      rules.textContent = lines.rules;
      note.textContent = model.note;
      note.hidden = model.note === '';
      // THE FAILURE STRIP (playtest BB item 6: the failure panel rendered
      // mid-canvas and hid the ball's fate during the flight camera). A
      // FAILED run's verdict drops to the BOTTOM of the stage, so the wide
      // death hold keeps the ball's last second on screen above it — the
      // caption never stands between the player and the fate it reports
      // (`tests/e2e/playtest-bb.spec.ts` asserts the strip's rect and the
      // ball's projected screen point never overlap across the death
      // second). A finished run keeps the centred panel: its shot ends on
      // the cup dunk, where the panel rides the moment, not over it.
      const strip = model.status !== 'finished';
      root.classList.toggle('gw-result-strip', strip);
      // a fresh panel never keeps the last run's link (the hash would be stale)
      this.resetShare();
      // visibility on BOTH channels (the help drawer's lesson: `hidden`
      // alone loses to any inline display; display alone loses to a11y)
      // SCROLL ANCHOR (playtest AA item 4: "the results card yanks the page
      // scroll — I lost the canvas twice"): the panel NEVER scrolls the
      // document. It is absolute over the stage, so when the stage is on
      // screen the panel is already on screen; when the reader had scrolled
      // the stage away, the panel ANCHORS to the viewport (`position:
      // fixed`, still centred, still capped by the viewport-safe CSS) —
      // visible without moving the world. The old `scrollIntoView` did the
      // opposite: a document jump that teleported the canvas out from under
      // the player (the deployed-page "jump the panel into view" fix is
      // superseded; loop.spec's on-screen claim holds by anchoring now).
      // ScrollY is captured and restored across the mutation so no focus
      // rule, scroll anchoring, or button click can yank the page.
      const anchor = window.scrollY;
      root.style.position = '';
      root.style.top = '';
      root.style.bottom = '';
      root.hidden = false;
      root.style.display = '';
      const rect = root.getBoundingClientRect();
      if (!strip && (rect.top < 0 || rect.bottom > window.innerHeight)) {
        // anchored to the viewport, BELOW the sticky toolbar (playtest R's
        // law: the toolbar is always the thing under the cursor — the
        // panel must never trade that away to be seen). The FAILURE strip
        // needs no anchor branch: its CSS pins it to the viewport's bottom
        // edge, on screen whether or not the stage is.
        root.style.position = 'fixed';
        const host = document.getElementById('gw-builder-host');
        const below = host ? Math.round(host.getBoundingClientRect().bottom) : 0;
        root.style.top = `${Math.max(8, below + 6)}px`;
      }
      if (window.scrollY !== anchor) window.scrollTo(0, anchor);
    },
    hide() {
      const anchor = window.scrollY;
      root.hidden = true;
      root.style.display = 'none';
      root.style.position = '';
      root.style.top = '';
      root.style.bottom = '';
      root.classList.remove('gw-result-strip');
      if (window.scrollY !== anchor) window.scrollTo(0, anchor);
    },
  };
}
