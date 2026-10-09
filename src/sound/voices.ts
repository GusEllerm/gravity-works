/**
 * `src/sound/voices` — every sound in the game, synthesized from code.
 *
 * HOUSE RULE: zero assets. Nothing here loads a byte — noise comes from a
 * seeded PRNG buffer, tones from oscillators, the "room" from comb/allpass
 * delays. That makes the whole module renderable OFFLINE: each voice is a
 * pure scheduling function over a `BaseAudioContext`, so the loudness
 * harness can render it through an `OfflineAudioContext` and MEASURE its
 * peak (`bus.renderVoice`), not trust arithmetic.
 *
 * THE FIREWALL (stage 5 brief): this module imports nothing from
 * `world`/`physics`/`render` and is imported by nothing outside
 * `src/sound/` and the boot/UI layer. A voice receives plain numbers handed
 * to it at an EVENT (the outcome the result panel prints, the speed the car
 * mesh is visibly moving at); it never pulls state. That is the
 * architectural guarantee that audio cannot perturb the sim or the hash:
 * there is no call path from `World.step` into this directory.
 *
 * LOUDNESS BUDGET: every voice's internal envelope tops out at
 * `VOICE_GAIN[name] <= 0.5`, the master applies `MASTER_CEILING`
 * (-12 dBFS) and a gentle limiter catches accidental overlap. The harness
 * measures each voice and the e2e asserts peak <= the ceiling and DC inaud;
 * nothing here CAN produce DC — every source is an oscillator or zero-mean
 * seeded noise.
 */
import type { AudioBus } from './bus.ts';

/** Every voice needs: a context plus a scheduling moment. `t` is always
 *  ctx time, never wall time. */
export interface VoiceWhere {
  ctx: BaseAudioContext;
  /** ctx time (s) the voice starts at. */
  t: number;
}

/** The names of every voice. Event voices fire from boot/UI hooks; the bed
 *  voices (`tick`, `bird`, `room`) are the sparse per-set ambience; `roll`
 *  is the ONE sustained voice, modulated at <=20 Hz from what the screen
 *  already shows. */
export type VoiceName =
  | 'launch'
  | 'snap'
  | 'ring'
  | 'cup'
  | 'whoosh'
  | 'hum'
  | 'hazard'
  | 'chime'
  | 'victory'
  | 'blipPlace'
  | 'blipUndo'
  | 'land'
  | 'splash'
  | 'oil'
  | 'magnet'
  | 'whirl'
  | 'tick'
  | 'bird'
  | 'room'
  | 'roll';

/** Every voice rendered by the loudness harness (roll at a fixed mid
 *  speed; chime with its maximum 3 notes; land at its full impulse across
 *  every surface — the worst peak wins, see `bus.renderVoice`). */
export const VOICE_NAMES: readonly VoiceName[] = [
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
  'land',
  'splash',
  'oil',
  'magnet',
  'whirl',
  'tick',
  'bird',
  'room',
  'roll',
];

/** Per-voice design gain (pre-ceiling). The unit harness asserts every
 *  gain constant a voice schedules stays at or under this table, and every
 *  table entry stays at or under 0.5 — the master ceiling does the rest. */
export const VOICE_GAIN: Record<VoiceName, number> = {
  launch: 0.45,
  snap: 0.4,
  ring: 0.35,
  cup: 0.5,
  whoosh: 0.4,
  hum: 0.25,
  hazard: 0.3,
  chime: 0.25,
  victory: 0.4,
  blipPlace: 0.28,
  blipUndo: 0.24,
  // T1.1 feel package: the landing THUD rides just UNDER `cup` — the cup
  // is one per run, the thud is many, and the mix must not fatigue. The
  // four contact ticks are the quietest event class on purpose: they ride
  // ALONGSIDE the wheel crossing the patch, they do not announce it.
  land: 0.42,
  splash: 0.28,
  oil: 0.26,
  magnet: 0.3,
  whirl: 0.3,
  tick: 0.4,
  bird: 0.14,
  room: 0.05,
  roll: 0.3,
};

/** Duration the offline harness renders per voice (s) — long enough for
 *  the slowest tail to decay into the room. */
export const MEASURE_SECONDS = 3.0;

// ---- seeded noise (the only "samples" in the game) --------------------------

