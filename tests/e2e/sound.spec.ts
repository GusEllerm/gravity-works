import { test, expect } from '@playwright/test'
import { goto } from './goto.ts'

/**
 * Stage 5 sound specs. The page is driven with TRUSTED gestures (Playwright
 * inputs) because the whole autoplay contract hinges on gesture
 * trustworthiness — an AudioContext may exist ONLY after the first one.
 *
 * 1. the autoplay gate: no context (engine `unlocked`) before any input,
 *    unlocked on the first gesture, never earlier;
 * 2. LOUDNESS — the OfflineAudioContext harness the brief asks for, run
 *    where WebAudio actually exists (headless Chromium renders audio
 *    off-device fine; no flag needed). Every voice is rendered through the
 *    REAL master chain (ceiling + limiter + room) and asserted: peak at or
 *    under the -12 dBFS ceiling, DC offset inaudible;
 * 3. a full par run on a sound-on page throws nothing, and the repetition
 *    guard says every voice stayed under the per-run cap (nothing fired
 *    repetitively inside one run);
 * 4. mute is honored across a reload (the save's `settings.sound`).
 */

type SoundWindow = Window & {
  __gwSound?: () => {
    muted: boolean
    volume: number
    unlocked: boolean
    deaf: boolean
    running: boolean
    bed: string | null
    runCounts: Record<string, number>
    rejected: Record<string, number>
    rollUpdates: number
  }
  __gwSoundRender?: (name: string) => Promise<{ peak: number; dc: number }>
  __gwHouseState?: () => { status: string }
  __gwCtxCount?: number
}

const VOICE_NAMES = [
  'launch',
  'snap',
  'ring',
  'cup',
  'whoosh',
  'hum',
  'hazard',
  'chime',
  'victory',
  'blipPlace',
  'blipUndo',
  // T1.1 feel package: the landing thud (renderVoice sweeps every surface
  // and reports the worst peak) and the four mid-run contact ticks
  'land',
  'splash',
  'oil',
  'magnet',
  'whirl',
  'tick',
  'bird',
  'room',
  'roll',
] as const

const ready = (page: import('@playwright/test').Page) =>
  expect(page.locator('#gw-status')).toContainText('ready', { timeout: 60_000 })

const soundState = (page: import('@playwright/test').Page) =>
  page.evaluate(() => (window as unknown as SoundWindow).__gwSound!())

test('no AudioContext is created before the first gesture (autoplay policy)', async ({ page }) => {
  await goto(page, '/')
  await ready(page)
  // loading the page is not a gesture: the engine is armed but dark
  expect((await soundState(page)).unlocked).toBe(false)
  // a real click is: the volume slider is the least-world-touching target
  await page.click('#gw-sound-volume')
  expect((await soundState(page)).unlocked).toBe(true)
})

test('every voice renders offline under the -12 dBFS ceiling with no DC', async ({ page }) => {
  await goto(page, '/')
  await ready(page)
  await page.waitForFunction(
    () => typeof (window as unknown as SoundWindow).__gwSoundRender === 'function',
  )
  const rows: Record<string, { peak: number; dc: number; dbfs: number }> = {}
  for (const name of VOICE_NAMES) {
    const r = await page.evaluate(
      async (n) => (window as unknown as SoundWindow).__gwSoundRender!(n),
      name,
    )
    rows[name] = { peak: r.peak, dc: r.dc, dbfs: 20 * Math.log10(Math.max(r.peak, 1e-9)) }
    // the ceiling is the mix's contract: -12 dBFS, and it is measured
    // THROUGH the master chain, not asserted about it
    expect(r.peak, `${name} peak ${r.peak}`).toBeLessThanOrEqual(0.2512)
    expect(Math.abs(r.dc), `${name} dc ${r.dc}`).toBeLessThan(0.005)
  }
  console.info('[sound] measured loudness:', JSON.stringify(rows, null, 1))
})

