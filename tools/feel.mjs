// Stage-2 feel harness table. Run: npm run feel
//
// rollDrop: the honest free-drop rig (review finding 1) - car released from
//   REST (no launch velocity) 0.3 m world above the flat deck, 2 m world of
//   true-metre deck down-deck of the ramp run-out; reported travel is the
//   wheel-centre path AFTER touchdown. A symmetric vertical drop carries no
//   horizontal momentum, so ~0 m is the physically honest reading here.
// rollRamp: the brief §7.1 metric - release from REST at the top of the
//   30 cm drop ramp, wheel-centre travel from touchdown to stop. Target
//   ~2.5 m; see the note under the table.
import { initRapier } from '../src/physics/sim.ts';
import { feelTrackRun, loopThreshold, rampRollRun, rollRun } from '../src/feel/run.ts';
import { LOOP_RADIUS } from '../src/feel/feeltrack.ts';

await initRapier();

const variants = ['wheelColliders', 'raycastWheels'];
const rows = [];
for (const variant of variants) {
  const feel = feelTrackRun(variant);
  const feel2 = feelTrackRun(variant);
  const roll = rollRun(variant);
  const ramp = rampRollRun(variant);
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
    rollDrop: roll.rollDistance === null ? 'no touchdown' : `${roll.rollDistance.toFixed(2)} m`,
    rollRamp: ramp.rollDistance === null ? 'no touchdown' : `${ramp.rollDistance.toFixed(2)} m`,
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
console.log();
console.log(
  'rollDrop = free-drop rig (0.3 m vertical, no launch; travel after touchdown).\n' +
    'rollRamp = brief §7.1 rig (release from rest on the 30 cm drop ramp; travel\n' +
    'to stop). Target ~2.5 m: ideal physics d = h/mu puts mu=0.02 at ~15 m, so\n' +
    'ROLL_COEF (tuned on the broken stage-1 rig) still needs re-tuning; seam\n' +
    'stitching + spring losses already cut it to 8.46 m and real-wheel ploughing\n' +
    'on the chord slabs to 5.87 m. The track kit\'s stitched colliders are the\n' +
    'stage-2 item that closes the remaining gap.',
);
