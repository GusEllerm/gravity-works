/**
 * The result layer under Vitest (node): the pure half — the par-carrying
 * model and the panel's three explanatory lines. The DOM panel and its
 * scroll-into-view visibility are e2e-guarded (`tests/e2e/loop.spec.ts`).
 */
import { describe, expect, test } from 'vitest';
import * as THREE from 'three';
import { emptyEvidence, physicsNote, NOSE_FIRST_PITCH } from '../../src/ui/result.ts';
import { outcomeLines, resultModel } from '../../src/ui/result.ts';
import { fitSocket } from '../../src/track/snap.ts';
import { transformSocket } from '../../src/track/socket.ts';
import type { Socket } from '../../src/track/socket.ts';
import { PIECES, type PieceKind } from '../../src/track/pieces.ts';
import type { Build, PlacedPiece } from '../../src/track/build.ts';
import { moveHintFor } from '../../src/ui/advice.ts';

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
    const { initialBuild } = await import('../../src/boot.ts');
    const { actionableKindsFor, placedKindsFor } = await import('../../src/ui/advice.ts');
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
    const { goalNounFor } = await import('../../src/ui/advice.ts');
    const { KITCHEN01 } = await import('../../src/world/levels/kitchen01.level.ts');
    const { KITCHEN02 } = await import('../../src/world/levels/kitchen02.level.ts');
    // every shipped rung fixtures a finishCup — the registry's only
    // captureVolume kind — so the noun is its player word, lowercased
    expect(goalNounFor(KITCHEN01)).toBe('cup');
    expect(goalNounFor(KITCHEN02)).toBe('cup');
  });

  test('goalNounFor reports null for a level with no fixture table', async () => {
    const { goalNounFor } = await import('../../src/ui/advice.ts');
    const { FEELTRACK } = await import('../../src/world/levels/feeltrack.level.ts');
    expect(goalNounFor(FEELTRACK)).toBeNull();
  });

  test('every campaign rung resolves a noun its fixtures table actually carries', async () => {
    const { goalNounFor } = await import('../../src/ui/advice.ts');
    const { getLevel } = await import('../../src/world/levels/feeltrack.level.ts');
    const { CAMPAIGN_LADDER } = await import('../../src/world/campaign.ts');
    for (const id of CAMPAIGN_LADDER) {
      expect(goalNounFor(getLevel(id)), id).toBe('cup');
    }
  });
});

/**
 * THE DRIVE-OFF TAIL (stage-5 B2 pass 2, playtest AA: six different
 * bedroom02 builds, one undifferentiated "the line let go before the cup"
 * — "no advice text differentiated my six builds"). The plain fell branch
 * now names the kinds with TRAY STOCK LEFT (`stockedKindsFor`, plumbed by
 * boot like the other sets). The gate is the strictest reading of the
 * three-way rule: a kind with stock left is one press away, so the tail
 * is ALWAYS add-shaped, and a kind used up or absent can never appear.
 */
