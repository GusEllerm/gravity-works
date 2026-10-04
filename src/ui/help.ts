/**
 * The help drawer (brief §9.3: "a help drawer listing every piece and prop
 * unlocked, each with a tiny looping render of it doing its thing").
 *
 * The renders are ONE shared mini-harness canvas, not a renderer per entry:
 * a single WebGLRenderer draws every cell per frame using scissor/viewport
 * rects positioned over the list's `figure` boxes — thirteen GL contexts
 * would be a leak dressed as a feature. Each cell holds one entry's mesh
 * group spinning about y.
 *
 * Fixed clock (§5.7 stop-motion): the spin angle is `floor(t * 12)` steps of
 * a twelfth of a second, so the loop ticks at the world's ambient cadence
 * instead of sliding. Reduced motion (save setting or the media query)
 * renders one still frame at a fixed angle and starts no loop at all.
 *
 * The canvas is `preserveDrawingBuffer` so QA can read its pixels (the e2e
 * asserts the cells are not black); the drawer creates its renderer lazily
 * on first open, so a closed drawer costs nothing at boot.
 */
import * as THREE from 'three';
import { PIECE_KINDS, pieceGeometries } from '../track/pieces.ts';
import { GLOBAL_TOKENS } from '../render/tokens.ts';
import { calloutManifest } from './callouts.ts';

export interface HelpEntry {
  id: string;
  /** Display title: the piece kind, or the prop name after `prop:`. */
  title: string;
  /** The same one-line callout the first-sight system shows. */
  line: string;
}

export interface HelpOptions {
  /** Ids to list; defaults to the full manifest (every piece unlocked —
   * per-level unlock lists pass a subset once the level ladder ships). */
  unlocked?: string[];
  /** Override the reduced-motion decision (tests; else save + media query). */
  reducedMotion?: boolean;
}

export interface HelpDrawer {
  element: HTMLElement;
  toggle: HTMLButtonElement;
  entries: HelpEntry[];
  open(): void;
  close(): void;
  isOpen(): boolean;
  dispose(): void;
}

/** Fixed spin angle for the reduced-motion still frame (rad). */
export const STILL_ANGLE = 0.6;
/** Spinner step: 12 Hz cadence, one sixteenth of a turn per tick (§5.7). */
export const SPIN_STEP = (Math.PI * 2) / (16 * 12) * 12;

/** The spin angle at a wall-clock time, quantised to the 12 Hz cadence. */
export function spinAngle(elapsedSeconds: number): number {
  return Math.floor(elapsedSeconds * 12) * SPIN_STEP;
}

