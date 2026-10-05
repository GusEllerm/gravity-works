---
livedocs: snapshot
tags: [session, stage-4, systems-engineer]
---
# 2026-10-07 Stage 4 - room picker

## Goal

The bedroom ladder (`bedroom01..04`) existed as registered data but was
unreachable: boot hardcoded kitchen01, the only progression was the in-session
`gateNext`, and NOTHING persisted across page loads. Build the room-selection
layer — a campaign across rooms, a level select grouped by room, persisted
star-gated unlocks with a tested save-schema bump — keeping the shell-truth
pass rules intact (star gating, honesty, no dead affordances).

## What was done

- **Campaign model** — `src/world/campaign.ts`: the rooms are ORDERED GROUPS
  of the SAME flat ladder `nextLevelId` already walked (kitchen01..05 →
  bedroom01..04); `CAMPAIGN_LADDER` is their concatenation, so Next and the
  level select cannot disagree. `levelUnlock` states §9.2's rule ONCE:
  first rung / previous rung earned ≥ 1 star / the legacy `reached` carry
  (below). `src/boot.ts` re-exports `LADDER` = `CAMPAIGN_LADDER` and
  `nextLevelId` = `nextInCampaign` — the boundary (`kitchen05 → bedroom01`,
  `bedroom04` → null) was already wired by the bedroom-ladder pass
  (`boot.test.ts` asserted it); what was missing was everything BEHIND the
  Next button.
- **Progress persistence** — save `SAVE_VERSION` 1 → 2: the envelope gains
  `progress: { stars: Record<levelId, best>, reached: Record<levelId, true> }`.
  `recordStars` runs at every terminal status in boot (best-per-level; a
  0-star failure records nothing). `reached` is written ONLY by the
  migrade — placing a piece never opens a door.
- **Level select** — `src/ui/levelselect.ts`, routed by `?levels=1` (the
  share fragment still wins; `?level=` stays the recorded debug
  addressing): `<section data-room>` per room with a real `<h2>` heading,
  one `#gw-level-<id>` button per rung carrying the level's REGISTRY name
  and its earned ★/☆ (`starGlyphs`, 0 → `☆☆☆`). Locked rungs are
  `aria-disabled` + focusable and CLICKING ONE SAYS WHY in the page's live
  region ("Locked — earn at least one star on <previous level name> to open
  this level.") — the tray's no-reason-for-a-grey-button convention, not a
  dead affordance. The game shell gained a quiet `#gw-levels-link`
  ("All levels").
- **Set switching verified, not re-plumbed**: the level-select / Next path
  reaches the bedroom levels, and the existing registry mount
  (`levelSet` → `SETS`) follows — `data-set-mounted="bedroom"`, the dusk
  lamp punctual gate compiles clean (campaign + bedroom-set specs, zero
  console/shader errors), and the placement guard follows the bedroom dress
  with the cable/homework props clearing the lane (bedroom01's `drop` seats
  over the cable dip through the REAL UI — the guard never blocks it).

## Decisions

- **v1→v2 migrade** (`MIGRATIONS[1]`): a v1 save counted no stars, so its
  ONLY memory of where a player had been is the per-level build autosave.
  The migrade carries those keys as `progress.reached` — a level whose
  build record existed is a level the player stood in, and it must not
  relock after the upgrade (a kitchen finisher would otherwise come back to
  a kitchen locked behind `kitchen01`). It MINTS NO STARS: old build bytes
  cannot say what a run scored, and displaying trophies nobody earned is
  the dishonesty the shell-truth pass banned; the bedroom frontier is
  re-earned by finishing `kitchen05`, exactly as in a fresh save. Kitchen-
  only saves are the gated case (`tests/unit/save.test.ts`,
  `tests/unit/campaign.test.ts`): kitchen stays open, bedroom stays shut.
  Caveat carried honestly: `reached` = any builds key, so a v1 save whose
  owner had `?level=`-visited a bedroom rung keeps THAT rung open (visited
  ≠ starred; no cascade).
- **What mints a star**: a terminal RUN on the game page records its
  stars — through any build, so a `?build=par` rig run finishes real
  physics and scores real stars. No param writes progress directly; the
  Decision Log's "no param forges a star" still reads true — the rig
  FINISHES, the finish MINTS. The unlock e2e deliberately mints nothing
  from rigs: kitchen05 is built piece-by-piece with tray clicks there.
- **`?levels=1` is a player route**, added to the recorded-URL-affordances
  family, but unlike `?level=` it ENFORCES the unlock rule (it is the
  player-facing surface; `campaign.levelUnlock` is the single statement).

## Corrected mid-session (self-review)

The first draft of `campaign.ts` imported ids from a nonexistent
`../levels-registry.ts` and shipped as a fragment; caught on typecheck,
rewritten against the real level modules before anything downstream
consumed it. No user-visible artefact survived.

## Reported, not routed around (other roles' files)

- `src/sets/bedroom/index.ts` calls `dress.add(pyramid)` TWICE (lines 331
  and 345) — a three-way no-op re-add of the same group, harmless but a
  copy-paste smell in Environment Artist territory; left untouched.
- **The callout seam does NOT follow the set**: `PROP_CALLOUTS` in
  `src/ui/callouts.ts` is still EMPTY — no bedroom prop (nor any kitchen
  prop) registers a first-sight line, so the §9.3 seam fires for piece
  KINDS only. Pre-existing since stage 3 (the note always said props
  register "when the prop modules land"; they never did), not a bedroom
  regression; the level-designer and environment-artist files have nothing
  wrong in the data I touched.
- Bedroom level data itself: nothing wrong found on the paths I drove —
  bedroom01 places, finishes (2.35 s = par), and its omission cases behave
  as the ladder note claims.

## Verified

- `npm run typecheck` clean; `vitest` 340 green (added:
  `tests/unit/campaign.test.ts` — table order, boundary, all three unlock
  doors, migrated-kitchen case; `save.test.ts` — v1→v2 migrade incl. the
  kitchen-only must-not-relock/unlock case, `recordStars` best-only, v2
  shape validation).
- `tests/e2e/campaign.spec.ts` (E2E_PORT 4216): kitchen05 built through the
  real UI → Next lands `?level=bedroom01` with `data-set-mounted=bedroom`
  error-free; a fresh save's level select locks the bedroom and the locked
  button says why; after kitchen05 EARNS a star the rung opens with the ★
  tally; bedroom01 is finished through the real UI (3 tray pieces, Launch,
  finished ★★★) reached by clicking the rung on the level select; the
  set-switch probe paints track pixels against the dusk sky with zero
  console/shader errors.

## Next

- Level select gets per-room progress copy ("2 of 5 rooms") only when the
  game has a third room (bathroom is exploration-only).
- `#gw-levels-link` placement/typography is the stage-6 UI pass's.
- Prop callouts (`PROP_CALLOUTS`) still register nobody — a stage-4/5
  integration item for the set owners, see Reported.
