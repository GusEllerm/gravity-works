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
//                   serialised with a blocking readPixels) into
//                   window.__perfStats() — the frame-cost probe for the
//                   session log
//
// Leak-probe seam (stage-3 review): window.__postCycle(n) builds and
// disposes a full post stack n times on THIS renderer — the exact cycle
// src/boot.ts's rebuild runs per placement — and returns renderer.info
// snapshots before/after plus the per-cycle program counts. It changes no
// pixels: every URL without perf/post set still renders byte-identically.

import * as THREE from 'three'
import { canonicalCamera, isCanonicalShot, setCameras, RENDER_DPR, RENDER_HEIGHT, RENDER_WIDTH, type CanonicalShot } from './cameras.ts'
import { getSceneFactory, sceneNames } from './registry.ts'
import type { SceneEntry } from './registry.ts'
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
  rafMedianMs?: number
  config: { scene: string; shot: string; post: string; quality: string; frames: number }
}

/** One renderer.info snapshot for the leak probe (programs: count of live
 * GPU programs; geometries/textures: renderer.info.memory). */
export interface GpuCounts {
  programs: number
  geometries: number
  textures: number
}

export interface PostCycleReport {
  start: GpuCounts
  end: GpuCounts
  /** programs count after each build→dispose cycle */
  trace: number[]
}

declare global {
  interface Window {
    __sceneReady?: boolean
    __sceneError?: string
    __pixelStats?: () => PixelStats
    __perfStats?: () => PerfStats
    __postCycle?: (cycles: number) => PostCycleReport
    /** Dev probe seam (added for the 2026-10-09 inlay/stripe re-measures, the
     *  scripts under tmp/ that had to run against a patched build): the live
     *  scene graph + camera + the exact render call, so ablations (hide a
     *  mesh, re-render, diff) run against the committed build. Dev harness
     *  only; draws no pixels of its own — every URL still renders identically. */
    __h?: { scene: THREE.Scene; camera: THREE.Camera; render: () => void }
  }
}

/** The fixed clock. Scenes receive this and must not read wall time. */
export const FIXED_TIME = 0

