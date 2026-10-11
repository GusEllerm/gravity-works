/**
 * THE ACTIONABLE-VERB LAW (round-3 verdict item 2 — "'flatten' still has
 * no verb": k04 at 2.66 s and bedroom02 at 2.33 s printed fix sentences the
 * builder cannot execute; four evaluations, the same two rungs). The nose-
 * first branch of `physicsNote` now ranks its advice by whether a KEYSTROKE
 * executes it — rotated-landing RECIPE > ADD half > ORPHAN clause (`pull it
 * back` = Remove) > ADD naming UNUSED stock (`add a straight · place at:` =
 * tray button + Place) > verbless critique as shipped — and a `null`
 * builder context keeps every shipped line byte-identical.
 *
 * The measurements behind the ranking live in `scripts/k04-flatten-sweep.mjs`
 * (asserted below by replay): the k04 dump death is the 3-seat chain
 * `drop → gapLip → landing`, it falls at 2.658 s, NO flattening or flip of
 * any seated piece finishes it, and seating the ONE piece the tray still
 * holds finishes the rung at 2.592 s — so the verb the note must name is
 * `add`, not `flatten`. UI copy only: these tests touch no physics input
 * and no hash.
 */
import { describe, expect, test } from 'vitest';
import { fitSocket } from '../../src/track/snap.ts';
import { transformSocket } from '../../src/track/socket.ts';
import { PIECES, type PieceKind } from '../../src/track/pieces.ts';
import { serialize, type Build } from '../../src/track/build.ts';
import { replayRun } from '../../src/replay/replay.ts';
import { flipPlacement } from '../../src/ui/builder.ts';
import {
  actionableKindsFor,
  flippedKindsFor,
  goalNounFor,
  levelTrayParams,
  moveHintFor,
  placedKindsFor,
  placedWhereFor,
  stockedKindsFor,
} from '../../src/ui/advice.ts';
import { emptyEvidence, NOSE_FIRST_PITCH, physicsNote } from '../../src/ui/result.ts';
import { KITCHEN04 } from '../../src/world/levels/kitchen04.level.ts';
import { BEDROOM02 } from '../../src/world/levels/bedroom02.level.ts';

/** The tray dump/mount the placement model makes: fixtures at their par
 *  transforms, then the asks chain-fitted at the head (critique-where's
 *  emulation; `flipAt` seats one ask REVERSED like the R flag does). */
function placed(level: { parBuild: () => Build; fixtures?: Partial<Record<PieceKind, number>>; tray?: Partial<Record<PieceKind, number>>; id: string; seed: number }, kinds: readonly PieceKind[], flipAt = -1): Build {
  const par = level.parBuild();
  const fixtures = new Set(Object.keys(level.fixtures ?? {}));
  const pieces = par.pieces.filter((p) => fixtures.has(p.def)).map((p, i) => ({ ...p, seq: i }));
  const params = (level.tray ? levelTrayParams(level as never, level.tray) : undefined) ?? {};
  const ramp = pieces.find((p) => p.def === 'ramp')!;
  let cursor = transformSocket(PIECES.ramp.sockets(ramp.params)[1], ramp.transform);
  for (const [j, def] of kinds.entries()) {
    const p = { ...params[def] };
    const t =
      j === flipAt
        ? flipPlacement(cursor, def, p, true)
        : fitSocket(cursor, PIECES[def].sockets(p)[0]);
    pieces.push({ def, params: p, transform: t, seq: pieces.length });
    cursor = transformSocket(PIECES[def].sockets(p)[1], t);
  }
  return { levelId: level.id, pieces: pieces as Build['pieces'], seed: level.seed };
}

const noseFirst = () => ({ ...emptyEvidence(0), lastTouchdownPitch: NOSE_FIRST_PITCH - 0.05 });

/** The full builder-page argument stack for one build (the plumbing
 *  `src/boot.ts` does at the failure note, read off the same derivations). */
