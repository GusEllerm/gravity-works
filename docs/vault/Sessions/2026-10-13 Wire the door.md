---
livedocs: snapshot
tags: [session, sound, house, chrome, pars]
---
# 2026-10-13 — Wire the door (H2 program, Lane F2 — Feel Engineer)

Branch `h4-wire` (worktree `gw-j2`, base `63a2b30`). Three artifacts, one sentence: **the house has a
doorbell, the house has a door, and the par table stopped lying.**

## 1 · SOUND AT THE DOOR

The engine was wired to the door, not into the sim. `src/sound/mount.ts` is now the single page-facing
sound module (gesture unlock, `#gw-sound` chip, visibility pause, e2e seam) and BOTH `bootGame` and
`bootHouse` mount it. The house route feeds it page-only data: a ≤ 20 Hz read-only crane-position sink
into `setScreenSpeed`/`setUpAxisY` (wobble = crane lean, the camera's wobble law untouched),
`beginRun`/`finishRun` + `launch` at `probeLaunch`, and ROOM-BED switches minted at `probeStep`'s
parcel-crossing edges — launch mints the addressed room's bed (`kitchen` idle at the address-free home
page, `porch` when addressed), catch releases it, the terminal room runs `startRoomBed` once.
`setBed` stops only the bed voice (`stopBedVoices`) so a crossing never cuts the mid-run roll voice;
`state()` now reports `bed` because the silent-voice law makes the audible-at-the-right-moment claim
untestable by volume.

**The silence-by-design became silence-then-the-door-opens:** `?boot=house&premise=1&sound=on` builds
no engine during the beat (a context created inside the beat would autoplay the film WITH sound),
swallows the unlock gesture, and at `endBeat` replays that very gesture into `mountSound({
viaGesture })` — the same code path a real click takes. One `AudioContext` constructor ever (the
hand-off test counts constructions through a Proxy; the beatless `?boot=house` mount proved the
engine cannot double-unlock).

**The firewall test proves itself (mutation):** the test now walks the RESOLVED import graph of every
`src/sound/*.ts` — any page-layer import resolving outside the folder is a violation. Injecting one
`import '../physics/sim.ts'` line into `mount.ts` turns `tests/unit/sound.test.ts` RED (observed:
"sim-touched imports inside the sound graph: ../physics/sim.ts"); removed, GREEN. The old test could
not have seen this leak while `house.ts` did the importing.

## 2 · Chrome

**Disjoint rects at home.** The daily chip covered the wordmark on the house page (law-violation
discovery). The zero-flow corner law was a VIEWPORT-corner law; the home page's wordmark is what it
reached. New law: chrome rectangles must not intersect, proven by `elementFromPoint` at 1280x633 /
633x900 / 390x844 (`tests/e2e/home-chrome.spec.ts`, red-first: with the chip still pinned it fails
"wordmark pixels hit-testable (got chip,chip)"). The house route flows the chip under the wordmark
(`body.gw-home`), rung pages keep the corner law (asserted both ways). One trap paid on the way: the
chip's flow line was fractional (11px/1.4 → 15.4 px) and a fractional canvas top makes a
`canvas.screenshot()` clip 541 px tall — the flow line is integer by stated CSS.

**The one-way door.** `src/ui/home-door.ts` puts `⌂ the house` (an `<a>` carrying the WORD "house",
nav's first crumb = Tab's first stop) into the rung/sandbox chrome and the share page, and gives a
lone Escape — chord window closed, view already home, no panel owning the key — the same destination.
Chord precedence is TIME-tracked (`lastSeen`, init far-past so a young page's first Escape is
chord-eligible), not DOM-order luck. `playtest-aa.spec` second act reconciled: a lone Escape once the
window has closed now walks you HOME (its old "harmless" reading died with the law).

## 3 · Pars drift — the root cause

