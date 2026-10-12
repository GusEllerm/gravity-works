#!/usr/bin/env node
/**
 * SPIKE (fp-downhill, Lane A "the Downhill"): the house frame + THE NUMBER.
 *
 *   node tools/spike-downhill.mjs
 *
 * Extends (does not rebuild) the `FreeHouse` instrument of
 * tools/spike-freehouse.mjs via tools/spike-freehouse-core.mjs, and the
 * frame/layout math of src/dev/scenes/downhill-frame.ts. Headless, no GPU.
 *
 *  D0  instrument honesty: kitchen01's shipped par hash reproduces
 *      bit-for-bit through the extracted core (same check as T0).
 *  D1  THE HOUSE FRAME TABLE: per-room y-statistics of the campaign's
 *      setPlacement rows + par decks, the canonical six deck altitudes
 *      (porch 0 -> garage mezzanine top), the layout's extents.
 *  D2  THE MAIN RUN: one car from the garage mezzanine with the step-keyed
 *      wind (THE INPUT LAW), rooms APPROVED = physics cup captures on the
 *      way down; run TWICE — hash + approval-stream bit-stability.
 *  D3  THE SWEEP: launch window (mezzanine release x-offset) x deck grade
 *      (connector drop height) grid — THE NUMBER is the median rooms
 *      approved across the grid; the RANGE is what greenlights A.
 *  D4  headless sim cost (ms/step) of the frame world vs the feasibility
 *      spike's one-room baseline.
 */
import { SIM_SCALE } from '../src/physics/sim.ts';
import { CAR, carSpeed } from '../src/physics/car.ts';
import { replayRun } from '../src/replay/replay.ts';
import { getLevel } from '../src/world/levels/feeltrack.level.ts';
import { CUP_CAPTURE_FACTOR, STALL_SECONDS, STALL_SPEED } from '../src/world/world.ts';
import { FreeHouse, initSim } from './spike-freehouse-core.mjs';
import { campaignYStats, deckAlts, deckStep, INTERNAL_DROP, KIT_DROP_H, layout, roomGraph } from '../src/dev/scenes/downhill-frame.ts';

const hr = (s) => console.log(`\n=== ${s} ===`);
await initSim();

// ---- D0: instrument proof ----------------------------------------------------
hr('D0 instrument proof (extracted FreeHouse core)');
{
  const level = getLevel('kitchen01');
  const build = level.parBuild();
  const ref = await replayRun(level, build, {});
  const fh = new FreeHouse([build], { startSocket: level.startSocket, seed: build.seed });
  for (let i = 0; i < ref.steps && i < 3600; i++) fh.step();
  console.log(`kitchen01 par: World ${ref.hash} (${ref.steps} steps) vs FreeHouse ${fh.hash()} -> ${fh.hash() === ref.hash ? 'BIT-IDENTICAL' : 'DIFFER'}`);
  fh.free();
}

// ---- D1: the house frame table -----------------------------------------------
hr('D1 the house frame table');
const alts = deckAlts(KIT_DROP_H);
console.log(`campaign y-stats (median per room; 30 rungs + 6 sandboxes):`);
for (const s of campaignYStats()) {
  console.log(`  ${s.room.padEnd(9)} placeY ${s.placeYMedian.toFixed(4)}  finishDeckY ${s.deckYMedian.toFixed(4)}  startY ${s.startYMedian.toFixed(4)}  internalDrop ${s.internalDropMedian.toFixed(4)}`);
}
console.log(`INTERNAL_DROP (median campaign room-height) = ${INTERNAL_DROP.toFixed(4)} m`);
console.log(`canonical step = INTERNAL_DROP + connector drop = ${INTERNAL_DROP.toFixed(4)} + ${KIT_DROP_H} = ${deckStep(KIT_DROP_H).toFixed(4)} m`);
console.log(`deck altitudes: ${Object.entries(alts).map(([r, a]) => `${r} ${a.toFixed(3)}`).join(' | ')}`);
const base = layout(KIT_DROP_H);
console.log(`layout: x ${Math.min(...base.decks.map((d) => d.bounds.min[0])).toFixed(2)}..${Math.max(...base.decks.map((d) => d.bounds.max[0])).toFixed(2)} m, floor top ${base.floor.center[1] + base.floor.half[1]}`);
for (const d of base.decks) console.log(`  ${d.room.padEnd(9)} rung ${d.rung} x ${d.x.toFixed(2)} alt ${d.alt.toFixed(3)} entry y ${d.entry.pos.y.toFixed(3)} exit y ${d.exit.pos.y.toFixed(3)} cup (${d.cup.center.map((v) => v.toFixed(2)).join(', ')})`);
for (const g of base.legs) console.log(`  leg ${g.from} -> ${g.to}: authored drop ${g.dropH.toFixed(3)} m, ballistic gap ${g.build.pieces[1].transform.elements.length ? 'kit drop 40 deg' : ''}`);
const graph = roomGraph(base);
console.log(`room-graph: ${graph.nodes.length} nodes, ${graph.edges.length} edges (edges = connector legs)`);

