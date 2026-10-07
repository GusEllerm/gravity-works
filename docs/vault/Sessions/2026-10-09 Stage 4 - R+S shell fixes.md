---
livedocs: snapshot
---

# Stage 4 — R+S shell fixes (playtests R+S round 3)

Brief items 1–5, Systems Engineer on main. Ports 4260 (suite) / 4270 (filmstrip).
Also landed first: the uncommitted-but-complete FIXTURE READABILITY SIGNAL WIP left in the
tree from the Q handoff (deck-inlay + `fixtureQuota` move to `src/track/build.ts`) — its unit
gate `tests/unit/fixture-signal.test.ts` is green and the visual baselines did not move.

## 1. Result card swallowed the toolbar (R: "Remove clicks died behind the result card")

Audited the panel AND its parent wrapper: `#gw-result` is pointer-transparent with its buttons
scoped `auto`, and `#gw-stage` (the parent) is plain `position:relative; overflow:hidden` —
verified on the DEPLOYED page too (the shipped CSS carries the scoping). Reproduced the real
mechanism in a live browser instead: the page is TALLER than a laptop window, R had scrolled
to look at the world, the toolbar sat OFF-SCREEN above, and her blind clicks at where Remove
used to be landed on the CANVAS THROUGH the transparent panel (with nothing held a canvas
click only moves the ring — "no-op with no feedback"). Fix is layout, not z-order:
`#gw-builder-host` is now `position: sticky; top: 0` above every stage overlay, so the toolbar
never leaves reach while a card is up or the world is being inspected. e2e (playtest-rs):
panel up + page scrolled → `elementFromPoint` at every toolbar button IS the button, a tray
click selects (aria-pressed), Remove works BEHIND the panel and dismisses it.

## 2. Reload preserves the build (S: reload "silently wiped my in-progress build")

`rememberBuild` was write-only. New pure decision `startBuildFor(level, params, saved)` in
`src/boot.ts`, per the save schema: `?build=par`/`?build=alt` is recorded addressing and stays
FRESH (test rigs); otherwise the level's autosaved WORKING BUILD is restored when the save
carries one that deserializes and names THIS level (a foreign/garbage record = fresh — the
`isSaveData`/`deserialize` gates in `src/save` are the validators); no record = the
fixtures-only `initialBuild`. Restoring is what `MIGRATIONS[1]` already implies — a level with
a build record is a level the player stood in. Both directions pinned in
`tests/unit/boot.test.ts` (unit) and `tests/e2e/playtest-rs.spec.ts` (place → reload → still
there; `?build=par` reload → still the reference build).

## 3. Socket naming sweep (both: "target: level start", "target: end of cup")

`targets()` labels in `src/ui/builder.ts` now name the THING: the cup's open exit reads
`target: cup on the table` (the cup is the object they can SEE, not a piece the kit offers),
and an open release socket reads `target: where the car starts` (never "level start").
Sweep of the remaining internal word on player lines: the blocked ghost says
"blocked — furniture is in the way" (was "the set"), and the fell line of BOTH the status line
(`runStatusLine`) and the physics-note catch-all reads "fell off — …" (was "fell off the set");
the note-head EQUALS-status-verb law is unchanged. `levels.spec`/`set-wiring` e2e updated; the
idle page's spoken lines are asserted free of "the set"/"level start" in playtest-rs.

## 4. Counter after Remove (S: "ready — 4 of 5 vs header 3 of 5")

Both lines already read ONE source (`builder.playerCount()` — the frame loop writes the idle
line every frame, `removeLast` → `updateGhost` writes the tally) and S's deploy predates the
P+Q coherence pass, which is the likeliest origin of her split numbers. Made it unforgivable
rather than argued: playtest-rs places, removes, and asserts the idle status line and
`#gw-piece-count` are literally the same tally string, everywhere.

## 5. Par clock clarity (both: "par 2.65 s — what clock?")

`starRulesLine` (the FIRST surface where "par" appears: the level-select rules line and the
level's first-boot one-liner) now ends "at or under T s (par = the target time for this run)".
One clause, one place; the panel's later par lines stay terse. playtest-pq per-rung asserts
re-derived; playtest-rs asserts the clause.

## Gates

`npm run typecheck` green; unit suite 565 green (`boot.test` + the `startBuildFor` pin; stars/boot copy re-derived);
full e2e suite green on 4260; filmstrip gate green on 4270. Notes updated, not acked, where
bodies changed: `Modules/ui` (labels, blocked/fell copy, R+S gate), `Modules/src` (sticky
toolbar, restore), `Modules/save` (savedBuild is load-facing), `Modules/world`,
`Modules/track`, `Modules/dev`, `Modules/replay` (fixture signal, committed separately).

## Follow-up (K4 handoff, same day, ports 4275+)

The empty-handed R now says what it did: the FIRST press that arms the reversal with
nothing held states `REVERSING_WHY` — "reversing — track runs backwards this way (press R
unless you want a coaster)" — once per page session on `#gw-ghost-state` (FLIP_WHY's
once-discipline applied to the ARM, playtest R's silent-arming wall; the next action, the
first place included, retires it and the held ghost's own copy takes the line over),
pinned in `tests/e2e/builder.spec.ts`. The Remove counter check gained its PANEL-OPEN
variant: a Remove that succeeds BEHIND the open result card must refresh BOTH count lines
— the idle status line and the builder tally (`tests/e2e/playtest-rs.spec.ts`), S's
"4 of 5 vs 3 of 5" fault pinned in its panel-open shape.
