/**
 * THE HOUSE CAMERA v1 (build 1 of "THE DOWNHILL greenlit"; the spec is
 * [[Reference/Downhill Spike]] §3 — kept HONEST, not beautiful).
 *
 * The farewell crane's DWELL→MOVE plan (`CRANE_DWELL`/`CRANE_MOVE`,
 * `CRANE_HAZE`, imported — one plan law, not a copy) made SPATIAL: the
 * farewell's `craneRoomX` is a flat ROW; the house's is a STAIR — the
 * nodes are the deck centres and altitudes of `roomGraph` (from the set
 * parcels), the edges are the connector legs, and the haze rides the leg's
 * own lift sine exactly as the farewell's does. Two grammars:
 *
 * - `menuPose` — THE MENU CAMERA = the crane PARKED at the porch (the
 *   dwell grammar stood still on the world's floor deck: the house's
 *   "crane path parked as the menu camera it always was", stated here as
 *   data; the home screen adopts it in build 2);
 * - `houseRunPose` — the downhill follows the hand-off study: dwell on the
 *   deck where a parcel was just APPROVED, then one lift-and-walk along the
 *   leg while the haze breathes, docking into the next room as its parcel
 *   approves. The plan is a pure function of the approval timeline
 *   (`houseRunPlan`), so a canonical 4-room run hand-offs THREE times —
 *   the two-hand-off minimum is a theorem of ≥3 rooms, not a tuning fact.
 *
 * Deliberately NOT here (the spike named these as later, per-room focused
 * passes): the six sets' `shots` re-aimed per deck, `setCameraSolids`
 * house-wide, the cross-section dressing. No filters chase a car — every
 * pose is a function of plan time.
 */
import * as THREE from 'three';
import { CRANE_DWELL, CRANE_MOVE, CRANE_HAZE } from '../pages/farewell.ts';
import { roomGraph, type FrameRoom, type HouseLayout } from '../world/house-frame.ts';

export interface HousePose {
  eye: [number, number, number];
  target: [number, number, number];
  /** Exponential fog density to ride (0 = clear). */
  fog: number;
}

/** THE BUILD-VIEW BREATH (Lane F1, art note plan line 2): the build-view
 *  fog the campaign's build camera already rides, on the HOME camera ONLY
 *  — nine metres of section reads as air instead of paper. `homePose`
 *  carries it; the run's physics footage stays fog-free (only the leg's
 *  haze sine breathes, unchanged), and `menuPose` — the per-room parked
 *  eye, the dwell's face — stays clear like the dwell. The art note's
 *  mock wash at 0.055 is too thick for the section; the note's own
 *  recommendation band is 0.015–0.02 and this sits in it. */
export const HOME_HAZE = 0.018;

/** THE SOLID CLEARANCE (cause D, the house-wide `setCameraSolids` the
 *  spike priced and never funded): a pure push of a pose EYE out of the
 *  mounted sets' leaf boxes — the eye never sits inside a prop it should
 *  be looking at. Walks toward the viewer (+z, the section's own axis;
 *  the poses are all section-parallel by construction) until clear.
 *  Deterministic: a pure function of pose + static layout geometry, so
 *  every frame's pose stays a function of plan time (the camera law the
 *  header states, unweakened). */
export function eyeClear(
  eye: [number, number, number],
  solids: readonly THREE.Box3[],
  margin = 0.05,
  maxSteps = 24,
): [number, number, number] {
  if (solids.length === 0) return eye;
  const p = new THREE.Vector3(eye[0], eye[1], eye[2]);
  const pad = new THREE.Box3();
  const inside = () => {
    for (const b of solids) {
      pad.copy(b).expandByScalar(margin);
      if (pad.containsPoint(p)) return true;
    }
    return false;
  };
  for (let i = 0; i < maxSteps && inside(); i++) p.z += 0.25;
  return [p.x, p.y, p.z];
}

/** The dwell grammar, lifted from the farewell's ratified stills band. */
export const HOUSE_FRAMING = {
  gazeHeight: 1.45,
  distance: 3.1,
  /** How long the camera keeps showing a crossing before the leg starts. */
  crossHold: 0.15,
  /** The compressed-leg floor (a fast double-crossing never teleports). */
  minLeg: 0.2,
} as const;

const smoothstep = (u: number): number => {
  const k = Math.min(1, Math.max(0, u));
  return k * k * (3 - 2 * k);
};

/** A parcel event the plan reads: a room APPROVED at run-time `time`. */
export interface ParcelEvent {
  room: FrameRoom;
  time: number;
}

