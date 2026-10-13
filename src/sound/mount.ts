/**
 * `src/sound/mount.ts` — THE SOUND AT THE DOOR (h4, Lane F2 — THE SOUND
 * LAW: every boot route wires the engine or the game is silent at its own
 * door). This is the page wiring the OLD front end's `bootGame` always
 * had, lifted out of `src/boot.ts` verbatim so BOTH routes mount it:
 *
 * - the engine (`createSound`, settings off the save),
 * - THE AUTOPLAY LAW: the AudioContext is built on the FIRST real gesture
 *   only — a capture-phase `pointerdown`/`keydown` listener calls
 *   `unlock()`, which is a no-op after the first (idempotent: two unlocks
 *   are one context, the engine's own law),
 * - the tab-hidden bed pause (`visibilitychange`),
 * - the `#gw-sound` corner chip (toggle + volume, zero layout flow, the
 *   exact chrome every sound spec clicks), and
 * - the e2e seams `__gwSound` / `__gwSoundRender`.
 *
 * WHO MAY MOUNT: `bootGame` (via `src/boot.ts`) and the house pages
 * (`src/pages/house.ts`) through this ONE module. `src/ui` never imports
 * sound (the firewall's shape — `tests/unit/sound.test.ts`), and nothing
 * under `src/sound` may import the sim, world, render or camera —
 * transitively asserted, mutation-proven in the session log: if this
 * file ever reaches for `physics/sim.ts`, the firewall test goes RED.
 *
 * THE PREMISE BEAT stays silent BY CONSTRUCTION: the beat's own skip
 * listener swallows the first gesture (`src/pages/intro.ts` documents the
 * swallow), so the HOUSE route mounts this module only AT the beat's end
 * — and replays the swallowed gesture into `unlock()` there, inside the
 * still-live event, so the beat unlocks AFTER itself instead of leaving
 * the door mute forever.
 */
import { createSound } from './sound.ts';
import type { SoundEngine } from './sound.ts';

export interface SoundMountOptions {
  /** The page root the `#gw-sound` chip is appended to (page-corner
   *  absolute: zero layout flow, the canvas-rect law). */
  root: HTMLElement;
  /** The set whose bed and roll surface the page boots with (`null` =
   *  the room tone only; the house page starts on its own front room). */
  setId?: string | null;
}

/** Mount the engine, its gesture unlock, its visibility pause and its
 *  corner chip. Returns the engine — the page owns every EVENT hook
 *  (`beginRun`, `frame`, `land`, `finishRun`, `setBed`) from here. */
export function mountSound(opts: SoundMountOptions): SoundEngine {
  const sound = createSound();
  const unlockSound = (): void => sound.unlock();
  window.addEventListener('pointerdown', unlockSound, { capture: true });
  window.addEventListener('keydown', unlockSound, { capture: true });
  document.addEventListener('visibilitychange', () =>
    sound.setVisible(document.visibilityState === 'visible'),
  );
  // the per-set ambience bed (kitchen clock, garden birds — sparse, all
  // synthesized; see src/sound/voices.ts)
  sound.setBed(opts.setId ?? null);
  // surface-honest roll (T1.1): ONE timbre scale per room at boot — the
  // porcelain hisses brighter than the concrete, never per-frame
  sound.setSurface(opts.setId ?? null);
  // mute + volume, persisted under `settings.sound` (no schema bump — the
  // optional-key round-trip documented in src/save/save.ts)
  const soundWrap = document.createElement('div');
  soundWrap.id = 'gw-sound';
  // ABSOLUTELY positioned in the page's top-right corner: zero layout
  // flow (the committed shell baseline is a canvas-element screenshot; a
  // reflow that nudges the canvas rect by a fraction of a pixel is enough
  // to break it), and outside the canvas box so it can never land inside
  // a rendered frame
  soundWrap.style.cssText =
    'position:absolute;top:8px;right:12px;z-index:4;display:flex;gap:6px;align-items:center;font:12px system-ui,sans-serif';
  const soundToggle = document.createElement('button');
  soundToggle.id = 'gw-sound-toggle';
  soundToggle.type = 'button';
  soundToggle.setAttribute('aria-pressed', String(!sound.muted));
  soundToggle.textContent = sound.muted ? 'Sound: off' : 'Sound: on';
  soundToggle.style.cssText =
    'pointer-events:auto;font:12px system-ui,sans-serif;padding:2px 8px;border-radius:4px;border:1px solid rgba(185,163,124,0.7);background:rgba(255,248,236,0.78);color:#6a5636;cursor:pointer';
  const soundVolume = document.createElement('input');
  soundVolume.id = 'gw-sound-volume';
  soundVolume.type = 'range';
  soundVolume.min = '0';
  soundVolume.max = '100';
  soundVolume.step = '5';
  soundVolume.value = String(Math.round(sound.volume * 100));
  soundVolume.setAttribute('aria-label', 'Sound volume');
  soundVolume.style.cssText = 'pointer-events:auto;width:72px;accent-color:#b9915a';
  soundToggle.addEventListener('click', () => {
    sound.setMuted(!sound.muted);
    soundToggle.textContent = sound.muted ? 'Sound: off' : 'Sound: on';
    soundToggle.setAttribute('aria-pressed', String(!sound.muted));
    if (document.activeElement === soundToggle) soundToggle.blur(); // playtests P+Q focus policy
  });
  soundVolume.addEventListener('input', () => {
    sound.setVolume(Number(soundVolume.value) / 100);
  });
  soundWrap.append(soundToggle, soundVolume);
  opts.root.appendChild(soundWrap); // page-corner absolute: zero layout flow
  // the e2e seams (debug surface, not UI): engine state for the mute-
  // across-reload and repetition-guard specs, and the offline loudness
  // renderer the loudness spec measures through the SAME master chain
  (window as unknown as Record<string, unknown>).__gwSound = () => sound.state();
  void import('./bus.ts').then((bus) => {
    (window as unknown as Record<string, unknown>).__gwSoundRender = (
      name: Parameters<typeof bus.renderVoice>[1],
    ) => bus.renderVoice(OfflineAudioContext, name);
  });
  return sound;
}
