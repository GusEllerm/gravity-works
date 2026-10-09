/**
 * The stage-4 campaign gate: the room picker is a PLAYED thing, not a table.
 *
 * 1. CAMPAIGN ORDER ACROSS THE BOUNDARY — kitchen05 built through the real
 *    UI finishes, and its `Next level` lands on bedroom03 with the BEDROOM
 *    set mounted (the set swap rides the same page boot, error-free; the
 *    stage-6 re-weave puts the booster lesson's next rung on Pyramid Air);
 * 2. BEDROOM03 LOCKED UNTIL KITCHEN05 EARNS A STAR (§9.2) — a fresh save's
 *    level select shows the woven frontier locked and the locked button
 *    SAYS what opens it (no dead affordance); after kitchen05 earns a star
 *    the rung is open and the earned stars print on their levels;
 * 3. BEDROOM01 FINISHABLE THROUGH THE REAL UI — reached by CLICKING the
 *    unlocked rung on the level select (the re-weave puts it third rung in,
 *    behind kitchen03's star), built with the tray, launched with the
 *    button: the placement guard, the par line and the bedroom props
 *    coexist on a real run;
 * 4. SET-SWITCH RENDER — the bedroom level paints (non-black probe) with
 *    zero console/page errors, kitchen unchanged.
 *
 * Stars here are EARNED: kitchen05 is built piece by piece with tray clicks
 * and the Place button (the shell.spec idiom) — no `?build=par` mints an
 * unlock in this spec, so the unlock claim is the real one. The one piece
 * of scaffolding is the save: `?level=kitchen05` ADDRESSES a rung the fresh
 * save has not unlocked, and a dev-preview visit (stage 5, playtest BB
 * item 5) mints nothing by design — so the spec seeds the PREVIOUS rung's
 * star to make kitchen05 a genuinely unlocked board, then earns the star
 * the honest way on top of it. The mint that opens the bedroom is still
 * this spec's finished run, never a URL.
 */
import { test, expect } from '@playwright/test'

// Budget: this spec plays TWO full build-and-run cycles (kitchen05 + the
// bedroom rung) through the real UI in one test. The every-other-wait budget
// here is 60 s (see `ready` / `#gw-result` above); the default TEST timeout
// would silently cut that intent at 30 s. Measured wall clocks: 8–12 s on
// local Chromium (real GPU AND under `--use-angle=swiftshader` + 20x CPU
// throttle — every `#gw-*` element the raw reads target appears < 2 s into
// the boot-to-`ready` line, far before either budget); 17–28 s on CI
// software rendering. `slow()` carries the 60 s the 60_000 waits document
// (systems engineer, garage-era CI reds at 28.0/30.3 s).
test.slow()

const ready = (page: import('@playwright/test').Page) =>
  expect(page.locator('#gw-status')).toContainText('ready', { timeout: 60_000 })

/** Build a chain whose first piece goes onto `firstTarget` (the arrows move
 *  the VISIBLE marker; the rest follow the exit of the piece just placed —
 *  the shipped default-target rule), then launch and wait for the panel. */
const buildAndLaunch = async (
  page: import('@playwright/test').Page,
  seq: string[],
  firstTarget: string,
): Promise<void> => {
  await page.click(`#gw-tray-${seq[0]}`)
  for (let i = 0; i < 8; i++) {
    if (((await page.textContent('#gw-target-label')) ?? '').includes(firstTarget)) break
    await page.keyboard.press('ArrowRight')
  }
  await page.click('#gw-place')
  for (const kind of seq.slice(1)) {
    await page.click(`#gw-tray-${kind}`)
    await page.click('#gw-place')
  }
  await page.click('#gw-launch')
  await expect(page.locator('#gw-result')).toBeVisible({ timeout: 60_000 })
}

/** The dev-preview gate (`levelUnlock` in `src/world/campaign.ts`, read by
 *  `src/boot.ts`) withholds the mint on a rung the save has not unlocked —
 *  addressing is not progression. Seeding the PREVIOUS rung's star makes
 *  the rung under play a live board; the star this spec then reports is
 *  still earned through the tray, the Launch button and the run. The seed
 *  MERGES (seeded rungs first, the save wins) — the init script re-runs on
 *  every navigation, and a wipe would erase the very star the run earns. */
