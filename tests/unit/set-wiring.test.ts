/**
 * The stage-3 level↔set seam (Systems Engineer). What this pins:
 *
 *  - PHYSICS NEUTRALITY BY DATA: every kitchen par replays at the same
 *    finish, time and hash it had BEFORE the set wiring landed (the literals
 *    below are the HEAD-of-stage-2 wave hashes, re-measured at this seam),
 *    and a visual `World` hashes identically to a headless one;
 *  - L04 tap ↔ wet patch: the set's `tapSplash` hazard centre, placed by
 *    KITCHEN 04's mount, IS the level's authored zone centre, and the frozen
 *    drip's world position falls INSIDE the zone footprint, from above;
 *  - L03's bowl is the set's bowl: the par build's rim fixtures are seated
 *    THROUGH the set's `bowl.in`/`bowl.out` frames (the exported
 *    `propSockets` equal the placed set frames to the nanometre);
 *  - the placements themselves are recomputed from the live level data and
 *    set data — the literal table in `src/world/setPlacement.ts` cannot
 *    silently drift;
 *  - the builder guard's solid boxes come from the set's named props, exclude
 *    the films, and do not overlap any level's built chain (the shipped
 *    builds must stay placeable).
 */
import { describe, expect, it, beforeAll } from 'vitest';
import * as THREE from 'three';
import { initRapier } from '../../src/physics/sim.ts';
import { KITCHEN01 } from '../../src/world/levels/kitchen01.level.ts';
import { KITCHEN02 } from '../../src/world/levels/kitchen02.level.ts';
import { KITCHEN03, KITCHEN03_BOWL } from '../../src/world/levels/kitchen03.level.ts';
import { KITCHEN04, kitchen04GroundBuild } from '../../src/world/levels/kitchen04.level.ts';
import { KITCHEN05, KITCHEN_SANDBOX } from '../../src/world/levels/kitchen05.level.ts';
import type { KitchenLevel } from '../../src/world/levels/kitchen01.level.ts';
import { replayRun } from '../../src/replay/replay.ts';
import { World } from '../../src/world/world.ts';
import { KitRig } from '../../src/feel/kittrack.ts';
import { PIECES } from '../../src/track/pieces.ts';
import { transformSocket } from '../../src/track/socket.ts';
import { buildKitchenSet } from '../../src/sets/kitchen/index.ts';
import { BOWL, BOWL_SOCKET_FRAMES, HAZARDS, TAP } from '../../src/sets/kitchen/data.ts';
import { kitchenSetPlacement, transformByPlacement } from '../../src/world/setPlacement.ts';
import { setPlacementGuard } from '../../src/boot.ts';

beforeAll(() => initRapier());

const LADDER: readonly KitchenLevel[] = [KITCHEN01, KITCHEN02, KITCHEN03, KITCHEN04, KITCHEN05, KITCHEN_SANDBOX];

/** The hashes the ladder carried INTO this seam (measured on the pre-wiring
 *  tree, `stage 3: systems engineer - level↔set wiring`). If the wiring — the
 *  set mount, the L03 socket seating, the guard — ever starts perturbing a
 *  run, one of these pins breaks.
 *
 *  RE-MEASURED at the L01 promise fix (stage 3): the shared `KITCHEN_GAP`
 *  geometry was re-authored, so the par replays of every rung that chains the
 *  shared gap (L01-L04, sandbox) legitimately moved. `kitchen05` is the
 *  control: it pins the original gap numbers in its own file and its hash is
 *  byte-for-byte the pre-wiring one. See the session log
 *  `2026-10-05 Stage 3 - L01 promise fix`.
 *
 *  RE-MEASURED AGAIN at the stage-3 LADDER COHERENCE pass: L02, L03 and the
 *  sandbox each chained TWO different `straight` lengths, a geometry the tray
 *  cannot place at all (one geometry per kind — Concepts/Levels §The data
 *  model), so each now runs ONE straight size. `kitchen01` (untouched by
 *  design), `kitchen04` (a straight-length change that lands between two hash
 *  samples — same sampled states, finish 0.05 s earlier) and `kitchen05`
 *  (never used two geometries) are byte-for-byte the pins above; three rows
 *  moved and only three. See the session log
 *  `2026-10-05 Stage 3 - ladder coherence`. */
