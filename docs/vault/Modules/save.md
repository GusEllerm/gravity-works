---
livedocs: module
tags: [module, save]
---
# Modules/save

> [!abstract] Role
> One localStorage key, versioned, with a migration function from the first shape change onward (brief §8 "Save and share"). Owner: Systems Engineer.

## What it does

`src/save/save.ts` — `SAVE_KEY` = `gravity-works.save`, `SAVE_VERSION` = 1, and `MIGRATIONS[i]` upgrades a save at version `i` to `i + 1`; `loadSave` runs every migrade between the stored version and the current one, so "no key at all" is version 0 and flows through the first migrade — which is exactly how it was written from day one (`MIGRATIONS.length` equals `SAVE_VERSION`, asserted in test). The v1 envelope is `{ v, builds, settings }`, and each `builds[levelId]` is the canonical `serialize` JSON text from `src/track` — never a live `Build` object, because a `THREE.Matrix4` mangles itself into `{"elements":…}` through a plain `JSON.stringify` (caught by test, not by theory). `coerceBuild` normalises both legacy transform shapes before adopting anything.

Garbage never crashes the game: unparseable, structurally invalid or from-the-future blobs all become `freshSave()`. `memoryStorage` is the injectable `StorageLike` that makes the whole module run under Vitest with no DOM; `rememberBuild`/`savedBuild` are the game-facing pair (`src/boot.ts` autosaves through it); `saveFileJson`/`importSaveFile`/`downloadSaveFile` move the same envelope through a file (brief's export/import).

`SaveSettings` is `{ muted?, reducedMotion?, calloutsSeen? }` — `calloutsSeen` (stage 3) is the list of first-sight callout ids already shown, owned by `src/ui/callouts.ts`; optional by design, so an absent list means "nothing seen yet" and the envelope stays v1 — no migrade needed.

## Guarded by

`tests/unit/save.test.ts` (v0→v1 from nothing, round-trip, garbage→fresh, legacy adoption, future version, file import, build-validation drop) and `tests/unit/callouts.test.ts` (the `calloutsSeen` list round-trips alongside other settings).

## Depends on / used by

`src/track` (serialize/deserialize). Used by `src/boot.ts`.
