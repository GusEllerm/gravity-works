/**
 * THE BLOCKED-RIM GUARD + THE ORDER TABLE (P4 item 1, repaired by the
 * round-2 Lane A pass — the 2026-10-11 player evaluation's headlines 1 and
 * 2: the guard was REAL at the chain cursor this file originally walked and
 * FALSE at the ring the shipped Place button aims; the ring seated a
 * dump's 4th ask PAST the cup's body, and a seated off-list trio paid 3
 * stars under the 1.05 par).
 *
 * What is claimed here is now the two ORDER-INDEPENDENT laws of
 * `kitchen02.level.ts`, measured over EVERY permutation of the four tray
 * asks (24 clicks, 12 distinct seatings):
 *
 *  1. LAW 1 — no click order seats all four pieces. A 4th ask dies one of
 *     two ways, both placement-layer: its seat at the chain head overlaps
 *     the cup BODY (the P4 guard), or the ring's auto-follow lands it on a
 *     goal-tell seat (the cup's own exit / any open end past the mouth,
 *     including the run-out end the evaluation's order 2 aimed at) — and
 *     on a guarded rung a goal-tell seat is now REFUSED (`src/ui/builder.ts`
 *     place()/updateGhost()), honestly, with the run-ends truth.
 *  2. LAW 2 — no permutation earns 3 stars without seating the authored
 *     line. The star bar is the re-anchored par (`drop → straight →
 *     straight`, hash `8008b9aa`, parTime 1.00 = the measured 1.00);
 *     sweeping every seating through the shipped star law, the only
 *     3-star builds are the reference seating itself. The lazy line's
 *     other seatings pay 2 (1.008–1.025), every arc multiset seating pays
 *     2 (1.025–1.083), and a mis-seated no-line trio FALLS.
 *
 * The permutation model mirrors the SHIPPED placement path: fixtures mount
 * at their par transforms (the `initialBuild` rule), each ask seats at the
 * ring's default target (the join-chain head walked through fixtures —
 * `chainHeadIndex`), a refusal keeps the ring still, and the resulting
 * build replays on the shipped mount and scores with the shipped star law.
 * The e2e (`tests/e2e/goal-rung.spec.ts`) asserts a sampled set of the same
 * table through real clicks; the full sweep is THIS file's job.
 */
import { describe, expect, test } from 'vitest';
import * as THREE from 'three';
import { fitSocket } from '../../src/track/snap.ts';
import { transformSocket } from '../../src/track/socket.ts';
import { PIECES, pieceGeometries, pieceLabel } from '../../src/track/pieces.ts';
import { fixtureQuota } from '../../src/track/build.ts';
import { replayRun } from '../../src/replay/replay.ts';
import { goalGuardFor, JOIN_TOL } from '../../src/ui/builder.ts';
import { KITCHEN01 } from '../../src/world/levels/kitchen01.level.ts';
import { KITCHEN02 } from '../../src/world/levels/kitchen02.level.ts';
import { PARS, starsFor } from '../../src/world/stars.ts';
import type { Level } from '../../src/world/level.ts';
import type { PlacedPiece } from '../../src/track/build.ts';

const par = KITCHEN02.parBuild();
const ramp = par.pieces.find((p) => p.def === 'ramp')!;
const trayParams = {
  straight: { length: 0.11 },
  gapLip: { length: 0.0405, angle: 12, blend: 0.05 },
  drop: par.pieces.find((p) => p.def === 'drop')!.params,
} as const;
type TrayKind = keyof typeof trayParams;
const union: TrayKind[] = ['straight', 'straight', 'gapLip', 'drop'];

function perms<T>(a: readonly T[]): T[][] {
  if (a.length <= 1) return [[...a]];
  const out: T[][] = [];
  a.forEach((x, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).forEach((p) => out.push([x, ...p])));
  return out;
}

/** The mounted fixtures (the `initialBuild` rule): ramp, cup, curve at their
 *  par transforms, seq by mount order — exactly what the builder holds. */
function mountedFixtures(): PlacedPiece[] {
  const isFixture = fixtureQuota(KITCHEN02.fixtures!);
  return par.pieces.filter((p) => isFixture(p.def)).map((p, i) => ({ ...p, seq: i }));
}

function socketsOf(p: PlacedPiece): [ReturnType<typeof transformSocket>, ReturnType<typeof transformSocket>] {
  const [a, b] = PIECES[p.def].sockets(p.params);
  return [transformSocket(a, p.transform), transformSocket(b, p.transform)];
}

