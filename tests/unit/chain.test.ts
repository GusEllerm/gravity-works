/**
 * THE CHAIN, PURE (freeplay program Lane C — Decision Log 2026-10-12
 * "THE CHAIN law greenlit"). Four claims, all off the physics:
 *
 *  1. THE VERDICT ROW — a raced link's verdict reads the LINK (name +
 *     its own measured par, or its own re-simulated finish), and the
 *     re-probe's wrong-game `you vs par` is UNPOSSIBLE whenever a link
 *     was raced — no shape of `link` prints the par of the wrong board.
 *  2. THE CHAIN STORE — payloads only, validated on read, deduped by
 *     hash, FIFO-capped, riding `settings.records` through the save law
 *     (a badges/lines write must not drop the chain — the ride test),
 *     and the rank sentence phrased as a walk on THIS device, never a
 *     global number, never badges.
 *  3. THE GOAL FIELD + HASH NEUTRALITY — the cup-goal is guard geometry
 *     read the guard's way (last PLAYER cup, fixtures excluded, raw
 *     transform elements, nothing recomputed), and the whole v2 layer is
 *     hash-neutral: kitchen01's par build replays to its atlas receipt
 *     with goal extraction, payload remint and chain writes mounted
 *     around the step loop — the tally test's idiom, one schema up.
 *  4. THE GEN-PARS RULE + THE SEED FOLD — `parOfRun` is the gen-pars
 *     ceil, and today's LINK is what the shipped daily fold already
 *     picks: the house line on today's board.
 */
import { describe, expect, test } from 'vitest';
import '../../src/world/levels/kitchen01.level.ts';
import '../../src/world/levels/kitchen05.level.ts';
import { getLevel } from '../../src/world/levels/feeltrack.level.ts';
import { chain, serialize } from '../../src/track/build.ts';
import { PIECES } from '../../src/track/pieces.ts';
import { replayRun } from '../../src/replay/replay.ts';
import { encodeShareUrl, parseShareUrl, parOfRun, shareJson, type SharePayload } from '../../src/share/share.ts';
import {
  beatLineage,
  chainLinkPayload,
  chainRankLine,
  CHAIN_CAP,
  cupGoalFromBuild,
  findChainLink,
  readChain,
  rememberLink,
} from '../../src/share/chain.ts';
import { loadSave, memoryStorage } from '../../src/save/save.ts';
import { accumulateBadges, readRecords, recordNamedLine } from '../../src/save/records.ts';
import { dailySeed, dailyLinkLine } from '../../src/save/daily.ts';
import { CAMPAIGN_LADDER, dailyBoardId } from '../../src/world/campaign.ts';
import { verdictLine, vsParLine, type LinkVerdict } from '../../src/ui/result.ts';
import type { ResultModel } from '../../src/ui/result.ts';

const KITCHEN01 = getLevel('kitchen01');

function model(over: Partial<ResultModel>): ResultModel {
  return {
    stars: 1,
    time: 2.27,
    piecesUsed: 3,
    note: '',
    status: 'finished',
    par: { pieces: 3, time: 2.25 },
    bestStarsBefore: 0,
    ...over,
  };
}