function seedStars(stars: Record<string, number>): string {
  return `
    let save = {}
    try { save = JSON.parse(localStorage.getItem('gravity-works.save') ?? '{}') } catch { save = {} }
    const progress = save.progress ?? {}
    progress.stars = { ...(${JSON.stringify(stars)}), ...(progress.stars ?? {}) }
    progress.reached = progress.reached ?? {}
    save.progress = progress
    save.v = save.v ?? 2
    save.builds = save.builds ?? {}
    save.settings = save.settings ?? {}
    localStorage.setItem('gravity-works.save', JSON.stringify(save))
  `
}

const unlockKitchen05 = (page: import('@playwright/test').Page) =>
  page.addInitScript(seedStars({ kitchen04: 3 }))

/** Finish kitchen05 through the real builder — the frontier run whose star
 *  opens the bedroom on every claim below. */
const finishKitchen05 = async (page: import('@playwright/test').Page): Promise<void> => {
  await unlockKitchen05(page)
  await page.goto('/?level=kitchen05')
  await ready(page)
  await buildAndLaunch(page, ['booster', 'gapLip', 'drop', 'gapLip', 'drop', 'landing'], 'end of the pre-built ramp')
  await expect(page.locator('#gw-status')).toContainText('finished')
}

const probe = async (page: import('@playwright/test').Page): Promise<number> =>
  page.evaluate(() => {
    const c = document.querySelector('#gw-canvas') as HTMLCanvasElement | null
    if (!c || !c.width) return 0
    const t = document.createElement('canvas')
    t.width = 240
    t.height = 135
    const g = t.getContext('2d')!
    g.drawImage(c, 0, 0, 240, 135)
    const d = g.getImageData(0, 0, 240, 135).data
    const bg = [d[0]!, d[1]!, d[2]!]
    let diff = 0
    for (let i = 0; i < d.length; i += 4) {
      if (Math.abs(d[i]! - bg[0]!) + Math.abs(d[i + 1]! - bg[1]!) + Math.abs(d[i + 2]! - bg[2]!) > 24) diff++
    }
    return diff / (240 * 135)
  })

const noErrors = (page: import('@playwright/test').Page): string[] => {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(String(err)))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  return errors
}

test('campaign order across the boundary: kitchen05 Next lands on bedroom03 with the bedroom mounted', async ({ page }) => {
  const errors = noErrors(page)
  await finishKitchen05(page)

  // the star was EARNED and the Next button says so, then walks the boundary
  const stars = (await page.textContent('#gw-result-stars')) ?? ''
  expect(stars.includes('★')).toBe(true)
  await expect(page.locator('#gw-result-next')).toBeVisible()
  await page.click('#gw-result-next')

  await page.waitForURL(/\?level=bedroom03/)
  await expect(page.locator('#gw-stage')).toHaveAttribute('data-set-mounted', 'bedroom', {
    timeout: 60_000,
  })
  await ready(page)
  expect(errors).toEqual([])
})

