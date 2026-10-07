/**
 * The run camera (PROMPT §7.3): it LEADS the car along the track's camera
 * rail and anticipates turns rather than chasing, with a 150 ms positional
 * lag and a deliberately slower rotational lag, so the track is already
 * around the coming corner while the frame is still easing in, and loops are
 * framed from the side before the car arrives.
 *
 * A pure class: no renderer, no clocks, no globals. The caller feeds it the
 * car's rail arc and ground speed at a fixed `dt` (the same dt as the
 * simulation, so headless replays frame identically to the live game) and
 * it returns a position and orientation. Deterministic in the input
 * sequence — every filter is the step-order-independent exponential form
 * (1 − e^(−dt/τ)), never a (1 − dt/τ) shortcut.
 *
 * STAGE 3 (the "beige wall" fix, playtests E/F/G). Two facts the raw
 * rail-lead produced on the real kitchen rails:
 *
 * 1. The EYE trails, the AIM leads. Measured on the L01–L04 par runs, an
 *    eye at a rail point `speed · LEAD_TIME` AHEAD of the car (even one
 *    offset backward by the shell's 12 cm) sat AHEAD of the car for 67–72 %
 *    of every run: the car was behind the camera plane and the frame was
 *    scenery — the "beige blur, car off-screen" finding. The fix is
 *    structural, not a bigger number: the §7.3 lead stays exactly where
 *    §7.3 spends it — the ORIENTATION target (aim at the lead rail point:
 *    turns anticipated) — while the EYE rides the rail itself a fixed
 *    `TRAIL` of track BEHIND the car, through the same 150 ms positional
 *    filter. Trailing ALONG the rail, not backward along the local tangent
 *    (measured: at the lip→drop seam's ~45° plunge a 0.4 m tangent-back
 *    offset turned the eye's chase into a 0.26 m one-step crane jump),
 *    keeps toy-train framing at every slope. Near the rail start the trail
 *    clamps at 0: a `LAUNCH_PEEP` lift and a distance-blended aim keep the
 *    released car framed while the trail winds out.
 * 2. The eye never touches the SET. The kitchen mounts solid props (book
 *    stack, tap column, bowl, mug) at known world boxes next to the rail;
 *    a ~9 cm-high chase eye drove straight through them ("camera buried
 *    in a grey wall" — E). Every frame the eye point and the eye→car
 *    sightline are cleared against the caller's solid AABBs: whichever
 *    would be intersected forces the eye above the tallest blocking box
 *    top. The lift passes through the same exponential filter family
 *    (`LIFT_LAG`), so the camera ARCS OVER a prop instead of teleporting,
 *    and settles back the moment the line is clear.
 *
 * §7.3 lead/lag is unchanged: `LEAD_TIME` 0.4 s (aim), `POS_LAG` 150 ms
 * (both arc filters), `ROT_LAG` 350 ms.
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

/** An axis-aligned solid (world metres) the camera must not intersect or
 *  look through — the shell passes the set's prop boxes (the same boxes
 *  `setPlacementGuard` feeds the builder). Plain arrays so the class never
 *  imports a scene graph. */
export interface RunCameraSolid {
  min: readonly [number, number, number];
  max: readonly [number, number, number];
}

export interface RunCameraOptions {
  /** Set solids to clear (see `RunCameraSolid`). Empty by default — a track
   *  in empty space needs no lift and frames as before. */
  solids?: readonly RunCameraSolid[];
  /** Rail arc of the FINISH witness (the finish cup's capture centre
   *  projected onto the rail — `finishCapture` + `KitRig.nearestArcInfo`).
   *  Defaults to the rail END. Stage 4 watchability (playtest M): keying the
   *  finish fade to the rail END only works when the cup sits AT the rail
   *  end (L01/L04). L02's rail runs 0.84 m of visible curve PAST its cup,
   *  so on L02's par AND arc lines the rail-keyed fade never fired and the
   *  whole approach-to-cup second framed as flat tabletop at 7 cm eye
   *  height ("the cup and death spot were NEVER visible"). The witness —
   *  not the rail terminus — is where the run actually ends. */
  finishArc?: number;
}

