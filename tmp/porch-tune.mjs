#!/usr/bin/env node
/**
 * PORCH rung tuning grid (authoring scratch). Finds the pinned "unforgiving
 * step" gap geometry for porch04/porch05 (the kitchen05 precedent: the
 * order/everything lesson dies if a slow belly can roll across the trench),
 * evaluated as a BATTERY on the builder mount:
 *   A) every whole-tray order of porch04's tray finishes;
 *   B) the belly-cheat subsets (straight>drop>landing, gapLip>drop>landing)
 *      DIE;
 *   C) the par order finishes and its clock prints.
 * Also prints porch05's route battery per variant.
 */
import { PIECES } from '../src/track/pieces.ts';
import { fitSocket } from '../src/track/snap.ts';
import { transformSocket } from '../src/track/socket.ts';
import { replayRun } from '../src/replay/replay.ts';
import { rampLevelForDrop } from '../src/feel/kittrack.ts';
const { startSocketFromBuild } = await import('../src/world/levels/kitchen01.level.ts');

const CHUTE = {
  angle: -29,
  blend: 0.12,
  level: rampLevelForDrop(0.16, -29, 0.12, 0.9 * 0.12),
};
const LIP = { length: 0.0405, angle: 12, blend: 0.05 };
const SINK = { level: 0.245, angle: 21, blend: 0.06 };
const RUNOUT = { level: 0.24, angle: 12, blend: 0.06 };
const STRAIGHT = 0.11;

import * as THREE from 'three';
function lay(list, levelId) {
  let cursor = { pos: new THREE.Vector3(), tangent: new THREE.Vector3(1, 0, 0), up: new THREE.Vector3(0, 1, 0) };
  const pieces = [];
  list.forEach((piece, index) => {
    const params = structuredClone(piece.params ?? {});
    const [inS, outS] = PIECES[piece.def].sockets(params);
    const t = fitSocket(cursor, inS);
    pieces.push({ def: piece.def, params, transform: t, seq: index });
    cursor = transformSocket(outS, t);
  });
  return { levelId, pieces, seed: 1 };
}
/** builder mount: ramp + cup at par transforms, tray kinds chained off ramp exit. */
function placed(par, kinds, drop) {
  const pieces = par.pieces.filter((p) => p.def === 'ramp' || p.def === 'finishCup').map((p, i) => ({ ...p, seq: i }));
  const ramp = pieces.find((p) => p.def === 'ramp');
  let cursor = transformSocket(PIECES.ramp.sockets(ramp.params)[1], ramp.transform);
  const geo = { gapLip: LIP, drop, landing: SINK, straight: { length: STRAIGHT } };
  for (const def of kinds) {
    const p = structuredClone(geo[def]);
    const t = fitSocket(cursor, PIECES[def].sockets(p)[0]);
    pieces.push({ def, params: p, transform: t, seq: pieces.length });
    cursor = transformSocket(PIECES[def].sockets(p)[1], t);
  }
  return { levelId: par.levelId, pieces, seed: 1 };
}



function perms(items) {
  const seen = new Set();
  const out = [];
  const rec = (arr, rest) => {
    if (!rest.length) {
      const k = arr.join('>');
      if (!seen.has(k)) { seen.add(k); out.push([...arr]); }
      return;
    }
    rest.forEach((_, i) => rec([...arr, rest[i]], [...rest.slice(0, i), ...rest.slice(i + 1)]));
  };
  rec([], items);
  return out;
}

