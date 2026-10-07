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
 *   wheel                                         nothing (no zoom, by design)
 *
 * `CANVAS_DRAG_PX` (6 CSS px) is the single threshold the whole app uses
 * to tell a click from a drag: a left press that TRAVELS more than this is
 * a framing drag and the release PLACES NOTHING — the old
 * press-move-release-counted-as-a-click was Q's accidental-placement bug.
 * `attachBuildView` is the one owner of canvas pointer gestures (aim,
 * place, pan, orbit): it decides the verb, then calls the caller's hooks —
 * the builder only answers "aim here" / "place here", it no longer decides
 * whether a pointer sequence was a click.
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
 *  placement CLICK. One constant, one rule, asserted by the e2e. */
export const CANVAS_DRAG_PX = 6;

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
  }
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
 * exactly one verb: while pressed, travel past `CANVAS_DRAG_PX` latches the
 * gesture as a FRAMING drag (an orbit when the right button or Space rode
 * along, else a pan) and the release places NOTHING; a release under the
 * threshold is a placement click. The wheel is deliberately unwired: there
 * is no build-mode zoom.
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

  // right-drag is ORBIT here, so the browser menu must not ride along
  canvas.addEventListener('contextmenu', (ev) => ev.preventDefault());

  canvas.addEventListener('pointerdown', (ev) => {
    if (ev.pointerType === 'mouse' && ev.button !== 0 && ev.button !== 2) return;
    press = {
      id: ev.pointerId,
      button: ev.button,
      startX: ev.clientX,
      startY: ev.clientY,
      lastX: ev.clientX,
      lastY: ev.clientY,
      dragged: false,
    };
    canvas.setPointerCapture?.(ev.pointerId);
  });

  canvas.addEventListener('pointermove', (ev) => {
    if (press && ev.pointerId === press.id) {
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
    // hover AIMS through the whole sequence: the ring keeps aiming while
    // the framing turns (the ghost always shows the socket a click WOULD
    // use from wherever the view now is)
    handlers.onHover(ev.clientX, ev.clientY);
  });

  const release = (ev: PointerEvent): void => {
    if (!press || ev.pointerId !== press.id) return;
    const wasCleanClick =
      !press.dragged && press.button === 0 && !spaceHeld &&
      Math.hypot(ev.clientX - press.startX, ev.clientY - press.startY) <= CANVAS_DRAG_PX;
    canvas.releasePointerCapture?.(ev.pointerId);
    press = null;
    if (wasCleanClick) handlers.onPlace(ev.clientX, ev.clientY);
  };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', (ev) => {
    if (press && ev.pointerId === press.id) {
      canvas.releasePointerCapture?.(ev.pointerId);
      press = null;
    }
  });
}
