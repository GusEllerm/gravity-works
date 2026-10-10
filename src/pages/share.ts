/**
 * THE SHARED-RUN PAGE (program T0.2, extracted verbatim from `src/boot.ts`;
 * restacked by program T2.2):
 * a `#s=` fragment opens this page PLAYING — the film IS the first thing:
 * the stage mounts at the top of the page and paints its preview frame
 * before the wasm await, the tape winds behind the bar, and the playhead
 * rolls the instant the ready state allows (no click — autoplay is legal
 * here because the page re-SIMS the run, it is not a media embed; the
 * evaluation's own distinction). The one thing the visitor came for, the
 * VERDICT, is ONE honest line under the player (`#gw-replay-verdict`),
 * machine-local in its wording ("on this machine") — the badge-then-fold
 * scavenger hunt is gone, and the hash essay lives under a `details`
 * summary below the fold. The verification half below is unchanged and
 * still honest — the tape IS the verification: the chunked wind
 * (`TapeRecorder`, below) steps the deterministic sim in timer-sized
 * slices and its terminal hash is the verdict — `parseShareUrl` → wind →
 * compare → `verified`/`mismatch` in `#gw-replay-status` (the seam strings
 * the specs pin — the human line carries the same words in prose, the
 * seam keeps its exact text); see `Modules/replay`.
 */
import * as THREE from 'three';
import { FIXED_DT } from '../physics/sim.ts';
import { getLevel } from '../world/levels/feeltrack.level.ts';
import { World, type RunStatus } from '../world/world.ts';
import type { Build } from '../track/build.ts';
import type { Level } from '../world/level.ts';
import { playerPieceCount } from '../ui/advice.ts';
import { parseShareUrl, type SharePayload } from '../share/share.ts';
import { replayRun } from '../replay/replay.ts';
import { TapeRecorder, ReplayDirector, cupView, REPLAY_FOV } from '../replay/cinematic.ts';
import { loadSave } from '../save/save.ts';
import { SET_TOKENS } from '../render/tokens.ts';
import { createCarRig, CAR_GROUND_LIFT, CAR_SPIN_DAMP } from '../render/car-rig.ts';
import { parFor, starsFor, type RunOutcome, type RunResult } from '../world/stars.ts';
import { downloadBlob, generateShareCard } from '../share/card.ts';
import { SETS } from '../sets/index.ts';
import { reducedMotionActive } from '../ui/motion.ts';
import { paragraph } from '../ui/dom.ts';
import { boundaryStopped } from '../ui/errors.ts';
import { buildGameSet, levelSet, setCameraSolids } from './mount.ts';
import type { RunCameraSolid } from '../camera/run-camera.ts';

// ---- shared-run page --------------------------------------------------------
//
// Stage 5: a share link OPENS INTO the replay. The verification half is
// unchanged and still honest — the tape IS the verification: the chunked
// wind (`TapeRecorder`, below) steps the deterministic sim in timer-sized
// slices and its terminal hash is the verdict — `parseShareUrl` → wind →
// compare → `verified`/`mismatch` in `#gw-replay-status`, now in the
// section BELOW the fold; above it the page is a cinematic player — the
// same deterministic run recorded step-for-step by `TapeRecorder.pump` and
// rendered through a three-shot camera sequence with the house post stack,
// scrubber and all. Playback reads recorded sim states only: seeking never
// invents a state between two steps. Readiness has a SURFACE (feel pass,
// Playtest CC: "the tape only starts ~6 s after the click"): the bar is
// up-front WAITING with a progress label, a click during the wind is
// QUEUED not swallowed, and on ready the playhead snaps to 0 and rolls.

