/**
 * THE RUN-END TAIL (program H4, Lane F3 — extracted verbatim from the
 * `bootGame` closure in `src/boot.ts`; behavior untouched): the terminal
 * edge of a run. The frame loop still detects the edge (the `lastStatus`
 * flip is the shell's one line), and calls `onRunEnd(w)` HERE: end-hold /
 * death-hold framing, the result model and its verdict row, the tally tail
 * and the named-line mint, the panel, the sound's one finish event, the
 * star write and the ghost-law unlock, the same-hash note, the lineage
 * receipt, the daily chip, and the farewell. The panel DOM itself is
 * `ui/result.ts`'s; this module is the half that DECIDES what the panel
 * says, the save keeps, and the camera does next.
 *
 * Everything here is UI-side and save-side only: no physics is stepped, no
 * body is touched, and the hash never sees any of it (the tally's
 * hash-neutrality gate and `replay:all` guard that claim from the other
 * side). The three `__gw*` seams this file registers (`__gwTally`,
 * `__gwFarewellState`, and the panel wiring's handlers) keep their exact
 * names and semantics for the specs.
 */
import * as THREE from 'three';
import { FIXED_DT } from '../physics/sim.ts';
import type { Build } from '../track/build.ts';
import type { Level } from '../world/level.ts';
import type { World } from '../world/world.ts';
import { parFor, type RunOutcome, type RunResult, type StarCount } from '../world/stars.ts';
import { nextInCampaign } from '../world/campaign.ts';
import { PORCH05_ID, PORCH_SANDBOX_ID } from '../world/levels/porch05.level.ts';
import {
  resultModel,
  tallyLines,
  type LinkVerdict,
  type ResultModel,
  type ResultPanel,
  type RunRecorder,
} from '../ui/result.ts';
import type { Builder } from '../ui/builder.ts';
import {
  actionableKindsFor,
  flippedKindsFor,
  goalNounFor,
  moveHintFor,
  placedKindsFor,
  placedWhereFor,
  stockedKindsFor,
} from '../ui/advice.ts';
import type { PieceKind } from '../track/pieces.ts';
import {
  cupView,
  deriveEvents,
  planShots,
  ReplayDirector,
  REPLAY_FOV,
  REPLAY_TAIL,
  type RunTrace,
} from '../replay/cinematic.ts';
import type { GhostBar } from './ghost.ts';
import { ghostDefaultEnabled, type GhostRace } from './ghost.ts';
import { startFarewell, farewellWanted } from './farewell.ts';
import { encodeShareUrl, parOfRun } from '../share/share.ts';
import type { SharePayload } from '../share/share.ts';
import { beatLineage, cupGoalFromBuild, rememberLink } from '../share/chain.ts';
import { downloadBlob, generateShareCard } from '../share/card.ts';
import { loadSave, recordStars } from '../save/save.ts';
import { tallyCounts, tallyFromTrace } from '../tally/detectors.ts';
import type { TallyTape } from '../tally/tape.ts';
import { accumulateBadges, readNamedLine, readRecords, recordNamedLine } from '../save/records.ts';
import { dailyChipLine, readDaily, recordDailyBest, utcDateKey } from '../save/daily.ts';
import type { LinkRace } from './ghostLinks.ts';
import type { SoundEngine } from '../sound/sound.ts';
import type { BuildCamera } from '../camera/build-camera.ts';
import { frameDeathHold } from '../camera/build-camera.ts';
import { frameCamera } from '../camera/framing.ts';
import type { RunCameraSolid } from '../camera/run-camera.ts';

/** Everything the tail needs from the shell: the panel, the tapes, the
 *  rail, and the four live lets the frame loop also reads/writes (`acc`,
 *  `hazardsTouched`, `runCamActive`, `endHold`, `farewellHolds`,
 *  `parLocked`, `ghostOn`) through named accessors — ONE source of truth
 *  per counter, exactly the closure's own law. */
export interface RunEndContext {
  root: HTMLElement;
  stage: HTMLElement;
  level: Level;
  params: URLSearchParams;
  camera: THREE.PerspectiveCamera;
  carPoseGroup: THREE.Group;
  buildView: BuildCamera;
  camSolids: readonly RunCameraSolid[];
  framingSetCenter: { x: number; y: number; z: number } | null;
  builder: Builder;
  resultPanel: ResultPanel;
  recorder: RunRecorder;
  tallyTape: TallyTape;
  followTape: { pos: number[]; quat: number[] };
  ghost: GhostRace;
  ghostBar: GhostBar;
  links: LinkRace;
  sound: SoundEngine;
  hashNote: HTMLElement;
  tray: Partial<Record<PieceKind, number>> | undefined;
  isSandbox: boolean;
  devPreview: boolean;
  daily: { seed: number; now: Date } | null;
  dailySeedValue: number | null;
  reduceMotion: boolean;
  world: () => World | null;
  currentBuild: () => Build;
  framingFocus: () => THREE.Vector3 | null;
  hazardsTouched: () => number;
  setHazardsTouched: (n: number) => void;
  setAcc: (n: number) => void;
  setRunCamActive: (on: boolean) => void;
  setEndHold: (v: { x: number; y: number; z: number } | null) => void;
  setFarewellHolds: (on: boolean) => void;
  parLocked: () => boolean;
  setParLocked: (locked: boolean) => void;
  ghostOn: () => boolean;
  setGhostOn: (on: boolean) => void;
}

