// FINAL candidate: S=0.09, lip {0.02,12,0.05}, drop {0.12,45,0.02,lead .07}
// tray {straight x2, gapLip, drop}; par = S,D,S (lazy). Every tray-order of
// ALL FOUR must finish; every subset < 4 must fail; no timeout/stall/flyover.
const W = '/Users/gusellerm/Projects/games/gw-ld6/src';
const { KITCHEN02 } = await import(`${W}/world/levels/kitchen02.level.ts`);
const { kitchenRamp, lay, startSocketFromBuild, KITCHEN_GEOM } = await import(`${W}/world/levels/kitchen01.level.ts`);
const { PIECES } = await import(`${W}/track/pieces.ts`);
const { fitSocket } = await import(`${W}/track/snap.ts`);
const { transformSocket } = await import(`${W}/track/socket.ts`);
const { World } = await import(`${W}/world/world.ts`);

const S = 0.09;
const LIP = { length: 0.02, angle: 12, blend: 0.05 };
const DROP = { height: 0.12, angle: 45, radius: 0.02, lead: 0.07 };
const P = { straight: { length: S }, drop: DROP, gapLip: LIP };
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
const level = { ...KITCHEN02, startSocket: startSocketFromBuild(par, KITCHEN_GEOM.release * KITCHEN_GEOM.rampBlend) };

function placed(kinds) {
  const fixtures = new Set(['ramp', 'finishCup', 'curve']);
  const pieces = par.pieces.filter((p) => fixtures.has(p.def)).map((p, i) => ({ ...p, seq: i }));
  const ramp = pieces.find((p) => p.def === 'ramp');
  let cursor = transformSocket(PIECES.ramp.sockets(ramp.params)[1], ramp.transform);
  for (const def of kinds) {
    const p = { ...P[def] };
    const t = fitSocket(cursor, PIECES[def].sockets(p)[0]);
    pieces.push({ def, params: p, transform: t, seq: pieces.length });
    cursor = transformSocket(PIECES[def].sockets(p)[1], t);
  }
  return { levelId: 'kitchen02', pieces, seed: KITCHEN02.seed };
}

async function run(build, seed) {
  const world = await World.create(seed ? { ...level, seed } : level, seed ? { ...build, seed } : build, { visuals: false });
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

console.log('== ALL 12 four-piece orders (must ALL finish) ==');
let bad = 0;
for (const p of perms(['straight', 'straight', 'gapLip', 'drop'])) {
  const r = await run(placed(p));
  if (r.status !== 'finished') bad++;
  console.log(p.map((q) => q[0]).join(''), r.status, r.time, r.status === 'finished' ? '' : `x=${r.x} y=${r.y}`);
}
console.log('bad:', bad);
console.log('== named ==');
for (const [lbl, kinds] of [
  ['lazy S,D,S', ['straight', 'drop', 'straight']],
  ['lazyvar D,S,S', ['drop', 'straight', 'straight']],
  ['lazyvar S,S,D', ['straight', 'straight', 'drop']],
  ['arc GL,D,S', ['gapLip', 'drop', 'straight']],
  ['arc D,GL,S', ['drop', 'gapLip', 'straight']],
  ['arc GL,S,D', ['gapLip', 'straight', 'drop']],
  ['S,S', ['straight', 'straight']],
  ['S,GL', ['straight', 'gapLip']],
  ['S,D', ['straight', 'drop']],
  ['GL,D', ['gapLip', 'drop']],
  ['S,S,GL', ['straight', 'straight', 'gapLip']],
  ['S,S,D?? 3pc-no-lip (lazy permut)', ['straight', 'straight', 'drop']],
  ['GL only', ['gapLip']],
  ['S only', ['straight']],
  ['D only', ['drop']],
]) console.log(lbl.padEnd(34), JSON.stringify(await run(placed(kinds))));
console.log('== seed sweep 1..8 on par + arc order ==');
for (let seed = 1; seed <= 8; seed++) {
  const a = await run(placed(['straight', 'drop', 'straight']), seed);
  const b = await run(placed(['gapLip', 'drop', 'straight']), seed);
  console.log(seed, a.status, a.time, '|', b.status, b.time);
}
