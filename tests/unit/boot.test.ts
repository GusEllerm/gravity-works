/**
 * boot.ts under Vitest (node, no DOM): only the parts of the shell that are
 * pure. The DOM/canvas half is guarded by tests/e2e/smoke.spec.ts and
 * tests/e2e/builder.spec.ts, which drive the real built page.
 */
import { describe, expect, test } from 'vitest';
import { boot, initialBuild, nextLevelId, runStatusLine, startBuildFor } from '../../src/boot.ts';
import { KITCHEN01 } from '../../src/world/levels/kitchen01.level.ts';
import { FEELTRACK } from '../../src/world/levels/feeltrack.level.ts';
import type { World } from '../../src/world/world.ts';
import type { Build } from '../../src/track/build.ts';

const fake = (status: string, time: number, hash: string): World =>
  ({ status, time, hashHex: () => hash }) as unknown as World;

describe('boot shell', () => {
  test('boot is the single browser entry function', () => {
    expect(typeof boot).toBe('function');
  });

  test('run status copy is concrete and carries no hash (hash lives in the details)', () => {
    // playtest E+F: the hash was engineer trivia on the player's line — it
    // now rides #gw-hash-value behind the determinism-fingerprint disclosure
    // playtests P+Q (counter coherence): the idle line states the tray
    // tally in the SAME words as #gw-piece-count — "n of m pieces used"
    expect(runStatusLine(fake('idle', 0, '00000000'), 5, 9)).toBe('ready — 5 of 9 pieces used');
    expect(runStatusLine(fake('finished', 1.5, 'abcd1234'), 6, 9)).toBe('finished — 1.50s');
    expect(runStatusLine(fake('fell', 0.4, '01234567'), 5, 9)).toBe('fell off — 0.40s');
    expect(runStatusLine(fake('running', 2, 'ffffffff'), 5, 9)).toBe('running — 2.00s');
    expect(runStatusLine(fake('running', 2, 'ffffffff'), 5, 9)).not.toContain('hash');
    // the terminal/running lines carry no tally at all (one counter means
    // the status line never states a second one mid-run)
    expect(runStatusLine(fake('running', 2, 'ffffffff'), 5, 9)).not.toContain('pieces');
  });

  test('a kitchen level starts EMPTY of tray pieces: fixtures only, tray to build', () => {
    // the deployed-page bug was booting placeholderBuild() (= the full par
    // reference) as the STARTING build — pre-built level, over-budget tray
    const start = initialBuild(KITCHEN01);
    expect(start.pieces.map((p) => p.def)).toEqual(['ramp', 'finishCup']);
    expect(start.pieces.every((p, i) => p.seq === i)).toBe(true);
    expect(start.pieces.length).toBeLessThan(KITCHEN01.parBuild().pieces.length);
    expect(Object.keys(KITCHEN01.tray)).toEqual(['gapLip', 'drop', 'landing']);
    // a level with no fixture table (the feel rig) ships its reference build
    expect(initialBuild(FEELTRACK).pieces.length).toBe(FEELTRACK.placeholderBuild().pieces.length);
  });

  test('reload restores the WORKING build; the save rules decide fresh (playtest S)', () => {
    // S's reload "silently wiped my in-progress build": autosave existed
    // (rememberBuild on every change) but nothing read it back. Both
    // directions of the decision are pure (`startBuildFor`).
    const fresh = initialBuild(KITCHEN01);
    const working: Build = KITCHEN01.parBuild(); // fixtures + the full tray line
    // no record (fresh save) → fresh fixtures-only build
    expect(startBuildFor(KITCHEN01, new URLSearchParams(''), undefined).pieces).toEqual(fresh.pieces);
    // a record for THIS level → restored, byte for byte
    const back = startBuildFor(KITCHEN01, new URLSearchParams(''), working);
    expect(back.pieces.map((p) => p.def)).toEqual(working.pieces.map((p) => p.def));
    // a record naming ANOTHER level is nobody's build → fresh
    expect(
      startBuildFor(KITCHEN01, new URLSearchParams(''), { ...working, levelId: 'kitchen02' }).pieces,
    ).toEqual(fresh.pieces);
    // ?build=par is recorded addressing — the fresh reference build, record or not
    expect(
      startBuildFor(KITCHEN01, new URLSearchParams('build=par'), working).pieces.length,
    ).toBe(KITCHEN01.placeholderBuild().pieces.length);
  });

  test('the woven ladder walks: kitchen ramp into bedroom ramp into the tap, encore onto finale, ending at porch05', () => {
    expect(nextLevelId('kitchen01')).toBe('kitchen02');
    expect(nextLevelId('kitchen04')).toBe('kitchen05');
    expect(nextLevelId('kitchen05')).toBe('bedroom03'); // the booster lesson hands off to Pyramid Air (stage-6 re-weave)
    expect(nextLevelId('bedroom01')).toBe('bedroom02');
    expect(nextLevelId('bedroom02')).toBe('kitchen04'); // the bedroom ramp steps back to the kitchen's tap
    expect(nextLevelId('bedroom03')).toBe('bathroom01'); // the bedroom's lesson rung hands off to the bathroom
    expect(nextLevelId('bedroom05')).toBe('bedroom04'); // the ENCORE lands on its room's finale
    expect(nextLevelId('bedroom04')).toBe('garden03'); // the bedroom finale hands off to the garden's trade-off
    expect(nextLevelId('bathroom01')).toBe('bathroom02');
    expect(nextLevelId('bathroom03')).toBe('bathroom05');
    expect(nextLevelId('bathroom05')).toBe('bathroom04');
    expect(nextLevelId('bathroom04')).toBe('garden01'); // the bathroom era hands off to the garden
    expect(nextLevelId('garden01')).toBe('garden02');
    expect(nextLevelId('garden02')).toBe('bedroom05'); // the garden's wake carries the bedroom ENCORE to its finale
    expect(nextLevelId('garden03')).toBe('garden05');
    expect(nextLevelId('garden05')).toBe('garden04');
    expect(nextLevelId('garden04')).toBe('garage01'); // the garden era hands off to the garage
    expect(nextLevelId('garage01')).toBe('garage02');
    expect(nextLevelId('garage03')).toBe('garage05');
    expect(nextLevelId('garage05')).toBe('garage04');
    expect(nextLevelId('garage04')).toBe('porch01'); // the garage closes and the porch OPENS (the campaign's last room)
    expect(nextLevelId('porch01')).toBe('porch02');
    expect(nextLevelId('porch03')).toBe('porch04');
    expect(nextLevelId('porch05')).toBeNull(); // last rung of the WHOLE campaign: no Next button
    expect(nextLevelId('kitchen-sandbox')).toBeNull(); // off-ladder surfaces
    expect(nextLevelId('feeltrack')).toBeNull();
  });
});
