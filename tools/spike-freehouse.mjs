#!/usr/bin/env node
/**
 * SPIKE (eng-free, freeplay feasibility): the whole-house experiment.
 *
 *   node tools/spike-freehouse.mjs
 *
 * Five measurements, all headless (no GPU), all on the SHIPPED primitives —
 * the same collider descs, the same `carStep`/`applyRollingResistance` order,
 * the same `hashBodies` machine that `World.step` runs:
 *
 *  T0  instrument proof: `FreeHouse` (this file's status-free re-step of the
 *      World contract) must reproduce a shipped par-run hash bit-for-bit.
 *  T1  world extent + body/collider counts for all six rooms' 04 builds laid
 *      into one house along +x.
 *  T2  a 5-minute (36000-step) free run across the house, TWICE — the
 *      determinism question: does the hash survive the bigger AABB?
 *  T3  campaign-as-data: every rung's par build replayed (a) alone and
 *      (b) with the other five rooms' colliders parked far away in the same
 *      world — is the shipped ladder representable as a MODE of the house,
 *      byte-compatibly?
 *  T4  trick probe: read-only detectors over the recorded trace (air time,
 *      room crossings, chain falls) — cost, event-stream determinism, and
 *      the hash-neutrality claim (the audio-firewall pattern).
 *  T5  verdict-anywhere: a player-placed finishCup at three spots in the
 *      open house — does the physics verdict machinery still speak?
 *  T6  payload sizes: 30 shipped share links vs a 5-min house trace vs a
 *      200-piece free-placement build.
 */
import * as THREE from 'three';
import { deflateRawSync } from 'node:zlib';
import { SIM_SCALE, hashHex } from '../src/physics/sim.ts';
import { carSpeed } from '../src/physics/car.ts';
import { serialize } from '../src/track/build.ts';
import { PIECES } from '../src/track/pieces.ts';
import { TRACK_FRICTION } from '../src/track/material.ts';
import { replayRun } from '../src/replay/replay.ts';
import { CAMPAIGN_LADDER } from '../src/world/campaign.ts';
import { getLevel } from '../src/world/levels/feeltrack.level.ts';
// The FreeHouse instrument lives in spike-freehouse-core.mjs (extracted
// verbatim for the downhill spike, branch fp-downhill; T0 below is its
// behaviour proof — the kitchen01 par hash still reproduces bit-for-bit).
import { FreeHouse, initSim, rapier, shifted, buildAabb } from './spike-freehouse-core.mjs';

// ---- house layout ----------------------------------------------------------

const ROOMS = ['kitchen', 'bedroom', 'bathroom', 'garden', 'garage', 'porch'];
/** The rung whose par build stands in for each room's furniture (the room's
 *  capstone — its 04). Nav choice only; any rung would do for a spike. */
const ROOM_RUNG = Object.fromEntries(ROOMS.map((r) => [r, `${r}04`]));
/** The six parcels, a 3x2 grid (world m) — house-scale but one screen wide
 *  enough for the camera spike. Room i sits at ROOM_AT[i]. */
const ROOM_AT = [[4, 0], [12, 0], [20, 0], [4, 7], [12, 7], [20, 7]]; // [x, z]
const FLOOR = { center: [12, -1.25, 3.5], half: [40, 0.5, 22] }; // 80x44 m x 1 m thick slab, top at -0.75

// (shifted / buildAabb / FreeHouse / seededHash now live in spike-freehouse-core.mjs)

// ---- FreeHouse: the World contract with the verdict removed -----------------
// (the instrument itself: tools/spike-freehouse-core.mjs)



const hr = (s) => console.log(`\n=== ${s} ===`);

await initSim();

// room builds at house positions (parcels on the ROOM_AT grid)
const roomBuilds = {};
const roomAt = {};
for (let i = 0; i < ROOMS.length; i++) {
  const room = ROOMS[i];
  roomBuilds[room] = shifted(getLevel(ROOM_RUNG[room]).parBuild(), ROOM_AT[i][0], ROOM_AT[i][1]);
  roomAt[room] = ROOM_AT[i];
}
function roomOf(px, pz) {
  for (let i = 0; i < ROOM_AT.length; i++) {
    const [rx, rz] = ROOM_AT[i];
    if (px >= rx - 2 && px <= rx + 6.5 && pz >= rz - 2.5 && pz <= rz + 4) return i;
  }
  return -1;
}
const houseBuilds = ROOMS.map((r) => roomBuilds[r]);
const houseStart = (() => {
  const s = getLevel('kitchen04').startSocket;
  return {
    pos: { x: s.pos.x + ROOM_AT[0][0], y: s.pos.y, z: s.pos.z + ROOM_AT[0][1] },
    tangent: { ...s.tangent },
    up: { ...s.up },
  };
})();
const HOUSE_WIND = { windEvery: 60, windPower: 1.2 * SIM_SCALE, windTargets: ROOM_AT, windTour: 3600 };

