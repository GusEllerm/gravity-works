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
  const p = { samples: [], long: [] }
  window.__probe = p
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) p.long.push([Math.round(e.startTime), Math.round(e.duration)]) }).observe({ entryTypes: ['longtask'] }) } catch {}
  setInterval(() => {
    const w = window
    const play = document.querySelector('#gw-replay-play')
    p.samples.push([Math.round(performance.now()), play ? play.textContent : null, typeof w.__gwReplayState === 'function' ? Number(w.__gwReplayState().t.toFixed(2)) : null, typeof w.__gwReplayWind === 'function' ? w.__gwReplayWind().phase : null, typeof w.__gwReplayWind === 'function' ? w.__gwReplayWind().pendingPlay : null])
  }, 40)
})
await page.goto(`http://localhost:${port}/${url}`)
if (process.env.PROBE_CLICK) {
  await page.waitForFunction(() => document.querySelector('#gw-replay-play')?.dataset.phase === 'waiting', null, { timeout: 5000 }).catch(() => {})
  await page.evaluate(() => document.querySelector('#gw-replay-play')?.click())
}
await page.waitForTimeout(20000)
const probe = await page.evaluate(() => window.__probe)
const wind = await page.evaluate(() => window.__gwReplayWind ? window.__gwReplayWind() : null)
console.log('sim', { time: node.time, steps: node.steps, hash: node.hash })
console.log('longtasks:', JSON.stringify(probe.long))
console.log('wind:', JSON.stringify({ phase: wind?.phase, pendingPlay: wind?.pendingPlay, steps: wind?.steps, chunks: wind?.chunks?.length, windMs: wind?.windMs, marks: wind?.marks, last: wind?.chunks?.[wind.chunks.length - 1] }))
console.log('bar up:', JSON.stringify(probe.samples.find(s => s[1])))
console.log('ready:', JSON.stringify(probe.samples.find(s => s[3] === 'ready')))
console.log('moved (t>0.05):', JSON.stringify(probe.samples.find(s => (s[2] ?? 0) > 0.05)))
console.log('at end:', JSON.stringify(probe.samples.find(s => s[2] !== null && s[2] >= 3.0)))
const seen = new Set(); for (const s of probe.samples) { const k = (s[1]||'').slice(0, 6) + '|' + s[3]; if (!seen.has(k) && s[3]) { seen.add(k); } }
console.log('phases:', JSON.stringify(await page.evaluate(() => window.__gwReplayPhases())))
await browser.close()
