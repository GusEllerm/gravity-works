/**
 * THE HOUSE surfaces (build 1) — the page-half claims as executables:
 * the result copy, the device's rooms record, and the camera v1 whose
 * hand-off count is a THEOREM of the room graph (the spike's camera
 * section, kept honest: the plan is a pure function of the approval
 * timeline, so ≥ 3 rooms ⇒ ≥ 2 hand-offs, no tuning involved).
 */
import { describe, expect, test } from 'vitest';
import { houseBestLine, houseResultLine, houseStatusLine } from '../../src/pages/house.ts';
import {
  houseLayout,
} from '../../src/world/house-frame.ts';
import {
  houseHandoffs,
  houseRunPlan,
  houseRunPose,
  menuPose,
  HOUSE_FRAMING,
  type ParcelEvent,
} from '../../src/camera/house-camera.ts';
import { freshSave } from '../../src/save/save.ts';
import { memoryStorage } from '../../src/save/save.ts';
import { readRecords, recordHouseRun, readHouseBest, RECORDS_HONESTY } from '../../src/save/records.ts';
import { SAVE_KEY } from '../../src/save/save.ts';

describe('the house result copy', () => {
  test('the law’s wording, plural and singular', () => {
    expect(houseResultLine(4, 6.7, 'the bathroom')).toBe('4 rooms \u00B7 6.7 s \u2014 you stopped at the bathroom');
    expect(houseResultLine(1, 2.0, 'the garage')).toBe('1 room \u00B7 2.0 s \u2014 you stopped at the garage');
    expect(houseStatusLine(3, 4.1)).toBe('3 rooms \u00B7 4.1 s');
  });
  test('the best line carries the device-honesty sentence verbatim', () => {
    expect(houseBestLine(undefined)).toContain(RECORDS_HONESTY);
    expect(houseBestLine({ rooms: 5, time: 6.4, t: 0 })).toBe(`best here: 5 rooms \u00B7 6.4 s — ${RECORDS_HONESTY}`);
  });
});

describe('the house personal best — the “this device” law', () => {
  test('minted, beaten by rooms, beaten by the clock on a tie, held otherwise', () => {
    const store = memoryStorage();
    let out = recordHouseRun('house', 3, 8, store);
    expect(out.outcome).toBe('minted');
    out = recordHouseRun('house', 2, 5, store); // fewer rooms win nothing
    expect(out.outcome).toBe('held');
    expect(out.best).toEqual({ rooms: 3, time: 8, t: out.best!.t });
    out = recordHouseRun('house', 3, 7, store); // the clock breaks the tie
    expect(out.outcome).toBe('beat');
    out = recordHouseRun('house', 4, 9, store);
    expect(out.outcome).toBe('beat');
    expect(readHouseBest('house', store)).toEqual({ rooms: 4, time: 9, t: readHouseBest('house', store)!.t });
  });

  test('a zero-room run records nothing (no trophy in a zero)', () => {
    const store = memoryStorage();
    const out = recordHouseRun('house', 0, 6, store);
    expect(out.outcome).toBe('none');
    expect(readHouseBest('house', store)).toBeUndefined();
  });

  test('garbage validates to absent (the save law)', () => {
    const data = freshSave();
    data.settings.records = { houses: { house: { rooms: -2, time: 'x' } } as never };
    const store = memoryStorage({ [SAVE_KEY]: JSON.stringify(data) });
    expect(readRecords(data).houses).toEqual({});
    expect(readHouseBest('house', store)).toBeUndefined();
  });
});

describe('the house camera v1 — the hand-off law', () => {
  const layout = houseLayout();
  const canonical: ParcelEvent[] = [
    { room: 'garage', time: 1.0 },
    { room: 'kitchen', time: 1.9 },
    { room: 'bedroom', time: 2.8 },
    { room: 'bathroom', time: 3.7 },
  ];

  test('the menu camera is the crane parked at the PORCH (floor of the world)', () => {
    const p = menuPose(layout, 'porch');
    const porch = layout.decks.find((d) => d.room === 'porch')!;
    expect(p.eye[1]).toBeCloseTo(porch.center[1] + HOUSE_FRAMING.gazeHeight, 6);
    expect(p.target[0]).toBeCloseTo(porch.center[0], 6);
    expect(p.fog).toBe(0);
  });

  test('a 4-room plan hand-offs THREE times — two is a theorem, not a tune', () => {
    const plan = houseRunPlan(canonical);
    expect(houseHandoffs(plan)).toBe(3);
    // every leg is a graph edge of the descent, in order
    expect(plan.filter((s) => s.kind === 'leg').map((s) => `${s.room}>${s.to}`)).toEqual([
      'garage>kitchen',
      'kitchen>bedroom',
      'bedroom>bathroom',
    ]);
    // legs never exceed the farewell's CRANE_MOVE and never teleport
    for (const seg of plan.filter((s) => s.kind === 'leg')) {
      expect(seg.to_t - seg.from).toBeLessThanOrEqual(0.8 + 1e-9);
      expect(seg.to_t - seg.from).toBeGreaterThanOrEqual(HOUSE_FRAMING.minLeg);
    }
  });

  test('poses are deterministic functions of plan time — dwell drifts, legs haze', () => {
    const plan = houseRunPlan(canonical);
    const a = houseRunPose(layout, plan, 2.2);
    const b = houseRunPose(layout, plan, 2.2);
    expect(a).toEqual(b);
    // mid-dwell on the launch deck: the eye is over the garage centre band
    const dwell = houseRunPose(layout, plan, 0.5);
    const garage = layout.decks.find((d) => d.room === 'garage')!;
    expect(Math.abs(dwell.eye[0] - garage.center[0])).toBeLessThanOrEqual(0.36);
    expect(dwell.fog).toBe(0);
    // mid-leg: the haze breathes (the fog rides the lift sine — nonzero)
    const leg = plan.find((s) => s.kind === 'leg' && s.room === 'garage')!;
    const mid = houseRunPose(layout, plan, (leg.from + leg.to_t) / 2);
    expect(mid.fog).toBeGreaterThan(0);
    // after the last crossing: the eye dwells where the run stopped
    const tail = houseRunPose(layout, plan, 9);
    const bath = layout.decks.find((d) => d.room === 'bathroom')!;
    expect(tail.target[0]).toBeCloseTo(bath.center[0], 6);
  });

  test('zero approvals = the launch-deck dwell (no plan, no teleport)', () => {
    const plan = houseRunPlan([]);
    expect(houseHandoffs(plan)).toBe(0);
    const pose = houseRunPose(layout, plan, 0.4);
    const garage = layout.decks.find((d) => d.room === 'garage')!;
    expect(pose.target[0]).toBeCloseTo(garage.center[0], 6);
  });
});
