// Stains and contact marks as FILM, not geometry — the 2026-10-04 send-back:
// the tile-B mug ring was a torus of liquid material and the wet patch a
// squashed sphere, both reading as props laid on the counter. A real stain is
// a thin layer of *color over the surface*: it takes the surface's lighting,
// sits at zero height, and its shape is soft-edged shader math, not a mesh
// silhouette. `stainDecal` returns one horizontal quad a hand's-width above
// the surface, carrying that layer.
//
// It is deliberately not a ToonMaterial subclass: a film must not own a ramp,
// a cast shadow, or a specular of its own — only a fill-tinted base, the
// shape SDF, and (for wet films) a Fresnel sheen so the patch glints at low
// camera angles the way a wet spot does. Shapes are generated (no textures),
// deterministic, and wrap-stable at the scene scale.

import * as THREE from 'three'
import type { SetTokens } from './tokens.ts'

export type StainKind = 'mugRing' | 'wetPatch' | 'splashRing'

const KIND_ID: Record<StainKind, number> = { mugRing: 0, wetPatch: 1, splashRing: 2 }

export interface StainFilmOptions {
  kind: StainKind
  /** Stain color (coffee for a mug ring, pale aqua for a wet patch). */
  color?: THREE.ColorRepresentation
  /** Overall film alpha, 0..1. */
  opacity?: number
  /** Stain radius in meters (ring centerline radius for ring kinds). */
  size?: number
  /** Band width in meters (ring kinds only). */
  width?: number
  /** Wet-film Fresnel sheen, 0..1. */
  sheen?: number
  fillHigh?: THREE.ColorRepresentation
  fillLow?: THREE.ColorRepresentation
}

const filmShader = /* glsl */ `
uniform vec3 uColor;
uniform float uAlpha;
uniform float uKind;
uniform float uSize;
uniform float uWidth;
uniform float uSheen;
uniform vec3 uFillHigh;
uniform vec3 uFillLow;
uniform float uFillStrength;
uniform float uTime;

varying vec3 vFilmPos;
varying vec3 vWorldPos;

float hash21(vec2 p) {
	p = fract( p * vec2( 234.345, 435.345 ) );
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

float fbm(vec2 p) {
	return 0.6 * vnoise( p ) + 0.3 * vnoise( p * 2.3 + 17.0 ) + 0.1 * vnoise( p * 5.1 - 3.0 );
}

// SDF shape of the film: where does the stain exist, softly.
float filmShape(vec2 p) {
	if ( uKind < 0.5 ) {
		// mug ring: a coffee line with a broken, darker trailing side
		float wob = ( fbm( p * 240.0 ) - 0.5 ) * uWidth * 1.6;
		float d = abs( length( p ) + wob - uSize );
		float band = 1.0 - smoothstep( uWidth * 0.35, uWidth, d );
		float breakup = smoothstep( 0.15, 0.85, fbm( p * 140.0 + 5.0 ) );
		return band * mix( 0.45, 1.0, breakup );
	}
	if ( uKind < 1.5 ) {
		// wet patch: an irregular blob with a thin run-off tongue
		float r = length( p ) / uSize;
		float edge = ( fbm( p * 90.0 + vec2( uTime * 0.02, 0.0 ) ) - 0.5 ) * 0.32;
		return 1.0 - smoothstep( 0.72, 1.02, r + edge );
	}
	// splash ring: the drip's crown, a fine bright ring on the patch
	float d = abs( length( p ) - uSize );
	return ( 1.0 - smoothstep( uWidth * 0.3, uWidth, d ) ) * smoothstep( 0.35, 0.75, fbm( p * 260.0 + 9.0 ) );
}

void main() {
	float a = filmShape( vFilmPos.xy );
	vec3 fill = mix( uFillLow, uFillHigh, 0.55 ) * uFillStrength * 1.6;
	// Fresnel: a wet film catches the room at grazing view angles; a dry
	// stain (sheen 0) never does — it just darkens what is under it.
	// The glint is STREAKY (high-frequency fbm gate) and its color
	// contribution is halved: at a floor camera every pixel is grazing,
	// and an ungated Fresnel term whitened the whole film into a sticker.
	vec3 toCam = normalize( cameraPosition - vWorldPos );
	float steepness = clamp( abs( dot( toCam, vec3( 0.0, 1.0, 0.0 ) ) ), 0.0, 1.0 );
	float fb = fbm( vFilmPos.xy * 130.0 );
	float glint = uSheen * pow( 1.0 - steepness, 4.0 ) * smoothstep( 0.45, 0.85, fb );
	vec3 shaded = uColor * fill + vec3( 0.95, 0.98, 0.95 ) * glint * 0.5;
	gl_FragColor = vec4( shaded, a * uAlpha * ( 1.0 + glint * 0.6 ) );

	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}
`

const filmVertex = /* glsl */ `
varying vec3 vFilmPos;
varying vec3 vWorldPos;

void main() {
	vFilmPos = position;
	vWorldPos = ( modelMatrix * vec4( position, 1.0 ) ).xyz;
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
`

/**
 * A stain film as a ready mesh: a horizontal quad of `2 * pad * size`,
 * raised `lift` meters off the surface (depthWrite off, polygon-offset —
 * it never cuts the floor, it lies on it). Position it where the story is:
 * under the tap, beside the mug.
 */
export function stainDecal(
  tokens: SetTokens,
  opts: StainFilmOptions & { pad?: number; lift?: number },
): THREE.Mesh {
  const size = opts.size ?? 0.04
  const pad = opts.pad ?? 1.6
  const geo = new THREE.PlaneGeometry(size * 2 * pad, size * 2 * pad)
  geo.rotateX(-Math.PI / 2) // lie flat; local xy maps to the floor plane
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(opts.color ?? '#B98A5C') },
      uAlpha: { value: opts.opacity ?? 0.55 },
      uKind: { value: KIND_ID[opts.kind] ?? 0 },
      uSize: { value: size },
      uWidth: { value: opts.width ?? Math.max(0.0035, size * 0.14) },
      uSheen: { value: opts.sheen ?? (opts.kind === 'mugRing' ? 0 : 0.5) },
      uFillHigh: { value: new THREE.Color(opts.fillHigh ?? tokens.fillHigh) },
      uFillLow: { value: new THREE.Color(opts.fillLow ?? tokens.fillLow) },
      uFillStrength: { value: 0.32 },
      uTime: { value: 0 },
    },
    vertexShader: filmVertex,
    fragmentShader: filmShader,
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  })
  const mesh = new THREE.Mesh(geo, mat)
  mesh.position.y = opts.lift ?? 0.0006
  mesh.receiveShadow = false
  return mesh
}
