/**
 * The result layer under Vitest (node): the pure half — the par-carrying
 * model and the panel's three explanatory lines. The DOM panel and its
 * scroll-into-view visibility are e2e-guarded (`tests/e2e/loop.spec.ts`).
 */
import { describe, expect, test } from 'vitest';
import { emptyEvidence, physicsNote, NOSE_FIRST_PITCH } from '../../src/ui/result.ts';
import { outcomeLines, resultModel } from '../../src/ui/result.ts';

const ev = emptyEvidence(0);
const par = { pieces: 3, time: 2.21 };

describe('result model (par transparency)', () => {
  test('the model carries the par it was scored against', () => {
    const m = resultModel({ status: 'finished', time: 2.0, piecesUsed: 3, hazardsTouched: 0 }, par, ev);
    expect(m.par).toEqual(par);
    expect(m.stars).toBe(3);
  });

  test('a finished run\'s tallies carry their par lines and per-line marks', () => {
    const lines = outcomeLines(
      resultModel({ status: 'finished', time: 2.4, piecesUsed: 2, hazardsTouched: 0 }, par, ev),
    );
    expect(lines.pieces).toBe('2 pieces — par 3 ✓');
    expect(lines.time).toBe('2.40 s — par 2.21 s ✗');
    expect(lines.rules).toContain('finish the run');
  });

  test('an unfinished run shows the par lines without marks (rule 1 already failed)', () => {
    const lines = outcomeLines(
      resultModel({ status: 'fell', time: 2.04, piecesUsed: 3, hazardsTouched: 0 }, par, ev),
    );
    expect(lines.pieces).toBe('3 pieces — par 3');
    expect(lines.time).toBe('2.04 s — par 2.21 s');
  });

  test('a run of a never-starred level defaults to the target lines (no replay flag needed)', () => {
    const m = resultModel({ status: 'finished', time: 2.0, piecesUsed: 3, hazardsTouched: 0 }, par, ev);
    expect(m.bestStarsBefore).toBe(0);
    expect(outcomeLines(m).pieces).toBe('3 pieces — par 3 ✓');
  });

  // Playtest J: "N pieces — par M" is meaningless on a re-run of a level
  // whose stars are already earned — there the par is a verdict, not a
  // target, and the run leads with its own numbers.
  test('a finished re-run of an already-starred level verdicts the par, targetless', () => {
    const lines = outcomeLines(
      resultModel({ status: 'finished', time: 2.4, piecesUsed: 2, hazardsTouched: 0 }, par, ev, 3),
    );
    expect(lines.pieces).toBe('2 pieces — beat par ✓ (par 3)');
    expect(lines.time).toBe('2.40 s — over par (par 2.21 s)');
    expect(lines.rules).toContain('finish the run');
    // the target phrasing ("— par M ✗") is gone on a replay
    expect(lines.time).not.toMatch(/par [\d.]+ s ✗/);
  });

  test('a FAILED re-run keeps the failure rules exactly: unmarked tallies', () => {
    const lines = outcomeLines(
      resultModel({ status: 'stalled', time: 3.1, piecesUsed: 4, hazardsTouched: 0 }, par, ev, 2),
    );
    expect(lines.pieces).toBe('4 pieces — par 3');
    expect(lines.time).toBe('3.10 s — par 2.21 s');
  });
});

/**
 * BUILD-AWARE NOTES (playtest M item 5: "'lower the lip' advice when I had
 * NO lip placed"), EXTENDED to TRAY-AWARE (playtest Q item 5: "'flatten
 * the landing' when Landing isn't in the tray (L2!)"). The advice tails
 * may only name kinds the player can act on NOW — PLACED in the build that
 * ran or still STOCKED in the level's tray (`actionableKindsFor` in
 * `src/boot.ts`); the plumbing is UI-side only, the physics (and the run
 * hash) never see the kind set.
 */
