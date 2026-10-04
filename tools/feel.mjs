// Stage-2 feel harness table. Run: npm run feel
//
//   node tools/feel.mjs            - the metrics table (below)
//   node tools/feel.mjs audit [hR] [arc0 arc1] - per-step energy ledger on the
//     loop rig (specific J/kg, world): total energy, per-contact-site work,
//     and the UNEXPLAINED remainder. The audit is what named the stage-2
//     injection: the ring-entry guide contact solved its geometry reading as
//     a velocity-free position projection and handed the car +1.03 J/kg in
//     one step - the whole ~1 J/kg the threshold was short by. A site whose
//     column goes POSITIVE at a junction is injecting; with the audited
//     solver every site's running total is <= 0 and `res` is solver noise.
//
// rollDrop: the honest free-drop rig (review finding 1) - car released from
//   REST (no launch velocity) 0.3 m world above the flat deck, 2 m world of
//   true-metre deck down-deck of the ramp run-out; reported travel is the
//   wheel-centre path AFTER touchdown. A symmetric vertical drop carries no
//   horizontal momentum, so ~0 m is the physically honest reading here.
// rollRamp: the brief §7.1 metric - release from REST at the top of the
//   30 cm drop ramp, wheel-centre travel from touchdown to stop. Target
//   ~2.5 m; see the note under the table.
import { initRapier, createWorld, stepWorld, qrot, v, vdot, SIM_SCALE as S, G_SIM } from '../src/physics/sim.ts';
import { spawnCar, carStep, carSpeed, applyRollingResistance, CAR, WORK } from '../src/physics/car.ts';
import { loopRig } from '../src/feel/feeltrack.ts';
import { feelTrackRun, loopGateWings, loopThreshold, rampRollRun, rollRun, ROLL_COEF } from '../src/feel/run.ts';
import { LOOP_GATE_BRACKET_OVER_R, LOOP_RADIUS } from '../src/feel/feeltrack.ts';

await initRapier();

