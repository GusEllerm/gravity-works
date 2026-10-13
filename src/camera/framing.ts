/**
 * THE SHELL'S CAMERA FRAMING (program H4, Lane F3 — moved verbatim from the
 * foot of `src/boot.ts`): the static TABLE framing every non-run view owns
 * (and the end-hold/death-hold subject rule the run-end tail asks of it),
 * the build-table GAZE probe the post-focus law reads, and the aria-live
 * run-status line. Pure geometry over the scene the shell hands it —
 * nothing here steps physics or moves a hash.
 */
import * as THREE from 'three';
import type { World } from '../world/world.ts';
import type { BuildCamera } from './build-camera.ts';

/**
 * The static TABLE framing. Since program T1.2 the LOOK-AT is framed on the
 * SET — the mounted room's floor-bounds centre (Art Bible §Camera: “Build
 * camera: orbital, framed on the set, never free-fly”) — while the EYE
 * DISTANCE stays solved from the BUILD's span exactly as before (car size on
 * screen unchanged; the aim/pan proofs keep their scale). The player
 * evaluation's t+0 finding named the failure of the old rule: centring the
 * look-at on the TRACK's bbox with the set mounted 0.45 m off the run axis
 * marched the counter's rim and the grey background across the frame — “the
 * kitchen reads as a tan disc with grey corner wedges — closer to a broken
 * texture than to a monumental breakfast table”. Framed on the SET the disc
 * is larger than the frame at this distance (the canonical establishing
 * reads it as endless for the same reason), the rim never crosses the shot,
 * and the room fills it. The scene-wide box is STILL never the subject (the
 * 6 m ground plane re-centring the old cream-void finding); when no set is
 * mounted the track-centre rule stands untouched, and every end-hold framing
 * (`extra`) keeps the track/death-site subject — a death, not a room, is the
 * story of a failed run.
 */
export function frameCamera(
  camera: THREE.PerspectiveCamera,
  scene: THREE.Scene | null,
  focus: THREE.Vector3 | null = null,
  extra: { x: number; y: number; z: number } | null = null,
  view: BuildCamera | null = null,
  setCenter: { x: number; y: number; z: number } | null = null,
): void {
  const track = scene?.getObjectByName('track');
  const box = track ? new THREE.Box3().setFromObject(track) : new THREE.Box3();
  if (extra) {
    // the END-HOLD pass boxes the run's LAST SEEABLE POINT (where the car
    // came to rest — a fallen car settles off the track's box, below a
    // ledge or past a gap) as part of the subject, so the verdict panel
    // never lands over an off-frame death spot (playtest M: "the result
    // panel hides where the car died"). The point is CLAMPED into the
    // track's neighbourhood — a wild coordinate (a car flung off-world)
    // may not inflate the table framing into the same cream void the
    // scene-wide box used to produce.
    framingScratch.set(extra.x, extra.y, extra.z);
    box.expandByScalar(0.6).clampPoint(framingScratch, framingScratch);
    box.expandByPoint(framingScratch);
  }
  const center = box.isEmpty() ? new THREE.Vector3() : box.getCenter(new THREE.Vector3());
  const span = box.isEmpty() ? 0.5 : Math.max(...box.getSize(new THREE.Vector3()).toArray());
  // FRAMED ON THE SET (program T1.2, header): the static look-at centres on
  // the mounted room's floor-bounds centre — a circle at the set group's
  // origin on all six sets (`SetInstance.bounds`), so the group position IS
  // the centre; the eye keeps the ratified stills' band (see the distance
  // law below). Only the plain static framing takes the room as subject;
  // end-hold passes (`extra`) keep the track/death subject law.
  let setFramed = false
  if (setCenter && !box.isEmpty() && !extra) {
    // the TARGET sits at the set's deck plane (the mount rule puts the
    // counter top at the group origin + 5 mm), like the ratified stills'
    // target `[0, 0.05, 0]` — NOT at the track box centre, whose book-stack
    // height lifts the eye a metre over the deck and flattens the room
    // into a wall (measured at the book-stack law: rail and wall junction
    // land on the same screen row).
    center.set(setCenter.x, setCenter.y + 0.05, setCenter.z)
    setFramed = true
  }
  // DISTANCE ON THE ROOM, NOT THE FIXTURES: on the set-framed path the eye
  // solves into the ratified still's eye band — plan radius INSIDE the disc
  // rim (rim off-frame = the counter reads endless, the canonical stills'
  // trick), distance capped so the long FIXTURE spines (the books-to-cup
  // span of `initialBuild` is ~1.6 m on L01) cannot lift the camera over
  // the rim the way `span * 1.4` alone did. Build views orbit/pan to reach
  // a wide build's ends; the ROOM is the subject here.
  const d = setFramed
    ? Math.min(Math.max(1.3, span * 1.4), 1.55)
    : Math.max(1.2, span * 1.4);
  // THE GOAL IS IN THE SUBJECT: the static framing biases its look-at 35 %
  // of the way from the track's centre toward the build's FINISH CUP (the
  // capture centre, `finishCapture`) — an establishing shot that puts the
  // GOAL in the middle third, not at the edge where a fresh player cannot
  // find it (playtest N: "never found the finishCup on screen once in
  // either level", "the build camera never frames the cup"; measured: at
  // zero bias the cup captured at |ndc| 0.43/0.46 on L01/L04 — geometrically
  // in frame, perceptually a few pixels in the corner). At 0.35 the cup
  // captures at |ndc| <= 0.28 (inside the middle thirds) on every ladder
  // rung while every track-box corner stays at |ndc| <= 0.49 — the whole
  // build still fits with room. A level with no cup (a hazard sandbox, the
  // feel rig) frames its track exactly as before.
  if (focus && !box.isEmpty()) {
    // THE GOAL STAYS IN THE LEGAL FRAME — A FLOOR, NOT A FRACTION. On the
    // set path the room-centred subject needs less of this pull than the
    // track-box law did (the room already sits near the cup): the look-at
    // moves toward the cup only until the cup is 0.55 m from it — the
    // distance its |ndc| crosses under 0.85 on the 16:9 table (measured
    // L01: full-0.35-ratio bias overshoots into a cup-hugging close-up
    // that abandons the rim contract; the 0.55 m residual law lands the
    // cup at 0.70 with the eye still inside the disc rim). The 0.35 goal
    // law below is untouched for a set-less level.
    framingScratch.copy(focus).sub(center);
    if (setFramed) {
      framingScratch.y = 0; // the ROOM's deck plane owns the eye height
      // 45 % of the way to the cup, paired with the wide-azimuth eye
      // above: at the 35 % track-law fraction the cup clips the frame
      // edge on L01 (|ndc| 0.958, the T+U3 gate) because the cup sits
      // ~1 m x-past the room centre the law now frames; deeper than 45 %
      // the room slides out of the middle third. With the eye's extra
      // 0.15·d of x (the azimuth), 45 % is the balance both gates
      // measure — cup <= 0.9 everywhere, room near-centred.
      framingScratch.multiplyScalar(0.45);
      center.add(framingScratch);
    } else {
      center.addScaledVector(framingScratch, 0.35);
    }
  }
  // with a build view attached the solved base framing lives in it and the
  // view composes the pose (at zero yaw/pan that composition is bit-for-bit
  // the direct set below — the proofs and visual baselines do not move)
  if (view) {
    view.setFraming(center, d, span, setFramed ? 'set' : 'track');
    view.apply(camera);
    return;
  }
  if (setFramed) {
    // the ratified still's PITCH with the wider track azimuth — canonical
    // offset (0.62, 0.42, 0.78) at |d| 1.14 sets the ~21°; the plan drifts
    // onto the rim at the goal-biased centre, which the WOODEN TABLE (see
    // the mounted-set table resurface below) turned from a grey void into
    // an intentional stage edge (program T1.2). See the distance law above.
    camera.position.set(center.x + d * 0.7, center.y + d * 0.45, center.z + d * 0.85);
  } else {
    camera.position.set(center.x + d * 0.7, center.y + d * 0.55, center.z + d * 0.9);
  }
  camera.lookAt(center);
}