/** Optional per-step car truth (world metres). The arc alone cannot say
 *  how high the car actually is — over a gap jump the car leaves the rail
 *  line and climbs out of the frame (§7.3's focus band is centred ON the
 *  car, playtest F). Given `carPos`, the aim's VERTICAL follows the real
 *  car (azimuth stays on the rail lead, so anticipation is untouched). */
export interface RunCameraCarPos {
  x: number;
  y: number;
  z: number;
}

export const RUN_CAMERA = {
  LEAD_TIME: 0.4, // s the aim looks ahead along the rail (§7.3)
  POS_LAG: 0.15, // s positional lag (the §7.3 number)
  ROT_LAG: 0.35, // s rotational lag — slower by design: that gap IS the
    // anticipation beat, ~0.2 s of "camera already turned, car arriving"
  HEIGHT: 0.022, // camera eye above the rail line (rail sits at wheel
    // height, so this lands the eye near the deck, toy-canyon scale)
  /** Stage 3 framing, promoted from the shell's eye offset (the class owns
   *  the eye now so the clearance and in-frame maths see the SAME point
   *  the renderer gets). EYE_UP adds to HEIGHT. */
  EYE_UP: 0.05,
  /** The eye rides the rail this much TRACK behind the car (world m) —
   *  the "focus band keeps the car in frame" contract (see header). */
  TRAIL: 0.25,
  /** Eye/sightline clearance kept from every solid (world m). */
  CLEAR_MARGIN: 0.04,
  /** s — exponential smoothing of the clearance lift, so passing a prop
   *  lifts the eye in an arc, not a cut. */
  LIFT_LAG: 0.25,
  /** Iterations of the lift solve (a lifted eye can uncover a taller
   *  neighbour behind the first box; 4 sweeps converge on the set's props). */
  LIFT_ITERS: 4,
  /** How much of the car's height ABOVE its rail point the aim takes when
   *  a `carPos` is supplied (0 = pure rail line, 1 = aim at the car's own
   *  height). Measured on the L01–L04 par runs: the airborne window
   *  (gapLip→landing, t ≈ 1.4–1.8 s) lifts the car up to ~12 cm over the
   *  rail chord; 0.75 pulls it back inside the frame at every sampled
   *  step without letting one wheel contact tilt the horizon. */
  AIM_Y_FOLLOW: 0.75,
  /** Below this eye→car distance (world m) the aim blends toward the CAR
   *  itself — near the rail start the trail clamps and a pure lead aim
   *  would look past a car the eye is nearly on top of. In steady chase
   *  the distance is `TRAIL` and the blend weight is exactly 0. */
  AIM_CAR_BLEND: 0.12,
  /** Max tangent turning (rad, ≈60°) the trail may take behind the car —
   *  straight track keeps the full `TRAIL`, a tight fixture (the bowl
   *  rim's 0.12 m radius, L03) shortens it to stay within the sweep, so
   *  the eye never parks on the far side of a curve looking through it. */
  TRAIL_MAX_SWEEP: 1.05,
  /** Eye lift (world m) at zero eye→car distance, fading linearly to 0 at
   *  `TRAIL`: the launch dolly-up that keeps the release frame a view of
   *  the car instead of a deck close-up while the trail winds out. */
  LAUNCH_PEEP: 0.1,
  /** Rail arc (world m) before the FINISH WITNESS where the FINISH framing
   *  fades in (stage 4, playtest J+K, re-windowed by playtest M). The dense
   *  100 ms gate samples the FINAL SECOND of the run and L01-L04 line
   *  speeds cross a second in ≈ 1.2 m of rail, so 1.2 m is the window that
   *  makes the last second a finish clip while leaving the STAGE-3 CRUISE
   *  framing (the trailing eye, the lead-aim anticipation) untouched for
   *  the rest of the run — an earlier probe widened this to 2 m, which is
   *  more than half of a 2.4 m ladder run, and the "finish composition"
   *  quietly replaced the cruise composition everywhere. The old 0.5 m
   *  window only lit the crane at t ≈ 1.9 s of a 2.2 s run, leaving the
   *  frames before it a 7 cm-high stare along the tabletop (L01 dense
   *  worst 89 %) — and L02's fade never fired AT ALL on either line,
   *  because the fade keyed on the rail END and L02's rail runs 0.84 m of
   *  visible curve past its cup. It now counts DOWN from the finish
   *  witness's arc (`finishArc`, default the rail end) and stays fully
   *  faded PAST it: the witness is where the run ENDS, and on a rail that
   *  runs on past the cup the eye should already be airborne over the cup
   *  when the capture fires. */
  FINISH_ARC: 1.2,
  /** Eye lift (world m) fully faded in at the rail end — a finish-clip
   *  crane-up that puts the tabletop seen from ABOVE (cup, props, floor
   *  variation) in frame instead of the table seen from 7 cm above it. The
   *  lift rides the same `LIFT_LAG` filter as the prop clearance, so it is
   *  an arc, not a cut; measured worst single-colour share of the L01 final
   *  second drops from 88 % to ≤ 60 % with this much lift. */
  FINISH_LIFT: 0.22,
  /** Extra track (world m) the eye pays BACK along the rail as the finish
   *  fades in (stage 4 watchability, playtest M). Lift alone is a weak
   *  lever at kitchen scale: a straight-up crane trades the tabletop skim
   *  for a straight-down stare at it. Pulling the eye BACK while it rises
   *  turns the last metres of a run into the classic finish clip — car,
   *  cup and set props in one frame. 0.15 m, not more: the eye→car
   *  distance contract (the beige-wall proof, `tests/unit/camera.test.ts`,
   *  < 0.7 m EVERY step of every par run) bounds the whole finish pose —
   *  the 0.55 m pull-back this constant briefly carried measured 1.15 m
   *  eye→car at the terminal step and broke that contract on all four
   *  ladder rungs. The `POS_LAG` filter carries the dolly, so it reads as
   *  one move with the crane, not a cut. */
  FINISH_TRAIL: 0.25,
  /** Lateral finish offset (world m, along the trail point's track RIGHT
   *  = `up × tangent`): the classic FINISH-LINE camera (stage 4
   *  watchability, playtest M). The kitchen's counter is one vast flat
   *  cream and its surroundings one flat grey band — an eye ON the rail
   *  at the run's end fills the shot with one of them however it is
   *  lifted, and the gate's 240x135 quantiser merges the cream/gold family
   *  into buckets a full-resolution probe does not see. Stepping the eye
   *  off the rail breaks the composition diagonal: rail, props and the
   *  cup's neighbourhood lie ACROSS the shot instead of receding into it.
   *  Measured on the dense gate (quantiser fixed — the sampler's B channel
   *  used to OR into its G slot): 0.35 m to the track-right keeps every
   *  dense frame of L01/L02(par+alt)/L04 <= 45 %; the direction matters
   *  at the yawed L04 mount (track-LEFT measured 63 % there, RIGHT 43 %).
   *  0 keeps the stage-3 rail-riding framing (and the analytic tests);
   *  the magnitude is bounded by the same eye→car contract as
   *  `FINISH_TRAIL` — 0.5 m briefly shipped and broke it (1.15 m at the
   *  terminal step). The eye reaches the offset continuously with the
   *  finish fade (the `POS_LAG` filter carries it), a swing, not a cut. */
  FINISH_SIDE: 0.25,
  /** How much of the lead-aim is traded for an aim at the CAR as the finish
   *  fades in (0..1 at the rail end): the §7.3 anticipation has nothing
   *  left to anticipate past the last rail point, and a lead clamped at the
   *  terminus turns the aim into a stare at the wall past the finish. */
  FINISH_LEAD_TAPER: 0.4,
} as const;

