/**
 * T0.5 BLINDNESS GATE 1 (engineering evaluation R5/M2): the `pagehide` specs
 * were mutation-BLIND — deleting the `visibilitychange → hidden` autosave
 * flush in `src/boot.ts` left the whole suite green because the old spec
 * dispatched a synthetic `pagehide`, an event a mobile app-switch NEVER fires
 * (the tab is put away; the document lives on, hidden). This spec kills page
 * visibility the way an app-switch does — NO pagehide, NO unload — and proves
 * the flush still stores the edit that is pending when the kill lands.
 *
 * What "REAL" means on this surface (measured 2026-10-09, Chromium 153 via
 * Playwright's CDP): `Emulation.setVisibilityStateOverride` and
 * `Page.setPageVisibility` are ABSENT from the protocol;
 * `Page.setWebLifecycleState` accepts only frozen/active and never moves
 * `document.visibilityState`; `Browser.setWindowBounds` minimized changes
 * nothing; and Playwright pages are separate windows whose active tabs all
 * report visible — even a same-window `Target.createTarget(background)` +
 * `activateTarget` and even headed mode never flip a tab to hidden. No
 * automation-reachable REAL page→hidden transition exists on any surface
 * (headless shell, new headless, headed) — matching the pacing crew's
 * finding. So the gate drives the CLOSEST REAL-KILL PROXY: the real event
 * chain — `document.visibilityState` reads 'hidden' and a genuine
 * `visibilitychange` is dispatched at boot's actual listener — and NEVER a
 * synthetic `pagehide`; the unit half of the gate lives in
 * `tests/unit/lifecycle.test.ts`. The residual (dispatch is not
 * `isTrusted`; the override is an own-property shim) is stated here, in the
 * annotation, and in the session note. If a surface DOES background a tab
 * (the probe at startup), the spec takes the real steal instead and demands
 * trusted events.
 *
 * Race discipline (parallel CI): the write-baseline is a SETTLED two-piece
 * build on disk; the pending edit at kill time is exactly ONE cheap
 * `#gw-remove-piece` click, and the kill itself is one atomic in-page
 * evaluate — read disk, flip visibilityState, dispatch, read the recorder —
 * so no debounce timer can fire mid-gesture. The recorder listener
 * registers via addInitScript BEFORE boot's and snapshots the on-disk piece
 * count AT the event: a kill whose snapshot shows the debounce already won
 * (count 1) is rejected and the burst re-armed. The gate can only pass on a
 * kill that had something to save, and deleting boot's flush turns exactly
 * that kill red (mutation ledger, session note).
 */
import { test, expect } from '@playwright/test'
import { goto } from './goto.ts'

const DEBOUNCE_MS = 350 // the shell's autosave window (createBuildAutosave default) —
// P3: the spec waits on DISK STATE, not on this clock; it is documented here
// only so the race narrative stays readable.

interface VisRecord {
  state: string
  trusted: boolean
  /** tray pieces on disk at the instant the event reached the FIRST listener */
  pending: number
}
interface VisWindow {
  __vis: VisRecord[]
  __pagehide: number[]
}

const TRAY_KINDS = ['gapLip', 'drop', 'landing']

const savedPieces = (page: import('@playwright/test').Page) =>
  page.evaluate(
    (tray) => {
      const raw = localStorage.getItem('gravity-works.save')
      if (!raw) return -1
      // Program T1.2 note: the envelope has TWO record shapes by design (the
      // R9 newest-wins merge stamps a write as `{ t, s }`; an unstamped one
      // is the plain string) — the reader shipped reading the pre-R9 shape
      // only and threw on `{t,s}`. Read BOTH (`.v` rides as the quarantine
      // variant's field).
      const env = JSON.parse(raw) as { builds?: Record<string, string | { s?: string; v?: string }> }
      const rec = env.builds?.kitchen01
      const blob = typeof rec === 'string' || !rec ? rec : rec.s ?? rec.v
      if (!blob) return 0
      const pieces = (JSON.parse(blob) as { pieces: { def: string }[] }).pieces ?? []
      return pieces.filter((p) => (tray as string[]).includes(p.def)).length
    },
    TRAY_KINDS,
  )

