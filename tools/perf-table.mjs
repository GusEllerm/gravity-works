#!/usr/bin/env node
/**
 * Stage 6 per-set frame-time + GPU-cost harness ("every set at 60 fps on the
 * reference machine", brief §10 Stage 6; the frame gate itself is §2.4 and
 * `docs/vault/Reference/Performance Baselines.md`).
 *
 *   node tools/perf-table.mjs                       # build, probe, verdict table (hardware GL)
 *   node tools/perf-table.mjs --gl software         # the CI-truth column (SwiftShader)
 *   node tools/perf-table.mjs --no-build --port 4431
 *   node tools/perf-table.mjs --probe-only          # cost probe on every rung, no 5 s runs
 *
 * Two phases, both on the REAL GAME SHELL (`/?level=<id>&build=par`), never a
 * still-life harness scene:
 *
 * 1. COST PROBE — every campaign rung, ~`--probe-frames` rendered frames each.
 *    Reports GPU cost per displayed frame (draw calls, triangles, live
 *    programs) so the "busiest hero level" of a set is MEASURED, not assumed.
 *    Ranking key: draw calls per frame, triangles as the tiebreak — the two
 *    costs a laptop GPU actually pays for, in that order of importance here
 *    (this suite's geometry is trivial; the sets' prop count is the load).
 *
 * 2. VERDICT — the picked rung per set, ≥5 s of SIMULATED time with the World
 *    stepping and the real rAF loop rendering (relaunch at every terminal
 *    status, exactly the stage-2/stage-3 measurement-A pattern). rAF deltas
 *    give median + p95; the GL probe gives draws/tris/programs per frame.
 *    `--post both` runs each rung with the post stack off (the shipped page)
 *    and on (the stage-3 bar, quality `high`, the worst tier).
 *
 * GPU counts are taken at the WebGL command boundary by an init-script probe
 * (wrapping drawArrays/drawElements(+instanced) and createProgram/deleteProgram
 * on both WebGL prototypes). This is deliberately NOT `renderer.info`: the game
 * page exposes no renderer seam and adding one to `src/boot.ts` for a one-off
 * audit was the worse trade (boot.ts is anchored by a dozen livedocs notes).
 * Three's `info.render.calls/triangles` count the same calls one level up, so
 * the numbers are equivalent, and the boundary probe also sees the post stack's
 * full-screen passes, which is the honest per-frame cost.
 *
 * GL truth (stage-3 CI-truth rule, `tests/e2e/perf-stage3.spec.ts`): the
 * VERDICT numbers are hardware GL only — on darwin Chromium is launched with
 * `--use-angle=metal` and the run ABORTS if the page reports a software
 * renderer, so a SwiftShader frame can never masquerade as a hardware number.
 * `--gl software` is the CI-truth context column (SwiftShader, i.e. what
 * Linux CI actually rasterises) and is always labelled as such.
 */
import { spawn } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import process from 'node:process'
import { chromium } from '@playwright/test'

// ---- args -------------------------------------------------------------------

function parseArgs(argv) {
  const o = {
    build: true,
    port: 4430,
    gl: 'hardware', // hardware | software
    post: 'both', // off | on | both
    probeFrames: 60,
    seconds: 5,
    wallCapMs: 180_000,
    headroom: 120,
    probeOnly: false,
    out: 'tmp/stage6-perf/table.json',
    levels: null,
    sets: null,
  }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    const next = () => {
      const v = argv[++i]
      if (v === undefined) throw new Error(`${a} needs a value`)
      return v
    }
    if (a === '--no-build') o.build = false
    else if (a === '--probe-only') o.probeOnly = true
    else if (a === '--port') o.port = Number.parseInt(next(), 10)
    else if (a === '--gl') o.gl = next()
    else if (a === '--post') o.post = next()
    else if (a === '--probe-frames') o.probeFrames = Number.parseInt(next(), 10)
    else if (a === '--seconds') o.seconds = Number.parseFloat(next())
    else if (a === '--headroom') o.headroom = Number.parseInt(next(), 10)
    else if (a === '--out') o.out = next()
    else if (a === '--levels') o.levels = next().split(',')
    else if (a === '--sets') o.sets = next().split(',')
    else throw new Error(`unknown flag: ${a}`)
  }
  if (!['hardware', 'software'].includes(o.gl)) throw new Error('--gl hardware|software')
  if (!['off', 'on', 'both'].includes(o.post)) throw new Error('--post off|on|both')
  return o
}

// ---- level table (derived from the campaign ladder, never hand-listed) ------

/** Every campaign rung with its set and its tray total, read from the level
 *  modules themselves (the same source `npm run pars` and the ladder docs
 *  derive from, so this harness cannot drift from the registry). */
