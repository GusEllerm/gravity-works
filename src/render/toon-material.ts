// The Gravity Works toon material. A ShaderMaterial assembled from Three.js
// shader chunks (lights_pars_begin / lights_fragment_begin drive the light
// loop; this file supplies the toon BRDF as RE_Direct) — not MeshToonMaterial.
// One material, few parameters, per the art bible: base color, a 2–3 step
// ramp, specular size/strength, rim, and optional treatments (toy gradient,
// painted-wood grain, liquid wobble). No image textures; all variation is
// computed in the shader.
//
// Lighting contract: fill light arrives as two material bands (uFillHigh /
// uFillLow, from the set's tokens) sampled by world-up — never a uniform
// ambient, which the rubric forbids. Scenes therefore add no AmbientLight.
// Shadow attenuation is recovered from the key light's color (see setKeyLight)
// so dark bands can tint toward the set's hue instead of just going dark.

import * as THREE from 'three'
import { SET_TOKENS } from './tokens.ts'

const vertexShader = /* glsl */ `
#include <common>
#include <fog_pars_vertex>
#include <shadowmap_pars_vertex>

varying vec3 vNormal;
varying vec3 vViewPosition;
varying vec3 vModelPos;
varying vec3 vWorldPos;

void main() {
	#include <beginnormal_vertex>
	#include <defaultnormal_vertex>
	vNormal = normalize( transformedNormal );

	#include <begin_vertex>
	vWorldPos = ( modelMatrix * vec4( transformed, 1.0 ) ).xyz;
	#include <project_vertex>
	vViewPosition = - mvPosition.xyz;
	vModelPos = position;

	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}
`

