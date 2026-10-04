// Deterministic render harness. Reached with ?harness=1 on any built page:
//   /?harness=1&scene=<name>&shot=<shot>
// The clock is fixed, one requestAnimationFrame drives exactly one render,
// and window.__sceneReady flips true only after that frame. Nothing here
// animates unless a registered scene opts into time.
//
// Stage 3 post-stack params (all optional, all default OFF so every
// pre-stage-3 URL renders byte-identically):
//   post=on|off     run the frame through src/render/post (default off)
//   quality=high|medium|low   post quality tier (post stages drop before resolution)
//   focus=(x,y,z)   world-space point the tilt-shift band centres on; falls
//                   back to the scene's own SceneEntry.focus, then (0,0.05,0)
//   perf=N          after the ready frame, time N more full renders (each
//                   serialised with gl.finish) into window.__perfStats() —
//                   the frame-cost probe for the session log

import * as THREE from 'three'
import { canonicalCamera, isCanonicalShot, RENDER_DPR, RENDER_HEIGHT, RENDER_WIDTH, type CanonicalShot } from './cameras.ts'
import { getSceneFactory, sceneNames } from './registry.ts'
import { createPostStack, type PostQuality, type PostStack } from '../render/post/index.ts'
import { isPostQuality, parseFocusParam } from './post-params.ts'

// Scene modules self-register on import. Auto-discovery means adding a scene
// is dropping a file in ./scenes/ — no edit to this file.
import.meta.glob('./scenes/*.ts', { eager: true })

export interface PixelStats {
  nonBlack: number
  total: number
}

export interface PerfStats {
  samples: number[]
  medianMs: number
  p95Ms: number
  config: { scene: string; shot: string; post: string; quality: string; frames: number }
}

declare global {
  interface Window {
    __sceneReady?: boolean
    __sceneError?: string
    __pixelStats?: () => PixelStats
    __perfStats?: () => PerfStats
  }
}

/** The fixed clock. Scenes receive this and must not read wall time. */
export const FIXED_TIME = 0

function readPixelStats(renderer: THREE.WebGLRenderer): PixelStats {
  const gl = renderer.getContext()
  const buf = new Uint8Array(RENDER_WIDTH * RENDER_HEIGHT * 4)
  gl.readPixels(0, 0, RENDER_WIDTH, RENDER_HEIGHT, gl.RGBA, gl.UNSIGNED_BYTE, buf)
  let nonBlack = 0
  for (let i = 0; i < buf.length; i += 4) {
    if (buf[i]! + buf[i + 1]! + buf[i + 2]! > 30) nonBlack++
  }
  return { nonBlack, total: RENDER_WIDTH * RENDER_HEIGHT }
}

function start(): void {
  const params = new URLSearchParams(window.location.search)
  const sceneName = params.get('scene') ?? sceneNames()[0]!
  const shotParam = params.get('shot') ?? 'establishing'
  const shot: CanonicalShot = isCanonicalShot(shotParam) ? shotParam : 'establishing'
  const postParam = params.get('post') ?? 'off'
  const quality: PostQuality = isPostQuality(params.get('quality')) ? (params.get('quality') as PostQuality) : 'high'
  const focusFromUrl = parseFocusParam(params.get('focus'))
  const perfFrames = Math.max(0, Math.floor(Number(params.get('perf') ?? '0') || 0))

  const factory = getSceneFactory(sceneName)
  if (!factory) throw new Error(`harness: unknown scene "${sceneName}"; have: ${sceneNames().join(', ')}`)

  document.body.style.margin = '0'
  document.body.style.overflow = 'hidden'

  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true })
  renderer.setPixelRatio(RENDER_DPR)
  renderer.setSize(RENDER_WIDTH, RENDER_HEIGHT, false)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFShadowMap // 0.186 removed PCFSoft; radius still softens via PCF blur
  const canvas = renderer.domElement
  canvas.style.width = `${RENDER_WIDTH}px`
  canvas.style.height = `${RENDER_HEIGHT}px`
  document.body.appendChild(canvas)

  const entry = factory({ rig: canonicalCamera(shot), time: FIXED_TIME })

  // post off by default: with the param absent no post object is ever
  // constructed and the render call below is the stage-1/2 line, unchanged
  let post: PostStack | null = null
  if (postParam !== 'off') {
    post = createPostStack(renderer, entry.camera, {
      quality,
      focus: focusFromUrl ?? entry.focus ?? [0, 0.05, 0],
      tokens: entry.tokens,
    })
  }
  const renderFrame = (): void => {
    if (post) post.render(entry.scene)
    else renderer.render(entry.scene, entry.camera)
  }

  requestAnimationFrame(() => {
    renderFrame()
    window.__pixelStats = () => readPixelStats(renderer)
    if (perfFrames > 0) startPerfProbe(renderer, perfFrames, renderFrame, { scene: sceneName, shot, post: postParam, quality, frames: perfFrames })
    window.__sceneReady = true
  })
}

/**
 * Frame-cost probe: each timed frame ends in gl.finish() so the number is
 * the full draw's wall cost, not a submission timestamp — the honest measure
 * under SwiftShader, at the cost of removing pipelining slack (a hardware
 * GPU can only look better than this).
 */
function startPerfProbe(
  renderer: THREE.WebGLRenderer,
  frames: number,
  renderFrame: () => void,
  config: PerfStats['config'],
): void {
  const gl = renderer.getContext()
  const samples: number[] = []
  const step = (): void => {
    const t0 = performance.now()
    renderFrame()
    gl.finish()
    samples.push(performance.now() - t0)
    if (samples.length < frames) {
      requestAnimationFrame(step)
      return
    }
    const sorted = [...samples].sort((a, b) => a - b)
    window.__perfStats = () => ({
      samples,
      medianMs: sorted[Math.floor(sorted.length / 2)]!,
      p95Ms: sorted[Math.floor(sorted.length * 0.95)] ?? sorted[sorted.length - 1]!,
      config,
    })
  }
  requestAnimationFrame(step)
}

try {
  start()
} catch (err) {
  window.__sceneError = err instanceof Error ? err.message : String(err)
  throw err
}
