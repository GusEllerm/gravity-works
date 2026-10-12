import { World, CUP_CAPTURE_FACTOR } from '../src/world/world.ts';
import { HOUSE } from '../src/world/levels/house.level.ts';
import type { Level } from '../src/world/level.ts';
const beat = { ...HOUSE, inputs: { windEvery: 0, windDeltaV: 0, launchSpeed: 1.3 } } as unknown as Level;
const world = await World.create(beat, HOUSE.parBuild(), { visuals: false });
const seen = new Set<string>(); const order: string[] = [];
world.launch();
while (world.status === 'running' && world.stepCount <= 120*12) {
  world.step();
  const s = world.state();
  for (const p of HOUSE.parcels) {
    if (seen.has(p.room)) continue;
    const d = Math.hypot(s.car.pos.x-p.center[0], s.car.pos.y-p.center[1], s.car.pos.z-p.center[2]);
    if (d < p.radius*CUP_CAPTURE_FACTOR) { seen.add(p.room); order.push(`${p.room}@${world.time.toFixed(2)}`); }
  }
}
if (world.status === 'stalled') {
  const s = world.state();
  for (const p of HOUSE.parcels) {
    if (seen.has(p.room)) continue;
    const d = Math.hypot(s.car.pos.x-p.center[0], s.car.pos.y-p.center[1], s.car.pos.z-p.center[2]);
    if (d < p.radius*CUP_CAPTURE_FACTOR+0.04) { seen.add(p.room); order.push(`${p.room}@${world.time.toFixed(2)}(stall)`); }
  }
}
console.log('inputs-data beat:', world.status, world.time.toFixed(2), 'steps', world.stepCount, '|', order.join(' '));
