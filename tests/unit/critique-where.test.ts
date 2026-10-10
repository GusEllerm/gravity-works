/**
 * THE CRITIQUE NAMES WHERE (P4 shortlist item 4 — the 2026-10-10 player
 * evaluation, bedroom02: "the dump FELL 2.33 s, note 'flatten the landing'
 * with NO socket tail and no verb to flatten with"). The gate: a nose-first
 * CRITIQUE half that names a kind the build PLACED also names the site that
 * piece sits at, in the words the Remove button and the MOVE clause already
 * speak — the same named-socket join graph read back off the build data by
 * `placedWhereFor`. UI copy only: these tests touch no physics input, and
 * the null-map path keeps every shipped sentence byte-identical (the same
 * permissive law the kind-sets follow).
 */
import { describe, expect, test } from 'vitest';
import { fitSocket } from '../../src/track/snap.ts';
import { transformSocket } from '../../src/track/socket.ts';
import { PIECES, type PieceKind } from '../../src/track/pieces.ts';
import type { Build } from '../../src/track/build.ts';
import { levelTrayParams, placedWhereFor } from '../../src/ui/advice.ts';
import { emptyEvidence, physicsNote, NOSE_FIRST_PITCH } from '../../src/ui/result.ts';
import { BEDROOM02 } from '../../src/world/levels/bedroom02.level.ts';

/** The tray dump, mounted the way placement mounts it: fixtures first, then
 *  each tray kind fitted onto the chain cursor — the same emulation the
 *  whole-tray-order gates in the room test ports use. */
function placed(level: typeof BEDROOM02, kinds: readonly PieceKind[]): Build {
  const par = level.parBuild();
  const fixtures = new Set(Object.keys(level.fixtures!));
  const pieces = par.pieces.filter((p) => fixtures.has(p.def)).map((p, i) => ({ ...p, seq: i }));
  const params = levelTrayParams(level, level.tray)!;
  const ramp = pieces.find((p) => p.def === 'ramp')!;
  let cursor = transformSocket(PIECES.ramp.sockets(ramp.params)[1], ramp.transform);
  for (const def of kinds) {
    const p = { ...params[def] };
    const t = fitSocket(cursor, PIECES[def].sockets(p)[0]);
    pieces.push({ def, params: p, transform: t, seq: pieces.length });
    cursor = transformSocket(PIECES[def].sockets(p)[1], t);
  }
  return { levelId: level.id, pieces: pieces as Build['pieces'], seed: level.seed };
}

/** The evaluator's dump: the WHOLE bedroom02 tray in button order — straight
 *  ×3, drop, landing — the exact build that FELL at 2.33 s (7 of 20 whole-tray
 *  orders finish; this one is the nose-first death the note must answer). */
const dump = placed(BEDROOM02, ['straight', 'straight', 'straight', 'drop', 'landing']);
const dumpKinds = new Set<PieceKind>(['straight', 'drop', 'landing']);
const noseFirst = () => ({ ...emptyEvidence(0), lastTouchdownPitch: NOSE_FIRST_PITCH - 0.05 });
const fell = { status: 'fell', time: 2.33, piecesUsed: 5, hazardsTouched: 0 } as const;

describe('the critique names where (P4 item 4, the bedroom02 truth)', () => {
  test('the dump\u2019s landing is anchored BY THE DROP in the join graph', () => {
    const where = placedWhereFor(BEDROOM02, dump);
    expect(where.landing).toBe('by the drop');
    // the first placed straight joins the ramp fixture's exit, later ones
    // join the previous straight — the kind names each site once
    expect(where.straight).toBe('by the ramp or by the straight');
    expect(where.drop).toBe('by the straight');
  });

  test('the failure note reads "flatten the landing by the drop"', () => {
    const note = physicsNote(
      fell,
      noseFirst(),
      dumpKinds, // actionable: tray-stocked or placed
      dumpKinds, // placed
      null,
      dumpKinds,
      new Set<PieceKind>(), // nothing flipped
      null,
      null,
      placedWhereFor(BEDROOM02, dump),
    );
    expect(note).toBe('fell off nose-first \u2014 flatten the landing by the drop');
  });

  test('a null map (replay/share page, no builder) keeps the shipped line byte-identical', () => {
    const note = physicsNote(
      fell,
      noseFirst(),
      dumpKinds,
      dumpKinds,
      null,
      dumpKinds,
      new Set<PieceKind>(),
      null,
      null,
      null,
    );
    expect(note).toBe('fell off nose-first \u2014 flatten the landing');
  });

  test('a rotated landing keeps the re-place law byte-identical (no site tail on it)', () => {
    const note = physicsNote(
      fell,
      noseFirst(),
      dumpKinds,
      dumpKinds,
      null,
      dumpKinds,
      new Set<PieceKind>(['landing']), // flipped
      null,
      null,
      placedWhereFor(BEDROOM02, dump),
    );
    expect(note).toBe('fell off nose-first \u2014 re-place it flat (no R)');
  });

  test('a lip seated PAST THE CUP is located by the goal, the REMOVE button\u2019s own words', () => {
    // fixtures + one straight on the ramp line + a gapLip seated on the
    // cup's far exit (the graph position the past-goal tell refuses at the
    // seat — here we only ask what the MAP says, not what placement allows)
    const par = BEDROOM02.parBuild();
    const fixtures = par.pieces
      .filter((p) => BEDROOM02.fixtures![p.def] !== undefined)
      .map((p, i) => ({ ...p, seq: i }));
    const cup = fixtures.find((p) => p.def === 'finishCup')!;
    const cupExit = transformSocket(PIECES.finishCup.sockets(cup.params)[1], cup.transform);
    const lipParams = { ...(levelTrayParams(BEDROOM02, BEDROOM02.tray)!.gapLip ?? {}) };
    const lip = {
      def: 'gapLip' as const,
      params: lipParams,
      transform: fitSocket(cupExit, PIECES.gapLip.sockets(lipParams)[0]),
      seq: fixtures.length,
    };
    const build: Build = {
      levelId: BEDROOM02.id,
      pieces: [...fixtures, lip] as Build['pieces'],
      seed: BEDROOM02.seed,
    };
    const where = placedWhereFor(BEDROOM02, build);
    expect(where.gapLip).toBe('past the cup');
    const note = physicsNote(
      fell,
      noseFirst(),
      new Set<PieceKind>(['gapLip']),
      new Set<PieceKind>(['gapLip']),
      null,
      new Set<PieceKind>(['gapLip']),
      new Set<PieceKind>(),
      null,
      null,
      where,
    );
    expect(note).toBe('fell off nose-first \u2014 lower the lip past the cup');
  });

  test('a kind the build never placed carries no site (the head stands alone)', () => {
    const where = placedWhereFor(BEDROOM02, dump);
    expect(where.gapLip).toBeUndefined();
    expect(where.booster).toBeUndefined();
  });
});
