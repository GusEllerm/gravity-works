/**
 * SANDBOX-SCALE FIXTURES for the tally sweep (sheet-fix, 2026-10-12 — the
 * re-probe's verdict: "re-sweep detector thresholds against the SIX sandbox
 * reference builds, not only campaign pars — the sheet is invisible at
 * exactly the scale where free play lives").
 *
 * Two families, BOTH reconstructed from the sheet re-probe's journal
 * (`docs/vault/Sessions/probe-sheet/journal.md`) and the probes' own
 * grammars — the journal recorded NO share payloads and no build bytes, so
 * these are honest GRAMMAR reconstructions, each carrying the time or
 * verdict it was reconstructed against (measured column: the sweep table in
 * `Modules/tally.md`):
 *
 *   - the six NAMED LINES the probe actually minted (bedroom "the lamp
 *     run", bathroom "sink hop", garage "slick skip" — the film-kept
 *     jump-fly-land run that printed `events: []` — porch "to the door",
 *     the garden tour death, and the FIRST probe's kitchen booster→loop
 *     finish), and
 *   - a deterministic 48-build GRAMMAR GRID per sandbox (launch verb ×
 *     release height × deck scale × cup ownership), the sandbox-scale
 *     sample the threshold sweep reads. 48 includes the named line at
 *     index 0; the grid replaces its (pop × 0.28 × 1.0 × fixture) cell.
 *
 * The grid is enumeration, not randomness (the k02-order-table idiom): the
 * same 325 rigs on every machine, forever.
 */
import { kitchenRamp, KITCHEN_GAP } from '../src/world/levels/kitchen01.level.ts';
import type { PlacedSpec } from '../src/world/levels/kitchen01.level.ts';
import type { PieceParams } from '../src/track/pieces.ts';
import { KITCHEN_SANDBOX_ID } from '../src/world/levels/kitchen05.level.ts';
import { BEDROOM_SANDBOX_ID } from '../src/world/levels/bedroom05.level.ts';
import { BATHROOM_SANDBOX_ID } from '../src/world/levels/bathroom05.level.ts';
import { GARDEN_SANDBOX_ID } from '../src/world/levels/garden05.level.ts';
import { GARAGE_SANDBOX_ID } from '../src/world/levels/garage05.level.ts';
import { PORCH_SANDBOX_ID } from '../src/world/levels/porch05.level.ts';
import { porchChute } from '../src/world/levels/porch01.level.ts';

export const SANDBOX_IDS: string[] = [
  KITCHEN_SANDBOX_ID,
  BEDROOM_SANDBOX_ID,
  BATHROOM_SANDBOX_ID,
  GARDEN_SANDBOX_ID,
  GARAGE_SANDBOX_ID,
  PORCH_SANDBOX_ID,
];

/** The sandbox's own flat-deck straight (each room's tray parameter). */
const DECK: Record<string, number> = {
  [KITCHEN_SANDBOX_ID]: 0.175,
  [BEDROOM_SANDBOX_ID]: 0.2,
  [BATHROOM_SANDBOX_ID]: 0.2,
  [GARDEN_SANDBOX_ID]: 0.2,
  [GARAGE_SANDBOX_ID]: 0.2,
  [PORCH_SANDBOX_ID]: 0.11,
};

export const SANDBOX_RAMP: Record<string, PieceParams> = {
  [KITCHEN_SANDBOX_ID]: kitchenRamp(0.3),
  [BEDROOM_SANDBOX_ID]: kitchenRamp(0.28),
  [BATHROOM_SANDBOX_ID]: kitchenRamp(0.28),
  [GARDEN_SANDBOX_ID]: kitchenRamp(0.28),
  [GARAGE_SANDBOX_ID]: kitchenRamp(0.28),
  [PORCH_SANDBOX_ID]: porchChute(),
};

/** A fixture build: a piece list to `lay` plus the provenance the sweep
 *  table publishes next to it. */
export interface NamedFixture {
  name: string;
  levelId: string;
  note: string;
  list: PlacedSpec[];
}

/** THE SIX NAMED LINES — one fixture per sandbox, the exact grammars the
 *  probes reported (times/statuses as the journal states them; the
 *  reconstruction's own measured time is stated next to it in the note). */
