/**
 * Builds: the serialisable core of a level attempt, and the only thing the rest
 * of the game gets to read about a track.
 *
 *     Build       { levelId, pieces: PlacedPiece[], seed }   // share payload core
 *     PlacedPiece { def, params, transform: Mat4, seq }
 *
 * `seq` is the canonical order (`canonicalBuild`), `transform` carries a placed
 * piece from piece-local space to world space, and everything downstream —
 * meshes, colliders, camera rail, the deterministic hash — is derived, never
 * stored. That is what makes a share link replayable: (level, build, seed) is a
 * complete description with no hidden world state (Track Kit invariants 3 and 4).
 *
 * `serialize` writes canonical JSON: object keys in ascending alphabetical
 * order at every level, no whitespace, numbers by their shortest round-trip
 * repr, matrices as their 16 float64 elements in three's column-major order.
 * Byte-identical output from equal builds is therefore possible, which is what
 * lets a share link be compared by hash.
 */
import * as THREE from 'three';
import { PIECES, defaultParams, type PieceKind, type PieceParams } from './pieces.ts';
import { canonicalBuild, fitSocket, SNAP_TRANSLATION_TOL } from './snap.ts';
import { TrackSpline } from './spline.ts';
import { socketGap, transformSocket, type Socket } from './socket.ts';

export interface PlacedPiece {
  def: PieceKind;
  params: PieceParams;
  transform: THREE.Matrix4;
  seq: number;
}

export interface Build {
  levelId: string;
  pieces: PlacedPiece[];
  seed: number;
}

/**
 * Turn a build into the geometry the world is built from: one spline per
 * placed piece, in canonical order, with the piece transform applied.
 */
export function reify(build: Build): { splines: TrackSpline[]; pieces: PlacedPiece[] } {
  const pieces = canonicalBuild(build.pieces);
  const splines = pieces.map((piece) => {
    const def = PIECES[piece.def];
    if (!def) throw new Error(`reify: unknown piece kind "${String(piece.def)}"`);
    return def.spline(piece.params).transformed(piece.transform);
  });
  return { splines, pieces };
}

/**
 * Lay pieces end to end: each piece is seated on the previous piece's exit
 * socket by `fitSocket`, seq assigned in order. Pure — nothing here reads the
 * world, so the same list always produces the same build.
 */
export function chain(
  kinds: readonly PieceKind[],
  options: {
    params?: Partial<Record<PieceKind, PieceParams>>;
    levelId?: string;
    seed?: number;
    start?: THREE.Matrix4;
  } = {},
): Build {
  let cursor: Socket = { pos: new THREE.Vector3(), tangent: new THREE.Vector3(1, 0, 0), up: new THREE.Vector3(0, 1, 0) };
  if (options.start) cursor = transformSocket(cursor, options.start);
  const pieces: PlacedPiece[] = [];
  kinds.forEach((def, index) => {
    const params = options.params?.[def] ?? defaultParams(def);
    const [inSocket, outSocket] = PIECES[def].sockets(params);
    const transform = fitSocket(cursor, inSocket);
    pieces.push({ def, params, transform, seq: index });
    cursor = transformSocket(outSocket, transform);
  });
  return { levelId: options.levelId ?? 'sandbox', pieces, seed: options.seed ?? 0 };
}

/**
 * The build-time OCCURRENCE RULE for fixtures (moved here from `src/boot.ts`
 * when the render-side fixture signal needed the same classifier without a
 * boot <-> world import cycle; boot re-exports). A piece is a fixture only
 * while its kind's FIXTURE QUOTA is not yet filled — `fixtures[k]` copies of
 * kind `k`, in build order — NOT every piece whose kind merely APPEARS in the
 * table (the kitchen02 empty-tray fault; see Concepts/Levels). The single
 * home keeps the boot mount, the parity probe, the piece counter and the
 * deck-inlay signal from ever disagreeing about which copy of a shared kind
 * is the fixture's.
 */
export function fixtureQuota(
  fixtures: Partial<Record<PieceKind, number>>,
): (def: PieceKind) => boolean {
  const left: Partial<Record<PieceKind, number>> = { ...fixtures };
  return (def) => {
    const n = left[def] ?? 0;
    if (n <= 0) return false;
    left[def] = n - 1;
    return true;
  };
}

