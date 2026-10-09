#!/usr/bin/env node
/**
 * THE PIECE-ORDER PROBE (program T3.2, Action Plan 2026-10-09 "Ghost racing":
 * "the canonical piece-ORDER question gets one measured probe (does `reify`
 * order-sensitivity ever bite shipped builds?) before any cross-player
 * equality claim").
 *
 * The question, stated exactly, in BOTH senses a permutation can mean:
 *
 *  - PERMUTE (`seq` untouched): the same BUILD with its piece ARRAY shuffled.
 *    `reify` runs `canonicalBuild` (sort by `seq`), so the expectation is
 *    "no change" — but the ghosts lane may not CLAIM cross-build equality
 *    on an expectation; it claims it on a measurement.
 *  - PERMUTE + RENUMBER (the array order BECOMES the canonical order): a
 *    different canonical build from the same pieces — the hard test, because
 *    it changes the order the solver's bodies and colliders are created in.
 *    If even THIS hashed identical everywhere, order moves nothing in the
 *    shipped kit; if it moves, the equality claim is scoped to canonical
 *    bytes (which share payloads always are) and the note says so.
 *
 * Every permutation is deterministic (fixed LCG seeds), so the probe is
 * reproducible. Exit 0 = every `seq`-kept permutation hashed identical on
 * every level (the claim the ghosts lane needs); the renumbered census is
 * REPORTED, not gated (a moved hash there is a scoping fact, not a ghost
 * bug — the ghosts wind canonical arrays).
 */
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

const PERMUTATIONS = 4;

/** Fixed LCG — the probe's shuffles are reproducible on every machine. */
function lcg(seed) {
  let s = seed >>> 0;
  return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 0x100000000);
}

/** Fisher-Yates on a COPY of the piece array; `seq` values ride along
 *  untouched (the question is array ORDER, not canonical order). */
function permuted(pieces, rand) {
  const out = pieces.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

let moved = 0;
let checked = 0;
let renumberMoved = 0;
let renumberChecked = 0;
for (const level of Object.values(LEVELS)) {
  const build = level.parBuild ? level.parBuild() : level.placeholderBuild();
  const base = await replayRun(level, build);
  for (let p = 0; p < PERMUTATIONS; p++) {
    const rand = lcg(0x9e3779b9 * (p + 1) + level.id.length);
    const pieces = permuted(build.pieces, rand);
    const run = await replayRun(level, { ...build, pieces });
    checked++;
    if (run.hash !== base.hash || run.steps !== base.steps) {
      moved++;
      console.log(
        `MOVED ${level.id} perm ${p}: ${base.hash}/${base.steps} -> ${run.hash}/${run.steps}`,
      );
    }
    // the HARD sense: array order becomes canonical order (seq renumbered)
    const renumbered = pieces.map((piece, index) => ({ ...piece, seq: index }));
    const rr = await replayRun(level, { ...build, pieces: renumbered });
    renumberChecked++;
    if (rr.hash !== base.hash || rr.steps !== base.steps) renumberMoved++;
  }
  console.log(`${level.id}: ${PERMUTATIONS} permutations vs ${base.hash} (${base.steps} steps)`);
}
console.log(`\nprobe (seq kept):    ${checked - moved}/${checked} permuted replays hashed identical`);
console.log(`probe (renumbered):  ${renumberChecked - renumberMoved}/${renumberChecked} hashed identical (canonical order CHANGED — reported, not gated)`);
if (moved > 0) {
  console.log('VERDICT: permuted piece order moved a shipped hash — cross-build equality claims are FORBIDDEN.');
  process.exit(3);
}
console.log('VERDICT: permuted piece order never moved a shipped hash (canonicalBuild re-sorts by seq).');
