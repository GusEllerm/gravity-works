import { test, expect } from '@playwright/test'
import { goto } from './goto.ts'

/**
 * T0.6 / R9 — CROSS-TAB SAVE RACE (Evaluation 2026-10-09 engineering R9,
 * Recommendations 2026-10-09 technical §5: "fix it cheaply and honestly,
 * don't build leases"). `rememberBuild`/`persist` are load-merge-write with
 * no lease: a tab whose WRITE carries an envelope read BEFORE another tab's
 * write silently drops that other tab's record (last writer wins the whole
 * envelope). The fix is a newest-wins MERGE on the `builds`/`stars` maps —
 * per-key timestamped records INSIDE the v2 envelope (schema-tolerant, no
 * v3 bump; `SAVE_VERSION === 2` stays true), merged on every write.
 *
 * (i) THE RACE, made deterministic: tab B READS the envelope, tab A WRITES a
 *     real placement through the shell, tab B then WRITES from its stale
 *     view (exactly the interleaving the load-merge-write suffers, widened
 *     to wall-clock so the spec is honest and never flaky). RED today: B's
 *     save clobbers A's record. GREEN with the merge: A's record survives
 *     with its stamp and B's own change lands — newest key wins per key.
 * (ii) THE RECOMMENDATION'S PROOF: two tabs on DIFFERENT LEVELS racing
 *     place-bursts — both records present after.
 *
 * Two TABS of one browser context — localStorage is per storage origin, so
 * two separate browser contexts would not actually share the key at all and
 * the race would be fiction. The mutation is the proof: delete the merge in
 * `saveSave` (write the envelope flat again) and test (i) goes RED.
 */

type SaveWindow = Window & {
  __gwSave?: {
    loadSave: () => {
      v: number
      builds: Record<string, string>
      settings: Record<string, unknown>
      progress: { stars: Record<string, number>; reached: Record<string, true> }
    }
    saveSave: (data: unknown) => void
  }
}

const ready = async (page: import('@playwright/test').Page) => {
  await expect(page.locator('#gw-status')).toContainText('ready', { timeout: 30_000 })
}

const place = async (page: import('@playwright/test').Page, kind: string) => {
  const before = await page.evaluate(() =>
    (JSON.parse((window as unknown as { __gwBuildJson: () => string }).__gwBuildJson()) as { pieces: unknown[] }).pieces.length,
  )
  await page.click(`#gw-tray-${kind}`)
  await page.click('#gw-place')
  // WAIT FOR THIS EDIT TO LAND before returning: the burst spec runs two
  // tabs in parallel and a placement still mid-`onChange` when the NEXT
  // click arrives serialises the interleaving unpredictably (load-dependent
  // flake, seen in the full parallel suite). The builder's own piece count
  // is the truth that THIS edit was applied — the burst cadence stays the
  // spec's (the writes' debounce windows still overlap; the click's own
  // effect just settles first).
  await expect
    .poll(
      async () => {
        const json = await page.evaluate(() =>
          (window as unknown as { __gwBuildJson?: () => string }).__gwBuildJson?.(),
        )
        if (!json) return -1
        return (JSON.parse(json) as { pieces: unknown[] }).pieces.length
      },
      { timeout: 30_000 },
    )
    .toBeGreaterThan(before)
}

const rawSave = (page: import('@playwright/test').Page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem('gravity-works.save') ?? 'null'))

/** The save-write seam `saveSave` stamps at every install (see
 *  `src/save/save.ts`): a per-document counter + last-write stamp, fed by
 *  the `gw-save-written` event. The race spec waits on the FACT of a
 *  settled writer — one write past `after` and then nothing for `quietMs`
 *  (longer than the 350 ms autosave window) — never on a guessed timeout. */
const settleSaves = async (page: import('@playwright/test').Page, after: number) => {
  await page.waitForFunction(
    (n) => {
      const w = window as unknown as { __gwSaveWrites?: number; __gwSaveWriteAt?: number };
      return (w.__gwSaveWrites ?? 0) > n && performance.now() - (w.__gwSaveWriteAt ?? 0) > 600;
    },
    after,
    { timeout: 30_000 },
  )
}
const saveWrites = (page: import('@playwright/test').Page) =>
  page.evaluate(() => (window as unknown as { __gwSaveWrites?: number }).__gwSaveWrites ?? 0)

