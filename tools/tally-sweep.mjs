#!/usr/bin/env node
/**
 * THE TALLY SWEEP (freeplay program Lane B — Action Plan 2026-10-12: "the
 * threshold SWEEP TOOL (k02-order-table idiom) in CI — a booster-loop farm
 * must not retire the sheet's credibility; publish the sweep").
 *
 * THE SHEET-FIX EXTENSION (2026-10-12 sheet re-probe verdict: the tally was
 * PAINT because the thresholds were swept only at CAMPAIGN scale — "the
 * sheet is invisible at exactly the scale where free play lives"). Every
 * rig below is played through the SHIPPED deterministic replay
 * (`replayRun`, record: true) and scored by the SHIPPED detectors
 * (`src/tally/detectors.ts`). THREE HUNDRED TWENTY-FIVE rigs, two scales:
 *
 *   - all 30 campaign par builds,
 *   - the six sandbox reference builds,
 *   - 288 SANDBOX-SCALE FIXTURES (`tools/tally-fixtures.mjs`): the six
 *     probe-named lines (incl. the film-kept garage "slick skip") inside a
 *     48-cell grammar grid per sandbox, and
 *   - THE BOOSTER FARM (the degenerate optimizer's rig, unchanged).
 *
 * TWO REPORTS, ONE TRACE PASS:
 *   1. the per-rig table at the SHIPPED thresholds (the `--gate` surface);
 *   2. THE THRESHOLD SWEEP — each of the five swept thresholds re-scored
 *      over every trace against its candidate grid, reported PER SCALE
 *      (campaign / sandbox): the mint rate on JUMP-AND-LAND runs (a run
 *      that finished with a flight of >= 0.08 s and >= 0.15 m of honest
 *      run-out after touchdown — what a prober's eyes call a jump), the
 *      per-run badge maximum, and the DEGENERATE count (rigs over
 *      BADGE_CAP_PER_RUN). The published table lives in `Modules/tally.md`.
 *
 * THE GATE (`--gate`, the CI line):
 *   a. no rig earns MORE than BADGE_CAP_PER_RUN badges in one run (the
 *      farm law — re-state the measured degenerate count when it moves;
 *      it was 0/325 at the campaign-scale thresholds);
 *   b. THE BOOSTER FARM still earns exactly its 3 spend badges — the
 *      spend bar is noise-floor arithmetic, not a vibe knob;
 *   c. EVERY jump-and-land fixture mints air AND clean catch — the
 *      sheet-fix law: what the eyes see, the sheet must grant.
 *
 * usage: node tools/tally-sweep.mjs [--gate]
 */
import { initRapier } from '../src/physics/sim.ts';
import { replayRun } from '../src/replay/replay.ts';
import {
  BADGE_KINDS,
  BADGE_CAP_PER_RUN,
  AIR_MIN_S,
  RUNOUT_MIN_M,
  CATCH_MIN_AIR_S,
  FALL_MIN_DROP_M,
  FALL_MIN_S,
  SPEND_MIN_GAIN_MPS,
  tallyCounts,
  tallyFromTrace,
} from '../src/tally/detectors.ts';
import { CAMPAIGN_LADDER } from '../src/world/campaign.ts';
import { getLevel } from '../src/world/levels/feeltrack.level.ts';
import { lay, KITCHEN_GEOM, kitchenRamp } from '../src/world/levels/kitchen01.level.ts';
import { KITCHEN_SANDBOX_ID } from '../src/world/levels/kitchen05.level.ts';
import { BEDROOM_SANDBOX_ID } from '../src/world/levels/bedroom05.level.ts';
import { BATHROOM_SANDBOX_ID } from '../src/world/levels/bathroom05.level.ts';
import { GARDEN_SANDBOX_ID } from '../src/world/levels/garden05.level.ts';
import { GARAGE_SANDBOX_ID } from '../src/world/levels/garage05.level.ts';
import { PORCH_SANDBOX_ID } from '../src/world/levels/porch05.level.ts';
import { SANDBOX_IDS, gridBuilds } from './tally-fixtures.ts';

