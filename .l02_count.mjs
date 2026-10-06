// Count sweep: OLD (5-piece tray) vs NEW (4-piece union tray), all distinct
// chains of all subsets, on the builder mount.
const W = '/Users/gusellerm/Projects/games/gw-ld6/src';

async function harness(mod, old) {
  const { KITCHEN02 } = await import(mod);
  const k01 = await import(`${W}/world/levels/kitchen01.level.ts`);
  const { PIECES } = await import(`${W}/track/pieces.ts`);
  const { fitSocket } = await import(`${W}/track/snap.ts`);
  const { transformSocket } = await import(`${W}/track/socket.ts`);
  const { World } = await import(`${W}/world/world.ts`);
  const par = KITCHEN02.parBuild();
  const fixtures = new Set(['ramp', 'finishCup', 'curve']);
  const P = old
    ? { straight: { length: 0.18 }, drop: k01.KITCHEN_GAP.drop, gapLip: k01.KITCHEN_GAP.lip, landing: k01.KITCHEN_GAP.landing }
    : { straight: { length: 0.09 }, drop: { height: 0.12, angle: 45, radius: 0.02, lead: 0.07 }, gapLip: { length: 0.02, angle: 12, blend: 0.05 } };
  function placed(kinds) {
    const pieces = KITCHEN02.parBuild().pieces.filter((p) => fixtures.has(p.def)).map((p, i) => ({ ...p, seq: i }));
    const ramp = pieces.find((p) => p.def === 'ramp');
    let cursor = transformSocket(PIECES.ramp.sockets(ramp.params)[1], ramp.transform);
    for (const def of kinds) {
      const p = { ...P[def] };
      const t = fitSocket(cursor, PIECES[def].sockets(p)[0]);
      pieces.push({ def, params: p, transform: t, seq: pieces.length });
      cursor = transformSocket(PIECES[def].sockets(p)[1], t);
    }
    return { levelId: par.levelId, pieces, seed: KITCHEN02.seed };
  }
  const seqs = [];
  const seen = new Set();
  const items = old ? ['straight', 'straight', 'gapLip', 'drop', 'landing'] : ['straight', 'straight', 'gapLip', 'drop'];
  (function walk(cur, pool) {
    if (cur.length && !seen.has(cur.join('>'))) { seen.add(cur.join('>')); seqs.push([...cur]); }
    for (let i = 0; i < pool.length; i++) walk([...cur, pool[i]], [...pool.slice(0, i), ...pool.slice(i + 1)]);
  })([], items);
  let fin = 0, far = 0;
  const farlist = [];
  for (const s of seqs) {
    const world = await World.create(KITCHEN02, placed(s), { visuals: false });
    world.launch();
    while (world.stepCount < 15 * 120 && world.status === 'running') world.step();
    const pose = world.carPose(1);
    if (world.status === 'finished') fin++;
    else if (pose.pos.x > 2.3 && pose.pos.y < -1) { far++; farlist.push(`${s.join('>')}:${world.time.toFixed(2)}@${pose.pos.x.toFixed(2)}`); }
    world.dispose();
  }
  return { seqs: seqs.length, fin, far, farlist };
}

console.log('OLD:', JSON.stringify(await harness(`${W}/world/levels/koz0old.level.ts`, true), null, 1));
console.log('NEW:', JSON.stringify(await harness(`${W}/world/levels/kitchen02.level.ts`, false), null, 1));

// list finishing chains for NEW
{
  const W2 = W;
  const { KITCHEN02 } = await import(`${W2}/world/levels/kitchen02.level.ts`);
  const { PIECES } = await import(`${W2}/track/pieces.ts`);
  const { fitSocket } = await import(`${W2}/track/snap.ts`);
  const { transformSocket } = await import(`${W2}/track/socket.ts`);
  const { World } = await import(`${W2}/world/world.ts`);
  const par = KITCHEN02.parBuild();
  const fixtures = new Set(['ramp', 'finishCup', 'curve']);
  const P = { ...(KITCHEN02.trayParams ?? {}) };
  for (const p of par.pieces) if (KITCHEN02.tray[p.def] && P[p.def] === undefined) P[p.def] = p.params;
  function placed(kinds) {
    const fresh = KITCHEN02.parBuild();
    const pieces = fresh.pieces.filter((p) => fixtures.has(p.def)).map((p, i) => ({ ...p, seq: i }));
    const ramp = pieces.find((p) => p.def === 'ramp');
    let cursor = transformSocket(PIECES.ramp.sockets(ramp.params)[1], ramp.transform);
    for (const def of kinds) {
      const p = { ...P[def] };
      const t = fitSocket(cursor, PIECES[def].sockets(p)[0]);
      pieces.push({ def, params: p, transform: t, seq: pieces.length });
      cursor = transformSocket(PIECES[def].sockets(p)[1], t);
    }
    return { levelId: par.levelId, pieces, seed: KITCHEN02.seed };
  }
  const seqs = [];
  const seen = new Set();
  const items = ['straight', 'straight', 'gapLip', 'drop'];
  (function walk(cur, pool) {
    if (cur.length && !seen.has(cur.join('>'))) { seen.add(cur.join('>')); seqs.push([...cur]); }
    for (let i = 0; i < pool.length; i++) walk([...cur, pool[i]], [...pool.slice(0, i), ...pool.slice(i + 1)]);
  })([], items);
  for (const s of seqs) {
    const world = await World.create(KITCHEN02, placed(s), { visuals: false });
    world.launch();
    while (world.stepCount < 15 * 120 && world.status === 'running') world.step();
    if (world.status === 'finished') console.log('FIN', s.join('>').padEnd(40), world.time.toFixed(2));
    world.dispose();
  }
}
