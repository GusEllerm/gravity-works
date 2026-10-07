// In full scene: (a) ribbons keepMaterials but depthTest=false, (b) ribbons
// with much stronger polygonOffset — where do they land?
import { chromium } from '@playwright/test'
import { PNG } from 'pngjs'
import { writeFileSync } from 'node:fs'

const url = process.argv[2] ?? 'http://127.0.0.1:4400/?harness=1&scene=kitchen-set&level=kitchen03&shot=hero&post=off'
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 })
await page.goto(url)
await page.waitForFunction(() => window.__sceneReady === true, undefined, { timeout: 60_000 })
const outs = await page.evaluate((modes) => {
  const h = window.__h
  const inlays = []
  h.scene.traverse((o) => { if (o.isMesh && o.name === 'fixture-inlay') inlays.push(o) })
  const orig = inlays.map((m) => m.material)
  const shots = []
  for (const mode of modes) {
    inlays.forEach((m, i) => {
      const c = orig[i].clone()
      if (mode === 'nodepth') c.depthTest = false
      if (mode === 'bias') { c.polygonOffsetFactor = -20; c.polygonOffsetUnits = -10 }
      m.material = c
    })
    h.render()
    shots.push(document.querySelector('canvas').toDataURL())
  }
  inlays.forEach((m, i) => (m.material = orig[i]))
  h.render()
  return shots
}, ['nodepth', 'bias', 'none'])
const base = PNG.sync.read(Buffer.from(outs[2].split(',')[1], 'base64'))
writeFileSync('ribbon-none.png', PNG.sync.write(base))
outs.slice(0, 2).forEach((u, i) => {
  const png = PNG.sync.read(Buffer.from(u.split(',')[1], 'base64'))
  let diff = 0, blueUp = 0
  for (let k = 0; k < png.width * png.height * 4; k += 4) {
    if (Math.max(Math.abs(png.data[k] - base.data[k]), Math.abs(png.data[k + 1] - base.data[k + 1]), Math.abs(png.data[k + 2] - base.data[k + 2])) > 4) { diff++; if (png.data[k + 2] > base.data[k + 2]) blueUp++ }
  }
  writeFileSync(`ribbon-${['nodepth', 'bias'][i]}.png`, PNG.sync.write(png))
  console.log(['nodepth', 'bias'][i], 'diffPx', diff, 'blueUp', blueUp)
})
await browser.close()
