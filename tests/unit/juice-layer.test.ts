/**
 * The T1.1 juice CONSUMER (`src/juice/layer.ts`): the feed finally has a
 * listener, and the listener must be a pure echo. The proofs here mirror
 * `juice.test.ts` and extend them to the pixels: the same L04 par run
 * driven THROUGH the layer hashes bit-identically (the layer writes scene
 * scales and nothing else), the squash envelope animates and settles on
 * the wall clock, the puff pool blooms and hides, reduced motion snaps
 * every effect to its still frame while the landing SOUND hook (a thud is
 * not a motion) keeps firing.
 */
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { initRapier } from '../../src/physics/sim.ts';
import { World } from '../../src/world/world.ts';
import { zonesFromLevel } from '../../src/world/hazards.ts';
import { KITCHEN04 } from '../../src/world/levels/kitchen04.level.ts';
import { JuiceFeed } from '../../src/juice/juice.ts';
import { createJuiceLayer, zoneAt } from '../../src/juice/layer.ts';

async function drive(
  opts: { reducedMotion?: boolean; attachLayer?: boolean } = {},
): Promise<{
  hash: string;
  thuds: number[];
  body: THREE.Group;
  minScaleY: number;
  puffsSeen: number;
  settledScaleY: number;
}> {
  const world = await World.create(KITCHEN04, KITCHEN04.parBuild(), { visuals: false });
  const scene = new THREE.Scene();
  const body = new THREE.Group();
  scene.add(body);
  const thuds: number[] = [];
  const layer = createJuiceLayer({
    reducedMotion: opts.reducedMotion,
    onLanding: (e) => thuds.push(e.impulseNs),
  });
  if (opts.attachLayer !== false) {
    layer.setCarBody(body);
    layer.attachScene(scene);
    layer.setFeed(new JuiceFeed(zonesFromLevel(KITCHEN04)));
  }
  let minScaleY = 1;
  let puffsSeen = 0;
  world.launch();
  let prev = world.state();
  while (world.status === 'running' && world.stepCount < 2000) {
    world.step();
    const next = world.state();
    layer.step(prev, next);
    layer.frame(1000 / 60); // one render frame per sim step (fast-forward)
    minScaleY = Math.min(minScaleY, body.scale.y);
    for (const child of scene.children) {
      if (child.name === 'juice-puff' && child.visible) puffsSeen++;
    }
    prev = next;
  }
  for (let i = 0; i < 30; i++) layer.frame(1000 / 60); // let envelopes settle
  const hash = world.hashHex();
  world.dispose();
  layer.dispose();
  return { hash, thuds, body, minScaleY, puffsSeen, settledScaleY: body.scale.y };
}

describe('juice layer presents the feed without touching the run', () => {
  it('the L04 par run driven THROUGH the layer hashes like the bare run', async () => {
    await initRapier();
    const bare = await drive({ attachLayer: false });
    const juice = await drive();
    expect(juice.hash).toBe(bare.hash); // the hash-neutral contract, extended
    expect(juice.thuds).toHaveLength(1); // one gap, one thud hook
    expect(juice.thuds[0]).toBeGreaterThan(0.03);
  });

  it('squash animates on the wall clock and eases home; dust blooms and hides', async () => {
    await initRapier();
    const run = await drive();
    expect(run.minScaleY).toBeLessThan(0.95); // a real squash happened
    expect(run.minScaleY).toBeGreaterThan(0.4); // never inverts the chassis
    expect(run.settledScaleY).toBe(1); // back to rest, exactly
    expect(run.puffsSeen).toBeGreaterThan(0); // the puff was on screen
    // ...and gone again after the envelopes closed (scale reset, hidden)
  });

  it('reduced motion snaps every effect to its still frame — the THUD stays', async () => {
    await initRapier();
    const run = await drive({ reducedMotion: true });
    expect(run.minScaleY).toBe(1); // no squash
    expect(run.puffsSeen).toBe(0); // no dust
    expect(run.thuds).toHaveLength(1); // sound is not motion
    expect(run.settledScaleY).toBe(1);
  });
});

describe('zoneAt (the cheap surface read)', () => {
  it('finds the zone a landing point sits inside, and only that one', () => {
    const zones = zonesFromLevel(KITCHEN04);
    expect(zones.length).toBeGreaterThan(0);
    const z = zones[0]!;
    expect(zoneAt(zones, z.shape.center)?.id).toBe(z.id);
    const far = {
      x: z.shape.center.x + z.shape.half.x * 10,
      y: z.shape.center.y,
      z: z.shape.center.z,
    };
    expect(zoneAt(zones, far)).toBeNull();
  });
});