`bedroom-sandbox` shipped par **3.15** while `parTime` recomputes **2.75** (`ceil05(20/7.2·1.3)`).
Git archaeology: the row was BORN correct — `dae6938` (2026-10-08) shipped 2.75 — and was corrupted
by `74f8ed7` (2026-10-10, "encore death-clock stagger … bedroom 3.100"), which HAND-EDITED the
derived pars table from 2.75 to 3.15: the stagger value (3.100, ceiled onto the 0.05 grid) belongs to
the campaign rung bedroom05 — where the encore-stagger table still states it and the parity test
keeps it honest — but the edit landed on the SANDBOX row, whose own declaration never moved (it
still reads `time: 2.75`, "measured 2.733 s on the lap", unchanged since birth). The lie then
froze: `448b47c` regenerated with APPEND-ONLY semantics (new rows added, old rows keep their bytes),
so a regeneration could not remove it, and it survived four programs for one structural reason:
**`pars --check` was in no workflow** — `scripts/gen-pars.mjs --check` existed since `12c416c` and
appeared in neither CI job nor `package.json`, so no gate ever compared the table to the formula.
The fix is three-layered: (1) the row regenerated — `pars.json` is now the recomputed truth;
(2) `pars --check` joined the CI `check` job (regenerate-and-compare on every commit);
(3) `tests/unit/pars-parity.test.ts` asserts BOTH directions for every registered level —
`PARS[id].time === ceil05(level.par.time)` (the declaration) while `pars --check` binds the table to
the REPLAYED pars — plus row↔level coverage, with the two documented placeholders (feeltrack 15.0,
house 100.0) stated where they live, so a future drift fails IN the suite, not in a spreadsheet. The
bedroom-sandbox 2.75 is pinned in the test as the regression's tombstone. (`garden05`'s inline `par.time` was also 1.4 against its own comment's 1.35 — the comment
was right, the number rotted; fixed.)

## The merge caught a real bug (the bed witness earns its keep)

Merging Lane F1's furnished door (`h4-furnish`) into this branch turned the release-mints test red,
and the chase root-caused a law violation BOTH lanes had been carrying: the house page loop accrues
wall time into `accum` while the world is IDLE (`last` updates, the stepping `while` refuses), so a
run launched after the crane sat parked came alive by **teleport — ~350 fixed steps in the first
frame**, swallowing parcel crossings whole and answering for two seconds of a run nobody watched.
The bed witness (polling `state().bed` through the run — the only observer on the page that samples
faster than the frame) caught it, because a teleported garage crossing leaves no bed to witness. The
fix is one line and one law: a step debt only exists while there is a run to owe it to — the page
drops `accum` whenever the world is not running, so a launched run starts on the sim's own "from
second zero" (the seating law `World.launch` already states). Sim step sequences are untouched —
`replay:all` 30/30 byte-identical stands — and every house run now plays at wall speed on screen.

## Proofs

- `npm run replay:all` — 30 rungs verified, hashes byte-identical; house e2e receipt `6caea49b`
  page-hash === node-replay hash (in `tests/e2e/house.spec.ts`, untouched law).
- Full suite green (unit + 300+ e2e incl. new `home-chrome.spec`, the extended `sound.spec`, the
  reconciled `playtest-aa` act-2, the rebaselined visual views); `typecheck`, `pars --check`,
  `tally:sweep` green.
- **Pixel truth:** `shell-home-idle` did NOT move (captured pixels byte-identical — the home fix is
  flow chrome outside the canvas box; the earlier 960x541 was the fractional-line capture artifact,
  gone). `shell-kitchen01-idle` moved DELIBERATELY: the nav's new `⌂ the house` crumb makes the rung
  page one pixel taller (canvas top 367→368), which shifts how the bottom ghost strip composites
  over the canvas's bottom edge in an element screenshot — the canvas BITMAP verified byte-identical
  (toDataURL comparison, post on AND off). Darwin truth re-captured per house rule (`REBASE`
  frame-stability self-check 0.0000 %); the linux row is deleted for the CI bootstrap job to
  re-capture on this PR (same deliberate shift, linux compositor).

## See also

[[Modules/sound]] (SOUND AT THE DOOR), [[Modules/house]] (the doorbell rows), [[Modules/ui]] (THE
HOUSE'S CHROME), [[Decision Log]] 2026-10-13 (THE SOUND LAW), [[Reference/Action Plan 2026-10-13]]
(Lane F2 executed).
