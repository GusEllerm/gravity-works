/**
 * boot.ts under Vitest (node, no DOM): only the parts of the shell that are
 * pure. The DOM/canvas half is guarded by tests/e2e/smoke.spec.ts and
 * tests/e2e/builder.spec.ts, which drive the real built page.
 */
import { describe, expect, test } from 'vitest';
import { boot, runStatusLine } from '../../src/boot.ts';
import type { World } from '../../src/world/world.ts';

const fake = (status: string, time: number, hash: string): World =>
  ({ status, time, hashHex: () => hash }) as unknown as World;

describe('boot shell', () => {
  test('boot is the single browser entry function', () => {
    expect(typeof boot).toBe('function');
  });

  test('run status copy is concrete and shows the hash once physics has one', () => {
    expect(runStatusLine(fake('idle', 0, '00000000'), 5)).toBe('ready — 5 pieces');
    expect(runStatusLine(fake('finished', 1.5, 'abcd1234'), 6)).toBe(
      'finished — 1.50s — 6 pieces — hash abcd1234',
    );
    expect(runStatusLine(fake('fell', 0.4, '01234567'), 5)).toContain('fell off the set');
    expect(runStatusLine(fake('running', 2, 'ffffffff'), 5)).toContain('hash ffffffff');
  });
});
