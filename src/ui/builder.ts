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
import { PIECES, PIECE_KINDS, pieceGeometries, type PieceKind, type PieceParams } from '../track/pieces.ts';
import { transformSocket, type Socket } from '../track/socket.ts';
import type { Build, PlacedPiece } from '../track/build.ts';
import type { Level } from '../world/level.ts';

/** Two socket origins this close are joined (metres; well above float noise). */
export const JOIN_TOL = 0.004;

export type GhostState = 'hidden' | 'snapped' | 'seated' | 'invalid' | 'blocked';

export interface BuilderOptions {
  level: Level;
  /** The starting build (usually the level's placeholder or a saved one). */
  build?: Build;
  /** Stage-3 tray gating (brief §9.3: a tutorial ships exactly its pieces):
   *  when the level declares a tray, kinds OUTSIDE it are locked (disabled
   *  buttons with a reason), a kind's placements are capped at its tray
   *  count, and the piece counter reports TRAY placements against the
   *  budget — built-in fixtures never count (the deployed-page "5 / 3
   *  pieces" bug). Omitted = every kind unlocked, `level.budget` alone caps
   *  (the feel-rig levels). */
  tray?: Partial<Record<PieceKind, number>>;
  /** Geometry of the tray pieces: the LEVEL's tuned parameters per kind
   *  (the kitchen authoring kit lays per-instance params; a tray button
   *  that placed kit DEFAULTS built a different gap than the one the
   *  level was par'd on — the built-it-and-it-fell bug). Absent = kit
   *  defaults (the feel-rig levels). */
  trayParams?: Partial<Record<PieceKind, PieceParams>>;
  /** Called after every mutation with the canonical new build. */
  onChange?: (build: Build) => void;
  /** Stage-3 set wiring: world-space AABBs of the set's solid props. A seat
   *  whose piece box overlaps one of them is REJECTED — the ghost goes red
   *  (`blocked`) and `place` refuses. Deliberately cheap: AABB-vs-AABB per
   *  ghost update, no mesh tests, nothing per frame. */
  solids?: readonly THREE.Box3[];
}

