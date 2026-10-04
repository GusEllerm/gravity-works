/**
 * Material-system backlog (Decision Log 2026-10-04, tile C audit + stage-1
 * review): every item the Technical Artist owes the art bible gets a guard
 * here — grain frequency per surface, the fill gain parameter, the grain
 * class restriction, the ceramic saturation lift, the shadow-dither
 * uniform, the tyre lightness floor, and the lighting rig that stitches
 * them to a set's tokens. The stain film class (film-as-material, not
 * cutout geometry) is checked structurally: geometry-free quads with the
 * right shader knobs.
 */
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { ceramic, ceramicSaturationLift, dieCastPaint, paintedWood, fabric } from '../../src/render/materials.ts';
import { ToonMaterial } from '../../src/render/toon-material.ts';
import { CONTACT_LIGHTNESS_FLOOR, SET_TOKENS, clampLightness, hexToRgb } from '../../src/render/tokens.ts';
import { applyKeyLight, createLightingRig, fillFromRig } from '../../src/render/lighting.ts';
import { stainDecal } from '../../src/render/film.ts';

const tokens = SET_TOKENS.kitchen;

function lum(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return (r + g + b) / 3;
}

function chroma(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return Math.max(r, g, b) - Math.min(r, g, b);
}

describe('backlog 1+7: grain is per-surface and class-restricted', () => {
  it('painted wood carries grain at a settable frequency', () => {
    const mat = paintedWood(tokens, '#D9883B');
    expect(mat.uniforms.uGrain!.value).toBeGreaterThan(0);
    expect(mat.uniforms.uGrainScale!.value).toBe(1);
    const bigFloor = paintedWood(tokens, '#D9883B', { grainScale: 0.35 });
    expect(bigFloor.uniforms.uGrainScale!.value).toBe(0.35);
    mat.dispose();
    bigFloor.dispose();
  });

  it('ceramic/fabric grain is clamped to zero even when overridden', () => {
    const bowl = ceramic(tokens, '#F0DDB2', { grain: 0.5 });
    expect(bowl.uniforms.uGrain!.value).toBe(0); // speckle on glaze = lens dirt
    const cloth = fabric(tokens, tokens.accent, { grain: 0.5 });
    expect(cloth.uniforms.uGrain!.value).toBe(0);
    bowl.dispose();
    cloth.dispose();
  });

  it('toy-treated surfaces may keep grain', () => {
    const toy = dieCastPaint(tokens, '#E0442B', { grain: 0.4 });
    expect(toy.uniforms.uGrain!.value).toBe(0.4);
    toy.dispose();
  });
});

describe('backlog 2: the fill gain is a parameter, and the rig reaches the accent', () => {
  it('the shader multiplies fill by uFillStrength and defaults to the old constant', () => {
    const mat = new ToonMaterial();
    expect(mat.uniforms.uFillStrength!.value).toBe(0.25);
    expect(String(mat.fragmentShader)).toContain('uFillStrength');
    expect(String(mat.fragmentShader)).not.toMatch(/uFillHigh, upness \) \* 0\.25/);
    mat.dispose();
  });

  it('the lighting rig lifts fill strength and pulls fill toward the set accent', () => {
    const rig = createLightingRig(tokens);
    expect(rig.fillStrength).toBeGreaterThan(0.25);
    expect(rig.fillHigh).not.toBe(tokens.fillHigh);
    const over = fillFromRig(rig);
    const mat = dieCastPaint(tokens, '#E0442B', over);
    expect(mat.uniforms.uFillStrength!.value).toBe(rig.fillStrength);
    mat.dispose();
  });
});

describe('backlog 5: shadow-dither budget', () => {
  it('exists as a bounded uniform and the shader uses it', () => {
    const mat = new ToonMaterial();
    const budget = mat.uniforms.uShadowDither!.value as number;
    expect(budget).toBeGreaterThan(0);
    expect(budget).toBeLessThan(1);
    expect(String(mat.fragmentShader)).toContain('uShadowDither');
    expect(String(mat.fragmentShader)).toContain('vWorldPos'); // the weave lives in world space
    mat.dispose();
  });
});

describe('backlog 4: ceramic saturation lift', () => {
  it('raises chroma without darkening, and ceramic() applies it', () => {
    const base = '#F0DDB2';
    const lifted = ceramicSaturationLift(base);
    expect(chroma(lifted)).toBeGreaterThan(chroma(base));
    expect(lum(lifted)).toBeGreaterThanOrEqual(lum(base) - 0.005);
    const bowl = ceramic(tokens, base);
    const u = bowl.uniforms.uBase!.value as THREE.Color;
    expect(u.getHexString()).toBe(lifted.slice(1).toLowerCase());
    bowl.dispose();
  });
});

describe('backlog 6: warm-brown lightness floor for contact parts', () => {
  it('raises tyre brown to the floor without greying or over-lightening', () => {
    const tyre = clampLightness('#4A3527');
    const [r, g, b] = hexToRgb(tyre);
    expect(Math.max(r, g, b) - Math.min(r, g, b)).toBeGreaterThan(0.04); // still brown, not grey
    expect(lum(tyre)).toBeGreaterThan(lum('#4A3527'));
    expect(lum(tyre)).toBeLessThan(lum('#FFE7C4'));
    // idempotent at/above the floor, and the floor is the documented constant
    expect(clampLightness(tyre)).toBe(tyre);
    expect(CONTACT_LIGHTNESS_FLOOR).toBeGreaterThan(0.25);
  });
});

describe('lighting rig', () => {
  it('builds one shadowed tinted key and applies its length to every toon material', () => {
    const rig = createLightingRig(tokens);
    expect(rig.key.castShadow).toBe(true);
    expect(rig.key.shadow.radius).toBeGreaterThan(1); // soft PCF, budgeted in-shader
    const scene = new THREE.Scene();
    const mat = dieCastPaint(tokens, '#E0442B', fillFromRig(rig));
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.01, 0.01), mat);
    scene.add(mesh);
    applyKeyLight(scene, rig);
    expect(mat.uniforms.uKeyLength!.value).toBeGreaterThan(0);
    mat.dispose();
  });

  it('dust motes are a hook, not particles this round', () => {
    const rig = createLightingRig(tokens);
    const motes = rig.dustMotes();
    expect(motes.children.length).toBe(0);
    expect(rig.key.intensity).toBe(1.3);
  });
});

describe('backlog 3: stains are films, not cutouts', () => {
  it('a stain decal is a flat film quad — no volume, no depth writing', () => {
    const ring = stainDecal(tokens, { kind: 'mugRing', size: 0.034 });
    const mat = ring.material as THREE.ShaderMaterial;
    expect(mat.transparent).toBe(true);
    expect(mat.depthWrite).toBe(false);
    expect(mat.uniforms.uKind!.value).toBe(0);
    const patch = stainDecal(tokens, { kind: 'wetPatch', size: 0.038 });
    expect((patch.material as THREE.ShaderMaterial).uniforms.uKind!.value).toBe(1);
    expect((patch.material as THREE.ShaderMaterial).uniforms.uSheen!.value).toBeGreaterThan(0);
    const geo = ring.geometry as THREE.BufferGeometry;
    const n = geo.attributes.normal!;
    expect(Math.abs(n.getY(0)!)).toBeGreaterThan(0.99); // lies flat, not a squashed sphere
    mat.dispose();
    (patch.material as THREE.ShaderMaterial).dispose();
  });
});
