/**
 * The result layer under Vitest (node): the pure half — the par-carrying
 * model and the panel's three explanatory lines. The DOM panel and its
 * scroll-into-view visibility are e2e-guarded (`tests/e2e/loop.spec.ts`).
 */
import { describe, expect, test } from 'vitest';
import { emptyEvidence, physicsNote, NOSE_FIRST_PITCH } from '../../src/ui/result.ts';
import { outcomeLines, resultModel } from '../../src/ui/result.ts';
import type { PieceKind } from '../../src/track/pieces.ts';

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

  // SIBLING-PHRASE SWEEP (round 5): the booster tail was already add-shaped,
  // so it is honest in BOTH reachable cases — a tray-only booster (place
  // one) and a booster already in the build (add another). No reword needed.
  test('the booster tail keeps add-phrasing placed or tray-only (sibling sweep)', () => {
    const stalled = { status: 'stalled', time: 4.0, piecesUsed: 2, hazardsTouched: 0 } as const;
    const flat = { ...emptyEvidence(0), lastGroundedPitch: 0, lastPushTime: null };
    const actionable = new Set<PieceKind>(['ramp', 'straight', 'booster']);
    // tray-only booster (not in the build that ran)
    expect(physicsNote(stalled, flat, actionable, new Set(['ramp', 'straight']))).toBe(
      'stalled on the flat — friction won; start higher or add a booster',
    );
    // booster already placed — the same invitation to add one more
    expect(physicsNote(stalled, flat, actionable, new Set(['ramp', 'booster']))).toBe(
      'stalled on the flat — friction won; start higher or add a booster',
    );
  });

  test('K2-style tray sweep: no failure line ever names an unavailable kind', async () => {
    // the regression playtest Q demanded: for the KITCHEN 02 tray (2
    // straights, 1 gapLip, 1 drop — no landing, no booster) and a fixture
    // build (ramp + cup), NO printable failure note may NAME a piece the
    // player cannot act on. (Descriptive lines like "top of the loop"
    // report what the run hit, not a piece to buy — the rule is about
    // ADVICE tails.)
    const { KITCHEN02 } = await import('../../src/world/levels/kitchen02.level.ts');
    const { initialBuild, actionableKindsFor, placedKindsFor } = await import('../../src/boot.ts');
    const tray = { straight: 2, gapLip: 1, drop: 1 };
    const kinds = actionableKindsFor(initialBuild(KITCHEN02), tray);
    const placed = placedKindsFor(initialBuild(KITCHEN02));
    expect(kinds.has('landing')).toBe(false);
    expect(kinds.has('booster')).toBe(false);
    expect(kinds.has('gapLip')).toBe(true);
    // the fixture build places no advice kind at all — every actionable
    // kind here is TRAY-ONLY, so no line may wear critique verbs (W)
    for (const status of ['fell', 'stalled', 'timeout'] as const) {
      for (const [name, evidence] of Object.entries({
        plain: emptyEvidence(0),
        nose: noseFirst(),
        slowApex: { ...emptyEvidence(0), apexY: 0.5, apexSpeed: 0.1 },
        uphill: { ...emptyEvidence(0), lastGroundedPitch: 0.4 },
        pushed: { ...emptyEvidence(0), lastPushTime: 1.2 },
      })) {
        const note = physicsNote(
          { status, time: 1, piecesUsed: 2, hazardsTouched: 0 },
          evidence,
          kinds,
          placed,
        );
        // landing and booster are neither placed nor in the tray
        expect(note.toLowerCase(), `${status}/${name}`).not.toContain('landing');
        expect(note.toLowerCase(), `${status}/${name}`).not.toContain('booster');
        // the lip is actionable on this tray — the line MAY name it, but
        // ONLY in add-phrasing: the fixture build placed no gapLip
        expect(note, `${status}/${name}`).not.toContain('lower the lip');
        expect(note, `${status}/${name}`).not.toContain('flatten');
      }
    }
    // the W regression exactly: K2's fixture build + tray-1 gapLip, a
    // nose-first fall, must read as an invitation to ADD, not a critique
    expect(physicsNote(fell, noseFirst(), kinds, placed)).toBe('fell off nose-first — add a lip');
    // and the same sweep with the lip NOT actionable names no piece at all
    const noLip = new Set(kinds);
    noLip.delete('gapLip');
    const note = physicsNote(fell, noseFirst(), noLip, placed);
    expect(note.toLowerCase()).not.toContain('lip');
    expect(note.toLowerCase()).not.toContain('landing');
  });

  test('unknown kinds (null) keep the shipped lines unchanged', () => {
    expect(physicsNote(fell, noseFirst())).toBe('fell off nose-first — flatten the landing or lower the lip');
    // actionable set known but placement unknown = permissive critique too
    expect(
      physicsNote(fell, noseFirst(), new Set(['landing', 'gapLip'])),
    ).toBe('fell off nose-first — flatten the landing or lower the lip');
  });

  test('resultModel plumbs the kinds through to the note', () => {
    const m = resultModel({ status: 'fell', time: 0.71, piecesUsed: 2, hazardsTouched: 0 }, par, noseFirst(), 0, new Set(['ramp', 'straight', 'gapLip', 'drop']));
    expect(m.note.toLowerCase()).not.toContain('landing');
  });
});

