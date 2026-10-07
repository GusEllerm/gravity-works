/**
 * The BUILD-MODE VIEW control (stage 4, playtest Q: "I built four levels
 * from ONE FIXED ANGLE, no orbit at all"). The fixed build view was an
 * accident, not a decision — the Decision Log's §9.3 amendment records why
 * the playtest evidence overturned it: the static framing HID the goal on
 * 3 of 5 kitchen levels (Q item 7), and the canvas gesture was worse than
 * fixed — a press-move-release PLACED a piece (Q item 6), so the one
 * gesture that exists was the one that MISFIRE-PLACES.
 *
 * This module adds a RESTRICTED build orbit. What it deliberately is NOT:
 *
 * - NOT free-fly / NOT orbit3: ONE degree of freedom — a damped YAW around
 *   the table's vertical axis through the framing centre. Elevation is
 *   frozen (yaw-only, so the eye can never dip under the table nor flip
 *   over the top), and there is NO zoom: the framing distance stays
 *   `frameCamera`'s solved `d` (zoom is the run camera's and the replay's
 *   language; a build-mode zoom would fight the fixed-framing proofs).
 * - CLAMPED to the table's sensible hemisphere: `YAW_MAX` either side of
 *   the base three-quarter azimuth — the eye never crosses the room's
 *   back-plane to look THROUGH a wall/dress, and every clamp position is
 *   still a framing in which the goal is findable.
 * - DAMPED, not direct: the pose chases the drag target with the same
 *   step-independent exponential form `1 − e^(−dt/τ)` the run camera uses
 *   (never the `(1 − dt/τ)` shortcut).
 *
 * GESTURE CONTRACT (the disambiguation Q's item 6 demanded — one gesture,
 * one verb, and PLACE is never a side effect of LOOKING):
 *
 *   gesture (on the canvas)                    verb
 *   ---------------------------------------------------------------
 *   hover                                       aim the target ring
 *   press-release within CANVAS_DRAG_PX         PLACE at the aimed socket
 *   left-drag beyond CANVAS_DRAG_PX             PAN the framing (never place)
 *   RIGHT-drag, or SPACE + drag                 ORBIT (damped yaw; never place)
 *   Escape Escape                               BRING THE VIEW HOME (recenter)
 *   wheel                                         nothing (no zoom, by design)
 *
 * `CANVAS_DRAG_PX` (20 CSS px, raised from 6 by playtest R round 3) is the
 * single threshold the whole app uses to tell a click from a drag. Six px
 * was so tight that an ordinary click with a few px of finger travel
 * latched as a framing drag and SILENTLY placed nothing — R's "fits here
 * shown, click = nothing, Enter worked". Twenty px still reads as a click
 * to the hand, and a real pan/orbit never stops inside 20 px of its start.
 *
 * STATE ROBUSTNESS (playtests R+S round 3: orbit "worked once, then dead
 * permanently"; the camera "zombied into a parts-bin void, only a reload
 * fixed it"). Reproduced: a press whose RELEASE is lost — released off
 * the window, over browser chrome, or stolen from the pointer capture —
 * left the recogniser still believing the button was down, so every later
 * HOVER moved the framing, and the accumulated drift pinned the yaw at
 * its clamp. Three structural defences, none of which trusts a single
 * event:
 *
 * 1. BUTTON RECONCILE — every `pointermove` checks the physical
 *    `ev.buttons` mask against the pressed button: a hover with the
 *    gesture's button physically UP ends the press immediately. A lost
 *    release can therefore cost at most the move that notices it; hover
 *    can NEVER move the framing.
 * 2. WINDOW-LEVEL RELEASE NET — `pointerup`/`pointercancel` are handled
 *    on `window`, not only the canvas, so a release the canvas never sees
 *    (no capture, capture lost) still ends the press cleanly.
 * 3. DOUBLE-ESCAPE RECENTER — `Escape Escape` zeroes the yaw/pan targets
 *    from ANY state; the damping loop then walks the framing home. The
 *    view is recoverable by definition: no gesture sequence can leave it
 *    stranded.
 *
 * `attachBuildView` is the one owner of canvas pointer gestures (aim,
 * place, pan, orbit): it decides the verb, then calls the caller's hooks —
 * the builder only answers "aim here" / "place here", it no longer decides
 * whether a pointer sequence was a click. A `click` event that arrives
 * WITHOUT the pointer sequence (a synthetic/automation click: `detail 0`,
 * no preceding tracked press) is routed to the place verb too — a click
 * is a place INTENT whoever generated it (playtest R: "Enter worked",
 * the pointer path did not).
 */
