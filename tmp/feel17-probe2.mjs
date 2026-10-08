import { chromium } from '@playwright/test'
import zlib from 'node:zlib'
import { replayRun } from '../src/replay/replay.ts'
import { KITCHEN01 } from '../src/world/levels/kitchen01.level.ts'
import { encodeShareUrl } from '../src/share/share.ts'
const codec = { deflate: async (b) => new Uint8Array(zlib.deflateRawSync(Buffer.from(b))), inflate: async (b) => new Uint8Array(zlib.inflateRawSync(Buffer.from(b))) }
const build = KITCHEN01.parBuild()
const node = await replayRun(KITCHEN01, build)
const url = await encodeShareUrl({ levelId: 'kitchen01', seed: build.seed, hash: node.hash, build }, codec)
const port = Number(process.env.PROBE_PORT ?? 4380)
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
await page.addInitScript(() => {
  const p = { samples: [], long: [], marks: [] }
  window.__probe = p
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) p.long.push([Math.round(e.startTime), Math.round(e.duration)]) }).observe({ entryTypes: ['longtask'] }) } catch {}
  setInterval(() => {
    const w = window
    const play = document.querySelector('#gw-replay-play')
    p.samples.push([Math.round(performance.now()), play ? play.textContent : null, typeof w.__gwReplayState === 'function' ? Number(w.__gwReplayState().t.toFixed(2)) : null, typeof w.__gwReplayWind === 'function' ? w.__gwReplayWind().phase : null])
  }, 40)
})
await page.goto(`http://localhost:${port}/${url}`)
if (process.env.PROBE_CLICK) { await page.waitForTimeout(Number(PROBE_CLICK)); await page.evaluate(() => document.querySelector('#gw-replay-play')?.click()) }
await page.waitForTimeout(9000)
const probe = await page.evaluate(() => window.__probe)
const wind = await page.evaluate(() => window.__gwReplayWind ? window.__gwReplayWind() : null)
console.log('sim', { time: node.time, steps: node.steps, hash: node.hash })
console.log('longtasks:', JSON.stringify(probe.long))
console.log('wind:', JSON.stringify({ ...wind, chunks: wind?.chunks.length, lastChunk: wind?.chunks?.slice(-1) }))
console.log('first-play-button:', JSON.stringify(probe.samples.find(s => s[1])))
console.log('first-trace-seam:', JSON.stringify(probe.samples.find(s => s[2] !== null)))
console.log('first-ready:', JSON.stringify(probe.samples.find(s => s[3] === 'ready')))
for (const s of probe.samples.slice(0, 22)) console.log(' ', JSON.stringify(s))
await browser.close()
