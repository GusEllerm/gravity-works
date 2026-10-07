/**
 * Run-camera tests (PROMPT §7.3 numbers, pure-math class). The source is a
 * hand-rolled analytic rail (a line that turns 90° at arc 10) instead of a
 * KitRig — the camera only consumes {railPointAt, frameAt, length}, so this
 * keeps the timing assertions exact and the test fast.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { RunCamera, RUN_CAMERA } from '../../src/camera/run-camera.ts';
import type { RunCameraSolid } from '../../src/camera/run-camera.ts';
import type { RunCameraSource } from '../../src/camera/run-camera.ts';
import { feelTrackRig, loopRig, LOOP_RADIUS } from '../../src/feel/feeltrack.ts';
import { KitRig } from '../../src/feel/kittrack.ts';
import { KITCHEN01 } from '../../src/world/levels/kitchen01.level.ts';
import { KITCHEN02 } from '../../src/world/levels/kitchen02.level.ts';
import { KITCHEN03 } from '../../src/world/levels/kitchen03.level.ts';
import { KITCHEN04 } from '../../src/world/levels/kitchen04.level.ts';
import { RAIL_WHEEL_HEIGHT } from '../../src/track/cross-section.ts';

const R = 4; // corner radius of the bend
const L = 10; // arc where the bend starts

class Rail implements RunCameraSource {
  readonly length = L + Math.PI * R * 0.5 + 10;

  frameAt(s: number): { pos: THREE.Vector3; tangent: THREE.Vector3; up: THREE.Vector3 } {
    const c = THREE.MathUtils.clamp(s, 0, this.length - 1e-9);
    if (c <= L) {
      return { pos: new THREE.Vector3(c, 0, 0), tangent: new THREE.Vector3(1, 0, 0), up: new THREE.Vector3(0, 1, 0) };
    }
    const inBend = Math.min(c - L, Math.PI * R * 0.5);
    const th = inBend / R; // 0..90deg
    const theta = th;
    const center = new THREE.Vector3(L, 0, -R);
    const dir = new THREE.Vector3(Math.cos(theta), 0, -Math.sin(theta));
    const pos = new THREE.Vector3(L + R * Math.sin(theta), 0, -R * (1 - Math.cos(theta)));
    void center;
    return { pos, tangent: dir, up: new THREE.Vector3(0, 1, 0) };
  }

  railPointAt(s: number): THREE.Vector3 {
    return this.frameAt(s).pos.clone();
  }
}

const DT = 1 / 120;

function drive(cam: RunCamera, steps: number, carAt: (t: number) => number, speed: number): void {
  for (let i = 0; i < steps; i++) cam.update(DT, carAt((i + 1) * DT), speed);
}

describe('run camera (§7.3: leads ~0.4 s, 150 ms positional lag, slower rotation)', () => {
  const rail = new Rail();

  it('on a straight, settles 0.4 s of rail ahead of the car', () => {
    const cam = new RunCamera(rail, 0);
    const v = 2;
    drive(cam, 480, (t) => Math.min(v * t, L - 0.5), v);
    const carArc = Math.min(v * (480 * DT), L - 0.5);
    expect(cam.railArc).toBeGreaterThan(carArc);
    // Steady state of a ramp target through the positional filter sits one
    // tau behind the lead point: gap = v * (LEAD_TIME - POS_LAG).
    expect(cam.railArc - carArc).toBeCloseTo(v * (RUN_CAMERA.LEAD_TIME - RUN_CAMERA.POS_LAG), 1);
  });

  it('positional response to a step advance is exponential with tau = 150 ms', () => {
    const cam = new RunCamera(rail, 0);
    cam.snap(0);
    // Hold the car at a fixed arc and let the lead target settle, then step
    // the car 1 m forward and watch the 63 % crossing time.
    drive(cam, 240, () => 0, 0);
    const before = cam.railArc;
    let crossed = -1;
    for (let i = 0; i < 120; i++) {
      cam.update(DT, 1, 0); // target jumps by exactly 1 m (speed 0 lead)
      if (crossed < 0 && cam.railArc - before > (1 - Math.exp(-1)) * 1) crossed = (i + 1) * DT;
    }
    expect(crossed).toBeGreaterThan(0);
    expect(crossed).toBeCloseTo(RUN_CAMERA.POS_LAG, 2);
  });

  it('rotational response is a slower exponential than the positional one', () => {
    const v = 3;
    const cam = new RunCamera(rail, 0);
    // Park the lead target a fixed distance INSIDE the corner: the target
    // orientation then makes one clean step and the 63 % crossing time
    // measures ROT_LAG directly. Stage 3 aims at the lead RAIL POINT from
    // the (trailing) eye, not the tangent frame, so the target yaw is the
    // eye-to-lead-point azimuth — on a straight-inclined corner the two
    // differ only by the chord angle; the azimuth is what the camera
    // actually converges to.
    cam.snap(L - 0.6);
    const carArc = L - 0.6; // lead = L - 0.6 + 0.4v ~ inside the bend
    const yawAt = (c: RunCamera): number => {
      // the camera's actual facing
      const z = new THREE.Vector3(0, 0, -1).applyQuaternion(c.rotation);
      return Math.atan2(z.z, z.x);
    };
    const lead = rail.frameAt(carArc + v * RUN_CAMERA.LEAD_TIME);
    const eye0 = rail.railPointAt(carArc - RUN_CAMERA.TRAIL);
    const lp = rail.railPointAt(carArc + v * RUN_CAMERA.LEAD_TIME);
    void lead;
    const yawTarget = Math.atan2(-(lp.z - eye0.z), lp.x - eye0.x);
    const yaw0 = yawAt(cam);
    let t63 = -1;
    for (let i = 0; i < 240; i++) {
      cam.update(DT, carArc, v);
      if (t63 < 0 && Math.abs(yawAt(cam) - yaw0) >= 0.63 * Math.abs(yawTarget - yaw0)) t63 = (i + 1) * DT;
    }
    expect(t63).toBeGreaterThan(RUN_CAMERA.POS_LAG); // strictly slower than position
    expect(t63).toBeGreaterThan(RUN_CAMERA.ROT_LAG * 0.8);
    expect(t63).toBeLessThan(RUN_CAMERA.ROT_LAG * 1.4);
  });

  it('snap cuts the filters instantly (reset/cut scene)', () => {
    const cam = new RunCamera(rail, 0);
    cam.snap(5, 0);
    expect(cam.railArc).toBeCloseTo(5, 6); // the AIM reads 5 (speed 0, no lead)
    // stage 3: the EYE rides TRAIL of track behind the car, not the car's
    // own rail point — snap(5) parks the eye at rail(5 − TRAIL)
    expect(cam.eyeArc).toBeCloseTo(5 - RUN_CAMERA.TRAIL, 6);
    expect(cam.position.x).toBeCloseTo(5 - RUN_CAMERA.TRAIL, 6);
  });

  it('deterministic: identical inputs frame identically', () => {
    const mk = (): number => {
      const cam = new RunCamera(rail, 0);
      drive(cam, 600, (t) => Math.min(2.2 * t, L + 2), 2.2);
      return cam.position.x + 7919 * cam.position.z + 104729 * cam.rotation.w;
    };
    expect(mk()).toBe(mk());
  });
});

describe('KitRig railPointAt (the straight-line camera drift regression)', () => {
  // RunCamera itself is pure filtering - the §7.3 "camera drifts sideways
  // on straights" bug lived in its SOURCE, KitRig.railPointAt: it snapped
  // s to the nearest 1 cm rail sample (5 mm stick-slip per sample step)
  // and the sample cache rescaled arc by the requested-vs-true spacing
  // ratio (a systematic drift growing along the track, ~40% of the arc
  // near x = -1 on the feel track). v2 (linear cache interpolation) fixed
  // the drift but left a RESIDUAL SNAP AT PIECE SEAMS — the cache chord
  // cuts every curvature discontinuity at a socket (measured on this rig:
  // 1.8 mm off the frame-derived path AT seams, 10x the smooth stretch, a
  // kink in the derivative = a velocity hitch). v3 evaluates
  // frameAt(s) + up * RAIL_WHEEL_HEIGHT directly — arc-faithful by
  // construction; the cache stays for the projection scan only.
  // These are the regression tests on the REAL kit rig, which the
  // analytic rail above cannot express.
  const rig = feelTrackRig();

  it('is continuous and arc-faithful along a straight (no sample snap)', () => {
    // a 0.9 m stretch of the run-out straight, sampled far finer than the
    // 1 cm rail cache spacing
    const s0 = rig.length - 1.2;
    const step = 0.0004;
    let prev = rig.railPointAt(s0);
    let worstBack = 0;
    let worstJump = 0;
    for (let s = s0 + step; s <= s0 + 0.9; s += step) {
      const p = rig.railPointAt(s);
      const d = p.distanceTo(prev);
      // a forward monotone rail: never retreats, never sticks, never jumps
      worstBack = Math.max(worstBack, prev.x - p.x);
      worstJump = Math.max(worstJump, Math.max(0, d - step) , Math.max(0, step * 0.5 - d));
      prev = p;
    }
    expect(worstBack).toBeLessThan(1e-9);            // monotone in x
    expect(worstJump).toBeLessThan(step * 0.5);      // no stick or slip
  });

  it('railPointAt(s) IS frameAt(s) + up * RAIL_WHEEL_HEIGHT everywhere', () => {
    // the v3 identity, probed along the run-out (v1's cache lagged
    // frameAt by a growing arc fraction; v2 by up to 1.8 mm at seams)
    const s0 = rig.length - 1.5;
    for (let s = s0; s < rig.length - 0.3; s += 0.0137) {
      const f = rig.frameAt(s);
      const p = rig.railPointAt(s);
      const expectY = f.pos.y + RAIL_WHEEL_HEIGHT * f.up.y;
      const expectX = f.pos.x + RAIL_WHEEL_HEIGHT * f.up.x;
      expect(Math.abs(p.x - expectX)).toBeLessThan(1e-12);
      expect(Math.abs(p.y - expectY)).toBeLessThan(1e-12);
    }
  });
});

describe('rail continuity across PIECE SEAMS (the residual snap, stage 3)', () => {
  // Every socket seam of the two real builds, probed either side at 1 um:
  // C0 (the gap across the seam is just the arc between the probes) and
  // C1 (no tangent step — the kink the cache chord used to concentrate at
  // every seam). Measured floors: gap 2.1 um at 1 um probes, tangent jump
  // 0.0005 deg.
  const rigs: readonly [string, KitRig][] = [
    ['feeltrack', feelTrackRig()],
    ['kitchen04-par', new KitRig(KITCHEN04.parBuild(), 10)],
  ];
  for (const [name, kitRig] of rigs) {
    it(`${name}: position continuous and tangent C1 across every socket`, () => {
      const e = 1e-6;
      for (const s of kitRig.starts.slice(1)) {
        const gap = kitRig.railPointAt(s + e).distanceTo(kitRig.railPointAt(s - e));
        expect(gap).toBeLessThanOrEqual(2.5 * e);
        const ta = kitRig.frameAt(s - e).tangent.clone().normalize();
        const tb = kitRig.frameAt(s + e).tangent.clone().normalize();
        const ang = (Math.acos(Math.min(1, Math.max(-1, ta.dot(tb)))) * 180) / Math.PI;
        expect(ang).toBeLessThan(0.01);
        const ua = kitRig.frameAt(s - e).up;
        const ub = kitRig.frameAt(s + e).up;
        const aup = (Math.acos(Math.min(1, Math.max(-1, ua.dot(ub)))) * 180) / Math.PI;
        expect(aup).toBeLessThan(0.01);
      }
    });
  }
});

describe('§7.3 lead/lag measured on a REAL kit rail (loop-rig run-out)', () => {
  // The analytic-rail tests pin the filter constants; this drives RunCamera
  // over loopRig's 4 m kit run-out — a real KitRig source with real spline
  // frames — and measures the settled lead gap and the 63 % step response
  // on the geometry cars actually run.
  const rig = loopRig(2.4 * LOOP_RADIUS, LOOP_RADIUS);
  const flat0 = rig.marks.loopEnd! + 0.6; // on the run-out straight

  it('settles v * (LEAD_TIME - POS_LAG) ahead of a constant-speed car', () => {
    const cam = new RunCamera(rig, flat0);
    const v = 2;
    const t0 = (flat0 + 0.2) / v;
    for (let i = 0; i < 300; i++) cam.update(DT, Math.min(v * ((i + 1) * DT + t0), rig.length - 0.5), v);
    const carArc = Math.min(v * (300 * DT + t0), rig.length - 0.5);
    expect(cam.railArc - carArc).toBeCloseTo(v * (RUN_CAMERA.LEAD_TIME - RUN_CAMERA.POS_LAG), 2);
  });

  it('step response crosses 63 % at tau = POS_LAG on the real rail', () => {
    const cam = new RunCamera(rig, flat0);
    const before = cam.railArc;
    let crossed = -1;
    for (let i = 0; i < 120; i++) {
      cam.update(DT, flat0 + 1, 0);
      if (crossed < 0 && cam.railArc - before > 1 - Math.exp(-1)) crossed = (i + 1) * DT;
    }
    expect(crossed).toBeGreaterThan(0);
    // detection quantises to the 120 Hz sample grid: the true crossing
    // lies in [tau, tau + dt) — assert the bracket, not a rounded decimal
    expect(crossed).toBeGreaterThanOrEqual(RUN_CAMERA.POS_LAG - DT);
    expect(crossed).toBeLessThan(RUN_CAMERA.POS_LAG + 2 * DT);
  });
});


describe('stage 3: the beige-wall proof (L01–L04 par runs, harness-rendered metrics)', () => {
  // Playtests E/F/G: "camera buried in a grey wall", "mid-run frames are
  // just beige blur", "car off-screen in most launches". Measured cause on
  // this exact path (World -> KitRig.nearestArc -> RunCamera, the boot
  // wiring headless): the old rail-lead eye sat AHEAD of the car for
  // 67–72 % of every run and the car left the frustum ~95 % of the time.
  // The contract now, per step of every ladder level's PAR run:
  //   - the car projects inside the frame (|ndc| ≤ 0.95) — the §7.3 focus
  //     band's "centred on the car" precondition;
  //   - the eye never sits inside a set solid (the placement-guard props,
  //     leaf-mesh granularity, mounted where kitchenSetPlacement puts them);
  //   - the eye→car sightline is never buried in a full solid (a box the
  //     car itself is inside is the car passing UNDER a prop — legal).
  const FOV = 35; // boot's PerspectiveCamera fov
  const ASPECT = 960 / 540;
  const tan = Math.tan((FOV / 2) * Math.PI / 180);

  for (const level of [KITCHEN01, KITCHEN02, KITCHEN03, KITCHEN04]) {
    it(`${level.id}: car in frame every step, eye never inside a set solid`, async () => {
      const { World } = await import('../../src/world/world.ts');
      const { initRapier } = await import('../../src/physics/sim.ts');
      const { buildKitchenSet } = await import('../../src/sets/kitchen/index.ts');
      const { kitchenSetPlacement, placeSet } = await import('../../src/world/setPlacement.ts');
      const { setCameraSolids } = await import('../../src/boot.ts');
      const { SET_TOKENS } = await import('../../src/render/tokens.ts');
      await initRapier();
      const set = buildKitchenSet(THREE, { tokens: SET_TOKENS.kitchen });
      const placement = kitchenSetPlacement(level.id);
      if (placement) placeSet(set.group, placement);
      const solids: RunCameraSolid[] = setCameraSolids(set.group).map((b) => ({
        min: [b.min.x, b.min.y, b.min.z],
        max: [b.max.x, b.max.y, b.max.z],
      }));
      const build = level.parBuild();
      const world = await World.create(level, build, { visuals: false });
      const rig = new KitRig(build, 10);
      const cam = new RunCamera(rig, 0, { solids });
      world.launch();
      cam.snap(rig.nearestArc(world.state().car.pos));
      let steps = 0;
      let worstNdc = 0;
      let minDist = Infinity;
      let maxDist = 0;
      let maxFinishDist = 0;
      for (; steps < 12 / DT && world.status === 'running'; steps++) {
        world.step();
        const s = world.state();
        const carArc = rig.nearestArc(s.car.pos);
        cam.update(DT, carArc, s.car.speed, s.car.pos);
        // — frustum test
        const q = cam.rotation.clone().invert();
        const v = new THREE.Vector3(s.car.pos.x, s.car.pos.y, s.car.pos.z)
          .sub(cam.position)
          .applyQuaternion(q);
        expect(v.z, `t=${(steps * DT).toFixed(3)}: car behind the camera plane`).toBeLessThan(-0.01);
        const nx = Math.abs(v.x / (-v.z * tan * ASPECT));
        const ny = Math.abs(v.y / (-v.z * tan));
        worstNdc = Math.max(worstNdc, nx, ny);
        minDist = Math.min(minDist, v.length());
        // The eye→car BAND splits at the finish fade (stage 4 watchability,
        // playtest M): OUTSIDE the last `FINISH_ARC` the chase must stay
        // within the stage-3 0.15–0.7 m band (a car the player can pick out
        // mid-run), and INSIDE it the deliberate finish clip — eye lifted,
        // trailed back and swung off the rail so cup, car and props share
        // one frame — is allowed to widen, but only to 0.85 m: past that
        // the car is a dot in a wide shot and the run's last second stops
        // being readable, which is the failure this whole pass exists to
        // kill. An earlier candidate (0.55 m trail + 0.5 m side) measured
        // 1.15 m here and failed on all four rungs.
        if (carArc > rig.length - RUN_CAMERA.FINISH_ARC) maxFinishDist = Math.max(maxFinishDist, v.length());
        else maxDist = Math.max(maxDist, v.length());
        // — solid test (raw boxes, no margin: the INTERSECTION promise)
        const e = cam.position;
        for (const b of solids) {
          const inBox =
            e.x > b.min[0] && e.x < b.max[0] &&
            e.y > b.min[1] && e.y < b.max[1] &&
            e.z > b.min[2] && e.z < b.max[2];
          expect(inBox, `t=${(steps * DT).toFixed(3)}: eye inside a set solid`).toBe(false);
        }
      }
      expect(world.status).toBe('finished');
      expect(steps).toBeGreaterThan(100);
      expect(worstNdc).toBeLessThanOrEqual(0.95);
      expect(minDist).toBeGreaterThan(0.1);
      expect(maxDist, 'cruise eye→car distance').toBeLessThan(0.7);
      expect(maxFinishDist, 'finish-window eye→car distance').toBeLessThan(0.85);
      world.dispose();
    }, 30_000);
  }
});

/**
 * STAGE 4 WATCHABILITY — THE FRAMING PROOFS (playtest N item: "the goal cup
 * is NEVER framed by the build camera"; playtest M item 6: "the result panel
 * hides where the car died"). Both live in `frameCamera` (`src/boot.ts`):
 * the static table framing biases its look-at toward the finish CUP's
 * capture centre (the goal sits in the middle thirds of the load frame, not
 * at an edge where a stranger cannot find it), and the run-end (end-hold)
 * pass boxes the car's final position into the subject so a fallen car
 * settles INSIDE the frame the verdict panel then appears over.
 */