describe('drive-off tail names the tray stock, per build (playtest AA, B2 pass 2)', () => {
  const fell = { status: 'fell', time: 1.8, piecesUsed: 3, hazardsTouched: 0 } as const;
  // no other witness fires — this is the plain drive-off evidence
  const flat = emptyEvidence(0);
  const HEAD = 'fell off — the line let go before the cup';

  test("AA's bedroom02 families print DIFFERENT lines (the differentiation the wall demanded)", () => {
    // deck-only (three flats): both crossing pieces still in the tray
    expect(physicsNote(fell, flat, null, null, null, new Set(['drop', 'landing']))).toBe(
      `${HEAD}; add a drop or a landing`,
    );
    // sink-at-start (landing + one straight placed): deck + step remain
    expect(physicsNote(fell, flat, null, null, null, new Set(['straight', 'drop']))).toBe(
      `${HEAD}; add a straight or a drop`,
    );
    // almost-right (pillow line minus one run-out deck): the deck is all
    // the tray holds — the lesson lands as exactly one honest ADD
    expect(physicsNote(fell, flat, null, null, null, new Set(['straight']))).toBe(`${HEAD}; add a straight`);
  });

  test('a spent tray gets NO tail (nothing honest to add)', () => {
    expect(physicsNote(fell, flat, null, null, null, new Set())).toBe(HEAD);
    // every tray piece placed (whole-tray deaths): the head stands alone
    expect(physicsNote(fell, flat, null, null, null, new Set<PieceKind>())).toBe(HEAD);
  });

  test('unknown stock (shared/replay pages) keeps the shipped head exactly', () => {
    expect(physicsNote(fell, flat)).toBe(HEAD);
  });

  test('gate sweep: the tail never names a kind without stock, always ADD-shaped', async () => {
    const { initialBuild } = await import('../../src/boot.ts');
    const { stockedKindsFor, actionableKindsFor } = await import('../../src/ui/advice.ts');
    const { KITCHEN02 } = await import('../../src/world/levels/kitchen02.level.ts');
    const tray = { straight: 2, gapLip: 1, drop: 1 };
    const base = initialBuild(KITCHEN02);
    const stocked = stockedKindsFor(base, tray);
    // the stock set is a subset of the actionable set by construction
    expect([...stocked].every((k) => actionableKindsFor(base, tray).has(k))).toBe(true);
    expect(stocked.has('landing')).toBe(false); // not in this tray at all
    const note = physicsNote(fell, flat, actionableKindsFor(base, tray), new Set(['ramp']), null, stocked);
    expect(note.toLowerCase()).not.toContain('landing');
    expect(note.toLowerCase()).not.toContain('flatten');
    expect(note.toLowerCase()).not.toContain('lower');
    expect(note).toBe(`${HEAD}; add a straight, a drop or a lip`);
    // and placing the spares drains the list honestly, one kind at a time
    const placedOne = stockedKindsFor(
      { ...base, pieces: [...base.pieces, { def: 'drop', params: {}, transform: base.pieces[0]!.transform, seq: 9 }] },
      tray,
    );
    expect(placedOne.has('drop')).toBe(false);
    expect(placedOne.has('straight')).toBe(true);
  });

  test('stockedKindsFor counts STOCK, not placement: a placed kind with spares stays', async () => {
    const { stockedKindsFor } = await import('../../src/ui/advice.ts');
    const { BEDROOM02 } = await import('../../src/world/levels/bedroom02.level.ts');
    // B6's shape: pillow line minus the last deck — straight 2 of 3 placed
    const par = BEDROOM02.parBuild();
    const b6 = { ...par, pieces: par.pieces.filter((p) => !(p.def === 'straight' && p.seq === 4)) };
    const stocked = stockedKindsFor(b6, BEDROOM02.tray);
    expect(stocked.has('straight')).toBe(true); // the spare deck is the fix
    expect(stocked.has('landing')).toBe(false); // the pillow is used up
    expect(stocked.has('drop')).toBe(true); // the step never placed
  });
});

/**
 * HOW PHRASING (stage 5, playtest BB item 3: "flatten the landing" names a
 * change but never says HOW — Rotate only flips"). The nose-first landing
 * tail carries the RECIPE (`re-place it flat (no R)`) exactly when the
 * landing in the build was PLACED-AND-ROTATED — the builder's amber
 * reversed fit read back off the build data by `flippedKindsFor(level,
 * build)` in `src/boot.ts`: the in-socket sits JOINED at a chain anchor
 * (`SNAP_TRANSLATION_TOL`) with its travel direction not parallel
 * (`SNAP_ANGLE_TOL`), which is precisely what the half turn about the
 * anchor's up leaves behind. Placed-and-straight keeps the plain verb;
 * unknown (shared/replay pages) keeps it too.
 */