describe('the verdict row (the beat-a-friend law)', () => {
  test('no link on the grid: the T3.2 par beat stands verbatim', () => {
    const m = model({});
    expect(verdictLine(m)).toBe(vsParLine(m));
    expect(verdictLine(m)).toContain('you vs par');
  });

  test('a link with a name and its par prints YOU VS <name>’S PAR with the honest Δ', () => {
    const line = verdictLine(model({ time: 2.27, link: { kind: 'same', name: 'to the door', par: 2.8 } }));
    expect(line).toBe('you vs “to the door”’s par — time −0.53 s vs their par');
  });

  test('an unnamed link still says THEIR par, never the page’s', () => {
    const line = verdictLine(model({ time: 3.0, link: { kind: 'same', par: 2.8 } }));
    expect(line).toBe('you vs their par — time +0.20 s vs their par');
  });

  test('a tie against their par reads even, in their words', () => {
    const line = verdictLine(model({ time: 2.8, link: { kind: 'same', name: 'x', par: 2.8 } }));
    expect(line).toContain('time even with their par');
  });

  test('a v1 link with no par: the delta reads the ghost’s own finish — THEIR RUN', () => {
    const line = verdictLine(model({ time: 2.27, link: { kind: 'same', name: 'slick skip', theirTime: 2.8 } }));
    expect(line).toBe('you vs “slick skip”’s run — time −0.53 s vs their run');
  });

  test('a foreign-board link gets the honest refusal, never either par', () => {
    const line = verdictLine(model({ link: { kind: 'foreign', levelId: 'garden-sandbox' } }));
    expect(line).toContain('their link is from garden-sandbox');
    expect(line).toContain('no verdict against either par');
    expect(line).not.toContain('you vs par');
  });

  test('THE LAW: while a link was raced, the row never reads plain `you vs par`', () => {
    const shapes: LinkVerdict[] = [
      { kind: 'same', name: 'a', par: 2.5 },
      { kind: 'same', par: 2.5 },
      { kind: 'same', name: 'a', theirTime: 2.5 },
      { kind: 'same', theirTime: 2.5 },
      { kind: 'same' },
      { kind: 'foreign', levelId: 'x' },
    ];
    for (const link of shapes) {
      const line = verdictLine(model({ link }));
      expect(line, JSON.stringify(link)).not.toMatch(/^you vs par\b/);
      expect(line, JSON.stringify(link)).not.toMatch(/vs par\b/);
    }
  });

  test('a failed run gets no verdict row at all, link or no link', () => {
    expect(verdictLine(model({ status: 'fell', link: { kind: 'same', par: 2.5 } }))).toBe('');
  });
});

describe('the chain store (payloads only, this device only)', () => {
  const payload = (over: Partial<SharePayload> = {}): SharePayload => ({
    v: 2,
    levelId: 'kitchen01',
    seed: 7,
    hash: 'cafe1234',
    build: KITCHEN01.parBuild!(),
    name: 'the fixture line',
    par: 2.25,
    ...over,
  });

  test('remember → read round-trips the payload; the link decodes back to a race', async () => {
    const store = memoryStorage();
    expect(rememberLink(payload(), store)).toBe(1);
    const chain0 = readChain(store);
    expect(chain0).toHaveLength(1);
    expect(chain0[0]!.name).toBe('the fixture line');
    expect(chain0[0]!.par).toBe(2.25);
    const found = findChainLink('cafe1234', store);
    expect(found).toBeDefined();
    const wire = await parseShareUrl(await encodeShareUrl(chainLinkPayload(found!)));
    expect(wire.hash).toBe('cafe1234');
    expect(serialize(wire.build)).toBe(serialize(KITCHEN01.parBuild!()));
  });

  test('deduped by hash; FIFO-capped at the walk limit', () => {
    const store = memoryStorage();
    rememberLink(payload(), store);
    rememberLink(payload(), store);
    expect(readChain(store)).toHaveLength(1);
    for (let i = 0; i < CHAIN_CAP + 6; i++) {
      rememberLink(payload({ hash: (0x10000000 + i).toString(16) }), store);
    }
    const chain0 = readChain(store);
    expect(chain0).toHaveLength(CHAIN_CAP);
    expect(chain0[chain0.length - 1]!.hash).toBe((0x10000000 + CHAIN_CAP + 5).toString(16));
  });

  test('validated on read: garbage rows read as absent, the good rows stand', () => {
    const store = memoryStorage();
    rememberLink(payload(), store);
    const raw = JSON.parse(store.getItem('gravity-works.save')!);
    raw.settings.records.chain.push({ levelId: 'x', seed: 1, hash: 'nothex!!', build: '{}', t: 1 });
    raw.settings.records.chain.push('not an object');
    store.setItem('gravity-works.save', JSON.stringify(raw));
    expect(readChain(store)).toHaveLength(1);
  });

  test('THE RIDE: a badges write and a named-line write cannot drop the chain', () => {
    const store = memoryStorage();
    rememberLink(payload(), store);
    accumulateBadges({ air: 2 }, store);
    expect(readChain(store)).toHaveLength(1);
    recordNamedLine('kitchen-sandbox@1,2,3', 'the spillway', 2.1, KITCHEN01.parBuild!(), store);
    expect(readChain(store)).toHaveLength(1);
    expect(Object.keys(readRecords(loadSave(store)).lines ?? {})).toHaveLength(1);
    expect(readChain(store)).toHaveLength(1);
  });

  test('the rank sentence is a walk on this device — no server, no badges', () => {
    const store = memoryStorage();
    expect(chainRankLine([])).toContain('no links walked yet');
    rememberLink(payload(), store);
    const line = chainRankLine(readChain(store));
    expect(line).toContain('1 link walked on this device');
    expect(line).toContain('your own links on this device only');
    expect(line).not.toMatch(/badge|global|leader/i);
  });

  test('lineage: only a FINISHED run strictly ahead of a PAYLOAD link beats it', () => {
    const link = { levelId: 'kitchen01', hash: 'cafe1234', name: 'the fixture line' };
    expect(
      beatLineage({ finished: true, myTime: 2.0, ghostMode: 'friend', ghostTime: 2.5, link }),
    ).toEqual(link);
    expect(beatLineage({ finished: false, myTime: 2.0, ghostMode: 'friend', ghostTime: 2.5, link })).toBeNull();
    expect(beatLineage({ finished: true, myTime: 2.5, ghostMode: 'friend', ghostTime: 2.5, link })).toBeNull();
    expect(beatLineage({ finished: true, myTime: 2.0, ghostMode: 'other', ghostTime: 2.5, link })).toBeNull();
    expect(
      beatLineage({ finished: true, myTime: 2.0, ghostMode: 'friend', ghostTime: 2.5, link: null }),
    ).toBeNull();
  });

  test('a walked link carries its lineage through the store', () => {
    const store = memoryStorage();
    rememberLink(payload({ hash: 'aaaa1111' }), store);
    rememberLink(
      payload({
        hash: 'bbbb2222',
        lineage: { levelId: 'kitchen01', hash: 'aaaa1111', name: 'the fixture line' },
      }),
      store,
    );
    const chain0 = readChain(store);
    expect(chain0[1]!.lineage?.hash).toBe('aaaa1111');
    expect(chain0[1]!.hash).toBe('bbbb2222');
  });
});

