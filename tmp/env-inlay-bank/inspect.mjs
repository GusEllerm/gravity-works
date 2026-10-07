// Where does each fixture-inlay's geometry actually live in world space,
// and what do its vertices/positions look like?
import { chromium } from '@playwright/test'
const url = process.argv[2] ?? 'http://127.0.0.1:4400/?harness=1&scene=kitchen-set&level=kitchen03&shot=hero&post=off'
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 })
await page.goto(url)
await page.waitForFunction(() => window.__sceneReady === true, undefined, { timeout: 60_000 })
const out = await page.evaluate(() => {
  const h = window.__h
  const rows = []
  h.scene.traverse((o) => {
    if (o.isMesh && o.name === 'fixture-inlay') {
      o.geometry.computeBoundingBox()
      o.updateWorldMatrix(true, false)
      const bb = o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld)
      const pos = o.geometry.getAttribute('position')
      let nan = 0
      for (let i = 0; i < pos.array.length; i++) if (!Number.isFinite(pos.array[i])) nan++
      rows.push({
        verts: pos.count,
        nan,
        bb: [bb.min, bb.max].map((v) => [+v.x.toFixed(3), +v.y.toFixed(3), +v.z.toFixed(3)]),
        scaleWorld: (() => { const s = new (o.position.constructor)(); o.getWorldScale(s); return [+s.x.toFixed(3), +s.y.toFixed(3), +s.z.toFixed(3)] })(),
        camPos: [h.camera.position.x.toFixed(2), h.camera.position.y.toFixed(2), h.camera.position.z.toFixed(2)],
        nearFar: [h.camera.near, h.camera.far],
      })
    }
  })
  // also: the deck sweeps of the same pieces for comparison
  const decks = []
  h.scene.traverse((o) => {
    if (o.isMesh && o.name !== 'fixture-inlay' && o.material?.userData?.fixtureSignal === 'deck-inlay' && !o.material.userData.inlayColor) {
      o.geometry.computeBoundingBox()
      o.updateWorldMatrix(true, false)
      const bb = o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld)
      decks.push({ bb: [bb.min, bb.max].map((v) => [+v.x.toFixed(2), +v.y.toFixed(2), +v.z.toFixed(2)]) })
    }
  })
  return { rows, decks: decks.slice(0, 8) }
})
console.log(JSON.stringify(out, null, 1))
await browser.close()
