/**
 * THE BLOCKED-RIM GUARD (P4 shortlist item 1 — the 2026-10-10 player
 * evaluation's item 3, the ONE unfixed line: "the level file never moved;
 * the union dump finishes every order; only a star-tax comments").
 *
 * kitchen02 now declares `blockedGoalSeat` — the cup's own body (mouth-
 * forward, off the mounted fixture transform) refuses any seat that
 * overlaps it. This file is the honest check the shortlist asked for, in
 * BOTH directions:
 *
 *  1. the guard is GEOMETRY-INVISIBLE: no piece, collider or physics read
 *     was added, so the par replay hash is byte-identical with the flag set
 *     (pinned at `0b4dbab2`, and `npm run replay:all` stands on all 30
 *     rungs), and every AUTHORED line stays placeable — the guard test
 *     clears all 3 seats of the par, the arc and the beater by a 2 mm
 *     mouth-plane margin (the deck ends AT the rim, never across it);
 *  2. the union is DEAD as a build: in all 12 whole-tray orders the 4th
 *     placement seats its box INTO or PAST the cup body — the placement the
 *     builder will refuse ("blocked — the cup is in the way") — and the
 *     trio the dump leaves seated CAN die (the pinned `straight → straight
 *     → gapLip` trio falls at ~1.1 s): the choice can now fail to choose.
 *
 * The physics side stays exactly the stage-4 law: every 4-piece build, if
 * it existed, would still finish (the seat refusal is WHY it cannot exist).
 */
import { describe, expect, test } from 'vitest';
import * as THREE from 'three';
import { fitSocket } from '../../src/track/snap.ts';
import { transformSocket } from '../../src/track/socket.ts';
import { PIECES, pieceGeometries, pieceLabel } from '../../src/track/pieces.ts';
import { replayRun } from '../../src/replay/replay.ts';
import { goalGuardFor } from '../../src/ui/builder.ts';
import { KITCHEN01 } from '../../src/world/levels/kitchen01.level.ts';
import { KITCHEN02 } from '../../src/world/levels/kitchen02.level.ts';
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

/** The builder's seat test, mirrored: the piece box at the next chain end,
 *  shrunk by blockerOf's 2 mm, vs the guard box (`blockerOf` in the
 *  builder, `pieceGeometries` in the kit — same two authorities). */
function seatBlocked(def: TrayKind, cursor: ReturnType<typeof transformSocket>, guard: THREE.Box3) {
  const params = trayParams[def];
  const [inS, outS] = PIECES[def].sockets(params);
  const m = fitSocket(cursor, inS);
  const box = new THREE.Box3();
  for (const geo of pieceGeometries(def, params)) {
    geo.computeBoundingBox();
    if (geo.boundingBox) box.union(geo.boundingBox.clone().applyMatrix4(m));
  }
  box.expandByScalar(-0.002); // blockerOf's shrink, exact
  return { blocked: box.intersectsBox(guard), next: transformSocket(outS, m), m };
}

function chain(kinds: readonly TrayKind[]): { pieces: PlacedPiece[] } {
  let cursor = transformSocket(PIECES.ramp.sockets(ramp.params)[1], ramp.transform);
  const pieces: PlacedPiece[] = [ramp];
  for (const def of kinds) {
    const params = { ...trayParams[def] };
    const m = fitSocket(cursor, PIECES[def].sockets(params)[0]);
    pieces.push({ def, params, transform: m, seq: pieces.length });
    cursor = transformSocket(PIECES[def].sockets(params)[1], m);
  }
  return { pieces };
}
const fullBuild = (kinds: readonly TrayKind[]) => ({
  levelId: KITCHEN02.id,
  pieces: [...chain(kinds).pieces, ...par.pieces.filter((p) => p.def === 'finishCup' || p.def === 'curve')],
  seed: KITCHEN02.seed,
});

const guard = goalGuardFor(KITCHEN02, par.pieces);

describe('the blocked-rim ask (kitchen02, P4 item 1)', () => {
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

  test('ALL TWELVE whole-tray orders are un-buildable: the 4th ask is refused in every one', () => {
    const orders = [...new Set(perms(union).map((p) => p.join(',')))].map((s) => s.split(',') as TrayKind[]);
    expect(orders).toHaveLength(12);
    for (const order of orders) {
      let cursor = transformSocket(PIECES.ramp.sockets(ramp.params)[1], ramp.transform);
      const marks = order.map((def) => {
        const r = seatBlocked(def, cursor, guard!.solids[0]!.box);
        cursor = r.next;
        return r.blocked;
      });
      // nothing is refused BEFORE the last ask (the first three pieces of
      // every order seat exactly as they did pre-guard)…
      expect(marks.slice(0, 3), order.join(',')).toEqual([false, false, false]);
      // …and the 4th is refused in every order — the reach-sum law made the
      // union's tail land in or past the cup body whatever the order.
      expect(marks[3], order.join(',')).toBe(true);
    }
  });

  test('every AUTHORED line stays placeable: par, arc and beater seat with a 2 mm mouth margin', () => {
    for (const line of [
      ['straight', 'drop', 'straight'],
      ['gapLip', 'drop', 'straight'],
      ['drop', 'straight', 'straight'],
    ] as TrayKind[][]) {
      let cursor = transformSocket(PIECES.ramp.sockets(ramp.params)[1], ramp.transform);
      for (const def of line) {
        const r = seatBlocked(def, cursor, guard!.solids[0]!.box);
        expect(r.blocked, `${line.join(',')} at ${def}`).toBe(false);
        cursor = r.next;
      }
    }
  });

  test('the guard is geometry-invisible to the solver: the par replay hash SURVIVES at 0b4dbab2', async () => {
    const a = await replayRun(KITCHEN02, KITCHEN02.parBuild());
    expect(a.status).toBe('finished');
    expect(a.hash).toBe('0b4dbab2'); // the honest check: unchanged by the flag
  });

  test('both ways still finish — and the dump\u2019s seated trio dies: the choice can fail', async () => {
    const lazy = await replayRun(KITCHEN02, fullBuild(['straight', 'drop', 'straight']));
    expect(lazy.status).toBe('finished');
    const arc = await replayRun(KITCHEN02, fullBuild(['gapLip', 'drop', 'straight']));
    expect(arc.status).toBe('finished');
    // the union dump in TRAY-BUTTON order seats `straight → straight → gapLip`
    // before the refusal — the pinned dead trio: the line that CAN die.
    const trio = await replayRun(KITCHEN02, fullBuild(['straight', 'straight', 'gapLip']));
    expect(trio.status).toBe('fell');
  });

  test('the physics law is untouched: a 4-piece build, if it existed, would still finish', async () => {
    for (const order of perms(['straight', 'gapLip', 'drop'] as TrayKind[]).slice(0, 3)) {
      const r = await replayRun(KITCHEN02, fullBuild([...order, 'straight' as TrayKind]));
      expect(r.status, order.join(',')).toBe('finished');
    }
  });
});
