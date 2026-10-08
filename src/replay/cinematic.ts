/**
 * The cinematic replay layer (brief §9.4, §5.6 "the replay camera is a small
 * set of composed shots", stage 5): a run recorded STEP FOR STEP from the
 * deterministic sim, an event list derived from that record, a SHOT PLAN cut
 * on the event beats, and a camera director that evaluates a pose at any sim
 * time.
 *
 * The seek law, stated plainly: there is no separate playback simulation.
 * `stepAndRecord` steps the one World the page verified with (visuals on —
 * visuals never reach the solver, `tests/unit/set-wiring.test.ts`), storing
 * every step's car state and the follow-camera state advanced at exactly
 * `FIXED_DT`. Rendering a moment reads the stored STEP — `floor(t / dt)` —
 * never a blend of two states, so "the state at t is the sim's state at t"
 * is true by construction, and `replayRun({record:true})` in Node produces
 * the identical list (`tests/e2e/share-replay.spec.ts` proves it step for
 * step). Scrubbing "fast-forwards" in the sense that matters: the seek shows
 * states the sim itself produced, nothing invented between them.
 *
 * Shot grammar (art bible §5.6 — a camera that FRAMES over one that follows):
 *
 *   WIDE     establishing shot at the launch — whole track in frame, look-at
 *            biased toward the start, a slow lateral drift, no chase.
 *   FOLLOW   the tracked corner shot — the §7.3 `RunCamera` driven at the
 *            sim's own `FIXED_DT`, so its rail leads and prop lifts are the
 *            house grammar, recorded per step (playback speed never rescales
 *            the filters — the pose at step k is the pose step k produced).
 *   FINISH   a lock-off at the cup (the capture centre, the rail tangent for
 *            the approach angle), a gentle push-in, holding through the run
 *            end and the tail.
 *
 * Three shots per run minimum; cuts sit on the event beats (top speed, big
 * air, the finish/fall), each cut crossing with a short eased blend — a
 * softened cut, not a tween between worlds: during the blend both shots are
 * evaluated at the SAME sim time and the state on screen is still the sim's.
 */
import * as THREE from 'three';
import { FIXED_DT, SIM_SCALE } from '../physics/sim.ts';
import type { Build } from '../track/build.ts';
import { KitRig, finishCapture } from '../feel/kittrack.ts';
import { RunCamera, type RunCameraSolid } from '../camera/run-camera.ts';
import type { RunStatus } from '../world/world.ts';
import { World } from '../world/world.ts';

/** Seconds of held finish shot after the run ends. */
export const REPLAY_TAIL = 0.9;
/** Seconds the FINISH shot must be holding on the cup BEFORE the terminal
 *  beat — the dunk is the payoff and it must land INSIDE the shot, not
 *  during the cut into it (playtest BB: "if the cuts actually ENDED on the
 *  cup-dunk I'd forward it"). planShots caps `cut2` at `time - this` whenever
 *  the shot ordering allows. */
export const REPLAY_FINISH_LEAD = 0.4;
/** Seconds of eased blend across a cut (split either side of the beat). */
export const REPLAY_BLEND = 0.4;
/** Replay fov — §7.3: tighter than the 35° of play. */
export const REPLAY_FOV = 28;
/** Default step cap — the same 15 s wall `replayRun` enforces. */
export const REPLAY_MAX_STEPS = 15 * 120;

/** Minimal per-step witness `deriveEvents` reads (exactly what
 * `replayRun({record:true})` yields — the Node side derives the SAME event
 * list from it). */
export interface EventSample {
  t: number;
  speed: number;
  grounded: boolean;
}

export interface ReplayEvent {
  t: number;
  kind: 'launch' | 'maxSpeed' | 'bigAir' | 'finish';
  label: string;
}

/** Shots tile [0, duration]; each is [start, end) except the last. */
export interface ShotSpec {
  kind: 'wide' | 'follow' | 'finish';
  start: number;
  end: number;
}

