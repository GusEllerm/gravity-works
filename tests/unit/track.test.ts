/**
 * Track Kit contract tests — the four invariants of
 * docs/vault/Concepts/Track Kit.md, plus the piece kit's own promises.
 *
 * Headless and deterministic: three.js math only, no GPU, no wall clock.
 * The collider-physics comparison lives in `track-rolling.test.ts`.
 */
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
  DECK_HALF_WIDTH,
  RAIL_HEIGHT,
  RAIL_WHEEL_HEIGHT,
  TRACK_HALF_WIDTH,
  U_CHANNEL,
  ringPoint,
} from '../../src/track/cross-section.ts';
import { TrackSpline, type SegmentSpec, type TrackFrame } from '../../src/track/spline.ts';
import {
  PIECES,
  PIECE_KINDS,
  applyImpulse,
  captureVolume,
  pieceGeometries,
  pieceSegments,
  pieceSpline,
  type ImpulseBody,
  type PieceKind,
  loopGeometry, LOOP_EXIT_LIFT,
} from '../../src/track/pieces.ts';
import { fitSocket, snapSocket, canonicalBuild, SNAP_ANGLE_TOL, SNAP_ROLL_TOL, SNAP_TRANSLATION_TOL } from '../../src/track/snap.ts';
import { rollAngle, splineSockets, tangentAngle, transformSocket } from '../../src/track/socket.ts';
import { chain, deserialize, reify, rigFingerprint, serialize, type PlacedPiece } from '../../src/track/build.ts';

const TESS_EPSILON = 1e-9; // the arcs are analytic, so "tessellation epsilon" is exact arithmetic

/** A spline that records every sample() it is asked for (invariant 1 probe). */
class RecordingSpline extends TrackSpline {
  readonly seen: { t: number; pos: number[]; tangent: number[]; up: number[] }[] = [];

  constructor(segments: readonly SegmentSpec[]) {
    super(segments);
  }

  override sample(t: number, out?: TrackFrame): TrackFrame {
    const frame = super.sample(t, out);
    this.seen.push({
      t,
      pos: [frame.pos.x, frame.pos.y, frame.pos.z],
      tangent: [frame.tangent.x, frame.tangent.y, frame.tangent.z],
      up: [frame.up.x, frame.up.y, frame.up.z],
    });
    return frame;
  }
}

/** A stand-in Rapier namespace: records the hull vertex sets it is handed. */
function recordingRapier(hulls: Float32Array[]) {
  return {
    ColliderDesc: {
      convexHull(vertices: Float32Array) {
        hulls.push(vertices);
        return { setFriction: () => recordingDesc, setRestitution: () => recordingDesc };
      },
    },
  };
}
const recordingDesc = {};

describe('invariant 1 — mesh and colliders consume the identical sample set', () => {
  const rig: readonly PieceKind[] = ['straight', 'curve', 'sbend', 'bank', 'loop', 'ramp', 'drop'];

  it('toMesh and toColliderDescs ask for the same samples, in the same order', () => {
    for (const kind of rig) {
      const spline = new RecordingSpline(pieceSegments(kind));
      spline.toMesh();
      const meshSeen = spline.seen.map((s) => s.t);
      spline.seen.length = 0;
      spline.toColliderDescs(recordingRapier([]) as never);
      const colliderSeen = spline.seen.map((s) => s.t);

      expect(colliderSeen.length, kind).toBeGreaterThan(1);
      expect(colliderSeen, kind).toEqual(meshSeen);
      expect(meshSeen, kind).toEqual(spline.stationTs());
    }
  });

  it('the frames behind the mesh rings are the frames behind the collider hulls', () => {
    for (const kind of rig) {
      const spline = new RecordingSpline(pieceSegments(kind));
      spline.toMesh();
      const meshFrames = spline.seen.map((s) => [...s.pos, ...s.tangent, ...s.up]);
      spline.seen.length = 0;
      const hulls: Float32Array[] = [];
      spline.toColliderDescs(recordingRapier(hulls) as never);
      const colliderFrames = spline.seen.map((s) => [...s.pos, ...s.tangent, ...s.up]);
      expect(colliderFrames, kind).toEqual(meshFrames);

      // and the hull vertices really are the swept section points of those frames
      const frames = spline.stationFrames();
      const corner = ringPoint(U_CHANNEL, 0, 0, frames[0]!);
      const firstHull = hulls[0]!;
      const found = Array.from({ length: firstHull.length / 3 }, (_, i) =>
        Math.hypot(
          corner.x - firstHull[i * 3]!,
          corner.y - firstHull[i * 3 + 1]!,
          corner.z - firstHull[i * 3 + 2]!,
        ),
      );
      expect(Math.min(...found), kind).toBeLessThan(1e-9);
    }
  });

  it('a straight piece merges its deck into a handful of large quads, not a seam per station', () => {
    const spline = pieceSpline('straight', { length: 0.5 });
    const hulls: Float32Array[] = [];
    const descs = spline.toColliderDescs(recordingRapier(hulls) as never);
    // 5 convex parts x a couple of merged runs, never 5 x 10 stations
    expect(descs.length).toBeLessThanOrEqual(15);
    expect(spline.stations).toBeGreaterThanOrEqual(10);
  });
});

