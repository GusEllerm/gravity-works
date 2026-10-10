#!/usr/bin/env node
// ROUND-2 LANE D — the SPECKLE/FLARE census extension (censor/histogram
// family). Measures what the 2026-10-09 shadow-boundary finding looks like
// in a frame: ISOLATED bright specks (luma >= 240 with fewer than
// MIN_NEIGH other ≥240 pixels in the 3x3 — a sparkle, not a surface), plus
// the close-contiguous bright coverage of the lower floor band (the blade
// "must be legible at the low/play rig" bar from the garage AD review).
// The finding is a MID-RUN law, so this runs on run frames, not just stills.
//
// usage: node tools/speckle.mjs frame.png [...]

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'
import { PNG } from 'pngjs'

const SPECK = 240 // speck floor: same bar as the AD's iso ≥240 census
const MIN_NEIGH = 2 // fewer ≥240 neighbours than this = an isolated speck

for (const file of process.argv.slice(2)) {
  const png = PNG.sync.read(readFileSync(resolve(file)))
  const { width: w, height: h, data } = png
  const lum = new Uint8Array(w * h)
  for (let i = 0, p = 0; i < w * h; i++, p += png.channels) {
    lum[i] = Math.min(255, Math.round(0.2126 * data[p] + 0.7152 * data[p + 1] + 0.0722 * data[p + 2]))
  }
  let iso = 0
  let bright = 0
  let bandBright = 0
  const bandTop = Math.floor(h * 0.45) // lower 55 % = the floor band (AD convention)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x
      if (lum[i] < SPECK) continue
      bright++
      if (y >= bandTop) bandBright++
      let n = 0
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue
          const xi = x + dx
          const yi = y + dy
          if (xi < 0 || yi < 0 || xi >= w || yi >= h) continue
          if (lum[yi * w + xi] >= SPECK) n++
        }
      }
      if (n < MIN_NEIGH) iso++
    }
  }
  const n = w * h
  console.log(
    `${file.split('/').pop()}\t${w}x${h}\tiso≥240: ${iso}px (${((100 * iso) / n).toFixed(4)} %)\t` +
      `bright≥240: ${bright}px\tfloor-band bright: ${((100 * bandBright) / n).toFixed(2)} %`,
  )
}
