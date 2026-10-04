// Tilt-shift — the signature of the whole look (art bible §Camera, PROMPT
// §5.6/§7.3): a narrow band of focus so the kitchen reads miniature. Built as
// an honest two-pass separable blur (horizontal then vertical ShaderPass) so
// the blur is round, not a box smear.
//
// The focus band is centred on a *world-space* point (the car, or the
// `focus=` harness param): the point is projected into the frame and its
// screen height becomes the band centre. Band height is 20 % of the frame
// (§7.3). The defocus *strength* is tied to the focus point's distance from
// the set floor — the higher the focused thing sits above the counter, the
// more aggressively the frame outside the band falls away, which is what
// keeps the miniature read when the action climbs the book-stack ramp.

import * as THREE from 'three'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'

export const DEFAULT_BAND_HEIGHT = 0.2

export interface TiltShiftTuning {
  /** Fraction of frame height that stays in sharp focus. Default 0.2. */
  bandHeight?: number
  /** Blur radius in pixels at the frame edge with strength 1. Default 20. */
  maxRadiusPx?: number
  /** Defocus strength when the focus point sits on the floor. Default 0.55. */
  floorStrength?: number
  /** Strength when the focus point reaches `strengthRange` above the floor. */
  topStrength?: number
  /** Rise distance in meters over which strength goes floor→top. Default 0.3. */
  strengthRange?: number
}

export interface TiltShiftParams {
  /** Band centre in uv.y (0..1). */
  bandCenter: number
  /** Band half-height in uv.y. */
  bandHalf: number
  /** Blur radius in pixels for a full circle-of-confusion. */
  radiusPx: number
}

/**
 * Pure rig → uniforms math, testable headless: project the world focus point
 * into frame height, and map its distance from the set floor onto the defocus
 * strength (outside-band pixels only — the band itself is always untouched).
 */
export function tiltShiftParams(
  focus: THREE.Vector3,
  camera: THREE.Camera,
  opts: TiltShiftTuning & { floorY?: number } = {},
): TiltShiftParams {
  const bandHeight = opts.bandHeight ?? DEFAULT_BAND_HEIGHT
  camera.updateMatrixWorld()
  const ndc = focus.clone().project(camera)
  const bandCenter = THREE.MathUtils.clamp(ndc.y * 0.5 + 0.5, 0, 1)
  const floorY = opts.floorY ?? 0
  const dist = Math.abs(focus.y - floorY)
  const range = opts.strengthRange ?? 0.3
  const t = THREE.MathUtils.clamp(dist / range, 0, 1)
  const strength = THREE.MathUtils.lerp(opts.floorStrength ?? 0.55, opts.topStrength ?? 1.0, t)
  return {
    bandCenter,
    bandHalf: bandHeight * 0.5,
    radiusPx: (opts.maxRadiusPx ?? 20) * strength,
  }
}

const tiltShader = /* glsl */ `
uniform sampler2D tDiffuse;
uniform vec2 uTexel;      // 1/width, 1/height
uniform vec2 uDirection;  // (1,0) horizontal pass, (0,1) vertical pass
uniform float uBandCenter;
uniform float uBandHalf;
uniform float uRadius;    // px at the frame edge
uniform float uTaps;      // taps per direction (quality dial)

varying vec2 vUv;

const int MAX_TAPS = 6;
const float CENTER_WEIGHT = 0.1964825501511;

// symmetric gaussian weights (center tap, then mirrored pairs i = 0..5)
float tapWeight( int i ) {
	if ( i == 0 ) return 0.17408399;
	if ( i == 1 ) return 0.12165313;
	if ( i == 2 ) return 0.06637262;
	if ( i == 3 ) return 0.029733;
	if ( i == 4 ) return 0.010485;
	return 0.0030944;
}

void main() {
	// Circle of confusion: flat zero inside the focus band, easing to 1 two
	// band-heights out — a function of screen height only, so both separable
	// passes can compute it analytically without a CoC prepass.
	float d = abs( vUv.y - uBandCenter );
	float coc = clamp( ( d - uBandHalf ) / ( uBandHalf * 2.0 ), 0.0, 1.0 );
	coc = coc * coc * ( 3.0 - 2.0 * coc );

	if ( coc * uRadius < 0.5 ) {
		gl_FragColor = texture2D( tDiffuse, vUv );
		return;
	}

	float spread = uRadius * coc;                          // px
	vec2 step = uDirection * uTexel * ( spread / float( MAX_TAPS ) );

	vec4 sum = texture2D( tDiffuse, vUv ) * CENTER_WEIGHT;
	for ( int i = 0; i < MAX_TAPS; i ++ ) {
		if ( float( i ) >= uTaps ) break;
		vec2 off = step * float( i + 1 );
		vec4 a = texture2D( tDiffuse, vUv + off );
		vec4 b = texture2D( tDiffuse, vUv - off );
		sum += ( a + b ) * tapWeight( i );
	}
	gl_FragColor = sum;
}
`

const tiltVertex = /* glsl */ `
varying vec2 vUv;
void main() {
	vUv = uv;
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
`

export interface TiltShiftPasses {
  passes: [ShaderPass, ShaderPass]
  /** px per axis, in render-target pixels. */
  setResolution(width: number, height: number): void
  setParams(p: TiltShiftParams): void
  /** taps per direction: 6 = 13-tap wide blur (high), 3 = 7-tap (medium). */
  setTaps(taps: number): void
}

/** Build the two separable passes. Order matters: horizontal, then vertical. */
export function createTiltShiftPasses(): TiltShiftPasses {
  const mk = (dirX: number, dirY: number): ShaderPass =>
    new ShaderPass({
      uniforms: {
        tDiffuse: { value: null as THREE.Texture | null },
        uTexel: { value: new THREE.Vector2(1 / 1600, 1 / 900) },
        uDirection: { value: new THREE.Vector2(dirX, dirY) },
        uBandCenter: { value: 0.5 },
        uBandHalf: { value: DEFAULT_BAND_HEIGHT * 0.5 },
        uRadius: { value: 20 },
        uTaps: { value: 6 },
      },
      vertexShader: tiltVertex,
      fragmentShader: tiltShader,
    })
  const passes: [ShaderPass, ShaderPass] = [mk(1, 0), mk(0, 1)]
  const each = (fn: (u: { [k: string]: THREE.IUniform | undefined }) => void): void => {
    for (const p of passes) fn(p.material.uniforms as { [k: string]: THREE.IUniform })
  }
  return {
    passes,
    setResolution(w, hh) {
      each((u) => {
        (u.uTexel!.value as THREE.Vector2).set(1 / w, 1 / hh)
      })
    },
    setParams(p) {
      each((u) => {
        u.uBandCenter!.value = p.bandCenter
        u.uBandHalf!.value = p.bandHalf
        u.uRadius!.value = p.radiusPx
      })
    },
    setTaps(taps) {
      each((u) => {
        u.uTaps!.value = taps
      })
    },
  }
}
