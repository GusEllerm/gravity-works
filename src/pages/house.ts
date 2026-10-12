/**
 * THE HOUSE PAGE — the `?level=house` surface (build 1 of "THE DOWNHILL
 * greenlit"). A separate page in the `boot()` route (like `?levels=1`),
 * NOT a fork of `bootGame`: the campaign shell, the builder, the star law
 * and every pixel baseline of the thirty rungs ride this branch untouched.
 * What the house borrows is the LAWS, not the DOM:
 *
 * - THE INPUT LAW: the only control is RELEASE. Every force that can move
 *   the car after it lives in the level data (`Level.inputs`) and the
 *   replay — the printed hash IS the run's receipt.
 * - ROOMS COLLECTED: the parcel probe (`approveParcels`' law, applied
 *   incrementally per step, READ-ONLY) counts rooms; the result bar reads
 *   "N rooms · T s — you stopped at the <room>". Rooms replace stars HERE
 *   ONLY. The personal best rides the save (`recordHouseRun` — "this
 *   device" law, the honesty sentence verbatim).
 * - THE GHOST LAW: the house is the AFTERLIFE that is literally the
 *   afterlife — the par line is ON by default here (`parGhostSurface`
 *   already classifies every off-ladder id as afterlife; on the house the
 *   ghost IS the tape the run can never diverge from, which is the point
 *   stated in the greenlight entry: the world needs no anchor, only a tape).
 * - CAMERA v1 (`src/camera/house-camera.ts`): before the launch the crane
 *   is PARKED AT THE PORCH (the menu camera build 2 will adopt); during a
 *   run it dwells where physics approved and walks the legs.
 * - TOURS: each room's window links its five rungs with the SAME
 *   `?level=<room>NN` bytes the level select uses — the campaign demoted
 *   to tours, never deleted. `?room=<id>` parks the menu camera at another
 *   window (presentation only — it enters no sim).
 */
import * as THREE from 'three';
import { World } from '../world/world.ts';
import { HOUSE, HOUSE_ID } from '../world/levels/house.level.ts';
import { houseLayout, type ParcelApproval, type FrameRoom } from '../world/house-frame.ts';
import { CUP_CAPTURE_FACTOR } from '../world/world.ts';
import { CAR } from '../physics/car.ts';
import { SIM_SCALE, FIXED_DT } from '../physics/sim.ts';
import { CAMPAIGN, levelUnlock } from '../world/campaign.ts';
import { getLevel } from '../world/levels/feeltrack.level.ts';
import { GhostRace, parGhostRule, parGhostSurface, cachedGhostTrace } from './ghost.ts';
import { HouseCamera, menuPose, type HousePose } from '../camera/house-camera.ts';
import { SET_TOKENS } from '../render/tokens.ts';
import { loadSave, defaultStorage } from '../save/save.ts';
import { reducedMotionActive } from '../ui/motion.ts';
import { recordHouseRun, readHouseBest, RECORDS_HONESTY, type HouseBest } from '../save/records.ts';

/** Room labels for the result copy — the rooms of the descent order. */
const ROOM_LABEL: Record<string, string> = {
  garage: 'the garage',
  kitchen: 'the kitchen',
  bedroom: 'the bedroom',
  bathroom: 'the bathroom',
  garden: 'the garden',
  porch: 'the porch',
};

/** THE RESULT LINE (the law's wording): "N rooms · T s — you stopped at
 *  the <room>". Pure so the copy is unit-testable without a page. */
export function houseResultLine(rooms: number, time: number, stoppedAt: string | null): string {
  const n = `${rooms} ${rooms === 1 ? 'room' : 'rooms'}`;
  const at = stoppedAt ?? 'the porch';
  return `${n} \u00B7 ${time.toFixed(1)} s \u2014 you stopped at ${at}`;
}

/** The live status line while a run is on the table. */
export function houseStatusLine(rooms: number, time: number): string {
  return `${rooms} ${rooms === 1 ? 'room' : 'rooms'} \u00B7 ${time.toFixed(1)} s`;
}

/** The device-best line — the honesty sentence rides verbatim. */
export function houseBestLine(best: HouseBest | undefined): string {
  if (!best) return `no run here yet — ${RECORDS_HONESTY}`;
  return `best here: ${best.rooms} ${best.rooms === 1 ? 'room' : 'rooms'} \u00B7 ${best.time.toFixed(1)} s — ${RECORDS_HONESTY}`;
}

export interface HouseState {
  status: string;
  hash: string;
  steps: number;
  time: number;
  rooms: { room: string; step: number; time: number }[];
  best: HouseBest | undefined;
  ghostEnabled: boolean;
}