async function battery(drop, label) {
  const par = lay([
    { def: 'ramp', params: CHUTE },
    { def: 'straight', params: { length: STRAIGHT } },
    { def: 'gapLip', params: LIP },
    { def: 'landing', params: process.env.RUNOUT ? RUNOUT : SINK },
    { def: 'drop', params: drop },
    { def: 'finishCup' },
  ], 'porch04');
  const LEVEL = { id: 'porch04', seed: 1, maxTime: 12, par: { pieces: 0, time: 0 }, budget: 0, startSocket: startSocketFromBuild(par, 0.9 * 0.12), placeholderBuild: () => par };
  const fails = [];
  let parTime = 0;
  const ORDER_TABLE = process.env.ORDERS === '1';
  if (ORDER_TABLE) {
    const rows = [];
    for (const order of perms(['straight', 'gapLip', 'drop', 'landing'])) {
      const r = await replayRun(LEVEL, placed(par, order, drop));
      rows.push(`${order.join('>')}: ${r.status[0]}@${r.time.toFixed(3)}`);
    }
    console.log(rows.join('\n  '));
  }
  const parRun = await replayRun(LEVEL, placed(par, (process.env.PARORDER ?? 'straight,gapLip,landing,drop').split(','), drop));
  if (parRun.status === 'finished') parTime = parRun.time; else fails.push(`PAR ${parRun.status}`);
  let ordersFell = 0;
  for (const order of perms(['straight', 'gapLip', 'drop', 'landing'])) {
    const r = await replayRun(LEVEL, placed(par, order, drop));
    if (r.status !== 'finished') { ordersFell++; fails.push(`order ${order.join('>')} ${r.status}@${r.time.toFixed(2)}`); }
  }
  const cheats = {};
  for (const c of [['straight', 'drop', 'landing'], ['gapLip', 'drop', 'landing'], ['straight', 'gapLip', 'drop'], ['gapLip', 'landing']]) {
    const r = await replayRun(LEVEL, placed(par, c, drop));
    cheats[c.join('>')] = `${r.status}@${r.time.toFixed(2)}`;
  }
  // porch05 battery on the same step geometry
  const par5 = lay([
    { def: 'ramp', params: CHUTE },
    { def: 'gapLip', params: LIP },
    { def: 'landing', params: SINK },
    { def: 'gapLip', params: LIP },
    { def: 'drop', params: drop },
    { def: 'finishCup' },
  ], 'porch05');
  const routes = {};
  for (const [name, kinds] of Object.entries({
    B_sinkfirst: ['gapLip', 'landing', 'gapLip', 'drop'],
    A_catchfirst: ['gapLip', 'drop', 'gapLip', 'landing'],
    ggdl: ['gapLip', 'gapLip', 'drop', 'landing'],
    ggd: ['gapLip', 'gapLip', 'drop'],
    gdl: ['gapLip', 'drop', 'landing'],
    ggl: ['gapLip', 'gapLip', 'landing'],
  })) {
    const r = await replayRun(LEVEL, (() => {
      const pieces = par5.pieces.filter((p) => p.def === 'ramp' || p.def === 'finishCup').map((p, i) => ({ ...p, seq: i }));
      const ramp = pieces.find((p) => p.def === 'ramp');
      let cursor = transformSocket(PIECES.ramp.sockets(ramp.params)[1], ramp.transform);
      const geo = { gapLip: LIP, drop, landing: SINK };
      for (const def of kinds) {
        const p = structuredClone(geo[def]);
        const t = fitSocket(cursor, PIECES[def].sockets(p)[0]);
        pieces.push({ def, params: p, transform: t, seq: pieces.length });
        cursor = transformSocket(PIECES[def].sockets(p)[1], t);
      }
      return { levelId: 'porch05', pieces, seed: 1 };
    })());
    routes[name] = `${r.status[0]}@${r.time.toFixed(2)}`;
  }
  console.log(
    `drop ${label} | p04 par ${parTime.toFixed(3)} fellOrders ${ordersFell} | cheats ${JSON.stringify(cheats)} | p05 ${JSON.stringify(routes)}`,
  );
  if (fails.length) console.log(`   fails: ${fails.slice(0, 8).join(' ; ')}${fails.length > 8 ? ` …(+${fails.length - 8})` : ''}`);
}

const h = Number(process.env.H ?? 0.12);
for (const spec of (process.env.SPECS ?? '0.12/45/0.02/0.125').split(',')) {
  const [height, angle, radius, lead] = spec.split('/').map(Number);
  await battery({ height, angle, radius, lead }, spec);
}
