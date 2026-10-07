/**
 * The master chain, shared by the live engine and the offline loudness
 * harness so what is MEASURED is what is HEARD:
 *
 *   voice gain -> dry -> master(ceiling) -> limiter -> destination
 *              -> wet -> small room (2 damped combs -> 2 allpass -> tone)
 *                        -> master
 *
 * The reverb is convolver-FREE by brief: two feedback combs with a damped
 * loop and two series allpasses — a handful of nodes, a ~0.3 s tail, no
 * impulse file anywhere (house rule: zero assets). The limiter is a gentle
 * DynamicsCompressor used as a safety net so two voices landing on the same
 * millisecond cannot stack past the ceiling; the ceiling itself is the
 * number the mix quotes: -12 dBFS.
 */
import { MEASURE_SECONDS, VOICES, VOICE_NAMES, startRoll, chime } from './voices.ts';
import type { VoiceName } from './voices.ts';

/** -12.0 dBFS. Every loudness claim in the session log is measured against
 *  this gain through the chain below — in the browser, offline. */
export const MASTER_CEILING = 0.2512;
/** Volume 1.0 sits just under the ceiling; the user slider scales this. */
export const MASTER_TRIM = 0.9;

/** What a voice schedules onto: the direct path and the room send. Voice
 *  envelopes carry the per-voice design gain themselves (voices.ts), so
 *  the bus nodes are pure routing at unity / fixed send. */
export interface AudioBus {
  dry: GainNode;
  wet: GainNode;
  dispose(): void;
}

/**
 * Build a per-voice bus onto a master input node. With `sharedRoomIn` the
 * bus sends into a room the CALLER owns (the engine builds one room for
 * all voices); without one it builds and disposes its own (the harness
 * measures one voice at a time and wants that voice's room in isolation).
 */
export function makeBus(ctx: BaseAudioContext, master: AudioNode, sharedRoomIn?: AudioNode): AudioBus {
  const dry = ctx.createGain();
  dry.gain.setValueAtTime(1, 0);
  const wet = ctx.createGain();
  wet.gain.setValueAtTime(0.3, 0);
  dry.connect(master);
  let own: Room | null = null;
  let roomIn: AudioNode;
  if (sharedRoomIn) {
    roomIn = sharedRoomIn;
  } else {
    own = makeRoom(ctx);
    roomIn = own.in;
    // the shared room's out joins at the MASTER, not a send node — a send
    // feeding back through it would close wet -> room -> wet and the comb
    // loop would regrow forever
    own.out.connect(master);
  }
  wet.connect(roomIn);
  return {
    dry,
    wet,
    dispose() {
      dry.disconnect();
      wet.disconnect();
      wet.disconnect(roomIn);
      own?.dispose();
    },
  };
}

export interface Room {
  in: AudioNode;
  out: AudioNode;
  dispose(): void;
}

/** The little room: a high-passed input feeds two damped comb filters in
 *  parallel (37 ms / 53 ms, feedback 0.66 / 0.61 — roughly a 0.3 s tail);
 *  their outputs merge into two series allpasses (17 ms, 7 ms) that smear
 *  the combs' metallic ringing into room tone, and a lowpass so the send
 *  never sounds like a spring. */
