// THE PULL-BACK PROOF — the final-sheet probe's item (c), per room.
//
//   node tools/pullback-verify.mjs
//
// The probe (`Sessions/2026-10-12 Final sheet probe.md`, suffocation
// #2/#3 and verdict (c)): the line overshoots the default cup, the note
// says `the straight sits past the cup — pull it back · press ] to walk
// the open ends`, and the OLD Remove could only ever take the LAST piece
// placed — a correct advice sentence with no reachable verb, 3 of 6
// sandboxes unclosable. This sweep plays the probe's overshoot scenario
// on each of the six sandboxes through the shipped deterministic replay
// harness (the `replay:all` machinery — no GPU) and prints the table
// that is the claim: verbs actually heal, in every room.
//
// THE SCENARIO, one line of it: the sandbox's own par build, except the
// piece that FINISHES the line — the one seated on the cup's entry —
// was placed EARLY instead at the cup's OPEN EXIT (a legal seat the
// builder tells at; the probe's overshoot). The chain therefore stops
// one piece short of the cup, and the overshoot piece is NOT the last
// piece the tray owns — which is exactly the shape that made the old
// LIFO button unable to obey the sentence. The shipped builder's shape
// is kept: fixtures anchored first (`initialBuild`), tray pieces after,
// in placement order.
//
// THE COLUMNS:
//   die            the overshoot build's terminal status — must NOT be `finished`.
//   note names     `moveHintFor`'s ORPHAN clause (the note's sentence) — must name
//                  the overshoot kind, and the pull-back target must be THAT piece.
//   LIFO (old)     the soft-lock column: the old law removes the LAST piece and the
//                  `]`-walked Place seats it back at the head — the build returns to
//                  the scenario, the overshoot still sits past the cup, the note
//                  repeats, the replay still does not finish. FAILS if it ever heals.
//   verbs (now)    the shipped law: Remove takes the named piece, Place seats it at
//                  the open chain head (the `]`-walked seat); the rebuild is the
//                  par line's geometry verbatim (transform multiset) and FINISHES.
//
// Exits non-zero on any red cell. Pure over level data and the shipped
// replay harness — nothing here reaches a live page.
import { initRapier } from '../src/physics/sim.ts';
import { replayRun } from '../src/replay/replay.ts';
import { CAMPAIGN } from '../src/world/campaign.ts';
import { getLevel } from '../src/world/levels/feeltrack.level.ts';
import { PIECES, pieceLabel } from '../src/track/pieces.ts';
import { socketGap, transformSocket } from '../src/track/socket.ts';
import { canonicalBuild, fitSocket, SNAP_TRANSLATION_TOL } from '../src/track/snap.ts';
import { fixtureQuota, pullbackTargetIndex } from '../src/track/build.ts';
import { levelTray, moveHintFor } from '../src/ui/advice.ts';

await initRapier();

/** Same occurrence rule `initialBuild`/`playerPieceCount` apply. */
function fixtureMask(level, pieces) {
  const quota = fixtureQuota(level.fixtures ?? {});
  return pieces.map((p) => quota(p.def));
}

/** The far open exit of the START-CONNECTED chain, in placement order —
 *  the walk `chainHeadIndex` (builder) and `chainOrder` (advice) take. */
function chainHead(pieces) {
  const sock = (p) => PIECES[p.def].sockets(p.params).map((s) => transformSocket(s, p.transform));
  const seen = new Set();
  let current = pieces[0];
  seen.add(current);
  let cursor = sock(current)[1];
  for (let guard = 0; guard < pieces.length; guard++) {
    const next = pieces.find((p) => !seen.has(p) && socketGap(sock(p)[0], cursor) < SNAP_TRANSLATION_TOL);
    if (!next) break;
    seen.add(next);
    current = next;
    cursor = sock(next)[1];
  }
  return cursor;
}

const matrixKey = (m) => m.elements.map((v) => v.toFixed(6)).join(',');

