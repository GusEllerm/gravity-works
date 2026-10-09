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
 *   and names itself PLAINLY ("the car's start point", playtest R: "level
 *   start???"), as does the cup ("cup on the table", never "end of cup" —
 *   the cup is a fixture the kit never offers as a piece).
 * - HOVERING the canvas moves the target to the nearest open socket on
 *   screen (projection-nearest, within `HOVER_PX`), so the ghost always
 *   shows the socket a click would use BEFORE the click. Under orbit,
 *   sockets OVERLAP in screen space — among near-ties (within `AIM_TIE_PX`
 *   of the nearest screen distance) the socket NEARER the eye wins, and
 *   the alternates are walkable with `[` `]` (Tab is the browser's focus
 *   walk, never the tie-walk — stage 6 a11y); the target label names
 *   the tie count and which one the ring marks (playtest S K3: the landing
 *   "always snapped onto the chain BEHIND the cup").
 * - CLICKING the canvas (a track end, the ghost, anywhere) places the held
 *   piece at the hovered socket — click = place. A CLICK is a press whose
 *   release stayed within `CANVAS_DRAG_PX` (20 px — raised from 6 by
 *   playtest R: at 6 px an ordinary click with a little finger travel
 *   silently placed NOTHING) of its press: a LEFT
 *   DRAG that travels is a VIEW gesture (it pans the framing) and places
 *   NOTHING — the old press-move-release counted as a click and
 *   misfire-placed pieces (playtest Q item 6: "left-drag on canvas PLACES
 *   a piece — no way to orbit"). The gesture recognition lives once, in
 *   `attachBuildView` (`src/camera/build-camera.ts`), which calls back
 *   into `aimAt` / `clickPlaceAt`; with nothing held a click MOVES the
 *   marker and the status line says the piece is not in hand (playtests
 *   T+U round 4: an intent that ends with nothing placed is never silent).
 * - THE TRAY PLACE BUTTON NAMES ITS DROP SPOT (playtest DD's kitchen01
 *   wall: ~10 launches burned because the button silently auto-dropped at
 *   "a fixed right-side socket" — hover-aim legitimately follows the mouse
 *   EVERYWHERE it crosses the canvas, including on the way to this button,
 *   so the press landed where the transit last aimed, not where the player
 *   had aimed). The button places at the CURRENT aim — the same ring the
 *   ghost wears — and its label CARRIES that socket's name ("Place — the
 *   car's start point"), updated wherever the aim updates. The button is
 *   the last thing under the eyes before a press, so a transit re-aim can
 *   no longer be silent: the screen never disagrees with the placement
 *   (the input-truth law). Empty-handed, no target, or budget spent, the
 *   button says plain "Place" and is aria-disabled — a button that cannot
 *   place names no drop spot.
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
 *   the FIRST empty-handed reverse-arm      says what the press DID, once:
 *   of a session (nothing held)             "reversing — track runs
 *                                           backwards this way (press R
 *                                           unless you want a coaster)"
 *                                           — retired by the next action,
 *                                           the first place included
 *   a tray kind's stock                     "drop ×1" → "drop ×0" (counts LEFT)
 *   a seat a SET SOLID refuses             "blocked — the <object> is in the
 *                                           way · press ] to walk the open
 *                                           ends" (stage 6: the object is
 *                                           NAMED — `solidWord` of the guard's
 *                                           own object path — because "furniture"
 *                                           over the cereal bowl on a rung
 *                                           called "The Bowl" read to two
 *                                           strangers as "move it", and the
 *                                           walk phrase is the actionable half)
 *   a legal seat PAST the finish fixture    "fits here — the run ends at the
 *                                           cup, so nothing past it is ever
 *                                           travelled" (the seat IS legal; the
 *                                           line built past the goal is what
 *                                           is not — playtest DD built six of
 *                                           them backwards off the cup)
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
import { rigFingerprint } from '../track/build.ts';
import { PIECES, PIECE_KINDS, pieceGeometries, pieceLabel, type PieceKind, type PieceParams } from '../track/pieces.ts';
import { socketMatrix, transformSocket, type Socket } from '../track/socket.ts';
import type { Build, PlacedPiece } from '../track/build.ts';
import type { Level } from '../world/level.ts';
import { worldToClientPx } from './aim-transform.ts';
import { prefersReducedMotion } from './motion.ts';
import { AIM_WALK_COPY } from './callouts.ts';

/** Two socket origins this close are joined (metres; well above float noise). */
export const JOIN_TOL = 0.004;
/** Screen radius (CSS px) in which a canvas hover/click claims a socket —
 *  THE AIM SNAP RANGE CAP itself (playtest BB bug 4, the round-3
 *  recurrence: "click at 700,600 placed a lip 150 px away and it
 *  counted"). The claim is a cone test through the cursor, and a screen
 *  radius states that cone EXACTLY: perpendicular world distance says
 *  nothing perspective has not already said at the same cone angle, so a
 *  metre-cap on top of this radius would only refuse legitimate aims at
 *  deep framing (verified: a constant 0.5 m ray cap refuses the
 *  ladder's own far-rung clicks, which stand in this cone at 159 px).
 *  What made BB's click count was never this radius (the click was 150 px
 *  out, ALREADY beyond it) — it was the place-after-failed-aim that kept
 *  the stale ring as a target; `clickPlaceAt`'s aim-or-speak is the fix,
 *  and this radius is the range. Beyond it the ring shows nothing and a
 *  click says so (`nothing fits out here`). */
export const HOVER_PX = 120;
/** Screen px of separation two sockets must exceed to be DIFFERENT aims.
 *  Within it they are NEAR-TIES: screen space cannot tell them apart, so
 *  depth decides (the nearer to the eye wins — playtest S K3: orbiting
 *  made the landing "always snap onto the chain BEHIND the cup"), and the
 *  alternates are walkable with [ ] (the choice is EXPOSED, never a silent
 *  coin-flip; stage 6 a11y: Tab is NEVER repurposed here — it stays the
 *  browser's focus walk, or the page becomes a trap). */
export const AIM_TIE_PX = 28;
/** The flip animation length — short enough to feel instant, long enough
 *  to be SEEN (playtest G: "clicked R; ghost never visibly changed"). */
export const ROTATE_MS = 150;

