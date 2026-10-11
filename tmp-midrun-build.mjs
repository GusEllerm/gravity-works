// BUILD-phase (idle table) frame: no launch.
import { chromium } from '@playwright/test'
import { resolve } from 'node:path'
import { promises as fs } from 'node:fs'
const [level, out, portArg] = process.argv.slice(2)
const port = Number(portArg ?? 4820)
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 })
await page.goto(`http://127.0.0.1:${port}/?level=${level}&build=par`)
await page.waitForFunction(() => /ready/.test((document.querySelector('#gw-status')?.textContent ?? '')), undefined, { timeout: 60_000 })
await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => r()))))
await (await fs).writeFile(resolve(out), await page.locator('#gw-canvas').screenshot())
console.log('build frame', level, out)
await browser.close()
