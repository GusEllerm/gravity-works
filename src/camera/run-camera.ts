/**
 * The run camera (PROMPT §5.6 / §7.3): it LEADS the car along the track's
 * camera rail and anticipates turns rather than chasing, with a 150 ms
 * positional lag and a deliberately slower rotational lag, so the track is
 * already around the coming corner while the frame is still easing in, and
 * loops are framed from the side before the car arrives.
 *
 * A pure class: no renderer, no clocks, no globals. The caller feeds it the
 * car's rail arc and ground speed at a fixed `dt` (the same dt as the
 * simulation, so headless replays frame identically to the live game) and
 * it returns a position and orientation. Deterministic in the input
 * sequence — every filter is the step-order-independent exponential form
 * (1 − e^(−dt/τ)), never a (1 − dt/τ) shortcut.
 */
import * as THREE from 'three';

export interface RunCameraSource {
  /** Rail point (world metres) at clamped arc `s`. */
  railPointAt(s: number): THREE.Vector3;
  /** Track frame at clamped arc `s`. */
  frameAt(s: number): { pos: THREE.Vector3; tangent: THREE.Vector3; up: THREE.Vector3 };
  /** Total rail length (world m). */
  readonly length: number;
}

export const RUN_CAMERA = {
  LEAD_TIME: 0.4, // s the camera sits ahead of the car along the rail
  POS_LAG: 0.15, // s positional lag (the §7.3 number)
  ROT_LAG: 0.35, // s rotational lag — slower by design: that gap IS the
    // anticipation beat, ~0.2 s of "camera already turned, car arriving"
  HEIGHT: 0.022, // camera eye above the rail line (rail sits at wheel
    // height, so this lands the eye near the deck, toy-canyon scale)
} as const;

export class RunCamera {
  private arc: number;
  private readonly quat = new THREE.Quaternion();
  private readonly pos = new THREE.Vector3();
  private readonly targetPos = new THREE.Vector3();
  private readonly targetQuat = new THREE.Quaternion();
  private readonly m = new THREE.Matrix4();
  private readonly vA = new THREE.Vector3();
  private readonly vB = new THREE.Vector3();
  private readonly vC = new THREE.Vector3();

  private readonly source: RunCameraSource;

  constructor(source: RunCameraSource, startArc = 0) {
    this.source = source;
    this.arc = THREE.MathUtils.clamp(startArc, 0, Math.max(source.length - 1e-9, 0));
    this.buildTarget(this.arc);
    this.quat.copy(this.targetQuat);
    this.pos.copy(this.targetPos);
  }

  /** Advance `dt` seconds; the car sits at rail arc `carArc` moving at
   *  `speed` world m/s. */
  update(dt: number, carArc: number, speed: number): void {
    const lead = Math.min(
      THREE.MathUtils.clamp(carArc, 0, this.source.length) + speed * RUN_CAMERA.LEAD_TIME,
      this.source.length - 1e-9,
    );
    // The arc smoothing IS the positional lag (the rail is the position
    // path — no second filter on top, or the 150 ms quietly becomes 300).
    this.arc += (lead - this.arc) * (1 - Math.exp(-dt / RUN_CAMERA.POS_LAG));
    this.buildTarget(this.arc);
    this.pos.copy(this.targetPos);
    // Orientation aims at the LEAD frame (before positional smoothing),
    // eased with the slower constant: the frame starts turning into the
    // corner while the eye is still arriving along the straight — that is
    // the §7.3 "anticipates turns rather than chasing" beat.
    this.buildQuatTarget(lead);
    this.quat.slerp(this.targetQuat, 1 - Math.exp(-dt / RUN_CAMERA.ROT_LAG));
  }

  /** Cut / spawn / reset: land on the target with no filtering. */
  snap(carArc: number, speed = 0): void {
    this.arc = THREE.MathUtils.clamp(
      carArc + speed * RUN_CAMERA.LEAD_TIME,
      0,
      Math.max(this.source.length - 1e-9, 0),
    );
    this.buildTarget(this.arc);
    this.quat.copy(this.targetQuat);
    this.pos.copy(this.targetPos);
  }

  /** Current eye position (read-only view; do not mutate). */
  get position(): THREE.Vector3 {
    return this.pos;
  }

  /** Current orientation (read-only view; do not mutate). */
  get rotation(): THREE.Quaternion {
    return this.quat;
  }

  /** Rail arc the camera currently sits at (tests / debug). */
  get railArc(): number {
    return this.arc;
  }

  private buildTarget(s: number): void {
    const rail = this.source.railPointAt(s);
    const f = this.source.frameAt(s);
    this.targetPos.copy(rail).addScaledVector(f.up, RUN_CAMERA.HEIGHT);
    this.buildQuatTarget(s);
  }

  private buildQuatTarget(s: number): void {
    const f = this.source.frameAt(s);
    // Look along the rail tangent with the track's up: because s leads the
    // car, the tangent being looked along is the COMING corner.
    this.vA.copy(f.tangent).normalize().negate(); // cameras look down -z
    this.vB.copy(f.up).normalize();
    this.vC.crossVectors(this.vB, this.vA).normalize();
    this.vB.crossVectors(this.vA, this.vC).normalize();
    this.m.makeBasis(this.vC, this.vB, this.vA);
    this.targetQuat.setFromRotationMatrix(this.m);
  }
}
