/**
 * The builder UI (brief §9.1): a piece tray of the 13 kit kinds, socket
 * snapping through `snap.ts`, a translucent ghost, remove + a live piece
 * counter. It is deliberately plain DOM — real `<button>`s with names and
 * roles, aria-live status text — so stage 6's a11y pass extends it instead
 * of rebuilding it, and so Playwright has stable selectors to poke.
 *
 * Placement model (v1 of the builder, and the honest one): the track is a
 * graph of sockets; the open ones are the places a piece can go. Arrows pick
 * an open socket, `R` toggles forward/reverse seating, Enter or a click
 * places. Forward seating is the contract's `fitSocket` (exact seating); the
 * ghost colour reports the `snapSocket` gate (green = it passes, amber = a
 * reverse-mounted seat, red = neither). Reverse seating rotates the piece a
 * half turn about the socket's up axis, so its deck line still matches the
 * target's — the same transform trick the feel track's launch ramp uses.
 *
 * The builder owns no physics. On every change it hands the new `Build` to
 * `onChange`; the game shell rebuilds the `World` (see `src/boot.ts`).
 */
import * as THREE from 'three';
import { canonicalBuild, fitSocket, snapSocket } from '../track/snap.ts';
import { PIECES, PIECE_KINDS, pieceGeometries, type PieceKind } from '../track/pieces.ts';
import { transformSocket, type Socket } from '../track/socket.ts';
import type { Build, PlacedPiece } from '../track/build.ts';
import type { Level } from '../world/level.ts';

/** Two socket origins this close are joined (metres; well above float noise). */
export const JOIN_TOL = 0.004;

export type GhostState = 'hidden' | 'snapped' | 'seated' | 'invalid';

export interface BuilderOptions {
  level: Level;
  /** The starting build (usually the level's placeholder or a saved one). */
  build?: Build;
  /** Called after every mutation with the canonical new build. */
  onChange?: (build: Build) => void;
}

export interface BuilderElements {
  root: HTMLElement;
  tray: HTMLElement;
  count: HTMLElement;
  ghostState: HTMLElement;
  targetLabel: HTMLElement;
  place: HTMLButtonElement;
  rotate: HTMLButtonElement;
  remove: HTMLButtonElement;
  launch: HTMLButtonElement;
}

export interface Builder {
  elements: BuilderElements;
  build(): Build;
  /** Move the ghost into a (re)built world's scene. Null hides it. */
  setScene(scene: THREE.Scene | null): void;
  /** Attach the game canvas: clicking it places the held piece. */
  attachCanvas(canvas: HTMLElement): void;
  setKind(kind: PieceKind | null): void;
  cycleKind(delta: number): void;
  cycleTarget(delta: number): void;
  rotate(): void;
  place(): boolean;
  removeLast(): boolean;
  kind(): PieceKind | null;
  ghost(): GhostState;
}

interface Target {
  socket: Socket;
  label: string;
}

function button(id: string, label: string, parent: HTMLElement): HTMLButtonElement {
  const b = document.createElement('button');
  b.id = id;
  b.type = 'button';
  b.textContent = label;
  parent.appendChild(b);
  return b;
}

