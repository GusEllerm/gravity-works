/**
 * THE HOUSE PAGE — the `?level=house` surface (build 1 of "THE DOWNHILL
 * greenlit") AND THE FRONT DOOR — the bare `/` route (build 2, Decision
 * Log law 3: "the home screen becomes THE HOUSE, rendered — the crane's
 * path parked as the menu camera it always was"). A separate page in the
 * `boot()` route (like `?levels=1`), NOT a fork of `bootGame`: the
 * campaign shell, the builder, the star law and every pixel baseline of
 * the thirty rungs ride this branch untouched; `?boot=rung` is the
 * recorded address of the OLD front end for the specs that still want it
 * (the re-baseline act of law 3, stated, not quiet).
 *
 * HOME MODE (build 2) is the same page wearing the house's face:
 * - THE CROSS-SECTION is the screen: `homePose` parks the crane wide
 *   enough to read all six decks at once (camera v1's menu grammar stood
 *   at a room; the parked crane WIDE is what "the menu camera it always
 *   was" means once the menu has to hold a whole house).
 * - THE SIX WINDOWS are the interactive level select: one real `<button>`
 *   per room, projected through exactly that pose (their screen positions
 *   are layout facts, not tunings), named in the Tab walk —
 *   `kitchen, 5 rungs, toured, 8 of 15 stars` — Enter opens the window:
 *   the camera parks AT that room's deck (presentation only, the `?room=`
 *   deep-link's own gesture) and the room's tour list lands under it.
 *   Tour entries are the UNCHANGED `?level=<room>NN` rung URLs — byte
 *   compatibility is the greenlight's proof, so the windows write the
 *   same bytes the level select writes, and locked rungs stay locks.
 *   Toured rooms wear their stars on the sill (the save's `progress.stars`
 *   folded per room — registry truth, never a mirrored string).
 * - THE HOUSE RUN is the front-door act: the same Release button, the
 *   same input law, the same receipt.
 * - THE PREMISE BEAT lives HERE now (law 4's "the crane gains a
 *   beginning"): a cold first visit on the bare route watches the crane
 *   PULL BACK FROM THE KITCHEN WINDOW and a car free-roll one room and
 *   die in the next — the game saying "it's all one place" before any UI
 *   word. It is built only from shipped grammar (`beatPullPose` + the
 *   run plan over `roomGraph`) and one data-only level variant
 *   (`HOUSE_BEAT_LEVEL`: no wind, one big launch — every force still
 *   lives in the replayed data; the beat records nothing and hashes
 *   nothing anyone will ever share). `src/pages/intro.ts` keeps the
 *   audience law (webdriver skips, `?intro=1` forces, `?intro=off` and
 *   reduced motion never sit through it); the rung boot is now an
 *   ADDRESSED page and no longer anyone's first visit.
 * - THE CORNER CHROME KEEPS ITS CORNERS: the daily chip (`#gw-daily-board`
 *   → `?daily=1`) and the LINES tab (the level select's own
 *   `createLinesTab`, opened as a corner panel) ride the home screen
 *   exactly as they rode their old pages; `.gw-premiere` hides them for
 *   the beat like every other chrome.
 *
 * What the house borrows are the LAWS, not the DOM:
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
 *   stated in the greenlight entry: the world needs no anchor, only a
 *   tape).
 * - CAMERA v1 (`src/camera/house-camera.ts`): before the launch the crane
 *   is PARKED (at the porch on the `?level=house` page; WIDE across the
 *   cross-section on the front door, at a room's deck when a window is
 *   open); during a run it dwells where physics approved and walks the
 *   legs.
 * - TOURS: each room's window links its five rungs with the SAME
 *   `?level=<room>NN` addresses the level select writes — the campaign
 *   demoted to tours, never deleted. `?room=<id>` parks the menu camera
 *   at another window (presentation only — it enters no sim).
 */