/** The mount transform of a held piece on a target socket: the contract's
 *  forward seating `fitSocket`, or its half turn about the target's up when
 *  the flip flag is on (the same transform `placement` builds in the live
 *  builder — shared so the pure outcome probe and the ghost never disagree
 *  about what a socket WOULD mean). */
export function flipPlacement(
  target: Socket,
  held: PieceKind,
  params: PieceParams,
  flipped: boolean,
): THREE.Matrix4 {
  const seat = fitSocket(target, PIECES[held].sockets(params)[0]);
  if (!flipped) return seat;
  const axis = target.up.clone().normalize();
  const flip = new THREE.Matrix4()
    .makeTranslation(target.pos.x, target.pos.y, target.pos.z)
    .multiply(new THREE.Matrix4().makeRotationAxis(axis, Math.PI))
    .multiply(new THREE.Matrix4().makeTranslation(-target.pos.x, -target.pos.y, -target.pos.z));
  return flip.multiply(seat);
}

/** The once-per-session WHY tail appended to the `flipped fit` status line
 *  (playtest Q item 5: "flipped fit vs fits here" unreadable). It states
 *  the physics honestly (the reverse mount rides BACKWARDS — the deck
 *  still fits, the direction of travel through it does not) and states
 *  the REVERSIBILITY honestly (R is exactly its own undo). Shown once, on
 *  the same status line, never nagging after the first flip. */
export const FLIP_WHY =
  'it rides backwards; fine for a coaster, not for a launch (press R again to flip back)';

/** The once-per-session line for the EMPTY-HANDED flip (playtest R's K4
 *  wall: an R press with nothing held toggled the reversal SILENTLY — with
 *  no ghost on screen there was no "· rotated" to echo onto — and the flag
 *  persisted, so one stray press reversed EVERY later mount; she saw it
 *  only in the diagnosis). The flag-setting press now says what it did,
 *  once per page session, on the same status line — FLIP_WHY's discipline
 *  applied to the arm instead of the fit; the next action (the first
 *  place included) retires the line and the held ghost's own copy takes
 *  the line over. */
export const REVERSING_WHY =
  'reversing — track runs backwards this way (press R unless you want a coaster)';

export type GhostState = 'hidden' | 'snapped' | 'reversed' | 'invalid' | 'blocked';

/**
 * The tie list reduced to DISTINCT BUILD OUTCOMES (playtest BB bug 3:
 * "`]` other spot sometimes silently does nothing — two runs byte-identical
 * at 1.94 s"). A tie is a choice the SCREEN cannot decide; a candidate
 * socket whose dry-run build is CANONICALLY EQUIVALENT to a nearer
 * candidate's is not a choice, and offering `]` for it is the dead key BB
 * pressed. Equivalence is the cheap canonical hash the build code already
 * carries — `rigFingerprint` (Track Kit invariant 3: the fingerprint of the
 * reified rig, 1e-6-quantised geometry, order-free) — so an equivalent
 * alternate can never disagree about the answer. First-wins, so the
 * NEAREST-depth representative of an equivalence class survives (the same
 * depth law that picks the outright target).
 * Pure: everything it needs is passed in; the builder memoises around it.
 */
export function distinctOutcomes(
  cands: readonly number[],
  socketOf: (index: number) => Socket | undefined,
  outcomeHash: (socket: Socket) => string,
): number[] {
  if (cands.length < 2) return [...cands];
  const seen = new Set<string>();
  const out: number[] = [];
  for (const i of cands) {
    const socket = socketOf(i);
    if (!socket) continue;
    const fp = outcomeHash(socket);
    if (seen.has(fp)) continue; // a canonical clone of a nearer candidate — not a distinct spot
    seen.add(fp);
    out.push(i);
  }
  return out;
}

/** The default `outcomeHash`: the rig fingerprint of the build the socket
 *  would produce (dry-run: the current pieces plus the held piece seated
 *  here). Exported for the unit gate; the live builder memoises the same
 *  function through `aimCandidates`. */
export function dryRunHash(
  levelId: string,
  seed: number,
  pieces: readonly PlacedPiece[],
  held: PieceKind,
  params: PieceParams,
  flipped: boolean,
): (socket: Socket) => string {
  return (socket) =>
    rigFingerprint({
      levelId,
      seed,
      pieces: [...pieces, { def: held, params: { ...params }, transform: flipPlacement(socket, held, params, flipped), seq: pieces.length }],
    });
}

