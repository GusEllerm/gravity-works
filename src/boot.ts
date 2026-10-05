/**
 * The browser game shell (stage 2: plain materials, no styled UI). One call,
 * `boot(root)`, and either of two pages:
 *
 * - The game: the level's placeholder build reified into a `World`, a fixed
 *   timestep loop (never a variable step) with renderer interpolation —
 *   the renderer reads only the last two `state()` snapshots and the leftover
 *   fraction as alpha — plus the builder tray. Launch re-launches the run
 *   where it stands; editing the build rebuilds the world.
 * - A shared run: if the URL fragment carries a share payload (`#s=…`), the
 *   page replays it headlessly through `src/replay`, compares the recomputed
 *   hash to the embedded one and prints `verified` or `mismatch`. No camera,
 *   no canvas — the hash is the page.
 *
 * `?harness=1` is routed elsewhere (`src/main.ts`); nothing here runs then.
 */
import * as THREE from 'three';
import { FIXED_DT, SIM_SCALE } from './physics/sim.ts';
import { getLevel } from './world/levels/feeltrack.level.ts';
import { KITCHEN01, KITCHEN01_ID } from './world/levels/kitchen01.level.ts';
import { KITCHEN02, KITCHEN02_ID } from './world/levels/kitchen02.level.ts';
import { KITCHEN03, KITCHEN03_ID } from './world/levels/kitchen03.level.ts';
import { KITCHEN04, KITCHEN04_ID } from './world/levels/kitchen04.level.ts';
import { KITCHEN05, KITCHEN05_ID, KITCHEN_SANDBOX } from './world/levels/kitchen05.level.ts';
import { World, type RunStatus } from './world/world.ts';
import type { Build } from './track/build.ts';
import { PIECES } from './track/pieces.ts';
import { fitSocket } from './track/snap.ts';
import { transformSocket } from './track/socket.ts';
import type { Level } from './world/level.ts';
import { createBuilder } from './ui/builder.ts';
import { parseShareUrl } from './share/share.ts';
import { replayRun } from './replay/replay.ts';
import { loadSave, rememberBuild } from './save/save.ts';
import { SET_TOKENS } from './render/tokens.ts';
import type { PostStack } from './render/post/index.ts';
import { parFor, starsFor, type RunOutcome, type RunResult } from './world/stars.ts';
import { createResultPanel, createRunRecorder, resultModel } from './ui/result.ts';
import { createHelpDrawer } from './ui/help.ts';
import { firstSight } from './ui/callouts.ts';
import { downloadBlob, generateShareCard } from './share/card.ts';
import { SETS, isRegisteredSet, type SetRegistration } from './sets/index.ts';
import type { SetInstance } from './sets/index.ts';
import { placeSet } from './world/setPlacement.ts';
import { KitRig } from './feel/kittrack.ts';
import { RunCamera } from './camera/run-camera.ts';
import type { RunCameraSolid } from './camera/run-camera.ts';
import type { PieceKind, PieceParams } from './track/pieces.ts';

// Level registry ids reachable through ?level= (importing each file is what
// registers it; the feel track stays addressable for the stage-2 specs).
void [KITCHEN01, KITCHEN02, KITCHEN03, KITCHEN04, KITCHEN05, KITCHEN_SANDBOX];

/** The set a level declares (`KitchenLevel.set` / any set-carrying level),
 *  structurally — the boot must not depend on the level modules' types to
 *  decide what to mount. It must also name a registered set: an unknown id
 *  mounts nothing (the pre-stage-3 empty-space render), never a wrong set. */
function levelSet(level: Level): string | null {
  const set = (level as { set?: string }).set;
  return typeof set === 'string' && isRegisteredSet(set) ? set : null;
}

/** The named solid props of a built kitchen set as world-space AABBs — the
 *  builder's placement-guard input (cheap: boxes, never mesh tests). Films
 *  and the counter floor are excluded: a wet patch must never block a piece,
 *  and the deck the track rides on is not an obstacle. */
export function setPlacementGuard(group: THREE.Group): THREE.Box3[] {
  return collectSetBoxes(group, false);
}