async function ladder() {
  const { CAMPAIGN_LADDER } = await import('../src/world/campaign.ts')
  const rows = []
  for (const id of CAMPAIGN_LADDER) {
    const mod = await import(`../src/world/levels/${id}.level.ts`)
    const level = Object.values(mod).find((v) => v && typeof v === 'object' && v.id === id)
    const trayTotal = level.tray
      ? Object.values(level.tray).reduce((a, b) => a + b, 0)
      : 0
    rows.push({
      id,
      set: level.set ?? '?',
      trayTotal,
      fixtures: (level.fixtures ?? []).length,
      buildPieces: level.parBuild ? level.parBuild().pieces.length : level.placeholderBuild().pieces.length,
    })
  }
  return rows
}

// ---- page-side instrumentation ---------------------------------------------

/** WebGL command-boundary counters; see the header for why this is not
 *  renderer.info. Installed before any app script runs. */
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
    return 0 // lines/points cost no triangles
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
    if (own(proto, 'createProgram')) {
      const orig = proto.createProgram
      proto.createProgram = function patched(...a) {
        P.programsCreated += 1
        P.livePrograms += 1
        return orig.apply(this, a)
      }
    }
    if (own(proto, 'deleteProgram')) {
      const orig = proto.deleteProgram
      proto.deleteProgram = function patched(...a) {
        P.livePrograms -= 1
        return orig.apply(this, a)
      }
    }
  }
  let renderer = 'unknown'
  try {
    const c = document.createElement('canvas')
    const gl = c.getContext('webgl2') ?? c.getContext('webgl')
    const ext = gl?.getExtension('WEBGL_debug_renderer_info')
    if (ext && gl) renderer = String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL))
  } catch {
    /* the probe still counts without the identity */
  }
  // remember every WebGL context so the headroom probe can serialise the
  // GAME one (the id is stamped after `new WebGLRenderer`, so the match has
  // to happen at query time, not at getContext time)
  const all = []
  const getCtx = HTMLCanvasElement.prototype.getContext
  HTMLCanvasElement.prototype.getContext = function patched(...a) {
    const ctx = getCtx.apply(this, a)
    if (ctx && typeof ctx.readPixels === 'function') all.push(ctx)
    return ctx
  }
  window.__glCtx = () => all.find((c) => c.canvas?.id === 'gw-canvas') ?? null
  window.__glProbe = () => ({ ...P, renderer })
}

/** The shell's ready line (the same claim `tests/e2e/perf.spec.ts` waits on). */
const READY = () => /ready/.test(document.querySelector('#gw-status')?.textContent ?? '')

/** Rendered-frame cost probe: N rAF frames, no relaunch logic — the geometry
 *  is static between runs, so a steady-state window is what we want. */
