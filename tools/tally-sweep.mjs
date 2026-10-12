#!/usr/bin/env node
/**
 * THE TALLY SWEEP (freeplay program Lane B — Action Plan 2026-10-12: "the
 * threshold SWEEP TOOL (k02-order-table idiom) in CI — a booster-loop farm
 * must not retire the sheet's credibility; publish the sweep").
 *
 * Every rig below is played through the SHIPPED deterministic replay
 * (`replayRun`, record: true) and scored by the SHIPPED detectors
 * (`src/tally/detectors.ts`), so the badge columns are a MEASURED truth:
 *
 *   - all 30 campaign par builds (the sheet a tutorial-filling campaign
 *     pass actually fills — the retroactive-forward claim),
 *   - the six sandbox reference builds,
 *   - THE BOOSTER FARM: the degenerate optimizer's rig — a booster every
 *     straight, the shape the exploration warned would otherwise max the
 *     sheet every day.
 *
 * THE GATE (`--gate`, the CI line): no single rig earns MORE than
 * `BADGE_CAP_PER_RUN` badges in one run. The number is PUBLISHED, not
 * folklore: it is the sweep's own measured farm maximum rounded up — the
 * cap that lets every honest rig through and still catches a detector
 * regression that starts granting badges per FRAME (the same class of bug
 * the fail-timing sweeps catch). Re-run the sweep after ANY threshold
 * change and state the new numbers here and in the Decision Log.
 *
 * usage: node tools/tally-sweep.mjs [--gate]
 */
import { initRapier } from '../src/physics/sim.ts';
import { replayRun } from '../src/replay/replay.ts';
import { BADGE_KINDS, BADGE_CAP_PER_RUN, tallyCounts, tallyFromTrace } from '../src/tally/detectors.ts';
import { CAMPAIGN_LADDER } from '../src/world/campaign.ts';
import { getLevel } from '../src/world/levels/feeltrack.level.ts';
import { lay, KITCHEN_GEOM, kitchenRamp } from '../src/world/levels/kitchen01.level.ts';
import { KITCHEN_SANDBOX_ID } from '../src/world/levels/kitchen05.level.ts';
import { BEDROOM_SANDBOX_ID } from '../src/world/levels/bedroom05.level.ts';
import { BATHROOM_SANDBOX_ID } from '../src/world/levels/bathroom05.level.ts';
import { GARDEN_SANDBOX_ID } from '../src/world/levels/garden05.level.ts';
import { GARAGE_SANDBOX_ID } from '../src/world/levels/garage05.level.ts';
import { PORCH_SANDBOX_ID } from '../src/world/levels/porch05.level.ts';

const SANDBOX_IDS = [
  KITCHEN_SANDBOX_ID,
  BEDROOM_SANDBOX_ID,
  BATHROOM_SANDBOX_ID,
  GARDEN_SANDBOX_ID,
  GARAGE_SANDBOX_ID,
  PORCH_SANDBOX_ID,
];

/** THE BOOSTER FARM: every other deck segment is a booster, cup at the
 *  end, on the kitchen sandbox's geometry (the tray already holds both at
 *  ×99 — this build is placeable, which is the whole point of farming it). */
function boosterFarm() {
  const list = [{ def: 'ramp', params: kitchenRamp(0.3) }];
  for (let i = 0; i < 6; i++) {
    list.push({ def: i % 2 === 0 ? 'booster' : 'straight', params: { length: 0.18 } });
    list.push({ def: 'straight', params: { length: 0.18 } });
  }
  list.push({ def: 'finishCup' });
  return lay(list, KITCHEN_SANDBOX_ID, 1);
}

await initRapier();

const rigs = [];
for (const id of CAMPAIGN_LADDER) {
  const level = getLevel(id);
  rigs.push({ name: id, level, build: level.parBuild() });
}
for (const id of SANDBOX_IDS) {
  const level = getLevel(id);
  rigs.push({ name: id, level, build: level.parBuild() });
}
{
  const level = getLevel(KITCHEN_SANDBOX_ID);
  rigs.push({ name: 'BOOSTER-FARM', level, build: boosterFarm() });
}

console.log(`rig                status     time     ${BADGE_KINDS.map((k) => k.padStart(8)).join(' ')}  total  verdict`);
let fail = 0;
let farmMax = 0;
for (const rig of rigs) {
  const run = await replayRun(rig.level, rig.build, { record: true });
  const counts = tallyCounts(tallyFromTrace(run.trace ?? []));
  const cells = BADGE_KINDS.map((k) => String(counts[k] ?? 0).padStart(8));
  const total = BADGE_KINDS.reduce((s, k) => s + (counts[k] ?? 0), 0);
  farmMax = Math.max(farmMax, total);
  const over = total > BADGE_CAP_PER_RUN;
  if (over) fail++;
  console.log(
    `${rig.name.padEnd(16)} ${(run.status ?? '?').padEnd(10)} ${run.time.toFixed(3).padEnd(8)} ` +
      `${cells.join(' ')}  ${String(total).padStart(5)}  ${over ? `FAIL >${BADGE_CAP_PER_RUN}` : 'ok'}`,
  );
}
console.log(
  `${rigs.length} rigs, measured max ${farmMax} badges/run, cap ${BADGE_CAP_PER_RUN} — ` +
    (fail ? `${fail} FAILED` : 'no rig farms the sheet'),
);
if (process.argv.includes('--gate') && fail) process.exit(1);