export class RunCamera {
  private arc: number;
  private trailArc: number;
  private lift = 0;
  private liftFiltered = 0;
  private readonly quat = new THREE.Quaternion();
  private readonly pos = new THREE.Vector3();
  private readonly eyeBase = new THREE.Vector3();
  private readonly carPoint = new THREE.Vector3();
  private readonly railAtCar = new THREE.Vector3();
  private readonly targetQuat = new THREE.Quaternion();
  private readonly m = new THREE.Matrix4();
  private readonly vA = new THREE.Vector3();
  private readonly vB = new THREE.Vector3();
  private readonly vC = new THREE.Vector3();
  private readonly vD = new THREE.Vector3();

  private readonly source: RunCameraSource;
  private readonly solids: readonly RunCameraSolid[];
  private readonly finishArc: number;

  constructor(source: RunCameraSource, startArc = 0, options: RunCameraOptions = {}) {
    this.source = source;
    this.solids = options.solids ?? [];
    this.finishArc = THREE.MathUtils.clamp(
      options.finishArc ?? source.length,
      0,
      Math.max(source.length, 1e-9),
    );
    this.arc = this.clampArc(startArc);
    this.trailArc = this.clampArc(this.arc - this.effectiveTrail(this.arc));
    this.setEyeBase(this.arc);
    this.carPoint.copy(this.railAtCar);
    this.lift = this.requiredLift();
    this.liftFiltered = this.lift;
    this.ensureClearance();
    this.buildQuatTarget(this.arc);
    this.quat.copy(this.targetQuat);
    this.pos.copy(this.eyeBase).addScaledVector(UP, this.lift);
  }