/** A JUMP-AND-LAND rig, stated as a trace fact (not a label): finished,
 *  with one airborne segment of >= JUMP_S and >= RUNOUT_FACT_M of carried
 *  ground after its touchdown. 0.08 s sits above every deck seam the
 *  sim has ever produced (1 step = 0.0083 s) and below the sandbox gap
 *  flight (0.108 s measured); it is the eye's bar, not a badge bar. */
const JUMP_S = 0.08;
const RUNOUT_FACT_M = 0.15;

const SANDBOX_SET = new Set(SANDBOX_IDS);

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
  rigs.push({ name: id, scale: 'campaign', level, build: level.parBuild() });
}
for (const id of SANDBOX_IDS) {
  const level = getLevel(id);
  rigs.push({ name: id, scale: 'sandbox', level, build: level.parBuild(), ref: true });
}
for (const id of SANDBOX_IDS) {
  for (const f of gridBuilds(id)) {
    rigs.push({ name: f.name, scale: 'sandbox', level: getLevel(f.levelId), build: lay(f.list, f.levelId, 1), fixture: true, named: f.named });
  }
}
{
  const level = getLevel(KITCHEN_SANDBOX_ID);
  rigs.push({ name: 'BOOSTER-FARM', scale: 'sandbox', level, build: boosterFarm(), farm: true });
}

// one trace pass; everything below is pure re-scoring of these traces
for (const rig of rigs) {
  const run = await replayRun(rig.level, rig.build, { record: true });
  rig.run = run;
  rig.events = tallyFromTrace(run.trace ?? []);
  rig.counts = tallyCounts(rig.events);
  // jump-and-land fact
  let jumpAndLand = false;
  if (run.status === 'finished' && run.trace) {
    const tr = run.trace;
    let st = null;
    for (let i = 0; i < tr.length && !jumpAndLand; i++) {
      const s = tr[i];
      if (!s.grounded && st === null) st = s.t;
      if (s.grounded && st !== null) {
        if (s.t - st >= JUMP_S) {
          let d = 0;
          for (let j = i; j < Math.min(i + 240, tr.length); j++) {
            const a = tr[j], b = tr[j + 1];
            if (!b || !b.grounded || b.speed < 0.05) break;
            d += Math.hypot(b.pos[0] - a.pos[0], b.pos[2] - a.pos[2]);
          }
          if (d >= RUNOUT_FACT_M) jumpAndLand = true;
        }
        st = null;
      }
    }
  }
  rig.jumpAndLand = jumpAndLand;
}

const total = (counts) => BADGE_KINDS.reduce((s, k) => s + (counts[k] ?? 0), 0);

// ---- report 1: the per-rig table at the shipped thresholds ------------------
console.log(`rig                              status     time     ${BADGE_KINDS.map((k) => k.padStart(8)).join(' ')}  total  verdict`);
let fail = 0;
let degenerates = 0;
for (const rig of rigs) {
  if (rig.fixture && !rig.named) continue; // the grid rows aggregate below
  const counts = rig.counts;
  const cells = BADGE_KINDS.map((k) => String(counts[k] ?? 0).padStart(8));
  const t = total(counts);
  const over = t > BADGE_CAP_PER_RUN;
  if (over) { degenerates++; fail++; }
  console.log(
    `${rig.name.padEnd(30)} ${(rig.run.status ?? '?').padEnd(10)} ${rig.run.time.toFixed(3).padEnd(8)} ` +
      `${cells.join(' ')}  ${String(t).padStart(5)}  ${over ? `FAIL >${BADGE_CAP_PER_RUN}` : rig.jumpAndLand ? 'jump+land' : 'ok'}`,
  );
}
// grid aggregate (per sandbox: rows, finished, jump-and-land, badges minted)
console.log('\ngrid aggregate (288 sandbox-scale fixture builds):');
for (const id of SANDBOX_IDS) {
  const rows = rigs.filter((r) => r.fixture && r.level.id === id);
  const fin = rows.filter((r) => r.run.status === 'finished').length;
  const jl = rows.filter((r) => r.jumpAndLand).length;
  const jlMinted = rows.filter((r) => r.jumpAndLand && (r.counts.air ?? 0) > 0 && (r.counts.catch ?? 0) > 0).length;
  const badged = rows.filter((r) => total(r.counts) > 0).length;
  console.log(
    `  ${id.padEnd(18)} ${String(rows.length).padStart(3)} builds  ${String(fin).padStart(3)} finished  ` +
      `${String(jl).padStart(3)} jump+land  ${String(jlMinted).padStart(3)} minted air+catch  ${String(badged).padStart(3)} badged`,
  );
}
degenerates = rigs.filter((r) => total(r.counts) > BADGE_CAP_PER_RUN).length;

