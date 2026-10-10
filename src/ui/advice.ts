/**
 * THE ADVICE-DATA DERIVATIONS (program T0.1, extracted verbatim from
 * `src/boot.ts`): the pure functions the failure note's advice gates and the
 * tray read off LEVEL + BUILD DATA alone — which kinds a note may name
 * (`actionableKindsFor`), which it may CRITIQUE (`placedKindsFor`), which
 * were placed REVERSED (`flippedKindsFor`), which carry the drive-off tail
 * (`stockedKindsFor`), the goal-fixture NOUN the fell line ends on
 * (`goalNounFor`), the MOVE clause's misplaced-piece reading of the build
 * (`moveHintFor` — the T2.1 voice wave: a piece stranded past the goal, or
 * a booster not spent at the head of the line), plus the tray plumbing they
 * stand on (`levelTray`, `levelTrayParams`) and the player-piece tally the
 * share card scores with (`playerPieceCount`).
 *
 * Pure by law: nothing here touches a `World`, the physics, or the run hash
 * (the same UI-side law the sets were born under — playtests Q/W/AA/BB, see
 * `Modules/ui`); nothing here imports the renderer or the sim. The unit pins
 * live in `tests/unit/result.test.ts` (the kind-sets and the noun) and the
 * ladder tests (`levelTrayParams`, `stockedKindsFor`). `src/boot.ts` imports
 * these at the call sites; behavior is the boot's own unchanged line.
 */
import { fixtureQuota, type Build, type PlacedPiece } from '../track/build.ts';
import { PIECES, pieceLabel, type PieceKind, type PieceParams } from '../track/pieces.ts';
import { SNAP_ANGLE_TOL, SNAP_TRANSLATION_TOL } from '../track/snap.ts';
import { JOIN_TOL } from './builder.ts';
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

// ---- the MOVE wave (program T2.1) -------------------------------------------

/**
 * THE CRITIQUE WHERE (P4 shortlist item 4 — the 2026-10-10 player
 * evaluation, bedroom02: "the dump FELL 2.33 s, note 'flatten the landing'
 * with NO socket tail and no verb to flatten with — I do not know how to
 * clear this rung from its own advice"). The nose-first family's CRITIQUE
 * halves ("flatten the landing", "lower the lip") name a kind the player
 * placed but never say WHICH ONE or WHERE it sits — the law the MOVE
 * clause already keeps (the orphan line says `past the cup`, the booster
 * line says `before the first lip`, the Remove button names `the landing
 * by the drop`). This is the same named-socket machinery read back off the
 * build data: a placed piece is anchored where its in-socket JOINS —
 * another piece's exit (`by the X`, the Remove button's own wording, one
 * verb one wording), the goal's far side (`past the cup`), or the car's
 * start socket (`at the car’s start point`) — and a kind with several
 * placements names each site once, joined with `or`. Kinds the build did
 * not place, and placements with no anchor at all (a stranded piece — the
 * ORPHAN clause's own story), carry no site: the sentence then keeps the
 * shipped head exactly, per the permissive law every gate in this file
 * follows. UI-side copy like the kind-sets — the physics and the run hash
 * never see it.
 */
export function placedWhereFor(level: Level, build: Build): Partial<Record<PieceKind, string>> {
  const out: Partial<Record<PieceKind, string>> = {};
  const exitOf = (p: PlacedPiece): Socket =>
    transformSocket(PIECES[p.def].sockets(p.params)[1], p.transform);
  // the same fixture-occurrence rule `playerPieceCount` applies: a CRITIQUE
  // addresses a piece the player PLACED, never a fixture the level shipped
  const fixtures = (level as unknown as { fixtures?: Partial<Record<PieceKind, number>> }).fixtures;
  const isFixture = fixtureQuota(fixtures ?? {});
  for (const p of build.pieces) {
    if (isFixture(p.def)) continue;
    const entry = transformSocket(PIECES[p.def].sockets(p.params)[0], p.transform);
    let phrase: string | null = null;
    const anchor = build.pieces.find((q) => q.seq !== p.seq && socketGap(exitOf(q), entry) < JOIN_TOL);
    if (anchor) {
      phrase =
        anchor.def === 'finishCup'
          ? `past the ${pieceLabel(anchor.def).toLowerCase()}`
          : `by the ${pieceLabel(anchor.def).toLowerCase()}`;
    } else if (entry.pos.distanceTo(level.startSocket.pos) < JOIN_TOL) {
      phrase = 'at the car’s start point';
    }
    if (phrase === null) continue;
    const had = out[p.def];
    if (had === undefined) out[p.def] = phrase;
    else if (!had.includes(phrase)) out[p.def] = `${had} or ${phrase}`;
  }
  return out;
}

