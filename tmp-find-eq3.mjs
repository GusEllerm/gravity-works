import * as THREE from 'three';
import { getLevel } from './src/world/levels/feeltrack.level.ts';
import { CAMPAIGN_LADDER } from './src/world/campaign.ts';
import { rigFingerprint } from './src/track/build.ts';
import { PIECES } from './src/track/pieces.ts';
import { fitSocket } from './src/track/snap.ts';
import { transformSocket } from './src/track/socket.ts';
const JOIN_TOL = 0.004;
function socketsOf(p) { const [a, b] = PIECES[p.def].sockets(p.params); return [transformSocket(a, p.transform), transformSocket(b, p.transform)]; }
function openTargets(pieces, level) {
  const all = pieces.map((p) => ({ p, ss: socketsOf(p) }));
  const out = [];
  const startTaken = all.some(({ ss }) => ss.some((s) => s.pos.distanceTo(level.startSocket.pos) < JOIN_TOL));
  if (!startTaken) out.push({ socket: level.startSocket, label: 'start' });
  for (const { p, ss } of all) {
    const exit = ss[1];
    const taken = all.some((o) => o.p.seq !== p.seq && o.ss.some((s) => s.pos.distanceTo(exit.pos) < JOIN_TOL));
    if (!taken) out.push({ socket: exit, label: p.def + p.seq });
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
const KINDS = Object.keys(PIECES);
let found = 0;
for (const id of CAMPAIGN_LADDER) {
  const level = getLevel(id);
  if (typeof level.parBuild !== 'function') continue;
  const par = level.parBuild().pieces.map((p, i) => ({ ...p, seq: i }));
  for (let cut = 1; cut <= par.length; cut++) {
    const pieces = par.slice(0, cut);
    const targets = openTargets(pieces, level);
    if (targets.length < 2) continue;
    for (const kind of KINDS) {
      if (kind === 'finishCup') continue;
      const params = PIECES[kind].params;
      for (const flipped of [false, true]) {
        const fps = targets.map((t) => rigFingerprint({ levelId: level.id, seed: level.seed, pieces: [...pieces, { def: kind, params, transform: placement(t.socket, kind, params, flipped), seq: pieces.length }] }));
        for (let i = 0; i < fps.length; i++)
          for (let j = i + 1; j < fps.length; j++)
            if (fps[i] === fps[j] && found++ < 40)
              console.log(`EQUIV ${id} cut=${cut} kind=${kind} flipped=${flipped} s${i}(${targets[i].label}) s${j}(${targets[j].label})`);
      }
    }
  }
}
console.log('done found=', found);