  /** Advance `dt` seconds; the car sits at rail arc `carArc` moving at
   *  `speed` world m/s. `carPos` (optional world position) enables the
   *  airborne vertical aim follow — see `RunCameraCarPos`. */
  update(dt: number, carArc: number, speed: number, carPos?: RunCameraCarPos): void {
    const clampedCar = THREE.MathUtils.clamp(carArc, 0, this.source.length);
    const lead = Math.min(
      clampedCar + this.effectiveLead(clampedCar, speed * RUN_CAMERA.LEAD_TIME),
      this.finishArc,
    );
    // The lead-arc filter is what the §7.3 rotational anticipation reads.
    this.arc += (lead - this.arc) * (1 - Math.exp(-dt / RUN_CAMERA.POS_LAG));
    const wFinish = this.finishWeight(clampedCar);
    // The eye's own path: TRAIL of track behind the car through the SAME
    // 150 ms filter — the §7.3 positional lag now lives on the eye. The
    // trail shortens around tight curvature (TRAIL_CHORD_K) and pays BACK
    // for the finish pull-back (FINISH_TRAIL × wFinish).
    this.trailArc +=
      (this.clampArc(
        clampedCar - this.effectiveTrail(clampedCar) - RUN_CAMERA.FINISH_TRAIL * wFinish,
      ) - this.trailArc) *
      (1 - Math.exp(-dt / RUN_CAMERA.POS_LAG));
    this.setEyeBase(clampedCar);
    this.carPoint.copy(carPos ?? this.railAtCar);
    // The clearance lift rides its own exponential so the eye arcs over a
    // prop instead of cutting to it — but an ACTUAL intersection is never
    // filtered: the unfiltered requirement acts as a floor, so the
    // "camera inside a grey wall" frame cannot exist even for one step.
    // The finish crane-up rides the SAME filter as a target term, so the
    // end-of-run rise is an arc, not a cut (FINISH_ARC — playtest J+K).
    this.liftFiltered +=
      (this.requiredLift() + RUN_CAMERA.FINISH_LIFT * wFinish - this.liftFiltered) *
      (1 - Math.exp(-dt / RUN_CAMERA.LIFT_LAG));
    this.lift = Math.max(this.liftFiltered, this.requiredLift());
    this.ensureClearance();
    this.buildQuatTarget(lead, wFinish);
    this.pos.copy(this.eyeBase).addScaledVector(UP, this.lift);
    // ROT_LAG stays the §7.3 number for the CRUISE (the rotation-slower-
    // than-position gap IS the anticipation beat). Inside the finish fade
    // it tightens toward POS_LAG: anticipation buys lead time on CORNERS,
    // and at the finish the subject is a car arriving AT a fixed point —
    // a 350 ms rotation lag on the L04 sink (the car drops ~35 cm in 0.3 s
    // mid-fade) put it a tenth of a frame off the bottom edge
    // (`tests/unit/camera.test.ts`, playtest M watchability).
    const wAimRot = Math.min(1, wFinish / RUN_CAMERA.FINISH_LEAD_TAPER);
    const rotLag =
      RUN_CAMERA.ROT_LAG - wAimRot * (RUN_CAMERA.ROT_LAG - 0.05);
    this.quat.slerp(this.targetQuat, 1 - Math.exp(-dt / rotLag));
  }