const PINNED: Record<string, string> = {
  kitchen01: 'd32417dc',
  // kitchen02 re-pinned at the stage-4 L02 DISCOVERABILITY pass: the tray is
  // now the two lines' union (0.09 m straights, L02-local lip/drop geometry,
  // shorter gap), so its par replay legitimately moved. Re-pinned AGAIN at
  // the stage-4 FAIL-TIMING pass (short steep chute, 0.11 m straights, the
  // 0.10 m drop step — see `2026-10-09 Stage 4 - L02 second pass`).
  // `kitchen01`/`04`/`05` are untouched controls. See the session log
  // `2026-10-08 Stage 4 - L02 discoverability`.
  kitchen02: '0b4dbab2',
  // kitchen03 re-pinned at the stage-5 K3 RE-SWEEP pass (playtests AA+BB):
  // the rung moved to the fail-timing geometry (−29° chute, 0.22 m
  // equality-law straights, the 0.10 m drop step, the shallow sink). The
  // bowl rim fixtures ride the set sockets UNCHANGED; the timed chain
  // legitimately moved. See `2026-10-10 Stage 5 - K3 re-sweep`.
  kitchen03: '006b16e1',
  kitchen04: 'c6a63a80',
  kitchen05: '1d8d1713',
  'kitchen-sandbox': '7f008f48',
};

describe('physics neutrality of the set wiring', () => {
  for (const level of LADDER) {
    it(`${level.id}: the par build replays at the pre-wiring hash`, async () => {
      const run = await replayRun(level, level.parBuild());
      expect(run.status).toBe('finished');
      expect(run.hash).toBe(PINNED[level.id]);
    }, 30_000);
  }

  it('a visual World (scene + meshes) hashes exactly like the headless one', async () => {
    const visual = await World.create(KITCHEN01, KITCHEN01.parBuild(), { visuals: true });
    const plain = await World.create(KITCHEN01, KITCHEN01.parBuild(), { visuals: false });
    visual.launch();
    plain.launch();
    while (visual.status === 'running' && visual.stepCount < 15 * 120) {
      visual.step();
      plain.step();
    }
    expect(visual.hashHex()).toBe(plain.hashHex());
    expect(visual.hashHex()).toBe(PINNED.kitchen01);
    visual.dispose();
    plain.dispose();
  }, 30_000);
});

