/**
 * Stage 3 filmstrip gate (playtests E/F/G — "mid-run frames are just beige
 * blur", "camera often faces beige blur mid-run", "car off-screen in most
 * launches"): a real L02 run on the BUILT page, sampled as a filmstrip
 * every 250 ms from release to the finish panel. No frame may be >60 %
 * single-colour blur — the shareable-frame contract the camera fix (see
 * `docs/vault/Modules/camera.md`) exists to hold.
 *
 * Owns port 4210 (config `playwright.filmstrip.config.ts`): the filmstrip
 * samples on wall-clock boundaries and must not share a preview server
 * with the parallel e2e suite.
 */
import { test, expect } from '@playwright/test'
import { PNG } from 'pngjs'

const SAMPLE_MS = 250
const MAX_DOMINANT = 0.6

/** Share of pixels in the most common 4-bit-per-channel colour bucket —
 *  the "is this frame one flat colour" metric a blur fails (quantised to
 *  16 levels/channel so dithered gradients and AA do not fake diversity). */
function dominantShare(pngPng: Buffer): number {
  const png = PNG.sync.read(pngPng)
  const buckets = new Map<number, number>()
  let n = 0
  for (let i = 0; i < png.data.length; i += 4) {
    if (png.data[i + 3]! < 8) continue
    const key =
      ((png.data[i]! >> 4) << 8) | ((png.data[i + 1]! >> 4) << 4) | (png.data[i + 2]! >> 4)
    buckets.set(key, (buckets.get(key) ?? 0) + 1)
    n++
  }
  let max = 0
  for (const v of buckets.values()) max = Math.max(max, v)
  return max / n
}

test('L02 par run filmstrip every 250 ms: no frame >60 % single-colour', async ({ page }) => {
  test.slow()
  await page.goto('/?level=kitchen02&build=par&launch=1')
  // start the strip when the run is actually RUNNING (launch=1 fires on the
  // first world; the pre-release frames are the static table framing)
  await expect
    .poll(async () => (await page.locator('#gw-status').textContent()) ?? '', { timeout: 20_000 })
    .toMatch(/running/)

  const frames: { t: number; share: number }[] = []
  const canvas = page.locator('#gw-canvas')
  const t0 = Date.now()
  for (;;) {
    const shot = await canvas.screenshot()
    const status = (await page.locator('#gw-status').textContent()) ?? ''
    frames.push({ t: Date.now() - t0, share: dominantShare(shot) })
    if (!/running/.test(status) || Date.now() - t0 > 8_000) break
    const next = t0 + frames.length * SAMPLE_MS
    await page.waitForTimeout(Math.max(0, next - Date.now()))
  }

  const worst = frames.reduce((a, b) => (b.share > a.share ? b : a))
  // eslint-disable-next-line no-console
  console.log(
    `filmstrip: ${frames.length} frames, worst ${worst.t} ms ${(worst.share * 100).toFixed(1)} %`,
  )
  expect(frames.length).toBeGreaterThanOrEqual(6)
  for (const f of frames) {
    expect(f.share, `frame at ${f.t} ms: ${(f.share * 100).toFixed(1)} % single colour`).toBeLessThanOrEqual(
      MAX_DOMINANT,
    )
  }
})
