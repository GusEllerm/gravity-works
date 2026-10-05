// Stage 4 — garden production set smoke (Environment Artist). One spec,
// three claims, mirroring the bedroom's contract at the first OUTDOOR set:
//
// 1. NO REGRESSION: the game shell boots on an existing kitchen level
//    unchanged and the kitchen's visual baseline stays byte-stable through
//    the lighting.ts sun-regime extension (the sun/sky dials default off;
//    tests/unit/garden-lighting.test.ts is the unit half of that gate);
// 2. THE GARDEN RENDERS: the harness scene `scene=garden-set&shot=hero`
//    (post ON) builds with no `__sceneError`, no console errors, and paints
//    the frame — the sun rig and the set's own camera row compile here;
// 3. the dev entry `?set=garden` mounts the garden set in the GAME shell.
import { test, expect } from '@playwright/test'

interface HarnessWindow {
  __sceneReady?: boolean
  __sceneError?: string
  __pixelStats?: () => { nonBlack: number; total: number }
}

test('game shell boots kitchen01 unchanged with the garden in the registry (no regression)', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(String(err)))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })

  await page.goto('/?level=kitchen01')
  await expect(page.locator('#gw-stage')).toHaveAttribute('data-set-mounted', 'kitchen', { timeout: 60_000 })
  await expect(page.locator('#gw-status')).toContainText('pieces placed', { timeout: 60_000 })
  expect(errors).toEqual([])
})

test('garden set renders in the harness, post-ON, without console errors', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(String(err)))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })

  await page.goto('/?harness=1&scene=garden-set&shot=hero&post=on')
  await page.waitForFunction(() => {
    const w = window as unknown as HarnessWindow
    return w.__sceneReady === true || w.__sceneError !== undefined
  })
  const error = await page.evaluate(() => (window as unknown as HarnessWindow).__sceneError)
  expect(error, 'harness reported an error').toBeUndefined()
  const stats = await page.evaluate(() => (window as unknown as HarnessWindow).__pixelStats!())
  expect(stats.nonBlack).toBeGreaterThan(stats.total * 0.5)
  // a shader-compile failure surfaces as a THREE program error on the
  // console — exactly the failure this smoke exists to catch
  expect(errors.filter((e) => e.includes('Shader') || e.includes('Program'))).toEqual([])
  expect(errors).toEqual([])
})

test('the game-shell dev entry ?set=garden mounts the garden set', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(String(err)))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })

  await page.goto('/?set=garden')
  await expect(page.locator('#gw-stage')).toHaveAttribute('data-set-mounted', 'garden', { timeout: 60_000 })
  await expect(page.locator('#gw-status')).toContainText('pieces placed', { timeout: 60_000 })
  expect(errors).toEqual([])
})