function reducedMotionDefault(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

interface Cell {
  entry: HelpEntry;
  group: THREE.Group;
  camera: THREE.PerspectiveCamera;
  center: THREE.Vector3;
  radius: number;
  figure: HTMLElement;
}

/** Build one entry's mesh group from its kit geometries (pieces only until
 * the set prop modules register props in the manifest). */
function entryGroup(id: string): THREE.Group | null {
  if (!PIECE_KINDS.includes(id as (typeof PIECE_KINDS)[number])) return null; // props render their own meshes when they land
  const group = new THREE.Group();
  const deck = new THREE.MeshLambertMaterial({ color: GLOBAL_TOKENS.trackOrange });
  for (const geo of pieceGeometries(id as (typeof PIECE_KINDS)[number])) {
    group.add(new THREE.Mesh(geo, deck));
  }
  group.add(ambientAndKey());
  return group;
}

function ambientAndKey(): THREE.Group {
  const g = new THREE.Group();
  g.add(new THREE.AmbientLight(0xffffff, 0.85));
  const key = new THREE.DirectionalLight(0xffffff, 1.1);
  key.position.set(1, 2, 1.5);
  g.add(key);
  return g;
}

/** Frame a camera on a bounding sphere, three-quarter from above (the card's
 * hero direction, scaled down to a cell). */
function frameCamera(center: THREE.Vector3, radius: number): THREE.PerspectiveCamera {
  const cam = new THREE.PerspectiveCamera(32, 1, 0.001, radius * 50 + 1);
  const d = radius * 3 + 0.02;
  const dir = new THREE.Vector3(0.9, 0.7, 1.3).normalize();
  cam.position.copy(center).addScaledVector(dir, d);
  cam.lookAt(center);
  return cam;
}

export function createHelpDrawer(host: HTMLElement, options: HelpOptions = {}): HelpDrawer {
  const manifest = calloutManifest().filter((e) => !options.unlocked || options.unlocked.includes(e.id));
  const entries: HelpEntry[] = manifest.map((e) => ({
    id: e.id,
    title: e.id.startsWith('prop:') ? e.id.slice(5) : e.id,
    line: e.text,
  }));
  const reduced = options.reducedMotion ?? reducedMotionDefault();

  // ---- DOM ------------------------------------------------------------------
  const wrap = document.createElement('div');
  wrap.id = 'gw-help';
  wrap.style.cssText = 'position:relative;font:14px/1.45 system-ui,sans-serif;margin-top:8px';

  const toggle = document.createElement('button');
  toggle.id = 'gw-help-toggle';
  toggle.type = 'button';
  toggle.textContent = 'Help';
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-controls', 'gw-help-list');
  wrap.appendChild(toggle);

  const list = document.createElement('ul');
  list.id = 'gw-help-list';
  list.hidden = true;
  list.style.cssText =
    'position:relative;list-style:none;margin:8px 0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:8px';
  const cells: Cell[] = [];
  for (const entry of entries) {
    const li = document.createElement('li');
    li.id = `gw-help-entry-${entry.id}`;
    li.style.cssText = 'display:flex;gap:8px;align-items:center';
    const figure = document.createElement('figure');
    figure.style.cssText = 'flex:none;width:120px;height:96px;margin:0';
    const text = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent = entry.title;
    const line = document.createElement('span');
    line.textContent = entry.line;
    text.append(title, document.createTextNode(' — '), line);
    li.append(figure, text);
    list.appendChild(li);

    const group = entryGroup(entry.id);
    if (group) {
      const box = new THREE.Box3().setFromObject(group);
      const center = box.isEmpty() ? new THREE.Vector3() : box.getCenter(new THREE.Vector3());
      const radius = box.isEmpty() ? 0.1 : Math.max(0.05, box.getSize(new THREE.Vector3()).length() / 2);
      // spin about the group's own centre: offset geometry via a pivot child
      const pivot = new THREE.Group();
      for (const child of [...group.children]) {
        if (child instanceof THREE.Mesh) {
          child.geometry.translate(-center.x, -center.y, -center.z);
        }
        group.remove(child);
        pivot.add(child);
      }
      group.add(pivot);
      group.userData.pivot = pivot;
      cells.push({ entry, group, camera: frameCamera(new THREE.Vector3(0, 0, 0), radius), center, radius, figure });
    }
  }

  const canvas = document.createElement('canvas');
  canvas.id = 'gw-help-canvas';
  canvas.style.cssText = 'position:absolute;inset:0;pointer-events:none';
  wrap.appendChild(list);
  list.appendChild(canvas);
  host.appendChild(wrap);

  // ---- the shared mini-harness ----------------------------------------------
  let renderer: THREE.WebGLRenderer | null = null;
  let raf = 0;
  let open = false;
  const startedAt = performance.now();

  function ensureRenderer(): THREE.WebGLRenderer | null {
    if (renderer) return renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
    } catch {
      return null; // no WebGL: the drawer stays a text list, which is honest
    }
    renderer.setClearColor('#efe0c8', 1); // warm paper, never black (§5.10)
    return renderer;
  }

  function drawCell(r: THREE.WebGLRenderer, cell: Cell, angle: number): void {
    const rect = cell.figure.getBoundingClientRect();
    const base = canvas.getBoundingClientRect();
    const sx = Math.round(rect.left - base.left);
    const sy = Math.round(rect.top - base.top);
    const w = Math.max(1, Math.round(rect.width));
    const h = Math.max(1, Math.round(rect.height));
    const W = rendererCanvasWidth(r, base);
    const H = rendererCanvasHeight(r, base);
    const kx = W / Math.max(1, base.width);
    const ky = H / Math.max(1, base.height);
    r.setViewport(sx * kx, H - (sy + h) * ky, w * kx, h * ky);
    r.setScissor(sx * kx, H - (sy + h) * ky, w * kx, h * ky);
    const pivot = cell.group.userData.pivot as THREE.Group | undefined;
    if (pivot) pivot.rotation.y = angle;
    r.render(cell.group, cell.camera);
  }

  function renderOnce(angle: number): void {
    const r = ensureRenderer();
    if (!r) return;
    const base = canvas.getBoundingClientRect();
    r.setSize(Math.max(1, Math.round(base.width)), Math.max(1, Math.round(base.height)), false);
    r.setScissorTest(false);
    r.clear();
    r.setScissorTest(true);
    for (const cell of cells) drawCell(r, cell, angle);
  }

  function tick(): void {
    if (!open) return;
    renderOnce(spinAngle((performance.now() - startedAt) / 1000));
    raf = requestAnimationFrame(tick);
  }

  toggle.addEventListener('click', () => (open ? close() : openDrawer()));

  function openDrawer(): void {
    open = true;
    list.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');
    cancelAnimationFrame(raf);
    if (reduced) {
      // still frames, no loop (§5.7 reduced motion)
      requestAnimationFrame(() => renderOnce(STILL_ANGLE));
    } else {
      raf = requestAnimationFrame(tick);
    }
  }

  function close(): void {
    open = false;
    list.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    cancelAnimationFrame(raf);
  }

  return {
    element: wrap,
    toggle,
    entries,
    open: openDrawer,
    close,
    isOpen: () => open,
    dispose() {
      close();
      renderer?.dispose();
      renderer = null;
      wrap.remove();
    },
  };
}

// The canvas backing store is width/height (setSize(...,false) keeps it at
// the render resolution); the figures are laid out in CSS px. Map between
// them with the element's client size.
function rendererCanvasWidth(r: THREE.WebGLRenderer, base: DOMRect): number {
  return r.domElement.width || Math.max(1, Math.round(base.width));
}
function rendererCanvasHeight(r: THREE.WebGLRenderer, base: DOMRect): number {
  return r.domElement.height || Math.max(1, Math.round(base.height));
}
