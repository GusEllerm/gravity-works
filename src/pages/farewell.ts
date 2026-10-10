/**
 * THE FAREWELL (program T3.3, PAIRED with the doors — Action Plan
 * "the shape of the game"; player evaluation truth #7: "the campaign's
 * final state is a two-star bar with Retry and Share — no farewell, no
 * summary of the thirty rungs, no view of the whole house"). Clearing the
 * house's last word — porch05 — for the FIRST time replaces the result bar
 * with ONE cinematic crane pass over all six sets in campaign order,
 * carrying the player's own star tally per room, then THREE DOORS, one
 * click each: the room's SANDBOX, today's DAILY run, and the SHARE film of
 * the porch05 run that just ended.
 *
 * BUILT FROM SHIPPED PARTS, zero new physics:
 * - the six rooms are the registry's own set builders (`SETS`, mounted at
 *   their canonical origins in one row — the same visual-only mount the
 *   `?set=` inspection entry does, no world, no bodies, no solver);
 * - the star tallies are the save's own `progress.stars` folded per room by
 *   the campaign table (`CAMPAIGN` — the one source of room membership);
 * - the page is EVENT-DRIVEN like the replay (`src/replay/cinematic.ts`):
 *   a plan of timed events derived once from pure constants, so the crane
 *   is a deterministic schedule over the house, not a simulation — there is
 *   nothing here to seek, resume, or hash;
 * - the doors are the shipped surfaces: `?level=porch-sandbox`, the daily
 *   page (`?daily=1`, `src/save/daily.ts`), and the share fragment
 *   (`#s=`, `src/share/share.ts`) — which OPENS PLAYING from frame zero.
 *
 * ONCE PER SAVE, said exactly (the premiere's idiom — `src/pages/intro.ts`):
 * the seen flag lives in localStorage OUTSIDE the save schema (a UI fact,
 * not a game fact — it never rides export/import and never touches a hash),
 * and the flag is set the moment the farewell FIRES, not when it ends: one
 * clear, one farewell, and a skipped crane is still an honest "seen" (the
 * player stood in the house). `?farewell=1` forces it for the farewell's
 * own specs (and anyone who wants it again); `?farewell=off` is the
 * URL-affordance family's explicit opt-out — the e2e harness appends it
 * (with `post=off`/`intro=off`) so no non-visual spec is ever ambushed by
 * the crane even on a page that clears porch05 (Decision Log 2026-10-07,
 * "recorded, not stripped").
 *
 * THE REDUCED-MOTION LAW: the crane is pure motion, so a reduced-motion
 * player gets the STATIC SUMMARY PAGE instead — the same tally, the same
 * three doors, no camera move (`src/ui/motion.ts` law; the set row is never
 * even built, which is also this page's honesty: nothing animates behind a
 * still).
 */
import * as THREE from 'three';
import { CAMPAIGN, CAMPAIGN_LADDER } from '../world/campaign.ts';
import { SETS } from '../sets/index.ts';
import { encodeShareUrl, type SharePayload } from '../share/share.ts';

/** One-shot flag: the farewell fires exactly once per browser save — the
 *  premiere's idiom, deliberately OUTSIDE the save schema (no v3 bump). */
export const FAREWELL_KEY = 'gravity-works.farewell.seen';

/** Decide, per the URL-affordance family, whether a porch05 FIRST clear
 *  plays the farewell: `off` wins outright (a decision, not a signal), `1`
 *  forces past the seen flag (the farewell's own spec rides this), and the
 *  bare page asks the flag. Blocked storage says NO — a farewell that
 *  cannot record itself would nag every clear, and a nagging ending is the
 *  worse wrong (the premiere's same rule). Reduced motion is NOT decided
 *  here: reduced motion does not cancel the farewell, it changes its shape
 *  (the static summary page), which is `startFarewell`'s `reducedMotion`. */
export function farewellWanted(params: URLSearchParams): boolean {
  if (params.get('farewell') === 'off') return false;
  if (params.get('farewell') === '1') return true;
  try {
    if (localStorage.getItem(FAREWELL_KEY)) return false;
  } catch {
    return false; // storage blocked: cannot record the one-shot — don't nag
  }
  return true;
}