  /** Cut / spawn / reset: land on the target with no filtering. */
  snap(carArc: number, speed = 0): void {
    const clampedCar = THREE.MathUtils.clamp(carArc, 0, this.source.length);
    this.arc = this.clampArc(
      Math.min(
        clampedCar + this.effectiveLead(clampedCar, speed * RUN_CAMERA.LEAD_TIME),
        this.finishArc,
      ),
    );
    this.trailArc = this.clampArc(
      clampedCar - this.effectiveTrail(clampedCar) - RUN_CAMERA.FINISH_TRAIL * this.finishWeight(clampedCar),
    );
    const wFinish = this.finishWeight(clampedCar);
    this.setEyeBase(clampedCar);
    this.carPoint.copy(this.railAtCar);
    this.lift = this.requiredLift() + RUN_CAMERA.FINISH_LIFT * wFinish;
    this.liftFiltered = this.lift;
    this.ensureClearance();
    this.buildQuatTarget(this.arc, wFinish);
    this.quat.copy(this.targetQuat);
    this.pos.copy(this.eyeBase).addScaledVector(UP, this.lift);
  }

  /** Current eye position (read-only view; do not mutate). */
  get position(): THREE.Vector3 {
    return this.pos;
  }

  /** Current orientation (read-only view; do not mutate). */
  get rotation(): THREE.Quaternion {
    return this.quat;
  }

  /** Rail arc the AIM reads ahead at (lead-filtered; tests / debug). */
  get railArc(): number {
    return this.arc;
  }

  /** The finish fade weight for a car at rail arc `s`: 0 until the last
   *  `FINISH_ARC` of track BEFORE THE FINISH WITNESS, 1 AT and PAST the
   *  witness (linear between). Pure so the filter, the hard floor and the
   *  aim taper all read the SAME number. Past the witness the weight stays
   *  1 even on a rail that runs on (L02's curve run-out): the fade tracks
   *  the run's END, not the rail's. */
  private finishWeight(carArc: number): number {
    const end = this.finishArc;
    const start = Math.max(0, end - RUN_CAMERA.FINISH_ARC);
    if (end <= 1e-6) return 0;
    return THREE.MathUtils.clamp((carArc - start) / (end - start), 0, 1);
  }

  /** Rail arc the EYE rides — carArc − TRAIL, filtered (tests/debug). */
  get eyeArc(): number {
    return this.trailArc;
  }

  /** Current clearance lift above the rail-plane eye (world m; tests/debug). */
  get clearanceLift(): number {
    return this.lift;
  }

  private clampArc(s: number): number {
    return THREE.MathUtils.clamp(s, 0, Math.max(this.source.length - 1e-9, 0));
  }

  /** Trail actually usable behind `carArc`: `TRAIL`, shortened where the
   *  track turns more than TRAIL_MAX_SWEEP within it — a 0.25 m trail on
   *  the bowl rim's 0.12 m radius (measured on L03) would sweep 120° and
   *  park the eye looking THROUGH the bowl from its far side. Four
   *  fixed-point sweeps on the measured tangent sweep converge
   *  monotonically. */
  private effectiveTrail(carArc: number): number {
    let t: number = RUN_CAMERA.TRAIL;
    for (let i = 0; i < 4; i++) {
      const sweep = this.sweepBehind(carArc, t);
      if (sweep <= RUN_CAMERA.TRAIL_MAX_SWEEP) break;
      t *= RUN_CAMERA.TRAIL_MAX_SWEEP / sweep;
    }
    return Math.max(0.02, t);
  }

