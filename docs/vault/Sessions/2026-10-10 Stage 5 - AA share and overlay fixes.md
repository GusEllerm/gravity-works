---
livedocs: snapshot
---

# Stage 5 — AA share and overlay fixes (systems engineer)

Five playtest AA items, each shipped with an e2e that fails where AA failed
(`tests/e2e/playtest-aa.spec.ts`, port 4350 lane):

1. **Share wired to the result panel.** `#gw-result-share` ("Share this
   run") rides the panel's button row; boot freezes the run at the terminal
   edge (`lastOutcome` — hash, time, stars) and encodes the `#s=` link from
   `currentBuild` (safe: any edit hides the panel, so the build under the
   link is the run the player watched). Clipboard when allowed, visible
   readonly `#gw-result-share-url` always, reused card PNG behind
   `#gw-result-share-card`. The acceptance line runs end to end: finish
   L01 → share → the panel's own URL opens the replay page and reports
   `verified`. The `share.ts` machinery went from dead code to player
   surface with ~60 lines of wiring.
2. **Advice head-noun honesty.** `goalNounFor(level)` reads the level's
   `fixtures` table for the kind the registry gives a `captureVolume` (the
   same classifier `initialBuild` mounts and the target sweep labels);
   `physicsNote` takes the noun as a `null`-defaulted tail argument —
   every shipped rung still says "cup" because every shipped rung still
   FIXTURES a cup; a bowl/mat rung will say its own word for free. Unit
   sweep asserts the noun across all 26 campaign rungs.
3. **Escape closes the overlay first.** A CAPTURE-phase listener dismisses
   the panel and walks the framing home (the `resetCar` view move minus
   the car), and the camera's `Escape Escape` chord never sees that press —
   the second Escape stays a harmless lone first half. AA's "parked in a
   far failure vista" now dies on the first key.
4. **No more scroll yank.** The panel's `scrollIntoView` is gone; show and
   hide capture/restore `scrollY`, and when the stage is scrolled away the
   panel ANCHORS to the viewport (`position: fixed`, `top` pushed below the
   sticky toolbar so playtest R's toolbar law survives). Asserted at
   1280x720 and 1280x633: scrollY and the canvas rect identical across
   open AND close, panel fully on screen.
5. **One "other spot" key.** The tray-hint line said "←→", the tie tail
   said "]" — the two sources AA heard as "J vs ]". Both now name `]`
   (the key `cycleAim` answers); arrows stay bound, never advertised.
   Sweep test asserts the hint line names `]` and nothing else.

Side repair: `playtest-tu.spec.ts`'s rung-count literal was left at 21 by
the porch-ladder merge (main was red on it); now 26 and the 5 porch rungs
sweep their cup framing green.

Honest note on item 5: no string "press J" exists anywhere in git history —
the sweep's fix targets the two real sources (hint vs tie tail); AA's "J"
is taken as a misread of the arrows line, which the pass retires.
