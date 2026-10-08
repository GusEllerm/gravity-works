/**
 * The share card (brief §8 "the share card is a Canvas PNG with a render
 * from the hero camera, the time, the stars and the URL"; §9.4: a finished
 * run can be exported as one).
 *
 * `generateShareCard(state)` renders the final build state — the same
 * `buildTrackMeshes` the game page shows — into an offscreen WebGL canvas
 * from a hero framing, composites a warm-paper caption strip over it in a
 * 2D canvas (time, stars, URL, verified mark) and resolves a PNG `Blob`.
 *
 * "Hero camera", honestly: `src/dev/cameras.ts`'s hero rig is a fixed
 * provisional *kitchen* framing (the bowl turn). A share card carries an
 * arbitrary build on an arbitrary level, so `heroCameraFor` keeps the hero
 * RIG's direction, fov and three-quarter-above attitude and scales the
 * distance to the build's own bounding box — the same framing rule, applied
 * to the thing actually being shared. (Recorded in the Decision Log.)
 *
 * The pure half (`cardCaption`, `heroCameraFor`) is Node-testable;
 * `generateShareCard` needs a browser canvas and says so rather than
 * producing a blank PNG.
 */
import * as THREE from 'three';
import type { Build } from '../track/build.ts';
import { buildTrackMeshes } from '../world/world.ts';
import { LEVELS } from '../world/levels/feeltrack.level.ts';
import type { PieceKind } from '../track/pieces.ts';
import { starGlyphs, type StarCount } from '../world/stars.ts';

export const CARD_WIDTH = 1280;
export const CARD_HEIGHT = 720;

/** Everything the card shows. `scene` wins over `build` (live world state);
 * with neither, the build is reified through `buildTrackMeshes`. */
export interface ShareCardState {
  levelId: string;
  build?: Build;
  scene?: THREE.Scene;
  /** Run time in seconds (0 for a never-run build). */
  time: number;
  stars: StarCount;
  url: string;
  /** Share-link verification, shown when the card comes from a share page. */
  verified?: boolean;
}

/** The caption line — stars via the one star readout the result panel uses.
 *  The rung's NAME (registry truth, as the level select prints it), never
 *  the codename — a card a friend reads must read as a place, not an id. */
export function cardCaption(state: ShareCardState): string {
  const t = `${Math.max(0, state.time).toFixed(2)} s`;
  const rung = LEVELS[state.levelId]?.name ?? state.levelId;
  return `Gravity Works — ${rung} — ${t} — ${starGlyphs(state.stars)}${
    state.verified === undefined ? '' : state.verified ? ' — verified' : ' — hash mismatch'
  }`;
}

/** Hero-direction framing of an arbitrary object (see header note). */
export function heroCameraFor(target: THREE.Object3D): THREE.PerspectiveCamera {
  const box = new THREE.Box3().setFromObject(target);
  const center = box.isEmpty() ? new THREE.Vector3(0, 0.05, 0) : box.getCenter(new THREE.Vector3());
  const size = box.isEmpty() ? new THREE.Vector3(0.5, 0.5, 0.5) : box.getSize(new THREE.Vector3());
  const span = Math.max(size.x, size.y, size.z, 0.2);
  const cam = new THREE.PerspectiveCamera(35, CARD_WIDTH / CARD_HEIGHT, 0.005, span * 30 + 10);
  // the hero rig's attitude: front-up-right three-quarter, orbit-style framed
  cam.position.set(center.x + span * 0.7, center.y + span * 0.55, center.z + span * 0.9);
  cam.lookAt(center);
  return cam;
}

function sceneFor(state: ShareCardState): { scene: THREE.Scene; subject: THREE.Object3D } {
  if (state.scene) return { scene: state.scene, subject: state.scene };
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#efe0c8'); // warm paper, never black
  scene.add(new THREE.AmbientLight(0xffffff, 0.85));
  const key = new THREE.DirectionalLight(0xffffff, 1.1);
  key.position.set(1, 2, 1.5);
  scene.add(key);
  if (state.build) {
    // the same fixture deck-inlay signal the game page shows, resolved from
    // the registered level's fixture table (absent table = plain render)
    const level = LEVELS[state.levelId] as unknown as
      | { fixtures?: Partial<Record<PieceKind, number>> }
      | undefined;
    const track = buildTrackMeshes(state.build, { fixtures: level?.fixtures });
    scene.add(track);
    return { scene, subject: track };
  }
  return { scene, subject: scene };
}

/**
 * Render + composite the card PNG. Browser-only.
 */
export async function generateShareCard(state: ShareCardState): Promise<Blob> {
  if (typeof document === 'undefined' || typeof HTMLCanvasElement === 'undefined') {
    throw new Error('generateShareCard: needs a browser canvas (run in the page, not in Node)');
  }
  const { scene, subject } = sceneFor(state);
  const gl = document.createElement('canvas');
  gl.width = CARD_WIDTH;
  gl.height = CARD_HEIGHT;
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: gl, antialias: true, preserveDrawingBuffer: true });
  } catch {
    throw new Error('generateShareCard: no WebGL in this browser');
  }
  renderer.setSize(CARD_WIDTH, CARD_HEIGHT, false);
  renderer.render(scene, heroCameraFor(subject));

  const out = document.createElement('canvas');
  out.width = CARD_WIDTH;
  out.height = CARD_HEIGHT;
  const ctx = out.getContext('2d');
  if (!ctx) throw new Error('generateShareCard: no 2D canvas');
  ctx.drawImage(gl, 0, 0);
  // caption strip: warm dark, tinted, never black, no drop shadow (§5.10)
  const stripH = Math.round(CARD_HEIGHT * 0.14);
  ctx.fillStyle = 'rgba(62,46,32,0.88)';
  ctx.fillRect(0, CARD_HEIGHT - stripH, CARD_WIDTH, stripH);
  ctx.fillStyle = '#fdf2e0';
  ctx.textBaseline = 'middle';
  ctx.font = `600 ${Math.round(stripH * 0.42)}px system-ui, sans-serif`;
  ctx.fillText(cardCaption(state), 24, CARD_HEIGHT - stripH * 0.62);
  ctx.font = `${Math.round(stripH * 0.26)}px system-ui, sans-serif`;
  ctx.fillStyle = '#e8cfa8';
  ctx.fillText(state.url, 24, CARD_HEIGHT - stripH * 0.24);
  renderer.dispose();

  return await new Promise<Blob>((resolve, reject) => {
    out.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('generateShareCard: PNG encode failed'))), 'image/png');
  });
}

/** Browser-only convenience: hand the user a PNG download. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
