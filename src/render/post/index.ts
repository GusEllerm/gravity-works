// The post stack (PROMPT §8, §5.6): RenderPass → tilt-shift (separable
// quarter-res pair + CoC composite) → soft bloom → color grade (with the
// vignette term and the sRGB encode inside) — one entry point,
// `createPostStack`, used by the render harness (`?post=on`) and — the
// SHELL's play entry `createPlayPostStack` — the game page in `src/boot.ts`.
// Since program T1.2 post is ON by default on the shell (the stage-6 hardware
// note certifies every set at 60 fps post-ON; `?post=off` keeps the raw
// stage-2 path byte-stable).
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

/**
 * The PLAY-camera tilt law (program T1.2, design evaluation §7 #2: “defocus
 * budget for play cameras — the tilt-shift strength saturates at 0.30 m; cap
 * floor→top strength … the room must read while you play it”). The RATIFIED
 * law (art bible §Camera / Feel.md: band ≈ 20 % of frame centred on the car,
 * defocus tied to distance from the set floor) is untouched — what moves is
 * the STRENGTH RAMP the harness default carries: its `topStrength` 1.0 is
 * reached 0.30 m above the floor, and the kitchen release pose sits at
 * ~0.22 m (the L01 launch book-stack top is 0.45 m above the deck, so the
 * ramp saturates there), the build-phase frame rode strength ≈ 1.0 and the
 * room was milked into haze. The play tuning keeps the band and the 0.30 m
 * ramp, and caps the TOP strength at 0.65 — the strength the ratified hero
 * stills actually carry (focus ~0.05 m off the floor on the 0.30 m ramp) —
 * so no play frame is ever softer than the art that was ratified.
 *
 * THE RADIUS MEASUREMENT IS BUFFER-RELATIVE (program T1.2 rig repair): the
 * separable pair runs at QUARTER resolution, so a kernel of N buffer px
 * smears 4N SCREEN px — the harness default's 14 px is ~56 px of frame,
 * which at the wide build-table framing (a large band-outside area at
 * coc→1) milked the whole room. The ratified stills only pay that radius
 * on their close-composed foreground slivers, which is why the look was
 * ratified soft and the play table is not. The play tuning keeps the
 * law's shape and caps the KERNEL so the band-edge maximum on screen is
 * the ~20 px the stills' foreground defocus measures (6 buffer px), with
 * the strength ramp still driving 0.55→0.65 of it.
 */
export const PLAY_TILT_TUNING: Required<TiltShiftTuning> = {
  bandHeight: 0.2,
  maxRadiusPx: 6,
  floorStrength: 0.55,
  topStrength: 0.65,
  strengthRange: 0.3,
}

/** The shell's entry: the review stack under the PLAY tilt law (opts win, so
 *  a future scene can still override one knob). */
export function createPlayPostStack(
  renderer: THREE.WebGLRenderer,
  camera: THREE.Camera,
  opts: PostStackOptions = {},
): PostStack {
  return createPostStack(renderer, camera, { ...PLAY_TILT_TUNING, ...opts })
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
