/**
 * Stage 5 sound harness (unit half). The OfflineAudioContext render half of
 * the loudness harness runs where WebAudio actually exists — the browser —
 * and is asserted in `tests/e2e/sound.spec.ts` (vitest here is `node`, and
 * the repo adds no assets/dependencies for a WebAudio polyfill). What this
 * file CAN prove deterministically in-process:
 *
 * 1. THE FIREWALL: the import graph. Nothing under `src/sound` imports
 *    world/physics/render/camera/feel, and nothing in world/physics imports
 *    sound — so no audio call can sit on the step path by construction.
 * 2. The design gain ceiling (nothing scheduled above 0.5 pre-master; the
 *    master itself is the -12 dBFS constant the e2e measures against).
 * 3. Autoplay: no AudioContext before `unlock()` (the first gesture).
 * 4. The repetition guard (voices are counted per run and capped).
 * 5. The <=20 Hz roll throttle and one-ping-per-loop ring edge.
 * 6. Bed spacing (kitchen tick at exactly the design spacing under a fixed
 *    rng), mute/volume persistence, and the deaf-context fallback.
 * 7. The `settings.sound` save round-trip WITHOUT a schema bump.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { SoundEngine, EVENT_VOICES, SOUND, hazardContactVoice, surfaceForContact, surfaceForSet } from '../../src/sound/sound.ts';
import { MASTER_CEILING, MASTER_TRIM, makeBus } from '../../src/sound/bus.ts';
import { VOICES, VOICE_GAIN, VOICE_NAMES, startRoll } from '../../src/sound/voices.ts';
import { SAVE_KEY, SAVE_VERSION, MIGRATIONS, freshSave, loadSave, saveSave, memoryStorage } from '../../src/save/save.ts';

// ---- the mock audio graph ----------------------------------------------------

const paramLog: number[] = [];

class SilentParam {
  setValueAtTime(): this {
    return this;
  }
  linearRampToValueAtTime(): this {
    return this;
  }
  exponentialRampToValueAtTime(): this {
    return this;
  }
  cancelScheduledValues(): this {
    return this;
  }
  setTargetAtTime(): this {
    return this;
  }
}

class MockParam {
  setValueAtTime(v: number): this {
    paramLog.push(v);
    return this;
  }
  linearRampToValueAtTime(v: number): this {
    paramLog.push(v);
    return this;
  }
  exponentialRampToValueAtTime(v: number): this {
    paramLog.push(v);
    return this;
  }
  cancelScheduledValues(): this {
    return this;
  }
  setTargetAtTime(v: number): this {
    paramLog.push(v);
    return this;
  }
}

class MockNode {
  readonly gain = new MockParam();
  readonly frequency = new SilentParam();
  readonly Q = new SilentParam();
  readonly delayTime = new SilentParam();
  readonly threshold = new SilentParam();
  readonly knee = new SilentParam();
  readonly ratio = new SilentParam();
  readonly attack = new SilentParam();
  readonly release = new SilentParam();
  type = '';
  buffer: unknown = null;
  loop = false;
  onended: (() => void) | null = null;
  connect(target: MockNode): MockNode {
    return target;
  }
  disconnect(): void {}
  start(): void {}
  stop(): void {}
}

class MockCtx {
  static instances = 0;
  static sourcesCreated = 0;
  currentTime = 0;
  sampleRate = 44100;
  readonly destination = new MockNode();
  constructor() {
    MockCtx.instances++;
  }
  createGain(): MockNode {
    return new MockNode();
  }
  createBiquadFilter(): MockNode {
    return new MockNode();
  }
  createDelay(): MockNode {
    return new MockNode();
  }
  createDynamicsCompressor(): MockNode {
    return new MockNode();
  }
  createOscillator(): MockNode {
    MockCtx.sourcesCreated++;
    return new MockNode();
  }
  createBufferSource(): MockNode {
    MockCtx.sourcesCreated++;
    return new MockNode();
  }
  createBuffer(_ch: number, len: number, _sr: number): { getChannelData(): Float32Array } {
    return { getChannelData: () => new Float32Array(len) };
  }
  resume(): Promise<void> {
    return Promise.resolve();
  }
  close(): Promise<void> {
    return Promise.resolve();
  }
}

// ---- 1. the firewall ---------------------------------------------------------

const walk = (dir: string, out: string[] = []): string[] => {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.ts')) out.push(p);
  }
  return out;
};

describe('determinism firewall (import graph)', () => {
  it('src/sound imports nothing from the sim, world, or render', () => {
    for (const file of walk('src/sound')) {
      const src = readFileSync(file, 'utf8');
      expect(src, file).not.toMatch(/from '\.\.\/(world|physics|render|camera|feel|replay|track)\b/);
    }
  });
  it('nothing in world/physics/render imports sound (no step-path call site)', () => {
    for (const dir of ['src/world', 'src/physics', 'src/render', 'src/camera']) {
      for (const file of walk(dir)) {
        const src = readFileSync(file, 'utf8');
        expect(src, file).not.toMatch(/sound\/(sound|voices|bus)\.ts/);
      }
    }
  });
  it('boot is the only game-side importer', () => {
    const boot = readFileSync('src/boot.ts', 'utf8');
    expect(boot).toMatch(/from '\.\/sound\/sound\.ts'/);
    for (const file of walk('src/ui')) {
      const src = readFileSync(file, 'utf8');
      expect(src, file).not.toMatch(/sound\//);
    }
  });
});

// ---- 2. design ceilings ------------------------------------------------------

describe('loudness design ceiling', () => {
  it('the master ceiling is -12 dBFS', () => {
    expect(20 * Math.log10(MASTER_CEILING)).toBeCloseTo(-12, 1);
    expect(MASTER_TRIM).toBeLessThanOrEqual(1);
  });
  it('no voice design gain exceeds 0.5 (pre-ceiling)', () => {
    for (const name of VOICE_NAMES) expect(VOICE_GAIN[name], name).toBeLessThanOrEqual(0.5);
  });
  it('every gain a voice SCHEDULES stays at or under the 0.5 design cap', () => {
    for (const name of VOICE_NAMES) {
      const ctx = new MockCtx();
      const master = ctx.createGain();
      const bus = makeBus(ctx as unknown as BaseAudioContext, master as unknown as AudioNode);
      paramLog.length = 0; // bus/room construction may carry its own constants
      if (name === 'roll') {
        startRoll({ ctx: ctx as unknown as BaseAudioContext, t: 0 }, bus).setSpeed(1);
      } else {
        VOICES[name]({ ctx: ctx as unknown as BaseAudioContext, t: 0 }, bus);
      }
      for (const v of paramLog) {
        expect(v, `${name} gain ${v}`).toBeLessThanOrEqual(0.5001);
      }
      bus.dispose();
    }
  });
});

// ---- 3-6. the engine ---------------------------------------------------------

let clock = 0;
const makeEngine = (opts: { random?: () => number } = {}): SoundEngine =>
  new SoundEngine({
    Ctor: MockCtx as unknown as new () => AudioContext,
    now: () => clock,
    random: opts.random ?? (() => 0),
  });

afterEach(() => {
  vi.useRealTimers();
  MockCtx.instances = 0;
  MockCtx.sourcesCreated = 0;
  clock = 0;
});

describe('sound engine', () => {
  it('creates NO AudioContext before the first gesture (autoplay policy)', () => {
    const e = makeEngine();
    e.voice('snap');
    e.beginRun();
    e.finishRun({ status: 'finished', stars: 1, newBest: false, hazardsTouched: 0 });
    expect(MockCtx.instances).toBe(0);
    e.unlock();
    expect(MockCtx.instances).toBe(1);
    e.unlock();
    expect(MockCtx.instances).toBe(1);
  });

  it('repetition guard: the 13th snap in one run is a design bug, dropped and flagged', () => {
    const e = makeEngine();
    e.unlock();
    e.beginRun();
    for (let i = 0; i < 20; i++) e.voice('snap');
    const s = e.state();
    expect(s.runCounts.snap).toBe(SOUND.RUN_VOICE_CAP);
    expect(s.rejected.snap).toBe(20 - SOUND.RUN_VOICE_CAP);
    // beginRun resets: the NEXT run starts clean
    e.beginRun();
    expect(e.state().runCounts.snap).toBeUndefined();
  });

  it('outcome voices attach to the outcome the panel prints', () => {
    const e = makeEngine();
    e.unlock();
    e.beginRun();
    e.finishRun({ status: 'finished', stars: 2, newBest: false, hazardsTouched: 0 });
    let s = e.state().runCounts;
    expect(s.cup).toBe(1);
    expect(s.chime).toBe(1);
    expect(s.victory).toBeUndefined(); // progress NOT made — no arpeggio
    e.beginRun();
    e.finishRun({ status: 'fell', stars: 0, newBest: false, hazardsTouched: 0 });
    s = e.state().runCounts;
    expect(s.whoosh).toBe(1);
    expect(s.hum).toBeUndefined();
    e.beginRun();
    e.finishRun({ status: 'stalled', stars: 0, newBest: true, hazardsTouched: 2 });
    s = e.state().runCounts;
    expect(s.hum).toBe(1);
    expect(s.hazard).toBe(1);
    expect(s.victory).toBeUndefined(); // a stall is never a victory
    expect(e.state().rejected).toEqual({});
  });

  it('roll updates at <=20 Hz, and the ring pings at most once per inversion', () => {
    const e = makeEngine();
    e.unlock();
    e.beginRun();
    for (let i = 0; i < 180; i++) {
      clock += 1000 / 60; // 60 fps for 3 s
      e.frame({ dtMs: 1000 / 60, running: true, screenSpeed: 2.0, upY: 1 });
    }
    const s = e.state();
    expect(s.rollUpdates).toBeGreaterThan(0);
    expect(s.rollUpdates).toBeLessThanOrEqual(3 * SOUND.ROLL_UPDATE_HZ + 1);
    e.stopRun();
    e.beginRun();
    for (let i = 0; i < 180; i++) {
      clock += 1000 / 60;
      e.frame({ dtMs: 1000 / 60, running: true, screenSpeed: 0.5, upY: -1 }); // upside down the whole time
    }
    expect(e.state().runCounts.ring).toBe(1); // ONE ping per loop, not per frame
  });

  it('kitchen bed: room tone at once, then a tick at exactly the design spacing', () => {
    vi.useFakeTimers();
    const e = makeEngine({ random: () => 0 }); // spacing pinned to the minimum
    e.setBed('kitchen');
    e.unlock();
    expect(MockCtx.sourcesCreated).toBe(1); // the room bed alone, no tick yet
    vi.advanceTimersByTime(SOUND.TICK_MIN_MS);
    expect(MockCtx.sourcesCreated).toBe(2); // first tick
    vi.advanceTimersByTime(SOUND.TICK_MIN_MS - 1);
    expect(MockCtx.sourcesCreated).toBe(2); // not early
    vi.advanceTimersByTime(1);
    expect(MockCtx.sourcesCreated).toBe(3);
    e.setMuted(true);
    vi.advanceTimersByTime(10_000);
    expect(MockCtx.sourcesCreated).toBe(3); // mute stops the bed cold
    e.setMuted(false);
    expect(MockCtx.sourcesCreated).toBe(4); // room tone is back at once
    vi.advanceTimersByTime(SOUND.TICK_MIN_MS);
    expect(MockCtx.sourcesCreated).toBe(5); // and the tick scheduler restarted
    e.setVisible(false);
    vi.advanceTimersByTime(10_000);
    expect(MockCtx.sourcesCreated).toBe(5); // a hidden tab pays nothing
    e.dispose();
  });

  it('mute and volume persist through the persist hook and the master gain', () => {
    vi.useFakeTimers();
    const saved: { muted?: boolean; volume?: number }[] = [];
    const e = new SoundEngine({
      Ctor: MockCtx as unknown as new () => AudioContext,
      now: () => clock,
      persist: (s) => saved.push(s),
    });
    e.unlock();
    e.setVolume(0.5);
    vi.advanceTimersByTime(SOUND.VOLUME_PERSIST_MS); // R8: the trailing window closes
    expect(saved.at(-1)).toEqual({ muted: false, volume: 0.5 });
    e.setMuted(true); // mute is a discrete verb: immediate, carrying the volume
    expect(saved.at(-1)).toEqual({ muted: true, volume: 0.5 });
    const s = e.state();
    expect(s.muted).toBe(true);
    expect(s.volume).toBe(0.5);
    // while muted no source is ever created, counted firings notwithstanding
    const before = MockCtx.sourcesCreated;
    e.voice('cup');
    expect(MockCtx.sourcesCreated).toBe(before);
    expect(e.state().runCounts.cup).toBe(1); // the EVENT still counts (guard)
  });

  it('a context that will not start goes deaf, never throws', () => {
    const e = new SoundEngine({
      Ctor: (function () {
        throw new Error('no audio hardware');
      }) as unknown as new () => AudioContext,
      now: () => clock,
    });
    e.unlock();
    expect(e.state().deaf).toBe(true);
    expect(e.state().unlocked).toBe(true);
    e.voice('snap');
    e.beginRun();
    e.frame({ dtMs: 16, running: true, screenSpeed: 2, upY: -1 });
    e.finishRun({ status: 'finished', stars: 3, newBest: true, hazardsTouched: 0 });
    e.setBed('kitchen');
    e.dispose();
  });

  it('every public door is callable before unlock and fires nothing', () => {
    const e = makeEngine();
    e.setBed('garden');
    e.voice('snap');
    e.beginRun();
    e.frame({ dtMs: 16, running: true, screenSpeed: 2, upY: 1 });
    e.finishRun({ status: 'finished', stars: 3, newBest: true, hazardsTouched: 0 });
    e.stopRun();
    e.setVisible(false);
    e.dispose();
    expect(MockCtx.instances).toBe(0);
  });

  it('event voices are the guard-counted set', () => {
    for (const v of EVENT_VOICES) expect(VOICE_NAMES).toContain(v);
  });
});

// ---- 7. settings round-trip (no schema touch) --------------------------------

describe('sound settings (save integration)', () => {
  it('settings.sound round-trips at v2 with no new migrade', () => {
    expect(SAVE_VERSION).toBe(2);
    expect(MIGRATIONS.length).toBe(2); // unchanged: sound did not bump the schema
    const store = memoryStorage();
    const d = freshSave();
    d.settings.sound = { muted: true, volume: 0.3 };
    saveSave(d, store);
    const back = loadSave(store);
    expect(back.settings.sound).toEqual({ muted: true, volume: 0.3 });
    expect(back.v).toBe(2);
  });
  it('an absent sound key means defaults and survives a round-trip', () => {
    const store = memoryStorage();
    saveSave(freshSave(), store);
    const back = loadSave(store);
    expect(back.settings.sound).toBeUndefined();
    const e = new SoundEngine({ Ctor: MockCtx as unknown as new () => AudioContext });
    expect(e.muted).toBe(false);
    expect(e.volume).toBe(SOUND.DEFAULT_VOLUME);
  });
  it('createSound restores mute/volume from the save', async () => {
    const { createSound } = await import('../../src/sound/sound.ts');
    const store = memoryStorage();
    const d = freshSave();
    d.settings.sound = { muted: true, volume: 0.42 };
    saveSave(d, store);
    const e = createSound({ store, Ctor: MockCtx as unknown as new () => AudioContext });
    expect(e.muted).toBe(true);
    expect(e.volume).toBe(0.42);
  });

  // ---- R8: the volume persist is DEBOUNCED (the autosave's shape) ----------

  it('a volume drag storm costs ONE trailing write — the whole R8 claim', () => {
    vi.useFakeTimers();
    const saved: { muted?: boolean; volume?: number }[] = [];
    const e = new SoundEngine({
      Ctor: MockCtx as unknown as new () => AudioContext,
      now: () => clock,
      persist: (s) => saved.push(s),
    });
    for (let i = 0; i <= 50; i++) e.setVolume(i / 50);
    expect(saved.length).toBe(0); // the window is open: ZERO writes mid-drag
    vi.advanceTimersByTime(SOUND.VOLUME_PERSIST_MS);
    expect(saved.length).toBe(1); // one write per BURST, carrying the latest
    expect(saved[0].volume).toBe(1);
  });

  it('flush lands the pending drag exactly once; mute carries it immediately', () => {
    vi.useFakeTimers();
    const saved: { muted?: boolean; volume?: number }[] = [];
    const e = new SoundEngine({
      Ctor: MockCtx as unknown as new () => AudioContext,
      now: () => clock,
      persist: (s) => saved.push(s),
    });
    e.flushPersist(); // clean: flushing nothing writes nothing
    expect(saved.length).toBe(0);
    e.setVolume(0.3);
    e.setVolume(0.2);
    e.flushPersist(); // the reload-inside-the-window case
    expect(saved).toEqual([{ muted: false, volume: 0.2 }]);
    vi.advanceTimersByTime(SOUND.VOLUME_PERSIST_MS + 1); // the dead timer writes nothing
    expect(saved.length).toBe(1);
    e.setVolume(0.4);
    e.setMuted(true); // mute lands the pending volume in the same envelope
    expect(saved.at(-1)).toEqual({ muted: true, volume: 0.4 });
    vi.advanceTimersByTime(SOUND.VOLUME_PERSIST_MS + 1);
    expect(saved.length).toBe(2);
  });

  it('through the real save: a 20-event drag writes the envelope ONCE', async () => {
    vi.useFakeTimers();
    const { createSound } = await import('../../src/sound/sound.ts');
    const mem = memoryStorage();
    let envelopeWrites = 0;
    const store = {
      getItem: (k: string) => mem.getItem(k),
      setItem: (k: string, v: string) => {
        if (k === SAVE_KEY) envelopeWrites++;
        mem.setItem(k, v);
      },
      removeItem: (k: string) => mem.removeItem(k),
    };
    const e = createSound({ store });
    for (let i = 0; i < 20; i++) e.setVolume(0.2 + i / 100);
    expect(envelopeWrites).toBe(0); // the R8 indictment: today this is 20 full writes
    vi.advanceTimersByTime(SOUND.VOLUME_PERSIST_MS);
    expect(envelopeWrites).toBe(1);
    expect(loadSave(store).settings.sound?.volume).toBeCloseTo(0.2 + 19 / 100, 10);
  });
});

// ---- 7. the T1.1 voice map (landing thud + mid-run contact) ------------------

describe('T1.1 feel voice map', () => {
  it('classifies the shipped authored zone ids onto the contact ticks', () => {
    // the kitchen/bathroom/garden splashes and films are the wet tick…
    for (const id of ['sinkSplash', 'drainSplash', 'splashPatch', 'sprinklerSprawl', 'sprinklerFilm'])
      expect(hazardContactVoice(id), id).toBe('splash');
    // …the garage stains are the oil tick…
    for (const id of ['oilFilm', 'shopStain', 'oilCrossing', 'shopFilm'])
      expect(hazardContactVoice(id), id).toBe('oil');
    // …and the magnet/whirlpool slots answer their own names (no shipped
    // authored zone trips them — that is the point of the slots)
    expect(hazardContactVoice('drainFilm')).toBe('splash');
    expect(hazardContactVoice('whirlpoolDrain')).toBe('whirl');
    expect(hazardContactVoice('magnetPad')).toBe('magnet');
  });

  it('the landing surface is the zone when the landing lands in one, else the room floor', () => {
    expect(surfaceForSet('kitchen')).toBe('tile');
    expect(surfaceForSet('bathroom')).toBe('porcelain');
    expect(surfaceForSet('garage')).toBe('concrete');
    expect(surfaceForSet('porch')).toBe('wood');
    expect(surfaceForContact('oilFilm', 'tile')).toBe('oil');
    expect(surfaceForContact('sinkSplash', 'porcelain')).toBe('wet');
    expect(surfaceForContact('magnetPad', 'tile')).toBe('tile');
  });

  it('land() and contact() fire through the repetition guard and count', () => {
    const e = new SoundEngine({
      Ctor: MockCtx as unknown as new () => AudioContext,
      now: () => clock,
    });
    e.unlock();
    e.beginRun();
    e.land(0.07, 'tile');
    e.contact('sinkSplash');
    e.contact('oilFilm');
    const s = e.state();
    expect(s.runCounts.land).toBe(1);
    expect(s.runCounts.splash).toBe(1);
    expect(s.runCounts.oil).toBe(1);
    expect(s.rejected).toEqual({});
    // the guard holds for the new voices too (a thud storm is a design bug)
    for (let i = 0; i < 20; i++) e.land(0.07, 'wet');
    expect(e.state().runCounts.land).toBe(SOUND.RUN_VOICE_CAP);
    expect(e.state().rejected.land).toBe(20 - SOUND.RUN_VOICE_CAP + 1);
  });

  it('the new contact voices are event voices and deaf-callable (no context yet)', () => {
    for (const name of ['land', 'splash', 'oil', 'magnet', 'whirl'] as const)
      expect(EVENT_VOICES).toContain(name);
    const e = new SoundEngine({ Ctor: undefined });
    e.unlock(); // no constructor available: deaf, never crashed
    expect(e.deaf).toBe(true);
    e.land(0.05, 'tile');
    e.contact('oilFilm'); // callable, does nothing
  });
});
