/**
 * The kitchen set's data contract (stage 3, Environment Artist):
 * - generator purity — two builds produce byte-identical geometry;
 * - sockets/hazard zones are finite, inside the counter bounds, and carry
 *   the level conventions (L03 rim arc numbers, L04 wet-patch shape);
 * - the bowl mesh provably passes through both rim socket poses;
 * - the prop budget (draw calls, triangles, instancing).
 */
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
  BOWL,
  BOWL_ARC,
  BOWL_RIM_RADIUS,
  COUNTER,
  HAZARDS,
  SET_SCALE,
  STAGING,
  TAP,
  buildKitchenSet,
  insideCounter,
} from '../../src/sets/kitchen/index.ts';
import { KITCHEN03_BOWL } from '../../src/world/levels/kitchen03.level.ts';
import { KITCHEN04 } from '../../src/world/levels/kitchen04.level.ts';

/** Stable hash of a built group: names, transforms, geometry bytes. */
function hashSet(group: THREE.Object3D): string {
  let h = 2166136261;
  const mix = (n: number): void => {
    h ^= Math.round((n + 1000) * 1e6) & 0xffffffff;
    h = Math.imul(h, 16777619);
  };
  const walk = (o: THREE.Object3D): void => {
    for (const c of o.children) {
      h ^= c.name.charCodeAt(0) ?? 0;
      mix(c.position.x); mix(c.position.y); mix(c.position.z);
      mix(c.rotation.x); mix(c.rotation.y); mix(c.rotation.z);
      mix(c.scale.x); mix(c.scale.y); mix(c.scale.z);
      if ((c as THREE.Mesh).isMesh || (c as THREE.InstancedMesh).isInstancedMesh) {
        const geo = (c as THREE.Mesh).geometry as THREE.BufferGeometry;
        const pos = geo.getAttribute('position');
        mix(pos.count);
        for (let i = 0; i < pos.count * pos.itemSize; i++) mix(pos.array[i] as number);
        const idx = geo.getIndex();
        if (idx) for (let i = 0; i < idx.count; i++) mix(idx.getX(i));
        if ((c as THREE.InstancedMesh).isInstancedMesh) {
          const m = (c as THREE.InstancedMesh).instanceMatrix;
          for (let i = 0; i < m.count * 16; i++) mix(m.array[i] as number);
        }
      }
      walk(c);
    }
  };
  walk(group);
  return (h >>> 0).toString(16);
}

function stats(group: THREE.Object3D): { draws: number; triangles: number; instanced: string[] } {
  let draws = 0;
  let triangles = 0;
  const instanced: string[] = [];
  group.traverse((c) => {
    const mesh = c as THREE.Mesh;
    if (!mesh.isMesh) return;
    draws += 1;
    const geo = mesh.geometry;
    const indexed = geo.getIndex();
    const tris = (indexed ? indexed.count : geo.getAttribute('position').count) / 3;
    triangles += tris * ((c as THREE.InstancedMesh).isInstancedMesh ? (c as THREE.InstancedMesh).count : 1);
    if ((c as THREE.InstancedMesh).isInstancedMesh) instanced.push(c.name);
  });
  return { draws, triangles, instanced };
}