test('bedroom03 is locked until kitchen05 earns a star, and the locked button says why', async ({ page }) => {
  const errors = noErrors(page)

  // fresh save: kitchen01 open (stars absent, reached absent), the woven
  // frontier locked with its rule on-screen — never a silent dead button
  await page.goto('/?levels=1')
  await expect(page.locator('#gw-level-kitchen01')).toBeVisible()
  expect(await page.getAttribute('#gw-level-kitchen01', 'aria-disabled')).toBeNull()
  await expect(page.locator('#gw-level-bedroom03')).toHaveAttribute('aria-disabled', 'true')

  // playtest K ("taught nothing about what's unlocked or why"): the rule is
  // INLINE in every locked button, not only on the page line or a click —
  // and a locked rung never shows ☆☆☆ (that readout belongs to unlocked
  // rungs; playtest K read plain-text ☆☆☆ as "merely unstarred")
  await expect(page.locator('#gw-level-kitchen02')).toContainText('Earn a star on Book Drop to open this')
  await expect(page.locator('#gw-level-bedroom03')).toContainText('Earn a star on Sunday Run to open this')
  expect(((await page.textContent('#gw-level-bedroom03')) ?? '').includes('☆')).toBe(false)
  // at a glance the three states differ: locked = lock glyph + rule; open
  // and unplayed = ☆☆☆ (kitchen01, first rung, nothing earned yet)
  await expect(page.locator('#gw-level-kitchen01')).toContainText('☆☆☆')

  // the locked button is aria-disabled (greyed, honest) but FOCUSABLE and
  // ANSWERS a click — dispatched past the disabled-actionability wait
  await page.locator('#gw-level-bedroom03').dispatchEvent('click')
  await expect(page.locator('#gw-levelselect-status')).toContainText(
    'Locked — earn at least one star on',
  )
  expect(page.url()).toContain('levels=1') // a locked rung never navigates

  // earn the star for real, then the frontier opens — with the ★ tally shown
  // (kitchen05 is SEEDED unlocked first: a locked rung addressed by URL is
  // a dev preview and mints nothing since stage 5 (playtest BB item 5), so
  // the star this run writes is earned on a live board — exactly what the
  // bedroom03 lock rule below reads)
  await finishKitchen05(page)
  await page.goto('/?levels=1')
  expect(await page.getAttribute('#gw-level-bedroom03', 'aria-disabled')).toBeNull()
  await expect(page.locator('#gw-level-kitchen05')).toContainText('★')
  await expect(page.locator('#gw-level-bedroom03')).toContainText('☆☆☆')
  // the grouping is rooms, in campaign order
  await expect(page.locator('section[data-room="kitchen"] ~ section[data-room="bedroom"]')).toHaveCount(1)
  expect(errors).toEqual([])
})

test('bedroom01 is finishable through the real UI, reached via the unlocked rung on the level select', async ({ page }) => {
  const errors = noErrors(page)
  // The re-weave puts bedroom01 third rung in — its key is kitchen03's
  // star (the previous rung). The seed makes it a genuinely UNLOCKED board
  // (playtest BB item 5: a locked rung mints nothing); the star this run
  // writes is still earned through the tray, the Launch button and the run.
  await page.addInitScript(seedStars({ kitchen03: 3 }))

  // the player travels THROUGH the level select, not by URL
  await page.goto('/?levels=1')
  await page.click('#gw-level-bedroom01')
  await page.waitForURL(/\?level=bedroom01/)
  await ready(page)
  await expect(page.locator('#gw-stage')).toHaveAttribute('data-set-mounted', 'bedroom')

  // the cable-dip line: straight -> drop -> straight, tray buttons + Place,
  // then Launch — the guard must never block the drop onto the cable lane
  await buildAndLaunch(page, ['straight', 'drop', 'straight'], 'end of the pre-built ramp')
  await expect(page.locator('#gw-status')).toContainText('finished')
  const stars = (await page.textContent('#gw-result-stars')) ?? ''
  expect(stars.includes('★')).toBe(true)
  // the campaign continues: bedroom01 has a next (the woven ladder walks it
  // onto its own room's ramp rung)
  await expect(page.locator('#gw-result-next')).toBeVisible()
  expect(errors).toEqual([])
})

test('the campaign OPENS: garage04\u2019s Next lands on porch01 with the porch mounted (stage 5: the sixth room is reachable from the garage rung)', async ({ page }) => {
  const errors = noErrors(page)
  // Navigation, not an unlock claim: the par-build launch is the cheapest
  // honest way to stand on garage04\u2019s finish panel. The save seeds the
  // PREVIOUS rung's star so garage04 is a genuinely UNLOCKED board — since
  // the stage-5 dev-preview gate (playtest BB item 5) a locked rung
  // addressed by URL mints nothing and offers no Next, and this claim is
  // the ladder walk, not the unlock (campaign unlock semantics are the
  // domain of the unit suite and the tests above).
  await page.addInitScript(seedStars({ garage05: 3 })) // garage04's PREVIOUS rung is now the encore (stage 6: 05 slots before the finale)
  await page.goto('/?level=garage04&launch=1&build=par')
  await expect(page.locator('#gw-result')).toBeVisible({ timeout: 60_000 })
  await expect(page.locator('#gw-status')).toContainText('finished')
  await expect(page.locator('#gw-result-next')).toBeVisible()
  await page.click('#gw-result-next')

  await page.waitForURL(/\?level=porch01/)
  await expect(page.locator('#gw-stage')).toHaveAttribute('data-set-mounted', 'porch', {
    timeout: 60_000,
  })
  await ready(page)
  expect(errors).toEqual([])
})