/** The same boxes at LEAF-MESH granularity — the run camera's input (stage 3
 *  "beige wall"). A named group's single AABB is the right placement
 *  contract ("no piece inside the tap") but too crude for a flypast: the
 *  TAP group's box spans column→spout-tip as one solid slab, and its
 *  bottom face cuts right through the sink lane the deck legally runs
 *  under — the camera would crane over a spout the car passes cleanly
 *  beneath. Leaf boxes are the actual solids: the column beside the lane,
 *  the spout above it, none of them on the corridor. */
export function setCameraSolids(group: THREE.Group): THREE.Box3[] {
  return collectSetBoxes(group, true);
}

function collectSetBoxes(group: THREE.Group, leaves: boolean): THREE.Box3[] {
  const boxes: THREE.Box3[] = [];
  // Box3.setFromObject does not refresh PARENT matrices — a freshly repositioned
  // mount would otherwise box the props at their UNPLACED coordinates
  group.updateMatrixWorld(true);
  // The guard collects from the set's `dress` group by NAMING CONVENTION
  // (src/sets/index.ts §SetInstance): `counter`/`shell` are the floor/wall
  // surfaces outside the dress, `wet-patch-films` and anything named *film*
  // are never solids.
  const skip = new Set(['counter', 'shell', 'wet-patch-films']);
  const collect = (root: THREE.Object3D): void => {
    for (const child of root.children) {
      if (child.name.includes('film') || skip.has(child.name)) continue;
      const namedSolid =
        child.children.length === 0 || child.name === 'book-stack' || child.name === 'tap';
      if (leaves ? child.children.length === 0 : namedSolid) {
        boxes.push(new THREE.Box3().setFromObject(child));
        continue;
      }
      collect(child);
    }
  };
  const dress = group.getObjectByName('dress');
  if (dress) collect(dress);
  return boxes;
}

/** The level the game boots: ?level=<id> for anything registered, KITCHEN 01
 *  by default (the ladder's first rung; the feel track remains reachable as
 *  ?level=feeltrack for the stage-2 specs). */
export function resolveLevel(params: URLSearchParams): Level {
  const id = params.get('level');
  if (!id) return KITCHEN01;
  try {
    return getLevel(id);
  } catch {
    return KITCHEN01; // an unknown id is the default level, not a dead page
  }
}

/** The level's tray map when it declares one (a `KitchenLevel` seam; the
 *  contract `Level` has no tray, so the builder treats undefined as
 *  everything-unlocked). Read structurally, like `levelSet`. */
function levelTray(level: Level): Partial<Record<PieceKind, number>> | undefined {
  const tray = (level as { tray?: Partial<Record<PieceKind, number>> }).tray;
  return tray && typeof tray === 'object' ? tray : undefined;
}

/** The ladder, in order — the order `Next level` walks. Levels outside it
 *  (the sandbox, the feel rig) are reachable by `?level=` but are nobody's
 *  "next". */
export const LADDER: readonly string[] = [KITCHEN01_ID, KITCHEN02_ID, KITCHEN03_ID, KITCHEN04_ID, KITCHEN05_ID];

/** The next rung after `id`, or null (last rung / not on the ladder). */
export function nextLevelId(id: string): string | null {
  const i = LADDER.indexOf(id);
  return i >= 0 && i < LADDER.length - 1 ? LADDER[i + 1]! : null;
}

/** Geometry of the tray pieces: the LEVEL's tuned parameters per kind,
 *  taken from that kind's FIRST placement in the par build (the kitchen
 *  authoring kit's per-instance params, Concepts/Levels). A tray button that
 *  placed kit DEFAULTS would build a different gap than the one the level
 *  was par'd on. ONE geometry per kind is the tray's whole contract — the
 *  builder ghosts and seats a held kind with these params — so a level that
 *  uses one kind with two parameter sets has a par build NO tray can place
 *  (`trayParityBuild` is the probe, `tests/unit/kitchen-levels.test.ts` the
 *  gate). Exported for that parity probe. */