export interface RunEnd {
  /** The terminal edge of a player-launched run (the frame loop's call). */
  onRunEnd(w: World): void;
  /** Advance the sandbox run-cam under the panel (frame-loop call, per
   *  frame; a no-op while no film is mounted or the panel is away). */
  stepFilm(w: World, dt: number): void;
  /** Lift the film (launch/Retry/dismiss — the panel's own doors). */
  clearFilm(): void;
  /** The live sandbox film (the `__gwTally` seam reads its existence). */
  readonly filmMounted: boolean;
  /** Star-gated progression (§9.2): `Next level` appears only when the
   *  level HAS a star to its name. */
  gateNext(stars: number): void;
  /** Car home to the release pose, the build untouched, the view back on
   *  the board, the panel away. */
  resetCar(): void;
  /** The overlay dismissal both doors share (Escape / place-intent). */
  dismissOverlay(): void;
}

export function createRunEnd(ctx: RunEndContext): RunEnd {
  const {
    root, stage, level, params, camera, carPoseGroup, buildView, camSolids,
    framingSetCenter, builder, resultPanel, recorder, tallyTape, followTape,
    ghost, ghostBar, links, sound, hashNote, tray, isSandbox, devPreview,
    daily, dailySeedValue, reduceMotion,
  } = ctx;

  // the terminal state of the LAST finished run, for the honest same-hash
  // line: equal hashes on DIFFERENT builds mean the added piece never
  // entered the hashed body set (statics off the path do not perturb it)
  let lastRun: { hash: string; pieces: number } | null = null;
  let lastShare: { url: string; time: number; stars: StarCount } | null = null;
  let lastOutcome: { hash: string; time: number; stars: StarCount; finished: boolean } | null = null;
  /** The link the LAST run beat (Lane C's lineage source; recomputed at
   *  every terminal edge, null when nothing was raced-and-beaten). */
  let beatLink: SharePayload['lineage'] | null = null;
  // the sandbox run-cam: the finished run's own recorded states through
  // the share page's three-shot director (null = no film)
  let lineCam: { trace: RunTrace; director: ReplayDirector; at: number } | null = null;

  /** THE "NAME THIS LINE" CHIP (Lane B's re-anchor): shown on a finished
   *  sandbox run that captured IN THE PLAYER'S OWN CUP and has no name
   *  yet. One FIELD, one commit — and the commit re-prints the panel's
   *  third tally line and arms the record ghost for the NEXT attempt. A
   *  named line never re-mints under this chip: the name is the line (the
   *  record's beat path is `recordNamedLine` at the next finish).
   *
   *  THE FIELD, NOT THE VERB-BUTTON (final-sheet probe item (g) — the
   *  chrome trap #9: a lone lowercase `save` button on the result panel
   *  collided with the Save dropdown's `Save`, and one probe click meant
   *  for the name opened the settings instead — two controls, one name,
   *  one page). The studio names a control by its noun, so the row IS a
   *  field: `name this line` is the input's LABEL (a real `<label for>`,
   *  the field speaks its noun) and the commit button says `name it` —
   *  no second `save` on the page, and the ids ride untouched
   *  (`#gw-result-name-save` is a test surface, not copy). Proven by
   *  `tests/e2e/labels.spec.ts` (the row's controls name-unique, its
   *  rects disjoint with the Save dropdown's). */
  let nameRow: HTMLElement | null = null;
  function hideNameChip(): void {
    nameRow?.remove();
    nameRow = null;
  }
  function mountNameChip(key: string, time: number, build: Build, model: ResultModel): void {
    hideNameChip();
    const row = document.createElement('div');
    row.id = 'gw-result-name';
    const chip = document.createElement('label');
    chip.id = 'gw-result-name-chip';
    chip.htmlFor = 'gw-result-name-input';
    chip.textContent = 'name this line';
    const input = document.createElement('input');
    input.id = 'gw-result-name-input';
    input.type = 'text';
    input.maxLength = 48;
    input.placeholder = 'the spillway';
    input.setAttribute('aria-label', 'Name for this line (your cup, your record)');
    const saveBtn = document.createElement('button');
    saveBtn.id = 'gw-result-name-save';
    saveBtn.type = 'button';
    saveBtn.textContent = 'name it';
    row.append(chip, input, saveBtn);
    resultPanel.element.appendChild(row);
    nameRow = row;
    const commit = (): void => {
      const name = input.value.trim();
      if (name.length === 0) {
        input.focus();
        return;
      }
      const res = recordNamedLine(key, name, time, build);
      const lines = [...(model.tally ?? []).slice(0, 2), `named “${res.line.name}” — personal best ${res.line.best.toFixed(2)} s · your own runs on this device only`];
      model.tally = lines.slice(0, 3);
      resultPanel.show(model);
      mountNameChipExisting(res.line.name); // the named form: no re-mint chip
    };
    saveBtn.addEventListener('click', commit);
    input.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter') commit();
    });
  }
  /** After a mint the chip retires to a named label (the row keeps its
   *  place, the input goes — the line has a name now). */
  function mountNameChipExisting(name: string): void {
    const row = nameRow;
    if (!row) return;
    row.replaceChildren();
    const chip = document.createElement('span');
    chip.id = 'gw-result-name-chip';
    chip.textContent = `line “${name}”`;
    row.appendChild(chip);
  }

  /** Assemble the sandbox run's cinematic trace from the tapes: the SAME
   *  `RunTrace` shape the share page renders — car states and follow-cam
   *  poses the sim itself produced at `FIXED_DT`, beats from
   *  `deriveEvents`, shots from `planShots`. No physics is stepped here;
   *  playback later READS these lists only (the seek law). */
  function makeRunCam(w: World | null): { trace: RunTrace; director: ReplayDirector; at: number } | null {
    const tape = tallyTape.read();
    if (!w || tape.length === 0) return null;
    if (followTape.pos.length !== tape.length * 3) return null; // no rail, no film
    const n = tape.length;
    const pos = new Float64Array(n * 3);
    const quat = new Float64Array(n * 4);
    const speed = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = tape[i]!.pos[0];
      pos[i * 3 + 1] = tape[i]!.pos[1];
      pos[i * 3 + 2] = tape[i]!.pos[2];
      quat[i * 4] = tape[i]!.quat[0];
      quat[i * 4 + 1] = tape[i]!.quat[1];
      quat[i * 4 + 2] = tape[i]!.quat[2];
      quat[i * 4 + 3] = tape[i]!.quat[3];
      speed[i] = tape[i]!.speed;
    }
    const events = deriveEvents(tape, w.status);
    const time = tape[n - 1]!.t;
    const trace: RunTrace = {
      dt: FIXED_DT,
      steps: n,
      time,
      duration: time + REPLAY_TAIL,
      status: w.status,
      hash: w.hashHex(),
      pos,
      quat,
      speed,
      arc: new Float64Array(n),
      followPos: Float64Array.from(followTape.pos),
      followQuat: Float64Array.from(followTape.quat),
      events,
      plan: planShots(time, events),
    };
    const box = new THREE.Box3();
    for (let i = 0; i < n; i++) box.expandByPoint(new THREE.Vector3(pos[i * 3]!, pos[i * 3 + 1]!, pos[i * 3 + 2]!));
    box.expandByScalar(0.3);
    const director = new ReplayDirector({
      trace,
      box,
      cup: cupView(ctx.currentBuild()),
      fov: REPLAY_FOV,
      aspect: camera.aspect,
      reducedMotion: false,
    });
    return { trace, director, at: 0 };
  }

  /** THE NEXT-RUNG GATE (§9.2, playtest E/F/G): `Next level` appears only
   *  when the level HAS a star to its name — this run's OR the save's
   *  already-earned best (close-review F5: `levelUnlock` reads the saved
   *  best, so the gate must too). The ladder walk stays the shell's
   *  (`nextLevelId`). */
  const nextId = nextInCampaign(level.id);
  function gateNext(stars: number): void {
    const show = nextId !== null && stars >= 1;
    resultPanel.next.hidden = !show;
    resultPanel.next.style.display = show ? '' : 'none';
  }

  /** Car home to the release pose, the build untouched, the view back on
   *  the board, the panel away — the missing "bring it back" control. The
   *  view RESETS too (playtest Q's orbit): if the player had turned the
   *  table away, Retry brings the framing home, damped. */
  function resetCar(): void {
    const w = ctx.world();
    if (!w) return;
    w.reset();
    sound.stopRun(); // a walked-home car is not running; close the roll
    ctx.setAcc(0);
    ctx.setHazardsTouched(0);
    ctx.setRunCamActive(false);
    ctx.setEndHold(null);
    buildView.reset();
    ghost.park(); // the raced ghost returns to the unpainted grid with the car
    lineCam = null; // Retry is a new attempt, not a film
    if (w.scene) frameCamera(camera, w.scene, ctx.framingFocus(), null, buildView, framingSetCenter);
    resultPanel.hide();
  }

  /** The overlay dismissal both doors share: Escape (below) and a PLACE
   *  INTENT while the panel is up (playtest BB item 2). The panel away,
   *  the framing walked home — the BUILD VIEW is what the placement (or
   *  the refusal line) plays out in. The car is left where it fell;
   *  Retry stays the button that moves it. */
  function dismissOverlay(): void {
    if (resultPanel.element.hidden) return;
    resultPanel.hide();
    hideNameChip(); // a dismissed verdict never keeps the mint chip waiting
    lineCam = null; // the film belongs to the panel, not to the board
    ctx.setRunCamActive(false);
    ctx.setEndHold(null); // the damping tick must not re-solve the death hold
    buildView.reset();
    const world = ctx.world();
    if (world?.scene) frameCamera(camera, world.scene, ctx.framingFocus(), null, buildView, framingSetCenter);
  }

  // ---- panel wiring (the buttons the extraction left at the exit) --------
  // The progression loop closed on the buttons (§9.1 retry, ladder next):
  // Retry = as-built, one click back to Launch; Next = the following rung,
  // only when this level HAS one. (The PERMANENT Retry beside Launch stays
  // the builder's own wiring in the shell — one verb, one `resetCar`.)
  resultPanel.retry.addEventListener('click', () => resetCar());
  if (nextId) {
    resultPanel.next.addEventListener('click', () => {
      const p = new URLSearchParams(window.location.search);
      p.set('level', nextId);
      // ONE-USE rig params: `launch`/`build` describe THIS rung's boot (a test
      // hook / dev preview), not the campaign walk. Carried forward they
      // auto-launched the NEXT rung's par build on arrival — invisible on a
      // quiet machine where `ready` won the race, a CI red where the sim got
      // there first (campaign.spec "the campaign OPENS", twice).
      p.delete('launch');
      p.delete('build');
      window.location.search = p.toString(); // a search swap is a page boot
    });
  }

  // ---- SHARE (playtest AA item 1: "no share button exists anywhere… I'd
  // send replays to a friend if the game would hand me a link") ----------
  // The whole `#s=` machinery already existed (`src/share/share.ts`, the
  // shared-run page, the card) with ONE missing surface: the panel never
  // offered it. `lastOutcome` is the run the panel is ABOUT — captured at
  // the terminal edge below, hash and all; `lastShare` is the link once a
  // press has made one. `currentBuild` cannot have moved under the panel:
  // any edit hides the panel (onChange), so the build, seed and hash the
  // link encodes are the run the player just watched.
  resultPanel.share.addEventListener('click', () => {
    if (!lastOutcome) return;
    const outcome = lastOutcome;
    const currentBuild = ctx.currentBuild();
    // PAYLOAD v2 (Decision Log 2026-10-12, THE CHAIN): mandatory-on-write-
    // new — every link minted from here is a v2 envelope. The NAME is the
    // line's (the sandbox named line wins, the board's registry name is
    // the honest fallback); the PAR is the AUTHOR'S MEASURED RUN through
    // the gen-pars rule (`parOfRun` — the same ceil-to-0.05 law
    // `scripts/gen-pars.mjs` states, applied to this run, not a page
    // constant); the GOAL is the placed cup's transform read the guard's
    // way (last player cup, fixtures excluded) — presentation geometry
    // only, the verdict's cup comes from BUILD; and LINEAGE rides when
    // this very run beat a link.
    const payload: SharePayload = {
      v: 2,
      levelId: level.id,
      seed: currentBuild.seed,
      hash: outcome.hash,
      build: currentBuild,
      name:
        (() => {
          const key = links.lineGhostKey();
          const named = key !== null ? readNamedLine(key) : undefined;
          return (named?.name ?? level.name).slice(0, 48);
        })(),
    };
    if (outcome.finished) payload.par = parOfRun(outcome.time);
    const goal = cupGoalFromBuild(currentBuild, (level as unknown as { fixtures?: Record<string, number> }).fixtures ?? {});
    if (goal !== null) payload.goal = goal;
    if (beatLink !== null) payload.lineage = beatLink;
    resultPanel.shareNote.hidden = false;
    resultPanel.shareNote.textContent = 'making link…';
    void encodeShareUrl(payload).then(
      (frag) => {
        const url = `${window.location.origin}${window.location.pathname}${frag}`;
        lastShare = { url, time: outcome.time, stars: outcome.stars };
        // THE CHAIN WALK: a link this device published is a link it
        // walked — the payload enters the store the LINES tab reads.
        rememberLink(payload);
        // the VISIBLE LINK is the fallback that never fails: clipboard
        // permission can be denied (headless, permissions policy, http),
        // a select-and-copy on a real input cannot
        resultPanel.shareUrl.value = url;
        resultPanel.shareRow.hidden = false;
        resultPanel.shareCard.hidden = false;
        return navigator.clipboard
          ?.writeText(url)
          .then(() => {
            resultPanel.shareNote.textContent = 'link copied';
          })
          .catch(() => {
            resultPanel.shareNote.textContent = 'copy the link below';
          });
      },
      () => {
        resultPanel.shareNote.textContent = 'this browser could not build the link';
      },
    );
  });
  // the card PNG "if cheap" — it was already wired for the SHARED page
  // (`wireShareCard`); one reused call here, the card carrying the URL the
  // share press just made
  resultPanel.shareCard.addEventListener('click', () => {
    const s = lastShare;
    if (!s) return;
    resultPanel.shareNote.textContent = 'rendering card…';
    void generateShareCard({
      levelId: level.id,
      build: ctx.currentBuild(),
      time: s.time,
      stars: s.stars,
      url: s.url,
    })
      .then((blob) => {
        downloadBlob(blob, `gravity-works-${level.id}.png`);
        resultPanel.shareNote.textContent = 'card downloaded';
      })
      .catch(() => {
        resultPanel.shareNote.textContent = 'card failed on this browser';
      });
  });

  // ESC CLOSES THE OVERLAY FIRST (playtest AA item 3: "Home did nothing
  // with the failure overlay up — camera stayed parked in a far failure
  // vista"). The overlay is the thing between the player and the Home
  // chord, so the FIRST Escape dismisses it and walks the framing home —
  // build view, home pose, car left where it fell (Retry is still the
  // button that moves the car). CAPTURE-phase stopPropagation hides the
  // press from the camera's double-Escape pair entirely, so the SECOND
  // Escape is a lone first half of the chord: it arms nothing the player
  // did not ask for, and a vista that is already home stays home.
  window.addEventListener(
    'keydown',
    (ev) => {
      if (ev.key !== 'Escape' || resultPanel.element.hidden) return;
      ev.preventDefault();
      ev.stopPropagation(); // capture: the camera's Escape chord never sees this press
      dismissOverlay();
    },
    { capture: true },
  );

  // the e2e seam for the tally law (debug surface, not UI, the
  // `__gwGhostState` idiom): what the tape granted, what the save holds,
  // whether the sandbox film is mounted.
  (window as unknown as Record<string, unknown>).__gwTally = () => ({
    events: tallyFromTrace(tallyTape.read()),
    records: readRecords(loadSave()).badges ?? {},
    lineKey: links.lineGhostKey(),
    film: lineCam !== null,
  });

  /** THE TERMINAL EDGE (the frame loop's one call): stars, time, pieces,
   *  and the one-line note (§9.1) — the whole tail, verbatim from the
   *  frame loop it was lifted out of. */
  function onRunEnd(w: World): void {
    // the run just ended: stars, time, pieces, and the one-line note (§9.1)
    // — and the follow camera HANDS THE VIEW BACK (§7.3): the static
    // track framing at the end beat the rail freeze-frame every time
    // ("camera buried inside the floor" — playtest B — was the run
    // camera's last pose, kept forever)
    ctx.setRunCamActive(false);
    // the END-HOLD framing: the static table framing re-solved with the
    // car's FINAL world position as part of the subject (frameCamera),
    // so the wide end-of-run shot keeps car and cup in one frame under
    // the verdict panel — never a chase cut-out that hides the death
    // spot the player most needs to read (playtest M/N item 7).
    //
    // FAILURE takes the WIDE DEATH-HOLD (playtest R round3: "buried in
    // a peach wall on fail — never saw the marble fall"): on fell /
    // stalled / timed-out the framing biases toward the car's LAST
    // SEEABLE point, not the cup side, widens past the table solve, and
    // clears the eye over the set solids the way the run camera does —
    // a wall-bury frame of a death the player must read is not a legal
    // end pose. Success keeps the cup-biased framing (it frames well,
    // R's own words). `endHold` keeps the witness live for the damping
    // tick below, so a settling view re-solves the SAME cleared pose
    // instead of overwriting the eye lift with the raw table framing.
    if (w.status === 'finished') {
      ctx.setEndHold(null);
      frameCamera(camera, w.scene, ctx.framingFocus(), w.carPose(0).pos, buildView);
    } else {
      const death = { ...w.carPose(0).pos };
      ctx.setEndHold(death);
      frameDeathHold(camera, w.scene, {
        death,
        solids: camSolids,
        view: buildView,
      });
    }
    // the frame loop has ALREADY decided this is a terminal edge (its own
    // `w.status !== 'running' && w.status !== 'idle'` guard narrowed the
    // getter; the narrowing does not cross the extraction boundary, so the
    // terminal status is stated here — the same fact, read once).
    const result: RunResult = {
      status: w.status as RunOutcome,
      time: w.time,
      piecesUsed: builder.playerCount(),
      hazardsTouched: ctx.hazardsTouched(),
    };
    const currentBuild = ctx.currentBuild();
    // Replay honesty (playtest J): the star the save ALREADY held before
    // this run decides whether the par lines aim or verdict — read HERE,
    // before recordStars below writes this run's best, so a re-run in the
    // same session counts as one (see outcomeLines in src/ui/result.ts).
    const bestStarsBefore = loadSave().progress.stars[level.id] ?? 0;
    // ACTIONABLE KINDS for the note's advice tails (playtest Q item 5:
    // "flatten the landing" with no landing in the tray) — see
    // `actionableKindsFor` — plus the PLACED kinds that PHRASE the tails
    // (round-5 playtest W: a tray-only kind must be told to ADD, not to
    // fix a piece the build never had) — see `placedKindsFor` — plus the
    // STOCK-LEFT kinds that carry the drive-off tail (stage-5 B2 pass 2,
    // playtest AA: six builds, one undifferentiated note) — see
    // `stockedKindsFor`. UI-side only; physics and the hash never see
    // any of the sets.
    const model = resultModel(
      result,
      parFor(level.id, level.par),
      recorder.evidence(),
      bestStarsBefore,
      actionableKindsFor(currentBuild, tray),
      placedKindsFor(currentBuild),
      goalNounFor(level),
      stockedKindsFor(currentBuild, tray),
      flippedKindsFor(level, currentBuild),
      // THE WHERE of the drive-off tail: the end the next piece extends the
      // line from, read off the builder's socket graph (stage 6, kitchen03).
      // null with no builder (a shared/replay page) keeps the shipped line.
      builder.aimHint(),
      // THE MOVE clause (program T2.1): the build graph's reading of a
      // spent tray — a piece stranded past the goal, or a booster not
      // spent at the head of the line (`moveHintFor`, `src/ui/advice.ts`;
      // pure data like every gate above — the physics and the hash never
      // see it).
      moveHintFor(level, currentBuild, tray),
      // THE CRITIQUE WHERE (P4 item 4, the bedroom02 truth): the nose-first
      // critique halves name the SITE of the placed piece in the Remove
      // button's own join-graph words (`placedWhereFor`, `src/ui/advice.ts`;
      // pure data like every gate above).
      placedWhereFor(level, currentBuild),
      // THE CHAIN'S VERDICT ROW (Lane C): the link that was on the grid
      // as this run raced it — the verdict reads the LINK's par, and a
      // link from another board gets the honest refusal, never a
      // `you vs par` for the wrong game (the re-probe's #5). UI-side
      // only: the physics and the hash never see a payload.
      (() => {
        // The verdict follows the LINK that was accepted for this race
        // (`racedLink` — set when a payload/house line mounted, cleared
        // only by a refusal), not the rail's momentary visibility: a
        // link's track is the board being raced whether or not its car
        // painted this run's grid.
        const raced = links.racedLink;
        if (raced) {
          if (raced.levelId !== level.id)
            return { kind: 'foreign', levelId: raced.levelId } satisfies LinkVerdict;
          return {
            kind: 'same',
            ...(raced.name !== undefined ? { name: raced.name } : {}),
            ...(raced.par !== undefined ? { par: raced.par } : {}),
            theirTime: raced.time,
          } satisfies LinkVerdict;
        }
        if (links.foreignBoard !== null)
          return { kind: 'foreign', levelId: links.foreignBoard } satisfies LinkVerdict;
        return null;
      })(),
    );
    // THE TALLY TAIL (freeplay Lane B): the sheet physics signed this
    // run, derived from the tape OUTSIDE the step loop at the terminal
    // edge; the badge counts land in the save's personal records and
    // the FIRSTS are read before that write (retroactive-forward: a
    // badge the device never saw says so once). On a sandbox, a finish
    // inside the PLAYER'S OWN cup re-anchors the named line: an
    // existing name beats its record; a nameless line gets the
    // "name this line" chip. UI-side and save-side only — the physics
    // and the hash never see any of it (hash-neutrality unit gate).
    const tallyEvents = tallyFromTrace(tallyTape.read());
    const firstBadges = accumulateBadges(tallyCounts(tallyEvents));
    let tallyLine: { name: string; best: number; fresh: boolean } | null = null;
    let mintKey: string | null = null;
    if (isSandbox && result.status === 'finished' && !devPreview) {
      mintKey = links.lineKey(currentBuild);
      if (mintKey) {
        const known = readNamedLine(mintKey);
        if (known) {
          const res = recordNamedLine(mintKey, known.name, result.time, currentBuild);
          tallyLine = { name: res.line.name, best: res.line.best, fresh: res.outcome === 'beat' };
        }
      }
    }
    // THE FACE (final-sheet probe item (e)): on a SANDBOX page the tail
    // also carries the sheet's lifetime numbers (see `tallyLines` — the
    // read happens AFTER `accumulateBadges`, so the numbers include this
    // run). Campaign bars pass `null` and print the shipped tail
    // byte-identical; the full ledger face is the LINES tab footline.
    model.tally = tallyLines(
      tallyEvents,
      firstBadges,
      tallyLine,
      isSandbox ? (readRecords(loadSave()).badges ?? null) : null,
    );
    if (mintKey && !readNamedLine(mintKey)) mountNameChip(mintKey, result.time, currentBuild, model);
    else hideNameChip();
    // THE FAREWELL (program T3.3): the FIRST time the house's last word
    // is cleared, the result bar is REPLACED by one crane pass over the
    // whole house and three doors (`src/pages/farewell.ts`). The gate is
    // the mint's own: a finished run on porch05, not a dev preview (a
    // preview mints no star, so it mints no ending either — the badge's
    // law), and the URL-affordance family's `farewellWanted` decides
    // against the once-per-save flag. Everything else at this edge —
    // the stars, the sound, the hash note, the daily chip — runs
    // exactly as it does behind a panel; ONLY the panel is replaced.
    const farewellRun =
      result.status === 'finished' &&
      level.id === PORCH05_ID &&
      !devPreview &&
      farewellWanted(params);
    // THE SANDBOX RUN-CAM (Lane B): the share page's cinematic mounts
    // where the toy actually lives — the finished sandbox run replays
    // its own recorded states through the three-shot director while
    // the panel rides. Reduced motion keeps the static end-hold (the
    // motion law, not a setting); the farewell owns its own crane.
    lineCam =
      isSandbox && result.status === 'finished' && !reduceMotion && !farewellRun
        ? makeRunCam(w)
        : null;
    if (!farewellRun) resultPanel.show(model);
    // the run's OUTCOME is an audio event exactly once per run: the
    // engine hears the same fields the panel prints (status, stars,
    // new-best, hazard tally) and nothing else
    sound.finishRun({
      status: result.status,
      stars: model.stars,
      newBest: model.stars > bestStarsBefore,
      hazardsTouched: result.hazardsTouched,
    });
    // §9.2 progress persists: a finished run's stars are the save's best
    // for this level (a failure records nothing); this is what opens the
    // next rung on the level select, exactly what `gateNext` just offered
    // — EXCEPT on a dev preview (BB item 5): a locked rung addressed by
    // `?level=` mints no unlock, so the badge's promise is a property of
    // the code path, not of copy. The gate reports 0 there, keeping the
    // panel's Next honest with the "unlocks nothing" claim.
    if (!devPreview) recordStars(level.id, model.stars);
    // THE GHOST LAW UNLOCKS AT THE FIRST FINISH (round 2): the rung's
    // par line goes from the calm locked word back to the plain toggle,
    // remembered ON from here on (the reduced-motion law still decides;
    // an explicit OFF the player left stays OFF). A dev-preview finish
    // mints no star, so it mints no unlock either — the mint's own law.
    if (ctx.parLocked() && !devPreview && result.status === 'finished') {
      ctx.setParLocked(false);
      ghostBar.setParLock(false);
      const ghostOn = loadSave().settings.ghosts?.par ?? ghostDefaultEnabled(reduceMotion);
      ctx.setGhostOn(ghostOn);
      ghostBar.toggle.setAttribute('aria-pressed', String(ghostOn));
      ghost.setEnabled(ghostOn);
      if (ghostOn) {
        links.armParGhost();
        links.ensureParGhost(); // wind now: the NEXT launch races the line it earned
      }
    }
    gateNext(devPreview ? 0 : Math.max(model.stars, bestStarsBefore));
    const h = w.hashHex();
    if (lastRun && lastRun.hash === h && lastRun.pieces !== result.piecesUsed) {
      hashNote.textContent = 'same run — your extra piece never touched the road';
      hashNote.hidden = false;
    } else {
      hashNote.hidden = true;
    }
    lastRun = { hash: h, pieces: result.piecesUsed };
    // the SHARE payload's run (see the share wiring): the hash, time and
    // stars of the run the panel is about, frozen at its terminal edge
    lastOutcome = { hash: h, time: result.time, stars: model.stars, finished: result.status === 'finished' };
    // THE LINEAGE of a beat (Lane C): a finished run strictly ahead of
    // the LINK ghost on the grid beat that link — the claim lands on
    // the NEXT share's payload (`lineage`), computed from the two
    // finish times the shell already holds (the ghost's trace time is
    // its own build's re-simulated finish, checkable from the link's
    // bytes). A house line carries no payload hash, so nothing enters
    // the chain for it here — the CHAIN is payloads.
    //
    // THE RUN ENDS IN FRIEND MODE WHEN A HASHED LINK WAS ACCEPTED (the
    // final probe, item (a): the receipt was thrown away): the mode the
    // lineage reads is the ACCEPTANCE, not the rail's current visual
    // state. An edit that lifts their car off the grid ("your edits
    // replaced their track") or a par-toggle never un-races the link —
    // the beat claim this mint prints is the SAME fact the verdict row
    // already prints from `racedLink`, and a fact phrased twice must
    // read from one place. The flag IS `racedLink` with a hash: set on
    // accept, cleared only when another link replaces it or refuses.
    const racedLink = links.racedLink;
    beatLink = beatLineage({
      finished: result.status === 'finished',
      myTime: result.time,
      ghostMode: racedLink !== null && racedLink.hash !== null ? 'friend' : 'other',
      ghostTime: racedLink?.time ?? 0,
      link:
        racedLink !== null && racedLink.hash !== null
          ? { levelId: racedLink.levelId, hash: racedLink.hash, ...(racedLink.name !== undefined ? { name: racedLink.name } : {}) }
          : null,
    });
    // THE DAILY CHIP (T3.4, round 2: the board's NAME leads it): on a
    // daily-seeded page the result screen carries today's line — a
    // FINISHED run records into it, a failure just reads it. The
    // single-machine clause rides INSIDE the sentence (`dailyChipLine`),
    // never a footnote, and nothing here touches the save envelope or a
    // shipped hash.
    if (dailySeedValue !== null) {
      const today = utcDateKey(daily?.now);
      if (result.status === 'finished') {
        const rec = recordDailyBest(result.time, daily?.now ?? new Date());
        resultPanel.daily.textContent = rec
          ? dailyChipLine(rec, today, level.name)
          : `today’s board ${level.name} — race today — this browser refused to keep the record`;
      } else {
        const prev = readDaily();
        resultPanel.daily.textContent = prev
          ? dailyChipLine(prev, today, level.name)
          : `today’s board ${level.name} — race today — not yet today · your own runs on this device only`;
      }
      resultPanel.daily.hidden = false;
    }
    if (farewellRun) {
      // the crane opens AFTER `recordStars` above, so the tally it
      // carries includes this run's own mint; the film door encodes the
      // run the edge just froze (build, seed, hash — the same bytes the
      // share button would have made from this panel).
      ctx.setFarewellHolds(true);
      const fparams = new URLSearchParams(window.location.search);
      fparams.delete('launch'); // one-use rig params, the Next rule
      fparams.delete('build');
      fparams.delete('farewell');
      fparams.delete('level'); // door 2 is TODAY'S board, not the rung we came from
      fparams.set('daily', '1');
      const farewellPage = startFarewell(root, stage, {
        reducedMotion: reduceMotion,
        stars: loadSave().progress.stars,
        sandboxUrl: `?level=${PORCH_SANDBOX_ID}`,
        dailyUrl: `?${fparams.toString()}`,
        run: { levelId: level.id, seed: currentBuild.seed, hash: h, build: currentBuild },
      });
      // the e2e seam for the farewell law (debug surface, not UI): the
      // live phase / plan clock / reveal count of the crane page
      (window as unknown as Record<string, unknown>).__gwFarewellState = () =>
        farewellPage.state();
    }
  }

  /** THE SANDBOX RUN-CAM PLAYBACK (freeplay Lane B): while the result
   *  panel is up on a sandbox finish, the camera is the share page's
   *  `ReplayDirector` and the car rides the RECORDED state of step
   *  `floor(t/dt)` — the seek law, states the sim itself produced, no
   *  physics stepped on this path; the film loops quietly under the
   *  panel until the player edits, retries, or dismisses. */
  function stepFilm(w: World, dt: number): void {
    if (lineCam && !resultPanel.element.hidden) {
      lineCam.at += dt;
      if (lineCam.at > lineCam.trace.duration) lineCam.at = 0;
      const filmT = Math.min(lineCam.at, lineCam.trace.time);
      lineCam.director.poseAt(filmT);
      camera.position.copy(lineCam.director.position);
      camera.quaternion.copy(lineCam.director.quaternion);
      const filmStep = Math.min(
        lineCam.trace.steps - 1,
        Math.max(0, Math.floor(filmT / lineCam.trace.dt + 1e-6)),
      );
      const fp = lineCam.trace.pos;
      const fq = lineCam.trace.quat;
      const fx = fp[filmStep * 3]!;
      const fy = fp[filmStep * 3 + 1]!;
      const fz = fp[filmStep * 3 + 2]!;
      const qx = fq[filmStep * 4]!;
      const qy = fq[filmStep * 4 + 1]!;
      const qz = fq[filmStep * 4 + 2]!;
      const qw = fq[filmStep * 4 + 3]!;
      if (w.carMesh) {
        w.carMesh.position.set(fx, fy, fz);
        w.carMesh.quaternion.set(qx, qy, qz, qw);
      }
      carPoseGroup.position.set(fx, fy, fz);
      carPoseGroup.quaternion.set(qx, qy, qz, qw);
    }
  }

  return {
    onRunEnd,
    stepFilm,
    clearFilm: () => {
      lineCam = null;
    },
    get filmMounted() {
      return lineCam !== null;
    },
    gateNext,
    resetCar,
    dismissOverlay,
  };
}
