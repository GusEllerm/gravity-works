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
import * as THREE from 'three'

const SAMPLE_MS = 250
const MAX_DOMINANT = 0.6


/** THE IN-PAGE STRIP SAMPLER (stage-4 mechanism, program T1.2): a rAF
 *  wrapper that quantises every drawn frame into 100 ms buckets and
 *  meters the dominant-colour share in-page. Sampling through page
 *  round-trips cannot keep a 250 ms cadence through the post chain that
 *  program T1.2 made the page default (a `canvas.screenshot()` round-trip
 *  costs ~350 ms), and the gate is a property of the CAMERA, not of the
 *  capture pipe — this sampler was already the dense gate's answer to the
 *  same problem, and both halves of this file now share it. */
async function installStrip(page: import('@playwright/test').Page): Promise<void> {
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
}

test('L02 par run filmstrip every 250 ms: no frame >60 % single-colour', async ({ page }) => {
  test.slow()
  await installStrip(page)
  // WARM START (stage-4 L02-redesign follow-through): the line's par run is
  // 1.00–1.13 s of SIMULATION now (pars table, LD 2026-10-09), and the old
  // launch=1 + poll-for-running start spent 300–500 ms of that second on
  // wasm boot and poll lag. Clicking Launch on a booted page starts the
  // strip AT the release tick instead: the sample clock and the run clock
  // share a zero.
  //
  // SAMPLING MOVED IN-PAGE at program T1.2 (see `installStrip`): the
  // screenshot-round-trip sampler cost ~350 ms per sample once the post
  // stack became the page default, which fit only ~4 samples inside the
  // ~1.1 s run — a capture-pipe cost, not a missing frame. The buckets
  // below are frames the rAF loop ACTUALLY drew (the dense gate's own
  // mechanism), so the 250 ms grid and the coverage floor measure the
  // camera again.
  await page.goto('/?level=kitchen02&build=par')
  await expect(page.locator('#gw-status')).toContainText('ready', { timeout: 60_000 })
  await page.click('#gw-launch')
  await expect
    .poll(async () => (await page.locator('#gw-result').isVisible().catch(() => false)), { timeout: 30_000 })
    .toBe(true)
  await page.waitForTimeout(400)
  const strip = (await page.evaluate(() =>
    [...((window as unknown as Record<string, unknown>).__gwStrip as Map<number, { share: number; status: string }>).entries()])) as [number, { share: number; status: string }][]
  await page.evaluate(() =>
    ((window as unknown as Record<string, unknown>).__gwStrip as Map<number, unknown>).clear())

  // the running window, and the 250 ms grid inside it (every 2nd ~100 ms
  // bucket of a 60 fps strip is the dense gate's same quantiser as the
  // old PNG sampler's 250 ms wall-clock boundaries)
  const running = strip.filter(([, x]) => /running/.test(x.status))
  expect(running.length, 'the run was never sampled running').toBeGreaterThan(0)
  const frames = running.filter(([b]) => b % 2 === 0)
  // eslint-disable-next-line no-console
  console.log(
    `filmstrip: ${frames.length} frames, worst ${(Math.max(...frames.map(([, x]) => x.share)) * 100).toFixed(1)} %`,
  )
  // coverage of the strip, not a magic count (same shape the dense gate
  // uses): the running window must not have collapsed (< 9 × 100 ms
  // buckets would mean L02's ~1 s par line stopped being a second-long
  // run — a PHYSICS fact the pars table gates, surfaced here honestly),
  // and the 250 ms grid must cover it with a gap no wider than one
  // sample-and-read period
  expect(running.length, 'L02 par run window collapsed below ~0.7 s').toBeGreaterThanOrEqual(7)
  expect(frames.length).toBeGreaterThanOrEqual(Math.floor(running.length / 2) - 1)
  for (let i = 1; i < frames.length; i++) {
    expect((frames[i]![0] - frames[i - 1]![0]) * 100, `gap before frame ${i}`).toBeLessThan(SAMPLE_MS * 2)
  }
  for (const [b, x] of frames) {
    expect(x.share, `frame at bucket ${b}: ${(x.share * 100).toFixed(1)} % single colour`).toBeLessThanOrEqual(
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
  await installStrip(page)

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
    // WARM START (see the 250 ms gate above): launch=1 released the run
    // mid-BOOT, so on the ~1 s L02 lines the "final second" window
    // overlapped wasm/shader warm-up — wall-clock buckets went missing that
    // were never the camera's (coverage flake, red at baseline e37bc70 on
    // fast machines). Releasing from a CLICK on a booted page puts the
    // whole dense window inside a running, fully-drawn run.
    await page.goto(`/?level=${level}&build=${build}`)
    await expect(page.locator('#gw-status')).toContainText('ready', { timeout: 60_000 })
    await page.click('#gw-launch')
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

/**
 * STAGE 4 — THE FAILURE END-HOLD GATE (playtest R round 3: "on the K4
 * failure the camera buried itself in a peach wall — could not see the
 * marble fall"; playtest S: "the result text overlays exactly where the
 * car died — I never saw where K3's line let go"). The success end-hold
 * always framed well; on fell/stalled the shell now holds a WIDE view of
 * the DEATH SITE (the car's last seeable point) with the eye cleared over
 * the set solids — `frameDeathHold`, see Modules/camera.
 *
 * Scripted wrong build on L04: the par line with its landing (and spare
 * straight) REMOVED through the shipped Remove button — a chain that
 * lets go before the sink, `fell` with the car coming to rest below the
 * counter. The gate samples the dense 100 ms grid across the final second
 * AND the whole end-hold window after the terminal step (the frames the
 * verdict panel is shown over — the stage-4 dense window stopped at the
 * terminal step; the failure hold lives AFTER it), same bar: no frame may
 * exceed the single-colour share, and the death site must be IN the frame
 * (projected through the live camera: in front of the eye and inside the
 * canvas) — a hold that shows a beautiful wall of the launch side is
 * exactly what the wide death-hold exists to prevent.
 */
test('L04 scripted wrong build: the failure end-hold never wall-buries and keeps the death site on screen', async ({ page }) => {
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
          const key = ((d[i]! >> 4) << 8) | ((d[i + 1]! >> 4) << 4) | ((d[i + 2]! >> 4) << 0)
          hist.set(key, (hist.get(key) ?? 0) + 1)
          n++
        }
        let mx = 0
        for (const v of hist.values()) if (v > mx) mx = v
        buckets.set(bucket, { share: mx / n, status: st })
      })) as typeof window.requestAnimationFrame
  })

  await page.goto('/?level=kitchen04&build=par')
  await expect(page.locator('#gw-status')).toContainText('ready', { timeout: 60_000 })
  // the WRONG build through the shipped controls: strip the run-out back
  // to ramp->lip->drop so the line lets go before the sink
  await page.click('#gw-remove-piece')
  await page.waitForTimeout(500)
  await page.click('#gw-remove-piece')
  await page.waitForTimeout(700)
  await page.click('#gw-launch')
  await expect
    .poll(async () => (await page.locator('#gw-status').textContent()) ?? '', { timeout: 30_000, intervals: [25, 50] })
    .toMatch(/fell off|stalled|timed out/)
  // hold the failure framing for a full 1.4 s of dense samples
  await page.waitForTimeout(1500)

  const strip = (await page.evaluate(() =>
    [...((window as unknown as Record<string, unknown>).__gwStrip as Map<number, { share: number; status: string }>).entries()])) as [number, { share: number; status: string }][]
  const terminal = strip.find(([b, s]) => /fell off|stalled|timed out/.test(s.status) && b > 0)![0]
  // the final second BEFORE the terminal step (the run camera's last word)
  // and the end-hold window AFTER it (the failure hold's word)
  const window_ = strip.filter(([b]) => b >= terminal - 10 && b < terminal + 15)
  expect(window_.length, 'failure window must hold >= 20 dense frames').toBeGreaterThanOrEqual(20)
  for (const [b, s] of window_) {
    expect(
      s.share,
      `failure frame at bucket ${b} (${((b - terminal) * 0.1).toFixed(1)} s around the terminal step): ${(s.share * 100).toFixed(1)} % single colour — wall-buried`,
    ).toBeLessThanOrEqual(MAX_DOMINANT)
  }

  // THE DEATH SITE IS ON SCREEN: the settled car projects in FRONT of the
  // eye and inside the canvas box, under a generous 20° margin
  const box = (await page.locator('#gw-canvas').boundingBox())!
  const pose = await page.evaluate(() => (window as unknown as Record<string, () => { pos: number[]; quat: number[] }>).__gwCameraPose())
  const car = await page.evaluate(() => (window as unknown as Record<string, () => number[] | null>).__gwCarPos())
  expect(car, 'no settled car position').not.toBeNull()
  const eye = new THREE.Vector3(...pose.pos)
  const q = new THREE.Quaternion(...pose.quat)
  const toCar = new THREE.Vector3(...car!).sub(eye)
  const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(q)
  const up = new THREE.Vector3(0, 1, 0).applyQuaternion(q)
  const right = new THREE.Vector3(1, 0, 0).applyQuaternion(q)
  const zc = toCar.dot(fwd)
  expect(zc, 'the death site is BEHIND the camera').toBeGreaterThan(0.1)
  const f = 1 / Math.tan((35 * Math.PI) / 180 / 2)
  const ndcX = (toCar.dot(right) * f) / zc / (box.width / box.height)
  const ndcY = (toCar.dot(up) * f) / zc
  expect(Math.abs(ndcX), `death site off-frame horizontally (ndc ${ndcX.toFixed(2)})`).toBeLessThan(1.2)
  expect(Math.abs(ndcY), `death site off-frame vertically (ndc ${ndcY.toFixed(2)})`).toBeLessThan(1.2)
})