test('a sound-on par run never throws and trips no repetition guard', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(String(e)))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  await goto(page, '/?build=par')
  await ready(page)
  // the Launch button press is the gesture AND the run: the engine unlocks
  // on the capture-phase pointerdown, then the run plays with real audio
  await page.click('#gw-launch')
  await expect(page.locator('#gw-status')).not.toContainText('ready', { timeout: 30_000 })
  await expect(page.locator('#gw-status')).toContainText(
    /(finished|fell|stalled|timed out)/,
    { timeout: 60_000 },
  )
  const s = await soundState(page)
  expect(s.unlocked).toBe(true)
  expect(s.deaf).toBe(false)
  // repetition acceptance: every voice stayed a DISTINCT event, well under
  // the design cap, and the guard rejected nothing
  for (const [voice, count] of Object.entries(s.runCounts)) {
    expect(count, `voice ${voice} fired ${count}x in one run`).toBeLessThanOrEqual(12)
  }
  expect(s.rejected).toEqual({})
  // the roll is the one sustained voice: it updated, and stayed <=20 Hz
  expect(s.rollUpdates).toBeLessThanOrEqual(20 * 30 + 5) // <= 30 s of run
  expect(errors).toEqual([])
})

test('mute is honored across a reload', async ({ page }) => {
  await goto(page, '/')
  await ready(page)
  await page.click('#gw-sound-toggle') // gesture + mute in one press
  expect((await soundState(page)).muted).toBe(true)
  const stored = await page.evaluate(
    () => JSON.parse(localStorage.getItem('gravity-works.save') ?? '{}').settings?.sound,
  )
  expect(stored).toEqual({ muted: true, volume: 0.8 })
  await page.reload()
  await ready(page)
  const s = await soundState(page)
  expect(s.muted).toBe(true)
  expect(s.unlocked).toBe(false) // the reload re-arms the autoplay gate too
  await expect(page.locator('#gw-sound-toggle')).toHaveText('Sound: off')
  // and back on, still one gesture later
  await page.click('#gw-sound-toggle')
  expect((await soundState(page)).muted).toBe(false)
  await expect(page.locator('#gw-sound-toggle')).toHaveText('Sound: on')
})

// ---- h4, Lane F2: SOUND AT THE DOOR ---------------------------------------
//
// THE SOUND LAW: every boot route wires the engine or the game is silent
// at its own door. The player verdict's truth 1 priced the house-era
// front door LITERALLY SILENT — `bootHouse` never called the engine, and
// every spec above boots an ADDRESSED rung (the webdriver law), so the
// suite never stood at the door. These lanes do. `bed` on the engine
// seam is what lets the bed-switch crossing be PROVEN, not hoped for.

const house = (page: import('@playwright/test').Page) =>
  page.waitForFunction(
    () => typeof (window as unknown as SoundWindow).__gwHouseState === 'function',
    undefined,
    { timeout: 60_000 },
  )

/** Count REAL AudioContext constructions (the no-double-unlock witness). */
async function countContexts(page: import('@playwright/test').Page): Promise<void> {
  await page.addInitScript(() => {
    const w = window as unknown as { __gwCtxCount: number; AudioContext: typeof AudioContext }
    w.__gwCtxCount = 0
    const Orig = w.AudioContext
    w.AudioContext = new Proxy(Orig, {
      construct(t, a) {
        w.__gwCtxCount++
        return new t(...a)
      },
    })
  })
}
const ctxCount = (page: import('@playwright/test').Page) =>
  page.evaluate(() => (window as unknown as SoundWindow).__gwCtxCount ?? 0)

test('the bare route boots the sound engine — the door is not silent', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(String(e)))
  await goto(page, '/?boot=house')
  await house(page)
  // the CHIP is home chrome now, and the engine seam stands on this route
  await expect(page.locator('#gw-sound #gw-sound-toggle')).toBeVisible()
  expect((await soundState(page)).unlocked).toBe(false) // autoplay law unchanged
  await page.click('#gw-sound-volume')
  const s = await soundState(page)
  expect(s.unlocked).toBe(true)
  expect(s.deaf).toBe(false)
  // the door's own idle bed: the kitchen — the house's front room
  expect(s.bed).toBe('kitchen')
  expect(errors).toEqual([])
})

