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
 *    `WorldState` stream during the run and keeps five honestly-derived
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
 *    - airborne witness — duration of the final flight segment: a long
 *      flight before a fall is a jump that outran its landing.
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
/** A final flight this long means the fall followed a jump, not a gap edge (s). */
export const LONG_FLIGHT = 0.35;

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
      if (!s.car.grounded) ev.finalAirtime += dt;
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
 *   fell, nose-down touchdown -> landed nose-first
 *   any slow-at-apex      -> too slow at the top of the loop (computed floor)
 *   fell after a long flight -> the jump outran the landing
 *   fell otherwise        -> fell off the set
 *   stalled nose-high     -> ran out going uphill
 *   stalled after a push  -> ran out after its last push
 *   stalled otherwise     -> ran out on the flat (friction won)
 *   timeout               -> never made it inside the time limit
 *   anything unexplained  -> the catch-all (never a guess)
 *
 * A finished run gets no note — the panel already shows what finishing looked
 * like (§11: text never explains what a picture shows).
 */
export function physicsNote(result: RunResult, ev: RunEvidence): string {
  if (result.status === 'finished') return '';
  if (result.hazardsTouched > 0) return 'a hazard took the run — line up to miss it';

  const climb = ev.apexY - ev.startY;
  const apexFloor = Math.sqrt(NOTE_G * (climb / 2));
  const tooSlowAtApex = climb > APEX_MIN_CLIMB && ev.apexSpeed < apexFloor;

  if (result.status === 'fell') {
    if (ev.lastTouchdownPitch !== null && ev.lastTouchdownPitch < NOSE_FIRST_PITCH) {
      return 'landed nose first — flatten the landing or lower the lip';
    }
    if (tooSlowAtApex) return 'too slow at the top of the loop — give it more height before it';
    if (ev.finalAirtime > LONG_FLIGHT) return 'flew off after a long jump — the gap outran the landing';
    return 'fell off the set — the line let go before the cup';
  }
  if (result.status === 'stalled') {
    if (tooSlowAtApex) return 'too slow at the top of the loop — give it more height before it';
    if (ev.lastGroundedPitch !== null && ev.lastGroundedPitch > UPHILL_PITCH) {
      return 'ran out going uphill — more speed or a shorter climb';
    }
    if (ev.lastPushTime !== null) {
      return 'ran out of speed after its last push — the track ahead needs less than it gave';
    }
    return 'ran out of speed on the flat — friction won; start higher or add a booster';
  }
  if (result.status === 'timeout') {
    return 'never made it — the run went past the time limit';
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
}

/** Stars + note for one finished-or-not run: the panel's whole content. */
export function resultModel(result: RunResult, par: Par, ev: RunEvidence): ResultModel {
  return {
    stars: starsFor(result, par),
    time: result.time,
    piecesUsed: result.piecesUsed,
    note: physicsNote(result, ev),
    status: result.status,
    par,
  };
}

/**
 * The panel's three explanatory lines, pure (unit-tested): the piece tally
 * and the time against their par lines, and the static star rule. The ✓/✗
 * marks appear only on a finished run — an unfinished one has 0 stars by
 * rule 1 and the note already says why (the marks would be noise).
 */
export function outcomeLines(model: ResultModel): { pieces: string; time: string; rules: string } {
  const finished = model.status === 'finished';
  const mark = (ok: boolean): string => (finished ? (ok ? ' ✓' : ' ✗') : '');
  return {
    pieces: `${model.piecesUsed} pieces — par ${model.par.pieces}${mark(model.piecesUsed <= model.par.pieces)}`,
    time: `${formatTime(model.time)} — par ${formatTime(model.par.time)}${mark(model.time <= model.par.time)}`,
    rules: 'Stars: finish the run · stay at or under par pieces · stay at or under par time',
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
  show(model: ResultModel): void;
  hide(): void;
}

function panelButton(id: string, label: string, parent: HTMLElement): HTMLButtonElement {
  const b = document.createElement('button');
  b.id = id;
  b.type = 'button';
  b.textContent = label;
  b.style.cssText =
    'font:inherit;font-size:13px;padding:4px 10px;border-radius:4px;border:1px solid #fdf2e0;background:transparent;color:#fdf2e0;cursor:pointer';
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
} {
  const root = document.createElement('div');
  root.id = 'gw-result';
  root.setAttribute('role', 'status');
  root.setAttribute('aria-live', 'polite');
  root.hidden = true;
  // over the world, never over a run: shown only at run end (§5.11). Warm
  // paper palette, no drop shadow (§5.10). CENTRED over the stage and
  // scrolled into view on show — pinned to a stage corner, the panel landed
  // off-viewport whenever the reader had scrolled to look at the world
  // (the deployed-page "invisible result" finding, 3/3 playtesters).
  root.style.cssText =
    'position:absolute;top:8px;left:50%;transform:translateX(-50%);padding:8px 12px;background:rgba(62,46,32,0.88);color:#fdf2e0;font:14px/1.4 system-ui,sans-serif;max-width:380px';
  const stars = document.createElement('p');
  stars.id = 'gw-result-stars';
  stars.style.cssText = 'margin:0;font-size:20px;letter-spacing:2px';
  const time = document.createElement('p');
  time.id = 'gw-result-time';
  time.style.cssText = 'margin:0';
  const pieces = document.createElement('p');
  pieces.id = 'gw-result-pieces';
  pieces.style.cssText = 'margin:0';
  const rules = document.createElement('p');
  rules.id = 'gw-result-rules';
  rules.style.cssText = 'margin:2px 0 0;font-size:11px;opacity:0.85';
  const note = document.createElement('p');
  note.id = 'gw-result-note';
  note.style.cssText = 'margin:4px 0 0;font-style:italic';
  const buttons = document.createElement('div');
  buttons.id = 'gw-result-buttons';
  buttons.style.cssText = 'display:flex;gap:6px;margin-top:6px';
  const retry = panelButton('gw-result-retry', 'Retry', buttons);
  retry.setAttribute('aria-label', 'Retry this build from the start');
  const next = panelButton('gw-result-next', 'Next level', buttons);
  next.setAttribute('aria-label', 'Play the next level');
  root.append(stars, time, pieces, rules, note, buttons);
  return { root, stars, time, pieces, rules, note, retry, next };
}

/**
 * The panel over the world. One per game shell; `show` fills it (and reveals
 * it), `hide` removes it from view. It never appears during a run — the
 * shell only calls `show` on a terminal status.
 */
export function createResultPanel(host: HTMLElement): ResultPanel {
  const { root, stars, time, pieces, rules, note, retry, next } = makePanel();
  host.appendChild(root);
  return {
    element: root,
    retry,
    next,
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
      // visibility on BOTH channels (the help drawer's lesson: `hidden`
      // alone loses to any inline display; display alone loses to a11y)
      root.hidden = false;
      root.style.display = '';
      // and guarantee the reader is LOOKING at it: if the page is scrolled
      // such that the panel is off-screen, jump it into view (nearest =
      // the smallest scroll that works, no jump when already visible)
      root.scrollIntoView({ block: 'nearest', behavior: 'instant' });
    },
    hide() {
      root.hidden = true;
      root.style.display = 'none';
    },
  };
}