export function levelTrayParams(
  level: Level,
  tray: Partial<Record<PieceKind, number>>,
): Partial<Record<PieceKind, PieceParams>> | undefined {
  const declared = (level as unknown as { trayParams?: Partial<Record<PieceKind, PieceParams>> }).trayParams;
  const parBuild = (level as unknown as { parBuild?: () => Build }).parBuild;
  if (!parBuild && !declared) return undefined;
  // the level's own declaration first (kinds its par line never places — the
  // geometry a tray button must still seat with), the par build's tuned
  // occurrences on top of it
  const out: Partial<Record<PieceKind, PieceParams>> = { ...declared };
  for (const p of parBuild ? parBuild().pieces : []) {
    if (tray[p.def] && out[p.def] === undefined) out[p.def] = p.params;
  }
  return out;
}

/**
 * The build the GAME starts a level in: the level's BUILT-IN fixtures only
 * (the book-stack ramp, the counter cup, the bowl rim — Concepts/Levels).
 * The tray pieces live in the tray, not on the track — the tutorial starts
 * EMPTY of player pieces and the player builds the line (brief §9.3).
 * Mounting `placeholderBuild()` (= the full par reference) as a STARTING
 * build was the deployed-page bug: it pre-played the level, overflowed the
 * tray budget ("5 / 3 pieces") and left nothing to build. A level with no
 * fixture table (the feel track rig) ships its whole reference build.
 */
export function initialBuild(level: Level): Build {
  const kl = level as unknown as {
    fixtures?: Partial<Record<PieceKind, number>>;
    parBuild?: () => Build;
  };
  if (kl.fixtures && kl.parBuild) {
    const pieces = kl
      .parBuild()
      .pieces.filter((p) => p.def in kl.fixtures!)
      .map((p, i) => ({ ...p, seq: i }));
    return { levelId: level.id, pieces, seed: level.seed };
  }
  return level.placeholderBuild();
}

/**
 * What the SHIPPED BUILDER produces when the player places the level's par
 * line: the fixtures stay ANCHORED at their par transforms (`initialBuild`
 * mounts them, they are not the player's pieces) and the tray pieces are
 * seated in par order onto the running socket cursor with the TRAY's single
 * geometry per kind (`levelTrayParams`, exactly what a held button ghosts
 * and seats). For a coherent level that build is byte-identical to
 * `parBuild()` — "the tray can place the par build" as a data claim, not
 * prose. It is not a runtime path (the builder is the runtime); it is the
 * parity probe the ladder test reads, alongside `initialBuild`.
 */
export function trayParityBuild(level: Level): Build {
  const kl = level as unknown as {
    tray?: Partial<Record<PieceKind, number>>;
    fixtures?: Partial<Record<PieceKind, number>>;
    parBuild?: () => Build;
  };
  if (!kl.parBuild || !kl.tray || !kl.fixtures) return initialBuild(level);
  const trayParams = levelTrayParams(level, kl.tray) ?? {};
  const pieces: Build['pieces'] = [];
  let cursor: ReturnType<typeof transformSocket> | null = null;
  kl.parBuild().pieces.forEach((p, i) => {
    if (p.def in kl.fixtures!) {
      pieces.push({ ...p, seq: i });
      cursor = transformSocket(PIECES[p.def].sockets(p.params)[1], p.transform);
      return;
    }
    const params = trayParams[p.def] ?? p.params;
    const [inSocket, outSocket] = PIECES[p.def].sockets(params);
    // no anchor to hang off (a level with a tray but no start fixture) keeps
    // the authored transform; the ladder's rungs all start on the ramp
    const transform = cursor ? fitSocket(cursor, inSocket) : p.transform;
    pieces.push({ def: p.def, params, transform, seq: i });
    cursor = transformSocket(outSocket, transform);
  });
  return { levelId: level.id, pieces, seed: level.seed };
}

/** Pieces of a build the PLAYER placed — the tray basis every piece-count
 *  star line compares against. `Builder.playerCount` reports this live; a
 *  replay/share payload has no builder, so the same rule is applied to the
 *  build here (a level's built-in fixtures are nobody's purchase). */
export function playerPieceCount(level: Level, build: Build): number {
  const fixtures = (level as unknown as { fixtures?: Partial<Record<PieceKind, number>> }).fixtures;
  return fixtures ? build.pieces.filter((p) => !(p.def in fixtures)).length : build.pieces.length;
}

