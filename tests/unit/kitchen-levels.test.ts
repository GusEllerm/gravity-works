/**
 * Kitchen ladder playability proof (stage 3, Level Designer's gate).
 *
 * The rule: a level whose par build does not finish is a bug in the LEVEL,
 * not in the physics. Every parBuild in the kitchen ladder — five levels plus
 * the sandbox — is replayed headless through the same seam the share links
 * and the determinism harness use (`replayRun` -> `World`, raycast-wheel car,
 * the shipped `ROLL_COEF`, the feel harness's own physics), and the status
 * must be `finished`. On top of the gate: the level contracts hold (budget =
 * tray, par build replays identically twice), L02's second line and L04's
 * ground line really finish (the choices are real), and L05's two wrong
 * allocations really DON'T (the trade-off is real).
 *
 * The rung that cannot be proven is stated in Concepts/Levels: no mid-run
 * yaw arc (curve/bank) is drivable by either shipped car, so L02's curve and
 * L03's bowl line are fixture geometry past the cup and that rung of the
 * ladder is BLOCKED pending piece request 1.
 */
import { describe, expect, test } from 'vitest';
import { KITCHEN01, KITCHEN_GEOM, trayCount, type KitchenLevel } from '../../src/world/levels/kitchen01.level.ts';
import { KITCHEN02, kitchen02ArcBuild } from '../../src/world/levels/kitchen02.level.ts';
import { KITCHEN03 } from '../../src/world/levels/kitchen03.level.ts';
import { KITCHEN04, kitchen04GroundBuild } from '../../src/world/levels/kitchen04.level.ts';
import {
  KITCHEN05,
  KITCHEN_SANDBOX,
  kitchen05LateBoosterBuild,
  kitchen05NoBoosterBuild,
} from '../../src/world/levels/kitchen05.level.ts';
import { replayRun } from '../../src/replay/replay.ts';

const LADDER: readonly KitchenLevel[] = [KITCHEN01, KITCHEN02, KITCHEN03, KITCHEN04, KITCHEN05, KITCHEN_SANDBOX];

describe('kitchen ladder — every par build finishes (headless)', () => {
  for (const level of LADDER) {
    test(`${level.id} par build finishes`, async () => {
      const result = await replayRun(level, level.parBuild());
      expect(result.status).toBe('finished');
    }, 30_000);
  }

  test('the par build replays identically twice (kitchen levels are data)', async () => {
    const first = await replayRun(KITCHEN01, KITCHEN01.parBuild());
    const second = await replayRun(KITCHEN01, KITCHEN01.parBuild());
    expect(first.hash).toBe(second.hash);
    expect(first.steps).toBe(second.steps);
  });

  test('the finish is reached well inside the run cap on every rung', async () => {
    for (const level of LADDER) {
      const result = await replayRun(level, level.parBuild());
      expect(result.time).toBeLessThan(level.maxTime * 0.75);
    }
  }, 60_000);
});

describe('kitchen ladder — level contracts', () => {
  for (const level of LADDER.filter((l) => !l.sandbox)) {
    test(`${level.id}: budget = tray total, par pieces <= tray, release on a slope`, () => {
      expect(level.budget).toBe(trayCount(level.tray));
      expect(level.par.pieces).toBeLessThanOrEqual(level.budget);
      // the release pose sits on the start ramp's descending blend (a level
      // deck release stalls against the tuned rolling resistance)
      expect(level.startSocket.tangent.y).toBeLessThan(0);
      expect(level.startSocket.tangent.y).toBeCloseTo(Math.sin((KITCHEN_GEOM.rampAngle * Math.PI) / 180), 1);
    });
  }

  test('the sandbox has no budget and everything unlocked', () => {
    expect(KITCHEN_SANDBOX.sandbox).toBe(true);
    expect(KITCHEN_SANDBOX.budget).toBeGreaterThanOrEqual(999);
  });

  test('L01 tutorial: three tray pieces, one gap, and the par build IS all three', () => {
    expect(Object.keys(KITCHEN01.tray)).toHaveLength(3);
    expect(KITCHEN01.budget).toBe(3);
    const kinds = KITCHEN01.parBuild().pieces.map((p) => p.def);
    expect(kinds).toEqual(['ramp', 'gapLip', 'drop', 'landing', 'finishCup']);
  });

  test('L03 exposes the bowl rim sockets the Environment Artist builds to', () => {
    const sockets = KITCHEN03.propSockets!;
    expect(Object.keys(sockets).sort()).toEqual(['bowl.in', 'bowl.out']);
    expect(sockets['bowl.in']!.pos.distanceTo(sockets['bowl.out']!.pos)).toBeGreaterThan(0.01);
  });

  test('L04 carries the wet patch as data with the brief grip factor', () => {
    const hazard = KITCHEN04.hazards![0]!;
    expect(hazard.kind).toBe('wetPatch');
    expect(hazard.gripFactor).toBe(0.5);
    expect(hazard.source).toBe('tap');
  });
});

describe('kitchen ladder — the choices and the trade-off are real', () => {
  test('L02: BOTH lines across the one gap finish', async () => {
    const par = await replayRun(KITCHEN02, KITCHEN02.parBuild());
    const arc = await replayRun(KITCHEN02, kitchen02ArcBuild());
    expect(par.status).toBe('finished');
    expect(arc.status).toBe('finished');
    // the lazy line (drop between straights) is the FAST one — that is the lesson
    expect(par.time).toBeLessThan(arc.time);
  }, 30_000);

  test('L04: the ground line through the wet patch also finishes (dry, today)', async () => {
    const ground = await replayRun(KITCHEN04, kitchen04GroundBuild());
    expect(ground.status).toBe('finished');
  }, 30_000);

  test('L05: the two wrong allocations do NOT finish', async () => {
    const noBooster = await replayRun(KITCHEN05, kitchen05NoBoosterBuild());
    const lateBooster = await replayRun(KITCHEN05, kitchen05LateBoosterBuild());
    expect(noBooster.status).not.toBe('finished');
    expect(lateBooster.status).not.toBe('finished');
  }, 30_000);
});
