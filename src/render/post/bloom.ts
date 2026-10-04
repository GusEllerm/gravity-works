// Soft bloom, capped at the art bible's "soft" ceiling — the never-list
// forbids bloom above it, so the ceiling is a constant in the code, not a
// convention: any requested strength above `BLOOM_SOFT_CEILING` is clamped,
// and the clamp is unit-tested.
//
// Deliberately not UnrealBloomPass: its mip pyramid is far more machine than
// a set of soft highlights needs, and the frame budget says post before
// pixels. This is the cheap honest version — a threshold downsample to a
// quarter-res buffer, one separable blur pair at that tiny size, one
// full-frame additive composite. Four draws, two of them at 1/16 the pixels.

import * as THREE from 'three'
import { Pass, FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js'

/** The never-list ceiling: bloom stays soft. Enforced, not advised. */
export const BLOOM_SOFT_CEILING = 0.22

export interface SoftBloomOptions {
  /** Requested bloom strength — clamped to BLOOM_SOFT_CEILING. */
  strength?: number
  /** Linear-space luma where the glow starts. */
  threshold?: number
  knee?: number
}

const quadVertex = /* glsl */ `
varying vec2 vUv;
void main() {
	vUv = uv;
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
`

const brightShader = /* glsl */ `
uniform sampler2D tDiffuse;
uniform float uThreshold;
uniform float uKnee;

varying vec2 vUv;

void main() {
	vec3 c = texture2D( tDiffuse, vUv ).rgb;
	float l = dot( c, vec3( 0.2126, 0.7152, 0.0722 ) );
	float w = smoothstep( uThreshold, uThreshold + uKnee, l );
	gl_FragColor = vec4( c * w, 1.0 );
}
`

const blurShader = /* glsl */ `
uniform sampler2D tDiffuse;
uniform vec2 uDirection; // picks the separable axis, in texels

varying vec2 vUv;

void main() {
	vec2 o = uDirection;
	vec4 s = texture2D( tDiffuse, vUv ) * 0.227027;
	s += ( texture2D( tDiffuse, vUv + o * 1.384615 ) + texture2D( tDiffuse, vUv - o * 1.384615 ) ) * 0.3162162;
	s += ( texture2D( tDiffuse, vUv + o * 3.230769 ) + texture2D( tDiffuse, vUv - o * 3.230769 ) ) * 0.0702702;
	gl_FragColor = s;
}
`

const compositeShader = /* glsl */ `
uniform sampler2D tDiffuse;
uniform sampler2D uBloom;
uniform float uStrength;

varying vec2 vUv;

void main() {
	vec3 base = texture2D( tDiffuse, vUv ).rgb;
	vec3 glow = texture2D( uBloom, vUv ).rgb;
	gl_FragColor = vec4( base + glow * uStrength, 1.0 );
}
`

/**
 * A single `Pass` the composer can enable/disable as one stage; when
 * disabled the composer skips it entirely (quality drops post stages before
 * resolution, and this is the first one it drops).
 */
export class SoftBloomPass extends Pass {
  private readonly rtA: THREE.WebGLRenderTarget
  private readonly rtB: THREE.WebGLRenderTarget
  private readonly bright: THREE.ShaderMaterial
  private readonly blur: THREE.ShaderMaterial
  private readonly composite: THREE.ShaderMaterial
  private readonly quad: FullScreenQuad
  readonly strength: number

  constructor(opts: SoftBloomOptions = {}) {
    super()
    this.strength = Math.min(opts.strength ?? 0.18, BLOOM_SOFT_CEILING)
    const rt = () =>
      new THREE.WebGLRenderTarget(400, 225, {
        type: THREE.HalfFloatType,
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        depthBuffer: false,
      })
    this.rtA = rt()
    this.rtB = rt()
    this.bright = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        uThreshold: { value: opts.threshold ?? 0.72 },
        uKnee: { value: opts.knee ?? 0.25 },
      },
      vertexShader: quadVertex,
      fragmentShader: brightShader,
    })
    this.blur = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        uDirection: { value: new THREE.Vector2() },
      },
      vertexShader: quadVertex,
      fragmentShader: blurShader,
    })
    this.composite = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        uBloom: { value: null },
        uStrength: { value: this.strength },
      },
      vertexShader: quadVertex,
      fragmentShader: compositeShader,
    })
    this.quad = new FullScreenQuad(this.bright)
  }

  override setSize(width: number, height: number): void {
    const w = Math.max(1, Math.ceil(width / 4))
    const h = Math.max(1, Math.ceil(height / 4))
    this.rtA.setSize(w, h)
    this.rtB.setSize(w, h)
  }

  override render(
    renderer: THREE.WebGLRenderer,
    writeBuffer: THREE.WebGLRenderTarget | null,
    readBuffer: THREE.WebGLRenderTarget | null,
  ): void {
    const src = readBuffer?.texture
    if (!src) return
    const texelX = 1 / this.rtA.width
    const texelY = 1 / this.rtA.height

    this.quad.material = this.bright
    this.bright.uniforms.tDiffuse!.value = src
    renderer.setRenderTarget(this.rtA)
    this.quad.render(renderer)

    this.quad.material = this.blur
    this.blur.uniforms.tDiffuse!.value = this.rtA.texture
    this.blur.uniforms.uDirection!.value.set(texelX, 0)
    renderer.setRenderTarget(this.rtB)
    this.quad.render(renderer)

    this.blur.uniforms.tDiffuse!.value = this.rtB.texture
    this.blur.uniforms.uDirection!.value.set(0, texelY)
    renderer.setRenderTarget(this.rtA)
    this.quad.render(renderer)

    this.quad.material = this.composite
    this.composite.uniforms.tDiffuse!.value = src
    this.composite.uniforms.uBloom!.value = this.rtA.texture
    renderer.setRenderTarget(this.renderToScreen ? null : writeBuffer)
    this.quad.render(renderer)
  }

  override dispose(): void {
    this.rtA.dispose()
    this.rtB.dispose()
    this.bright.dispose()
    this.blur.dispose()
    this.composite.dispose()
    this.quad.dispose()
  }
}
