/**
 * THE FINALE'S BLOCKED RIMS (round 3 — the 2026-10-11 verdict's cheapest
 * point 1: "give one encore or the finale a blocked-rim moment (the k02
 * machinery already exists — point it at porch05's last gap)").
 *
 * porch05 declares two `blockedRims` (`Level.blockedRims`, the same named
 * box law as kitchen02's `blockedGoalSeat` guard, aimed at the thresholds):
 * the DOOR MOUTH's void column and the STOAM's mouth lip. What is claimed
 * here is measured over EVERY permutation of the four tray asks (24 clicks,
 * 12 distinct seatings) through the SHIPPED placement model (fixtures
 * mounted at par transforms, the ring's chain-head aim, the 2 mm-shrunk
 * blockerOf box):
 *
 *  1. LAW 1 — no NON-authored click order seats all four pieces. Every
 *     naive seating meets at least one honest rim refusal — usually the
 *     final ask at the stoam, always earlier for a flat bridge of either
 *     threshold (porch03's "the sink can never become a universal bridge"
 *     doctrine, now placement law) — and the partial line it leaves FALLS.
 *  2. LAW 2 — the only 3-star seating is the authored reference order
 *     (sink-first, `g l g d`). The catch-first order (`g d g l`) still
 *     seats 4/4 and finishes at TWO stars, exactly as the level file says;
 *     no other order earns a star at all.
 *  3. The MARGIN law (kitchen02's, verbatim): every authored seating clears
 *     every rim by ≥ 2 mm BEYOND the guard's own 2 mm shrink, and every
 *     refused dump seating overlaps by ≥ 2 mm. No refusal is a box
 *     artifact.
 *  4. The guard is placement-layer ONLY: the par replay hash rides
 *     BYTE-IDENTICAL at `1e367c94` with the rims declared (physics never
 *     sees a box; `replay:all` stays 30/30).
 *
 * `scripts/porch05-order-table.mjs` prints the full table this file
 * asserts; `tests/e2e/porch-finale.spec.ts` samples it with real clicks.
 */
import { describe, expect, test } from 'vitest';
import * as THREE from 'three';
import { fitSocket } from '../../src/track/snap.ts';
import { transformSocket } from '../../src/track/socket.ts';
import { PIECES, pieceGeometries } from '../../src/track/pieces.ts';
import { fixtureQuota } from '../../src/track/build.ts';
import { replayRun } from '../../src/replay/replay.ts';
import { blockedRimGuards, JOIN_TOL } from '../../src/ui/builder.ts';
import { PORCH05, porch05CatchFirstBuild } from '../../src/world/levels/porch05.level.ts';
import { PORCH04 } from '../../src/world/levels/porch04.level.ts';
import { KITCHEN02 } from '../../src/world/levels/kitchen02.level.ts';
import { PORCH_LIP, PORCH_SINK, THRESHOLD_GAP } from '../../src/world/levels/porch01.level.ts';
import type { PlacedPiece } from '../../src/track/build.ts';

const trayParams = {
  gapLip: PORCH_LIP,
  drop: THRESHOLD_GAP.drop,
  landing: PORCH_SINK,
} as const;
type TrayKind = keyof typeof trayParams;
const ASKS: TrayKind[] = ['gapLip', 'gapLip', 'drop', 'landing'];
const LETTER: Record<TrayKind, string> = { gapLip: 'g', drop: 'd', landing: 'l' };
/** The two authored click orders (tray asks in lay order). */
const AUTHORED = new Set(['glgd', 'gdgl']);

function perms<T>(a: readonly T[]): T[][] {
  if (a.length <= 1) return [[...a]];
  const out: T[][] = [];
  a.forEach((x, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).forEach((p) => out.push([x, ...p])));
  return out;
}
function socketsOf(p: PlacedPiece) {
  const [a, b] = PIECES[p.def].sockets(p.params);
  return [transformSocket(a, p.transform), transformSocket(b, p.transform)] as const;
}
function mountedFixtures(): PlacedPiece[] {
  const isFixture = fixtureQuota(PORCH05.fixtures!);
  return PORCH05.parBuild().pieces.filter((p) => isFixture(p.def)).map((p, i) => ({ ...p, seq: i }));
}
const rims = blockedRimGuards(PORCH05);

function targets(pieces: PlacedPiece[]) {
  const out: { socket: ReturnType<typeof transformSocket> }[] = [];
  for (const p of pieces) {
    const [, exit] = socketsOf(p);
    const taken = pieces.some(
      (q) => q.seq !== p.seq && socketsOf(q).some((s) => s.pos.distanceTo(exit.pos) < JOIN_TOL),
    );
    if (taken) continue;
    out.push({ socket: exit });
  }
  return out;
}
function chainTarget(pieces: PlacedPiece[]) {
  let current = pieces[0]!;
  let cursor = socketsOf(current)[1];
  for (let g = 0; g < pieces.length; g++) {
    const next = pieces.find(
      (p) => p.seq !== current.seq && socketsOf(p)[0].pos.distanceTo(cursor.pos) < JOIN_TOL,
    );
    if (!next) break;
    current = next;
    cursor = socketsOf(next)[1];
  }
  const list = targets(pieces);
  const at = list.findIndex((t) => t.socket.pos.distanceTo(cursor.pos) < JOIN_TOL);
  return list[Math.max(0, at)]!.socket;
}

/** The world AABB of a seat at the ring's aimed socket, shrunk by the
 *  builder's own 2 mm margin (blockerOf, exact). */
