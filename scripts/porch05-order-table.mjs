#!/usr/bin/env node
/**
 * THE PORCH05 ORDER TABLE (round 3 — the verdict's cheapest point 1: the
 * finale's last gap gets a blocked-rim moment). Every click order of the
 * four tray asks (2 `gapLip` buttons, 1 `drop`, 1 `landing` — 24
 * permutations, 12 distinct seatings) is played through the SHIPPED
 * placement model, exactly as `scripts/k02-order-table.mjs` does for the
 * choice rung:
 *
 *   - fixtures (chute ramp, cup) mount at their par transforms (the same
 *     `initialBuild` filter the builder uses);
 *   - each click seats at the ring's target (the join-chain head walked
 *     from `pieces[0]`, fixtures included — `chainHeadIndex`);
 *   - a seat is refused when its 2 mm-shrunk piece box overlaps one of the
 *     rung's declared rims (`Level.blockedRims` → `blockedRimGuards`: the
 *     DOOR MOUTH's void column and the STOAM's mouth lip — the k02
 *     blocked-rim law pointed at the thresholds, placement layer only, no
 *     collider, no physics read);
 *   - the outcome build replays headless on the shipped mount and scores
 *     with the shipped star law against pars.json.
 *
 * Exit 1 if any NON-authored order seats all four pieces, if any order
 * earns 3 stars without seating the authored reference order, or if any
 * order meets NO rim refusal except the two authored orders (the round-3
 * porch05 invariant — `tests/unit/porch-guard.test.ts` asserts the same
 * laws, the e2e `porch-finale.spec.ts` samples it with real clicks).
 *
 * usage: node scripts/porch05-order-table.mjs
 */
import * as THREE from 'three';
import { initRapier } from '../src/physics/sim.ts';
import { replayRun } from '../src/replay/replay.ts';
import { PIECES, pieceGeometries } from '../src/track/pieces.ts';
import { fitSocket } from '../src/track/snap.ts';
import { transformSocket } from '../src/track/socket.ts';
import { fixtureQuota } from '../src/track/build.ts';
import { blockedRimGuards, JOIN_TOL } from '../src/ui/builder.ts';
import { PORCH05 } from '../src/world/levels/porch05.level.ts';
import { PORCH_LIP, PORCH_SINK, THRESHOLD_GAP } from '../src/world/levels/porch01.level.ts';
import { readFileSync } from 'node:fs';

const PARS = Object.fromEntries(
  JSON.parse(readFileSync(new URL('../src/world/pars.json', import.meta.url), 'utf8')).map((p) => [p.levelId, { pieces: p.parPieces, time: p.parTime }]),
);

/** Tray asks in TRAY-BUTTON order (kind order). */
const ASKS = ['gapLip', 'gapLip', 'drop', 'landing'];
const LETTER = { gapLip: 'g', drop: 'd', landing: 'l' };
const trayParams = { gapLip: PORCH_LIP, drop: THRESHOLD_GAP.drop, landing: PORCH_SINK };

/** The two authored click orders (tray asks in lay order, fixtures out). */
const AUTHORED = new Set(['glgd', 'gdgl']);

function perms(a) {
  if (a.length <= 1) return [[...a]];
  const out = [];
  a.forEach((x, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).forEach((p) => out.push([x, ...p])));
  return out;
}
function pieceSockets(p) {
  const [a, b] = PIECES[p.def].sockets(p.params);
  return [transformSocket(a, p.transform), transformSocket(b, p.transform)];
}
function fixturePieces() {
  const isFixture = fixtureQuota(PORCH05.fixtures);
  return PORCH05.parBuild().pieces.filter((p) => isFixture(p.def)).map((p, i) => ({ ...p, seq: i }));
}
const rims = blockedRimGuards(PORCH05);

function targets(pieces) {
  const out = [];
  for (const p of pieces) {
    const [, exit] = pieceSockets(p);
    const taken = pieces.some(
      (q) => q.seq !== p.seq && pieceSockets(q).some((s) => s.pos.distanceTo(exit.pos) < JOIN_TOL),
    );
    if (taken) continue;
    out.push({ socket: exit, goal: p.def === 'finishCup' });
  }
  return out;
}
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
  const m = fitSocket(target.socket, PIECES[def].sockets(params)[0]);
  const box = new THREE.Box3();
  for (const geo of pieceGeometries(def, params)) {
    geo.computeBoundingBox();
    if (geo.boundingBox) box.union(geo.boundingBox.clone().applyMatrix4(m));
  }
  if (box.isEmpty()) return { blocked: null, m };
  box.expandByScalar(-0.002);
  const hit = rims.find((r) => r.box.intersectsBox(box));
  return { blocked: hit ? hit.name : null, m };
}

await initRapier();
const par = PARS[PORCH05.id];
const rows = new Map();
let fail = 0;
for (const order of perms(ASKS)) {
  const key = order.map((k) => LETTER[k]).join('');
  let pieces = fixturePieces();
  const refusals = [];
  for (const def of order) {
    const t = chainTarget(pieces);
    const r = seatBlocked(def, trayParams[def], t);
    if (r.blocked !== null) {
      refusals.push(r.blocked);
      continue; // the ask stays on the tray; the ring does not move
    }
    pieces = [...pieces, { def, params: { ...trayParams[def] }, transform: r.m, seq: pieces.length }];
  }
  const run = await replayRun(PORCH05, { levelId: PORCH05.id, pieces, seed: PORCH05.seed });
  const seated = pieces.length - fixturePieces().length;
  let stars = run.status === 'finished' ? 1 : 0;
  if (run.status === 'finished') {
    if (seated <= par.pieces) stars += 1;
    if (run.time <= par.time) stars += 1;
  }
  const authored = AUTHORED.has(key);
  if (!authored && seated === 4) { console.error(`LAW 1 FAIL: ${key} seats all four`); fail++; }
  if (stars === 3 && key !== 'glgd') { console.error(`LAW 2 FAIL: ${key} earns 3 stars`); fail++; }
  if (!authored && refusals.length === 0) { console.error(`LAW 3 FAIL: ${key} meets no rim`); fail++; }
  if (authored && (seated !== 4 || run.status !== 'finished')) {
    console.error(`AUTHORED FAIL: ${key} seats ${seated}/4 and ${run.status}`);
    fail++;
  }
  const outcome = `${seated}/4 ${run.status === 'finished' ? `FINISH ${run.time.toFixed(3)} ${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}` : run.status}${refusals.length ? ` refused(${[...new Set(refusals)].join(', ')})` : ''}`;
  if (!rows.has(outcome)) rows.set(outcome, []);
  rows.get(outcome).push(key);
}
for (const [outcome, keys] of [...rows].sort()) console.log(`${outcome.padEnd(56)} ${keys.join(' ')}`);
// the par hash rides untouched: the guard is placement-layer only.
const p = await replayRun(PORCH05, PORCH05.parBuild());
console.log(`par replay: ${p.status} ${p.time.toFixed(3)} s hash ${p.hash}`);
console.log(fail ? `${fail} LAW FAILURES` : 'laws hold: no non-authored order seats four; the only 3-star order is the authored line; every dump meets the rim');
process.exit(fail ? 1 : 0);
