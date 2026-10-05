/**
 * Juice-hook tests (§7.4): every trigger must fire from REAL run state —
 * real slip, a real landing impulse, a real zone approach — carry its
 * numbers, collapse under reduced motion, and above all be HASH-NEUTRAL:
 * the same run driven with the feed attached hashes bit-identically to the
 * run without it.
 */
import { describe, expect, it } from 'vitest';
import { initRapier } from '../../src/physics/sim.ts';
import { World } from '../../src/world/world.ts';
import { zonesFromLevel } from '../../src/world/hazards.ts';
import { KITCHEN04, kitchen04GroundBuild } from '../../src/world/levels/kitchen04.level.ts';
import { JuiceFeed, JUICE } from '../../src/juice/juice.ts';
import type { JuiceEvent } from '../../src/juice/juice.ts';

async function drive(
  level: typeof KITCHEN04,
  build: ReturnType<typeof KITCHEN04.parBuild>,
  opts: { reducedMotion?: boolean; attachFeed?: boolean } = {},
): Promise<{ events: JuiceEvent[]; hash: string; world: World }> {
  const world = await World.create(level, build, { visuals: false });
  const feed = opts.attachFeed === false
    ? null
    : new JuiceFeed(zonesFromLevel(level), { reducedMotion: opts.reducedMotion });
  const events: JuiceEvent[] = [];
  world.launch();
  let prev = world.state();
  while (world.status === 'running' && world.stepCount < 2000) {
    world.step();
    const next = world.state();
    if (feed) events.push(...feed.step(prev, next));
    prev = next;
  }
  const hash = world.hashHex();
  world.dispose();
  return { events, hash, world };
}

const of = (events: JuiceEvent[], kind: JuiceEvent['kind']) =>
  events.filter((e) => e.kind === kind);

