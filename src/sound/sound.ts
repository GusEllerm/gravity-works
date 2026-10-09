/**
 * `src/sound/sound.ts` — the sound engine: a small event bus in, WebAudio
 * out, zero assets, and a firewall against the simulation.
 *
 * THE FIREWALL (the stage-5 determinism rule, enforced architecturally):
 *
 * 1. Nothing in `src/world`, `src/physics`, or `src/render` imports this
 *   directory, and nothing here imports them (asserted by
 *   `tests/unit/sound.test.ts` against the real source text). There is no
 *   call path from `World.step` into an audio node.
 * 2. Every sound enters through an explicit call at a boot/UI hook — a
 *   button press, an edit, the terminal edge of a run. The ONLY values that
 *   are not plain outcomes are the two the screen itself renders: the
 *   car mesh's on-screen speed (the roll voice, updated at <=20 Hz — never
 *   per frame, never per sim step) and the car's visibly inverted pose
 *   (the ring ping's edge trigger). Both arrive via `engine.frame()`, a
 *   read-only sink called from the render loop AFTER the stepping block;
 *   the engine never calls back into the world.
 * 3. Autoplay policy: the AudioContext is constructed ONLY inside
 *   `unlock()`, which boot calls from the first real pointer/key gesture —
 *   never before, and nothing schedules a sound before that.
 * 4. No context / blocked context => the engine goes `deaf`: every method
 *   stays callable and does nothing. Sound can never take the game down.
 *
 * LOUDNESS & REPETITION: voices are capped by design gain (voices.ts) and
 * the master ceiling (bus.ts, -12 dBFS, measured offline in the e2e). A
 * per-run voice counter with a hard cap (`RUN_VOICE_CAP`) turns "a voice
 * fired dozens of times in one run" from an annoyance into a test failure:
 * voices attach to distinct EVENTS, so a par run never approaches the cap.
 */
import { loadSave, saveSave } from '../save/save.ts';
import type { SoundSettings } from '../save/save.ts';
import { makeBus, makeMaster, makeRoom, MASTER_CEILING, MASTER_TRIM } from './bus.ts';
import type { AudioBus } from './bus.ts';
import { startRoll, startRoomBed, VOICES, VOICE_NAMES, chime as chimeVoice } from './voices.ts';
import type { BedHandle, RollHandle, VoiceName } from './voices.ts';

export type { SoundSettings };

/** The gentle-mix tuning table (all numbers here, none inline). */
export const SOUND = {
  /** Default slider position (0..1) — under the ceiling by construction. */
  DEFAULT_VOLUME: 0.8,
  /** Max updates per second to the roll voice (brief: <=20 Hz). */
  ROLL_UPDATE_HZ: 20,
  /** A roll update also needs this much perceived change to count as one
   *  (a steady roll at constant speed costs one update, not twenty). */
  ROLL_SPEED_EPS: 0.05,
  /** Screen speed (world m/s) that maps to roll full speed. Measured: the
   *  par runs top out near 2.3 m/s world. */
  ROLL_FULL_SPEED: 2.5,
  /** The car's local up-axis Y below this = visibly inverted = mid-loop. */
  INVERTED_UP_Y: -0.2,
  /** Min spacing between ring pings (ms) — one ping per loop, not per
   *  frame inside the loop. */
  RING_MIN_GAP_MS: 600,
  /** Hard per-run cap per event voice: exceeding it is a design bug, so
   *  the guard drops the extra firings and a test fails loudly. */
  RUN_VOICE_CAP: 12,
  /** Kitchen clock tick spacing (ms) — sparse by brief. */
  TICK_MIN_MS: 900,
  TICK_MAX_MS: 1600,
  /** Garden bird spacing (ms) — sparser still. */
  BIRD_MIN_MS: 3500,
  BIRD_MAX_MS: 9000,
  /** R8: the volume slider's trailing persist window — the build-autosave
   *  shape (one write per DRAG BURST, not one per `input` event). Mute is
   *  a discrete verb and still persists immediately. */
  VOLUME_PERSIST_MS: 350,
} as const;

/** The event voices the repetition guard counts (bed voices are governed
 *  by their scheduler's minimum spacing instead — a clock tick is not a
 *  trigger, and a run can legitimately be long). */