test('R9 race: a tab writing from a stale view merges — it cannot clobber the other tab\'s record', async ({
  browser,
}) => {
  const context = await browser.newContext() // ONE storage origin — two tabs
  const tabA = await context.newPage()
  const tabB = await context.newPage()
  const errors: string[] = []
  for (const p of [tabA, tabB]) p.on('pageerror', (err) => errors.push(String(err)))

  await goto(tabA, '/?level=kitchen01')
  await ready(tabA)
  await goto(tabB, '/?level=kitchen02')
  await ready(tabB)

  // the race's READ: tab B's view of the envelope, taken BEFORE tab A writes
  const stale = await tabB.evaluate(() => (window as unknown as SaveWindow).__gwSave!.loadSave())

  // tab A's write: a REAL placement through the shell (the real code path)
  const writesBeforeA = await saveWrites(tabA)
  await place(tabA, 'gapLip')
  await expect
    .poll(() => rawSave(tabA), { timeout: 10_000 })
    .toHaveProperty(['builds', 'kitchen01'])
  // let any trailing write of A's burst land FIRST (callout marks, the
  // last debounce window) — the STALE WRITE below must be the only writer
  // in flight, or the spec races A's late MERGE instead of proving B's.
  // Event-driven: A's seam shows one+ writes past the placement and then
  // true silence, which is the settled state the fixed 800 ms was guessing
  // at (and under CI's CPU, undershooting — the wedge this spec reds into).
  await settleSaves(tabA, writesBeforeA)
  // …and tab B's OWN renderer must SEE A's record: the key is shared per
  // context but localStorage's cross-process read-after-write is only
  // eventually consistent (per-tab caches), and a merge whose DISK read is
  // blind is a different experiment than one whose INCOMING DATA is stale
  // (measured red ~1 run in 8 under contention without this wait). The
  // premise stays exactly as honest: `stale` is still B's pre-A envelope.
  await expect
    .poll(() => rawSave(tabB), { timeout: 30_000 })
    .toHaveProperty(['builds', 'kitchen01'])

  // tab B's DELAYED WRITE: the envelope from its stale read, plus its own
  // change — the save-side of a load-merge-write racing another tab
  stale.progress.stars.kitchen02 = 3
  await tabB.evaluate((data) => (window as unknown as SaveWindow).__gwSave!.saveSave(data), stale)

  // A's record SURVIVES the stale write (it is stamped, per key, in the
  // envelope) and B's own change lands. Today the stale write wins the
  // WHOLE envelope and A's placement is gone: RED.
  const saved = await rawSave(tabA)
  expect(saved.builds.kitchen01).toBeTruthy()
  const starsK02 = saved.progress.stars.kitchen02
  expect(typeof starsK02 === 'object' ? starsK02.n : starsK02).toBe(3)
  expect(errors).toEqual([])
  await context.close()
})

test('R9 bursts: two tabs on different levels racing placements keep BOTH records', async ({
  browser,
}) => {
  // two full app boots + four debounce windows + the save-merge polls do
  // not fit the default 30 s once the parallel suite shares the box
  test.slow()
  const context = await browser.newContext()
  const tabA = await context.newPage()
  const tabB = await context.newPage()
  const errors: string[] = []
  for (const p of [tabA, tabB]) p.on('pageerror', (err) => errors.push(String(err)))

  await goto(tabA, '/?level=kitchen01')
  await ready(tabA)
  await goto(tabB, '/?level=kitchen02')
  await ready(tabB)

  // interleaved bursts: each tab keeps editing its OWN level while the
  // other one is mid-debounce-window (kitchen01: gapLip+drop; kitchen02:
  // straight+drop — every kind inside its tray budget)
  await Promise.all([place(tabA, 'gapLip'), place(tabB, 'straight')])
  await Promise.all([place(tabA, 'drop'), place(tabB, 'drop')])
  // heal-write each tab (through the real load-merge-write) UNTIL the
  // envelope settles on the union: a merge never drops a key, so repeated
  // sequential heals converge from any interleaving the parallel bursts
  // left behind. This is the recommendation's "both records present after"
  // GUARD; the deterministic clobber PROOF is the race spec above.
  await expect
    .poll(
      async () => {
        for (const tab of [tabA, tabB]) {
          await tab.evaluate(() => {
            const w = window as unknown as SaveWindow
            w.__gwSave!.saveSave(w.__gwSave!.loadSave())
          })
        }
        const saved = await rawSave(tabA)
        return Boolean(saved?.builds?.kitchen01 && saved?.builds?.kitchen02)
      },
      { timeout: 30_000 },
    )
    .toBe(true)
  expect(errors).toEqual([])
  await context.close()
})
