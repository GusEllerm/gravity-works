/**
 * T0.5 BLINDNESS GATE 2 (engineering evaluation R5/M8): the post-stack leak
 * gate (`post-dispose.spec.ts`) counts GPU objects around the POST STACK
 * only, through the harness seam — the game shell's per-edit
 * `world?.dispose()` was never watched, so gutting `World.dispose`'s scene
 * traversal left the WHOLE suite green. This gate puts the same
 * renderer.info counter idiom around the REAL shell: a real page, real tray
 * clicks, place-then-remove edit rounds that drive `rebuild()` — and with it
 * a fresh `World.create` + a `dispose()` of the previous world's scene — on
 * every single click.
 *
 * The counters are read through the shell's WebGL-boundary seam
 * (`window.__gwRendererInfo` in `src/boot.ts`, the `renderer.info` triple:
 * live programs + geometries/textures). Between every edit the spec waits a
 * few rendered frames: `renderer.info.memory` only counts geometries that
 * were UPLOADED, so the probe must actually draw each world or a gutted
 * dispose could hide by never being rendered — the frames are the teeth.
 *
 * Budget (measured on the green run, 4 place-all-3 + remove-all-3 rounds =
 * 24 world cycles, kitchen01): the correct dispose returns geometries to
 * the warm baseline exactly, programs and textures never move; the budget
 * below leaves one notch for allocator/variant noise and is stated, not
 * guessed. Mutation "gut World.dispose's scene traversal" adds the leaked
 * track/ground/car meshes of EVERY discarded world (dozens of geometries
 * per round, monotonic) and lands far outside it.
 */
import { test, expect } from '@playwright/test'
import { goto } from './goto.ts'

interface LeakWindow {
  __gwRendererInfo?: () => { programs: number; geometries: number; textures: number }
}

const ROUNDS = 4
// measured green drift is 0 on all three counters; one notch of stated slack
// for allocator noise, while a gutted dispose leaks ~10-20x this per round.
const BUDGET = { programs: 1, geometries: 2, textures: 1 }

const snap = (page: import('@playwright/test').Page) =>
  page.evaluate(() => (window as unknown as LeakWindow).__gwRendererInfo!())

/** n rendered frames — each world must hit the GPU before its disposal (or
 *  absence of it) can show in renderer.info.memory. */
const frames = (page: import('@playwright/test').Page, n: number) =>
  page.evaluate(
    (count) =>
      new Promise<void>((resolve) => {
        let left = count
        const step = () =>
          requestAnimationFrame(() => {
            if (--left <= 0) resolve()
            else step()
          })
        step()
      }),
    n,
  )

test("the game shell's place→remove cycles return GPU counters to baseline (World.dispose leak gate)", async ({ page }) => {
  test.setTimeout(300_000)
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(String(err)))
  await goto(page, '/?level=kitchen01')
  await expect(page.locator('#gw-status')).toContainText('ready', { timeout: 30_000 })
  await frames(page, 5) // the boot world must be fully uploaded before the baseline

  const placeAll = async (kinds: string[]) => {
    for (const [i, kind] of kinds.entries()) {
      await page.click(`#gw-tray-${kind}`)
      await page.click('#gw-place')
      await expect(page.locator('#gw-piece-count')).toHaveText(`${i + 1} of 3 pieces used`)
      await frames(page, 3) // draw the rebuilt world before the next edit
    }
  }
  const removeAll = async (kinds: string[]) => {
    for (const i of kinds.map((_, k) => kinds.length - k)) {
      await page.click('#gw-remove-piece')
      await expect(page.locator('#gw-piece-count')).toHaveText(`${i - 1} of 3 pieces used`)
      await frames(page, 3)
    }
  }
  const kinds = ['gapLip', 'drop', 'landing']

  // Round 1 doubles as the warm-up: first-cycle program compiles and lazy
  // uploads are one-time, so the BASELINE is taken warm, after round 1 —
  // exactly the state round 4 ends in (empty fixture track, world rendered).
  await placeAll(kinds)
  await removeAll(kinds)
  const warm = await snap(page)

  for (let r = 1; r < ROUNDS; r++) {
    await placeAll(kinds)
    await removeAll(kinds)
  }
  await frames(page, 5) // settle: the final world has drawn
  const end = await snap(page)
  await expect(page.locator('#gw-piece-count')).toHaveText('0 of 3 pieces used')

  const line =
    `[shell-leak] rounds=${ROUNDS} (=${ROUNDS * 6} rebuilds) ` +
    `programs ${warm.programs}->${end.programs} geometries ${warm.geometries}->${end.geometries} ` +
    `textures ${warm.textures}->${end.textures} (budget +${BUDGET.programs}/+${BUDGET.geometries}/+${BUDGET.textures})`
  console.log(line)
  test.info().annotations.push({ type: 'shell-leak', description: line })

  expect(
    end.geometries,
    `geometries grew across ${ROUNDS} place→remove rounds — World.dispose is not freeing the discarded scene`,
  ).toBeLessThanOrEqual(warm.geometries + BUDGET.geometries)
  expect(
    end.programs,
    `programs grew across ${ROUNDS} place→remove rounds — materials of discarded worlds are never disposed`,
  ).toBeLessThanOrEqual(warm.programs + BUDGET.programs)
  expect(
    end.textures,
    `textures grew across ${ROUNDS} place→remove rounds — a per-world render target or map leaked`,
  ).toBeLessThanOrEqual(warm.textures + BUDGET.textures)

  expect(errors).toEqual([])
})