/**
 * THE THREE-WAY TRUTH (round 5, playtest W: a drop-only build that never
 * placed a Landing got "flatten the landing" — logically honest, the gate
 * had checked the tray, but PHRASED as build-critique and read as a lie).
 * Per advice half: PLACED in the build → critique verbs (current phrasing);
 * TRAY-ONLY (actionable but not in the build) → add- verbs; NEITHER → the
 * half is dropped (`physicsNote`'s `placedKinds` argument, plumbed by
 * `placedKindsFor` in `src/boot.ts`).
 */
describe('tail phrasing tracks placed vs tray-only (playtest W round5)', () => {
  const noseFirst = () => ({
    ...emptyEvidence(0),
    lastTouchdownPitch: NOSE_FIRST_PITCH - 0.05,
  });
  const fell = { status: 'fell', time: 2.14, piecesUsed: 1, hazardsTouched: 0 } as const;
  // W's Book Drop: tray carries landing + gapLip stock, the build placed
  // only a drop on the fixture ramp
  const trayOnly = new Set<PieceKind>(['ramp', 'drop', 'landing', 'gapLip']);
  const build = new Set<PieceKind>(['ramp', 'drop']);

  test('tray-only landing gets ADD phrasing, not the critique verb', () => {
    const note = physicsNote(fell, noseFirst(), new Set(['ramp', 'landing']), build);
    expect(note).toBe('fell off nose-first — add a flat landing');
    expect(note).not.toContain('flatten');
  });

  test('tray-only gapLip gets ADD phrasing', () => {
    const note = physicsNote(fell, noseFirst(), new Set(['ramp', 'gapLip']), build);
    expect(note).toBe('fell off nose-first — add a lip');
    expect(note).not.toContain('lower');
  });

  test("W's exact build: both kinds tray-only, the tail is two ADDs", () => {
    const note = physicsNote(fell, noseFirst(), trayOnly, build);
    expect(note).toBe('fell off nose-first — add a flat landing or add a lip');
  });

  test('PLACED kinds keep the current critique phrasing', () => {
    const placed = new Set<PieceKind>(['ramp', 'landing', 'gapLip']);
    expect(physicsNote(fell, noseFirst(), placed, placed)).toBe(
      'fell off nose-first — flatten the landing or lower the lip',
    );
  });

  test('mixed build: critique for the placed kind, ADD for the tray-only one', () => {
    const actionable = new Set<PieceKind>(['ramp', 'landing', 'gapLip']);
    // landing placed, lip tray-only
    expect(physicsNote(fell, noseFirst(), actionable, new Set(['ramp', 'landing']))).toBe(
      'fell off nose-first — flatten the landing or add a lip',
    );
    // lip placed, landing tray-only
    expect(physicsNote(fell, noseFirst(), actionable, new Set(['ramp', 'gapLip']))).toBe(
      'fell off nose-first — add a flat landing or lower the lip',
    );
  });

  test('not-actionable still drops the half entirely (no add- ghost either)', () => {
    const note = physicsNote(fell, noseFirst(), new Set(['ramp', 'straight']), new Set(['ramp', 'straight']));
    expect(note).toBe('fell off nose-first');
  });
});

/**
 * GOAL-NOUN HONESTY (stage 5, playtest AA: "'the line let go before the
 * cup' fired where no cup was visible — I never knew which object 'the cup'
 * was"). The fell-line's head noun names the level's ACTUAL goal fixture,
 * resolved by `goalNounFor` from the level's `fixtures` table — the same
 * table the builder's target sweep and the fixture signal read — and the
 * noun reaches `physicsNote` as a plain string (UI-side; the physics never
 * sees it). No level context keeps the shipped default.
 */
describe('goal-noun honesty in the fell line (playtest AA item 2)', () => {
  const fell = { status: 'fell', time: 3.2, piecesUsed: 6, hazardsTouched: 0 } as const;

  test('the shipped default stands when the caller has no level context', () => {
    expect(physicsNote(fell, emptyEvidence(0))).toMatch(/^fell off — the line let go before the cup$/);
  });

  test('a supplied goal noun replaces the word after "before the"', () => {
    const note = physicsNote(fell, emptyEvidence(0), null, null, 'bowl');
    expect(note).toBe('fell off — the line let go before the bowl');
  });

  test('goalNounFor names the capturing fixture of a rung\'s table', async () => {
    const { goalNounFor } = await import('../../src/boot.ts');
    const { KITCHEN01 } = await import('../../src/world/levels/kitchen01.level.ts');
    const { KITCHEN02 } = await import('../../src/world/levels/kitchen02.level.ts');
    // every shipped rung fixtures a finishCup — the registry's only
    // captureVolume kind — so the noun is its player word, lowercased
    expect(goalNounFor(KITCHEN01)).toBe('cup');
    expect(goalNounFor(KITCHEN02)).toBe('cup');
  });

  test('goalNounFor reports null for a level with no fixture table', async () => {
    const { goalNounFor } = await import('../../src/boot.ts');
    const { FEELTRACK } = await import('../../src/world/levels/feeltrack.level.ts');
    expect(goalNounFor(FEELTRACK)).toBeNull();
  });

  test('every campaign rung resolves a noun its fixtures table actually carries', async () => {
    const { goalNounFor } = await import('../../src/boot.ts');
    const { getLevel } = await import('../../src/world/levels/feeltrack.level.ts');
    const { CAMPAIGN_LADDER } = await import('../../src/world/campaign.ts');
    for (const id of CAMPAIGN_LADDER) {
      expect(goalNounFor(getLevel(id)), id).toBe('cup');
    }
  });
});
