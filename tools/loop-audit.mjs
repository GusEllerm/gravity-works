import { initRapier, SIM_SCALE as S, createWorld, stepWorld, qrot, v } from '../src/physics/sim.ts';
import { spawnCar, carStep, carSpeed, applyRollingResistance, CAR, WORK } from '../src/physics/car.ts';
import { loopRig } from '../src/feel/feeltrack.ts';
import { ROLL_COEF } from '../src/feel/run.ts';
await initRapier();
const radius = 0.09, hr = +(process.argv[2] || 2.8);
const [k, z] = [+(process.argv[3] || 30000), +(process.argv[4] || 0.7)];
CAR.suspK = k; CAR.suspC = z * 2 * Math.sqrt(k * 10); WORK.on = true;
const rig = loopRig(hr * radius, radius);
const world = createWorld();
rig.addColliders(world);
const car = spawnCar(world, 'raycastWheels', rig.poseAt(rig.marks.start), { launchSpeed: 0 });
const m = car.chassis.mass();
for (const key of Object.keys(WORK)) WORK[key] = 0;
let prev = null;
const bottomAt = rig.starts[1] + 0.04;
for (let step = 0; step < 300; step++) {
  const support = carStep(world, car);
  applyRollingResistance(car, support.grounded, ROLL_COEF);
  stepWorld(world);
  if (step % 6 === 0) {
    const t = car.chassis.translation();
    const lv = car.chassis.linvel();
    const ke = 0.5 * m * (lv.x ** 2 + lv.y ** 2 + lv.z ** 2), pe = m * 98 * t.y;
    const proj = rig.nearestArcInfo(v(t.x / S, t.y / S, t.z / S));
    const tot = Object.values(WORK).reduce((a, b) => a + b, 0);
    console.log(step, 'x', (t.x / S).toFixed(3), 'y', (t.y / S).toFixed(3), 'v', carSpeed(car).toFixed(1), 'E', ((ke + pe) / 1000).toFixed(1), 'loss', (tot / 1000).toFixed(1), Object.entries(WORK).filter(([, b]) => Math.abs(b) > 500).map(([a, b]) => a + ':' + (b / 1000).toFixed(1)).join(' '));
  }
  if (car.chassis.translation().y < -80) { console.log('fell', step); break; }
}
