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
import { KITCHEN01 } from './world/levels/kitchen01.level.ts';
import { KITCHEN02, kitchen02ArcBuild } from './world/levels/kitchen02.level.ts';
import { KITCHEN03 } from './world/levels/kitchen03.level.ts';
import { KITCHEN04 } from './world/levels/kitchen04.level.ts';
import { KITCHEN05, KITCHEN_SANDBOX } from './world/levels/kitchen05.level.ts';
import { BEDROOM01 } from './world/levels/bedroom01.level.ts';
import { BEDROOM02 } from './world/levels/bedroom02.level.ts';
import { BEDROOM03 } from './world/levels/bedroom03.level.ts';
import { BEDROOM04 } from './world/levels/bedroom04.level.ts';
import { BATHROOM01 } from './world/levels/bathroom01.level.ts';
import { BATHROOM02 } from './world/levels/bathroom02.level.ts';
import { BATHROOM03 } from './world/levels/bathroom03.level.ts';
import { BATHROOM04 } from './world/levels/bathroom04.level.ts';
import { GARDEN01 } from './world/levels/garden01.level.ts';
import { GARDEN02 } from './world/levels/garden02.level.ts';
import { GARDEN03 } from './world/levels/garden03.level.ts';
import { GARDEN04 } from './world/levels/garden04.level.ts';
import { GARAGE01 } from './world/levels/garage01.level.ts';
import { GARAGE02 } from './world/levels/garage02.level.ts';
import { GARAGE03 } from './world/levels/garage03.level.ts';
import { GARAGE04 } from './world/levels/garage04.level.ts';
import { World, type RunStatus } from './world/world.ts';
import { fixtureQuota, type Build } from './track/build.ts';
export { fixtureQuota };
import { PIECES } from './track/pieces.ts';
import { fitSocket } from './track/snap.ts';
import { transformSocket } from './track/socket.ts';
import type { Level } from './world/level.ts';
import { createBuilder } from './ui/builder.ts';
import { parseShareUrl } from './share/share.ts';
import { replayRun } from './replay/replay.ts';
import { loadSave, rememberBuild, recordStars, savedBuild } from './save/save.ts';
import { SET_TOKENS } from './render/tokens.ts';
import type { PostStack } from './render/post/index.ts';
import { parFor, starsFor, type RunOutcome, type RunResult } from './world/stars.ts';
import { createResultPanel, createRunRecorder, resultModel, starRulesLine } from './ui/result.ts';
import { createHelpDrawer } from './ui/help.ts';
import { firstLesson, firstSight } from './ui/callouts.ts';
import { downloadBlob, generateShareCard } from './share/card.ts';
import { SETS, isRegisteredSet, type SetRegistration } from './sets/index.ts';
import { CAMPAIGN_LADDER, nextInCampaign } from './world/campaign.ts';
import { createLevelSelect } from './ui/levelselect.ts';
import type { SetInstance } from './sets/index.ts';
import { placeSet } from './world/setPlacement.ts';
import { KitRig, finishCapture } from './feel/kittrack.ts';
import { RunCamera } from './camera/run-camera.ts';
import type { RunCameraSolid } from './camera/run-camera.ts';
import { BuildCamera, attachBuildView, frameDeathHold } from './camera/build-camera.ts';
import type { PieceKind, PieceParams } from './track/pieces.ts';

// Level registry ids reachable through ?level= (importing each file is what
// registers it; the feel track stays addressable for the stage-2 specs). The
// campaign table (`src/world/campaign.ts`) names its rungs; the sandbox and
// the feel rig are imported here for addressing only.
void [KITCHEN01, KITCHEN02, KITCHEN03, KITCHEN04, KITCHEN05, KITCHEN_SANDBOX, BEDROOM01, BEDROOM02, BEDROOM03, BEDROOM04, BATHROOM01, BATHROOM02, BATHROOM03, BATHROOM04, GARDEN01, GARDEN02, GARDEN03, GARDEN04, GARAGE01, GARAGE02, GARAGE03, GARAGE04];

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

/** The ladder, in order — the order `Next level` walks and the level select
 *  flattens. Since stage 4 it is the CAMPAIGN table (`src/world/campaign.ts`,
 *  the rooms kitchen → bedroom concatenated): kitchen01..05 → bedroom01..04,
 *  so `Next` crosses the set boundary at kitchen05 → bedroom01 and bedroom04
 *  has no next. Levels outside it (the sandbox, the feel rig) are reachable
 *  by `?level=` but are nobody's "next". */