/** mulberry32 — deterministic, zero-dependency. Noise buffers come from
 *  this so offline renders repeat bit-for-bit ("deterministic-ish"). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const noiseCache = new WeakMap<BaseAudioContext, AudioBuffer>();

/** One shared 0.5 s white-noise buffer per context — uniform in [-1, 1)
 *  from the seeded PRNG, zero-mean by construction, so no voice can carry
 *  DC from its source. */
export function noiseBuffer(ctx: BaseAudioContext): AudioBuffer {
  let buf = noiseCache.get(ctx);
  if (!buf) {
    buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.5), ctx.sampleRate);
    const data = buf.getChannelData(0);
    const rnd = mulberry32(0x9e3779b9);
    for (let i = 0; i < data.length; i++) data[i] = rnd() * 2 - 1;
    noiseCache.set(ctx, buf);
  }
  return buf;
}

// ---- envelope / node helpers -----------------------------------------------

/** Click-free percussive envelope: silence -> peak (attack) -> silence. */
function env(g: GainNode, t: number, peak: number, attack: number, decay: number): void {
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
}

function osc(ctx: BaseAudioContext, type: OscillatorType, freq: number, t: number): OscillatorNode {
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  return o;
}

function noise(ctx: BaseAudioContext, loop = false): AudioBufferSourceNode {
  const s = ctx.createBufferSource();
  s.buffer = noiseBuffer(ctx);
  s.loop = loop;
  return s;
}

function biquad(
  ctx: BaseAudioContext,
  type: BiquadFilterType,
  freq: number,
  q: number,
  t: number,
): BiquadFilterNode {
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.setValueAtTime(freq, t);
  f.Q.setValueAtTime(q, t);
  return f;
}

/** Start the sources at `t`, stop them at `until`, and when the first one
 *  ends disconnect the WHOLE fragment (`srcs` + `frag`) — voices are
 *  fire-and-forget, a long session never accumulates a graph. */
function start(
  srcs: AudioScheduledSourceNode[],
  frag: AudioNode[],
  t: number,
  until: number,
): void {
  for (const n of srcs) n.start(t);
  for (const n of srcs) n.stop(until);
  srcs[0]!.onended = () => {
    for (const n of [...srcs, ...frag]) n.disconnect();
  };
}

// ---- the voices ------------------------------------------------------------
//
// Every voice: (where, bus) -> schedules its graph onto the bus. `bus.dry`
// is the direct path, `bus.wet` the room send; the per-voice gain is the
// bus's own `voice` node, set by the caller to VOICE_GAIN[name].

export type VoiceFn = (w: VoiceWhere, bus: AudioBus) => void;

/** Launch: the release-gate tick — a short filtered-noise transient plus a
 *  falling triangle blip. ~90 ms, the loudest single event by design (it
 *  marks the run's start), still under the ceiling through the master. */
const launch: VoiceFn = ({ ctx, t }, bus) => {
  const g = ctx.createGain();
  env(g, t, VOICE_GAIN.launch, 0.002, 0.09);
  const click = noise(ctx);
  const bp = biquad(ctx, 'bandpass', 1800, 1.2, t);
  click.connect(bp).connect(g);
  const blip = osc(ctx, 'triangle', 520, t);
  blip.frequency.exponentialRampToValueAtTime(300, t + 0.07);
  const bg = ctx.createGain();
  env(bg, t, VOICE_GAIN.launch * 0.7, 0.002, 0.07);
  blip.connect(bg).connect(g);
  g.connect(bus.dry);
  g.connect(bus.wet);
  start([click, blip], [bp, bg, g], t, t + 0.12);
};

/** Piece snap: a wooden tick — sine knock plus a bright noise chip. The
 *  builder fires it once per successful place, so repetition is bounded by
 *  the piece budget (well under the run cap by construction). */
const snap: VoiceFn = ({ ctx, t }, bus) => {
  const body = osc(ctx, 'sine', 640, t);
  body.frequency.exponentialRampToValueAtTime(420, t + 0.08);
  const bg = ctx.createGain();
  env(bg, t, VOICE_GAIN.snap, 0.001, 0.09);
  body.connect(bg).connect(bus.dry);
  const chip = noise(ctx);
  const hp = biquad(ctx, 'highpass', 1200, 0.7, t);
  const cg = ctx.createGain();
  env(cg, t, VOICE_GAIN.snap * 0.5, 0.001, 0.025);
  chip.connect(hp).connect(cg);
  cg.connect(bus.dry);
  cg.connect(bus.wet);
  start([body, chip], [bg, hp, cg], t, t + 0.12);
};