const PROBE = (frames) =>
  new Promise((ok) => {
    const out = []
    let prev = window.__glProbe()
    let prevT = performance.now()
    const tick = () => {
      const now = performance.now()
      const cur = window.__glProbe()
      out.push({ dt: now - prevT, draws: cur.draws - prev.draws, tris: cur.tris - prev.tris, live: cur.livePrograms })
      prev = cur
      prevT = now
      if (out.length >= frames) return ok(out.slice(1)) // drop the warm-up frame
      requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })

/** The stage-2/3 measurement-A loop: step + render for >= minSim SIMULATED
 *  seconds, relaunching at each terminal status, sampling rAF deltas and the
 *  GL counters on the same tick. */
const VERDICT = ({ minSim, wallCap, every }) =>
  new Promise((ok) => {
    const status = document.querySelector('#gw-status')
    const launch = document.querySelector('#gw-launch')
    const deltas = []
    let prev = performance.now()
    let glPrev = window.__glProbe()
    let glWindow = { draws: 0, tris: 0, frames: 0 }
    let glTotal = { draws: 0, tris: 0, frames: 0 }
    let liveMax = 0
    let simTotal = 0
    let prevT = 0
    let relaunches = 0
    let framesSinceSample = 0
    const t0 = performance.now()
    const tick = (now) => {
      deltas.push(now - prev)
      prev = now
      const cur = window.__glProbe()
      glWindow.draws += cur.draws - glPrev.draws
      glWindow.tris += cur.tris - glPrev.tris
      glWindow.frames += 1
      glPrev = cur
      liveMax = Math.max(liveMax, cur.livePrograms)
      const text = status?.textContent ?? ''
      const m = text.match(/([\d.]+)s/)
      if (m) {
        const t = parseFloat(m[1])
        simTotal += t >= prevT ? t - prevT : t
        prevT = t
      }
      if (/finished|fell|stalled|timed out/.test(text)) {
        launch?.click()
        relaunches += 1
        prevT = 0
      }
      if (++framesSinceSample >= every) {
        glTotal.draws += glWindow.draws
        glTotal.tris += glWindow.tris
        glTotal.frames += glWindow.frames
        glWindow = { draws: 0, tris: 0, frames: 0 }
        framesSinceSample = 0
      }
      if (simTotal >= minSim || now - t0 > wallCap) {
        ok({
          deltas,
          simTotal,
          relaunches,
          wall: performance.now() - t0,
          draws: glTotal.draws + glWindow.draws,
          tris: glTotal.tris + glWindow.tris,
          frames: glTotal.frames + glWindow.frames,
          liveProgramsMax: liveMax,
          renderer: cur.renderer,
        })
        return
      }
      requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
    launch?.click()
  })

/** Unpaced frame COST: N frames, each ended by a 1-pixel readPixels on the
 *  game's own context. rAF on a 60 Hz display PINS the honest delta to
 *  16.67 ms however cheap the frame is, so the pinned median cannot show its
 *  own headroom. Sampling from the rAF timestamp (the frame's start) to the
 *  end of a blocking readPixels measures the work the frame itself costs —
 *  the app's own rAF callback has already issued every draw by the time this
 *  callback runs, and the readPixels waits for the GPU to drain (the
 *  stage-3 measurement-B trick, one call instead of a whole render).
 *  Reported as context beside the gated median, never as the gate. */
const HEADROOM = (frames) =>
  new Promise((ok) => {
    const gl = window.__glCtx()
    const px = new Uint8Array(4)
    const out = []
    const tick = (now) => {
      if (gl) gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px) // the sync point
      out.push(performance.now() - now)
      if (out.length >= frames) return ok(out.slice(1))
      requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })

// ---- stats -----------------------------------------------------------------

function stats(values) {
  const s = [...values].sort((a, b) => a - b)
  const q = (p) => s[Math.min(s.length - 1, Math.floor(p * s.length))]
  return {
    count: s.length,
    median: q(0.5),
    p95: q(0.95),
    mean: values.reduce((a, b) => a + b, 0) / values.length,
    max: s[s.length - 1],
  }
}
const ms = (n) => n.toFixed(2)
const kfmt = (n) => (n / 1000).toFixed(1) + 'k'

// ---- main ------------------------------------------------------------------

const opts = parseArgs(process.argv.slice(2))
const rows = await ladder()
const wanted = opts.levels ? new Set(opts.levels) : null
const wantedSets = opts.sets ? new Set(opts.sets) : null
const levels = rows.filter((r) => (wanted ? wanted.has(r.id) : true) && (wantedSets ? wantedSets.has(r.set) : true))

if (opts.build) {
  const run = (cmd, args) =>
    new Promise((ok, fail) => {
      const p = spawn(cmd, args, { stdio: 'inherit' })
      p.on('error', fail)
      p.on('exit', (c) => (c === 0 ? ok() : fail(new Error(`${cmd} exited ${c}`))))
    })
  await run('npm', ['run', 'build'])
}

const server = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(opts.port), '--strictPort'], {
  stdio: 'ignore',
})
const stop = () => server.kill('SIGTERM')
process.on('exit', stop)

const SOFTWARE_RE = /swiftshader|llvmpipe/i
const args = opts.gl === 'hardware' && process.platform === 'darwin' ? ['--use-angle=metal'] : ['--use-angle=swiftshader']