/** What the drive-off note's MOVE clause can say about a build that has
 *  nothing left to ADD (playtest-R/k04 truth: "the failure note only knows
 *  how to say ADD when the tray is empty and the truth is MOVE"). Two
 *  readings, both facts about the socket graph the walk below computes:
 *
 *  - `orphan` — a piece the PLAYER placed sits PAST the goal fixture (the
 *    piece the registry gives a `captureVolume` — the same rule
 *    `goalNounFor` speaks): seated on the goal's own open exit, on a line
 *    the run can never travel (the builder's past-finish tell says it at
 *    the seat; this says it at the failure). The kitchen03/kitchen04
 *    residual (Home Deferred, Decision Log 2026-10-08): "fills the tray on
 *    the far side gets the BARE head" — the head now names the piece and
 *    the goal it sits past. A fixture chain-past the goal (kitchen02's
 *    intentional run-out deck) is NOT an orphan — only a placed piece the
 *    player paid tray pieces for names anything.
 *  - `booster` — the booster is actionable (in the tray or on the track)
 *    but is NOT spent at the head of the line: unplaced, seated off the
 *    start-connected chain, or seated after another tray piece. The
 *    kitchen05 sequencing truth (playtest Q round 2 + the 2026-10-09 player
 *    evaluation #5): `speed saved for later overshoots` is the ratified
 *    callout copy; this clause says WHERE and WHEN the failure happened to
 *    be a booster story. `head` is the word for the first tray piece the
 *    chain runs through ("before the first lip"), `startWord` the first
 *    built piece's word ("off the ramp"), and `reachable` says whether
 *    that head-of-line socket is OPEN right now — open means the `]` walk
 *    can put the ring on it, occupied means the line must come back first.
 *
 *  Pure level+build data, like every derivation in this file — the physics
 *  and the run hash never see it. `null` (and the `null` note argument that
 *  carries it) leaves every shipped line byte-identical. */
export type MoveHint = {
  /** Which of the two readings fired (see this type's doc). */
  move: 'orphan' | 'booster';
  /** The sentence half, phrased from build data (see `moveHintFor`). */
  clause: string;
  /** Whether the line teaches the `]` walk (`AIM_WALK_COPY`) — the walk
   *  doubled as aim-to-socket after the stage-6 Tab fix, and the program
   *  T2.1 law is to teach it wherever ordering is the answer. */
  teachWalk: boolean;
};

/** The start-connected chain of a build, in travel order: walk from the
 *  FIRST-BUILT piece through joins within `SNAP_TRANSLATION_TOL`, exactly
 *  the walk `chainHeadIndex` takes in `src/ui/builder.ts` (playtest N's
 *  law: that chain IS the head of the par line). Deterministic in build
 *  order — no scoring, no geometry beyond the join test. */
function chainOrder(build: Build): PlacedPiece[] {
  const pieceSockets = (p: PlacedPiece): [Socket, Socket] => {
    const [a, b] = PIECES[p.def].sockets(p.params);
    return [transformSocket(a, p.transform), transformSocket(b, p.transform)];
  };
  const order: PlacedPiece[] = [];
  if (build.pieces.length === 0) return order;
  const seen = new Set<PlacedPiece>();
  let current = build.pieces[0]!;
  order.push(current);
  seen.add(current);
  let cursor = pieceSockets(current)[1];
  for (let guard = 0; guard < build.pieces.length; guard++) {
    const next = build.pieces.find(
      (p) => !seen.has(p) && socketGap(pieceSockets(p)[0], cursor) < SNAP_TRANSLATION_TOL,
    );
    if (!next) break;
    seen.add(next);
    order.push(next);
    current = next;
    cursor = pieceSockets(next)[1];
  }
  return order;
}