export function boot(root: HTMLElement): void {
  // a bare fragment change is a new run request on a static host: reload into it
  window.addEventListener('hashchange', () => window.location.reload())
  const fragment = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : '';
  if (fragment.startsWith('s=')) {
    void bootSharedRun(root);
    return;
  }
  void bootGame(root, resolveLevel(new URLSearchParams(window.location.search)));
}

function paragraph(id: string, parent: HTMLElement, role = 'status'): HTMLParagraphElement {
  const p = document.createElement('p');
  p.id = id;
  p.setAttribute('role', role);
  p.setAttribute('aria-live', 'polite');
  parent.appendChild(p);
  return p;
}

// ---- shared-run page --------------------------------------------------------

async function bootSharedRun(root: HTMLElement): Promise<void> {
  root.innerHTML = '<h1>Gravity Works — shared run</h1>';
  const status = paragraph('gw-replay-status', root);
  const computed = paragraph('gw-replay-hash', root, 'text');
  const embedded = paragraph('gw-replay-embedded', root, 'text');
  status.textContent = 'replaying…';
  try {
    const payload = await parseShareUrl(window.location.href);
    const level = getLevel(payload.levelId);
    embedded.textContent = `link hash ${payload.hash}`;
    const run = await replayRun(level, payload.build);
    computed.textContent = `replay hash ${run.hash}`;
    const verified = run.hash === payload.hash;
    status.textContent = verified ? 'verified' : 'mismatch';
    wireShareCard(root, payload, level, run, verified);
  } catch {
    status.textContent = 'invalid share link';
  }
}

/** Brief §9.4: the share page exports the run as a share-card PNG. */
function wireShareCard(
  root: HTMLElement,
  payload: { levelId: string; build: Build; hash: string },
  level: Level,
  run: { time: number; status: RunStatus },
  verified: boolean,
): void {
  const cardStatus = paragraph('gw-card-status', root, 'text');
  const button = document.createElement('button');
  button.id = 'gw-share-card';
  button.type = 'button';
  button.textContent = 'Download share card';
  root.appendChild(button);
  button.addEventListener('click', () => {
    cardStatus.textContent = 'rendering card…';
    const outcome: RunOutcome =
      run.status === 'finished' || run.status === 'fell' || run.status === 'stalled' || run.status === 'timeout'
        ? run.status
        : 'timeout'; // a never-started replay is not a card-worthy run; stars read 0
    const result: RunResult = {
      status: outcome,
      time: run.time,
      piecesUsed: playerPieceCount(level, payload.build),
      hazardsTouched: 0,
    };
    void generateShareCard({
      levelId: payload.levelId,
      build: payload.build,
      time: run.time,
      stars: starsFor(result, parFor(payload.levelId, level.par)),
      url: window.location.href,
      verified,
    })
      .then((blob) => {
        downloadBlob(blob, `gravity-works-${payload.levelId}.png`);
        cardStatus.textContent = 'card ready';
      })
      .catch(() => {
        cardStatus.textContent = 'card failed';
      });
  });
}

// ---- game page --------------------------------------------------------------

