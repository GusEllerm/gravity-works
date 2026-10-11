#!/usr/bin/env node
/**
 * THE KITCHEN02 ORDER TABLE (round-2 Lane A — Action Plan 2026-10-11, "the
 * truth of choice"). Every click order of the four tray asks (2 straight
 * buttons, 1 `gapLip`, 1 `drop` — 24 permutations, 12 distinct seatings) is
 * played through the SHIPPED placement model, not a chain cursor:
 *
 *   - fixtures (ramp, cup, run-out curve) mount at their par transforms
 *     (the same `initialBuild` filter the builder uses);
 *   - each click seats at the ring's target — the CHAIN HEAD walked from
 *     `pieces[0]` through every join, FIXTURES INCLUDED, which is exactly
 *     why a dump whose third piece lands the head AT the cup finds the ring
 *     at "end of the pre-built curve" past the run-out (the 2026-10-11
 *     player evaluation's order 2: the guard saw no cup-body overlap there);
 *   - a seat is refused when its 2 mm-shrunk piece box overlaps the goal
 *     BODY (`goalGuardFor`) — or when the aimed open end carries the goal
 *     tell (the cup's own exit or any end PAST the mouth plane), which on
 *     a guarded rung is a REFUSAL since the round-2 Lane A pass
 *     (`src/ui/builder.ts` place()).
 *
 * The outcome build is then replayed headless on the shipped mount and
 * scored with the shipped star law against pars.json, so the OUTCOME column
 * is a MEASURED truth: refused/finishes/stars per order. Exit code 1 if any
 * order seats all four pieces or any order earns 3 stars on a build that is
 * not an authored line (the Lane A invariant).
 *
 * usage: node scripts/k02-order-table.mjs [--extended] [--chains]
 */
import * as THREE from 'three';
import { initRapier } from '../src/physics/sim.ts';
import { replayRun } from '../src/replay/replay.ts';
import { PIECES, pieceGeometries } from '../src/track/pieces.ts';
import { fitSocket } from '../src/track/snap.ts';
import { transformSocket } from '../src/track/socket.ts';
import { fixtureQuota } from '../src/track/build.ts';
import { goalGuardFor, JOIN_TOL } from '../src/ui/builder.ts';
import { KITCHEN02 } from '../src/world/levels/kitchen02.level.ts';
import { readFileSync } from 'node:fs';

// pars.json read directly (the `stars.ts` module imports it without an
// import attribute, which vite allows and node's type-stripping does not).
const PARS = Object.fromEntries(
  JSON.parse(readFileSync(new URL('../src/world/pars.json', import.meta.url), 'utf8')).map((p) => [p.levelId, { pieces: p.parPieces, time: p.parTime }]),
);

const CHAINS = process.argv.includes('--chains');

/** Tray asks in TRAY-BUTTON order (kind order): straight x2, gapLip, drop. */
const ASKS = ['straight', 'straight', 'gapLip', 'drop'];
const trayParams = {
  straight: { length: 0.11 },
  gapLip: { length: 0.0405, angle: 12, blend: 0.05 },
  drop: { height: 0.1, angle: 45, radius: 0.02, lead: 0.125 },
};

function perms(a) {
  if (a.length <= 1) return [[...a]];
  const out = [];
  a.forEach((x, i) =>
    perms([...a.slice(0, i), ...a.slice(i + 1)]).forEach((p) => out.push([x, ...p])),
  );
  return out;
}

function pieceSockets(p) {
  const [a, b] = PIECES[p.def].sockets(p.params);
  return [transformSocket(a, p.transform), transformSocket(b, p.transform)];
}

function fixturePieces() {
  const isFixture = fixtureQuota(KITCHEN02.fixtures);
  return KITCHEN02.parBuild().pieces
    .filter((p) => isFixture(p.def))
    .map((p, i) => ({ ...p, seq: i }));
}

const guard = goalGuardFor(KITCHEN02, fixturePieces());

/** The builder's `targets()`, mirrored (same join tolerance, same mouth-dot
 *  goal test — see `goalGuardFor`'s `mouth`). */
function targets(pieces) {
  const out = [];
  for (const p of pieces) {
    const [, exit] = pieceSockets(p);
    const taken = pieces.some(
      (q) => q.seq !== p.seq && pieceSockets(q).some((s) => s.pos.distanceTo(exit.pos) < JOIN_TOL),
    );
    if (taken) continue;
    out.push({
      socket: exit,
      goal:
        p.def === 'finishCup'
          ? 'cup'
          : guard !== null &&
              exit.pos.clone().sub(guard.mouth.pos).dot(guard.mouth.tangent) > JOIN_TOL
            ? guard.word
            : undefined,
    });
  }
  return out;
}

/** The builder's `chainHeadIndex()`, mirrored: walk the join chain from
 *  `pieces[0]` (the mounted ramp), fixtures included. */
function chainTarget(pieces) {
  let current = pieces[0];
  let cursor = pieceSockets(current)[1];
  for (let g = 0; g < pieces.length; g++) {
    const next = pieces.find(
      (p) => p.seq !== current.seq && pieceSockets(p)[0].pos.distanceTo(cursor.pos) < JOIN_TOL,
    );
    if (!next) break;
    current = next;
    cursor = pieceSockets(next)[1];
  }
  const list = targets(pieces);
  const at = list.findIndex((t) => t.socket.pos.distanceTo(cursor.pos) < JOIN_TOL);
  return list[Math.max(0, at)];
}

