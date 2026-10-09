#!/usr/bin/env node
/**
 * Cross-platform determinism atlas (stage 6, Final Report "next" #2).
 *
 *   node tools/hash-atlas.mjs             # derive + write the atlas
 *   node tools/hash-atlas.mjs --check     # derive, diff vs the committed atlas, REPORT
 *
 * For EVERY registered level (same one-liner import convention as
 * `scripts/gen-pars.mjs` — adding a level file means adding its import here),
 * replay its reference build — `Level.parBuild`, falling back to
 * `placeholderBuild` — once through the headless World and record:
 *
 *   { levelId, hash, steps, time, parPieces, parTime }
 *
 * `hash` is the terminal FNV-1a state hash (the share-link trust anchor);
 * `steps` locates WHERE a divergence first shows if one exists; `time` is the
 * raw measured finish (6 dp — display/jitter context, never a mismatch key);
 * `parPieces`/`parTime` are the shipped par lines on the tray basis, the same
 * arithmetic `gen-pars.mjs` does.
 *
 * The atlas is written to `docs/vault/Reference/hash-atlas.json` with a
 * provenance header (platform, node version, rapier version) stamped by the
 * machine that derived it. `--check` re-derives and compares ONLY the per
 * level `hash` + `parPieces` (the header differs by design; raw `time` is
 * reported as context, not as a mismatch). MISMATCHES ARE REPORTED, not
 * gated: the CI `determinism-atlas` job runs the same derive on a different
 * OS/CPU and prints the verdict table — this is an experiment first, a gate
 * later (see the vault note "Cross-platform determinism").
 *
 * Requires Node >= 22.18 (native TypeScript type stripping).
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const OUT = new URL('../docs/vault/Reference/hash-atlas.json', import.meta.url);
// Level modules register themselves on import (gen-pars convention).
await import('../src/world/levels/feeltrack.level.ts');
await import('../src/world/levels/kitchen01.level.ts');
await import('../src/world/levels/kitchen02.level.ts');
await import('../src/world/levels/kitchen03.level.ts');
await import('../src/world/levels/kitchen04.level.ts');
await import('../src/world/levels/kitchen05.level.ts');
await import('../src/world/levels/bedroom01.level.ts');
await import('../src/world/levels/bedroom02.level.ts');
await import('../src/world/levels/bedroom03.level.ts');
await import('../src/world/levels/bedroom04.level.ts');
await import('../src/world/levels/bedroom05.level.ts');
await import('../src/world/levels/bathroom01.level.ts');
await import('../src/world/levels/bathroom02.level.ts');
await import('../src/world/levels/bathroom03.level.ts');
await import('../src/world/levels/bathroom04.level.ts');
await import('../src/world/levels/bathroom05.level.ts');
await import('../src/world/levels/garden01.level.ts');
await import('../src/world/levels/garden02.level.ts');
await import('../src/world/levels/garden03.level.ts');
await import('../src/world/levels/garden04.level.ts');
await import('../src/world/levels/garden05.level.ts');
await import('../src/world/levels/garage01.level.ts');
await import('../src/world/levels/garage02.level.ts');
await import('../src/world/levels/garage03.level.ts');
await import('../src/world/levels/garage04.level.ts');
await import('../src/world/levels/garage05.level.ts');
await import('../src/world/levels/porch01.level.ts');
await import('../src/world/levels/porch02.level.ts');
await import('../src/world/levels/porch03.level.ts');
await import('../src/world/levels/porch04.level.ts');
await import('../src/world/levels/porch05.level.ts');
const { LEVELS } = await import('../src/world/levels/feeltrack.level.ts');
const { replayRun } = await import('../src/replay/replay.ts');
const { fixtureQuota } = await import('../src/track/build.ts');

const require = createRequire(import.meta.url);
const rapierVersion = require('../node_modules/@dimforge/rapier3d-compat/package.json').version;

/** Measured seconds -> the shipped par line (ceil to 0.05 s; gen-pars law). */
function parTimeOf(seconds) {
  return Math.ceil(seconds * 20 - 1e-9) / 20;
}