export function makeRoom(ctx: BaseAudioContext): Room {
  const input = ctx.createBiquadFilter();
  input.type = 'highpass';
  input.frequency.setValueAtTime(300, 0);
  const merged = ctx.createGain();
  merged.gain.setValueAtTime(0.5, 0);
  const out = ctx.createGain();
  out.gain.setValueAtTime(0.6, 0);
  const tone = ctx.createBiquadFilter();
  tone.type = 'lowpass';
  tone.frequency.setValueAtTime(3400, 0);
  const parts: AudioNode[] = [input, merged, out, tone];

  input.connect(merged);
  for (const [delayS, fb] of [
    [0.037, 0.66],
    [0.053, 0.61],
  ] as const) {
    const sum = ctx.createGain();
    sum.gain.setValueAtTime(1, 0);
    const d = ctx.createDelay(0.2);
    d.delayTime.setValueAtTime(delayS, 0);
    const damp = ctx.createBiquadFilter();
    damp.type = 'lowpass';
    damp.frequency.setValueAtTime(3200, 0);
    const f = ctx.createGain();
    f.gain.setValueAtTime(fb, 0);
    input.connect(sum);
    sum.connect(d).connect(damp).connect(f).connect(sum); // comb loop
    damp.connect(merged); // tapped after damping, out of the loop
    parts.push(sum, d, damp, f);
  }

  // series allpass pair on the merged combs (smear, not gain)
  let node: AudioNode = merged;
  for (const ms of [17, 7]) {
    const sum = ctx.createGain();
    sum.gain.setValueAtTime(1, 0);
    const d = ctx.createDelay(0.2);
    d.delayTime.setValueAtTime(ms / 1000, 0);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.7, 0);
    node.connect(sum);
    sum.connect(d);
    d.connect(g).connect(sum);
    node = d;
    parts.push(sum, d, g);
  }
  node.connect(tone).connect(out);
  return {
    in: input,
    out,
    dispose() {
      for (const p of parts) p.disconnect();
    },
  };
}

/** Build the shared master chain (ceiling gain + gentle limiter) onto a
 *  destination. The engine and the harness build the SAME chain, so the
 *  measured peak is the heard peak. */
export function makeMaster(ctx: BaseAudioContext, destination: AudioNode): GainNode {
  const master = ctx.createGain();
  master.gain.setValueAtTime(MASTER_CEILING * MASTER_TRIM, 0);
  const lim = ctx.createDynamicsCompressor();
  lim.threshold.setValueAtTime(-14, 0);
  lim.knee.setValueAtTime(6, 0);
  lim.ratio.setValueAtTime(8, 0);
  lim.attack.setValueAtTime(0.006, 0);
  lim.release.setValueAtTime(0.18, 0);
  master.connect(lim).connect(destination);
  return master;
}

export interface Loudness {
  /** Peak linear amplitude of the rendered voice (through the full mix). */
  peak: number;
  /** Mean sample — the DC offset, which must be indistinguishable from 0. */
  dc: number;
}

/** Render one voice OFFLINE through the full master chain and measure it.
 *  This is the loudness harness the brief asks for: the number it returns
 *  is the number the mix has, because the chain here is the chain the
 *  engine builds live. Noise is seeded, so renders repeat. */
export async function renderVoice(
  Ctor: typeof OfflineAudioContext,
  name: VoiceName,
): Promise<Loudness & { seconds: number }> {
  const sr = 44100;
  const ctx = new Ctor(1, Math.floor(sr * MEASURE_SECONDS), sr);
  const master = makeMaster(ctx, ctx.destination);
  const bus = makeBus(ctx, master);
  if (name === 'roll') {
    const handle = startRoll({ ctx, t: 0.02 }, bus);
    handle.setSpeed(0.7); // fixed mid speed, stopped after 1.2 s
    handle.stop(1.2);
  } else if (name === 'chime') {
    chime.notes = 3; // worst case: all three stars
    VOICES.chime({ ctx, t: 0.02 }, bus);
    chime.notes = 1;
  } else {
    VOICES[name]({ ctx, t: 0.02 }, bus);
  }
  const buf = await ctx.startRendering();
  const data = buf.getChannelData(0);
  let peak = 0;
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    const v = data[i]!;
    const a = v < 0 ? -v : v;
    if (a > peak) peak = a;
    sum += v;
  }
  return { peak, dc: sum / data.length, seconds: buf.duration };
}

/** Every voice, measured. Used by the e2e loudness assertion and printed
 *  for the session log. */
export async function renderAllVoices(
  Ctor: typeof OfflineAudioContext,
): Promise<Record<VoiceName, Loudness>> {
  const out = {} as Record<VoiceName, Loudness>;
  for (const name of VOICE_NAMES) {
    const { peak, dc } = await renderVoice(Ctor, name);
    out[name] = { peak, dc };
  }
  return out;
}
