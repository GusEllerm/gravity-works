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
    'loopH = bisected release height on the loop rig under the hardened gate\n' +
    '(apex inverted + deck loaded + sqrt(gr) speed floor + exit witness).\n' +
    'The ring is two half-arcs, not a circle - a tangent circle hands the car\n' +
    'back its own rising entry chords and it orbits the bottom corner forever\n' +
    '(pieces.ts loopGeometry). loopH is the LOW edge of a window: released too\n' +
    'low the car cannot hold the apex, released above ~6 r it leaves the deck\n' +
    'inside the ring and falls out. Both variants agree. The number sits at\n' +
    '2.0 r, BELOW the 2.25-2.75 r target, because the lap gains energy from the\n' +
    'solver (~50% more specific energy at the apex than the drop can pay for);\n' +
    'that injection is the open item. loopHfric is the same wall with the\n' +
    'shipped Coulomb coefficient spent across the run-in, which is the number\n' +
    'the game plays with. See Modules/feel.md.',
);
