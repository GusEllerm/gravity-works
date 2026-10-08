import { test, expect, type Page } from '@playwright/test'
import zlib from 'node:zlib'
import { PNG } from 'pngjs'
import { replayRun } from '../../src/replay/replay.ts'
import { KITCHEN01 } from '../../src/world/levels/kitchen01.level.ts'
import { encodeShareUrl, type ShareCodec } from '../../src/share/share.ts'
import type { Build } from '../../src/track/build.ts'

const zlibCodec: ShareCodec = {
  deflate: async (b) => new Uint8Array(zlib.deflateRawSync(Buffer.from(b))),
  inflate: async (b) => new Uint8Array(zlib.inflateRawSync(Buffer.from(b))),
}

async function shareUrl(levelId: string, seed: number, hash: string, build: Build): Promise<string> {
  return encodeShareUrl({ levelId, seed, hash, build }, zlibCodec)
}

async function seek(page: Page, t: number): Promise<void> {
  await page.evaluate((tt: number) => {
    const play = document.querySelector('#gw-replay-play') as HTMLButtonElement
    if (play.getAttribute('aria-pressed') === 'true') play.click()
    const el = document.querySelector('#gw-replay-timeline')!
    const r = el.getBoundingClientRect()
    const tr = (window as unknown as { __gwReplayTrace: () => { duration: number } }).__gwReplayTrace()
    const x = r.left + (tt / tr.duration) * r.width
    const id = 40 + Math.round(tt * 100)
    el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: x, clientY: r.top + r.height / 2, pointerId: id }))
    el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: x, clientY: r.top + r.height / 2, pointerId: id }))
  }, t)
}

function redShare(png: PNG): number {
  let red = 0
  for (let i = 0; i < png.width * png.height; i++) {
    const p = i * 4
    const r = png.data[p]!
    if (r > 90 && r - png.data[p + 1]! > 60 && r - png.data[p + 2]! > 50) red++
  }
  return red / (png.width * png.height)
}

test('census: last 1.3 s of the kitchen01 par replay per 100 ms', async ({ page }) => {
  test.slow()
  await page.setViewportSize({ width: 1280, height: 720 })
  const build = KITCHEN01.parBuild()
  const node = await replayRun(KITCHEN01, build)
  const url = await shareUrl('kitchen01', build.seed, node.hash, build)
  await page.goto(`/${url}`)
  await expect(page.locator('#gw-replay-status')).toHaveText('verified', { timeout: 90_000 })
  await page.waitForFunction(
    () => typeof (window as never as { __gwReplayTrace?: unknown }).__gwReplayTrace === 'function',
    undefined,
    { timeout: 90_000 },
  )
  const tr = await page.evaluate(() =>
    (
      window as never as {
        __gwReplayTrace: () => { duration: number; cuts: number[]; time: number; shots: { kind: string; start: number; end: number }[] }
      }
    ).__gwReplayTrace(),
  )
  console.log(
    `PLAN time=${tr.time.toFixed(3)} dur=${tr.duration.toFixed(3)} cuts=${tr.cuts
      .map((c) => c.toFixed(3))
      .join(',')} shots=${tr.shots.map((s) => `${s.kind}[${s.start.toFixed(2)},${s.end.toFixed(2)}]`).join(' ')}`,
  )
  for (let t = 1.05; t <= 1.65; t += 0.05) {
    await seek(page, t)
    const ndc = await page.evaluate(() => ({
      car: (window as never as { __gwReplayCarNdc: () => number[] | null }).__gwReplayCarNdc(),
      cup: (window as never as { __gwReplayGoalNdc: () => number[] | null }).__gwReplayGoalNdc(),
    }))
    const png = PNG.sync.read(Buffer.from(await page.locator('#gw-canvas').screenshot()))
    const carIn = ndc.car !== null && Math.abs(ndc.car[0]) <= 1 && Math.abs(ndc.car[1]) <= 1
    const cupIn = ndc.cup !== null && Math.abs(ndc.cup[0]) <= 1 && Math.abs(ndc.cup[1]) <= 1
    console.log(
      `t=${t.toFixed(2)} car=${carIn ? 'Y' : 'n'} carNdc=${ndc.car ? ndc.car.map((v) => v.toFixed(2)).join(',') : 'off'} cup=${cupIn ? 'Y' : 'n'} cupNdc=${ndc.cup ? ndc.cup.map((v) => v.toFixed(2)).join(',') : 'off'} red=${(redShare(png) * 100).toFixed(2)}%`,
    )
  }
})
