// Per-track-piece-group hide-one diffs against the untouched render.
import { chromium } from '@playwright/test'
import { PNG } from 'pngjs'
import { writeFileSync } from 'node:fs'

const url = process.argv[2] ?? 'http://127.0.0.1:4400/?harness=1&scene=kitchen-set&level=kitchen03&shot=hero&post=off'
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 })
await page.goto(url)
await page.waitForFunction(() => window.__sceneReady === true, undefined, { timeout: 60_000 })
const shots = await page.evaluate(() => {
  const h = window.__h
  let track = null
  h.scene.traverse((o) => { if (o.name === 'track') track = o })
  const groups = track.children
  const shots = []
  h.render()
  shots.push(document.querySelector('canvas').toDataURL()) // base
  groups.forEach((g, i) => {
    g.visible = false
    h.render()
    shots.push(document.querySelector('canvas').toDataURL())
    g.visible = true
  })
  return shots
})
const base = PNG.sync.read(Buffer.from(shots[0].split(',')[1], 'base64'))
shots.slice(1).forEach((u, i) => {
  const png = PNG.sync.read(Buffer.from(u.split(',')[1], 'base64'))
  let diff = 0, x0 = 1e9, x1 = -1, y0 = 1e9, y1 = -1
  for (let k = 0; k < 1600 * 900; k++) {
    const j = k * 4
    if (Math.max(Math.abs(png.data[j] - base.data[j]), Math.abs(png.data[j + 1] - base.data[j + 1]), Math.abs(png.data[j + 2] - base.data[j + 2])) > 4) {
      diff++
      const x = k % 1600, y = (k / 1600) | 0
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y
    }
  }
  console.log('piece', i, 'diffPx', String(diff).padStart(6), diff ? `bbox ${x0},${y0}..${x1},${y1}` : '')
  if (i >= 6) writeFileSync(`piece-${i}-off.png`, PNG.sync.write(png))
})
await browser.close()
