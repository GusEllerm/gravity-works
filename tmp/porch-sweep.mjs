#!/usr/bin/env node
/**
 * PORCH ladder authoring sweep (Level Designer, stage 5).
 *
 * The fail-timing law says every rung's WRONG builds must die EARLY
 * (< ~1 s) or in clearly-different late families, and the ladder tests keep
 * the claims — this script is the authoring proof behind them: it
 * enumerates, on the SHIPPED BUILDER MOUNT (fixtures anchored at their par
 * transforms, tray pieces chained off the ramp exit at the tray's single
 * geometry):
 *
 *   porch01  every omission + every whole-tray order
 *   porch02  both intended lines (chained) + every whole-tray order + a
 *            sample of wrong subsets
 *   porch03  both catchers (chained AND anchored) + whole-tray sample +
 *            the catcher-skipping subsets
 *   porch04  ALL 24 whole-tray orders + every omission
 *   porch05  both intended routes + the other ten orders + every omission
 *
 * and classifies every death by its clock (families = clusters 0.15 s
 * apart), the L02 sweep's metric. It also prints the placement derivation
 * (rail midpoint x, lowest authored finish deck y) the PORCH_ROWS and
 * tests/unit/porch-levels.test.ts re-derive.
 *
 * Usage: node tmp/porch-sweep.mjs [levelId ...]   (default: all)
 */
import { PIECES } from '../src/track/pieces.ts';
import { fitSocket } from '../src/track/snap.ts';
import { transformSocket } from '../src/track/socket.ts';
import { KitRig } from '../src/feel/kittrack.ts';
import { replayRun } from '../src/replay/replay.ts';

await import('../src/world/levels/porch01.level.ts');
await import('../src/world/levels/porch02.level.ts');
await import('../src/world/levels/porch03.level.ts');
await import('../src/world/levels/porch04.level.ts');
await import('../src/world/levels/porch05.level.ts');
const { LEVELS } = await import('../src/world/levels/feeltrack.level.ts');
const { porch02DoorBuild } = await import('../src/world/levels/porch02.level.ts');
const { porch03HardBuild } = await import('../src/world/levels/porch03.level.ts');
const { porch05CatchFirstBuild } = await import('../src/world/levels/porch05.level.ts');

const LADDER = ['porch01', 'porch02', 'porch03', 'porch04', 'porch05'].map((id) => LEVELS[id]);

/** The builder-anchored mount emulation (the ladder tests' `placed`). */
function placed(level, kinds) {
  const par = level.parBuild();
  const fixtures = new Set(Object.keys(level.fixtures));
  const pieces = par.pieces.filter((p) => fixtures.has(p.def)).map((p, i) => ({ ...p, seq: i }));
  const params = { ...(level.trayParams ?? {}) };
  for (const p of par.pieces) if (level.tray[p.def] && params[p.def] === undefined) params[p.def] = p.params;
  const ramp = pieces.find((p) => p.def === 'ramp');
  let cursor = transformSocket(PIECES.ramp.sockets(ramp.params)[1], ramp.transform);
  for (const def of kinds) {
    const p = structuredClone(params[def]);
    const t = fitSocket(cursor, PIECES[def].sockets(p)[0]);
    pieces.push({ def, params: p, transform: t, seq: pieces.length });
    cursor = transformSocket(PIECES[def].sockets(p)[1], t);
  }
  return { levelId: level.id, pieces, seed: level.seed };
}

/** par pieces with the (anchored) cup kept — omissions replay against it. */
function omit(level, dropKinds) {
  const par = level.parBuild();
  const pieces = par.pieces.filter((p) => p.def === 'ramp' || p.def === 'finishCup' || !dropKinds.includes(p.def));
  return { levelId: level.id, pieces: pieces.map((p, i) => ({ ...p, seq: i })), seed: level.seed };
}

function perms(items) {
  if (items.length <= 1) return [[...items]];
  const out = [];
  items.forEach((x, i) =>
    perms([...items.slice(0, i), ...items.slice(i + 1)]).forEach((p) => out.push([x, ...p])),
  );
  return out;
}
function distinctPerms(items) {
  const seen = new Set();
  const out = [];
  for (const p of perms(items)) {
    const k = p.join('>');
    if (!seen.has(k)) {
      seen.add(k);
      out.push(p);
    }
  }
  return out;
}

