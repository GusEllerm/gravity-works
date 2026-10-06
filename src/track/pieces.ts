/**
 * The piece kit: the 13 `PieceDef`s of docs/vault/Concepts/Track Kit.md.
 *
 * A piece is *only* a centreline (segments of constant turn rate, see
 * `TrackSpline`) plus a banking curve, expressed in **piece-local space**: the
 * spline starts at the origin heading +x with up +y. Sockets come from the
 * spline endpoints, mesh and colliders from the same samples, and a placed
 * piece is that local geometry under a `Mat4` (`src/track/build.ts`).
 *
 * Sizes are world metres at 1:64 toy scale, chosen to sit with the stage-1
 * physics rig (a car ~76 mm long, deck half-width from `cross-section.ts`).
 *
 * Sockets are designed so every piece starts and ends **flat and unbanked**
 * (banking is always 0 at t = 0 and t = 1), including the launch pieces: a
 * `gapLip` rises to its launch angle and its empty exit arc flattens the
 * tangent back to level, so the socket after a lip is still level and any piece
 * can be seated on it.
 */
import * as THREE from 'three';
import { U_CHANNEL } from './cross-section.ts';
import { TrackSpline, type SegmentSpec } from './spline.ts';
import { splineSockets, type Socket } from './socket.ts';

const D2R = Math.PI / 180;

// ---- segment sugar ---------------------------------------------------------

/** A flat straight run (zero turn rate). */
export function straight(length: number): SegmentSpec {
  return { length };
}

/**
 * An arc that turns the tangent from `fromDeg` to `toDeg` (pitch, +=climbing)
 * over `length` metres of arc — i.e. a constant pitch rate. Both blends and
 * full circles are the same primitive: `pitchArc(2 * PI * r, 0, 360)` is a loop.
 */
export function pitchArc(length: number, fromDeg: number, toDeg: number): SegmentSpec {
  return { length, pitchRate: ((toDeg - fromDeg) * D2R) / length };
}

/** An arc that yaws the tangent from `fromDeg` to `toDeg` (+=turning right). */
export function yawArc(length: number, fromDeg: number, toDeg: number): SegmentSpec {
  return { length, yawRate: ((toDeg - fromDeg) * D2R) / length };
}

/** Mark a segment as empty space: no mesh, no collider, the car flies. */
export function empty(seg: SegmentSpec): SegmentSpec {
  return { ...seg, solid: false };
}

/** A yaw arc with the banking curve ramped in over the first third, out the last. */
function bankedTurn(length: number, angleDeg: number, bankDeg: number): SegmentSpec[] {
  const third = length / 3;
  const b = bankDeg * D2R;
  return [
    { ...yawArc(third, 0, angleDeg / 3), bankFrom: 0, bankTo: b },
    { ...yawArc(third, angleDeg / 3, (2 * angleDeg) / 3), bankFrom: b, bankTo: b },
    { ...yawArc(third, (2 * angleDeg) / 3, angleDeg), bankFrom: b, bankTo: 0 },
  ];
}

// ---- impulse hook ----------------------------------------------------------

/** The narrow body interface launchers need (satisfied by `RAPIER.RigidBody`). */
export interface ImpulseBody {
  mass(): number;
  linvel(): { x: number; y: number; z: number };
  applyImpulse(impulse: { x: number; y: number; z: number }, wakeUp: boolean): void;
}

/**
 * The stub other systems call when a car leaves a spring launcher or hits a
 * booster: `power` is a **velocity increment** applied along `dir` (default:
 * the body's current velocity, falling back to its local +x). Expressing power
 * as a Δv rather than a Newton-second keeps kit code scale-blind — mass and
 * velocity are read from the body it is applied to. A world-space Δv becomes
 * a sim-space one by multiplying by `SIM_SCALE` (velocity scales at S, since
 * the sim runs gravity at S*g with time unchanged — see `src/physics/sim.ts`).
 */