/** Ring ping: a soft bell struck as the car passes through a loop/ring
 *  (edge-detected from the car's VISIBLE inverted pose). Two partials, one
 *  ping, wet enough to read as a big hoop. */
const ring: VoiceFn = ({ ctx, t }, bus) => {
  const a = osc(ctx, 'sine', 1568, t);
  const ag = ctx.createGain();
  env(ag, t, VOICE_GAIN.ring, 0.003, 0.45);
  a.connect(ag).connect(bus.dry);
  const b = osc(ctx, 'sine', 1568 * 2.01, t);
  const bg = ctx.createGain();
  env(bg, t, VOICE_GAIN.ring * 0.25, 0.003, 0.25);
  b.connect(bg);
  bg.connect(bus.dry);
  bg.connect(bus.wet);
  start([a, b], [ag, bg], t, t + 0.5);
};

/** Cup land: the thud (falling sine plus a low-passed noise slap — a body
 *  sound, not a crack) with the settling bell over it. Fires once per
 *  finished run, at the terminal edge only. */
const cup: VoiceFn = ({ ctx, t }, bus) => {
  const thud = osc(ctx, 'sine', 95, t);
  thud.frequency.exponentialRampToValueAtTime(55, t + 0.12);
  const tg = ctx.createGain();
  env(tg, t, VOICE_GAIN.cup * 0.8, 0.002, 0.14);
  thud.connect(tg).connect(bus.dry);
  const slap = noise(ctx);
  const lp = biquad(ctx, 'lowpass', 300, 0.9, t);
  const sg = ctx.createGain();
  env(sg, t, VOICE_GAIN.cup * 0.5, 0.001, 0.04);
  slap.connect(lp).connect(sg).connect(bus.dry);
  const tb = t + 0.02;
  const bellA = osc(ctx, 'sine', 784, tb);
  const bag = ctx.createGain();
  env(bag, tb, VOICE_GAIN.cup * 0.45, 0.004, 0.6);
  bellA.connect(bag).connect(bus.dry);
  bag.connect(bus.wet);
  const bellB = osc(ctx, 'sine', 784 * 1.5, tb);
  const bb = ctx.createGain();
  env(bb, tb, VOICE_GAIN.cup * 0.15, 0.004, 0.35);
  bellB.connect(bb).connect(bus.dry);
  start([thud, slap], [tg, lp, sg], t, t + 0.18);
  // the bells START with their envelopes — a source started before its
  // gain's setValueAtTime(0, tb) plays at the node's DEFAULT unity gain
  // for the gap (a 2.6 linear blast this voice once measured)
  start([bellA, bellB], [bag, bb], tb, tb + 0.62);
};

/** Fail — fell off: a descending whoosh, noise through a falling bandpass.
 *  Deliberately quiet and short: a fall is information, not punishment. */
const whoosh: VoiceFn = ({ ctx, t }, bus) => {
  const src = noise(ctx, true);
  const bp = biquad(ctx, 'bandpass', 1200, 1.1, t);
  bp.frequency.exponentialRampToValueAtTime(180, t + 0.7);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(VOICE_GAIN.whoosh, t + 0.12);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
  src.connect(bp).connect(g);
  g.connect(bus.dry);
  g.connect(bus.wet);
  start([src], [bp, g], t, t + 0.8);
};

/** Fail — stalled / timed out: a low warm hum that swells and fades. The
 *  quietest fail voice: a stall is a shrug. */
const hum: VoiceFn = ({ ctx, t }, bus) => {
  const a = osc(ctx, 'triangle', 58, t);
  const b = osc(ctx, 'triangle', 116, t);
  // the octave partial rides at HALF into the sum: two full-amplitude
  // triangles would stack to 2.0 before the envelope (measured: this voice
  // once hit 0.245 through the master — nearly the ceiling for the game's
  // QUIETEST fail)
  const bg = ctx.createGain();
  bg.gain.setValueAtTime(0.5, t);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(VOICE_GAIN.hum, t + 0.25);
  g.gain.linearRampToValueAtTime(0, t + 0.9);
  const lp = biquad(ctx, 'lowpass', 340, 0.6, t);
  a.connect(lp);
  b.connect(bg).connect(lp);
  lp.connect(g).connect(bus.dry);
  start([a, b], [bg, g, lp], t, t + 0.95);
};