/** Every subset of the tray multiset, laid in tray-list order (short runs
 *  first; the clock, not the layout, is what we are reading). */
function subsets(kinds) {
  const out = [];
  const n = kinds.length;
  for (let m = 0; m < 1 << n; m++) {
    const s = kinds.filter((_, i) => m & (1 << i));
    if (s.length && s.length < n) out.push(s);
  }
  return out;
}

const results = [];
async function run(level, label, build, mount) {
  const r = await replayRun(level, build);
  results.push({ level: level.id, label, mount, status: r.status, time: r.time, hash: r.hash });
  return r;
}

function report(levelId) {
  const rows = results.filter((r) => r.level === levelId);
  console.log(`\n=== ${levelId} ===`);
  for (const r of rows) {
    console.log(
      `  [${r.mount}] ${r.label.padEnd(46)} ${r.status.padEnd(9)} ${r.time.toFixed(3)}s ${r.hash}`,
    );
  }
  const deaths = rows.filter((r) => r.status !== 'finished').sort((a, b) => a.time - b.time);
  const families = [];
  for (const d of deaths) {
    const f = families.find((f) => d.time - f[f.length - 1].time <= 0.15);
    if (f) f.push(d);
    else families.push([d]);
  }
  console.log(`  --- death families (${families.length}) ---`);
  families.forEach((f, i) => {
    const t0 = f[0].time.toFixed(2);
    const t1 = f[f.length - 1].time.toFixed(2);
    console.log(`  F${i + 1}: ${t0}-${t1}s x${f.length}${Number(t1) < 1 ? '  (<1s)' : ''}`);
    for (const d of f) console.log(`      [${d.mount}] ${d.label} @ ${d.time.toFixed(3)}`);
  });
}

const only = process.argv.slice(2).filter((a) => !a.startsWith('-'));
const want = (id) => only.length === 0 || only.includes(id);

if (want('porch01')) {
  const L = LEVELS.porch01;
  await run(L, 'PAR (chained)', L.parBuild(), 'chained');
  await run(L, 'exact fit gapLip>drop>straight (anchored)', placed(L, ['gapLip', 'drop', 'straight']), 'anchored');
  await run(L, 'omission: bare', omit(L, ['gapLip', 'drop', 'straight']), 'anchored');
  await run(L, 'omission: gapLip only', omit(L, ['drop', 'straight']), 'anchored');
  await run(L, 'omission: drop only', omit(L, ['gapLip', 'straight']), 'anchored');
  await run(L, 'omission: straight only', omit(L, ['gapLip', 'drop']), 'anchored');
  await run(L, 'omission: gapLip+drop', omit(L, ['straight']), 'anchored');
  await run(L, 'omission: gapLip+straight', omit(L, ['drop']), 'anchored');
  await run(L, 'omission: drop+straight', omit(L, ['gapLip']), 'anchored');
  for (const order of distinctPerms(['gapLip', 'drop', 'straight'])) {
    await run(L, `order ${order.join('>')}`, placed(L, order), 'anchored');
  }
  report('porch01');
}

if (want('porch02')) {
  const L = LEVELS.porch02;
  await run(L, 'PAR deck line (chained)', L.parBuild(), 'chained');
  await run(L, 'door line (chained)', porch02DoorBuild(), 'chained');
  await run(L, 'deck line (anchored)', placed(L, ['straight', 'straight', 'drop', 'straight']), 'anchored');
  await run(L, 'door line (anchored)', placed(L, ['straight', 'gapLip', 'drop', 'straight']), 'anchored');
  for (const order of distinctPerms(['straight', 'straight', 'straight', 'gapLip', 'drop'])) {
    await run(L, `whole order ${order.join('>')}`, placed(L, order), 'anchored');
  }
  for (const s of subsets(['straight', 'straight', 'straight', 'gapLip', 'drop'])) {
    await run(L, `subset ${s.join('>')}`, placed(L, s), 'anchored');
  }
  report('porch02');
}