// ---- T0: instrument proof ---------------------------------------------------
hr('T0 instrument proof (FreeHouse must reproduce a shipped par hash)');
{
  const level = getLevel('kitchen01');
  const build = level.parBuild();
  const ref = await replayRun(level, build, {});
  const fh = new FreeHouse([build], { startSocket: level.startSocket, seed: build.seed });
  for (let i = 0; i < ref.steps && i < 3600; i++) fh.step();
  console.log(`kitchen01 par: World ${ref.hash} (${ref.steps} steps) vs FreeHouse ${fh.hash()} (${fh.steps} steps) -> ${fh.hash() === ref.hash ? 'BIT-IDENTICAL' : 'DIFFER'}`);
  fh.free();
}

// ---- T1: extent and counts ---------------------------------------------------
hr('T1 house extent + counts');
{
  const box = new THREE.Box3();
  let colliders = 0;
  for (const b of houseBuilds) {
    box.union(buildAabb(b));
    for (const p of b.pieces) colliders += PIECES[p.def].spline(p.params).toColliderDescs(rapier(), { scale: SIM_SCALE, friction: TRACK_FRICTION }).length;
  }
  const size = box.getSize(new THREE.Vector3());
  console.log(`rooms: ${ROOMS.length}, pieces: ${houseBuilds.reduce((n, b) => n + b.pieces.length, 0)}, track colliders: ${colliders}`);
  console.log(`extent (world m): x ${box.min.x.toFixed(2)}..${box.max.x.toFixed(2)} (${size.x.toFixed(2)}), y ${box.min.y.toFixed(2)}..${box.max.y.toFixed(2)}, z ${box.min.z.toFixed(2)}..${box.max.z.toFixed(2)}`);
  console.log(`sim-space coords: max |coord| ${(Math.max(Math.abs(box.min.x), Math.abs(box.max.x), Math.abs(box.min.z)) * SIM_SCALE).toFixed(1)} sim m; quant(|0) wraps at 214748 sim m / 21474 world m`);
  const fh = new FreeHouse(houseBuilds, { startSocket: houseStart, floor: FLOOR });
  console.log(`rapier bodies (static): ${fh.bodies} (+1 floor), colliders: ${fh.colliders} (+1 floor), dynamic: 5 (chassis+4 wheels)`);
  fh.free();
}

