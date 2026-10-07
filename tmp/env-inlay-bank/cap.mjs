// Capture helper (env artist, banked-inlay fix): serves the CWD build with
// vite preview and captures a list of "<urlParams>|<out.png>" captures at the
// canonical 1600x900 (or shell 960x540 when the spec starts with 'shell:').
// usage: node cap.mjs <port> "<params>|<out>" [...]
import { spawn } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { chromium } from '@playwright/test'

const port = Number(process.argv[2])
const specs = process.argv.slice(3)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
async function waitServer(url, ms) {
  const d = Date.now() + ms
  for (;;) {
    try { if ((await fetch(url)).ok) return } catch {}
    if (Date.now() > d) throw new Error('no server at ' + url)
    await sleep(250)
  }
}
const server = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { stdio: 'ignore' })
process.on('exit', () => server.kill('SIGTERM'))
const base = `http://127.0.0.1:${port}`
await waitServer(`${base}/`, 60_000)
const browser = await chromium.launch({ headless: true })
try {
  for (const spec of specs) {
    const [params, out] = spec.split('|')
    const shell = params.startsWith('shell:')
    const url = shell ? `${base}/${params.slice(6)}` : `${base}/?harness=1&${params}`
    const page = await browser.newPage({ viewport: shell ? { width: 960, height: 540 } : { width: 1600, height: 900 }, deviceScaleFactor: 1 })
    await page.goto(url)
    await page.waitForFunction(() => window.__sceneReady === true || window.__sceneError !== undefined, undefined, { timeout: 60_000 }).catch(() => {})
    const err = await page.evaluate(() => window.__sceneError)
    if (err) throw new Error(`scene error for ${url}: ${err}`)
    if (!shell) {
      const stats = await page.evaluate(() => window.__pixelStats())
      if (stats.nonBlack === 0) throw new Error('black canvas: ' + url)
    } else {
      await page.waitForFunction(() => (document.querySelector('#gw-status')?.textContent ?? '').includes('ready'), undefined, { timeout: 60_000 })
      await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))))
    }
    await mkdir(dirname(resolve(out)), { recursive: true })
    await page.locator(shell ? '#gw-canvas' : 'canvas').screenshot({ path: resolve(out) })
    console.log('captured', out, '<-', url)
    await page.close()
  }
} finally {
  await browser.close().catch(() => {})
  server.kill('SIGTERM')
}