describe('the nose-first tail says HOW when the landing was rotated (playtest BB item 3)', () => {
  const noseFirst = () => ({
    ...emptyEvidence(0),
    lastTouchdownPitch: NOSE_FIRST_PITCH - 0.05,
  });
  const fell = { status: 'fell', time: 1.9, piecesUsed: 3, hazardsTouched: 0 } as const;

  /** The builder's own `placement`: seat the kind's in-socket on target,
   *  optionally flipped — the half turn about the target's up through its
   *  position (exactly `builder.ts`'s flip matrix). */
  function mount(target: Socket, def: PieceKind, flip = false): THREE.Matrix4 {
    const [inSocket] = PIECES[def].sockets(PIECES[def].params);
    const seat = fitSocket(target, inSocket);
    if (!flip) return seat;
    const up = target.up.clone().normalize();
    return new THREE.Matrix4()
      .makeTranslation(target.pos.x, target.pos.y, target.pos.z)
      .multiply(new THREE.Matrix4().makeRotationAxis(up, Math.PI))
      .multiply(new THREE.Matrix4().makeTranslation(-target.pos.x, -target.pos.y, -target.pos.z))
      .multiply(seat);
  }

  /** A kitchen02-shaped line: ramp fixture → straight → landing (optionally
   *  rotated), the chain `flippedKindsFor` must read. */
  async function line(landingFlipped: boolean): Promise<{ level: import('../../src/world/level.ts').Level; build: Build }> {
    const { KITCHEN02 } = await import('../../src/world/levels/kitchen02.level.ts');
    const { initialBuild } = await import('../../src/boot.ts');
    const base = initialBuild(KITCHEN02);
    const ramp = base.pieces.find((p) => p.def === 'ramp') ?? base.pieces[0]!;
    const rampExit = transformSocket(PIECES[ramp.def].sockets(ramp.params)[1], ramp.transform);
    const straight: PlacedPiece = { def: 'straight', params: PIECES.straight.params, transform: mount(rampExit, 'straight'), seq: base.pieces.length };
    const straightExit = transformSocket(PIECES.straight.sockets(straight.params)[1], straight.transform);
    const landing: PlacedPiece = { def: 'landing', params: PIECES.landing.params, transform: mount(straightExit, 'landing', landingFlipped), seq: base.pieces.length + 1 };
    return { level: KITCHEN02, build: { ...base, pieces: [...base.pieces, straight, landing] } };
  }

  test('flippedKindsFor flags the rotated landing and NOT the straight chain', async () => {
    const { flippedKindsFor } = await import('../../src/ui/advice.ts');
    const { level, build } = await line(true);
    const flipped = flippedKindsFor(level, build);
    expect(flipped.has('landing')).toBe(true);
    expect(flipped.has('straight')).toBe(false);
    expect(flipped.has('ramp')).toBe(false);
  });

  test('a forward-mounted landing is never flagged (no phantom HOW)', async () => {
    const { flippedKindsFor } = await import('../../src/ui/advice.ts');
    const { level, build } = await line(false);
    expect(flippedKindsFor(level, build).has('landing')).toBe(false);
  });

  test('placed-and-rotated: the tail names the HOW', () => {
    const placed = new Set<PieceKind>(['ramp', 'straight', 'landing']);
    const flipped = new Set<PieceKind>(['landing']);
    expect(physicsNote(fell, noseFirst(), placed, placed, null, null, flipped)).toBe(
      'fell off nose-first — re-place it flat (no R)',
    );
    // the lip half is untouched by the HOW gate: placed lip keeps "lower"
    const both = new Set<PieceKind>(['ramp', 'landing', 'gapLip']);
    expect(physicsNote(fell, noseFirst(), both, both, null, null, flipped)).toBe(
      'fell off nose-first — re-place it flat (no R) or lower the lip',
    );
  });

  test('placed-and-straight keeps the plain shipped verb; unknown stays permissive', () => {
    const placed = new Set<PieceKind>(['ramp', 'landing']);
    expect(physicsNote(fell, noseFirst(), placed, placed, null, null, new Set())).toBe(
      'fell off nose-first — flatten the landing',
    );
    // null (no builder context — shared/replay pages) keeps the shipped wording
    expect(physicsNote(fell, noseFirst(), placed, placed, null, null, null)).toBe(
      'fell off nose-first — flatten the landing',
    );
  });

  test('PLACED still outranks FLIPPED: a tray-only landing stays ADD-shaped', () => {
    // flippedKinds can only contain placed kinds by construction, but the
    // verb ladder must still never critique an unplaced piece if a caller
    // hands it a stray set
    expect(
      physicsNote(
        fell,
        noseFirst(),
        new Set<PieceKind>(['ramp', 'landing']),
        new Set<PieceKind>(['ramp']),
        null,
        null,
        new Set<PieceKind>(['landing']),
      ),
    ).toBe('fell off nose-first — add a flat landing');
  });
});