describe('kitchen set generators', () => {
  it('is pure — two calls hash identically', () => {
    expect(hashSet(buildKitchenSet(THREE).group)).toBe(hashSet(buildKitchenSet(THREE).group));
  });

  it('exposes sockets and hazard zones that are finite and inside the counter', () => {
    const set = buildKitchenSet(THREE);
    const all: Array<{ x: number; y: number; z: number }> = [
      ...Object.values(set.sockets).map((s) => ({ x: s.pos.x, y: s.pos.y, z: s.pos.z })),
      ...Object.values(set.hazardZones).map((h) => h.center),
    ];
    expect(all.length).toBeGreaterThanOrEqual(3);
    for (const p of all) {
      expect([p.x, p.y, p.z].every(Number.isFinite)).toBe(true);
      expect(insideCounter(p.x, p.z)).toBe(true);
    }
  });

  it('builds the bowl rim arc to the L03 convention (radius, sweep, flat sockets)', () => {
    const set = buildKitchenSet(THREE);
    const { pos: inPos, tangent: inTan, up: inUp } = set.sockets['bowl.in']!;
    const { pos: outPos, tangent: outTan, up: outUp } = set.sockets['bowl.out']!;

    // the arc numbers ARE the level's bank piece's numbers
    expect(BOWL_RIM_RADIUS).toBe(KITCHEN03_BOWL.bank.radius);
    expect(BOWL_ARC.sweepDeg).toBe(Math.abs(KITCHEN03_BOWL.bank.angle));
    expect(BOWL_ARC.bankDeg).toBe(KITCHEN03_BOWL.bank.bank);

    // planar arc at the rim crown radius/height
    for (const p of [inPos, outPos]) {
      const r = Math.hypot(p.x - BOWL.position[0], p.z - BOWL.position[2]);
      expect(r).toBeCloseTo(BOWL_RIM_RADIUS, 9);
      expect(p.y).toBeCloseTo(BOWL.rimY, 9);
    }
    // 120 degrees of sweep; chord = 2 r sin(60)
    const a0 = Math.atan2(inPos.z - BOWL.position[2], inPos.x - BOWL.position[0]);
    const a1 = Math.atan2(outPos.z - BOWL.position[2], outPos.x - BOWL.position[0]);
    expect(Math.abs(a0 - a1)).toBeCloseTo((BOWL_ARC.sweepDeg * Math.PI) / 180, 9);
    expect(inPos.distanceTo(outPos)).toBeCloseTo(2 * BOWL_RIM_RADIUS * Math.sin(Math.PI / 3), 9);

    // flat, unbanked sockets with the kit's tangent frame (tangent = up x radius)
    expect(inUp.equals(outUp) && inUp.y).toBe(1);
    for (const [p, t] of [
      [inPos, inTan],
      [outPos, outTan],
    ] as const) {
      const radial = new THREE.Vector3(p.x - BOWL.position[0], 0, p.z - BOWL.position[2]).normalize();
      const frame = new THREE.Vector3().crossVectors(inUp, radial);
      expect(t.distanceTo(frame)).toBeLessThan(1e-9);
      expect(t.length()).toBeCloseTo(1, 9);
      expect(Math.abs(t.y)).toBeLessThan(1e-12);
    }
  });

  it('passes the bowl mesh through both rim socket poses', () => {
    const set = buildKitchenSet(THREE);
    let bowl: THREE.Mesh | null = null;
    set.group.traverse((c) => {
      if ((c as THREE.Mesh).isMesh && c.name === 'cereal-bowl') bowl = c as THREE.Mesh;
    });
    expect(bowl).not.toBeNull();
    const mesh = bowl as unknown as THREE.Mesh;
    mesh.updateMatrixWorld(true);
    // the lathe crown circle (mid-wall at the rim top) in mesh-local space
    const crownR = (0.098 - 0.0025) * (BOWL.height / (0.054 * SET_SCALE));
    const crownY = ((0.054 + 0.0025) * BOWL.height) / (0.054 * SET_SCALE);
    for (const s of Object.values(set.sockets)) {
      const theta = Math.atan2(s.pos.z - BOWL.position[2], s.pos.x - BOWL.position[0]);
      // world point of the rim crown at the socket's bearing — built from
      // the lathe's own profile constants, transformed by the real graph
      const local = new THREE.Vector3(crownR * Math.cos(theta), crownY, crownR * Math.sin(theta));
      const world = mesh.localToWorld(local);
      expect(world.distanceTo(s.pos)).toBeLessThan(1e-9);
    }
  });

  it('carries the wet patch as level-shaped hazard data under the tap drip', () => {
    const set = buildKitchenSet(THREE);
    const wet = set.hazardZones.tapSplash!;
    expect(Object.keys(wet).sort()).toEqual(['center', 'gripFactor', 'id', 'kind', 'radius', 'source']);
    expect(wet.kind).toBe('wetPatch');
    expect(wet.source).toBe('tap');
    // the frozen drip hangs exactly over the zone centre
    expect(wet.center.x).toBeCloseTo(TAP.drip[0], 12);
    expect(wet.center.z).toBeCloseTo(TAP.drip[2], 12);
    // the authored L04 numbers: a half-grip patch of radius 0.14
    expect(wet.radius).toBe(KITCHEN04.hazards![0]!.radius);
    expect(wet.gripFactor).toBe(KITCHEN04.hazards![0]!.gripFactor);
    // and the film layers sit on the zone centre, inside the counter
    expect(insideCounter(wet.center.x, wet.center.z)).toBe(true);
    expect(COUNTER.shape).toBe('circle');
  });

  it('stays inside the prop budget (instanced repeats, merged where sane)', () => {
    const s = stats(buildKitchenSet(THREE).group);
    expect(s.draws).toBeLessThanOrEqual(48);
    expect(s.triangles).toBeLessThanOrEqual(150_000);
    for (const name of ['sugar-cubes', 'crumb-trail', 'cereal-rings']) {
      expect(s.instanced).toContain(name);
    }
  });

  it('matches the decorative staging constants to the socket space', () => {
    // the sugar-cube support reads STAGING, so a run midpoint must be finite
    // and on the counter (guards against a scale typo in data.ts)
    for (const run of STAGING.trackRuns) {
      for (const p of [run.a, run.b]) {
        expect(p.every(Number.isFinite)).toBe(true);
        expect(insideCounter(p[0], p[2])).toBe(true);
      }
    }
    expect(insideCounter(HAZARDS.tapSplash.center.x, HAZARDS.tapSplash.center.z, 0)).toBe(true);
  });
});
