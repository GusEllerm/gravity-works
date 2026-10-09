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
    runCounts: Record<string, number>
    rejected: Record<string, number>
    rollUpdates: number
  }
  __gwSoundRender?: (name: string) => Promise<{ peak: number; dc: number }>
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
