#!/usr/bin/env node
/**
 * THE K04 FLATTEN SWEEP (round-3 item 2 — "flatten still has no verb").
 * The 2026-10-11 round-3 verdict's k04 death ("dump seats 3 of 4, DIES
 * 2.66 s", note "flatten the landing by the lip or lower the lip by the
 * drop") is the 3-seat line `drop → gapLip → landing`: the fourth ask (the
 * `straight`) is left on the tray and the line ENDS SHORT of the cup. The
 * verdict's proposed fix was a flattening verb (a rotate detent step or a
 * param nudge on the aimed piece); this sweep is the headless verdict on
 * that proposal, played through the shipped placement model on the shipped
 * mount (fixtures pinned at par, tray pieces chain-fitted, `replayRun`):
 *
 *   - the death build really falls at ~2.66 s (the verdict's clock);
 *   - NO flattening of any seated piece finishes it — every angle/height/
 *     level variant of the drop, lip and landing, and every FLIP (Rotate
 *     already ships; it only flips) still falls or stalls: on an anchored
 *     rail the line is SHORT, not steep, and flattening cannot lengthen
 *     it (the same order-invariant reach law the k04 header documents);
 *   - the ONLY single-action heal is the verb the tray ALREADY ships:
 *     seat the `straight` still in the tray at the chain head — the whole
 *     4-piece chain finishes at 2.59 s (par 2.52, 4 pieces = par pieces:
 *     the rung CLEARS with 2 stars).
 *
 * That measurement is why round 3 ships an ADVICE change and not a new
 * key: the failure note must name the keystroke that demonstrably heals
 * the death (`add a straight · place at: end of landing` — tray button +
 * Place), not a `flatten` no key performs. Law in `src/ui/result.ts`
 * (§ACTIONABLE-VERB PRIORITY); pinned by `tests/unit/actionable-verb.test.ts`.
 *
 * usage: node scripts/k04-flatten-sweep.mjs
 */
import { initRapier } from '../src/physics/sim.ts';
import { replayRun } from '../src/replay/replay.ts';
import { PIECES } from '../src/track/pieces.ts';
import { fitSocket } from '../src/track/snap.ts';
import { transformSocket } from '../src/track/socket.ts';
import { fixtureQuota } from '../src/track/build.ts';
import { flipPlacement } from '../src/ui/builder.ts';
import { levelTrayParams } from '../src/ui/advice.ts';
import { KITCHEN04 } from '../src/world/levels/kitchen04.level.ts';

const PARAMS = levelTrayParams(KITCHEN04, KITCHEN04.tray);
const isFixture = fixtureQuota(KITCHEN04.fixtures);
const FIXTURES = KITCHEN04.parBuild().pieces.filter((p) => isFixture(p.def));
const DEATH = ['drop', 'gapLip', 'landing']; // the 3-seat death seating
const HEAL = [...DEATH, 'straight']; // + the tray's last piece, at the head

function sockets(p) {
  const [a, b] = PIECES[p.def].sockets(p.params);
  return [transformSocket(a, p.transform), transformSocket(b, p.transform)];
}

/** The builder-mount chain: ramp fixture, the asks chain-fitted at the
 *  chain head (optionally one variant: a param patch or a flip), the cup
 *  fixture pinned at its par transform. */
function build(order, patchIdx = -1, patch = null, flipIdx = -1) {
  const ramp = FIXTURES.find((p) => p.def === 'ramp');
  const cup = FIXTURES.find((p) => p.def === 'finishCup');
  const pieces = [{ ...ramp, seq: 0 }];
  let cursor = sockets(pieces[0])[1];
  order.forEach((def, j) => {
    const params = { ...PARAMS[def], ...(j === patchIdx ? patch : {}) };
    const m =
      j === flipIdx
        ? flipPlacement(cursor, def, params, true)
        : fitSocket(cursor, PIECES[def].sockets(params)[0]);
    pieces.push({ def, params, transform: m, seq: pieces.length });
    cursor = sockets(pieces[pieces.length - 1])[1];
  });
  pieces.push({ ...cup, seq: pieces.length });
  return pieces;
}

async function play(pieces) {
  return await replayRun(KITCHEN04, { levelId: KITCHEN04.id, pieces, seed: KITCHEN04.seed });
}

await initRapier();
let bad = 0;

const death = await play(build(DEATH));
console.log(`death  (drop gapLip landing)      ${death.status} ${death.time.toFixed(3)} s`);
if (death.status !== 'fell' || Math.abs(death.time - 2.658) > 0.05) {
  console.log('VIOLATION: the k04 dump death does not reproduce at ~2.66 s');
  bad++;
}

// The flattening grid: every single-piece variant of a SEATED piece.
// (drop `angle: 0` is degenerate spline — excluded, like the kit itself.)
const VARIANTS = [];
for (const a of [15, 30, 60, 75]) VARIANTS.push(['drop[0].angle', 0, { angle: a }]);
for (const h of [0.06, 0.08, 0.16, 0.2]) VARIANTS.push(['drop[0].height', 0, { height: h }]);
for (const a of [0, 5, 15, 20, 30]) VARIANTS.push(['gapLip[1].angle', 1, { angle: a }]);
for (const a of [-6, 0, 3, 6, 9, 15, 20, 24]) VARIANTS.push(['landing[2].angle', 2, { angle: a }]);
for (const l of [0.16, 0.2, 0.28, 0.32]) VARIANTS.push(['landing[2].level', 2, { level: l }]);
for (const r of [0.01, 0.04]) VARIANTS.push(['drop[0].radius', 0, { radius: r }]);

let healedByVariant = 0;
for (const [label, i, patch] of VARIANTS) {
  const run = await play(build(DEATH, i, patch));
  if (run.status === 'finished') {
    console.log(`FLATTENED ${label.padEnd(18)}      ${run.status} ${run.time.toFixed(3)} s  <-- would heal`);
    healedByVariant++;
  }
}
for (let i = 0; i < DEATH.length; i++) {
  const run = await play(build(DEATH, -1, null, i));
  if (run.status === 'finished') {
    console.log(`FLIPPED ${DEATH[i].padEnd(20)}        ${run.status} ${run.time.toFixed(3)} s  <-- would heal`);
    healedByVariant++;
  }
}
console.log(`flattening grid: ${VARIANTS.length} param variants + 3 flips — ${healedByVariant} finish`);
if (healedByVariant > 0) {
  console.log('VIOLATION: a flattening variant heals the death — the verb law must name it, not ADD');
  bad++;
}

const heal = await play(build(HEAL));
console.log(`heal   (+ the tray straight)      ${heal.status} ${heal.time.toFixed(3)} s`);
if (heal.status !== 'finished') {
  console.log('VIOLATION: seating the tray straight does NOT heal the death');
  bad++;
}

console.log(bad ? `${bad} LAW VIOLATIONS` : 'laws hold: death reproduces; no flattening heals it; the tray straight does');
process.exit(bad ? 1 : 0);
