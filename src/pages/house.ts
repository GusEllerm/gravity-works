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
import { encodeShareUrl, type SharePayload } from '../share/share.ts';
import { rememberLink } from '../share/chain.ts';
import { premiereWanted, markPremiereSeen } from './intro.ts';
import { mountSound } from '../sound/mount.ts';
import { upAxisYOfQuat } from '../sound/sound.ts';
import type { SoundEngine } from '../sound/sound.ts';

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
  // THE DOOR'S FACE (h4, truth 2): the home boot marks the root so the
  // corner chrome obeys the DISJOINT-RECT LAW AT THE DOOR — the daily
  // chip rides a flow line below the nav instead of painting over the
  // wordmark at the compact heights (`ui/shell.css`).
  if (home) root.classList.add('gw-home');
  // THE SKIP EARLY (Lane F1 honesty): the class goes on BEFORE the mounted
  // boot, so the dismissing gesture must be LISTENING from the same tick —
  // a key pressed while the two worlds mount skips the beat the moment
  // they finish, exactly as it skipped it instantly when boot was cheap.
  let beat: BeatRuntime | null = null;
  let beatScene: THREE.Scene | null = null;
  let beatCar: { sync: (alpha: number) => void; dispose: () => void } | null = null;
  const beatSkip: Array<[string, EventListener]> = [];
  let beatSkipRequested = false;
  if (wantBeat) {
    const skip: EventListener = (ev: Event) => {
      ev.stopPropagation(); // the dismissing gesture belongs to the beat alone
      // THE SWALLOW, FINISHED HONEST (h4): the beat swallows the FIRST
      // gesture — that is the premiere law `src/pages/intro.ts` states —
      // but the swallow must not COST the door its audio. The gesture is
      // still live HERE, and it is exactly what `endBeat('skip')` records
      // (the `skip` verdict IS the gesture fact): the engine, which cannot
      // exist during the beat, is unlocked AFTER it from this handler
      // stack — the autoplay policy trusts this exact one.
      if (beat) endBeat('skip');
      else beatSkipRequested = true;
    };
    beatSkip.push(['pointerdown', skip], ['keydown', skip]);
    for (const [type, fn] of beatSkip) window.addEventListener(type, fn, true);
  }

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
  // THE SIX FREE BUILDS AT THE DOOR (h4, loop-four truth 7: "Home carries
  // exactly three anchors … ZERO sandbox links — free is two hops"). The
  // six doors' free-build siblings ride the door's own flow line: one hop
  // from `/`, named in the Tab walk, in the descent order the windows walk
  // (garage first). Nav data only — the shipped `?level=<room>-sandbox`
  // addresses the level select already writes.
  const doorRooms = ROOM_IDS.map((id) => CAMPAIGN.find((r) => r.id === id)!);
  if (home) {
    const freeRow = document.createElement('p');
    freeRow.id = 'gw-home-sandboxes';
    freeRow.textContent = 'free builds: ';
    doorRooms.forEach((room, i) => {
      if (i > 0) freeRow.append(' \u00B7 ');
      const a = document.createElement('a');
      a.id = `gw-home-sandbox-${room.id}`;
      a.href = `?level=${room.sandboxId}`;
      a.textContent = `${room.label.toLowerCase()} free build`;
      freeRow.appendChild(a);
    });
    root.appendChild(freeRow);
  }
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
  // THE TRAILER VERB (h4, loop-four truth 7: the door's own run was the
  // only run in the game that could not leave the laptop). NOTHING new
  // rides the payload: the INPUT law means the RECEIPT already commits
  // every force (the wind is step-keyed LEVEL data, and the link names
  // the level), so the share is the tape the run already was — (levelId,
  // build, seed, hash) in the v2 envelope the chain law stamps on every
  // new write, the registry name as the honest fallback name. The button
  // waits for a terminal edge (there is no run to share while one runs).
  const shareBtn = document.createElement('button');
  shareBtn.id = 'gw-house-share';
  shareBtn.type = 'button';
  shareBtn.textContent = 'Share this run';
  shareBtn.hidden = true;
  const shareRow = document.createElement('p');
  shareRow.id = 'gw-house-share-row';
  shareRow.hidden = true;
  const shareUrl = document.createElement('input');
  shareUrl.id = 'gw-house-share-url';
  shareUrl.type = 'text';
  shareUrl.readOnly = true;
  shareUrl.setAttribute('aria-label', 'Share link — copy to send to a friend');
  shareRow.appendChild(shareUrl);
  host.append(launch, statusLine, resultLine, bestLine, shareBtn, shareRow, hashDetails);
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
    windows.setAttribute('aria-label', 'The house — six windows');
    windows.id = 'gw-house-windows';
    stage.appendChild(windows);
    // THE TAB WALK WALKS DOWNHILL (h4, loop-four truth 5): the windows are
    // emitted in the DESCENT order (`ROOM_IDS` — garage first, the first
    // room down and visually first), not the CAMPAIGN projection order
    // that parked garage fifth. Nav order only — every room's data, name,
    // sill and tour bytes come from the SAME CAMPAIGN rows, unchanged.
    for (const room of doorRooms) {
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
    // the campaign table is a 6 m plane at the ORIGIN; the house slab is
    // the frame's platter — scale alone left it centred on x = 0, half of
    // it off-frame west of the garage (the section's platter wears the
    // floor's own centre, the collider already does)
    table.position.x = layout.floor.center[0];
    table.position.z = layout.floor.center[2];
  }

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio ?? 1));
  renderer.setSize(960, 540, false);
  // THE ONE KEY casts (cause B): the sets' long soft shadows need the
  // map the harness always had and the house page never paid for.
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  // THE DRESSING DEPTH CUT (the perf law stated): the sets are STATIC, so
  // the shadow map is rendered ONCE and held — the one dynamic subject
  // that loses its cast is the car itself (the toon bands keep it lit; the
  // campaign shell never had cast shadows at all). Per-frame shadow passes
  // on the section doubled the software-GL cost and blew the specs'
  // honest budgets; a static-set shadow is the dollhouse's own grammar.
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
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

  // ---- SOUND AT THE DOOR (h4, Lane F2 — THE SOUND LAW: every boot route
  // wires the engine or the game is silent at its own door) -------------
  // The player verdict's truth 1: the door-swap moved the front page out
  // of `bootGame`, and the SOUND block lived only inside `bootGame` — the
  // house was LITERALLY silent. The page wiring (engine, gesture unlock,
  // visibility pause, the `#gw-sound` chip, the e2e seams) now lives in
  // `src/sound/mount.ts`, which BOTH routes mount; what the page adds are
  // the EVENTS, which are exactly the sound module's existing event map:
  // the launch voice, the roll (a read-only `frame` sink at the foot of
  // the render loop — the same two facts the screen already renders),
  // the ROOM BEDS and roll surfaces that follow the crane — parked at a
  // window, dwelling where physics approved, parcel crossing by parcel
  // crossing — and the terminal edge (`finishRun`, the outcome fields
  // only). THE FIREWALL STANDS: nothing in `src/sound` reaches for the
  // sim, transitively (the unit test mutates to prove it); the page feeds
  // the engine, never the reverse.
  // THE BEAT stays silent BY CONSTRUCTION: on the beat path the engine
  // does not EXIST until `endBeat` mounts it — the beat's skip listener
  // swallows the first gesture (`src/pages/intro.ts` documents the
  // swallow), so endBeat replays that swallowed gesture into `unlock()`
  // inside the still-live event: the beat unlocks AFTER itself.
  let sound: SoundEngine | null = null;
  /** The room the PARKED crane listens from: a deep-linked window, else
   *  the kitchen (the front door's own room) on the home route, the porch
   *  (build 1's parked eye) on the addressed house page. */
  const idleBed: string = menuRoom ?? (home ? 'kitchen' : 'porch');
  function mountTheDoorSound(viaGesture: boolean): void {
    if (sound) return; // ONE engine, ONE unlock — no double-unlock, ever
    sound = mountSound({ root, setId: idleBed });
    if (viaGesture) sound.unlock(); // the beat's swallowed gesture, replayed
  }
  if (!wantBeat) mountTheDoorSound(false);

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
    // the bed follows the parked eye (idle only — a RUNNING run owns its
    // beds, parcel crossing by parcel crossing, below)
    if (world.status === 'idle') {
      sound?.setBed(room ?? idleBed);
      sound?.setSurface(room ?? idleBed);
    }
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

  // ESCAPE CLOSES WHAT THE DOOR OPENED (h4, loop-four truth 5: "Escape
  // still closes NOTHING at the door"). The same verb the way-back link
  // speaks on the OTHER pages (`mountHomeDoor`) has work to do HERE: the
  // door has panels. The open window closes (the camera unparks, the tour
  // list lifts) and focus returns to the window that opened it; with no
  // window open, the Lines corner closes onto its own button. Nothing
  // else on this page claims Escape — there is no camera chord here and
  // no panel during a run — so the key is free wherever a panel is up.
  if (home) {
    window.addEventListener('keydown', (ev) => {
      if (ev.key !== 'Escape' || ev.defaultPrevented) return;
      if (world.status === 'running') return;
      if (openRoom !== null) {
        const room = openRoom;
        openWindow(null);
        winEls.find((w) => w.room === room)?.btn.focus();
        ev.preventDefault();
      } else if (!linesPanel.hidden) {
        linesPanel.hidden = true;
        linesCorner.setAttribute('aria-expanded', 'false');
        linesCorner.focus();
        ev.preventDefault();
      }
    });
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
  /** The last run's terminal hash — the "same film" truth of a re-release
   *  (the seating law, spoken): identical bytes, said honestly. */
  let lastRunHash: string | null = null;

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
        // the ROOM BED switches at the crossing — the eye and the ear
        // move together down the house (the sound module's event map,
        // finally called by the page that always knew about crossings)
        sound?.setBed(ev.room);
        sound?.setSurface(ev.room);
        statusLine.textContent = houseStatusLine(approvals.length, world.time);
      }
    }
  }

  function finalize(): void {
    // THE TERMINAL STALL BRANCH (the spike's approval law, per parcel):
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
    const runHash = world.hashHex();
    // ONE RUN PRINTS ONE VERDICT (h4, loop-four truth 6 — the door's tape
    // contradicted itself: "4 rooms · 3.7 s" printed above "4 rooms ·
    // 6.7 s — you stopped at the bathroom", BOTH `role=status`, because
    // the live counter never retired). The result line IS the verdict;
    // the status line is RETIRED — its `role` lifted, so the one live
    // status after a run is the result line alone (the frozen clock is
    // not a live region). A re-release rides the SAME tape (the seating
    // law), and the retired line says so honestly: "same film".
    const sameFilm = lastRunHash !== null && lastRunHash === runHash;
    lastRunHash = runHash;
    statusLine.removeAttribute('role');
    statusLine.textContent = sameFilm ? 'same film — this release replayed the same tape' : '';
    hashValue.textContent = runHash;
    shareBtn.hidden = false; // the trailer verb waits for a terminal edge
    ghost.park();
    // THE TERMINAL EDGE (the sound event map's run outcome, stated once):
    // exactly the fields the result bar prints — rooms decide, the clock
    // ties-breaks, and the victory arpeggio is PROGRESS (minted/beat),
    // never repetition. The bed returns to the parked eye's room.
    sound?.finishRun({
      status:
        world.status === 'finished' || world.status === 'fell' || world.status === 'timeout'
          ? world.status
          : 'stalled',
      stars: 0, // rooms, not stars, are the house's currency
      newBest: outcome.outcome === 'minted' || outcome.outcome === 'beat',
      hazardsTouched: 0,
    });
    sound?.setBed(openRoom ?? idleBed);
    sound?.setSurface(openRoom ?? idleBed);
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
    // the live counter is RE-ARMED for this run (retired again at the
    // next terminal edge) — the status line is live only while a run is
    // on the table; the share verb steps aside until the run ends
    statusLine.setAttribute('role', 'status');
    statusLine.textContent = houseStatusLine(0, 0);
    shareBtn.hidden = true;
    shareRow.hidden = true;
    if (home) for (const w of winEls) w.el.hidden = true; // the run owns the screen
    world.launch();
    launchStep = world.stepCount;
    houseCam.reset();
    houseCam.approved('garage', 0); // the launch deck is where the eye is
    // the launch voice and the roll, opening on the garage deck — the
    // same hook shape `bootGame` fires at its Launch button
    sound?.voice('launch');
    sound?.beginRun();
    sound?.setBed('garage');
    sound?.setSurface('garage');
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

  // THE SHARE PRESS (the trailer verb): the payload is the tape the run
  // already carries — the reference build and the hash the page just
  // printed, in a v2 envelope, NOTHING added (`encodeShareUrl` stamps
  // `"v":2`; the wind needs no field because the link names the level
  // and the INPUT law put the wind IN the level). A link this device
  // publishes is a link it walked — the chain walk records it, and the
  // visible input is the copy fallback that never fails (`runEnd` law).
  shareBtn.addEventListener('click', () => {
    if (world.status === 'running' || world.stepCount === 0) return;
    shareBtn.disabled = true;
    shareBtn.textContent = 'making link…';
    const payload: SharePayload = {
      v: 2,
      levelId: HOUSE_ID,
      seed: HOUSE.parBuild().seed,
      hash: world.hashHex(),
      build: HOUSE.parBuild(),
      name: HOUSE.name.slice(0, 48),
    };
    void encodeShareUrl(payload).then(
      (frag) => {
        const url = `${window.location.origin}${window.location.pathname}${frag}`;
        shareUrl.value = url;
        shareRow.hidden = false;
        rememberLink(payload);
        shareBtn.disabled = false;
        shareBtn.textContent = 'Share this run';
        void navigator.clipboard?.writeText(url).catch(() => {
          /* the visible link is the fallback that never fails */
        });
      },
      () => {
        shareBtn.disabled = false;
        shareBtn.textContent = 'this browser could not build the link';
      },
    );
  });

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
  // THE BEAT'S OWN WITNESS (Lane F1): how the beat ended and the phases it
  // walked — the e2e law (“ends by itself on the dead car”) is a CLAIM
  // ABOUT THE PLAN, not a stopwatch, so the specs read the seam, not the
  // wall (frame pacing under a loaded runner is not the law)
  const beatPhases: string[] = ['pull'];
  let beatEnd: { endedBy: 'still' | 'timeout' | 'skip'; phases: string[] } | null = null;
  if (wantBeat) {
    const beatWorld = await World.create(HOUSE_BEAT_LEVEL, HOUSE.parBuild(), { visuals: true });
    beatScene = beatWorld.scene!;
    beatScene.background = new THREE.Color('#efe0c8');
    beatScene.fog = fog; // the SAME haze object the run plan breathes
    const bTable = beatScene.getObjectByName('table');
    if (bTable instanceof THREE.Mesh) {
      bTable.scale.set((layout.floor.half[0] * 2) / 6, (layout.floor.half[2] * 2) / 6, 1);
      bTable.position.x = layout.floor.center[0];
      bTable.position.z = layout.floor.center[2];
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
      timer: window.setTimeout(() => endBeat('timeout'), HOUSE_BEAT.timeoutMs),
      active: true,
    };
    beat.cam.setSolids(beatSets.solids);
    if (beatSkipRequested) endBeat('skip'); // a press DURING the mounted boot
  }

  function endBeat(endedBy: 'still' | 'timeout' | 'skip' = 'skip'): void {
    if (!beat?.active) return;
    beat.active = false;
    beatEnd = { endedBy, phases: [...beatPhases] };
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
    // THE DOOR OPENS AFTER THE FILM (h4): a beat ended by the player's own
    // gesture (`skip` IS the gesture fact) replays that live gesture into
    // the unlock path; a beat that ended by itself unlocks normally, and
    // the engine NEVER existed while the film ran.
    mountTheDoorSound(endedBy === 'skip');
    renderer.shadowMap.needsUpdate = true; // the page's OWN static map, re-baked once
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
        beatPhases.push('roll');
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
        beatPhases.push('still');
        beat.stillAt = now;
      }
      return;
    }
    if (now - beat.stillAt >= HOUSE_BEAT.stillS * 1000) endBeat('still');
  }

  let last = performance.now();
  let accum = 0;
  let ended = false;
  let beatSceneFirst = true; // the beat scene's once-baked static shadow map
  // THE ROLL VOICE'S TWO FACTS (the same READ-ONLY pair `bootGame` feeds):
  // the car's on-screen speed (position delta over wall dt, throttled to
  // <=20 Hz by the engine) and how visibly inverted it is. The engine
  // pulls NOTHING from the world.
  let prevCarSoundPos: { x: number; y: number; z: number } | null = null;
  let prevCarSoundAt = 0;
  function soundFrame(now: number): void {
    if (!sound || world.status === 'idle') return;
    const s = world.state();
    const dtS = (now - prevCarSoundAt) / 1000;
    let screenSpeed = 0;
    if (prevCarSoundPos && dtS > 0.001) {
      const dx = s.car.pos.x - prevCarSoundPos.x;
      const dy = s.car.pos.y - prevCarSoundPos.y;
      const dz = s.car.pos.z - prevCarSoundPos.z;
      screenSpeed = Math.sqrt(dx * dx + dy * dy + dz * dz) / dtS;
    }
    prevCarSoundPos = { x: s.car.pos.x, y: s.car.pos.y, z: s.car.pos.z };
    prevCarSoundAt = now;
    sound.frame({
      dtMs: dtS * 1000,
      running: world.status === 'running',
      screenSpeed,
      upY: upAxisYOfQuat(s.car.quat),
    });
  }
  function frame(now: number): void {
    if (ended) return;
    if (!document.hidden) {
      if (beat?.active) {
        stepBeat(now);
        if (beatSceneFirst) {
          // the beat's static shadow map bakes on its first frame
          renderer.shadowMap.needsUpdate = true;
          beatSceneFirst = false;
        }
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
      // A STEP DEBT ONLY EXISTS WHILE THERE IS A RUN TO OWE IT TO (h4, the
      // fast-forward fix): an idle page accrues wall time in `accum` the
      // stepping loop can never spend, so a run launched after minutes of
      // parked crane would TELEPORT — hundreds of fixed steps in the first
      // frame, parcel crossings swallowed whole, the result bar answering
      // for a run nobody could watch. `World.launch` starts a run "from
      // second zero"; the page clock now agrees with the sim.
      if (world.status !== 'running') accum = 0;
      if (sound) soundFrame(now); // READ-ONLY sink, outside the stepping block
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
  (window as unknown as Record<string, unknown>).__gwHouseScene = () => scene; // the render-layer probe seam (visuals-only debugging, same family as the pose seam below)
  (window as unknown as Record<string, unknown>).__gwHouseBeat = () =>
    beat ? { phase: beat.phase, phases: [...beatPhases], endedBy: null } : beatEnd;
  (window as unknown as Record<string, unknown>).__gwHouseCameraPose = () =>
    home ? poseTarget : world.status === 'idle' && world.stepCount === 0 ? parked : houseCam.pose(world.time);
  requestAnimationFrame(frame);
  return state;
}
