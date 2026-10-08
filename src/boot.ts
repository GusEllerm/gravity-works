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
import { PORCH01 } from './world/levels/porch01.level.ts';
import { PORCH02 } from './world/levels/porch02.level.ts';
import { PORCH03 } from './world/levels/porch03.level.ts';
import { PORCH04 } from './world/levels/porch04.level.ts';
import { PORCH05 } from './world/levels/porch05.level.ts';
import { World, type RunStatus } from './world/world.ts';
import { fixtureQuota, serialize, type Build } from './track/build.ts';
export { fixtureQuota };
import { PIECES, pieceLabel } from './track/pieces.ts';
import { fitSocket, SNAP_ANGLE_TOL, SNAP_TRANSLATION_TOL } from './track/snap.ts';
import { socketGap, tangentAngle, transformSocket } from './track/socket.ts';
import type { Socket } from './track/socket.ts';
import type { Level } from './world/level.ts';
import { createBuilder, type Builder } from './ui/builder.ts';
import { encodeShareUrl, parseShareUrl, type SharePayload } from './share/share.ts';
import { replayRun } from './replay/replay.ts';
import { stepAndRecord, ReplayDirector, cupView, REPLAY_FOV } from './replay/cinematic.ts';
import { createBuildAutosave, loadSave, rememberBuild, recordStars, savedBuild } from './save/save.ts';
import { createSound, upAxisYOfQuat } from './sound/sound.ts';
import { SET_TOKENS } from './render/tokens.ts';
import type { PostStack } from './render/post/index.ts';
import { parFor, starsFor, type RunOutcome, type RunResult, type StarCount } from './world/stars.ts';
import { createResultPanel, createRunRecorder, resultModel, starRulesLine } from './ui/result.ts';
import { createHelpDrawer } from './ui/help.ts';
import { firstLesson, firstSight } from './ui/callouts.ts';
import { downloadBlob, generateShareCard } from './share/card.ts';
import { SETS, isRegisteredSet, type SetRegistration } from './sets/index.ts';
import { CAMPAIGN_LADDER, levelUnlock, nextInCampaign } from './world/campaign.ts';
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
void [KITCHEN01, KITCHEN02, KITCHEN03, KITCHEN04, KITCHEN05, KITCHEN_SANDBOX, BEDROOM01, BEDROOM02, BEDROOM03, BEDROOM04, BATHROOM01, BATHROOM02, BATHROOM03, BATHROOM04, GARDEN01, GARDEN02, GARDEN03, GARDEN04, GARAGE01, GARAGE02, GARAGE03, GARAGE04, PORCH01, PORCH02, PORCH03, PORCH04, PORCH05];

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
 * build is restored when the save carries one — the autosave writes it on
 * every edit (`createBuildAutosave`, debounced, flushed before the unload),
 * and playtest S's reload that "silently wiped my in-progress
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

/** The kinds PLACED in a build — the PHRASING side of the note's advice
 *  gates (round-5 playtest W: "flatten the landing" on a build with no
 *  landing placed read as a lie though the tray made it actionable).
 *  Critique verbs fit kinds in this set; tray-only kinds get add verbs —
 *  see `physicsNote` in `src/ui/result.ts`. A subset of
 *  `actionableKindsFor` by construction. UI-side only, like that gate. */
export function placedKindsFor(build: Build): Set<PieceKind> {
  return new Set(build.pieces.map((p) => p.def));
}

/** The kinds PLACED in a REVERSED mount — the HOW side of the nose-first
 *  advice (stage 5, playtest BB item 3: "flatten the landing names a
 *  change but never says HOW — Rotate only flips"). A placement is
 *  rotated exactly when its in-socket sits AT a chain anchor (the start
 *  socket or another piece's exit, within `SNAP_TRANSLATION_TOL`) with
 *  its travel direction NOT parallel to the anchor's (past
 *  `SNAP_ANGLE_TOL`) — the builder's own amber `flipped fit` test, read
 *  back off the build data: the flip is the half turn about the anchor's
 *  up, which leaves the socket POSITION joined and flips the tangent
 *  (see `placement` in `src/ui/builder.ts`). UI-side copy, like the
 *  other kind-sets — the physics and the run hash never see it. */
export function flippedKindsFor(level: Level, build: Build): Set<PieceKind> {
  const out = new Set<PieceKind>();
  const anchors: Socket[] = [level.startSocket];
  for (const p of build.pieces) {
    anchors.push(transformSocket(PIECES[p.def].sockets(p.params)[1], p.transform));
  }
  for (const p of build.pieces) {
    const entry = transformSocket(PIECES[p.def].sockets(p.params)[0], p.transform);
    if (anchors.some((a) => socketGap(entry, a) < SNAP_TRANSLATION_TOL && tangentAngle(entry, a) > SNAP_ANGLE_TOL)) {
      out.add(p.def);
    }
  }
  return out;
}

/**
 * The GOAL FIXTURE NOUN for a level's player copy — the word the fell-line
 * ends on ("the line let go before the ___"). Stage 5, playtest AA: "'the
 * line let go before the cup' fired where no cup was visible" — a noun
 * hardcoded in `physicsNote` names an object the level may never have
 * shipped. The rule mirrors the builder's target sweep (`targets()` in
 * `src/ui/builder.ts`): read the level's `fixtures` table — the SAME table
 * `initialBuild` mounts and `buildTrackMeshes` signals — and name the
 * fixture whose kind ENDS a run: the one the registry gives a
 * `captureVolume` (world.ts resolves exactly one such piece to the capture
 * sphere). A bowl or a mat joins that rule for free the day the registry
 * ships one — the noun follows the data, never the prose. `null` when the
 * level declares no fixture table or no capturing fixture (the note then
 * keeps its shipped default, which is honest only for cup levels).
 * UI-side copy, like the two kind-gates above — the physics never sees it.
 */
export function goalNounFor(level: Level): string | null {
  const fixtures = (level as unknown as { fixtures?: Partial<Record<PieceKind, number>> }).fixtures;
  if (!fixtures) return null;
  for (const k of Object.keys(fixtures) as PieceKind[]) {
    if ((fixtures[k] ?? 0) > 0 && PIECES[k].captureVolume) return pieceLabel(k).toLowerCase();
  }
  return null;

}

