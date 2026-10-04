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

## Invariants

- The hash inside a payload is the ONLY trust anchor: replay recomputes, compare prints the verdict. Same-machine verification is exact; the cross-platform claim awaits the stage-2 harness measurement ([[Home]] Deferred).
- A share URL is fully self-describing: `getLevel` + the embedded build determine the whole run (Track Kit invariant 4).

## Guarded by

`tests/unit/share.test.ts` (round-trip, embedded hash, byte-stable canonical JSON, zlib⇄CompressionStream interop, garbage refusal, base64url safety) and `tests/e2e/replay.spec.ts` (zlib-encoded fragment opens the real page → `mismatch` with an echo of the recomputed hash → same fragment re-embedded → `verified`).

## Depends on / used by

`src/track` (serialize/deserialize). Used by `src/boot.ts` and the e2e specs.