export interface HouseSegment {
  kind: 'dwell' | 'leg';
  /** Room shown (dwell) or room departed (leg). */
  room: FrameRoom;
  /** Room arrived at (leg only). */
  to?: FrameRoom;
  from: number;
  to_t: number;
}

/** THE PLAN — pure over the approvals: dwell where the crossing happened,
 *  leg toward the next approval, arrive no later than its crossing, never
 *  sooner than `minLeg` of lift. Zero approvals = one dwell on the launch
 *  deck; N approvals = N−1 hand-offs. */
export function houseRunPlan(events: readonly ParcelEvent[]): HouseSegment[] {
  const segs: HouseSegment[] = [];
  if (events.length === 0) return segs;
  const legStart = (i: number): number => events[i]!.time + HOUSE_FRAMING.crossHold;
  for (let i = 0; i < events.length - 1; i++) {
    const s = legStart(i);
    const next = legStart(i + 1);
    const e = Math.max(s + HOUSE_FRAMING.minLeg, Math.min(s + CRANE_MOVE, next));
    segs.push({ kind: 'dwell', room: events[i]!.room, from: i === 0 ? 0 : segs.at(-1)!.to_t, to_t: s });
    segs.push({ kind: 'leg', room: events[i]!.room, to: events[i + 1]!.room, from: s, to_t: e });
  }
  const last = events[events.length - 1]!;
  segs.push({ kind: 'dwell', room: last.room, from: segs.at(-1)?.to_t ?? 0, to_t: Infinity });
  return segs;
}

/** Hand-off count of a plan (the e2e/unit claim: ≥ 2 hand-offs for ≥ 3
 *  rooms — the spike's camera section as an assertion). */
export const houseHandoffs = (plan: readonly HouseSegment[]): number =>
  plan.filter((s) => s.kind === 'leg').length;

/** The MENU pose: the crane parked at a room's deck (porch by default —
 *  the floor of the world, the house's front door). */
export function menuPose(layout: HouseLayout, room: FrameRoom = 'porch'): HousePose {
  const node = roomGraph(layout).nodes.find((n) => n.room === room)!;
  const [cx, cy] = node.center;
  return {
    eye: [cx, cy + HOUSE_FRAMING.gazeHeight, HOUSE_FRAMING.distance + 0.6],
    target: [cx, cy + 0.05, 0],
    fog: 0,
  };
}

/**
 * THE HOME POSE (build 2, "the crane's path parked as the menu camera it
 * always was", Decision Log law 3): the parked crane pulled to the width
 * that frames the WHOLE cross-section — every deck's bounds inside the
 * frustum with a 15 % margin, eye on the section's own axis at gaze
 * height. Pure over the layout, like every other pose: the six windows of
 * the front door project through exactly this pose, so their screen
 * positions are layout facts, not tunings. `fov`/`aspect` are passed in
 * by the page (the camera the pose is meant for), defaults match
 * `src/pages/house.ts`.
 */
export function homePose(layout: HouseLayout, fovDeg = 35, aspect = 960 / 540): HousePose {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const d of layout.decks) {
    minX = Math.min(minX, d.bounds.min[0]);
    maxX = Math.max(maxX, d.bounds.max[0]);
    minY = Math.min(minY, d.bounds.min[1]);
    maxY = Math.max(maxY, d.bounds.max[1]);
  }
  const vFov = (fovDeg * Math.PI) / 180;
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect);
  const dz =
    1.15 *
    Math.max((maxX - minX) / 2 / Math.tan(hFov / 2), (maxY - minY) / 2 / Math.tan(vFov / 2));
  const midX = (minX + maxX) / 2;
  const midY = (minY + maxY) / 2;
  // THE BUILD-VIEW FOG rides the HOME pose only (plan line 2): the void
  // gets air where a stranger sits; the run footage stays untouched.
  return { eye: [midX, midY + 0.35, dz], target: [midX, midY, 0], fog: HOME_HAZE };
}

/** The premise beat's PULL-BACK (build 2, law 4's opening image): the eye
 *  starts AT the kitchen window (`menuPose('kitchen')`) and pulls back to
 *  `homePose` over `pullS` seconds — the farewell's PULL grammar written
 *  spatially, a pure function of beat time, fog clear the whole way. */
export function beatPullPose(
  layout: HouseLayout,
  t: number,
  pullS = 1.0,
  fovDeg = 35,
  aspect = 960 / 540,
): HousePose {
  const from = menuPose(layout, 'kitchen');
  const to = homePose(layout, fovDeg, aspect);
  const u = smoothstep(Math.min(1, Math.max(0, t / pullS)));
  return {
    eye: [
      from.eye[0] + (to.eye[0] - from.eye[0]) * u,
      from.eye[1] + (to.eye[1] - from.eye[1]) * u,
      from.eye[2] + (to.eye[2] - from.eye[2]) * u,
    ],
    target: [
      from.target[0] + (to.target[0] - from.target[0]) * u,
      from.target[1] + (to.target[1] - from.target[1]) * u,
      0,
    ],
    // the haze breathes IN with the pull: clear at the kitchen window,
    // the home breath at the wide pose (still pure over beat time)
    fog: to.fog * u,
  };
}

