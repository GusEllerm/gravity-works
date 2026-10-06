// Make the launch line measurably slower than the lazy line on the SAME rail
// physics: sweep lip angle (bigger hop) x drop exit lead (catch bump).
const W = '/Users/gusellerm/Projects/games/gw-ld6/src';
const { KITCHEN02 } = await import(`${W}/world/levels/kitchen02.level.ts`);
const { KITCHEN_GAP, kitchenRamp, lay, startSocketFromBuild, KITCHEN_GEOM } = await import(`${W}/world/levels/kitchen01.level.ts`);
const { PIECES } = await import(`${W}/track/pieces.ts`);
const { fitSocket } = await import(`${W}/track/snap.ts`);
const { transformSocket } = await import(`${W}/track/socket.ts`);
const { World } = await import(`${W}/world/world.ts`);

function placed(par, kinds, P) {
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

async function run(level, build) {
  const world = await World.create(level, build, { visuals: false });
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

for (const lipAngle of [10, 12, 14]) {
  for (const lead of [0.05, 0.07, 0.09]) {
    const lip = { length: 0.02, angle: lipAngle, blend: 0.05 };
    const drop = { height: 0.12, angle: 45, radius: 0.02, lead };
    const S = 0.09;
    const P = { straight: { length: S }, drop, gapLip: lip };
    const par = lay(
      [
        { def: 'ramp', params: kitchenRamp(0.28) },
        { def: 'straight', params: { length: S } },
        { def: 'drop', params: drop },
        { def: 'straight', params: { length: S } },
        { def: 'finishCup' },
        { def: 'curve', params: { radius: 1.2, angle: 40 } },
      ],
      'kitchen02',
      1,
    );
    const level = { ...KITCHEN02, startSocket: startSocketFromBuild(par, KITCHEN_GEOM.release * KITCHEN_GEOM.rampBlend) };
    const lazy = await run(level, placed(par, ['straight', 'drop', 'straight'], P));
    if (lazy.status !== 'finished') { console.log(`a=${lipAngle} lead=${lead} LAZY FAILS`); continue; }
    const lazyVar = await run(level, placed(par, ['drop', 'straight', 'straight'], P));
    const arc = await run(level, placed(par, ['gapLip', 'drop', 'straight'], P));
    const arcPerms = [];
    for (const p of perms(['gapLip', 'drop', 'straight'])) {
      const r = await run(level, placed(par, p, P));
      arcPerms.push(`${p[0][0]}${p[1][0]}${p[2][0]}:${r.status[0]}${r.time}`);
    }
    const a4 = [];
    let a4fin = 0;
    for (const p of perms(['straight', 'straight', 'gapLip', 'drop'])) {
      const r = await run(level, placed(par, p, P));
      if (r.status === 'finished') a4fin++;
      else a4.push(`${p.map((q) => q[0]).join('')}:${r.status[0]}${r.time}${r.y < -1 ? `x${r.x}` : ''}`);
    }
    const p2 = [];
    for (const p of [['straight', 'straight'], ['straight', 'gapLip'], ['straight', 'drop'], ['gapLip', 'drop']]) {
      const r = await run(level, placed(par, p, P));
      p2.push(`${p.map((q) => q[0]).join('')}:${r.status[0]}${r.time}${r.y < -1 ? `@${r.x}` : ''}`);
    }
    console.log(
      `a=${lipAngle} lead=${lead} | lazy=${lazy.time} lazyvar=${lazyVar.status[0]}${lazyVar.time} arc=${arc.status[0]}${arc.time} (Δ${(arc.time - lazy.time).toFixed(2)}) | all4 ${a4fin}/12 ${a4.join(' ')} | arcs ${arcPerms.join(' ')} | 2pc ${p2.join(' ')}`,
    );
  }
}
