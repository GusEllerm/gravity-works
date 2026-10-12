/**
 * THE PREMISE BEAT — RE-BASELINED for the house boot (downhill build 2,
 * Decision Log law 3's first-visit row and law 4's beginning). The law in
 * `src/pages/intro.ts` is the same audience law it always was (webdriver
 * skips, `?intro=1` forces, `?intro=off` and reduced motion never sit
 * through it, one seen flag); WHAT it plays moved with the front door:
 * the cold first visit now watches THE HOUSE — the crane pulling back
 * from the kitchen window while a car free-rolls one room and dies in the
 * next (`src/pages/house.ts`, the home boot), the game saying "it's all
 * one place" before any UI word.
 *
 * The re-baseline act, per surface (see `Sessions/2026-10-12 Front
 * door.md`): this file used to assert the kitchen01 par roll on the bare
 * route. The bare route IS the house now, so the assertions moved to the
 * house beat deliberately — the old film survives only under the forcing
 * on the ADDRESSED rung boot (`?boot=rung&intro=1`), which is a rig, not
 * a first visit, and no longer has a spec.
 *
 * Automation is structurally OUT of the audience (`navigator.webdriver`
 * skips the beat) — which is why every OTHER spec in this suite boots
 * straight into chrome — so this file is the cinematic's only gate, and
 * it opts IN explicitly with `?intro=1` (the forcing the header promises).
 */
import { test, expect } from '@playwright/test'

test('automation on a bare landing never sits through the film — it lands on the house', async ({ page }) => {
  await page.goto('/')
  // webdriver lands on the front door immediately — the class never
  // appears even for a tick, and the cross-section with its windows is
  // live without waiting for a beat
  await expect(page.locator('.gw-premiere')).toHaveCount(0)
  await expect(page.locator('#gw-launch')).toBeVisible({ timeout: 60_000 })
  await expect(page.locator('#gw-house-windows section')).toHaveCount(6)
})

test('the explicit ?intro=off opt-out lands straight in the house chrome', async ({ page }) => {
  // P3: the opt-out the e2e harness (`tests/e2e/goto.ts`) appends for every
  // non-visual spec — the URL contract end to end (the param LOGIC — off
  // wins over every audience inference — is pinned by
  // `tests/unit/intro-params.test.ts`). The page must boot clean WITH the
  // param present, chrome up, no beat.
  await page.goto('/?intro=off')
  await expect(page.locator('.gw-premiere')).toHaveCount(0)
  await expect(page.locator('#gw-launch')).toBeVisible({ timeout: 60_000 })
})

test('the beat hides the chrome, pulls back from the kitchen window, free-rolls one room and dies in the next, and lifts at the end', async ({
  page,
}) => {
  const beatOn = page.locator('.gw-premiere')
  await page.goto('/?intro=1')
  await expect(beatOn).toHaveCount(1)
  // chrome gone, title stays (the h1 IS the premise screen — display face,
  // wide tracking); the house status line is chrome too, so the beat is
  // SILENT on the page as well as the speakers; the windows are the UI
  // word this beat is forbidden to say
  await expect(page.locator('#gw-builder-host')).toBeHidden()
  await expect(page.locator('#gw-house-status')).toBeHidden()
  await expect(page.locator('#gw-house-windows')).toBeHidden()
  await expect(page.locator('h1')).toBeVisible()
  // the beat runs its own stepped world (pull ≈ 1 s, the free-roll to the
  // kitchen crossing ≈ 3.5 s, one still beat) and ENDS on its own — no
  // verdict, no best recorded: the player's first run is the one THEY
  // release. The 12 s safety timer bounds the wait; the roll ends long
  // before it.
  await expect(beatOn).toHaveCount(0, { timeout: 12_000 })
  await expect(page.locator('#gw-launch')).toBeVisible()
  await expect(page.locator('#gw-house-result')).toBeEmpty()
  // the beat records NOTHING: no house best was minted by watching
  const best = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('gravity-works.save') ?? '{}')?.settings?.records?.houses ?? null,
  )
  expect(best).toBeNull()
})

test('a key skips the beat and the front door returns immediately', async ({ page }) => {
  const beatOn = page.locator('.gw-premiere')
  await page.goto('/?intro=1')
  await expect(beatOn).toHaveCount(1)
  await page.keyboard.press('Space')
  await expect(beatOn).toHaveCount(0)
  await expect(page.locator('#gw-launch')).toBeVisible()
  await expect(page.locator('#gw-house-windows section')).toHaveCount(6)
  // the dismissed beat is SEEN: a later bare landing (same storage state)
  // must not replay the film for a returning visitor.
  await page.goto('/?intro=1')
  await expect(beatOn).toHaveCount(1) // forced still plays
  await page.evaluate(() => localStorage.setItem('gravity-works.premiere.seen', '1'))
  await page.goto('/?intro=0')
  await expect(beatOn).toHaveCount(0)
})

test('the beat ends by itself on the dead car (pull + roll + still, no terminal needed)', async ({ page }) => {
  // the free-roll STALLS at ~9 s of sim — well past the beat's own roll
  // end (4.5 s): the beat must end on its plan, not on the physics'
  // stall-detection. Pull (1 s) + roll (4.5 s) + still (0.5 s) ≈ 6 s.
  const beatOn = page.locator('.gw-premiere')
  await page.goto('/?intro=1')
  await expect(beatOn).toHaveCount(1)
  const t0 = Date.now()
  await expect(beatOn).toHaveCount(0, { timeout: 11_000 })
  expect(Date.now() - t0).toBeLessThan(10_000)
})

test('reduced motion goes STRAIGHT to the front door, even when forced', async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce' })
  const page = await ctx.newPage()
  await page.goto('/?intro=1')
  // reduced-motion wins outright over the forcing — the same law every
  // decorative tween answers to.
  await expect(page.locator('.gw-premiere')).toHaveCount(0)
  await expect(page.locator('#gw-launch')).toBeVisible({ timeout: 60_000 })
  await ctx.close()
})