describe('build- and tray-aware notes (playtests M + Q)', () => {
  const noseFirst = () => ({
    ...emptyEvidence(0),
    // a touchdown past the nose-first threshold is the whole trigger
    lastTouchdownPitch: NOSE_FIRST_PITCH - 0.05,
  });
  const fell = { status: 'fell', time: 0.71, piecesUsed: 2, hazardsTouched: 0 } as const;

  test('both kinds actionable keeps the shipped two-part advice', () => {
    const note = physicsNote(fell, noseFirst(), new Set(['ramp', 'gapLip', 'drop', 'landing']));
    expect(note).toBe('fell off nose-first — flatten the landing or lower the lip');
  });

  test('a lip placed with NO landing anywhere reachable names only the lip', () => {
    // playtest Q's K2 wall: the tray is straight×2 + gapLip + drop — the
    // old note said "flatten the landing" with no landing in reach
    const note = physicsNote(fell, noseFirst(), new Set(['ramp', 'straight', 'gapLip', 'drop']));
    expect(note.toLowerCase()).not.toContain('landing');
    expect(note).toBe('fell off nose-first — lower the lip');
  });

  test('a landing reachable but no lip keeps the landing half only (playtest M inversion)', () => {
    const note = physicsNote(fell, noseFirst(), new Set(['ramp', 'straight', 'drop', 'landing']));
    expect(note.toLowerCase()).not.toContain('lip');
    expect(note).toBe('fell off nose-first — flatten the landing');
  });

  test('NEITHER advice kind actionable: the honest head stands alone', () => {
    const note = physicsNote(fell, noseFirst(), new Set(['ramp', 'straight', 'drop']));
    expect(note).toBe('fell off nose-first');
    expect(note.toLowerCase()).not.toContain('landing');
    expect(note.toLowerCase()).not.toContain('lip');
  });

  test('the stalled-flat line names the booster only when it is actionable', () => {
    const stalled = { status: 'stalled', time: 4.0, piecesUsed: 2, hazardsTouched: 0 } as const;
    const flat = { ...emptyEvidence(0), lastGroundedPitch: 0, lastPushTime: null };
    expect(physicsNote(stalled, flat, new Set(['ramp', 'straight', 'booster']))).toBe(
      'stalled on the flat — friction won; start higher or add a booster',
    );
    const noBooster = physicsNote(stalled, flat, new Set(['ramp', 'straight', 'drop']));
    expect(noBooster.toLowerCase()).not.toContain('booster');
    expect(noBooster).toBe('stalled on the flat — friction won; start higher');
  });

  test('K2-style tray sweep: no failure line ever names an unavailable kind', async () => {
    // the regression playtest Q demanded: for the KITCHEN 02 tray (2
    // straights, 1 gapLip, 1 drop — no landing, no booster) and a fixture
    // build (ramp + cup), NO printable failure note may NAME a piece the
    // player cannot act on. (Descriptive lines like "top of the loop"
    // report what the run hit, not a piece to buy — the rule is about
    // ADVICE tails.)
    const { KITCHEN02 } = await import('../../src/world/levels/kitchen02.level.ts');
    const { initialBuild, actionableKindsFor } = await import('../../src/boot.ts');
    const tray = { straight: 2, gapLip: 1, drop: 1 };
    const kinds = actionableKindsFor(initialBuild(KITCHEN02), tray);
    expect(kinds.has('landing')).toBe(false);
    expect(kinds.has('booster')).toBe(false);
    expect(kinds.has('gapLip')).toBe(true);
    for (const status of ['fell', 'stalled', 'timeout'] as const) {
      for (const [name, evidence] of Object.entries({
        plain: emptyEvidence(0),
        nose: noseFirst(),
        slowApex: { ...emptyEvidence(0), apexY: 0.5, apexSpeed: 0.1 },
        uphill: { ...emptyEvidence(0), lastGroundedPitch: 0.4 },
        pushed: { ...emptyEvidence(0), lastPushTime: 1.2 },
      })) {
        const note = physicsNote({ status, time: 1, piecesUsed: 2, hazardsTouched: 0 }, evidence, kinds);
        // landing and booster are neither placed nor in the tray
        expect(note.toLowerCase(), `${status}/${name}`).not.toContain('landing');
        expect(note.toLowerCase(), `${status}/${name}`).not.toContain('booster');
        // the lip is actionable on this tray — the line MAY name it
      }
    }
    // and the same sweep with the lip NOT actionable names no piece at all
    const noLip = new Set(kinds);
    noLip.delete('gapLip');
    const note = physicsNote(fell, noseFirst(), noLip);
    expect(note.toLowerCase()).not.toContain('lip');
    expect(note.toLowerCase()).not.toContain('landing');
  });

  test('unknown kinds (null) keep the shipped lines unchanged', () => {
    expect(physicsNote(fell, noseFirst())).toBe('fell off nose-first — flatten the landing or lower the lip');
  });

  test('resultModel plumbs the kinds through to the note', () => {
    const m = resultModel({ status: 'fell', time: 0.71, piecesUsed: 2, hazardsTouched: 0 }, par, noseFirst(), 0, new Set(['ramp', 'straight', 'gapLip', 'drop']));
    expect(m.note.toLowerCase()).not.toContain('landing');
  });
});
