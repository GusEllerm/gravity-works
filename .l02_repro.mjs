// L02 discoverability repro: replay chains the way the SHIPPED builder mounts
// them (fixtures anchored at par transforms, tray pieces chained off the ramp
// exit at the tray's ONE geometry per kind), classify deaths.
const W = '/Users/gusellerm/Projects/games/gw-ld6/src';
const { KITCHEN02, kitchen02ArcBuild } = await import(`${W}/world/levels/kitchen02.level.ts`);
const { KITCHEN_GAP, kitchenRamp, KITCHEN_GEOM } = await import(`${W}/world/levels/kitchen01.level.ts`);
const { PIECES } = await import(`${W}/track/pieces.ts`);
const { fitSocket } = await import(`${W}/track/snap.ts`);
const { transformSocket } = await import(`${W}/track/socket.ts`);
const { World } = await import(`${W}/world/world.ts`);
const THREE = await import('three');

const TRAY_PARAMS = {
  straight: { length: 0.18 },
  drop: KITCHEN_GAP.drop,
  gapLip: KITCHEN_GAP.lip,
  landing: KITCHEN_GAP.ling ?? KITCHEN_GAP.landing,
};

function placed(kinds, { chainFrom = 'ramp' } = {}) {
  const par = KITCHEN02.parBuild();
  const fixtures = new Set(['ramp', 'finishCup', 'curve']);
  const pieces = par.pieces.filter((p) => fixtures.has(p.def)).map((p, i) => ({ ...p, seq: i }));
  const ramp = pieces.find((p) => p.def === 'ramp');
  let cursor = transformSocket(PIECES.ramp.sockets(ramp.params)[1], ramp.transform);
  for (const def of kinds) {
    const p = { ...TRAY_PARAMS[def] };
    const t = fitSocket(cursor, PIECES[def].sockets(p)[0]);
    pieces.push({ def, params: p, transform: t, seq: pieces.length });
    cursor = transformSocket(PIECES[def].sockets(p)[1], t);
  }
  return { levelId: KITCHEN02.id, pieces, seed: KITCHEN02.seed };
}

async function run(build) {
  const world = await World.create(KITCHEN02, build, { visuals: false });
  world.launch();
  while (world.stepCount < 15 * 120 && world.status === 'running') world.step();
  const pose = world.carPose(1);
  const q = pose.quat;
  // pitch of local +x axis (result.ts convention): apply quat to (1,0,0)
  const v = new THREE.Vector3(1, 0, 0).applyQuaternion(new THREE.Quaternion(q.x, q.y, q.z, q.w));
  const pitch = Math.atan2(v.y, Math.hypot(v.x, v.z));
  const res = { status: world.status, time: +world.time.toFixed(2), x: +pose.pos.x.toFixed(2), y: +pose.pos.y.toFixed(2), pitch: Math.round(pitch * 57.3) };
  world.dispose();
  return res;
}

// named reproductions of H's and K's reported builds
const named = [
  ['E/par lazy line S D S', ['straight', 'drop', 'straight']],
  ['ARC order GL D LA S (arc)', ['gapLip', 'drop', 'landing', 'straight']],
  ['H: straight>gapLip (curve not in tray)', ['straight', 'gapLip']],
  ['H: gapLip>drop>landing (L01 habit)', ['gapLip', 'drop', 'landing']],
  ['H: gapLip>drop', ['gapLip', 'drop']],
  ['H: drop>landing', ['drop', 'landing']],
  ['H: straight>gapLip>drop>landing', ['straight', 'gapLip', 'drop', 'landing']],
  ['H: straight>gapLip>drop>landing>S (all 5 tray-order)', ['straight', 'gapLip', 'drop', 'landing', 'straight']],
  ['K: tray-order all 5 S S GL D LA', ['straight', 'straight', 'gapLip', 'drop', 'landing']],
  ['K: GL D LA S S', ['gapLip', 'drop', 'landing', 'straight', 'straight']],
  ['H: straight>drop>landing', ['straight', 'drop', 'landing']],
  ['H: drop>straight', ['drop', 'straight']],
  ['H: gapLip>landing', ['gapLip', 'landing']],
  ['H: straight>S (deck only)', ['straight', 'straight']],
  ['H: D only', ['drop']],
];
console.log('=== named reproductions (builder mount: fixtures anchored, chain off ramp exit) ===');
for (const [label, kinds] of named) {
  const r = await run(placed(kinds));
  console.log(label.padEnd(46), JSON.stringify(r));
}

// arcBuild as authored (cup at ITS OWN end) — what the current test asserts
const { replayRun } = await import(`${W}/replay/replay.ts`);
const arc = await replayRun(KITCHEN02, kitchen02ArcBuild());
console.log('arcBuild as authored (cup rides its own end):'.padEnd(46), JSON.stringify({ status: arc.status, time: +arc.time.toFixed(2) }));

// full multiset-subset sweep, deduped
const items = ['straight', 'straight', 'gapLip', 'drop', 'landing'];
const seen = new Set();
const seqs = [];
function walk(cur, pool) {
  if (cur.length) {
    const k = cur.join('>');
    if (!seen.has(k)) { seen.add(k); seqs.push([...cur]); }
  }
  for (let i = 0; i < pool.length; i++) walk([...cur, pool[i]], [...pool.slice(0, i), ...pool.slice(i + 1)]);
}
walk([], items);
console.log(`\n=== full sweep: ${seqs.length} distinct chains ===`);
for (const s of seqs) {
  const r = await run(placed(s));
  if (r.status !== 'finished') continue;
  console.log('FINISH', s.join('>').padEnd(42), JSON.stringify(r));
}
console.log('--- fell/stalled with times in the H/K windows (2.2-3.3 s) ---');
for (const s of seqs) {
  const r = await run(placed(s));
  if (r.status === 'finished') continue;
  if (r.time >= 2.0 && r.time <= 3.4) console.log(r.status.toUpperCase().padEnd(8), s.join('>').padEnd(42), JSON.stringify(r));
}
