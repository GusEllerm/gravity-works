// Force-render probes: (a) each inlay ALONE in flat red basic; (b) full scene
// but every inlay forced red — where do the pixels land?
import { chromium } from '@playwright/test'
import { PNG } from 'pngjs'
import { writeFileSync } from 'node:fs'

const url = process.argv[2] ?? 'http://127.0.0.1:4400/?harness=1&scene=kitchen-set&level=kitchen03&shot=hero&post=off'
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 })
await page.goto(url)
await page.waitForFunction(() => window.__sceneReady === true, undefined, { timeout: 60_000 })
const out = await page.evaluate(() => {
  const h = window.__h
  const inlays = []
  h.scene.traverse((o) => { if (o.isMesh && o.name === 'fixture-inlay') inlays.push(o) })
  const save = []
  h.scene.traverse((o) => { if (o.isMesh) save.push([o, o.visible, o.material]) })
  const outs = []
  // (a) alone, red basic
  inlays.forEach((m) => {
    for (const [o] of save) o.visible = false
    let par = m.parent
    while (par) { par.visible = true; par = par.parent }
    m.visible = true
    m.material = (() => { const c = m.material.clone(); c.color.set(0xff0000); c.side = 2; c.depthTest = false; return c })()
    h.render()
    outs.push(document.querySelector('canvas').toDataURL())
  })
  // (b) full scene, inlays red + depthTest false
  for (const [o, v, mat] of save) { o.visible = v; o.material = mat }
  inlays.forEach((m) => { const c = m.material.clone(); c.color.set(0xff0000); c.side = 2; c.depthTest = false; m.material = c })
  h.render()
  outs.push(document.querySelector('canvas').toDataURL())
  for (const [o, v, mat] of save) { o.visible = v; o.material = mat }
  h.render()
  return outs
})
out.forEach((u, i) => {
  const png = PNG.sync.read(Buffer.from(u.split(',')[1], 'base64'))
  let red = 0, x0 = 1e9, x1 = -1, y0 = 1e9, y1 = -1
  for (let y = 0; y < png.height; y++) for (let x = 0; x < png.width; x++) {
    const k = (png.width * y + x) * 4
    if (png.data[k] > 200 && png.data[k + 1] < 90 && png.data[k + 2] < 90) {
      red++
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y
    }
  }
  console.log(i === out.length - 1 ? 'full+forced-red' : 'alone-red', i, 'redPx', red, red ? `bbox ${x0},${y0}..${x1},${y1}` : '')
  if (i === out.length - 1) writeFileSync('forced-red-full.png', PNG.sync.write(png))
})
await browser.close()
