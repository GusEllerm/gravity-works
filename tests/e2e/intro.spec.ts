/**
 * THE PREMISE BEAT (program T1.2, "the first 60 seconds": at t+0 the page
 * WAS the kitchen01 builder — no title, no premise). The law lives in
 * `src/pages/intro.ts`: a cold first visit watches ONE silent car roll the
 * rung's own par line before any builder chrome appears; a click or key
 * skips; the terminal edge (or the 9 s safety timeout) ends it; a
 * reduced-motion visitor never sits through it.
 *
 * Automation is structurally OUT of the audience (`navigator.webdriver`
 * skips the beat) — which is why every OTHER spec in this suite boots
 * straight into chrome — so this file is the cinematic's only gate, and it
 * opts IN explicitly with `?intro=1` (the forcing the header promises).
 */
import { test, expect } from '@playwright/test'

test('automation on a bare landing never sits through the film', async ({ page }) => {
  await page.goto('/')
  // webdriver lands in the builder immediately — the class never appears
  // even for a tick, and Launch is live without waiting for a beat.
  await expect(page.locator('.gw-premiere')).toHaveCount(0)
  await expect(page.locator('#gw-launch')).toBeVisible({ timeout: 60_000 })
})

test('the explicit ?intro=off opt-out lands straight in the builder', async ({ page }) => {
  // P3: the opt-out the e2e harness (`tests/e2e/goto.ts`) appends for every
  // non-visual spec — the URL contract end to end (the param LOGIC — off
  // wins over every audience inference — is pinned by
  // `tests/unit/intro-params.test.ts`). The page must boot clean WITH the
  // param present, chrome up, no beat.
  await page.goto('/?intro=off')
  await expect(page.locator('.gw-premiere')).toHaveCount(0)
  await expect(page.locator('#gw-launch')).toBeVisible({ timeout: 60_000 })
})

test('the beat hides the chrome, rolls the par line silently, and lifts at the end', async ({
  page,
}) => {
  const beatOn = page.locator('.gw-premiere')
  await page.goto('/?intro=1')
  await expect(beatOn).toHaveCount(1)
  // chrome gone, title stays (the h1 IS the premise screen — display face,
  // wide tracking); the status line is chrome too, so the beat is SILENT
  // on the page as well as the speakers.
  await expect(page.locator('#gw-builder-host')).toBeHidden()
  await expect(page.locator('#gw-status')).toBeHidden()
  await expect(page.locator('h1')).toBeVisible()
  // the beat auto-launches its own par film and ENDS at its terminal edge
  // — no verdict panel, no stars, no share freeze: the player's first star
  // is the first run THEY launch, never the one they watched. The 9 s
  // safety timer bounds the wait; kitchen01's par line ends long before.
  await expect(beatOn).toHaveCount(0, { timeout: 12_000 })
  await expect(page.locator('#gw-launch')).toBeVisible()
  await expect(page.locator('#gw-result')).not.toBeVisible()
})

test('a key skips the beat and the builder returns immediately', async ({ page }) => {
  const beatOn = page.locator('.gw-premiere')
  await page.goto('/?intro=1')
  await expect(beatOn).toHaveCount(1)
  await page.keyboard.press('Space')
  await expect(beatOn).toHaveCount(0)
  await expect(page.locator('#gw-launch')).toBeVisible()
  // the dismissed beat is SEEN: a later bare landing (same storage state)
  // must not replay the film for a returning visitor.
  await page.goto('/?intro=1')
  await expect(page.locator('.gw-premiere')).toHaveCount(1) // forced still plays
  await page.evaluate(() => localStorage.setItem('gravity-works.premiere.seen', '1'))
  await page.goto('/?intro=0')
  await expect(page.locator('.gw-premiere')).toHaveCount(0)
})

test('reduced motion goes STRAIGHT to the builder, even when forced', async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce' })
  const page = await ctx.newPage()
  await page.goto('/?intro=1')
  // reduced-motion wins outright over the forcing — the same law every
  // decorative tween answers to.
  await expect(page.locator('.gw-premiere')).toHaveCount(0)
  await expect(page.locator('#gw-launch')).toBeVisible({ timeout: 60_000 })
  await ctx.close()
})