export async function bootHouse(root: HTMLElement, params: URLSearchParams): Promise<() => HouseState> {
  const layout = houseLayout();
  root.innerHTML = '<h1>Gravity Works — the House</h1>';
  const nav = document.createElement('p');
  nav.id = 'gw-levels-nav';
  const navLink = document.createElement('a');
  navLink.href = '?levels=1';
  navLink.textContent = 'All levels';
  nav.appendChild(navLink);
  root.appendChild(nav);

  // ---- chrome above the stage: launch, status, result, best, hash -----
  const host = document.createElement('div');
  host.id = 'gw-builder-host'; // same flow slot the campaign shell reserves
  const launch = document.createElement('button');
  launch.id = 'gw-launch';
  launch.type = 'button';
  launch.textContent = 'Release';
  const statusLine = document.createElement('p');
  statusLine.id = 'gw-house-status';
  statusLine.setAttribute('role', 'status');
  statusLine.textContent = 'Six rooms, one release. Gravity does the rest — press Release.';
  const resultLine = document.createElement('p');
  resultLine.id = 'gw-house-result';
  resultLine.setAttribute('role', 'status');
  const bestLine = document.createElement('p');
  bestLine.id = 'gw-house-best';
  bestLine.textContent = houseBestLine(readHouseBest(HOUSE_ID));
  const hashDetails = document.createElement('details');
  const hashSummary = document.createElement('summary');
  hashSummary.textContent = 'Run receipt';
  const hashValue = document.createElement('code');
  hashValue.id = 'gw-hash-value';
  hashDetails.append(hashSummary, hashValue);
  host.append(launch, statusLine, resultLine, bestLine, hashDetails);
  root.appendChild(host);

  const stage = document.createElement('div');
  stage.id = 'gw-stage';
  stage.style.position = 'relative';
  const canvas = document.createElement('canvas');
  canvas.id = 'gw-canvas';
  canvas.width = 960;
  canvas.height = 540;
  stage.appendChild(canvas);

  // ---- the room windows: each room's five rungs, byte-compatible URLs --
  const tours = document.createElement('nav');
  tours.id = 'gw-house-tours';
  for (const room of CAMPAIGN) {
    const section = document.createElement('section');
    section.dataset.room = room.id;
    const heading = document.createElement('h2');
    heading.textContent = room.label; // the window's room, registry truth
    section.appendChild(heading);
    const list = document.createElement('ul');
    for (const id of room.levelIds) {
      const item = document.createElement('li');
      const lock = levelUnlock(loadSave().progress, id);
      if (lock.unlocked) {
        const a = document.createElement('a');
        a.id = `gw-house-tour-${id}`;
        a.href = `?level=${id}`; // the SAME bytes the level select writes
        a.textContent = getLevel(id).name;
        item.appendChild(a);
      } else {
        const span = document.createElement('span');
        span.id = `gw-house-tour-${id}`;
        span.textContent = `${getLevel(id).name} \uD83D\uDD12`; // no dead affordance
        item.appendChild(span);
      }
      list.appendChild(item);
    }
    section.appendChild(list);
    tours.appendChild(section);
  }
  stage.appendChild(tours);
  root.appendChild(stage);

  // ---- the world ------------------------------------------------------
  const world = await World.create(HOUSE, HOUSE.parBuild(), { visuals: true });
  const scene = world.scene!;
  scene.background = new THREE.Color('#efe0c8');
  const fog = new THREE.FogExp2(0xefe0c8, 0);
  scene.fog = fog;
  const table = scene.getObjectByName('table');
  if (table instanceof THREE.Mesh) {
    table.scale.set((layout.floor.half[0] * 2) / 6, (layout.floor.half[2] * 2) / 6, 1);
  }

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio ?? 1));
  renderer.setSize(960, 540, false);
  const camera = new THREE.PerspectiveCamera(35, 960 / 540, 0.01, 80);

  // the menu camera: the crane parked at the porch (or at `?room=`)
  const roomParam = params.get('room');
  const menuRoom: FrameRoom =
    roomParam !== null && (['garage', 'kitchen', 'bedroom', 'bathroom', 'garden', 'porch'] as const).includes(roomParam as FrameRoom)
      ? (roomParam as FrameRoom)
      : 'porch';
  const houseCam = new HouseCamera(layout);
  const parked: HousePose = menuPose(layout, menuRoom);
  camera.position.set(parked.eye[0], parked.eye[1], parked.eye[2]);
  camera.lookAt(parked.target[0], parked.target[1], parked.target[2]);

  // ---- the par ghost: afterlife default (ON unless reduced motion says
  // so or the player's stored choice says otherwise — the SAME rule the
  // sandboxes race, no new setting) --------------------------------------
  const save = loadSave(defaultStorage());
  const reduceMotion = reducedMotionActive(save.settings.reducedMotion);
  const ghostTruth = parGhostRule({
    surface: parGhostSurface(HOUSE_ID, false),
    earned: true, // the house spoils nothing: the run IS its tape
    reducedMotion: reduceMotion,
    stored: save.settings.ghosts?.par,
  });
  const ghost = new GhostRace(SET_TOKENS.kitchen);
  ghost.setEnabled(ghostTruth.enabled);
  ghost.attachScene(scene);
  let ghostWound = false;

  // ---- the parcel probe (read-only; the run answers for itself) --------
  const capR2 = (r: number): number => (r * CUP_CAPTURE_FACTOR) ** 2;
  const stallR2 = (r: number): number => (r * CUP_CAPTURE_FACTOR + CAR.halfL / SIM_SCALE) ** 2;
  const approvals: ParcelApproval[] = [];
  const seen = new Set<string>();
  let launchStep = 0;

  function probeStep(): void {
    const s = world.state();
    for (const p of HOUSE.parcels) {
      if (seen.has(p.room)) continue;
      const dx = s.car.pos.x - p.center[0];
      const dy = s.car.pos.y - p.center[1];
      const dz = s.car.pos.z - p.center[2];
      if (dx * dx + dy * dy + dz * dz < capR2(p.radius)) {
        seen.add(p.room);
        const ev = { room: p.room as FrameRoom, step: world.stepCount - launchStep, time: world.time };
        approvals.push(ev);
        houseCam.approved(ev.room, ev.time);
        statusLine.textContent = houseStatusLine(approvals.length, world.time);
      }
    }
  }

  function finalize(): void {
    // the terminal stall branch (the spike's approval law, per parcel):
    // a car that ENDED stopped with its nose in a bowl is in the bowl
    if (world.status === 'stalled') {
      const s = world.state();
      for (const p of HOUSE.parcels) {
        if (seen.has(p.room)) continue;
        const dx = s.car.pos.x - p.center[0];
        const dy = s.car.pos.y - p.center[1];
        const dz = s.car.pos.z - p.center[2];
        if (dx * dx + dy * dy + dz * dz < stallR2(p.radius)) {
          seen.add(p.room);
          approvals.push({ room: p.room as FrameRoom, step: world.stepCount - launchStep, time: world.time });
          houseCam.approved(p.room as FrameRoom, world.time);
        }
      }
    }
    const stoppedAt = approvals.length > 0 ? ROOM_LABEL[approvals[approvals.length - 1]!.room] : null;
    resultLine.textContent = houseResultLine(approvals.length, world.time, stoppedAt);
    const outcome = recordHouseRun(HOUSE_ID, approvals.length, world.time);
    bestLine.textContent = houseBestLine(outcome.best);
    hashValue.textContent = world.hashHex();
    ghost.park();
  }

  function launchRun(): void {
    approvals.length = 0;
    seen.clear();
    resultLine.textContent = '';
    world.launch();
    launchStep = world.stepCount;
    houseCam.reset();
    houseCam.approved('garage', 0); // the launch deck is where the eye is
    ghost.beginRace();
    if (ended) {
      // a re-release restarts the render loop the terminal frame stopped
      ended = false;
      accum = 0;
      last = performance.now();
      requestAnimationFrame(frame);
    }
    if (!ghostTruth.enabled) return;
    if (!ghostWound) {
      ghostWound = true;
      ghost.setWinding(true);
      void cachedGhostTrace(HOUSE, HOUSE.parBuild())
        .then((trace) => {
          ghost.setWinding(false);
          ghost.setTrace('par', trace);
          ghost.resumeRace();
        })
        .catch(() => ghost.setWinding(false));
    } else {
      ghost.resumeRace();
    }
  }

  launch.addEventListener('click', launchRun);

  let last = performance.now();
  let accum = 0;
  let ended = false;
  function frame(now: number): void {
    if (ended) return;
    if (!document.hidden) {
      accum += Math.min(0.25, (now - last) / 1000);
      last = now;
      while (accum >= FIXED_DT && world.status === 'running') {
        world.step();
        probeStep();
        accum -= FIXED_DT;
      }
      if (world.status !== 'idle') {
        ghost.sync(world.time);
        houseCam.apply(camera, world.time, fog);
      }
      renderer.render(scene, camera);
      if (world.status !== 'running' && world.stepCount > launchStep && world.stepCount > 0) {
        ended = true;
        finalize();
        renderer.render(scene, camera); // the frame the result line lands on
        return;
      }
    } else {
      last = now;
    }
    requestAnimationFrame(frame);
  }

  if (params.get('launch') === '1') launchRun();

  const state = (): HouseState => ({
    status: world.status,
    hash: world.hashHex(),
    steps: world.stepCount,
    time: world.time,
    rooms: approvals.map((a) => ({ room: a.room, step: a.step, time: a.time })),
    best: readHouseBest(HOUSE_ID),
    ghostEnabled: ghost.state().enabled,
  });
  (window as unknown as Record<string, unknown>).__gwHouseState = state;
  (window as unknown as Record<string, unknown>).__gwHouseCameraPose = () =>
    world.status === 'idle' && world.stepCount === 0 ? parked : houseCam.pose(world.time);
  requestAnimationFrame(frame);
  return state;
}
