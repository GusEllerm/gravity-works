const W = '/Users/gusellerm/Projects/games/gw-ld6/src';
const { KITCHEN02 } = await import(`${W}/world/levels/kitchen02.level.ts`);
const { PIECES } = await import(`${W}/track/pieces.ts`);
const { fitSocket } = await import(`${W}/track/snap.ts`);
const { transformSocket } = await import(`${W}/track/socket.ts`);
const { serialize } = await import(`${W}/track/build.ts`);
function placed(kinds) {
  const par = KITCHEN02.parBuild();
  const fixtures = new Set(['ramp', 'finishCup', 'curve']);
  const pieces = par.pieces.filter((p) => fixtures.has(p.def)).map((p, i) => ({ ...p, seq: i }));
  const ramp = pieces.find((p) => p.def === 'ramp');
  let cursor = transformSocket(PIECES.ramp.sockets(ramp.params)[1], ramp.transform);
  const tp = { ...(KITCHEN02.trayParams ?? {}) };
  for (const p of par.pieces) if (KITCHEN02.tray[p.def] && tp[p.def] === undefined) tp[p.def] = p.params;
  for (const def of kinds) {
    const p = { ...tp[def] };
    const t = fitSocket(cursor, PIECES[def].sockets(p)[0]);
    pieces.push({ def, params: p, transform: t, seq: pieces.length });
    cursor = transformSocket(PIECES[def].sockets(p)[1], t);
  }
  return { levelId: KITCHEN02.id, pieces, seed: KITCHEN02.seed };
}
console.log(serialize(placed(['straight', 'drop'])));
