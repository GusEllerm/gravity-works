import { chromium } from '@playwright/test'
import { resolve } from 'node:path'
import { promises as fs } from 'node:fs'
const [scene, shot, out, portArg] = process.argv.slice(2)
const port = Number(portArg ?? 4820)
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 })
await page.goto(`http://127.0.0.1:${port}/?harness=1&scene=${scene}&shot=${shot}&post=on`)
await page.waitForFunction(() => window.__sceneReady === true || window.__sceneError !== undefined, undefined, { timeout: 60_000 })
const err = await page.evaluate(() => window.__sceneError)
if (err) { console.error('ERR', err); process.exit(1) }
await (await fs).writeFile(resolve(out), await page.locator('canvas').screenshot())
console.log('shot', scene, shot, out)
await browser.close()
