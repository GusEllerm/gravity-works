import { World, CUP_CAPTURE_FACTOR } from '../src/world/world.ts';
import { HOUSE } from '../src/world/levels/house.level.ts';
import { CAR } from '../src/physics/car.ts';
import { SIM_SCALE, FIXED_DT } from '../src/physics/sim.ts';
const beat = { ...HOUSE, inputs: undefined } as unknown as typeof HOUSE;
const extra = CAR.halfL / SIM_SCALE;
for (const ls of [13,14,15,17,18]) {
  const world = await World.create(beat, HOUSE.parBuild(), { visuals: false, launchSpeed: ls });
  const seen = new Set<string>(); const order: string[] = [];
  world.launch();
  while (world.status === 'running' && world.stepCount <= 120*12) {
    world.step();
    const s = world.state();
    for (const p of HOUSE.parcels) {
      if (seen.has(p.room)) continue;
      const d = Math.hypot(s.car.pos.x-p.center[0], s.car.pos.y-p.center[1], s.car.pos.z-p.center[2]);
      if (d < (p.radius*CUP_CAPTURE_FACTOR)**2**0 || d < p.radius*CUP_CAPTURE_FACTOR) { seen.add(p.room); order.push(`${p.room}@${world.time.toFixed(2)}`); }
    }
  }
  // stall branch
  if (world.status === 'stalled') {
    const s = world.state();
    for (const p of HOUSE.parcels) {
      if (seen.has(p.room)) continue;
      const d = Math.hypot(s.car.pos.x-p.center[0], s.car.pos.y-p.center[1], s.car.pos.z-p.center[2]);
      if (d < p.radius*CUP_CAPTURE_FACTOR+extra) { seen.add(p.room); order.push(`${p.room}@${world.time.toFixed(2)}(stall)`); }
    }
  }
  console.log('launch', ls, world.status, world.time.toFixed(2), world.stepCount, world.hashHex(), '|', order.join(' '));
  await (world as any).dispose?.();
}