describe('stage 4: the goal-framing + end-hold proofs', () => {
  const FOV = 35; // boot's PerspectiveCamera fov
  const ASPECT = 960 / 540;

  const ndcOf = (camera: THREE.PerspectiveCamera, p: THREE.Vector3) => {
    camera.updateMatrixWorld(true);
    camera.updateProjectionMatrix();
    return p.clone().project(camera);
  };

  let _buildTrackMeshes: ((b: any) => THREE.Group) | null = null;
  beforeAll(async () => {
    _buildTrackMeshes = (await import('../../src/world/world.ts')).buildTrackMeshes;
  });

  // the ladder lines that have a cup, both builds each addressable
  const lines: { name: string; level: any; mode: 'fixtures' | 'par' | 'alt' }[] = [
    { name: 'L01 fixtures', level: KITCHEN01, mode: 'fixtures' },
    { name: 'L01 par', level: KITCHEN01, mode: 'par' },
    { name: 'L02 fixtures', level: KITCHEN02, mode: 'fixtures' },
    { name: 'L02 par', level: KITCHEN02, mode: 'par' },
    { name: 'L02 alt (arc line)', level: KITCHEN02, mode: 'alt' },
    { name: 'L04 par', level: KITCHEN04, mode: 'par' },
  ];

  for (const line of lines) {
    it(`${line.name}: the load framing frames the finish cup in the middle thirds`, async () => {
      const { finishCapture } = await import('../../src/feel/kittrack.ts');
      const { frameCamera, initialBuild } = await import('../../src/boot.ts');
      const { kitchen02ArcBuild } = await import('../../src/world/levels/kitchen02.level.ts');
      const build =
        line.mode === 'par'
          ? line.level.placeholderBuild()
          : line.mode === 'alt'
            ? kitchen02ArcBuild()
            : initialBuild(line.level);
      const cup = finishCapture(build);
      expect(cup, `${line.name}: no cup in build`).not.toBeNull();
      const scene = new THREE.Scene();
      scene.add(_buildTrackMeshes!(build));
      const camera = new THREE.PerspectiveCamera(FOV, ASPECT, 0.01, 20);
      frameCamera(camera, scene, cup!.center);
      const ndc = ndcOf(camera, cup!.center);
      expect(ndc.z, `${line.name}: cup past the far plane`).toBeLessThan(1);
      // MIDDLE THIRDS: |ndc| <= 0.5 on both axes sits well inside the 0.67
      // third-lines; the corner framing the playtester could not find
      // measured 0.43/0.46 with the box-centre look-at
      expect(Math.abs(ndc.x), `${line.name}: cup x ndc`).toBeLessThanOrEqual(0.5);
      expect(Math.abs(ndc.y), `${line.name}: cup y ndc`).toBeLessThanOrEqual(0.5);
      // and the whole build still fits: every track-box corner in frame
      const box = new THREE.Box3().setFromObject(scene.getObjectByName('track')!);
      for (const x of [box.min.x, box.max.x])
        for (const y of [box.min.y, box.max.y])
          for (const z of [box.min.z, box.max.z]) {
            const c = ndcOf(camera, new THREE.Vector3(x, y, z));
            expect(Math.abs(c.x), `${line.name}: corner x`).toBeLessThanOrEqual(0.95);
            expect(Math.abs(c.y), `${line.name}: corner y`).toBeLessThanOrEqual(0.95);
          }
    });
  }

  it('end-hold framing: a car that settles half a metre off the track box is still in frame', async () => {
    const { frameCamera } = await import('../../src/boot.ts');
    const build = KITCHEN01.placeholderBuild();
    const scene = new THREE.Scene();
    scene.add(_buildTrackMeshes!(build));
    // a death spot under the gap: below the deck, beside the line — OUTSIDE
    // the track's own box (that is what makes it the old bug)
    const death = new THREE.Vector3(0.9, -0.75, 0.35);
    const camera = new THREE.PerspectiveCamera(FOV, ASPECT, 0.01, 20);
    frameCamera(camera, scene, null, death);
    const ndc = ndcOf(camera, death);
    expect(ndc.z, 'death spot past the far plane').toBeLessThan(1);
    expect(Math.abs(ndc.x), 'death spot x ndc').toBeLessThanOrEqual(0.9);
    expect(Math.abs(ndc.y), 'death spot y ndc').toBeLessThanOrEqual(0.9);
    // and the wide hold is still a WIDE shot: the whole track fits too
    // (the panel appears beside the car, not instead of the level)
    const box = new THREE.Box3().setFromObject(scene.getObjectByName('track')!);
    for (const x of [box.min.x, box.max.x])
      for (const z of [box.min.z, box.max.z]) {
        const c = ndcOf(camera, new THREE.Vector3(x, box.min.y, z));
        expect(Math.abs(c.x), 'track corner x').toBeLessThanOrEqual(0.95);
        expect(Math.abs(c.y), 'track corner y').toBeLessThanOrEqual(0.95);
      }
  });
});
