/**
 * The garden lighting-gate extension (stage 4, Environment Artist). The sun
 * regime added TWO dials to `createLightingRig` (`keyColor`, `sky` +
 * `skyInfluence`) and one honest generalization to `applyKeyLight` (it reads
 * the rig's own key color). Both are contract-bound to be invisible indoors:
 *
 * 1. DIRECTIONAL-ONLY BYTE IDENTITY — a rig built with no sun/sky options
 *    must produce the pre-garden values exactly: the stock key color, the
 *    indoor fill-band formula, the dominant-derived shadow tint; and
 *    `applyKeyLight` must stamp `uKeyLength` from that same stock color.
 *    This is the unit half of the kitchen-baseline gate (the visual
 *    baselines in tests/e2e/visual.spec.ts are the pixel half).
 * 2. THE SUN REGIME, in numbers — with `keyColor`/`sky` the shadow tint must
 *    move SKY-side (toward the blue), which is the mechanism variant B's
 *    pixels contradicted and the production set must ship (the AD's census
 *    ask: tinted darks that lean sky, never warm-olive-by-dominant).
 * 3. THE PUNCTUAL GATE, untouched — the bedroom's flag discipline still
 *    stands: directional passes take the tint swap, point passes never do.
 * 4. The set's data contract: pipe sockets finite and inside the deck,
 *    builds deterministic, the guard's naming convention (dress/shell) held.
 */
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { createLightingRig, applyKeyLight } from '../../src/render/lighting.ts';
import { ToonMaterial } from '../../src/render/toon-material.ts';
import { GLOBAL_TOKENS, SET_TOKENS, hexToRgb, lighten, mixHex } from '../../src/render/tokens.ts';
import {
  DECK,
  PIPE_SOCKET_FRAMES,
  SKY,
  SUN,
  buildGardenSet,
  insideDeck,
} from '../../src/sets/garden/index.ts';

function rgbSpread(hex: string): [number, number, number] {
  return hexToRgb(hex).map((v) => Math.round(v * 255)) as [number, number, number];
}

describe('garden lighting gate 1: directional-only rigs are byte-identical', () => {
  it('a rig without sun/sky opts keeps the stock key color and indoor bands', () => {
    for (const id of ['kitchen', 'bedroom'] as const) {
      const tokens = SET_TOKENS[id];
      const rig = createLightingRig(tokens);
      expect(rig.key.color.getHex()).toBe(new THREE.Color(GLOBAL_TOKENS.keyLight).getHex());
      // the pre-garden indoor formula, written out here so a regression in
      // lighting.ts cannot silently redefine it
      expect(rig.fillHigh).toBe(lighten(mixHex(tokens.fillHigh, tokens.accent, 0.3), 0.12));
      expect(rig.fillLow).toBe(mixHex(tokens.fillLow, tokens.accent, 0.3 * 0.6));
      expect(rig.shadowTint).toBe(mixHex(tokens.shadowTint, tokens.dominant, 0.3));
      expect(rig.fillStrength).toBe(0.32);
      rig.key.dispose();
    }
  });

  it('applyKeyLight stamps uKeyLength from the stock color on indoor rigs', () => {
    const rig = createLightingRig(SET_TOKENS.kitchen);
    const mat = new ToonMaterial();
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), mat);
    const scene = new THREE.Scene();
    scene.add(mesh);
    applyKeyLight(scene, rig);
    // hypot of the key color IN THE WORKING COLOR SPACE (three converts the
    // sRGB hex; setKeyLight measures the linear components) × intensity
    const kc = new THREE.Color(GLOBAL_TOKENS.keyLight);
    const expected = Math.hypot(kc.r, kc.g, kc.b) * rig.keyIntensity;
    expect(mat.uniforms.uKeyLength!.value).toBeCloseTo(expected, 10);
    mesh.geometry.dispose();
    mat.dispose();
    rig.key.dispose();
  });
});

