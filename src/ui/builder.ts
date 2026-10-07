/**
 * The builder UI (brief §9.1): a piece tray, socket snapping through
 * `snap.ts`, a translucent ghost, remove and a live piece counter. Plain
 * DOM — real `<button>`s with names and roles, aria-live status text — so
 * stage 6's a11y pass extends it instead of rebuilding it, and so Playwright
 * has stable selectors to poke.
 *
 * FOCUS POLICY (v3, playtests P+Q: "Enter re-picks the last-focused
 * button", "Rotate eats focus", "Enter ambiguously relaunches"): every
 * toolbar/tray button BLURS itself after activation (a `click` listener on
 * the button — pointer OR keyboard activation both run it), so keyboard
 * focus returns to the world the moment a control has done its job. Enter's
 * WORLD action (place) therefore fires only with focus on the body, the
 * canvas or the builder's own board group — never parked on a button; a
 * focused button keeps its native Enter (the keydown handler never
 * prevents it) until the activation lands and the blur returns focus to
 * the world. Launch is launched by Enter ONLY while the Launch button
 * itself is focused; once clicked it is no longer the Enter target.
 *
 * Placement model (v2, the shell-truth pass after playtests E/F/G):
 *
 * - The CURRENT TARGET is always VISIBLE: a ring marker (`#gw-target` torus)
 *   sits at the socket the held piece WILL occupy. The ghost (when a piece is
 *   held) renders at that same socket — green `fits here`, amber `flipped
 *   fit`, red `blocked — <reason>`. Nothing is ever targeted silently.
 * - THE BOOT DEFAULT TARGET is the head of the start-connected chain — the
 *   open exit of the line as built (on a fixture level: the start ramp's
 *   exit, where the par line begins), NOT the bare release-point socket
 *   (playtest N's eight-try wall: the default aimed `drop@start`, a legal
 *   build that cannot win, and the arrows were the only clue). The bare
 *   release socket stays a target — the arrows and hover still walk there —
 *   and names itself PLAINLY ("where the car starts", playtest R: "level
 *   start???"), as does the cup ("cup on the table", never "end of cup" —
 *   the cup is a fixture the kit never offers as a piece).
 * - HOVERING the canvas moves the target to the nearest open socket on
 *   screen (projection-nearest, within `HOVER_PX`), so the ghost always
 *   shows the socket a click would use BEFORE the click.
 * - CLICKING the canvas (a track end, the ghost, anywhere) places the held
 *   piece at the hovered socket — click = place. A CLICK is a press whose
 *   release stayed within `CANVAS_DRAG_PX` (6 px) of its press: a LEFT
 *   DRAG that travels is a VIEW gesture (it pans the framing) and places
 *   NOTHING — the old press-move-release counted as a click and
 *   misfire-placed pieces (playtest Q item 6: "left-drag on canvas PLACES
 *   a piece — no way to orbit"). The gesture recognition lives once, in
 *   `attachBuildView` (`src/camera/build-camera.ts`), which calls back
 *   into `aimAt` / `clickPlaceAt`; with nothing held a click only moves
 *   the marker, and says nothing false.
 * - KEYBOARD PARITY (the stage-6 requirement arriving early): the SAME keys
 *   drive the SAME visible marker — ↑/↓ pick the piece, ←/→ move the target
 *   ring, Enter places, R flips the fit, Delete removes. The handler lives
 *   on `window`, so the keys work with focus anywhere on the page (a
 *   focused `<button>` keeps its native Enter/space activation). Every hint
 *   line describes exactly these affordances — no dead hints.
 *
 * VERB TABLE (shell truth — playtest E: "'snapped' vs 'seated'"; one verb
 * per event, and the failure-note wording the Feel Engineer owns in
 * `src/ui/result.ts` never collides with these):
 *
 *   event                                verb (screen copy)
 *   ---------------------------------------------------------------
 *   a piece leaves the tray onto the track   "place" (button/hint) / "placed"
 *   the tally                              "N of M pieces used"
 *   the socket's verdict on the ghost       "fits here" | "flipped fit" |
 *                                           "blocked — furniture is in the way"
 *   the FIRST flipped fit of a session      appends WHY once: "flipped fit
 *                                           — it rides backwards; fine for
 *                                           a coaster, not for a launch
 *                                           (press R again to flip back)"
 *   a tray kind's stock                     "drop ×1" → "drop ×0" (counts LEFT)
 *   car events (notes, camera)             the Feel Engineer's lines only
 *
 * The words "snapped" and "seated" never reach the screen; the internal
 * `GhostState` names stay for code/tests. Forward seating is the contract's
 * `fitSocket`; the `snapSocket` gate colours the ghost. A flip is the
 * contract's half turn about the socket's up axis, ANIMATED over
 * `ROTATE_MS` (≤ 150 ms) so the change is always visible — playtest G
 * pressed R and saw nothing.
 *
 * The builder owns no physics. On every change it hands the new `Build` to
 * `onChange`; the game shell rebuilds the `World` (see `src/boot.ts`).
 */
