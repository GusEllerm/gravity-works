/**
 * STAGE 6 — the TOUCH pass. The gesture contract re-expressed for fingers
 * (`src/camera/build-camera.ts`'s table), asserted where the harness is
 * honest and documented as manual where it is not:
 *
 *  1. TAP-TO-PLACE on a `has_touch` context at BOTH requested widths —
 *    390 (phone) and 820 (tablet) — tap a tray kind, tap the ring, the
 *    counter moves, the piece lands. A touch has no hover, so the ring
 *    must AIM AT TOUCH-DOWN before the lift decides (stage 6 fix).
 *  2. A tap that TRAVELS pans the framing and places NOTHING (the mouse
 *    law, now with fingers).
 *  3. TWO-FINGER DRAG orbits (the touch stand-in for right-drag); SPREAD
 *    is the browser's pinch-zoom (`touch-action: pan-y pinch-zoom`) and a
 *    `pointercancel` from that recognizer places nothing — the same lost-
 *    release law the mouse reconcile already enforces.
 *  4. LONG-PRESS opens no menu (the canvas suppresses `contextmenu`) and
 *    the audit documents it as the no-context-surface decision — the
 *    measured part here is that a slow press-and-release is exactly a
 *    tap (the gesture clock never becomes a second verb by accident).
 *  5. The result panel and the toolbar stay inside the window at both
 *    widths (the coarse-pointer 44 px tap boxes are in `shell.css`).
 *
 *  CDP note: the multi-touch steps drive `Input.dispatchTouchEvent`
 *  directly (Playwright's touchscreen is single-point); Chromium delivers
 *  those as `pointerType: touch` pointer events. Where a step depends on
 *  BEYOND the page (native scroll, native zoom UI) the audit note says
 *  manual, and this file does not fake it.
 */
import { test, expect, devices, type Page } from '@playwright/test'

const ready = (page: Page) =>
  expect(page.locator('#gw-status')).toContainText('ready', { timeout: 60_000 })

const targetPx = async (page: Page): Promise<[number, number] | null> => {
  const p = (await page.evaluate(
    () => (window as unknown as Record<string, () => number[] | null>).__gwTargetSocketPx(),
  )) as number[] | null
  return p ? [p[0]!, p[1]!] : null
}

const cameraYaw = (page: Page): Promise<number[]> =>
  page.evaluate(
    () => (window as unknown as Record<string, () => { pos: number[]; quat: number[] }>).__gwCameraPose().pos,
  )

async function tapPlaceRing(page: Page, kindId: string): Promise<void> {
  await page.locator(`#${kindId}`).tap()
  await expect(page.locator(`#${kindId}`)).toHaveAttribute('aria-pressed', 'true')
  const [x, y] = (await targetPx(page))!
  await page.touchscreen.tap(x, y)
}

function describeAt(width: number, height: number): void {
  test.describe(`touch context ${width}x${height}`, () => {
    test.use({
      hasTouch: true,
      isMobile: true,
      viewport: { width, height },
      userAgent: devices['Pixel 7'].userAgent,
    })

    test('tap-to-place builds the par line and Launch taps finish the run', async ({ page }) => {
      const errors: string[] = []
      page.on('pageerror', (err) => errors.push(String(err)))
      await page.goto('/?level=kitchen01')
      await ready(page)

      await tapPlaceRing(page, 'gw-tray-gapLip')
      await expect(page.locator('#gw-piece-count')).toHaveText('1 of 3 pieces used')
      await tapPlaceRing(page, 'gw-tray-drop')
      await expect(page.locator('#gw-piece-count')).toHaveText('2 of 3 pieces used')
      await tapPlaceRing(page, 'gw-tray-landing')
      await expect(page.locator('#gw-piece-count')).toHaveText('3 of 3 pieces used')

      await page.locator('#gw-launch').tap()
      await expect(page.locator('#gw-result')).toBeVisible({ timeout: 60_000 })
      // the panel sits INSIDE the window at this width — nothing scrolled
      const box = await page.locator('#gw-result').boundingBox()
      expect(box).not.toBeNull()
      expect(box!.x).toBeGreaterThanOrEqual(0)
      expect(box!.y).toBeGreaterThanOrEqual(0)
      expect(box!.x + box!.width).toBeLessThanOrEqual(width + 1)
      expect(box!.y + box!.height).toBeLessThanOrEqual(height + 1)
      expect(errors).toEqual([])
    })

    test('a travelling tap PANS and places nothing; a two-finger drag ORBITS', async ({ page }) => {
      const errors: string[] = []
      page.on('pageerror', (err) => errors.push(String(err)))
      await page.goto('/?level=kitchen01')
      await ready(page)
      await page.locator('#gw-tray-gapLip').tap() // hold a piece: a place would COUNT

      const canvas = (await page.locator('#gw-canvas').boundingBox())!
      const cx = canvas.x + canvas.width / 2
      const cy = canvas.y + canvas.height / 2
      const cdp = await page.context().newCDPSession(page)

      // one-finger horizontal drag: framing pan, NEVER a placement
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [{ x: cx, y: cy }],
      })
      for (let i = 1; i <= 6; i++) {
        await cdp.send('Input.dispatchTouchEvent', {
          type: 'touchMove',
          touchPoints: [{ x: cx + i * 14, y: cy }],
        })
      }
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
      await expect
        .poll(async () => (await page.textContent('#gw-piece-count')) ?? '')
        .toContain('0 of 3 pieces used')

      // two-finger parallel drag: ORBIT (never place; not a pinch — the
      // separation is constant, so the browser's zoom recognizer never
      // engages and the gesture stays ours)
      await page.waitForTimeout(250) // let the pan damping settle before measuring
      const pose2 = await cameraYaw(page)
      const a = { x: cx - 60, y: cy }
      const b = { x: cx + 60, y: cy }
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [a, b],
      })
      for (let i = 1; i <= 6; i++) {
        await cdp.send('Input.dispatchTouchEvent', {
          type: 'touchMove',
          touchPoints: [
            { x: a.x + i * 12, y: a.y },
            { x: b.x + i * 12, y: b.y },
          ],
        })
      }
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
      const pose3 = await cameraYaw(page)
      const orbited = pose3.map((v, i) => Math.abs(v - pose2[i]!))
      expect(
        Math.max(...orbited),
        `two-finger drag never moved the camera (poses ${JSON.stringify({ pose2, pose3 })})`,
      ).toBeGreaterThan(1e-4)
      await expect
        .poll(async () => (await page.textContent('#gw-piece-count')) ?? '')
        .toContain('0 of 3 pieces used')
      expect(errors).toEqual([])
    })

    test('a long-press opens no menu and behaves as the tap the law says it is', async ({ page }) => {
      const errors: string[] = []
      const dialogs: string[] = []
      page.on('pageerror', (err) => errors.push(String(err)))
      page.on('dialog', (d) => {
        dialogs.push(d.message())
        void d.dismiss()
      })
      await page.goto('/?level=kitchen01')
      await ready(page)
      await page.locator('#gw-tray-gapLip').tap()
      const [x, y] = (await targetPx(page))!
      const cdp = await page.context().newCDPSession(page)
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
      await page.waitForTimeout(900) // past every long-press threshold
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
      // no native menu surfaced (the canvas suppresses contextmenu; there
      // is no context surface in this game — documented in the audit), and
      // the press ended as an ordinary clean tap: it placed.
      expect(dialogs).toEqual([])
      await expect(page.locator('#gw-piece-count')).toHaveText('1 of 3 pieces used')
      expect(errors).toEqual([])
    })
  })
}

describeAt(390, 844)
describeAt(820, 1180)
