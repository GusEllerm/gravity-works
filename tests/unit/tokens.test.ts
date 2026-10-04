import { test, expect } from 'vitest'
import { cssVars, GLOBAL_TOKENS, hexToRgb, lighten, darken, mixHex, SET_TOKENS, shiftHex } from '../../src/render/tokens.ts'

test('every set derives the full token shape and the constant orange track', () => {
  for (const [id, t] of Object.entries(SET_TOKENS)) {
    expect(t.name, id).toBe(id)
    for (const [k, v] of Object.entries(t)) {
      if (k !== 'name') expect(v, `${id}.${k}`).toMatch(/^#[0-9a-fA-F]{6}$/)
    }
    expect(t.track, id).toBe(GLOBAL_TOKENS.trackOrange)
  }
})

test('derivation is stable: golden kitchen values and repeat-call equality', () => {
  // Golden values pin the pure math — a change to the derivation must be a
  // deliberate edit here, never an accident in the color helpers.
  expect(SET_TOKENS.kitchen).toEqual({
    name: 'kitchen',
    dominant: '#EFAF4B',
    accent: '#5FB49C',
    fillHigh: '#f9edda',
    fillLow: '#856738',
    shadowTint: '#f2cb90',
    ground: '#f5d7aa',
    background: '#fcf4e8',
    track: '#FF7A1A',
  })
  // Repeat calls must agree *and* be independent objects: a shared mutable
  // return value would let one set's CSS leak into another's.
  const first = cssVars('kitchen')
  const second = cssVars('kitchen')
  expect(second).toEqual(first)
  expect(second).not.toBe(first)
  // The "CSS and the material system cannot drift" promise, stated as a fact
  // instead of as a tautology: exactly one custom property per material-facing
  // token, same values, no extras and none missing.
  const materialTokens = Object.entries(SET_TOKENS.kitchen).filter(([key]) => key !== 'name')
  expect(Object.keys(first)).toHaveLength(materialTokens.length)
  expect(Object.values(first).sort()).toEqual(materialTokens.map(([, value]) => value).sort())
  // Derived fields must actually be derived — five distinct surfaces, not one
  // colour copied around.
  expect(new Set(materialTokens.map(([, value]) => value)).size).toBe(materialTokens.length)
  // The pure colour math has endpoints and a symmetry to honour.
  expect(mixHex('#000000', '#ffffff', 0)).toBe('#000000')
  expect(mixHex('#000000', '#ffffff', 1)).toBe('#ffffff')
  expect(mixHex('#e0a040', '#202020', 0.25)).toBe(mixHex('#202020', '#e0a040', 0.75))
  // A hue shift of a third of the wheel moves the colour; lightness helpers are
  // monotonic in the channel they claim to move.
  expect(shiftHex('#123456', 1 / 3, 0, 0)).not.toBe(shiftHex('#123456', 0, 0, 0))
  const brightest = (hex: string): number => Math.max(...hexToRgb(hex))
  expect(brightest(lighten('#EFAF4B', 0.2))).toBeGreaterThan(brightest('#EFAF4B'))
  expect(brightest(darken('#EFAF4B', 0.2))).toBeLessThan(brightest('#EFAF4B'))
})

test('color helpers round-trip and mix deterministically', () => {
  expect(mixHex('#FFFFFF', '#000000', 0.5)).toBe('#808080')
  expect(mixHex('#FF7A1A', '#FF7A1A', 0.7)).toBe('#ff7a1a')
  expect(shiftHex('#EFAF4B', 0, 0, 0)).toBe('#efaf4b')
})

test('css vars expose every material-facing token', () => {
  expect(cssVars('bedroom')).toEqual({
    '--dominant': SET_TOKENS.bedroom.dominant,
    '--accent': SET_TOKENS.bedroom.accent,
    '--fill-high': SET_TOKENS.bedroom.fillHigh,
    '--fill-low': SET_TOKENS.bedroom.fillLow,
    '--shadow-tint': SET_TOKENS.bedroom.shadowTint,
    '--ground': SET_TOKENS.bedroom.ground,
    '--background': SET_TOKENS.bedroom.background,
    '--track': GLOBAL_TOKENS.trackOrange,
  })
})