async function derive() {
  const levels = [];
  for (const level of Object.values(LEVELS)) {
    const build = level.parBuild ? level.parBuild() : level.placeholderBuild();
    const run = await replayRun(level, build, {});
    if (run.status !== 'finished') {
      console.error(`hash-atlas: ${level.id} reference build ended "${run.status}" — cannot atlas a rung that does not finish`);
      process.exit(2);
    }
    const trayPieces = build.pieces.filter(
      (p) => !(level.fixtures ? fixtureQuota(level.fixtures)(p.def) : false),
    ).length;
    levels.push({
      levelId: level.id,
      hash: run.hash,
      steps: run.steps,
      time: Math.round(run.time * 1e6) / 1e6,
      parPieces: trayPieces,
      parTime: parTimeOf(run.time),
    });
  }
  levels.sort((a, b) => (a.levelId < b.levelId ? -1 : a.levelId > b.levelId ? 1 : 0));
  return {
    header: {
      generator: 'tools/hash-atlas.mjs',
      generated: new Date().toISOString().slice(0, 10),
      platform: `${process.platform}-${process.arch}`,
      node: process.version,
      rapier: rapierVersion,
    },
    levels,
  };
}

const atlas = await derive();

if (!process.argv.includes('--check')) {
  await writeFile(fileURLToPath(OUT), `${JSON.stringify(atlas, null, 2)}\n`);
  console.log(`hash-atlas: wrote ${fileURLToPath(OUT)} (${atlas.levels.length} levels @ ${atlas.header.platform})`);
  process.exit(0);
}

let committed;
try {
  committed = JSON.parse(await readFile(fileURLToPath(OUT), 'utf8'));
} catch {
  console.error('hash-atlas --check: docs/vault/Reference/hash-atlas.json missing; run `node tools/hash-atlas.mjs`');
  process.exit(2);
}
const byId = new Map(committed.levels.map((l) => [l.levelId, l]));
console.log(`hash-atlas: ${atlas.levels.length} levels derived on ${atlas.header.platform} (node ${atlas.header.node}, rapier ${atlas.header.rapier}) vs atlas from ${committed.header.platform} (node ${committed.header.node}, rapier ${committed.header.rapier})`);
console.log('level                hash        atlas        steps   verdict');
let mismatch = 0;
for (const got of atlas.levels) {
  const want = byId.get(got.levelId);
  let verdict;
  if (!want) verdict = 'MISSING-FROM-ATLAS';
  else if (want.hash !== got.hash) verdict = `MISMATCH (atlas ${want.hash}, steps ${want.steps})`;
  else if (want.parPieces !== got.parPieces) verdict = `PIECES-MISMATCH (${want.parPieces} != ${got.parPieces})`;
  else verdict = 'match';
  if (verdict !== 'match') {
    mismatch++;
    console.log(`::warning::hash-atlas ${got.levelId}: ${verdict}`);
  }
  console.log(`${got.levelId.padEnd(20)} ${got.hash}   ${String(got.steps).padEnd(7)} ${verdict}`);
}
const missing = committed.levels.filter((l) => !atlas.levels.some((g) => g.levelId === l.levelId));
for (const l of missing) {
  mismatch++;
  console.log(`::warning::hash-atlas ${l.levelId}: ABSENT from this derive`);
}
if (mismatch === 0) {
  console.log(`hash-atlas: ALL ${atlas.levels.length} MATCH — the atlas hashes reproduce on ${atlas.header.platform}`);
  process.exit(0);
}
console.log(`hash-atlas: ${mismatch} MISMATCH across ${atlas.levels.length + missing.length} levels — reported, not gated (experiment first, gate later)`);
process.exit(1);