/**
 * THE WHERE TAIL (stage 6, kitchen03's second wall — playtests BB and DD: six
 * launches each, the same rung, and every advice line named a KIND with no
 * PLACE: "the line let go before the cup; add a straight or a lip"). The
 * builder's socket graph knows the end the next piece extends the line from
 * (`builder.aimHint()`, the far open exit of the start-connected chain), so an
 * ADD tail now names it — and the walk phrase rides only when the visible ring
 * marks a different end. Two laws this pins: a CRITIQUE line never grows one
 * (it is advice about a piece already on the track), and an unknown hint (a
 * shared or replay page, no builder) leaves every shipped line byte-identical.
 */
describe('the WHERE tail names the end an ADD asks for (stage 6, playtest DD)', () => {
  const fell = { status: 'fell', time: 1.4, piecesUsed: 1, hazardsTouched: 0 } as const;
  const nose = { ...emptyEvidence(0), lastTouchdownPitch: NOSE_FIRST_PITCH - 0.05 };
  const rampEnd = { label: 'end of the pre-built ramp', ringHere: false };
  const stockAll = new Set<PieceKind>(['straight', 'drop', 'gapLip', 'landing']);

  test('the drive-off tail names the end, and the key, when the ring is elsewhere', () => {
    expect(physicsNote(fell, emptyEvidence(0), null, null, null, stockAll, null, rampEnd)).toBe(
      'fell off — the line let go before the cup; add a straight, a drop, a lip or a landing' +
        ' · place at: end of the pre-built ramp · press ] to walk the open ends',
    );
  });

  test('with the ring ALREADY on that end, no key is taught', () => {
    const note = physicsNote(
      fell,
      emptyEvidence(0),
      null,
      null,
      null,
      new Set<PieceKind>(['straight']),
      null,
      { label: 'end of the pre-built ramp', ringHere: true },
    );
    expect(note).toBe('fell off — the line let go before the cup; add a straight · place at: end of the pre-built ramp');
    expect(note).not.toContain(']');
  });

  test('the nose-first ADD line names the end too (BB\u2019s kitchen03 notes are this line)', () => {
    expect(
      physicsNote(
        fell,
        nose,
        new Set<PieceKind>(['ramp', 'landing', 'gapLip']),
        new Set<PieceKind>(['ramp']),
        null,
        null,
        null,
        rampEnd,
      ),
    ).toBe(
      'fell off nose-first — add a flat landing or add a lip · place at: end of the pre-built ramp · press ] to walk the open ends',
    );
  });

  test('a CRITIQUE line never grows a WHERE tail', () => {
    // both halves name pieces already in the build ("flatten", "lower") — the
    // advice is about changing a piece, not placing one, so a place sentence
    // would contradict it
    const critique = physicsNote(
      fell,
      nose,
      new Set<PieceKind>(['landing', 'gapLip']),
      new Set<PieceKind>(['landing', 'gapLip']),
      null,
      null,
      null,
      rampEnd,
    );
    expect(critique).toBe('fell off nose-first — flatten the landing or lower the lip');
    expect(critique).not.toContain('place at');
    // and the spent-tray drive-off head (nothing honest to ADD) stays bare
    expect(
      physicsNote(fell, emptyEvidence(0), null, null, null, new Set<PieceKind>(), null, rampEnd),
    ).toBe('fell off — the line let go before the cup');
  });

  test('unknown aim (no builder: a shared or replay page) keeps every shipped line', () => {
    expect(physicsNote(fell, emptyEvidence(0), null, null, null, stockAll)).toBe(
      'fell off — the line let go before the cup; add a straight, a drop, a lip or a landing',
    );
    expect(
      physicsNote(fell, nose, new Set<PieceKind>(['ramp', 'landing', 'gapLip']), new Set<PieceKind>(['ramp'])),
    ).toBe('fell off nose-first — add a flat landing or add a lip');
  });
});