describe('the placement table is the rule, not a vibe', () => {
  it('standard levels: counter 5 mm under the finish deck, centred under the run, off-axis', async () => {
    for (const level of LADDER.filter((l) => l.id !== 'kitchen04')) {
      const build = level.parBuild();
      const cup = build.pieces.find((p) => p.def === 'finishCup')!;
      const [cupIn] = PIECES.finishCup.sockets(cup.params);
      const cupPos = transformSocket(cupIn, cup.transform).pos;
      const rig = new KitRig(build, 1);
      const cupStart = rig.starts[build.pieces.indexOf(cup)]!;
      // the run, not the rim: the timed rail up to the finish cup
      let minX = Infinity;
      let maxX = -Infinity;
      for (let s = 0; s <= cupStart; s += 0.01) {
        const p = rig.frameAt(s).pos;
        minX = Math.min(minX, p.x);
        maxX = Math.max(maxX, p.x);
      }
      const p = kitchenSetPlacement(level.id)!;
      expect(p.yaw, level.id).toBe(0);
      expect(p.position[1], `${level.id} deck`).toBeCloseTo(cupPos.y + 0.005, 3);
      expect(p.position[0], `${level.id} centre x`).toBeCloseTo((minX + maxX) / 2, 2);
      expect(p.position[2], `${level.id} axis offset`).toBeCloseTo(0.45, 9);
    }
  });

  it('L04: the placed tap drip lands on the ground build\'s decked-sink seam', async () => {
    const p = kitchenSetPlacement('kitchen04')!;
    const seam = new KitRig(kitchen04GroundBuild(), 1).frameAt(new KitRig(kitchen04GroundBuild(), 1).starts[2]!).pos;
    const [dx, dy, dz] = transformByPlacement(p, TAP.drip[0], TAP.drip[1], TAP.drip[2]);
    expect(dx).toBeCloseTo(seam.x, 3);
    expect(dz).toBeCloseTo(seam.z, 3);
    // the drip hangs ABOVE the deck it drips onto (the EA measured the spout
    // too low to drip over the deck; the fix seats the props, not the solver)
    expect(dy).toBeGreaterThan(seam.y);
    expect(dy - seam.y).toBeLessThan(0.05);
  });

  it('L04 tap ↔ wet patch: drips land IN the authored zone footprint', async () => {
    const p = kitchenSetPlacement('kitchen04')!;
    const zone = KITCHEN04.hazards![0]!;
    const [dx, , dz] = transformByPlacement(p, TAP.drip[0], TAP.drip[1], TAP.drip[2]);
    expect(Math.abs(dx - zone.center.x)).toBeLessThan(zone.radius * 0.25);
    expect(Math.abs(dz - zone.center.z)).toBeLessThan(zone.radius * 0.25);
    // and the set's own hazard record, placed, agrees with the level's data
    const placed = transformByPlacement(p, HAZARDS.tapSplash.center.x, HAZARDS.tapSplash.center.y, HAZARDS.tapSplash.center.z);
    expect(placed[0]).toBeCloseTo(zone.center.x, 3);
    expect(placed[1]).toBeCloseTo(zone.center.y, 3);
    expect(placed[2]).toBeCloseTo(zone.center.z, 3);
    expect(zone.source).toBe(HAZARDS.tapSplash.source);
    expect(zone.radius).toBe(HAZARDS.tapSplash.radius);
    expect(zone.gripFactor).toBe(HAZARDS.tapSplash.gripFactor);
  });

  it('props clear the corridor every level builds through (bowl, tap, book stack)', async () => {
    const set = buildKitchenSet(THREE);
    for (const level of LADDER) {
      const p = kitchenSetPlacement(level.id)!;
      set.group.position.set(...p.position);
      set.group.rotation.set(0, p.yaw, 0);
      set.group.updateMatrixWorld(true);
      const props: Array<[string, THREE.Vector3, number]> = [
        // [name, world centre, forbidden radius around the rail]
        ['bowl', new THREE.Vector3(...transformByPlacement(p, BOWL.position[0], 0, BOWL.position[2])), 0.125],
        ['book-stack', new THREE.Vector3(), 0.12],
      ];
      if (level.id !== 'kitchen04') {
        props.push(['tap', new THREE.Vector3(...transformByPlacement(p, TAP.position[0], 0, TAP.position[2])), 0.05]);
      }
      const stack = set.group.getObjectByName('book-stack');
      expect(stack, `${level.id}: set carries a book stack`).toBeTruthy();
      stack!.getWorldPosition(props[1]![1]);
      const rig = new KitRig(level.parBuild(), 1);
      const build = level.parBuild();
      for (const [name, center, radius] of props) {
        for (let s = 0; s <= rig.length; s += 0.02) {
          // L03's rim fixtures ride the bowl ON PURPOSE — the bank/curve arc
          // is the rim; only the timed line must clear it
          const i = rig.starts.findLastIndex((x) => x <= s);
          if (name === 'bowl' && (build.pieces[i]?.def === 'bank' || build.pieces[i]?.def === 'curve')) continue;
          const q = rig.frameAt(s).pos;
          const d = Math.hypot(q.x - center.x, q.y - center.y, q.z - center.z);
          expect(d, `${level.id}: rail point ${s.toFixed(2)} vs ${name} at ${center.toArray().map((n) => n.toFixed(2))}`)
            .toBeGreaterThan(radius);
        }
      }
    }
  });
});

