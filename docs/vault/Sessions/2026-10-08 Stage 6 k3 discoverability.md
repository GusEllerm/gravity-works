---
livedocs: snapshot
tags: [session, stage-6, level-design, kitchen, discoverability, callout]
related: [[Concepts/Levels]], [[Modules/ui]], [[Reference/Level Ladder]], [[Sessions/2026-10-08 Playtest DD final sweep]], [[Sessions/2026-10-10 Stage 5 - K3 re-sweep]], [[Sessions/2026-10-10 Playtest BB stage5]]
---
# Stage 6 — kitchen03 "The Bowl", the second wall (Level Designer)

Branch `stage6-k3` (worktree `gw-ld16`). The law (§12): confused twice → fix the level or the callout,
never the length of the explanation. **kitchen03 has now walled two fresh-eyes strangers**: playtest BB
(stage 5, 6 builds, quit) and playtest DD (2026-10-08, 6+ builds, "WALL — not cleared"), and DD's three
sentences are BB's: *"the only snap is a curve exit the game itself says is blocked — furniture is in the
way"*, *"building backwards from the cup runs off-table"*, *"] swaps to the car's start point"*. The rung
is SOLVABLE (the par replays verify; 60/60 whole-tray orders finish); it is not DISCOVERABLE, and the
campaign stops at rung 3.

## (1) The wall, reproduced on the shipped mount (before the fix)

Rebuilt in a fresh browser session against the pre-fix build (`?level=kitchen03`, held `straight`, walked
the aim with `]` exactly as DD described). Boot offers FOUR open ends, and the two the eye goes to first
are the two that cannot ever win:

| the end the ring marks | the verdict the ghost wore (pre-fix) | what it is |
|---|---|---|
| `end of the pre-built ramp` | fits here | the answer — the head of the par chain |
| `cup on the table` | fits here | a LEGAL seat on the far side of the goal — a line built there is never travelled (DD: "runs off-table") |
| `end of the pre-built curve` | blocked — furniture is in the way | the bowl rim, on a rung called "The Bowl" — "furniture" reads as movable, so it reads as a puzzle about furniture |
| `the car's start point` | fits here | playtest N's known dead end, kept honestly as a target |

So the two loudest affordances (the visible goal, and the level's namesake) both say "build here" in a
language that gives no reason not to, and the one sentence that did object ("furniture is in the way")
objected in a word the player cannot act on. Advice then closed the loop: every note named a KIND and no
PLACE, so each obeying retry seated the named kind at whichever end the ring happened to mark — DD's six
launches, six times.

Measured, not assumed: the object that refuses the rim seat is the `cereal-bowl` prop's own box (a headless
walk of `setPlacementGuard` against a `straight` seated at `bowl.out`: blocked by `cereal-bowl`, plus the
`tap` for the taller pieces). The kitchen's dress spans x 0.52–1.47 while the cup's entry sits at x 2.218
— the cup is at the rim of the round counter, which is why anything chained off its far side hangs over
the floor.

## (2) The design call: the CALLOUT, and no geometry moved

Rejected with measurements, in the Decision Log:

- **Move the blocking furniture.** The blocker is not furniture — it is the bowl, and the bowl is ONE prop
  for every kitchen rung (`src/sets/kitchen/index.ts`, `cereal-bowl`). Moving it to service one rung moves
  the set for the room, and the rim line it would open is BLOCKED physics anyway (ask #1: no shipped car
  steers a banked yaw arc) — the socket would become a placeable decoy the car then fails through. Worse
  wall, not better.
- **Close the cup's dangling exit with kitchen02's run-out fixture.** The idiom is right and the geometry
  is not: at x > 2.34 the deck would float over the floor, which is DD's "off-table" as a piece of track.
  Closing 29 of the 30 rungs' cup exits that way is a campaign-wide systems programme, not a rung fix.

Chosen: make the fail/hint grammar NAME the discoverable path — three tells, one per decision point, each
inside an existing law rather than a new one:

1. **A red seat names the object and the verb** (`src/ui/builder.ts`, `SetGuard`/`solidWord`):
   `blocked — the cereal bowl is in the way · press ] to walk the open ends`. The name is the set's own
   object path (naming convention `src/sets §props()`), so it cannot drift from the mesh, and the walk
   phrase is the shared `AIM_WALK_COPY` — one key, one wording (`src/ui/callouts.ts`), with the builder's
   blocked line and the note's WHERE tail quoting each other. The place that said "furniture" now says:
   this is the bowl, it is not yours, and here is the verb that has an answer.