import * as THREE from 'three';

export const BUILD_VIEW = {
  /** rad of YAW target per CSS px of orbit drag (~64° across the canvas width). */
  YAW_PER_PX: 0.0058,
  /** rad — yaw clamp either side of the base azimuth (60°): the front
   *  three-quarter HEMISPHERE of the set (kitchen backs the play side with
   *  its splashback at −z; the base eye sits at +x/+z, and ±60° keeps the
   *  eye at or beside that plane, never behind it looking through it). */
  YAW_MAX: (60 * Math.PI) / 180,
  /** world metres of framing-centre PAN per CSS px, SCALED by the framing
   *  span (a drag translates the table under the cursor at any level size). */
  PAN_PER_PX: 0.0016,
  /** pan magnitude clamp, as a fraction of the framing span: the centre
   *  may be dragged off the track box, but never past half a table away. */
  PAN_MAX: 0.4,
  /** s — damping time constant for yaw AND pan (the same exponential
   *  filter family as the run camera: damped, never a cut). */
  TAU: 0.15,
};

/** Press→release travel (CSS px) that distinguishes a framing DRAG from a
 *  placement CLICK. One constant, one rule, asserted by the e2e.
 *  6 → 20 (playtest R round 3): at 6 px a click with ordinary finger
 *  travel latched as a drag and placed NOTHING while the ghost said
 *  "fits here" — a silent no-op. 20 px is still far under a deliberate
 *  framing drag. */
export const CANVAS_DRAG_PX = 20;

/** s — the window between two Escape presses that recenters the build
 *  view (playtests R+S: the orbit's only recovery hatch). */
export const RECENTER_MS = 600;

/**
 * The player-adjustable layer over `frameCamera`'s static table framing.
 * At ZERO offsets the pose it applies is bit-for-bit the static pose (the
 * visual baselines and the goal-framing proofs do not move). The class
 * owns no DOM; `attachBuildView` wires the gestures.
 */
export class BuildCamera {
  /** current (damped) yaw/pan state — read by the e2e seam. */
  yaw = 0;
  panX = 0;
  panY = 0;
  yawTarget = 0;
  panTargetX = 0;
  panTargetY = 0;
  /** the look-at target the last `apply` composed (centre + pan) — read by
   *  `frameDeathHold` to re-aim after an eye lift without re-deriving the
   *  pan composition. */
  readonly lookTarget = new THREE.Vector3();

  private center = new THREE.Vector3();
  private d = 1.2;
  private span = 0.5;

  /** Set the base framing (world centre, the solved eye distance, the
   *  track span) — called by `frameCamera` on every static reframe. */
  setFraming(center: THREE.Vector3, d: number, span: number): void {
    this.center.copy(center);
    this.d = d;
    this.span = span;
  }

  /** Right-drag / space+drag: yaw-only turn. Vertical travel is IGNORED
   *  on purpose — there is no pitch degree of freedom to give it to. */
  orbit(dxPx: number, _dyPx: number): void {
    const n = this.yawTarget + dxPx * BUILD_VIEW.YAW_PER_PX;
    this.yawTarget = Math.min(BUILD_VIEW.YAW_MAX, Math.max(-BUILD_VIEW.YAW_MAX, n));
  }

