// Stage-1 feel bake-off table. Run: npm run feel
import { initRapier } from '../src/physics/sim.ts';
import { feelTrackRun, loopThreshold, rollRun } from '../src/feel/run.ts';
import { LOOP_RADIUS } from '../src/feel/feeltrack.ts';

await initRapier();

const variants = ['wheelColliders', 'raycastWheels'];
const rows = [];
for (const variant of variants) {
  const feel = feelTrackRun(variant);
  const feel2 = feelTrackRun(variant);
  const roll = rollRun(variant);
  const loop = loopThreshold(variant, LOOP_RADIUS, { coef: 0, iters: 10 });
  const loopFric = loopThreshold(variant, LOOP_RADIUS, { coef: 0.117, iters: 10 });
  rows.push({
    variant,
    finish: feel.completed ? `${feel.timeToFinish?.toFixed(2)} s` : 'DNF',
    peak: `${feel.peakSpeed.toFixed(2)} m/s`,
    apex:
      feel.apexSpeed === null
        ? 'n/a'
        : `${feel.apexSpeed.toFixed(2)} / ${feel.apexMin.toFixed(2)} m/s (${(feel.apexSpeed / feel.apexMin).toFixed(2)}x)`,
    landing: `${feel.landingImpulse.toFixed(3)} Ns`,
    roll: roll.rollDistance === null ? 'no stop' : `${roll.rollDistance.toFixed(2)} m`,
    loopH: Number.isNaN(loop.height) ? '>' : `${loop.height.toFixed(3)} m (${loop.heightOverR.toFixed(2)} r)`,
    loopHfric: Number.isNaN(loopFric.height)
      ? '>4.5r'
      : `${loopFric.heightOverR.toFixed(2)} r`,
    hash: `${feel.hash}${feel2.hash === feel.hash ? ' =repeat' : ' !=repeat!'}`,
  });
}

const cols = Object.keys(rows[0]);
const w = Object.fromEntries(
  cols.map((c) => [c, Math.max(c.length, ...rows.map((r) => String(r[c]).length))]),
);
console.log(cols.map((c) => c.padEnd(w[c])).join(' | '));
for (const r of rows) console.log(cols.map((c) => String(r[c]).padEnd(w[c])).join(' | '));