describe('invariant 2 — the loop piece: front circle, dropped exit, no trap', () => {
  const r = 0.08;
  const spline = pieceSpline('loop', { radius: r, lead: 0.05 });
  const centre = new THREE.Vector3(0.05, r, 0); // bottom tangent at the origin, curving up

  // Used to read "the loop piece IS the analytic circle", and the piece was
  // one pitchArc over a full 2*pi*r. That invariant is now FALSE by design, and
  // the reason is in pieces.ts loopGeometry: a tangent circle hands the car
  // back its own rising entry chords, so a car with less than lap energy
  // cannot get out (measured in the stage-2 loop audit: it orbited the bottom
  // corner for five or six laps with the apex witnesses green every time).
  // The ring is therefore two half-circles whose radii differ by half the exit
  // lift. What MUST hold is what the old invariant was really protecting:
  // tangent-continuous joins, an apex at eye level, and no self-overlap.
  it('the front half is the analytic circle of radius r within tessellation epsilon', () => {
    const lead = 0.05;
    let maxErr = 0;
    for (let i = 0; i <= 200; i++) {
      const s = lead + (i / 200) * (Math.PI * r);
      maxErr = Math.max(maxErr, Math.abs(spline.sample(s / spline.length).pos.distanceTo(centre) - r));
    }
    expect(maxErr).toBeLessThan(TESS_EPSILON);
  });

  it('the back half is an arc of radius r + lift/2, so the exit sits lift below the entry', () => {
    const lead = 0.05;
    const g = loopGeometry(r, LOOP_EXIT_LIFT, lead);
    expect(g.rDescent).toBeCloseTo(r + LOOP_EXIT_LIFT / 2, 12);
    // Radius stated through curvature rather than through a centre I would
    // have to derive by hand: the circumscribed circle of three close samples
    // of the back half. What this protects is that the descent is a CIRCLE of
    // the stated radius (tangent-continuous with the ascent at the apex), not
    // a spiral or a straightened cheat.
    const s0 = lead + g.ascent + g.descent * 0.4;
    const h = g.descent * 0.02;
    const [a, b, c] = [s0 - h, s0, s0 + h].map((s) => spline.sample(s / spline.length).pos);
    const area = Math.abs((b.x - a.x) * (c.y - a.y) - (c.x - a.x) * (b.y - a.y)) / 2;
    const circum =
      (a.distanceTo(b) * b.distanceTo(c) * c.distanceTo(a)) / (4 * area);
    expect(circum).toBeCloseTo(g.rDescent, 4);
    // and the piece hands the car an exit deck that is level, forward, and
    // LOOP_EXIT_LIFT below where it went in
    const exit = spline.sample(1).pos;
    expect(exit.y).toBeCloseTo(-LOOP_EXIT_LIFT, 6);
  });

  it('a loop of any radius keeps its apex and stays upright (banking 0, up inverted at the apex)', () => {
    for (const radius of [0.05, 0.08, 0.12]) {
      const s = pieceSpline('loop', { radius, lead: 0.04 });
      const apexT = (0.04 + Math.PI * radius) / s.length;
      const apex = s.sample(apexT);
      expect(apex.banking).toBe(0);
      expect(apex.pos.y).toBeCloseTo(2 * radius, 9);
      expect(apex.up.y).toBeCloseTo(-1, 9); // parallel transport, not a corkscrew
      expect(apex.tangent.x).toBeCloseTo(-1, 9);
    }
  });

  it('entry and exit are tangential and level; the exit deck is BELOW the entry, so nothing traps', () => {
    const [inSocket, outSocket] = PIECES.loop.sockets({ radius: r, lead: 0.05 });
    expect(inSocket.pos.y).toBeCloseTo(0, 12);
    expect(outSocket.tangent.x).toBeCloseTo(1, 12);
    expect(inSocket.tangent.x).toBeCloseTo(1, 12);
    // The old version of this test asserted the exit was level with the entry.
    // Levelness in AND out is exactly the trap: it forces the ring to meet its
    // own deck plane at ONE point, so the car returns onto the chords it
    // climbed. The exit is now LOOP_EXIT_LIFT below the entry, which is also
    // what a real toy loop does (it comes out under its own entry ramp).
    expect(outSocket.pos.y).toBeCloseTo(-LOOP_EXIT_LIFT, 9);
    expect(outSocket.tangent.y).toBeCloseTo(0, 9);
    // ...and the descending branch passes OVER the entry run rather than
    // through it, which is what keeps the two decks from colliding in the
    // solver: at the apex the ring is a full diameter above its own entry.
    const apex = spline.sample((0.05 + Math.PI * r) / spline.length).pos;
    expect(apex.y).toBeGreaterThan(2 * r - 1e-9);
  });
});

