/**
 * The `?intro=` param family of the premise beat (program P3 added `off`
 * to the `?intro=1` forcing recorded in `src/pages/intro.ts`): an explicit
 * opt-out is a decision, not a signal — it wins over every audience
 * inference (the same law `?post=off` is for the composer), and the
 * forcing still plays for the beat's own spec.
 */
import { describe, expect, it } from 'vitest';
import { premiereWanted } from '../../src/pages/intro.ts';

describe('intro URL params', () => {
  it('intro=off never plays, whatever else the landing looks like', () => {
    expect(premiereWanted(new URLSearchParams('intro=off'))).toBe(false);
    expect(premiereWanted(new URLSearchParams('intro=off&level=kitchen01'))).toBe(false);
  });
  it('intro=1 still forces the beat (the beat spec relies on this)', () => {
    // node: no navigator.webdriver signal, no storage — the forcing alone
    // decides, which is exactly what `tests/e2e/intro.spec.ts` rides
    expect(premiereWanted(new URLSearchParams('intro=1'))).toBe(true);
  });
});