import * as THREE from 'three';
import { canonicalBuild, fitSocket, snapSocket } from '../track/snap.ts';
import { PIECES, PIECE_KINDS, pieceGeometries, pieceLabel, type PieceKind, type PieceParams } from '../track/pieces.ts';
import { socketMatrix, transformSocket, type Socket } from '../track/socket.ts';
import type { Build, PlacedPiece } from '../track/build.ts';
import type { Level } from '../world/level.ts';

/** Two socket origins this close are joined (metres; well above float noise). */
export const JOIN_TOL = 0.004;
/** Screen radius (CSS px) in which a canvas hover/click claims a socket. */
export const HOVER_PX = 120;
/** The flip animation length — short enough to feel instant, long enough
 *  to be SEEN (playtest G: "clicked R; ghost never visibly changed"). */
export const ROTATE_MS = 150;

/** The once-per-session WHY tail appended to the `flipped fit` status line
 *  (playtest Q item 5: "flipped fit vs fits here" unreadable). It states
 *  the physics honestly (the reverse mount rides BACKWARDS — the deck
 *  still fits, the direction of travel through it does not) and states
 *  the REVERSIBILITY honestly (R is exactly its own undo). Shown once, on
 *  the same status line, never nagging after the first flip. */
export const FLIP_WHY =
  'it rides backwards; fine for a coaster, not for a launch (press R again to flip back)';

export type GhostState = 'hidden' | 'snapped' | 'reversed' | 'invalid' | 'blocked';

/** The VERB TABLE's screen copy per internal state ('' = say nothing). */
export const GHOST_LABEL: Record<GhostState, string> = {
  hidden: '',
  snapped: 'fits here',
  reversed: 'flipped fit',
  invalid: 'no seat at this socket',
  blocked: 'blocked — furniture is in the way',
};

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
  /** Geometry of the tray pieces: the LEVEL's tuned parameters per kind. */
  trayParams?: Partial<Record<PieceKind, PieceParams>>;
  /** Called after every mutation with the canonical new build. */
  onChange?: (build: Build) => void;
  /** Stage-3 set wiring: world-space AABBs of the set's solid props. A seat
   *  whose piece box overlaps one of them is REJECTED — the ghost goes red
   *  and `place` refuses. AABB-vs-AABB per ghost update, nothing per frame. */
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
  /** The permanent Retry (playtest N: "Retry only appears in the result
   *  panel"): as-built — returns the CAR to the start pose, the build
 *  untouched, the panel away. The element id stays `gw-reset` (the
 *  recorded test surface); the WORD a player looks for is Retry. */
  reset: HTMLButtonElement;
  launch: HTMLButtonElement;
}