let fail = 0;
console.log('room      die         note names                                              LIFO (old)                                   verbs (now)');
for (const room of CAMPAIGN) {
  const level = getLevel(room.sandboxId);
  const par = level.parBuild();
  const mask = fixtureMask(level, par.pieces);
  const goalAt = par.pieces.findIndex((p) => PIECES[p.def].captureVolume !== undefined);
  const goal = par.pieces[goalAt];
  const [goalEntry, goalExit] = PIECES[goal.def].sockets(goal.params).map((s) => transformSocket(s, goal.transform));
  // the piece that finishes the par line: its EXIT joins the cup's ENTRY
  const pAt = par.pieces.findIndex(
    (p, i) =>
      i !== goalAt && socketGap(transformSocket(PIECES[p.def].sockets(p.params)[1], p.transform), goalEntry) < SNAP_TRANSLATION_TOL,
  );
  const P = par.pieces[pAt];

  // ---- THE OVERSHOT BUILD (shipped builder's shape). The probe's seat
  // is the piece that finishes the par line; where that seat cannot die
  // (porch: the sink's sling-shot clears the missing ride-to-cup straight
  // and the run captures anyway — no soft-lock exists at that seat, and
  // the sweep says so rather than staging a fake death), the candidate
  // walks one piece UP the par line until the scenario actually dies.
  const chainPieces = par.pieces.filter((_, i) => !mask[i]);
  let candAt = chainPieces.indexOf(P);
  let scenario = null;
  let die = null;
  let Pc = null;
  for (; candAt >= 0; candAt--) {
    Pc = chainPieces[candAt];
    const fixtures = par.pieces.filter((_, i) => mask[i]).map((p, i) => ({ ...p, seq: i }));
    const cOver = { ...Pc, transform: fitSocket(goalExit, PIECES[Pc.def].sockets(Pc.params)[0]), seq: fixtures.length };
    const cOthers = chainPieces.filter((p) => p !== Pc).map((p, i) => ({ ...p, seq: fixtures.length + 1 + i }));
    const cand = { levelId: level.id, pieces: canonicalBuild([...fixtures, cOver, ...cOthers]), seed: level.seed };
    const r = await replayRun(level, cand, {});
    if (r.status !== 'finished') {
      scenario = cand;
      Pc = cOver;
      die = r;
      break;
    }
    if (candAt === 0) die = r;
    scenario = cand;
  }

  // ---- reference: the same shape placed in PAR order (the builder's own par line)
  const parity = {
    levelId: level.id,
    pieces: canonicalBuild([
      ...par.pieces.filter((_, i) => mask[i]).map((p, i) => ({ ...p, seq: i })),
      ...chainPieces.map((p, i) => ({ ...p, seq: par.pieces.filter((_, j) => mask[j]).length + i })),
    ]),
    seed: level.seed,
  };
  const parityRun = await replayRun(level, parity, {});
  const Pover = Pc;

  // ---- claim 1: the scenario died (replayed in the candidate loop), and
  // the note names the overshoot piece
  const hint = moveHintFor(level, scenario, levelTray(level));
  const pb = pullbackTargetIndex(scenario.pieces, level.fixtures, new Set(Object.keys(level.tray ?? {})));
  const named = hint?.move === 'orphan' && pb >= 0 && scenario.pieces[pb] === Pover;
  const clause = named ? hint.clause : `NOT-NAMED (${hint?.move ?? 'null'})`;

  // ---- claim 2 (soft-lock): the old LIFO law + the ]-walked Place
  let lifo = scenario.pieces.length - 1;
  const trayKinds = new Set(Object.keys(level.tray ?? {}));
  while (lifo >= 0 && !trayKinds.has(scenario.pieces[lifo].def)) lifo -= 1;
  const lifoTook = scenario.pieces[lifo];
  const lifoRemoved = canonicalBuild(scenario.pieces.filter((p) => p !== lifoTook).map((p, i) => ({ ...p, seq: i })));
  const lifoPlaced = [...lifoRemoved, { ...lifoTook, transform: fitSocket(chainHead(lifoRemoved), PIECES[lifoTook.def].sockets(lifoTook.params)[0]), seq: lifoRemoved.length }];
  const lifoBuild = { levelId: level.id, pieces: canonicalBuild(lifoPlaced), seed: level.seed };
  const lifoRun = await replayRun(level, lifoBuild, {});
  const lifoHint = moveHintFor(level, lifoBuild, levelTray(level));
  const softLock =
    lifo !== pb && lifoRun.status !== 'finished' && lifoHint?.move === 'orphan' && lifoHint.clause === hint?.clause;

  // ---- claim 3 (heal): pull the NAMED piece, Place at the head, replay
  const afterRemove = canonicalBuild(scenario.pieces.filter((p) => p !== scenario.pieces[pb]).map((p, i) => ({ ...p, seq: i })));
  const seatAt = fitSocket(chainHead(afterRemove), PIECES[Pover.def].sockets(Pover.params)[0]);
  const healed = {
    levelId: level.id,
    pieces: canonicalBuild([...afterRemove, { ...Pover, transform: seatAt, seq: afterRemove.length }]),
    seed: level.seed,
  };
  const healRun = await replayRun(level, healed, {});
  // geometry verbatim: the healed transform multiset IS the par build's
  const parSet = [...par.pieces.map((p) => matrixKey(p.transform))].sort();
  const healSet = [...healed.pieces.map((p) => matrixKey(p.transform))].sort();
  const sameLine = parSet.length === healSet.length && parSet.every((k, i) => k === healSet[i]);
  const heals =
    healRun.status === 'finished' &&
    sameLine &&
    parityRun.status === 'finished' &&
    Math.abs(healRun.time - parityRun.time) < 0.002;

  const ok = die.status !== 'finished' && named && softLock && heals;
  if (!ok) fail++;
  console.log(
    `${room.id.padEnd(9)} ${(die.status + (die.status === 'finished' ? '!!' : '')).padEnd(11)} ` +
      `${clause.padEnd(54)} ${softLock ? `removed+replaced ${pieceLabel(lifoTook.def).toLowerCase()}; still names` : 'LETHAL!!'} ` +
      `${'  '.repeat(1)}${heals ? `finished ${healRun.time.toFixed(3)} s = par ${parityRun.time.toFixed(3)} s` : `FAIL(${healRun.status})`}`,
  );
}
console.log(`${CAMPAIGN.length} sandboxes, ${fail ? `${fail} FAILED` : 'pull-back verified in every room'}`);
process.exit(fail ? 1 : 0);