let browser
try {
  const base = `http://127.0.0.1:${opts.port}`
  for (let deadline = Date.now() + 60_000; ; ) {
    try {
      if ((await fetch(base + '/')).ok) break
    } catch {
      /* not up */
    }
    if (Date.now() > deadline) throw new Error('preview server did not come up')
    await new Promise((r) => setTimeout(r, 250))
  }

  browser = await chromium.launch({ headless: true, args })
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  await ctx.addInitScript(GL_PROBE)
  const page = await ctx.newPage()
  page.setDefaultTimeout(120_000)
  let errors = []
  page.on('pageerror', (e) => errors.push(String(e)))

  const open = async (levelId, post) => {
    const url = `${base}/?level=${levelId}&build=par` + (post === 'on' ? '&post=on' : '')
    errors = []
    await page.goto(url, { waitUntil: 'domcontentloaded' })
    await page.waitForFunction(READY, undefined, { timeout: 90_000 })
    return errors
  }

  // ---- phase 1: cost probe over every rung ----
  console.log(`\nGL mode: ${opts.gl} — waiting for renderer identity...`)
  const probe = []
  for (const lv of levels) {
    const errs = await open(lv.id, 'off')
    if (errs.length) console.log(`  ! pageerror on ${lv.id}: ${errs.join(' | ')}`)
    const renderer = await page.evaluate(() => window.__glProbe().renderer)
    if (opts.gl === 'hardware' && SOFTWARE_RE.test(renderer)) {
      throw new Error(`verdict run requested hardware GL but the page rasterises with ${renderer}`)
    }
    const samples = await page.evaluate(PROBE, opts.probeFrames)
    const draws = samples.reduce((a, s) => a + s.draws, 0) / samples.length
    const tris = samples.reduce((a, s) => a + s.tris, 0) / samples.length
    const live = Math.max(...samples.map((s) => s.live))
    const ft = stats(samples.map((s) => s.dt))
    probe.push({ ...lv, draws: draws, tris: tris, programs: live, frameMedian: ft.median, renderer, errors: errs })
    console.log(
      `  probe ${lv.id.padEnd(11)} set=${lv.set.padEnd(8)} tray=${String(lv.trayTotal).padStart(2)} ` +
        `draws=${draws.toFixed(1).padStart(6)} tris=${kfmt(tris).padStart(7)} progs=${String(live).padStart(3)} ` +
        `frame=${ms(ft.median).padStart(6)}ms`,
    )
  }

  // ---- phase 2: pick the busiest rung per set, run the verdict ----
  const bySet = new Map()
  for (const p of probe) {
    if (!bySet.has(p.set)) bySet.set(p.set, [])
    bySet.get(p.set).push(p)
  }
  const sets = [...bySet.entries()]

  const verdicts = []
  if (!opts.probeOnly) {
    for (const [setName, list] of sets) {
      const hero = [...list].sort((a, b) => b.draws - a.draws || b.tris - a.tris)[0]
      for (const post of opts.post === 'both' ? ['off', 'on'] : [opts.post]) {
        const errs = await open(hero.id, post)
        const r = await page.evaluate(VERDICT, {
          minSim: opts.seconds,
          wallCap: opts.wallCapMs,
          every: 30,
        })
        const s = stats(r.deltas)
        const keepup = r.simTotal / (r.wall / 1000)
        const head = stats(await page.evaluate(HEADROOM, opts.headroom))
        const v = {
          set: setName,
          level: hero.id,
          post,
          median: s.median,
          p95: s.p95,
          max: s.max,
          frames: s.count,
          drops: r.deltas.filter((d) => d > 20).length,
          headroomMedian: head.median,
          headroomP95: head.p95,
          simTotal: r.simTotal,
          wall: r.wall,
          keepup,
          relaunches: r.relaunches,
          draws: r.draws / r.frames,
          tris: r.tris / r.frames,
          programs: r.liveProgramsMax,
          renderer: r.renderer,
          errors: errs,
        }
        verdicts.push(v)
        console.log(
          `  VERDICT ${setName.padEnd(8)} ${hero.id.padEnd(11)} post=${post.padEnd(3)} ` +
            `median=${ms(s.median)}ms p95=${ms(s.p95)}ms max=${ms(s.max)}ms drops=${v.drops} cost=${ms(head.median)}ms ` +
            `draws=${v.draws.toFixed(1)} tris=${kfmt(v.tris)} progs=${v.programs} ` +
            `keepup=${keepup.toFixed(2)} relaunches=${r.relaunches} frames=${s.count}`,
        )
      }
    }
  }

  // ---- report ----
  console.log(`\nrenderer: ${probe[0]?.renderer ?? 'n/a'}   mode: ${opts.gl}`)
  console.log('\n| set | hero rung (measured) | tray | draws/f | tris/f | progs | rung spread (draws) |')
  console.log('|---|---|---:|---:|---:|---:|---|')
  for (const [name, list] of sets) {
    const hero = [...list].sort((a, b) => b.draws - a.draws || b.tris - a.tris)[0]
    const lo = Math.min(...list.map((p) => p.draws))
    console.log(
      `| ${name} | \`${hero.id}\` | ${hero.trayTotal} | ${hero.draws.toFixed(1)} | ${kfmt(hero.tris)} | ` +
        `${hero.programs} | ${lo.toFixed(1)}-${hero.draws.toFixed(1)} across ${list.length} |`,
    )
  }
  if (verdicts.length) {
    console.log('\n| set | level | post | median | p95 | drops | unpaced cost | draws/f | tris/f | progs | keepup |')
    console.log('|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|')
    for (const v of verdicts) {
      console.log(
        `| ${v.set} | \`${v.level}\` | ${v.post} | ${ms(v.median)} ms | ${ms(v.p95)} ms | ${v.drops} | ` +
          `${ms(v.headroomMedian)} ms | ${v.draws.toFixed(1)} | ${kfmt(v.tris)} | ${v.programs} | ${v.keepup.toFixed(2)} |`,
      )
    }
  }

  const outPath = resolve(process.cwd(), opts.out)
  await mkdir(dirname(outPath), { recursive: true })
  await writeFile(
    outPath,
    JSON.stringify({ generated: new Date().toISOString(), gl: opts.gl, renderer: probe[0]?.renderer, probe, verdicts }, null, 2),
  )
  console.log(`\nwrote ${opts.out}`)
} finally {
  if (browser) await browser.close().catch(() => {})
  stop()
}