export function namedLines(): NamedFixture[] {
  const S = (id: string) => ({ def: 'straight' as const, params: { length: DECK[id] } });
  const L = (id: string, k = 1) => ({ def: 'straight' as const, params: { length: DECK[id] * k } });
  return [
    {
      name: 'kitchen-baseline-finish',
      levelId: KITCHEN_SANDBOX_ID,
      // first probe, 22:08:30: booster→loop→straight + one straight — the
      // run that FINISHED 2.84 s (journal ks-03). Reconstructed 2.53 s.
      note: 'journal 2.84 s FINISH (first probe); the line the re-probe could not re-finish',
      list: [
        { def: 'ramp', params: kitchenRamp(0.3) },
        { def: 'booster' },
        { def: 'loop' },
        L(KITCHEN_SANDBOX_ID),
        L(KITCHEN_SANDBOX_ID),
        { def: 'finishCup' },
      ],
    },
    {
      name: 'bedroom-lamp-run',
      levelId: BEDROOM_SANDBOX_ID,
      // "the lamp run", named 2.80 s PB; the grammar straight→drop→landing
      // +1 landing + the player's cup at the line end.
      note: 'named "the lamp run", journal 2.80 s PB',
      list: [
        { def: 'ramp', params: kitchenRamp(0.28) },
        S(BEDROOM_SANDBOX_ID),
        { def: 'drop', params: KITCHEN_GAP.drop },
        { def: 'landing', params: KITCHEN_GAP.landing },
        { def: 'landing', params: KITCHEN_GAP.landing },
        { def: 'finishCup' },
      ],
    },
    {
      name: 'bathroom-sink-hop',
      levelId: BATHROOM_SANDBOX_ID,
      // "sink hop", 2.58 s — the lip line +landing +my cup; the journal
      // states its flight was evidently under the shipped 0.15 s bar.
      note: 'named "sink hop", journal 2.58 s; short-flight case',
      list: [
        { def: 'ramp', params: kitchenRamp(0.28) },
        S(BATHROOM_SANDBOX_ID),
        { def: 'gapLip', params: KITCHEN_GAP.lip },
        { def: 'drop', params: KITCHEN_GAP.drop },
        { def: 'landing', params: KITCHEN_GAP.landing },
        { def: 'finishCup' },
      ],
    },
    {
      name: 'garden-tour-death',
      levelId: GARDEN_SANDBOX_ID,
      // the tour line + landing + my cup — the journal's byte-identical
      // 2.55 s death (noise past a death point is void).
      note: 'journal 2.55 s fell-off (the past-the-death law)',
      list: [
        { def: 'ramp', params: kitchenRamp(0.28) },
        S(GARDEN_SANDBOX_ID),
        { def: 'curve' },
        S(GARDEN_SANDBOX_ID),
        { def: 'booster' },
        { def: 'landing', params: KITCHEN_GAP.landing },
        S(GARDEN_SANDBOX_ID),
        { def: 'finishCup' },
      ],
    },
    {
      name: 'garage-slick-skip',
      levelId: GARAGE_SANDBOX_ID,
      // THE film-kept run: the gapLip trick + a soft landing + the player's
      // cup at the line end — 3.13 s, JUMPS, FLIES, LANDS, rolls into the
      // cup, and printed `events: []` under the campaign-scale thresholds.
      // This fixture is the retune's red-first gate: it must mint air+catch.
      note: 'named "slick skip", journal 3.13 s — THE film-kept jump-and-land run (red-first fixture)',
      list: [
        { def: 'ramp', params: kitchenRamp(0.28) },
        S(GARAGE_SANDBOX_ID),
        { def: 'gapLip', params: KITCHEN_GAP.lip },
        { def: 'drop', params: KITCHEN_GAP.drop },
        { def: 'landing', params: KITCHEN_GAP.landing },
        S(GARAGE_SANDBOX_ID),
        { def: 'landing', params: KITCHEN_GAP.landing },
        { def: 'finishCup' },
      ],
    },
    {
      name: 'porch-to-the-door',
      levelId: PORCH_SANDBOX_ID,
      // "to the door": two straights + the player's cup nearer the rail —
      // 0.67 s, beat par by 0.53 (the cup-re-anchor spark).
      note: 'named "to the door", journal 0.67 s — the cup-re-anchor spark',
      list: [
        { def: 'ramp', params: porchChute() },
        S(PORCH_SANDBOX_ID),
        S(PORCH_SANDBOX_ID),
        { def: 'finishCup' },
      ],
    },
  ];
}

/** THE GRID — 48 builds per sandbox (index 0 is the named line; the grid
 *  cells behind it are launch × release height × deck scale × cup):
 *    launch: pop (gapLip+drop+landing) | hop (no catch deck) | boost | spring
 *    height: kitchenRamp 0.24 / 0.28 / 0.32
 *    deck:   the room's straight × 0.75 / × 1.25
 *    cup:    the run ends at ONE cup | the player's own cup mid-line with
 *            the line still running past it (the overshoot shape). */
export interface GridFixture {
  name: string;
  levelId: string;
  list: PlacedSpec[];
  named?: boolean;
}

export function gridBuilds(levelId: string): GridFixture[] {
  const out: GridFixture[] = [];
  const named = namedLines().find((f) => f.levelId === levelId)!;
  out.push({ name: `${levelId}#${named.name}`, levelId, list: named.list, named: true });
  for (const launch of ['pop', 'hop', 'boost', 'spring']) {
    for (const h of [0.24, 0.28, 0.32]) {
      for (const k of [0.75, 1.0]) {
        for (const ownCup of [false, true]) {
          if (launch === 'pop' && h === 0.28 && k === 1 && ownCup === false) continue; // the sandbox-reference cell (its own sweep row)
          const s = (scale = 1) => ({ def: 'straight' as const, params: { length: DECK[levelId] * k * scale } });
          const list: PlacedSpec[] = [{ def: 'ramp', params: kitchenRamp(h) }, s()];
          if (launch === 'pop') {
            list.push(
              { def: 'gapLip' as const, params: KITCHEN_GAP.lip },
              { def: 'drop' as const, params: KITCHEN_GAP.drop },
              { def: 'landing' as const, params: KITCHEN_GAP.landing },
              s(),
            );
          } else if (launch === 'hop') {
            list.push({ def: 'gapLip' as const, params: KITCHEN_GAP.lip }, { def: 'drop' as const, params: KITCHEN_GAP.drop }, s());
          } else if (launch === 'boost') {
            list.push({ def: 'booster' as const }, s());
          } else {
            list.push({ def: 'springLauncher' as const }, s());
          }
          if (ownCup) list.push({ def: 'finishCup' as const }, s(1.5));
          list.push({ def: 'finishCup' as const });
          out.push({
            name: `${levelId}#${launch}/${h}/${k}/${ownCup ? 'owncup' : 'cup'}`,
            levelId,
            list,
          });
        }
      }
    }
  }
  return out;
}
