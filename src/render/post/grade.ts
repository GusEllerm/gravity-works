// Per-set color grade (LUT-lite) and vignette — the last two stages of the
// post stack, both one-tap-cheap full-frame passes.
//
// "LUT-lite" (PROMPT §8): no 3D LUT texture — the grade is four numbers and
// two vectors derived from the set's palette tokens by pure hex math, so a
// grade can never drift from the palette and Node tests see the same numbers
// the GPU shader gets. The kitchen grade answers the stage-1 send-back: tile
// B sat high and washed next to tile A's value range — sink the mids a hair,
// warm the gain along the dominant hue, lift the blacks onto the shadow
// tint (never black), and take a little saturation back up.

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
 * (docs/explorations/kitchen/*-a.png): mids down ~6 %, blacks kept warm.
 */
export function gradeFromTokens(tokens: SetTokens): Grade {
  const [dr, dg, db] = hexToRgb(tokens.dominant)
  const dm = (dr + dg + db) / 3
  const [sr, sg, sb] = hexToRgb(tokens.shadowTint)
  return {
    lift: [sr * 0.045, sg * 0.045, sb * 0.05],
    gain: [1 + (dr - dm) * 0.12, 1 + (dg - dm) * 0.12, 1 + (db - dm) * 0.12],
    saturation: 1.1,
    contrast: 1.07,
    gamma: 1.06,
  }
}

const gradeShader = /* glsl */ `
uniform sampler2D tDiffuse;
uniform vec3 uLift;
uniform vec3 uGain;
uniform float uSaturation;
uniform float uContrast;
uniform float uGamma; // mid curve: out = pow(in, 1/uGamma)

varying vec2 vUv;

void main() {
	vec3 c = pow( max( texture2D( tDiffuse, vUv ).rgb, vec3( 0.0 ) ), vec3( 1.0 / uGamma ) );
	c = ( c - 0.5 ) * uContrast + 0.5;
	float l = dot( c, vec3( 0.2126, 0.7152, 0.0722 ) );
	c = mix( vec3( l ), c, uSaturation );
	c = c * uGain + uLift;
	gl_FragColor = vec4( c, 1.0 );
}
`

const vignetteShader = /* glsl */ `
uniform sampler2D tDiffuse;
uniform float uStrength;
uniform float uSoftness;

varying vec2 vUv;

void main() {
	vec4 t = texture2D( tDiffuse, vUv );
	float r = length( vUv - 0.5 ) / 0.7071;
	float v = smoothstep( 1.0 - uSoftness, 1.0, r ) * uStrength;
	gl_FragColor = vec4( t.rgb * ( 1.0 - v ), t.a );
}
`

const passVertex = /* glsl */ `
varying vec2 vUv;
void main() {
	vUv = uv;
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
`

export function createGradePass(grade: Grade): ShaderPass {
  return new ShaderPass({
    uniforms: {
      tDiffuse: { value: null as THREE.Texture | null },
      uLift: { value: new THREE.Vector3(grade.lift[0], grade.lift[1], grade.lift[2]) },
      uGain: { value: new THREE.Vector3(grade.gain[0], grade.gain[1], grade.gain[2]) },
      uSaturation: { value: grade.saturation },
      uContrast: { value: grade.contrast },
      uGamma: { value: grade.gamma },
    },
    vertexShader: passVertex,
    fragmentShader: gradeShader,
  })
}

/** Soft corner falloff — enough to seat the frame, never a spotlight. */
export function createVignettePass(spec: VignetteSpec = { strength: 0.26, softness: 0.72 }): ShaderPass {
  return new ShaderPass({
    uniforms: {
      tDiffuse: { value: null as THREE.Texture | null },
      uStrength: { value: spec.strength },
      uSoftness: { value: spec.softness },
    },
    vertexShader: passVertex,
    fragmentShader: vignetteShader,
  })
}
