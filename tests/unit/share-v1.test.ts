/**
 * V1 LINKS VERIFY FOREVER (freeplay program Lane C — THE CHAIN law, the
 * program's one true point of no return, Decision Log 2026-10-12): the
 * share payload grew `name`, `goal`, `par` and `lineage` for the
 * challenge half of a named line, OPTIONAL-ON-READ / MANDATORY-ON-WRITE-
 * NEW — and the v1 links already out in the world must parse, round-trip
 * and REPLAY-VERIFY exactly as they always did, because a broken old link
 * is a burned receipt.
 *
 * The fixtures in `tests/fixtures/share-v1.json` are REAL v1 payloads:
 * shipped par builds replayed through the shipped deterministic sim,
 * encoded with the v1 writer's exact bytes (`shareJson` over a payload
 * carrying no v2 fields still writes the `"v":1` envelope verbatim — the
 * byte-stability assertion below pins that forever). Both directions the
 * law asks for are proved here for every fixture:
 *
 *  - v1 → now: the stored bytes parse and the embedded hash equals the
 *    replay of the payload's own build (the receipt still honours);
 *  - now → v1: a payload read from v1 bytes re-writes the SAME v1 bytes,
 *    and the same build re-minted as a v2 payload replays to the SAME
 *    hash (the version hop moves no physics — the hash-neutrality claim
 *    of the CHAIN law, one layer up from the tally's).
 */
import { describe, expect, test } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';
import '../../src/world/levels/kitchen01.level.ts';
import '../../src/world/levels/bedroom02.level.ts';
import '../../src/world/levels/garden04.level.ts';
import '../../src/world/levels/porch05.level.ts';
import { getLevel } from '../../src/world/levels/feeltrack.level.ts';
import { serialize } from '../../src/track/build.ts';
import { replayRun } from '../../src/replay/replay.ts';
import {
  base64urlEncode,
  encodeShareUrl,
  fromShareJson,
  parOfRun,
  parseShareUrl,
  shareJson,
  type ShareCodec,
  type SharePayload,
} from '../../src/share/share.ts';

const zlibCodec: ShareCodec = {
  deflate: async (b) => new Uint8Array(zlib.deflateRawSync(Buffer.from(b))),
  inflate: async (b) => new Uint8Array(zlib.inflateRawSync(Buffer.from(b))),
};

interface Fixture {
  levelId: string;
  status: string;
  time: number;
  hash: string;
  json: string;
}

/** The `#s=` wire token, derived from the canonical bytes (raw DEFLATE +
 *  base64url — what the extractor wrote): the fixture file itself carries
 *  only readable canonical JSON, no high-entropy literals. */
const tokenOf = (f: Fixture): string =>
  base64urlEncode(new Uint8Array(zlib.deflateRawSync(Buffer.from(f.json))));

const FILE = JSON.parse(
  readFileSync(fileURLToPath(new URL('../fixtures/share-v1.json', import.meta.url)), 'utf8'),
) as { note: string; fixtures: Fixture[] };

describe('v1 share fixtures — old links verify forever', () => {
  test('the fixtures are real: at least three, campaign par builds, finished runs', () => {
    expect(FILE.fixtures.length).toBeGreaterThanOrEqual(3);
    for (const f of FILE.fixtures) {
      expect(f.status).toBe('finished');
      expect(f.hash).toMatch(/^[0-9a-f]{8}$/);
    }
  });

  for (const f of FILE.fixtures) {
    describe(f.levelId, () => {
      test('the stored v1 bytes parse and re-serialize byte-identically (v1 forever)', () => {
        const p = fromShareJson(f.json);
        expect(p.v).toBe(1);
        expect(p.hash).toBe(f.hash);
        expect(p.levelId).toBe(f.levelId);
        expect(shareJson(p)).toBe(f.json); // the v1 writer still makes THESE bytes
        expect(shareJson({ ...p, v: undefined, } as SharePayload)).toBe(f.json);
      });

      test('v1 → replay: the embedded hash IS the replay of the payload build', async () => {
        const p = fromShareJson(f.json);
        const run = await replayRun(getLevel(f.levelId), p.build);
        expect(run.status).toBe('finished');
        expect(run.hash).toBe(f.hash);
      });

      test('v1 token on the wire decodes with the platform and zlib codecs alike', async () => {
        const url = `https://example.dev/game/#s=${tokenOf(f)}`;
        const viaZlib = await parseShareUrl(url, zlibCodec);
        const viaStreams = await parseShareUrl(url);
        expect(viaZlib.hash).toBe(f.hash);
        expect(serialize(viaStreams.build)).toBe(serialize(viaZlib.build));
      });

      test('now → v1 round trip: the same build re-minted v2 replays to the same hash', async () => {
        const v1 = fromShareJson(f.json);
        const remint: SharePayload = {
          v: 2,
          levelId: v1.levelId,
          seed: v1.seed,
          hash: v1.hash,
          build: v1.build,
          name: 'the fixture line',
          par: parOfRun(f.time),
        };
        const bytes = shareJson(remint);
        expect(bytes).toContain('"v":2');
        const back = fromShareJson(bytes);
        expect(back.name).toBe('the fixture line');
        expect(back.par).toBeCloseTo(remint.par!, 10);
        expect(serialize(back.build)).toBe(serialize(v1.build)); // the hop moved no byte
        const run = await replayRun(getLevel(f.levelId), back.build);
        expect(run.hash).toBe(f.hash); // …and no hash
        const wire = await parseShareUrl(await encodeShareUrl(remint, zlibCodec), zlibCodec);
        expect(wire.hash).toBe(f.hash);
      });
    });
  }

  test('the v2 fields on a v1 envelope are garbage, not absence', () => {
    expect(() =>
      fromShareJson(`{"build":{},"hash":"ca06ebea","levelId":"l","par":2.5,"seed":0,"v":1}`),
    ).toThrow();
  });

  test('an unknown version is refused', () => {
    expect(() =>
      fromShareJson(`{"build":{},"hash":"ca06ebea","levelId":"l","seed":0,"v":3}`),
    ).toThrow();
  });
});
