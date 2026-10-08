---
livedocs: snapshot
tags: [session, stage-5, systems, shell-coherence]
---

# Stage 5 — BB shell fixes (systems engineer)

Four playtest BB items in the ui/boot/save/copy lane (camera/replay/aim/kitchen03
belonged to worktrees). The predecessor's run was lost with no output, but its
worktree carried the full implementation; this run audited every claim against
the brief, ran the gates, and finished the missing piece (this log). Port 4370
lane; `tests/e2e/playtest-bb.spec.ts` is the item spec.

1. **Place with the modal up is never silent** (BB bugs-2). `createBuilder`
   gained `onPlaceIntent`, fired at the top of every place attempt that HELD a
   piece (button, Enter, canvas click); `src/boot.ts` wires it to
   `dismissOverlay` — the same collapse the first Escape runs — so the panel
   retires into the build view BEFORE the attempt and the placement (or the
   refusal line) lands on a live board. An empty-handed button click now
   SPEAKS ("nothing in hand — pick a piece from the tray first", unless a
   fresher one-shot note owns the line) and does NOT collapse the modal —
   playtest Q's dismiss-nothing-without-a-piece law survives. e2e both
   directions (held Place places + walks the camera home; a blocked held click
   collapses onto its refusal; the empty click talks without hiding the panel).
2. **The failure strip** (BB item 6). `show(model)` toggles `gw-result-strip`
   on any NON-finished status: the failed verdict rides a bar pinned to the
   viewport's bottom edge instead of the canvas middle; finished runs keep the
   centred panel. Asserted via the new `__gwCarNdc` seam (the ball's projected
   screen point) — zero strip/ball overlap sampled across the death second at
   1280x720 and 960x540. `playtest-n.spec.ts`'s click-through geometry was
   re-derived for the strip row (walk to the first canvas hit-test point; the
   intent must END read, never silence).
3. **HOW-capable flatten advice** (BB item b3). `flippedKindsFor(level,
   build)` in `src/boot.ts` reads the builder's amber reversed-fit test back
   off the build data (in-socket joined at a chain anchor within
   `SNAP_TRANSLATION_TOL`, tangent past `SNAP_ANGLE_TOL`); `physicsNote`'s
   seventh arg makes the nose-first landing tail say `re-place it flat (no
   R)` exactly for a placed-AND-rotated landing, plain `flatten the landing`
   for a straight one, ADD wording for tray stock, shipped wording when
   unknown. Unit tests sweep the three states with a real kitchen02 chain
   mounted through the builder's own flip matrix.
4. **Dev-preview honesty** (BB item 5). `?level=` addressing doctrine stands,
   but a LOCKED campaign rung says so: the corner-pinned `#gw-dev-preview`
   badge plus the real teeth — `recordStars` is skipped and `gateNext(0)` on a
   dev preview, so the badge's promise is a property of the code path. Share/
   replay pages wear nothing (the replay page never builds the game DOM).
   e2e both directions: locked `?level=bedroom02` badges + a par finish mints
   zero save stars and no Next; `?level=kitchen01` wears nothing. Consequence:
   `campaign.spec.ts` rigs now seed the PREVIOUS rung's star (merging init —
   the save wins over the seed) so their earned-star claims run on genuinely
   unlocked boards; `world.md`'s unlock paragraph now reads "only a finished
   run mints … on a rung the save has opened."

Verification: typecheck clean; `npm test` 684/684; `playtest-bb` 9/9;
`playtest-n` + `campaign` + `share-replay` green; full e2e green on the push.
The two regenerated `docs/explorations/replay/share-replay-kitchen01-*.png`
are `share-replay.spec.ts` artifacts rewritten by the green run.
