/**
 * The spec-URL contract of `tests/e2e/goto.ts` (program P3): the harness
 * appends `post=off&intro=off` to relative spec landings without ever
 * overriding an explicit param, keeps hash routes intact, and leaves
 * absolute URLs (about:blank) exactly as they were.
 */
import { describe, expect, it } from 'vitest';
import { specUrl } from '../../tests/e2e/goto.ts';

describe('specUrl — the shared spec gate', () => {
  it('appends the defaults to a bare landing', () => {
    expect(specUrl('/')).toBe('/?post=off&intro=off');
  });
  it('merges into an existing query without reordering it', () => {
    expect(specUrl('/?level=kitchen01')).toBe('/?level=kitchen01&post=off&intro=off');
    expect(specUrl('/?level=kitchen01&build=par&launch=1')).toBe(
      '/?level=kitchen01&build=par&launch=1&post=off&intro=off',
    );
  });
  it('an explicit param on the call always wins', () => {
    expect(specUrl('/?level=kitchen01&post=on')).toBe('/?level=kitchen01&post=on&intro=off');
    expect(specUrl('/?intro=1')).toBe('/?intro=1&post=off');
    expect(specUrl('/?post=low')).toBe('/?post=low&intro=off');
  });
  it('keeps hash routes (share pages) as hash routes', () => {
    expect(specUrl('/#s=not-a-real-link')).toBe('/?post=off&intro=off#s=not-a-real-link');
  });
  it('absolute URLs pass through untouched', () => {
    expect(specUrl('about:blank')).toBe('about:blank');
    expect(specUrl('https://example.test/x')).toBe('https://example.test/x');
  });
});
