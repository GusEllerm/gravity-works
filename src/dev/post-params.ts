<<<<<<< HEAD
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
=======
/**
 * Dev-harness URL-parameter helpers for the post stack (`?post=high|medium|low`,
 * `?focus=x,y,z`). Pure parsing only — no DOM, no renderer — so the contract
 * is unit-testable (`tests/unit/render-post.test.ts`) and the harness scene
 * can share the same acceptance rules as the tests.
 *
 * (Stage-3 integration fix: the post-stack commit landed the tests for this
 * file without the file itself — `tsc` at that commit was red on the import.
 * Reconstructed to the test's contract, nothing more.)
 */
import type { PostQuality } from '../render/post/index.ts';

const QUALITIES: readonly string[] = ['high', 'medium', 'low'];

/** True iff `raw` names a post quality of the ladder in
 *  `src/render/post/index.ts` (never invents a tier). */
export function isPostQuality(raw: string | null): raw is PostQuality {
  return raw !== null && QUALITIES.includes(raw);
}

/**
 * Parse a `focus=x,y,z` parameter (parentheses optional, whitespace
 * tolerant) into the world point `[x, y, z]`. Anything that is not exactly
 * three finite numbers returns `null` — the harness then keeps its default
 * focus rather than guessing.
 */
export function parseFocusParam(raw: string | null): [number, number, number] | null {
  if (raw === null) return null;
  const body = raw.trim().replace(/^\((.*)\)$/, '$1');
  const parts = body.split(',');
  if (parts.length !== 3) return null;
  const nums = parts.map((p) => Number(p.trim()));
  if (nums.some((n) => !Number.isFinite(n))) return null;
  return [nums[0]!, nums[1]!, nums[2]!];
>>>>>>> origin/stage3-hazards
}