  /** Left-drag past the threshold: translate the framing centre in the
   *  camera's own screen plane (right/up of the YAWED base pose). */
  pan(dxPx: number, dyPx: number): void {
    const k = BUILD_VIEW.PAN_PER_PX * this.span;
    // dragging the canvas DRAGS THE TABLE: the centre moves against the
    // cursor, so content follows the pointer like a map
    let px = this.panTargetX - dxPx * k;
    let py = this.panTargetY + dyPx * k;
    const cap = BUILD_VIEW.PAN_MAX * this.span;
    const m = Math.hypot(px, py);
    if (m > cap) {
      px *= cap / m;
      py *= cap / m;
    }
    this.panTargetX = px;
    this.panTargetY = py;
  }

  /** Bring the framing home (Retry/Reset: the car comes back AND so does
   *  the view — the target zeroes; the pose damps to it). */
  reset(): void {
    this.yawTarget = 0;
    this.panTargetX = 0;
    this.panTargetY = 0;
  }

  /** Advance the damping one frame. Returns true when the pose state
   *  MOVED (the caller applies; an idle camera costs nothing). */
  step(dt: number): boolean {
    const a = 1 - Math.exp(-dt / BUILD_VIEW.TAU);
    let moved = false;
    const approach = (cur: number, target: number, eps: number): number => {
      if (Math.abs(target - cur) <= eps) return cur === target ? cur : target;
      moved = true;
      return cur + (target - cur) * a;
    };
    this.yaw = approach(this.yaw, this.yawTarget, 1e-5);
    const eps = 1e-5 * Math.max(1, this.span);
    this.panX = approach(this.panX, this.panTargetX, eps);
    this.panY = approach(this.panY, this.panTargetY, eps);
    return moved;
  }

  /** Compose the yawed/panned pose onto the camera. Identical to
   *  `frameCamera`'s direct set when yaw and pan are both zero. */
  apply(camera: THREE.PerspectiveCamera): void {
    const c = Math.cos(this.yaw);
    const s = Math.sin(this.yaw);
    // the base three-quarter offset (frameCamera's exact numbers) rotated
    // about the world Y axis through the framing centre
    const ox = this.d * 0.7;
    const oz = this.d * 0.9;
    const ex = ox * c + oz * s;
    const ez = -ox * s + oz * c;
    const ey = this.d * 0.55;
    // screen basis of the yawed pose: forward f = -e/|e|; right = f × up;
    // camUp = right × f (pan moves the CENTRE in this plane, never the
    // eye distance: NO zoom lives here)
    const len = Math.hypot(ex, ey, ez);
    const fx = -ex / len;
    const fy = -ey / len;
    const fz = -ez / len;
    const rlen = Math.hypot(fz, fx) || 1;
    const rx = -fz / rlen;
    const rz = fx / rlen;
    const ux = -rz * fy; // (r × f) with r_y = 0
    const uy = rz * fx - rx * fz; // = rlen on a unit f
    const uz = rx * fy;
    const ulen = Math.hypot(ux, uy, uz) || 1;
    const cx = this.center.x + rx * this.panX + (ux / ulen) * this.panY;
    const cy = this.center.y + (uy / ulen) * this.panY;
    const cz = this.center.z + rz * this.panX + (uz / ulen) * this.panY;
    camera.position.set(cx + ex, cy + ey, cz + ez);
    camera.lookAt(cx, cy, cz);
    this.lookTarget.set(cx, cy, cz);
  }
}

/** A set solid the death-hold eye must not sit in or look through. */
export interface DeathHoldSolid {
  min: readonly [number, number, number];
  max: readonly [number, number, number];
}

export interface DeathHoldOptions {
  /** The run's LAST SEEABLE point — where the car died/came to rest (the
   *  witness the verdict must show, not the launch framing). Plain xyz so
   *  the shell's `carPose` needs no conversion. */
  death: { x: number; y: number; z: number };
  /** Set solids to clear (the same boxes the run camera lifts over). */
  solids?: readonly DeathHoldSolid[];
  /** The build view to compose through (at zero yaw/pan the pose is
   *  `frameCamera`'s form widened — same three-quarter offsets). */
  view?: BuildCamera | null;
}