/** Kinds with STOCK LEFT — tray count minus the copies the build placed
 *  (stage-5 B2 pass 2, playtest AA). The drive-off note tail may name
 *  ONLY these: a kind the tray still holds is one press away, so "add a
 *  X" is always true for it, and a kind used up or absent can never make
 *  the list — the strictest ADD-only reading of the three-way phrasing
 *  rule. Six different wrong builds then print six different honest
 *  lists instead of one undifferentiated line. UI-side only, like the
 *  other two sets — the physics and the run hash never see it. */
export function stockedKindsFor(
  build: Build,
  tray: Partial<Record<PieceKind, number>> | undefined,
): Set<PieceKind> {
  const out = new Set<PieceKind>();
  if (!tray) return out;
  for (const k of Object.keys(tray) as PieceKind[]) {
    if ((tray[k] ?? 0) - build.pieces.filter((p) => p.def === k).length > 0) out.add(k);
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
//
// Stage 5: a share link OPENS INTO the replay. The verification half is
// unchanged and still honest (`parseShareUrl` → `replayRun` → compare →
// `verified`/`mismatch` in `#gw-replay-status`, now in the section BELOW the
// fold); above it the page is a cinematic player — the same deterministic
// run recorded step-for-step by `stepAndRecord` (`src/replay/cinematic.ts`)
// and rendered through a three-shot camera sequence with the house post
// stack, scrubber and all. Playback reads recorded sim states only: seeking
// never invents a state between two steps.

async function bootSharedRun(root: HTMLElement): Promise<void> {
  root.innerHTML = '';
  const title = document.createElement('h1');
  title.id = 'gw-replay-title';
  title.textContent = 'Watch this run';
  root.appendChild(title);
  const tagline = document.createElement('p');
  tagline.id = 'gw-replay-tagline';
  tagline.textContent = 'One build, one release — this page re-runs it here and rolls the tape.';
  root.appendChild(tagline);
  const badge = document.createElement('p');
  badge.id = 'gw-replay-badge';
  badge.hidden = true;
  root.appendChild(badge);

  const stage = document.createElement('div');
  stage.id = 'gw-stage';
  stage.style.position = 'relative';
  root.appendChild(stage);
  const bar = document.createElement('div');
  bar.id = 'gw-replay-bar';
  bar.hidden = true;
  root.appendChild(bar);

  // the honest half, BELOW the fold: the verdict and the two hashes, exactly
  // the strings the stage-2/3/4 specs read
  const verify = document.createElement('section');
  verify.id = 'gw-replay-verify';
  const verifyHeading = document.createElement('h2');
  verifyHeading.textContent = 'How this link verifies';
  verify.appendChild(verifyHeading);
  const status = paragraph('gw-replay-status', verify);
  const computed = paragraph('gw-replay-hash', verify, 'text');
  const embedded = paragraph('gw-replay-embedded', verify, 'text');
  const verifyNote = document.createElement('p');
  verifyNote.id = 'gw-replay-verify-note';
  verifyNote.textContent =
    'The link carries the final state hash of the run; this page replays the level, build and seed on this machine and compares. Same machine, same engine, the same run — cross-platform equality is still an open question (see the Determinism notes).';
  verify.appendChild(verifyNote);
  root.appendChild(verify);

  status.textContent = 'replaying…';
  let payload;
  let level: Level;
  try {
    payload = await parseShareUrl(window.location.href);
    level = getLevel(payload.levelId);
  } catch {
    status.textContent = 'invalid share link';
    return;
  }
  embedded.textContent = `link hash ${payload.hash}`;
  let verified = false;
  let runInfo: { time: number; status: RunStatus } = { time: 0, status: 'timeout' };
  try {
    const run = await replayRun(level, payload.build);
    runInfo = { time: run.time, status: run.status };
    computed.textContent = `replay hash ${run.hash}`;
    verified = run.hash === payload.hash;
    status.textContent = verified ? 'verified' : 'mismatch';
    badge.hidden = false;
    badge.textContent = verified ? '✓ verified on this machine' : '⚠ differs on this machine';
  } catch {
    status.textContent = 'mismatch';
  }
  wireShareCard(verify, payload, level, runInfo, verified);

  // the cinematic layer — a failed WebGL build must never eat the verdict
  // the specs (and the visitor) came for
  try {
    await startReplayPlayer({ stage, bar }, level, payload, verified);
  } catch {
    bar.hidden = true;
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

// ---- cinematic replay player (stage 5) ---------------------------------------

/**
 * The replay half of the shared-run page: mount the level's set and build in
 * a visual `World`, record the run step-for-step (`stepAndRecord` — the whole
 * sim fast-forward happens here, before the first painted frame), then hand
 * the trace to the shot-sequence director and a scrubber. Playback reads ONLY
 * recorded sim states (`stepAt` floors to a step, never blends two); the
 * camera poses are functions of sim time alone, so 1×/2×/4× and any seek
 * cannot perturb what is shown. The build-view gesture stack is untouched —
 * nothing here attaches to the game page.
 */
async function startReplayPlayer(
  host: { stage: HTMLElement; bar: HTMLElement },
  level: Level,
  payload: SharePayload,
  verified: boolean,
): Promise<void> {
  const { stage, bar } = host;
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setSize(960, 540, false);
  renderer.domElement.id = 'gw-canvas';
  stage.appendChild(renderer.domElement);
  const camera = new THREE.PerspectiveCamera(REPLAY_FOV, 960 / 540, 0.01, 24);
  const setReg = levelSet(level) ? SETS[levelSet(level)!] : null;
  // warm frame before the wasm await (the game page's rule, same reason)
  {
    const warm = new THREE.Scene();
    warm.background = new THREE.Color(setReg?.tokens.background ?? SET_TOKENS.kitchen.background);
    renderer.render(warm, camera);
  }
  const setInstance = setReg ? await buildGameSet(setReg, level.id) : null;
  const solids: readonly RunCameraSolid[] = setInstance
    ? setCameraSolids(setInstance.group).map((b) => ({
        min: [b.min.x, b.min.y, b.min.z],
        max: [b.max.x, b.max.y, b.max.z],
      }))
    : [];
  const world = await World.create(level, payload.build, { visuals: true });
  const scene = world.scene;
  if (!scene) throw new Error('replay player: world has no scene');
  if (setInstance && setReg) {
    scene.add(setInstance.group);
    scene.background = new THREE.Color(setReg.tokens.background);
  }
  const trace = stepAndRecord(world, payload.build, { solids });
  const track = scene.getObjectByName('track');
  const box = track ? new THREE.Box3().setFromObject(track) : new THREE.Box3();
  const reducedMotion = loadSave().settings.reducedMotion ?? false;
  const director = new ReplayDirector({
    trace,
    box,
    cup: cupView(payload.build),
    fov: REPLAY_FOV,
    aspect: 960 / 540,
    reducedMotion,
  });
  // the house look rides along: the quarter-res tilt-shift stack, focus band
  // centred on the car at the step being shown (the game page's §7.3 rule)
  const { createPostStack } = await import('./render/post/index.ts');
  const post = createPostStack(renderer, camera, { tokens: setReg?.tokens ?? SET_TOKENS.kitchen });

  const duration = Math.max(trace.duration, 0.1);
  const stepAt = (t: number): number =>
    Math.min(trace.steps - 1, Math.max(0, Math.floor(t / trace.dt + 1e-6)));
  let time = 0;
  let playing = !reducedMotion; // reduced motion opens on the wide shot, paused
  let rate = 1;
  let dragging = false;
  let resumeAfterDrag = false;
  /** Below this much remaining watchable motion a Play click rewinds to 0
   *  (see the play-button comment — the dead-first-click fix). */
  const PLAY_RESUME_MIN = Math.min(0.5, duration * 0.5);
  /** The PACE LEDGER (e2e debug surface): [wallMs, playheadS, rate] for every
   *  frame that ADVANCED the playhead. The share-replay rate law is asserted
   *  from it PER RENDERED FRAME — advance === min(frame gap, 0.25 s) × rate —
   *  because CI truth (SwiftShader) can make one frame outlast any fixed
   *  wall-clock sampling wait: a 300 ms `waitForTimeout` on the 15.8 s
   *  feeltrack link could hold zero frames (the playhead "never moved") or
   *  one clamped giant. Any event that breaks frame-gap continuity (Play/
   *  pause, seek, resume-after-drag, speed change) or clamps at the end
   *  clears the ledger, so no asserted interval ever spans a discontinuity. */
  const pace: [number, number, number][] = [];
  const paceBreak = (): void => {
    pace.length = 0;
  };

  const renderAt = (t: number): void => {
    const k = stepAt(t);
    const px = trace.pos[k * 3]!;
    const py = trace.pos[k * 3 + 1]!;
    const pz = trace.pos[k * 3 + 2]!;
    if (world.carMesh) {
      world.carMesh.position.set(px, py, pz);
      world.carMesh.quaternion.set(
        trace.quat[k * 4]!,
        trace.quat[k * 4 + 1]!,
        trace.quat[k * 4 + 2]!,
        trace.quat[k * 4 + 3]!,
      );
    }
    director.poseAt(t);
    camera.position.copy(director.position);
    camera.quaternion.copy(director.quaternion);
    post.setFocus([px, py, pz]);
    post.render(scene);
  };

  // ---- the replay bar: play/pause, time, scrub track with event ticks,
  // speed, and the obvious way out of the audience seat
  bar.innerHTML = '';
  const playBtn = document.createElement('button');
  playBtn.id = 'gw-replay-play';
  playBtn.type = 'button';
  const syncPlay = (): void => {
    playBtn.textContent = playing ? '⏸' : '▶';
    playBtn.setAttribute('aria-label', playing ? 'Pause' : 'Play');
    playBtn.setAttribute('aria-pressed', String(playing));
  };
  playBtn.addEventListener('click', () => {
    // PLAY always STARTS MOTION when it is the resume click (playtest BB:
    // "first Play click did nothing... second click worked"). The restart
    // test used to be `time >= duration`, but the film LOOKS over long
    // before it IS over: the finish lock-off holds on a settled cup for
    // REPLAY_TAIL, and the last steps before the end crawl. A click that
    // lands in that window (paused mid-tail from a scrub, or just after a
    // pause taken during the hold) advanced one or two steps, hit the
    // clamp, and re-paused — motion the eye cannot catch reads as a dead
    // click, and only the NEXT click (now truly at the end) restarted.
    // If the playable window left is shorter than a second of watchable
    // motion, Play means REWIND AND PLAY — the tail's last sliver is the
    // settle the viewer has already seen.
    if (!playing && duration - time < PLAY_RESUME_MIN) time = 0;
    playing = !playing;
    paceBreak();
    syncPlay();
  });
  const timeEl = document.createElement('span');
  timeEl.id = 'gw-replay-time';
  const timeline = document.createElement('div');
  timeline.id = 'gw-replay-timeline';
  timeline.setAttribute('role', 'slider');
  timeline.setAttribute('tabindex', '0');
  timeline.setAttribute('aria-label', 'Replay timeline');
  timeline.setAttribute('aria-valuemin', '0');
  timeline.setAttribute('aria-valuemax', duration.toFixed(2));
  const head = document.createElement('div');
  head.id = 'gw-replay-head';
  timeline.appendChild(head);
  for (const ev of trace.events) {
    const tick = document.createElement('span');
    tick.className = 'gw-replay-tick';
    tick.dataset['t'] = String(ev.t);
    tick.style.left = `${(THREE.MathUtils.clamp(ev.t / duration, 0, 1) * 100).toFixed(3)}%`;
    tick.title = ev.label;
    tick.setAttribute('aria-hidden', 'true');
    timeline.appendChild(tick);
  }
  const syncBar = (): void => {
    head.style.left = `${(THREE.MathUtils.clamp(time / duration, 0, 1) * 100).toFixed(3)}%`;
    timeEl.textContent = `${time.toFixed(1)}s / ${duration.toFixed(1)}s`;
    timeline.setAttribute('aria-valuenow', time.toFixed(2));
    timeline.setAttribute('aria-valuetext', `${time.toFixed(1)} of ${duration.toFixed(1)} seconds`);
  };
  const seek = (t: number): void => {
    time = THREE.MathUtils.clamp(t, 0, duration);
    paceBreak();
    syncBar();
    renderAt(time);
  };
  const ratioAt = (ev: PointerEvent): number => {
    const r = timeline.getBoundingClientRect();
    return THREE.MathUtils.clamp((ev.clientX - r.left) / Math.max(r.width, 1), 0, 1);
  };
  timeline.addEventListener('pointerdown', (ev) => {
    dragging = true;
    resumeAfterDrag = playing;
    playing = false;
    syncPlay();
    try {
      timeline.setPointerCapture(ev.pointerId); // synthetic/ended pointers may not capture
    } catch {
      /* seek anyway */
    }
    seek(ratioAt(ev) * duration);
    ev.preventDefault();
  });
  timeline.addEventListener('pointermove', (ev) => {
    if (dragging) seek(ratioAt(ev) * duration);
  });
  const endDrag = (ev: PointerEvent): void => {
    if (!dragging) return;
    dragging = false;
    playing = resumeAfterDrag && time < duration;
    paceBreak();
    syncPlay();
    try {
      timeline.releasePointerCapture(ev.pointerId);
    } catch {
      /* not captured */
    }
  };
  timeline.addEventListener('pointerup', endDrag);
  timeline.addEventListener('pointercancel', endDrag);
  timeline.addEventListener('keydown', (ev) => {
    const k = ev as KeyboardEvent;
    if (k.key === 'ArrowLeft') seek(time - 0.25);
    else if (k.key === 'ArrowRight') seek(time + 0.25);
    else if (k.key === 'Home') seek(0);
    else if (k.key === 'End') seek(duration);
    else return;
    k.preventDefault();
  });
  const speedBtns: HTMLButtonElement[] = [];
  for (const s of [1, 2, 4]) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'gw-replay-speed';
    b.dataset['speed'] = String(s);
    b.textContent = `${s}×`;
    b.addEventListener('click', () => {
      rate = s;
      paceBreak(); // the ledger's next interval carries the NEW multiplier
      for (const o of speedBtns) o.setAttribute('aria-pressed', String(o === b));
    });
    speedBtns.push(b);
  }
  const exit = document.createElement('a');
  exit.id = 'gw-replay-build';
  exit.href = `?level=${encodeURIComponent(level.id)}`;
  exit.textContent = 'Build your own';
  bar.append(playBtn, timeEl, timeline, ...speedBtns, exit);
  syncPlay();
  syncBar();
  bar.hidden = false;

  // e2e seams (debug surface, not UI): the recorded trace for the node↔
  // browser seek proof, the live rendered state, and the finish shot's cup
  // projected through the replay camera
  const w = window as unknown as Record<string, unknown>;
  w.__gwReplayTrace = () => ({
    dt: trace.dt,
    steps: trace.steps,
    time: trace.time,
    duration: trace.duration,
    status: trace.status,
    hash: trace.hash,
    events: trace.events,
    shots: trace.plan.shots,
    cuts: trace.plan.cuts,
    verified,
    poses: Array.from({ length: trace.steps }, (_, i) => [
      trace.pos[i * 3]!,
      trace.pos[i * 3 + 1]!,
      trace.pos[i * 3 + 2]!,
      trace.quat[i * 4]!,
      trace.quat[i * 4 + 1]!,
      trace.quat[i * 4 + 2]!,
      trace.quat[i * 4 + 3]!,
    ]),
  });
  w.__gwReplayState = () => {
    const k = stepAt(time);
    return {
      t: time,
      step: k,
      pos: [trace.pos[k * 3]!, trace.pos[k * 3 + 1]!, trace.pos[k * 3 + 2]!],
      quat: [trace.quat[k * 4]!, trace.quat[k * 4 + 1]!, trace.quat[k * 4 + 2]!, trace.quat[k * 4 + 3]!],
    };
  };
  // the pacing ledger of the CURRENT contiguous play session (see `pace`)
  w.__gwReplayPace = (): [number, number, number][] => pace.map((p) => [p[0]!, p[1]!, p[2]!]);
  const cup = cupView(payload.build);
  w.__gwReplayCarNdc = (): number[] | null => {
    const k = stepAt(time);
    camera.updateMatrixWorld();
    const v = new THREE.Vector3(trace.pos[k * 3]!, trace.pos[k * 3 + 1]!, trace.pos[k * 3 + 2]!).project(camera);
    return [v.x, v.y];
  };
  w.__gwReplayGoalNdc = (): number[] | null => {
    if (!cup) return null;
    camera.updateMatrixWorld();
    const v = cup.center.clone().project(camera);
    return [v.x, v.y];
  };

  let last = performance.now();
  const frame = (now: number): void => {
    requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, 0.25);
    last = now;
    if (playing && !dragging) {
      time = Math.min(duration, time + dt * rate);
      if (time >= duration) {
        time = duration;
        playing = false;
        paceBreak(); // a clamped final frame does not honour the law
        syncPlay();
      } else {
        pace.push([now, time, rate]);
        if (pace.length > 240) pace.shift();
      }
      syncBar();
      renderAt(time);
    }
  };
  renderAt(0);
  requestAnimationFrame(frame);
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
  // THE DEV-PREVIEW BADGE (stage 5, playtest BB item 5: "?level= loads a
  // locked level directly; the map shows it locked"). The debug-param
  // doctrine stands — `?level=` still ADDRESSES any registered rung, on or
  // off the campaign (Decision Log 2026-10-07) — but a CAMPAIGN rung the
  // save has not unlocked says so honestly instead of pretending to be a
  // normal visit: the badge names what the player is standing in, and the
  // terminal edge below withholds the mint (`recordStars` never fires on a
  // dev preview, so the line cannot open the next rung — the badge is true
  // because the write is gated, not merely worded). Off-ladder rigs (the
  // sandbox, the feel track) report unlocked and wear no badge; the shared
  // replay page never builds this DOM at all (`bootSharedRun`).
  const devPreview = !levelUnlock(loadSave().progress, level.id).unlocked;
  if (devPreview) {
    const badge = document.createElement('p');
    badge.id = 'gw-dev-preview';
    badge.textContent = 'dev preview — progress from here won’t unlock anything';
    stage.appendChild(badge); // corner-pinned: zero layout flow over the canvas
  }
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
  // was uninterpretable copy; playtest Z round7: "this code proves it"
  // proved WHAT to WHOM — the summary is now the plain question the
  // disclosure answers (the engineering truth is unchanged: the hash
  // covers the body transforms along the path); it is just one player line.
  hashSummary.textContent = 'Why the same build always runs the same way';
  const hashValue = document.createElement('p');
  hashValue.id = 'gw-hash-value';
  const hashNote = document.createElement('p');
  hashNote.id = 'gw-hash-note';
  hashNote.hidden = true;
  hashDetails.append(hashSummary, hashValue, hashNote);
  root.appendChild(hashDetails);

  // ---- SOUND (stage 5) -------------------------------------------------
  // The mix is event-driven ONLY: every voice is fired from a boot/UI hook
  // below (a button, an edit, the terminal edge of a run) or from the
  // throttled read-only `sound.frame` sink at the foot of the frame loop.
  // The engine reads NO sim state beyond what the screen already renders,
  // touches NO world object, and the sim/hash never see it (the import
  // graph is asserted in tests/unit/sound.test.ts). The AudioContext is
  // built on the FIRST gesture only (autoplay policy) — see `unlockSound`.
  const sound = createSound();
  const unlockSound = (): void => sound.unlock();
  window.addEventListener('pointerdown', unlockSound, { capture: true });
  window.addEventListener('keydown', unlockSound, { capture: true });
  document.addEventListener('visibilitychange', () =>
    sound.setVisible(document.visibilityState === 'visible'),
  );
  // the per-set ambience bed (kitchen clock, garden birds — sparse, all
  // synthesized; see src/sound/voices.ts)
  sound.setBed(setReg?.id ?? null);
  // mute + volume, persisted under `settings.sound` (no schema bump — the
  // optional-key round-trip documented in src/save/save.ts)
  const soundWrap = document.createElement('div');
  soundWrap.id = 'gw-sound';
  // ABSOLUTELY positioned in the page's top-right corner: zero layout
  // flow (the committed shell baseline is a canvas-element screenshot; a
  // reflow that nudges the canvas rect by a fraction of a pixel is enough
  // to break it), and outside the canvas box so it can never land inside
  // a rendered frame
  soundWrap.style.cssText =
    'position:absolute;top:8px;right:12px;z-index:4;display:flex;gap:6px;align-items:center;font:12px system-ui,sans-serif';
  const soundToggle = document.createElement('button');
  soundToggle.id = 'gw-sound-toggle';
  soundToggle.type = 'button';
  soundToggle.setAttribute('aria-pressed', String(!sound.muted));
  soundToggle.textContent = sound.muted ? 'Sound: off' : 'Sound: on';
  soundToggle.style.cssText =
    'pointer-events:auto;font:12px system-ui,sans-serif;padding:2px 8px;border-radius:4px;border:1px solid rgba(185,163,124,0.7);background:rgba(255,248,236,0.78);color:#6a5636;cursor:pointer';
  const soundVolume = document.createElement('input');
  soundVolume.id = 'gw-sound-volume';
  soundVolume.type = 'range';
  soundVolume.min = '0';
  soundVolume.max = '100';
  soundVolume.step = '5';
  soundVolume.value = String(Math.round(sound.volume * 100));
  soundVolume.setAttribute('aria-label', 'Sound volume');
  soundVolume.style.cssText = 'pointer-events:auto;width:72px;accent-color:#b9915a';
  soundToggle.addEventListener('click', () => {
    sound.setMuted(!sound.muted);
    soundToggle.textContent = sound.muted ? 'Sound: off' : 'Sound: on';
    soundToggle.setAttribute('aria-pressed', String(!sound.muted));
    if (document.activeElement === soundToggle) soundToggle.blur(); // playtests P+Q focus policy
  });
  soundVolume.addEventListener('input', () => {
    sound.setVolume(Number(soundVolume.value) / 100);
  });
  soundWrap.append(soundToggle, soundVolume);
  root.appendChild(soundWrap); // page-corner absolute: zero layout flow
  // the e2e seams (debug surface, not UI): engine state for the mute-
  // across-reload and repetition-guard specs, and the offline loudness
  // renderer the loudness spec measures through the SAME master chain
  (window as unknown as Record<string, unknown>).__gwSound = () => sound.state();
  void import('./sound/bus.ts').then((bus) => {
    (window as unknown as Record<string, unknown>).__gwSoundRender = (
      name: Parameters<typeof bus.renderVoice>[1],
    ) => bus.renderVoice(OfflineAudioContext, name);
  });

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
  // THE GRAPHICS HICCUP (playtest W round5: a tab that went BLACK and
  // silent mid-drag — no message, no console, nothing to click). If the
  // WebGL context is ever lost the page must never rot silently: the
  // frame loop PAUSES CLEANLY (no physics steps into a dead render, no
  // giant catch-up dt on return), an overlay SAYS what happened and the
  // way back, and the `preventDefault` on `lost` is what lets the browser
  // (or the click, via `forceContextRestore`) hand a context back.
  // three re-uploads its resources on restore; the next live frame paints
  // the full world again.
  let contextLost = false;
  const hiccup = document.createElement('div');
  hiccup.id = 'gw-hiccup';
  hiccup.hidden = true;
  hiccup.textContent = 'graphics hiccup — click to restore';
  stage.appendChild(hiccup);
  renderer.domElement.addEventListener('webglcontextlost', (ev) => {
    ev.preventDefault(); // no preventDefault = the browser never restores
    contextLost = true;
    hiccup.hidden = false;
  });
  renderer.domElement.addEventListener('webglcontextrestored', () => {
    contextLost = false;
    hiccup.hidden = true;
  });
  hiccup.addEventListener('click', () => {
    if (contextLost) renderer.forceContextRestore();
  });
  // the e2e seam for the recovery contract (debug surface, not UI)
  (window as unknown as Record<string, unknown>).__gwForceContextLoss = () =>
    renderer.forceContextLoss();
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

  // stage 4 BUILD VIEW (playtest Q: "built 4 levels from ONE FIXED ANGLE,
  // left-drag PLACES"): the player-adjustable layer over the static table
  // framing — right-drag (or Space+drag) = damped yaw-only orbit clamped
  // to the table's sensible hemisphere, left-drag past the click threshold
  // = pan, and a click that TRAVELLED places NOTHING (the one gesture
  // contract lives in `attachBuildView`, src/camera/build-camera.ts)
  const buildView = new BuildCamera();
  // THE GESTURE OWNER ATTACHES AT CANVAS MOUNT, NOT AT LEVEL-READY
  // (playtest Y round6: "every level: clicks inert, Enter always placed"
  // while a scripted down/up in a director session placed fine — the
  // suspect space was an event arriving at a canvas that had no listeners
  // yet). The canvas is live the moment the warm frame paints, so the
  // gesture recogniser mounts HERE — before the set module's dynamic
  // import and before `World.create` await the physics wasm — rather
  // than ~0.5 s later on the other side of those awaits. The handlers
  // dispatch through `builderRef`, which stays null until the builder
  // exists: events in the boot window resolve to aim/place as soon as
  // there is a builder to answer, and press state is tracked from the
  // FIRST event the canvas sees, never from mid-sequence.
  let builderRef: Builder | null = null;
  attachBuildView(renderer.domElement, buildView, {
    onHover: (x, y) => builderRef?.aimAt(x, y),
    onPlace: (x, y) => builderRef?.clickPlaceAt(x, y),
  });

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
  // THE EDIT-SIDE AUTOSAVE (playtest T round4: "reload kept 1 of 3"): the
  // working build is stored per EDIT BURST, not per run — a level change is
  // a cross-document navigation, so the two flush hooks below (a reload or a
  // tab put away inside the debounce window still stores the last edit) mean
  // no edit is ever younger than the bytes the next boot reads back.
  const autosave = createBuildAutosave((b) => rememberBuild(b));
  window.addEventListener('pagehide', () => autosave.flush());
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') autosave.flush();
  });
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
  // the e2e seam for the DISTINCT-OUTCOME tie law (playtest BB bug 3): the
  // dry-run canonical hash of each tie candidate of the last aim, and the
  // builder's current build for the test-side dry run (debug surface)
  (window as unknown as Record<string, unknown>).__gwTieOutcomes = (): string[] => builder.tieOutcomes();
  (window as unknown as Record<string, unknown>).__gwTieSockets = () =>
    builder.tieSockets().map((s) => ({
      pos: [s.pos.x, s.pos.y, s.pos.z],
      tangent: [s.tangent.x, s.tangent.y, s.tangent.z],
      up: [s.up.x, s.up.y, s.up.z],
    }));
  (window as unknown as Record<string, unknown>).__gwBuildJson = (): string => serialize(builder.build());
  // the held piece's EXACT ghosting state (kind, tray-override params,
  // flip) — so the test-side dry run of the tie law recomputes hashes at
  // the inputs the app actually seats with (debug surface)
  (window as unknown as Record<string, unknown>).__gwHeldState = () => builder.heldState();
  // the e2e seam for the FAILURE end-hold: the car's settled world
  // position — the death site the wide hold must keep in frame (debug
  // surface, not UI)
  (window as unknown as Record<string, unknown>).__gwCarPos = (): number[] | null => {
    const w = world;
    if (!w) return null;
    const p = w.carPose(0).pos;
    return [p.x, p.y, p.z];
  };
  // the e2e seam for the GOAL-IN-FRAME law (playtest U round 4: Pillow
  // Plateau's cup was never on screen at build framing): the build's
  // FINISH CUP capture centre projected to normalised device coords under
  // the LIVE camera — |x|,|y| <= 1 is inside the canvas. Levels whose
  // build has no cup report null (debug surface, not UI).
  (window as unknown as Record<string, unknown>).__gwGoalNdc = (): number[] | null => {
    if (!framingFocus) return null;
    const v = framingFocus.clone().project(camera);
    return [v.x, v.y];
  };
  // the e2e seam for the FAILURE-CAPTION law (playtest BB item 6: the
  // failure panel rendered mid-canvas and hid the ball's fate during the
  // flight camera): the BALL's screen position under the LIVE camera —
  // the same NDC space the strip's rect is checked against through the
  // canvas rect (debug surface, not UI).
  (window as unknown as Record<string, unknown>).__gwCarNdc = (): number[] | null => {
    const w = world;
    if (!w) return null;
    const p = w.carPose(0).pos;
    const v = new THREE.Vector3(p.x, p.y, p.z).project(camera);
    return [v.x, v.y];
  };

  createHelpDrawer(stage, { reducedMotion: loadSave().settings.reducedMotion ?? undefined });
  // quiet, focusable, TOP-RIGHT of the world (playtest A+F: “Help = collapsed
  // word-button at page bottom”); the drawer itself is an overlay, never
  // inline content pushing the page down (`src/ui/help.ts`).

  // THE ONE CANVAS GESTURE OWNER (playtest Q item 6): hover aims, a clean
  // click places, a travelling press frames (left-drag pans, right-drag or
  // Space+drag orbits) and never places. The builder no longer registers
  // pointer listeners of its own — press-move-release counted as a place
  // there, which WAS the accidental-placement bug. The listeners
  // themselves attached at canvas MOUNT (see `builderRef` above,
  // playtest Y round6); this only hands the live builder to them.
  const builder = (builderRef = createBuilder(builderHost, {
    level,
    build: startBuild,
    tray,
    trayParams: tray ? levelTrayParams(level, tray) : undefined,
    solids: setSolids,
    // A PLACE INTENT with the result modal up collapses the panel into the
    // build view BEFORE the attempt (playtest BB item 2: the click behind
    // an open panel was a silent no-op). The success path then places in
    // view (`onChange` rebuilds and reframes as ever); every refusal lands
    // its explanation on a live build view, never behind a panel.
    onPlaceIntent: () => dismissOverlay(),
    onChange: (build) => {
      autosave.edit(build);
      // first-time callout (§9.3): the first piece of a kind ever PLACED
      if (build.pieces.length > placedCount) {
        sound.voice('snap'); // the socket click — an EDIT event, not a sim one
        const line = firstSight(build.pieces[build.pieces.length - 1]!.def);
        if (line) calloutLine.textContent = line;
      } else if (build.pieces.length < placedCount) {
        sound.voice('blipUndo');
      }
      placedCount = build.pieces.length;
      resultPanel.hide(); // an edited build invalidates the last result
      void rebuild(build);
    },
  }));
  builder.attachCanvas(renderer.domElement, camera);
  builder.elements.launch.addEventListener('click', startRun);
  // the UI blips live on the BUTTONS (canvas placement already sounds the
  // snap through onChange — one voice per event, never two per action)
  builder.elements.place.addEventListener('click', () => sound.voice('blipPlace'));
  builder.elements.remove.addEventListener('click', () => sound.voice('blipUndo'));
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

  // ---- SHARE (playtest AA item 1: "no share button exists anywhere… I'd
  // send replays to a friend if the game would hand me a link") ----------
  // The whole `#s=` machinery already existed (`src/share/share.ts`, the
  // shared-run page, the card) with ONE missing surface: the panel never
  // offered it. `lastOutcome` is the run the panel is ABOUT — captured at
  // the terminal edge below, hash and all; `lastShare` is the link once a
  // press has made one. `currentBuild` cannot have moved under the panel:
  // any edit hides the panel (onChange), so the build, seed and hash the
  // link encodes are the run the player just watched.
  let lastShare: { url: string; time: number; stars: StarCount } | null = null;
  let lastOutcome: { hash: string; time: number; stars: StarCount } | null = null;
  resultPanel.share.addEventListener('click', () => {
    if (!lastOutcome) return;
    const outcome = lastOutcome;
    const payload: SharePayload = {
      levelId: level.id,
      seed: currentBuild.seed,
      hash: outcome.hash,
      build: currentBuild,
    };
    resultPanel.shareNote.hidden = false;
    resultPanel.shareNote.textContent = 'making link…';
    void encodeShareUrl(payload).then(
      (frag) => {
        const url = `${window.location.origin}${window.location.pathname}${frag}`;
        lastShare = { url, time: outcome.time, stars: outcome.stars };
        // the VISIBLE LINK is the fallback that never fails: clipboard
        // permission can be denied (headless, permissions policy, http),
        // a select-and-copy on a real input cannot
        resultPanel.shareUrl.value = url;
        resultPanel.shareRow.hidden = false;
        resultPanel.shareCard.hidden = false;
        return navigator.clipboard
          ?.writeText(url)
          .then(() => {
            resultPanel.shareNote.textContent = 'link copied — send it to a friend';
          })
          .catch(() => {
            resultPanel.shareNote.textContent = 'copy the link below';
          });
      },
      () => {
        resultPanel.shareNote.textContent = 'this browser could not build the link';
      },
    );
  });
  // the card PNG "if cheap" — it was already wired for the SHARED page
  // (`wireShareCard`); one reused call here, the card carrying the URL the
  // share press just made
  resultPanel.shareCard.addEventListener('click', () => {
    const s = lastShare;
    if (!s) return;
    resultPanel.shareNote.textContent = 'rendering card…';
    void generateShareCard({
      levelId: level.id,
      build: currentBuild,
      time: s.time,
      stars: s.stars,
      url: s.url,
    })
      .then((blob) => {
        downloadBlob(blob, `gravity-works-${level.id}.png`);
        resultPanel.shareNote.textContent = 'card downloaded';
      })
      .catch(() => {
        resultPanel.shareNote.textContent = 'card failed on this browser';
      });
  });

  // the e2e/keyboard-parity seam: the world position of the VISIBLE target
  // marker — arrows and hover move this socket, nothing targets invisibly
  (window as unknown as Record<string, unknown>).__gwTargetSocket = (): number[] | null => {
    const s = builder.targetSocket();
    return s ? [s.pos.x, s.pos.y, s.pos.z] : null;
  };
  // where a click lands ON the shown ring (client px) — the legit aim point
  // for gesture specs under the aim reach law (debug surface)
  (window as unknown as Record<string, unknown>).__gwTargetSocketPx = (): number[] | null => {
    const p = builder.targetSocketPx();
    return p ? [p.x, p.y] : null;
  };

  /** Star-gated progression (§9.2, playtest E/F/G): `Next level` appears
   *  only when the level HAS a star to its name — this run's OR the
   *  save's already-earned best (close-review F5: replay a level whose
   *  star is banked, fail this run, and the panel used to show Retry only
   *  while the level select said the next rung open — same save, two
   *  surfaces, two answers; `levelUnlock` reads the saved best, so the
   *  gate must too). The ladder walk stays the shell's (`nextLevelId`). */
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
    sound.stopRun(); // a walked-home car is not running; close the roll
    acc = 0;
    hazardsTouched = 0;
    runCamActive = false;
    endHold = null;
    buildView.reset();
    if (w.scene) frameCamera(camera, w.scene, framingFocus, null, buildView);
    resultPanel.hide();
  }

  // ESC CLOSES THE OVERLAY FIRST (playtest AA item 3: "Home did nothing
  // with the failure overlay up — camera stayed parked in a far failure
  // vista"). The overlay is the thing between the player and the Home
  // chord, so the FIRST Escape dismisses it and walks the framing home —
  // build view, home pose, car left where it fell (Retry is still the
  // button that moves the car). CAPTURE-phase stopPropagation hides the
  // press from the camera's double-Escape pair entirely, so the SECOND
  // Escape is a lone first half of the chord: it arms nothing the player
  // did not ask for, and a vista that is already home stays home.
  /** The overlay dismissal both doors share: Escape (below) and a PLACE
   *  INTENT while the panel is up (playtest BB item 2). The panel away,
   *  the framing walked home — the BUILD VIEW is what the placement (or
   *  the refusal line) plays out in. The car is left where it fell;
   *  Retry stays the button that moves it. */
  function dismissOverlay(): void {
    if (resultPanel.element.hidden) return;
    resultPanel.hide();
    runCamActive = false;
    endHold = null; // the damping tick must not re-solve the death hold
    buildView.reset();
    if (world?.scene) frameCamera(camera, world.scene, framingFocus, null, buildView);
  }

  window.addEventListener(
    'keydown',
    (ev) => {
      if (ev.key !== 'Escape' || resultPanel.element.hidden) return;
      ev.preventDefault();
      ev.stopPropagation(); // capture: the camera's Escape chord never sees this press
      dismissOverlay();
    },
    { capture: true },
  );

  function startRun(): void {
    acc = 0;
    hazardsTouched = 0;
    endHold = null; // a fresh release owns the framing again
    const w = world;
    if (!w) return;
    sound.stopRun(); // idempotent: a re-launch never stacks a second roll
    w.launch();
    sound.voice('launch');
    sound.beginRun();
    prevMeshPos = null; // the roll's speed reads motion, not the teleport home
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

  // the SOUND frame adapter's only memory: the car mesh's last drawn
  // position (screen motion, not sim state) — see the frame hook below
  let prevMeshPos: { x: number; y: number; z: number } | null = null;

  let last = performance.now();
  const frame = (now: number): void => {
    requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, 0.25);
    last = now;
    // PAUSED FOR THE HICCUP: no stepping, no rendering, no catch-up — the
    // world waits exactly where it was until the context returns (see the
    // `gw-hiccup` overlay above).
    if (contextLost) return;
    // THE AIM NEVER GOES STALE UNDER A STILL CURSOR (playtests V+W round5:
    // the ghost sat at a constant offset because layout above the canvas
    // moved the canvas rect between pointer events). One rect comparison;
    // an unmoved page pays nothing. See `revalidateAim` in `src/ui/builder.ts`.
    builder.revalidateAim();
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
      // `actionableKindsFor` — plus the PLACED kinds that PHRASE the tails
      // (round-5 playtest W: a tray-only kind must be told to ADD, not to
      // fix a piece the build never had) — see `placedKindsFor` — plus the
      // STOCK-LEFT kinds that carry the drive-off tail (stage-5 B2 pass 2,
      // playtest AA: six builds, one undifferentiated note) — see
      // `stockedKindsFor`. UI-side only; physics and the hash never see
      // any of the sets.
      const model = resultModel(
        result,
        parFor(level.id, level.par),
        recorder.evidence(),
        bestStarsBefore,
        actionableKindsFor(currentBuild, tray),
        placedKindsFor(currentBuild),
        goalNounFor(level),
        stockedKindsFor(currentBuild, tray),
        flippedKindsFor(level, currentBuild),
      );
      resultPanel.show(model);
      // the run's OUTCOME is an audio event exactly once per run: the
      // engine hears the same fields the panel prints (status, stars,
      // new-best, hazard tally) and nothing else
      sound.finishRun({
        status: result.status,
        stars: model.stars,
        newBest: model.stars > bestStarsBefore,
        hazardsTouched: result.hazardsTouched,
      });
      // §9.2 progress persists: a finished run's stars are the save's best
      // for this level (a failure records nothing); this is what opens the
      // next rung on the level select, exactly what `gateNext` just offered
      // — EXCEPT on a dev preview (BB item 5): a locked rung addressed by
      // `?level=` mints no unlock, so the badge's promise is a property of
      // the code path, not of copy. The gate reports 0 there, keeping the
      // panel's Next honest with the "unlocks nothing" claim.
      if (!devPreview) recordStars(level.id, model.stars);
      gateNext(devPreview ? 0 : Math.max(model.stars, bestStarsBefore));
      const h = w.hashHex();
      if (lastRun && lastRun.hash === h && lastRun.pieces !== result.piecesUsed) {
        hashNote.textContent = 'same run — your extra piece never touched the road';
        hashNote.hidden = false;
      } else {
        hashNote.hidden = true;
      }
      lastRun = { hash: h, pieces: result.piecesUsed };
      // the SHARE payload's run (see the share wiring): the hash, time and
      // stars of the run the panel is about, frozen at its terminal edge
      lastOutcome = { hash: h, time: result.time, stars: model.stars };
    }
    lastStatus = w.status;
    const pose = w.carPose(w.status === 'running' ? acc / FIXED_DT : 0);
    if (w.carMesh) {
      w.carMesh.position.set(pose.pos.x, pose.pos.y, pose.pos.z);
      w.carMesh.quaternion.set(pose.quat.x, pose.quat.y, pose.quat.z, pose.quat.w);
    }
    // SOUND adapter (stage 5): READ-ONLY and OUTSIDE the stepping loop —
    // the two continuous sounds are driven by what the SCREEN shows: the
    // car mesh's own on-screen speed (position delta / wall dt, fed to the
    // roll at <=20 Hz by the engine's throttle) and how visibly inverted
    // the car is (the ring ping's edge). The engine pulls NOTHING.
    {
      const here = pose.pos;
      let screenSpeed = 0;
      if (prevMeshPos && dt > 0.001) {
        const dx = here.x - prevMeshPos.x;
        const dy = here.y - prevMeshPos.y;
        const dz = here.z - prevMeshPos.z;
        screenSpeed = Math.sqrt(dx * dx + dy * dy + dz * dz) / dt;
      }
      prevMeshPos = { x: here.x, y: here.y, z: here.z };
      sound.frame({
        dtMs: dt * 1000,
        running: w.status === 'running',
        screenSpeed,
        upY: upAxisYOfQuat(pose.quat),
      });
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
