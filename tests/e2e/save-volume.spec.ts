import { test, expect } from '@playwright/test'

/**
 * T0.6 / R8 — the volume slider persists with the AUTOSAVE's shape: a drag
 * is a burst of `input` events and costs ONE trailing write (R8's measured
 * indictment was a full serialize-validate-stringify envelope round trip per
 * event). The durability law is the same one `createBuildAutosave` obeys:
 * `flush()` fires on `pagehide` / visibility-hidden, so a reload INSIDE the
 * trailing window still lands the value. The unit half (fake clock, one
 * write per burst) lives in `tests/unit/sound.test.ts`; this is the reload
 * story on a real page.
 */

type SoundWindow = Window & {
  __gwSound?: () => { muted: boolean; volume: number }
}

const ready = async (page: import('@playwright/test').Page) => {
  await expect(page.locator('#gw-status')).toContainText('ready', { timeout: 30_000 })
}

test('R8: a slider drag then an instant reload lands the value (flush rides the autosave edges)', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(String(err)))
  await page.goto('/')
  await ready(page)

  // a real drag: keyboard on the range input fires real `input` events
  await page.click('#gw-sound-volume') // the unlock gesture, wherever it lands
  await page.focus('#gw-sound-volume')
  for (let i = 0; i < 3; i++) await page.keyboard.press('ArrowLeft') // 0.8 → 0.65
  const dragged = await page.evaluate(
    () => (window as unknown as SoundWindow).__gwSound!().volume,
  )
  expect(dragged).toBeLessThan(0.8)

  // NO settle time: reload INSIDE the trailing window — the pagehide flush
  // must carry the write exactly like the build autosave does
  await page.reload()
  await ready(page)
  const stored = await page.evaluate(
    () => JSON.parse(localStorage.getItem('gravity-works.save') ?? '{}').settings?.sound,
  )
  expect(stored.volume).toBeCloseTo(dragged, 10)
  expect((await page.evaluate(() => (window as unknown as SoundWindow).__gwSound!())).volume).toBeCloseTo(
    dragged,
    10,
  )
  expect(errors).toEqual([])
})