export async function bootSharedRun(root: HTMLElement): Promise<void> {
  root.innerHTML = '';
  // T2.2 SHARE FIRST TWO SECONDS (the 2026-10-09 evaluation, 5/5: "the
  // share link shows the game but the verdict is not the first thing, I
  // wait and nothing moves"). The title is a CAPTION, not a hero — the
  // stage is the first substantial node and paints its preview frame
  // before the wasm await, so frame 0 of a share link is the RUN, not a
  // heading and not a waiting room.
  const title = document.createElement('h1');
  title.id = 'gw-replay-title';
  title.textContent = 'Watch this run';
  root.appendChild(title);

  const stage = document.createElement('div');
  stage.id = 'gw-stage';
  stage.style.position = 'relative';
  root.appendChild(stage);
  const bar = document.createElement('div');
  bar.id = 'gw-replay-bar';
  bar.hidden = true;
  root.appendChild(bar);

  // THE ONE HONEST LINE (T2.2, replaces the badge-and-fold scavenger
  // hunt): the verdict lives under the player, in words, machine-local by
  // construction — "on this machine" is in the sentence because the hash
  // is a re-sim verdict and determinism is proven only across the two
  // measured machines (`Reference/Cross-platform determinism`). No symbol
  // alone: the glyph rides the word. Before the settle it promises the
  // verdict, never pre-empts it.
  const verdict = document.createElement('p');
  verdict.id = 'gw-replay-verdict';
  verdict.setAttribute('role', 'status');
  verdict.setAttribute('aria-live', 'polite');
  verdict.textContent = 'replaying the run on this machine — the verdict lands when the tape is ready\u2026';
  root.appendChild(verdict);
  const tagline = document.createElement('p');
  tagline.id = 'gw-replay-tagline';
  tagline.textContent = 'One build, one release — this page replays it exactly.';
  root.appendChild(tagline);

  // the honest half, BELOW the fold: the verdict and the two hashes, exactly
  // the strings the stage-2/3/4 specs read
  const verify = document.createElement('section');
  verify.id = 'gw-replay-verify';
  const verifyHeading = document.createElement('h2');
  verifyHeading.textContent = 'How this link verifies';
  verify.appendChild(verifyHeading);
  const status = paragraph('gw-replay-status', verify);
  const computed = paragraph('gw-replay-hash', verify, 'text');
  const embedded = paragraph('gw-replay-embedded', verify, 'text');
  // THE HASH ESSAY GOES BEHIND A TOGGLE (T2.2): the paragraph was nine
  // lines of mechanism at the top of the honest half; the mechanism is
  // still on the page, one deliberate click down.
  const fold = document.createElement('details');
  fold.id = 'gw-replay-verify-fold';
  const foldSummary = document.createElement('summary');
  foldSummary.textContent = 'Why a hash is a promise';
  fold.appendChild(foldSummary);
  const verifyNote = document.createElement('p');
  verifyNote.id = 'gw-replay-verify-note';
  verifyNote.textContent =
    'The link carries the run\u2019s final state hash. This page replays the level, build and seed on this machine and compares. Same machine, same engine — the same run. That identity has so far crossed machines intact: every reference-build hash in the game measures identical on Linux/x86-64 and Apple silicon (CI-measured) — other platforms remain unproven.';
  fold.appendChild(verifyNote);
  verify.appendChild(fold);
  root.appendChild(verify);

  status.textContent = 'replaying\u2026';
  let payload;
  let level: Level;
  try {
    payload = await parseShareUrl(window.location.href);
    level = getLevel(payload.levelId);
  } catch {
    status.textContent = 'invalid share link';
    verdict.textContent = 'this link is not a run — nothing to replay';
    return;
  }
  embedded.textContent = `link hash ${payload.hash}`;
  // The verdict is LAZY: the cinematic wind settles it as soon as the tape
  // is done (`settle` below), and the share card reads `run` at click time.
  // Nothing here blocks the bar on a simulation any more.
  const run: { time: number; status: RunStatus; verified: boolean } = {
    time: 0,
    status: 'timeout',
    verified: false,
  };
  let verdictSettled = false;
  const settle = (hash: string, time: number, st: RunStatus): boolean => {
    run.time = time;
    run.status = st;
    run.verified = hash === payload.hash;
    verdictSettled = true;
    computed.textContent = `replay hash ${hash}`;
    status.textContent = run.verified ? 'verified' : 'mismatch';
    verdict.textContent = run.verified
      ? '\u2713 verified \u00b7 matches the link \u2014 re-simulated on this machine'
      : '\u26a0 this machine disagrees \u00b7 the replay here differs from the link';
    verdict.dataset['verdict'] = run.verified ? 'verified' : 'mismatch';
    return run.verified;
  };
  wireShareCard(verify, payload, level, run);

  // the cinematic layer — a failed WebGL build must never eat the verdict
  // the specs (and the visitor) came for: if the player cannot mount (or
  // died before the wind settled the verdict), fall back to the headless
  // one-shot replay for the verdict alone.
  try {
    await startReplayPlayer({ stage, bar }, level, payload, settle);
  } catch {
    bar.hidden = true;
    if (!verdictSettled) {
      try {
        const headless = await replayRun(level, payload.build);
        settle(headless.hash, headless.time, headless.status);
      } catch {
        status.textContent = 'mismatch';
        verdict.textContent = '\u26a0 this machine could not replay the run \u2014 the link cannot be checked here';
        verdict.dataset['verdict'] = 'mismatch';
      }
    }
  }
}

/** Brief §9.4: the share page exports the run as a share-card PNG. The run
 *  fields are read at CLICK time from the lazy verdict object. */