export const LADDER: readonly string[] = CAMPAIGN_LADDER;

/** The next rung after `id`, or null (last rung / not on the ladder). */
export function nextLevelId(id: string): string | null {
  return nextInCampaign(id);
}

/** A choice level's ALTERNATE authored line, addressed by `?build=alt` —
 *  the filmstrip camera gate's second rail (stage 4 watchability, playtest
 *  M: "the whole far half of Two Ways stays off-frame" — both LANES of a
 *  choice level are framed-tested, not just the one the old strip happened
 *  to shoot). The line DATA is the level module's own export (unchanged
 *  here — this is a debug-addressing table, the same kind as the `?level=`
 *  registry above); a level with no entry has no alt line and `?build=alt`
 *  falls back to its reference build. Never a runtime path: the builder is
 *  the runtime, and no param forges a star or a save. */
const ALT_LINES: Readonly<Record<string, () => Build>> = {
  kitchen02: kitchen02ArcBuild,
};

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
 *
 * OCCURRENCE RULE (N-wave fault fix): a piece is a fixture only while its
 * kind's FIXTURE QUOTA is not yet filled — `fixtures[k]` copies of kind `k`,
 * in build order — NOT every piece whose kind merely APPEARS in the table.
 * The old kind-membership test (`def in fixtures`) mounted a tray piece the
 * moment one rung put a kind in BOTH the tray and the fixtures (the reported
 * kitchen02 empty-tray fault: "the full tray build is mounted at boot"),
 * pre-playing the level and draining the tray to ×0. The boot build is
 * therefore EXACTLY the fixture multiset on every rung — pinned by
 * `tests/unit/boot-invariants.test.ts` (`trayParityBuild` shares the rule so
 * the parity probe keeps anchoring on the fixture's own copy).
 *
 * The rule itself now lives in `src/track/build.ts` (the render-side fixture
 * signal reads the same classifier without a boot <-> world import cycle);
 * re-exported above so the boot surface is unchanged.
 */

export function initialBuild(level: Level): Build {
  const kl = level as unknown as {
    fixtures?: Partial<Record<PieceKind, number>>;
    parBuild?: () => Build;
  };
  if (kl.fixtures && kl.parBuild) {
    const isFixture = fixtureQuota(kl.fixtures);
    const pieces = kl.parBuild().pieces.filter((p) => isFixture(p.def)).map((p, i) => ({ ...p, seq: i }));
    return { levelId: level.id, pieces, seed: level.seed };
  }
  return level.placeholderBuild();
}

/**
 * The build a GAME page starts in, decided per the save schema (`Modules/save`):
 * a `?build=par`/`?build=alt` address is a recorded test rig and always
 * re-mounts the addressed reference line fresh (addressing is not the runtime,
 * the same doctrine as `?level=`); otherwise the level's AUTOSAVED working
 * build is restored when the save carries one — `rememberBuild` writes it on
 * every change, and playtest S's reload that "silently wiped my in-progress
 * build" proved writing it while starting without it was half a feature. A
 * fresh save has no record (fresh build), and a record whose bytes do not
 * deserialize, or name a different level, is nobody's build: fresh again.
 * Restoring is what the `reached` legacy carry already implies — a level with
 * a build record is a level the player STOOD in (`MIGRATIONS[1]`).
 */
export function startBuildFor(
  level: Level,
  params: URLSearchParams,
  saved: Build | undefined,
): Build {
  const alt = ALT_LINES[level.id];
  if (params.get('build') === 'par') return level.placeholderBuild();
  if (params.get('build') === 'alt' && alt) return alt();
  if (saved && saved.levelId === level.id) return saved;
  return initialBuild(level);
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
  // the SAME occurrence rule `initialBuild` mounts with: the pieces this
  // probe treats as anchored fixtures are exactly the ones the boot build
  // mounted, so a shared kind anchors the chain on the fixture's copy and
  // chains the tray's copies (byte-identical to `parBuild` on a coherent
  // level, and no longer possible to pre-mount a tray piece)
  const isFixture = fixtureQuota(kl.fixtures);
  const pieces: Build['pieces'] = [];
  let cursor: ReturnType<typeof transformSocket> | null = null;
  kl.parBuild().pieces.forEach((p, i) => {
    if (isFixture(p.def)) {
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
 *  build here (a level's built-in fixtures are nobody's purchase). The
 *  fixture side is the SAME occurrence quota `initialBuild` mounts — on a
 *  shared kind the fixture's own copies are the FIRST ones, the rest are
 *  the player's. */
export function playerPieceCount(level: Level, build: Build): number {
  const fixtures = (level as unknown as { fixtures?: Partial<Record<PieceKind, number>> }).fixtures;
  if (!fixtures) return build.pieces.length;
  const isFixture = fixtureQuota(fixtures);
  return build.pieces.filter((p) => !isFixture(p.def)).length;
}

/** Pieces a PLAYER placed (fixtures excluded) plus tray stock — the kinds
 *  a failure note's ADVICE may name (playtest Q item 5: "flatten the
 *  landing" printed on a level whose tray has no landing). A kind is
 *  ACTIONABLE when it is PLACED in the build (the player can remove/
 *  re-seat it) or still STOCKED in the level's tray (one press away);
 *  neither = the advice cannot name it. UI-side only — the physics and the
 *  run hash never see the tray. Levels with no declared tray (the feel rig)
 *  act on their build kinds alone. */
export function actionableKindsFor(
  build: Build,
  tray: Partial<Record<PieceKind, number>> | undefined,
): Set<PieceKind> {
  const out = new Set<PieceKind>(build.pieces.map((p) => p.def));
  if (!tray) return out;
  for (const k of Object.keys(tray) as PieceKind[]) {
    const left = (tray[k] ?? 0) - build.pieces.filter((p) => p.def === k).length;
    if (left > 0) out.add(k);
  }
  return out;
}

export function boot(root: HTMLElement): void {
  // a bare fragment change is a new run request on a static host: reload into it
  window.addEventListener('hashchange', () => window.location.reload())
  const fragment = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : '';
  if (fragment.startsWith('s=')) {
    void bootSharedRun(root);
    return;
  }
  const params = new URLSearchParams(window.location.search);
  // the stage-4 campaign page: `?levels=1` lists the ladder grouped by room
  // (player surface; `?level=` stays the recorded debug addressing)
  if (params.has('levels')) {
    createLevelSelect(root);
    return;
  }
  void bootGame(root, resolveLevel(params));
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
  // the campaign page link (stage 4): a quiet line above the builder, NEXT
  // to the h1 — a player surface, never an overlay over the world
  const levelsNav = document.createElement('p');
  levelsNav.id = 'gw-levels-nav';
  const levelsLink = document.createElement('a');
  levelsLink.id = 'gw-levels-link';
  levelsLink.href = '?levels=1';
  levelsLink.textContent = 'All levels';
  levelsNav.appendChild(levelsLink);
  root.appendChild(levelsNav);
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
  // Playtest M: "determinism fingerprint — same build, same run, anywhere"
  // was uninterpretable copy. The engineering truth is unchanged (the hash
  // covers the body transforms along the path); it is just one player line.
  hashSummary.textContent = 'Same pieces, same run, every time — this code proves it.';
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
  // the registry builder awaits the mounted set's dynamically-imported
  // module (stage 4 payload fix, see src/sets/index.ts) — this await rides
  // the boot's existing async line (after the warm frame, before World.create)
  const setInstance: SetInstance | null = setReg ? await buildGameSet(setReg, level.id) : null;
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
  // the build's finish-cup capture centre (null when the build has no cup):
  // the run camera's finish witness AND the static framing's goal bias
  let framingFocus: THREE.Vector3 | null = null;
  // stage 4 BUILD VIEW (playtest Q: "built 4 levels from ONE FIXED ANGLE,
  // left-drag PLACES"): the player-adjustable layer over the static table
  // framing — right-drag (or Space+drag) = damped yaw-only orbit clamped
  // to the table's sensible hemisphere, left-drag past the click threshold
  // = pan, and a click that TRAVELLED places NOTHING (the one gesture
  // contract lives in `attachBuildView`, src/camera/build-camera.ts)
  const buildView = new BuildCamera();
  // the FAILURE end-hold's witness (playtest R round3, see the frame loop):
  // the car's last seeable point while the wide death-hold owns the static
  // framing after a failed run; null whenever any other framing owns the
  // pose (idle, a run, a success end-hold, a rebuild, Retry)
  let endHold: { x: number; y: number; z: number } | null = null;
  // stage-3 run-end layer: the evidence recorder feeds the physics note, the
  // panel only shows on a TERMINAL status (§5.11: no panels during a run)
  const recorder = createRunRecorder();
  const resultPanel = createResultPanel(stage);
  let lastStatus: RunStatus = 'idle';
  // the build the game starts in (`startBuildFor`, just below the save
  // rules): fixtures only on a fresh visit, the AUTOSAVED working build on a
  // reload of one already worked on (playtest S: a reload "silently wiped my
  // in-progress build"); ?build=par re-mounts the full reference build for
  // tests, and ?build=alt the level's ALTERNATE authored line (L02's arc
  // route — the camera's filmstrip gate frames the second rail too, playtest
  // M; the alt is ADDRESSED from the level module's existing export, never a
  // level-data edit).
  const startBuild = startBuildFor(level, params, savedBuild(level.id));
  // the build the CURRENT world runs (set in `rebuild`): its piece KINDS
  // make the failure note's tails build-aware (a lip tip when no lip was
  // ever placed reads as noise — playtest M; UI-side only, the physics and
  // the hash never see it)
  let currentBuild = startBuild;
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
  // the e2e seam for the BUILD VIEW: the damped yaw/pan state behind the
  // pose — the view-control e2e asserts the orbit moved the CAMERA through
  // this, and that the clamps hold (debug surface, not UI)
  (window as unknown as Record<string, unknown>).__gwBuildView = (): {
    yaw: number; pan: number[]; yawTarget: number; panTarget: number[];
  } => ({
    yaw: buildView.yaw,
    pan: [buildView.panX, buildView.panY],
    yawTarget: buildView.yawTarget,
    panTarget: [buildView.panTargetX, buildView.panTargetY],
  });
  // the e2e seam for the AIM-DEPTH proof (playtest S K3): the open target
  // sockets' world positions — the test projects them to find a screen-
  // space near-tie and asserts which one the ring took (debug surface)
  (window as unknown as Record<string, unknown>).__gwOpenSockets = (): number[][] =>
    builder.openSockets().map((s) => [s.pos.x, s.pos.y, s.pos.z]);
  // the e2e seam for the FAILURE end-hold: the car's settled world
  // position — the death site the wide hold must keep in frame (debug
  // surface, not UI)
  (window as unknown as Record<string, unknown>).__gwCarPos = (): number[] | null => {
    const w = world;
    if (!w) return null;
    const p = w.carPose(0).pos;
    return [p.x, p.y, p.z];
  };

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
  // THE ONE CANVAS GESTURE OWNER (playtest Q item 6): hover aims, a clean
  // click places, a travelling press frames (left-drag pans, right-drag or
  // Space+drag orbits) and never places. The builder no longer registers
  // pointer listeners of its own — press-move-release counted as a place
  // there, which WAS the accidental-placement bug.
  attachBuildView(renderer.domElement, buildView, {
    onHover: (x, y) => builder.aimAt(x, y),
    onPlace: (x, y) => builder.clickPlaceAt(x, y),
  });
  builder.elements.launch.addEventListener('click', startRun);
  // the progression loop closed on the buttons (§9.1 retry, ladder next):
  // Retry = as-built, one click back to Launch; Next = the following rung,
  // only when this level HAS one; Reset (permanent, beside Launch) walks
  // the car home without touching the build.
  const nextId = nextLevelId(level.id);
  // The panel Retry and the PERMANENT Retry beside Launch are one wiring:
  // `resetCar` (playtest N: a dismissed panel hid the way back — the
  // as-built retry now lives outside the panel too).
  resultPanel.retry.addEventListener('click', () => resetCar());
  builder.elements.reset.addEventListener('click', () => resetCar());
  if (nextId) {
    resultPanel.next.addEventListener('click', () => {
      const p = new URLSearchParams(window.location.search);
      p.set('level', nextId);
      window.location.search = p.toString(); // a search swap is a page boot
    });
  }
  gateNext(0); // hidden until a run EARNS a star (see gateNext)

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
   *  the board, the panel away — the missing "bring it back" control. The
   *  view RESETS too (playtest Q's orbit): if the player had turned the
   *  table away, Retry brings the framing home, damped. */
  function resetCar(): void {
    const w = world;
    if (!w) return;
    w.reset();
    acc = 0;
    hazardsTouched = 0;
    runCamActive = false;
    endHold = null;
    buildView.reset();
    if (w.scene) frameCamera(camera, w.scene, framingFocus, null, buildView);
    resultPanel.hide();
  }

  function startRun(): void {
    acc = 0;
    hazardsTouched = 0;
    endHold = null; // a fresh release owns the framing again
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
    currentBuild = build;
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
    // the finish WITNESS's rail arc (the cup's capture centre projected onto
    // this build's rail): the camera's finish fade counts down to the CUP,
    // not to the rail terminus — L02's rail runs a curve past its cup, and
    // the rail-keyed fade never fired there (playtest M, run-camera.ts).
    // The same capture centre is the STATIC framing's goal bias (frameCamera).
    const cup = finishCapture(build);
    framingFocus = cup ? cup.center.clone() : null;
    runCam =
      rig && rig.length > 1e-6
        ? new RunCamera(rig, 0, {
            solids: camSolids,
            finishArc: cup ? rig.nearestArcInfo(cup.center).arc : undefined,
          })
        : null;
    runCamActive = false;
    endHold = null; // an edited build retires the last death witness
    frameCamera(camera, next.scene, framingFocus, null, buildView)
    // the same tally line the frame loop writes (ONE counter, ONE verb —
    // never a bare "ready" that skips the number the tray already shows)
    statusLine.textContent = runStatusLine(next, builder.playerCount(), level.budget)
  }

  await rebuild(startBuild);

  // STAR RULES BEFORE THE FIRST RUN (playtest N: "the star rules only
  // appear after a run — teaching precedes failure"): a quiet one-liner
  // on the level's FIRST boot, the same three lines with this level's par
  // numbers, shown once per level through the callouts' seen set
  // (`firstLesson`). The rung on the level select carries the same line.
  const rulesLesson = firstLesson(`rules:${level.id}`, starRulesLine(parFor(level.id, level.par)));
  if (rulesLesson) calloutLine.textContent = rulesLesson;

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
      // the END-HOLD framing: the static table framing re-solved with the
      // car's FINAL world position as part of the subject (frameCamera),
      // so the wide end-of-run shot keeps car and cup in one frame under
      // the verdict panel — never a chase cut-out that hides the death
      // spot the player most needs to read (playtest M/N item 7).
      //
      // FAILURE takes the WIDE DEATH-HOLD (playtest R round3: "buried in
      // a peach wall on fail — never saw the marble fall"): on fell /
      // stalled / timed-out the framing biases toward the car's LAST
      // SEEABLE point, not the cup side, widens past the table solve, and
      // clears the eye over the set solids the way the run camera does —
      // a wall-bury frame of a death the player must read is not a legal
      // end pose. Success keeps the cup-biased framing (it frames well,
      // R's own words). `endHold` keeps the witness live for the damping
      // tick below, so a settling view re-solves the SAME cleared pose
      // instead of overwriting the eye lift with the raw table framing.
      if (w.status === 'finished') {
        endHold = null;
        frameCamera(camera, w.scene, framingFocus, w.carPose(0).pos, buildView);
      } else {
        endHold = { ...w.carPose(0).pos };
        frameDeathHold(camera, w.scene, {
          death: endHold,
          solids: camSolids,
          view: buildView,
        });
      }
      const result: RunResult = {
        status: w.status,
        time: w.time,
        piecesUsed: builder.playerCount(),
        hazardsTouched,
      };
      // Replay honesty (playtest J): the star the save ALREADY held before
      // this run decides whether the par lines aim or verdict — read HERE,
      // before recordStars below writes this run's best, so a re-run in the
      // same session counts as one (see outcomeLines in src/ui/result.ts).
      const bestStarsBefore = loadSave().progress.stars[level.id] ?? 0;
      // ACTIONABLE KINDS for the note's advice tails (playtest Q item 5:
      // "flatten the landing" with no landing in the tray) — see
      // `actionableKindsFor`. UI-side only; physics and the hash never see it.
      const model = resultModel(
        result,
        parFor(level.id, level.par),
        recorder.evidence(),
        bestStarsBefore,
        actionableKindsFor(currentBuild, tray),
      );
      resultPanel.show(model);
      // §9.2 progress persists: a finished run's stars are the save's best
      // for this level (a failure records nothing); this is what opens the
      // next rung on the level select, exactly what `gateNext` just offered
      recordStars(level.id, model.stars);
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
    statusLine.textContent = runStatusLine(w, builder.playerCount(), level.budget);
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
    } else if (buildView.step(dt)) {
      // the BUILD VIEW damping tick (playtest Q): an orbit/pan gesture
      // damps to its target outside a run; stillness costs nothing. A
      // pending failure end-hold RE-SOLVES its cleared wide pose through
      // the damped view state instead of the raw apply (the lift must not
      // be overwritten by a settling frame — playtest R round3).
      if (endHold) frameDeathHold(camera, w.scene, { death: endHold, solids: camSolids, view: buildView });
      else buildView.apply(camera);
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
async function buildGameSet(reg: SetRegistration, levelId: string): Promise<SetInstance> {
  const placement = reg.placement(levelId);
  const instance = await reg.build(THREE);
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
export function frameCamera(
  camera: THREE.PerspectiveCamera,
  scene: THREE.Scene | null,
  focus: THREE.Vector3 | null = null,
  extra: { x: number; y: number; z: number } | null = null,
  view: BuildCamera | null = null,
): void {
  const track = scene?.getObjectByName('track');
  const box = track ? new THREE.Box3().setFromObject(track) : new THREE.Box3();
  if (extra) {
    // the END-HOLD pass boxes the run's LAST SEEABLE POINT (where the car
    // came to rest — a fallen car settles off the track's box, below a
    // ledge or past a gap) as part of the subject, so the verdict panel
    // never lands over an off-frame death spot (playtest M: "the result
    // panel hides where the car died"). The point is CLAMPED into the
    // track's neighbourhood — a wild coordinate (a car flung off-world)
    // may not inflate the table framing into the same cream void the
    // scene-wide box used to produce.
    framingScratch.set(extra.x, extra.y, extra.z);
    box.expandByScalar(0.6).clampPoint(framingScratch, framingScratch);
    box.expandByPoint(framingScratch);
  }
  const center = box.isEmpty() ? new THREE.Vector3() : box.getCenter(new THREE.Vector3());
  const span = box.isEmpty() ? 0.5 : Math.max(...box.getSize(new THREE.Vector3()).toArray());
  const d = Math.max(1.2, span * 1.4);
  // THE GOAL IS IN THE SUBJECT: the static framing biases its look-at 35 %
  // of the way from the track's centre toward the build's FINISH CUP (the
  // capture centre, `finishCapture`) — an establishing shot that puts the
  // GOAL in the middle third, not at the edge where a fresh player cannot
  // find it (playtest N: "never found the finishCup on screen once in
  // either level", "the build camera never frames the cup"; measured: at
  // zero bias the cup captured at |ndc| 0.43/0.46 on L01/L04 — geometrically
  // in frame, perceptually a few pixels in the corner). At 0.35 the cup
  // captures at |ndc| <= 0.28 (inside the middle thirds) on every ladder
  // rung while every track-box corner stays at |ndc| <= 0.49 — the whole
  // build still fits with room. A level with no cup (a hazard sandbox, the
  // feel rig) frames its track exactly as before.
  if (focus && !box.isEmpty()) {
    center.addScaledVector(framingScratch.copy(focus).sub(center), 0.35);
  }
  // with a build view attached the solved base framing lives in it and the
  // view composes the pose (at zero yaw/pan that composition is bit-for-bit
  // the direct set below — the proofs and visual baselines do not move)
  if (view) {
    view.setFraming(center, d, span);
    view.apply(camera);
    return;
  }
  camera.position.set(center.x + d * 0.7, center.y + d * 0.55, center.z + d * 0.9);
  camera.lookAt(center);
}

const framingScratch = new THREE.Vector3();

/** Plain-text run status; the aria-live line the run reports through. The
 *  hash is NOT here (playtest E: engineer trivia on the player's line) — it
 *  lives in `#gw-hash-value` behind the same-pieces-same-run details. ONE
 *  COUNTER, ONE VERB (playtests P+Q: "0 of 4 used" vs "ready — 1 placed"
 *  was the same number wearing two words): the IDLE line states the tray
 *  tally in the SAME words as the builder's `#gw-piece-count` — "n of m
 *  pieces used" — so the two lines can never contradict mid-session; the
 *  in-run/terminal lines carry no tally at all (the clock is their only
 *  number; an edit-halted run's tally reappears when the line is idle
 *  again, recomputed from the same `playerCount`). */
export function runStatusLine(world: World, pieces: number, budget: number): string {
  const t = `${world.time.toFixed(2)}s`;
  switch (world.status) {
    case 'idle':
      return `ready — ${pieces} of ${budget} pieces used`;
    case 'running':
      return `running — ${t}`;
    case 'finished':
      return `finished — ${t}`;
    case 'fell':
      // STAGE-4 SWEEP (playtest R: "the set" unreadable): the internal noun is
      // gone from every player line; the head verb is just `fell off`, and it
      // still EQUALS the physics note's head (`physicsNote`, result.ts).
      return `fell off — ${t}`;
    case 'stalled':
      return `stalled — ${t}`;
    case 'timeout':
      return `timed out — ${t}`;
  }
}