async function bootGame(root: HTMLElement, level: Level): Promise<void> {
  root.innerHTML = '<h1>Gravity Works</h1>';
  const params = new URLSearchParams(window.location.search);
  // DEV HARNESS ENTRY (stage 4): `?set=<id>` mounts a REGISTERED set in the
  // game shell in place of the level's own — the set-inspection entry point
  // (`?set=bedroom`). Without the param the level-driven behavior is exactly
  // the stage-3 line: a level declaring `set: 'kitchen'` gets the kitchen.
  const setParam = params.get('set');
  const setReg: SetRegistration | null = isRegisteredSet(setParam)
    ? SETS[setParam]
    : levelSet(level)
      ? SETS[levelSet(level)!]!
      : null;
  // The builder ABOVE the canvas: the launch controls must never sit below
  // the fold — clicking a control below the viewport scrolls the focused
  // button into view and pushes the WHOLE world (and the end-of-run panel
  // over it) off-screen, the deployed-page "the panel never appeared" bug.
  const builderHost = document.createElement('div');
  builderHost.id = 'gw-builder-host';
  root.appendChild(builderHost);
  const stage = document.createElement('div');
  stage.id = 'gw-stage';
  stage.style.position = 'relative'; // the end-of-run panel sits over the world
  root.appendChild(stage);
  const statusLine = paragraph('gw-status', root);
  const calloutLine = paragraph('gw-callout', root, 'text');
  // The run hash is engineer trivia on a PLAYER panel (playtest E+F: “run
  // hash” unreadable): it lives behind a <details> labelled for what it IS,
  // and the panel may explain an unchanged hash truthfully — the hash covers
  // BODY TRANSFORMS along the path, so a static piece off the road cannot
  // perturb it (`Modules/replay`).
  const hashDetails = document.createElement('details');
  hashDetails.id = 'gw-hash-details';
  const hashSummary = document.createElement('summary');
  hashSummary.textContent = 'determinism fingerprint — same build, same run, anywhere';
  const hashValue = document.createElement('p');
  hashValue.id = 'gw-hash-value';
  const hashNote = document.createElement('p');
  hashNote.id = 'gw-hash-note';
  hashNote.hidden = true;
  hashDetails.append(hashSummary, hashValue, hashNote);
  root.appendChild(hashDetails);

  // preserveDrawingBuffer: the QA seam the e2e canvas probe reads pixels
  // through (same convention as the help drawer's and the harness's
  // renderers — a non-presentable buffer reads back black under Chrome).
  // updateStyle=false: the buffer is 960x540 but the ELEMENT sizes to the
  // stage through `#gw-stage canvas` — the inline 960px style setSize
  // used to write outranked that rule on every narrow window, so the page
  // was taller and wider than a laptop viewport and everything pinned to
  // the stage (the result panel first) scrolled off-screen — the deployed
  // "panel invisible" finding's letterbox half.
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setSize(960, 540, false);
  renderer.domElement.id = 'gw-canvas';
  stage.appendChild(renderer.domElement);
  const camera = new THREE.PerspectiveCamera(35, 960 / 540, 0.01, 20);
  // FIRST PAINT (playtest F: “black screen for seconds”): the canvas must
  // never show an unpainted WebGL buffer while `World.create` awaits the
  // physics wasm. One static warm frame straight after mount (the set's sky
  // when a set mounts, the shell's warm paper otherwise) — the e2e probes
  // the very first canvas bytes and asserts non-black.
  {
    const warm = new THREE.Scene();
    warm.background = new THREE.Color(setReg?.tokens.background ?? SET_TOKENS.kitchen.background);
    renderer.render(warm, camera);
  }

  // Stage 3 wiring, stage 4 registry: a level that declares a set (or a
  // `?set=` dev override) renders INSIDE it. The set is mounted under the
  // world root beside the track group as a VISUAL only — no colliders, no
  // physics reads — per level via the registration's placement table.
  // Mounting it cannot perturb a hash: the solver never sees it (proved in
  // tests/unit/set-wiring.test.ts and tests/e2e/set-wiring.spec.ts).
  const setInstance: SetInstance | null = setReg ? buildGameSet(setReg, level.id) : null;
  const setSolids = setInstance ? setPlacementGuard(setInstance.group) : undefined;
  const setCamBoxes = setInstance ? setCameraSolids(setInstance.group) : undefined;
  // the same set boxes the builder guards placement with, in the camera
  // class's plain-array form: the run camera never intersects or looks
  // through a set prop (stage 3 "beige wall" — see src/camera/run-camera.ts)
  const camSolids: readonly RunCameraSolid[] = (setCamBoxes ?? []).map((b) => ({
    min: [b.min.x, b.min.y, b.min.z],
    max: [b.max.x, b.max.y, b.max.z],
  }));

  // Stage 3 post-stack hook: the game renders through the composer only when
  // the URL explicitly asks (?post=on); the module is imported dynamically
  // so the default page ships the exact stage-2 render path, untouched.
  const wantPost = params.get('post') === 'on';
  let post: PostStack | null = null;

  let world: World | null = null;
  let acc = 0;
  // §7.3 run-follow camera: the world's own rail (the KitRig over THIS
  // build) drives the Feel Engineer's RunCamera while a run plays; static
  // track-framing owns the table between runs
  let rig: KitRig | null = null;
  let runCam: RunCamera | null = null;
  let runCamActive = false;
  // stage-3 run-end layer: the evidence recorder feeds the physics note, the
  // panel only shows on a TERMINAL status (§5.11: no panels during a run)
  const recorder = createRunRecorder();
  const resultPanel = createResultPanel(stage);
  let lastStatus: RunStatus = 'idle';
  // the build the game starts in: fixtures only (the player builds the
  // tray pieces); ?build=par re-mounts the full reference build for tests
  const startBuild = params.get('build') === 'par' ? level.placeholderBuild() : initialBuild(level);
  const tray = levelTray(level);
  let placedCount = startBuild.pieces.length;
  // the hazard tally the result screen reports: wheel contacts whose sampled
  // deck grip dipped below 1 this run (0 for every grip-independent line)
  let hazardsTouched = 0;
  // ?launch=1 releases as soon as the first world is ready — the test hook
  // the result e2e drives the whole loop with, and nothing else reads it
  let launchQueued = params.has('launch');

  if (setInstance && setReg) stage.dataset.setMounted = setReg.id;
  // the e2e seam for the hazard status path: the live zone count of the
  // current world (0 for hazard-free levels) — debug surface, not UI
  (window as unknown as Record<string, unknown>).__gwHazardZones = (): number => world?.hazardZones.length ?? 0;
  // the e2e seam for the CAMERA FOLLOW assertion (§7.3 on the live path):
  // the render camera's current pose — a run that does not MOVE this object
  // is a run the player cannot watch (debug surface, not UI)
  (window as unknown as Record<string, unknown>).__gwCameraPose = (): { pos: number[]; quat: number[] } => ({
    pos: camera.position.toArray(),
    quat: camera.quaternion.toArray(),
  });

  createHelpDrawer(stage, { reducedMotion: loadSave().settings.reducedMotion ?? undefined });
  // quiet, focusable, TOP-RIGHT of the world (playtest A+F: “Help = collapsed
  // word-button at page bottom”); the drawer itself is an overlay, never
  // inline content pushing the page down (`src/ui/help.ts`).

  const builder = createBuilder(builderHost, {
    level,
    build: startBuild,
    tray,
    trayParams: tray ? levelTrayParams(level, tray) : undefined,
    solids: setSolids,
    onChange: (build) => {
      rememberBuild(build);
      // first-time callout (§9.3): the first piece of a kind ever PLACED
      if (build.pieces.length > placedCount) {
        const line = firstSight(build.pieces[build.pieces.length - 1]!.def);
        if (line) calloutLine.textContent = line;
      }
      placedCount = build.pieces.length;
      resultPanel.hide(); // an edited build invalidates the last result
      void rebuild(build);
    },
  });
  builder.attachCanvas(renderer.domElement, camera);
  builder.elements.launch.addEventListener('click', startRun);
  // the progression loop closed on the buttons (§9.1 retry, ladder next):
  // Retry = as-built, one click back to Launch; Next = the following rung,
  // only when this level HAS one; Reset (permanent, beside Launch) walks
  // the car home without touching the build.
  const nextId = nextLevelId(level.id);
  resultPanel.retry.addEventListener('click', () => resetCar());
  if (nextId) {
    resultPanel.next.addEventListener('click', () => {
      const p = new URLSearchParams(window.location.search);
      p.set('level', nextId);
      window.location.search = p.toString(); // a search swap is a page boot
    });
  }
  gateNext(0); // hidden until a run EARNS a star (see gateNext)
  builder.elements.reset.addEventListener('click', () => resetCar());

  // the e2e/keyboard-parity seam: the world position of the VISIBLE target
  // marker — arrows and hover move this socket, nothing targets invisibly
  (window as unknown as Record<string, unknown>).__gwTargetSocket = (): number[] | null => {
    const s = builder.targetSocket();
    return s ? [s.pos.x, s.pos.y, s.pos.z] : null;
  };

  /** Star-gated progression (§9.2, playtest E/F/G): `Next level` appears
   *  only when the level EARNED at least one star; a failed run gets Retry
   *  only. The ladder walk stays the shell's (`nextLevelId`). */
  function gateNext(stars: number): void {
    const show = nextId !== null && stars >= 1;
    resultPanel.next.hidden = !show;
    resultPanel.next.style.display = show ? '' : 'none';
  }

  /** Car home to the release pose, the build untouched, the view back on
   *  the board, the panel away — the missing "bring it back" control. */
  function resetCar(): void {
    const w = world;
    if (!w) return;
    w.reset();
    acc = 0;
    hazardsTouched = 0;
    runCamActive = false;
    if (w.scene) frameCamera(camera, w.scene);
    resultPanel.hide();
  }

  function startRun(): void {
    acc = 0;
    hazardsTouched = 0;
    const w = world;
    if (!w) return;
    w.launch();
    if (runCam && rig) {
      runCam.snap(rig.nearestArc(w.state().car.pos));
      runCamActive = true;
    }
    recorder.reset(w.state()); // witnesses start at the release pose
    resultPanel.hide();
  }

  async function rebuild(build: Build): Promise<void> {
    const next = await World.create(level, build, { visuals: true });
    // the set group belongs to the shell, not to any one world — pull it out
    // before dispose() traverses (it disposes every mesh material it finds)
    setInstance?.group.removeFromParent();
    world?.dispose();
    world = next;
    post?.dispose();
    post = null;
    if (next.scene) {
      if (setInstance && setReg) {
        next.scene.add(setInstance.group);
        next.scene.background = new THREE.Color(setReg.tokens.background);
      }
      if (wantPost) {
        const { createPostStack } = await import('./render/post/index.ts');
        post = createPostStack(renderer, camera, { tokens: setReg?.tokens ?? SET_TOKENS.kitchen });
      }
    }
    builder.setScene(next.scene);
    // a fresh rail for the follow camera — and the empty/short build has no
    // rail to follow (KitRig needs at least one spline), so the static
    // table framing owns those
    rig = build.pieces.length > 0 ? new KitRig(build, SIM_SCALE) : null;
    runCam = rig && rig.length > 1e-6 ? new RunCamera(rig, 0, { solids: camSolids }) : null;
    runCamActive = false;
    frameCamera(camera, next.scene);
    statusLine.textContent = 'ready';
  }

  await rebuild(startBuild);

  // the terminal state of the LAST finished run, for the honest same-hash
  // line: equal hashes on DIFFERENT builds mean the added piece never
  // entered the hashed body set (statics off the path do not perturb it)
  let lastRun: { hash: string; pieces: number } | null = null;

  let last = performance.now();
  const frame = (now: number): void => {
    requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, 0.25);
    last = now;
    const w = world;
    if (!w || !w.scene) return;
    if (launchQueued && w.status === 'idle') {
      launchQueued = false;
      startRun();
    }
    if (w.status === 'running') {
      acc += dt;
      let steps = 0;
      while (acc >= FIXED_DT && steps < 24 && w.status === 'running') {
        w.step();
        if (w.state().car.grip < 0.999) hazardsTouched = 1; // a dipped sample is a touch
        recorder.sample(w.state());
        if (runCam && rig) {
          const s = w.state();
          runCam.update(FIXED_DT, rig.nearestArc(s.car.pos), s.car.speed, s.car.pos);
        }
        acc -= FIXED_DT;
        steps += 1;
      }
      if (w.status !== 'running') acc = 0;
    }
    if (w.status !== 'running' && w.status !== 'idle' && lastStatus === 'running') {
      // the run just ended: stars, time, pieces, and the one-line note (§9.1)
      // — and the follow camera HANDS THE VIEW BACK (§7.3): the static
      // track framing at the end beat the rail freeze-frame every time
      // ("camera buried inside the floor" — playtest B — was the run
      // camera's last pose, kept forever)
      runCamActive = false;
      frameCamera(camera, w.scene);
      const result: RunResult = {
        status: w.status,
        time: w.time,
        piecesUsed: builder.playerCount(),
        hazardsTouched,
      };
      const model = resultModel(result, parFor(level.id, level.par), recorder.evidence());
      resultPanel.show(model);
      gateNext(model.stars); // §9.2: the ladder advances on STARS, not on trying
      const h = w.hashHex();
      if (lastRun && lastRun.hash === h && lastRun.pieces !== result.piecesUsed) {
        hashNote.textContent = 'same run — your extra piece never touched the road';
        hashNote.hidden = false;
      } else {
        hashNote.hidden = true;
      }
      lastRun = { hash: h, pieces: result.piecesUsed };
    }
    lastStatus = w.status;
    const pose = w.carPose(w.status === 'running' ? acc / FIXED_DT : 0);
    if (w.carMesh) {
      w.carMesh.position.set(pose.pos.x, pose.pos.y, pose.pos.z);
      w.carMesh.quaternion.set(pose.quat.x, pose.quat.y, pose.quat.z, pose.quat.w);
    }
    statusLine.textContent = runStatusLine(w, builder.playerCount());
    if (w.status !== 'idle') hashValue.textContent = w.hashHex(); // live under the details
    if (runCamActive && runCam) {
      // §7.3: during a run the RUN CAMERA owns the transform — leading the
      // car along the rail. The eye composition (height, chase distance,
      // set-prop lift) lives in the class itself since stage 3: the play
      // test "beige blur" was the rail eye OVERRUNNING the car (a speed-
      // scaled rail lead put the camera ahead of the car it was looking
      // for), and the "buried in a grey wall" was that eye inside a set
      // solid. Both are the class's contract now (CAR_IN_FRONT, solids).
      camera.position.copy(runCam.position);
      camera.quaternion.copy(runCam.rotation);
    }
    if (post) {
      post.setFocus([pose.pos.x, pose.pos.y, pose.pos.z]); // §7.3: band centred on the car
      post.render(w.scene);
    } else {
      renderer.render(w.scene, camera);
    }
  };
  requestAnimationFrame(frame);
}