export interface ShotPlan {
  shots: ShotSpec[];
  /** The cut beats (shot boundaries the blend straddles). */
  cuts: number[];
  duration: number;
}

export interface RunTrace {
  dt: number;
  steps: number;
  /** Sim time of the terminal step. */
  time: number;
  /** time + the finish hold — the playhead range. */
  duration: number;
  status: RunStatus;
  hash: string;
  /** 3 per step, world metres — the sim's own car states (`state().car.pos`). */
  pos: Float64Array;
  /** 4 per step (x,y,z,w) — the sim's own `state().car.quat`. */
  quat: Float64Array;
  /** speed per step (world m/s). */
  speed: Float64Array;
  /** rail arc per step (world m; monotonically estimated without a rig). */
  arc: Float64Array;
  /** 3 per step — the follow shot's eye, recorded at FIXED_DT. */
  followPos: Float64Array;
  /** 4 per step (x,y,z,w). */
  followQuat: Float64Array;
  events: ReplayEvent[];
  plan: ShotPlan;
}

const STATUS_LABEL: Record<RunStatus, string> = {
  idle: 'Idle',
  running: 'Running',
  finished: 'Finish',
  fell: 'Fell off',
  stalled: 'Stalled',
  timeout: 'Timed out',
};

const UP = new THREE.Vector3(0, 1, 0);

/**
 * The event beats of a recorded run: the launch (t=0), the TOP SPEED sample
 * (skip it when it is the first or last sample — a launch drop accelerates
 * monotonically and a run whose fastest instant IS its end has no separate
 * speed beat), the BIG AIR takeoff of the longest airborne segment (≥ 0.15 s
 * — shorter hops are deck seams, not moments; a segment starting at the very
 * first sample is a launch off the ramp, already owned by the wide shot),
 * and the terminal beat (Finish / Fell off / Stalled / Timed out). Pure over
 * the sample stream, so Node and the page derive the identical list.
 */
export function deriveEvents(samples: readonly EventSample[], status: RunStatus): ReplayEvent[] {
  const events: ReplayEvent[] = [];
  if (samples.length === 0) return events;
  const end = samples[samples.length - 1]!;
  events.push({ t: 0, kind: 'launch', label: 'Launch' });
  let kMax = 0;
  for (let i = 1; i < samples.length; i++) {
    if (samples[i]!.speed > samples[kMax]!.speed) kMax = i;
  }
  if (kMax > 0 && kMax < samples.length - 1) {
    events.push({ t: samples[kMax]!.t, kind: 'maxSpeed', label: 'Top speed' });
  }
  let bestStart = -1;
  let bestLen = 0;
  let runStart = -1;
  for (let i = 0; i < samples.length; i++) {
    const air = !samples[i]!.grounded;
    if (air && runStart < 0) runStart = i;
    if ((!air || i === samples.length - 1) && runStart >= 0) {
      const len = samples[i]!.t - samples[runStart]!.t;
      if (len >= 0.15 && len > bestLen) {
        bestLen = len;
        bestStart = runStart;
      }
      runStart = -1;
    }
  }
  if (bestStart > 0) {
    events.push({ t: samples[bestStart]!.t, kind: 'bigAir', label: 'Big air' });
  }
  events.push({ t: end.t, kind: 'finish', label: STATUS_LABEL[status] });
  events.sort((a, b) => a.t - b.t);
  return events;
}

/**
 * Three-shot minimum with the cuts ON the beats: the wide owns the launch
 * until the first beat (or a third of the run), the follow owns the middle,
 * the finish takes the last stretch into the cup. Clamped so the shots stay
 * ordered on a very short run — coverage is the contract, the widths follow
 * the run.
 */
