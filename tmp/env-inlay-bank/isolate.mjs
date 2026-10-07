// Isolation probe: render each fixture-inlay ALONE (everything else hidden)
// in the K3 bowl hero view and report where it lands / how many non-bg px.
import { chromium } from '@playwright/test'
import { PNG } from 'pngjs'

const url = process.argv[2] ?? 'http://127.0.0.1:4400/?harness=1&scene=kitchen-set&level=kitchen03&shot=hero&post=off'
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 })
await page.goto(url)
await page.waitForFunction(() => window.__sceneReady === true, undefined, { timeout: 60_000 })
const dataUrls = await page.evaluate(() => {
  const h = window.__h
  const inlays = []
  h.scene.traverse((o) => { if (o.isMesh && o.name === 'fixture-inlay') inlays.push(o) })
  const save = []
  h.scene.traverse((o) => { if (o.isMesh) save.push([o, o.visible]) })
  const outs = []
  inlays.forEach((m) => {
    for (const [o] of save) o.visible = false
    let par = m.parent
    while (par) { par.visible = true; par = par.parent }
    m.visible = true
    h.render()
    outs.push(document.querySelector('canvas').toDataURL())
  })
  for (const [o, v] of save) o.visible = v
  h.render()
  return outs
})
dataUrls.forEach((u, i) => {
  const png = PNG.sync.read(Buffer.from(u.split(',')[1], 'base64'))
  let nonbg = 0, x0 = 1e9, x1 = -1, y0 = 1e9, y1 = -1
  for (let y = 0; y < png.height; y++) for (let x = 0; x < png.width; x++) {
    const k = (png.width * y + x) * 4
    const r = png.data[k], g = png.data[k + 1], b = png.data[k + 2]
    if (!(r > 230 && g > 200 && b > 150)) {
      nonbg++
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y
    }
  }
  console.log('inlay', i, 'nonbg', nonbg, nonbg ? `bbox ${x0},${y0}..${x1},${y1}` : '')
})
await browser.close()
