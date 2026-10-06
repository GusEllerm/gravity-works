/**
 * The result layer under Vitest (node): the pure half — the par-carrying
 * model and the panel's three explanatory lines. The DOM panel and its
 * scroll-into-view visibility are e2e-guarded (`tests/e2e/loop.spec.ts`).
 */
import { describe, expect, test } from 'vitest';
import { emptyEvidence } from '../../src/ui/result.ts';
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