export function planShots(time: number, events: readonly ReplayEvent[]): ShotPlan {
  const end = Math.max(time, 0.4);
  const beats = events.filter((e) => e.kind === 'maxSpeed' || e.kind === 'bigAir').map((e) => e.t);
  const first = beats.length ? Math.min(...beats) : end * 0.35;
  const last = beats.length ? Math.max(...beats) : end * 0.7;
  const cut1 = THREE.MathUtils.clamp(
    Math.max(first, Math.min(0.45, end * 0.3)),
    end * 0.2,
    end * 0.6,
  );
  const cut2 = THREE.MathUtils.clamp(
    Math.max(last + 0.25, cut1 + 0.3, end * 0.65),
    cut1 + Math.max(0.15, end * 0.1),
    // the finish shot must own the last REPLAY_FINISH_LEAD seconds — the
    // cup-dunk happens INSIDE a held shot, never inside a blend
    // (playtest BB: the finale must land on the cup; on a very short run
    // the ordering floor wins over the lead)
    Math.max(cut1 + 0.15, end - Math.max(0.2, Math.min(REPLAY_FINISH_LEAD, end * 0.18))),
  );
  return {
    shots: [
      { kind: 'wide', start: 0, end: cut1 },
      { kind: 'follow', start: cut1, end: cut2 },
      { kind: 'finish', start: cut2, end: end + REPLAY_TAIL },
    ],
    cuts: [cut1, cut2],
    duration: end + REPLAY_TAIL,
  };
}

export interface StepAndRecordOptions {
  maxSteps?: number;
  /** Set-prop boxes for the follow shot's clearance solve (the same boxes
   * the game's run camera gets; empty for a set-less level). */
  solids?: readonly RunCameraSolid[];
}

/**
 * Launch the world, step it to the terminal status or the cap, and record
 * every step: the car state the sim itself produced (identical to what
 * `replayRun({record:true})` stores, so the two lists compare step for step)
 * plus the follow camera advanced at `FIXED_DT`. This IS the fast-forward:
 * the whole run's truth is stored before playback starts, and playback never
 * steps physics again.
 */
export function stepAndRecord(
  world: World,
  build: Build,
  options: StepAndRecordOptions = {},
): RunTrace {
  const cap = options.maxSteps ?? REPLAY_MAX_STEPS;
  const rig = new KitRig(build, SIM_SCALE);
  const hasRail = rig.length > 1e-9;
  const cup = finishCapture(build);
  const finishArc = cup && hasRail ? rig.nearestArcInfo(cup.center).arc : undefined;
  const follow = hasRail ? new RunCamera(rig, 0, { solids: options.solids ?? [], finishArc }) : null;

  const samples: (EventSample & { arc: number })[] = [];
  const carPos: number[] = [];
  const carQuat: number[] = [];
  const camPos: number[] = [];
  const camQuat: number[] = [];
  world.launch();
  let arc = hasRail ? rig.nearestArcInfo(world.state().car.pos).arc : 0;
  follow?.snap(arc, world.state().car.speed);
  while (world.stepCount < cap && world.status === 'running') {
    world.step();
    const s = world.state();
    arc = hasRail ? rig.nearestArcInfo(s.car.pos).arc : arc + s.car.speed * FIXED_DT;
    if (follow) {
      follow.update(FIXED_DT, arc, s.car.speed, s.car.pos);
      camPos.push(follow.position.x, follow.position.y, follow.position.z);
      camQuat.push(follow.rotation.x, follow.rotation.y, follow.rotation.z, follow.rotation.w);
    } else {
      // no rail to ride (a rail-less rig): a stiff low side-pass of the car —
      // still a composed shot, never a chase cam welded to the chassis
      const cx = s.car.pos.x;
      const cy = s.car.pos.y;
      const cz = s.car.pos.z;
      camPos.push(cx - 0.28, cy + 0.16, cz + 0.28);
      scratchLook.set(cx, cy, cz);
      scratchEye.set(camPos[camPos.length - 3]!, camPos[camPos.length - 2]!, camPos[camPos.length - 1]!);
      scratchM.lookAt(scratchEye, scratchLook, UP);
      scratchQ.setFromRotationMatrix(scratchM);
      camQuat.push(scratchQ.x, scratchQ.y, scratchQ.z, scratchQ.w);
    }
    carPos.push(s.car.pos.x, s.car.pos.y, s.car.pos.z);
    carQuat.push(s.car.quat.x, s.car.quat.y, s.car.quat.z, s.car.quat.w);
    samples.push({ t: world.time, speed: s.car.speed, grounded: s.car.grounded, arc });
  }

  const n = samples.length;
  const pos = new Float64Array(carPos);
  const quat = new Float64Array(carQuat);
  const speed = new Float64Array(n);
  const arcs = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    speed[i] = samples[i]!.speed;
    arcs[i] = samples[i]!.arc;
  }
  const events = deriveEvents(samples, world.status);
  const time = n > 0 ? samples[n - 1]!.t : 0;
  return {
    dt: FIXED_DT,
    steps: n,
    time,
    duration: time + REPLAY_TAIL,
    status: world.status,
    hash: world.hashHex(),
    pos,
    quat,
    speed,
    arc: arcs,
    followPos: new Float64Array(camPos),
    followQuat: new Float64Array(camQuat),
    events,
    plan: planShots(time, events),
  };
}

