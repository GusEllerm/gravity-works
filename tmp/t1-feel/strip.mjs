// T1.1 feel-package filmstrip: mid-run frames of one level, sampled on
// wall-clock boundaries from the release tick (the filmstrip gate's own
// start idiom: click Launch on a booted ?build=par page, so the sample
// clock and the run clock share a zero).
//
//   node tmp/t1-feel/strip.mjs <baseUrl> <outDir> [level=kitchen03]
//
// Used for the BEFORE/AFTER evidence: run once against the main-branch
// build and once against the feel-package build; the PNGs are committed
// beside this script.
import { chromium } from '@playwright/test'
import { mkdirSync } from 'node:fs'

const [base, out, level = 'kitchen03'] = process.argv.slice(2)
if (!base || !out) {
  console.error('usage: node strip.mjs <baseUrl> <outDir> [level]')
  process.exit(1)
}
mkdirSync(out, { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
await page.goto(`${base}/?level=${level}&build=par`)
await page
  .locator('#gw-status')
  .filter({ hasText: 'ready' })
  .waitFor({ timeout: 60_000 })
const canvas = page.locator('#gw-canvas')
await page.click('#gw-launch')
const t0 = Date.now()
let i = 0
for (;;) {
  await canvas.screenshot({ path: `${out}/${level}-${String(i).padStart(2, '0')}-t${Date.now() - t0}ms.png` })
  i++
  const status = (await page.locator('#gw-status').textContent()) ?? ''
  if (!/running/.test(status) || Date.now() - t0 > 6_000) break
  await page.waitForTimeout(Math.max(0, t0 + i * 150 - Date.now()))
}
console.log(`${out}: ${i} frames`)
await browser.close()
