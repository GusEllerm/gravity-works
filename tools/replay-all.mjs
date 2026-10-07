// Stage-5 acceptance gate: EVERY campaign rung's par build replays verified.
//
//   node tools/replay-all.mjs
//
// For each level on the campaign ladder (in campaign order): replay its
// `parBuild()` twice through the deterministic World (no GPU), assert both
// runs FINISH, hash equal, and the measured time respects pars.json parTime.
// Any failure prints the rung and exits non-zero — this table is the claim
// "replays of all par builds verify", stated honestly as every rung rather
// than a head-count (Decision Log 2026-10-07).
import { initRapier } from '../src/physics/sim.ts';
import { replayRun } from '../src/replay/replay.ts';
import { getLevel } from '../src/world/levels/feeltrack.level.ts';
import { CAMPAIGN_LADDER } from '../src/world/campaign.ts';
import { fixtureQuota } from '../src/track/build.ts';
import { readFileSync } from 'node:fs';

const pars = new Map(
  JSON.parse(readFileSync(new URL('../src/world/pars.json', import.meta.url))).map((p) => [p.levelId, p]),
);

await initRapier();
let fail = 0;
console.log('rung           pieces  time     parTime  hash        verdict');
for (const id of CAMPAIGN_LADDER) {
  const level = getLevel(id);
  const par = pars.get(id);
  if (typeof level.parBuild !== 'function' || !par) {
    console.log(`${id.padEnd(14)} NO PAR BUILD/ENTRY — FAIL`);
    fail++;
    continue;
  }
  const build = level.parBuild();
  const a = await replayRun(level, build, {});
  const b = await replayRun(level, build, {});
  const why = [];
  if (a.status !== 'finished') why.push(`run A ${a.status}`);
  if (b.status !== 'finished') why.push(`run B ${b.status}`);
  if (a.hash !== b.hash) why.push(`hash ${a.hash}!=${b.hash}`);
  if (a.time > par.parTime + 1e-9) why.push(`time ${a.time.toFixed(3)} > ${par.parTime}`);
  const playerPieces = build.pieces.filter((p) => !(level.fixtures ? fixtureQuota(level.fixtures)(p.def) : false)).length;
  if (playerPieces !== par.parPieces) why.push(`pieces ${playerPieces} != par ${par.parPieces}`);
  const ok = why.length === 0;
  if (!ok) fail++;
  console.log(
    `${id.padEnd(14)} ${String(playerPieces).padEnd(7)} ${a.time.toFixed(3).padEnd(8)} ` +
      `${par.parTime.toFixed(2).padEnd(8)} ${a.hash}  ${ok ? 'verified' : `FAIL: ${why.join('; ')}`}`,
  );
}
console.log(`${CAMPAIGN_LADDER.length} rungs, ${fail ? `${fail} FAILED` : 'all verified'}`);
process.exit(fail ? 1 : 0);
