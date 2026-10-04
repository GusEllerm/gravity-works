import { test, expect } from '@playwright/test'

interface HarnessWindow {
  __sceneReady?: boolean
  __sceneError?: string
  __pixelStats?: () => { nonBlack: number; total: number }
}

test('harness scene renders nonblack pixels headlessly', async ({ page }) => {
  await page.goto('/?harness=1&scene=materials-a&shot=material-review')
  await page.waitForFunction(() => {
    const w = window as unknown as HarnessWindow
    return w.__sceneReady === true || w.__sceneError !== undefined
  })
  const error = await page.evaluate(() => (window as unknown as HarnessWindow).__sceneError)
  expect(error, 'harness reported an error').toBeUndefined()

  const stats = await page.evaluate(() => (window as unknown as HarnessWindow).__pixelStats!())
  expect(stats.nonBlack).toBeGreaterThan(0)
  // the frame is not a blank wash either: a full-frame render should cover
  // a meaningful share of pixels with something lit.
  expect(stats.nonBlack).toBeGreaterThan(stats.total * 0.5)
})
