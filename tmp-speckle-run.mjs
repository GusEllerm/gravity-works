/**
 * tmp-speckle-run.mjs <port> <level> [startMs] [endMs] — r10 lane D speckle
 * probe on the REAL production shell at DPR 2 (r8 §1 method: count >=245
 * pixels in run-window frames). Usage: node tmp-speckle-run.mjs 4830 garage02
 */
import { chromium } from '@playwright/test'
import { PNG } from 'pngjs'

const port = process.argv[2] ?? '4830'
const level = process.argv[3] ?? 'garage02'
const start = Number(process.argv[4] ?? 300)
const end = Number(process.argv[5] ?? 1100)
const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 2 })
const page = await ctx.newPage()
page.on('pageerror', (e) => console.log('pageerror', e))
await page.goto(`http://localhost:${port}/?level=${level}&seed=11`)
await page.locator('#gw-status:has-text("ready")', { timeout: 20000 }).waitFor()
await page.evaluate(() => window.__gw.hooks.waitFrame(2))
await page.click('#gw-play')
const t0 = Date.now()
while (Date.now() - t0 < 5000) {
  if ((await page.evaluate(() => window.__gw.hooks.snapshot().phase)) === 'run') break
  await page.waitForTimeout(50)
}
const runT0 = Date.now()
let maxPx = 0
let worst = null
let total = 0
let n = 0
for (let t = start; t <= end; t += 100) {
  const wait = start + (t - start) - (Date.now() - runT0)
  if (wait > 0) await page.waitForTimeout(wait)
  const buf = await page.screenshot()
  const img = PNG.sync.read(buf)
  let px = 0
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      const i = (img.width * y + x) << 2
      const l = img.data[i] * 0.2126 + img.data[i + 1] * 0.7152 + img.data[i + 2] * 0.0722
      if (l >= 245) px++
    }
  }
  total += px
  n++
  if (px > maxPx) { maxPx = px; worst = t }
}
await browser.close()
console.log(`${level}: run-window >=245 luma: max ${maxPx}px (@${worst}ms), mean ${(total / n).toFixed(1)}px / ${n} frames (1600x900 dpr2)`)
