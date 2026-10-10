import { test, expect, type Page, type TestInfo } from '@playwright/test'
import { goto } from './goto.ts'

/**
 * P4 CHROME LAW — no chrome rides on chrome at the compact breakpoint
 * (Evaluation 2026-10-10 player re-run, item 2's asterisk: at short window
 * heights the compact reflow made the HASH LINE overlap the GHOST-CHIP
 * STRIP below the stage).
 *
 * The bottom-corner chips (`#gw-ghost-bar`, `#gw-save`) are zero-flow,
 * viewport-pinned (bottom: 8px). The compact layout law reserved every
 * FLOW line under ≤700 px heights and made the page fit the window with no
 * scroll — and never counted the chips' band, so the last flow line (the
 * hash disclosure) ended INSIDE it. Measured before the fix at 1280x633:
 * hash 599–611 riding under the strip's 604–625. The studio does rects,
 * not vibes: pairwise-disjoint rects of the status row, the callout row,
 * the hash line, the two bottom chips, and the tray/controls rows at the
 * compact breakpoint (633 / 653 / 700), plus the stack-order statement
 * that at those heights the last flow line ends ABOVE the chip band, and
 * the no-scroll law. The 633 / 720 / 900 proof heights ride the same
 * assertion (above the breakpoint the page scrolls, so the rects are read
 * at scroll 0 in page space — the chips' corner law there is documented
 * and unchanged); each height attaches a full-window screenshot.
 *
 * Known adjacency, documented in Modules/ui: OPENING the hash <details>
 * grows the document past the window at compact heights — the disclosure
 * has always traded its reserved line for a scroll at every height, and
 * this law binds the shipped-default state.
 */

const ROWS = [
  'gw-status',
  'gw-callout',
  'gw-hash-details',
  'gw-ghost-bar',
  'gw-save',
  'gw-tray',
  'gw-controls',
] as const

interface Rect {
  top: number
  left: number
  bottom: number
  right: number
}

/** Rects at scroll 0 (the compact pages cannot scroll; the taller ones are read before any scroll). */
async function rowRects(page: Page): Promise<Record<string, Rect>> {
  return page.evaluate((ids: string[]) => {
    const out: Record<string, Rect> = {}
    for (const id of ids) {
      const r = document.getElementById(id)!.getBoundingClientRect()
      out[id] = { top: r.top, left: r.left, bottom: r.bottom, right: r.right }
    }
    return out
  }, [...ROWS])
}

function overlapArea(a: Rect, b: Rect): number {
  const w = Math.min(a.right, b.right) - Math.max(a.left, b.left)
  const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)
  return w > 0 && h > 0 ? w * h : 0
}

async function settleAt(page: Page, width: number, height: number, url: string, testInfo: TestInfo) {
  await page.setViewportSize({ width, height })
  await goto(page, url)
  await expect(page.locator('#gw-tray button').first()).toBeVisible({ timeout: 30_000 })
  await page.screenshot({ path: testInfo.outputPath(`p4-chrome-${height}.png`) })
  await testInfo.attach(`screenshot-${height}`, {
    path: testInfo.outputPath(`p4-chrome-${height}.png`),
    contentType: 'image/png',
  })
}

for (const height of [633, 720, 900]) {
  test(`no chrome rect rides another at 1280x${height}`, async ({ page }, testInfo) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    page.on('pageerror', (err) => errors.push(String(err)))

    await settleAt(page, 1280, height, '/', testInfo)

    const rects = await rowRects(page)
    for (let i = 0; i < ROWS.length; i++) {
      for (let j = i + 1; j < ROWS.length; j++) {
        const a = ROWS[i]
        const b = ROWS[j]
        expect(overlapArea(rects[a], rects[b]), `${a} vs ${b}`).toBe(0)
      }
    }

    if (height <= 700) {
      // the compact law: the page fits the window (no scroll) and the last
      // flow line ends ABOVE the chip band — stack order, not luck
      expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(height)
      expect(rects['gw-hash-details'].bottom, 'hash line above the chip strip').toBeLessThanOrEqual(
        rects['gw-ghost-bar'].top,
      )
    }

    expect(errors).toEqual([])
  })
}
