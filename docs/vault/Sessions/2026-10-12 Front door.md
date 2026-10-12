---
tags: [session]
livedocs: snapshot
---
# 2026-10-12 Front door

Feel Engineer, build 2 of "THE DOWNHILL greenlit" (branch `dh-door`, ports 5050+). The irreversible
commit of the program, taken in the open: THE FRONT DOOR — the home screen becomes THE HOUSE,
rendered — and THE FAREWELL REWIRED, NOT DELETED. Laws 3 and 4 executed verbatim; the house route
shipped in `dh-house` (receipt `6caea49b`, camera v1) is the ground this stands on.

## What shipped (the five artifacts)

1. **HOME SCREEN = THE HOUSE** (`src/pages/house.ts` home mode, routed by `src/boot.ts`): the bare
   route renders the cross-section under the parked wide crane (`homePose` — camera v2, the crane's
   path parked as the menu camera it always was, pure over the deck bounds + frustum). THE SIX
   WINDOWS are the interactive level select: `#gw-house-window-<room>` buttons projected through
   exactly that pose (`placeWindows` — positions are layout facts, not tunings), named
   `kitchen, 5 rungs, toured, 8 of 15 stars` (`windowAriaName` — stars folded per room from
   `progress.stars`), toured rooms wearing `★ 8/15` on the sill (`windowSillLine`), Enter/Tab
   opening the room's tour list AT THE UNCHANGED `?level=<room>NN` BYTES (locked rungs stay locks).
   The house run is the front-door act (the same Release, the same receipt); the daily chip
   (`#gw-daily-board` → `?daily=1`) and the LINES corner (the level select's own `createLinesTab`)
   kept their corner chrome; `?levels=1` rides this commit UNCHANGED. **Premise beat REPURPOSED**:
   first visit = the crane pulls back from the KITCHEN window (`beatPullPose`, 1.0 s) while a
   stepped world over `HOUSE_BEAT_LEVEL` — the house with the wind OFF in the DATA and one legal
   launch push (`launchSpeed: 1.3`, no wind: every force still in replayed data, the input law
   honored by the letter) — free-rolls one room (garage @ 1.43 s) and dies in the next (the kitchen
   crossing @ 3.23 s, roll-end 4.5 s, still 0.5 s): the game saying "it's all one place" BEFORE any
   UI word (windows, chrome and sound all hidden by the same `.gw-premiere`; records nothing — the
   e2e proves no best is minted by watching). Audience law UNCHANGED in `src/pages/intro.ts`
   (webdriver skips, `intro=1` forces, `intro=off`/reduced-motion never sit through, ONE seen flag
   via `markPremiereSeen`); the beat's world is a second stepped `World`, disposed at the end.
2. **THE FAREWELL REWIRED** (`src/pages/farewell.ts`): porch05's first clear still plays the crane
   pass + three doors — law kept VERBATIM, the page otherwise untouched. The row door 1 opens ON
   gained, once the house exists, a seventh honest name: `#gw-farewell-house` — "the whole house",
   deep-linking the house route at its build-1 bytes `?level=house`, gated on the registry (no
   house, no link — the farewell never opens a door that is not there). Door 1's own click still
   lands the porch sandbox in one click: the one-click-one-landing law is not what grew.
3. **THE RE-BASELINE ACT** (law 3, stated not quiet) — enumerated per surface below. The URL
   family (`tests/e2e/goto.ts`) grew `?boot=rung` as a DEFAULT for non-visual specs and
   `?boot=house` as its named counterpart; the routing rule in `src/boot.ts`: bare route → home;
   `?boot=rung` → the old front end; ANY rig address (`level/build/set/launch/daily`) routes
   exactly as it always did — addressing doctrine stands.
4. **A11Y**: every window is a real button in the Tab walk ONCE with the room-reading name
   (proved by a real Tab traversal, never `focus()`), Enter enters, the global `:focus-visible`
   ring (3 px `#143a6e`, 8.7:1 on the paper — the same contrast receipt as every surface) reads on
   the cream cross-section; the sill is text, never color-only; the stage-6 a11y gate itself rides
   `?boot=rung` UNCHANGED (it audits the game page, which did not move).
5. **COLD-LOAD TRIPWIRE EXTENDED**: the build-1 standing tripwire (first page-load run equals the
   node replay on a fresh profile) pointed at the ADDRESSED house page; build 2 adds the HOME-BOOT
   face — bare `/?boot=house&launch=1`, first release, fresh browser, `hash === node`, steps equal,
   ≥ 3 rooms (`front-door.spec.ts`). The receipt is the receipt behind whichever door.

## THE RE-BASELINE ACT — every surface, WHAT moved and WHY (law 3's "enumerated per surface")

| surface | what moved | why |
|---|---|---|
| bare `/` route | kitchen01 builder → THE HOUSE rendered | law 3, the irreversible UI act itself |
| `tests/e2e/goto.ts` (non-visual family) | defaults grew `boot=rung`; every relative landing otherwise byte-same | the specs audit the rung chrome; they say "old front end" EXPLICITLY through the one door, per harness doctrine (parameter, not mutation) |
| visual specs (`visual.spec.ts`, filmstrip, hash family, perf, post-dispose, harness) | ZERO edits; they never import the door and ride DEFAULT pages | they opt into fronts CONSCIOUSLY — and every existing view ADDRESSES its rig (`?harness=1…`, `?level=kitchen01&post=on`), so no pixel they own moved |
| pixel baselines — `establishing`/`hero`/`floor`, `shell-kitchen01-idle` | UNMOVED, 0.0000 % at this HEAD | addressed surfaces the door did not touch (the append-only promise holding) |
| pixel baselines — NEW `shell-home-idle` | added: `/?boot=house&post=on`, parked cross-section, no run/ghost; frame-stability self-check 0.0000 % (0 px, two captures); darwin committed, THE NEW LINUX VIEW bootstraps via the `linux-baselines` CI job (line extended per-view); joined `CI_ENFORCED_VIEWS` | the shipped FRONT PAGE needs pixel truth on CI's machine too (N1 doctrine, second member) |
| first-visit e2e (`intro.spec.ts`) | REWRITTEN for the house boot: bare landing lands on the house (windows live, no beat under webdriver); `?intro=1` asserts the house beat (chrome hidden incl. the windows, ends ≤ ~6 s, records no best, skip returns the door, seen flag honoured); the old kitchen01 par-roll assertions retired — that film now exists only as the `?boot=rung&intro=1` rig | the beat MOVED with the door (law 4's beginning); the rung boot is an address and no longer anyone's first visit |
| farewell e2e (`farewell.spec.ts`) | door-1 row count 6 → 7 + `#gw-farewell-house` name/href + a click-through that lands `?level=house`; every other door test byte-identical | the rewire is ONE added name on what door 1 opens ON; crane pass, three doors, one-click law verbatim |
| a11y specs (`a11y.spec.ts`, `a11y-touch.spec.ts`) | UNCHANGED (they ride `?boot=rung` via the door) | the game-page walk, focus and never-color-only laws are surfaces the act did not move; the NEW surfaces' walk/names/ring are gated by `front-door.spec.ts` |
| every other chrome/e2e spec (shell, result, p4-chrome, builder, playtests, campaign, daily, chain…) | ZERO edits — the `boot=rung` default carries them | law 3's promise: re-baseline means ENUMERATED, not quietly shifted |
| `?levels=1` board + `createLinesTab` | UNCHANGED (the door OPENS the lines tab; one source for the rows) | the addressed board remains the board; the windows are the same player surface worn by the house, byte-compatible by construction |
| downhill e2e (build 1's proofs) | UNCHANGED and green | `?level=house` addressing untouched; the tour byte-comparison proves the demotion again at the new door |
| cold-load tripwire | EXTENDED (home boot first run = node hash), build-1 tripwire untouched | the door is presentation only: the same data, the same receipt, whichever door you enter |

## The referee (final, at the branch tip)

`npm run typecheck` clean · `npm test` 1016/1016 (55 files — `front-door.test.ts` joins: window
naming/sill folds, `homePose` framing EVERY deck, `beatPullPose` endpoints/monotony, the beat's
data) · `npm run replay:all` **30/30 verified, byte-identical** (house atlas row `6caea49b`/807
untouched — the boot-family work added no physics) · `tally:sweep` 0/325 degenerates, farm 3 ·
full `playwright test` green incl. the re-baselined `intro`, the rewired `farewell`, the new
`front-door` (13 tests) and `visual` 8/8 (darwin views all 0.0000 %; `shell-home-idle` linux truth
bootstraps on the PR via the CI job) · the home-boot tripwire hashes `6caea49b`/807, browser ===
node, first launch, fresh profile.

## Findings for the director

- The beat's free-roll is THE measured number, not a tuning: wind-off + `launchSpeed: 1.3`
  approves garage @ 1.43 s and kitchen @ 3.23 s, stalls @ ~9.4 s — the beat ends on its OWN plan
  (4.5 s roll-end), so the player watches the death, not the stall-detection. `16 m/s` flung it
  past kitchen (no approval, an honest near-miss logged by the sweep in `tmp/beatsweep.ts`, kept
  out of the tree by the cleanup commit); `13` is the data that says "one room and dies in the
  next".
- Camera v2 is HONEST, not yet beautiful: the wide stance reads the staircase (six decks framed
  with a 15 % margin) but the far rooms are small — the spike's per-room focused passes
  (`shots` re-aimed per deck, `setCameraSolids` house-wide, the cross-section dressing) remain
  the named later work, now with a home to arrive in.
- Stated edges: `?boot=house&launch=1` suppresses the beat (a launch rig is addressed by
  definition — the same doctrine as `?intro`'s address list, which grew `boot`/`launch`);
  `?room=` deep-links OPEN their window on the home screen (the camera gesture and the affordance
  are one act); a first visit that lands on `?level=house` directly still plays no beat (addressed
  = not first), which the audience table already said.
- Pre-existing, inherited honestly: the porch drive-past finding and the `pars.json` drift note
  from build 1 — neither moved here (no campaign data touched).