import * as THREE from 'three';
import { World } from '../world/world.ts';
import { HOUSE, HOUSE_ID } from '../world/levels/house.level.ts';
import { houseLayout, type ParcelApproval, type FrameRoom } from '../world/house-frame.ts';
import { CUP_CAPTURE_FACTOR } from '../world/world.ts';
import { CAR } from '../physics/car.ts';
import { SIM_SCALE, FIXED_DT } from '../physics/sim.ts';
import { CAMPAIGN, dailyBoardId, levelUnlock } from '../world/campaign.ts';
import { getLevel } from '../world/levels/feeltrack.level.ts';
import type { Level } from '../world/level.ts';
import { GhostRace, parGhostRule, parGhostSurface, cachedGhostTrace } from './ghost.ts';
import {
  HouseCamera,
  menuPose,
  homePose,
  beatPullPose,
  type HousePose,
} from '../camera/house-camera.ts';
import { SET_TOKENS } from '../render/tokens.ts';
import { createCarRig, CAR_GROUND_LIFT, CAR_SPIN_DAMP } from '../render/car-rig.ts';
import { mountHouseSets, setHouseFace } from './house-sets.ts';
import { loadSave, defaultStorage } from '../save/save.ts';
import { reducedMotionActive } from '../ui/motion.ts';
import { recordHouseRun, readHouseBest, RECORDS_HONESTY, type HouseBest } from '../save/records.ts';
import { dailyLinkLine, dailySeed, utcDateKey } from '../save/daily.ts';
import { createLinesTab } from '../ui/levelselect.ts';
import { premiereWanted, markPremiereSeen } from './intro.ts';

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

// ---- the front door (build 2) — pure surfaces -------------------------------

/** THE WINDOW'S NAME — the accessible name of a room's window on the
 *  front door: `<room>, <n> rungs, toured|not toured yet[, n of m stars]`.
 *  "Toured" is the save's truth (any star earned in the room's rungs —
 *  the currency the tours are scored in), never a menu checkbox; the
 *  star count is the same folded number the farewell's tally prints. */
export function windowAriaName(label: string, rungs: number, stars: number, max: number): string {
  return stars > 0
    ? `${label.toLowerCase()}, ${rungs} rungs, toured, ${stars} of ${max} stars`
    : `${label.toLowerCase()}, ${rungs} rungs, not toured yet`;
}

/** THE SILL — what a toured room wears under its label: `★ 8/15`.
 *  Nothing earned, nothing worn (an unearned rung may not fake stars —
 *  the level select's law, inherited). */
export function windowSillLine(stars: number, max: number): string {
  return stars > 0 ? `\u2605 ${stars}/${max}` : '';
}

/** THE PREMISE BEAT, timed (the repurposed law-4 opening): PULL — the
 *  crane backs out of the kitchen window to the whole cross-section;
 *  ROLL — release, the car free-rolls one room (garage, @ ~1.4 s) and
 *  dies in the next (the kitchen crossing at ~3.2 s, then the crawl —
 *  measured on `HOUSE_BEAT_LEVEL`, deterministic sim, the same receipt
 *  every machine); STILL — one beat on the dead car before the chrome
 *  returns. A terminal status ends the roll early if physics ever
 *  does; the timeout is a bug net, never a schedule. */
export const HOUSE_BEAT = { pullS: 1.0, rollEndS: 4.5, stillS: 0.5, timeoutMs: 12000 } as const;

/** THE BEAT'S DATA (the input law honored by the letter): the house's own
 *  geometry with the wind switched OFF in the level data and one big
 *  legal launch push — gravity and friction do the rest, so the free-roll
 *  is a stepped `World` run of declared data, not an animation. It is a
 *  presentation surface: the beat records no best, prints no receipt,
 *  and no share link ever names this variant. */
export const HOUSE_BEAT_LEVEL: Level = {
  ...HOUSE,
  inputs: { windEvery: 0, windDeltaV: 0, launchSpeed: 1.3 },
};