/** Fail — hazard: a dry three-tap crackle (the wet-patch tally the result
 *  panel reports), fired once at the terminal edge of a run that touched a
 *  hazard and did not finish. */
const hazard: VoiceFn = ({ ctx, t }, bus) => {
  const src = noise(ctx, true);
  const hp = biquad(ctx, 'highpass', 900, 0.8, t);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  for (let i = 0; i < 3; i++) {
    g.gain.setValueAtTime(0.0001, t + i * 0.06);
    g.gain.linearRampToValueAtTime(VOICE_GAIN.hazard * (1 - i * 0.25), t + i * 0.06 + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.06 + 0.035);
  }
  src.connect(hp).connect(g);
  g.connect(bus.dry);
  g.connect(bus.wet);
  start([src], [hp, g], t, t + 0.22);
};

/** Star chime: 1-3 pentatonic bells (C5, E5, G5) 120 ms apart — the star
 *  count the result panel prints, counted out in sound. ONE voice firing
 *  per run end, however many notes the stars carry. The note count rides
 *  on the function (set by the engine right before scheduling). */
const CHIME_FREQS = [523.25, 659.25, 783.99];
const chime: VoiceFn & { notes: number } = Object.assign(
  ({ ctx, t }: VoiceWhere, bus: AudioBus): void => {
    const n = Math.max(1, Math.min(3, chime.notes));
    for (let i = 0; i < n; i++) {
      const ti = t + i * 0.12;
      const a = osc(ctx, 'sine', CHIME_FREQS[i]!, ti);
      const ag = ctx.createGain();
      env(ag, ti, VOICE_GAIN.chime, 0.004, 0.55);
      a.connect(ag).connect(bus.dry);
      ag.connect(bus.wet);
      const h = osc(ctx, 'sine', CHIME_FREQS[i]! * 2.02, ti);
      const hg = ctx.createGain();
      env(hg, ti, VOICE_GAIN.chime * 0.18, 0.004, 0.3);
      h.connect(hg).connect(bus.dry);
      start([a, h], [ag, hg], ti, ti + 0.6);
    }
  },
  { notes: 1 },
);

/** Gentle victory arpeggio (C5-E5-G5-C6, triangle, room-heavy). Fires ONLY
 *  on a NEW best star (progress made), never on an equal or worse replay —
 *  which is what keeps it out of the repetition guard's way. */
const VICTORY_FREQS = [523.25, 659.25, 783.99, 1046.5];
const victory: VoiceFn = ({ ctx, t }, bus) => {
  for (let i = 0; i < VICTORY_FREQS.length; i++) {
    const ti = t + i * 0.14;
    const o = osc(ctx, 'triangle', VICTORY_FREQS[i]!, ti);
    const g = ctx.createGain();
    env(g, ti, VOICE_GAIN.victory * 0.75, 0.006, 0.5);
    const lp = biquad(ctx, 'lowpass', 2400, 0.5, ti);
    o.connect(lp).connect(g);
    g.connect(bus.dry);
    g.connect(bus.wet);
    start([o], [g, lp], ti, ti + 0.55);
  }
};

/** UI blips: Place is a short high sine; undo/remove the same shape a
 *  fourth lower, so the pair reads as do/undo without either being loud. */
const blipPlace: VoiceFn = ({ ctx, t }, bus) => {
  const o = osc(ctx, 'sine', 880, t);
  const g = ctx.createGain();
  env(g, t, VOICE_GAIN.blipPlace, 0.003, 0.05);
  o.connect(g).connect(bus.dry);
  start([o], [g], t, t + 0.06);
};
const blipUndo: VoiceFn = ({ ctx, t }, bus) => {
  const o = osc(ctx, 'triangle', 440, t);
  o.frequency.exponentialRampToValueAtTime(392, t + 0.07);
  const g = ctx.createGain();
  env(g, t, VOICE_GAIN.blipUndo, 0.003, 0.07);
  o.connect(g).connect(bus.dry);
  start([o], [g], t, t + 0.08);
};

