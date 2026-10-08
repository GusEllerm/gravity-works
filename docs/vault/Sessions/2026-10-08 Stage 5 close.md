---
livedocs: snapshot
tags: [session, stage-5, close]
---
# 2026-10-08 — Stage 5 close (Documentarian)

Stage 5 is COMPLETE on `main` pending the `stage-5` tag (Director owes it; `stage-4` is cut).
33 commits since `stage-4`. Agent clocks drifted across the stage — logs carry dates from
2026-10-08 to 2026-10-11; the chronology below is by dependency, not filename. This note is the
resume point: the arc, the numbers, the honest ledger, and what Stage 6 inherits.

## The arc

1. **Exploration → ratification.** Three porch variants judged 15/13/10; variant A (sunday
   morning) ratified at 15/16 with a six-item must-not-lose list, and the production port passed
   the same-day AD check with no send-back (`Reference/Review 2026-10-09 porch judging.md`,
   `Sessions/2026-10-09 Stage 5 - porch production set.md`). Rain (C) failed on TREATMENT, not
   cost — deferred, never vetoed (Decision Log 2026-10-09).
2. **The sixth room landed.** Porch set merged, then `porch01..05` wired into the campaign as the
   ladder's last room — `garage04 → porch01`, `porch05.next === null` — with the sink-is-a-bridge
   and pin-the-step doctrines learned the hard way
   (`Sessions/2026-10-09 Stage 5 - porch ladder.md`). Six rooms, 26 rungs, one flat ladder.
3. **Replay from a dead-code button to a send-worthy film.** The share page opened INTO the
   cinematic replay (shot grammar, scrubber, deterministic seek proof — Decision Log 2026-10-09);
   the share button itself reached the result panel at Playtest AA ("I'd send replays to a friend
   if the game would hand me a link") — ~60 lines took `share.ts` from dead code to a verified
   end-to-end loop (`Sessions/2026-10-10 Stage 5 - AA share and overlay fixes.md`). The solid-red
   tape AA saw turned out to be camera geometry burying the eye in the chassis on cup-less
   nose-first falls, not a GPU bug (replay-red diagnosis log); the finale now HOLDS the cup
   (finish-lead), cuts CARRY the subject, and Play always starts motion (BB).
4. **Playtests AA/BB/CC and the fix waves.** AA walled at bedroom02 and found the share gap; BB
   walled at kitchen03 and filed six shell/aim bugs; CC cleared the aim lies and called the
   ladder walkable at 4 tries — leaving ONE honest flaw: the share page's 6 s silent pre-sim.
   Waves: AA share/overlay fixes, BB shell fixes (modal-place never silent, failure strip,
   HOW-capable flatten advice, dev-preview no-mint), BB feel fixes (aim law, tie law, finale,
   Play-rewind — largely a salvage of a dead predecessor, Decision Log 2026-10-10), the K3
   re-sweep and B2 pass 2 (fail-timing law applied at stage 5: 111/111 subset deaths in five
   bands, 60/60 orders finish, six advice vocabularies; five distinct clocks/sites on B2), the
   chunked-wind readiness pass and its pump fix (Decision Logs 2026-10-10/10-11).
5. **Sound.** Zero-asset synth: 15 voices, −12 dBFS measured ceiling, the 14-gate offline
   loudness harness, mute + volume persisted without a save-schema bump, and the determinism
   firewall asserted on the IMPORT GRAPH (`Sessions/2026-10-09 Stage 5 - synthesised sound.md`,
   `Modules/sound`). Instrument-verified, not ear-verified — the playtesters' ears are stage 6's.

## The numbers

- Unit **695/695**; e2e **167 passed / 1 designed skip** (filmstrip gate on its own config; its
  L02 coverage floor is a known slow-box wall-clock nuance — Home Deferred).
- **replay-all CI gate 26/26** — every registered rung's par build replayed twice in order,
  pair-hashes equal (`npm run replay:all`); pars gate green across all 28 registered ids.
- Determinism unmoved: node↔browser HARD-MATCH `099403c7` / verdict `verified`; feel variants
  `cee96961`/`90d4cd69`; the ONLY campaign par hashes ever re-derived: kitchen02 `0b4dbab2`
  (stage 4) and kitchen03 `a1a50d05` (the stage-5 K3 re-sweep).
- Wind timings: waiting bar ~150 ms, ~50 ms of sim across ~12 slices, verdict at wind-end, first
  traced frame ~1.2 s on software GL — CC's 6-second silence is gone, CI-truth proven 42/42.

## The honest ledger (open items, Home Deferred)

F6 save-stamp STILL open (and decks moved under saves twice more this stage — v3 left free for
it); hardware-GPU 60 fps still owed; filmstrip frame-3 parked-runner parked; the liquid-specular
ceiling and stage-4 AD carry-forwards stand; the residual H+I polish trio (Retry dead time,
zoom-tight chase, ✗-mark legibility) never re-reported, never fixed. CLOSED this stage with
evidence: K3 tuning (re-sweep row), hidden-tab wind (pump fix + stage5-ready item 4), sound,
replay-all.

## Stage 6 inherits

The brief's polish list whole: accessibility audit, keyboard building end to end, the 820 px and
touch pass, a performance pass on every set (the hardware-GPU 60 fps item lands here), a copy
pass on every callout, README with renders and a short clip, the vault sweep, and the final
playtest + `Sessions/Final Report.md` — plus F6's versioned save migration and an ear-check on
the sound bed densities. The `stage-5` tag is the Director's to cut.