export interface HouseState {
  status: string;
  hash: string;
  steps: number;
  time: number;
  rooms: { room: string; step: number; time: number }[];
  best: HouseBest | undefined;
  ghostEnabled: boolean;
}

export interface HousePageOptions {
  /** THE FRONT DOOR (build 2): the bare-route home screen. */
  home?: boolean;
}

const ROOM_IDS: readonly FrameRoom[] = ['garage', 'kitchen', 'bedroom', 'bathroom', 'garden', 'porch'];

export async function bootHouse(
  root: HTMLElement,
  params: URLSearchParams,
  opts: HousePageOptions = {},
): Promise<() => HouseState> {
  const home = opts.home === true;
  const layout = houseLayout();
  // THE BEAT AUDIENCE (`src/pages/intro.ts`, the law unchanged): the beat
  // plays on the bare home route only — a `?level=` page, a `launch=1`
  // rig, webdriver, `intro=off` and reduced motion are addressed or
  // excused landings. The class goes on BEFORE anything else renders so
  // the player never sees chrome for a frame.
  const wantBeat = home && !params.has('launch') && premiereWanted(params);
  if (wantBeat) root.classList.add('gw-premiere');

  root.innerHTML = '<h1>Gravity Works — the House</h1>';
  const nav = document.createElement('p');
  nav.id = 'gw-levels-nav';
  const navLink = document.createElement('a');
  navLink.href = '?levels=1';
  navLink.textContent = 'All levels';
  nav.appendChild(navLink);
  root.appendChild(nav);

  // THE CORNER CHROME (build 2 — "keep their corner chrome"): the daily
  // chip is the game page's own `#gw-daily-board` id and wording, riding
  // a link to today's board; the LINES corner opens the level select's
  // OWN lines panel (`createLinesTab` — one source for the rows, the
  // chain law's wording untouched).
  const todaySeed = dailySeed();
  const board = getLevel(dailyBoardId(todaySeed));
  const dailyChip = document.createElement('a');
  dailyChip.id = 'gw-daily-board';
  dailyChip.href = '?daily=1';
  dailyChip.textContent =
    `today’s board — ${board.name} · ${utcDateKey()} · ${dailyLinkLine(board.name, board.par.time)}`;
  root.appendChild(dailyChip);
  const linesCorner = document.createElement('button');
  linesCorner.id = 'gw-lines-corner';
  linesCorner.type = 'button';
  linesCorner.textContent = 'Lines';
  linesCorner.setAttribute('aria-expanded', 'false');
  linesCorner.setAttribute('aria-controls', 'gw-lines-corner-panel');
  const linesPanel = document.createElement('div');
  linesPanel.id = 'gw-lines-corner-panel';
  linesPanel.hidden = true;
  linesPanel.setAttribute('role', 'region');
  linesPanel.setAttribute('aria-label', 'Lines');
  linesCorner.addEventListener('click', () => {
    const open = linesPanel.hidden;
    linesPanel.hidden = !open;
    linesCorner.setAttribute('aria-expanded', String(open));
    if (open && linesPanel.childElementCount === 0) createLinesTab(linesPanel);
  });
  root.append(linesCorner, linesPanel);

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

  const save = loadSave(defaultStorage());
  const reduceMotion = reducedMotionActive(save.settings.reducedMotion);

  // ---- THE ROOM WINDOWS --------------------------------------------------
  // Non-home (`?level=house`): build 1's flow tours, exactly where the
  // downhill e2e reads them. Home (the front door): the tours live
  // INSIDE the six windows — a focusable button per room, its rung list
  // (the same builder, the same bytes) hidden until Enter opens it.
  function fillTourList(room: (typeof CAMPAIGN)[number], list: HTMLUListElement): void {
    for (const id of room.levelIds) {
      const item = document.createElement('li');
      const lock = levelUnlock(save.progress, id);
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
  }

  if (!home) {
    const tours = document.createElement('nav');
    tours.id = 'gw-house-tours';
    for (const room of CAMPAIGN) {
      const section = document.createElement('section');
      section.dataset.room = room.id;
      const heading = document.createElement('h2');
      heading.textContent = room.label; // the window's room, registry truth
      section.appendChild(heading);
      const list = document.createElement('ul');
      list.id = `gw-house-tours-${room.id}`;
      fillTourList(room, list);
      section.appendChild(list);
      tours.appendChild(section);
    }
    stage.appendChild(tours);
  }

  interface WindowEl {
    room: FrameRoom;
    el: HTMLElement;
    btn: HTMLButtonElement;
    list: HTMLUListElement;
  }
  const winEls: WindowEl[] = [];
  let openRoom: FrameRoom | null = null;
  if (home) {
    const windows = document.createElement('nav');
    windows.id = 'gw-house-windows';
    windows.setAttribute('aria-label', 'The house — six windows');
    stage.appendChild(windows);
    for (const room of CAMPAIGN) {
      const stars = room.levelIds.reduce(
        (sum, id) => sum + Math.min(3, Math.max(0, Math.trunc(save.progress.stars[id] ?? 0))),
        0,
      );
      const max = room.levelIds.length * 3;
      const section = document.createElement('section');
      section.className = 'gw-house-window';
      section.dataset.room = room.id;
      const btn = document.createElement('button');
      btn.id = `gw-house-window-${room.id}`;
      btn.type = 'button';
      btn.setAttribute('aria-expanded', 'false');
      btn.setAttribute('aria-controls', `gw-house-tours-${room.id}`);
      btn.setAttribute('aria-label', windowAriaName(room.label, room.levelIds.length, stars, max));
      const label = document.createElement('span');
      label.className = 'gw-window-room';
      label.textContent = room.label;
      btn.appendChild(label);
      const sill = document.createElement('span');
      sill.className = 'gw-window-sill';
      sill.textContent = windowSillLine(stars, max); // toured rooms wear their stars
      btn.appendChild(sill);
      const list = document.createElement('ul');
      list.id = `gw-house-tours-${room.id}`;
      list.hidden = true;
      fillTourList(room, list);
      section.append(btn, list);
      btn.addEventListener('click', () => openWindow(openRoom === room.id ? null : (room.id as FrameRoom)));
      windows.appendChild(section);
      winEls.push({ room: room.id as FrameRoom, el: section, btn, list });
    }
  }

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
  // THE ONE KEY casts (cause B): the sets' long soft shadows need the
  // map the harness always had and the house page never paid for.
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  const camera = new THREE.PerspectiveCamera(35, 960 / 540, 0.01, 400);

  // THE SETS ARE MOUNTED (Lane F1, the art note's cause A closed): the six
  // ratified sets at their decks, the dollhouse cut, the shelves, the
  // doorframes, the painted-wood table and the ONE warm key — a render
  // layer over the SAME world: no collider, no hashed body, the
  // `6caea49b` receipt byte-identical with or without this line.
  const houseSets = await mountHouseSets(scene, layout);
  // THE FACE: the cross-section wears the kitchen's token background (the
  // campaign shell reads its mounted set's `background`; six sets means
  // the house reads the room the crane is parked at — applyIdlePose).
  setHouseFace(scene, fog, home ? null : 'porch');

  // THE HERO CAR (the replay/share precedent): the ratified car-a rig
  // rides the pose the physics already reports; the World's red proxy box
  // retires at the door (hidden, its transforms still written, exactly
  // as the shell and the film path mount it — RENDER LAYER ONLY, the
  // wheel spin a render-side omega read off on-screen motion, never a
  // physics drive). Mounted per SCENE (the page's world; the beat gets
  // its own rig for its own world, disposed with the beat).
  function attachCarRig(w: World, target: THREE.Scene): { sync: (alpha: number) => void; dispose: () => void } {
    const rig = createCarRig(SET_TOKENS.kitchen);
    rig.setKeyLight(houseSets.key.color.getHex(), 1.3);
    const poseGroup = new THREE.Group();
    poseGroup.name = 'car-pose';
    poseGroup.add(rig.group);
    rig.group.position.y = -CAR_GROUND_LIFT;
    target.add(poseGroup);
    if (w.carMesh) w.carMesh.visible = false;
    let wheelAngle = 0;
    let prev = { ...w.state().car.pos };
    const sync = (alpha: number): void => {
      const a = Math.min(1, Math.max(0, alpha));
      const pose = w.carPose(a);
      // the hidden proxy keeps its transforms written (the shell's probe
      // law): the box is retired from the SCREEN, not from the graph
      if (w.carMesh) {
        w.carMesh.position.set(pose.pos.x, pose.pos.y, pose.pos.z);
        w.carMesh.quaternion.set(pose.quat.x, pose.quat.y, pose.quat.z, pose.quat.w);
      }
      poseGroup.position.set(pose.pos.x, pose.pos.y, pose.pos.z);
      poseGroup.quaternion.set(pose.quat.x, pose.quat.y, pose.quat.z, pose.quat.w);
      const travelled = Math.hypot(
        pose.pos.x - prev.x,
        pose.pos.y - prev.y,
        pose.pos.z - prev.z,
      );
      // cosmetic omega, arc length over (radius × SPIN_DAMP) — the same
      // class of read the share tape integrates, never a physics input
      wheelAngle += travelled / (rig.wheelRadius * CAR_SPIN_DAMP);
      for (const wheel of rig.wheels) wheel.rotation.z = wheelAngle;
      prev = { x: pose.pos.x, y: pose.pos.y, z: pose.pos.z };
    };
    sync(0);
    return { sync, dispose: () => rig.dispose() };
  }
  const pageCar = attachCarRig(world, scene);

  // the menu camera: the crane PARKED — at the porch on the addressed
  // house page, WIDE across the cross-section on the front door (or at
  // `?room=`'s window on either)
  const roomParam = params.get('room');
  const menuRoom: FrameRoom | null =
    roomParam !== null && (ROOM_IDS as readonly string[]).includes(roomParam)
      ? (roomParam as FrameRoom)
      : null;
  const houseCam = new HouseCamera(layout);
  // THE SOLIDS, HOUSE-WIDE (cause D): the six mounted sets' leaf boxes —
  // the eye stops floating inside the rooms it is meant to be looking at.
  houseCam.setSolids(houseSets.solids);
  const parked: HousePose = menuRoom ? menuPose(layout, menuRoom) : menuPose(layout, 'porch');
  const homePoseLayout = homePose(layout, 35, 960 / 540);
  let poseTarget: HousePose = home ? (menuRoom ? menuPose(layout, menuRoom) : homePoseLayout) : parked;
  camera.position.set(poseTarget.eye[0], poseTarget.eye[1], poseTarget.eye[2]);
  camera.lookAt(poseTarget.target[0], poseTarget.target[1], poseTarget.target[2]);

  /** Open (or close, with null) a window: the camera parks AT the room —
   *  the `?room=` gesture, presentation only, no force enters the sim —
   *  and its tour list lands under it. One open window at a time: the
   *  house is one place, the menu points at one room. */
  function openWindow(room: FrameRoom | null): void {
    openRoom = room;
    for (const w of winEls) {
      const open = w.room === room;
      w.list.hidden = !open;
      w.btn.setAttribute('aria-expanded', String(open));
    }
    poseTarget = room ? menuPose(layout, room) : homePoseLayout;
    applyIdlePose();
  }

  function applyIdlePose(): void {
    if (!home) return;
    camera.position.set(poseTarget.eye[0], poseTarget.eye[1], poseTarget.eye[2]);
    camera.lookAt(poseTarget.target[0], poseTarget.target[1], poseTarget.target[2]);
    if (fog) fog.density = poseTarget.fog;
    setHouseFace(scene, fog, openRoom); // a parked crane wears its room's face
    placeWindows();
  }

  const proj = new THREE.Vector3();
  /** The windows sit where the decks ARE, projected through the parked
   *  crane — the cross-section wears its menu, not a legend. px offsets
   *  read the CANVAS box inside the stage (the canvas centers itself when
   *  the window is narrower; percentages of the stage would drift). */
  function placeWindows(): void {
    if (!home) return;
    camera.updateMatrixWorld();
    const stageBox = stage.getBoundingClientRect();
    const canvasBox = canvas.getBoundingClientRect();
    for (const w of winEls) {
      const deck = layout.decks.find((d) => d.room === w.room)!;
      proj.set(deck.center[0], deck.center[1] + 0.015, deck.center[2]).project(camera);
      w.el.style.left = `${canvasBox.left - stageBox.left + (proj.x * 0.5 + 0.5) * canvasBox.width}px`;
      w.el.style.top = `${canvasBox.top - stageBox.top + (-proj.y * 0.5 + 0.5) * canvasBox.height}px`;
    }
  }
  if (home && menuRoom) {
    // an opened-by-address landing: the window the deep-link names is open
    openWindow(menuRoom);
  }

  // ---- the par ghost: afterlife default (ON unless reduced motion says
  // so or the player's stored choice says otherwise — the SAME rule the
  // sandboxes race, no new setting) --------------------------------------
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
    if (home) {
      // the front door returns: the windows over the cross-section again
      for (const w of winEls) w.el.hidden = false;
      applyIdlePose();
    }
  }

  function launchRun(): void {
    approvals.length = 0;
    seen.clear();
    resultLine.textContent = '';
    if (home) for (const w of winEls) w.el.hidden = true; // the run owns the screen
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

  // ---- THE PREMISE BEAT (build 2's repurposed opening) ------------------
  // A SECOND stepped World over `HOUSE_BEAT_LEVEL` (the wind off in the
  // data, one legal launch push) on its own scene, driven by the same
  // fixed-step loop, and disposed at the beat's end — the page's real
  // world is never launched by a beat nobody recoded. The camera is all
  // shipped grammar: `beatPullPose` (kitchen window → wide) then the run
  // plan over `roomGraph`. Any press skips (swallowed, the premiere's
  // law); the seen flag is the SAME `gravity-works.premiere.seen`.
  interface BeatRuntime {
    world: World;
    cam: HouseCamera;
    seenRooms: Set<string>;
    phase: 'pull' | 'roll' | 'still';
    t0: number;
    prev: number;
    acc: number;
    stillAt: number;
    timer: number;
    active: boolean;
  }
  let beat: BeatRuntime | null = null;
  let beatScene: THREE.Scene | null = null;
  let beatCar: { sync: (alpha: number) => void; dispose: () => void } | null = null;
  const beatSkip: Array<[string, EventListener]> = [];
  if (wantBeat) {
    const beatWorld = await World.create(HOUSE_BEAT_LEVEL, HOUSE.parBuild(), { visuals: true });
    beatScene = beatWorld.scene!;
    beatScene.background = new THREE.Color('#efe0c8');
    beatScene.fog = fog; // the SAME haze object the run plan breathes
    const bTable = beatScene.getObjectByName('table');
    if (bTable instanceof THREE.Mesh) {
      bTable.scale.set((layout.floor.half[0] * 2) / 6, (layout.floor.half[2] * 2) / 6, 1);
    }
    // THE SETS ARE MOUNTED for the beat too — the premise beat is the
    // journalist's first screenshot and it wears the same world (fresh
    // instances: `beat.world.dispose()` frees them with its own scene).
    const beatSets = await mountHouseSets(beatScene, layout);
    setHouseFace(beatScene, fog, null);
    beatCar = attachCarRig(beatWorld, beatScene);
    beat = {
      world: beatWorld,
      cam: new HouseCamera(layout),
      seenRooms: new Set<string>(),
      phase: 'pull',
      t0: performance.now(),
      prev: performance.now(),
      acc: 0,
      stillAt: 0,
      timer: window.setTimeout(() => endBeat(), HOUSE_BEAT.timeoutMs),
      active: true,
    };
    beat.cam.setSolids(beatSets.solids);
    const skip: EventListener = (ev: Event) => {
      ev.stopPropagation(); // the dismissing gesture belongs to the beat alone
      endBeat();
    };
    beatSkip.push(['pointerdown', skip], ['keydown', skip]);
    for (const [type, fn] of beatSkip) window.addEventListener(type, fn, true);
  }

  function endBeat(): void {
    if (!beat?.active) return;
    beat.active = false;
    clearTimeout(beat.timer);
    for (const [type, fn] of beatSkip) window.removeEventListener(type, fn, true);
    root.classList.remove('gw-premiere');
    markPremiereSeen(); // ONE flag, one source (intro.ts owns the key)
    beat.world.dispose(); // the beat's world is presentation: freed, never recorded
    beatCar?.dispose(); // its rig too — the page's rig rides the page's world
    beatCar = null;
    beat = null;
    beatScene = null;
    applyIdlePose();
    renderer.render(scene, camera);
  }

  function stepBeat(now: number): void {
    if (!beat?.active) return;
    const dt = Math.min(0.25, (now - beat.prev) / 1000);
    beat.prev = now;
    const el = (now - beat.t0) / 1000;
    if (beat.phase === 'pull') {
      const p = beatPullPose(layout, el, HOUSE_BEAT.pullS, 35, 960 / 540);
      camera.position.set(p.eye[0], p.eye[1], p.eye[2]);
      camera.lookAt(p.target[0], p.target[1], p.target[2]);
      fog.density = p.fog; // the build-view breath rides the pull in
      if (el >= HOUSE_BEAT.pullS) {
        beat.phase = 'roll';
        beat.acc = 0;
        beat.world.launch();
        beat.cam.approved('garage', 0); // the eye starts where the car is
      }
      return;
    }
    if (beat.phase === 'roll') {
      const w = beat.world;
      // the SAME fixed-step law the page runs by — the beat is a stepped
      // world, never a catch-up teleport through the sim
      beat.acc += dt;
      while (beat.acc >= FIXED_DT && w.status === 'running') {
        w.step();
        const s = w.state();
        for (const p of HOUSE.parcels) {
          if (beat.seenRooms.has(p.room)) continue;
          const d2 =
            (s.car.pos.x - p.center[0]) ** 2 +
            (s.car.pos.y - p.center[1]) ** 2 +
            (s.car.pos.z - p.center[2]) ** 2;
          if (d2 < capR2(p.radius)) {
            beat.seenRooms.add(p.room);
            beat.cam.approved(p.room as FrameRoom, w.time);
          }
        }
        beat.acc -= FIXED_DT;
      }
      beat.cam.apply(camera, w.time, fog);
      beatCar?.sync(beat.acc / FIXED_DT);
      if (w.status !== 'running' || w.time >= HOUSE_BEAT.rollEndS) {
        beat.phase = 'still';
        beat.stillAt = now;
      }
      return;
    }
    if (now - beat.stillAt >= HOUSE_BEAT.stillS * 1000) endBeat();
  }

  let last = performance.now();
  let accum = 0;
  let ended = false;
  function frame(now: number): void {
    if (ended) return;
    if (!document.hidden) {
      if (beat?.active) {
        stepBeat(now);
        renderer.render(beatScene ?? scene, camera);
        requestAnimationFrame(frame);
        return;
      }
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
        pageCar.sync(accum / FIXED_DT); // the sedan rides the same poses
      } else if (home) {
        applyIdlePose(); // the parked crane and its windows, kept aligned
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

  if (params.get('launch') === '1' && !wantBeat) launchRun();

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
    home ? poseTarget : world.status === 'idle' && world.stepCount === 0 ? parked : houseCam.pose(world.time);
  requestAnimationFrame(frame);
  return state;
}
