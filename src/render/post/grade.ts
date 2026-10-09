// Per-set color grade (LUT-lite) with the vignette folded in — the last
// stage of the post stack, and the only always-on full-frame draw.
//
// "LUT-lite" (PROMPT §8): no 3D LUT texture — the grade is four numbers and
// two vectors derived from the set's palette tokens by pure hex math, so a
// grade can never drift from the palette and Node tests see the same numbers
// the GPU shader gets. The kitchen grade answers the stage-1 send-back: tile
// B sat high and washed next to tile A's value range — sink the mids, warm
// the gain along the dominant hue, lift the blacks onto the shadow tint
// (never black), and take the saturation up.
//
// Two implementation notes for the frame budget: (1) the vignette is a term
// of this pass, not a pass of its own — a corner falloff is three ALU ops,
// and paying a second full-frame buffer read for it measured +5 ms under
// software GL; the knob stays (`vignette: 0` disables it). (2) As the last
// pass it carries the sRGB encode (`colorspace_fragment`), which retires the
// separate OutputPass draw. The stage-drop ladder (bloom → tilt-shift) never
// touches this pass, so it can be the terminal one.

import * as THREE from 'three'
import { hexToRgb } from '../tokens.ts'
import type { SetTokens } from '../tokens.ts'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'

export interface Grade {
  /** Additive black point (rgb, tiny — the shadow tint, never grey). */
  lift: readonly [number, number, number]
  /** Per-channel highlight gain (rgb around 1, warm on the dominant). */
  gain: readonly [number, number, number]
  saturation: number
  contrast: number
  /** Mid-sink exponent (>1 darkens mids). */
  gamma: number
}

export interface VignetteSpec {
  strength: number
  softness: number
}

/**
 * Derive a set's grade from its tokens. Pure, deterministic, no three.
 * The kitchen values were eyeballed against tile A's rendered histogram
 * (docs/explorations/kitchen/*-a.png): mids down, blacks kept warm.
 */
export function gradeFromTokens(tokens: SetTokens): Grade {
  const [dr, dg, db] = hexToRgb(tokens.dominant)
  const dm = (dr + dg + db) / 3
  const [sr, sg, sb] = hexToRgb(tokens.shadowTint)
  return {
    lift: [sr * 0.055, sg * 0.055, sb * 0.06],
    gain: [1 + (dr - dm) * 0.12, 1 + (dg - dm) * 0.12, 1 + (db - dm) * 0.12],
    saturation: 1.12,
    contrast: 1.09,
    gamma: 1.12,
  }
}

const gradeShader = /* glsl */ `
uniform sampler2D tDiffuse;
uniform vec3 uLift;
uniform vec3 uGain;
uniform float uSaturation;
uniform float uContrast;
uniform float uGamma; // mid curve: out = pow(in, 1/uGamma)
uniform float uVignette;
uniform float uVignetteSoftness;

varying vec2 vUv;

void main() {
	vec3 c = pow( max( texture2D( tDiffuse, vUv ).rgb, vec3( 0.0 ) ), vec3( 1.0 / uGamma ) );
	c = ( c - 0.5 ) * uContrast + 0.5;
	float l = dot( c, vec3( 0.2126, 0.7152, 0.0722 ) );
	c = mix( vec3( l ), c, uSaturation );
	c = c * uGain + uLift;
	// vignette term: soft corner falloff, enough to seat the frame, never a spotlight
	float r = length( vUv - 0.5 ) / 0.7071;
	c *= 1.0 - uVignette * smoothstep( 1.0 - uVignetteSoftness, 1.0, r );
	// BLOWN-HIGHLIGHTS CAP (program T1.3, design evaluation §1: “blown highs
	// the tiles did not have — kitchen mug and bowl milk, bedroom lamp post,
	// garage blade band, porch window frame”). A knee at 0.80 LINEAR rolls
	// the top band onto an asymptote 0.086 above it, so no channel can pin:
	// pure white lands at ≈ 238/255 and the census blown test (every channel
	// ≥ 243) becomes unreachable BY CONSTRUCTION. The roll is monotonic, is
	// the identity below the knee (every mid-tone byte-identical), and lives
	// here — at the terminal stage, after the bloom's add and the vignette —
	// because a cap below the bloom could still be blown past by the bloom.
	vec3 over = max( c - vec3( 0.80 ), vec3( 0.0 ) );
	vec3 cap = vec3( 0.086 );
	c = min( c, vec3( 0.80 ) ) + over * cap / ( over + cap );
	gl_FragColor = vec4( c, 1.0 );

	#include <colorspace_fragment>
}
`

const passVertex = /* glsl */ `
varying vec2 vUv;
void main() {
	vUv = uv;
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
`

/** The terminal pass: LUT-lite grade + vignette term + the sRGB encode. */
export function createGradePass(grade: Grade, vignette: VignetteSpec = { strength: 0.26, softness: 0.72 }): ShaderPass {
  return new ShaderPass({
    uniforms: {
      tDiffuse: { value: null as THREE.Texture | null },
      uLift: { value: new THREE.Vector3(grade.lift[0], grade.lift[1], grade.lift[2]) },
      uGain: { value: new THREE.Vector3(grade.gain[0], grade.gain[1], grade.gain[2]) },
      uSaturation: { value: grade.saturation },
      uContrast: { value: grade.contrast },
      uGamma: { value: grade.gamma },
      uVignette: { value: vignette.strength },
      uVignetteSoftness: { value: vignette.softness },
    },
    vertexShader: passVertex,
    fragmentShader: gradeShader,
  })
}
