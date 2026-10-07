// Stage 4 — garage production set smoke (Environment Artist). One spec file,
// three claims, mirroring the bedroom's and garden's contracts at the LAST
// of the four rooms:
//
// 1. NO REGRESSION: the game shell boots on an existing kitchen level
//    unchanged — the garage registry row is additive and every other set's
//    builder, tokens and rig path are untouched code (the visual baselines
//    in tests/e2e/visual.spec.ts are the byte-identity half of that gate);
// 2. THE GARAGE RENDERS: the harness scene `scene=garage-set&shot=hero`
//    (post ON) builds with no `__sceneError`, no console errors, and paints
//    the frame — the set builder, the indoor KEYLIGHT rig row and the
//    staging cars compile here;
// 3. the dev entry `?set=garage` mounts the garage set in the GAME shell
//    (the registry's no-placement canonical-origin fallback).
import { test, expect } from '@playwright/test'

interface HarnessWindow {
  __sceneReady?: boolean
  __sceneError?: string
  __pixelStats?: () => { nonBlack: number; total: number }
}

test('game shell boots kitchen01 unchanged with the garage in the registry (no regression)', async ({ page }) => {
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

test('garage set renders in the harness, post-ON, without console errors', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(String(err)))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })

  await page.goto('/?harness=1&scene=garage-set&shot=hero&post=on')
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

test('the game-shell dev entry ?set=garage mounts the garage set at the canonical origin', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(String(err)))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })

  await page.goto('/?set=garage')
  await expect(page.locator('#gw-stage')).toHaveAttribute('data-set-mounted', 'garage', { timeout: 60_000 })
  await expect(page.locator('#gw-status')).toContainText('pieces used', { timeout: 60_000 })
  expect(errors).toEqual([])
})
