/**
 * THE DISTINCT-OUTCOME TIE LAW (playtest BB bug 3: "`]` other spot
 * sometimes silently does nothing — two runs byte-identical at 1.94 s").
 * `distinctOutcomes` (src/ui/builder.ts) is the pure half of the fix: the
 * tie list — and with it the hint and the `]` walk — counts DISTINCT
 * BUILD OUTCOMES, not sockets. Equivalence is the cheap canonical hash
 * that already lives in the build code (`rigFingerprint`, Track Kit
 * invariant 3), evaluated as a DRY RUN: the current pieces plus the held
 * piece seated on each candidate.
 *
 * Note on where this fires live: the builder's own join-filter removes a
 * target whose origin coincides (within `JOIN_TOL`) with any other
 * piece's socket, and a ladder-wide scan of every par-prefix state finds
 * ZERO build-equivalent tie pairs in shipped geometry — so on shipped
 * levels the tie lists this function sees are all-distinct by
 * construction and the walk stays exactly as wide as playtest S demanded.
 * The dedup is the correctness net for any state where an equivalent
 * alternate CAN appear (coincident frames from authored forks, future
 * symmetric fixtures); this unit test is its gate. The live e2e
 * (`stage5-bb-feel.spec.ts` item 4) asserts the count-the-hint-speaks
 * equals the distinct-dry-run count on a real kitchen03 tie.
 */
import { describe, expect, test } from 'vitest';
import { chain } from '../../src/track/build.ts';
import { PIECES } from '../../src/track/pieces.ts';
import { transformSocket, type Socket } from '../../src/track/socket.ts';
import { distinctOutcomes, dryRunHash } from '../../src/ui/builder.ts';

const build = chain(['straight', 'straight'], { seed: 7, levelId: 'aimlaw' });
const exitSocket = transformSocket(
  PIECES.straight.sockets(build.pieces[1]!.params)[1],
  build.pieces[1]!.transform,
);
/** A coincident copy — the same frame at the same origin (the shape an
 *  equivalent alternate takes). */
function twin(s: Socket): Socket {
  return {
    pos: s.pos.clone(),
    tangent: s.tangent.clone(),
    up: s.up.clone(),
  };
}
/** A genuinely different socket: 0.30 m along the exit tangent. */
function shifted(s: Socket, d: number): Socket {
  return {
    pos: s.pos.clone().addScaledVector(s.tangent, d),
    tangent: s.tangent.clone(),
    up: s.up.clone(),
  };
}

function probe(
  sockets: Socket[],
  held: 'straight' | 'gapLip' = 'straight',
  flipped = false,
): (indices: readonly number[]) => number[] {
  const hash = dryRunHash('aimlaw', 7, build.pieces, held, PIECES[held].params, flipped);
  return (indices) => distinctOutcomes(indices, (i) => sockets[i], hash);
}

describe('distinct-outcome tie law (playtest BB: ] on byte-identical sockets)', () => {
  test('a coincident twin collapses: the tie counts ONE outcome', () => {
    const sockets = [exitSocket, twin(exitSocket)];
    expect(probe(sockets)([0, 1])).toEqual([0]);
  });

  test('a distinct alternate stays: the tie counts its own outcome (playtest S walkability intact)', () => {
    const sockets = [exitSocket, shifted(exitSocket, 0.3)];
    expect(probe(sockets)([0, 1])).toEqual([0, 1]);
  });

  test('first wins: the nearest-depth representative of an equivalence class survives', () => {
    const sockets = [shifted(exitSocket, 0.3), twin(exitSocket), exitSocket, twin(shifted(exitSocket, 0.3))];
    // candidates arrive near-depth first: [1]-twin and [2] are one class,
    // [0] and [3] another — survivors are the FIRST of each class
    expect(probe(sockets)([0, 1, 2, 3])).toEqual([0, 1]);
  });

  test('the flip flag is part of the outcome (a flipped seat is its own build)', () => {
    const sockets = [exitSocket, twin(exitSocket)];
    const flat = probe(sockets, 'straight', false);
    const flipped = probe(sockets, 'straight', true);
    expect(flat([0, 1])).toEqual([0]);
    expect(flipped([0, 1])).toEqual([0]);
    // and flipped-vs-not at the same socket are different outcomes —
    // the hashes actually move with the flag
    const h0 = dryRunHash('aimlaw', 7, build.pieces, 'straight', PIECES.straight.params, false)(exitSocket);
    const h1 = dryRunHash('aimlaw', 7, build.pieces, 'straight', PIECES.straight.params, true)(exitSocket);
    expect(h0).not.toBe(h1);
  });

  test('a single candidate is its own distinct outcome (dedup never shrinks a non-tie)', () => {
    const sockets = [exitSocket];
    expect(probe(sockets)([0])).toEqual([0]);
  });
});
