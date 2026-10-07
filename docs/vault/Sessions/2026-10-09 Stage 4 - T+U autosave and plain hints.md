---
livedocs: snapshot
---

# Stage 4 — T+U autosave and plain hints (playtests T+U round 4)

Brief items 1–3, Systems Engineer on main, port 4285. FE + LD ran in their worktrees;
this pass stayed in the ui/save copies.

## 1. The autosave is edit-side, debounced, and flushed before the unload (T: "reload kept 1 of 3")

The write already fired on every edit (`onChange` → `rememberBuild` since the R+S pass — the
brief's "only at terminal" predates that landing; T's partial restore matches her own
silent-click finding better than a save bug: a click that placed nothing never had bytes to
keep). Made the discipline explicit: `createBuildAutosave` in `src/save/save.ts` coalesces an
EDIT BURST into ONE `rememberBuild` of the latest build (350 ms trailing window), and
`src/boot.ts` wires `flush()` to `pagehide` + visibility-hidden, so a reload inside the window
stores the last edit and a level change (always a cross-document navigation) can never carry a
pending edit across boots. Restore side unchanged (`startBuildFor`). Tests both directions +
cross-level no-leak: `tests/unit/save.test.ts` (manual-clock burst coalescing, flush-once, the
per-level keying) and `tests/e2e/playtest-tu.spec.ts` (3 placed → reload → 3 restored;
mid-window pagehide; kitchen→bedroom→kitchen walk where each level restores ONLY its own).

## 2. The candidate-switch hint: plain words, the key named, ties only (U: "brackets never named")

The label reads `· two spots fit here — press ] for the other one` (three-plus:
`· n spots fit here — press ] for the next one (k of n)`) — shown under the SAME
`aimTies.length > 1` gate, so with no ambiguity the aim line stays bare. The hunt surfaced a
REAL bug: the keydown table mapped `BracketRight`/`BracketLeft`, but `ev.key` is the CHARACTER
(`]`) — the bracket keys were silently DEAD on the real page (the pre-existing red in
`aim-depth.spec.ts` that predates this round; ui.md had even claimed "the keys are the
CHARACTERS"). Characters now drive, code names aliased. The gate recomputes the tie list from
the projected sockets (K3's rim adds a third band candidate — the old gate assumed exactly the
measured pair) and asserts `]`/Tab reach the far socket and wrap home.

## 3. The home reset, one honest sentence (U: 'hint rendered "Home: Esc Esc"')

`#gw-tray-hint` ends `· Home: press Esc twice` — the shipped double-Escape recenter
(`build-camera.ts`, two presses inside `RECENTER_MS`; `camera-torture.spec.ts` proves the
gesture; U's "inert" Esc was a SINGLE press). Checked `git log` before finalizing: FE's
round-4 branch had not landed any home-reset change (their worktree sat at main's HEAD), so
the copy describes the current wiring; if FE's landing changes the gesture, the sentence (and
`loop.spec`/`playtest-tu`'s pins) is theirs to re-derive.

## Gates

`npm run typecheck` green; unit 575 green; full e2e green on 4285; filmstrip green on 4210/4212.
Two PRE-EXISTING reds met on the way (both proven red at HEAD before this commit, both copy-
derivation misses not behavior): `aim-depth.spec.ts` assumed the tie list is exactly the
measured pair and pressed an ev.key the handler never mapped (item 2 above), and
`filmstrip.spec.ts` L04 still polled the pre-R+S status string `fell off the set` — assertions
re-derived to the shipped copy, zero behavior change. Notes updated not acked: `Modules/save`
(the autosave scheduler + its guards), `Modules/ui` (hint tail, tie copy, the ev.key law),
`Modules/src` (one autosave clause).