function noteFor(level: never, build: Build, time: number, aimHint: { label: string; ringHere: boolean } | null) {
  const tray = (level as unknown as { tray?: Partial<Record<PieceKind, number>> }).tray;
  const result = { status: 'fell', time, piecesUsed: 3, hazardsTouched: 0 } as const;
  return physicsNote(
    result,
    noseFirst(),
    actionableKindsFor(build, tray),
    placedKindsFor(build),
    goalNounFor(level as never),
    stockedKindsFor(build, tray),
    flippedKindsFor(level as never, build),
    aimHint,
    moveHintFor(level as never, build, tray),
    placedWhereFor(level as never, build),
  );
}

describe('the k04 death, measured (round-3 item 2, the recon sweep)', () => {
  const death = placed(KITCHEN04, ['drop', 'gapLip', 'landing']);

  test('the 3-seat dump death falls at the verdict clock (2.66 s)', async () => {
    const run = await replayRun(KITCHEN04, death);
    expect(run.status).toBe('fell');
    expect(run.time).toBeCloseTo(2.658, 2);
  });

  test('seating the tray’s straight at the chain head HEALS it — the rung clears', async () => {
    const healed = placed(KITCHEN04, ['drop', 'gapLip', 'landing', 'straight']);
    const run = await replayRun(KITCHEN04, healed);
    expect(run.status).toBe('finished');
    expect(run.time).toBeLessThanOrEqual(2.7); // par 2.52 — clears with stars
    expect(healed.pieces.filter((p) => !['ramp', 'finishCup'].includes(p.def))).toHaveLength(4);
  });

  test('NO flattening and NO flip of a seated piece heals it (why the verb is `add`)', async () => {
    const variants: [number, Record<string, number>][] = [
      [0, { angle: 30 }], [0, { angle: 60 }], [0, { height: 0.08 }], [0, { height: 0.16 }],
      [1, { angle: 0 }], [1, { angle: 20 }],
      [2, { angle: 0 }], [2, { angle: 6 }], [2, { angle: 20 }], [2, { level: 0.2 }], [2, { level: 0.32 }],
    ];
    for (const [i, patch] of variants) {
      const pieces = placed(KITCHEN04, ['drop', 'gapLip', 'landing']).pieces.map((p) => ({ ...p }));
      const target = pieces.filter((p) => p.def !== 'ramp' && p.def !== 'finishCup')[i]!;
      Object.assign(target.params, patch);
      // re-fit downstream the same one chain step (params changed)
      let cursor = transformSocket(PIECES.ramp.sockets(pieces[0]!.params)[1], pieces[0]!.transform);
      for (const p of pieces) {
        if (p.def === 'finishCup') break;
        if (p === pieces[0]) { cursor = transformSocket(PIECES[p.def].sockets(p.params)[1], p.transform); continue; }
        p.transform = fitSocket(cursor, PIECES[p.def].sockets(p.params)[0]);
        cursor = transformSocket(PIECES[p.def].sockets(p.params)[1], p.transform);
      }
      const run = await replayRun(KITCHEN04, { ...death, pieces });
      expect(run.status, JSON.stringify([i, patch])).not.toBe('finished');
    }
    for (const flipAt of [0, 1, 2]) {
      const flipped = placed(KITCHEN04, ['drop', 'gapLip', 'landing'], flipAt);
      const run = await replayRun(KITCHEN04, flipped);
      expect(run.status, `flip ${flipAt}`).not.toBe('finished');
    }
  });
});

