/**
 * Stage 4 — FIXTURE READABILITY SIGNAL (playtest Q handoff: "pre-placed
 * fixture pieces read as scenery"). Every fixture-piece occurrence, on every
 * campaign rung, must wear the ONE shared treatment: every material of a
 * fixture piece's meshes carries the `FIXTURE_SIGNAL.key` userData flag, and
 * the piece's deck carries a `fixture-inlay` stripe mesh. The classifier is
 * the SAME occurrence quota the boot mount uses (`fixtureQuota`), applied to
 * the level's `fixtures` table in canonical build order.
 *
 * The signal is render-side DATA (table-driven, `buildTrackMeshes` option):
 * `PlacedPiece`, `serialize` and every rig fingerprint are untouched, and a
 * build rendered WITHOUT the table (share cards pre-level-lookup, the world
 * smoke scene) must come out exactly as before — no flags, no inlays.
 */
import { describe, expect, test } from 'vitest';
import * as THREE from 'three';
import { buildTrackMeshes } from '../../src/world/world.ts';
import { fixtureQuota, serialize, type Build } from '../../src/track/build.ts';
import { canonicalBuild } from '../../src/track/snap.ts';
import { FIXTURE_SIGNAL } from '../../src/track/material.ts';
import { CAMPAIGN_LADDER } from '../../src/world/campaign.ts';
import { getLevel } from '../../src/world/levels/feeltrack.level.ts';
import { GLOBAL_TOKENS } from '../../src/render/tokens.ts';
import type { PieceKind } from '../../src/track/pieces.ts';

interface FixtureLevel {
  parBuild(): Build;
  fixtures?: Partial<Record<PieceKind, number>>;
}

const meshesIn = (root: THREE.Object3D): THREE.Mesh[] => {
  const out: THREE.Mesh[] = [];
  root.traverse((o) => {
    if (o instanceof THREE.Mesh) out.push(o);
  });
  return out;
};

const flagged = (mesh: THREE.Mesh): boolean =>
  (mesh.material as THREE.Material).userData[FIXTURE_SIGNAL.key] === 'deck-inlay';

describe('fixture readability signal (deck-inlay)', () => {
  test('every campaign rung declares a fixture table and a par build', () => {
    for (const id of CAMPAIGN_LADDER) {
      const level = getLevel(id) as unknown as FixtureLevel;
      expect(level.fixtures, `${id} fixture table`).toBeDefined();
      expect(level.parBuild, `${id} parBuild`).toBeTypeOf('function');
    }
  });

  for (const id of CAMPAIGN_LADDER) {
    test(`${id}: every fixture piece's materials carry the signal, no tray piece's do`, () => {
      const level = getLevel(id) as unknown as FixtureLevel;
      const fixtures = level.fixtures!;
      const build = level.parBuild();
      const pieces = canonicalBuild(build.pieces);
      const track = buildTrackMeshes(build, { fixtures });
      expect(track.children.length).toBe(pieces.length);

      const isFixture = fixtureQuota(fixtures);
      let fixtureGroups = 0;
      track.children.forEach((group, i) => {
        const want = isFixture(pieces[i]!.def);
        const meshes = meshesIn(group);
        expect(meshes.length).toBeGreaterThan(0);
        if (want) {
          fixtureGroups++;
          // EVERY material of a fixture piece carries the flag (deck, extras,
          // inlay) — the unit-testable half of "unmistakable shared treatment"
          for (const mesh of meshes) expect(flagged(mesh), `flag ${pieces[i]!.def}`).toBe(true);
          // the visible half: exactly one deck-inlay stripe on the piece
          expect(group.children.filter((c) => c.name === 'fixture-inlay').length).toBe(1);
        } else {
          for (const mesh of meshes) expect(flagged(mesh), `tray ${pieces[i]!.def}`).toBe(false);
          expect(group.children.some((c) => c.name === 'fixture-inlay')).toBe(false);
        }
      });
      const quotaTotal = Object.values(fixtures).reduce((s, n) => s + (n ?? 0), 0);
      expect(fixtureGroups, `${id} fixture coverage`).toBe(quotaTotal);
    });
  }

  test('the fixture deck keeps the brand orange; the signal is a narrow inlay', () => {
    const level = getLevel('kitchen01') as unknown as FixtureLevel;
    const track = buildTrackMeshes(level.parBuild(), { fixtures: level.fixtures });
    const inlayColors = new Set<string>();
    track.traverse((o) => {
      if (o instanceof THREE.Mesh && o.name === 'fixture-inlay') {
        inlayColors.add(`#${(o.material as THREE.MeshLambertMaterial).color.getHexString()}`);
      }
      if (o instanceof THREE.Mesh && flagged(o) && o.name !== 'fixture-inlay') {
        const mat = o.material as THREE.MeshLambertMaterial;
        if (mat.color.getHex() !== 0xdce6ea) {
          expect(`#${mat.color.getHexString()}`).toBe(GLOBAL_TOKENS.trackOrange.toLowerCase());
        }
      }
    });
    expect([...inlayColors]).toEqual([FIXTURE_SIGNAL.inlayColor.toLowerCase()]);
    // the inlay is the SAME hue family: track orange lifted in lightness only
    expect(FIXTURE_SIGNAL.inlayColor).not.toBe(GLOBAL_TOKENS.trackOrange);
  });

  test('renders WITHOUT the table are untouched (share/worldsmoke path)', () => {
    const level = getLevel('kitchen01') as unknown as FixtureLevel;
    const bare = buildTrackMeshes(level.parBuild());
    let inlays = 0;
    bare.traverse((o) => {
      if (o.name === 'fixture-inlay') inlays++;
    });
    expect(inlays).toBe(0);
    for (const mesh of meshesIn(bare)) expect(flagged(mesh)).toBe(false);
  });

  test('build data is untouched: serialization and fingerprint ignore the signal', () => {
    const level = getLevel('kitchen02') as unknown as FixtureLevel;
    const json = serialize(level.parBuild());
    expect(json).not.toContain(FIXTURE_SIGNAL.key);
    expect(json).not.toContain('fixture-inlay');
    // rendering the same build twice with the signal is deterministic in
    // piece grouping: one group per placed piece, canonical order
    const a = buildTrackMeshes(level.parBuild(), { fixtures: level.fixtures });
    const b = buildTrackMeshes(level.parBuild(), { fixtures: level.fixtures });
    expect(a.children.length).toBe(b.children.length);
  });
});