function wireShareCard(
  root: HTMLElement,
  payload: { levelId: string; build: Build; hash: string },
  level: Level,
  run: { time: number; status: RunStatus; verified: boolean },
): void {
  const cardStatus = paragraph('gw-card-status', root, 'text');
  const button = document.createElement('button');
  button.id = 'gw-share-card';
  button.type = 'button';
  button.textContent = 'Download share card';
  root.appendChild(button);
  button.addEventListener('click', () => {
    cardStatus.textContent = 'rendering card…';
    const outcome: RunOutcome =
      run.status === 'finished' || run.status === 'fell' || run.status === 'stalled' || run.status === 'timeout'
        ? run.status
        : 'timeout'; // a never-started replay is not a card-worthy run; stars read 0
    const result: RunResult = {
      status: outcome,
      time: run.time,
      piecesUsed: playerPieceCount(level, payload.build),
      hazardsTouched: 0,
    };
    void generateShareCard({
      levelId: payload.levelId,
      build: payload.build,
      time: run.time,
      stars: starsFor(result, parFor(payload.levelId, level.par)),
      url: window.location.href,
      verified: run.verified,
    })
      .then((blob) => {
        downloadBlob(blob, `gravity-works-${payload.levelId}.png`);
        cardStatus.textContent = 'card ready';
      })
      .catch(() => {
        cardStatus.textContent = 'card failed';
      });
  });
}

// ---- cinematic replay player (stage 5) ---------------------------------------

/** The chunk law of the wind (feel pass, Playtest CC): pump at most 32
 *  fixed sim steps per pump and no more than 8 ms of wall clock per pump
 *  slice — half a 60 Hz frame, so the page keeps painting and answering
 *  clicks while the tape winds. 32 steps ≈ 0.27 s of film per slice, which
 *  on a typical kitchen run (≈270 steps) finishes well inside 1.5 s of
 *  first paint while staying interactive the whole way. */
const WIND_CHUNK_STEPS = 32;
const WIND_CHUNK_BUDGET_MS = 8;

/**
 * The replay half of the shared-run page: mount the level's set and build in
 * a visual `World`, wind the run step-for-step (`TapeRecorder` pumped
 * across timer slices — the tape BUILD is now a progress-reported, resumable
 * wind, not a silent synchronous block), then hand the trace to the shot-
 * sequence director and a scrubber. Playback reads ONLY recorded sim states
 * (`stepAt` floors to a step, never blends two); the camera poses are
 * functions of sim time alone, so 1×/2×/4× and any seek cannot perturb what
 * is shown. The build-view gesture stack is untouched — nothing here
 * attaches to the game page. `settle` gets the terminal hash the moment the
 * wind ends — the tape IS the verification (the hash equals the headless
 * `replayRun` hash by the determinism law the specs pin).
 */