/** Build a registered set once per game boot, mounted where this level wants
 *  it (a null placement = the set's canonical origin). */
function buildGameSet(reg: SetRegistration, levelId: string): SetInstance {
  const placement = reg.placement(levelId);
  const instance = reg.build(THREE);
  if (placement) placeSet(instance.group, placement);
  return instance;
}

/**
 * The static TABLE framing: the TRACK's bbox with margin, never the whole
 * scene's. The scene-wide box centres on the mounted set (and the World's
 * 6 m ground plane), which on a small kitchen line put the camera looking
 * past the counter into a cream void (deployed-page finding 1). The set is
 * visible scenery, not the framing subject.
 */
function frameCamera(camera: THREE.PerspectiveCamera, scene: THREE.Scene | null): void {
  const track = scene?.getObjectByName('track');
  const box = track ? new THREE.Box3().setFromObject(track) : new THREE.Box3();
  const center = box.isEmpty() ? new THREE.Vector3() : box.getCenter(new THREE.Vector3());
  const span = box.isEmpty() ? 0.5 : Math.max(...box.getSize(new THREE.Vector3()).toArray());
  const d = Math.max(1.2, span * 1.4);
  camera.position.set(center.x + d * 0.7, center.y + d * 0.55, center.z + d * 0.9);
  camera.lookAt(center);
}

/** Plain-text run status; the aria-live line the run reports through. The
 *  hash is NOT here (playtest E: engineer trivia on the player's line) — it
 *  lives in `#gw-hash-value` behind the determinism-fingerprint details. */
export function runStatusLine(world: World, pieces: number): string {
  const t = `${world.time.toFixed(2)}s`;
  switch (world.status) {
    case 'idle':
      return `ready — ${pieces} pieces placed`;
    case 'running':
      return `running — ${t}`;
    case 'finished':
      return `finished — ${t}`;
    case 'fell':
      return `fell off the set — ${t}`;
    case 'stalled':
      return `stalled — ${t}`;
    case 'timeout':
      return `timed out — ${t}`;
  }
}
