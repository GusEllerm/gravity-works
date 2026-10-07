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

/**
 * STAGE 4 — THE DENSE END-OF-RUN GATE (playtests J+K, camera reopen 1:
 * "the camera buries itself halfway into a wall at run end, only the car's
 * roof", "a wall of woodgrain"). The stage-3 trailing fix holds MID-run,
 * but 250 ms sampling skipped the END frames where the finish framing
 * fails: measured on the L01 par run BEFORE the fix, the frames inside the
 * FINAL SECOND reached 88 % one flat colour (the table surface filling the
 * shot at eye height, 2.4 s into the release). The gate therefore samples
 * EVERY 100 ms across the final second of the L01, L04 and BOTH L02 lines'
 * par runs — on the page itself, in a wrapper around the game's own
 * `requestAnimationFrame` callbacks, so a sampled frame cannot slip
 * between round-trips — with the same per-frame bar: no frame >60 %
 * single-colour. STAGE 4 watchability (playtest M: "the cup and death spot
 * were NEVER visible"; "the whole far half of Two Ways stays off-frame"):
 * L02 is WIDER than L01 — its rail runs past the cup into the visible
 * curve run-out, so BOTH its authored lines (`build=par` the lazy line,
 * `build=alt` the arc line — the two lanes the level is named for) join
 * the dense window: a finish framing that only works when the cup sits at
 * the rail END (L01/L04) is exactly what L02 exposes. The dense window
 * ENDS at the terminal status: the static framing the shell owns after
 * hand-back is a different frame-set (and a different owner).
 */
test('L01+L02(par+alt)+L04 par runs: EVERY 100 ms of the final second, no frame >60 % single-colour', async ({ page }) => {
  test.slow()
  await page.addInitScript(() => {
    const raf = window.requestAnimationFrame.bind(window)
    const buckets = new Map<number, { share: number; status: string }>()
    ;(window as unknown as Record<string, unknown>).__gwStrip = buckets
    const work = document.createElement('canvas')
    work.width = 240
    work.height = 135
    const g = work.getContext('2d', { willReadFrequently: true })!
    window.requestAnimationFrame = ((cb: FrameRequestCallback) =>
      raf((t) => {
        cb(t)
        const c = document.querySelector('#gw-canvas') as HTMLCanvasElement | null
        const st = document.querySelector('#gw-status')?.textContent ?? ''
        if (!c || !c.width) return
        const bucket = Math.floor(performance.now() / 100)
        if (buckets.has(bucket)) return
        g.drawImage(c, 0, 0, 240, 135)
        const d = g.getImageData(0, 0, 240, 135).data
        const hist = new Map<number, number>()
        let n = 0
        for (let i = 0; i < d.length; i += 4) {
          if (d[i + 3]! < 8) continue
          // 4 bits per channel, EXACTLY as the PNG sampler above — a stage-4
          // probe had this key shifting the BLUE bucket into the GREEN slot
          // (`(b >> 4) << 4` instead of `b >> 4`), which ORs the two nibbles
          // and merges every cream/gold family colour into one bucket: the
          // whole warm half of a kitchen frame read as a single 60+ % flat
          // colour. The key must be identical to the 250 ms sampler's or the
          // two halves of this gate measure different cameras (finding,
          // stage4-watch2 dense-window tuning; the corrected meter puts
          // every shipped frame at 24–49 %, the buggy one reported 63–89 %).
          const key = ((d[i]! >> 4) << 8) | ((d[i + 1]! >> 4) << 4) | ((d[i + 2]! >> 4) << 0)
          hist.set(key, (hist.get(key) ?? 0) + 1)
          n++
        }
        let mx = 0
        for (const v of hist.values()) if (v > mx) mx = v
        buckets.set(bucket, { share: mx / n, status: st })
      })) as typeof window.requestAnimationFrame
  })

  for (const [level, build] of [
    ['kitchen01', 'par'],
    ['kitchen04', 'par'],
    ['kitchen02', 'par'],
    // L02's SECOND lane (playtest M: the watchability wall was level 2 of
    // the ladder — both Two Ways lines are now framed-tested, not just the
    // lazy one the 250 ms stage-3 strip happened to shoot)
    ['kitchen02', 'alt'],
  ] as const) {
    const line = `${level}:${build}`
    await page.goto(`/?level=${level}&build=${build}&launch=1`)
    await expect
      .poll(async () => (await page.locator('#gw-result').isVisible().catch(() => false)), { timeout: 30_000 })
      .toBe(true)
    await page.waitForTimeout(400)
    const strip = (await page.evaluate(() =>
      [...((window as unknown as Record<string, unknown>).__gwStrip as Map<number, { share: number; status: string }>).entries()])) as [number, { share: number; status: string }][]
    await page.evaluate(() =>
      ((window as unknown as Record<string, unknown>).__gwStrip as Map<number, unknown>).clear())

    const running = (s: string): boolean => /running/.test(s)
    const release = strip.find(([, s]) => running(s.status))?.[0]
    const terminal = strip.find(([b, s]) => release !== undefined && b >= release && !running(s.status) && s.status !== '' && !/ready|pieces/.test(s.status))?.[0]
    expect(release, `${line}: never saw a running status`).toBeDefined()
    expect(terminal, `${line}: never reached a terminal status`).toBeDefined()

    // the dense window: every 100 ms bucket of the FINAL SECOND before the
    // terminal step (plus, for the report, the whole-run worst)
    const final = strip.filter(([b]) => b >= terminal! - 10 && b < terminal!)
    const allWorst = strip.reduce((a, b) => (b[1].share > a[1].share ? b : a))
    // eslint-disable-next-line no-console
    console.log(
      `filmstrip ${line}: ${strip.length} buckets, final-second ${final.length} frames @100 ms, final worst ${(Math.max(...final.map(([, s]) => s.share)) * 100).toFixed(1)} %, whole-run worst ${(allWorst[1].share * 100).toFixed(1)} %`,
    )
    expect(final.length, `${line}: final second must hold >= 9 dense frames`).toBeGreaterThanOrEqual(9)
    for (const [b, s] of final) {
      expect(
        s.share,
        `${line}: dense frame at bucket ${b} (${((b - release!) * 0.1).toFixed(1)} s after release): ${(s.share * 100).toFixed(1)} % single colour`,
      ).toBeLessThanOrEqual(MAX_DOMINANT)
    }
    // and the pre-existing contract on these lines too: the 250 ms
    // grid (every 3rd bucket here, same quantiser as the PNG sampler)
    for (const [b, s] of strip.filter(([bb]) => bb % 2 === 0)) {
      expect(s.share, `${level}: frame at bucket ${b}: ${(s.share * 100).toFixed(1)} %`).toBeLessThanOrEqual(MAX_DOMINANT)
    }
  }
})
