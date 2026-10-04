/**
 * Share payload tests. The interop direction the contract cares about is
 * proved both ways: this module's CompressionStream codec must decode what
 * `zlib.deflateRawSync` wrote, and must produce bytes zlib can inflate.
 */
import { describe, expect, test } from 'vitest';
import zlib from 'node:zlib';
import { FEELTRACK } from '../../src/world/levels/feeltrack.level.ts';
import { serialize } from '../../src/track/build.ts';
import {
  base64urlDecode,
  base64urlEncode,
  encodeShareUrl,
  extractShareRef,
  fromShareJson,
  parseShareUrl,
  platformCodec,
  shareJson,
  type ShareCodec,
} from '../../src/share/share.ts';

/** The Node-side codec: zlib straight, exactly the browser's raw DEFLATE. */
const zlibCodec: ShareCodec = {
  deflate: async (b) => new Uint8Array(zlib.deflateRawSync(Buffer.from(b))),
  inflate: async (b) => new Uint8Array(zlib.inflateRawSync(Buffer.from(b))),
};

describe('share', () => {
  const payload = {
    levelId: FEELTRACK.id,
    seed: FEELTRACK.seed,
    hash: 'ca06ebea',
    build: FEELTRACK.placeholderBuild(),
  };

  test('encode -> fragment -> parse round-trips the payload', async () => {
    const url = await encodeShareUrl(payload);
    expect(url.startsWith('#s=')).toBe(true);
    const back = await parseShareUrl(`https://example.dev/game/${url}`);
    expect(back.levelId).toBe(FEELTRACK.id);
    expect(back.seed).toBe(FEELTRACK.seed);
    expect(back.hash).toBe('ca06ebea');
    expect(serialize(back.build)).toBe(serialize(payload.build));
  });

  test('the payload embeds the final hash', async () => {
    const url = await encodeShareUrl(payload);
    const json = new TextDecoder().decode(
      await platformCodec().inflate(base64urlDecode(url.slice(3))),
    );
    expect(fromShareJson(json).hash).toBe('ca06ebea');
    expect(shareJson(payload)).toContain('"hash":"ca06ebea"');
  });

  test('canonical wrapper JSON is byte-stable and key-sorted', () => {
    const a = shareJson(payload);
    const b = shareJson({ ...payload, build: { ...payload.build } });
    expect(a).toBe(b);
    const keys = [...a.matchAll(/"([a-zA-Z]+)":/g)].map((m) => m[1]!);
    // wrapper keys ascending; the embedded build keys are canonical already
    expect(keys[0]).toBe('build');
    expect(a.lastIndexOf('"hash"')).toBeLessThan(a.lastIndexOf('"levelId"'));
    expect(a.lastIndexOf('"levelId"')).toBeLessThan(a.lastIndexOf('"seed"'));
    expect(a.lastIndexOf('"seed"')).toBeLessThan(a.lastIndexOf('"v"'));
    expect(a).not.toContain(' ');
  });

  test('zlib and CompressionStream interop in both directions', async () => {
    const viaZlib = await encodeShareUrl(payload, zlibCodec);
    const viaStreams = await encodeShareUrl(payload, platformCodec());
    // both decoders read both encodings to the same payload
    for (const url of [viaZlib, viaStreams]) {
      const viaPlatform = await parseShareUrl(url, platformCodec());
      const viaZlibSide = await parseShareUrl(url, zlibCodec);
      expect(viaPlatform.hash).toBe(viaZlibSide.hash);
      expect(serialize(viaPlatform.build)).toBe(serialize(payload.build));
    }
    // and the compressed bytes themselves decode cross-wise
    const zlibBytes = zlib.deflateRawSync(Buffer.from(shareJson(payload)));
    const streamBack = new TextDecoder().decode(
      await platformCodec().inflate(new Uint8Array(zlibBytes)),
    );
    expect(streamBack).toBe(shareJson(payload));
    const streamBytes = await platformCodec().deflate(new TextEncoder().encode(shareJson(payload)));
    expect(zlib.inflateRawSync(Buffer.from(streamBytes)).toString()).toBe(shareJson(payload));
  });

  test('parseShareUrl refuses garbage', async () => {
    await expect(parseShareUrl('https://example.dev/')).rejects.toThrow();
    await expect(parseShareUrl('https://example.dev/#top')).rejects.toThrow();
    await expect(parseShareUrl('#s=not!!base64**')).rejects.toThrow();
    await expect(parseShareUrl('#s=AAAA')).rejects.toThrow(); // valid b64url, junk payload
  });

  test('extractShareRef distinguishes shares from ordinary fragments', () => {
    expect(extractShareRef('http://x/#s=abc-_123')).toBe('abc-_123');
    expect(extractShareRef('abc-_123')).toBe('abc-_123');
    expect(extractShareRef('http://x/#top')).toBeNull();
    expect(extractShareRef('http://x/#other=1')).toBeNull();
  });

  test('a bad hash or version is refused before any physics', async () => {
    await expect(
      encodeShareUrl({ ...payload, hash: 'nope nope' } as never),
    ).rejects.toBeInstanceOf(Error);
    expect(() => shareJson({ ...payload, hash: 'ZZ000000' } as never)).toThrow();
    expect(() => fromShareJson('{"build":{},"hash":"ca06ebea","levelId":"l","seed":0,"v":2}')).toThrow();
  });

  test('base64url is url-safe both ways', () => {
    const bytes = new Uint8Array(Array.from({ length: 256 }, (_, i) => i));
    const text = base64urlEncode(bytes);
    expect(text).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(base64urlDecode(text)).toEqual(bytes);
  });
});