export function createBuilder(host: HTMLElement, options: BuilderOptions): Builder {
  const { level } = options;
  let pieces: PlacedPiece[] = canonicalBuild(
    (options.build ?? { levelId: level.id, pieces: [], seed: level.seed }).pieces,
  ).map((p, i) => ({ ...p, seq: i }));
  let kind: PieceKind | null = null;
  let flipped = false;
  let targetIndex = 0;
  let state: GhostState = 'hidden';

  // ---- DOM ---------------------------------------------------------------
  const root = document.createElement('div');
  root.id = 'gw-builder';
  root.tabIndex = 0;
  root.setAttribute('role', 'group');
  root.setAttribute('aria-label', 'Track builder');

  const tray = document.createElement('div');
  tray.id = 'gw-tray';
  tray.setAttribute('role', 'toolbar');
  tray.setAttribute('aria-label', 'Piece tray');
  tray.setAttribute('aria-orientation', 'horizontal');
  root.appendChild(tray);
  const trayButtons = new Map<PieceKind, HTMLButtonElement>();
  for (const k of PIECE_KINDS) {
    const b = button(`gw-tray-${k}`, k, tray);
    b.dataset.kind = k;
    b.setAttribute('aria-label', `Hold the ${k} piece`);
    b.setAttribute('aria-pressed', 'false');
    b.addEventListener('click', () => setKind(k));
    b.addEventListener('mouseenter', () => setKind(k));
    trayButtons.set(k, b);
  }

  const controls = document.createElement('div');
  controls.id = 'gw-controls';
  root.appendChild(controls);
  const placeBtn = button('gw-place', 'Place', controls);
  const rotateBtn = button('gw-rotate', 'Rotate (R)', controls);
  const remove = button('gw-remove-piece', 'Remove piece', controls);
  const launch = button('gw-launch', 'Launch', controls);
  const count = document.createElement('p');
  count.id = 'gw-piece-count';
  count.setAttribute('aria-live', 'polite');
  root.appendChild(count);
  const ghostState = document.createElement('p');
  ghostState.id = 'gw-ghost-state';
  ghostState.setAttribute('aria-live', 'polite');
  root.appendChild(ghostState);
  const targetLabel = document.createElement('p');
  targetLabel.id = 'gw-target-label';
  targetLabel.setAttribute('aria-live', 'polite');
  root.appendChild(targetLabel);

  host.appendChild(root);

  // ---- ghost -------------------------------------------------------------
  const ghostGroup = new THREE.Group();
  ghostGroup.name = 'builder-ghost';
  ghostGroup.matrixAutoUpdate = false;
  ghostGroup.visible = false;
  const ghostMaterial = new THREE.MeshBasicMaterial({
    color: 0x2fbf71,
    transparent: true,
    opacity: 0.4,
    depthWrite: false,
  });
  let ghostKind: PieceKind | null = null;
  let scene: THREE.Scene | null = null;

  function rebuildGhostGeometry(): void {
    if (ghostKind === kind) return;
    for (const child of [...ghostGroup.children]) {
      if (child instanceof THREE.Mesh) child.geometry.dispose();
      ghostGroup.remove(child);
    }
    if (kind) {
      for (const geo of pieceGeometries(kind)) {
        ghostGroup.add(new THREE.Mesh(geo, ghostMaterial));
      }
    }
    ghostKind = kind;
  }

  // ---- socket graph ------------------------------------------------------

  function pieceSockets(piece: PlacedPiece): [Socket, Socket] {
    const [a, b] = PIECES[piece.def].sockets(piece.params);
    return [transformSocket(a, piece.transform), transformSocket(b, piece.transform)];
  }

  function targets(): Target[] {
    const all = pieces.map((p) => ({ piece: p, sockets: pieceSockets(p) }));
    const out: Target[] = [];
    const startTaken = all.some(({ sockets }) =>
      sockets.some((s) => s.pos.distanceTo(level.startSocket.pos) < JOIN_TOL),
    );
    if (!startTaken) out.push({ socket: level.startSocket, label: 'level start' });
    for (const { piece, sockets } of all) {
      const [, exit] = sockets;
      const taken = all.some(
        (other) =>
          other.piece.seq !== piece.seq &&
          other.sockets.some((s) => s.pos.distanceTo(exit.pos) < JOIN_TOL),
      );
      if (!taken) out.push({ socket: exit, label: `end of ${piece.def}` });
    }
    return out;
  }

  function placement(target: Socket, held: PieceKind): THREE.Matrix4 {
    const [heldIn] = PIECES[held].sockets(PIECES[held].params);
    const seat = fitSocket(target, heldIn);
    if (!flipped) return seat;
    const axis = target.up.clone().normalize();
    const flip = new THREE.Matrix4()
      .makeTranslation(target.pos.x, target.pos.y, target.pos.z)
      .multiply(new THREE.Matrix4().makeRotationAxis(axis, Math.PI))
      .multiply(new THREE.Matrix4().makeTranslation(-target.pos.x, -target.pos.y, -target.pos.z));
    return flip.multiply(seat);
  }

  function updateGhost(): void {
    rebuildGhostGeometry();
    const list = targets();
    if (targetIndex >= list.length) targetIndex = Math.max(0, list.length - 1);
    targetLabel.textContent = kind
      ? list.length > 0
        ? `target: ${list[targetIndex]!.label}`
        : 'target: none'
      : '';
    if (!kind || list.length === 0 || !scene) {
      state = 'hidden';
      ghostGroup.visible = false;
    } else {
      const target = list[targetIndex]!.socket;
      const m = placement(target, kind);
      ghostGroup.matrix.copy(m);
      ghostGroup.visible = true;
      const seated = transformSocket(PIECES[kind].sockets(PIECES[kind].params)[0], m);
      state = snapSocket(target, seated) !== null ? 'snapped' : flipped ? 'seated' : 'invalid';
      ghostMaterial.color.set(state === 'snapped' ? 0x2fbf71 : state === 'seated' ? 0xffb627 : 0xd7263d);
    }
    ghostState.textContent = state;
    count.textContent = `${pieces.length} / ${level.budget} pieces`;
    for (const [k, b] of trayButtons) b.setAttribute('aria-pressed', String(k === kind));
    placeBtn.setAttribute('aria-disabled', String(!(kind && targets().length > 0 && pieces.length < level.budget)));
  }

  function emit(): void {
    options.onChange?.({
      levelId: level.id,
      pieces: pieces.map((p, i) => ({ ...p, seq: i })),
      seed: level.seed,
    });
  }

  // ---- actions -----------------------------------------------------------

  function setKind(next: PieceKind | null): void {
    kind = next;
    updateGhost();
  }

  function cycleKind(delta: number): void {
    if (!kind) setKind(PIECE_KINDS[0]!);
    else {
      const i = (PIECE_KINDS.indexOf(kind) + delta + PIECE_KINDS.length) % PIECE_KINDS.length;
      setKind(PIECE_KINDS[i]!);
    }
  }

  function cycleTarget(delta: number): void {
    const n = targets().length;
    if (n === 0) return;
    targetIndex = (targetIndex + delta + n) % n;
    updateGhost();
  }

  function rotate(): void {
    flipped = !flipped;
    updateGhost();
  }

  function place(): boolean {
    const list = targets();
    if (!kind || list.length === 0) return false;
    if (pieces.length >= level.budget) {
      ghostState.textContent = 'out of budget';
      return false;
    }
    const target = list[targetIndex]!.socket;
    pieces = [
      ...pieces,
      { def: kind, params: { ...PIECES[kind].params }, transform: placement(target, kind), seq: pieces.length },
    ];
    updateGhost();
    emit();
    return true;
  }

  function removeLast(): boolean {
    if (pieces.length === 0) return false;
    pieces = pieces.slice(0, -1).map((p, i) => ({ ...p, seq: i }));
    updateGhost();
    emit();
    return true;
  }

  // ---- wiring ------------------------------------------------------------

  placeBtn.addEventListener('click', () => place());
  rotateBtn.addEventListener('click', () => rotate());
  remove.addEventListener('click', () => removeLast());
  root.addEventListener('keydown', (ev) => {
    const keys: Record<string, () => void> = {
      ArrowRight: () => cycleTarget(1),
      ArrowLeft: () => cycleTarget(-1),
      ArrowUp: () => cycleKind(1),
      ArrowDown: () => cycleKind(-1),
      r: () => rotate(),
      R: () => rotate(),
      Enter: () => place(),
      Delete: () => removeLast(),
      Backspace: () => removeLast(),
    };
    const fn = keys[ev.key];
    if (fn) {
      ev.preventDefault();
      fn();
    }
  });

  updateGhost();

  return {
    elements: { root, tray, count, ghostState, targetLabel, place: placeBtn, rotate: rotateBtn, remove, launch },
    build: () => ({ levelId: level.id, pieces: canonicalBuild(pieces.map((p, i) => ({ ...p, seq: i }))), seed: level.seed }),
    setScene(next) {
      scene = next;
      if (next) next.add(ghostGroup);
      updateGhost();
    },
    attachCanvas(canvas) {
      canvas.addEventListener('click', () => {
        if (kind) place();
      });
    },
    setKind,
    cycleKind,
    cycleTarget,
    rotate,
    place,
    removeLast,
    kind: () => kind,
    ghost: () => state,
  };
}