// ---- THE MOVE CLAUSE (program T2.1) ------------------------------------------------
//
// When the tray is spent and the failure is where a piece SITS, the drive-off head
// says MOVE, not ADD — and it names the piece and the socket from the build graph
// (`moveHintFor`, `src/ui/advice.ts`). Derivation is asserted at the data source and
// the line at the phrasing layer; the shipped lines above this block are the
// byte-identical `moveHint === null` gate — every one of them runs unchanged.
describe('physicsNote MOVE clause (program T2.1)', () => {
  const fellDrive = { status: 'fell', time: 2.74, piecesUsed: 4, hazardsTouched: 0 } as any;
  const rampEnd = { label: 'end of the pre-built ramp', ringHere: true };
  const spent = new Set<PieceKind>(); // tray has nothing left to ADD

  test('the orphan clause names the piece and the goal, riding the WHERE tail', () => {
    const note = physicsNote(
      fellDrive,
      ev,
      null,
      null,
      null,
      spent,
      null,
      rampEnd,
      { move: 'orphan', clause: 'the drop sits past the cup — pull it back', teachWalk: true },
    );
    expect(note).toBe(
      'fell off — the line let go before the cup; the drop sits past the cup — pull it back · place at: end of the pre-built ramp',
    );
  });

  test('the booster clause carries the sequencing truth and teaches the walk', () => {
    const note = physicsNote(
      fellDrive,
      ev,
      new Set<PieceKind>(['booster']),
      null,
      null,
      spent,
      null,
      rampEnd,
      {
        move: 'booster',
        clause: 'remove back to the ramp and place the booster FIRST, before the first lip',
        teachWalk: true,
      },
    );
    expect(note).toBe(
      'fell off — the line let go before the cup; the booster needs spending EARLY — remove back to the ramp and place the booster FIRST, before the first lip · press ] to walk the open ends',
    );
  });

  test('a booster the player CANNOT act on is never named (playtest Q law)', () => {
    // actionableKinds without booster — the clause is silent, the shipped bare
    // head stands exactly as before this clause existed
    const note = physicsNote(
      fellDrive,
      ev,
      new Set<PieceKind>(['gapLip', 'drop']),
      null,
      null,
      spent,
      null,
      rampEnd,
      { move: 'booster', clause: 'place the booster FIRST, straight off the start', teachWalk: true },
    );
    expect(note).toBe('fell off — the line let go before the cup');
  });

  test('the orphan reading outranks the ADD list (the misplaced piece IS the truth)', () => {
    // stock left AND a piece past the goal: naming the kinds while the
    // placed piece sits past the cup is the lie-by-silence this clause
    // fixes — the pull-back sentence wins
    const note = physicsNote(
      fellDrive,
      ev,
      null,
      null,
      null,
      new Set<PieceKind>(['straight']),
      null,
      rampEnd,
      { move: 'orphan', clause: 'the drop sits past the cup — pull it back', teachWalk: true },
    );
    expect(note).toBe(
      'fell off — the line let go before the cup; the drop sits past the cup — pull it back · place at: end of the pre-built ramp',
    );
  });

  test('the booster reading never overrides an actionable ADD line', () => {
    const note = physicsNote(
      fellDrive,
      ev,
      new Set<PieceKind>(['booster']),
      null,
      null,
      new Set<PieceKind>(['straight']),
      null,
      rampEnd,
      { move: 'booster', clause: 'place the booster FIRST, straight off the start', teachWalk: true },
    );
    expect(note).toBe('fell off — the line let go before the cup; add a straight · place at: end of the pre-built ramp');
  });

  test('no hint (a shared or replay page, a sandbox) keeps the bare head byte-identical', () => {
    expect(physicsNote(fellDrive, ev, null, null, null, spent, null, rampEnd, null)).toBe(
      'fell off — the line let go before the cup',
    );
  });

  // ---- derivation: the two readings off the real kitchen data -----------------

  /** Seat one extra piece of `def` on the cup's own exit socket of a chain build. */
  function seatOnCupExit(build: Build, def: PieceKind, params: any): Build {
    const cup = build.pieces.filter((p) => p.def === 'finishCup').at(-1)!;
    const cupExit = transformSocket(PIECES.finishCup.sockets(cup.params)[1], cup.transform);
    const transform = fitSocket(cupExit, PIECES[def].sockets(params)[0]);
    return { ...build, pieces: [...build.pieces, { def, params, transform, seq: build.pieces.length }] };
  }

  test('kitchen04: a piece stranded past the cup reads as the orphan clause; the par build reads as nothing', async () => {
    const { KITCHEN04 } = await import('../../src/world/levels/kitchen04.level.ts');
    const { levelTrayParams } = await import('../../src/ui/advice.ts');
    const par = KITCHEN04.parBuild();
    expect(moveHintFor(KITCHEN04, par, KITCHEN04.tray)).toBeNull();
    const stranded = seatOnCupExit(par, 'drop', levelTrayParams(KITCHEN04, KITCHEN04.tray)!.drop!);
    expect(moveHintFor(KITCHEN04, stranded, KITCHEN04.tray)).toEqual({
      move: 'orphan',
      clause: 'the drop sits past the cup — pull it back',
      teachWalk: true,
    });
  });

  test('kitchen02: the AUTHORED run-out curve past the cup is never called an orphan', async () => {
    const { KITCHEN02 } = await import('../../src/world/levels/kitchen02.level.ts');
    expect(moveHintFor(KITCHEN02, KITCHEN02.parBuild(), KITCHEN02.tray)).toBeNull();
  });

  test('kitchen05: the booster reads EARLY (par), LATE (wrong A), and LAST (spent tray) alike', async () => {
    const k05 = await import('../../src/world/levels/kitchen05.level.ts');
    const { KITCHEN05 } = k05;
    // spent EARLY — the answer itself — nothing to say
    expect(moveHintFor(KITCHEN05, KITCHEN05.parBuild(), KITCHEN05.tray)).toBeNull();
    const late = {
      move: 'booster',
      clause: 'remove back to the ramp and place the booster FIRST, before the first lip',
      teachWalk: true,
    };
    // five of six placed, booster stock left in the tray, seated after the lips
    expect(moveHintFor(KITCHEN05, k05.kitchen05NoBoosterBuild(), KITCHEN05.tray)).toEqual(late);
    // the whole tray in the wrong order — spent tray, sequencing is the answer
    expect(moveHintFor(KITCHEN05, k05.kitchen05LastBoosterBuild(), KITCHEN05.tray)).toEqual(late);
  });

  test('a level with no booster anywhere reads as nothing (the clause never invents the piece)', async () => {
    const { KITCHEN01 } = await import('../../src/world/levels/kitchen01.level.ts');
    expect(moveHintFor(KITCHEN01, KITCHEN01.parBuild(), KITCHEN01.tray)).toBeNull();
  });
});