/**
 * The FAILURE end-hold (playtest R round 3: "buried in a peach wall on
 * fail — never saw the marble fall"). The success end-hold re-solves
 * `frameCamera` with the car in the subject, which frames the CUP side
 * and keeps the solved table eye — on a death in the sink/tap corner that
 * eye can sit inside a set prop, staring at wall from the wrong side.
 * This solves the same table framing with (a) the DEATH SITE pulled into
 * the subject and the look-at BIASSED toward it (0.55 of the way from the
 * box centre — the death is the story of a failed run), (b) a wider eye
 * distance (span × 1.5 vs × 1.4 — the wide hold shows the death AND the
 * line that missed), and (c) the run camera's own clearance rule applied
 * to the composed pose: while the eye sits in a solid, or the eye→target
 * sight crosses one (unless the target itself is inside it, the sink
 * case), the eye rises above the tallest offending top and re-aims — an
 * arc-free static solve, iterated, so a wall-bury frame cannot exist.
 */
export function frameDeathHold(
  camera: THREE.PerspectiveCamera,
  scene: THREE.Scene | null,
  opts: DeathHoldOptions,
): void {
  const track = scene?.getObjectByName('track');
  const box = track ? new THREE.Box3().setFromObject(track) : new THREE.Box3();
  const scratch = new THREE.Vector3(opts.death.x, opts.death.y, opts.death.z);
  if (!box.isEmpty()) {
    box.expandByScalar(0.6);
    scratch.clamp(box.min, box.max); // a flung car may not inflate the table
  }
  box.expandByPoint(scratch);
  const center = box.getCenter(new THREE.Vector3());
  const span = Math.max(...box.getSize(new THREE.Vector3()).toArray());
  // the death is the subject of a failed run: bias the look-at toward it
  center.lerp(scratch, 0.55);
  const d = Math.max(1.4, span * 1.5);
  if (opts.view) {
    opts.view.setFraming(center, d, span);
    opts.view.apply(camera);
  } else {
    camera.position.set(
      center.x + d * 0.7,
      center.y + d * 0.55,
      center.z + d * 0.9,
    );
    camera.lookAt(center);
  }
  const target = (opts.view ? opts.view.lookTarget : center).clone();
  // the clearance lift: eye out of every box, sightline over every box
  const solids = opts.solids ?? [];
  const M = 0.04;
  for (let iter = 0; iter < 6; iter++) {
    let need = -Infinity;
    for (const b of solids) {
      if (boxHasPoint(camera.position, b, M)) {
        need = Math.max(need, b.max[1] + M);
        continue;
      }
      if (boxHasPoint(target, b, M)) continue; // target inside = a sink, not a wall
      if (segmentHits(camera.position, target, b, M)) need = Math.max(need, b.max[1] + M);
    }
    if (need === -Infinity || camera.position.y >= need - 1e-9) break;
    camera.position.y = need;
    camera.lookAt(target);
  }
}

function boxHasPoint(p: THREE.Vector3, b: DeathHoldSolid, m: number): boolean {
  return (
    p.x > b.min[0] - m && p.x < b.max[0] + m &&
    p.y > b.min[1] - m && p.y < b.max[1] + m &&
    p.z > b.min[2] - m && p.z < b.max[2] + m
  );
}

function segmentHits(a: THREE.Vector3, b: THREE.Vector3, box: DeathHoldSolid, m: number): boolean {
  const lo = { x: box.min[0] - m, y: box.min[1] - m, z: box.min[2] - m };
  const hi = { x: box.max[0] + m, y: box.max[1] + m, z: box.max[2] + m };
  let t0 = 0;
  let t1 = 1;
  const ax = [a.x, a.y, a.z];
  const bx = [b.x, b.y, b.z];
  const lomin = [lo.x, lo.y, lo.z];
  const himax = [hi.x, hi.y, hi.z];
  for (let i = 0; i < 3; i++) {
    const d = bx[i]! - ax[i]!;
    if (Math.abs(d) < 1e-12) {
      if (ax[i]! < lomin[i]! || ax[i]! > himax[i]!) return false;
      continue;
    }
    let tA = (lomin[i]! - ax[i]!) / d;
    let tB = (himax[i]! - ax[i]!) / d;
    if (tA > tB) [tA, tB] = [tB, tA];
    t0 = Math.max(t0, tA);
    t1 = Math.min(t1, tB);
    if (t0 > t1) return false;
  }
  return true;
}