/**
 * THE PAST-GOAL SEAT — ONE source for the two sentences that point at the
 * same piece (the final-sheet probe, item (c): the failure note said
 * `the straight sits past the cup — pull it back` while the Remove button
 * only ever took the LAST piece placed, so on 3 of 6 sandboxes the advice
 * owned no verb). THE ORPHAN-PAST-GOAL reading of the build graph: the
 * index of the FIRST piece (array order — placement order) whose ENTRY is
 * joined to the OPEN EXIT of the goal fixture (the one kind the registry
 * gives a `captureVolume`, at its FIRST occurrence, the same piece
 * `goalNounFor` names), or -1 when the build has no goal or nothing sits
 * past it. The join test is the walk's own (`SNAP_TRANSLATION_TOL`), so
 * the seat the sentence names is the seat the graph sees.
 *
 * WHAT THIS DECIDES AND WHAT IT DOES NOT: this is the join fact only — a
 * pure read of the build, the same law every derivation in this file
 * keeps (no World, no physics, no hash). WHO MAY NAME the piece is the
 * caller's rule and both callers read the same index: the note
 * (`moveHintFor` in `src/ui/advice.ts`) names it only when the piece is
 * NOT a fixture occurrence (kitchen02's authored run-out curve stays
 * silent); the button (`removeIndex` in `src/ui/builder.ts`) TARGETS it
 * only under the same fixture rule plus its own tray-ownership rule —
 * Remove never deletes what the level shipped. Where both stay silent,
 * the shipped LIFO law of Remove is untouched.
 */
export function goalExitJoinIndex(pieces: readonly PlacedPiece[]): number {
  const goalAt = pieces.findIndex((p) => PIECES[p.def]?.captureVolume !== undefined);
  if (goalAt < 0) return -1;
  const goal = pieces[goalAt]!;
  const goalExit = transformSocket(PIECES[goal.def]!.sockets(goal.params)[1], goal.transform);
  return pieces.findIndex(
    (p, i) =>
      i !== goalAt &&
      socketGap(transformSocket(PIECES[p.def]!.sockets(p.params)[0], p.transform), goalExit) <
        SNAP_TRANSLATION_TOL,
  );
}

/** The REMOVE TARGET past the goal — the join fact above filtered by the
 *  two ownership laws Remove has always kept, in ONE pure reading (the
 *  button, the note-side claim, and the pull-back verification sweep all
 *  call THIS): a kind the tray does not stock is not the button's to take
 *  (`trayKinds`, the same gate the LIFO scan obeys; `null` = no tray =
 *  every placed piece is the player's), and the FIRST `fixtures[kind]`
 *  occurrences in array order are what the level shipped (the occurrence
 *  quota `playerPieceCount` applies). -1 = nothing REMOVABLE sits past
 *  the goal, and the LIFO law stands untouched. */
export function pullbackTargetIndex(
  pieces: readonly PlacedPiece[],
  fixtures: Partial<Record<PieceKind, number>> | undefined,
  trayKinds: ReadonlySet<PieceKind> | null,
): number {
  const at = goalExitJoinIndex(pieces);
  if (at < 0) return -1;
  const p = pieces[at]!;
  if (trayKinds && !trayKinds.has(p.def)) return -1;
  const quota = fixtureQuota(fixtures ?? {});
  for (let i = 0; i < at; i++) quota(pieces[i]!.def);
  if (quota(p.def)) return -1; // the occurrence IS a fixture — not the player's
  return at;
}

// ---- canonical JSON --------------------------------------------------------

function canonical(value: unknown): string {
  if (value === null) return 'null';
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('serialize: non-finite number in build');
    return JSON.stringify(value);
  }
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value instanceof THREE.Matrix4) return canonical(value.elements as unknown as number[]);
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).filter(([, v]) => v !== undefined);
    entries.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`).join(',')}}`;
  }
  throw new Error(`serialize: cannot encode ${typeof value}`);
}