/** The finish shot's anchor: the cup's capture centre and the rail tangent
 * there (the approach direction). Null cup → null; the director falls back
 * to the car's end state and its final travel direction. */
export function cupView(build: Build): { center: THREE.Vector3; tangent: THREE.Vector3 } | null {
  const cup = finishCapture(build);
  if (!cup) return null;
  const rig = new KitRig(build, SIM_SCALE);
  if (rig.length <= 1e-9) return { center: cup.center, tangent: new THREE.Vector3(1, 0, 0) };
  return { center: cup.center, tangent: rig.frameAt(rig.nearestArcInfo(cup.center).arc).tangent };
}

const scratchEye = new THREE.Vector3();
const scratchLook = new THREE.Vector3();
const scratchM = new THREE.Matrix4();
const scratchQ = new THREE.Quaternion();
const scratchPosB = new THREE.Vector3();
const scratchQuatB = new THREE.Quaternion();

function easeInOut(u: number): number {
  return u * u * (3 - 2 * u);
}

export interface ReplayDirectorOptions {
  trace: RunTrace;
  /** World bbox of the track group (the framing subject — never the whole
   * scene, whose box centres on the mounted set, `frameCamera` doctrine). */
  box: THREE.Box3;
  /** Cup anchor from `cupView`; null falls back to the car's end state. */
  cup: { center: THREE.Vector3; tangent: THREE.Vector3 } | null;
  fov?: number;
  aspect?: number;
  /** Reduced motion: the blends collapse to hard cuts (shorter than the
   * bible's 250 ms — the pose simply changes at the beat). */
  reducedMotion?: boolean;
}

/**
 * The shot-sequence camera. `poseAt(t)` writes the composed eye pose for sim
 * time `t` into `this.position`/`this.quaternion` — every term a deterministic
 * function of the recorded trace (analytic wide/finish, per-step follow), so
 * the pose at t is the same however t was reached. Inside a blend window
 * BOTH shots are evaluated at the SAME t and eased between; outside, one
 * shot owns the frame outright.
 */
export class ReplayDirector {
  readonly position = new THREE.Vector3();
  readonly quaternion = new THREE.Quaternion();

  private readonly trace: RunTrace;
  private readonly reducedMotion: boolean;
  private readonly center = new THREE.Vector3();
  private readonly span: number;
  private readonly dWide: number;
  private readonly wideDir = new THREE.Vector3(0.55, 0.62, 0.75).normalize();
  private readonly wideRight = new THREE.Vector3();
  private readonly wideLook = new THREE.Vector3();
  private readonly finishAt = new THREE.Vector3();
  private readonly finishTangent = new THREE.Vector3();
  private readonly finishRight = new THREE.Vector3();
  private readonly dFinish: number;

