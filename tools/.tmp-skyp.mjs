import { readFileSync } from 'node:fs'
import { PNG } from 'pngjs'
for (const f of process.argv.slice(2)) {
  const png = PNG.sync.read(readFileSync(f))
  const { width: w, height: h, data } = png
  const rows = []
  for (let y = 0; y < Math.floor(h * 0.12); y++) {
    let s = 0
    for (let x = 0; x < w; x++) { const p = (y * w + x) * 4; s += (data[p] + data[p + 1] + data[p + 2]) / 3 }
    rows.push(s / w)
  }
  const mean = rows.reduce((a, b) => a + b) / rows.length
  const sd = Math.sqrt(rows.reduce((a, b) => a + (b - mean) ** 2, 0) / rows.length)
  let n = 0, r = 0, g = 0, b = 0, minSpread = 999
  for (let i = 0; i < w * h; i++) {
    const p = i * 4, R = data[p], G = data[p + 1], B = data[p + 2]
    if (Math.max(R, G, B) < 60) { n++; r += R; g += G; b += B; minSpread = Math.min(minSpread, Math.max(R, G, B) - Math.min(R, G, B)) }
  }
  console.log(
    f.split('/').pop().padEnd(24),
    'sky sd', sd.toFixed(1),
    'top→bot', rows[0].toFixed(0) + '→' + rows[rows.length - 1].toFixed(0),
    '| dark avg', n ? [r / n, g / n, b / n].map((x) => x.toFixed(0)).join(',') : 'none',
    'minSpread', n ? minSpread : '-', 'n=' + n,
  )
}