2. **A legal seat past the finish says what it cannot do**: `fits here — the run ends at the cup, so
   nothing past it is ever travelled`. Green stays green (it IS a legal seat — removing the affordance was
   measured and rejected as a campaign-wide change), but the green no longer hides the fact.
3. **The failure note's ADD tail names the END, not only the kind** (`physicsNote`/`resultModel`,
   `builder.aimHint()`): `…; add a straight or a lip · place at: end of the pre-built ramp · press ] to
   walk the open ends`. The end is the far open exit of the START-CONNECTED chain — the socket
   `chainHeadIndex` aims the boot ring at (playtest N's law), so the sentence is a fact about the build
   graph, never a guess about intent. The walk phrase appears ONLY when the ring marks some other end, and
   the tail rides an ADD tail ONLY — a critique line ("flatten the landing", "re-place it flat (no R)") is
   advice about a piece already on the track. This is the loop-breaker: it is the sentence DD needed on
   launch 2, and BB's K3 notes are in this family (two of BB's four lines are this one).

## (3) ACCEPTANCE PROOF — fresh eyes, no instructions, dev build served from this worktree

Protocol (mechanical, so the run is the build's proof and not mine): a fresh browser session; save cleared
(`localStorage.clear()` — verified `0 of 5 pieces used` at boot; the first attempts had to be discarded
because the autosave restored an earlier session's working build into a nominally fresh page, which is a
property of the harness, not of the level); drive the page by `accessibility text` only — the label line,
the verdict line, the note — and do what the newest line on screen says, placing at the ring, never using
hover-to-aim and never using anything read out of the repository. Port 4470 (`vite preview` of this
worktree's `npm run build`).

* **Run 1 — fresh session, "follow the ring" policy.** Boot line `target: end of the pre-built ramp`; hold
  `Straight` → `fits here`; Place; the ring walks itself (`place straight at: end of straight`), Place ×5 in
  tray order (`straight, straight, gapLip, drop, landing`); `5 of 5 pieces used`; **launch 1 → `finished —
  1.51s`, ★★☆, `5 pieces — par 5 ✓`** (the clock missed the 1.45 star, which is the honest 3-star line, not
  the clear). CLEARED, 1 launch.
* **Run 2 — fresh session, "read before placing" policy (DD's route, told the truth).** Walk the four ends
  with `]` first: the cup's end answers `fits here — the run ends at the cup, so nothing past it is ever
  travelled` and the rim answers `blocked — the cereal bowl is in the way · press ] to walk the open ends`
  — both dead ends now say so, so nothing is spent on them; `]` returns to `end of the pre-built ramp`, five
  Places, **launch 1 → `finished — 1.51s`, ★★☆**. CLEARED, 1 launch.
* **Diagnostic (not a graded run, reported because it found the residual):** a deliberately stubborn
  replay of DD — place at the cup's end *ignoring* the tell, launch (fell 1.07 s), read
  `fell off nose-first — add a flat landing or add a lip · place at: end of the pre-built ramp · press ] to
  walk the open ends`, follow it, place the rest. The line reaches the cup's mouth but ONE tray piece is
  stranded past the goal, so the last launch falls at 1.63 s with a BARE head (the stock tail needs stock,
  and the tray is spent) — recovery is `Remove` (which is last-in-first-out, so clear-and-rebuild). Two
  launches in, the rung is still one informed rebuild from a clear; the prevention is tell #2. Filed as an
  ask (an ORPHAN-PAST-GOAL clause, or a Remove that says which piece it takes) rather than papered over —
  see [[Concepts/Levels]] §KITCHEN 03 and the Decision Log.

Both graded sessions cleared well inside the ≤6-launch budget; the rung's floor is now a spec, so the next
stranger's wall is a CI red rather than a note: `tests/e2e/stage6-k3-discoverability.spec.ts` asserts all
three tells AND the blind five-Place/one-launch clear.

## (4) Contracts

`npm run pars -- --check` green; `npm run replay:all` **30/30 verified** with kitchen03 still at
**`a1a50d05`** — the determinism anchor did NOT move, because no piece geometry, tray, par or set mount
moved (that is the point of choosing the callout; no re-anchor Decision Log line is owed); unit suite
761/761; e2e 187 passed / 1 designed skip on `E2E_PORT=4473`; `npm run build` clean before push. New specs
are additive or sharpen existing ones: the guard's naming authority and the bowl-as-blocker are proven
box-for-box in `tests/unit/set-wiring.test.ts` (the guard's boxes are now `SetGuard { name, box }`; the
camera walk maps them back to `.box`, so the "beige wall" contract is untouched), and the WHERE tail's two
laws (ADD-only, unknown-keeps-shipped) are swept in `tests/unit/result.test.ts`.
