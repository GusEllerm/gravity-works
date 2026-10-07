// ONE census/histogram check that the fixture deck-inlay signal READS
// (stage 4, environment pass; frames for it are the *-before/*-after pairs
// beside this file). The pre-signal frames were built from a HEAD worktree at
// the SAME URL/camera, so every differing pixel IS the signal's own footprint.
//   changed — pixels the signal moved at all
//   lifted  — changed pixels that moved in the deck->inlay direction
//             (#FF7A1A -> #fbb07a is g/b UP at ~unchanged r; the fractional
//             weight counts partial AA coverage)
//   meanDb  — mean blue shift over changed pixels (track orange carries
//             b/r ~0.10, the inlay 0.48: blue is the orange-band tell)
// usage: node tmp/fixture-signal/signal-census.mjs before.png after.png [...]
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { PNG } from 'pngjs'

for (let a = 2; a < process.argv.length; a += 2) {
  const A = PNG.sync.read(readFileSync(resolve(process.argv[a])))
  const B = PNG.sync.read(readFileSync(resolve(process.argv[a + 1])))
  let changed = 0
  let lifted = 0
  let sumDb = 0
  for (let i = 0; i < A.width * A.height * 4; i += 4) {
    const dr = B.data[i] - A.data[i]
    const dg = B.data[i + 1] - A.data[i + 1]
    const db = B.data[i + 2] - A.data[i + 2]
    if (Math.max(Math.abs(dr), Math.abs(dg), Math.abs(db)) <= 4) continue
    changed++
    sumDb += db
    if (dg > 0 && db > 0 && dr >= -8) lifted += Math.min(1, db / 60)
  }
  console.log(
    `${process.argv[a + 1].split('/').pop().padEnd(24)} changed ${String(changed).padStart(6)}  lifted-orange ${lifted.toFixed(0).padStart(6)}  mean Db ${(sumDb / Math.max(1, changed)).toFixed(1)}`,
  )
}
