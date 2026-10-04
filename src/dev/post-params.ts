// URL-param parsing for the harness post controls, kept pure so the parsing
// edge cases (paren-wrapped or bare triples, garbage) are unit-testable
// without a canvas.

import type { PostQuality } from '../render/post/index.ts'

const QUALITIES: readonly string[] = ['high', 'medium', 'low']

export function isPostQuality(value: string | null): value is PostQuality {
  return value !== null && (QUALITIES as readonly string[]).includes(value)
}

/**
 * Parse `focus=(x,y,z)` / `focus=x,y,z`. Returns null for absent or
 * malformed values — the harness then falls back to the scene's own focus.
 */
export function parseFocusParam(value: string | null): readonly [number, number, number] | null {
  if (!value) return null
  const parts = value.replace(/^\((.*)\)$/, '$1').split(',')
  if (parts.length !== 3) return null
  const nums = parts.map((p) => Number(p.trim()))
  if (nums.some((n) => !Number.isFinite(n))) return null
  return [nums[0]!, nums[1]!, nums[2]!]
}
