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
    loopH: Number.isNaN(loop.height) ? 'DNF' : `${loop.height.toFixed(3)} m (${loop.heightOverR.toFixed(2)} r)`,
    loopHfric: Number.isNaN(loopFric.height)
      ? 'DNF'
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
    'to stop). Target ~2.5 m: MET (2.49 m) since the SIM_SCALE velocity-mapping\n' +
    'fix - toWorldSpeed divided by sqrt(S) instead of S had tuned mu against an\n' +
    'inflated number; ROLL_COEF 0.12 is the honest constant now.\n' +
    'loopH = bisected release height on the steep-ramp loop rig (r = 0.09) under\n' +
    'the HARDENED gate (apex inverted + deck-loaded + speed floor). DNF = no\n' +
    'release height completes: the 1.41 r ballistic-interior pass is closed and\n' +
    'no positive threshold has been found yet - the suspension cannot track a\n' +
    '20-30 rad/s loop frame rate at any k swept. See Modules/feel.md.',
);