  /** Like the trail, the AIM's lead distance is sweep-limited: 0.4 s at
   *  rim speed is 0.3 m of track — on the bowl rim's 0.12 m radius that is
   *  a 100°+ look-ahead AROUND the fixture, i.e. an aim that has left the
   *  car far behind in azimuth (measured off-frame on L03's rim). The
   *  anticipation stays on gentler track untouched (a 0.12 m-radius arc is
   *  a set piece, not a racing line). */
  private effectiveLead(carArc: number, want: number): number {
    let t: number = Math.min(want, this.source.length);
    for (let i = 0; i < 4; i++) {
      const sweep = this.sweepAhead(carArc, t);
      if (sweep <= RUN_CAMERA.TRAIL_MAX_SWEEP) break;
      t *= RUN_CAMERA.TRAIL_MAX_SWEEP / sweep;
    }
    return Math.min(want, Math.max(0.02, t));
  }

  /** Total tangent turning (rad) over the trail window [carArc − t, carArc]. */
  private sweepBehind(carArc: number, t: number): number {
    return this.sweepWindow(carArc, -t);
  }

  private sweepAhead(carArc: number, t: number): number {
    return this.sweepWindow(carArc, t);
  }

  private sweepWindow(carArc: number, span: number): number {
    const n = 5;
    let sweep = 0;
    let prev = this.source.frameAt(this.clampArc(carArc)).tangent;
    for (let i = 1; i <= n; i++) {
      const cur = this.source.frameAt(this.clampArc(carArc + (span * i) / n)).tangent;
      sweep += Math.acos(
        Math.min(1, Math.max(-1, prev.clone().normalize().dot(cur.clone().normalize()))),
      );
      prev = cur;
    }
    return sweep;
  }

  /** The rail-plane eye: the point on the rail the eye rides, lifted to
   *  eye height. No tangent-back offset (header, fix 1). The finish swing
   *  (FINISH_SIDE) steps the eye along the trail point's track RIGHT as the
   *  finish fades in — the finish-line composition (see the constant). */
  private setEyeBase(carArc: number): void {
    const rail = this.source.railPointAt(this.trailArc);
    const f = this.source.frameAt(this.trailArc);
    this.eyeBase
      .copy(rail)
      .addScaledVector(f.up, RUN_CAMERA.HEIGHT + RUN_CAMERA.EYE_UP)
      .addScaledVector(
        this.vD.crossVectors(f.up, f.tangent).normalize(),
        RUN_CAMERA.FINISH_SIDE * this.finishWeight(carArc),
      );
    this.railAtCar.copy(this.source.railPointAt(carArc));
  }

