// Option C grid: tray {straight x2, gapLip, drop}; arc = GL,D,S; tune lip so
// GLx ~= 0.18 (sum law) and the launch costs the arc real time, with no
// flyover-past-cup deaths and no timeouts on any full-tray chain.
const W = '/Users/gusellerm/Projects/games/gw-ld6/src';
const { KITCHEN02 } = await import(`${W}/world/levels/kitchen02.level.ts`);
const { KITCHEN_GAP, kitchenRamp, lay } = await import(`${W}/world/levels/kitchen01.level.ts`);
const { PIECES } = await import(`${W}/track/pieces.ts`);
const { fitSocket } = await import(`${W}/track/snap.ts`);
const { transformSocket } = await import(`${W}/track/socket.ts`);
const { World } = await import(`${W}/world/world.ts`);

const S = 0.18;
const DROP = KITCHEN_GAP.drop;
const par = lay(
  [
    { def: 'ramp', params: kitchenRamp(0.28) },
    { def: 'straight', params: { length: S } },
    { def: 'drop', params: DROP },
    { def: 'straight', params: { length: S } },
    { def: 'finishCup' },
    { def: 'curve', params: { radius: 1.2, angle: 40 } },
  ],
  'kitchen02',
  1,
);

function placed(kinds, lip) {
  const fixtures = new Set(['ramp', 'finishCup', 'curve']);
  const pieces = par.pieces.filter((p) => fixtures.has(p.def)).map((p, i) => ({ ...p, seq: i }));
  const ramp = pieces.find((p) => p.def === 'ramp');
  let cursor = transformSocket(PIECES.ramp.sockets(ramp.params)[1], ramp.transform);
  const P = { straight: { length: S }, drop: DROP, gapLip: lip };
  for (const def of kinds) {
    const p = { ...P[def] };
    const t = fitSocket(cursor, PIECES[def].sockets(p)[0]);
    pieces.push({ def, params: p, transform: t, seq: pieces.length });
    cursor = transformSocket(PIECES[def].sockets(p)[1], t);
  }
  return { levelId: 'kitchen02', pieces, seed: KITCHEN02.seed };
}

async function run(build) {
  const world = await World.create(KITCHEN02, build, { visuals: false });
  world.launch();
  while (world.stepCount < 15 * 120 && world.status === 'running') world.step();
  const pose = world.carPose(1);
  const r = { status: world.status, time: +world.time.toFixed(2), x: +pose.pos.x.toFixed(2), y: +pose.pos.y.toFixed(2) };
  world.dispose();
  return r;
}

function perms(items, pre = []) {
  if (!items.length) return [pre];
  const out = [];
  const seen = new Set();
  items.forEach((x, i) => {
    if (seen.has(x)) return;
    seen.add(x);
    out.push(...perms([...items.slice(0, i), ...items.slice(i + 1)], [...pre, x]));
  });
  return out;
}

const allPerms = perms(['straight', 'straight', 'gapLip', 'drop']);
const arcPerms = perms(['gapLip', 'drop', 'straight']);
const lazyPerms = perms(['straight', 'straight', 'drop']);
const partials = [['straight', 'straight'], ['straight', 'gapLip'], ['straight', 'drop'], ['gapLip', 'drop'], ['straight'], ['gapLip'], ['drop']];

const grid = [];
for (const angle of [12, 14, 16, 18, 20]) {
  for (const length of [0.09, 0.1, 0.11, 0.12, 0.13, 0.14]) grid.push({ length, angle, blend: 0.05 });
}

for (const lip of grid) {
  const [a, b] = PIECES.gapLip.sockets(lip);
  const glx = +(b.pos.x - a.pos.x).toFixed(3);
  if (Math.abs(glx - S) > 0.02) continue; // sum law: GL span must equal the straight's
  const lazy = await run(placed(lazyPerms[0], lip)); // S,D,S
  let ok = lazy.status === 'finished';
  const notes = [];
  const times = {};
  for (const p of arcPerms) {
    const r = await run(placed(p, lip));
    times[p.join(',')] = `${r.status}@${r.time}`;
    if (p.join() === ['gapLip','drop','straight'].join()) { ok &&= r.status === 'finished'; if (r.status === 'finished') notes.push(`arc ${r.time}`); else notes.push(`ARC FAILS ${JSON.stringify(r)}`); }
    if (r.status === 'fell' && r.y < -1 && r.x > 2.26) notes.push(`FLYOVER ${p.join('>')}`);
    if (r.status === 'timeout') notes.push(`TIMEOUT ${p.join('>')}`);
  }
  let all4 = [];
  for (const p of allPerms) {
    const r = await run(placed(p, lip));
    if (r.status === 'timeout') notes.push(`TIMEOUT ${p.join('>')}`);
    if (r.status === 'fell' && r.y < -1 && r.x > 2.26) notes.push(`FLYOVER ${p.join('>')}`);
    if (r.status === 'finished') all4.push(r.time);
    else all4.push(`${r.status}:${r.x}`);
  }
  const ss = await run(placed(['straight', 'straight'], lip));
  if (!(ss.status !== 'finished' && (ss.y > -1 || ss.x < 2.26))) notes.push('SS-not-in-gap');
  for (const p of partials) {
    const r = await run(placed(p, lip));
    if (r.status === 'finished') notes.push(`PARTIAL FINISHES ${p.join('>')}`);
    if (r.status === 'timeout') notes.push(`PARTIAL TIMEOUT ${p.join('>')}`);
    if (r.status === 'fell' && r.y < -1 && r.x > 2.26) notes.push(`PARTIAL FLYOVER ${p.join('>')}`);
  }
  const lazyVar = await run(placed(['drop', 'straight', 'straight'], lip));
  console.log(`lip L=${lip.length} a=${lip.angle} GLx=${glx} lazy=${lazy.time} parT=${Math.ceil(lazy.time*20)/20} ${ok ? 'OK ' : 'BAD'} ${notes.join(' | ') || 'clean'} | all4finished=${all4.filter(v=>typeof v==='number').length}/12 lazyvar=${lazyVar.status}@${lazyVar.time}`);
}
