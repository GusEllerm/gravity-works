#!/usr/bin/env node
/**
 * SPIKE (eng-free): hardware-GL frame cost of the whole house vs one room.
 *
 *   node tools/spike-freehouse-gl.mjs [--no-build] [--port 4531]
 *
 * Builds the app, serves `vite preview`, and times rendered frames of the
 * harness scenes with the dev harness's own `perf=N` probe (every frame is
 * serialised by a blocking readPixels — the full CPU+GPU frame cost), while a
 * WebGL command-boundary probe counts draw calls/triangles per frame. Same
 * hardware-GL rule as tools/perf-table.mjs: on darwin, `--use-angle=metal`,
 * and the run ABORTS if the page rasterises with software.
 */
import { spawn } from 'node:child_process'
import { chromium } from '@playwright/test'

const argv = process.argv.slice(2)
const opts = {
  build: !argv.includes('--no-build'),
  port: Number(argv.find((a, i) => argv[i - 1] === '--port') ?? 4531),
  frames: Number(argv.find((a, i) => argv[i - 1] === '--frames') ?? 180),
}

const GL_PROBE = () => {
  const P = { draws: 0, tris: 0, programsCreated: 0, livePrograms: 0 }
  const TRIANGLES = 4
  const STRIP = 5
  const FAN = 6
  const STRIP_ADJ = 10
  const tri = (mode, n) => {
    if (mode === TRIANGLES) return n / 3
    if (mode === STRIP || mode === FAN) return Math.max(0, n - 2)
    if (mode === STRIP_ADJ) return Math.max(0, (n - 4) / 2)
    return 0
  }
  const own = (proto, name) => proto && Object.prototype.hasOwnProperty.call(proto, name)
  const wrapDraw = (proto, name, count) => {
    if (!own(proto, name)) return
    const orig = proto[name]
    proto[name] = function patched(...a) {
      P.draws += 1
      P.tris += tri(a[0], count(a))
      return orig.apply(this, a)
    }
  }
  for (const proto of [globalThis.WebGLRenderingContext?.prototype, globalThis.WebGL2RenderingContext?.prototype]) {
    if (!proto) continue
    wrapDraw(proto, 'drawArrays', (a) => a[2])
    wrapDraw(proto, 'drawElements', (a) => a[1])
    wrapDraw(proto, 'drawArraysInstanced', (a) => a[2] * (a[3] ?? 1))
    wrapDraw(proto, 'drawElementsInstanced', (a) => a[1] * (a[4] ?? 1))
  }
  let renderer = 'unknown'
  try {
    const c = document.createElement('canvas')
    const gl = c.getContext('webgl2') ?? c.getContext('webgl')
    const ext = gl?.getExtension('WEBGL_debug_renderer_info')
    if (ext && gl) renderer = String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL))
  } catch {
    /* counts still work */
  }
  window.__glProbe = () => ({ ...P, renderer })
}

const SAMPLE = ({ total, keep }) =>
  new Promise((ok) => {
    const out = []
    let prev = window.__glProbe()
    let prevT = performance.now()
    const tick = () => {
      const now = performance.now()
      const cur = window.__glProbe()
      out.push({ dt: now - prevT, draws: cur.draws - prev.draws, tris: cur.tris - prev.tris })
      prev = cur
      prevT = now
      if (out.length >= total) return ok({ frames: out.slice(1, keep + 1), renderer: cur.renderer })
      requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })

const med = (xs) => xs.sort((a, b) => a - b)[Math.floor(xs.length / 2)]
const p95 = (xs) => xs.sort((a, b) => a - b)[Math.floor(xs.length * 0.95)]

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
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  await ctx.addInitScript(GL_PROBE)
  const page = await ctx.newPage()
  page.setDefaultTimeout(120_000)

  const scenes = [
    ['one room (kitchen-set, hero)', `/?harness=1&scene=kitchen-set&shot=hero`],
    ['WHOLE HOUSE (freehouse, 6 sets + 6 tracks)', `/?harness=1&scene=freehouse&shot=hero`],
  ]
  console.log(`\nhardware-GL frame cost, ${opts.frames} serialised frames @ 960x540`)
  for (const [label, path] of scenes) {
    await page.goto(base + path + `&perf=${opts.frames}&size=960x540`, { waitUntil: 'domcontentloaded' })
    await page.waitForFunction(() => window.__sceneReady === true, undefined, { timeout: 90_000 })
    const sample = await page.evaluate(SAMPLE, { total: opts.frames + 60, keep: opts.frames - 1 })
    if (SOFTWARE_RE.test(sample.renderer)) throw new Error(`hardware GL requested, page rasterises with ${sample.renderer}`)
    await page.waitForFunction(() => typeof window.__perfStats === 'function', undefined, { timeout: 60_000 })
    const stats = await page.evaluate(() => window.__perfStats())
    const draws = sample.frames.map((f) => f.draws)
    const tris = sample.frames.map((f) => f.tris)
    console.log(
      `${label}\n  render ms: median ${stats.medianMs.toFixed(1)} p95 ${stats.p95Ms.toFixed(1)} | rAF ms: median ${med(sample.frames.map((f) => f.dt)).toFixed(1)} p95 ${p95(sample.frames.map((f) => f.dt)).toFixed(1)} | draws/frame ${med(draws)} | tris/frame ${Math.round(med(tris)).toLocaleString()} | ${sample.renderer}`,
    )
  }
  console.log(`renderer identity confirmed hardware on both measurements.`)
} finally {
  await browser?.close()
  server.kill('SIGTERM')
}
