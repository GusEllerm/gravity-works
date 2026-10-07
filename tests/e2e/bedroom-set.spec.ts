// Stage 4 — bedroom production set smoke (Environment Artist). One spec,
// two claims, exactly the contract the set registry must not break:
//
// 1. NO REGRESSION: the game shell boots on an existing kitchen level
//    unchanged — the kitchen set still mounts through the registry path
//    (`stage.dataset.setMounted === 'kitchen'`), the status line reaches
//    ready, and the console stays clean;
// 2. THE BEDROOM RENDERS: the harness scene `scene=bedroom-set` (post ON —
//    the shader's punctual gate only compiles in the browser) builds with
//    no `__sceneError`, no console errors, and paints the frame; and the
//    dev entry `?set=bedroom` mounts the bedroom set in the GAME shell.
import { test, expect } from '@playwright/test'

interface HarnessWindow {
  __sceneReady?: boolean
  __sceneError?: string
  __pixelStats?: () => { nonBlack: number; total: number }
}

test('game shell boots kitchen01 unchanged through the set registry (no regression)', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(String(err)))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })

  await page.goto('/?level=kitchen01')
  await expect(page.locator('#gw-stage')).toHaveAttribute('data-set-mounted', 'kitchen', { timeout: 60_000 })
  await expect(page.locator('#gw-status')).toContainText('pieces used', { timeout: 60_000 })
  expect(errors).toEqual([])
})

test('bedroom set renders in the harness, post-ON, without console errors', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(String(err)))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })

  await page.goto('/?harness=1&scene=bedroom-set&shot=hero&post=on')
  await page.waitForFunction(() => {
    const w = window as unknown as HarnessWindow
    return w.__sceneReady === true || w.__sceneError !== undefined
  })
  const error = await page.evaluate(() => (window as unknown as HarnessWindow).__sceneError)
  expect(error, 'harness reported an error').toBeUndefined()
  const stats = await page.evaluate(() => (window as unknown as HarnessWindow).__pixelStats!())
  expect(stats.nonBlack).toBeGreaterThan(stats.total * 0.5)
  // the lamp practical compiles a punctual variant of every ToonMaterial —
  // a shader-compile failure surfaces as a THREE program error on the
  // console, exactly the failure this smoke exists to catch
  expect(errors.filter((e) => e.includes('Shader') || e.includes('Program'))).toEqual([])
  expect(errors).toEqual([])
})

test('the game-shell dev entry ?set=bedroom mounts the bedroom set', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(String(err)))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })

  await page.goto('/?set=bedroom')
  await expect(page.locator('#gw-stage')).toHaveAttribute('data-set-mounted', 'bedroom', { timeout: 60_000 })
  await expect(page.locator('#gw-status')).toContainText('pieces used', { timeout: 60_000 })
  expect(errors).toEqual([])
})