export const EVENT_VOICES: readonly VoiceName[] = [
  'launch',
  'snap',
  'ring',
  'cup',
  'whoosh',
  'hum',
  'hazard',
  'chime',
  'victory',
  'blipPlace',
  'blipUndo',
];

/** The run outcome the engine hears at the terminal edge — exactly the
 *  fields the result panel prints (an OUTCOME, not a state stream). */
export interface RunSummary {
  status: 'finished' | 'fell' | 'stalled' | 'hazard' | 'timeout';
  stars: number;
  /** True when this run beat the save's best (progress, not repetition). */
  newBest: boolean;
  /** The hazard tally the panel reports. */
  hazardsTouched: number;
}

export interface SoundOptions {
  /** Initial settings (from the save envelope). */
  settings?: SoundSettings;
  /** Persist changed settings (boot wires this to the save module). */
  persist?: (s: SoundSettings) => void;
  /** Injectable AudioContext constructor (tests mock it; the browser
   *  default is `window.AudioContext`). */
  Ctor?: (new () => AudioContext) | undefined;
  /** Injectable ms clock. */
  now?: () => number;
  /** Injectable rng for bed spacing (tests make it deterministic). */
  random?: () => number;
  /** Injectable scheduler for the R8 volume-persist debounce (same shape
   *  `createBuildAutosave` takes; the browser default is setTimeout). */
  clock?: { schedule(fn: () => void, ms: number): unknown; cancel(handle: unknown): void };
}

/** The car-pose up-axis Y from a unit quaternion (rotate (0,1,0)) — the
 *  only rotation math in this directory, and the only thing looked at. */
export function upAxisYOfQuat(q: { w: number; x: number; y: number; z: number }): number {
  return q.w * q.w - q.x * q.x + q.y * q.y - q.z * q.z;
}

/** One frame's visible facts for the engine's throttled adapters. Only
 *  numbers the screen is already rendering; no world handles. */
export interface FrameSample {
  /** ms since last frame (wall clock). */
  dtMs: number;
  running: boolean;
  /** On-screen car speed (world m/s from the mesh's own motion). */
  screenSpeed: number;
  /** Car local up-axis Y (rotated (0,1,0)) — how visibly inverted it is. */
  upY: number;
}

interface BedSpec {
  voice: VoiceName;
  minMs: number;
  maxMs: number;
}

const BEDS: Record<string, BedSpec | null> = {
  kitchen: { voice: 'tick', minMs: SOUND.TICK_MIN_MS, maxMs: SOUND.TICK_MAX_MS },
  garden: { voice: 'bird', minMs: SOUND.BIRD_MIN_MS, maxMs: SOUND.BIRD_MAX_MS },
  bedroom: null,
  bathroom: null,
  garage: null,
};

const emptyCounts = (): Record<string, number> => ({});

export class SoundEngine {
  muted = false;
  volume: number = SOUND.DEFAULT_VOLUME;
  unlocked = false;
  deaf = false;

  private readonly opts: SoundOptions;
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private buses = new Map<VoiceName, AudioBus>();
  private room: ReturnType<typeof makeRoom> | null = null;
  private roll: RollHandle | null = null;
  private bedRoom: BedHandle | null = null;
  private bedTimer: ReturnType<typeof setTimeout> | null = null;
  private bed: string | null = null;
  private visible = true;
  /** per-run event voice firings and guard rejections */
  runCounts: Record<string, number> = emptyCounts();
  rejected: Record<string, number> = emptyCounts();
  /** roll parameter updates actually applied (the 20 Hz proof) */
  rollUpdates = 0;
  private now: () => number;
  private random: () => number;
  private lastRollAtMs = -1e9;
  private lastRingAtMs = -1e9;
  private inverted = false;
  private running = false;
  /** R8: the trailing volume-persist window (the autosave's shape) */
  private volumePersistPending = false;
  private volumePersistHandle: unknown = null;
  private readonly clock: { schedule(fn: () => void, ms: number): unknown; cancel(handle: unknown): void };

