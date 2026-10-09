---
livedocs: snapshot
tags: [session, program, stage-7]
---
# 2026-10-09 Program T0 — save (Systems Engineer, worktree `gw-x2`, branch `p1-save`)

Track 0 items T0.3 (R1 quarantine) + T0.6's R8/R9, executed red-first. The wipe repro went RED at
`4fe0b9e` exactly where the engineering evaluation said it lives: the evaluator's probe — a parseable
`v:3` envelope with TWO BANKED STARS dropped into `gravity-works.save`, page reload, ONE click of
`#gw-sound-toggle` — landed on `Received array: []` for the quarantine keys: no copy, no message, stars
gone from the envelope (`tests/e2e/save-quarantine.spec.ts`, red run 1). The fix is a RENAME, not a
repair: `migrateDetailed` reports `damaged`/`usable` (`normalizeEnvelope` walks `builds`/`stars` per key,
so one bad build among good keeps the good entries), `loadSave` stashes the raw bytes under
`gravity-works.save.corrupt-<n>` (deduped, capped at 5) BEFORE the fresh envelope ever writes, and the
ALREADY-TESTED `downloadSaveFile`/`importSaveFile` finally got their settings row (`src/ui/settings.ts`,
`#gw-save` — boot gained exactly two wiring lines, the extraction owner's file stays mine-free otherwise).
Import validates THROUGH the migrate machinery (`salvageBlob` takes a future-version envelope at face
value only if it validates — the live path still refuses, v3 stays reserved and `SAVE_VERSION === 2` is
pinned in test), so the repro's stars come back BOTH ways (restore-from-quarantine button and file
import), the honest line is one sentence in the panel, and the envelope keeps playing. The seven hostile
shapes of the evaluator's corruption matrix ride the unit table (quarantine-holds-the-bytes / playable /
recoverable-across-a-fresh-state-`saveSave` for each). R8: the volume slider's persist is the
autosave's shape — trailing 350 ms, injectable clock, `flushPersist` on mute/dispose and on the
`pagehide`/visibility-hidden listeners `createSound` registers itself; the unit proof is 50 `setVolume`
calls costing ONE write under a fake clock (today they cost 50), the e2e proof is a keyboard drag and an
instant reload landing the value. R9: no leases — `{t,s}`/`{t,n}` records INSIDE the v2 envelope
(plain values are the same record at stamp 0, schema-tolerant, no bump), `saveSave` became a MERGE-WRITE
(stamp what this write changed, revive what a stale view never saw, verify-and-re-merge once against the
localStorage read→write hop), `replaceSave` is the deliberate install path; the deterministic proof is
two tabs where B reads, A places for real, B writes late — A's record survives — plus the
two-tabs-racing-bursts guard. Mutation ledger: delete the quarantine call → `save-quarantine` RED (the
wipe's exact assertion); make `saveSave` write flat again → `cross-tab-save` (i) RED; restore
per-key whole-envelope freshSave in `migrateBlob` → the matrix rows RED. Ports: e2e on `E2E_PORT=4570`.
`boot.ts` lines touched: 2 (import + `createSaveSettings(root)`), zero sim/boot logic.
