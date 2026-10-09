/**
 * THE GHOST RAIL (program T3.2, Action Plan 2026-10-09 "Ghost racing",
 * design evaluation §8 "the retention 10×"): a second car beside yours,
 * built ENTIRELY from shipped parts — a run is (level, build, seed) and the
 * deterministic sim says the same thing on any machine, so a ghost needs no
 * server and no new simulation: it is the STEP LIST of a run someone else's
 * build makes, replayed VISUALLY against yours.
 *
 * Two flavours, one mechanism:
 *
 * - PAR GHOST (G1): every campaign rung carries a `parBuild`; its trace is
 *   derived at level-load by winding the par build through the SAME
 *   `TapeRecorder` the share page winds (`src/replay/cinematic.ts`) on a
 *   HEADLESS world (`visuals: false`) — zero gameplay state, and the trace
 *   is the step-for-step list `replayRun({record:true})` produces (the
 *   seek law, `Modules/replay`). The par ghost is unaffected by any
 *   piece-order question: its build is the canonical array itself. (The
 *   cross-build order probe lives in `scripts/probe-piece-order.mjs`; its
 *   answer is recorded in `Modules/replay` and the Decision Log.)
 * - FRIEND GHOST (G2): a share link IS a ghost. The payload decodes with
 *   the existing `parseShareUrl`; their build mounts as the TRACK (the
 *   shell's own `rebuild` path — if it refuses to mount, the bar SAYS so,
 *   never a silent no-op), and their car is the trace of THAT build.
 *
 * THE VISUALS-ONLY LAW (Action Plan "Budget & laws"): the ghost is a
 * translucent rig mounted in the rendered scene and NOTHING else. It is
 * never a body, never in `hashedBodies`, never stepped — its pose is read
 * from the recorded trace at the live sim's own clock (`sync(world.time)`),
 * so the ghost and your car share the physics timestep by DATA, not by
 * coupling, and `replay:all` stays byte-identical with the ghost on.
 *
 * THE REDUCED-MOTION LAW (`src/ui/motion.ts`): a ghost is pure motion, so
 * reduced-motion players get the ghost OFF by default — the toggle stays
 * available (the still-frame law binds the decoration, not the player's
 * choice), and the preference persists in `settings.ghosts.par`.
 */
import * as THREE from 'three';
import type { Build } from '../track/build.ts';
import type { Level } from '../world/level.ts';
import { World } from '../world/world.ts';
import { TapeRecorder } from '../replay/cinematic.ts';
import { createCarRig, CAR_GROUND_LIFT } from '../render/car-rig.ts';
import type { CarRig } from '../render/car-rig.ts';
import type { SetTokens } from '../render/tokens.ts';

/** Steps wound per pump slice — the share page's idiom (`Modules/replay`):
 *  the wind rides message tasks (never rAF, never a clampable timer), so a
 *  backgrounded tab still finishes the tape. */
const WIND_SLICE_STEPS = 32;

/** One message-task yield between wind slices (`MessageChannel` first,
 *  `setTimeout` only where the port does not exist — same ladder as the
 *  share page's wind). */