  private buildQuatTarget(leadS: number, wFinish = 0): void {
    // Look from the eye toward the lead RAIL point: the azimuth anticipates
    // the coming corner exactly like the old tangent-at-lead (on a straight
    // the azimuths are identical), the pitch carries the car into frame
    // instead of fixing the horizon at the eye's height, and banking still
    // rolls with the track's up. The aim's HEIGHT additionally follows the
    // real car above/below its rail point (airborne framing, AIM_Y_FOLLOW),
    // and at eye→car distances under AIM_CAR_BLEND the aim blends toward
    // the car itself (rail-start framing; weight is 0 in steady chase).
    const eye = this.vA.copy(this.eyeBase).addScaledVector(UP, this.lift);
    this.vC.copy(this.source.railPointAt(leadS)).sub(eye);
    this.vC.y += RUN_CAMERA.AIM_Y_FOLLOW * (this.carPoint.y - this.railAtCar.y) + this.lift;
    // On near-level view rays the PITCH is set to pass the ray through the
    // car while the YAW keeps aiming at the lead point: the §7.3 turn
    // anticipation is azimuthal, and every vertical truth in the run (the
    // airborne gap flight, a lifted eye craning over a prop, the ramp's
    // deck drop) is then in frame by construction. On steep rays (a loop
    // wall — horizontal projection under 0.25) the full lead-point aim
    // stays — that is "loops are framed from the side".
    const horiz = Math.hypot(this.vC.x, this.vC.z);
    // The finish swing (FINISH_SIDE) puts the eye off the rail plane, and
    // at the L04 sink the last metres fall steeply — the STEEP-RAY
    // exception (loops framed from the side) would then hold the pitch on
    // the lead point while the car dropped 35 cm below frame (measured
    // ny 1.10 off-centre at t ≈ 2.0 s, `tests/unit/camera.test.ts`). The
    // anticipation is about CORNERS; the finish window is not a corner —
    // while the finish fade is on the pitch reads the car at any ray
    // steepness.
    if (horiz > 0.25 || wFinish > 0) {
      const fx = this.vC.x / horiz;
      const fz = this.vC.z / horiz;
      const dx = this.carPoint.x - eye.x;
      const dz = this.carPoint.z - eye.z;
      const dF = Math.max(0.05, dx * fx + dz * fz);
      this.vC.set(fx * dF, this.carPoint.y - eye.y, fz * dF).normalize();
    }
    if (this.vC.lengthSq() < 1e-12) this.vC.copy(this.source.frameAt(leadS).tangent);
    // FINISH taper: past the last rail point the lead has nothing to
    // anticipate, and a lead clamped AT the terminus aims past the finish
    // into whatever wall stands beyond it (playtest K's "wall of
    // woodgrain"). Blend the view direction toward the CAR as the finish
    // fades in — the anticipation is kept where the rail still has track
    // ahead, and the last frames centre the car, not the backdrop.
    if (wFinish > 0) {
      // The taper completes at `FINISH_LEAD_TAPER` of the fade, not at its
      // end (stage 4, playtest M): the L04 SINK drops the car ~35 cm under
      // the rail in the MIDDLE of the fade window, and a lead-point
      // azimuth still 60 % in put the car off the bottom of the frame at
      // t ≈ 2.0 s (measured |ny| 1.10). Anticipation earns its keep on
      // corners; once the finish is engaged the CAR is the subject.
      const wAim = Math.min(1, wFinish / RUN_CAMERA.FINISH_LEAD_TAPER);
      this.vB.set(this.carPoint.x - eye.x, this.carPoint.y - eye.y, this.carPoint.z - eye.z);
      if (this.vB.lengthSq() > 1e-12) {
        this.vB.normalize().lerp(this.vC.normalize(), 1 - wAim);
        if (this.vB.lengthSq() > 1e-12) this.vC.copy(this.vB).normalize();
      }
    }
    this.vC.normalize();
    const dCar = this.carPoint.distanceTo(eye);
    const w = THREE.MathUtils.clamp(
      (RUN_CAMERA.AIM_CAR_BLEND - dCar) / RUN_CAMERA.AIM_CAR_BLEND,
      0,
      1,
    );
    if (w > 0) {
      this.vB.set(this.carPoint.x - eye.x, this.carPoint.y - eye.y, this.carPoint.z - eye.z);
      if (this.vB.lengthSq() > 1e-12) {
        this.vB.normalize().lerp(this.vC, 1 - w);
        if (this.vB.lengthSq() > 1e-12) this.vC.copy(this.vB).normalize();
      }
    }
    this.vC.negate(); // cameras look down -z
    this.vB.copy(this.source.frameAt(leadS).up).normalize();
    if (Math.abs(this.vB.dot(this.vC)) > 0.999) this.vB.set(0, 1, 0);
    this.vA.crossVectors(this.vB, this.vC).normalize();
    this.vB.crossVectors(this.vC, this.vA).normalize();
    this.m.makeBasis(this.vA, this.vB, this.vC);
    this.targetQuat.setFromRotationMatrix(this.m);
  }