function seatBlocked(def, params, target) {
  if (chainPastGoal(target)) return { blocked: 'goal' };
  const m = fitSocket(target.socket, PIECES[def].sockets(params)[0]);
  const box = new THREE.Box3();
  for (const geo of pieceGeometries(def, params)) {
    geo.computeBoundingBox();
    if (geo.boundingBox) box.union(geo.boundingBox.clone().applyMatrix4(m));
  }
  if (box.isEmpty()) return { blocked: null, m };
  box.expandByScalar(-0.002);
  const hit = guard.solids.find((s) => s.box.intersectsBox(box));
  return { blocked: hit ? 'cup' : null, m };
}

/** The K3 goal tell as a REFUSAL (round 2): the aimed open end is the cup's
 *  own exit or any open end past the mouth plane. */
function chainPastGoal(target) {
  return target.goal !== undefined;
}

async function playOrder(order) {
  let pieces = fixturePieces();
  const notes = [];
  for (const def of order) {
    const t = chainTarget(pieces);
    const r = seatBlocked(def, trayParams[def], t);
    if (r.blocked !== null) {
      notes.push(`refused(${r.blocked})`);
      continue; // the ask stays on the tray; the ring does not move
    }
    pieces = [...pieces, { def, params: { ...trayParams[def] }, transform: r.m, seq: pieces.length }];
    notes.push(def === 'straight' ? 's' : def === 'gapLip' ? 'g' : 'd');
  }
  const run = await replayRun(KITCHEN02, { levelId: KITCHEN02.id, pieces, seed: KITCHEN02.seed });
  return { notes, run, seated: pieces.length - 3 };
}

/** Seating-only chains (the unit-test model): seat EVERY ask at the chain
 *  head with fixtures CHAINED off the end (the goal-guard test's model). */
async function playChain(order) {
  let cursor = pieceSockets(fixturePieces()[0])[1];
  const pieces = fixturePieces().slice(0, 1);
  const notes = [];
  for (const def of order) {
    const params = trayParams[def];
    const [inS, outS] = PIECES[def].sockets(params);
    const m = fitSocket(cursor, inS);
    const box = new THREE.Box3();
    for (const geo of pieceGeometries(def, params)) {
      geo.computeBoundingBox();
      if (geo.boundingBox) box.union(geo.boundingBox.clone().applyMatrix4(m));
    }
    box.expandByScalar(-0.002);
    if (guard.solids.find((s) => s.box.intersectsBox(box))) {
      notes.push('refused(cup)');
      continue;
    }
    pieces.push({ def, params, transform: m, seq: pieces.length });
    notes.push(def === 'straight' ? 's' : def === 'gapLip' ? 'g' : 'd');
    cursor = transformSocket(outS, m);
  }
  for (const p of fixturePieces().slice(1)) pieces.push({ ...p, seq: pieces.length });
  const run = await replayRun(KITCHEN02, { levelId: KITCHEN02.id, pieces, seed: KITCHEN02.seed });
  return { notes, run, seated: pieces.length - 3 };
}

await initRapier();
const par = PARS[KITCHEN02.id];
const rows = new Map();
for (const order of perms(ASKS)) {
  const key = order.map((k) => (k === 'straight' ? 's' : k === 'gapLip' ? 'g' : 'd')).join('');
  const play = CHAINS ? await playChain(order) : await playOrder(order);
  const { run, seated } = play;
  let stars = run.status === 'finished' ? 1 : 0;
  if (run.status === 'finished') {
    if (seated <= par.pieces) stars += 1;
    if (run.time <= par.time) stars += 1;
  }
  const outcome =
    run.status === 'finished'
      ? `FINISH ${run.time.toFixed(2)} ${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}`
      : `${run.status} ${run.time.toFixed(2)}`;
  const label = order.map((k) => (k === 'straight' ? 'straight' : k === 'gapLip' ? 'lip' : 'drop')).join(', ');
  const row = { label, seats: play.notes.join(' '), outcome, seated, stars, key };
  if (!rows.has(key)) rows.set(key, row);
  else rows.get(key).orders = (rows.get(key).orders ?? 1) + 1;
}
console.log(`kitchen02 guarded (body + mouth refusal) — par ${par.pieces} pieces / ${par.time} s`);
console.log('click order              seats seated outcome');
for (const row of [...rows.values()].sort((a, b) => a.key.localeCompare(b.key))) {
  console.log(
    `${row.label.padEnd(24)} ${row.seats.padEnd(17)} ${row.seated}  ${row.outcome}${row.orders ? `  (x${row.orders + 1} orders)` : ''}`,
  );
}
let bad = 0;
for (const row of rows.values()) {
  if (row.seated === 4) { console.log(`VIOLATION: ${row.key} seats all four`); bad++; }
  // an authored 3-star = the reference seating itself: drop first, then
  // two straights (the arc multiset pays 2 in EVERY seating by design).
  const authored = row.seats.startsWith('d s s');
  if (row.stars === 3 && !authored) { console.log(`VIOLATION: ${row.key} earns 3 stars off-list`); bad++; }
}
console.log(bad ? `${bad} LAW VIOLATIONS` : 'laws hold: no order seats four; every 3-star order is an authored line');
process.exit(bad ? 1 : 0);