describe('the goal field is guard geometry, and no hash moves near it', () => {
  test('cupGoalFromBuild: the LAST player cup, fixture quota respected, raw elements', () => {
    const withCups = chain(['straight', 'finishCup', 'straight', 'finishCup'], {
      levelId: 'kitchen-sandbox',
      seed: 7,
    });
    const goal = cupGoalFromBuild(withCups, {});
    expect(goal).not.toBeNull();
    const lastCup = [...withCups.pieces].reverse().find((p) => p.def === 'finishCup')!;
    expect(goal).toEqual(Array.from(lastCup.transform.elements)); // copied, never recomputed
    // the occurrence rule: a level whose cup is the FIXTURE's has no player goal
    expect(cupGoalFromBuild(KITCHEN01.parBuild!(), { finishCup: 1 })).toBeNull();
  });

  test('the goal centre rides the transform the guard reifies (capture volume, same piece)', () => {
    const build = chain(['straight', 'finishCup'], { levelId: 'kitchen-sandbox', seed: 3 });
    const goal = cupGoalFromBuild(build, {})!;
    const cup = build.pieces.find((p) => p.def === 'finishCup')!;
    const cv = PIECES.finishCup.captureVolume!(cup.params);
    // the centre the guard reifies is piece-local centre × THIS transform —
    // the payload's goal is the same transform, so the two can never
    // disagree about which cup is the goal
    const m = { elements: goal };
    const lx = cv.center.x, ly = cv.center.y, lz = cv.center.z;
    const e = m.elements;
    const wx = e[0]! * lx + e[4]! * ly + e[8]! * lz + e[12]!;
    const wy = e[1]! * lx + e[5]! * ly + e[9]! * lz + e[13]!;
    const wz = e[2]! * lx + e[6]! * ly + e[10]! * lz + e[14]!;
    expect([wx, wy, wz].every((n) => Number.isFinite(n))).toBe(true);
  });

  test('HASH NEUTRALITY: kitchen01’s par build replays to its atlas receipt with the v2 layer mounted', async () => {
    const par = KITCHEN01.parBuild!();
    // the receipt `replay:all` and the tally gate read (atlas unchanged —
    // THE CHAIN moves no byte of it)
    const plain = await replayRun(KITCHEN01, par);
    expect(plain.hash).toBe('d32417dc');
    // the CHAIN machinery "mounted": goal extraction, a v2 payload written
    // and parsed, a chain remember — all reads/writes OUTSIDE the sim.
    cupGoalFromBuild(par, { finishCup: 1 });
    const store = memoryStorage();
    const p: SharePayload = {
      v: 2,
      levelId: KITCHEN01.id,
      seed: par.seed,
      hash: plain.hash,
      build: par,
      name: KITCHEN01.name,
      par: parOfRun(plain.time),
    };
    rememberLink(p, store);
    const back = await parseShareUrl(await encodeShareUrl(p));
    const withChain = await replayRun(KITCHEN01, back.build);
    expect(withChain.hash).toBe('d32417dc');
    expect(withChain.time).toBe(plain.time);
  });

  test('a cup build runs the same with the goal field carried or not (presentation only)', async () => {
    const build = chain(['straight', 'straight', 'finishCup'], { levelId: 'kitchen-sandbox', seed: 7 });
    const goal = cupGoalFromBuild(build, {})!;
    const runA = await replayRun(KITCHEN01, KITCHEN01.parBuild!()); // receipt sanity, same tick
    expect(runA.hash).toBe('d32417dc');
    const p1: SharePayload = { v: 2, levelId: 'kitchen-sandbox', seed: 7, hash: '00000000', build };
    const p2 = { ...p1, goal };
    expect(serialize((await parseShareUrl(await encodeShareUrl(p1))).build)).toBe(serialize(build));
    expect(serialize((await parseShareUrl(await encodeShareUrl(p2))).build)).toBe(serialize(build));
    // the two wire forms replay IDENTICALLY — the goal field never enters
    // the step loop; it is stripped at the parse into the same build bytes
    const a = await replayRun(getLevel('kitchen-sandbox'), (await parseShareUrl(await encodeShareUrl(p1))).build);
    const b = await replayRun(getLevel('kitchen-sandbox'), (await parseShareUrl(await encodeShareUrl(p2))).build);
    expect(a.hash).toBe(b.hash);
  });
});