export interface BuilderElements {
  root: HTMLElement;
  tray: HTMLElement;
  count: HTMLElement;
  ghostState: HTMLElement;
  targetLabel: HTMLElement;
  /** The §9.3 teaching line shown while a piece is held and nothing has
   * been placed yet (playtest A: never learnt Place). */
  hint: HTMLElement;
  place: HTMLButtonElement;
  rotate: HTMLButtonElement;
  remove: HTMLButtonElement;
  /** Permanent visible control next to Launch: returns the CAR to the start
   * pose (the build untouched) — the missing "after a run, nothing brings
   * the view home" control (playtest C). */
  reset: HTMLButtonElement;
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
  /** Pieces the PLAYER has placed from the tray (fixtures excluded) — the
   *  number the counter, the budget gate and the result's piece tally use. */
  playerCount(): number;
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
  const solids = options.solids ?? [];
  const traySpec = options.tray;
  const trayParams = options.trayParams;
  /** The parameters a held kind is GHOSTED AND SEATED with: the tray's
   *  tuned set when the level ships one, kit defaults otherwise. */
  const heldParams = (k: PieceKind): PieceParams => trayParams?.[k] ?? PIECES[k].params;
  /** Kinds the tray allows at all; null = no tray, everything unlocked. */
  const trayKinds: Set<PieceKind> | null = traySpec
    ? new Set((Object.entries(traySpec) as [PieceKind, number][]).filter(([, n]) => (n ?? 0) > 0).map(([k]) => k))
    : null;
  /** How many of this kind the tray allows (null = no per-kind cap). */
  const allowance = (k: PieceKind): number | null =>
    trayKinds && trayKinds.has(k) ? (traySpec![k] ?? 0) : null;
  const placedOf = (k: PieceKind): number => pieces.filter((p) => p.def === k).length;
  /** Placements that count against the budget: tray pieces only (a level
   *  with no tray counts everything, the pre-kitchen behaviour). */
  const trayPlaced = (): number =>
    trayKinds ? pieces.filter((p) => trayKinds.has(p.def)).length : pieces.length;
  const locked = (k: PieceKind): boolean => trayKinds !== null && !trayKinds.has(k);
  const selectable = (k: PieceKind): boolean => {
    const cap = allowance(k);
    return !locked(k) && (cap === null || placedOf(k) < cap);
  };
  let pieces: PlacedPiece[] = canonicalBuild(
    (options.build ?? { levelId: level.id, pieces: [], seed: level.seed }).pieces,
  ).map((p, i) => ({ ...p, seq: i }));
  let kind: PieceKind | null = null;
  let flipped = false;
  let targetIndex = 0;
  let state: GhostState = 'hidden';
  // the teaching line persists until the FIRST successful place of the
  // session (a build that loads already-built starts without the hint)
  let everPlaced = trayPlaced() > 0;

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
    const b = button(`gw-tray-${k}`, traySpec && traySpec[k] ? `${k} ×${traySpec[k]}` : k, tray);
    b.dataset.kind = k;
    b.setAttribute('aria-label', `Hold the ${k} piece`);
    b.setAttribute('aria-pressed', 'false');
    b.addEventListener('click', () => {
      // a click on a locked or spent button must EXPLAIN itself (playtest C:
      // "clicking greyed booster left an unclear status")
      if (locked(k)) ghostState.textContent = `the ${k} is not in this level’s tray`;
      else if (!selectable(k)) ghostState.textContent = `no ${k} left in the tray`;
      else setKind(k);
    });
    b.addEventListener('mouseenter', () => {
      if (!locked(k)) setKind(k);
    });
    trayButtons.set(k, b);
  }

  const controls = document.createElement('div');
  controls.id = 'gw-controls';
  root.appendChild(controls);
  const placeBtn = button('gw-place', 'Place', controls);
  const rotateBtn = button('gw-rotate', 'Rotate (R)', controls);
  const remove = button('gw-remove-piece', 'Remove piece', controls);
  const resetBtn = button('gw-reset', 'Reset', controls);
  resetBtn.setAttribute('aria-label', 'Return the car to the start (the build stays as built)');
  const launch = button('gw-launch', 'Launch', controls);
  // the teaching line (near the tray, §9.3): while a piece is held and the
  // player has not placed anything yet, the HOW lives here — not buried in
  // Help below the fold (playtest A held a piece and never found Place)
  const hint = document.createElement('p');
  hint.id = 'gw-tray-hint';
  hint.setAttribute('aria-live', 'polite');
  hint.textContent = 'Move: drag or arrows · Place: Enter · Rotate: R';
  hint.hidden = true;
  root.appendChild(hint);
  // the VISIBLE reason behind every greyed/spent tray button (playtest C:
  // "state and appearance disagreed") — aria-describedby points the
  // disabled buttons at this on-screen line, not just a hover title
  const trayReason = document.createElement('p');
  trayReason.id = 'gw-tray-reason';
  trayReason.textContent = 'Greyed pieces are not in this level · the ×N pieces are yours · ×0 means all placed';
  root.appendChild(trayReason);
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
      for (const geo of pieceGeometries(kind, heldParams(kind))) {
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
    const [heldIn] = PIECES[held].sockets(heldParams(held));
    const seat = fitSocket(target, heldIn);
    if (!flipped) return seat;
    const axis = target.up.clone().normalize();
    const flip = new THREE.Matrix4()
      .makeTranslation(target.pos.x, target.pos.y, target.pos.z)
      .multiply(new THREE.Matrix4().makeRotationAxis(axis, Math.PI))
      .multiply(new THREE.Matrix4().makeTranslation(-target.pos.x, -target.pos.y, -target.pos.z));
    return flip.multiply(seat);
  }

  /** True when a placed piece's world AABB overlaps one of the set's solids.
   *  The ghost geometry is the piece geometry, so ghost and placement agree. */
  function overlapsSolid(transform: THREE.Matrix4, held: PieceKind): boolean {
    if (solids.length === 0) return false;
    const box = new THREE.Box3();
    for (const geo of pieceGeometries(held, heldParams(held))) {
      geo.computeBoundingBox();
      if (geo.boundingBox) box.union(geo.boundingBox.clone().applyMatrix4(transform));
    }
    if (box.isEmpty()) return false;
    // a hair of tolerance: a piece SEATED on a socket brushes neighbouring
    // geometry; only a real overlap (beyond 2 mm) is a collision
    box.expandByScalar(-0.002);
    return solids.some((s) => s.intersectsBox(box));
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
      const seated = transformSocket(PIECES[kind].sockets(heldParams(kind))[0], m);
      if (overlapsSolid(m, kind)) {
        // the set's solids outrank the socket graph: red ghost, no seat
        state = 'blocked';
      } else {
        state = snapSocket(target, seated) !== null ? 'snapped' : flipped ? 'seated' : 'invalid';
      }
      ghostMaterial.color.set(state === 'snapped' ? 0x2fbf71 : state === 'seated' ? 0xffb627 : 0xd7263d);
    }
    // the literal word "hidden" must never reach the screen (a11y pass):
    // the state line reads EMPTY when nothing is held/on
    ghostState.textContent = state === 'hidden' ? '' : state;
    count.textContent = `${trayPlaced()} / ${level.budget} pieces`;
    hint.hidden = everPlaced || kind === null;
    for (const [k, b] of trayButtons) {
      const cap = allowance(k);
      const left = cap === null ? null : Math.max(0, cap - placedOf(k));
      b.setAttribute('aria-pressed', String(k === kind));
      // aria-disabled (not `disabled`) keeps the button focusable so the
      // reason stays reachable; the reason is an ON-SCREEN line
      // (#gw-tray-reason) via aria-describedby — a hover title alone read
      // as "dead button with no story" (playtest C)
      const spent = locked(k) || left === 0;
      b.setAttribute('aria-disabled', String(spent));
      if (spent) b.setAttribute('aria-describedby', 'gw-tray-reason');
      else b.removeAttribute('aria-describedby');
      b.title = locked(k)
        ? 'not in this level’s tray'
        : left === 0
          ? `no ${k} left in the tray (${cap} placed)`
          : '';
    }
    placeBtn.setAttribute(
      'aria-disabled',
      String(
        !(kind && targets().length > 0 && trayPlaced() < level.budget &&
          (allowance(kind) === null || placedOf(kind) < allowance(kind)!)),
      ),
    );
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
    // walk the kit in `delta` steps, skipping tray-locked and exhausted
    // kinds (a tray level's ArrowUp never lands on an unreachable button)
    const wrap = (a: number): number => ((a % PIECE_KINDS.length) + PIECE_KINDS.length) % PIECE_KINDS.length;
    const start = kind ? PIECE_KINDS.indexOf(kind) : delta > 0 ? -1 : PIECE_KINDS.length;
    for (let i = 1; i <= PIECE_KINDS.length; i++) {
      const k = PIECE_KINDS[wrap(start + delta * i)]!;
      if (selectable(k)) {
        setKind(k);
        return;
      }
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
    if (trayPlaced() >= level.budget) {
      ghostState.textContent = 'out of budget';
      return false;
    }
    const cap = allowance(kind);
    if (cap !== null && placedOf(kind) >= cap) {
      ghostState.textContent = `no ${kind} left in the tray`;
      return false;
    }
    const target = list[targetIndex]!.socket;
    const transform = placement(target, kind);
    if (overlapsSolid(transform, kind)) {
      // the ghost is already red; say why, and refuse the seat
      ghostState.textContent = 'blocked';
      return false;
    }
    pieces = [
      ...pieces,
      { def: kind, params: { ...heldParams(kind) }, transform, seq: pieces.length },
    ];
    everPlaced = true;
    updateGhost();
    emit();
    return true;
  }

  function removeLast(): boolean {
    if (pieces.length === 0) return false;
    // tray gating: the level's BUILT-IN fixtures are not the player's
    // pieces — Remove deletes the last TRAY placement, never a fixture
    let i = pieces.length - 1;
    if (trayKinds) {
      while (i >= 0 && !trayKinds.has(pieces[i]!.def)) i -= 1;
      if (i < 0) return false;
    }
    pieces = pieces.filter((_, j) => j !== i).map((p, j) => ({ ...p, seq: j }));
    // removing back to an empty board re-lights the teaching line (§9.3: it
    // persists until a FIRST successful place — the lesson is not learned
    // if the player removed everything they ever placed)
    everPlaced = trayPlaced() > 0;
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
    elements: { root, tray, count, ghostState, targetLabel, hint, place: placeBtn, rotate: rotateBtn, remove, reset: resetBtn, launch },
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
    playerCount: () => trayPlaced(),
    kind: () => kind,
    ghost: () => state,
  };
}