  /** Hard floor on the CURRENT lift: if the eye at its present lift sits
   *  inside a solid, raise it above that box's top (iterated). Closes the
   *  seam where the from-zero requirement reads a cleared path but the
   *  carried-over filtered lift puts the final eye INSIDE a box (measured:
   *  one L04 step at the tap's lower bbox face). Pure geometry. */
  private ensureClearance(): void {
    const m = RUN_CAMERA.CLEAR_MARGIN;
    for (let iter = 0; iter < RUN_CAMERA.LIFT_ITERS; iter++) {
      let need = this.lift;
      for (const b of this.solids) {
        if (inside(this.eyeBase.x, this.eyeBase.y + this.lift, this.eyeBase.z, b, m)) {
          need = Math.max(need, b.max[1] + m - this.eyeBase.y);
        }
      }
      if (need <= this.lift + 1e-9) break;
      this.lift = need;
    }
  }

  /** The lift (world m above the rail-plane eye) that keeps both the eye
   *  point and the eye→car sightline `CLEAR_MARGIN` clear of every solid,
   *  floored by the launch dolly-up (`LAUNCH_PEEP`). Pure function of the
   *  current eye base and car point — iteration handles a taller box
   *  revealed once the eye rises past a shorter one; the caller uses it
   *  BOTH as the filtered target and as the hard, unfiltered floor. */
  private requiredLift(): number {
    const dCar = this.carPoint.distanceTo(this.eyeBase);
    let lift = RUN_CAMERA.LAUNCH_PEEP * Math.max(0, Math.min(1, 1 - dCar / RUN_CAMERA.TRAIL));
    if (this.solids.length === 0) return lift;
    const m = RUN_CAMERA.CLEAR_MARGIN;
    for (let iter = 0; iter < RUN_CAMERA.LIFT_ITERS; iter++) {
      let need = lift;
      for (const b of this.solids) {
        const top = b.max[1] + m - this.eyeBase.y;
        if (inside(this.eyeBase.x, this.eyeBase.y + lift, this.eyeBase.z, b, m)) {
          need = Math.max(need, top);
          continue;
        }
        // Sightline rule — skipped when the CAR is inside the box (the L04
        // tap straddles the sink lane the deck runs under: no lift clears
        // a segment that ENDS in the box, and lifting would only crane the
        // car out of its own frame). Eye-intersection remains unconditional.
        if (inside(this.carPoint.x, this.carPoint.y, this.carPoint.z, b, m)) continue;
        if (segmentHitsBox(this.eyeBase, lift, this.carPoint, b, m)) {
          // clear the sightline by getting above the box's top (an arc
          // over, never a lateral dodge the fixed-up basis cannot make)
          need = Math.max(need, top);
        }
      }
      if (need <= lift + 1e-9) break;
      lift = need;
    }
    return Math.max(0, lift);
  }
}

const UP = new THREE.Vector3(0, 1, 0);

function inside(x: number, y: number, z: number, b: RunCameraSolid, m: number): boolean {
  return x > b.min[0] - m && x < b.max[0] + m &&
    y > b.min[1] - m && y < b.max[1] + m &&
    z > b.min[2] - m && z < b.max[2] + m;
}

/** Axis-aligned slab test on the lifted-eye→car segment (the box inflated
 *  by `m` — the same clearance volume `inside` uses). */
function segmentHitsBox(
  eyeBase: THREE.Vector3,
  lift: number,
  car: THREE.Vector3,
  box: RunCameraSolid,
  m: number,
): boolean {
  const a: readonly [number, number, number] = [eyeBase.x, eyeBase.y + lift, eyeBase.z];
  const b: readonly [number, number, number] = [car.x, car.y, car.z];
  const lo = [box.min[0] - m, box.min[1] - m, box.min[2] - m];
  const hi = [box.max[0] + m, box.max[1] + m, box.max[2] + m];
  let t0 = 0;
  let t1 = 1;
  for (let i = 0; i < 3; i++) {
    const d = b[i]! - a[i]!;
    if (Math.abs(d) < 1e-12) {
      if (a[i]! < lo[i]! || a[i]! > hi[i]!) return false;
      continue;
    }
    let tA = (lo[i]! - a[i]!) / d;
    let tB = (hi[i]! - a[i]!) / d;
    if (tA > tB) [tA, tB] = [tB, tA];
    t0 = Math.max(t0, tA);
    t1 = Math.min(t1, tB);
    if (t0 > t1) return false;
  }
  return true;
}
