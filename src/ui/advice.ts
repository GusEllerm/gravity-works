/**
 * THE ADVICE-DATA DERIVATIONS (program T0.1, extracted verbatim from
 * `src/boot.ts`): the pure functions the failure note's advice gates and the
 * tray read off LEVEL + BUILD DATA alone — which kinds a note may name
 * (`actionableKindsFor`), which it may CRITIQUE (`placedKindsFor`), which
 * were placed REVERSED (`flippedKindsFor`), which carry the drive-off tail
 * (`stockedKindsFor`), the goal-fixture NOUN the fell line ends on
 * (`goalNounFor`), plus the tray plumbing they stand on (`levelTray`,
 * `levelTrayParams`) and the player-piece tally the share card scores with
 * (`playerPieceCount`).
 *
 * Pure by law: nothing here touches a `World`, the physics, or the run hash
 * (the same UI-side law the sets were born under — playtests Q/W/AA/BB, see
 * `Modules/ui`); nothing here imports the renderer or the sim. The unit pins
 * live in `tests/unit/result.test.ts` (the kind-sets and the noun) and the
 * ladder tests (`levelTrayParams`, `stockedKindsFor`). `src/boot.ts` imports
 * these at the call sites; behavior is the boot's own unchanged line.
 */
import { fixtureQuota, type Build } from '../track/build.ts';
import { PIECES, pieceLabel, type PieceKind, type PieceParams } from '../track/pieces.ts';
import { SNAP_ANGLE_TOL, SNAP_TRANSLATION_TOL } from '../track/snap.ts';
import { socketGap, tangentAngle, transformSocket, type Socket } from '../track/socket.ts';
import type { Level } from '../world/level.ts';

/** The level's tray map when it declares one (a `KitchenLevel` seam; the
 *  contract `Level` has no tray, so the builder treats undefined as
 *  everything-unlocked). Read structurally, like `levelSet` in the boot. */
export function levelTray(level: Level): Partial<Record<PieceKind, number>> | undefined {
  const tray = (level as { tray?: Partial<Record<PieceKind, number>> }).tray;
  return tray && typeof tray === 'object' ? tray : undefined;
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
