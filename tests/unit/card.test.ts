/**
 * The share card's Node-testable half (brief §8: "the share card is a Canvas
 * PNG with a render from the hero camera, the time, the stars and the URL").
 * The pixel path needs a browser canvas — that half is exercised by the
 * share e2es via the page; here we pin the caption, the framing rule, and
 * the honest failure in Node.
 */
import { describe, expect, test } from 'vitest';
import * as THREE from 'three';
import {
  CARD_HEIGHT,
  CARD_WIDTH,
  cardCaption,
  generateShareCard,
  heroCameraFor,
} from '../../src/share/card.ts';

describe('cardCaption', () => {
  const base = { levelId: 'feeltrack', time: 3.0083, stars: 2 as const, url: 'https://x/#s=abc' };

  test('carries level, time and the star readout', () => {
    const text = cardCaption(base);
    expect(text).toContain('Gravity Works');
    expect(text).toContain('feeltrack');
    expect(text).toContain('3.01 s');
    expect(text).toContain('★★☆');
  });

  test('shows the verification mark only when the share page answered', () => {
    expect(cardCaption(base)).not.toMatch(/verified|mismatch/);
    expect(cardCaption({ ...base, verified: true })).toContain('verified');
    expect(cardCaption({ ...base, verified: false })).toContain('mismatch');
  });
});

describe('heroCameraFor', () => {
  test('frames an arbitrary build from the hero attitude', () => {
    const subject = new THREE.Group();
    const box = new THREE.Mesh(new THREE.BoxGeometry(1, 0.4, 1));
    box.position.set(1, 0.2, 0);
    subject.add(box);
    const cam = heroCameraFor(subject);
    expect(cam.fov).toBe(35);
    expect(cam.aspect).toBe(CARD_WIDTH / CARD_HEIGHT);
    // pulled back along the hero direction (front-up-right) from the centre
    expect(cam.position.x).toBeGreaterThan(1);
    expect(cam.position.y).toBeGreaterThan(0.2);
    expect(cam.position.z).toBeGreaterThan(0);
    cam.updateMatrixWorld();
    // the build centre lies on the camera's view axis: it projects to ~the middle
    const p = new THREE.Vector3(1, 0.2, 0).project(cam);
    expect(Math.abs(p.x)).toBeLessThan(0.05);
    expect(Math.abs(p.y)).toBeLessThan(0.05);
  });

  test('survives an empty scene with the fallback framing', () => {
    const cam = heroCameraFor(new THREE.Group());
    expect(cam.position.length()).toBeGreaterThan(0);
  });
});

describe('generateShareCard', () => {
  test('says so in Node instead of shipping a blank PNG', async () => {
    await expect(
      generateShareCard({ levelId: 'feeltrack', time: 1, stars: 0, url: 'http://x' }),
    ).rejects.toThrow(/canvas/);
  });
});