test('a house release mints sound events — launch, roll, beds across the crossings', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(String(e)))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  await goto(page, '/?boot=house')
  await house(page)
  await page.click('#gw-sound-volume') // the gesture unlocks; the run follows
  // witness the bed through the run: the crossing sequence is the proof
  await page.evaluate(() => {
    const w = window as unknown as { __beds: Set<string>; __bedTimer: number }
    w.__beds = new Set<string>()
    w.__bedTimer = window.setInterval(() => {
      const bed = (window as unknown as SoundWindow).__gwSound?.().bed
      if (bed) w.__beds.add(bed)
    }, 40)
  })
  await page.click('#gw-launch')
  await expect(page.locator('#gw-house-result')).not.toBeEmpty({ timeout: 90_000 })
  const beds = await page.evaluate(() => {
    const w = window as unknown as { __beds: Set<string>; __bedTimer: number }
    clearInterval(w.__bedTimer)
    return [...w.__beds]
  })
  const s = await soundState(page)
  // THE EVENT MAP, called at last by the page that always knew about it.
  // THE TERMINAL EDGE speaks — exactly one outcome voice (this tape ends
  // off the world's edge after the bathroom: `whoosh`; the downhill's own
  // verdict line says where it stopped). The launch voice's count rides
  // the SAME beginRun-reset shape the rung page has (`src/boot.ts` fires
  // voice→beginRun in that order) — what the run PROVES is the roll and
  // the beds below.
  const terminalVoices = ['cup', 'whoosh', 'hum', 'hazard'] as const
  expect(
    terminalVoices.reduce((n, v) => n + (s.runCounts[v] ?? 0), 0),
    `the terminal edge spoke (runCounts ${JSON.stringify(s.runCounts)})`,
  ).toBe(1)
  expect(s.rollUpdates, 'the roll voice heard the descent').toBeGreaterThan(0)
  expect(s.rollUpdates).toBeLessThanOrEqual(20 * 30) // the <=20 Hz law
  // THE BED SWITCHES ON PARCEL CROSSINGS: the garage opens the descent and
  // at least two rooms' beds are heard on the way down
  expect(beds).toContain('garage')
  expect(beds.length, `beds heard: ${beds}`).toBeGreaterThanOrEqual(2)
  // the idle bed RETURNS with the parked crane
  expect(s.bed).toBe('kitchen')
  // THE FIREWALL LINE on the house route: distinct events, guard quiet
  for (const [voice, count] of Object.entries(s.runCounts)) {
    expect(count, `voice ${voice} fired ${count}x in one house run`).toBeLessThanOrEqual(12)
  }
  expect(s.rejected).toEqual({})
  expect(errors).toEqual([])
})

test('the tour hand-off from a window unlocks exactly once', async ({ page }) => {
  await countContexts(page)
  await goto(page, '/?boot=house')
  await house(page)
  await page.click('#gw-house-window-kitchen') // gesture 1: unlock, one context
  expect(await ctxCount(page)).toBe(1)
  const tour = page.locator('#gw-house-tours-kitchen a').first()
  await expect(tour).toBeVisible()
  await tour.click() // gesture 2 + navigation: the hand-off
  await expect(page.locator('#gw-status')).toContainText('ready', { timeout: 60_000 })
  expect(await ctxCount(page)).toBe(0) // the new document has built NOTHING yet
  await page.keyboard.press('Shift') // its own first gesture unlocks ITS engine
  expect((await soundState(page)).unlocked).toBe(true)
  expect(await ctxCount(page)).toBe(1) // …exactly one context — no double-unlock
})

test('the premise beat is silent by construction and unlocks AFTER itself', async ({ page }) => {
  await countContexts(page)
  await goto(page, '/?boot=house&intro=1')
  await house(page)
  // mid-beat: NO engine exists at all — silence is structural, not a
  // volume hack (the beat swallows the gesture; the mount happens at
  // the beat's END and replays that swallowed gesture into unlock)
  expect(await page.evaluate(() => typeof (window as any).__gwSound)).toBe('undefined')
  expect(await ctxCount(page)).toBe(0)
  await page.mouse.click(480, 300) // the dismissing gesture
  await expect(page.locator('#app')).not.toHaveClass(/gw-premiere/)
  const s = await soundState(page)
  expect(s.unlocked).toBe(true) // the swallowed gesture, replayed into the unlock path
  expect(await ctxCount(page)).toBe(1) // …and STILL one context
})
