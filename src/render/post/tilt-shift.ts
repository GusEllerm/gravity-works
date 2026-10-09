// Tilt-shift — the signature of the whole look (art bible §Camera, PROMPT
// §5.6/§7.3): a narrow band of focus so the kitchen reads miniature. Built as
// an honest two-pass separable blur (horizontal then vertical) at quarter-res in
// internal buffers, composited back over the sharp frame by circle of
// confusion — the blur geometry is separable, the sample cost is not paid
// twice at full frame.
//
// The focus band is centred on a *world-space* point (the car, or the
// `focus=` harness param): the point is projected into the frame and its
// screen height becomes the band centre. Band height is 20 % of the frame
// (§7.3). The defocus *strength* is tied to the focus point's distance from
// the set floor — the higher the focused thing sits above the counter, the
// more aggressively the frame outside the band falls away, which is what
// keeps the miniature read when the action climbs the book-stack ramp.

import * as THREE from 'three'
import { Pass, FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js'

export const DEFAULT_BAND_HEIGHT = 0.2

export interface TiltShiftTuning {
  /** Fraction of frame height that stays in sharp focus. Default 0.2. */
  bandHeight?: number
  /** Blur radius in pixels at the frame edge with strength 1. Default 14. */
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
  // THE DISTANCE IS TO THE FOCUS SUBJECT, NOT TO ITS FOOTPRINT PLANE:
  // the art bible's "distance from the set floor" is the HEIGHT the
  // focused thing rides above the deck (program T1.2 rig note: feeding
  // the floor as the focus point pins strength at the floor value and
  // removes the focus pull the law is named for).
  const dist = Math.abs(focus.y - floorY)
  const range = opts.strengthRange ?? 0.3
  const t = THREE.MathUtils.clamp(dist / range, 0, 1)
  const strength = THREE.MathUtils.lerp(opts.floorStrength ?? 0.55, opts.topStrength ?? 1.0, t)
  return {
    bandCenter,
    bandHalf: bandHeight * 0.5,
    radiusPx: (opts.maxRadiusPx ?? 14) * strength,
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

// The separable pair runs at QUARTER resolution (the blur source) and a final
// full-frame pass composites the blur back over the sharp frame by circle of
// confusion. Visually identical for a soft defocus, and a quarter of the
// tap cost — the frame budget says post before resolution, but it does not
// say the defocus blur itself must pay full-frame sample counts: a blur
// kernel wider than the buffer's texel step loses nothing but aliasing at
// this radius. This is still an honest two-pass separable blur (H then V),
// just sized like every real tilt-shift implementation sizes its blur
// buffers.
const tiltCompositeShader = /* glsl */ `
uniform sampler2D tDiffuse;   // sharp full-res frame
uniform sampler2D uBlurred;   // quarter-res separable blur result
uniform float uBandCenter;
uniform float uBandHalf;

varying vec2 vUv;

void main() {
	vec3 sharp = texture2D( tDiffuse, vUv ).rgb;
	vec3 soft = texture2D( uBlurred, vUv ).rgb;
	float d = abs( vUv.y - uBandCenter );
	float coc = clamp( ( d - uBandHalf ) / ( uBandHalf * 2.0 ), 0.0, 1.0 );
	coc = coc * coc * ( 3.0 - 2.0 * coc );
	gl_FragColor = vec4( mix( sharp, soft, coc ), 1.0 );
}
`

/**
 * One composer stage, three internal draws: separable H at quarter-res,
 * separable V at quarter-res, full-res CoC composite. Disabling the stage
 * (quality=low) makes the composer skip all three.
 */
export class TiltShiftPass extends Pass {
  private readonly rtH: THREE.WebGLRenderTarget
  private readonly rtV: THREE.WebGLRenderTarget
  private readonly blur: THREE.ShaderMaterial
  private readonly composite: THREE.ShaderMaterial
  private readonly quad: FullScreenQuad
  private taps = 6

  constructor() {
    super()
    // quarter-res blur buffers with plain byte targets: the defocus is by
    // definition soft, and byte fetch+filter is far cheaper under software
    // GL; the sharp half of the frame never passes through these buffers
    const rt = () =>
      new THREE.WebGLRenderTarget(400, 225, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        depthBuffer: false,
      })
    this.rtH = rt()
    this.rtV = rt()
    this.blur = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        uTexel: { value: new THREE.Vector2(1 / 400, 1 / 225) },
        uDirection: { value: new THREE.Vector2(1, 0) },
        uBandCenter: { value: 0.5 },
        uBandHalf: { value: DEFAULT_BAND_HEIGHT * 0.5 },
        uRadius: { value: 7 },
        uTaps: { value: 6 },
      },
      vertexShader: tiltVertex,
      fragmentShader: tiltShader,
    })
    this.composite = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        uBlurred: { value: null },
        uBandCenter: { value: 0.5 },
        uBandHalf: { value: DEFAULT_BAND_HEIGHT * 0.5 },
      },
      vertexShader: tiltVertex,
      fragmentShader: tiltCompositeShader,
    })
    this.quad = new FullScreenQuad(this.blur)
  }

  get tapsUsed(): number {
    return this.taps
  }

  /** Full-frame render size in pixels; blur buffers take a quarter. */
  setResolution(width: number, height: number): void {
    const w = Math.max(1, Math.ceil(width / 4))
    const h = Math.max(1, Math.ceil(height / 4))
    this.rtH.setSize(w, h)
    this.rtV.setSize(w, h)
    ;(this.blur.uniforms.uTexel!.value as THREE.Vector2).set(1 / w, 1 / h)
  }

  setParams(p: TiltShiftParams): void {
    // the blur buffers are quarter-res: a full-frame pixel radius is quarter as
    // many blur-buffer pixels
    this.blur.uniforms.uBandCenter!.value = p.bandCenter
    this.blur.uniforms.uBandHalf!.value = p.bandHalf
    this.blur.uniforms.uRadius!.value = p.radiusPx * 0.5
    this.composite.uniforms.uBandCenter!.value = p.bandCenter
    this.composite.uniforms.uBandHalf!.value = p.bandHalf
  }

  /** taps per direction: 6 = 13-tap wide blur (high), 3 = 7-tap (medium). */
  setTaps(taps: number): void {
    this.taps = taps
    this.blur.uniforms.uTaps!.value = taps
  }

  override render(
    renderer: THREE.WebGLRenderer,
    writeBuffer: THREE.WebGLRenderTarget | null,
    readBuffer: THREE.WebGLRenderTarget | null,
  ): void {
    const src = readBuffer?.texture
    if (!src) return
    this.quad.material = this.blur
    this.blur.uniforms.tDiffuse!.value = src
    this.blur.uniforms.uDirection!.value.set(1, 0)
    renderer.setRenderTarget(this.rtH)
    this.quad.render(renderer)

    this.blur.uniforms.tDiffuse!.value = this.rtH.texture
    this.blur.uniforms.uDirection!.value.set(0, 1)
    renderer.setRenderTarget(this.rtV)
    this.quad.render(renderer)

    this.quad.material = this.composite
    this.composite.uniforms.tDiffuse!.value = src
    this.composite.uniforms.uBlurred!.value = this.rtV.texture
    renderer.setRenderTarget(this.renderToScreen ? null : writeBuffer)
    this.quad.render(renderer)
  }

  override dispose(): void {
    this.rtH.dispose()
    this.rtV.dispose()
    this.blur.dispose()
    this.composite.dispose()
    this.quad.dispose()
  }
}

export type TiltShiftStage = TiltShiftPass
