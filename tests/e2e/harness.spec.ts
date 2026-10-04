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

test('post=on renders the tilt-shift/bloom/grade chain without shader errors', async ({ page }) => {
  // the browser is the only place these GLSL passes actually compile — the
  // unit tests prove the math, this proves the shaders load and paint
  const errors: string[] = []
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  await page.goto('/?harness=1&scene=kitchen-b-integrated&shot=hero&post=on&quality=high&focus=(0.05,0.05,-0.09)')
  await page.waitForFunction(() => {
    const w = window as unknown as HarnessWindow
    return w.__sceneReady === true || w.__sceneError !== undefined
  })
  const error = await page.evaluate(() => (window as unknown as HarnessWindow).__sceneError)
  expect(error, 'harness reported an error').toBeUndefined()
  const stats = await page.evaluate(() => (window as unknown as HarnessWindow).__pixelStats!())
  expect(stats.nonBlack).toBeGreaterThan(stats.total * 0.5)
  expect(errors.filter((e) => e.includes('Shader'))).toEqual([])
})
