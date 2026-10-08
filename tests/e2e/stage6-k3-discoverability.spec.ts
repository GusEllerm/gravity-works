/**
 * Stage 6 — kitchen03 "The Bowl", the SECOND wall (Level Designer).
 *
 * Playtest BB (stage 5, 6 builds, quit) and playtest DD (stage 6, 6+ builds,
 * "WALL — not cleared") hit the same rung with the same three sentences:
 *
 *   "the only snap is a curve exit the game itself says is blocked —
 *    furniture is in the way" · "building backwards from the cup runs
 *    off-table" · "] swaps to the car's start point"
 *
 * The rung is SOLVABLE (the par replays verify, 60/60 whole-tray orders
 * finish) but was not DISCOVERABLE, so per the law (PROMPT §12: confused
 * twice → fix the level or the callout, never the length of the explanation)
 * this spec pins the CALLOUT fix — the fail/hint grammar now names the
 * discoverable path:
 *
 * 1. a seat a set solid refuses NAMES the object that refused it (the bowl,
 *    not "furniture") and names the verb that has an answer;
 * 2. a legal seat PAST the finish says what it cannot do — the run ends at
 *    the cup, so nothing past it is ever travelled;
 * 3. the drive-off note, which already named the KIND the tray still holds,
 *    now names the END that kind extends;
 * 4. and the acceptance line: a player who reads nothing but the on-screen
 *    copy — no instructions, no hover, five blind Places from the boot ring,
 *    one launch — clears the rung.
 */
import { test, expect, type Page } from '@playwright/test'

const ready = (page: Page) =>
  expect(page.locator('#gw-status')).toContainText('ready', { timeout: 60_000 })

test.describe('kitchen03 is discoverable, not just solvable (playtest DD)', () => {
  test('the blocked rim names the bowl and the walk — and refuses the seat', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(String(err)))

    await page.goto('/?level=kitchen03')
    await ready(page)
    await page.click('#gw-tray-straight')

    // the walk DD walked: ramp end → cup → the bowl rim. Every stop now says
    // something a first-timer can act on; the old page said "furniture".
    await expect(page.locator('#gw-target-label')).toHaveText('place straight at: end of the pre-built ramp')
    await expect(page.locator('#gw-ghost-state')).toHaveText('fits here')

    await page.locator('#gw-builder').press('ArrowRight') // the cup's open exit
    await expect(page.locator('#gw-target-label')).toHaveText('place straight at: cup on the table')

    await page.locator('#gw-builder').press('ArrowRight') // the rim: bowl.out
    await expect(page.locator('#gw-target-label')).toHaveText('place straight at: end of the pre-built curve')
    // the object is NAMED (`solidWord` of the guard's own object path, so the
    // name is the set's naming convention and can never drift from the mesh)
    // and the line carries the actionable half: the key that walks the ends.
    await expect(page.locator('#gw-ghost-state')).toHaveText(
      'blocked — the cereal bowl is in the way · press ] to walk the open ends',
    )

    // the red ghost is a refusal, not a warning: the seat adds nothing
    const before = (await page.locator('#gw-piece-count').textContent())!
    await page.locator('#gw-builder').press('Enter')
    await expect(page.locator('#gw-piece-count')).toHaveText(before)
    // …and the refusal says the SAME sentence the ghost wore (a click that
    // changes nothing is never quieter than the ghost that warned about it)
    await expect(page.locator('#gw-ghost-state')).toHaveText(
      'blocked — the cereal bowl is in the way · press ] to walk the open ends',
    )
    expect(errors).toEqual([])
  })

  test('a legal seat past the finish says the run ends at the cup', async ({ page }) => {
    await page.goto('/?level=kitchen03')
    await ready(page)
    await page.click('#gw-tray-straight')
    await page.locator('#gw-builder').press('ArrowRight') // the cup's own open exit
    await expect(page.locator('#gw-target-label')).toHaveText('place straight at: cup on the table')
    // green (it IS a legal seat) + the fact the green could not carry: a line
    // built off the far side of the goal is a line no car ever travels.
    await expect(page.locator('#gw-ghost-state')).toHaveText(
      'fits here — the run ends at the cup, so nothing past it is ever travelled',
    )
  })

  test('the drive-off and nose-first ADD lines both name the END (DD loop-breaker)', async ({ page }) => {
    await page.goto('/?level=kitchen03')
    await ready(page)

    // DD's build: the tray piece seated at the end they could see (the cup),
    // then a launch. The car lets go at the ramp's end, ~1.2 s in.
    await page.click('#gw-tray-straight')
    await page.locator('#gw-builder').press('ArrowRight')
    await page.click('#gw-place')
    await expect(page.locator('#gw-piece-count')).toHaveText('1 of 5 pieces used')
    await page.click('#gw-launch')
    await expect(page.locator('#gw-result')).toBeVisible({ timeout: 60_000 })

    const note = (await page.locator('#gw-result-note').textContent())!
    // The shipped advice families, unchanged: this build dies nose-first and
    // the note says so with an ADD tail naming the kinds the tray still holds
    // (stage-5's rule). What was missing was the END — six of DD's builds
    // obeyed exactly this sentence at the wrong end.
    expect(note).toMatch(/^fell off nose-first — add /)
    // …and now the sentence names the far open end of the chain as built,
    // which on this build is the ramp's exit: the answer DD never saw.
    expect(note).toContain('place at: end of the pre-built ramp')
    // the ring moved to the exit the placed piece created, so the sentence
    // also hands over the key that walks back (nothing else needs it)
    expect(note).toContain('press ] to walk the open ends')
  })

  test('the rung clears on the on-screen copy alone: five blind Places, one launch', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(String(err)))

    await page.goto('/?level=kitchen03')
    await ready(page)

    // NO hover, NO advice, NO instructions: the boot ring sits on the head of
    // the chain (`chainHeadIndex`, playtest N's law) and every Place moves it
    // to the end the placed piece just made. Five tray placements — the whole
    // tray, in the order a hand reaches across the tray — is a finish by the
    // rung's own 60/60 whole-tray-order claim.
    await page.click('#gw-tray-straight')
    await page.click('#gw-place')
    await page.click('#gw-place')
    await page.click('#gw-tray-gapLip')
    await page.click('#gw-place')
    await page.click('#gw-tray-drop')
    await page.click('#gw-place')
    await page.click('#gw-tray-landing')
    await page.click('#gw-place')
    await expect(page.locator('#gw-piece-count')).toHaveText('5 of 5 pieces used')

    await page.click('#gw-launch')
    await expect(page.locator('#gw-status')).toContainText('finished', { timeout: 60_000 })
    await expect(page.locator('#gw-result')).toBeVisible({ timeout: 60_000 })
    expect(errors).toEqual([])
  })
})