if (process.argv[2] === 'audit') {
  // Per-step energy ledger on the loop rig - see the header for what it
  // proved. Zoom to an arc window (sim units) with [hR] [arc0 arc1].
  const hr = Number(process.argv[3] ?? 2.4);
  const R = LOOP_RADIUS;
  const rig = loopRig(hr * R, R);
  const world = createWorld();
  rig.addColliders(world);
  const car = spawnCar(world, 'raycastWheels', rig.poseAt(rig.marks.start), { launchSpeed: 0 });
  const m = car.chassis.mass();
  const I = [
    (m / 3) * (CAR.halfH ** 2 + CAR.halfW ** 2),
    (m / 3) * (CAR.halfL ** 2 + CAR.halfW ** 2),
    (m / 3) * (CAR.halfL ** 2 + CAR.halfH ** 2),
  ];
  WORK.on = true;
  for (const k of Object.keys(WORK)) if (typeof WORK[k] === 'number') WORK[k] = 0;
  const ke = (b, inertia) => {
    const lv = b.linvel();
    const av = b.angvel();
    const q = b.rotation();
    const avL = qrot({ w: q.w, x: -q.x, y: -q.y, z: -q.z }, av);
    let r = 0.5 * b.mass() * vdot(lv, lv);
    if (inertia) r += 0.5 * (avL.x * avL.x * inertia[0] + avL.y * avL.y * inertia[1] + avL.z * avL.z * inertia[2]);
    return r;
  };
  const energy = () => ke(car.chassis, I) + m * G_SIM * car.chassis.translation().y;
  // specific energy, world J/kg
  const spec = () => energy() / m / (S * S);
  console.log('release', spec().toFixed(4), 'theory', (9.81 * hr * R).toFixed(4), 'mass', m.toFixed(1));
  const zoom0 = +(process.argv[4] ?? -1);
  const zoom1 = +(process.argv[5] ?? -1);
  for (let step = 0; step < 600; step++) {
    const e0 = energy();
    const before = {};
    for (const k of Object.keys(WORK)) if (typeof WORK[k] === 'number') before[k] = WORK[k];
    const support = carStep(world, car);
    applyRollingResistance(car, support.grounded, ROLL_COEF);
    stepWorld(world);
    const e1 = energy();
    const w = {};
    let tot = 0;
    for (const k of Object.keys(WORK)) if (typeof WORK[k] === 'number') { w[k] = (WORK[k] - before[k]) / m / (S * S); tot += w[k]; }
    const res = (e1 - e0) / m / (S * S) - tot;
    const t = car.chassis.translation();
    const proj = rig.nearestArcInfo(v(t.x / S, t.y / S, t.z / S));
    const inWindow = zoom0 < 0 || (proj.arc >= zoom0 && proj.arc <= zoom1);
    if (inWindow && (zoom0 >= 0 ? true : step % 12 === 0)) {
      const big = Object.entries(w)
        .filter(([, x]) => Math.abs(x) > 2e-4)
        .map(([a, x]) => `${a}:${x.toFixed(4)}`)
        .join(' ');
      console.log(step, 'arc', proj.arc.toFixed(3), 'y', (t.y / S).toFixed(3), 'v', (carSpeed(car) / S).toFixed(2), 'E', spec().toFixed(4), 'dE', ((e1 - e0) / m / (S * S)).toFixed(5), 'W', tot.toFixed(5), 'res', res.toFixed(5), support.grounded ? 'G' : '.', big);
    }
    if (t.y < -80) { console.log('fell', step); break; }
  }
  console.log('final', spec().toFixed(4), Object.entries(WORK).filter(([, x]) => typeof x === 'number').map(([a, x]) => `${a}:${(x / m / (S * S)).toFixed(4)}`).join(' '));
} else {
const variants = ['wheelColliders', 'raycastWheels'];
const rows = [];
for (const variant of variants) {
  const feel = feelTrackRun(variant);
  const feel2 = feelTrackRun(variant);
  const roll = rollRun(variant);
  const ramp = rampRollRun(variant);
  const loop = loopThreshold(variant, LOOP_RADIUS, {
    coef: ROLL_COEF,
    iters: 10,
    lo: LOOP_GATE_BRACKET_OVER_R[0] * LOOP_RADIUS,
    hi: LOOP_GATE_BRACKET_OVER_R[1] * LOOP_RADIUS,
  });
  const wings = loopGateWings(variant, LOOP_RADIUS);
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
    loopGate: Number.isNaN(loop.height)
      ? 'DNF'
      : `${loop.heightOverR.toFixed(2)} r [${wings.low ? 'Y' : 'n'}/${wings.high ? 'Y' : 'n'}]`,
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
    'to stop). Target ~2.5 m: MET (2.47 m) since the SIM_SCALE velocity-mapping\n' +
    'fix - toWorldSpeed divided by sqrt(S) instead of S had tuned mu against an\n' +
    'inflated number; ROLL_COEF 0.12 is the honest constant now.\n' +
    'loopGate = THE canonical loop threshold: bisect of the witness-proven\n' +
    'completion predicate (apex inverted + deck loaded + sqrt(gr) speed floor\n' +
    '+ exit witness) on the friction-aware loop rig at the SHIPPED ROLL_COEF,\n' +
    'inside the bracket LOOP_GATE_BRACKET_OVER_R = [2.2, 2.6] r; the bracket\n' +
    'shows [low-wing/high-wing] = [n/Y] (lower release fails, higher\n' +
    'completes) - asserted every run in tests/unit/feel.test.ts, band\n' +
    '[2.25, 2.75] r via LOOP_BAND_OVER_R. Converged: 2.30 r. The ring is two\n' +
    'half-arcs, not a circle - a tangent circle hands the car back its own\n' +
    'rising entry chords and it orbits the bottom corner forever (pieces.ts\n' +
    'loopGeometry). Since the 2026-10-06 energy audit (`audit` mode above)\n' +
    'removed the ring-entry injection the threshold sits on the drop\'s own\n' +
    'money, and the window has no solver-made CEILING: the audited car holds\n' +
    'the ring through 7 r (the old "flies out above ~6 r" behaviour was the\n' +
    'same injection kicking the car off the deck at exit; the physical\n' +
    'up-stop-wheel ceiling is open). Mid-window dips (e.g. 2.5, 3.0 r) are\n' +
    'real bounce-phase losses, stated in tests/unit/feel.test.ts.\n' +
    'PROVENANCE of the retired numbers (stage-2 review: three values, one\n' +
    'metric): the old `loopH` row (3.03 r) bisected the SAME predicate at\n' +
    'coef 0 - a frictionless run-in the shipped car does not have, never a\n' +
    'shipped metric; the old `loopHfric` row (2.51 r) bisected the shipped\n' +
    'predicate over the naive [1.4, 4.5] r bracket WITH coef mirrored as a\n' +
    'hardcoded 0.117 instead of importing ROLL_COEF = 0.12 - on the known\n' +
    'non-monotone dip structure its landing spot was bracket luck, not a\n' +
    'threshold; the footer prose "2.4 r" was the coarse-grid edge row, one\n' +
    'sample, not a bisect. All three are superseded by `loopGate` above.\n' +
    'See Modules/feel.md.',
);
}