const fragmentShader = /* glsl */ `
#include <common>
#include <lights_pars_begin>
#include <shadowmap_pars_fragment>
#include <fog_pars_fragment>

varying vec3 vNormal;
varying vec3 vViewPosition;
varying vec3 vModelPos;
varying vec3 vWorldPos;

uniform vec3 uBase;
uniform vec3 uShadowTint;
uniform vec3 uSpecColor;
uniform vec3 uRimColor;
uniform vec3 uFillHigh;
uniform vec3 uFillLow;
uniform float uStep0;
uniform float uStep1;
uniform float uStep2;
uniform float uThresh1;
uniform float uThresh2;
uniform float uSoftness;
uniform float uSpecSize;
uniform float uSpecStrength;
uniform float uRimStrength;
uniform float uRimSize;
uniform float uToy;
uniform float uGrain;
uniform float uGrainScale;
uniform float uLiquid;
uniform float uTime;
uniform float uDiffuseStrength;
uniform float uKeyLength;
uniform float uFillStrength;
uniform float uShadowDither;
uniform float opacity;

struct ToonSurface {
	vec3 baseColor;
	vec3 shadowTint;
	vec3 specColor;
	float specSize;
	float specStrength;
	float diffuseStrength;
};

float hash21(vec2 p) {
	p = fract( p * vec2( 234.34, 435.345 ) );
	p += dot( p, p + 34.23 );
	return fract( p.x * p.y );
}

float vnoise(vec2 p) {
	vec2 i = floor( p );
	vec2 f = fract( p );
	vec2 u = f * f * ( 3.0 - 2.0 * f );
	float a = hash21( i );
	float b = hash21( i + vec2( 1.0, 0.0 ) );
	float c = hash21( i + vec2( 0.0, 1.0 ) );
	float d = hash21( i + vec2( 1.0, 1.0 ) );
	return mix( mix( a, b, u.x ), mix( c, d, u.x ), u.y );
}

// faint painted-wood grain: value noise stretched along one axis, scene units
// = meters. uGrainScale is the per-surface frequency (2026-10-04 backlog:
// grain frequency belongs to the surface size — a big floor takes long low
// streaks, a book cover takes fine ones; default 1 keeps stage-1 looks).
float grainWave( vec3 p, float s ) {
	// wrap far from the origin: the hash lattice loses precision at large
	// coordinates, which would bloom into 10 cm waves on the big ground disc
	vec3 q = mod( p + vec3( 32.0 ), vec3( 64.0 ) ) - vec3( 32.0 );
	float t = vnoise( vec2( q.z * 260.0 * s, q.x * 12.0 * s + q.y * 3.0 * s ) );
	return vnoise( vec2( t * 3.0 + q.z * 110.0 * s, q.x * 8.0 * s ) );
}

void RE_Direct_Toon(
	const in IncidentLight directLight,
	const in vec3 geometryPosition,
	const in vec3 geometryNormal,
	const in vec3 geometryViewDir,
	const in vec3 geometryClearcoatNormal,
	const in ToonSurface material,
	inout ReflectedLight reflectedLight
) {
	float ndl = dot( geometryNormal, directLight.direction );

	float band = uStep0;
	band += ( uStep1 - uStep0 ) * smoothstep( uThresh1 - uSoftness, uThresh1 + uSoftness, ndl );
	band += ( uStep2 - uStep1 ) * smoothstep( uThresh2 - uSoftness, uThresh2 + uSoftness, ndl );

	// Shadow attenuation arrives folded into directLight.color by
	// lights_fragment_begin; comparing against the known key length separates
	// "in shadow" from "unlit angle". Fully shadowed points swap the light for
	// the set's shadow tint at reduced strength, so shadows tint, never blacken.
	float att = clamp( length( directLight.color ) / max( uKeyLength, 0.0001 ), 0.0, 1.0 );
	// Shadow-dither budget (2026-10-04 backlog). Three's PCF rotates a 5-tap
	// Vogel disc by per-pixel interleaved gradient noise, so a partial-coverage
	// fragment reports an attenuation in {0.2 .. 0.8} that re-rolls every
	// pixel — the same failure mode that sank the painterly ramp, now speckling
	// shadow edges at grazing angles. The budget caps how much of that
	// per-pixel dither survives: at 0 partial coverage resolves by a hard call
	// biased with a slow world-space weave (~2 mm cells, so the boundary sits
	// in world space and reads as a soft edge, never as a pixel chessboard);
	// at 1 the raw IGN dither is back. Default 0.35 keeps a breath of texture.
	vec3 weaveW = mod( vWorldPos + vec3( 32.0 ), vec3( 64.0 ) ) - vec3( 32.0 );
	float weave = hash21( floor( weaveW.xz * 450.0 ) ) - 0.5;
	float hard = step( 0.5 + weave * 0.6, att );
	att = mix( hard, att, uShadowDither );
	vec3 effective = mix( material.shadowTint * uKeyLength * 0.4, directLight.color, att );

	vec3 halfVec = normalize( directLight.direction + geometryViewDir );
	float ndh = dot( geometryNormal, halfVec );
	float specCut = 1.0 - material.specSize * 0.2;
	float spec = smoothstep( specCut, specCut + material.specSize * 0.08, ndh );
	spec *= smoothstep( 0.02, 0.22, ndl );

	reflectedLight.directDiffuse += effective * band * material.baseColor * material.diffuseStrength;
	// clamp the highlight color so a hot key cannot blow the toon spec to white
	reflectedLight.directSpecular += spec * material.specColor * material.specStrength * min( directLight.color, vec3( 1.0 ) );
}

#define RE_Direct RE_Direct_Toon

void main() {
	// Backface flip matching Three's normal_fragment_begin: two-sided lathe
	// forms (cereal bowls!) must shade their inner wall by its true facing,
	// not sit stuck in the darkest ramp band with an inverted fill gradient.
	vec3 normal = normalize( vNormal ) * ( gl_FrontFacing ? 1.0 : - 1.0 );

	if ( uLiquid > 0.0 ) {
		// animated surface wobble; deterministic while uTime stays fixed
		vec2 q = ( mod( vModelPos.xz + vec2( 32.0 ), vec2( 64.0 ) ) - vec2( 32.0 ) ) * 400.0;
		float w1 = vnoise( q + vec2( uTime * 0.6, uTime * 0.35 ) );
		float w2 = vnoise( q.yx * 1.07 - vec2( uTime * 0.45, uTime * 0.5 ) );
		normal = normalize( normal + vec3( w1 - 0.5, 0.0, w2 - 0.5 ) * uLiquid );
	}

	vec3 upView = normalize( ( viewMatrix * vec4( 0.0, 1.0, 0.0, 0.0 ) ).xyz );
	float upness = dot( normal, upView ) * 0.5 + 0.5;

	vec3 baseColor = uBase;
	if ( uGrain > 0.0 ) {
		baseColor *= mix( vec3( 1.0 ), vec3( 0.80 ) + vec3( 0.34 ) * grainWave( vModelPos, uGrainScale ), uGrain );
	}
	if ( uToy > 0.0 ) {
		// dip-painted toy treatment: faint brightening above, faint sinking below
		baseColor *= mix( vec3( 1.0 ), mix( vec3( 0.94 ), vec3( 1.06 ), pow( upness, 0.75 ) ), uToy );
	}

	ToonSurface material;
	material.baseColor = baseColor;
	material.shadowTint = uShadowTint;
	material.specColor = uSpecColor;
	material.specSize = uSpecSize;
	material.specStrength = uSpecStrength;
	material.diffuseStrength = uDiffuseStrength;

	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );

	#include <lights_fragment_begin>

	// two-band directional fill replaces ambient: tinted toward the set's hue
	// (and its accent, via the lighting rig), scaled by uFillStrength so the
	// fill gain is a material parameter, not a shader constant (2026-10-04
	// backlog: the fill must be able to reach the set accent). The 0.25
	// default keeps every pre-stage-3 render byte-identical.
	vec3 fill = mix( uFillLow, uFillHigh, upness ) * uFillStrength;

	float ndv = clamp( dot( normal, normalize( vViewPosition ) ), 0.0, 1.0 );
	float rim = pow( 1.0 - ndv, mix( 5.5, 1.8, uRimSize ) ) * uRimStrength;

	vec3 outgoing = baseColor * fill
		+ reflectedLight.directDiffuse
		+ reflectedLight.directSpecular
		+ baseColor * uRimColor * rim;

	gl_FragColor = vec4( outgoing, opacity );

	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}
`

