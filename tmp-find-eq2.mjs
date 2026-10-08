import * as THREE from 'three';
import { getLevel } from '/Users/gusellerm/Projects/games/gw-feel16/src/world/levels/feeltrack.level.ts';
import { CAMPAIGN_LADDER } from '/Users/gusellerm/Projects/games/gw-feel16/src/world/campaign.ts';
import { rigFingerprint, fixtureQuota } from '/Users/gusellerm/Projects/games/gw-feel16/src/track/build.ts';
import { PIECES } from '/Users/gusellerm/Projects/games/gw-feel16/src/track/pieces.ts';
import { fitSocket, transformSocket } from '/Users/gusellerm/Projects/games/gw-feel16/src/track/snap.ts';
import { transformSocket as ts } from '/Users/gusellerm/Projects/games/gw-feel16/src/track/socket.ts';
const JOIN_TOL = 0.004;
function socketsOf(p) { const [a, b] = PIECES[p.def].sockets(p.params); return [ts(a, p.transform), ts(b, p.transform)]; }
void transformSocket;
function openTargets(pieces, level) {
  const all = pieces.map((p) => ({ p, ss: socketsOf(p) }));
  const out = [];
  const startTaken = all.some(({ ss }) => ss.some((s) => s.pos.distanceTo(level.startSocket.pos) < JOIN_TOL));
  if (!startTaken) out.push({ socket: level.startSocket, label: 'start' });
  for (const { p, ss } of all) {
    const exit = ss[1];
    const taken = all.some((o) => o.p.seq !== p.seq && o.ss.some((s) => s.pos.distanceTo(exit.pos) < JOIN_TOL));
    if (!taken) out.push({ socket: exit, label: p.def });
  }
  return out;
}
function placement(target, held, params, flipped) {
  const [heldIn] = PIECES[held].sockets(params);
  const seat = fitSocket(target, heldIn);
  if (!flipped) return seat;
  const axis = target.up.clone().normalize();
  const flip = new THREE.Matrix4().makeTranslation(target.pos.x, target.pos.y, target.pos.z)
    .multiply(new THREE.Matrix4().makeRotationAxis(axis, Math.PI))
    .multiply(new THREE.Matrix4().makeTranslation(-target.pos.x, -target.pos.y, -target.pos.z));
  return flip.multiply(seat);
}
function trayParams(par) { const out = {}; for (const p of par.pieces) if (out[p.def] === undefined) out[p.def] = p.params; return out; }
const KINDS = Object.keys(PIECES);
let found = 0;
for (const id of CAMPAIGN_LADDER) {
  const level = getLevel(id);
  if (typeof level.parBuild !== 'function' || !level.fixtures) continue;
  const par = level.parBuild();
  const tp = trayParams(par);
  // (a) fixture-only builds, (b) full par-minus-one-tray-piece builds
  for (const mode of ['fixtures', 'par-1']) {
    let pieces;
    if (mode === 'fixtures') {
      const isFixture = fixtureQuota(level.fixtures);
      pieces = par.pieces.filter((p) => isFixture(p.def)).map((p, i) => ({ ...p, seq: i }));
    } else {
      pieces = par.pieces.map((p, i) => ({ ...p, seq: i }));
    }
    const targets = openTargets(pieces, level);
    if (mode === 'par-1' && targets.length < 2) continue;
    for (const kind of KINDS) {
      if (kind === 'finishCup') continue;
      const params = tp[kind] ?? PIECES[kind].params;
      for (const flipped of [false, true]) {
        const fps = targets.map((t) => rigFingerprint({ levelId: level.id, seed: level.seed, pieces: [...pieces, { def: kind, params, transform: placement(t.socket, kind, params, flipped), seq: pieces.length }] }));
        for (let i = 0; i < fps.length; i++)
          for (let j = i + 1; j < fps.length; j++)
            if (fps[i] === fps[j] && found++ < 40)
              console.log(`EQUIV ${id} mode=${mode} kind=${kind} flipped=${flipped} s${i}(${targets[i].label}) s${j}(${targets[j].label}) fp=${fps[i]}`);
      }
    }
  }
}
console.log('done found=', found);
