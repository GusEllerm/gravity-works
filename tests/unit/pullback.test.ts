/**
 * THE PULL-BACK LAW (final-sheet probe item (c) — the overshoot
 * soft-lock). The note's ORPHAN sentence (`the straight sits past the
 * cup — pull it back`) used to own no verb: Remove took the LAST piece
 * placed, and on 3 of 6 sandboxes no advice-obeying sequence could close
 * the room. The fix is ONE pure source — `pullbackTargetIndex` in
 * `src/track/build.ts`, the same join fact `moveHintFor` reads — under
 * two laws:
 *
 *   1. WHERE THE SENTENCE FIRES, THE VERB REACHES: for every sandbox and
 *      every campaign rung, whenever the ORPHAN clause names a piece,
 *      the pull-back target IS that piece (the button takes what the
 *      note pointed at). Verified per room on the probe's own overshoot
 *      scenario — the par line's finisher, placed early, seated on the
 *      cup's own exit.
 *   2. EVERYTHING ELSE IS THE SHIPPED LIFO: on every shipped line
 *      (thirty campaign pars, six sandbox pars) and on an AUTHORED
 *      run-out (kitchen02's fixture curve past the cup) the pull-back is
 *      silent — `goalExitJoinIndex` may point at kitchen02's curve, but
 *      what the level shipped is not the player's to take, exactly as
 *      the clause never names it.
 */
import { describe, expect, test } from 'vitest';
import { fitSocket } from '../../src/track/snap.ts';
import { transformSocket } from '../../src/track/socket.ts';
import { PIECES, pieceLabel, type PieceKind } from '../../src/track/pieces.ts';
import { goalExitJoinIndex, pullbackTargetIndex, fixtureQuota, type Build } from '../../src/track/build.ts';
import { levelTray, moveHintFor } from '../../src/ui/advice.ts';
import { CAMPAIGN, CAMPAIGN_LADDER } from '../../src/world/campaign.ts';
import { getLevel } from '../../src/world/levels/feeltrack.level.ts';
import { KITCHEN02 } from '../../src/world/levels/kitchen02.level.ts';

type AnyLevel = {
  id: string;
  seed: number;
  tray?: Partial<Record<string, number>>;
  fixtures?: Partial<Record<string, number>>;
  parBuild: () => Build;
};

/** The probe's overshoot as build data (shipped builder's shape): the
 *  piece that FINISHES the par line — the tray piece whose exit joins
 *  the cup's entry — re-seated, early, on the cup's own open exit;
 *  everything else at its par seat. `null` on a rung whose cup is not
 *  joined by a tray piece (no overshoot scenario to stage there). */
function overshoot(level: AnyLevel): { build: Build; over: Build['pieces'][number] } | null {
  const par = level.parBuild();
  const quota = fixtureQuota(level.fixtures ?? {});
  const mask = par.pieces.map((p) => quota(p.def));
  const goalAt = par.pieces.findIndex((p) => PIECES[p.def].captureVolume !== undefined);
  if (goalAt < 0) return null;
  const goal = par.pieces[goalAt]!;
  const goalEntry = transformSocket(PIECES[goal.def]!.sockets(goal.params)[0], goal.transform);
  const goalExit = transformSocket(PIECES[goal.def]!.sockets(goal.params)[1], goal.transform);
  const pAt = par.pieces.findIndex(
    (p, i) =>
      i !== goalAt &&
      transformSocket(PIECES[p.def]!.sockets(p.params)[1], p.transform).pos.distanceTo(goalEntry.pos) < 0.01,
  );
  if (pAt < 0 || mask[pAt]) return null;
  const P = par.pieces[pAt]!;
  const fixtures = par.pieces.filter((_, i) => mask[i]).map((p, i) => ({ ...p, seq: i }));
  const placed = par.pieces.filter((_, i) => !mask[i]);
  const Pover = {
    ...P,
    transform: fitSocket(goalExit, PIECES[P.def]!.sockets(P.params)[0]),
    seq: fixtures.length,
  };
  const others = placed.filter((p) => p !== P).map((p, i) => ({ ...p, seq: fixtures.length + 1 + i }));
  return { build: { levelId: level.id, pieces: [...fixtures, Pover, ...others], seed: level.seed }, over: Pover };
}