// ---- the T1.1 feel voices ---------------------------------------------------
//
// The design evaluation's §4 holes, closed on the existing voice map: the
// LANDING was silent (the whole ladder's grammar is a hard catch) and the
// mid-run hazard CONTACT was silent (the `hazard` crackle fires only at
// the result edge, so rolling through the splash mutes exactly as the
// visual goes wet). Both are EVENT voices fired from shell hooks — the
// landing off the JuiceFeed's `landingSquash` (the impulse rides on the
// event), the contact off the edge of the grip dip the HUD already counts
// — so the firewall is untouched: the voices take plain numbers at an
// event and never pull state.

/** The surfaces a landing can be voiced on. Chosen CHEAPLY by the shell:
 *  the mounted set's floor material if the car lands dry, the zone's own
 *  material if it lands inside one (a splash landing is a SPLASH, whatever
 *  room it is in). One word per surface; the numbers live in `LAND_SHAPE`. */
export type LandSurface = 'tile' | 'porcelain' | 'wood' | 'concrete' | 'wet' | 'oil';

/** Every surface the loudness harness sweeps `land` across. */
export const LAND_SURFACES: readonly LandSurface[] = ['tile', 'porcelain', 'wood', 'concrete', 'wet', 'oil'];

/** thud Hz / slap Hz / slap Q / decay s — the body of the landing per
 *  surface. The `cup` thud (95 Hz) is the reference body sound; a tile is
 *  the crisp cousin of the same event, porcelain brighter and tighter,
 *  concrete lower and longer, wood drier, wet/oil the same body under a
 *  blanket (the low-pass is the water). */
const LAND_SHAPE: Record<LandSurface, { hz: number; slap: number; lp: number; decay: number }> = {
  tile: { hz: 95, slap: 1500, lp: 2600, decay: 0.12 },
  porcelain: { hz: 120, slap: 2200, lp: 3200, decay: 0.1 },
  wood: { hz: 85, slap: 900, lp: 1800, decay: 0.13 },
  concrete: { hz: 70, slap: 520, lp: 1400, decay: 0.16 },
  wet: { hz: 90, slap: 700, lp: 900, decay: 0.1 },
  oil: { hz: 66, slap: 420, lp: 700, decay: 0.14 },
};

/** Landing thud: falling sine body + filtered noise slap, the `cup` family
 *  WITHOUT the settling bell (a landing is not a finish). The mutable
 *  fields ride the way `chime.notes` does — set by the engine right before
 *  scheduling; defaults are the loudest legal case (full impulse) so the
 *  offline harness measures the worst peak by construction. */
const land: VoiceFn & { surface: LandSurface; intensity: number } = Object.assign(
  ({ ctx, t }: VoiceWhere, bus: AudioBus): void => {
    const shape = LAND_SHAPE[land.surface];
    const amp = VOICE_GAIN.land * (0.55 + 0.45 * land.intensity);
    const thud = osc(ctx, 'sine', shape.hz, t);
    thud.frequency.exponentialRampToValueAtTime(shape.hz * 0.6, t + shape.decay);
    const tg = ctx.createGain();
    env(tg, t, amp, 0.002, shape.decay);
    thud.connect(tg).connect(bus.dry);
    const slap = noise(ctx);
    const lp = biquad(ctx, 'lowpass', shape.lp, 0.9, t);
    const sg = ctx.createGain();
    env(sg, t, amp * 0.5, 0.001, 0.04);
    slap.connect(lp).connect(sg).connect(bus.dry);
    sg.connect(bus.wet);
    start([thud, slap], [tg, lp, sg], t, t + shape.decay + 0.06);
  },
  { surface: 'tile' as LandSurface, intensity: 1 },
);

/** Wet contact tick: one droplet sizzle — band-passed noise plus a tiny
 *  falling pip. Fires on the RISING EDGE of the grip dip (one tick per
 *  patch crossing, not a per-step hiss), so the repetition guard never
 *  sees more than a handful per run. */