function seatBox(def: TrayKind, target: ReturnType<typeof chainTarget>, shrink = 0.002): { box: THREE.Box3; m: THREE.Matrix4 } {
  const params = { ...trayParams[def] };
  const m = fitSocket(target, PIECES[def].sockets(params)[0]);
  const box = new THREE.Box3();
  for (const geo of pieceGeometries(def, params)) {
    geo.computeBoundingBox();
    if (geo.boundingBox) box.union(geo.boundingBox.clone().applyMatrix4(m));
  }
  if (shrink > 0) box.expandByScalar(-shrink); // blockerOf's shrink, exact
  return { box, m };
}

/** The minimum axis-overlap depth of two intersecting boxes (0 when they
 *  only touch or miss); the MARGIN the refusal must clear. */
function overlapDepth(a: THREE.Box3, b: THREE.Box3): number {
  const axes = [
    [Math.min(a.max.x, b.max.x) - Math.max(a.min.x, b.min.x)],
    [Math.min(a.max.y, b.max.y) - Math.max(a.min.y, b.min.y)],
    [Math.min(a.max.z, b.max.z) - Math.max(a.min.z, b.min.z)],
  ].map(([d]) => d);
  if (axes.some((d) => d <= 0)) return 0;
  return Math.min(...axes);
}

async function playOrder(order: TrayKind[]) {
  let pieces = mountedFixtures();
  const refusals: { def: TrayKind; rim: string; depth: number }[] = [];
  const seated: TrayKind[] = [];
  for (const def of order) {
    const target = chainTarget(pieces);
    const { box, m } = seatBox(def, target);
    const hit = rims.find((r) => r.box.intersectsBox(box));
    if (hit) {
      refusals.push({ def, rim: hit.name, depth: overlapDepth(box, hit.box) });
      continue;
    }
    pieces = [...pieces, { def, params: { ...trayParams[def] }, transform: m, seq: pieces.length }];
    seated.push(def);
  }
  const run = await replayRun(PORCH05, { levelId: PORCH05.id, pieces, seed: PORCH05.seed });
  return {
    key: order.map((k) => LETTER[k]).join(''),
    seated,
    refusals,
    status: run.status,
    time: run.time,
  };
}

describe('porch05 — the declared rims (round 3: the finale gets a blocked-rim moment)', () => {
  test('the rims are two named boxes; every other level declares none and the law sleeps', () => {
    expect(rims.map((r) => r.name)).toEqual(['door mouth', 'stoam']);
    expect(blockedRimGuards(PORCH04)).toEqual([]);
    expect(blockedRimGuards(KITCHEN02)).toEqual([]);
  });

  test('the guard is placement-layer ONLY: the par replay hash rides byte-identical at 1e367c94', async () => {
    const a = await replayRun(PORCH05, PORCH05.parBuild());
    expect(a.status).toBe('finished');
    expect(a.hash).toBe('1e367c94'); // unchanged by the rims — no geometry, no collider, no physics read
    const b = await replayRun(PORCH05, porch05CatchFirstBuild());
    expect(b.status).toBe('finished'); // the authored data builds replay verified as ever
  }, 90_000);

  test('LAW 1 + 3 over ALL 24 orders: no non-authored order seats four, EVERY naive ask that would cross a threshold flat is refused with ≥ 2 mm of honest overlap, and the partial line FALLS', async () => {
    const orders = perms(ASKS);
    expect(orders).toHaveLength(24);
    for (const order of orders) {
      const r = await playOrder(order);
      const authored = AUTHORED.has(r.key);
      if (authored) {
        expect(r.seated.length, r.key).toBe(4); // both authored lines still seat everything
        expect(r.status, r.key).toBe('finished');
        expect(r.refusals.length, r.key).toBe(0);
        continue;
      }
      expect(r.seated.length, r.key).toBeLessThan(4);
      expect(r.refusals.length, `${r.key} meets no rim`).toBeGreaterThan(0);
      for (const f of r.refusals) {
        expect(f.depth, `${r.key}: the ${f.def} refused at the ${f.rim}`).toBeGreaterThanOrEqual(0.002);
      }
      expect(r.status, `${r.key} left seated finishes`).not.toBe('finished');
    }
  }, 300_000);

  test('LAW 2: the only 3-star seating is the authored sink-first order; catch-first pays two; every dump pays nothing', async () => {
    for (const order of perms(ASKS)) {
      const r = await playOrder(order);
      const finished = r.status === 'finished';
      const stars = finished ? 1 + (r.seated.length <= 4 ? 1 : 0) + (r.time <= PORCH05.par.time ? 1 : 0) : 0;
      if (stars === 3) expect(r.key).toBe('glgd');
      if (r.key === 'gdgl') expect(stars).toBe(2); // 1.392 > the 1.20 line — authored, slower, honest
      if (!AUTHORED.has(r.key)) expect(stars, r.key).toBe(0); // seated <= 3 and never finished
    }
  }, 300_000);

  test('the MARGIN law: every authored seating clears every rim by >= 2 mm BEYOND the guard shrink', () => {
    for (const line of [PORCH05.parBuild(), porch05CatchFirstBuild()]) {
      for (const p of line.pieces) {
        const raw = new THREE.Box3();
        for (const geo of pieceGeometries(p.def, p.params)) {
          geo.computeBoundingBox();
          if (geo.boundingBox) raw.union(geo.boundingBox.clone().applyMatrix4(p.transform));
        }
        for (const rim of rims) {
          // 4 mm of shrink = the guard's own 2 mm plus the 2 mm clearance
          // kitchen02 ratified for legal lines.
          const box = raw.clone().expandByScalar(-0.004);
          expect(box.intersectsBox(rim.box), `${p.def} at ${line === PORCH05.parBuild() ? 'par' : 'catch-first'} vs ${rim.name}`).toBe(false);
        }
      }
    }
  });
});
