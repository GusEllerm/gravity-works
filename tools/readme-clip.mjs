#!/usr/bin/env node
// README clip: a REAL L02 par run on the BUILT page, sampled with the
// filmstrip tooling's pattern (tests/e2e/filmstrip.spec.ts: warm start —
// goto `/?level=kitchen02&build=par`, click Launch, then canvas screenshots
// on wall-clock boundaries from the release tick) — frames written to
// tmp/readme-clip/, then encoded to a <=4 MB, <=6 s GIF and verified to
// actually animate (first-vs-last decoded frame pixel diff > 0).
//
//   node tools/readme-clip.mjs --out docs/renders/run-clip.gif [--port 4461]

import { spawn } from 'node:child_process'
import { mkdir, writeFile, rm } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import process from 'node:process'
import { chromium } from '@playwright/test'
import { PNG } from 'pngjs'
import pixelmatch from 'pixelmatch'

const SAMPLE_MS = 80 // the filmstrip's 250 ms blur-gate cadence is too coarse to watch

function parseArgs(argv) {
  const out = { out: 'docs/renders/run-clip.gif', port: 4461, build: false, fps: 10 }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    const next = () => argv[++i]
    if (a === '--out') out.out = next()
    else if (a === '--port') out.port = Number.parseInt(next(), 10)
    else if (a === '--build') out.build = true
    else if (a === '--fps') out.fps = Number.parseInt(next(), 10)
    else throw new Error(`unknown flag: ${a}`)
  }
  return out
}

const run = (cmd, args) =>
  new Promise((ok, fail) => {
    const p = spawn(cmd, args, { stdio: 'inherit' })
    p.on('error', fail)
    p.on('exit', (c) => (c === 0 ? ok() : fail(new Error(`${cmd} exited ${c}`))))
  })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function waitServer(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs
  for (;;) {
    try { if ((await fetch(url)).ok) return } catch { /* not up yet */ }
    if (Date.now() > deadline) throw new Error(`server did not come up at ${url}`)
    await sleep(250)
  }
}

const opts = parseArgs(process.argv.slice(2))
if (opts.port < 4460) throw new Error('ports must be >= 4460')
if (opts.build) await run('npm', ['run', 'build'])

const framesDir = resolve(process.cwd(), 'tmp/readme-clip')
await rm(framesDir, { recursive: true, force: true })
await mkdir(framesDir, { recursive: true })

const server = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(opts.port), '--strictPort'], { stdio: 'ignore' })
process.on('exit', () => server.kill('SIGTERM'))

let browser
let i = 0
try {
  const base = `http://127.0.0.1:${opts.port}`
  await waitServer(`${base}/`, 60_000)
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 960, height: 540 }, deviceScaleFactor: 1 })
  await page.goto(`${base}/?level=kitchen02&build=par`)
  await page.waitForFunction(
    () => (document.querySelector('#gw-status')?.textContent ?? '').includes('ready'),
    undefined, { timeout: 60_000 },
  )
  await page.click('#gw-launch') // warm start: the sample clock and the run clock share a zero
  const canvas = page.locator('#gw-canvas')
  const t0 = Date.now()
  for (;;) {
    const shot = await canvas.screenshot()
    await writeFile(`${framesDir}/f${String(i).padStart(3, '0')}.png`, shot)
    const status = (await page.locator('#gw-status').textContent()) ?? ''
    i++
    if (!/running/.test(status) || Date.now() - t0 > 8_000 || i >= 60) break
    await page.waitForTimeout(Math.max(5, t0 + i * SAMPLE_MS - Date.now()))
  }
  console.log(`captured ${i} frames of a real kitchen02 par run`)
} finally {
  if (browser) await browser.close().catch(() => {})
  server.kill('SIGTERM')
}

// Encode: palette-quantised GIF, 640 px wide, <=6 s, <=4 MB (re-quantise at
// lower fps if the first encode is heavy).
const outPath = resolve(process.cwd(), opts.out)
await mkdir(dirname(outPath), { recursive: true })
const pattern = `${framesDir}/f%03d.png`
const palette = `${framesDir}/palette.png`
await run('ffmpeg', ['-y', '-framerate', String(opts.fps), '-start_number', '0', '-i', pattern, '-vf', 'scale=640:-1:flags=lanczos,palettegen=stats_mode=diff', palette])
await run('ffmpeg', ['-y', '-framerate', String(opts.fps), '-start_number', '0', '-i', pattern, '-i', palette, '-lavfi', 'scale=640:-1:flags=lanczos [x]; [x][1:v] paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle', outPath])

const bytes = (await import('node:fs')).statSync(outPath).size
const MB = 4 * 1024 * 1024
if (bytes > MB) throw new Error(`gif is ${(bytes / 1048576).toFixed(2)} MB > 4 MB — lower --fps`)
const seconds = i / opts.fps
if (seconds > 6) throw new Error(`clip is ${seconds.toFixed(1)} s > 6 s`)

// Verify the GIF itself animates: decode every frame (-vsync 0 keeps one
// PNG per decoded frame) and pixel-diff first vs last.
const { readdirSync, readFileSync } = await import('node:fs')
await run('ffmpeg', ['-y', '-i', outPath, '-fps_mode', 'passthrough', `${framesDir}/g%04d.png`])
const dumped = readdirSync(framesDir).filter((f) => /^g\d{4}\.png$/.test(f)).sort()
const a = PNG.sync.read(readFileSync(`${framesDir}/${dumped[0]}`))
const b = PNG.sync.read(readFileSync(`${framesDir}/${dumped[dumped.length - 1]}`))
const diff = pixelmatch(a.data, b.data, null, a.width, a.height, { threshold: 0 })
if (diff === 0) throw new Error('gif first/last frames are pixel-identical — it does not animate')
console.log(`OK ${opts.out}: ${(bytes / 1048576).toFixed(2)} MB, ${seconds.toFixed(2)} s, ${dumped.length} decoded frames, first-vs-last pixel diff ${diff} (> 0)`)
