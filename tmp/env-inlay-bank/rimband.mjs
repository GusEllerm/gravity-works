// Dev render: camera above the K3 bowl rim; measure the rim inlay's lightness
// band against the deck beneath it (and the ramp/cup inlay as flat-deck ref).
import { chromium } from '@playwright/test'
import { PNG } from 'pngjs'
import { writeFileSync } from 'node:fs'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 })
await page.goto('http://127.0.0.1:4400/?harness=1&scene=kitchen-set&level=kitchen03&shot=hero&post=off')
await page.waitForFunction(() => window.__sceneReady === true, undefined, { timeout: 60_000 })
const shots = await page.evaluate(() => {
  const h = window.__h
  // free dev camera above the bowl (rim sits at x~1.16-1.43, y~-0.4, z~0.24-0.72)
  h.camera.position.set(1.29, -0.02, 0.47)
  h.camera.up.set(0, 1, 0)
  h.camera.lookAt(new h.camera.position.constructor(1.29, -0.41, 0.47))
  h.camera.updateProjectionMatrix && h.camera.updateProjectionMatrix()
  h.render()
  const a = document.querySelector('canvas').toDataURL()
  const saved = []
  h.scene.traverse((o) => { if (o.isMesh && o.name === 'fixture-inlay') { saved.push(o); o.visible = false } })
  h.render()
  const b = document.querySelector('canvas').toDataURL()
  for (const o of saved) o.visible = true
  return { a, b }
})
writeFileSync('bowl-devcam-inlay.png', PNG.sync.write(PNG.sync.read(Buffer.from(shots.a.split(',')[1], 'base64'))))
writeFileSync('bowl-devcam-noinlay.png', PNG.sync.write(PNG.sync.read(Buffer.from(shots.b.split(',')[1], 'base64'))))
// band analysis
const s2l = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }
const Lstar = (r, g, b) => { const Y = 0.2126 * s2l(r) + 0.7152 * s2l(g) + 0.0722 * s2l(b); return Y > 0.008856 ? 116 * Math.cbrt(Y) - 16 : 903.3 * Y }
const A = PNG.sync.read(Buffer.from(shots.a.split(',')[1], 'base64'))
const B = PNG.sync.read(Buffer.from(shots.b.split(',')[1], 'base64'))
const foot = []
for (let k = 0, i = 0; k < A.width * A.height * 4; k += 4, i++) {
  const d = Math.max(Math.abs(A.data[k] - B.data[k]), Math.abs(A.data[k + 1] - B.data[k + 1]), Math.abs(A.data[k + 2] - B.data[k + 2]))
  if (d > 4 && A.data[k + 2] > B.data[k + 2]) foot.push(i)
}
const q = (arr, f) => arr[Math.floor((arr.length - 1) * f)]
for (const [name, x0, x1] of [['rim(bank+curve)', 800, 1200], ['ramp/flat', 0, 1600]]) {
  const sig = [], deck = []
  for (const i of foot) {
    const x = i % A.width
    if (x1 && (x < x0 || x >= x1)) continue
    sig.push(Lstar(A.data[i * 4], A.data[i * 4 + 1], A.data[i * 4 + 2]))
    deck.push(Lstar(B.data[i * 4], B.data[i * 4 + 1], B.data[i * 4 + 2]))
  }
  sig.sort((a, b) => a - b); deck.sort((a, b) => a - b)
  if (!sig.length) { console.log(name, 'footprint 0'); continue }
  console.log(name, 'px', sig.length, 'inlay L* p10/50/90:', q(sig, 0.1).toFixed(1), q(sig, 0.5).toFixed(1), q(sig, 0.9).toFixed(1), '| deck-under L* p10/50/90:', q(deck, 0.1).toFixed(1), q(deck, 0.5).toFixed(1), q(deck, 0.9).toFixed(1), '| max inlay L*', q(sig, 0.999).toFixed(1))
}
await browser.close()