export interface Builder {
  elements: BuilderElements;
  build(): Build;
  /** Move the ghost and target marker into a (re)built world's scene. */
  setScene(scene: THREE.Scene | null): void;
  /** Attach the game canvas (stores the projection camera). Pointer
   *  GESTURES are owned by `attachBuildView` (`src/camera/build-camera.ts`),
   *  which calls `aimAt` on hover and `clickPlaceAt` on a clean click. */
  attachCanvas(canvas: HTMLElement, camera?: THREE.Camera): void;
  /** Hover aims the target ring at the socket nearest this screen point. */
  aimAt(clientX: number, clientY: number): void;
  /** A clean click (no drag travel — the gesture gate upstream decides):
   *  aim, then place the held piece at the aimed socket. */
  clickPlaceAt(clientX: number, clientY: number): void;
  setKind(kind: PieceKind | null): void;
  cycleKind(delta: number): void;
  cycleTarget(delta: number): void;
  rotate(): void;
  place(): boolean;
  removeLast(): boolean;
  /** Pieces the PLAYER has placed from the tray (fixtures excluded). */
  playerCount(): number;
  kind(): PieceKind | null;
  ghost(): GhostState;
  /** The socket the target marker (and ghost) currently sit on, or null. */
  targetSocket(): Socket | null;
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
  // FOCUS POLICY (playtests P+Q): every toolbar/tray button returns focus
  // to the world after activation, so the NEXT Enter is the world's Enter
  // (place), not a silent re-click of the last button touched. The blur
  // runs on the click event — after the button's native activation — so a
  // focused button still keeps its own Enter/space (Launch on Enter still
  // launches while focus is on it).
  b.addEventListener('click', () => {
    if (document.activeElement === b) b.blur();
  });
  return b;
}