/** Address the flag (no second source). */
export function farewellSeen(): boolean {
  try {
    return !!localStorage.getItem(FAREWELL_KEY);
  } catch {
    return false;
  }
}

// ---- the tally (pure over the save) ------------------------------------------

/** One room's line of the summary: the room's own stars over its own max. */
export interface FarewellRoom {
  id: string;
  label: string;
  stars: number;
  max: number;
}

/** Fold `progress.stars` per ROOM through the campaign table — the one
 *  source of room membership (a rung outside the ladder scores nowhere;
 *  sandbox pieces were never rungs). */
export function farewellTally(stars: Record<string, number>): FarewellRoom[] {
  return CAMPAIGN.map((room) => ({
    id: room.id,
    label: room.label,
    stars: room.levelIds.reduce((sum, id) => sum + (stars[id] ?? 0), 0),
    max: room.levelIds.length * 3,
  }));
}

// ---- the crane plan (pure, event-driven like the replay) ---------------------

/** Seconds the eye drifts across a room before the crane moves on. */
export const CRANE_DWELL = 1.1;
/** Seconds of travelling lift between two rooms. */
export const CRANE_MOVE = 0.8;
/** Seconds of settle on the wide house before the doors. */
export const CRANE_PULL = 1.0;
/** Seconds of approach before the first room is revealed. */
export const CRANE_LEAD = 0.3;
/** Room-to-room spacing (world m) — wider than any set's bounds circle. */
export const CRANE_STEP = 3.4;

export interface FarewellEvent {
  t: number;
  kind: 'reveal' | 'doors';
  /** Room index for a reveal; null for the doors. */
  room: number | null;
}

export interface FarewellPlan {
  events: FarewellEvent[];
  duration: number;
  /** Seconds of crane per room (the reveal times). */
  revealAt: number[];
}

/** THE PLAN — derived once from constants, identical on every machine
 *  (nothing reads a clock, the save, or a set to build it): reveal i fires
 *  as the eye arrives at room i, in campaign order; the doors ride the
 *  pull-back's end. */
export function farewellPlan(roomCount = CAMPAIGN.length): FarewellPlan {
  const events: FarewellEvent[] = [];
  const revealAt: number[] = [];
  for (let i = 0; i < roomCount; i++) {
    const t = CRANE_LEAD + i * (CRANE_DWELL + CRANE_MOVE);
    revealAt.push(t);
    events.push({ t, kind: 'reveal', room: i });
  }
  const duration =
    CRANE_LEAD +
    roomCount * CRANE_DWELL +
    Math.max(0, roomCount - 1) * CRANE_MOVE +
    CRANE_PULL;
  events.push({ t: duration, kind: 'doors', room: null });
  return { events, duration, revealAt };
}

/** The centre x of room i in the row (the house centred on the origin). */
export function craneRoomX(i: number, roomCount = CAMPAIGN.length): number {
  return (i - (roomCount - 1) / 2) * CRANE_STEP;
}

function smoothstep(u: number): number {
  const k = Math.min(1, Math.max(0, u));
  return k * k * (3 - 2 * k);
}

/**
 * The crane camera pose at plan time `t` — a PURE function of t, so the
 * pass is a recorded shot, not a filter chasing a car (no RunCamera here:
 * nothing is being followed; the house is the subject). Three grammars:
 * DWELL (a lateral drift across the room at table height), MOVE (a crane
 * lift and traverse to the next room — the lift is what makes it a crane
 * and not a dolly), PULL (the wide house the doors open on). Eye heights
 * and distances follow the ratified stills' band (table gaze ~1.45 m,
 * the whole row inside a ~6.5 m pull-back).
 */
