// Pixel census for art-direction evidence: darks (tinted vs blackish),
// blowns, and outlier fuzz — the bars the AD rubric measures.
//
// Decoding goes through pngjs (proven). A hand-rolled chunk loop here once
// shipped WITHOUT advancing the offset (`off += 12 + len`), so it spun
// forever on the IHDR chunk and three audit scripts appeared to "hang" —
// if you ever hand-roll the decoder again, a smoke run under `timeout`
// comes before any batch.
//
// usage: node tools/census.mjs img1.png [img2.png ...]
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { PNG } from 'pngjs'

const DARK = 60 // "below 60" band floor
const TINTED_SPREAD = 18 // a dark pixel is tinted if max(RGB)-min(RGB) >= this
const BLOWN = 243
const OUTLIER_DELTA = 96 // per-pixel mean-channel distance from the median tone

const rows = []
for (const file of process.argv.slice(2)) {
  const png = PNG.sync.read(readFileSync(resolve(file)))
  const { width: w, height: h, data } = png
  const n = w * h
  let darks = 0
  let tinted = 0
  let blown = 0
  let devSum = 0
  let blackish = 0
  const means = new Uint8Array(n)
  for (let i = 0, p = 0; i < n; i++, p += 4) {
    const r = data[p]
    const g = data[p + 1]
    const b = data[p + 2]
    const mx = Math.max(r, g, b)
    const mn = Math.min(r, g, b)
    const mean = (r + g + b) / 3
    means[i] = mean
    if (mx < DARK) {
      darks++
      if (mx - mn >= TINTED_SPREAD) tinted++
      else blackish++
    }
    if (mn >= BLOWN) blown++
  }
  // median tone in one pass via a 256-bucket histogram
  const hist = new Uint32Array(256)
  for (let i = 0; i < n; i++) hist[means[i]]++
  let med = 0
  let acc = 0
  for (let v = 0; v < 256; v++) {
    acc += hist[v]
    if (acc >= n / 2) {
      med = v
      break
    }
  }
  for (let i = 0; i < n; i++) devSum += Math.abs(means[i] - med)
  const outliers = [...means].filter((m) => Math.abs(m - med) > OUTLIER_DELTA).length
  rows.push({
    file,
    px: n,
    darkPct: (100 * darks) / n,
    tintedPct: (100 * tinted) / n,
    blackishPct: (100 * blackish) / n,
    blownPct: (100 * blown) / n,
    outlierPct: (100 * outliers) / n,
    medTone: med,
  })
}

console.log(
  ['file', 'px', 'dark<60%', 'tinted%', 'blackish%', 'blown>=243%', 'outlier%', 'medTone']
    .map((s) => s.padStart(13))
    .join(' '),
)
for (const r of rows) {
  console.log(
    [
      r.file.slice(-38),
      String(r.px),
      r.darkPct.toFixed(3),
      r.tintedPct.toFixed(3),
      r.blackishPct.toFixed(3),
      r.blownPct.toFixed(3),
      r.outlierPct.toFixed(3),
      String(r.medTone),
    ]
      .map((s) => s.padStart(13))
      .join(' '),
  )
}