describe('garden lighting gate 2: the sun regime tints shade sky-side', () => {
  it('keyColor lands the warm sun on the key, and sky pulls the tint blue', () => {
    const tokens = SET_TOKENS.garden;
    const indoor = createLightingRig(tokens, { keyIntensity: SUN.intensity, keyPosition: SUN.pos });
    const sun = createLightingRig(tokens, {
      keyIntensity: SUN.intensity,
      keyPosition: SUN.pos,
      keyColor: SUN.color,
      sky: SKY,
      skyInfluence: 0.6,
    });
    // the key carries the sun's own warm tint, not the indoor breakfast color
    expect(sun.key.color.getHex()).toBe(new THREE.Color(SUN.color).getHex());
    expect(indoor.key.color.getHex()).toBe(new THREE.Color(GLOBAL_TOKENS.keyLight).getHex());
    // the AD's measurable claim: variant B's shade measured warm-olive (b
    // lowest); the sky-derived tint must LEAN BLUE relative to the indoor
    // tint of the same tokens — b rises, r falls, and neither is black
    const [ir, , ib] = rgbSpread(indoor.shadowTint);
    const [sr, , sb] = rgbSpread(sun.shadowTint);
    expect(sb - sr).toBeGreaterThan(ib - ir);
    expect(sb).toBeGreaterThan(sr);
    expect(Math.min(...rgbSpread(sun.shadowTint))).toBeGreaterThan(40); // never black fill
    // and the sky-side fill band takes the sky too
    const [fR, , fB] = rgbSpread(sun.fillHigh);
    const [iR, , iB] = rgbSpread(indoor.fillHigh);
    expect(fB - fR).toBeGreaterThan(iB - iR);
    indoor.key.dispose();
    sun.key.dispose();
  });

  it('the punctual gate is untouched: dir passes clear the flag, point sets it', () => {
    const src = String(new ToonMaterial().fragmentShader);
    expect(src).toContain('gPunctualLight = false');
    expect(src).toContain('gPunctualLight = true');
    expect(src).toContain('if ( gPunctualLight ) effective = directLight.color;');
  });
});

describe('garden set data contract', () => {
  it('pipe sockets are finite, deck-bound, and axis-consistent', () => {
    for (const [name, f] of Object.entries(PIPE_SOCKET_FRAMES)) {
      expect(f.pos.every(Number.isFinite)).toBe(true);
      expect(insideDeck(f.pos[0], f.pos[2])).toBe(true);
      const len = Math.hypot(...f.tangent);
      expect(len).toBeCloseTo(1, 8);
      expect(name.startsWith('pipe.')).toBe(true);
    }
    expect(DECK.shape).toBe('circle');
  });

  it('builds are deterministic and keep the guard naming convention', () => {
    const a = buildGardenSet(THREE);
    const b = buildGardenSet(THREE);
    expect(a.group.getObjectByName('dress')).toBeTruthy();
    expect(a.group.getObjectByName('shell')).toBeTruthy();
    expect(a.group.getObjectByName('sun-disc')).toBeTruthy();
    const bytes = (g: THREE.Group): string => {
      const parts: string[] = [];
      g.traverse((o) => {
        if ((o as THREE.InstancedMesh).isInstancedMesh) {
          const m = (o as THREE.InstancedMesh).instanceMatrix;
          parts.push(`${o.name}:${Array.from(m.array.slice(0, 64)).map((v) => v.toFixed(6)).join(',')}`);
        } else if ((o as THREE.Mesh).isMesh) {
          parts.push(`${o.name}:${o.position.x.toFixed(6)},${o.position.y.toFixed(6)},${o.position.z.toFixed(6)}`);
        }
      });
      return parts.join('|');
    };
    expect(bytes(a.group)).toBe(bytes(b.group));
    expect(Object.keys(a.sockets).sort()).toEqual(['pipe.in', 'pipe.out']);
  });
});