if (want('porch03')) {
  const L = LEVELS.porch03;
  await run(L, 'SINK par (chained)', L.parBuild(), 'chained');
  await run(L, 'HARD line (chained)', porch03HardBuild(), 'chained');
  await run(L, 'SINK par (anchored)', placed(L, ['straight', 'gapLip', 'landing', 'straight']), 'anchored');
  await run(L, 'HARD line (anchored)', placed(L, ['straight', 'gapLip', 'drop', 'straight']), 'anchored');
  for (const order of distinctPerms(['straight', 'straight', 'gapLip', 'drop', 'landing'])) {
    await run(L, `whole order ${order.join('>')}`, placed(L, order), 'anchored');
  }
  await run(L, 'skip catcher: s,g,straight', placed(L, ['straight', 'gapLip', 'straight']), 'anchored');
  await run(L, 'skip catcher: s,s,gapLip', placed(L, ['straight', 'straight', 'gapLip']), 'anchored');
  await run(L, 'skip launch: s,s,drop,landing', placed(L, ['straight', 'straight', 'drop', 'landing']), 'anchored');
  report('porch03');
}

if (want('porch04')) {
  const L = LEVELS.porch04;
  await run(L, 'PAR (chained)', L.parBuild(), 'chained');
  await run(L, 'par order (anchored)', placed(L, ['landing', 'drop', 'straight', 'gapLip']), 'anchored');
  for (const order of distinctPerms(['straight', 'gapLip', 'drop', 'landing'])) {
    await run(L, `order ${order.join('>')}`, placed(L, order), 'anchored');
  }
  for (const s of subsets(['straight', 'gapLip', 'drop', 'landing'])) {
    await run(L, `subset ${s.join('>')}`, placed(L, s), 'anchored');
  }
  report('porch04');
}

if (want('porch05')) {
  const L = LEVELS.porch05;
  await run(L, 'ROUTE B sink-first PAR (chained)', L.parBuild(), 'chained');
  await run(L, 'ROUTE A catch-first (chained)', porch05CatchFirstBuild(), 'chained');
  await run(L, 'ROUTE B (anchored)', placed(L, ['gapLip', 'landing', 'gapLip', 'drop']), 'anchored');
  await run(L, 'ROUTE A (anchored)', placed(L, ['gapLip', 'drop', 'gapLip', 'landing']), 'anchored');
  for (const order of distinctPerms(['gapLip', 'gapLip', 'drop', 'landing'])) {
    await run(L, `order ${order.join('>')}`, placed(L, order), 'anchored');
  }
  for (const s of subsets(['gapLip', 'gapLip', 'drop', 'landing'])) {
    await run(L, `subset ${s.join('>')}`, placed(L, s), 'anchored');
  }
  report('porch05');
}

// placement derivation (PORCH_ROWS digits)
console.log('\n=== placement derivation ===');
function finishDeckY(build) {
  const cup = build.pieces.find((p) => p.def === 'finishCup');
  const [inSocket] = PIECES.finishCup.sockets(cup.params);
  return transformSocket(inSocket, cup.transform).pos.y;
}
const linesByLevel = {
  porch01: [LEVELS.porch01.parBuild()],
  porch02: [LEVELS.porch02.parBuild(), porch02DoorBuild()],
  porch03: [LEVELS.porch03.parBuild(), porch03HardBuild()],
  porch04: [LEVELS.porch04.parBuild()],
  porch05: [LEVELS.porch05.parBuild(), porch05CatchFirstBuild()],
};
for (const level of LADDER) {
  const rig = new KitRig(level.parBuild(), 1);
  let mn = Infinity;
  let mx = -Infinity;
  for (let s = 0; s <= rig.length; s += 0.005) {
    const p = rig.frameAt(s).pos;
    mn = Math.min(mn, p.x);
    mx = Math.max(mx, p.x);
  }
  const lowest = Math.min(...linesByLevel[level.id].map(finishDeckY));
  console.log(
    `  ${level.id}: ${JSON.stringify(level.tray)} railX [${mn.toFixed(4)}, ${mx.toFixed(4)}] mid=${((mn + mx) / 2).toFixed(4)} finishDecks=${linesByLevel[level.id].map((b) => finishDeckY(b).toFixed(4)).join('/')} -> row [${((mn + mx) / 2).toFixed(4)}, ${(lowest - 0.005 - 0.005).toFixed(4)}, -0.53]`,
  );
}
