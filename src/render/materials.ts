// Material classes from the art bible. Every object in the game is one of
// these seven: die-cast paint, track plastic, painted wood, ceramic, fabric,
// glass, liquid. Each is a ToonMaterial tuned per class; set palette (fill,
// shadow tint) comes from tokens so classes cannot drift per set.

import type * as THREE from 'three'
import { shiftHex } from './tokens.ts'
import type { SetTokens } from './tokens.ts'
import { ToonMaterial, type ToonMaterialParams } from './toon-material.ts'

export type MaterialClass =
  | 'dieCastPaint'
  | 'trackPlastic'
  | 'paintedWood'
  | 'ceramic'
  | 'fabric'
  | 'glass'
  | 'liquid'

/**
 * Grain is restricted to painted-wood and toy-treated surfaces (2026-10-04
 * backlog: speckle on ceramic reads as lens dirt). `wood` marks the one class
 * whose own grain is inherent; everywhere else a grain amount survives only
 * if the surface also carries the toy treatment.
 */
function fromClass(
  tokens: SetTokens,
  color: THREE.ColorRepresentation,
  tuning: ToonMaterialParams,
  overrides?: Partial<ToonMaterialParams>,
  wood = false,
): ToonMaterial {
  const merged: ToonMaterialParams = { ...tuning, ...overrides }
  if ((merged.grain ?? 0) > 0 && !wood && (merged.toy ?? 0) <= 0) merged.grain = 0
  return new ToonMaterial({
    color,
    shadowTint: tokens.shadowTint,
    fillHigh: tokens.fillHigh,
    fillLow: tokens.fillLow,
    ...merged,
  })
}

/** Hard small specular, small chrome rim, toy dip-paint. Cars and cans. */
export function dieCastPaint(
  tokens: SetTokens,
  color: THREE.ColorRepresentation,
  overrides?: Partial<ToonMaterialParams>,
): ToonMaterial {
  return fromClass(
    tokens,
    color,
    {
      ramp: { steps: [0.62, 1.0], thresholds: [0.4], softness: 0.03 },
      specular: { size: 0.1, strength: 0.95, color: '#FFFDF6' },
      rim: { strength: 0.3, size: 0.18, color: '#FDF3E0' },
      toy: 0.5,
    },
    overrides,
  )
}

/** Matte with a slight sheen. The orange track and track-side plastics. */
export function trackPlastic(
  tokens: SetTokens,
  color: THREE.ColorRepresentation,
  overrides?: Partial<ToonMaterialParams>,
): ToonMaterial {
  return fromClass(
    tokens,
    color,
    {
      ramp: { steps: [0.66, 1.0], thresholds: [0.36], softness: 0.06 },
      specular: { size: 0.3, strength: 0.28 },
      rim: { strength: 0.12, size: 0.5 },
      toy: 0.25,
    },
    overrides,
  )
}

/** Soft ramp with faint procedural grain. Tables, books, floors. */
export function paintedWood(
  tokens: SetTokens,
  color: THREE.ColorRepresentation,
  overrides?: Partial<ToonMaterialParams>,
): ToonMaterial {
  return fromClass(
    tokens,
    color,
    {
      ramp: { steps: [0.6, 0.85, 1.0], thresholds: [0.18, 0.55], softness: 0.1 },
      specular: { size: 0.22, strength: 0.18 },
      rim: { strength: 0.1, size: 0.6 },
      grain: 0.6,
      // grainScale is the per-surface-frequency dial: pass a value under 1
      // for big surfaces (floors, walls — long low streaks), over 1 for
      // small props (fine grain). 2026-10-04 backlog item 1.
      grainScale: 1,
    },
    overrides,
    true,
  )
}

/**
 * Saturation lift for ceramic glaze (2026-10-04 backlog): the stage-1 tile-B
 * bowl read chalky through the gold key. +10 % saturation (with a hair of
 * lightness) puts the glaze back without leaving the class tuning. The
 * interior glaze itself rides the 2026-10-04 backface-normal fix — a
 * DoubleSide lathe form now shades its inner wall by its true facing.
 */
const CERAMIC_SATURATION_LIFT = 0.1

export function ceramicSaturationLift(hex: string): string {
  return shiftHex(hex, 0, CERAMIC_SATURATION_LIFT, 0.012)
}

/**
 * Broad soft specular, warm rim. Bowls, mugs, sinks.
 *
 * 2026-10-07 (stage-3 review, fix 1): the two-band class put everything
 * above its threshold in a single blown band — 243–250 across the whole
 * key-facing bowl wall. The class now carries THREE bands with the upper
 * threshold raised to ndl 0.6, so the full-brightness band only lands on
 * the small wall arc that truly faces the key; the middle band holds the
 * roundness, the low band the shade side. Specular strength came down with
 * it (0.55 → 0.3): a broad soft glaze sheen, not a second light.
 */
export function ceramic(
  tokens: SetTokens,
  color: THREE.ColorRepresentation,
  overrides?: Partial<ToonMaterialParams>,
): ToonMaterial {
  const lifted = typeof color === 'string' && color.startsWith('#') ? ceramicSaturationLift(color) : color
  return fromClass(
    tokens,
    lifted,
    {
      ramp: { steps: [0.58, 0.8, 1.0], thresholds: [0.25, 0.62], softness: 0.08 },
      specular: { size: 0.45, strength: 0.3 },
      rim: { strength: 0.18, size: 0.4 },
    },
    overrides,
  )
}

/** No specular, strong rim. Pillows, towels, rugs. */
export function fabric(
  tokens: SetTokens,
  color: THREE.ColorRepresentation,
  overrides?: Partial<ToonMaterialParams>,
): ToonMaterial {
  return fromClass(
    tokens,
    color,
    {
      ramp: { steps: [0.58, 0.9, 1.0], thresholds: [0.22, 0.6], softness: 0.12 },
      specular: { strength: 0 },
      rim: { strength: 0.42, size: 0.7, color: '#FFF1DA' },
    },
    overrides,
  )
}

/** Transparent with a single bright highlight. Glasses, jars. */
export function glass(
  tokens: SetTokens,
  color: THREE.ColorRepresentation,
  overrides?: Partial<ToonMaterialParams>,
): ToonMaterial {
  const mat = fromClass(
    tokens,
    color,
    {
      ramp: { steps: [0.75, 1.0], thresholds: [0.25], softness: 0.2 },
      specular: { size: 0.06, strength: 1.4, color: '#FFFFFF' },
      rim: { strength: 0.5, size: 0.3, color: '#FFF6E4' },
      opacity: 0.32,
      diffuseStrength: 0.35,
    },
    overrides,
  )
  mat.depthWrite = false
  return mat
}

/**
 * Set-tinted, animated normal, broad specular. Tap water, puddles.
 *
 * 2026-10-07 (stage-3 review, fix 2): a flat liquid surface with a wide
 * specular band lit the WHOLE disc and desaturated the set tint into a grey
 * read (the never-list's plastic grey). The class specular narrowed and
 * lifted — ONE bright highlight riding the wobble, the set tint left whole.
 */
export function liquid(
  tokens: SetTokens,
  color: THREE.ColorRepresentation,
  overrides?: Partial<ToonMaterialParams>,
): ToonMaterial {
  return fromClass(
    tokens,
    color,
    {
      ramp: { steps: [0.68, 1.0], thresholds: [0.3], softness: 0.15 },
      specular: { size: 0.28, strength: 1.15, color: '#FFFDF2' },
      rim: { strength: 0.2, size: 0.4 },
      liquid: 0.35,
      opacity: 0.85,
    },
    overrides,
  )
}