export function applyImpulse(body: ImpulseBody, power: number, dir?: { x: number; y: number; z: number }): void {
  let d: { x: number; y: number; z: number } = dir ?? { x: 0, y: 0, z: 0 };
  if (!dir) {
    const v = body.linvel();
    const speed = Math.hypot(v.x, v.y, v.z);
    d = speed > 1e-6 ? { x: v.x / speed, y: v.y / speed, z: v.z / speed } : { x: 1, y: 0, z: 0 };
  }
  const j = body.mass() * power;
  body.applyImpulse({ x: d.x * j, y: d.y * j, z: d.z * j }, true);
}

/** A finish cup's capture volume: a sphere a car must enter to count as home. */
export interface CaptureVolume {
  center: { x: number; y: number; z: number };
  radius: number;
}

// ---- parameters ------------------------------------------------------------

export type PieceKind =
  | 'straight'
  | 'curve'
  | 'bigCurve'
  | 'sbend'
  | 'bank'
  | 'loop'
  | 'drop'
  | 'ramp'
  | 'gapLip'
  | 'landing'
  | 'booster'
  | 'springLauncher'
  | 'finishCup';

/** Every parameter the kit uses. Piece defaults pick the subset they read. */
export interface PieceParams {
  length?: number;
  /** Turning radius for yaw pieces, catch radius for `drop`. */
  radius?: number;
  /** Sweep or slope angle, degrees. */
  angle?: number;
  /** Flat run between two blends (ramp / landing), metres. */
  level?: number;
  /** Length of a pitch blend arc, metres. */
  blend?: number;
  /** Banking angle, degrees. */
  bank?: number;
  /** Vertical drop of the `drop` piece, metres. */
  height?: number;
  /** Straight run before a piece's feature, metres. */
  lead?: number;
  /** Booster / spring-plunger velocity increment, m/s world. */
  power?: number;
  /** Finish cup radius, metres. */
  cupRadius?: number;
  /** How far a loop's exit deck sits below its entry deck, metres. */
  exitLift?: number;
}

const DEFAULTS: Record<PieceKind, PieceParams> = {
  straight: { length: 0.3 },
  curve: { radius: 0.25, angle: 90 },
  bigCurve: { radius: 0.5, angle: 90 },
  sbend: { radius: 0.2, angle: 45 },
  bank: { radius: 0.35, angle: 90, bank: 25 },
  loop: { radius: 0.08, lead: 0.05 },
  drop: { height: 0.25, angle: 40, radius: 0.1, lead: 0.05 },
  ramp: { level: 0.22, angle: 12, blend: 0.08 },
  gapLip: { length: 0.1, angle: 8, blend: 0.05 },
  landing: { level: 0.26, angle: 8, blend: 0.08 },
  booster: { length: 0.2, power: 0.9 },
  springLauncher: { length: 0.12, power: 2.4 },
  finishCup: { length: 0.12, cupRadius: 0.045 },
};

/** The shipped defaults for a piece kind (a copy; safe to spread over). */
export function defaultParams(kind: PieceKind): PieceParams {
  return { ...DEFAULTS[kind] };
}

/** Defaults merged with a caller's overrides. */
export function resolveParams(kind: PieceKind, params: PieceParams = {}): PieceParams {
  const base = DEFAULTS[kind];
  if (!base) throw new Error(`unknown piece kind: ${String(kind)}`);
  return { ...base, ...params };
}

/**
 * The authored segments of a piece with resolved params. Public so tests and
 * tooling can rebuild a piece's centreline through `new TrackSpline(...)` —
 * the invariant-1 probe needs that route.
 */
export function pieceSegments(kind: PieceKind, params: PieceParams = {}): SegmentSpec[] {
  return segmentsFor(kind, resolveParams(kind, params));
}

// ---- loop geometry, shared with the gate's arc marks -----------------------