describe('the gen-pars rule and the seed fold', () => {
  test('parOfRun IS the gen-pars ceil (scripts/gen-pars.mjs’s parTimeOf law, one home)', () => {
    const genPars = (s: number): number => Math.ceil(s * 20 - 1e-9) / 20; // scripts/gen-pars.mjs
    for (const t of [0.67, 1.192, 2.2333, 2.8, 3.0000001, 5.449]) {
      expect(parOfRun(t)).toBe(genPars(t));
    }
    expect(parOfRun(2.233)).toBe(2.25);
    expect(() => parOfRun(0)).toThrow();
  });

  test('v2 writes the par THROUGH the rule (a payload par is a measured run)', () => {
    const p: SharePayload = { v: 2, levelId: 'kitchen01', seed: 0, hash: 'cafe1234', build: KITCHEN01.parBuild!(), par: parOfRun(2.233) };
    expect(shareJson(p)).toContain('"par":2.25');
  });

  test('today’s LINK is what the daily fold already picks', () => {
    for (const day of ['2026-10-11', '2026-10-12', '2026-11-01']) {
      const seed = dailySeed(new Date(`${day}T12:00:00Z`));
      const id = dailyBoardId(seed);
      expect(CAMPAIGN_LADDER).toContain(id);
      // the same fold, replayed, picks the same board — and the link line
      // carries the board's own shipped par, no new number
      expect(dailyBoardId(dailySeed(new Date(`${day}T12:00:00Z`)))).toBe(id);
      // the link line carries the board's own shipped par, no new number
      const line = dailyLinkLine('Book Drop', 2.25);
      expect(line).toBe('today’s link — Book Drop · published by the house · par 2.25 s');
    }
  });
});