export interface ToonSpecular {
  /** Angular size of the highlight, 0..1 (small = hard die-cast dot). */
  size?: number
  strength?: number
  color?: THREE.ColorRepresentation
}

export interface ToonRim {
  strength?: number
  /** Width of the rim band, 0 = razor edge, 1 = broad wrap. */
  size?: number
  color?: THREE.ColorRepresentation
}

export interface ToonRamp {
  /** Brightness per band, low to high: 2 or 3 entries. */
  steps?: readonly [number, number] | readonly [number, number, number]
  /** NDl thresholds between the bands: 1 or 2 entries. */
  thresholds?: readonly [number] | readonly [number, number]
  /** Half-width of each band edge; 0 = instant, >0.2 = painterly. */
  softness?: number
}

export interface ToonMaterialParams {
  color?: THREE.ColorRepresentation
  ramp?: ToonRamp
  shadowTint?: THREE.ColorRepresentation
  specular?: ToonSpecular
  rim?: ToonRim
  /** Two-band ambient fill (from set tokens). */
  fillHigh?: THREE.ColorRepresentation
  fillLow?: THREE.ColorRepresentation
  /** Dip-paint toy treatment amount, 0..1. */
  toy?: number
  /** Painted-wood grain amount, 0..1. */
  grain?: number
  /** Grain frequency multiplier — lower = longer streaks for bigger surfaces. */
  grainScale?: number
  /** Liquid normal wobble amount (uTime-driven). */
  liquid?: number
  /** Scales diffuse response (glass lets light through). */
  diffuseStrength?: number
  /** Two-band fill gain; default 0.25 (the pre-stage-3 constant). */
  fillStrength?: number
  /** Shadow-dither budget 0..1 (see the shader note); default 0.35. */
  shadowDither?: number
  opacity?: number
  transparent?: boolean
}

function rampUniforms(ramp: ToonRamp | undefined): Record<string, { value: number }> {
  const steps = ramp?.steps ?? [0.6, 1.0]
  const thresholds = ramp?.thresholds ?? [0.42]
  const s = steps.slice()
  while (s.length < 3) s.push(s[s.length - 1])
  const t = thresholds.slice()
  while (t.length < 2) t.push(10) // never reached
  return {
    uStep0: { value: s[0] },
    uStep1: { value: s[1] },
    uStep2: { value: s[2] },
    uThresh1: { value: t[0] },
    uThresh2: { value: t[1] },
    uSoftness: { value: ramp?.softness ?? 0.035 },
  }
}

export class ToonMaterial extends THREE.ShaderMaterial {
  constructor(params: ToonMaterialParams = {}) {
    const kitchen = SET_TOKENS.kitchen
    const uniforms = THREE.UniformsUtils.merge([
      THREE.UniformsLib.lights,
      THREE.UniformsLib.fog,
      {
        uBase: { value: new THREE.Color(params.color ?? '#D96A3B') },
        uShadowTint: { value: new THREE.Color(params.shadowTint ?? kitchen.shadowTint) },
        uSpecColor: { value: new THREE.Color(params.specular?.color ?? '#FFF6E8') },
        uRimColor: { value: new THREE.Color(params.rim?.color ?? kitchen.fillHigh) },
        uFillHigh: { value: new THREE.Color(params.fillHigh ?? kitchen.fillHigh) },
        uFillLow: { value: new THREE.Color(params.fillLow ?? kitchen.fillLow) },
        uSpecSize: { value: params.specular?.size ?? 0.12 },
        uSpecStrength: { value: params.specular?.strength ?? 0.6 },
        uRimStrength: { value: params.rim?.strength ?? 0.16 },
        uRimSize: { value: params.rim?.size ?? 0.45 },
        uToy: { value: params.toy ?? 0 },
        uGrain: { value: params.grain ?? 0 },
        uGrainScale: { value: params.grainScale ?? 1 },
        uFillStrength: { value: params.fillStrength ?? 0.25 },
        uShadowDither: { value: params.shadowDither ?? 0.3 },
        uLiquid: { value: params.liquid ?? 0 },
        uTime: { value: 0 },
        uDiffuseStrength: { value: params.diffuseStrength ?? 1 },
        uKeyLength: { value: 1 },
        opacity: { value: params.opacity ?? 1 },
        ...rampUniforms(params.ramp),
      },
    ])
    super({
      uniforms,
      vertexShader,
      fragmentShader,
      lights: true,
      fog: true,
      transparent: params.transparent ?? (params.opacity ?? 1) < 1,
    })
  }

  /**
   * Declare the scene's key light so dark bands tint toward the set's hue:
   * the shader compares each fragment's light contribution against this
   * length to separate cast shadow from unlit angle. Call once per scene.
   */
  setKeyLight(color: THREE.ColorRepresentation, intensity: number): void {
    const c = new THREE.Color(color)
    this.uniforms.uKeyLength.value = Math.hypot(c.r, c.g, c.b) * intensity
  }

  /** Liquid wobble phase. Fixed at 0 unless a scene opts into time. */
  set time(value: number) {
    this.uniforms.uTime.value = value
  }

  get time(): number {
    return this.uniforms.uTime.value as number
  }
}