// ---- T2: 5-minute cross-room run, twice --------------------------------------
hr('T2 five-minute (36000-step) house run x2');
let houseTrace = null;
{
  const run = () => {
    const fh = new FreeHouse(houseBuilds, { startSocket: houseStart, floor: FLOOR, ...HOUSE_WIND, launchSpeed: 0.4 * SIM_SCALE });
    const trace = [];
    const t0 = performance.now();
    for (let i = 0; i < 36000; i++) {
      fh.step();
      if (i % 10 === 0) {
        const p = fh.pos();
        trace.push([fh.steps, p.x, p.y, p.z, carSpeed(fh.car) / SIM_SCALE, fh.grounded ? 1 : 0]);
      }
    }
    const ms = performance.now() - t0;
    const out = { hash: fh.hash(), ms, steps: fh.steps, end: fh.pos(), trace };
    fh.free();
    return out;
  };
  const a = run();
  const b = run();
  // scaling baseline: the same stepper on ONE room's build (a shipped-rung
  // world), 5 min — the house-vs-rung sim-cost ratio
  const solo = (() => {
    const fh = new FreeHouse([roomBuilds.kitchen], { startSocket: houseStart, floor: FLOOR, ...HOUSE_WIND, launchSpeed: 0.4 * SIM_SCALE });
    const t0 = performance.now();
    for (let i = 0; i < 36000; i++) fh.step();
    const ms = performance.now() - t0;
    fh.free();
    return ms;
  })();
  houseTrace = a.trace;
  console.log(`run A: hash ${a.hash} wall ${(a.ms / 1000).toFixed(2)} s (${(a.ms / 36000).toFixed(3)} ms/step, ${(36000 / (a.ms / 1000)).toFixed(0)} steps/s = ${(36000 / (a.ms / 1000) / 120).toFixed(1)}x realtime)`);
  console.log(`run B: hash ${b.hash} wall ${(b.ms / 1000).toFixed(2)} s; one-room world, same stepper: ${(solo / 1000).toFixed(2)} s (${(solo / 36000).toFixed(3)} ms/step) — house/one-room sim-cost ratio ${(a.ms / solo).toFixed(2)}`);
  console.log(`hashes ${a.hash === b.hash ? 'EQUAL' : 'DIFFER'} — 5-min cross-house replay is ${a.hash === b.hash ? 'hash-stable' : 'NOT stable'}`);
  console.log(`car path: x ${houseStart.pos.x.toFixed(2)} -> ${b.end.x.toFixed(2)} m, y ${Math.min(...a.trace.map((s) => s[2])).toFixed(2)}..${Math.max(...a.trace.map((s) => s[2])).toFixed(2)} m; rooms visited: ${new Set(a.trace.map((s) => roomOf(s[1], s[3]))).size - (a.trace.some((s) => roomOf(s[1], s[3]) === -1) ? 1 : 0)}/6`);
  const xs = a.trace.map((s) => s[1]);
  const cross = a.trace.find((s) => s[2] < -0.9);
  if (cross) console.log(`FLOOR CROSSING at step ${cross[0]}: pos (${cross[1].toFixed(2)}, ${cross[2].toFixed(2)}, ${cross[3].toFixed(2)})`);
  console.log(`hashed positions spanned x ${Math.min(...xs).toFixed(2)}..${Math.max(...xs).toFixed(2)} m`);
}

// ---- T3: campaign-as-data byte test ------------------------------------------
hr("T3 every rung's par replayed alone vs inside the house");
{
  let same = 0, diff = 0;
  const rows = [];
  for (const id of CAMPAIGN_LADDER) {
    const level = getLevel(id);
    const build = level.parBuild();
    const ref = await replayRun(level, build, {});
    // own build stays AT THE ORIGIN (any translation would itself perturb f32
    // geometry and confound the test); the other five rooms ride the world at
    // their house parcels, 3..15 m away.
    const foreign = ROOMS.filter((r) => !id.startsWith(r)).map((r) => roomBuilds[r]);
    const fh = new FreeHouse([build, ...foreign], { startSocket: level.startSocket, launchSpeed: 0, seed: build.seed });
    const n = Math.min(ref.steps, 3600);
    for (let i = 0; i < n; i++) fh.step();
    const ok = fh.hash() === ref.hash;
    ok ? same++ : diff++;
    rows.push([id, ref.hash, fh.hash(), ok]);
    fh.free();
  }
  for (const [id, a, b, ok] of rows) if (!ok) console.log(`  ${id}: alone ${a} house ${b} DIFFER`);
  console.log(`${same}/${CAMPAIGN_LADDER.length} rungs hash-identical with the other five rooms parked in the same world (${diff} differ)`);

  // T3b: translation sensitivity — the same build shifted in the SAME world
  // law: does a pure translation of identical geometry preserve the hash?
  let t3b = 0;
  for (const dx of [0.5, 5]) {
    const level = getLevel('kitchen01');
    const build = level.parBuild();
    const ref = await replayRun(level, build, {});
    const fh = new FreeHouse([shifted(build, dx, 0)], { startSocket: shiftedSocket(level.startSocket, dx, 0), seed: build.seed });
    for (let i = 0; i < ref.steps; i++) fh.step();
    console.log(`  +${dx} m translation: ${fh.hash() === ref.hash ? 'PRESERVED' : `moved ${ref.hash} -> ${fh.hash()}`} (step-0 collider coords differ: ${fh.hash() !== ref.hash})`);
    if (fh.hash() === ref.hash) t3b++;
    fh.free();
  }
  console.log(`translation: ${t3b}/2 preserved — the hash is a function of ABSOLUTE geometry`);
}

function shiftedSocket(s, dx, dz = 0) {
  return { pos: { x: s.pos.x + dx, y: s.pos.y, z: s.pos.z + dz }, tangent: { ...s.tangent }, up: { ...s.up } };
}