describe("L03's bowl is the set's bowl", () => {
  it('the rim fixtures seat THROUGH the placed set sockets', () => {
    const p = kitchenSetPlacement('kitchen03')!;
    const build = KITCHEN03.parBuild();
    const bank = build.pieces.find((piece) => piece.def === 'bank')!;
    const curve = build.pieces.find((piece) => piece.def === 'curve')!;
    const [, bankOut] = PIECES.bank.sockets(bank.params);
    const [, curveOut] = PIECES.curve.sockets(curve.params);
    const socketWorld = (local: typeof bankOut, m: THREE.Matrix4) => transformSocket(local, m);

    const inWorld = socketWorld(bankOut, bank.transform);
    const outWorld = socketWorld(curveOut, curve.transform);
    for (const [name, socket] of [
      ['bowl.in', inWorld],
      ['bowl.out', outWorld],
    ] as const) {
      const frame = BOWL_SOCKET_FRAMES[name];
      const [x, y, z] = transformByPlacement(p, frame.pos[0], frame.pos[1], frame.pos[2]);
      expect(socket.pos.distanceTo(new THREE.Vector3(x, y, z)), name).toBeLessThan(1e-9);
    }
    // the exported propSockets ARE those placed frames (the convention, now
    // sourced from the set instead of derived from the chain)
    for (const name of ['bowl.in', 'bowl.out'] as const) {
      const [x, y, z] = transformByPlacement(p, BOWL_SOCKET_FRAMES[name].pos[0], BOWL_SOCKET_FRAMES[name].pos[1], BOWL_SOCKET_FRAMES[name].pos[2]);
      expect(KITCHEN03.propSockets![name]!.pos.distanceTo(new THREE.Vector3(x, y, z))).toBeLessThan(1e-9);
    }
    // and the fixture parameters are still the rim's arc numbers
    expect(bank.params).toMatchObject(KITCHEN03_BOWL.bank);
    expect(curve.params).toMatchObject(KITCHEN03_BOWL.counter);
  });
});

describe('the builder placement guard', () => {
  it('boxes the set\'s solid props and skips the films', () => {
    const p = kitchenSetPlacement('kitchen01')!;
    const set = buildKitchenSet(THREE);
    set.group.position.set(...p.position);
    set.group.rotation.set(0, p.yaw, 0);
    const boxes = setPlacementGuard(set.group);
    expect(boxes.length).toBeGreaterThanOrEqual(8);
    for (const b of boxes) {
      expect(b.isEmpty()).toBe(false);
      expect(Number.isFinite(b.min.x + b.min.y + b.min.z + b.max.x + b.max.y + b.max.z)).toBe(true);
    }
    // the wet-patch films are never solids: no guard box centres on the
    // placed hazard footprint
    const zone = transformByPlacement(p, HAZARDS.tapSplash.center.x, 0, HAZARDS.tapSplash.center.z);
    for (const b of boxes) {
      const c = b.getCenter(new THREE.Vector3());
      const onPatch = Math.hypot(c.x - zone[0], c.z - zone[2]) < HAZARDS.tapSplash.radius;
      if (onPatch) expect(b.max.y - b.min.y, 'a film must not be a guard solid').toBeGreaterThan(0.004);
    }
  });

  it('no built chain sits inside a solid — shipped builds stay placeable', async () => {
    const set = buildKitchenSet(THREE);
    for (const level of LADDER) {
      const p = kitchenSetPlacement(level.id)!;
      set.group.position.set(...p.position);
      set.group.rotation.set(0, p.yaw, 0);
      const boxes = setPlacementGuard(set.group);
      const rig = new KitRig(level.parBuild(), 1);
      const build = level.parBuild();
      for (let s = 0; s <= rig.length; s += 0.02) {
        // L03's rim fixtures ARE the bowl rim by contract — skip that piece
        const i = rig.starts.findLastIndex((x) => x <= s);
        if (build.pieces[i]?.def === 'bank' || build.pieces[i]?.def === 'curve') continue;
        const q = rig.frameAt(s).pos;
        expect(boxes.some((b) => b.containsPoint(q)), `${level.id}: rail ${s.toFixed(2)} inside a set solid`).toBe(false);
      }
    }
  }, 30_000);
});