/** The builder's `targets()` mirror: open exits, with the goal flag the
 *  builder puts on a guarded rung (the finish's own exit, or any open end
 *  PAST the mouth plane — the same mouth-dot test `targets()` runs). */
function targets(pieces: PlacedPiece[], mouth: THREE.Vector3, mouthTangent: THREE.Vector3) {
  const out: { socket: ReturnType<typeof transformSocket>; goal: boolean }[] = [];
  for (const p of pieces) {
    const [, exit] = socketsOf(p);
    const taken = pieces.some(
      (q) => q.seq !== p.seq && socketsOf(q).some((s) => s.pos.distanceTo(exit.pos) < JOIN_TOL),
    );
    if (taken) continue;
    out.push({
      socket: exit,
      goal:
        p.def === 'finishCup' ||
        exit.pos.clone().sub(mouth).dot(mouthTangent) > JOIN_TOL,
    });
  }
  return out;
}

/** The builder's `chainHeadIndex()` mirror: walk the join chain from
 *  `pieces[0]` (the mounted ramp), fixtures included — this is the seat the
 *  ring auto-aims, which is exactly where the evaluation's order 2 seated a
 *  lip PAST the body guard and this pass makes it a refusal. */
function chainTarget(pieces: PlacedPiece[], mouth: THREE.Vector3, mouthTangent: THREE.Vector3) {
  let current = pieces[0]!;
  let cursor = socketsOf(current)[1];
  for (let guard = 0; guard < pieces.length; guard++) {
    const next = pieces.find(
      (p) => p.seq !== current.seq && socketsOf(p)[0].pos.distanceTo(cursor.pos) < JOIN_TOL,
    );
    if (!next) break;
    current = next;
    cursor = socketsOf(next)[1];
  }
  const list = targets(pieces, mouth, mouthTangent);
  const at = list.findIndex((t) => t.socket.pos.distanceTo(cursor.pos) < JOIN_TOL);
  return list[Math.max(0, at)]!;
}

/** One shipped-aim ask: seat at the ring target unless the body refuses or
 *  (guarded rung) the goal tell refuses. */
function ask(
  pieces: PlacedPiece[],
  def: TrayKind,
  body: THREE.Box3,
  mouth: THREE.Vector3,
  mouthTangent: THREE.Vector3,
): { pieces: PlacedPiece[]; refused: 'cup' | 'goal' | null } {
  const t = chainTarget(pieces, mouth, mouthTangent);
  const params = { ...trayParams[def] };
  const m = fitSocket(t.socket, PIECES[def].sockets(params)[0]);
  if (t.goal) return { pieces, refused: 'goal' };
  const box = new THREE.Box3();
  for (const geo of pieceGeometries(def, params)) {
    geo.computeBoundingBox();
    if (geo.boundingBox) box.union(geo.boundingBox.clone().applyMatrix4(m));
  }
  box.expandByScalar(-0.002); // blockerOf's shrink, exact
  if (!box.isEmpty() && box.intersectsBox(body)) return { pieces, refused: 'cup' };
  return { pieces: [...pieces, { def, params, transform: m, seq: pieces.length }], refused: null };
}

/** Play one whole-tray click order through the shipped-aim model and score
 *  the seated build with the shipped star law. */
async function playOrder(order: TrayKind[]) {
  const guard = goalGuardFor(KITCHEN02, mountedFixtures())!;
  const body = guard.solids[0]!.box;
  let pieces = mountedFixtures();
  const refused: ('cup' | 'goal')[] = [];
  const seated: TrayKind[] = [];
  for (const def of order) {
    const r = ask(pieces, def, body, guard.mouth.pos, guard.mouth.tangent);
    pieces = r.pieces;
    if (r.refused !== null) refused.push(r.refused);
    else seated.push(def);
  }
  const run = await replayRun(KITCHEN02, { levelId: KITCHEN02.id, pieces, seed: KITCHEN02.seed });
  return {
    seated,
    seatedKey: seated.map((k) => (k === 'straight' ? 's' : k === 'gapLip' ? 'g' : 'd')).join(''),
    refused,
    status: run.status,
    time: run.time,
    stars: starsFor(
      { status: run.status === 'finished' || run.status === 'fell' || run.status === 'stalled' || run.status === 'timeout' ? run.status : 'timeout', time: run.time, piecesUsed: seated.length, hazardsTouched: 0 },
      PARS[KITCHEN02.id]!,
    ),
  };
}