export const framingScratch = new THREE.Vector3();

/** Where `camera`'s gaze crosses the horizontal plane at `planeY` (the
 *  build-table focus point — see the frame loop's post-focus law). */
export function gazeOnDeck(camera: THREE.PerspectiveCamera, planeY: number, out: THREE.Vector3): [number, number, number] {
  camera.getWorldDirection(framingScratchB);
  const t = framingScratchB.y !== 0 ? (planeY - camera.position.y) / framingScratchB.y : 0;
  out.set(
    camera.position.x + framingScratchB.x * Math.max(0, t),
    planeY,
    camera.position.z + framingScratchB.z * Math.max(0, t),
  );
  return [out.x, out.y, out.z];
}

const framingScratchB = new THREE.Vector3();

/** Plain-text run status; the aria-live line the run reports through. The
 *  hash is NOT here (playtest E: engineer trivia on the player's line) — it
 *  lives in `#gw-hash-value` behind the same-pieces-same-run details. ONE
 *  COUNTER, ONE VERB (playtests P+Q: "0 of 4 used" vs "ready — 1 placed"
 *  was the same number wearing two words): the IDLE line states the tray
 *  tally in the SAME words as the builder's `#gw-piece-count` — "n of m
 *  pieces used" — so the two lines can never contradict mid-session; the
 *  in-run/terminal lines carry no tally at all (the clock is their only
 *  number; an edit-halted run's tally reappears when the line is idle
 *  again, recomputed from the same `playerCount`). */
export function runStatusLine(world: World, pieces: number, budget: number): string {
  const t = `${world.time.toFixed(2)}s`;
  switch (world.status) {
    case 'idle':
      return `ready — ${pieces} of ${budget} pieces used`;
    case 'running':
      return `running — ${t}`;
    case 'finished':
      return `finished — ${t}`;
    case 'fell':
      // STAGE-4 SWEEP (playtest R: "the set" unreadable): the internal noun is
      // gone from every player line; the head verb is just `fell off`, and it
      // still EQUALS the physics note's head (`physicsNote`, result.ts).
      return `fell off — ${t}`;
    case 'stalled':
      return `stalled — ${t}`;
    case 'timeout':
      return `timed out — ${t}`;
  }
}