function nextSliceTick(): Promise<void> {
  if (typeof MessageChannel !== 'undefined') {
    return new Promise((resolve) => {
      const ch = new MessageChannel();
      ch.port1.onmessage = () => resolve();
      ch.port2.postMessage(null);
    });
  }
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/** The minimum ghost-car transparency: present, never opaque — a ghost that
 *  occludes your car is an obstacle, not a ghost. */
const GHOST_OPACITY = 0.35;

/** A ghost car's recorded run: the sim's own per-step car states. `time` is
 *  the ghost's finish time (its terminal step's sim time). */
export interface GhostTrace {
  dt: number;
  steps: number;
  time: number;
  /** 3 per step, world metres — `state().car.pos`. */
  pos: Float64Array;
  /** 4 per step (x,y,z,w) — `state().car.quat`. */
  quat: Float64Array;
}

/**
 * Wind a build's run headless and return its car trace: the `TapeRecorder`
 * over a `visuals: false` world, pumped in slices so a long wind never
 * blocks a frame, `finish()`ed once. THE ORDER LAW (measured —
 * `scripts/probe-piece-order.mjs`): permuted piece order never moved a
 * shipped build's hash (`reify` canonicalises by `seq`), so this trace is
 * the build's run regardless of who wound it — but the PAR ghost never
 * leaned on that claim anyway: it winds the canonical array.
 *
 * Throws when the build will not run at all (an unknown kind, a build the
 * solver refuses) — the CALLER owes the honest line.
 */
export async function deriveGhostTrace(level: Level, build: Build): Promise<GhostTrace> {
  const world = await World.create(level, build, { visuals: false });
  try {
    const rec = new TapeRecorder(world, build);
    while (!rec.done) {
      rec.pump(WIND_SLICE_STEPS);
      if (!rec.done) await nextSliceTick(); // scheduling only — the trace
    }
    const trace = rec.finish(); // is step-identical to the one-shot wind
    return {
      dt: trace.dt,
      steps: trace.steps,
      time: trace.time,
      pos: trace.pos,
      quat: trace.quat,
    };
  } finally {
    world.dispose();
  }
}

/** The reduced-motion default (the law, not the setting): a ghost is motion,
 *  so reduced motion means OFF until the player asks otherwise. */
export function ghostDefaultEnabled(reducedMotion: boolean): boolean {
  return !reducedMotion;
}

export type GhostMode = 'off' | 'par' | 'friend';

export interface GhostState {
  mode: GhostMode;
  enabled: boolean;
  ready: boolean;
  racing: boolean;
  /** The ghost's recorded finish time (0 before a trace). */
  time: number;
  steps: number;
  /** Where the ghost car sits RIGHT NOW (world m, null with nothing mounted). */
  pos: [number, number, number] | null;
  /** Its own clock position along the trace (sim s). */
  at: number;
  finished: boolean;
}

/**
 * The ghost car: ONE translucent rig per game shell (the R7 law — it is the
 * shell's, lifted out before every `World.dispose` and re-mounted after,
 * exactly like the player's own rig). The pose wrapper rides the trace; the
 * rig hangs at the strut-rest lift like `carPoseGroup`, so both cars sit on
 * the deck on the same terms.
 */
export class GhostRace {
  readonly group = new THREE.Group();
  private readonly rig: CarRig;
  private trace: GhostTrace | null = null;
  private mode: GhostMode = 'off';
  private enabled = true;
  private racing = false;
  private mounted: THREE.Scene | null = null;
  private readonly scratchPos = new THREE.Vector3();
  private readonly scratchQuat = new THREE.Quaternion();

  constructor(tokens: SetTokens) {
    // THE TRANSLUCENT TREATMENT: the ratified rig with every material
    // dropped to a ghost translucency — same silhouette as the player's
    // car so the race reads as car-vs-car, `depthWrite: false` so it never
    // occludes the real one, shadows off so it never darkens the deck.
    this.rig = createCarRig(tokens);
    this.group.name = 'ghost-car';
    this.rig.group.traverse((o) => {
      if (!(o as THREE.Mesh).isMesh) return;
      const mesh = o as THREE.Mesh;
      mesh.castShadow = false;
      mesh.receiveShadow = false;
      for (const m of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
        const shader = (m as THREE.ShaderMaterial).uniforms?.opacity;
        if (shader) shader.value = GHOST_OPACITY; // the ToonMaterial's own dial
        m.transparent = true;
        m.depthWrite = false;
      }
    });
    this.rig.group.position.y = -CAR_GROUND_LIFT;
    this.group.add(this.rig.group);
    this.group.visible = false;
  }

  /** Persisted/player toggle: an off ghost mounts nothing and shows nothing. */
  setEnabled(on: boolean): void {
    this.enabled = on;
    if (!on) this.group.visible = false;
    else if (this.trace) this.sync(this._at);
  }

  /** Mount (or clear, with `null`) the trace the ghost races. */
  setTrace(mode: GhostMode, trace: GhostTrace | null): void {
    this.mode = trace ? mode : 'off';
    this.trace = trace;
    this.racing = false;
    this._at = 0;
    if (!trace) this.group.visible = false;
    else this.sync(0);
  }

  get ghostMode(): GhostMode {
    return this.mode;
  }

  /** The shared sim clock restarted (the shell's `startRun` calls this):
   *  the ghost goes back to its start pose and races from launch. */
  beginRace(): void {
    this.racing = true;
    this._at = 0;
    if (this.trace) this.sync(0);
  }

  /** A trace mounted WHILE a run was already underway (the par wind can
   *  land mid-race): the race flag joins the running clock without moving
   *  the car — the very next `sync` places it at the sim's own time. */
  resumeRace(): void {
    this.racing = true;
  }

  /** The race is over in the shell's eyes (Retry walks the car home): the
   *  ghost returns to the unpainted grid — it appears WITH the launch, the
   *  same beat the player's own car has on the table. */
  park(): void {
    this.racing = false;
    this._at = 0;
    this.group.visible = false;
  }

  private _at = 0;

  /** Place the ghost at the LIVE sim's clock: step `floor(t/dt)`, clamped at
   *  the trace's end (a ghost that finished waits at its finish — the still
   *  pose IS the information: it got there first). Never a blend — the same
   *  per-step seek law the replay page honours (`Modules/replay`).
   *
   *  IT APPEARS WITH THE LAUNCH: before a race is on (`racing` false — the
   *  grid, the walked-home Retry pose) the car is not painted. Two cars in
   *  ONE grid pose is a double-exposure, not a race — and the idle table
   *  stays the frame the committed shell baseline recorded. `suppressed`
   *  hides it for the premise beat, where the film IS the par line (the
   *  ghost would ride its own double through the whole beat). */
  sync(simTime: number, suppressed = false): void {
    const trace = this.trace;
    if (!trace || !this.enabled || !this.racing || suppressed) {
      this.group.visible = false;
      return;
    }
    this._at = simTime;
    if (trace.steps === 0) {
      this.group.visible = false;
      return;
    }
    const step = Math.min(
      trace.steps - 1,
      Math.max(0, Math.floor(simTime / trace.dt + 1e-6)),
    );
    this.scratchPos.set(trace.pos[step * 3]!, trace.pos[step * 3 + 1]!, trace.pos[step * 3 + 2]!);
    this.scratchQuat.set(
      trace.quat[step * 4]!,
      trace.quat[step * 4 + 1]!,
      trace.quat[step * 4 + 2]!,
      trace.quat[step * 4 + 3]!,
    );
    this.group.position.copy(this.scratchPos);
    this.group.quaternion.copy(this.scratchQuat);
    this.group.visible = true;
  }

  /** Carry the rig into a rebuilt world's scene (the R7 law — see the class
   *  header). A trace survives the rebuild unchanged: it is data, not a
   *  body; the wind already happened. */
  attachScene(scene: THREE.Scene): void {
    this.group.removeFromParent();
    scene.add(this.group);
    this.mounted = scene;
    if (this.trace) this.sync(this._at);
  }

  liftFromScene(): void {
    this.group.removeFromParent();
    this.mounted = null;
  }

  /** The e2e/debug read (`__gwGhostState`) — debug surface, not UI. */
  state(): GhostState {
    return {
      mode: this.mode,
      enabled: this.enabled,
      ready: this.trace !== null,
      racing: this.racing,
      time: this.trace?.time ?? 0,
      steps: this.trace?.steps ?? 0,
      pos: this.group.visible
        ? [this.group.position.x, this.group.position.y, this.group.position.z]
        : null,
      at: this._at,
      finished: this.trace !== null && this._at >= this.trace.time && this.trace.steps > 0,
    };
  }

  /** The mounted scene the rig currently hangs in (null between rebuilds). */
  get sceneMounted(): THREE.Scene | null {
    return this.mounted;
  }

  dispose(): void {
    this.rig.dispose();
    this.group.removeFromParent();
  }
}

export interface GhostBarHandlers {
  /** The player flipped the `ghost: par` toggle. */
  onToggle(on: boolean): void;
  /** A share URL was pasted and submitted — the shell decodes, mounts, and
   *  either races their car or SAYS why it cannot. */
  onFriendLink(url: string): void;
}

export interface GhostBar {
  bar: HTMLElement;
  toggle: HTMLButtonElement;
  link: HTMLInputElement;
  race: HTMLButtonElement;
  note: HTMLElement;
  setNote(text: string): void;
  clearNote(): void;
}

/**
 * The player's ghost controls, in the build view: a `ghost: par` toggle and
 * a paste-a-link field ("ghost: from link"). Same placement law as
 * `#gw-sound`/`#gw-save`: absolutely pinned, zero layout flow, and the
 * controls themselves are the only pointer targets — the committed shell
 * screenshot baseline must not move.
 */
export function createGhostBar(host: HTMLElement, handlers: GhostBarHandlers): GhostBar {
  const bar = document.createElement('div');
  bar.id = 'gw-ghost-bar';
  // A PAGE corner chip (the `#gw-save` row's idiom, bottom-LEFT to match
  // the sound chip's top-right): absolute, zero layout flow — the canvas
  // element's committed screenshot may catch its corner, which is the
  // same honesty the save row already ships (the baseline carries the
  // chrome as rendered, deterministically). Never inside `stage`: a
  // control absolutely positioned OVER the world is a double citizen in
  // every canvas capture.
  bar.style.cssText =
    'position:absolute;bottom:8px;left:12px;z-index:4;display:flex;gap:6px;align-items:center;font:12px system-ui,sans-serif';
  const chip =
    'pointer-events:auto;font:12px system-ui,sans-serif;padding:2px 8px;border-radius:4px;border:1px solid rgba(185,163,124,0.7);background:rgba(255,248,236,0.78);color:#6a5636;cursor:pointer';

  const toggle = document.createElement('button');
  toggle.id = 'gw-ghost-toggle';
  toggle.type = 'button';
  toggle.textContent = 'ghost: par';
  toggle.setAttribute('aria-label', 'Race the par line beside your car');
  toggle.style.cssText = chip;
  toggle.addEventListener('click', () => {
    const on = toggle.getAttribute('aria-pressed') !== 'true';
    toggle.setAttribute('aria-pressed', String(on));
    if (document.activeElement === toggle) toggle.blur(); // playtests P+Q focus policy
    handlers.onToggle(on);
  });

  const link = document.createElement('input');
  link.id = 'gw-ghost-link';
  link.type = 'text';
  link.placeholder = 'paste a share link to race it';
  link.setAttribute('aria-label', 'Share link to race as a ghost');
  link.style.cssText =
    'pointer-events:auto;width:150px;font:12px system-ui,sans-serif;padding:2px 6px;border-radius:4px;border:1px solid rgba(185,163,124,0.7);background:rgba(255,248,236,0.85);color:#6a5636';

  const race = document.createElement('button');
  race.id = 'gw-ghost-race';
  race.type = 'button';
  race.textContent = 'ghost: from link';
  race.style.cssText = chip;
  race.addEventListener('click', () => {
    if (document.activeElement === race) race.blur();
    handlers.onFriendLink(link.value.trim());
  });
  link.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter') handlers.onFriendLink(link.value.trim());
  });

  const note = document.createElement('span');
  note.id = 'gw-ghost-note';
  note.setAttribute('role', 'status');
  note.setAttribute('aria-live', 'polite');
  note.style.cssText = 'pointer-events:none;color:#6a5636';

  bar.append(toggle, link, race, note);
  host.appendChild(bar);
  return {
    bar,
    toggle,
    link,
    race,
    note,
    setNote: (t) => {
      note.textContent = t;
    },
    clearNote: () => {
      note.textContent = '';
    },
  };
}
