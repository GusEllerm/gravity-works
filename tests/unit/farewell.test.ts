/**
 * THE FAREWELL, the pure half (program T3.3): the `?farewell=` param
 * family (the URL-affordance law — `off` wins outright, `1` forces past
 * the seen flag, the bare page asks the flag and blocked storage refuses
 * to nag), the per-room TALLY folded through the campaign table (the one
 * source of room membership), and the CRANE PLAN — the event schedule and
 * camera path are pure functions of constants, so the pass is a recorded
 * shot, deterministic machine to machine, with no clock, save, or set
 * consulted at build time (the replay's seek law in miniature: there is
 * nothing here to simulate).
 */
import { describe, expect, it } from 'vitest';
import {
  CRANE_DWELL,
  CRANE_LEAD,
  CRANE_MOVE,
  CRANE_PULL,
  cranePose,
  craneRoomX,
  farewellPlan,
  farewellTally,
  farewellWanted,
} from '../../src/pages/farewell.ts';
import { CAMPAIGN } from '../../src/world/campaign.ts';

describe('farewell URL params', () => {
  it('farewell=off never fires, whatever else the page looks like', () => {
    expect(farewellWanted(new URLSearchParams('farewell=off'))).toBe(false);
    expect(farewellWanted(new URLSearchParams('level=porch05&farewell=off'))).toBe(false);
  });
  it('farewell=1 still forces it (the farewell spec rides this)', () => {
    // node: no localStorage — the forcing alone decides, exactly as the
    // premise beat's own spec relies on
    expect(farewellWanted(new URLSearchParams('farewell=1'))).toBe(true);
  });
  it('the bare page asks the flag — storage we cannot read is not verifiably-unseen', () => {
    // node has no localStorage: the one-shot cannot record itself, and a
    // nagging ending is the worse wrong (the premiere's same rule)
    expect(farewellWanted(new URLSearchParams(''))).toBe(false);
  });
});

describe('farewell tally', () => {
  it('folds the save’s stars per room through the campaign table', () => {
    const rooms = farewellTally({ kitchen01: 3, kitchen05: 2, porch05: 1, garage03: 3 });
    expect(rooms.map((r) => r.id)).toEqual(CAMPAIGN.map((r) => r.id));
    expect(rooms.map((r) => r.label)).toEqual(['Kitchen', 'Bedroom', 'Bathroom', 'Garden', 'Garage', 'Porch']);
    const byId = Object.fromEntries(rooms.map((r) => [r.id, r]));
    expect(byId.kitchen).toMatchObject({ stars: 5, max: 15 });
    expect(byId.bedroom).toMatchObject({ stars: 0, max: 15 });
    expect(byId.garage).toMatchObject({ stars: 3, max: 15 });
    expect(byId.porch).toMatchObject({ stars: 1, max: 15 });
  });
  it('a star off the ladder scores nowhere', () => {
    const rooms = farewellTally({ 'kitchen-sandbox': 3, feeltrack: 3 });
    expect(rooms.reduce((s, r) => s + r.stars, 0)).toBe(0);
  });
});

describe('farewell crane plan (event-driven, deterministic)', () => {
  it('reveals the six rooms in campaign order, then the doors', () => {
    const plan = farewellPlan();
    expect(plan.events.map((e) => e.kind)).toEqual([
      ...CAMPAIGN.map(() => 'reveal'),
      'doors',
    ]);
    expect(plan.events.slice(0, CAMPAIGN.length).map((e) => e.room)).toEqual(
      CAMPAIGN.map((_, i) => i),
    );
    // strictly increasing times, the doors at the very end
    const ts = plan.events.map((e) => e.t);
    expect(ts.every((t, i) => i === 0 || t > ts[i - 1]!)).toBe(true);
    expect(ts[ts.length - 1]).toBe(plan.duration);
  });
  it('is pure: two calls are byte-identical, and the timings are the constants', () => {
    expect(JSON.stringify(farewellPlan())).toBe(JSON.stringify(farewellPlan()));
    const plan = farewellPlan();
    expect(plan.revealAt).toEqual(
      CAMPAIGN.map((_, i) => expect.closeTo(CRANE_LEAD + (CRANE_DWELL + CRANE_MOVE) * i, 10)),
    );
    expect(plan.duration).toBe(
      CRANE_LEAD + CAMPAIGN.length * CRANE_DWELL + (CAMPAIGN.length - 1) * CRANE_MOVE + CRANE_PULL,
    );
  });
  it('the camera path is a pure sweep: finite everywhere, ON the room at each reveal, ending wide at the house centre', () => {
    const plan = farewellPlan();
    for (let t = 0; t <= plan.duration; t += 1 / 60) {
      const { eye, target } = cranePose(t);
      expect(eye.every(Number.isFinite)).toBe(true);
      expect(target.every(Number.isFinite)).toBe(true);
    }
    // at each reveal the eye is over that room (drift is ±0.35 at most)
    plan.revealAt.forEach((t, i) => {
      const { eye } = cranePose(t + 1 / 60);
      expect(Math.abs(eye[0] - craneRoomX(i))).toBeLessThan(0.6);
    });
    // the pull-back ends centred on the house, wider and higher than any dwell
    const wide = cranePose(plan.duration);
    expect(Math.abs(wide.eye[0])).toBeLessThan(0.01);
    expect(wide.eye[2]).toBeGreaterThan(6);
  });
});