describe('invariant 3 — a Build serialises losslessly', () => {
  const build = chain(PIECE_KINDS, { levelId: 'kitchen-1', seed: 12345 });

  it('reify(deserialize(serialize(b))) has the same rig fingerprint as reify(b)', () => {
    const before = rigFingerprint(build);
    const after = rigFingerprint(deserialize(serialize(build)));
    expect(after).toBe(before);
    expect(before).toMatch(/^[0-9a-f]{8}$/);
  });

  it('canonical JSON is byte-identical for equal builds and for reordered input', () => {
    const shuffled: PlacedPiece[] = [...build.pieces].reverse();
    expect(serialize({ ...build, pieces: shuffled })).toBe(serialize(build));
    const keys = Object.keys(JSON.parse(serialize(build)));
    expect(keys).toEqual([...keys].sort());
    const pieceKeys = Object.keys(JSON.parse(serialize(build)).pieces[0]);
    expect(pieceKeys).toEqual([...pieceKeys].sort());
  });

  it('a fingerprint is a real function of the geometry: a different seed-order changes nothing, a different piece does', () => {
    const same = chain(PIECE_KINDS, { levelId: 'kitchen-1', seed: 999 });
    expect(rigFingerprint(same)).toBe(rigFingerprint(build)); // seed is data, not geometry
    const longer = chain([...PIECE_KINDS, 'straight'], { levelId: 'kitchen-1', seed: 12345 });
    expect(rigFingerprint(longer)).not.toBe(rigFingerprint(build));
  });

  it('deserialize rejects malformed payloads instead of half-building', () => {
    expect(() => deserialize('{"levelId":"x","pieces":[],"seed":1.5}')).toThrow(/integer/);
    expect(() => deserialize('{"pieces":[],"seed":1}')).toThrow(/levelId/);
    expect(() => deserialize('{"levelId":"x","pieces":[{"def":"nope","seq":0,"transform":[]}],"seed":1}')).toThrow(/unknown def/);
    expect(() => deserialize('{"levelId":"x","pieces":[{"def":"straight","seq":0,"transform":[1,2,3]}],"seed":1}')).toThrow(/16 numbers/);
  });
});