export function cranePose(
  t: number,
  roomCount = CAMPAIGN.length,
): { eye: [number, number, number]; target: [number, number, number] } {
  const n = roomCount;
  const dwellStart = (i: number) => CRANE_LEAD + i * (CRANE_DWELL + CRANE_MOVE);
  if (t <= CRANE_LEAD) {
    // the approach: one steady beat on the first room, slightly wider
    return { eye: [craneRoomX(0, n) - 0.35, 1.65, 3.7], target: [craneRoomX(0, n), 0.05, 0] };
  }
  for (let i = 0; i < n; i++) {
    const start = dwellStart(i);
    if (t < start + CRANE_DWELL) {
      const u = (t - start) / CRANE_DWELL;
      const x = craneRoomX(i, n) + (u - 0.5) * 0.7;
      return { eye: [x, 1.45, 3.1], target: [craneRoomX(i, n), 0.05, 0] };
    }
    const moveStart = start + CRANE_DWELL;
    if (i < n - 1 && t < moveStart + CRANE_MOVE) {
      const u = smoothstep((t - moveStart) / CRANE_MOVE);
      const lift = Math.sin(Math.PI * Math.min(1, (t - moveStart) / CRANE_MOVE));
      const x = craneRoomX(i, n) + 0.35 + (craneRoomX(i + 1, n) - 0.35 - (craneRoomX(i, n) + 0.35)) * u;
      return { eye: [x, 1.45 + 0.85 * lift, 3.1 + 1.3 * lift], target: [x, 0.05, 0] };
    }
  }
  // the pull-back: the whole house, the doors' frame
  const pullStart = dwellStart(n - 1) + CRANE_DWELL;
  const u = smoothstep((t - pullStart) / CRANE_PULL);
  const last = craneRoomX(n - 1, n);
  const x = last + (0 - last) * u;
  return { eye: [x, 1.45 + 1.15 * u, 3.1 + 3.4 * u], target: [x, 0.05, 0] };
}

// ---- the page ----------------------------------------------------------------

export interface FarewellOptions {
  /** The static summary page instead of the crane (the reduced-motion law). */
  reducedMotion: boolean;
  /** The save's star record, folded per room by `farewellTally`. */
  stars: Record<string, number>;
  /** Door 1: the room's sandbox page (a relative URL, one click). */
  sandboxUrl: string;
  /** Door 2: the daily run page (the current page at today's seed). */
  dailyUrl: string;
  /** Door 3's film: the porch05 run the farewell rides (share payload). */
  run: SharePayload;
}

export interface FarewellState {
  phase: 'build' | 'crane' | 'doors' | 'static';
  /** Crane plan time elapsed (0 before/after the crane). */
  t: number;
  /** Reveals landed so far (rooms the eye has visited). */
  revealed: number;
  duration: number;
}

/**
 * Open the farewell. The seen flag is set HERE, at the fire, not at the
 * doors: one clear, one farewell — a crane skipped half-way through was
 * still stood in. Returns the live state seam; the page owns its own rAF
 * loop and never returns control (every door is a navigation).
 */