  constructor(opts: SoundOptions = {}) {
    this.opts = opts;
    this.now = opts.now ?? (() => performance.now());
    this.random = opts.random ?? Math.random;
    this.clock =
      opts.clock ??
      {
        schedule: (fn, ms) => setTimeout(fn, ms),
        cancel: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
      };
    this.muted = opts.settings?.muted ?? false;
    const v = opts.settings?.volume;
    this.volume = typeof v === 'number' && v >= 0 && v <= 1 ? v : SOUND.DEFAULT_VOLUME;
  }

  /** Called from the FIRST real user gesture only (autoplay policy). The
   *  AudioContext is constructed nowhere else. Safe to call every gesture
   *  — it is a no-op after the first. */
  unlock(): void {
    if (this.unlocked) {
      // a later gesture may be the one that lets a suspended context run
      void this.ctx?.resume().catch(() => undefined);
      return;
    }
    this.unlocked = true;
    const Ctor =
      this.opts.Ctor ??
      (typeof window !== 'undefined'
        ? (window.AudioContext ?? (window as unknown as { webkitAudioContext?: new () => AudioContext }).webkitAudioContext)
        : undefined);
    if (!Ctor) {
      this.deaf = true;
      return;
    }
    try {
      const ctx = new Ctor();
      this.ctx = ctx;
      this.master = makeMaster(ctx, ctx.destination);
      this.master.gain.setValueAtTime(this.masterTarget(), ctx.currentTime);
      this.room = makeRoom(ctx);
      for (const name of VOICE_NAMES) {
        this.buses.set(name, makeBus(ctx, this.master, this.room.in));
      }
      void ctx.resume().catch(() => undefined);
      this.startBed();
    } catch {
      this.deaf = true;
      this.ctx = null;
      this.master = null;
    }
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    // mute is a DISCRETE verb: it persists immediately, and any pending
    // volume write rides the same envelope (R8 keeps the slider debounced,
    // never the toggle)
    if (this.volumePersistPending) this.flushPersist();
    else this.persist();
    if (muted) {
      this.stopBed();
      this.stopRoll(0);
    } else {
      this.startBed();
      // un-mute mid-run brings the roll back (the run is still going)
      if (this.running && this.ctx && !this.roll) {
        const bus = this.buses.get('roll');
        if (bus) this.roll = startRoll({ ctx: this.ctx, t: this.ctx.currentTime + 0.005 }, bus);
      }
    }
  }

  setVolume(v: number): void {
    this.volume = Math.max(0, Math.min(1, v));
    // R8: the slider's `input` storm costs ONE trailing write per drag
    // burst — `createBuildAutosave`'s shape (replace the pending window,
    // never stack it), flushed at every lifecycle edge the autosave
    // obeys (see `createSound`: pagehide / visibility-hidden) plus mute
    // and dispose below.
    this.cancelVolumePersist();
    this.volumePersistPending = true;
    this.volumePersistHandle = this.clock.schedule(() => {
      this.volumePersistHandle = null;
      this.flushPersist();
    }, SOUND.VOLUME_PERSIST_MS);
    if (this.master && this.ctx) {
      // live retrim: the ceiling never moves; the slider rides under it
      this.master.gain.setTargetAtTime(this.masterTarget(), this.ctx.currentTime, 0.03);
    }
  }

  /** Write any pending volume NOW (the unload guarantee, autosave shape). */
  flushPersist(): void {
    this.cancelVolumePersist();
    if (!this.volumePersistPending) return;
    this.volumePersistPending = false;
    this.persist();
  }

  private cancelVolumePersist(): void {
    if (this.volumePersistHandle !== null) {
      this.clock.cancel(this.volumePersistHandle);
      this.volumePersistHandle = null;
    }
  }

  private masterTarget(): number {
    // the slider rides UNDER the ceiling: the product is exactly the chain
    // the offline harness measures (bus.ts), so the loudness numbers hold
    // at the default volume and only go down from there
    return this.muted ? 0 : MASTER_CEILING * MASTER_TRIM * this.volume;
  }

  private persist(): void {
    this.opts.persist?.({ muted: this.muted, volume: this.volume });
  }

