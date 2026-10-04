// Deterministic render harness. Reached with ?harness=1 on any built page:
//   /?harness=1&scene=<name>&shot=<shot>
// The clock is fixed, one requestAnimationFrame drives exactly one render,
// and window.__sceneReady flips true only after that frame. Nothing here
// animates unless a registered scene opts into time.

import * as THREE from 'three'
import { canonicalCamera, isCanonicalShot, RENDER_DPR, RENDER_HEIGHT, RENDER_WIDTH, type CanonicalShot } from './cameras.ts'
import { getSceneFactory, sceneNames } from './registry.ts'

// Scene modules self-register on import. Auto-discovery means adding a scene
// is dropping a file in ./scenes/ — no edit to this file.
import.meta.glob('./scenes/*.ts', { eager: true })

export interface PixelStats {
  nonBlack: number
  total: number
}

declare global {
  interface Window {
    __sceneReady?: boolean
    __sceneError?: string
    __pixelStats?: () => PixelStats
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

  requestAnimationFrame(() => {
    renderer.render(entry.scene, entry.camera)
    window.__pixelStats = () => readPixelStats(renderer)
    window.__sceneReady = true
  })
}

try {
  start()
} catch (err) {
  window.__sceneError = err instanceof Error ? err.message : String(err)
  throw err
}