/**
 * How far a loop's exit deck sits below its entry deck, metres.
 *
 * This number IS the loop's trap fix, and it is not free to choose: it must
 * exceed the height of the car's own envelope above the deck (chassis centre
 * ride height plus half its height: 0.04 + 0.01 sim-metres = 5 cm) plus a
 * margin, because the descending leg passes UNDER the rising chords it enters
 * on and the exiting car must be clear of them. Measured at R = 0.10: a lift of
 * 3 cm still let a car with sub-lap energy climb back over those chords and
 * orbit; 5 cm exits cleanly at every release height tried, and 4.6 cm was the
 * computed edge. Smaller than the envelope and the loop is a cage.
 */
export const LOOP_EXIT_LIFT = 0.05;

/**
 * A loop ring's arc-length bookkeeping. The gate's arc marks (apex, exit) and
 * the audit tools all read this, so the ring's shape is defined in one place.
 *
 * The ring is NOT a circle, and the reason is geometric. A tangent circle
 * returns the car to its own entry point, so after the lap it is sitting on
 * the rising chords it climbed on the way in (11 degrees and 4 mm at the join,
 * and a raycast wheel skips the staircase step and re-attaches a chord or two
 * higher). A car with less than lap energy therefore cannot get out: the
 * stage-2 loop audit measured it orbiting the bottom corner, five or six laps,
 * apex witnesses green every time and `done` never. Opening the descent by half
 * the lift makes the ring meet the deck plane twice — the entry, and the exit
 * below it — so the car always has a deck to run out onto. See LOOP_EXIT_LIFT.
 */
export function loopGeometry(radius: number, exitLift = LOOP_EXIT_LIFT, lead = 0.03) {
  // The ascent is the ring the gate is about; the descent is forced open by
  // exactly the lift, because a half-circle of radius r changes height by 2r.
  const rAscent = radius;
  const rDescent = radius + exitLift / 2;
  const ascent = Math.PI * rAscent; // pitch 0 -> 180, up by 2R
  const descent = Math.PI * rDescent; // pitch 180 -> 360, down by 2(R + lift/2)
  return {
    rAscent,
    rDescent,
    lead,
    ascent,
    descent,
    /** arc length from the piece's start to pitch = 180 (the apex witness) */
    apexAt: lead + ascent,
    /** arc length of the ring itself, entry chord to exit chord */
    ringLength: ascent + descent,
    /** the whole piece including both leads */
    pieceLength: 2 * lead + ascent + descent,
    /** the out socket sits this far BELOW the in socket */
    drop: exitLift,
  };
}

// ---- the pieces ------------------------------------------------------------

/** The ballistic-ish empty span of the `drop` piece (geometry-free space). */
function dropGap(height: number, angleDeg: number, catchRadius: number): SegmentSpec[] {
  const a = angleDeg * D2R;
  const slope = Math.max(0.01, (height - 2 * catchRadius * (1 - Math.cos(a))) / Math.sin(a));
  const arc = catchRadius * a;
  return [
    empty(pitchArc(arc, 0, -angleDeg)),
    empty(straight(slope)),
    empty(pitchArc(arc, -angleDeg, 0)),
  ];
}