// ---- report 2: the threshold sweep, five thresholds x both scales -----------
const CANDIDATES = {
  airMinS: { label: 'AIR_MIN_S', shipped: AIR_MIN_S, values: [0.25, 0.15, 0.1, 0.05, 0.02], unit: 's' },
  catchMinAirS: { label: 'CATCH_MIN_AIR_S', shipped: CATCH_MIN_AIR_S, values: [0.15, 0.12, 0.1, 0.08], unit: 's' },
  runoutMinM: { label: 'RUNOUT_MIN_M', shipped: RUNOUT_MIN_M, values: [0.15, 0.1, 0.2, 0.3], unit: 'm' },
  fallMinS: { label: 'FALL_MIN_S', shipped: FALL_MIN_S, values: [0.15, 0.12, 0.1], unit: 's' },
  fallMinDropM: { label: 'FALL_MIN_DROP_M', shipped: FALL_MIN_DROP_M, values: [0.06, 0.08, 0.1], unit: 'm' },
};
console.log('\nthreshold sweep (one variable at a time; mint = jump+land runs earning air AND catch):');
console.log(`threshold          value    scale     minted/jump+land   max/run  degenerates  badges total`);
for (const [key, grid] of Object.entries(CANDIDATES)) {
  for (const v of grid.values) {
    for (const scale of ['campaign', 'sandbox']) {
      let jl = 0;
      let jlMint = 0;
      let max = 0;
      let deg = 0;
      let badges = 0;
      for (const rig of rigs) {
        if (rig.scale !== scale) continue;
        const ev = tallyFromTrace(rig.run.trace ?? [], { thresholds: { [key]: v } });
        const t = total(tallyCounts(ev));
        max = Math.max(max, t);
        if (t > BADGE_CAP_PER_RUN) deg++;
        badges += t;
        if (rig.jumpAndLand) {
          jl++;
          const c = tallyCounts(ev);
          if ((c.air ?? 0) > 0 && (c.catch ?? 0) > 0) jlMint++;
        }
      }
      console.log(
        `${grid.label.padEnd(16)} ${String(v).padEnd(8)} ${scale.padEnd(9)} ${String(jlMint).padStart(6)}/${String(jl).padEnd(11)} ${String(max).padStart(6)}  ${String(deg).padStart(10)}  ${badges}`,
      );
    }
  }
}

// ---- the gate ---------------------------------------------------------------
const farm = rigs.find((r) => r.farm);
const farmSpends = farm.counts.spend ?? 0;
const farmTotal = total(farm.counts);
const jlMisses = rigs.filter(
  (r) => r.jumpAndLand && !((r.counts.air ?? 0) > 0 && (r.counts.catch ?? 0) > 0),
);
console.log(
  `\n${rigs.length} rigs, shipped thresholds: degenerates ${degenerates}/${rigs.length} ` +
    `(cap ${BADGE_CAP_PER_RUN}), farm ${farmTotal} badges (${farmSpends} spend)`,
);
console.log(
  `jump-and-land mints: ${rigs.filter((r) => r.jumpAndLand && (r.counts.air ?? 0) > 0 && (r.counts.catch ?? 0) > 0).length}/` +
    `${rigs.filter((r) => r.jumpAndLand).length}`,
);
let gateFail = fail;
if (farmTotal > 3 || farmSpends !== 3) {
  console.log(`GATE FAIL — the farm's 3-spend law moved (${farmTotal} badges, ${farmSpends} spend)`);
  gateFail++;
}
if (jlMisses.length) {
  console.log(`GATE FAIL — ${jlMisses.length} jump-and-land rigs mint no air+catch (the sheet is deaf at that scale)`);
  gateFail++;
}
if (process.argv.includes('--gate') && gateFail) process.exit(1);
