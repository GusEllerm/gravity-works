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
import { FIXED_DT } from './physics/sim.ts';
import { getLevel } from './world/levels/feeltrack.level.ts';
import { KITCHEN01 } from './world/levels/kitchen01.level.ts';
import { KITCHEN02 } from './world/levels/kitchen02.level.ts';
import { KITCHEN03 } from './world/levels/kitchen03.level.ts';
import { KITCHEN04 } from './world/levels/kitchen04.level.ts';
import { KITCHEN05, KITCHEN_SANDBOX } from './world/levels/kitchen05.level.ts';
import { World, type RunStatus } from './world/world.ts';
import type { Build } from './track/build.ts';
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
import { buildKitchenSet } from './sets/kitchen/index.ts';
import { kitchenSetPlacement, placeSet } from './world/setPlacement.ts';

// Level registry ids reachable through ?level= (importing each file is what
// registers it; the feel track stays addressable for the stage-2 specs).
void [KITCHEN01, KITCHEN02, KITCHEN03, KITCHEN04, KITCHEN05, KITCHEN_SANDBOX];

/** The set a level declares (`KitchenLevel.set`), structurally — the boot
 *  must not depend on the level modules' types to decide what to mount. */
function levelSet(level: Level): string | null {
  const set = (level as { set?: string }).set;
  return typeof set === 'string' ? set : null;
}

/** The named solid props of a built kitchen set as world-space AABBs — the
 *  builder's placement-guard input (cheap: boxes, never mesh tests). Films
 *  and the counter floor are excluded: a wet patch must never block a piece,
 *  and the deck the track rides on is not an obstacle. */