  constructor(opts: ReplayDirectorOptions) {
    this.trace = opts.trace;
    this.reducedMotion = opts.reducedMotion ?? false;
    const box = opts.box.isEmpty() ? new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(), new THREE.Vector3(0.5, 0.2, 0.5)) : opts.box.clone();
    const size = box.getSize(new THREE.Vector3());
    box.getCenter(this.center);
    this.span = Math.max(size.x, size.y, size.z, 0.4);
    const fov = opts.fov ?? REPLAY_FOV;
    const aspect = opts.aspect ?? 16 / 9;
    const tanV = Math.tan((fov / 2) * (Math.PI / 180));
    const tanH = tanV * aspect;
    // fit the track's horizontal and vertical extent with margin; the eye
    // direction's horizontal component is ~1, so d doubles as the horizontal
    // coverage distance at this attitude
    this.dWide = Math.max(1.2, 1.25 * ((Math.max(size.x, size.z) / 2 + 0.25) / tanH), 1.25 * ((size.y / 2 + 0.2) / tanV));
    this.wideRight.crossVectors(UP, this.wideDir).normalize();
    const start = this.trace.steps > 0 ? this.posAtStep(0, scratchEye) : this.center.clone();
    this.wideLook.copy(this.center).lerp(start, 0.3);
    if (opts.cup) {
      this.finishAt.copy(opts.cup.center);
      this.finishTangent.copy(opts.cup.tangent).normalize();
    } else if (this.trace.steps > 0) {
      const last = this.posAtStep(this.trace.steps - 1, this.finishAt);
      const first = this.posAtStep(Math.max(0, this.trace.steps - 24), scratchLook);
      this.finishTangent.copy(first).sub(last);
      if (this.finishTangent.lengthSq() < 1e-12) this.finishTangent.set(-1, 0, 0);
      this.finishTangent.normalize();
    } else {
      this.finishTangent.set(-1, 0, 0);
    }
    // NOSE-FIRST FELL GUARD (playtest AA stage 5: "replay stage rendered
    // solid red"): the finish pose offsets the eye by `tangent * -0.45d +
    // UP * 0.42d`. When the run's final tangent is VERTICAL — the cup-less
    // `fell` line of a build that fell straight down (a hand-forged link
    // with no deck under the release falls exactly this way) — the two
    // terms almost cancel (0.45 − 0.42 = 0.03 of d, ~3 cm) and the eye ends
    // up INSIDE the chassis: the red car box fills the frame wall to wall,
    // lit maroon, for the whole 70 %-of-the-timeline finish hold. A
    // vertical vector is not a camera direction: flatten a near-vertical
    // tangent onto the floor plane (an analytic +x when the fall was dead
    // straight down) so the lock-off keeps its full offset and a proper
    // `finishRight`. Runs on every path — a cup line's rail tangent never
    // exceeds the kit's steepest drop (~45°), so the guard never touches a
    // shot the game actually frames.
    if (Math.abs(this.finishTangent.y) > 0.95) {
      this.finishTangent.y = 0;
      if (this.finishTangent.lengthSq() < 1e-12) this.finishTangent.set(1, 0, 0);
      this.finishTangent.normalize();
    }
    this.finishRight.crossVectors(UP, this.finishTangent).normalize();
    // a lock-off that frames the cup AND its approach: at fov 28 a d of
    // ~1.3 m shows ~1 m across — the cup, the last stretch of deck and a
    // piece of set around them. Tighter than this fills the frame with one
    // defocused slab of deck outside the focus band (the first build read
    // as a yellow smudge on the short ladder rungs).
    this.dFinish = THREE.MathUtils.clamp(0.9 + this.span * 0.35, 1.1, 2.4);
  }

  /** Evaluate and store the composed pose at sim time `t`. */
  poseAt(t: number): void {
    const { cuts } = this.trace.plan;
    const blend = this.reducedMotion ? 0 : REPLAY_BLEND;
    if (blend > 0) {
      for (const cut of cuts) {
        const lo = cut - blend / 2;
        const hi = cut + blend / 2;
        if (t > lo && t < hi) {
          const a = this.shotAt(cut - 1e-6);
          const b = this.shotAt(cut + 1e-6);
          const w = easeInOut(THREE.MathUtils.clamp((t - lo) / blend, 0, 1));
          this.shotPose(a, t, this.position, this.quaternion);
          this.shotPose(b, t, scratchPosB, scratchQuatB);
          this.position.lerp(scratchPosB, w);
          this.quaternion.slerp(scratchQuatB, w);
          // CARRY THE SUBJECT across the cut (playtest BB: "one ~0.5 s
          // window shows an EMPTY GROUND frame" — the blank lived entirely
          // inside the blend: both shots frame the car, but a raw
          // eye-position lerp + orientation slerp points the halfway pose
          // BETWEEN the two framings and misses the car for a few frames).
          // Through the blend the orientation eases through "look at the
          // car from the blended eye", the nudge peaking at the midpoint
          // and vanishing (4w(1−w)) at both ends, so each shot's composed
          // pose is untouched at its boundaries — a softened cut that
          // keeps the subject on screen, never a tween across a blank.
          if (this.trace.steps > 0) {
            const step = Math.min(
              this.trace.steps - 1,
              Math.max(0, Math.floor(t / this.trace.dt + 1e-6)),
            );
            this.posAtStep(step, scratchLook);
            scratchM.lookAt(this.position, scratchLook, UP);
            scratchQ.setFromRotationMatrix(scratchM);
            this.quaternion.slerp(scratchQ, 4 * w * (1 - w));
          }
          return;
        }
      }
    }
    this.shotPose(this.shotAt(t), t, this.position, this.quaternion);
  }

  private shotAt(t: number): ShotSpec {
    const shots = this.trace.plan.shots;
    for (const s of shots) if (t < s.end - 1e-9) return s;
    return shots[shots.length - 1]!;
  }

  private posAtStep(i: number, out: THREE.Vector3): THREE.Vector3 {
    const p = this.trace.pos;
    return out.set(p[i * 3]!, p[i * 3 + 1]!, p[i * 3 + 2]!);
  }

  private shotPose(shot: ShotSpec, t: number, pos: THREE.Vector3, quat: THREE.Quaternion): void {
    const u = easeInOut(
      THREE.MathUtils.clamp((t - shot.start) / Math.max(shot.end - shot.start, 1e-6), 0, 1),
    );
    switch (shot.kind) {
      case 'wide': {
        // slow lateral drift and a hair of push-in; the look-at stays put
        const d = this.dWide * (1.04 - 0.06 * u);
        pos.copy(this.wideDir).multiplyScalar(d).addScaledVector(this.wideRight, d * 0.07 * (2 * u - 1));
        pos.add(this.center);
        scratchM.lookAt(pos, this.wideLook, UP);
        quat.setFromRotationMatrix(scratchM);
        return;
      }
      case 'follow': {
        // the recorded per-step pose — the sim-locked §7.3 rail camera
        const step = Math.min(
          this.trace.steps - 1,
          Math.max(0, Math.floor(t / this.trace.dt + 1e-6)),
        );
        const p = this.trace.followPos;
        const q = this.trace.followQuat;
        pos.set(p[step * 3]!, p[step * 3 + 1]!, p[step * 3 + 2]!);
        quat.set(q[step * 4]!, q[step * 4 + 1]!, q[step * 4 + 2]!, q[step * 4 + 3]!);
        return;
      }
      case 'finish': {
        // lock-off beside the cup on the approach side, gentle push-in, the
        // look-at mostly on the cup so the finish tick centres the capture
        const d = this.dFinish * (1.05 - 0.12 * u);
        pos
          .copy(this.finishAt)
          .addScaledVector(this.finishRight, d * 0.55)
          .addScaledVector(this.finishTangent, -d * 0.45)
          .addScaledVector(UP, d * 0.42);
        scratchLook.copy(this.finishAt).lerp(this.center, 0.15);
        scratchM.lookAt(pos, scratchLook, UP);
        quat.setFromRotationMatrix(scratchM);
        return;
      }
    }
  }
}
