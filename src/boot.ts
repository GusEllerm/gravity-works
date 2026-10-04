/**
 * The browser game shell (stage 2: plain materials, no styled UI). One call,
 * `boot(root)`, and either of two pages:
 *
 * - The game: the level's placeholder build reified into a `World`, a fixed
 *   timestep loop (never a variable step) with renderer interpolation —
 *   the renderer reads only the last two `state()` snapshots and the leftover
 *   fraction as alpha — plus the builder tray. Launch re-launches the run
 *   where it stands; editing the build rebuilds the world.
 * - A shared run: if the URL fragment carries a share payload (`#s=…`), the
 *   page replays it headlessly through `src/replay`, compares the recomputed
 *   hash to the embedded one and prints `verified` or `mismatch`. No camera,
 *   no canvas — the hash is the page.
 *
 * `?harness=1` is routed elsewhere (`src/main.ts`); nothing here runs then.
 */
import * as THREE from 'three';
import { FIXED_DT } from './physics/sim.ts';
import { FEELTRACK, getLevel } from './world/levels/feeltrack.level.ts';
import { World } from './world/world.ts';
import type { Build } from './track/build.ts';
import type { Level } from './world/level.ts';
import { createBuilder } from './ui/builder.ts';
import { parseShareUrl } from './share/share.ts';
import { replayRun } from './replay/replay.ts';
import { rememberBuild } from './save/save.ts';

export function boot(root: HTMLElement): void {
  // a bare fragment change is a new run request on a static host: reload into it
  window.addEventListener('hashchange', () => window.location.reload())
  const fragment = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : '';
  if (fragment.startsWith('s=')) {
    void bootSharedRun(root);
    return;
  }
  void bootGame(root, FEELTRACK);
}

function paragraph(id: string, parent: HTMLElement, role = 'status'): HTMLParagraphElement {
  const p = document.createElement('p');
  p.id = id;
  p.setAttribute('role', role);
  p.setAttribute('aria-live', 'polite');
  parent.appendChild(p);
  return p;
}

// ---- shared-run page --------------------------------------------------------

async function bootSharedRun(root: HTMLElement): Promise<void> {
  root.innerHTML = '<h1>Gravity Works — shared run</h1>';
  const status = paragraph('gw-replay-status', root);
  const computed = paragraph('gw-replay-hash', root, 'text');
  const embedded = paragraph('gw-replay-embedded', root, 'text');
  status.textContent = 'replaying…';
  try {
    const payload = await parseShareUrl(window.location.href);
    const level = getLevel(payload.levelId);
    embedded.textContent = `link hash ${payload.hash}`;
    const run = await replayRun(level, payload.build);
    computed.textContent = `replay hash ${run.hash}`;
    status.textContent = run.hash === payload.hash ? 'verified' : 'mismatch';
  } catch {
    status.textContent = 'invalid share link';
  }
}

// ---- game page --------------------------------------------------------------

async function bootGame(root: HTMLElement, level: Level): Promise<void> {
  root.innerHTML = '<h1>Gravity Works</h1>';
  const stage = document.createElement('div');
  stage.id = 'gw-stage';
  root.appendChild(stage);
  const builderHost = document.createElement('div');
  builderHost.id = 'gw-builder-host';
  root.appendChild(builderHost);
  const statusLine = paragraph('gw-status', root);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(960, 540);
  renderer.domElement.id = 'gw-canvas';
  stage.appendChild(renderer.domElement);
  const camera = new THREE.PerspectiveCamera(35, 960 / 540, 0.01, 20);

  let world: World | null = null;
  let acc = 0;

  const builder = createBuilder(builderHost, {
    level,
    build: level.placeholderBuild(),
    onChange: (build) => {
      rememberBuild(build);
      void rebuild(build);
    },
  });
  builder.attachCanvas(renderer.domElement);
  builder.elements.launch.addEventListener('click', () => {
    acc = 0;
    world?.launch();
  });

  async function rebuild(build: Build): Promise<void> {
    const next = await World.create(level, build, { visuals: true });
    world?.dispose();
    world = next;
    builder.setScene(next.scene);
    const box = new THREE.Box3().setFromObject(next.scene ?? new THREE.Object3D());
    const center = box.isEmpty() ? new THREE.Vector3() : box.getCenter(new THREE.Vector3());
    const span = box.isEmpty() ? 0.5 : Math.max(...box.getSize(new THREE.Vector3()).toArray());
    const d = Math.max(1.2, span * 1.4);
    camera.position.set(center.x + d * 0.7, center.y + d * 0.55, center.z + d * 0.9);
    camera.lookAt(center);
    statusLine.textContent = 'ready';
  }

  await rebuild(level.placeholderBuild());

  let last = performance.now();
  const frame = (now: number): void => {
    requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, 0.25);
    last = now;
    const w = world;
    if (!w || !w.scene) return;
    if (w.status === 'running') {
      acc += dt;
      let steps = 0;
      while (acc >= FIXED_DT && steps < 24 && w.status === 'running') {
        w.step();
        acc -= FIXED_DT;
        steps += 1;
      }
      if (w.status !== 'running') acc = 0;
    }
    const pose = w.carPose(w.status === 'running' ? acc / FIXED_DT : 0);
    if (w.carMesh) {
      w.carMesh.position.set(pose.pos.x, pose.pos.y, pose.pos.z);
      w.carMesh.quaternion.set(pose.quat.x, pose.quat.y, pose.quat.z, pose.quat.w);
    }
    statusLine.textContent = runStatusLine(w, builder.build().pieces.length);
    renderer.render(w.scene, camera);
  };
  requestAnimationFrame(frame);
}

/** Plain-text run status; the aria-live line the run reports through. */
export function runStatusLine(world: World, pieces: number): string {
  const t = `${world.time.toFixed(2)}s`;
  switch (world.status) {
    case 'idle':
      return `ready — ${pieces} pieces`;
    case 'running':
      return `running — ${t} — hash ${world.hashHex()}`;
    case 'finished':
      return `finished — ${t} — ${pieces} pieces — hash ${world.hashHex()}`;
    case 'fell':
      return `fell off the set — ${t} — hash ${world.hashHex()}`;
    case 'stalled':
      return `stalled — ${t} — hash ${world.hashHex()}`;
    case 'timeout':
      return `timed out — ${t} — hash ${world.hashHex()}`;
  }
}