function readPixelStats(renderer: THREE.WebGLRenderer): PixelStats {
  const gl = renderer.getContext()
  const w = gl.drawingBufferWidth
  const h = gl.drawingBufferHeight
  const buf = new Uint8Array(w * h * 4)
  gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, buf)
  let nonBlack = 0
  for (let i = 0; i < buf.length; i += 4) {
    if (buf[i]! + buf[i + 1]! + buf[i + 2]! > 30) nonBlack++
  }
  return { nonBlack, total: w * h }
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
  // perf-probe only: size=960x540 renders at the game canvas resolution so
  // the frame budget can be measured the way the shipped page pays it.
  // Canonical renders never use this — §5.8 fixes 1600×900.
  const sizeParam = /^([0-9]{2,4})x([0-9]{2,4})$/.exec(params.get('size') ?? '')
  const width = sizeParam ? THREE.MathUtils.clamp(Number(sizeParam[1]), 64, 4096) : RENDER_WIDTH
  const height = sizeParam ? THREE.MathUtils.clamp(Number(sizeParam[2]), 64, 4096) : RENDER_HEIGHT

  const factory = getSceneFactory(sceneName)
  if (!factory) throw new Error(`harness: unknown scene "${sceneName}"; have: ${sceneNames().join(', ')}`)

  document.body.style.margin = '0'
  document.body.style.overflow = 'hidden'

  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true })
  renderer.setPixelRatio(RENDER_DPR)
  renderer.setSize(width, height, false)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFShadowMap // 0.186 removed PCFSoft; radius still softens via PCF blur
  const canvas = renderer.domElement
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`
  document.body.appendChild(canvas)

  // the shot list is SOURCED FROM THE SET (`setCameras`): a set that ships
  // its own canonical framings renders with them; until one does, the set
  // rig call falls through to the provisional kitchen rig, unchanged
  const entry = factory({ rig: setCameras(sceneName, shot) ?? canonicalCamera(shot), time: FIXED_TIME, level: params.get('level') ?? undefined })

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
    window.__h = { scene: entry.scene, camera: entry.camera, render: renderFrame }
    window.__pixelStats = () => readPixelStats(renderer)
    window.__postCycle = (cycles: number) => postCycleReport(renderer, entry, cycles)
    if (perfFrames > 0) startPerfProbe(renderer, perfFrames, renderFrame, { scene: sceneName, shot, post: postParam, quality, frames: perfFrames })
    window.__sceneReady = true
  })
}

/**
 * GPU-leak cycle probe: rebuild the whole post stack `cycles` times on the
 * live renderer exactly as the game shell's placement rebuild does (build →
 * one rendered frame → dispose), reporting renderer.info before, after and
 * per cycle. A pass whose dispose leaks shows as counts that never return
 * to the baseline (the stage-3 finding was the grade pass's program).
 *
 * The cycles render an EMPTY scene deliberately. Drawing the real set
 * through the composer makes every SCENE material compile a second,
 * linear-output program variant (render-to-target colour space): those
 * variants are held by the scene's own live materials, not by the stack —
 * one-time, bounded, not a stack leak — and they would sit in the counts
 * as +N residue either way. With a blank scene the ONLY programs the cycles
 * can create are the stack's own, so the assertion is exact: a correct
 * dispose returns every count to its baseline, and any residual program
 * belongs to an undisposed stack object.
 */
function postCycleReport(
  renderer: THREE.WebGLRenderer,
  entry: SceneEntry,
  cycles: number,
): PostCycleReport {
  const snap = (): GpuCounts => ({
    programs: renderer.info.programs?.length ?? -1,
    geometries: renderer.info.memory.geometries,
    textures: renderer.info.memory.textures,
  })
  const start = snap()
  const blank = new THREE.Scene()
  const trace: number[] = []
  for (let i = 0; i < cycles; i++) {
    const stack = createPostStack(renderer, entry.camera, {
      quality: 'high',
      focus: entry.focus ?? [0, 0.05, 0],
      tokens: entry.tokens,
    })
    stack.render(blank)
    stack.dispose()
    trace.push(snap().programs)
  }
  return { start, end: snap(), trace }
}

/**
 * Frame-cost probe: each timed frame ends in a 1-pixel readPixels, which
 * blocks until the whole draw has actually rasterised — the honest full-cost
 * measure under SwiftShader, where gl.finish() alone returns before the GPU
 * process is done (it measures ~0.4 ms for a frame that verifiably costs
 * more). rAF deltas are recorded alongside: in headless they are vsync-
 * paced, so their median is a budget ceiling (like QA's stage-2 mode A),
 * while blockMs is the measured cost.
 */
function startPerfProbe(
  renderer: THREE.WebGLRenderer,
  frames: number,
  renderFrame: () => void,
  config: PerfStats['config'],
): void {
  const gl = renderer.getContext()
  const probe = new Uint8Array(4)
  const samples: number[] = []
  const rafDeltas: number[] = []
  let lastRaf = 0
  const step = (now: number): void => {
    if (lastRaf > 0) rafDeltas.push(now - lastRaf)
    lastRaf = now
    const t0 = performance.now()
    renderFrame()
    gl.readPixels(Math.floor(gl.drawingBufferWidth / 2), Math.floor(gl.drawingBufferHeight / 2), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, probe)
    samples.push(performance.now() - t0)
    if (samples.length < frames) {
      requestAnimationFrame(step)
      return
    }
    const med = (arr: number[]): number => {
      const s = [...arr].sort((a, b) => a - b)
      return s[Math.floor(s.length / 2)]!
    }
    const p95 = (arr: number[]): number => {
      const s = [...arr].sort((a, b) => a - b)
      return s[Math.min(s.length - 1, Math.floor(s.length * 0.95))]!
    }
    window.__perfStats = () => ({
      samples,
      medianMs: med(samples),
      p95Ms: p95(samples),
      rafMedianMs: med(rafDeltas),
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