/** The MOVE clause's reading of a build (see `MoveHint`). `tray` is the
 *  same map `stockedKindsFor` reads — needed only for the booster's
 *  stock-side half. */
export function moveHintFor(
  level: Level,
  build: Build,
  tray: Partial<Record<PieceKind, number>> | undefined,
): MoveHint | null {
  const fixtures = (level as unknown as { fixtures?: Partial<Record<PieceKind, number>> }).fixtures;
  // the SAME occurrence rule `playerPieceCount` applies: fixture quotas
  // fill in build order, the rest of the pieces are the player's
  const quota = fixtureQuota(fixtures ?? {});
  const isFixture = new Map<PlacedPiece, boolean>();
  for (const p of build.pieces) isFixture.set(p, quota(p.def));

  const order = chainOrder(build);

  // ORPHAN-PAST-GOAL: a piece seated on the goal's own open exit. Read
  // off the GOAL, not the start-chain walk — the stranded piece is usually
  // OFF the walked chain (the line let go short of the cup; that is why
  // the run fell), so the scan starts at the goal fixture itself.
  const goalAt = build.pieces.findIndex((p) => PIECES[p.def].captureVolume !== undefined);
  if (goalAt >= 0) {
    const goal = build.pieces[goalAt]!;
    const goalExit = transformSocket(PIECES[goal.def].sockets(goal.params)[1], goal.transform);
    const past = build.pieces.find(
      (p, i) =>
        i !== goalAt &&
        socketGap(transformSocket(PIECES[p.def].sockets(p.params)[0], p.transform), goalExit) <
          SNAP_TRANSLATION_TOL,
    );
    if (past && !isFixture.get(past)) {
      return {
        move: 'orphan',
        clause: `the ${pieceLabel(past.def).toLowerCase()} sits past the ${pieceLabel(goal.def).toLowerCase()} — pull it back`,
        teachWalk: true,
      };
    }
    // a piece seated past the goal that is a FIXTURE (kitchen02's visible
    // run-out curve sits on the cup's exit in EVERY kitchen02 line) is
    // authored, not stranded: it names nothing. The reading continues to
    // the booster half.
  }

  // BOOSTER SEQUENCING: actionable but not spent at the head of the line.
  const placedBooster = build.pieces.some((p) => p.def === 'booster');
  const boosterStock = tray ? (tray['booster'] ?? 0) - build.pieces.filter((p) => p.def === 'booster').length : 0;
  if (!placedBooster && boosterStock <= 0) return null;
  const firstTrayPiece = order.find((p) => !isFixture.get(p));
  if (firstTrayPiece?.def === 'booster') return null; // spent EARLY already — nothing to say
  if (order.length === 0)
    return { move: 'booster', clause: 'place the booster FIRST, straight off the start', teachWalk: true };
  // the head-of-line socket is open when the first built piece's exit has
  // nothing seated on it — the same open-end law the `]` walk walks. When
  // it is taken, the honest verb is REMOVE (back to the head of the line)
  // before the placing the sentence asks for.
  const start = order[0]!;
  const startWord = pieceLabel(start.def).toLowerCase();
  const startExit = transformSocket(PIECES[start.def].sockets(start.params)[1], start.transform);
  const reachable = !build.pieces.some(
    (p) =>
      p !== start &&
      socketGap(transformSocket(PIECES[p.def].sockets(p.params)[0], p.transform), startExit) <
        SNAP_TRANSLATION_TOL,
  );
  const head = firstTrayPiece ? pieceLabel(firstTrayPiece.def).toLowerCase() : null;
  return {
    move: 'booster',
    clause: head
      ? reachable
        ? `place the booster FIRST, before the first ${head}`
        : `remove back to the ${startWord} and place the booster FIRST, before the first ${head}`
      : `place the booster FIRST, straight off the ${startWord}`,
    teachWalk: true,
  };
}
