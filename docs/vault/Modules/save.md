---
livedocs: module
tags: [module, save]
---
# Modules/save

> [!abstract] Role
> One localStorage key, versioned, with a migration function from the first shape change onward (brief §8 "Save and share"). Owner: Systems Engineer.

## What it does

`src/save/save.ts` — `SAVE_KEY` = `gravity-works.save`, `SAVE_VERSION` = 2, and `MIGRATIONS[i]` upgrades a save at version `i` to `i + 1`; `loadSave` runs every migrade between the stored version and the current one, so "no key at all" is version 0 and flows through the first migrade — which is exactly how it was written from day one (`MIGRATIONS.length` equals `SAVE_VERSION`, asserted in test). The v2 envelope is `{ v, builds, settings, progress }` (v1 was `{ v, builds, settings }`), and each `builds[levelId]` is the canonical `serialize` JSON text from `src/track` — never a live `Build` object, because a `THREE.Matrix4` mangles itself into `{"elements":…}` through a plain `JSON.stringify` (caught by test, not by theory). `coerceBuild` normalises both legacy transform shapes before adopting anything.

The stage-4 `progress` record (`SaveProgress`) is the campaign's whole memory and the ONLY data `src/world/campaign.ts`'s `levelUnlock` reads (since the garden pass the campaign table carries four rooms — kitchen, bedroom, bathroom, garden — and the rule is unchanged: the garden rungs unlock on the same previous-rung star, `bathroom04` minting `garden01`): `stars[levelId]` is the best count ever EARNED, written by `recordStars` at a terminal run status (`src/boot.ts`; best-per-level, clamped 0..3, and a 0-star failure records NOTHING — §9.2 gates on stars, not on trying), and `reached[levelId]` is a LEGACY carry written ONLY by the v1→v2 migrade: `MIGRATIONS[1]` takes a v1 save (which counted no stars — its only trace of where a player stood was the per-level build autosave), keeps every byte of `builds`/`settings`, and marks `reached` for exactly the levels that HAD a build record. That carries a kitchen-era player's kitchen open (no re-locking a finisher behind `kitchen01`) and opens NOTHING that v1 had not already made reachable: a kitchen-only save's bedrooms gain no mark and stay gated on `kitchen05`'s star, and no stars are minted from old bytes (a migration cannot know what a run scored; trophies nobody earned are banned — `Sessions/2026-10-07 Stage 4 - room picker`). `reached` is never written again: placing a piece in a v2-era save cannot open a door.

Garbage never crashes the game: unparseable, structurally invalid or from-the-future blobs all become `freshSave()`, and since stage 4 so does an envelope without a well-shaped `progress` (migrades always write one, so only hand-edited or half-written saves hit it). `memoryStorage` is the injectable `StorageLike` that makes the whole module run under Vitest with no DOM; `rememberBuild`/`savedBuild` and `recordStars` are the game-facing trio (`src/boot.ts` autosaves and scores through them — and since the stage-4 R+S pass LOADS through them too: `startBuildFor` restores a level's autosaved working build on boot unless the URL addresses a build (`?build=par`/`alt`) or the save holds no record for that level — the autosave stopped being write-only the day a reload silently wiped a playtester's in-progress build); `saveFileJson`/`importSaveFile`/`downloadSaveFile` move the same envelope through a file (brief's export/import).

`SaveSettings` is `{ muted?, reducedMotion?, calloutsSeen? }` — `calloutsSeen` (stage 3) is the list of first-sight callout ids already shown, owned by `src/ui/callouts.ts`; optional by design, so an absent list means "nothing seen yet" and the envelope stays v1 — no migrade needed.

## Guarded by

`tests/unit/save.test.ts` (v0→v1→v2 from nothing, round-trip, garbage→fresh, legacy adoption incl. the `reached` carry, future version, file import, build-validation drop, the v1→v2 kitchen-only migrade NOT relocking the kitchen / NOT opening the bedroom / NOT minting stars, `recordStars` best-only-and-never-on-failure, the v2 `progress` shape gate) and `tests/unit/callouts.test.ts` (the `calloutsSeen` list round-trips alongside other settings, envelope version derived).

## Depends on / used by

`src/track` (serialize/deserialize). Used by `src/boot.ts`.
