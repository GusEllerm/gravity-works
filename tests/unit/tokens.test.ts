import { test, expect } from 'vitest'
import { cssVars, GLOBAL_TOKENS, mixHex, SET_TOKENS, shiftHex } from '../../src/render/tokens.ts'

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
  expect(SET_TOKENS.kitchen).toEqual(SET_TOKENS.kitchen)
  expect(cssVars('kitchen')).toEqual(cssVars('kitchen'))
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