describe('invariant 4 — snapping is pure and a build is reproducible', () => {
  const straight = PIECES.straight.sockets({ length: 0.2 });

  it('fitSocket returns the transform that seats b on a, exactly', () => {
    const target = { pos: new THREE.Vector3(0.3, 0.1, -0.2), tangent: new THREE.Vector3(0, 0, 1), up: new THREE.Vector3(0, 1, 0) };
    const m = fitSocket(target, straight[1]);
    const moved = transformSocket(straight[1], m);
    expect(moved.pos.distanceTo(target.pos)).toBeLessThan(1e-12);
    expect(moved.tangent.angleTo(target.tangent)).toBeLessThan(1e-12);
    expect(moved.up.angleTo(target.up)).toBeLessThan(1e-12);
  });

  it('snapSocket is pure: same inputs, same output, no mutation', () => {
    const a = { pos: new THREE.Vector3(0.2, 0, 0), tangent: new THREE.Vector3(1, 0, 0), up: new THREE.Vector3(0, 1, 0) };
    const b = { pos: new THREE.Vector3(0.205, 0, 0.002), tangent: new THREE.Vector3(1, 0.01, 0), up: new THREE.Vector3(0, 1, 0) };
    const snapshotA = JSON.stringify(a);
    const snapshotB = JSON.stringify(b);
    const first = snapSocket(a, b)!.elements.slice();
    const second = snapSocket(a, b)!.elements.slice();
    expect(second).toEqual(first);
    expect(JSON.stringify(a)).toBe(snapshotA);
    expect(JSON.stringify(b)).toBe(snapshotB);
  });

  it('tolerance edges: the last step inside snaps, the first step outside does not', () => {
    const at = { pos: new THREE.Vector3(0, 0, 0), tangent: new THREE.Vector3(1, 0, 0), up: new THREE.Vector3(0, 1, 0) };
    const inside = { pos: new THREE.Vector3(SNAP_TRANSLATION_TOL * 0.999, 0, 0), tangent: new THREE.Vector3(1, 0, 0), up: new THREE.Vector3(0, 1, 0) };
    const outside = { pos: new THREE.Vector3(SNAP_TRANSLATION_TOL * 1.001, 0, 0), tangent: new THREE.Vector3(1, 0, 0), up: new THREE.Vector3(0, 1, 0) };
    expect(snapSocket(at, inside)).toBeTruthy();
    expect(snapSocket(at, outside)).toBeNull();

    const tilted = (rad: number) => ({
      pos: new THREE.Vector3(0, 0, 0),
      tangent: new THREE.Vector3(Math.cos(rad), 0, Math.sin(rad)),
      up: new THREE.Vector3(0, 1, 0),
    });
    expect(snapSocket(at, tilted(SNAP_ANGLE_TOL * 0.5))).toBeTruthy();
    expect(snapSocket(at, tilted(SNAP_ANGLE_TOL * 2))).toBeNull();

    const rolled = (rad: number) => ({
      pos: new THREE.Vector3(0, 0, 0),
      tangent: new THREE.Vector3(1, 0, 0),
      up: new THREE.Vector3(0, Math.cos(rad), Math.sin(rad)),
    });
    expect(snapSocket(at, rolled(SNAP_ROLL_TOL * 0.5))).toBeTruthy();
    expect(snapSocket(at, rolled(SNAP_ROLL_TOL * 2))).toBeNull();
    // a roll-only mismatch is measured as a roll, not as an angle
    expect(rollAngle(at, rolled(SNAP_ROLL_TOL * 2))).toBeGreaterThan(SNAP_ROLL_TOL);
    expect(tangentAngle(at, rolled(SNAP_ROLL_TOL * 2))).toBeLessThan(1e-9);
  });

  it('fitSocket ignores tolerance entirely, which is why snapping is the gate', () => {
    const target = { pos: new THREE.Vector3(1, 0.5, -1), tangent: new THREE.Vector3(0, 1, 0), up: new THREE.Vector3(0, 0, -1) };
    expect(snapSocket(target, straight[0])).toBeNull(); // far away: not a snap
    const m = fitSocket(target, straight[0]); // but placement still works
    const moved = transformSocket(straight[0], m);
    expect(moved.pos.distanceTo(target.pos)).toBeLessThan(1e-12);
    expect(moved.tangent.angleTo(target.tangent)).toBeLessThan(1e-12);
  });

  it('canonicalBuild orders by seq and never mutates the caller’s array', () => {
    const pieces = chain(['straight', 'curve', 'loop'], { levelId: 'x', seed: 1 }).pieces;
    const input = [...pieces];
    const scrambled = [pieces[2]!, pieces[0]!, pieces[1]!];
    expect(canonicalBuild(scrambled).map((p) => p.seq)).toEqual([0, 1, 2]);
    expect(input.map((p) => p.seq)).toEqual([0, 1, 2]);
    expect(canonicalBuild(scrambled)).not.toBe(input);
    // equal seq values keep their relative order (stable)
    const tie = [{ ...pieces[0]!, seq: 1 }, { ...pieces[1]!, seq: 1 }, { ...pieces[2]!, seq: 0 }];
    expect(canonicalBuild(tie).map((p) => p.def)).toEqual(['loop', 'straight', 'curve']);
  });

  it('a chained build reifies reproducibly from data alone', () => {
    const kinds: PieceKind[] = ['springLauncher', 'straight', 'loop', 'finishCup'];
    const a = rigFingerprint(chain(kinds, { levelId: 'l', seed: 3 }));
    const b = rigFingerprint(chain(kinds, { levelId: 'l', seed: 3 }));
    expect(b).toBe(a);
  });

  it('reify hands back canonical-order splines whose joints are exactly seated', () => {
    const build = chain(['straight', 'curve', 'loop', 'gapLip', 'landing'], { levelId: 'l', seed: 2 });
    const { splines, pieces } = reify(build);
    expect(pieces.map((p) => p.seq)).toEqual([0, 1, 2, 3, 4]);
    const outLocal = PIECES.straight.sockets()[1];
    const outWorld = transformSocket(outLocal, build.pieces[0]!.transform);
    expect(splines[0]!.sample(1).pos.distanceTo(outWorld.pos)).toBeLessThan(1e-12);
    for (let i = 1; i < splines.length; i++) {
      const gap = splines[i]!.sample(0).pos.distanceTo(splines[i - 1]!.sample(1).pos);
      expect(gap, `joint ${i}`).toBeLessThan(1e-12);
      // and each joint is a legal snap once both sockets are in world space
      const a = { pos: splines[i - 1]!.sample(1).pos, tangent: splines[i - 1]!.sample(1).tangent, up: splines[i - 1]!.sample(1).up };
      const b = { pos: splines[i]!.sample(0).pos, tangent: splines[i]!.sample(0).tangent, up: splines[i]!.sample(0).up };
      expect(snapSocket(a, b), `snap at joint ${i}`).toBeTruthy();
    }
  });
});