function segmentsFor(kind: PieceKind, p: PieceParams): SegmentSpec[] {
  switch (kind) {
    case 'straight':
      return [straight(p.length!)];
    case 'curve':
    case 'bigCurve':
      return [yawArc(p.radius! * Math.abs(p.angle! * D2R), 0, p.angle!)];
    case 'sbend': {
      const arc = p.radius! * p.angle! * D2R;
      return [yawArc(arc, 0, p.angle!), yawArc(arc, p.angle!, 0)];
    }
    case 'bank':
      return bankedTurn(p.radius! * p.angle! * D2R, p.angle!, p.bank!);
    case 'loop': {
      const g = loopGeometry(p.radius ?? 0.1, p.exitLift ?? LOOP_EXIT_LIFT, p.lead ?? 0.03);
      return [
        straight(g.lead),
        // pitch 0 -> 180 at radius R: the front of the ring and its apex
        pitchArc(g.ascent, 0, 180),
        // pitch 180 -> 360 at R + lift/2: the back, opening onto its own
        // exit deck BELOW the entry deck, which is what makes the piece
        // escapable (see loopGeometry)
        pitchArc(g.descent, 180, 360),
        straight(g.lead),
      ];
    }
    case 'drop':
      return [
        straight(p.lead!),
        ...dropGap(p.height!, p.angle!, p.radius!),
        straight(p.lead!),
      ];
    case 'ramp':
      return [
        pitchArc(p.blend!, 0, p.angle!),
        straight(p.level!),
        pitchArc(p.blend!, p.angle!, 0),
      ];
    case 'landing':
      return [
        pitchArc(p.blend!, 0, -p.angle!),
        straight(p.level!),
        pitchArc(p.blend!, -p.angle!, 0),
      ];
    case 'gapLip': {
      // rise to the launch angle, then the launch itself: the arc after the lip
      // is the first part of a ballistic climb and stays empty, flattening the
      // tangent back to level by the exit socket so the next piece still seats.
      return [straight(0.02), pitchArc(p.blend!, 0, p.angle!), empty(pitchArc(p.length!, p.angle!, 0))];
    }
    case 'booster':
    case 'springLauncher':
    case 'finishCup':
      return [straight(p.length!)];
    default:
      throw new Error(`unknown piece kind: ${String(kind)}`);
  }
}

/** Extra (non-swept) local geometry a piece needs: housings, springs, cups. */
function extrasFor(kind: PieceKind, p: PieceParams): THREE.BufferGeometry[] {
  const out: THREE.BufferGeometry[] = [];
  if (kind === 'booster') {
    // a booster housing under the deck with two guide fins: the pad the car
    // drives over is the deck itself, so nothing obstructs the running surface.
    const box = new THREE.BoxGeometry(p.length! * 0.8, 0.012, 0.078);
    box.translate(0, -0.012, 0);
    out.push(box);
    for (const z of [-0.036, 0.036]) {
      const fin = new THREE.BoxGeometry(p.length! * 0.5, 0.006, 0.006);
      fin.translate(p.length! * 0.15, 0.003, z);
      out.push(fin);
    }
  } else if (kind === 'springLauncher') {
    const body = new THREE.BoxGeometry(p.length! * 1.1, 0.016, 0.07);
    body.translate(-p.length! * 0.15, -0.014, 0);
    out.push(body);
    const plunger = new THREE.CylinderGeometry(0.012, 0.012, 0.03, 14);
    plunger.rotateZ(Math.PI / 2);
    plunger.translate(p.length! * 0.35, -0.008, 0);
    out.push(plunger);
  } else if (kind === 'finishCup') {
    const r = p.cupRadius!;
    const pts: THREE.Vector2[] = [];
    const steps = 8;
    for (let i = 0; i <= steps; i++) {
      const a = (i / steps) * (Math.PI / 2);
      pts.push(new THREE.Vector2(Math.max(0.0008, r * Math.sin(a)), -r * 0.62 * Math.cos(a)));
    }
    const bowl = new THREE.LatheGeometry(pts, 26);
    bowl.translate(p.length!, 0, 0);
    out.push(bowl);
  }
  return out;
}

/** The capture volume of a `finishCup`, in piece-local space. */
export function captureVolume(params: PieceParams = {}): CaptureVolume {
  const p = resolveParams('finishCup', params);
  return {
    center: { x: p.length!, y: -p.cupRadius! * 0.31, z: 0 },
    radius: p.cupRadius! * 0.8,
  };
}

// ---- the definitions -------------------------------------------------------