/** The hooks the gesture recogniser drives: aim/place live in the builder,
 *  framing in the BuildCamera. */
export interface BuildViewHandlers {
  /** Pointer moved over the world: aim the target ring here. */
  onHover: (clientX: number, clientY: number) => void;
  /** A CLEAN CLICK (press→release under `CANVAS_DRAG_PX`): place here. */
  onPlace: (clientX: number, clientY: number) => void;
}

/**
 * Wire the gesture contract onto the canvas. One pointer sequence is
 * exactly one verb: while pressed, travel past `CANVAS_DRAG_PX` latches
 * the gesture as a FRAMING drag (an orbit when the right button or Space
 * rode along, else a pan) and the release places NOTHING; a release under
 * the threshold is a placement click. The press is reconciled against the
 * PHYSICAL button mask on every move (a lost release dies on the next
 * hover, never haunts it) and releases are handled on `window` so a
 * pointerup the canvas misses still lands. Double-Escape recenters. The
 * wheel is deliberately unwired: there is no build-mode zoom.
 */
export function attachBuildView(
  canvas: HTMLElement,
  view: BuildCamera,
  handlers: BuildViewHandlers,
): void {
  let spaceHeld = false;
  window.addEventListener('keydown', (ev) => {
    if (ev.code !== 'Space') return;
    spaceHeld = true;
    // Space over the page (not a focused control) only ever MEANS the view
    // gesture here — stop the page scrolling under the drag; a focused
    // <button> keeps its native Space activation untouched
    const t = ev.target as HTMLElement | null;
    if (!t || t === document.body || t === canvas) ev.preventDefault();
  });
  window.addEventListener('keyup', (ev) => {
    if (ev.code === 'Space') spaceHeld = false;
  });
  // a blur can SWALLOW the keyup of a held key (window switches under a
  // held Space): the reconcile above does the same job for buttons, here
  window.addEventListener('blur', () => {
    spaceHeld = false;
  });

  // DOUBLE-ESCAPE RECENTER (playtests R+S: the orbit's recovery hatch).
  // Two Escapes inside RECENTER_MS zero the yaw/pan TARGETS from any
  // state; the frame loop's damping walk brings the pose home. Works
  // whatever else the recogniser believes about the pointer — it needs
  // no pointer events at all. The help drawer lists the chord.
  let lastEscape = 0;
  window.addEventListener('keydown', (ev) => {
    if (ev.key !== 'Escape') return;
    const now = performance.now();
    if (now - lastEscape <= RECENTER_MS) {
      view.reset();
      lastEscape = 0;
    } else {
      lastEscape = now;
    }
  });

  interface Press {
    id: number;
    button: number;
    startX: number;
    startY: number;
    lastX: number;
    lastY: number;
    dragged: boolean;
  }
  let press: Press | null = null;
  /** the last release the POINTER path already placed on — the dedupe
   *  key for the `click` fallback below. */
  let placedAt = { t: -1e9, x: 0, y: 0 };

  // right-drag is ORBIT here, so the browser menu must not ride along
  canvas.addEventListener('contextmenu', (ev) => ev.preventDefault());

  /** Is the button this press was made with PHYSICALLY down? (mouse: the
   *  exact bit; touch/pen: any contact). The reconcile the zombie-camera
   *  fix is built on — hover must never move the framing. */
  const buttonHeld = (ev: PointerEvent, button: number): boolean =>
    ev.pointerType === 'mouse'
      ? (ev.buttons & (button === 2 ? 2 : 1)) !== 0
      : ev.buttons > 0;

  const endPress = (id: number): void => {
    try {
      canvas.releasePointerCapture?.(id);
    } catch {
      // already gone — exactly the situation the reconcile is here for
    }
    press = null;
  };

  canvas.addEventListener('pointerdown', (ev) => {
    if (ev.pointerType === 'mouse' && ev.button !== 0 && ev.button !== 2) return;
    if (press && press.id === ev.pointerId) {
      // a second button joining an open press: RIGHT takes the verb
      // (orbit intent wins), the click origin never re-anchors
      if (ev.button === 2) press.button = 2;
      return;
    }
    press = {
      id: ev.pointerId,
      button: ev.button,
      startX: ev.clientX,
      startY: ev.clientY,
      lastX: ev.clientX,
      lastY: ev.clientY,
      dragged: false,
    };
    try {
      canvas.setPointerCapture?.(ev.pointerId);
    } catch {
      // best-effort: the window-level release net covers a lost capture
    }
  });

  canvas.addEventListener('pointermove', (ev) => {
    if (press && ev.pointerId === press.id) {
      if (!buttonHeld(ev, press.button)) {
        // THE LOST RELEASE (up off the window, capture stolen, menu up):
        // end the press with NO verb. This is the state-robustness rule —
        // a move whose button is physically up is a HOVER, so a pointerup
        // that never arrived cannot turn the whole page into a drag.
        endPress(ev.pointerId);
      } else {
        const dx = ev.clientX - press.lastX;
        const dy = ev.clientY - press.lastY;
        press.lastX = ev.clientX;
        press.lastY = ev.clientY;
        if (!press.dragged && Math.hypot(ev.clientX - press.startX, ev.clientY - press.startY) > CANVAS_DRAG_PX) {
          press.dragged = true;
        }
        if (press.dragged) {
          // the ONLY verbs for a travelling press: orbit (right / space) or pan
          if (press.button === 2 || spaceHeld) view.orbit(dx, dy);
          else view.pan(dx, dy);
        }
      }
    }
    // hover AIMS through the whole sequence: the ring keeps aiming while
    // the framing turns (the ghost always shows the socket a click WOULD
    // use from wherever the view now is)
    handlers.onHover(ev.clientX, ev.clientY);
  });

  // Releases are decided on `window`: with the capture set they retarget
  // to the canvas and bubble here; without it (or after the capture is
  // lost) the element under the pointer gets them — and they STILL bubble
  // here. One listener, every release seen.
  const release = (ev: PointerEvent): void => {
    if (!press || ev.pointerId !== press.id) return;
    const wasCleanClick =
      !press.dragged && press.button === 0 && !spaceHeld &&
      Math.hypot(ev.clientX - press.startX, ev.clientY - press.startY) <= CANVAS_DRAG_PX;
    endPress(ev.pointerId);
    if (wasCleanClick) {
      placedAt = { t: performance.now(), x: ev.clientX, y: ev.clientY };
      handlers.onPlace(ev.clientX, ev.clientY);
    }
  };
  window.addEventListener('pointerup', release);
  window.addEventListener('pointercancel', (ev) => {
    if (press && ev.pointerId === press.id) endPress(ev.pointerId);
  });

  // THE AUTOMATION/SYNTHETIC FALLBACK: a `click` with no pointer sequence
  // behind it (`detail === 0`: `node.click()` / a dispatched event) is
  // still a placement INTENT — route it to the same verb, deduped against
  // the pointer path. Real OS clicks always arrive with the tracked press
  // release above and are dropped here.
  canvas.addEventListener('click', (ev) => {
    if (ev.button !== 0) return;
    const now = performance.now();
    if (
      now - placedAt.t < 700 &&
      Math.hypot(ev.clientX - placedAt.x, ev.clientY - placedAt.y) <= CANVAS_DRAG_PX
    )
      return; // the pointer path already placed this click
    if (ev.detail === 0) handlers.onPlace(ev.clientX, ev.clientY);
  });
}
