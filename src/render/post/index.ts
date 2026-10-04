// The post stack (PROMPT §8, §5.6): RenderPass → tilt-shift (two separable
// passes) → soft bloom → color grade → vignette → output. One entry point,
// `createPostStack`, used by the render harness (`?post=on`) and — behind a
// URL flag only — the game shell in `src/boot.ts`. Post is OFF by default
// everywhere: with the flag absent nothing here is even constructed, so
// stage-1/2 renders stay byte-stable.
//
// Quality contract: the toggle **drops post stages before it drops
// resolution** (brief §8) — and in this stack it never drops resolution at
// all: `high` runs everything; `medium` drops bloom (the most machine per
// pixel, the least story) and halves the tilt-shift taps; `low` also drops
// the tilt-shift, leaving only the one-tap grade and vignette. Dropping
// resolution is reserved for a worse tier that has never been needed.

import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { SET_TOKENS } from '../tokens.ts'
import type { SetTokens } from '../tokens.ts'
import { createGradePass, createVignettePass, gradeFromTokens } from './grade.ts'
import type { Grade, VignetteSpec } from './grade.ts'
import { SoftBloomPass } from './bloom.ts'
import { createTiltShiftPasses, tiltShiftParams } from './tilt-shift.ts'
import type { TiltShiftPasses, TiltShiftTuning } from './tilt-shift.ts'
import type { Pass } from 'three/examples/jsm/postprocessing/Pass.js'

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
  tilt: TiltShiftPasses
  bloom: SoftBloomPass
  grade: Pass
  vignette: Pass
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
    tilt: createTiltShiftPasses(),
    bloom: new SoftBloomPass({ strength: opts.bloomStrength ?? 0.18 }),
    grade: createGradePass(opts.grade ?? gradeFromTokens(tokens)),
    vignette: createVignettePass(opts.vignette ?? { strength: 0.26, softness: 0.72 }),
  }
}

/** The documented drop order, applied once per quality. */
export function applyQuality(stages: PostStages, quality: PostQuality): void {
  stages.bloom.enabled = quality === 'high'
  const tiltOn = quality !== 'low'
  for (const p of stages.tilt.passes) p.enabled = tiltOn
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
  composer.addPass(stages.tilt.passes[0])
  composer.addPass(stages.tilt.passes[1])
  composer.addPass(stages.bloom)
  composer.addPass(stages.grade)
  composer.addPass(stages.vignette)
  composer.addPass(new OutputPass())

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
      stages.bloom.dispose()
    },
  }
  return stack
}
