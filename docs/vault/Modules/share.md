---
livedocs: module
tags: [module, share]
---
# Modules/share

> [!abstract] Role
> Share links with no server: `(levelId, build, seed, hash)` → canonical JSON → raw DEFLATE → base64url → a `#s=` URL fragment, the final state hash embedded so any viewer can recompute and print verified/mismatch (brief §8, §9.4). Owner: Systems Engineer.

## What it does

`src/share/share.ts` — `shareJson` emits the wrapper with keys ascending (`build`, `hash`, `levelId`, `seed`, `v`) and the build embedded through `serialize`, so equal payloads are byte-equal before compression. `encodeShareUrl` compresses and base64urls it; `parseShareUrl` (alias `decodeShareUrl`) refuses garbage at both layers: `extractShareRef` rejects anything that isn't an `s=` fragment (an ordinary `#anchor` is never a share), and `fromShareJson` validates version, hash shape, seed integer and the build via `deserialize`.

Compression is injectable (`ShareCodec`): the browser uses platform `CompressionStream('deflate-raw')` (`platformCodec`); Node paths may pass a `zlib.deflateRawSync` codec. The module imports no Node APIs, so the browser bundle stays clean, and the two codecs are RFC1951-identical — `tests/unit/share.test.ts` proves interop in BOTH directions against `node:zlib`.

## Share card (stage 3, brief §8 "share card" + §9.4)

`src/share/card.ts` — `generateShareCard(state): Promise<Blob>` renders the final build state (live `scene` if given, else `buildTrackMeshes(build)` from `src/world`) into an offscreen WebGL canvas from `heroCameraFor` — the hero rig's front-up-right three-quarter attitude and fov, scaled to the build's own bounding box, because the fixed hero rig in `src/dev/cameras.ts` frames the provisional kitchen bowl and a card must frame the build actually being shared (Decision Log) — then composites a warm-paper caption strip in a 2D canvas: `cardCaption` (level, time, the shared `starGlyphs` readout, the verified mark when the share page answered) and the URL. Returns a PNG `Blob`; in Node it rejects with a clear "needs a browser canvas" rather than shipping a blank PNG. `downloadBlob` is the file-save sugar `src/boot.ts` uses for the `#gw-share-card` button on the shared-run page (`#gw-card-status` narrates: rendering card… / card ready / card failed).

## Invariants

- The hash inside a payload is the ONLY trust anchor: replay recomputes, compare prints the verdict. Same-machine verification is exact, and since 2026-10-09 the cross-machine identity is MEASURED, not assumed: all 37 reference-build hashes match between linux-x64 and darwin-arm64 in CI (`tools/hash-atlas.mjs`, `Reference/Cross-platform determinism 2026-10-09`) — platforms outside those two remain unproven, and the badge stays machine-local ("verified on THIS machine" is what the page itself proves; the note beside it names what machines mean).
- A share URL is fully self-describing: `getLevel` + the embedded build determine the whole run (Track Kit invariant 4).

## Guarded by

`tests/unit/share.test.ts` (round-trip, embedded hash, byte-stable canonical JSON, zlib⇄CompressionStream interop, garbage refusal, base64url safety), `tests/e2e/replay.spec.ts` (zlib-encoded fragment opens the real page → `mismatch` with an echo of the recomputed hash → same fragment re-embedded → `verified`) and `tests/unit/card.test.ts` (caption content, hero framing of an arbitrary build, the honest Node rejection).

## Depends on / used by

`src/track` (serialize/deserialize). Used by `src/boot.ts` and the e2e specs.