const splash: VoiceFn = ({ ctx, t }, bus) => {
  const s = noise(ctx);
  const bp = biquad(ctx, 'bandpass', 2600, 3, t);
  const g = ctx.createGain();
  env(g, t, VOICE_GAIN.splash, 0.001, 0.05);
  s.connect(bp).connect(g).connect(bus.dry);
  const pip = osc(ctx, 'sine', 1200, t);
  pip.frequency.exponentialRampToValueAtTime(700, t + 0.04);
  const pg = ctx.createGain();
  env(pg, t, VOICE_GAIN.splash * 0.35, 0.001, 0.04);
  pip.connect(pg).connect(bus.dry);
  start([s, pip], [bp, g, pg], t, t + 0.07);
};

/** Oil contact tick: the same event drier and lower — a tyre squelching
 *  on a shop-stain film, not a droplet. */
const oil: VoiceFn = ({ ctx, t }, bus) => {
  const s = noise(ctx);
  const lp = biquad(ctx, 'lowpass', 380, 0.8, t);
  const g = ctx.createGain();
  env(g, t, VOICE_GAIN.oil, 0.004, 0.07);
  s.connect(lp).connect(g).connect(bus.dry);
  const body = osc(ctx, 'triangle', 140, t);
  body.frequency.exponentialRampToValueAtTime(90, t + 0.06);
  const bg = ctx.createGain();
  env(bg, t, VOICE_GAIN.oil * 0.4, 0.003, 0.06);
  body.connect(bg).connect(bus.dry);
  start([s, body], [lp, g, bg], t, t + 0.09);
};

/** Magnet contact tick (voice-map slot; no shipped authored zone fires it
 *  yet — the classifier names it so the day a magnet rung lands, the
 *  sound is already ratified loudness-wise). A short metallic thunk. */
const magnet: VoiceFn = ({ ctx, t }, bus) => {
  const a = osc(ctx, 'sine', 320, t);
  const ag = ctx.createGain();
  env(ag, t, VOICE_GAIN.magnet, 0.002, 0.08);
  a.connect(ag).connect(bus.dry);
  const b = osc(ctx, 'sine', 320 * 2.41, t);
  const bg = ctx.createGain();
  env(bg, t, VOICE_GAIN.magnet * 0.3, 0.002, 0.05);
  b.connect(bg).connect(bus.dry);
  start([a, b], [ag, bg], t, t + 0.1);
};

/** Whirlpool contact tick (voice-map slot, same standing as `magnet`):
 *  the drain's short descending swallow — a bandpass sweep, quiet. */
const whirl: VoiceFn = ({ ctx, t }, bus) => {
  const s = noise(ctx, true);
  const bp = biquad(ctx, 'bandpass', 900, 1.4, t);
  bp.frequency.exponentialRampToValueAtTime(300, t + 0.22);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(VOICE_GAIN.whirl, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.24);
  s.connect(bp).connect(g);
  g.connect(bus.dry);
  g.connect(bus.wet);
  start([s], [bp, g], t, t + 0.26);
};

/** Kitchen ambience: a clock tick — 15 ms band-passed noise. The bed
 *  scheduler enforces >= 0.7 s spacing, and the voice is the quietest in
 *  the table: a bed must never compete with an event. */
const tick: VoiceFn = ({ ctx, t }, bus) => {
  const s = noise(ctx);
  // Q 2.5, not 8: a Q-8 bandpass starves white noise into inaudibility
  // (measured 0.002 through the master — a clock you cannot hear is a
  // clock that makes the mix look wrong from the inside)
  const bp = biquad(ctx, 'bandpass', 2200, 2.5, t);
  const g = ctx.createGain();
  env(g, t, VOICE_GAIN.tick, 0.001, 0.03);
  s.connect(bp).connect(g).connect(bus.dry);
  g.connect(bus.wet);
  start([s], [bp, g], t, t + 0.04);
};

/** Garden ambience: two chirps — a sine glissando up, twice, 90 ms apart,
 *  seconds between visitors. No bird is licensed because no bird was
 *  recorded. */
const bird: VoiceFn = ({ ctx, t }, bus) => {
  for (let i = 0; i < 2; i++) {
    const ti = t + i * 0.09;
    const o = osc(ctx, 'sine', 2400, ti);
    o.frequency.exponentialRampToValueAtTime(3400, ti + 0.055);
    const g = ctx.createGain();
    env(g, ti, VOICE_GAIN.bird, 0.004, 0.06);
    o.connect(g).connect(bus.dry);
    g.connect(bus.wet);
    start([o], [g], ti, ti + 0.07);
  }
};