// ---- the downhill run ----------------------------------------------------------

const WIND = { windEvery: 60, windPower: 1.2 * SIM_SCALE };
const STEPS = 3600; // 30 s — the descent verdict is complete by ~5 s; the tail only measures the roll-out

/** Run the downhill from `windowX` (mezzanine release offset along +x).
 *  APPROVAL = the room's own 04 finishCup under the FULL World.observe law:
 *  the moving capture (centre within CUP_CAPTURE_FACTOR * r) OR the stall
 *  branch (a car stopped nose-in at the bowl mouth, radius plus half a car
 *  length) — physics, not a menu checkbox.
 *  The probe is a read-only pose check (hash-neutral, Feasibility T4). */
function downhillRun(l, { windowX = 0, wind = true, steps = STEPS } = {}) { /* l built by layout(dropH, legAngle) */
  const start = {
    pos: { x: l.start.pos.x + windowX, y: l.start.pos.y, z: l.start.pos.z },
    tangent: { ...l.start.tangent },
    up: { ...l.start.up },
  };
  const capR2 = (r) => (r * CUP_CAPTURE_FACTOR) ** 2;
  const stallR2 = (r) => (r * CUP_CAPTURE_FACTOR + CAR.halfL / SIM_SCALE) ** 2;
  const stallLimit = Math.round(STALL_SECONDS * 120);
  const fh = new FreeHouse([...l.decks.map((d) => d.build), ...l.legs.map((g) => g.build)], {
    startSocket: start,
    floor: l.floor,
    ...(wind ? WIND : {}),
    launchSpeed: 0.4 * SIM_SCALE,
    seed: 0,
  });
  const approved = [];
  const seen = new Set();
  const cups = l.decks.map((d) => ({ room: d.room, c: d.cup.center, r2: capR2(d.cup.radius), sr2: stallR2(d.cup.radius) }));
  let firstMiss = null;
  let stallRun = 0;
  const t0 = performance.now();
  for (let i = 0; i < steps; i++) {
    fh.step();
    const p = fh.pos();
    const speed = carSpeed(fh.car) / SIM_SCALE;
    stallRun = fh.grounded && speed < STALL_SPEED ? stallRun + 1 : 0;
    for (const cup of cups) {
      if (seen.has(cup.room)) continue;
      const dx = p.x - cup.c[0], dy = p.y - cup.c[1], dz = p.z - cup.c[2];
      const d2 = dx * dx + dy * dy + dz * dz;
      if (d2 < cup.r2 || (stallRun > stallLimit && d2 < cup.sr2)) {
        seen.add(cup.room);
        approved.push([cup.room, fh.steps, +speed.toFixed(1)]);
      }
    }
    if (!firstMiss && p.y < l.floor.center[1] + l.floor.half[1] - 0.05) firstMiss = ['hit floor', fh.steps];
  }
  const ms = performance.now() - t0;
  const out = { hash: fh.hash(), steps: fh.steps, end: fh.pos(), approved, firstMiss, ms };
  fh.free();
  return out;
}