export function createBuilder(host: HTMLElement, options: BuilderOptions): Builder {
  const { level } = options;
  const solids = options.solids ?? [];
  const traySpec = options.tray;
  const trayParams = options.trayParams;
  /** The parameters a held kind is GHOSTED AND PLACED with. */
  const heldParams = (k: PieceKind): PieceParams => trayParams?.[k] ?? PIECES[k].params;
  /** Kinds the tray allows at all; null = no tray, everything unlocked. */
  const trayKinds: Set<PieceKind> | null = traySpec
    ? new Set((Object.entries(traySpec) as [PieceKind, number][]).filter(([, n]) => (n ?? 0) > 0).map(([k]) => k))
    : null;
  /** How many of this kind the tray allows (null = no per-kind cap). */
  const allowance = (k: PieceKind): number | null =>
    trayKinds && trayKinds.has(k) ? (traySpec![k] ?? 0) : null;
  const placedOf = (k: PieceKind): number => pieces.filter((p) => p.def === k).length;
  /** Placements that count against the budget: tray pieces only. */
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
  let targetIndex = chainHeadIndex();
  let state: GhostState = 'hidden';
  // a one-shot explanation line that OUTLIVES the async world rebuild an
  // emit triggers (`setScene` re-runs `updateGhost`, which would otherwise
  // erase it); any NEXT player action retires it (playtest Q's spent-hold
  // line has to still be there when the eyes arrive)
  let stuckNote: string | null = null;
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
    // the button SAYS the player word (playtest M: "raw codenames gapLip,
    // sbend, bigCurve in toolbar") — the codename survives only as the
    // `data-kind` id and the element id, which are test surfaces, not copy
    const b = button(`gw-tray-${k}`, pieceLabel(k), tray);
    b.dataset.kind = k;
    b.setAttribute('aria-label', `Hold the ${pieceLabel(k)} piece`);
    b.setAttribute('aria-pressed', 'false');
    b.addEventListener('click', () => {
      stuckNote = null; // a fresh press retires the last one-shot line
      // A click on a locked or spent button must EXPLAIN itself, and the
      // explanation may never contradict the piece in hand (playtests M+N
      // both tripped on "no landing left in the tray" read as a verdict on
      // the held `gapLip`): the line names the kind the click TRIED, and
      // when another kind is held it says so.
      const holding = kind !== null && kind !== k ? ` — you are holding ${pieceLabel(kind)}` : '';
      if (locked(k)) ghostState.textContent = `the ${pieceLabel(k)} is not in this level’s tray${holding}`;
      else if (!selectable(k)) ghostState.textContent = `no ${pieceLabel(k)} left in the tray${holding}`;
      else setKind(k);
    });
    b.addEventListener('mouseenter', () => {
      // hover PREVIEW switches the held kind — but only onto a kind the
      // tray can actually place. Passing the mouse over a SPENT button
      // used to silently drop the held piece for it (playtest N: "no
      // landing left in the tray" while holding gapLip: the hover had
      // taken the hold, the tray buttons said otherwise). A spent button
      // says nothing on hover and steals nothing; its click explains.
      if (!locked(k) && selectable(k)) setKind(k);
    });
    trayButtons.set(k, b);
  }

  const controls = document.createElement('div');
  controls.id = 'gw-controls';
  root.appendChild(controls);
  const placeBtn = button('gw-place', 'Place', controls);
  const rotateBtn = button('gw-rotate', 'Rotate (R)', controls);
  const remove = button('gw-remove-piece', 'Remove piece', controls);
  // The permanent Retry (playtest N: a dismissed panel hid the way back).
  // Same as-built semantics the result panel's Retry carries — the shell
  // wires BOTH to the same `resetCar`. The id stays `gw-reset`: the element
  // id is a test surface, the button WORD is player copy (playtest M rule).
  const resetBtn = button('gw-reset', 'Retry', controls);
  resetBtn.setAttribute('aria-label', 'Retry from the start — the build stays as built');
  const launch = button('gw-launch', 'Launch', controls);
  // the teaching line (near the tray, §9.3). The copy describes what the
  // inputs ACTUALLY do (playtest E: "Place: Enter — Enter did nothing"):
  // hover aims, click/Enter place, the arrows drive the same visible marker.
  const hint = document.createElement('p');
  hint.id = 'gw-tray-hint';
  hint.setAttribute('aria-live', 'polite');
  hint.textContent = 'Aim: hover the world or ←→ · Place: click the world or Enter · Flip: R · Look: right-drag';
  hint.hidden = true;
  root.appendChild(hint);
  // the VISIBLE reason behind every greyed/spent tray button — one counter,
  // the tray legend itself; ×N counts what is LEFT and decrements as pieces
  // are placed (playtest G: "×2 stayed ×2")
  const trayReason = document.createElement('p');
  trayReason.id = 'gw-tray-reason';
  trayReason.textContent = 'Greyed pieces are not in this level · ×N counts the pieces left to place';
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
  // THE RING SPEAKS (playtest Q: "white ring markers unlabeled"): one quiet
  // line the FIRST time the ring is visible in a page session, naming what
  // it is. Session-scoped (not save-scoped) on purpose — a fresh visit
  // re-teaches it, and the first successful place retires the line for good
  // (the ring itself keeps its socket's label on `#gw-target-label`).
  const ringHint = document.createElement('p');
  ringHint.id = 'gw-ring-hint';
  ringHint.setAttribute('aria-live', 'polite');
  ringHint.textContent = 'the ring is where it will land';
  ringHint.hidden = true;
  root.appendChild(ringHint);
  let ringAnnounced = false;

  host.appendChild(root);

  // ---- ghost + target marker ----------------------------------------------
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

  // The VISIBLE target: a quiet ring at the socket the held piece WILL
  // occupy. Shown whenever a target exists, held piece or not — the arrows
  // and the mouse drive this exact ring (playtest E/F: "arrows cycle an
  // unmarked target").
  const marker = new THREE.Mesh(
    new THREE.TorusGeometry(0.055, 0.006, 8, 32),
    new THREE.MeshBasicMaterial({ color: 0xfdf2e0, transparent: true, opacity: 0.95, depthWrite: false }),
  );
  marker.name = 'builder-target';
  marker.matrixAutoUpdate = false;
  marker.visible = false;

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

  // ---- the flip animation (≤ ROTATE_MS so R is always SEEN) ---------------
  let anim: { from: THREE.Matrix4; to: THREE.Matrix4; start: number } | null = null;
  let animTick = 0;
  const tmpP = new THREE.Vector3();
  const tmpQ = new THREE.Quaternion();
  const tmpS = new THREE.Vector3();
  const fromP = new THREE.Vector3();
  const fromQ = new THREE.Quaternion();
  const fromS = new THREE.Vector3();
  const toP = new THREE.Vector3();
  const toQ = new THREE.Quaternion();
  const toS = new THREE.Vector3();

  function animateGhostTo(to: THREE.Matrix4, animate: boolean): void {
    // no animation possible (ghost not on screen yet) or not asked for:
    // snap, and cancel any in-flight flip so nothing overwrites the matrix
    if (!animate || !ghostGroup.visible) {
      anim = null;
      ghostGroup.matrix.copy(to);
      return;
    }
    anim = { from: ghostGroup.matrix.clone(), to: to.clone(), start: performance.now() };
    if (animTick) return; // the running loop picks the new pair up
    const step = (): void => {
      if (!anim) {
        animTick = 0;
        return;
      }
      const k = Math.min(1, (performance.now() - anim.start) / ROTATE_MS);
      const e = k * (2 - k); // ease-out
      anim.from.decompose(fromP, fromQ, fromS);
      anim.to.decompose(toP, toQ, toS);
      tmpP.lerpVectors(fromP, toP, e);
      tmpQ.slerpQuaternions(fromQ, toQ, e);
      tmpS.lerpVectors(fromS, toS, e);
      ghostGroup.matrix.compose(tmpP, tmpQ, tmpS);
      if (k >= 1) {
        anim = null;
        animTick = 0;
        return;
      }
      animTick = requestAnimationFrame(step);
    };
    animTick = requestAnimationFrame(step);
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
    // THE START SOCKET, NAMED PLAINLY (playtest R: "target: level start???"):
    // an open start socket is the car's RELEASE point — the line says exactly
    // that; the internal word "level" never reaches the screen. (Once a piece
    // is seated on it the socket is taken and the piece's own exit labels aim.)
    if (!startTaken) out.push({ socket: level.startSocket, label: 'where the car starts' });
    for (const { piece, sockets } of all) {
      const [, exit] = sockets;
      const taken = all.some(
        (other) =>
          other.piece.seq !== piece.seq &&
          other.sockets.some((s) => s.pos.distanceTo(exit.pos) < JOIN_TOL),
      );
      // THE CUP IS THE CUP, not a piece (playtests R+S: "target: end of cup"
      // named a piece the kit never offered; the cup is the object they can
      // SEE). Its open exit — where a run-out line would chain — names the
      // visible thing instead. Every other kind keeps the measured-good
      // "end of X" the playtesters read as chain order.
      if (!taken)
        out.push({
          socket: exit,
          label: piece.def === 'finishCup' ? 'cup on the table' : `end of ${pieceLabel(piece.def).toLowerCase()}`,
        });
    }
    return out;
  }

  /**
   * The BOOT DEFAULT target: walk the join chain from the FIRST-BUILT piece
   * (every shipped fixture build starts on its start ramp — `initialBuild`
   * filters `parBuild`, which lays the ramp first) and stop at the far open
   * exit; that socket heads the par line. Deterministic in build order — no
   * scoring, no geometry beyond the same `JOIN_TOL` join test the rest of
   * the builder uses. 0 (the list head, `level start` when it is open) when
   * there is no chain to walk.
   */
  function chainHeadIndex(): number {
    if (pieces.length === 0) return 0;
    let current = pieces[0]!;
    let cursor = pieceSockets(current)[1];
    for (let guard = 0; guard < pieces.length; guard++) {
      const next = pieces.find(
        (p) => p.seq !== current.seq && pieceSockets(p)[0].pos.distanceTo(cursor.pos) < JOIN_TOL,
      );
      if (!next) break;
      current = next;
      cursor = pieceSockets(next)[1];
    }
    const at = targets().findIndex((t) => t.socket.pos.distanceTo(cursor.pos) < JOIN_TOL);
    return at >= 0 ? at : 0;
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

  /** True when a placed piece's world AABB overlaps one of the set's solids. */
  function overlapsSolid(transform: THREE.Matrix4, held: PieceKind): boolean {
    if (solids.length === 0) return false;
    const box = new THREE.Box3();
    for (const geo of pieceGeometries(held, heldParams(held))) {
      geo.computeBoundingBox();
      if (geo.boundingBox) box.union(geo.boundingBox.clone().applyMatrix4(transform));
    }
    if (box.isEmpty()) return false;
    box.expandByScalar(-0.002);
    return solids.some((s) => s.intersectsBox(box));
  }

  function updateGhost(animate = false, echo = false): void {
    rebuildGhostGeometry();
    const list = targets();
    if (targetIndex >= list.length) targetIndex = Math.max(0, list.length - 1);
    // THE RING KEEPS ITS SOCKET'S LABEL: whenever a target exists the
    // label line names its socket — held piece or not (playtest Q: the
    // white rings were mute; the ring is always the answer to "where will
    // it go", so it is never silent).
    targetLabel.textContent = list.length > 0 ? `target: ${list[targetIndex]!.label}` : '';
    if (list.length === 0 || !scene) {
      state = 'hidden';
      anim = null;
      ghostGroup.visible = false;
      marker.visible = false;
      if (list.length === 0) targetIndex = 0;
    } else {
      const target = list[targetIndex]!.socket;
      // the ring marks the target socket, held piece or not
      marker.matrix
        .copy(socketMatrix(target))
        .setPosition(
          target.pos.x + target.tangent.x * 0.02,
          target.pos.y + target.tangent.y * 0.02,
          target.pos.z + target.tangent.z * 0.02,
        );
      marker.visible = true;
      if (!kind) {
        state = 'hidden';
        ghostGroup.visible = false;
      } else {
        const m = placement(target, kind);
        animateGhostTo(m, animate);
        ghostGroup.visible = true;
        const seated = transformSocket(PIECES[kind].sockets(heldParams(kind))[0], m);
        // Stage-3 vocabulary pass: the amber word is `reversed`, never
        // `seated` — playtest G read "seated" as a physics verdict next
        // to a "flew off" result line. "Seated" now names ONE thing: the
        // cup capture in world.ts. A reverse mount is a half turn about
        // the target's up: deck lines match, tangents deliberately do
        // not, so the snap gate reports it honestly (amber).
        state = overlapsSolid(m, kind)
          ? 'blocked'
          : snapSocket(target, seated) !== null
            ? 'snapped'
            : flipped
              ? 'reversed'
              : 'invalid';
      }
      ghostMaterial.color.set(
        state === 'snapped' ? 0x2fbf71 : state === 'reversed' ? 0xffb627 : 0xd7263d,
      );
    }
    // the VERB TABLE's copy — never the internal state word; a stuck
    // one-shot note wins the line, else the copy (echo tail on R; the FIRST
    // reversed ghost of the session also says WHY, once — playtests P/Q)
    ghostState.textContent = stuckNote ?? ghostCopy(echo);
    // ONE counter, ONE verb: this tally line and the shell's idle status
    // line (`runStatusLine`, boot.ts) state the SAME numbers in the SAME
    // words (playtests P+Q: two counters saying two things)
    count.textContent = `${trayPlaced()} of ${level.budget} pieces used`;
    // the ring named itself once this session; it is on screen now
    if (marker.visible && !ringAnnounced) {
      ringAnnounced = true;
      ringHint.hidden = false;
    }
    if (ringAnnounced && !marker.visible) ringHint.hidden = true;
    hint.hidden = everPlaced || kind === null;
    for (const [k, b] of trayButtons) {
      const cap = allowance(k);
      const left = cap === null ? null : Math.max(0, cap - placedOf(k));
      // the tray LEGEND decrements: ×N counts what is LEFT to place
      b.textContent = cap === null ? pieceLabel(k) : `${pieceLabel(k)} ×${left}`;
      b.setAttribute('aria-pressed', String(k === kind));
      const spent = locked(k) || left === 0;
      b.setAttribute('aria-disabled', String(spent));
      if (spent) b.setAttribute('aria-describedby', 'gw-tray-reason');
      else b.removeAttribute('aria-describedby');
      b.title = locked(k)
        ? 'not in this level’s tray'
        : left === 0
          ? `no ${pieceLabel(k)} left in the tray (${cap} placed)`
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

  /** Once-per-session flip legibility: the reversed label carries the WHY
   *  tail exactly once (the flag is per page session — a reload re-teaches,
   *  which is the right scope for "once per session"). */
  let flipWhyShown = false;
  function ghostCopy(echo: boolean): string {
    const verb = echo && state !== 'hidden' ? `${GHOST_LABEL[state]} · rotated` : GHOST_LABEL[state];
    const why = state === 'reversed' && !flipWhyShown;
    if (state === 'reversed') flipWhyShown = true;
    return why ? `${verb} — ${FLIP_WHY}` : verb;
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
    if (next !== null) stuckNote = null; // picking a piece up retires the note
    kind = next;
    updateGhost();
  }

  function cycleKind(delta: number): void {
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
    stuckNote = null;
    flipped = !flipped;
    // `animate` — the flip is the one change the eye must not be able to
    // miss (playtest G: "Rotate (R): clicked it; ghost never visibly changed").
    // The `echo` is playtest M's passive "· rotated" confirmation on the
    // press path (ghost on screen only — with nothing held there is
    // nothing rotated and the line stays truthful, §verb table); on its
    // FIRST reversed result the same line also carries the once-per-
    // session WHY tail (playtest Q: "flipped fit" vs "fits here" could not
    // be interpreted).
    updateGhost(true, true);
  }

  function place(): boolean {
    const list = targets();
    stuckNote = null;
    if (!kind || list.length === 0) return false;
    if (trayPlaced() >= level.budget) {
      // nothing left ANYWHERE — a hold here is a stranded hold; release it
      if (!selectable(kind)) setKind(null);
      // on a TRAY level the legend already tells this story per kind; the
      // line only appears where the tray cannot say it (sandbox budgets)
      ghostState.textContent = trayKinds
        ? 'every piece in the tray is placed — the ×0 buttons are the count'
        : 'out of budget';
      return false;
    }
    const cap = allowance(kind);
    if (cap !== null && placedOf(kind) >= cap) {
      // REJECT-PATH RELEASE (playtest Q: "no Drop left" while holding a
      // spent kind — the message was fixed, the STUCK HOLD stayed): a
      // refusal that names an exhausted kind also drops the hold, so the
      // next Place is never spent on a piece that cannot place
      const spent = kind;
      stuckNote = `no ${pieceLabel(spent)} left in the tray`;
      setKind(null);
      return false;
    }
    const target = list[targetIndex]!.socket;
    const transform = placement(target, kind);
    if (overlapsSolid(transform, kind)) {
      ghostState.textContent = GHOST_LABEL.blocked;
      return false;
    }
    pieces = [
      ...pieces,
      { def: kind, params: { ...heldParams(kind) }, transform, seq: pieces.length },
    ];
    everPlaced = true;
    // THE TARGET FOLLOWS THE LINE: the default target moves to the exit the
    // placed piece just created (the arrows still walk everywhere) — on a
    // fixture-anchored level the array-order index the eye was on is the
    // FIXTURE's exit one keystroke later (the kitchen01 `0951a819` fall).
    const placedExit = transformSocket(PIECES[kind].sockets(heldParams(kind))[1], transform);
    const after = targets();
    const next = after.findIndex((t) => t.socket.pos.distanceTo(placedExit.pos) < JOIN_TOL);
    if (next >= 0) targetIndex = next;
    updateGhost();
    emit();
    // the ring line retires at the first piece that actually landed
    ringHint.hidden = true;
    // EXHAUSTED-HOLD RELEASE: placing the LAST of a kind must not leave
    // the player holding a ghost the tray no longer stocks (playtest Q's
    // stuck hold) — the hold releases and says so; the tray legend shows
    // the ×0
    if (kind !== null && !selectable(kind)) {
      const spent = kind;
      stuckNote = `last ${pieceLabel(spent)} placed — pick another piece`;
      setKind(null);
    }
    return true;
  }

  function removeLast(): boolean {
    stuckNote = null;
    if (pieces.length === 0) return false;
    let i = pieces.length - 1;
    if (trayKinds) {
      while (i >= 0 && !trayKinds.has(pieces[i]!.def)) i -= 1;
      if (i < 0) return false;
    }
    pieces = pieces.filter((_, j) => j !== i).map((p, j) => ({ ...p, seq: j }));
    everPlaced = trayPlaced() > 0;
    updateGhost();
    emit();
    return true;
  }

  // ---- canvas aiming (hover aims, click places — gestured upstream) -------
  let canvasEl: HTMLElement | null = null;
  let camera: THREE.Camera | null = null;

  function aimAt(clientX: number, clientY: number): void {
    const hit = socketAtPoint(clientX, clientY);
    if (hit >= 0 && hit !== targetIndex) {
      targetIndex = hit;
      updateGhost();
    }
  }

  function clickPlaceAt(clientX: number, clientY: number): void {
    aimAt(clientX, clientY);
    if (kind) place();
  }

  /** Nearest open socket to a pointer position (CSS px in the canvas box),
   *  or -1 when every socket is farther than HOVER_PX. */
  function socketAtPoint(clientX: number, clientY: number): number {
    if (!camera || !canvasEl) return -1;
    const rect = canvasEl.getBoundingClientRect();
    const v = new THREE.Vector3();
    let best = -1;
    let bestD = HOVER_PX;
    targets().forEach((t, i) => {
      v.copy(t.socket.pos).project(camera!);
      if (v.z > 1) return; // behind the camera
      const d = Math.hypot((v.x * 0.5 + 0.5) * rect.width - (clientX - rect.left), (0.5 - v.y * 0.5) * rect.height - (clientY - rect.top));
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    return best;
  }

  // ---- wiring ------------------------------------------------------------

  placeBtn.addEventListener('click', () => place());
  rotateBtn.addEventListener('click', () => rotate());
  remove.addEventListener('click', () => removeLast());

  // KEYBOARD PARITY on `window`: the arrows/Enter/R/Delete drive the SAME
  // visible marker from anywhere on the page (stage-6's requirement,
  // arriving early). A focused <button> keeps its native Enter/space
  // activation; arrows are ours everywhere (they move the marker, so the
  // page must not scroll under them).
  window.addEventListener('keydown', (ev) => {
    const t = ev.target as HTMLElement | null;
    const onButton = t !== null && (t.tagName === 'BUTTON' || t.tagName === 'A');
    // Enter's WORLD action fires only with focus on the world: body, the
    // canvas, or the builder's board group — never parked on a control
    // (every builder button blurs on activation, so after a click/keyboard
    // activation focus is back on the body and Enter is PLACE again)
    const onWorld =
      t === null ||
      t === document.body ||
      t === root ||
      t === canvasEl ||
      t.tagName === 'CANVAS';
    const keys: Record<string, () => void> = {
      ArrowRight: () => cycleTarget(1),
      ArrowLeft: () => cycleTarget(-1),
      ArrowUp: () => cycleKind(1),
      ArrowDown: () => cycleKind(-1),
      r: rotate,
      R: rotate,
      Enter: () => {
        // a focused button's Enter is its own click; the world's Enter is
        // PLACE, and PLACE fires only when the world holds the focus
        if (onWorld) place();
      },
      Delete: () => removeLast(),
      Backspace: () => removeLast(),
    };
    const fn = keys[ev.key];
    if (!fn) return;
    // a focused <button> keeps its native Enter activation — preventing the
    // default there would CANCEL the click, not just the page action
    if (onButton && ev.key === 'Enter') return;
    ev.preventDefault();
    fn();
  });

  updateGhost();

  return {
    elements: { root, tray, count, ghostState, targetLabel, hint, place: placeBtn, rotate: rotateBtn, remove, reset: resetBtn, launch },
    build: () => ({ levelId: level.id, pieces: canonicalBuild(pieces.map((p, i) => ({ ...p, seq: i }))), seed: level.seed }),
    setScene(next) {
      scene = next;
      if (next) {
        next.add(ghostGroup);
        next.add(marker);
      }
      updateGhost();
    },
    attachCanvas(canvas, cam) {
      // the projection context only: the POINTER GESTURES (hover/click vs
      // framing drag) are owned once by `attachBuildView` in
      // `src/camera/build-camera.ts`, which calls aimAt / clickPlaceAt —
      // so "press+move+release places a piece" (playtest Q's accidental
      // placement) is structurally impossible: the gesture gate decides
      // the verb before this module ever sees the pointer
      canvasEl = canvas;
      camera = cam ?? null;
    },
    aimAt,
    clickPlaceAt,
    setKind,
    cycleKind,
    cycleTarget,
    rotate,
    place,
    removeLast,
    playerCount: () => trayPlaced(),
    kind: () => kind,
    ghost: () => state,
    targetSocket: () => {
      const list = targets();
      return list.length > 0 ? list[Math.min(targetIndex, list.length - 1)]!.socket : null;
    },
  };
}
