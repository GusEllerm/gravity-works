/**
 * Post-stack GPU leak gate (stage-3 review finding 2): the game shell's
 * `rebuild()` cycles the WHOLE post stack — build → dispose → build — on
 * every placement while `?post=on`, so a dispose that misses a stage leaks
 * its GPU objects once per piece the player places. The original defect was
 * `PostStack.dispose()` omitting `stages.grade` (the terminal ShaderPass:
 * material + program + fullscreen quad).
 *
 * The probe is the harness leak seam (`window.__postCycle`, see
 * `src/dev/harness.ts`): it runs the exact build→one-frame→dispose cycle on
 * the live renderer against an EMPTY scene (scene materials would compile
 * a one-time linear-variant program cache entry that belongs to the SCENE,
 * not to the stack — see the probe's comment) and reports `renderer.info`
 * before/after. 20 cycles is the review's number — enough that a
 * one-object-per-cycle leak is far past any allocator noise.
 *
 * The assertions are on the counters the leak lives in:
 *   programs  — must return EXACTLY to baseline (the grade program is the
 *               discriminating count: undisposed materials pin it in the
 *               cache forever, so pre-fix the count ends +1);
 *   textures  — must return EXACTLY to baseline (composer/tilt/bloom render
 *               targets; disposed correctly even pre-fix — this guards
 *               regressions there);
 *   geometries — AT or ONE BELOW baseline: the post passes share three.js's
 *               MODULE-LEVEL fullscreen-triangle geometry (Pass.js
 *               `_geometry`), so the final dispose can detach that shared
 *               buffer from the renderer cache until the next render
 *               re-uploads it. Anything above baseline is a leak.
 */
import { test, expect } from '@playwright/test'

interface PostCycleWindow {
  __sceneReady?: boolean
  __sceneError?: string
  __postCycle?: (cycles: number) => {
    start: { programs: number; geometries: number; textures: number }
    end: { programs: number; geometries: number; textures: number }
    trace: number[]
  }
}

const CYCLES = 20

test('post stack build→dispose x20 returns renderer.info to baseline (no per-placement GPU leak)', async ({ page }) => {
  test.setTimeout(240_000)
  // Small canvas: the probe measures bookkeeping, not rasterisation cost.
  // post=off on purpose: the page itself must hold NO grade program at the
  // baseline snapshot, so a stack whose dispose forgets the grade pins a
  // cache entry that is otherwise absent and shows as programs baseline+1.
  await page.goto('/?harness=1&scene=kitchen-set&shot=establishing&size=480x270')
  await page.waitForFunction(
    () => {
      const w = window as unknown as PostCycleWindow
      return w.__sceneReady === true || w.__sceneError !== undefined
    },
    undefined,
    { timeout: 60_000 },
  )
  const err = await page.evaluate(() => (window as unknown as PostCycleWindow).__sceneError)
  expect(err, `harness scene error: ${err}`).toBeUndefined()

  const r = await page.evaluate(
    (cycles) => (window as unknown as PostCycleWindow).__postCycle!(cycles),
    CYCLES,
  )
  const line =
    `[post-leak] cycles=${CYCLES} programs ${r.start.programs}->${r.end.programs} ` +
    `geometries ${r.start.geometries}->${r.end.geometries} ` +
    `textures ${r.start.textures}->${r.end.textures} (trace: ${r.trace.join(',')})`
  console.log(line)
  test.info().annotations.push({ type: 'post-leak', description: line })

  expect(r.end.programs, `programs grew across ${CYCLES} build→dispose cycles — a pass is not disposed`).toBe(r.start.programs)
  expect(r.end.textures, `render targets leaked across ${CYCLES} cycles`).toBe(r.start.textures)
  expect(
    r.end.geometries,
    `geometries grew across ${CYCLES} cycles (allowed: at or one below baseline — the shared fullscreen-triangle geometry detaches on the final dispose)`,
  ).toBeLessThanOrEqual(r.start.geometries)
  expect(r.end.geometries).toBeGreaterThanOrEqual(r.start.geometries - 1)
})