test('a REAL background (app-switch, no pagehide) flushes the pending edit', async ({ page }) => {
  test.setTimeout(240_000)
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(String(err)))
  await page.addInitScript((tray) => {
    const w = window as unknown as VisWindow
    w.__vis = []
    w.__pagehide = []
    document.addEventListener('visibilitychange', (e) => {
      // snapshot the disk BEFORE any later listener (boot's flush) can write
      let pieces = -2
      try {
        const raw = localStorage.getItem('gravity-works.save')
        const env = raw ? (JSON.parse(raw) as { builds?: Record<string, string | { s?: string; v?: string }> }) : null
        const rec = env?.builds?.kitchen01
        const blob = typeof rec === 'string' || !rec ? rec : rec.s ?? rec.v
        const list = blob ? ((JSON.parse(blob) as { pieces: { def: string }[] }).pieces ?? []) : []
        pieces = list.filter((p) => (tray as string[]).includes(p.def)).length
      } catch {
        /* malformed save — the spec-side disk check reports it */
      }
      w.__vis.push({ state: document.visibilityState, trusted: e.isTrusted, pending: pieces })
    })
    window.addEventListener('pagehide', () => w.__pagehide.push(1))
  }, TRAY_KINDS)
  await goto(page, '/?level=kitchen01')
  await expect(page.locator('#gw-status')).toContainText('ready', { timeout: 30_000 })

  // Can this browser background a tab for real? Probe once, cheaply, with a
  // second tab created BEFORE any edits (a stray early flush on a clean
  // slate is a no-op). If yes, the kill is the real foreground steal.
  const other = await page.context().newPage()
  await goto(other, 'about:blank')
  let realPath = false
  await other.bringToFront()
  try {
    await page.waitForFunction(() => document.visibilityState === 'hidden', undefined, {
      polling: 25,
      timeout: 1_000,
    })
    realPath = true
  } catch {
    realPath = false
  }
  await page.bringToFront()
  await expect
    .poll(() => page.evaluate(() => document.visibilityState), { timeout: 5_000 })
    .toBe('visible')

  // Write baseline: TWO pieces settled on disk — settled PROVEN by polling
  // the disk itself (event-driven, the studio law), never by out-waiting a
  // wall-clock guess a loaded machine can outrun.
  const settleTo = (n: number) =>
    expect
      .poll(() => savedPieces(page), {
        // 40× the autosave window is the honest budget: the poll ENDS at
        // the write, the ceiling only guards a write that never comes
        timeout: DEBOUNCE_MS * 40,
        message: `the ${n}-piece autosave must have landed`,
      })
      .toBe(n)
  for (const [kind, n] of [
    ['gapLip', 1],
    ['drop', 2],
  ] as const) {
    await page.click(`#gw-tray-${kind}`)
    await page.click('#gw-place')
    await settleTo(n)
  }
  expect(await savedPieces(page), 'the settled two-piece write must have landed').toBe(2)

  // Kill loop. Accepted kill: the hidden event reached boot with the disk
  // STILL showing 2 (the remove pending) — the recorder says so. A race lost
  // (debounce wrote the 1-piece build first) re-arms: settle, re-place, try
  // again, so flakiness can only ever surface as a loud failure, never a
  // silent green.
  //
  // P3 (the SwiftShader mass-timeout audit): the proxy kill folds the EDIT
  // itself into the kill task. The old shape — Playwright remove-click, then
  // a SEPARATE evaluate to flip+dispatch — left one RPC boundary between
  // edit and kill, and under the parallel suite's CPU contention that gap
  // stretched past the 350 ms debounce: every attempt lost the race, every
  // attempt re-armed, and the spec died at its own 240 s timeout (“no kill
  // could be fired…”). Inside ONE page task no timer can interleave, so the
  // proxy race is now structurally unwinnable by the debounce — and the
  // re-arm settles by polling the disk, not by out-waiting clocks.
  let kill: VisRecord | null = null
  for (let attempt = 0; attempt < 8 && !kill; attempt++) {
    let killedBySteal = false
    if (realPath) {
      // the REAL steal keeps its trusted edit — the only place a native
      // remove click still belongs (the recorder proves which edit was
      // pending, so a lost race still re-arms honestly)
      await page.bringToFront()
      await page.click('#gw-remove-piece')
      await other.bringToFront()
      try {
        await page.waitForFunction(() => document.visibilityState === 'hidden', undefined, {
          polling: 25,
          timeout: 2_000,
        })
        killedBySteal = true
      } catch {
        killedBySteal = false
      }
    }
    if (!killedBySteal && !realPath) {
      // The proxy: ONE page task — (remove if the disk says nothing is
      // pending yet), flip, dispatch — so the debounce cannot interleave
      // between edit and kill, and no RPC boundary exists to stretch.
      await page.evaluate((tray) => {
        Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' })
        // remove only if the disk still shows the two settled pieces — a
        // re-arm after a lost race already left ONE piece pending, and a
        // second remove there would kill over a 0-piece model and forge
        // the wrong flush (the accepted-kill invariant: exactly one remove
        // pending at the event)
        let disk = -2
        try {
          const raw = localStorage.getItem('gravity-works.save')
          const env = raw ? (JSON.parse(raw) as { builds?: Record<string, string | { s?: string; v?: string }> }) : null
          const rec = env?.builds?.kitchen01
          const blob = typeof rec === 'string' || !rec ? rec : rec.s ?? rec.v
          const list = blob ? ((JSON.parse(blob) as { pieces: { def: string }[] }).pieces ?? []) : []
          disk = list.filter((p) => (tray as string[]).includes(p.def)).length
        } catch {
          /* malformed — click anyway; the recorder's read is the verdict */
        }
        if (disk !== 1) {
          const btn = document.querySelector('#gw-remove-piece')
          if (!(btn instanceof HTMLButtonElement)) throw new Error('no #gw-remove-piece to kill over')
          btn.click()
        }
        document.dispatchEvent(new Event('visibilitychange'))
      }, TRAY_KINDS)
    }
    const last = await page.evaluate(
      () => ((window as unknown as VisWindow).__vis.filter((v) => v.state === 'hidden').at(-1) ?? null),
    )
    if (last && last.pending === 2) kill = last
    else {
      // re-arm the two-piece settled state — settled means ON DISK, polled
      await page.bringToFront()
      await page.click('#gw-tray-drop')
      await page.click('#gw-place')
      await settleTo(2)
    }
  }
  expect(kill, 'no kill could be fired while the remove edit was still pending').not.toBeNull()

  const hides = await page.evaluate(() => (window as unknown as VisWindow).__pagehide)
  expect(hides, 'an app-switch put-away never fires pagehide').toEqual([])
  const line = realPath
    ? '[lifecycle-kill] REAL backgrounding: a second tab stole foreground (browser-generated, isTrusted visibilitychange; no pagehide)'
    : '[lifecycle-kill] no REAL page→hidden transition exists on this surface (CDP override absent; tab-steal stays visible — see spec header); REAL event chain via visibilityState override + genuine visibilitychange dispatch at boot\u2019s own listener, NO synthetic pagehide'
  console.log(line)
  test.info().annotations.push({ type: 'lifecycle-kill', description: line })
  if (realPath) {
    expect(kill!.trusted, 'on a surface WITH real backgrounding the flip must be browser-generated').toBe(true)
  }

  // the flush is synchronous inside the handler: the remove was pending AT
  // the event, so this count can only be 1 because the flush wrote it.
  expect(await savedPieces(page), 'the visibilitychange→hidden flush must store the last edit').toBe(1)

  await page.bringToFront()
  await page.reload()
  await expect(page.locator('#gw-status')).toContainText('ready', { timeout: 30_000 })
  await expect(page.locator('#gw-piece-count')).toHaveText('1 of 3 pieces used')

  expect(errors).toEqual([])
})