const evHash = (approved) => {
  let h = 0x811c9dc5;
  for (const [room, step] of approved) {
    h = Math.imul(h ^ room.length, 0x01000193) >>> 0;
    h = Math.imul(h ^ (step | 0), 0x01000193) >>> 0;
  }
  return (h >>> 0).toString(16).padStart(8, '0');
};

// ---- D2: the main run, hashed twice ---------------------------------------------
hr('D2 THE MAIN RUN (canonical frame: drop 0.25, mezzanine window 0, wind on)');
const runA = downhillRun(base, { windowX: 0 });
const runB = downhillRun(base, { windowX: 0 });
console.log(`run A: hash ${runA.hash}, rooms approved ${runA.approved.length}/6 — ${runA.approved.map(([r, s]) => `${r}@${(s / 120).toFixed(1)}s`).join(' -> ')}`);
console.log(`run B: hash ${runB.hash}, approval-stream hash ${evHash(runB.approved)} (A: ${evHash(runA.approved)})`);
console.log(`BIT-STABILITY: run hashes ${runA.hash === runB.hash ? 'EQUAL' : 'DIFFER'}; approval streams ${evHash(runA.approved) === evHash(runB.approved) ? 'EQUAL' : 'DIFFER'} — the downhill run IS its own receipt (input law holds)`);
console.log(`end: (${runA.end.x.toFixed(2)}, ${runA.end.y.toFixed(2)}, ${runA.end.z.toFixed(2)}); first floor departure: ${runA.firstMiss ? `${runA.firstMiss[1] / 120} s` : 'none in 3 min'}`);

// ---- D3: the sweep — launch window x deck grade ---------------------------------
hr('D3 THE SWEEP: launch window (mezzanine release x) x deck grade (connector drop height x leg angle)');
const WINDOWS = [0, 0.25, 0.5];
const GRADES = [[0.15, 40], [KIT_DROP_H, 40], [0.4, 40], [KIT_DROP_H, 50], [KIT_DROP_H, 60]];
const results = [];
for (const [dropH, ang] of GRADES) {
  const l = layout(dropH, ang);
  for (const w of WINDOWS) {
    const r = downhillRun(l, { windowX: w });
    results.push({ dropH, ang, w, rooms: r.approved.length, hash: r.hash, order: r.approved.map(([rm]) => rm.slice(0, 2)).join('>') });
    console.log(`  drop ${dropH.toFixed(2)} @${ang} deg (step ${deckStep(dropH).toFixed(3)} m) window ${w.toFixed(2)} m: ${String(r.approved.length)}/6 rooms  [${r.approved.map(([rm, s]) => `${rm}@${(s / 120).toFixed(1)}s`).join(' ')}]  hash ${r.hash}`);
  }
}
const counts = results.map((r) => r.rooms).sort((a, b) => a - b);
const med = counts[Math.floor(counts.length / 2)];
console.log(`THE NUMBER: median rooms approved across the sweep = ${med}; RANGE ${counts[0]}..${counts.at(-1)} (${counts.length} runs)`);
for (const c of [3, 4, 5, 6]) console.log(`  ${c} rooms: ${counts.filter((x) => x === c).length} of ${counts.length} runs`);

// wind-off probe: the input law's contribution stated honestly
const noWind = downhillRun(base, { wind: false });
console.log(`wind-off probe (gravity only): ${noWind.approved.length}/6 rooms [${noWind.approved.map(([r, s]) => `${r}@${(s / 120).toFixed(1)}s`).join(' ')}]`);

// ---- D4: headless sim cost -------------------------------------------------------
hr('D4 sim cost');
console.log(`frame world (6 decks + 5 connector legs + floor): ${(runA.ms / runA.steps).toFixed(4)} ms/step = ${(runA.steps / (runA.ms / 1000) / 120).toFixed(0)}x realtime single-threaded`);

console.log('\ndone.');