export function setPlacementGuard(group: THREE.Group): THREE.Box3[] {
  const boxes: THREE.Box3[] = [];
  // Box3.setFromObject does not refresh PARENT matrices — a freshly repositioned
  // mount would otherwise box the props at their UNPLACED coordinates
  group.updateMatrixWorld(true);
  const skip = new Set(['counter', 'wet-patch-films']);
  const collect = (root: THREE.Object3D): void => {
    for (const child of root.children) {
      if (child.name.includes('film') || skip.has(child.name)) continue;
      if (child.children.length === 0 || child.name === 'book-stack' || child.name === 'tap') {
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
      piecesUsed: payload.build.pieces.length,
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
  const stage = document.createElement('div');
  stage.id = 'gw-stage';
  stage.style.position = 'relative'; // the end-of-run panel sits over the world
  root.appendChild(stage);
  const builderHost = document.createElement('div');
  builderHost.id = 'gw-builder-host';
  root.appendChild(builderHost);
  const statusLine = paragraph('gw-status', root);
  const calloutLine = paragraph('gw-callout', root, 'text');

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(960, 540);
  renderer.domElement.id = 'gw-canvas';
  stage.appendChild(renderer.domElement);
  const camera = new THREE.PerspectiveCamera(35, 960 / 540, 0.01, 20);

  // Stage 3 wiring: a level that declares a set renders INSIDE it. The set
  // is mounted under the world root beside the track group as a VISUAL only
  // — no colliders, no physics reads — per level via `kitchenSetPlacement`.
  // Mounting it cannot perturb a hash: the solver never sees it (proved in
  // tests/unit/set-wiring.test.ts and tests/e2e/set-wiring.spec.ts).
  const setGroup = levelSet(level) === 'kitchen' ? buildGameKitchenSet(level.id) : null;
  const setSolids = setGroup ? setPlacementGuard(setGroup) : undefined;

  // Stage 3 post-stack hook: the game renders through the composer only when
  // the URL explicitly asks (?post=on); the module is imported dynamically
  // so the default page ships the exact stage-2 render path, untouched.
  const wantPost = new URLSearchParams(window.location.search).get('post') === 'on';
  let post: PostStack | null = null;

  let world: World | null = null;
  let acc = 0;
  // stage-3 run-end layer: the evidence recorder feeds the physics note, the
  // panel only shows on a TERMINAL status (§5.11: no panels during a run)
  const recorder = createRunRecorder();
  const resultPanel = createResultPanel(stage);
  let lastStatus: RunStatus = 'idle';
  let placedCount = level.placeholderBuild().pieces.length;
  // the hazard tally the result screen reports: wheel contacts whose sampled
  // deck grip dipped below 1 this run (0 for every grip-independent line)
  let hazardsTouched = 0;
  // ?launch=1 releases as soon as the first world is ready — the test hook
  // the result e2e drives the whole loop with, and nothing else reads it
  let launchQueued = new URLSearchParams(window.location.search).has('launch');

  if (setGroup) stage.dataset.setMounted = 'kitchen';
  // the e2e seam for the hazard status path: the live zone count of the
  // current world (0 for hazard-free levels) — debug surface, not UI
  (window as unknown as Record<string, unknown>).__gwHazardZones = (): number => world?.hazardZones.length ?? 0;

  createHelpDrawer(root, { reducedMotion: loadSave().settings.reducedMotion ?? undefined });

  const builder = createBuilder(builderHost, {
    level,
    build: level.placeholderBuild(),
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
  builder.attachCanvas(renderer.domElement);
  builder.elements.launch.addEventListener('click', startRun);

  function startRun(): void {
    acc = 0;
    hazardsTouched = 0;
    const w = world;
    if (!w) return;
    w.launch();
    recorder.reset(w.state()); // witnesses start at the release pose
    resultPanel.hide();
  }

  async function rebuild(build: Build): Promise<void> {
    const next = await World.create(level, build, { visuals: true });
    // the set group belongs to the shell, not to any one world — pull it out
    // before dispose() traverses (it disposes every mesh material it finds)
    setGroup?.removeFromParent();
    world?.dispose();
    world = next;
    post?.dispose();
    post = null;
    if (next.scene) {
      if (setGroup) {
        next.scene.add(setGroup);
        next.scene.background = new THREE.Color(SET_TOKENS.kitchen.background);
      }
      if (wantPost) {
        const { createPostStack } = await import('./render/post/index.ts');
        post = createPostStack(renderer, camera, { tokens: SET_TOKENS.kitchen });
      }
    }
    builder.setScene(next.scene);
    const box = new THREE.Box3().setFromObject(next.scene ?? new THREE.Object3D());
    const center = box.isEmpty() ? new THREE.Vector3() : box.getCenter(new THREE.Vector3());
    const span = box.isEmpty() ? 0.5 : Math.max(...box.getSize(new THREE.Vector3()).toArray());
    const d = Math.max(1.2, span * 1.4);
    camera.position.set(center.x + d * 0.7, center.y + d * 0.55, center.z + d * 0.9);
    camera.lookAt(center);
    statusLine.textContent = 'ready';
  }

  await rebuild(level.placeholderBuild());

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
        acc -= FIXED_DT;
        steps += 1;
      }
      if (w.status !== 'running') acc = 0;
    }
    if (w.status !== 'running' && w.status !== 'idle' && lastStatus === 'running') {
      // the run just ended: stars, time, pieces, and the one-line note (§9.1)
      const result: RunResult = {
        status: w.status,
        time: w.time,
        piecesUsed: builder.build().pieces.length,
        hazardsTouched,
      };
      resultPanel.show(resultModel(result, parFor(level.id, level.par), recorder.evidence()));
    }
    lastStatus = w.status;
    const pose = w.carPose(w.status === 'running' ? acc / FIXED_DT : 0);
    if (w.carMesh) {
      w.carMesh.position.set(pose.pos.x, pose.pos.y, pose.pos.z);
      w.carMesh.quaternion.set(pose.quat.x, pose.quat.y, pose.quat.z, pose.quat.w);
    }
    statusLine.textContent = runStatusLine(w, builder.build().pieces.length);
    if (post) {
      post.setFocus([pose.pos.x, pose.pos.y, pose.pos.z]); // §7.3: band centred on the car
      post.render(w.scene);
    } else {
      renderer.render(w.scene, camera);
    }
  };
  requestAnimationFrame(frame);
}

/** Build the hero set once per game boot, mounted where this level wants it. */
function buildGameKitchenSet(levelId: string): THREE.Group | null {
  const placement = kitchenSetPlacement(levelId);
  const set = buildKitchenSet(THREE, { tokens: SET_TOKENS.kitchen });
  if (placement) placeSet(set.group, placement);
  return set.group;
}

/** Plain-text run status; the aria-live line the run reports through. */
export function runStatusLine(world: World, pieces: number): string {
  const t = `${world.time.toFixed(2)}s`;
  switch (world.status) {
    case 'idle':
      return `ready — ${pieces} pieces`;
    case 'running':
      return `running — ${t} — hash ${world.hashHex()}`;
    case 'finished':
      return `finished — ${t} — ${pieces} pieces — hash ${world.hashHex()}`;
    case 'fell':
      return `fell off the set — ${t} — hash ${world.hashHex()}`;
    case 'stalled':
      return `stalled — ${t} — hash ${world.hashHex()}`;
    case 'timeout':
      return `timed out — ${t} — hash ${world.hashHex()}`;
  }
}