// ---- T4: trick probe ---------------------------------------------------------
hr('T4 trick detection (read-only, over replay frames)');
{
  // deterministic event stream over a trace: [step, x, y, z, speed, grounded]
  const deriveEvents = (trace) => {
    const events = [];
    let airStart = null, lastY = trace[0]?.[2] ?? 0, fellSince = null;
    let rooms = new Set([roomOf(trace[0]?.[1] ?? 0, trace[0]?.[3] ?? 0)]);
    for (const [step, px, py, pz, grounded] of trace.map((s) => [s[0], s[1], s[2], s[3], s[5] ? 1 : 0])) {
      if (grounded === 0 && airStart === null) airStart = step;
      if (grounded === 1 && airStart !== null) {
        if (step - airStart > 30) events.push(['air', step, ((step - airStart) / 120).toFixed(2)]);
        airStart = null;
      }
      const room = roomOf(px, pz);
      if (!rooms.has(room) && room >= 0) { events.push(['room', step, room]); rooms.add(room); }
      if (lastY - py > 0.05 && fellSince === null) fellSince = step;
      if (lastY - py <= 0.002 && fellSince !== null) {
        if (step - fellSince > 20) events.push(['fall', step, ((step - fellSince) / 120).toFixed(2)]);
        fellSince = null;
      }
      lastY = py;
    }
    return events;
  };
  const evHash = (events) => {
    let h = 0x811c9dc5;
    for (const e of events) for (const f of e) {
      const w = typeof f === 'number' ? Math.round(f * 1e4) | 0 : f.length;
      h = Math.imul(h ^ (w >>> 0), 0x01000193) >>> 0;
    }
    return hashHex(h);
  };
  const t0 = performance.now();
  const evA = deriveEvents(houseTrace);
  const evB = deriveEvents(houseTrace);
  const ms = performance.now() - t0;
  console.log(`events from one 5-min trace: ${evA.length} (air/room/fall), derive cost ${ms.toFixed(2)} ms (2x)`);
  console.log(`event stream hash run A ${evHash(evA)} run B ${evHash(evB)} -> ${evHash(evA) === evHash(evB) ? 'deterministic' : 'NOT'}`);
  console.log(`sample: ${JSON.stringify(evA.slice(0, 6))}`);
  // hash-neutrality: probe INLINE during stepping, hash must not move
  const withProbe = (() => {
    const fh = new FreeHouse(houseBuilds, { startSocket: houseStart, floor: FLOOR, ...HOUSE_WIND, launchSpeed: 0.4 * SIM_SCALE });
    let sink = 0;
    for (let i = 0; i < 3600; i++) {
      fh.step();
      const p = fh.pos();
      sink += p.x + p.y + p.z; // read-only probe stand-in: reads pose, writes nothing
    }
    const h = fh.hash();
    fh.free();
    return { h, sink };
  })();
  const without = (() => {
    const fh = new FreeHouse(houseBuilds, { startSocket: houseStart, floor: FLOOR, ...HOUSE_WIND, launchSpeed: 0.4 * SIM_SCALE });
    for (let i = 0; i < 3600; i++) fh.step();
    const h = fh.hash();
    fh.free();
    return h;
  })();
  console.log(`inline probe 30 s: with-probe ${withProbe.h} / clean ${without} -> ${without === withProbe.h ? 'probe is hash-neutral (hashedBodies untouched)' : 'PROBE MOVED THE HASH'}`);
}