async function startReplayPlayer(
  host: { stage: HTMLElement; bar: HTMLElement },
  level: Level,
  payload: SharePayload,
  settle: (hash: string, time: number, status: RunStatus) => boolean,
): Promise<void> {
  const { stage, bar } = host;
  // ---- READINESS FIRST (feel pass, Playtest CC: "first Play click works,
  // but the tape only starts ~6 s after the click… the button still reads
  // Play, so a stranger double-clicks"). The bar goes up BEFORE any heavy
  // work in a WAITING state: a spinner label with honest progress, never a
  // dead button. A click during the wind is QUEUED — auto-plays from 0 the
  // instant the tape is ready — never swallowed.
  bar.innerHTML = '';
  const windBtn = document.createElement('button');
  windBtn.id = 'gw-replay-play';
  windBtn.type = 'button';
  windBtn.dataset['phase'] = 'waiting';
  windBtn.setAttribute('aria-busy', 'true');
  windBtn.setAttribute('aria-label', 'Play (tape winding)');
  windBtn.textContent = '⏳ winding the tape… 0%';
  const windNote = document.createElement('span');
  windNote.id = 'gw-replay-progress';
  windNote.setAttribute('role', 'status');
  windNote.setAttribute('aria-live', 'polite');
  windNote.textContent = 'winding the tape…';
  const wind = {
    phase: 'waiting' as 'waiting' | 'ready',
    pendingPlay: false,
    steps: 0,
    estSteps: Math.max(120, Math.round(Math.min(Math.max(level.par.time, 0.5), level.maxTime) * (1 / FIXED_DT))),
    chunks: [] as { steps: number; hash: string }[],
    windMs: 0,
    /** Wall-clock phase ledger of the ready path (ms since the bar went up):
     *  mount = set + world build, post = stack + preview paint, wind = the
     *  chunked sim, ready = full bar + first traced frame. The e2e asserts
     *  the TOTAL against the ready bound and reads the breakdown to say
     *  WHERE time went when it misses. */
    marks: { mount: 0, post: 0, wind: 0, ready: 0 } as Record<string, number>,
    t0: performance.now(),
  };
  windBtn.addEventListener('click', () => {
    wind.pendingPlay = true;
    windBtn.textContent = '⏳ queued — winding the tape…';
  });
  bar.append(windBtn, windNote);
  bar.hidden = false;
  /** The button-state ledger (e2e): waiting → playing/paused → ended, in
   *  order, deduped — the proof there is no silent window. */
  const phases: string[] = ['waiting'];
  const phasePush = (p: string): void => {
    if (phases[phases.length - 1] !== p) phases.push(p);
  };
  const seamWindow = window as unknown as Record<string, unknown>;
  seamWindow.__gwReplayWind = (): typeof wind => ({
    ...wind,
    chunks: wind.chunks.map((c) => ({ steps: c.steps, hash: c.hash })),
  });
  seamWindow.__gwReplayPhases = (): string[] => phases.slice();

  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setSize(960, 540, false);
  renderer.domElement.id = 'gw-canvas';
  // STAGE 6 A11Y: the canvas is the world a screen-reader visitor cannot
  // see — it gets a NAME (never a bare canvas node in the a11y tree) and
  // the live status lines beside it stay the running commentary. The keys
  // live on the page, so the canvas is deliberately not a tab stop (the
  // world's own tab stop is the builder group).
  renderer.domElement.setAttribute('role', 'img');
  renderer.domElement.setAttribute('aria-label', 'Replay view — a recorded run of the track');
  stage.appendChild(renderer.domElement);
  const camera = new THREE.PerspectiveCamera(REPLAY_FOV, 960 / 540, 0.01, 24);
  const setReg = levelSet(level) ? SETS[levelSet(level)!] : null;
  // warm frame before the wasm await (the game page's rule, same reason)
  {
    const warm = new THREE.Scene();
    warm.background = new THREE.Color(setReg?.tokens.background ?? SET_TOKENS.kitchen.background);
    renderer.render(warm, camera);
  }
  const setInstance = setReg ? await buildGameSet(setReg, level.id) : null;
  const solids: readonly RunCameraSolid[] = setInstance
    ? setCameraSolids(setInstance.group).map((b) => ({
        min: [b.min.x, b.min.y, b.min.z],
        max: [b.max.x, b.max.y, b.max.z],
      }))
    : [];
  const world = await World.create(level, payload.build, { visuals: true });
  wind.marks.mount = Math.round(performance.now() - wind.t0);
  const scene = world.scene;
  if (!scene) throw new Error('replay player: world has no scene');
  // THE FILM'S STAR (program P4, player final §8): the ratified car-a rig
  // mounts on the film path exactly where the game shell mounts it
  // (`src/boot.ts` T1.1) — the friend's film shows the car the game
  // drives, not the World's `#d7263d` fallback proxy. RENDER-SIDE LAW,
  // unchanged: the rig hangs off the RECORDED pose, `world.carMesh` stays
  // mounted (hidden) with its transforms still written, `hashedBodies`
  // never sees a rig mesh, and the chunked wind hashed no visuals —
  // `replay:all` stays byte-identical. Wheel spin is the same render-side
  // omega the shell integrates, but read off the TAPE (arc length over
  // `radius × CAR_SPIN_DAMP`), so it is a pure function of playhead step
  // — seek- and rate-proof, and every capture frame reproducible.
  // SQUASH stays out: it is the driver's contact voice on wall time;
  // these are cinema frames, and a wall-clock squash would make the
  // capture PNGs frame-order-dependent (the juice layer stays
  // game-shell-only by decision — see the P4 filmcar session note).
  const carRig = createCarRig(setReg?.tokens ?? SET_TOKENS.kitchen);
  carRig.setKeyLight('#ffffff', 1.1);
  const carPoseGroup = new THREE.Group();
  carPoseGroup.name = 'car-pose';
  carPoseGroup.add(carRig.group);
  carRig.group.position.y = -CAR_GROUND_LIFT;
  scene.add(carPoseGroup);
  if (world.carMesh) world.carMesh.visible = false;
  {
    // the rig stands on the grid for the pre-wind preview frame, exactly
    // where the recorded tape will start it
    const s0 = world.state().car;
    carPoseGroup.position.set(s0.pos.x, s0.pos.y, s0.pos.z);
    carPoseGroup.quaternion.set(s0.quat.x, s0.quat.y, s0.quat.z, s0.quat.w);
  }
  if (setInstance && setReg) {
    scene.add(setInstance.group);
    scene.background = new THREE.Color(setReg.tokens.background);
  }
  // the house look rides along: the quarter-res tilt-shift stack, focus band
  // centred on the car at the step being shown (the game page's §7.3 rule).
  // BUILT BEFORE THE WIND (feel pass): its first render compiles the post
  // shaders as ONE early block — measured cheaper than compiling plain
  // scene shaders first and the stack's after — and that block sits inside
  // the WAITING label's window, with the rig already on stage: the visitor
  // sees WHAT they are about to watch, not an empty stage.
  const { createPostStack } = await import('../render/post/index.ts');
  const post = createPostStack(renderer, camera, { tokens: setReg?.tokens ?? SET_TOKENS.kitchen });
  const track = scene.getObjectByName('track');
  const box = track ? new THREE.Box3().setFromObject(track) : new THREE.Box3();
  // PRE-WIND PREVIEW FRAME (same analytic wide framing the director will
  // open on — no trace needed).
  {
    const size = box.isEmpty() ? new THREE.Vector3(0.5, 0.2, 0.5) : box.getSize(new THREE.Vector3());
    const center = box.isEmpty() ? new THREE.Vector3() : box.getCenter(new THREE.Vector3());
    const tanV = Math.tan((REPLAY_FOV / 2) * (Math.PI / 180));
    const tanH = tanV * (960 / 540);
    const d = Math.max(
      1.2,
      1.25 * ((Math.max(size.x, size.z) / 2 + 0.25) / tanH),
      1.25 * ((size.y / 2 + 0.2) / tanV),
    );
    camera.position.copy(center).add(new THREE.Vector3(0.55, 0.62, 0.75).normalize().multiplyScalar(d));
    camera.lookAt(center);
    post.setFocus([world.state().car.pos.x, world.state().car.pos.y, world.state().car.pos.z]);
    post.render(scene);
  }
  wind.marks.post = Math.round(performance.now() - wind.t0);
  // ---- THE CHUNKED WIND — the deterministic sim stepped in timer-sized
  // slices (WIND_CHUNK_STEPS per pump, WIND_CHUNK_BUDGET_MS per slice) so
  // the page PAINTS and COUNTS while the tape winds: the label reports
  // "winding the tape… 40%" (progress against the par-length estimate,
  // capped at 99 % until the run is genuinely over — it never claims ready
  // early). Slicing changes only WHEN steps run: the per-slice world state
  // hash follows the one-shot wind step for step (`__gwReplayWind().chunks`
  // is the evidence the e2e compares against the Node sim's hashes).
  const recorder = new TapeRecorder(world, payload.build, { solids });
  const windT0 = performance.now();
  await new Promise<void>((resolve) => {
    // THE PUMP CLOCK IS A MESSAGE PORT — timers and rAF are BOTH untrusted
    // (stage-5 CI-red fix, then the close-review F-1 fix on top of it). The
    // frame callback can be STARVED, not just slow: CI's SwiftShader
    // compositor paces rAF coarsely and Chrome stops firing rAF on a HIDDEN
    // tab ENTIRELY, so the old rAF-raced arm left the tape unwound there.
    // Its replacement — a chained setTimeout(0) — fixed the foreground and
    // rAF never, but NOT the background: Chrome CLAMPS chained timers when
    // hidden, and intensive throttling aligns a tab hidden past ~5 minutes
    // to roughly ONE WAKE PER MINUTE, so an N-slice tape waits N minutes.
    // The slices now ride their OWN MessageChannel port (a self-posted
    // port message is a message-loop task — no timer to clamp), never more
    // than one wake in flight, so chunks progress on ANY machine; the 0 ms
    // timer survives only as the fallback for an engine without
    // MessageChannel. rAF carries only the progress-label repaint — at most
    // one paint in flight, skipped while no frames exist — so the bar still
    // counts on any machine that PAINTS, and the wind answers to no clock
    // but its own budget (`tests/e2e/stage5-ready.spec.ts` item 4 proves
    // rAF-independence, item 5 proves timer-clamp-independence).
    // E2E SLICE KNOB — `?e2eWindSlice=N` forces EXACTLY N steps per
    // scheduled tick (budget dropped) so a spec can make the WAITING state
    // PERSIST and the queued-click proof never races the wind (close
    // review F-2; the debug-param doctrine's line, as `?set=`). Absent the
    // param — every real share link — the chunk law below is untouched.
    const windSliceParam = new URLSearchParams(window.location.search).get('e2eWindSlice');
    const windSteps =
      windSliceParam === null ? WIND_CHUNK_STEPS : Math.max(1, Math.floor(Number(windSliceParam)) || 1);
    const windBudgetMs = windSliceParam === null ? WIND_CHUNK_BUDGET_MS : 0;
    let pendingPaint = 0;
    const paint = (): void => {
      pendingPaint = 0;
      const pct = Math.min(99, Math.round((recorder.totalSteps / wind.estSteps) * 100));
      if (!wind.pendingPlay) windBtn.textContent = `⏳ winding the tape… ${pct}%`;
      windNote.textContent = `winding the tape… ${pct}%`;
    };
    const pumpPort = typeof MessageChannel === 'function' ? new MessageChannel() : null;
    let portArmed = false;
    const schedulePump = (): void => {
      if (pumpPort) {
        if (portArmed) return; // never more than one wake in flight
        portArmed = true;
        pumpPort.port2.postMessage(0); // self-post: throttled by NOTHING
      } else {
        setTimeout(pumpSlice, 0); // fallback: an engine without MessageChannel
      }
    };
    if (pumpPort) {
      pumpPort.port1.onmessage = (): void => {
        portArmed = false;
        pumpSlice();
      };
    }
    const pumpSlice = (): void => {
      const t0 = performance.now();
      do {
        recorder.pump(windSteps);
      } while (!recorder.done && performance.now() - t0 < windBudgetMs);
      wind.steps = recorder.totalSteps;
      if (recorder.done) {
        if (pendingPaint) cancelAnimationFrame(pendingPaint);
        pumpPort?.port1.close();
        resolve();
        return;
      }
      if (!pendingPaint) pendingPaint = requestAnimationFrame(paint);
      schedulePump();
    };
    pumpSlice();
  });
  wind.chunks = recorder.sliceHashes.map((c) => ({ steps: c.steps, hash: c.hash }));
  wind.windMs = performance.now() - windT0;
  wind.phase = 'ready';
  wind.marks.wind = Math.round(performance.now() - wind.t0);
  if (!wind.pendingPlay) windBtn.textContent = '⏳ winding the tape… 100%';
  const trace = recorder.finish();
  // the tape IS the verdict: settle the honest half the moment the wind ends
  const verified = settle(trace.hash, trace.time, trace.status);
  const reducedMotion = reducedMotionActive(loadSave().settings.reducedMotion);
  const director = new ReplayDirector({
    trace,
    box,
    cup: cupView(payload.build),
    fov: REPLAY_FOV,
    aspect: 960 / 540,
    reducedMotion,
  });

  const duration = Math.max(trace.duration, 0.1);
  const stepAt = (t: number): number =>
    Math.min(trace.steps - 1, Math.max(0, Math.floor(t / trace.dt + 1e-6)));
  // THE WHEEL SPIN OF THE FILM: the shell's cosmetic omega integrated over
  // the TAPE's own arc length instead of wall dt — the same render-side
  // law (`speed / (radius × CAR_SPIN_DAMP)`, nothing physical), expressed
  // as a pure function of step so a seek, a 4× pass and a capture frame
  // all agree on where the wheels stand.
  const wheelAngleAt = new Float64Array(trace.steps);
  {
    let cum = 0;
    for (let k = 1; k < trace.steps; k++) {
      const dx = trace.pos[k * 3]! - trace.pos[(k - 1) * 3]!;
      const dy = trace.pos[k * 3 + 1]! - trace.pos[(k - 1) * 3 + 1]!;
      const dz = trace.pos[k * 3 + 2]! - trace.pos[(k - 1) * 3 + 2]!;
      cum += Math.sqrt(dx * dx + dy * dy + dz * dz);
      wheelAngleAt[k] = cum / (carRig.wheelRadius * CAR_SPIN_DAMP);
    }
  }
  let time = 0;
  // A click made while the tape was winding is HONOURED here, not lost: the
  // queued click wins over the reduced-motion pause default, and the
  // playhead starts at 0 either way (the snap — never at the end).
  if (wind.pendingPlay) phases.push('queued-click');
  let playing = wind.pendingPlay || !reducedMotion;
  let rate = 1;
  let dragging = false;
  let resumeAfterDrag = false;
  /** Below this much remaining watchable motion a Play click rewinds to 0
   *  (see the play-button comment — the dead-first-click fix). */
  const PLAY_RESUME_MIN = Math.min(0.5, duration * 0.5);
  /** The PACE LEDGER (e2e debug surface): [wallMs, playheadS, rate] for every
   *  frame that ADVANCED the playhead. The share-replay rate law is asserted
   *  from it PER RENDERED FRAME — advance === min(frame gap, 0.25 s) × rate —
   *  because CI truth (SwiftShader) can make one frame outlast any fixed
   *  wall-clock sampling wait: a 300 ms `waitForTimeout` on the 15.8 s
   *  feeltrack link could hold zero frames (the playhead "never moved") or
   *  one clamped giant. Any event that breaks frame-gap continuity (Play/
   *  pause, seek, resume-after-drag, speed change) or clamps at the end
   *  clears the ledger, so no asserted interval ever spans a discontinuity. */
  const pace: [number, number, number][] = [];
  const paceBreak = (): void => {
    pace.length = 0;
  };

  const renderAt = (t: number): void => {
    const k = stepAt(t);
    const px = trace.pos[k * 3]!;
    const py = trace.pos[k * 3 + 1]!;
    const pz = trace.pos[k * 3 + 2]!;
    if (world.carMesh) {
      world.carMesh.position.set(px, py, pz);
      world.carMesh.quaternion.set(
        trace.quat[k * 4]!,
        trace.quat[k * 4 + 1]!,
        trace.quat[k * 4 + 2]!,
        trace.quat[k * 4 + 3]!,
      );
    }
    // the rig rides the SAME recorded pose the hidden proxy got — the
    // film's star is the sedan, and nothing below this line is physics
    carPoseGroup.position.set(px, py, pz);
    carPoseGroup.quaternion.set(
      trace.quat[k * 4]!,
      trace.quat[k * 4 + 1]!,
      trace.quat[k * 4 + 2]!,
      trace.quat[k * 4 + 3]!,
    );
    for (const wheel of carRig.wheels) wheel.rotation.z = wheelAngleAt[k]!;
    director.poseAt(t);
    camera.position.copy(director.position);
    camera.quaternion.copy(director.quaternion);
    post.setFocus([px, py, pz]);
    post.render(scene);
  };

  // ---- the replay bar: play/pause, time, scrub track with event ticks,
  // speed, and the obvious way out of the audience seat
  bar.innerHTML = '';
  const playBtn = document.createElement('button');
  playBtn.id = 'gw-replay-play';
  playBtn.type = 'button';
  const syncPlay = (): void => {
    playBtn.textContent = playing ? '⏸' : '▶';
    playBtn.setAttribute('aria-label', playing ? 'Pause' : 'Play');
    playBtn.setAttribute('aria-pressed', String(playing));
    playBtn.removeAttribute('aria-busy');
    playBtn.dataset['phase'] = playing ? 'playing' : 'paused';
    phasePush(playing ? 'playing' : 'paused');
  };
  playBtn.addEventListener('click', () => {
    // PLAY always STARTS MOTION when it is the resume click (playtest BB:
    // "first Play click did nothing... second click worked"). The restart
    // test used to be `time >= duration`, but the film LOOKS over long
    // before it IS over: the finish lock-off holds on a settled cup for
    // REPLAY_TAIL, and the last steps before the end crawl. A click that
    // lands in that window (paused mid-tail from a scrub, or just after a
    // pause taken during the hold) advanced one or two steps, hit the
    // clamp, and re-paused — motion the eye cannot catch reads as a dead
    // click, and only the NEXT click (now truly at the end) restarted.
    // If the playable window left is shorter than a second of watchable
    // motion, Play means REWIND AND PLAY — the tail's last sliver is the
    // settle the viewer has already seen.
    if (!playing && duration - time < PLAY_RESUME_MIN) time = 0;
    playing = !playing;
    paceBreak();
    syncPlay();
  });
  const timeEl = document.createElement('span');
  timeEl.id = 'gw-replay-time';
  const timeline = document.createElement('div');
  timeline.id = 'gw-replay-timeline';
  timeline.setAttribute('role', 'slider');
  timeline.setAttribute('tabindex', '0');
  timeline.setAttribute('aria-label', 'Replay timeline');
  timeline.setAttribute('aria-valuemin', '0');
  timeline.setAttribute('aria-valuemax', duration.toFixed(2));
  const head = document.createElement('div');
  head.id = 'gw-replay-head';
  timeline.appendChild(head);
  for (const ev of trace.events) {
    const tick = document.createElement('span');
    tick.className = 'gw-replay-tick';
    tick.dataset['t'] = String(ev.t);
    tick.style.left = `${(THREE.MathUtils.clamp(ev.t / duration, 0, 1) * 100).toFixed(3)}%`;
    tick.title = ev.label;
    tick.setAttribute('aria-hidden', 'true');
    timeline.appendChild(tick);
  }
  const syncBar = (): void => {
    head.style.left = `${(THREE.MathUtils.clamp(time / duration, 0, 1) * 100).toFixed(3)}%`;
    timeEl.textContent = `${time.toFixed(1)}s / ${duration.toFixed(1)}s`;
    timeline.setAttribute('aria-valuenow', time.toFixed(2));
    timeline.setAttribute('aria-valuetext', `${time.toFixed(1)} of ${duration.toFixed(1)} seconds`);
  };
  const seek = (t: number): void => {
    time = THREE.MathUtils.clamp(t, 0, duration);
    paceBreak();
    syncBar();
    renderAt(time);
  };
  const ratioAt = (ev: PointerEvent): number => {
    const r = timeline.getBoundingClientRect();
    return THREE.MathUtils.clamp((ev.clientX - r.left) / Math.max(r.width, 1), 0, 1);
  };
  timeline.addEventListener('pointerdown', (ev) => {
    dragging = true;
    resumeAfterDrag = playing;
    playing = false;
    syncPlay();
    try {
      timeline.setPointerCapture(ev.pointerId); // synthetic/ended pointers may not capture
    } catch {
      /* seek anyway */
    }
    seek(ratioAt(ev) * duration);
    ev.preventDefault();
  });
  timeline.addEventListener('pointermove', (ev) => {
    if (dragging) seek(ratioAt(ev) * duration);
  });
  const endDrag = (ev: PointerEvent): void => {
    if (!dragging) return;
    dragging = false;
    playing = resumeAfterDrag && time < duration;
    paceBreak();
    syncPlay();
    try {
      timeline.releasePointerCapture(ev.pointerId);
    } catch {
      /* not captured */
    }
  };
  timeline.addEventListener('pointerup', endDrag);
  timeline.addEventListener('pointercancel', endDrag);
  timeline.addEventListener('keydown', (ev) => {
    const k = ev as KeyboardEvent;
    if (k.key === 'ArrowLeft') seek(time - 0.25);
    else if (k.key === 'ArrowRight') seek(time + 0.25);
    else if (k.key === 'Home') seek(0);
    else if (k.key === 'End') seek(duration);
    else return;
    k.preventDefault();
  });
  const speedBtns: HTMLButtonElement[] = [];
  for (const s of [1, 2, 4]) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'gw-replay-speed';
    b.dataset['speed'] = String(s);
    b.textContent = `${s}×`;
    b.addEventListener('click', () => {
      rate = s;
      paceBreak(); // the ledger's next interval carries the NEW multiplier
      for (const o of speedBtns) o.setAttribute('aria-pressed', String(o === b));
    });
    speedBtns.push(b);
  }
  const exit = document.createElement('a');
  exit.id = 'gw-replay-build';
  exit.href = `?level=${encodeURIComponent(level.id)}`;
  exit.textContent = 'Build your own';
  bar.append(playBtn, timeEl, timeline, ...speedBtns, exit);
  syncPlay();
  syncBar();
  bar.hidden = false;

  // e2e seams (debug surface, not UI): the recorded trace for the node↔
  // browser seek proof, the live rendered state, and the finish shot's cup
  // projected through the replay camera
  const w = window as unknown as Record<string, unknown>;
  w.__gwReplayTrace = () => ({
    dt: trace.dt,
    steps: trace.steps,
    time: trace.time,
    duration: trace.duration,
    status: trace.status,
    hash: trace.hash,
    events: trace.events,
    shots: trace.plan.shots,
    cuts: trace.plan.cuts,
    verified,
    poses: Array.from({ length: trace.steps }, (_, i) => [
      trace.pos[i * 3]!,
      trace.pos[i * 3 + 1]!,
      trace.pos[i * 3 + 2]!,
      trace.quat[i * 4]!,
      trace.quat[i * 4 + 1]!,
      trace.quat[i * 4 + 2]!,
      trace.quat[i * 4 + 3]!,
    ]),
  });
  // the film-star seam (debug surface, not UI): the rig is mounted, the
  // fallback proxy is hidden — the two facts the P4 player-final claim
  // (`the film stars the car the game drives`) is asserted from
  w.__gwReplayCarRig = (): { mounted: boolean; boxVisible: boolean } => ({
    mounted: scene.getObjectByName('car-pose') === carPoseGroup,
    boxVisible: world.carMesh ? world.carMesh.visible : false,
  });
  w.__gwReplayState = () => {
    const k = stepAt(time);
    return {
      t: time,
      step: k,
      pos: [trace.pos[k * 3]!, trace.pos[k * 3 + 1]!, trace.pos[k * 3 + 2]!],
      quat: [trace.quat[k * 4]!, trace.quat[k * 4 + 1]!, trace.quat[k * 4 + 2]!, trace.quat[k * 4 + 3]!],
    };
  };
  // the pacing ledger of the CURRENT contiguous play session (see `pace`)
  w.__gwReplayPace = (): [number, number, number][] => pace.map((p) => [p[0]!, p[1]!, p[2]!]);
  const cup = cupView(payload.build);
  w.__gwReplayCarNdc = (): number[] | null => {
    const k = stepAt(time);
    camera.updateMatrixWorld();
    const v = new THREE.Vector3(trace.pos[k * 3]!, trace.pos[k * 3 + 1]!, trace.pos[k * 3 + 2]!).project(camera);
    return [v.x, v.y];
  };
  w.__gwReplayGoalNdc = (): number[] | null => {
    if (!cup) return null;
    camera.updateMatrixWorld();
    const v = cup.center.clone().project(camera);
    return [v.x, v.y];
  };

  let last = performance.now();
  const frame = (now: number): void => {
    if (boundaryStopped()) return; // T0.4: an uncaught error freezes the loop honestly
    requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, 0.25);
    last = now;
    if (playing && !dragging) {
      time = Math.min(duration, time + dt * rate);
      if (time >= duration) {
        time = duration;
        playing = false;
        // NO paceBreak here: the clamped final frame is never PUSHED, and
        // every continuation that WOULD break interval continuity (Play,
        // seek, speed) clears the ledger itself. The ledger therefore
        // survives as the pure law-honouring record of a session that ran
        // the film out — under CI frame pacing a 4× tail can end the
        // window in 2–3 painted frames and a wipe-before-the-poll could
        // destroy the only evidence the rate law exists (the CI-red feel
        // pass).
        syncPlay();
        playBtn.dataset['phase'] = 'ended';
        phasePush('ended');
      } else {
        pace.push([now, time, rate]);
        if (pace.length > 240) pace.shift();
      }
      syncBar();
      renderAt(time);
    }
  };
  renderAt(0);
  requestAnimationFrame(frame);
}