describe('the pull-back law (item (c): the overshoot sentence owns a verb)', () => {
  for (const room of CAMPAIGN) {
    test(`${room.id} sandbox: the note names the overshoot and the button takes THAT piece`, () => {
      const level = getLevel(room.sandboxId) as unknown as AnyLevel;
      const over = overshoot(level);
      expect(over).not.toBeNull();
      const { build } = over!;
      const hint = moveHintFor(level as never, build, levelTray(level as never));
      expect(hint?.move).toBe('orphan');
      expect(hint?.clause).toContain(`the ${pieceLabel(over!.over.def).toLowerCase()} sits past the cup — pull it back`);
      const at = pullbackTargetIndex(build.pieces, level.fixtures, new Set(Object.keys(level.tray ?? {}) as PieceKind[]));
      expect(at).toBeGreaterThanOrEqual(0);
      expect(build.pieces[at]).toBe(over!.over);
    });
  }

  test('no shipped line pulls: thirty campaign pars and six sandbox pars leave LIFO untouched', () => {
    for (const id of [...CAMPAIGN_LADDER, ...CAMPAIGN.map((r) => r.sandboxId)]) {
      const level = getLevel(id) as unknown as AnyLevel;
      const tray = new Set(Object.keys(level.tray ?? {}) as PieceKind[]);
      expect(pullbackTargetIndex(level.parBuild().pieces, level.fixtures, tray), id).toBe(-1);
    }
  });

  test('kitchen02’s authored run-out: the join is real, the sentence is silent, and so is the button', () => {
    const par = KITCHEN02.parBuild();
    // the fixture curve really does sit on the cup's exit — that is the
    // rung; the fixture rule is what keeps it named by neither surface
    expect(goalExitJoinIndex(par.pieces)).toBeGreaterThanOrEqual(0);
    expect(pullbackTargetIndex(par.pieces, KITCHEN02.fixtures, new Set(Object.keys(KITCHEN02.tray ?? {}) as PieceKind[]))).toBe(-1);
    expect(moveHintFor(KITCHEN02 as never, par, levelTray(KITCHEN02 as never))?.move).not.toBe('orphan');
  });

  test('the tray gate: a kind the tray does not stock is not the button’s to take', () => {
    const level = getLevel('kitchen-sandbox') as unknown as AnyLevel;
    const { build } = overshoot(level)!;
    // same join, wrong owner — the overshoot is a straight, the "tray" here isn't
    expect(pullbackTargetIndex(build.pieces, level.fixtures, new Set<PieceKind>(['landing']))).toBe(-1);
    expect(pullbackTargetIndex(build.pieces, level.fixtures, new Set<PieceKind>(['straight']))).toBeGreaterThanOrEqual(0);
  });

  test('invariant across the ladder: wherever the clause fires, the pull target is the named piece', () => {
    for (const id of [...CAMPAIGN_LADDER, ...CAMPAIGN.map((r) => r.sandboxId)]) {
      const level = getLevel(id) as unknown as AnyLevel;
      const over = overshoot(level);
      for (const build of [level.parBuild(), ...(over ? [over.build] : [])]) {
        const hint = moveHintFor(level as never, build, levelTray(level as never));
        if (hint?.move !== 'orphan') continue;
        const at = pullbackTargetIndex(build.pieces, level.fixtures, new Set(Object.keys(level.tray ?? {}) as PieceKind[]));
        expect(at, `${id} — the clause fired with no verb behind it`).toBeGreaterThanOrEqual(0);
        expect(pieceLabel(build.pieces[at]!.def).toLowerCase()).toContain(
          hint.clause.split(' ')[1]!,
        );
      }
    }
  });
});
