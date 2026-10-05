// The post stack (PROMPT §8, §5.6): RenderPass → tilt-shift (separable
// quarter-res pair + CoC composite) → soft bloom → color grade (with the
// vignette term and the sRGB encode inside) — one entry point,
// `createPostStack`, used by the render harness (`?post=on`) and — behind a
// URL flag only — the game shell in `src/boot.ts`. Post is OFF by default
// everywhere: with the flag absent nothing here is even constructed, so
// stage-1/2 renders stay byte-stable.
//
// Quality contract: the toggle **drops post stages before it drops
// resolution** (brief §8) — and in this stack it never drops resolution at
// all: `high` runs everything; `medium` drops bloom (the most machine per
// pixel, the least story) and halves the tilt-shift taps; `low` also drops
// the tilt-shift, leaving only the one always-on grade pass. Dropping
// resolution is reserved for a worse tier that has never been needed.

import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { SET_TOKENS } from '../tokens.ts'
import type { SetTokens } from '../tokens.ts'
import { createGradePass, gradeFromTokens } from './grade.ts'
import type { Grade, VignetteSpec } from './grade.ts'
import { SoftBloomPass } from './bloom.ts'
import { TiltShiftPass, tiltShiftParams } from './tilt-shift.ts'
import type { TiltShiftTuning } from './tilt-shift.ts'

export type PostQuality = 'high' | 'medium' | 'low'

export interface PostStackOptions extends TiltShiftTuning {
  quality?: PostQuality
  /** World-space point the focus band centres on (the car). */
  focus?: THREE.Vector3 | readonly [number, number, number]
  /** Height of the set floor in world y — the defocus-strength datum. */
  floorY?: number
  /** Set whose grade is applied. Default kitchen. */
  tokens?: SetTokens
  grade?: Grade
  vignette?: VignetteSpec
  bloomStrength?: number
}

export interface PostStages {
  tilt: TiltShiftPass
  bloom: SoftBloomPass
  /** The terminal pass: LUT-lite grade with the vignette term inside. */
  grade: import('three/examples/jsm/postprocessing/ShaderPass.js').ShaderPass
}

export interface PostStack {
  composer: EffectComposer
  stages: PostStages
  quality: PostQuality
  setFocus(focus: THREE.Vector3 | readonly [number, number, number]): void
  setQuality(q: PostQuality): void
  /** Draws `scene` through the stack. The cheap no-post path stays renderer.render. */
  render(scene: THREE.Scene): void
  dispose(): void
}

/** The stage graph without a renderer (unit-testable; Node-safe). */
export function buildPostStages(opts: PostStackOptions = {}): PostStages {
  const tokens = opts.tokens ?? SET_TOKENS.kitchen
  return {
    tilt: new TiltShiftPass(),
    bloom: new SoftBloomPass({ strength: opts.bloomStrength ?? 0.18 }),
    grade: createGradePass(opts.grade ?? gradeFromTokens(tokens), opts.vignette),
  }
}

/** The documented drop order, applied once per quality. */
export function applyQuality(stages: PostStages, quality: PostQuality): void {
  stages.bloom.enabled = quality === 'high'
  stages.tilt.enabled = quality !== 'low'
  stages.tilt.setTaps(quality === 'high' ? 6 : 3)
}

export function createPostStack(
  renderer: THREE.WebGLRenderer,
  camera: THREE.Camera,
  opts: PostStackOptions = {},
): PostStack {
  const size = renderer.getDrawingBufferSize(new THREE.Vector2())
  const composer = new EffectComposer(renderer)
  composer.setSize(size.x, size.y)
  const renderPass = new RenderPass(new THREE.Scene(), camera)
  const stages = buildPostStages(opts)
  stages.tilt.setResolution(size.x, size.y)

  composer.addPass(renderPass)
  composer.addPass(stages.tilt)
  composer.addPass(stages.bloom)
  composer.addPass(stages.grade)

  let quality: PostQuality = opts.quality ?? 'high'
  applyQuality(stages, quality)

  let focus =
    opts.focus instanceof THREE.Vector3
      ? opts.focus.clone()
      : new THREE.Vector3(...((opts.focus as readonly [number, number, number] | undefined) ?? [0, 0.05, 0]))
  const floorY = opts.floorY ?? 0

  const stack: PostStack = {
    composer,
    stages,
    get quality() {
      return quality
    },
    setFocus(f) {
      focus = f instanceof THREE.Vector3 ? f : new THREE.Vector3(...f)
    },
    setQuality(q) {
      quality = q
      applyQuality(stages, q)
    },
    render(scene) {
      renderPass.scene = scene
      stages.tilt.setParams(tiltShiftParams(focus, camera, { ...opts, floorY }))
      composer.render()
    },
    dispose() {
      composer.dispose()
      stages.tilt.dispose()
      stages.bloom.dispose()
      // The grade is a plain ShaderPass: dispose releases its material (and
      // the program it holds) plus its fullscreen quad. Without this the
      // terminal pass leaked a program reference every time boot's rebuild
      // cycled the stack (stage-3 review: one per placement with post on).
      stages.grade.dispose()
    },
  }
  return stack
}