/** The room bed: a low-passed noise loop at near-threshold level — the
 *  space a set lives in, not a sound. Sustained; the engine stops it via
 *  the handle when the bed changes or the tab hides. */
export interface BedHandle {
  stop(t: number): void;
}

export function startRoomBed(w: VoiceWhere, bus: AudioBus): BedHandle {
  const { ctx, t } = w;
  const s = noise(ctx, true);
  const lp = biquad(ctx, 'lowpass', 480, 0.6, t);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(VOICE_GAIN.room, t + 0.4);
  s.connect(lp).connect(g).connect(bus.dry);
  s.start(t);
  return {
    stop(at: number): void {
      g.gain.cancelScheduledValues(at);
      g.gain.linearRampToValueAtTime(0.0001, at + 0.15);
      s.stop(at + 0.2);
      s.onended = () => {
        for (const n of [s, lp, g]) n.disconnect();
      };
    },
  };
}

const room: VoiceFn = (w, bus) => {
  startRoomBed(w, bus); // one-shot sustained for the offline harness
};

/** The one sustained voice: wheel roll. Seeded noise through a lowpass
 *  whose frequency AND level follow the ON-SCREEN speed, updated only at
 *  <=20 Hz by the engine's throttle. A handle, not a one-shot — the engine
 *  opens it at launch and stops it at the terminal edge. */
export interface RollHandle {
  setSpeed(norm: number): void;
  /** The surface voicing (1 = the kitchen tile reference): multiplies the
   *  two cutoffs, so porcelain hisses brighter than a concrete floor.
   *  Set once per level by the engine (`SoundEngine.setSurface`), never
   *  per frame — one timbre per room, the design evaluation's honest
   *  minimum for "surface-honest roll". */
  setTone(factor: number): void;
  stop(t: number): void;
}

export function startRoll(w: VoiceWhere, bus: AudioBus): RollHandle {
  const { ctx, t } = w;
  const src = noise(ctx, true);
  const lp = biquad(ctx, 'lowpass', 200, 0.7, t);
  const bp = biquad(ctx, 'bandpass', 320, 0.6, t);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  const wet = ctx.createGain();
  wet.gain.setValueAtTime(0.3, t);
  src.connect(lp).connect(bp).connect(g);
  g.connect(bus.dry);
  g.connect(wet).connect(bus.wet);
  const all: AudioNode[] = [src, lp, bp, g, wet];
  src.start(t);
  let speed = 0;
  let tone = 1;
  const apply = (): void => {
    const s = Math.max(0, Math.min(1, speed));
    const now = ctx.currentTime;
    // param ramps, not jumps: a 20 Hz update must never click
    lp.frequency.linearRampToValueAtTime((180 + 900 * s) * tone, now + 0.05);
    bp.frequency.linearRampToValueAtTime((300 + 500 * s) * tone, now + 0.05);
    g.gain.linearRampToValueAtTime(
      Math.max(0.0001, VOICE_GAIN.roll * (0.08 + 0.92 * s)),
      now + 0.05,
    );
  };
  apply();
  return {
    setSpeed(norm: number): void {
      speed = norm;
      apply();
    },
    setTone(factor: number): void {
      tone = Math.max(0.2, Math.min(2.5, factor));
      apply();
    },
    stop(at: number): void {
      g.gain.cancelScheduledValues(at);
      g.gain.linearRampToValueAtTime(0.0001, at + 0.08);
      src.stop(at + 0.1);
      src.onended = () => {
        for (const n of all) n.disconnect();
      };
    },
  };
}

/** The dispatch table the engine and the offline harness share. `roll` is
 *  sustained (startRoll); its table entry schedules the same graph at a
 *  fixed speed so a harness can measure it like any other voice. */
export const VOICES: Record<VoiceName, VoiceFn> = {
  launch,
  snap,
  ring,
  cup,
  whoosh,
  hum,
  hazard,
  chime,
  victory,
  blipPlace,
  blipUndo,
  land,
  splash,
  oil,
  magnet,
  whirl,
  tick,
  bird,
  room,
  roll: () => {
    /* sustained voice — see `startRoll`; the harness drives that directly */
  },
};

export { chime, land };