// ---- T5: verdict anywhere ----------------------------------------------------
hr('T5 physics verdict for a player-proposed goal (cup anywhere)');
{
  const mkBuild = (cx, cy, cz) => ({
    levelId: 'freehouse',
    seed: 7,
    pieces: [
      // place the cup so its CAPTURE CENTRE (piece-local (length, -0.31r, 0))
      // sits exactly at (cx, cy, cz)
      { def: 'finishCup', params: {}, seq: 0, transform: new THREE.Matrix4().makeTranslation(cx - 0.12, cy + 0.045 * 0.31, cz) },
    ],
  });
  const yRest = (() => {
    const ys = houseTrace.filter((s) => s[5] === 1).map((s) => s[2]).sort((a, b) => a - b);
    return ys.length ? ys[Math.floor(ys.length / 2)] : -0.71;
  })(); // where the car rides on the floor
  const pathPoint = houseTrace.filter((s) => s[5] === 1 && s[0] > 4000 && s[0] < 30000).at(-1) ?? houseTrace.at(-1);
  const spots = [
    ['cup on a measured path point', pathPoint[1], pathPoint[2], pathPoint[3]],
    ['cup floating mid-garage', ROOM_AT[4][0] + 0.5, yRest + 0.5, ROOM_AT[4][1]],
    ['cup at the start line', houseStart.pos.x, houseStart.pos.y, houseStart.pos.z],
  ];
  for (const [label, cx, cy, cz] of spots) {
    const fh = new FreeHouse([mkBuild(cx, cy, cz), ...houseBuilds], { startSocket: houseStart, floor: FLOOR, ...HOUSE_WIND, launchSpeed: 0.4 * SIM_SCALE });
    // cup capture = the SAME law World.observe uses: centre within 2r
    const r = PIECES.finishCup.captureVolume({}).radius * 2; // radius * CUP_CAPTURE_FACTOR
    let verdict = 'open';
    for (let i = 0; i < 36000 && verdict === 'open'; i++) {
      fh.step();
      const p = fh.pos();
      if ((p.x - cx) ** 2 + (p.y - cy) ** 2 + (p.z - cz) ** 2 < r * r) verdict = `CAPTURED at t=${(fh.steps / 120).toFixed(2)} s`;
    }
    console.log(`${label.padEnd(28)} -> ${verdict} (hash ${fh.hash()})`);
    fh.free();
  }
}

// ---- T6: payloads ------------------------------------------------------------
hr('T6 save/share payload growth');
{
  const enc = new TextEncoder();
  const b64 = (bytes) => Buffer.from(bytes).toString('base64url');
  let min = Infinity, max = 0, tot = 0;
  for (const id of CAMPAIGN_LADDER) {
    const build = getLevel(id).parBuild();
    const json = `{"build":${serialize(build)},"hash":"00000000","levelId":${JSON.stringify(id)},"seed":${build.seed},"v":1}`;
    const wire = b64(deflateRawSync(enc.encode(json)));
    min = Math.min(min, wire.length); max = Math.max(max, wire.length); tot += wire.length;
  }
  console.log(`shipped share fragments (30 rungs): min ${min} / median ~${Math.round(tot / 30)} / max ${max} chars`);
  // 5-min house trace as a share payload (quantised, canonical)
  const traceJson = JSON.stringify(houseTrace);
  const traceWire = b64(deflateRawSync(enc.encode(traceJson)));
  console.log(`5-min house trace (${houseTrace.length} samples): json ${(traceJson.length / 1024).toFixed(1)} KiB, deflate+base64url ${(traceWire.length / 1024).toFixed(1)} KiB`);
  // free-placement build: 200 pieces with full transforms
  const free = { levelId: 'freehouse', seed: 1, pieces: [] };
  for (let i = 0; i < 200; i++) {
    free.pieces.push({ def: 'straight', params: { length: 0.3 }, seq: i, transform: new THREE.Matrix4().makeTranslation(i * 0.3, 0.01 * Math.sin(i), 0.2 * Math.cos(i)) });
  }
  const freeJson = serialize(free);
  const freeWire = b64(deflateRawSync(enc.encode(freeJson)));
  console.log(`200-piece FREE build (full Mat4 per piece): json ${(freeJson.length / 1024).toFixed(1)} KiB, wire ${(freeWire.length / 1024).toFixed(1)} KiB`);
  // compact: [defId, x, y, z, yaw] rounded to 1e-4
  const compact = JSON.stringify(free.pieces.map((p, i) => [1, Math.round(p.transform.elements[12] * 1e4), Math.round(p.transform.elements[13] * 1e4), Math.round(p.transform.elements[14] * 1e4), i % 4 === 3 ? 90 : 0]));
  const compactWire = b64(deflateRawSync(enc.encode(compact)));
  console.log(`same build compact (pos 0.1 mm + yaw deg): json ${(compact.length / 1024).toFixed(1)} KiB, wire ${(compactWire.length / 1024).toFixed(1)} KiB`);
  const chainJson = serialize({ levelId: 'freehouse', seed: 1, pieces: free.pieces.map((p) => ({ ...p })) });
  console.log(`(chain builds pay ~${Math.round(chainJson.length / 200)} B/piece; free placement pays ~${Math.round(freeJson.length / 200)} B/piece before compression)`);
}

console.log('\ndone.');