test('set switch renders error-free: the bedroom level paints with zero console errors', async ({ page }) => {
  const errors = noErrors(page)
  await page.goto('/?level=bedroom01')
  await expect(page.locator('#gw-stage')).toHaveAttribute('data-set-mounted', 'bedroom', {
    timeout: 60_000,
  })
  await ready(page)
  // the dusk lamp's room actually PAYS the frame: track pixels differ from
  // the bedroom sky, and no shader-compile error rides the punctual gate
  await expect.poll(() => probe(page), { timeout: 15_000 }).toBeGreaterThan(0.01)
  expect(errors.filter((e) => e.includes('Shader') || e.includes('Program'))).toEqual([])
  expect(errors).toEqual([])
})

/**
 * STAGE 6 — the ENCORE rungs, ladder-proved (the campaign.spec OPENS
 * pattern, playtest-DD lineage): a rung is proven playable by a FRESH
 * browser meeting it with no instructions — the previous rung's earned
 * star is the only key, `?build=par&launch=1` is addressing not teaching
 * (playtest BB item 5: a locked board mints nothing, so the star that
 * opens the door must be real), and the claim is what the PANEL says:
 * finished, at least one ★ minted, and a Next that names the room's
 * finale. Each context is a genuinely fresh browser: no visit history,
 * no builds, no reached marks.
 */
test('the ENCORE rungs are playable from a clean browser: bedroom05, bathroom05, garden05, garage05 mint and walk to the finale', async ({ browser }) => {
  test.slow()
  for (const [id, prev] of [
    ['bedroom05', 'garden02'], // the woven rung before the bedroom encore
    ['bathroom05', 'bathroom03'],
    ['garden05', 'garden03'],
    ['garage05', 'garage03'],
  ] as const) {
    const context = await browser.newContext() // a fresh browser per rung — the OPENS pattern
    const page = await context.newPage()
    const errors = noErrors(page)
    await page.addInitScript(seedStars({ [prev]: 1 })) // the previous rung's ONE star — the whole key
    await page.goto(`/?level=${id}&build=par&launch=1`)
    await expect(page.locator('#gw-result')).toBeVisible({ timeout: 60_000 })
    await expect(page.locator('#gw-status')).toContainText('finished')
    // the encore's par line on an unlocked board is a 3★ run (4 tray
    // pieces at the tray's geometry, the clock under the generated
    // parTime) — the honest star economics, pinned at three.
    expect(((await page.textContent('#gw-result-stars')) ?? '').split('\u2605').length - 1).toBe(3)
    // and Next names the room's FINALE: the encore slots before the capstone.
    await expect(page.locator('#gw-result-next')).toBeVisible()
    expect(errors).toEqual([])
    await context.close()
  }
})

test('the ENCORE mint opens the room finale: a clean bedroom05 finish unlocks bedroom04 on the level select, and the rung after the finale stays locked', async ({ browser }) => {
  test.slow()
  const context = await browser.newContext()
  const page = await context.newPage()
  await page.addInitScript(seedStars({ garden02: 1 })) // bedroom05's PREVIOUS rung on the woven ladder
  await page.goto('/?level=bedroom05&build=par&launch=1')
  await expect(page.locator('#gw-status')).toContainText('finished', { timeout: 60_000 })
  await page.goto('/?levels=1')
  await expect(page.locator('#gw-level-bedroom04')).toBeVisible()
  expect(await page.getAttribute('#gw-level-bedroom04', 'aria-disabled')).toBeNull()
  await expect(page.locator('#gw-level-garden03')).toHaveAttribute('aria-disabled', 'true') // the rung after the finale
  await expect(page.locator('#gw-level-bathroom01')).toHaveAttribute('aria-disabled', 'true')
  await context.close()
})
