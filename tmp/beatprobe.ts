import { World, CUP_CAPTURE_FACTOR } from '../src/world/world.ts';
import { HOUSE } from '../src/world/levels/house.level.ts';
import { CAR } from '../src/physics/car.ts';
import { SIM_SCALE, FIXED_DT } from '../src/physics/sim.ts';
const beat = { ...HOUSE, inputs: undefined } as unknown as typeof HOUSE;
const world = await World.create(beat, HOUSE.parBuild(), { visuals: false });
const extra = (CAR.halfL / SIM_SCALE)
const minD: Record<string, number> = {};
world.launch();
let t = 0;
while (world.status === 'running' && world.stepCount <= 120*12) {
  world.step();
  const s = world.state();
  for (const p of HOUSE.parcels) {
    const d = Math.hypot(s.car.pos.x - p.center[0], s.car.pos.y - p.center[1], s.car.pos.z - p.center[2]);
    if (!(p.room in minD) || d < minD[p.room]!) minD[p.room] = d;
  }
}
console.log('status', world.status, 'steps', world.stepCount, 'time', world.time.toFixed(2), 'hash', world.hashHex());
for (const p of HOUSE.parcels) console.log(p.room, 'minD', minD[p.room]?.toFixed(3), 'capR', (p.radius*CUP_CAPTURE_FACTOR).toFixed(3), 'stallR', ((p.radius*CUP_CAPTURE_FACTOR)+extra).toFixed(3));