/** The VERB TABLE's screen copy per internal state ('' = say nothing). */
export const GHOST_LABEL: Record<GhostState, string> = {
  hidden: '',
  snapped: 'fits here',
  reversed: 'flipped fit',
  invalid: 'no seat at this end',
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
  /** Stage-3 set wiring: the set's solid props as NAMED world-space boxes. A
   *  seat whose piece box overlaps one of them is REJECTED — the ghost goes
   *  red and `place` refuses. AABB-vs-AABB per ghost update, nothing per
   *  frame. Since the stage-6 K3 pass the box arrives WITH the name of the
   *  object that owns it (`setPlacementGuard`), because the refused line has
   *  to NAME the thing that refused it — see `solidWord`. */
  solids?: readonly SetGuard[];
  /** Called at the TOP of every `place()` INTENT (button click, Enter, and
   *  the canvas click that holds a piece) BEFORE the attempt decides — the
   *  shell uses it to collapse a still-open result panel into the build
   *  view, so a Place click with the modal up auto-dismisses into the view
   *  the placement is visible in, then places (playtest BB item 2: the
   *  click behind an open result modal was a silent no-op). */
  onPlaceIntent?: () => void;
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
  /** TAKE THE GHOST AND THE RING OUT of the scene about to be destroyed
   *  (R7, mirroring the set group's law): `World.dispose` traverses the
   *  scene it frees and disposes every mesh geometry and material it
   *  finds, and these two belong to the BUILDER, not to any one world.
   *  Left in place, every placement paid a shader recompile and a
   *  geometry re-upload for the ghost and the target ring — a
   *  placement-time hitch on weak GPUs for things that are never
   *  re-created. The shell calls this before `world?.dispose()`. */
  liftFromScene(): void;
  /** Attach the game canvas (stores the projection camera). Pointer
   *  GESTURES are owned by `attachBuildView` (`src/camera/build-camera.ts`),
   *  which calls `aimAt` on hover and `clickPlaceAt` on a clean click. */
  attachCanvas(canvas: HTMLElement, camera?: THREE.Camera): void;
  /** Hover aims the target ring at the socket nearest this screen point.
   *  Among screen-space near-ties the NEARER socket (camera distance)
   *  wins, and the tie list becomes walkable (`cycleAim`). */
  aimAt(clientX: number, clientY: number): void;
  /** Re-derive the target for the LAST pointer position under the LIVE
   *  transform — fired whenever the canvas rect may have moved without a
   *  new pointer event (toolbar rows appearing/wrapping above the canvas,
   *  window resize). The ghost-offset defence (playtests V+W round5). */
  revalidateAim(): void;
  /** Walk the ring among the near-ties of the last aim point ([ / ] —
   *  never Tab, which stays the browser's focus walk): when screen space
   *  cannot separate two sockets, the player —
   *  not the projector — picks which one the ghost means. */
  cycleAim(delta: number): void;
  /** The open target sockets in list order (world positions) — the e2e
   *  seam the aim-depth proof reads to find screen-space near-ties. */
  openSockets(): Socket[];
  /** The tie candidates of the LAST aim as canonical DRY-RUN hashes (the
   *  rig fingerprint of the build each socket would produce with the held
   *  piece; empty-handed ties key on the socket origin). The e2e seam for
   *  "the tie hint counts DISTINCT BUILD OUTCOMES, not sockets". */
  tieOutcomes(): string[];
  /** The tie candidate SOCKETS (full frames) of the last aim — the e2e
   *  seam that recomputes the dry-run hashes test-side. */
  tieSockets(): Socket[];
  /** What the failure note should name as the place to build NEXT, plus
   *  whether the visible ring already marks it — the build-graph side of the
   *  WHERE tail (see `AimHint`; stage 6, playtest DD). Null when the build
   *  has no open end at all. */
  aimHint(): AimHint | null;
  /** The CURRENT ring's socket in CSS client px — where a click must land
   *  to be a click ON the shown ghost (`ringWithinReach`'s own reach) —
   *  null when it is off-screen or behind the camera. The e2e seam for
   *  specs that must express a LEGITIMATE place intent under the aim
   *  reach law (playtest R's click-places contract is about the click
   *  gesture, not about aiming at empty space). */
  targetSocketPx(): { x: number; y: number } | null;
  /** What is IN HAND right now — kind, the EXACT params the ghost and the
   *  dry run seat with (the tray override when there is one, else the
   *  kind default), and the flip flag. The e2e seam that lets the
   *  test-side dry-run recomputation share the app's inputs (a hash
   *  recomputed at DEFAULT params while the tray holds level-gap params
   *  would disagree about geometry, not about the tie law). */
  heldState(): { kind: PieceKind | null; params: PieceParams; flipped: boolean };
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

/**
 * One solid of the mounted set, with the name of the object that owns it
 * (`cereal-bowl`, `tap`, `lazy-pencil/pencil-shaft`). The builder only asks
 * whether a seat overlaps a box, but stage 6 made it ask WHICH box: the
 * kitchen03 wall was a red ghost that said "blocked — furniture is in the
 * way" over the cereal BOWL, on a rung named "The Bowl" — read by two
 * strangers as "move the furniture" (playtest DD: "the only snap is a curve
 * exit the game itself says is blocked"), so the refusal names the object.
 */
export interface SetGuard {
  name: string;
  box: THREE.Box3;
}

/** The player word for a guard name: the top-level object's own name, words
 *  apart (`cereal-bowl` → "cereal bowl"; `mug/mug-body` → "mug", the group
 *  name, never the mesh's). Lowercased to sit inside a sentence.
 *  Exported so the note and the specs read the SAME word the ghost speaks. */
export function solidWord(name: string): string {
  return (name.split('/')[0] ?? name).replaceAll('-', ' ').trim().toLowerCase();
}

/** The player word a REFUSAL speaks: `solidWord` of the guard's object path,
 *  with an HONEST fallback when the path has no sayable top segment — a
 *  guard whose FIRST path segment is anonymous (an unnamed group under
 *  `dress` paths `/mug-body`) would otherwise print "blocked — the  is in
 *  the way". The fallback is the VERB TABLE's own furniture word, so
 *  `ghostCopy` renders exactly the shipped `GHOST_LABEL.blocked` line
 *  ("blocked — furniture is in the way") — the blocked-rung copy law, never
 *  a blank or an invented noun. */
export function guardWord(name: string): string {
  const word = solidWord(name);
  return word === '' ? 'furniture' : word;
}

/** Where the failure note should send the player NEXT (stage 6, playtest DD:
 *  "the only snap is a curve exit the game itself says is blocked; building
 *  backwards from the cup runs off-table" — the advice named kinds, never a
 *  place, so every retry extended the WRONG end). `label` is the socket the
 *  NEXT piece extends the line from — the far open end of the chain as built,
 *  the same socket `chainHeadIndex` aims the boot default at (playtest N's
 *  law: that socket IS the head of the par line) — and `ringHere` says whether
 *  the visible ring already marks it, so the note only teaches the walk when
 *  the ring is somewhere else. UI-side advice only: nothing here reaches the
 *  physics or a run hash. */
export interface AimHint {
  label: string;
  ringHere: boolean;
}

interface Target {
  socket: Socket;
  label: string;
  /** Set when this open end belongs to the FINISH fixture: the run ENDS at
   *  that object, so a piece seated past it can never be reached — the ghost
   *  still seats (it is a legal seat) but the line must not read as an
   *  invitation (playtest DD built six backwards lines off the cup). */
  goal?: string;
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
  // WHAT THE VERDICT LINE IS REACTING TO (stage 6, kitchen03 pass): the set
  // solid that refused the AIMED seat (`aimBlocker`, the object's player word)
  // and the goal word when the aimed socket is the FINISH fixture's own open
  // exit (`aimGoal`). Both are recomputed by `updateGhost` on every aim, so a
  // line never carries a stale tell.
  let aimBlocker: string | null = null;
  let aimGoal: string | null = null;
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
  // THE REMOVE BUTTON NAMES WHAT IT TAKES (program T2.1, the kitchen03
  // residual the 2026-10-09 player evaluation re-counted): Remove is
  // last-in-first-out, and a stranded piece past the goal made that LIFO a
  // mystery — "clear and rebuild" by guesswork. The label now carries the
  // same socket-graph words the ring and the note speak: the piece word
  // plus where it sits — `by the ramp` / `by the lip` (the anchor its
  // entry is joined to), `past the cup` (seated on the finish's own exit —
  // the orphan the MOVE clause names), `at the car's start point` (on the
  // bare release socket), or `you placed last` for a piece the graph can
  // locate by nothing else — so the button says WHICH piece this click
  // takes, and the LIFO law is in the label (`title`/`aria-label` say it
  // outright). The spoken `removed the X` line stays exactly as shipped:
  // the button is where the naming lives, the specs' strings are untouched.
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
  // THE HOME RESET, ONE HONEST SENTENCE (playtest U round4: "hint rendered
  // 'Home: Esc Esc'" — an echo of the DOUBLE-press gesture that reads like a
  // stuck key): the gesture is two Escapes inside RECENTER_MS (see
  // `build-camera.ts`), so the line says the number of presses plainly.
  // THE "OTHER SPOT" KEY IS ONE KEY EVERYWHERE (stage 5, playtest AA: "the
  // J/] 'other spot' hint is inconsistent: one level says press J, the next
  // says press ]"). The binding that walks spots is `]` (cycleAim — ties
  // when the pointer found a near-tie, the whole target list otherwise —
  // see the keydown table below); the arrows keep working, but no player
  // line names a second key for the same job. This line and the tie tail
  // in `updateGhost` are the page's only two other-spot hints — both now
  // say `]`. The old "hover the world or ←→" taught a different key for
  // the same verb, which is exactly the inconsistency AA heard.
  hint.textContent = 'Aim: hover the world or press ] for the other spot · Place: click the world or Enter · Flip: R · Launch: L · Look: right-drag · Home: press Esc twice';
  hint.hidden = true;
  root.appendChild(hint);
  // the VISIBLE reason behind every greyed/spent tray button — one counter,
  // the tray legend itself; ×N counts what is LEFT and decrements as pieces
  // are placed (playtest G: "×2 stayed ×2")
  const trayReason = document.createElement('p');
  trayReason.id = 'gw-tray-reason';
  // WHICH pieces the player owns (playtest Z round7: "a piece listed with
  // no ×N, yet 4 of 4 used — which pieces did I actually own?"): the line
  // states all three ways a piece appears — greyed (not stocked), ×N
  // (stocked, counts down as placed), and BUILT IN (already on the track,
  // never in the tray, never counted).
  trayReason.textContent =
    'Greyed pieces are not in this level · ×N counts pieces left to place · pieces already on the track came with the level';
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
    // no animation possible (ghost not on screen yet) or not asked for —
    // or the player asked for REDUCED MOTION (stage 6 a11y, Feel.md's law:
    // every animation has a no-motion equivalent; the flip's still frame is
    // its END pose, so R stays visible as a change of pose, never as a
    // tween) — snap, and cancel any in-flight flip so nothing overwrites
    // the matrix
    if (!animate || !ghostGroup.visible || prefersReducedMotion()) {
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
    // THE START SOCKET, NAMED PLAINLY (playtest R: "target: level start???";
    // playtests Y+X round6: "where the car starts" READ AS A PIECE NAME):
    // an open start socket is the car's RELEASE POINT — the label is a
    // plain NOUN of place that cannot parse as a kit piece. Once a piece is
    // seated on it the socket is taken and the piece's own exit labels aim.)
    if (!startTaken) out.push({ socket: level.startSocket, label: 'the car\u2019s start point' });
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
      // visible thing instead. A piece of a kind the TRAY never stocks (a
      // fixture: kitchen02's run-out `curve`, greyed in the tray — playtest
      // Y round6: "target: end of curve" with "Curve is greyed; none exists",
      // read as advice to place an unplaceable piece) says PRE-BUILT first:
      // the label may name the visible object, but must never name a greyed
      // kind as if it were an option. Every tray-stockable kind keeps the
      // measured-good "end of X" the playtesters read as chain order.
      if (!taken)
        out.push({
          socket: exit,
          label:
            piece.def === 'finishCup'
              ? 'cup on the table'
              : locked(piece.def)
                ? `end of the pre-built ${pieceLabel(piece.def).toLowerCase()}`
                : `end of ${pieceLabel(piece.def).toLowerCase()}`,
          // THE GOAL'S OPEN END is flagged for the verdict line: seating a
          // piece here is legal (the ghost says so) but the run ENDS at the
          // goal object, so a line built past it is a line no car ever
          // travels — the trap two strangers fell into on kitchen03
          // (playtest DD: "building backwards from the cup runs off-table").
          goal: piece.def === 'finishCup' ? pieceLabel(piece.def).toLowerCase() : undefined,
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
    return flipPlacement(target, held, heldParams(held), flipped);
  }

  /** Which set solid (if any) the seat's world AABB overlaps — and WHICH
   *  object owns it, so the refusal can name it. The kitchen03 lesson: on a
   *  rung called "The Bowl" the blocker is the cereal bowl itself, and a line
   *  that said only "furniture" read as "move it" (playtest DD, wall #1). */
  function blockerOf(transform: THREE.Matrix4, held: PieceKind): string | null {
    if (solids.length === 0) return null;
    const box = new THREE.Box3();
    for (const geo of pieceGeometries(held, heldParams(held))) {
      geo.computeBoundingBox();
      if (geo.boundingBox) box.union(geo.boundingBox.clone().applyMatrix4(transform));
    }
    if (box.isEmpty()) return null;
    box.expandByScalar(-0.002);
    const hit = solids.find((s) => s.box.intersectsBox(box));
    // NO hit is the whole answer: the seat is free. (Returning a word here
    // would mark every legal seat blocked.)
    if (hit === undefined) return null;
    return guardWord(hit.name);
  }

  /** THE VERDICT LINE, with the two tells the kitchen03 wall needed
   *  (playtest DD: "the only snap is a curve exit the game itself says is
   *  blocked — furniture is in the way"; "building backwards from the cup
   *  runs off-table"). A red seat NAMES the object that refused it and
   *  points at the verb that has an answer (`AIM_WALK_COPY`); a GREEN seat
   *  past the finish fixture says what the seat cannot do — a piece beyond
   *  the goal is never travelled, because the run ends at the goal. Both
   *  stay inside the VERB TABLE: the words are `blocked` and `fits here`,
   *  never a new state name.
   *
   *  `blocker` is the solid's player word (`solidWord`), `goal` the finish
   *  fixture's word when the aimed socket is the finish's own open exit;
   *  both null everywhere else, which leaves the shipped copy untouched.
   *  The FIRST flipped fit of a session still appends `FLIP_WHY` once. */
  function ghostCopy(
    echo: boolean,
    blocker: string | null = aimBlocker,
    goal: string | null = aimGoal,
  ): string {
    if (state === 'blocked') {
      const head =
        blocker === null || blocker === 'furniture'
          ? GHOST_LABEL.blocked
          : `blocked — the ${blocker} is in the way`;
      return `${head} · ${AIM_WALK_COPY}`;
    }
    const verb = echo && state !== 'hidden' ? `${GHOST_LABEL[state]} · rotated` : GHOST_LABEL[state];
    const why = state === 'reversed' && !flipWhyShown;
    if (state === 'reversed') flipWhyShown = true;
    const line = why ? `${verb} — ${FLIP_WHY}` : verb;
    // the past-the-goal tell rides a legal GREEN seat only — a flipped fit
    // past the cup already carries the reversed WHY on this line
    return state === 'snapped' && goal !== null
      ? `${line} — the run ends at the ${goal}, so nothing past it is ever travelled`
      : line;
  }

  function updateGhost(animate = false, echo = false): void {
    rebuildGhostGeometry();
    const list = targets();
    if (targetIndex >= list.length) targetIndex = Math.max(0, list.length - 1);
    // THE RING KEEPS ITS SOCKET'S LABEL: whenever a target exists the
    // label line names its socket — held piece or not (playtest Q: the
    // white rings were mute; the ring is always the answer to "where will
    // it go", so it is never silent).
    // AIM-vs-GOAL PHRASING (playtest Z round7: "target: the car's start
    // point" WHILE HOLDING a piece read as "a place to put it" — the word
    // `target` was doing double duty as the star rules' GOAL (par, the cup)
    // and the ring's AIM). While a piece is held the line says the verb it
    // means — `place drop at: …`; empty-handed the ring keeps the neutral
    // `target:` (the ring-hint line already teaches it as "where it will
    // land"). The socket labels are unchanged; tie tails unchanged.
    const aimVerb = kind === null ? 'target' : `place ${pieceLabel(kind).toLowerCase()} at`;
    targetLabel.textContent =
      list.length > 0
        ? aimTies.length > 1 && targetIndex === aimTies[aimTieCursor]
          ? // THE CHOICE IS VISIBLE — and NAMED IN PLAIN WORDS with the key
            // that walks it (playtest U round4: "'other one with [ ]' —
            // brackets never named"; the bracket pair was read as a checkbox
            // glyph, not keys). Shown ONLY while a near-tie is live (the
            // same `aimTies.length > 1` gate — no ambiguity, no hint); the
            // ring itself shows WHICH socket is marked. THE LINE CHANGES
            // UNDER THE KEY (playtest X round6: with exactly two ties the
            // two states read IDENTICALLY — "press ] for the other one" in
            // both — so `]` looked dead; the counter tail now also speaks
            // from the second pick onward, the states differ in the words).
            aimTies.length === 2 && aimTieCursor === 0
              ? `${aimVerb}: ${list[targetIndex]!.label} · two spots fit here — press ] for the other one`
              : `${aimVerb}: ${list[targetIndex]!.label} · ${aimTies.length} spots fit here — press ] for the next one (${aimTieCursor + 1} of ${aimTies.length})`
          : `${aimVerb}: ${list[targetIndex]!.label}`
        : '';
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
        aimBlocker = null;
        aimGoal = null;
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
        aimBlocker = blockerOf(m, kind);
        aimGoal = list[targetIndex]!.goal ?? null;
        state = aimBlocker !== null
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
    // reversed ghost of the session also says WHY, once — playtests P/Q;
    // the blocked and past-the-goal tails are the stage-6 K3 tells)
    if (list.length === 0) {
      aimBlocker = null;
      aimGoal = null;
    }
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
    // THE BUTTON NAMES ITS DROP SPOT (playtest DD: the plain "Place" label
    // hid every re-aim the mouse transit made on the way to it, so ~10
    // kitchen01 launches built the wrong track). One truth with the ring:
    // the button places at `list[targetIndex]` — this label is that
    // socket's ratified name, the SAME words `#gw-target-label` speaks
    // (minus the aim verb and the tie tail), so the line and the button
    // can never disagree. When the button cannot place it names no spot.
    const canPlace =
      kind !== null &&
      list.length > 0 &&
      trayPlaced() < level.budget &&
      (allowance(kind) === null || placedOf(kind) < allowance(kind)!);
    placeBtn.textContent = canPlace
      ? `Place \u2014 ${list[Math.min(targetIndex, list.length - 1)]!.label}`
      : 'Place';
    placeBtn.setAttribute('aria-disabled', String(!canPlace));
    // THE REMOVE BUTTON NAMES WHAT IT TAKES (T2.1): the same LIFO index
    // the click will take, phrased in the socket-graph words the ring and
    // the failure note already speak — the LIFO law stated in the label.
    {
      const ri = removeIndex();
      remove.textContent = ri < 0 ? 'Remove piece' : `Remove the ${removePhrase(pieces[ri]!)}`;
      remove.title = 'removes the last piece you placed';
      remove.setAttribute(
        'aria-label',
        ri < 0 ? 'Remove the last piece you placed' : `Remove the ${removePhrase(pieces[ri]!)} — the last piece you placed`,
      );
    }
  }

  /** Once-per-session flip legibility: the reversed label carries the WHY
   *  tail exactly once (the flag is per page session — a reload re-teaches,
   *  which is the right scope for "once per session"). */
  let flipWhyShown = false;
  // the empty-handed sibling of the same once-per-session flag (playtest
  // R's K4 wall): the FIRST press that ARMS the reversal with nothing
  // held says so once; later arms and every un-arm stay quiet.
  let reversingShown = false;

  function emit(): void {
    outcomeMemo.clear(); // the tie-outcome fingerprints saw the OLD build
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
    aimTies = []; // the arrows walk the socket list, leaving the pointer's ties
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
    // EMPTY-HANDED R SAYS WHAT IT DID (playtest R's K4 wall): with no
    // ghost on screen the toggle used to be invisible; the first press
    // that arms the reversal of a session states it once on the same
    // line (REVERSING_WHY), and the next action — the first place
    // included — retires it.
    if (flipped && kind === null && !reversingShown) {
      stuckNote = REVERSING_WHY;
      reversingShown = true;
    }
    updateGhost(true, true);
  }

  function place(): boolean {
    const list = targets();
    if (kind === null) {
      // THE PLACE BUTTON WITH NOTHING IN HAND SAYS SO (playtest BB item 2:
      // the empty-handed button click was the silent branch; the canvas
      // path already spoke its line — the button gets its own). Two laws
      // it must not break: a one-shot note still standing ("last Drop
      // placed") keeps the line (the refusal must not clobber a fresher
      // truth — playtest P+Q), and an empty intent is NOT a build intent:
      // the shell's modal collapse below belongs to attempts that can
      // actually change the build (Q's law — Enter with the panel up
      // dismisses nothing).
      ghostState.textContent = stuckNote ?? 'nothing in hand — pick a piece from the tray first';
      return false;
    }
    // THE BUILD INTENT SPEAKS TO THE SHELL FIRST (playtest BB item 2): a
    // place attempt WITH a piece in hand retires a standing result panel
    // into the build view BEFORE the attempt, so the placement (or the
    // refusal line) is what the player sees — never a click swallowed by
    // a modal.
    options.onPlaceIntent?.();
    stuckNote = null;
    aimTies = []; // a mutation retires the last aim point's ties
    if (list.length === 0) {
      // NEVER SILENT (playtest R: "fits here shown, click = nothing") — a
      // place-intent with nowhere to land says so on the status line
      ghostState.textContent = 'nowhere to place — the line has no free end';
      return false;
    }
    if (trayPlaced() >= level.budget) {
      // nothing left ANYWHERE — a hold here is a stranded hold; release it
      if (!selectable(kind)) setKind(null);
      // on a TRAY level the legend already tells this story per kind; the
      // line only appears where the tray cannot say it (sandbox budgets)
      ghostState.textContent = trayKinds
        ? 'every piece in the tray is placed'
        : 'no pieces left to place';
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
    const blocker = blockerOf(transform, kind);
    if (blocker !== null) {
      // the REFUSAL says who refused it and where the walk is (the same line
      // the red ghost already wears — a click that changes nothing is never
      // quieter than the ghost that warned about it)
      state = 'blocked';
      aimBlocker = blocker;
      aimGoal = list[targetIndex]!.goal ?? null;
      ghostState.textContent = ghostCopy(false);
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

  /** The index LIFO Remove takes — the last piece the TRAY owns (the
   *  scan `removeLast` performs, factored so the BUTTON LABEL can name
   *  the same piece the CLICK will take; one source, no drift). */
  function removeIndex(): number {
    let i = pieces.length - 1;
    if (trayKinds) {
      while (i >= 0 && !trayKinds.has(pieces[i]!.def)) i -= 1;
    }
    return i;
  }

  /** Where this piece sits, in the page's existing socket words (the
   *  anchor its ENTRY is joined to — `by the ramp`, `past the cup` on the
   *  finish's own exit, the release point by name). A piece the graph
   *  cannot locate by anything else is honestly located by the LIFO law
   *  itself: it IS the last one placed. */
  function removePhrase(p: PlacedPiece): string {
    const w = pieceLabel(p.def).toLowerCase();
    const entry = transformSocket(PIECES[p.def].sockets(p.params)[0], p.transform);
    const anchor = pieces.find(
      (q) =>
        q.seq !== p.seq &&
        transformSocket(PIECES[q.def].sockets(q.params)[1], q.transform).pos.distanceTo(entry.pos) < JOIN_TOL,
    );
    if (anchor) {
      if (anchor.def === 'finishCup') return `${w} past the ${pieceLabel(anchor.def).toLowerCase()}`;
      return `${w} by the ${pieceLabel(anchor.def).toLowerCase()}`;
    }
    if (entry.pos.distanceTo(level.startSocket.pos) < JOIN_TOL) return `${w} at the car\u2019s start point`;
    return `${w} you placed last`;
  }

  function removeLast(): boolean {
    stuckNote = null;
    // REMOVE SAYS WHAT IT DID (playtest Z round7: two clicks "eaten" with
    // the counter unmoved and no line — the button looked like a MODE that
    // quietly turned itself off; it is one SHOT per click, and every shot
    // now speaks, success or refusal — never silent state drift).
    if (pieces.length === 0) {
      ghostState.textContent = 'nothing to remove — the track is empty';
      return false;
    }
    const i = removeIndex();
    if (i < 0) {
      // only the level's own fixtures remain: nothing the button owns
      ghostState.textContent = 'nothing to remove — only the level’s own pieces are on the track';
      return false;
    }
    const removed = pieceLabel(pieces[i]!.def).toLowerCase();
    pieces = pieces.filter((_, j) => j !== i).map((p, j) => ({ ...p, seq: j }));
    everPlaced = trayPlaced() > 0;
    // a one-shot line that survives the rebuild the emit triggers (the
    // same stuckNote channel the other refusal lines use)
    stuckNote = `removed the ${removed}`;
    updateGhost();
    emit();
    return true;
  }

  // ---- canvas aiming (hover aims, click places — gestured upstream) -------
  let canvasEl: HTMLElement | null = null;
  let camera: THREE.Camera | null = null;
  /** The near-tie candidates of the LAST aim point, ordered NEAR-DEPTH
   *  first (screen space cannot separate them, depth can — playtest S K3);
   *  `cycleAim` walks the player through this list so the choice is never
   *  a silent projection coin-flip. Emptied by any mutation or arrow-walk
   *  (the ties belong to a screen point, not to the build). */
  let aimTies: number[] = [];
  let aimTieCursor = 0;
  /** Memo for the dry-run rig fingerprints (`aimCandidates`) — keyed by
   *  kind + flip + socket origin; the fingerprint depends on the CURRENT
   *  piece list too, so `emit` (the single mutation choke point: every
   *  place/remove funnels through it) empties the memo. */
  const outcomeMemo = new Map<string, string>();
  /** The last pointer position aim/place were asked about, in CLIENT px —
   *  the position `revalidateAim` re-derives the target from whenever the
   *  canvas RECT moves under a still cursor (playtests V+W round5: the
   *  hint lines ABOVE the canvas appear/hide mid-session and teleport the
   *  canvas ~40–80 px; the per-event rect read is then correct but stale
   *  until the NEXT mousemove, and the ghost sits at a constant offset).
   *  The layout itself is steadied (`min-height` reservations in
   *  `src/ui/shell.css`); this converges every residual shift — wrap,
   *  resize, anything above the canvas changing — immediately. */
  let lastAim: { x: number; y: number } | null = null;
  /** The canvas rect `lastAim` was decided UNDER (cheap identity: four
   *  numbers). `revalidateAim` compares, so an unchanged layout costs one
   *  `getBoundingClientRect` per frame and nothing else. */
  let aimRect = { l: NaN, t: NaN, w: NaN, h: NaN };

  /** Re-run the hover aim for the LAST pointer position when the canvas
   *  RECT has moved since the aim was decided — the ghost-offset defence
   *  (playtests V+W round5). Runs every animation frame (and on any
   *  pointer event through `aimAt`'s own rect read); an idle, unmoved
   *  page pays one rect comparison. A moved rect re-derives the target
   *  for the still cursor — the ghost is ALWAYS the answer to "where
   *  would a click here place", recomputed, never a stale freeze-frame
   *  left hovering where the canvas used to be. Scroll included: a
   *  scrolling page genuinely moves the world under a still cursor.
   *
   *  The fast path — CURRENT target still a legitimate pick of this
   *  cursor point — returns without churning the tie list, so a `]`-walk
   *  tie selection survives a layout move in which it remains an option. */
  function revalidateAim(): void {
    if (!lastAim || !canvasEl || !camera) return;
    const rect = canvasEl.getBoundingClientRect();
    if (rect.left === aimRect.l && rect.top === aimRect.t && rect.width === aimRect.w && rect.height === aimRect.h) return;
    aimRect = { l: rect.left, t: rect.top, w: rect.width, h: rect.height };
    const list = targets();
    const idx = list.length > 0 ? Math.min(targetIndex, list.length - 1) : -1;
    if (idx >= 0) {
      const p = worldToClientPx(canvasEl, camera, list[idx]!.socket.pos);
      if (p && Math.hypot(p.x - lastAim.x, p.y - lastAim.y) <= HOVER_PX) {
        const fresh = aimCandidates(lastAim.x, lastAim.y);
        if (fresh.includes(idx)) return; // still the right pick
      }
    }
    aimAt(lastAim.x, lastAim.y);
  }

  function aimAt(clientX: number, clientY: number): boolean {
    lastAim = { x: clientX, y: clientY };
    aimRect = { l: NaN, t: NaN, w: NaN, h: NaN }; // re-sampled next frame
    const cands = aimCandidates(clientX, clientY);
    if (cands.length === 0) {
      aimTies = [];
      return false; // nowhere to aim here — the ring keeps the last real target
    }
    aimTies = cands;
    aimTieCursor = 0;
    const pick = cands[0]!;
    targetIndex = pick;
    // ALWAYS refresh: a tie changes the LABEL even when it keeps the index
    updateGhost();
    return true;
  }

  function cycleAim(delta: number): void {
    if (aimTies.length < 2) {
      // no ambiguity to walk: the keys stay the arrow keys' story
      cycleTarget(delta);
      return;
    }
    aimTieCursor = (aimTieCursor + delta + aimTies.length) % aimTies.length;
    const idx = aimTies[aimTieCursor]!;
    if (idx < targets().length) {
      targetIndex = idx;
      updateGhost();
    }
  }

  function clickPlaceAt(clientX: number, clientY: number): void {
    lastAim = { x: clientX, y: clientY };
    // THE CLICK IS THE GHOST'S SOCKET, EXACTLY (playtests T+U round 4:
    // "the ghost showed one socket, the click landed elsewhere / nowhere,
    // and the failure line never fired"). If the RING is within click
    // reach of the release point the player clicked THE SHOWN GHOST, so
    // the placement binds to the ring's own socket rather than re-
    // projecting a rival: the pose keeps damping for ~0.5 s after an
    // orbit or pan, and a click that re-decides the aim on its own can
    // land on a socket the ghost never showed. Only a click AWAY from
    // the ring re-aims (clicking somewhere else means "aim there", the
    // same rule hover-aim implements — this shares the aim transform
    // rather than duplicating it). Either way the intent then SPEAKS:
    // `place` explains every refusal, and an empty-handed click says the
    // piece is not in hand (never a silent no-op).
    if (!kind) {
      // EMPTY-HANDED speaks FIRST (playtest U): the missing thing is the
      // piece, not the aim — say that wherever the click fell, and let
      // the aim ride along as feedback only (a reachable point refreshes
      // the ring, a far one moves nothing).
      aimAt(clientX, clientY);
      ghostState.textContent = 'nothing in hand — pick a piece from the tray, then click to place';
      return;
    }
    // THE CLICK AIMS OR IT SPEAKS (playtest BB bug 4, the round-3
    // recurrence: "click at 700,600 placed a lip 150 px away and it
    // counted"). The old sequence re-aimed and then placed UNCONDITIONALLY
    // — and when the aim found nothing the UNMOVED ring was still a
    // target, so the click silently placed the stale aim metres from the
    // cursor. A click that is neither ON the shown ring nor within aim
    // reach of any socket is a click on open space: it places NOTHING,
    // moves nothing, and says so. A standing result panel still retires
    // FIRST (BB item 2's collapse law — a piece-in-hand build intent speaks
    // TO the build view before it speaks to the player), so the refusal
    // lands on the build page, never behind a modal (playtest N's swallow).
    if (!ringWithinReach(clientX, clientY) && !aimAt(clientX, clientY)) {
      options.onPlaceIntent?.();
      ghostState.textContent = 'nothing fits out here — click nearer the ring or an end of the line';
      return;
    }
    place();
  }

  /** True when the CURRENT target (the socket the ring/ghost sits on)
   *  projects within `HOVER_PX` of this screen point — the reach a click
   *  has, identical to `socketCandidates`' rule. */
  function ringWithinReach(clientX: number, clientY: number): boolean {
    if (!camera || !canvasEl) return false;
    const list = targets();
    const t = list[Math.min(targetIndex, list.length - 1)];
    if (!t) return false;
    const p = worldToClientPx(canvasEl, camera, t.socket.pos);
    if (!p) return false;
    return Math.hypot(p.x - clientX, p.y - clientY) <= HOVER_PX;
  }

  /** The open sockets a pointer position could mean, ordered NEAR-DEPTH
   *  first: everything within the `HOVER_PX` SNAP RANGE on screen (the
   *  cone the cursor points — see `HOVER_PX`'s note: the range cap lives
   *  here, not in a redundant metre constant), reduced to the near-ties
   *  of the screen-nearest one (within `AIM_TIE_PX` of its screen
   *  distance), then sorted by CAMERA distance ascending — the
   *  nearer depth wins a screen-space tie (playtest S K3: the landing
   *  "always snapped onto the chain BEHIND the cup" because the far
   *  socket happened to project a few px closer). Empty when every open
   *  socket is farther than `HOVER_PX`. */
  function socketCandidates(clientX: number, clientY: number): number[] {
    if (!camera || !canvasEl) return [];
    const near: { i: number; dPx: number; dCam: number }[] = [];
    targets().forEach((t, i) => {
      const p = worldToClientPx(canvasEl!, camera!, t.socket.pos);
      if (!p) return; // behind the camera
      const d = Math.hypot(p.x - clientX, p.y - clientY);
      if (d <= HOVER_PX) near.push({ i, dPx: d, dCam: camera!.position.distanceTo(t.socket.pos) });
    });
    if (near.length === 0) return [];
    const best = Math.min(...near.map((c) => c.dPx));
    return near
      .filter((c) => c.dPx <= best + AIM_TIE_PX)
      .sort((a, b) => a.dCam - b.dCam || a.i - b.i)
      .map((c) => c.i);
  }

  /** The AIM list the ring and the tie hint are built from: the screen/
   *  world candidates of this point, REDUCED TO DISTINCT BUILD OUTCOMES
   *  (`distinctOutcomes` — the tie hint counts outcomes, not sockets).
   *  Fingerprints are memoised per kind + flip + socket origin; `emit`
   *  empties the memo, so the memo never outlives a mutation. With
   *  nothing held the sockets aim themselves (there is no placement to
   *  be equivalent at) and every tie stays walkable. */
  function aimCandidates(clientX: number, clientY: number): number[] {
    const cands = socketCandidates(clientX, clientY);
    if (!kind || cands.length < 2) return cands;
    const list = targets();
    const held = kind;
    const params = heldParams(held);
    const wasFlipped = flipped;
    const hash = dryRunHash(level.id, level.seed, pieces, held, params, wasFlipped);
    return distinctOutcomes(
      cands,
      (i) => list[i]?.socket,
      (socket) => {
        const key = `${held}|${wasFlipped ? 1 : 0}|${socket.pos.x.toFixed(6)},${socket.pos.y.toFixed(6)},${socket.pos.z.toFixed(6)}`;
        let fp = outcomeMemo.get(key);
        if (fp === undefined) {
          fp = hash(socket);
          outcomeMemo.set(key, fp);
        }
        return fp;
      },
    );
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
      // depth-disambiguation keys (playtest S K3): walk the ring among the
      // screen-space near-ties of the last aim point — the ring and the
      // label say which one the ghost means. THE KEYS ARE THE CHARACTERS:
      // `ev.key` for the bracket key is `]`/`[` (`BracketRight` is `ev.code`)
      // — mapping only the code names made both keys dead on the real page
      // and only visible once the round4 U playtest could not parse the
      // hint; both spellings are accepted, the characters are the contract.
      ']': () => cycleAim(1),
      '[': () => cycleAim(-1),
      BracketRight: () => cycleAim(1),
      BracketLeft: () => cycleAim(-1),
      // TAB IS NEVER HIJACKED (stage 6 a11y fix): the tie-walk rode on Tab
      // under world focus, which meant the FIRST Tab of a session could
      // never reach a button — a keyboard user arriving by Tab found the
      // focus walk dead. Tab is the browser's focus walk everywhere, on
      // every element; `[ ]` (and the arrows for sockets) walk the ties.
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
    // the bracket tie-keys are CODE names (playtest S follow-through:
    // the label advertises "[ ] to pick the other", but `]` arrives as
    // key ']' with code 'BracketRight' — keying the table by ev.key
    // alone made the advertised chord DEAD (aim-depth gate red at
    // HEAD round 4). Look up key first, code second.
    const fn = keys[ev.key] ?? keys[ev.code];
    if (!fn) return;
    // a focused <button> keeps its native Enter activation — preventing the
    // default there would CANCEL the click, not just the page action
    if (onButton && ev.key === 'Enter') return;
    // Tab is NOT in the table: over any element it stays the browser's
    // focus walk (stage 6 a11y — see the table above).
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
    liftFromScene() {
      ghostGroup.removeFromParent();
      marker.removeFromParent();
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
    revalidateAim,
    setKind,
    cycleKind,
    cycleTarget,
    cycleAim,
    rotate,
    place,
    removeLast,
    /** The open target sockets in list order (world positions) — the e2e
     *  seam the aim-depth proof reads to find screen-space near-ties. */
    openSockets: () => targets().map((t) => t.socket),
    tieOutcomes: () => {
      const list = targets();
      if (!kind)
        return aimTies.map((i) => (list[i] ? `@${list[i]!.socket.pos.toArray().map((v) => v.toFixed(6)).join(',')}` : ''));
      const hash = dryRunHash(level.id, level.seed, pieces, kind, heldParams(kind), flipped);
      return aimTies.map((i) => (list[i] ? hash(list[i]!.socket) : ''));
    },
    tieSockets: () => {
      const list = targets();
      return aimTies.map((i) => list[i]!.socket).filter(Boolean);
    },
    heldState: () => ({ kind, params: kind ? heldParams(kind) : {}, flipped }),
    playerCount: () => trayPlaced(),
    kind: () => kind,
    ghost: () => state,
    targetSocket: () => {
      const list = targets();
      return list.length > 0 ? list[Math.min(targetIndex, list.length - 1)]!.socket : null;
    },
    aimHint: () => {
      // The place the NEXT piece extends the line from — the far open end of
      // the start-connected chain (`chainHeadIndex`, the socket the boot
      // default is bound to) — and whether the ring already marks it. The
      // failure note's WHERE tail reads this (stage 6, playtest DD); it is
      // advice about the build graph, never about the physics.
      const list = targets();
      if (list.length === 0) return null;
      const head = Math.min(chainHeadIndex(), list.length - 1);
      return { label: list[head]!.label, ringHere: head === Math.min(targetIndex, list.length - 1) };
    },
    targetSocketPx: () => {
      const list = targets();
      const t = list.length > 0 ? list[Math.min(targetIndex, list.length - 1)] : undefined;
      if (!t || !canvasEl || !camera) return null;
      return worldToClientPx(canvasEl, camera, t.socket.pos);
    },
  };
}
