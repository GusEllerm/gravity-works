#!/usr/bin/env node
// Deterministic render tool:
//   npm run render -- --scene materials-a --shot material-review --out docs/explorations/materials/ramp-a.png
// Builds (unless --no-build), serves the built app with vite preview, drives
// headless chromium through the ?harness=1 page, waits for window.__sceneReady,
// and screenshots the canvas. No display server required; safe for CI.

import { spawn } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import process from 'node:process'
import { chromium } from '@playwright/test'

function parseArgs(argv) {
  const out = { scene: 'materials-a', shot: 'material-review', out: null, build: true, port: 4188, params: [] }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    const next = () => {
      i++
      const v = argv[i]
      if (v === undefined) throw new Error(`${a} needs a value`)
      return v
    }
    if (a === '--scene') out.scene = next()
    else if (a === '--shot') out.shot = next()
    else if (a === '--out') out.out = next()
    else if (a === '--port') out.port = Number.parseInt(next(), 10)
    else if (a === '--no-build') out.build = false
    else if (a === '--param') out.params.push(next()) // extra harness params, e.g. --param post=on
    else throw new Error(`unknown flag: ${a}`)
  }
  if (!out.out) throw new Error('--out <path.png> is required')
  return out
}

const run = (cmd, args) =>
  new Promise((ok, fail) => {
    const p = spawn(cmd, args, { stdio: 'inherit' })
    p.on('error', fail)
    p.on('exit', (code) => (code === 0 ? ok() : fail(new Error(`${cmd} exited ${code}`))))
  })

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function waitServer(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs
  for (;;) {
    try {
      const res = await fetch(url)
      if (res.ok) return
    } catch {
      /* not up yet */
    }
    if (Date.now() > deadline) throw new Error(`server did not come up at ${url}`)
    await sleep(250)
  }
}

const opts = parseArgs(process.argv.slice(2))

if (opts.build) await run('npm', ['run', 'build'])

const server = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(opts.port), '--strictPort'], {
  stdio: 'ignore',
  detached: false,
})
const stop = () => {
  server.kill('SIGTERM')
}
process.on('exit', stop)

let browser
try {
  const base = `http://127.0.0.1:${opts.port}`
  await waitServer(`${base}/`, 60_000)

  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 })
  const url =
    `${base}/?harness=1&scene=${encodeURIComponent(opts.scene)}&shot=${encodeURIComponent(opts.shot)}` +
    opts.params.map((p) => `&${p}`).join('')
  await page.goto(url)
  await page.waitForFunction(
    () => window.__sceneReady === true || window.__sceneError !== undefined,
    undefined,
    { timeout: 30_000 },
  )
  const harnessError = await page.evaluate(() => window.__sceneError)
  if (harnessError) throw new Error(`harness error: ${harnessError}`)

  const stats = await page.evaluate(() => window.__pixelStats())
  if (stats.nonBlack === 0) throw new Error('canvas is fully black — scene did not render')

  const outPath = resolve(process.cwd(), opts.out)
  await mkdir(dirname(outPath), { recursive: true })
  await page.locator('canvas').screenshot({ path: outPath })
  console.log(`rendered ${opts.scene}/${opts.shot} -> ${opts.out} (non-black pixels: ${stats.nonBlack}/${stats.total})`)
} finally {
  if (browser) await browser.close().catch(() => {})
  stop()
}
