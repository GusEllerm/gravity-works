#!/usr/bin/env node
// Stage 6 a11y audit: WCAG 1.4.3 contrast for every UI text pair in
// src/ui/shell.css (and the inline styles in src/boot.ts), computed from the
// CSS colors against their composited backgrounds. Alpha layers are composited
// over the stated page background first; a `dim` factor models an ancestor
// `opacity` (locked/used-up buttons). Large text (>=24px, or >=18.66px bold)
// needs 3:1; everything else 4.5:1. Disabled controls are WCAG-exempt
// (exempt: true) — we still print the number so the audit note can say it.
// Run: node scripts/a11y-contrast.mjs

const hex = (h) => {
  h = h.replace('#', '');
  if (h.length === 3) h = [...h].map((c) => c + c).join('');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
};
const srgb = (c) => {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const lum = (rgb) => 0.2126 * srgb(rgb[0]) + 0.7152 * srgb(rgb[1]) + 0.0722 * srgb(rgb[2]);
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
// alpha-composite fg over bg (both rgb arrays, fg carries alpha)
const over = (fg, a, bg) => fg.map((c, i) => c * a + bg[i] * (1 - a));
const rgba = (h, a) => ({ c: hex(h), a });

// page/canvas backdrop
const PAPER = hex('#efe0c8');
const panelOver = (bg) => over(hex('#3e2e20'), 0.88, bg); // rgba(62,46,32,.88)

// kind: 'text' (4.5/3 rule via px/bold) | 'ui' (3:1 non-text) | exempt
const rows = [
  ['body copy (h1, status, callout)', '#2c2013', 1, { c: PAPER }, 'text', 16],
  ['#gw-hash-details (fingerprint)', '#6a5636', 1, { c: PAPER }, 'text', 11],
  ['#gw-piece-count / #gw-ghost-state / #gw-target-label / #gw-tray-reason', '#6a5636', 1, { c: PAPER }, 'text', 12],
  ['#gw-level-lockline / .gw-level-rules / #gw-replay-tagline / #gw-replay-time / #gw-replay-verify', '#6a5636', 1, { c: PAPER }, 'text', 11],
  ['#gw-dev-preview badge', '#6a5636', 1, { c: over(hex('#fff8ec'), 0.85, PAPER) }, 'text', 11],
  ['#gw-sound-toggle (over canvas; paper worst-case)', '#6a5636', 1, { c: over(hex('#fff8ec'), 0.78, PAPER) }, 'text', 12],
  ['tray/control buttons', '#2c2013', 1, { c: hex('#fff8ec') }, 'text', 13],
  ['tray button aria-pressed', '#2c2013', 1, { c: hex('#f0d9a8') }, 'text', 13],
  ['tray button used-up (aria-disabled, EXEMPT)', '#2c2013', 0.45, { c: hex('#fff8ec') }, 'text', 13, true],
  ['level-select locked rung (aria-disabled, EXEMPT)', '#2c2013', 0.55, { c: hex('#fff8ec') }, 'text', 13, true],
  ['result panel body', '#fdf2e0', 1, { c: panelOver(PAPER) }, 'text', 14],
  ['result panel body (worst bg: bright canvas #fff8ec)', '#fdf2e0', 1, { c: panelOver(hex('#fff8ec')) }, 'text', 14],
  ['result panel #gw-result-rules (opacity .85)', '#fdf2e0', 0.85, { c: panelOver(PAPER) }, 'text', 11],
  ['result panel note italic', '#fdf2e0', 1, { c: panelOver(PAPER) }, 'text', 14],
  ['result panel buttons', '#fdf2e0', 1, { c: panelOver(PAPER) }, 'text', 13],
  ['#gw-hiccup', '#fdf2e0', 1, { c: over(hex('#14100a'), 0.92, PAPER) }, 'text', 15],
  ['share URL field', '#2c2013', 1, { c: hex('#fff8ec') }, 'text', 11],
  ['#gw-replay-badge', '#2c2013', 1, { c: hex('#f0d9a8') }, 'text', 12],
  ['replay play/speed buttons', '#2c2013', 1, { c: hex('#fff8ec') }, 'text', 13],
  ['replay head marker (non-text UI)', '#8a7040', 1, { c: hex('#e6d3b3') }, 'ui'],
  ['replay event tick (non-text UI)', '#a34e15', 1, { c: hex('#e6d3b3') }, 'ui'],
  ['tray/control button border (non-text UI)', '#8a7040', 1, { c: PAPER }, 'ui'],
  ['focus ring #143a6e on paper (non-text)', '#143a6e', 1, { c: PAPER }, 'ui'],
  ['focus ring #ffe1a8 on panel (non-text)', '#ffe1a8', 1, { c: panelOver(PAPER) }, 'ui'],
  ['focus ring #ffe1a8 on panel, bright canvas behind', '#ffe1a8', 1, { c: panelOver(hex('#fff8ec')) }, 'ui'],
];

let fails = 0;
console.log('pair'.padEnd(60), 'ratio   need  verdict');
for (const [label, fg, dim, bgBox, kind, px, exempt] of rows) {
  let fgRgb = hex(fg);
  let bg = bgBox.c;
  let effDim = dim;
  if (dim < 1) {
    // ancestor opacity: text and its own background both composite over the
    // page background at `dim`
    const own = bg; // fg's control background is already composited in bgBox
    fgRgb = over(fgRgb, dim, own);
    bg = over(own, dim, PAPER);
    effDim = 1;
  }
  const r = ratio(fgRgb, bg);
  const large = kind === 'ui' ? true : px >= 24;
  const need = kind === 'ui' ? 3 : large ? 3 : 4.5;
  const ok = r >= need;
  if (!ok && !exempt) fails++;
  console.log(
    label.slice(0, 60).padEnd(60),
    r.toFixed(2).padStart(5),
    ` ${need.toFixed(1)}  ${exempt ? 'EXEMPT (disabled)' : ok ? 'pass' : 'FAIL'}`,
  );
}
console.log(fails === 0 ? '\nall non-exempt pairs pass' : `\n${fails} failing pair(s) to fix`);
process.exit(fails === 0 ? 0 : 1);