export function startFarewell(
  root: HTMLElement,
  stage: HTMLElement,
  opts: FarewellOptions,
): { state: () => FarewellState } {
  try {
    localStorage.setItem(FAREWELL_KEY, '1');
  } catch {
    // storage blocked: farewellWanted already refused to fire — this line
    // is only reachable through its forcing, and a forced replay of the
    // ending is exactly what the forcing is for.
  }
  const rooms = farewellTally(opts.stars);
  const plan = farewellPlan(rooms.length);
  let phase: FarewellState['phase'] = 'build';
  let t = 0;
  let revealed = 0;
  let eventCursor = 0;

  // The chrome goes the way it did for the premise beat — the same
  // `.gw-premiere` rule hides the builder, the status lines and the sound
  // corner; the farewell owns the screen (shell.css).
  root.classList.add('gw-premiere');
  // THE CHIP SWEEP (player final 2026-10-10 §7, program P4): `.gw-premiere`
  // hides the layout-flow chrome, but the page-corner chips (`#gw-sound`,
  // `#gw-save`, `#gw-ghost-bar`, `#gw-dev-preview`) are absolute with
  // INLINE layout styles, and a plain class rule loses to a (normal)
  // inline `display:flex` in the cascade — that is why chips leaked
  // through the farewell. One honest sweep: every chip in the root gets
  // `hidden` when the farewell shows; the chip `[hidden]` rule in
  // `src/ui/shell.css` wins the cascade, and
  // `tests/e2e/farewell.spec.ts` asserts nothing chip-like survives the
  // ending. The farewell owns the screen until a door navigates, so
  // nothing un-hides them.
  for (const id of ['gw-sound', 'gw-save', 'gw-ghost-bar', 'gw-dev-preview']) {
    const chip = root.querySelector(`#${id}`);
    if (chip instanceof HTMLElement) chip.hidden = true;
  }

  const overlay = document.createElement('div');
  overlay.id = 'gw-farewell';
  stage.appendChild(overlay);

  const status = document.createElement('p');
  status.id = 'gw-farewell-status';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  status.textContent = 'looking over the whole house…';
  overlay.appendChild(status);

  const line = document.createElement('p');
  line.id = 'gw-farewell-line';
  line.setAttribute('role', 'status');
  line.setAttribute('aria-live', 'polite');
  overlay.appendChild(line);

  const canvas = document.createElement('canvas');
  canvas.id = 'gw-farewell-canvas';
  overlay.appendChild(canvas);

  // the summary table — built hidden; the crane reveals it room by room,
  // the reduced-motion page shows it whole at once
  const summary = document.createElement('div');
  summary.id = 'gw-farewell-summary';
  summary.hidden = true;
  const summaryTitle = document.createElement('p');
  summaryTitle.id = 'gw-farewell-title';
  summaryTitle.textContent = `${CAMPAIGN_LADDER.length} rungs — the whole house`;
  summary.appendChild(summaryTitle);
  const table = document.createElement('table');
  table.id = 'gw-farewell-rooms';
  for (const room of rooms) {
    const row = document.createElement('tr');
    row.className = 'gw-farewell-room';
    const name = document.createElement('td');
    name.textContent = room.label;
    const tally = document.createElement('td');
    tally.className = 'gw-farewell-tally';
    tally.textContent = `${room.stars} / ${room.max}`;
    row.append(name, tally);
    table.appendChild(row);
  }
  summary.appendChild(table);
  const total = document.createElement('p');
  total.id = 'gw-farewell-total';
  const totalStars = rooms.reduce((s, r) => s + r.stars, 0);
  const totalMax = rooms.reduce((s, r) => s + r.max, 0);
  total.textContent = `${CAMPAIGN_LADDER.length} rungs walked — ${totalStars} of ${totalMax} stars`;
  summary.appendChild(total);
  overlay.appendChild(summary);

  // THE THREE DOORS — each one click, all three shipped surfaces:
  // sandbox (the room's sandbox), daily (today's daily run), share (the
  // porch05 run's film). They appear when the crane ends (or at once, for
  // the static page); every one is a navigation, not a state swap.
  const doors = document.createElement('div');
  doors.id = 'gw-farewell-doors';
  doors.hidden = true;
  const hello = document.createElement('p');
  hello.id = 'gw-farewell-hello';
  hello.textContent = 'the house is yours. three doors:';
  doors.appendChild(hello);
  const doorRow = document.createElement('div');
  doorRow.id = 'gw-farewell-doorrow';
  const sandbox = document.createElement('a');
  sandbox.id = 'gw-farewell-sandbox';
  sandbox.href = opts.sandboxUrl;
  sandbox.textContent = 'keep building — the porch sandbox';
  const daily = document.createElement('a');
  daily.id = 'gw-farewell-daily';
  daily.href = opts.dailyUrl;
  daily.textContent = 'race today’s daily run';
  const share = document.createElement('button');
  share.id = 'gw-farewell-share';
  share.type = 'button';
  share.textContent = 'watch the film of this run';
  const shareNote = document.createElement('span');
  shareNote.id = 'gw-farewell-share-note';
  shareNote.hidden = true;
  doorRow.append(sandbox, daily, share, shareNote);
  doors.appendChild(doorRow);
  overlay.appendChild(doors);
  share.addEventListener('click', () => {
    shareNote.hidden = false;
    shareNote.textContent = 'developing…';
    void encodeShareUrl(opts.run).then(
      (frag) => {
        window.location.href = `${window.location.origin}${window.location.pathname}${frag}`;
      },
      () => {
        shareNote.textContent = 'this browser could not develop the film';
      },
    );
  });

  const openDoors = (how: 'crane' | 'static' | 'build-failed'): void => {
    phase = how === 'static' ? 'static' : 'doors';
    if (how !== 'static') canvas.hidden = true;
    status.textContent =
      how === 'build-failed'
        ? 'the house could not be built on this machine — here is the tally instead'
        : how === 'static'
          ? 'the whole house, at a standstill'
          : 'and that is the house.';
    summary.hidden = false;
    doors.hidden = false;
  };

  const revealRoom = (i: number): void => {
    const room = rooms[i]!;
    revealed = i + 1;
    line.textContent = `${room.label} — ${room.stars} / ${room.max} stars`;
  };

  // THE STATIC PAGE (reduced motion, and the set-build fallback): the
  // whole truth at once, no camera, no set row to wait for.
  if (opts.reducedMotion) {
    canvas.remove();
    line.textContent = rooms
      .map((r) => `${r.label} ${r.stars}/${r.max}`)
      .join(' · ');
    revealed = rooms.length;
    openDoors('static');
    return { state };
  }

  // ---- the crane: mount the six rooms ONCE, one rAF over the plan --------
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#efe0c8');
  scene.add(new THREE.AmbientLight(0xffffff, 0.85));
  const key = new THREE.DirectionalLight(0xffffff, 1.1);
  key.position.set(1, 2.5, 1.5);
  scene.add(key);
  const camera = new THREE.PerspectiveCamera(38, 16 / 9, 0.05, 40);
  const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
  renderer.setSize(960, 540, false);

  let raf = 0;
  let last = 0;

  const loop = (now: number): void => {
    if (phase !== 'crane') return; // the skip/finish owns the frame loop's death
    raf = requestAnimationFrame(loop);
    const dt = Math.min((now - last) / 1000, 0.25);
    last = now;
    t = Math.min(t + dt, plan.duration);
    while (eventCursor < plan.events.length && plan.events[eventCursor]!.t <= t) {
      const ev = plan.events[eventCursor]!;
      if (ev.kind === 'reveal') revealRoom(ev.room!);
      else {
        finish();
        return;
      }
      eventCursor += 1;
    }
    const pose = cranePose(t, rooms.length);
    camera.position.set(...pose.eye);
    camera.lookAt(...pose.target);
    renderer.render(scene, camera);
  };

  const finish = (): void => {
    cancelAnimationFrame(raf);
    if (phase === 'doors' || phase === 'static') return;
    revealed = rooms.length;
    line.textContent = rooms.map((r) => `${r.label} ${r.stars}/${r.max}`).join(' · ');
    phase = 'doors';
    openDoors('crane');
    disposeCrane();
  };

  /** A SKIP is a door: the crane is pure motion, any press owns it —
   *  capture + swallow like the premise beat, so the dismissing gesture
   *  never places a piece or pings a voice. The flag was already set at
   *  the fire; the summary and the doors land whole (the player stood in
   *  at least one room — the page tells the whole truth from here). */
  const skip = (ev: Event): void => {
    ev.stopPropagation();
    if (phase === 'crane' || phase === 'build') {
      revealed = rooms.length;
      line.textContent = rooms.map((r) => `${r.label} ${r.stars}/${r.max}`).join(' · ');
      finish();
      window.removeEventListener('pointerdown', skip, true);
      window.removeEventListener('keydown', skip, true);
    }
  };
  window.addEventListener('pointerdown', skip, true);
  window.addEventListener('keydown', skip, true);

  const disposeCrane = (): void => {
    window.removeEventListener('pointerdown', skip, true);
    window.removeEventListener('keydown', skip, true);
    renderer.dispose();
  };

  void Promise.all(CAMPAIGN.map((room, i) =>
    SETS[room.id]!.build(THREE).then((inst) => {
      inst.group.position.x = craneRoomX(i, rooms.length);
      scene.add(inst.group);
    }),
  )).then(
    () => {
      if (phase !== 'build') return; // skipped while the rooms were loading
      phase = 'crane';
      status.textContent = 'one look at the whole house';
      last = performance.now();
      raf = requestAnimationFrame(loop);
    },
    () => {
      if (phase === 'doors' || phase === 'static') return;
      revealed = rooms.length;
      line.textContent = rooms.map((r) => `${r.label} ${r.stars}/${r.max}`).join(' · ');
      openDoors('build-failed');
    },
  );

  function state(): FarewellState {
    return { phase, t, revealed, duration: plan.duration };
  }

  return { state };
}