/** THE RUN POSE at run-time `t` over the plan — a pure function of plan
 *  time, deterministic on every machine like the farewell's crane. */
export function houseRunPose(layout: HouseLayout, plan: readonly HouseSegment[], t: number): HousePose {
  const nodes = new Map(roomGraph(layout).nodes.map((n) => [n.room, n]));
  const node = (r: FrameRoom) => nodes.get(r)!;
  const dwellPose = (r: FrameRoom, u: number): HousePose => {
    const n = node(r);
    const x = n.center[0] + (u - 0.5) * 0.7;
    return { eye: [x, n.center[1] + HOUSE_FRAMING.gazeHeight, HOUSE_FRAMING.distance], target: [n.center[0], n.center[1] + 0.05, 0], fog: 0 };
  };
  // before the first segment (the launch beat): dwell on the first shown room
  const first = plan[0];
  if (!first || t < first.from) return dwellPose(plan[0]?.room ?? 'garage', 0);
  for (const seg of plan) {
    if (t >= seg.to_t) continue;
    if (seg.kind === 'dwell') return dwellPose(seg.room, Math.min(1, (t - seg.from) / CRANE_DWELL));
    const a = node(seg.room);
    const b = node(seg.to!);
    const u = smoothstep((t - seg.from) / (seg.to_t - seg.from));
    const lift = Math.sin(Math.PI * Math.min(1, (t - seg.from) / (seg.to_t - seg.from)));
    const x = a.center[0] + 0.35 + (b.center[0] - 0.35 - (a.center[0] + 0.35)) * u;
    const y = a.center[1] + HOUSE_FRAMING.gazeHeight + Math.max(0, b.center[1] - a.center[1]) * u + 0.85 * lift;
    return {
      eye: [x, y, HOUSE_FRAMING.distance + 1.3 * lift],
      target: [a.center[0] + (b.center[0] - a.center[0]) * u, a.center[1] + 0.05 + (b.center[1] - a.center[1]) * u, 0],
      fog: CRANE_HAZE.density * Math.sin(Math.PI * Math.min(1, (t - seg.from) / (seg.to_t - seg.from))),
    };
  }
  const lastSeg = plan.at(-1)!;
  return dwellPose(lastSeg.room, 1);
}

/** The live wrapper the page drives: approvals arrive from the parcel
 *  probe; the pose is recomputed from the (monotone) plan each frame. */
export class HouseCamera {
  readonly layout: HouseLayout;
  private events: ParcelEvent[] = [];
  private plan: HouseSegment[] = [];
  private solids: readonly THREE.Box3[] | null = null;

  constructor(layout: HouseLayout) {
    this.layout = layout;
  }

  /** Start a new run: the plan is rebuilt from THIS run's crossings. */
  reset(): void {
    this.events = [];
    this.plan = [];
  }

  /** THE HOUSE-WIDE SOLIDS (`setCameraSolids` over the mounted sets, the
   *  page's `mountHouseSets` output): when set, every pose this wrapper
   *  answers has its eye pushed clear of the set geometry (`eyeClear`,
   *  cause D — the eye stops floating INSIDE the rooms). Absent = the
   *  bare-deck camera the spike shipped, byte-for-byte. */
  setSolids(solids: readonly THREE.Box3[] | null): void {
    this.solids = solids;
  }

  /** The parcel probe reports an approval (physics already did the work). */
  approved(room: FrameRoom, time: number): void {
    this.events.push({ room, time });
    this.plan = houseRunPlan(this.events);
  }

  pose(t: number): HousePose {
    const p =
      this.events.length === 0 ? menuPose(this.layout, 'garage') : houseRunPose(this.layout, this.plan, t);
    return this.solids ? { ...p, eye: eyeClear(p.eye, this.solids) } : p;
  }

  /** Apply a pose to a live camera + fog (the page's one renderer touch). */
  apply(cam: THREE.Camera, t: number, fog: THREE.FogExp2 | null): void {
    const p = this.pose(t);
    cam.position.set(p.eye[0], p.eye[1], p.eye[2]);
    cam.lookAt(p.target[0], p.target[1], p.target[2]);
    if (fog) fog.density = p.fog;
  }
}
