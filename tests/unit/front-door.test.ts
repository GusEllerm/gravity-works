/**
 * THE FRONT DOOR purs (downhill build 2): the window naming and the sill
 * are pure folds of the campaign table and the save's stars — the same
 * registry-truth law the farewell tally obeys — and the parked wide crane
 * (`homePose`) plus the beat's pull-back (`beatPullPose`) are pure over
 * the layout, so the frame that holds six windows is a theorem of the
 * deck bounds and the frustum, not a tuning. `HOUSE_BEAT_LEVEL` is the
 * input law honored in the beat's data: no wind, one legal launch push.
 */
import { describe, expect, test } from 'vitest';
import { windowAriaName, windowSillLine, HOUSE_BEAT, HOUSE_BEAT_LEVEL } from '../../src/pages/house.ts';
import { homePose, beatPullPose, menuPose } from '../../src/camera/house-camera.ts';
import { HOUSE } from '../../src/world/levels/house.level.ts';
import { houseLayout } from '../../src/world/house-frame.ts';

describe('the window name and the sill — registry folds, not strings', () => {
  test('the prompt’s shape: room, rungs, toured — and the star clause only when earned', () => {
    expect(windowAriaName('Kitchen', 5, 8, 15)).toBe('kitchen, 5 rungs, toured, 8 of 15 stars');
    expect(windowAriaName('Kitchen', 5, 15, 15)).toBe('kitchen, 5 rungs, toured, 15 of 15 stars');
    expect(windowAriaName('Garden', 5, 0, 15)).toBe('garden, 5 rungs, not toured yet');
  });
  test('nothing earned, nothing worn — an unstarred room wears no fake stars', () => {
    expect(windowSillLine(0, 15)).toBe('');
    expect(windowSillLine(5, 15)).toBe('★ 5/15');
  });
});

describe('the parked wide crane — the menu camera the door projects through', () => {
  const layout = houseLayout();
  test('homePose frames EVERY deck: all six centers inside the frustum', () => {
    const p = homePose(layout, 35, 960 / 540);
    // eye pulled back along +z from the section’s axis; every deck center
    // projects inside NDC with the 15 % margin baked in
    const vFov = (35 * Math.PI) / 180;
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * (960 / 540));
    for (const d of layout.decks) {
      const dx = Math.abs(d.center[0] - p.target[0]);
      const dy = Math.abs(d.center[1] - p.target[1]);
      const z = p.eye[2] - d.center[2];
      expect(dx).toBeLessThan(z * Math.tan(hFov / 2));
      expect(dy).toBeLessThan(z * Math.tan(vFov / 2));
    }
    expect(p.eye[2]).toBeGreaterThan(8); // wide, not a porch close-up
    expect(p.fog).toBe(0);
  });
  test('beatPullPose starts AT the kitchen window and ends at the wide house', () => {
    const from = menuPose(layout, 'kitchen');
    const wide = homePose(layout, 35, 960 / 540);
    const p0 = beatPullPose(layout, 0, HOUSE_BEAT.pullS, 35, 960 / 540);
    const p1 = beatPullPose(layout, HOUSE_BEAT.pullS, HOUSE_BEAT.pullS, 35, 960 / 540);
    expect(p0.eye).toEqual(from.eye);
    for (let i = 0; i < 3; i++) expect(p1.eye[i]).toBeCloseTo(wide.eye[i], 9);
    const mid = beatPullPose(layout, HOUSE_BEAT.pullS / 2, HOUSE_BEAT.pullS, 35, 960 / 540);
    expect(mid.eye[2]).toBeGreaterThan(p0.eye[2]); // it only ever pulls back
    expect(mid.eye[2]).toBeLessThan(p1.eye[2]);
  });
});

describe('the beat’s data — the input law honored, the receipt untouched', () => {
  test('no wind in the data, one launch push, the house’s own geometry', () => {
    expect(HOUSE_BEAT_LEVEL.inputs).toEqual({ windEvery: 0, windDeltaV: 0, launchSpeed: 1.3 });
    expect(HOUSE_BEAT_LEVEL.id).toBe('house');
    expect(HOUSE_BEAT_LEVEL.parBuild).toBe(HOUSE.parBuild);
  });
  test('the beat’s timings are the measured roll: pull, kitchen-crossing roll-end, still', () => {
    expect(HOUSE_BEAT).toEqual({ pullS: 1.0, rollEndS: 4.5, stillS: 0.5, timeoutMs: 12000 });
  });
});