describe('the note names the verb that heals (k04, live derivations)', () => {
  const death = placed(KITCHEN04, ['drop', 'gapLip', 'landing']);

  test('the tray still holds the healing piece → the ADD line, with the place', () => {
    const tray = KITCHEN04.tray;
    expect([...stockedKindsFor(death, tray)].sort()).toEqual(['straight']);
    const note = noteFor(KITCHEN04 as never, death, 2.658, { label: 'end of landing', ringHere: true });
    expect(note).toBe('fell off nose-first — add a straight · place at: end of landing');
  });

  test('the critique sentence the sweep condemned no longer prints on this build', () => {
    const note = noteFor(KITCHEN04 as never, death, 2.658, { label: 'end of landing', ringHere: true });
    expect(note.toLowerCase()).not.toMatch(/flatten|lower/);
  });

  test('a shared/replay page (null builder data) keeps the shipped line byte-identical', () => {
    const result = { status: 'fell', time: 2.658, piecesUsed: 3, hazardsTouched: 0 } as const;
    expect(physicsNote(result, noseFirst())).toBe('fell off nose-first — flatten the landing or lower the lip');
  });

  test('stock that is all PLACED (no unused piece) keeps the critique exactly', () => {
    const result = { status: 'fell', time: 2.658, piecesUsed: 3, hazardsTouched: 0 } as const;
    const placedSet = new Set<PieceKind>(death.pieces.map((p) => p.def));
    const note = physicsNote(
      result,
      noseFirst(),
      placedSet,
      placedSet,
      'cup',
      new Set(placedSet), // "stocked" == placed == nothing UNUSED
      new Set(),
      { label: 'end of landing', ringHere: true },
      null,
      placedWhereFor(KITCHEN04, death),
    );
    expect(note).toBe('fell off nose-first — flatten the landing by the lip or lower the lip by the drop');
  });

  test('a rotated landing keeps its recipe over the unused stock (rank 1 wins)', () => {
    const result = { status: 'fell', time: 2.658, piecesUsed: 3, hazardsTouched: 0 } as const;
    const tray = KITCHEN04.tray;
    const note = physicsNote(
      result,
      noseFirst(),
      actionableKindsFor(death, tray),
      placedKindsFor(death),
      'cup',
      stockedKindsFor(death, tray),
      new Set<PieceKind>(['landing']), // flipped
      { label: 'end of landing', ringHere: true },
      null,
      null,
    );
    expect(note).toBe('fell off nose-first — re-place it flat (no R) or lower the lip');
  });

  test('serialize pin: the death build is the recon sweep’s build (hash input unchanged)', () => {
    expect(serialize(death).length).toBeGreaterThan(10);
  });
});

describe('bedroom02: the dump’s orphan gets the Remove verb (rank 3)', () => {
  test('a landing seated past the cup makes the MOVE clause outrank the critique', () => {
    const par = BEDROOM02.parBuild();
    const fixtures = par.pieces.filter((p) => BEDROOM02.fixtures![p.def] !== undefined).map((p, i) => ({ ...p, seq: i }));
    const cup = fixtures.find((p) => p.def === 'finishCup')!;
    const cupExit = transformSocket(PIECES.finishCup.sockets(cup.params)[1], cup.transform);
    const landingParams = { ...(levelTrayParams(BEDROOM02, BEDROOM02.tray)!.landing ?? {}) };
    const landing = {
      def: 'landing' as const,
      params: landingParams,
      transform: fitSocket(cupExit, PIECES.landing.sockets(landingParams)[0]),
      seq: fixtures.length,
    };
    const build: Build = { levelId: BEDROOM02.id, pieces: [...fixtures, landing], seed: BEDROOM02.seed };
    const hint = moveHintFor(BEDROOM02, build, BEDROOM02.tray);
    expect(hint?.move).toBe('orphan');
    const result = { status: 'fell', time: 2.33, piecesUsed: 5, hazardsTouched: 0 } as const;
    const note = physicsNote(
      result,
      noseFirst(),
      new Set<PieceKind>(['landing', 'straight', 'drop']),
      new Set<PieceKind>(['landing', 'straight', 'drop']),
      'mug',
      new Set(), // the dump spent the tray
      new Set(),
      { label: 'end of drop', ringHere: false },
      hint,
      placedWhereFor(BEDROOM02, build),
    );
    expect(note).toContain('the landing sits past the cup — pull it back');
    expect(note.toLowerCase()).not.toMatch(/flatten|lower/);
  });
});