/** Canonical JSON for a build — equal builds produce identical bytes. */
export function serialize(build: Build): string {
  if (typeof build.levelId !== 'string') throw new Error('serialize: build.levelId must be a string');
  if (!Number.isInteger(build.seed)) throw new Error('serialize: build.seed must be an integer');
  const pieces = canonicalBuild(build.pieces).map((p) => ({
    def: p.def,
    params: p.params,
    seq: p.seq,
    transform: p.transform,
  }));
  return canonical({ levelId: build.levelId, pieces, seed: build.seed });
}

/** Parse a build back, in canonical order. Throws on anything malformed. */
export function deserialize(json: string): Build {
  const raw: unknown = JSON.parse(json);
  if (typeof raw !== 'object' || raw === null) throw new Error('deserialize: not an object');
  const obj = raw as Record<string, unknown>;
  if (typeof obj.levelId !== 'string') throw new Error('deserialize: levelId must be a string');
  if (typeof obj.seed !== 'number' || !Number.isInteger(obj.seed)) {
    throw new Error('deserialize: seed must be an integer');
  }
  if (!Array.isArray(obj.pieces)) throw new Error('deserialize: pieces must be an array');
  const pieces = obj.pieces.map((rawPiece, index) => {
    if (typeof rawPiece !== 'object' || rawPiece === null) {
      throw new Error(`deserialize: piece ${index} is not an object`);
    }
    const p = rawPiece as Record<string, unknown>;
    if (typeof p.def !== 'string' || !(p.def in PIECES)) {
      throw new Error(`deserialize: piece ${index} has unknown def ${JSON.stringify(p.def)}`);
    }
    if (!Array.isArray(p.transform) || p.transform.length !== 16 || p.transform.some((n) => typeof n !== 'number')) {
      throw new Error(`deserialize: piece ${index} transform must be 16 numbers`);
    }
    if (typeof p.seq !== 'number' || !Number.isFinite(p.seq)) {
      throw new Error(`deserialize: piece ${index} seq must be a number`);
    }
    const params: PieceParams = {};
    if (p.params !== undefined) {
      if (typeof p.params !== 'object' || p.params === null) {
        throw new Error(`deserialize: piece ${index} params must be an object`);
      }
      for (const [k, v] of Object.entries(p.params as Record<string, unknown>)) {
        if (typeof v !== 'number' || !Number.isFinite(v)) {
          throw new Error(`deserialize: piece ${index} param ${k} must be a finite number`);
        }
        (params as Record<string, number>)[k] = v;
      }
    }
    return {
      def: p.def as PieceKind,
      params,
      transform: new THREE.Matrix4().fromArray(p.transform as number[]),
      seq: p.seq,
    };
  });
  return { levelId: obj.levelId, pieces: canonicalBuild(pieces), seed: obj.seed };
}

/**
 * FNV-1a over the quantised samples of a reified build — the "hash of a reified
 * rig" Track Kit invariant 3 talks about. 32 samples per spline at fixed t, so
 * the fingerprint depends only on the geometry, never on tessellation choices.
 * A non-finite value poisons the hash with a distinct constant instead of
 * quietly folding into zero.
 */
export function rigFingerprint(build: Build, samplesPerSpline = 32): string {
  const { splines } = reify(build);
  let h = 0x811c9dc5 >>> 0;
  const mix = (word: number): void => {
    h = ((h ^ (word >>> 0)) >>> 0);
    h = Math.imul(h, 0x01000193) >>> 0;
  };
  const quant = (x: number): void => {
    if (!Number.isFinite(x)) {
      mix(0xdeadbead);
      return;
    }
    mix(Math.round(x * 1e6) | 0);
  };
  mix(samplesPerSpline);
  for (const spline of splines) {
    mix(Math.round(spline.length * 1e6) | 0);
    for (let i = 0; i < samplesPerSpline; i++) {
      const f = spline.sample(samplesPerSpline === 1 ? 0 : i / (samplesPerSpline - 1));
      quant(f.pos.x);
      quant(f.pos.y);
      quant(f.pos.z);
      quant(f.tangent.x);
      quant(f.tangent.y);
      quant(f.tangent.z);
      quant(f.up.x);
      quant(f.up.y);
      quant(f.up.z);
    }
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}