  /** Fire an event voice (guard-checked, run-counted). */
  voice(name: VoiceName, notes = 1): void {
    if (!EVENT_VOICES.includes(name)) return; // bed voices go through the scheduler
    this.runCounts[name] = (this.runCounts[name] ?? 0) + 1;
    if (this.deaf || !this.unlocked || this.muted || !this.ctx) return;
    if ((this.runCounts[name] ?? 0) > SOUND.RUN_VOICE_CAP) {
      this.rejected[name] = (this.rejected[name] ?? 0) + 1;
      this.runCounts[name] = SOUND.RUN_VOICE_CAP;
      return;
    }
    const bus = this.buses.get(name);
    if (!bus || !this.ctx) return;
    // the voice's own envelopes carry VOICE_GAIN[name] (voices.ts) — the
    // bus is pure routing, so there is exactly ONE per-voice gain stage
    if (name === 'chime') {
      chimeVoice.notes = Math.max(1, Math.min(3, notes));
    }
    VOICES[name]({ ctx: this.ctx, t: this.ctx.currentTime + 0.005 }, bus);
  }

  /** A run begins (the Launch hook): reset the repetition counters and
   *  open the roll voice. */
  beginRun(): void {
    this.runCounts = emptyCounts();
    this.rejected = emptyCounts();
    this.rollUpdates = 0;
    this.running = true;
    this.inverted = false;
    if (this.ctx && !this.muted && !this.deaf && !this.roll) {
      const bus = this.buses.get('roll');
      if (bus) this.roll = startRoll({ ctx: this.ctx, t: this.ctx.currentTime + 0.005 }, bus);
    }
  }

  /** Per-frame sink — READ ONLY, throttled, after the stepping block. */
  frame(sample: FrameSample): void {
    if (this.deaf || !this.unlocked || this.muted || !this.ctx) return;
    const t = this.now();
    // roll: at most ROLL_UPDATE_HZ param updates per second (brief: <=20 Hz)
    if (this.roll) {
      const norm = Math.min(1, sample.screenSpeed / SOUND.ROLL_FULL_SPEED);
      const throttled = t - this.lastRollAtMs < 1000 / SOUND.ROLL_UPDATE_HZ;
      if (!throttled) {
        this.roll.setSpeed(norm);
        this.lastRollAtMs = t;
        this.rollUpdates++;
      }
    }
    // ring ping: one per loop, edge-triggered on the VISIBLE inversion
    const inverted = sample.upY < SOUND.INVERTED_UP_Y;
    if (inverted && !this.inverted && t - this.lastRingAtMs > SOUND.RING_MIN_GAP_MS) {
      this.lastRingAtMs = t;
      this.voice('ring');
    }
    this.inverted = inverted;
  }

  /** A run reached a terminal status (the boot edge hook, once per run).
   *  The ONLY input is what the result panel prints: outcome, stars, the
   *  new-best flag, the hazard tally. */
  finishRun(summary: RunSummary): void {
    this.running = false;
    if (this.roll && this.ctx) {
      this.roll.stop(this.ctx.currentTime);
      this.roll = null;
    }
    if (summary.status === 'finished') {
      this.voice('cup');
      if (summary.stars > 0) this.voice('chime', summary.stars);
      // the arpeggio is PROGRESS, not repetition: only a new best plays it
      if (summary.newBest) this.voice('victory');
    } else if (summary.status === 'fell') {
      this.voice('whoosh');
    } else if (summary.status === 'hazard') {
      this.voice('whoosh');
      this.voice('hazard');
    } else {
      // stalled / timed out
      this.voice('hum');
      if (summary.hazardsTouched > 0) this.voice('hazard');
    }
    if (Object.values(this.rejected).some((n) => n > 0)) {
      // a rejected firing means a voice triggered more than RUN_VOICE_CAP
      // times in one run — a design bug, surfaced, not swallowed
      console.warn('[sound] repetition guard tripped', this.rejected);
    }
  }

  /** Set the per-set ambience bed (called at level boot). The room tone
   *  runs; kitchen adds a clock tick, garden adds sparse birds. */
  setBed(bed: string | null): void {
    this.bed = bed;
    this.stopBed();
    this.startBed();
  }

