---
livedocs: snapshot
tags: [session, stage-6, level-designer, sandbox, encores]
---

# Stage 6 — the sandbox promise, finished + the encore brevity trim (Level Designer)

Worktree branch `stage6-sandbox` off the shipped `main` (`b635954`). Two
Final Report "next" items, both playtest-DD-driven: **(A)** the brief's
no-budget sandbox per set — only the kitchen had one — and **(B)** DD's
brevity note: "the 05 rungs stretch that same verb… trim
garden05/garage05 toward porch-level brevity."

## (A) Five new sandboxes — the kitchen semantics, mirrored exactly

`bedroom-sandbox`, `bathroom-sandbox`, `garden-sandbox`, `garage-sandbox`,
`porch-sandbox` — each registered by its room's `05` level file (where the
kitchen's lives), each: `sandbox: true`, budget 999, the FULL tray (every
kind ×99), `fixtures: ramp+finishCup`, `maxTime` 20, a `parBuild` that
finishes, `sandbox`-excluded from the budget=tray contract loops exactly as
`kitchen-levels.test.ts` excludes the kitchen one (the shape is accepted by
the existing contract, not by a weakened assert — the sandbox keeps its own
"no budget, everything unlocked" test per room). Campaign-invisible by
construction: not in `CAMPAIGN`, `campaignIndex` −1, absent from the level
select, `?level=`-addressable, badgeless; the ladder stays THIRTY. The
reference laps are the ladders' own geometry (measured headless at author
time, then re-verified by `npm run pars`): four gap rooms lap the shared
`KITCHEN_GAP` off the 0.28 shelf on their 0.2 m straights — 2.733 s, par
2.75; the porch laps chute → threshold pop → sink carry → pinned step →
plank — 1.158 s, par 1.20. Each sandbox gets a derived `setPlacement` row
(the rung rule — rail midpoint, deck 5 mm under the lap's finish plane, the
room's axis offset — recomputed from the live builds by the room tests) so
the ROOM stands dressed around the lap: all furniture on, the corridor
clear. `src/boot.ts` lists the five constants beside `KITCHEN_SANDBOX`.

Proof: the `describe('<set> sandbox')` block in all five ladder tests
(lap finishes, budget ≥ 999 + tray ×99 everywhere, off-ladder claims,
`trayParityBuild` byte-for-byte, pars tray basis, mount derivation), and
`tests/e2e/stage6-sandboxes.spec.ts` — a screenshot smoke per sandbox
(ready, `data-set-mounted`, pixels land, zero errors) + the level-select
campaign-invisibility check.

## (B) garden05/garage05 — the honesty part

The zero-hash-movement option was measured first and is dead: on any −12°
release the ramp crawl is ~60 % of the rung's 3.05 s, so a porch clock
cannot be bought by tightening geometry on the same line. The trim therefore
moves the RELEASE only: −29°/0.24 m fail-timing chute (kitchen02/03's and
the porch's tool), 0.12 blend, plus a sink-softer 21°/0.18 m run-out catch
(the 0.18 level keeps the booster line's chain reach; a 0.20/0.24 deck puts
the anchored cup out of it). Rail, `ENCORE_DIP`, tray, staging: verbatim.

**Hashes moved: exactly two.** `garden05` and `garage05` par replay
`1b37dfed` → `1f99683a`; parTime 3.05 → 1.35 (measured 1.342); pieces 4
unchanged. The four-rung encore rail split in two — `bedroom05`/`bathroom05`
stay byte-identical `1b37dfed` at 3.05 (DD scoped the complaint
to the two rooms whose encores read as pure remixes; the light-pool and
flood encores' staging IS their freshness) — and no other rung moved:
`npm run replay:all` 30/30 verified, kitchen's `PINNED` atlas green. Their
`setPlacement` rows re-derived (rail midpoint 1.3602 → 0.95817).

**Laws, measured not papered:** the promise law survives UNBROKEN (11/11
sampled omissions FALL, earlier — ~1.1–1.5 s bands); the decoy's tail law
survives byte-exact (par's own hash); booster EARLY stays the hidden line
(1.108 builder-mount / 1.017 exported) and LAST stays trim at the par's
hash. THREE laws flipped with the crawl and are re-stated with numbers in
the level headers and tests: deck-first FINISHES 0.025 s BEHIND the par
(porch05's own "finishes but LATE" exception idiom; it fell at 2.808 on the
crawl), the two-plank mid bridge finishes SLOW (never fast), and the
five-piece booster-spent-AND-line-ridden overshoots the catch and FALLS —
the buy is now stated as a SUBSTITUTION for the far crossing, never an
addition. A 60+-cell grid (chute height × dip step × lead × catch
level/angle) says every porch-clock cell flips the same ORDER laws; the
shipped cell flips the fewest and keeps the par honest (an order still
beats it at 1.225).

Proof: `tests/unit/garden-levels.test.ts` / `garage-levels.test.ts`
(104 tests green, the three re-stated laws carry their measured numbers)
and `tests/e2e/stage6-encore-brevity.spec.ts`: fresh session, no
instructions, four blind Places from the boot ring, ONE launch (cap six),
finished — the k3-discoverability floor on the porch clock.

## Suite recount (this branch)

Unit `npm test`: **791/791** (36 files; +30 vs the final sweep's 761 — the
five sandbox blocks × 6 claims each; the re-stated encore law tests are
reworded, not added). `npm run pars -- --check` green (37 registered ids —
the five new sandboxes joined). `npm run replay:all`: **30 rungs, all
verified** (ladder unchanged; the two trimmed pars verify at their new
hashes). Typecheck clean. E2E main lane: **201 passed / 1 designed skip**
(+12 new: 10 sandbox smoke/invisibility, 2 blind-clear; the existing
campaign/encore specs unchanged) on `E2E_PORT=4490`; the filmstrip lane was
not re-cut (no camera/framing code moved — the two trimmed rungs' rails got
shorter, the filmstrip gate owns framing claims, filed as the one re-cut
owed on `main`).

Handoffs/asks: none new; the one owed action is a filmstrip re-sample of
`garden05`/`garage05` on the Director's next framing sweep.
