// TEMP measurement: mid-run frame capture of a shell level (post ON = shipped default).
// usage: node tmp-find-eq-z3.mjs <level> <atMs> <out.png> <port>
import { chromium } from '@playwright/test'
import { resolve } from 'node:path'

const [level, atMsArg, out, portArg] = process.argv.slice(2)
const atMs = Number(atMsArg ?? 900)
const port = Number(portArg ?? 4820)
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 })
await page.goto(`http://127.0.0.1:${port}/?level=${level}&build=par&launch=1`)
await page.waitForFunction(() => /running/.test((document.querySelector('#gw-status')?.textContent ?? '')), undefined, { timeout: 60_000 })
await page.waitForTimeout(atMs)
const shot = await page.locator('#gw-canvas').screenshot()
await (await import('node:fs')).promises.writeFile(resolve(out), shot)
const status = await page.evaluate(() => document.querySelector('#gw-status')?.textContent)
console.log(`captured ${level} at ~${atMs}ms -> ${out} (status ${status})`)
await browser.close()
