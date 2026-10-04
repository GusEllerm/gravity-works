// Palette tokens: the single source of truth for color in Gravity Works.
// Every value is a plain hex string; every derived value is produced by the
// pure functions below so CSS and the material system cannot drift apart.
// Nothing here imports three.js — token math must run identically in Node tests
// and the browser (deterministic, float-stable, no color management).

export type SetId = 'kitchen' | 'bathroom' | 'bedroom' | 'garden' | 'garage' | 'porch'

export interface SetTokens {
  /** Human-readable set name (UI copy only). */
  readonly name: string
  /** The set's dominant hue — its time of day made visible (art bible §Color). */
  readonly dominant: string
  /** The set's single accent. */
  readonly accent: string
  /** Two-band ambient fill, high (sky-side) — tinted from dominant. Derived. */
  readonly fillHigh: string
  /** Two-band ambient fill, ground-side — tinted from dominant. Derived. */
  readonly fillLow: string
  /** Shadow tint — never black, pulled toward dominant. Derived. */
  readonly shadowTint: string
  /** Table/floor surface — warm neutral with a whisper of dominant. Derived. */
  readonly ground: string
  /** Flat background wall — never a gradient. Derived. */
  readonly background: string
  /** The orange track constant: identical in every set, never re-hued. */
  readonly track: string
}

export interface GlobalTokens {
  /** The brand constant: toy-track orange. */
  readonly trackOrange: string
  /** Warm neutral base every surface starts from — never grey. */
  readonly cream: string
  /** Breakfast-light key color (used until sets define their own). */
  readonly keyLight: string
}

export const GLOBAL_TOKENS: GlobalTokens = {
  trackOrange: '#FF7A1A',
  cream: '#F7E8D2',
  keyLight: '#FFE7C4',
}

// Seed palettes — one dominant + one accent per set, chosen for the set's
// story and time of day (PROMPT.md §6). Everything else is derived.
const SEEDS: Record<SetId, { dominant: string; accent: string }> = {
  kitchen: { dominant: '#EFAF4B', accent: '#5FB49C' }, // gold / breakfast; mint fridge
  bathroom: { dominant: '#4EB8C9', accent: '#F4C84B' }, // aqua / mid-morning; rubber duck
  bedroom: { dominant: '#5A5FB5', accent: '#FFB454' }, // indigo / nightlight amber
  garden: { dominant: '#C7567B', accent: '#A8C24E' }, // magenta dusk / chartreuse firefly
  garage: { dominant: '#87913D', accent: '#C13E2C' }, // olive afternoon / red tool
  porch: { dominant: '#6C8AA6', accent: '#E8A13C' }, // slate storm / lantern amber
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v
}

export function hexToRgb(hex: string): [number, number, number] {
  const n = Number.parseInt(hex.replace('#', ''), 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

export function rgbToHex(r: number, g: number, b: number): string {
  const c = (v: number): string =>
    Math.round(clamp01(v) * 255)
      .toString(16)
      .padStart(2, '0')
  return `#${c(r)}${c(g)}${c(b)}`
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h: number
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
  else if (max === g) h = ((b - r) / d + 2) / 6
  else h = ((r - g) / d + 4) / 6
  return [h, s, l]
}

function hueChannel(p: number, q: number, t: number): number {
  let tt = t
  if (tt < 0) tt += 1
  if (tt > 1) tt -= 1
  if (tt < 1 / 6) return p + (q - p) * 6 * tt
  if (tt < 1 / 2) return q
  if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6
  return p
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) return [l, l, l]
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  return [hueChannel(p, q, h + 1 / 3), hueChannel(p, q, h), hueChannel(p, q, h - 1 / 3)]
}

export function shiftHex(hex: string, dh: number, ds: number, dl: number): string {
  const [h, s, l] = rgbToHsl(...hexToRgb(hex))
  return rgbToHex(...hslToRgb((h + dh + 1) % 1, clamp01(s + ds), clamp01(l + dl)))
}

export function mixHex(a: string, b: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(a)
  const [r2, g2, b2] = hexToRgb(b)
  return rgbToHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t)
}

export function lighten(hex: string, amount: number): string {
  return shiftHex(hex, 0, -amount * 0.35, amount)
}

export function darken(hex: string, amount: number): string {
  return shiftHex(hex, 0, amount * 0.15, -amount)
}

function derive(id: SetId): SetTokens {
  const seed = SEEDS[id]
  return {
    name: id,
    dominant: seed.dominant,
    accent: seed.accent,
    fillHigh: lighten(seed.dominant, 0.3),
    fillLow: mixHex(darken(seed.dominant, 0.42), GLOBAL_TOKENS.cream, 0.25),
    shadowTint: mixHex(lighten(seed.dominant, 0.08), GLOBAL_TOKENS.cream, 0.3),
    ground: mixHex(GLOBAL_TOKENS.cream, seed.dominant, 0.3),
    background: lighten(mixHex(seed.dominant, GLOBAL_TOKENS.cream, 0.55), 0.18),
    track: GLOBAL_TOKENS.trackOrange,
  }
}

export const SET_TOKENS: Record<SetId, SetTokens> = {
  kitchen: derive('kitchen'),
  bathroom: derive('bathroom'),
  bedroom: derive('bedroom'),
  garden: derive('garden'),
  garage: derive('garage'),
  porch: derive('porch'),
}

/** CSS custom properties for a set — the other half of "cannot drift". */
export function cssVars(id: SetId): Record<string, string> {
  const t = SET_TOKENS[id]
  return {
    '--dominant': t.dominant,
    '--accent': t.accent,
    '--fill-high': t.fillHigh,
    '--fill-low': t.fillLow,
    '--shadow-tint': t.shadowTint,
    '--ground': t.ground,
    '--background': t.background,
    '--track': t.track,
  }
}
