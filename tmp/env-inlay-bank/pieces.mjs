// Piece-level ablation in the live hero view: hide meshes by their group,
// re-render, and count how many "cream pill" pixels remain.
import { chromium } from '@playwright/test'
import { PNG } from 'pngjs'

const url = process.argv[2] ?? 'http://127.0.0.1:4400/?harness=1&scene=kitchen-set&level=kitchen03&shot=hero&post=off'
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 })
await page.goto(url)
await page.waitForFunction(() => window.__sceneReady === true, undefined, { timeout: 60_000 })
const res = await page.evaluate(() => {
  const h = window.__h
  // track piece groups = children of the group named 'track'
  let track = null
  h.scene.traverse((o) => { if (o.name === 'track') track = o })
  const groups = track.children
  const save = groups.map((g) => g.visible)
  const cream = () => {
    const c = document.querySelector('canvas')
    const png = PNGc(c)
    return png
  }
  // count cream px in pill bbox via 2D readback
  const meas = () => {
    const c = document.querySelector('canvas')
    h.render()
    const t = document.createElement('canvas')
    t.width = c.width; t.height = c.height
    const ctx = t.getContext('2d')
    ctx.drawImage(c, 0, 0)
    const d = ctx.getImageData(820, 560, 220, 120).data
    let n = 0
    for (let i = 0; i < d.length; i += 4) if (d[i] > 240 && d[i + 1] > 225 && d[i + 2] > 170) n++
    return n
  }
  const out = { total: meas(), byGroup: [] }
  for (let i = 0; i < groups.length; i++) {
    groups[i].visible = false
    out.byGroup.push({ i, cream: meas() })
    groups[i].visible = true
  }
  groups.forEach((g, i) => (g.visible = save[i]))
  out.count = groups.length
  // which group indices contain an inlay, and their bboxes
  out.kinds = groups.map((g) => {
    let has = false
    g.traverse((o) => { if (o.name === 'fixture-inlay') has = true })
    return has
  })
  return out
})
console.log(JSON.stringify(res))
await browser.close()
