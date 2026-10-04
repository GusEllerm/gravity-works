// Material classes from the art bible. Every object in the game is one of
// these seven: die-cast paint, track plastic, painted wood, ceramic, fabric,
// glass, liquid. Each is a ToonMaterial tuned per class; set palette (fill,
// shadow tint) comes from tokens so classes cannot drift per set.

import type * as THREE from 'three'
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

function fromClass(
  tokens: SetTokens,
  color: THREE.ColorRepresentation,
  tuning: ToonMaterialParams,
  overrides?: Partial<ToonMaterialParams>,
): ToonMaterial {
  return new ToonMaterial({
    color,
    shadowTint: tokens.shadowTint,
    fillHigh: tokens.fillHigh,
    fillLow: tokens.fillLow,
    ...tuning,
    ...overrides,
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
    },
    overrides,
  )
}

/** Broad soft specular, warm rim. Bowls, mugs, sinks. */
export function ceramic(
  tokens: SetTokens,
  color: THREE.ColorRepresentation,
  overrides?: Partial<ToonMaterialParams>,
): ToonMaterial {
  return fromClass(
    tokens,
    color,
    {
      ramp: { steps: [0.64, 1.0], thresholds: [0.32], softness: 0.08 },
      specular: { size: 0.45, strength: 0.55 },
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

/** Set-tinted, animated normal, broad specular. Tap water, puddles. */
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
      specular: { size: 0.4, strength: 0.9, color: '#FFFDF2' },
      rim: { strength: 0.2, size: 0.4 },
      liquid: 0.35,
      opacity: 0.85,
    },
    overrides,
  )
}