  /** Pause the bed while the tab is hidden (a bed that plays to nobody is
   *  just battery drain). */
  setVisible(visible: boolean): void {
    if (this.visible === visible) return;
    this.visible = visible;
    if (visible) this.startBed();
    else this.stopBed();
  }

  /** Test/debug view of the engine. */
  state(): {
    muted: boolean;
    volume: number;
    unlocked: boolean;
    deaf: boolean;
    running: boolean;
    runCounts: Record<string, number>;
    rejected: Record<string, number>;
    rollUpdates: number;
  } {
    return {
      muted: this.muted,
      volume: this.volume,
      unlocked: this.unlocked,
      deaf: this.deaf,
      running: this.running,
      runCounts: { ...this.runCounts },
      rejected: { ...this.rejected },
      rollUpdates: this.rollUpdates,
    };
  }

  private startBed(): void {
    if (this.bedTimer || this.deaf || !this.unlocked || this.muted || !this.visible || !this.ctx)
      return;
    const bus = this.buses.get('room');
    if (!bus) return;
    this.bedRoom = startRoomBed({ ctx: this.ctx, t: this.ctx.currentTime + 0.01 }, bus);
    const spec = this.bed ? BEDS[this.bed] : null;
    if (spec) this.scheduleBedVoice(spec);
  }

  private scheduleBedVoice(spec: BedSpec): void {
    const gap = spec.minMs + this.random() * (spec.maxMs - spec.minMs);
    this.bedTimer = setTimeout(() => {
      this.bedTimer = null;
      if (!this.ctx || this.muted || !this.visible) return;
      const bus = this.buses.get(spec.voice);
      if (!bus) return;
      // bed events ride their OWN bus but are not counted event voices:
      // the scheduler's spacing is the repetition guarantee for the bed
      // (their envelopes carry the design gain — voices.ts)
      VOICES[spec.voice]({ ctx: this.ctx, t: this.ctx.currentTime + 0.005 }, bus);
      this.scheduleBedVoice(spec);
    }, gap);
  }

  private stopBed(): void {
    if (this.bedTimer) {
      clearTimeout(this.bedTimer);
      this.bedTimer = null;
    }
    if (this.bedRoom && this.ctx) {
      this.bedRoom.stop(this.ctx.currentTime);
    }
    this.bedRoom = null;
    this.stopRoll(0);
  }

  private stopRoll(_t: number): void {
    if (this.roll && this.ctx) {
      this.roll.stop(this.ctx.currentTime);
    }
    this.roll = null;
  }

  /** A run ended WITHOUT an outcome sound (Reset walked the car home):
   *  close the roll, keep the counters. */
  stopRun(): void {
    this.running = false;
    if (this.roll && this.ctx) {
      this.roll.stop(this.ctx.currentTime);
      this.roll = null;
    }
  }

  /** Stop the bed when the level changes and free the context. */
  dispose(): void {
    this.flushPersist(); // a drag whose window never closed still lands
    this.stopBed();
    for (const bus of this.buses.values()) bus.dispose();
    this.room?.dispose();
    this.buses.clear();
    this.room = null;
    void this.ctx?.close().catch(() => undefined);
    this.ctx = null;
  }
}

/** Boot-side factory: read the settings off the save (untyped-key
 *  round-trip — see `src/save/save.ts` `SaveSettings.sound`) and wire
 *  persistence through `loadSave`/`saveSave`. */
export function createSound(
  opts: Omit<SoundOptions, 'settings' | 'persist'> & { store?: Parameters<typeof loadSave>[0] } = {},
): SoundEngine {
  const settings = loadSave(opts.store).settings.sound;
  const engine = new SoundEngine({
    ...opts,
    settings,
    persist: (s) => {
      const data = loadSave(opts.store);
      data.settings.sound = s;
      saveSave(data, opts.store); // merging write (R9): a volume save can
      // never clobber a build another tab just placed
    },
  });
  // R8: the debounced volume write obeys the SAME lifecycle edges the build
  // autosave does — a reload or a put-away tab inside the window still
  // stores the last drag. Registered here, not in boot, so the sound
  // module owns its own durability (and boot stays out of it).
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    window.addEventListener('pagehide', () => engine.flushPersist());
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') engine.flushPersist();
    });
  }
  return engine;
}
