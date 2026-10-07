// Binary ablation over scene meshes: find the smallest set of objects whose
// hiding removes the cream pill in the hero view.
import { chromium } from '@playwright/test'

const url = process.argv[2] ?? 'http://127.0.0.1:4400/?harness=1&scene=kitchen-set&level=kitchen03&shot=hero&post=off'
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 })
await page.goto(url)
await page.waitForFunction(() => window.__sceneReady === true, undefined, { timeout: 60_000 })
const out = await page.evaluate(() => {
  const h = window.__h
  // top-level-ish units: every mesh under the scene, but hide whole subtrees
  // of scene children first (set group vs track vs car vs lights)
  const units = h.scene.children.filter((o) => o.isMesh || o.isGroup || o.isObject3D)
  const meas = () => {
    h.render()
    const c = document.querySelector('canvas')
    const t = document.createElement('canvas')
    t.width = c.width; t.height = c.height
    const ctx = t.getContext('2d')
    ctx.drawImage(c, 0, 0)
    const d = ctx.getImageData(820, 560, 220, 120).data
    let n = 0
    for (let i = 0; i < d.length; i += 4) if (d[i] > 240 && d[i + 1] > 225 && d[i + 2] > 170) n++
    return n
  }
  const names = units.map((u) => u.name || u.type)
  const base = meas()
  // hide each scene child in turn
  const one = []
  units.forEach((u, i) => {
    u.visible = false
    one.push({ i, n: names[i], cream: meas() })
    u.visible = true
  })
  return { base, count: units.length, one }
})
console.log(JSON.stringify(out, null, 1))
await browser.close()
