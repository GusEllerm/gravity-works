#!/usr/bin/env node
// Frame luminance histogram for the render review loop (stage-3 AD review
// acceptance bars): decodes PNGs in pure node (zlib inflate, 8-bit RGB/RGBA,
// all five filter types) and reports:
//   - share of pixels with rec.709 luma >= 243 (the blown-high bar)
//   - share / count with luma < 60 (the earned-darks bar)
//   - mean luma and the 5th/95th percentile
// Usage: node tools/histogram.mjs path/to/frame.png [...]

import { readFileSync } from 'node:fs'
import { inflateSync } from 'node:zlib'
import process from 'node:process'

function decodePng(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('not a PNG')
  let off = 8
  let w = 0, h = 0, bitDepth = 0, colorType = 0
  const idat = []
  while (off < buf.length) {
    const len = buf.readUInt32BE(off)
    const type = buf.toString('ascii', off + 4, off + 8)
    const data = buf.subarray(off + 8, off + 8 + len)
    if (type === 'IHDR') {
      w = data.readUInt32BE(0); h = data.readUInt32BE(4)
      bitDepth = data[8]; colorType = data[9]
      if (bitDepth !== 8) throw new Error(`unsupported bit depth ${bitDepth}`)
      if (colorType !== 2 && colorType !== 6) throw new Error(`unsupported color type ${colorType}`)
    } else if (type === 'IDAT') idat.push(data)
    else if (type === 'IEND') break
    off += 12 + len
  }
  const raw = inflateSync(Buffer.concat(idat))
  const ch = colorType === 6 ? 4 : 3
  const stride = w * ch
  const out = Buffer.alloc(h * stride)
  for (let y = 0; y < h; y++) {
    const filter = raw[y * (stride + 1)]
    const line = raw.subarray(y * (stride + 1) + 1, y * (stride + 1) + 1 + stride)
    const cur = out.subarray(y * stride, (y + 1) * stride)
    const prev = y > 0 ? out.subarray((y - 1) * stride, y * stride) : Buffer.alloc(stride)
    for (let x = 0; x < stride; x++) {
      const a = x >= ch ? cur[x - ch] : 0
      const b = prev[x]
      const c = x >= ch ? prev[x - ch] : 0
      let v = line[x]
      if (filter === 1) v += a
      else if (filter === 2) v += b
      else if (filter === 3) v += (a + b) >> 1
      else if (filter === 4) {
        const p = a + b - c
        const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c)
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c
      }
      cur[x] = v & 255
    }
  }
  return { w, h, ch, data: out }
}

function stats(path) {
  const { w, h, ch, data } = decodePng(readFileSync(path))
  const hist = new Uint32Array(256)
  const lumas = new Uint8Array(w * h)
  for (let i = 0, p = 0; i < data.length; i += ch, p++) {
    const l = Math.round(0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2])
    hist[Math.min(255, l)]++
    lumas[p] = Math.min(255, l)
  }
  const total = w * h
  const sorted = Uint8Array.from(lumas).sort()
  let sum = 0
  for (const v of lumas) sum += v
  const pct = (t) => sorted[Math.min(total - 1, Math.floor(total * t))]
  let hi = 0, lo = 0
  for (let v = 243; v < 256; v++) hi += hist[v]
  for (let v = 0; v < 60; v++) lo += hist[v]
  return {
    file: path.split('/').pop(),
    size: `${w}x${h}`,
    mean: +(sum / total).toFixed(1),
    p5: sorted[Math.floor(total * 0.05)],
    p95: sorted[Math.floor(total * 0.95)],
    hi243Pct: +((100 * hi) / total).toFixed(2),
    lo60Pct: +((100 * lo) / total).toFixed(2),
    lo60Count: lo,
  }
}

const files = process.argv.slice(2)
if (files.length === 0) {
  console.error('usage: node tools/histogram.mjs frame.png [...]')
  process.exit(1)
}
for (const f of files) {
  const s = stats(f)
  console.log(
    `${s.file}\t${s.size}\tmean ${s.mean}\tp5 ${s.p5}\tp95 ${s.p95}\t>=243: ${s.hi243Pct}%\t<60: ${s.lo60Pct}% (${s.lo60Count}px)`,
  )
}
