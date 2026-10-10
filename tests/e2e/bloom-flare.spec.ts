/**
 * ROUND-2 LANE D — the flare-probe gate. The never-list ban ("no bloom on
 * small bright props at DEFAULT tier") must hold in MID-RUN frames, not just
 * stills, so the censor/histogram harness gains a probe: the synthetic
 * `flare-probe` scene puts a 4.4 mm white disc (the duck-specular / goal-pin
 * / lamp-flare / sprinkler-dot class) next to a 100 mm area control through
 * the real post stack, and THIS spec measures the small disc's bloom SPREAD
 * from the pixels — the radial reach of glow above the deck floor, and the
 * halo-pixel budget in the annulus just outside the disc.
 *
 * The stated number (re-baselined 2026-10-11, see
 * `Sessions/2026-10-11 Round2 bloom.md`): with the size gate ON the small
 * disc's glow reaches ≤ SPREAD_MAX px beyond its edge and its annulus halo
 * budget is ≤ HALO_BUDGET px; the pre-gate spread measured on the same rig
 * with the gate disabled (`sizeGateTexels: 0`) was 5.5 px / 217 halo px. The
 * large disc keeps a nonzero edge glow (the gate must thin halos, never
 * switch the pass off).
 */
import { test, expect } from '@playwright/test'
import { PNG } from 'pngjs'

const SPREAD_MAX = 2 // px of glow beyond the small disc's edge (pre-gate 5.5)
const HALO_BUDGET = 30 // annulus pixels above the bar around the small disc (pre-gate 217)

interface ProbePoint {
  x: number
  y: number
  rPx: number
}

const luma = (p: PNG, x: number, y: number): number => {
  const i = (y * p.width + x) * 4
  return 0.2126 * p.data[i] + 0.7152 * p.data[i + 1] + 0.0722 * p.data[i + 2]
}

test.use({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 })

test('flare probe: small disc bloom spread closed at default tier, area control still glows', async ({ page }) => {
  await page.goto('/?harness=1&scene=flare-probe&shot=hero&post=on')
  await page.waitForFunction(
    () => {
      const w = window as unknown as { __sceneReady?: boolean; __sceneError?: string }
      return w.__sceneReady === true || w.__sceneError !== undefined
    },
    undefined,
    { timeout: 60_000 },
  )
  const err = await page.evaluate(() => (window as unknown as { __sceneError?: string }).__sceneError)
  expect(err, `harness scene error: ${err}`).toBeUndefined()

  const probe = (await page.evaluate(
    () => (window as unknown as { __flareProbe: { small: ProbePoint; large: ProbePoint } }).__flareProbe,
  )) as { small: ProbePoint; large: ProbePoint }

  const buf = (await page.locator('canvas').screenshot()) as Buffer
  const png = PNG.sync.read(buf)

  // deck floor: median luma far from both discs — the bar is relative to it
  const far: number[] = []
  for (let y = 0; y < png.height; y += 7) {
    for (let x = 0; x < png.width; x += 7) {
      const ds = Math.hypot(x - probe.small.x, y - probe.small.y)
      const dl = Math.hypot(x - probe.large.x, y - probe.large.y)
      if (ds > probe.small.rPx + 60 && dl > probe.large.rPx + 60) far.push(luma(png, x, y))
    }
  }
  far.sort((a, b) => a - b)
  const bar = far[Math.floor(far.length / 2)] + 15

  const measure = (c: ProbePoint, inner: number, outer: number): { halo: number; spread: number } => {
    let halo = 0
    let spread = 0
    for (let y = Math.max(0, Math.floor(c.y - outer - 2)); y < Math.min(png.height, Math.ceil(c.y + outer + 2)); y++) {
      for (let x = Math.max(0, Math.floor(c.x - outer - 2)); x < Math.min(png.width, Math.ceil(c.x + outer + 2)); x++) {
        const d = Math.hypot(x - c.x, y - c.y)
        if (d < inner || d > outer) continue
        if (luma(png, x, y) >= bar) {
          halo++
          if (d - c.rPx > spread) spread = d - c.rPx
        }
      }
    }
    return { halo, spread }
  }

  const small = measure(probe.small, probe.small.rPx + 1, probe.small.rPx + 16)
  const large = measure(probe.large, probe.large.rPx + 1, probe.large.rPx + 12)
  console.log(
    `[flare-probe] deck=${far[Math.floor(far.length / 2)].toFixed(1)} bar=${bar.toFixed(1)} ` +
      `small r=${probe.small.rPx.toFixed(1)}px halo=${small.halo}px spread=${small.spread.toFixed(1)}px | ` +
      `large r=${probe.large.rPx.toFixed(1)}px halo=${large.halo}px spread=${large.spread.toFixed(1)}px`,
  )

  expect(
    small.spread,
    `small-disc bloom spread ${small.spread.toFixed(1)} px exceeds the ${SPREAD_MAX} px gate ` +
      `(halo ${small.halo} px) — a ≤5 mm white dot is blooming again (never-list ban, round-2 Lane D)`,
  ).toBeLessThanOrEqual(SPREAD_MAX)
  expect(small.halo, `small-disc halo budget ${small.halo} px exceeds ${HALO_BUDGET}`).toBeLessThanOrEqual(HALO_BUDGET)
  expect(large.halo, 'area-source control lost its bloom — the size gate over-closed').toBeGreaterThan(0)
})