describe('the 13 pieces', () => {
  it('all 13 kinds are defined, with defaults and sockets taken from the spline endpoints', () => {
    expect(PIECE_KINDS).toHaveLength(13);
    for (const kind of PIECE_KINDS) {
      const def = PIECES[kind];
      expect(def.kind).toBe(kind);
      const spline = def.spline();
      const [inSocket, outSocket] = def.sockets();
      const [endIn, endOut] = splineSockets(spline);
      expect(inSocket.pos.distanceTo(endIn.pos)).toBeLessThan(1e-12);
      expect(outSocket.pos.distanceTo(endOut.pos)).toBeLessThan(1e-12);
      expect(spline.length).toBeGreaterThan(0.01);
    }
  });

  it('every piece begins and ends flat and unbanked, so sockets mate without a twist', () => {
    for (const kind of PIECE_KINDS) {
      const spline = pieceSpline(kind);
      const inBank = spline.sample(0).banking;
      const outBank = spline.sample(1).banking;
      expect(Math.abs(inBank), kind).toBeLessThan(1e-12);
      expect(Math.abs(outBank), kind).toBeLessThan(1e-12);
      const outTangent = spline.sample(1).tangent;
      // pitch of the exit tangent: flat means no vertical component
      expect(Math.abs(outTangent.y), kind).toBeLessThan(1e-9);
    }
  });

  it('the bank piece is the one that rolls the deck over, and rolls it back to level', () => {
    const spline = pieceSpline('bank');
    const mid = spline.sample(0.5);
    expect(mid.banking).toBeGreaterThan(THREE.MathUtils.degToRad(20));
    expect(Math.abs(spline.sample(0.999).banking)).toBeLessThan(THREE.MathUtils.degToRad(3));
  });

  it('empty spans carry neither mesh nor colliders (drop, gap lip)', () => {
    const drop = pieceSpline('drop');
    const gap = drop.sample(0.5);
    expect(gap.solid).toBe(false);
    const hulls: Float32Array[] = [];
    drop.toColliderDescs(recordingRapier(hulls) as never);
    const [gapStart, gapEnd] = gapSpan(drop);
    // no collider hull may reach across the empty span
    for (const hull of hulls) {
      const xs: number[] = [];
      for (let i = 0; i < hull.length; i += 3) xs.push(hull[i]!);
      const reachesIn = Math.min(...xs) < gapStart - 1e-9 && Math.max(...xs) > gapStart;
      const reachesOut = Math.min(...xs) < gapEnd && Math.max(...xs) > gapEnd + 1e-9;
      expect(reachesIn || reachesOut, 'hull spans the gap').toBe(false);
    }
    const tris = drop.toMesh().getAttribute('position').count / 3;
    const straightTris = pieceSpline('straight', { length: drop.length }).toMesh().getAttribute('position').count / 3;
    expect(tris).toBeLessThan(straightTris);
  });

  it('booster and spring launcher carry a power param and push a body along its velocity', () => {
    const seen: { x: number; y: number; z: number }[] = [];
    const body: ImpulseBody = {
      mass: () => 40,
      linvel: () => ({ x: 0, y: -3, z: 0 }),
      applyImpulse: (impulse) => seen.push(impulse),
    };
    expect(PIECES.booster.power).toBeTypeOf('number');
    expect(PIECES.springLauncher.power).toBeTypeOf('number');
    expect(PIECES.booster.applyImpulse).toBe(applyImpulse);
    applyImpulse(body, 2);
    expect(seen).toHaveLength(1);
    const j = seen[0]!;
    expect(Math.hypot(j.x, j.y, j.z)).toBeCloseTo(80, 6); // mass * power
    expect(j.y).toBeLessThan(0); // along the velocity, which pointed down
    applyImpulse(body, 1, { x: 1, y: 0, z: 0 });
    expect(seen[1]!.x).toBeCloseTo(40, 6);
  });

  it('the finish cup exposes a capture volume around its bowl', () => {
    const volume = captureVolume({ length: 0.12, cupRadius: 0.05 });
    expect(volume.center.x).toBeCloseTo(0.12, 9);
    expect(volume.radius).toBeGreaterThan(0.03);
    const cup = PIECES.finishCup.captureVolume!();
    expect(cup.radius).toBeGreaterThan(0);
    expect(pieceGeometries('finishCup').length).toBeGreaterThan(1); // sweep + bowl
  });

  it('the camera rail is the same centreline lifted to wheel height', () => {
    const spline = pieceSpline('straight', { length: 0.3 });
    const rail = spline.railPoints(7);
    expect(rail).toHaveLength(7);
    const frames = spline.stationTs().map((t) => spline.sample(t));
    for (const [i, point] of rail.entries()) {
      const t = i / (rail.length - 1);
      const frame = frames[Math.round(t * (frames.length - 1))]!;
      expect(point.distanceTo(frame.pos.clone().addScaledVector(frame.up, RAIL_WHEEL_HEIGHT))).toBeLessThan(1e-9);
    }
  });

  it('the section is one U-channel: deck, two rails, two lips, all inside the kit width', () => {
    expect(U_CHANNEL.parts.map((p) => p.name)).toEqual(['deck', 'rail-left', 'lip-left', 'rail-right', 'lip-right']);
    expect(U_CHANNEL.parts.filter((p) => p.rolling).map((p) => p.name)).toEqual(['deck']);
    const frame = { pos: new THREE.Vector3(), tangent: new THREE.Vector3(1, 0, 0), up: new THREE.Vector3(0, 1, 0) };
    const xs = U_CHANNEL.parts.flatMap((p) => p.polygon.map((_, i) => ringPoint(U_CHANNEL, U_CHANNEL.parts.indexOf(p), i, frame).z));
    expect(Math.max(...xs)).toBeCloseTo(TRACK_HALF_WIDTH, 9);
    expect(Math.min(...xs)).toBeCloseTo(-TRACK_HALF_WIDTH, 9);
    const ys = U_CHANNEL.parts.flatMap((p) => p.polygon.map((_, i) => ringPoint(U_CHANNEL, U_CHANNEL.parts.indexOf(p), i, frame).y));
    expect(Math.max(...ys)).toBeCloseTo(RAIL_HEIGHT, 9);
    expect(DECK_HALF_WIDTH).toBeLessThan(TRACK_HALF_WIDTH);
  });
});

/** World x-range of a spline's empty (gap) span, scanned finely. */
function gapSpan(spline: TrackSpline): [number, number] {
  const steps = 2000;
  let start = Infinity;
  let end = -Infinity;
  for (let i = 0; i <= steps; i++) {
    const f = spline.sample(i / steps);
    if (!f.solid) {
      start = Math.min(start, f.pos.x);
      end = Math.max(end, f.pos.x);
    }
  }
  return [start, end];
}