export interface PieceDef {
  kind: PieceKind;
  /** Defaults for this kind (what `resolveParams` starts from). */
  params: PieceParams;
  /** Centreline in piece-local space. */
  spline(params?: PieceParams): TrackSpline;
  /** [in, out] endpoints of that centreline. */
  sockets(params?: PieceParams): [Socket, Socket];
  /** Local geometry that is not a sweep of the channel (housings, cups). */
  extraGeometries(params?: PieceParams): THREE.BufferGeometry[];
  /** Launchers only: the velocity increment this piece carries. */
  power?: number;
  /** Launchers only: the hook other systems call when a car leaves the piece. */
  applyImpulse?(body: ImpulseBody, power: number, dir?: { x: number; y: number; z: number }): void;
  /** `finishCup` only. */
  captureVolume?(params?: PieceParams): CaptureVolume;
}

function define(kind: PieceKind, extra: Partial<PieceDef> = {}): PieceDef {
  return {
    kind,
    params: DEFAULTS[kind],
    spline: (params: PieceParams = {}) => new TrackSpline(segmentsFor(kind, resolveParams(kind, params))),
    sockets: (params: PieceParams = {}) =>
      splineSockets(new TrackSpline(segmentsFor(kind, resolveParams(kind, params)))),
    extraGeometries: (params: PieceParams = {}) => extrasFor(kind, resolveParams(kind, params)),
    ...extra,
  };
}

export const PIECES: Record<PieceKind, PieceDef> = {
  straight: define('straight'),
  curve: define('curve'),
  bigCurve: define('bigCurve'),
  sbend: define('sbend'),
  bank: define('bank'),
  loop: define('loop'),
  drop: define('drop'),
  ramp: define('ramp'),
  gapLip: define('gapLip'),
  landing: define('landing'),
  booster: define('booster', { power: DEFAULTS.booster.power!, applyImpulse }),
  springLauncher: define('springLauncher', { power: DEFAULTS.springLauncher.power!, applyImpulse }),
  finishCup: define('finishCup', { captureVolume }),
};

/** The 13 kinds in kit order (the display build and the tests walk this). */
export const PIECE_KINDS: readonly PieceKind[] = [
  'straight',
  'curve',
  'bigCurve',
  'sbend',
  'bank',
  'loop',
  'drop',
  'ramp',
  'gapLip',
  'landing',
  'booster',
  'springLauncher',
  'finishCup',
];

/** The PLAYER word for each kind (playtest M: "raw codenames in the toolbar"
 * — gapLip, sbend, bigCurve). Every piece word spoken to a player — tray
 * button, aria-label, tray legend, Help title, target line — reads this map;
 * the codenames stay as ids: registry keys, `data-kind` test hooks, saves.
 * One word or two, never a sentence: these strings live on a button. */
export const PIECE_LABELS: Record<PieceKind, string> = {
  straight: 'Straight',
  curve: 'Curve',
  bigCurve: 'Wide curve',
  sbend: 'S-bend',
  bank: 'Banked turn',
  loop: 'Loop',
  drop: 'Drop',
  ramp: 'Ramp',
  gapLip: 'Lip',
  landing: 'Landing',
  booster: 'Booster',
  springLauncher: 'Spring',
  finishCup: 'Cup',
};

/** The display word for a kind (the catalog's, never the codename). */
export function pieceLabel(kind: PieceKind): string {
  return PIECE_LABELS[kind];
}

/** Centreline of a kind with resolved params. */
export function pieceSpline(kind: PieceKind, params: PieceParams = {}): TrackSpline {
  return PIECES[kind].spline(params);
}

/** Swept channel + extras for a piece, all in piece-local space. */
export function pieceGeometries(
  kind: PieceKind,
  params: PieceParams = {},
  options: { profile?: typeof U_CHANNEL; scale?: number } = {},
): THREE.BufferGeometry[] {
  return [
    pieceSpline(kind, params).toMesh(options),
    ...PIECES[kind].extraGeometries(params),
  ];
}
