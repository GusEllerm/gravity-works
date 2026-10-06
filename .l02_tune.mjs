// L02 redesign tuner: par = lazy S,D,S (cup anchored there), arc = GL,D,S (one swap),
// tray {straight x2, gapLip, drop} = the union of the two lines (4 = budget).
// Tune L02's gapLip geometry (its x-span must equal one straight so BOTH lines
// end at the anchored cup; its flight must cost the arc >=0.08 s).
const W = '/Users/gusellerm/Projects/games/gw-ld6/src';
const { KITCHEN02 } = await import(`${W}/world/levels/kitchen02.level.ts`);
const { KITCHEN_GAP, kitchenRamp, lay } = await import(`${W}/world/levels/kitchen01.level.ts`);
const { PIECES } = await import(`${W}/track/pieces.ts`);
const { fitSocket } = await import(`${W}/track/snap.ts`);
const { transformSocket } = await import(`${W}/track/socket.ts`);
const { World } = await import(`${W}/world/world.ts`);

const S = 0.18;
const DROP = KITCHEN_GAP.drop;

function parBuild(lip) {
  return lay(
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
}

function placed(kinds, lip) {
  const par = parBuild(lip);
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
  const world = await World.create({ ...KITCHEN02, startSocket: KITCHEN02.startSocket }, build, { visuals: false });
  world.launch();
  while (world.stepCount < 15 * 120 && world.status === 'running') world.step();
  const pose = world.carPose(1);
  const res = { status: world.status, time: +world.time.toFixed(2), x: +pose.pos.x.toFixed(2), y: +pose.pos.y.toFixed(2) };
  world.dispose();
  return res;
}

const lipX = (lip) => {
  const [a, b] = PIECES.gapLip.sockets(lip);
  return +(b.pos.x - a.pos.x).toFixed(3);
};

const lipVariants = [
  { length: 0.02, angle: 10, blend: 0.05 }, // today's L01 lip
  { length: 0.06, angle: 10, blend: 0.05 },
  { length: 0.09, angle: 10, blend: 0.05 },
  { length: 0.11, angle: 10, blend: 0.05 },
  { length: 0.13, angle: 10, blend: 0.05 },
  { length: 0.11, angle: 14, blend: 0.05 },
  { length: 0.14, angle: 14, blend: 0.05 },
];

// cup anchor x: capture x observed from a finishing run
console.log('cup x ~', JSON.stringify(await run(placed(['straight', 'drop', 'straight'], lipVariants[0]))));

for (const lip of lipVariants) {
  console.log(`\n### lip ${JSON.stringify(lip)}  GLx=${lipX(lip)}`);
  const named = [
    ['lazy S,D,S (par)', ['straight', 'drop', 'straight']],
    ['D,S,S (order var)', ['drop', 'straight', 'straight']],
    ['S,D,GL,S (all 4 tray-order)', ['straight', 'drop', 'straight', 'gapLip']],
    ['S,S,GL,D (all 4 K-order)', ['straight', 'straight', 'gapLip', 'drop']],
    ['S,S (obvious straight)', ['straight', 'straight']],
    ['arc GL,D,S', ['gapLip', 'drop', 'straight']],
    ['arc D,GL,S', ['drop', 'gapLip', 'straight']],
    ['arc GL,S,D?? skip', ['gapLip', 'straight', 'drop']],
    ['partial GL,D', ['gapLip', 'drop']],
    ['partial S,D', ['straight', 'drop']],
    ['partial GL only', ['gapLip']],
  ];
  for (const [label, kinds] of named) {
    console.log(label.padEnd(28), JSON.stringify(await run(placed(kinds, lip))));
  }
}