const guard = goalGuardFor(KITCHEN02, par.pieces);

describe('the blocked-rim ask (kitchen02, P4 item 1 + round-2 Lane A)', () => {
  test('the guard speaks the goal piece: one named solid, the cup, no new geometry', () => {
    expect(guard).not.toBeNull();
    expect(guard!.solids).toHaveLength(1);
    expect(guard!.word).toBe(pieceLabel('finishCup').toLowerCase());
    // the box is the GOAL PIECE's own body carried by its mounted
    // transform — not a new prop: its x-min is the mouth plane (the cup's
    // in-socket at the last legal deck's exit).
    const goal = par.pieces.find((p) => PIECES[p.def].captureVolume !== undefined)!;
    const [gin] = PIECES[goal.def].sockets(goal.params);
    const mouthX = new THREE.Vector3().setFromMatrixPosition(goal.transform).addScaledVector(
      new THREE.Vector3().copy(gin.tangent).normalize().transformDirection(goal.transform),
      gin.pos.length(),
    ).x;
    expect(Math.abs(guard!.solids[0]!.box.min.x - mouthX)).toBeLessThan(1e-9);
  });

  test('unguarded levels declare nothing: the guard is empty and the law sleeps', () => {
    expect(goalGuardFor(KITCHEN01, KITCHEN01.parBuild().pieces)).toBeNull();
    expect(goalGuardFor({ blockedGoalSeat: true } as Level, [])).toBeNull(); // no goal piece
  });

  test('ALL TWENTY-FOUR whole-tray click orders are un-buildable: the ask that would make four is refused in every one — at the body OR at the mouth', async () => {
    // the P4 claim ("all twelve", chain-cursor only) died at the player
    // evaluation's order 2; this sweep is the ring-aimed enumeration it
    // never ran (24 orders including the straight-button permutations).
    const orders = perms(union);
    expect(orders).toHaveLength(24);
    for (const order of orders) {
      const r = await playOrder(order);
      expect(r.seated.length, order.join(',')).toBeLessThan(4); // LAW 1
      expect(r.refused.length, order.join(',')).toBe(1); // exactly one ask dies
    }
  }, 180_000);

  test('LAW 2 over the full sweep: no permutation earns 3 stars without seating the authored line — the only 3-star seatings are the reference build (drop first, two straights)', async () => {
    const seen = new Map<string, string>();
    for (const order of perms(union)) {
      const r = await playOrder(order);
      const key = order.map((k) => (k === 'straight' ? 's' : k === 'gapLip' ? 'g' : 'd')).join('');
      seen.set(key, `${r.seatedKey ?? '—'}:${r.status === 'finished' ? r.stars : 'x'}`);
      if (r.stars < 3) continue;
      // a 3-star permutation seated the lazy line with the drop FIRST —
      // multiset {straight, straight, drop} AND the seated chain starts at
      // the drop, i.e. it IS the reference build's seating.
      const lazy = [...r.seated].sort().join(',') === 'drop,straight,straight';
      const dropFirst = r.seatedKey.startsWith('d');
      expect(lazy && dropFirst, `${key} earns 3 stars off the reference seating (${r.seatedKey} @ ${r.time.toFixed(3)})`).toBe(true);
    }
    // the headline cells of the table, pinned by outcome (see the session
    // note for the full 12-row table): the evaluation's two money orders.
    expect(seen.get('dgss')).toBe('dgs:2'); // the off-list trio: FINISHES for 2 (1.025) — the 1.02-three-stars payment is dead
    expect(seen.get('gssd')).toBe('gss:x'); // the arc seated backwards FALLS (~1.12)
    expect(seen.get('ssgd')).toBe('ssg:x'); // three flats + lip FALLS (~1.15)
    expect(seen.get('sgsd')).toBe('sgs:x'); // flat-lip-flat FALLS (~1.17)
    expect(seen.get('ssdg')).toBe('ssd:2'); // straight,straight,drop,lip — the trio finishes for 2, never 3
    expect(seen.get('sdsg')).toBe('sds:2'); // the lazy line seated late: same pieces, +0.01, two stars
    expect(seen.get('dssg')).toBe('dss:3'); // the reference seating, star-earned
    expect(seen.get('gdss')).toBe('gds:2'); // the arc line: finishes, pays 2 in every seating
  }, 180_000);

  test('every AUTHORED line stays placeable: par (drop-first), arc and the lazy seatings seat with a 2 mm mouth margin', () => {
    for (const line of [
      ['drop', 'straight', 'straight'],
      ['straight', 'drop', 'straight'],
      ['straight', 'straight', 'drop'],
      ['gapLip', 'drop', 'straight'],
    ] as TrayKind[][]) {
      let cursor = transformSocket(PIECES.ramp.sockets(ramp.params)[1], ramp.transform);
      for (const def of line) {
        const params = { ...trayParams[def] };
        const m = fitSocket(cursor, PIECES[def].sockets(params)[0]);
        const box = new THREE.Box3();
        for (const geo of pieceGeometries(def, params)) {
          geo.computeBoundingBox();
          if (geo.boundingBox) box.union(geo.boundingBox.clone().applyMatrix4(m));
        }
        box.expandByScalar(-0.002);
        expect(box.intersectsBox(guard!.solids[0]!.box), `${line.join(',')} at ${def}`).toBe(false);
        cursor = transformSocket(PIECES[def].sockets(params)[1], m);
      }
    }
  });

  test('the re-anchored par line replays verified at 8008b9aa under the moved star law', async () => {
    const a = await replayRun(KITCHEN02, KITCHEN02.parBuild());
    expect(a.status).toBe('finished');
    expect(a.hash).toBe('8008b9aa'); // 0b4dbab2 -> this: Decision Log 2026-10-11
    expect(a.time).toBeLessThanOrEqual(PARS[KITCHEN02.id]!.time); // 1.00, bit-stable
  });

  test('both ways finish and the mis-seated no-line trio dies: the choice can fail', async () => {
    const lazy = await replayRun(KITCHEN02, fullBuild(['drop', 'straight', 'straight']));
    expect(lazy.status).toBe('finished'); // the reference seating, exactly 1.00
    const arc = await replayRun(KITCHEN02, fullBuild(['gapLip', 'drop', 'straight']));
    expect(arc.status).toBe('finished'); // 1.06, over the star line
    // the union dump in TRAY-BUTTON order seats `straight → straight → gapLip`
    // before the refusal — the pinned dead trio falls at ~1.14 s.
    const trio = await replayRun(KITCHEN02, fullBuild(['straight', 'straight', 'gapLip']));
    expect(trio.status).toBe('fell');
    // the evaluation's off-list trio: seats 3 of 4 (the 4th ask is refused)
    // and pays the CLOCK — it finished 1.02 for three stars at the old par;
    // under the re-anchored law it finishes 1.025 for two (a line multiset,
    // a two-star pace) and can never reach the 1.00 star line.
    const off = await replayRun(KITCHEN02, fullBuild(['drop', 'gapLip', 'straight']));
    expect(off.status).toBe('finished');
    expect(off.time).toBeGreaterThan(PARS[KITCHEN02.id]!.time); // 1.025 > 1.00
    // the arc seated BACKWARDS is not a line at all — it falls (~1.12).
    const notALine = await replayRun(KITCHEN02, fullBuild(['gapLip', 'straight', 'straight']));
    expect(notALine.status).not.toBe('finished');
  });

  test('the physics law is untouched: a 4-piece build, if it could be seated (it cannot), would still finish', async () => {
    for (const order of perms(['straight', 'gapLip', 'drop'] as TrayKind[]).slice(0, 3)) {
      const r = await replayRun(KITCHEN02, fullBuild([...order, 'straight' as TrayKind]));
      expect(r.status, order.join(',')).toBe('finished');
    }
  });
});

/** The chain-cursor model (the original P4 sim): seat at the chain head of
 *  a growing chain, fixtures anchored at their par transforms. */
function chain(kinds: readonly TrayKind[]): PlacedPiece[] {
  let cursor = transformSocket(PIECES.ramp.sockets(ramp.params)[1], ramp.transform);
  const pieces: PlacedPiece[] = [ramp];
  for (const def of kinds) {
    const params = { ...trayParams[def] };
    const m = fitSocket(cursor, PIECES[def].sockets(params)[0]);
    pieces.push({ def, params, transform: m, seq: pieces.length });
    cursor = transformSocket(PIECES[def].sockets(params)[1], m);
  }
  return pieces;
}
const fullBuild = (kinds: readonly TrayKind[]) => ({
  levelId: KITCHEN02.id,
  pieces: [
    ...chain(kinds),
    ...par.pieces.filter((p) => p.def === 'finishCup' || p.def === 'curve'),
  ].map((p, i) => ({ ...p, seq: i })),
  seed: KITCHEN02.seed,
});
