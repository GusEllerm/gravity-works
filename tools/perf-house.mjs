#!/usr/bin/env node
/**
 * FURNISHED-DOOR frame cost (Lane F1 proof): hardware-GL cost of the REAL
 * front door at home boot — the parked cross-section with the six mounted
 * sets — against the freeplay spike's budget row (whole house 3.4 ms
 * median / 4.0 p95 serialised @ 960×540, `Reference/Freeplay Feasibility`).
 *
 *   node tools/perf-house.mjs [--no-build] [--port 5130] [--frames 180]
 *
 * Same hardware-GL rule as tools/spike-freehouse-gl.mjs (darwin Metal,
 * abort on software raster). Serialisation here is a `gl.finish()` after
 * every rAF callback — the frame's full CPU+GPU cost, not the vsync-capped
 * rAF delta. `?intro=off&boot=house` settles on the standing home frame
 * (the parked `homePose`, no run, no ghost race) — the frame a stranger
 * sits at, which is what the budget row prices.
 */
import { spawn } from 'node:child_process'
import { chromium } from '@playwright/test'

const argv = process.argv.slice(2)
const opts = {
  build: !argv.includes('--no-build'),
  port: Number(argv.find((a, i) => argv[i - 1] === '--port') ?? 5130),
  frames: Number(argv.find((a, i) => argv[i - 1] === '--frames') ?? 180),
}

const INSTRUMENT = () => {
  window.__frames = []
  let gl = null
  const get = HTMLCanvasElement.prototype.getContext
  HTMLCanvasElement.prototype.getContext = function patched(...a) {
    const c = get.apply(this, a)
    // LAST context wins: the probe canvas above is created first; the
    // app’s renderer creates its own later — finish() must sync THAT one
    if (c && typeof c.finish === 'function') gl = c
    return c
  }
  let renderer = 'unknown'
  try {
    const c = document.createElement('canvas')
    const g = c.getContext('webgl2') ?? c.getContext('webgl')
    const ext = g?.getExtension('WEBGL_debug_renderer_info')
    if (ext && g) renderer = String(g.getParameter(ext.UNMASKED_RENDERER_WEBGL))
  } catch {
    /* counts still work */
  }
  window.__glRenderer = () => renderer
  const raf = window.requestAnimationFrame.bind(window)
  window.__rafOrig = raf // the sampler ticks on the RAW line — untimed
  window.requestAnimationFrame = (cb) =>
    raf((t) => {
      const t0 = performance.now()
      cb(t)
      if (gl) gl.finish()
      window.__frames.push(performance.now() - t0)
    })
}

const SAMPLE = ({ total, keep }) =>
  new Promise((ok) => {
    const tick = () => {
      if (window.__frames.length >= total) return ok({ frames: window.__frames.slice(2, keep + 2), renderer: window.__glRenderer() })
      window.__rafOrig(tick)
    }
    window.__rafOrig(tick)
  })

const med = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)]
const p95 = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length * 0.95)]

if (opts.build) {
  console.log('building (vite build)...')
  await new Promise((ok, no) => {
    const p = spawn('npx', ['vite', 'build'], { stdio: 'inherit' })
    p.on('exit', (c) => (c ? no(new Error(`build failed (${c})`)) : ok()))
  })
}

const server = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(opts.port), '--strictPort'], { stdio: 'ignore' })
process.on('exit', () => server.kill('SIGTERM'))

const SOFTWARE_RE = /swiftshader|llvmpipe/i
const args = process.platform === 'darwin' ? ['--use-angle=metal'] : []

let browser
try {
  const base = `http://127.0.0.1:${opts.port}`
  for (let deadline = Date.now() + 60_000; ; ) {
    try {
      if ((await fetch(base + '/')).ok) break
    } catch {}
    if (Date.now() > deadline) throw new Error('preview server did not come up')
    await new Promise((r) => setTimeout(r, 250))
  }
  browser = await chromium.launch({ headless: true, args })
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } })
  await ctx.addInitScript(INSTRUMENT)
  const page = await ctx.newPage()
  page.setDefaultTimeout(120_000)
  await page.goto(base + '/?boot=house&intro=off', { waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => typeof window.__gwHouseState === 'function', undefined, { timeout: 90_000 })
  const sample = await page.evaluate(SAMPLE, { total: opts.frames + 10, keep: opts.frames - 1 })
  if (SOFTWARE_RE.test(sample.renderer)) throw new Error(`hardware GL requested, page rasterises with ${sample.renderer}`)
  const dt = sample.frames
  console.log(
    `FRONT DOOR home boot, serialised frames @ 960x540\n  frame ms: median ${med(dt).toFixed(2)} p95 ${p95(dt).toFixed(2)} | n ${dt.length} | ${sample.renderer}`,
  )
  console.log('renderer identity confirmed hardware.')
} finally {
  await browser?.close()
  server.kill('SIGTERM')
}