describe('juice fires from real run state (L04 par line)', () => {
  it('landing squash + dust puff with the real impulse, squeal on the re-align skid, chime at the cup', async () => {
    await initRapier();
    const { events } = await drive(KITCHEN04, KITCHEN04.parBuild());
    const squash = of(events, 'landingSquash');
    expect(squash).toHaveLength(1); // one gap, one landing
    const sq = squash[0]!;
    if (sq.kind !== 'landingSquash') throw new Error();
    // the par flight lands at ~1.7 m/s onto the 40 g chassis — ~0.07 N·s,
    // consistent with the feel harness's measured landing impulse (0.061)
    expect(sq.impulseNs).toBeGreaterThan(0.03);
    expect(sq.impulseNs).toBeLessThan(0.12);
    expect(sq.durationMs).toBe(JUICE.SQUASH_MS); // 120 ms
    expect(sq.peakScale).toBeGreaterThan(0.1);
    expect(sq.peakScale).toBeLessThanOrEqual(JUICE.SQUASH_MAX);

    const dust = of(events, 'dustPuff');
    expect(dust).toHaveLength(1);
    const dp = dust[0]!;
    if (dp.kind !== 'dustPuff') throw new Error();
    expect(dp.radiusM).toBeGreaterThan(0);
    expect(dp.radiusM).toBeLessThanOrEqual(JUICE.DUST_RADIUS_MAX_M);

    // the landing re-align skid is real: slip peaks near 45 deg
    const squeal = of(events, 'squeal');
    expect(squeal.length).toBeGreaterThan(0);
    for (const e of squeal) {
      if (e.kind !== 'squeal') throw new Error();
      expect(e.slipRad).toBeGreaterThanOrEqual(JUICE.SQUEAL_SLIP_MIN_RAD);
      expect(e.intensity).toBeGreaterThan(0);
      expect(e.intensity).toBeLessThanOrEqual(1);
    }

    const chime = of(events, 'chime');
    expect(chime).toHaveLength(1);
    const ch = chime[0]!;
    if (ch.kind !== 'chime') throw new Error();
    expect(ch.outcome).toBe('finished');
    expect(ch.timeS).toBeCloseTo(2.57, 1); // re-measured at the L01 promise fix (shared gap geometry moved the L04 par line)
  });

  it('the hazard tell drips BEFORE any grip change (ground line)', async () => {
    await initRapier();
    const world = await World.create(KITCHEN04, kitchen04GroundBuild(), {
      visuals: false,
    });
    const feed = new JuiceFeed(zonesFromLevel(KITCHEN04));
    world.launch();
    let prev = world.state();
    let tellAt = -1;
    let gripDropAt = -1;
    while (world.status === 'running' && world.stepCount < 2000) {
      world.step();
      const next = world.state();
      for (const e of feed.step(prev, next)) {
        if (e.kind === 'hazardTell' && tellAt < 0) {
          tellAt = next.time;
          expect(e.leadMs).toBeGreaterThan(0);
          expect(e.leadMs).toBeLessThanOrEqual(JUICE.HAZARD_TELL_LEAD_S * 1000);
          expect(e.gripFactor).toBe(0.5);
        }
      }
      if (gripDropAt < 0 && next.car.grip < 1) gripDropAt = next.time;
      prev = next;
    }
    world.dispose();
    expect(tellAt).toBeGreaterThan(0);
    expect(gripDropAt).toBeGreaterThan(0); // the line does drive the patch
    expect(tellAt).toBeLessThan(gripDropAt); // affordance precedes hazard
  });

  it('a clean rolling run squeals and squashes NOTHING (L04 ground line, no zones)', async () => {
    await initRapier();
    const dry = { ...KITCHEN04, hazards: [] };
    const { events } = await drive(dry, kitchen04GroundBuild());
    expect(of(events, 'squeal')).toHaveLength(0);
    expect(of(events, 'landingSquash')).toHaveLength(0);
    expect(of(events, 'dustPuff')).toHaveLength(0);
    expect(of(events, 'hazardTell')).toHaveLength(0);
    expect(of(events, 'chime')).toHaveLength(1); // finishing still rings
  });

  it('pieceSnapped carries the quarter-second settle numbers', async () => {
    await initRapier();
    const feed = new JuiceFeed([]);
    const [ev] = feed.pieceSnapped({ x: 1, y: 0, z: 0 }, 'straight');
    expect(ev).toMatchObject({ kind: 'snapSettle', durationMs: 250, overshoot: JUICE.SNAP_OVERSHOOT });
    const rm = new JuiceFeed([], { reducedMotion: true });
    expect(rm.pieceSnapped({ x: 1, y: 0, z: 0 }, 'straight')).toHaveLength(0);
  });
});

describe('reduced motion collapses the animated juice', () => {
  it('same run: only the informational markers remain, all instant', async () => {
    await initRapier();
    const { events } = await drive(KITCHEN04, KITCHEN04.parBuild(), {
      reducedMotion: true,
    });
    expect(of(events, 'squeal')).toHaveLength(0);
    expect(of(events, 'landingSquash')).toHaveLength(0);
    expect(of(events, 'dustPuff')).toHaveLength(0);
    for (const e of of(events, 'chime').concat(of(events, 'hazardTell'))) {
      expect(e.durationMs).toBe(0);
    }
    expect(of(events, 'chime')).toHaveLength(1);
    expect(of(events, 'hazardTell')).toHaveLength(1);
  });
});

describe('juice is hash-neutral', () => {
  it('the same run with the feed attached hashes bit-identically', async () => {
    await initRapier();
    const withJuice = await drive(KITCHEN04, KITCHEN04.parBuild());
    const withoutJuice = await drive(KITCHEN04, KITCHEN04.parBuild(), {
      attachFeed: false,
    });
    expect(withJuice.events.length).toBeGreaterThan(5); // feed really ran
    expect(withJuice.hash).toBe(withoutJuice.hash);
    // and it is the shipped par hash, unchanged: the numbers below are the
    // hazards-round pin, RE-MEASURED at the L01 promise fix (the shared
    // KITCHEN_GAP geometry moved this par build — see set-wiring.test.ts).
    expect(withJuice.hash).toBe('c6a63a80');
  });
});
