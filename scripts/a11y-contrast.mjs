#!/usr/bin/env node
// Stage 6 a11y audit: WCAG 1.4.3 contrast for every UI text pair, COMPUTED
// FROM THE REAL STYLESHEET. Every color below is RESOLVED out of
// src/ui/shell.css (plus the one inline cssText in src/boot.ts that styles
// #gw-sound-toggle) — the table lists WHERE each pair lives (selector +
// property), never a hand-keyed hex. Consequence, and the point: edit a
// color in the CSS and these numbers move. Regress one below its floor and
// this script goes red; delete or rename a declaration the table references
// and it goes red with DRIFT (the table cannot silently audit a color the
// page no longer wears). Mutation-proof by construction: flip a color, run
// `node scripts/a11y-contrast.mjs`, watch it fail, flip it back.
//
// Alpha layers are composited over the stated base first; a `dim` factor is
// READ from the CSS `opacity` declaration itself (locked/used-up controls).
// Large text (>=24px) needs 3:1; everything else 4.5:1; non-text UI 3:1.
// Disabled controls are WCAG-exempt (exempt: true) — we still print the
// number so the audit note can say it. The px sizes stay declared per row as
// the CONSERVATIVE floor of the selectors in that row (a font-size the CSS
// raises only makes the requirement easier; a smaller real size would need
// the row's px lowered — the eyeball limit of reading geometry here).
// Run: node scripts/a11y-contrast.mjs

import { readFileSync } from 'node:fs';

const cssSrc = readFileSync(new URL('../src/ui/shell.css', import.meta.url), 'utf8');
const bootSrc = readFileSync(new URL('../src/boot.ts', import.meta.url), 'utf8');

// ---------------------------------------------------------------- CSS read
// Strip comments and flatten rules. @media wrappers contribute no color of
// their own here, and the brace scan naturally parses their INNER rules in
// document order (last declaration wins, as the cascade does for equal
// specificity, which is all this table needs).
const cssText = cssSrc.replace(/\/\*[\s\S]*?\*\//g, '');
const rules = []; // { sels: string[], decls: Map<string, string>, src: string }
for (const [, selText, body] of cssText.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
  const sels = selText
    .replaceAll('}', ' ')
    .split(',')
    .map((s) => s.replace(/\s+/g, ' ').trim())
    .filter((s) => s !== '' && !s.includes('@'));
  if (sels.length === 0) continue;
  const decls = new Map();
  for (const part of body.split(';')) {
    const i = part.indexOf(':');
    if (i < 0) continue;
    decls.set(part.slice(0, i).trim().toLowerCase(), part.slice(i + 1).trim());
  }
  rules.push({ sels, decls, src: 'src/ui/shell.css' });
}
// The one inline style the audit covers: #gw-sound-toggle's authored cssText
// in src/boot.ts (it floats over the canvas and lives nowhere in the CSS).
const inline = bootSrc.match(/soundToggle\.style\.cssText\s*=\s*\n?\s*'([^']+)'/);
if (!inline) fail(`DRIFT: src/boot.ts no longer styles #gw-sound-toggle with a single cssText literal — reconcile this script`);
{
  const decls = new Map();
  for (const part of inline[1].split(';')) {
    const i = part.indexOf(':');
    if (i < 0) continue;
    decls.set(part.slice(0, i).trim().toLowerCase(), part.slice(i + 1).trim());
  }
  rules.push({ sels: ['#gw-sound-toggle'], decls, src: 'src/boot.ts' });
}

const drift = (msg) => fail(`DRIFT: ${msg}`);
function fail(msg) {
  console.error(msg);
  process.exit(1);
}

/** The winning declaration's VALUE for `prop` on exactly `sel`. */
function decl(sel, prop) {
  for (let i = rules.length - 1; i >= 0; i--) {
    const r = rules[i];
    if (!r.sels.includes(sel)) continue;
    if (r.decls.has(prop)) return { value: r.decls.get(prop), src: r.src };
  }
  return null;
}

/** The first color token in a value (hex, rgb(), rgba()) as {c:[r,g,b], a}. */
function colorToken(value) {
  const m = value.match(
    /(#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b|rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(?:,\s*[\d.]+\s*)?\))/,
  );
  if (!m) return null;
  const t = m[0];
  if (t.startsWith('#')) {
    let h = t.slice(1);
    if (h.length === 3) h = [...h].map((c) => c + c).join('');
    return { c: [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)), a: 1, hex: t.toLowerCase() };
  }
  const n = t.match(/[\d.]+/g).map(Number);
  return { c: n.slice(0, 3), a: n.length > 3 ? n[3] : 1, hex: t };
}

/** The resolved color of `sel`'s `prop` declaration. `inherit` follows the
 *  one authored inherit chain in this shell (toolbar buttons → body ink).
 *  `transparent` resolves to null (no layer — the parent's bg shows). */
function colorOf(sel, prop, seen = 0) {
  const d = decl(sel, prop) ?? decl(sel, prop === 'background' ? 'background-color' : prop);
  if (!d) drift(`no \`${prop}\` declaration for \`${sel}\` in the CSS this table claims`);
  if (d.value === 'inherit') {
    if (seen > 2) drift('`inherit` chain longer than the shell\'s one (button → body)');
    return colorOf('body', 'color', seen + 1);
  }
  if (/^(transparent|none)$/.test(d.value)) return null;
  const t = colorToken(d.value);
  if (!t) drift(`\`${sel} { ${prop}: ${d.value} }\` carries no color token — this script reads colors, reconcile`);
  return t;
}

const opacityOf = (sel) => {
  const d = decl(sel, 'opacity');
  if (!d) drift(`no \`opacity\` declaration for \`${sel}\``);
  return Number(d.value);
};

// ------------------------------------------------------------------ colour
const over = (fg, a, bg) => fg.map((c, i) => c * a + bg[i] * (1 - a));
const lum = (rgb) => {
  const srgb = (c) => (c / 255 <= 0.04045 ? c / 255 / 12.92 : ((c / 255 + 0.055) / 1.055) ** 2.4);
  return 0.2126 * srgb(rgb[0]) + 0.7152 * srgb(rgb[1]) + 0.0722 * srgb(rgb[2]);
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
const hexOf = (t) => (t.hex.startsWith('#') ? t.hex : `rgba(${t.c.join(',')},${t.a})`);
const rgbHex = (rgb) => '#' + rgb.map((c) => Math.round(c).toString(16).padStart(2, '0')).join('');
const same = (p, q) => p.c.join() === q.c.join() && p.a === q.a;

// ------------------------------------------------------------------- table
// Each row states the PAIR AS THE PAGE MAKES IT: fg from `fg`'s `fgProp`
// (an array asserts every selector in the row declares the SAME ink — they
// are one visual style and must not drift apart), over `over` composited on
// `base`'s own background, optionally dimmed by `dimSel`'s own CSS opacity.
// kind 'ui' = non-text (3:1). exempt = WCAG-disabled.
const rows = [
  { label: 'body copy (h1, status, callout)', fg: 'body', px: 16, base: 'body' },
  { label: '#gw-hash-details (fingerprint)', fg: '#gw-hash-details', px: 11, base: 'body' },
  { label: '#gw-piece-count / #gw-ghost-state / #gw-target-label', fg: ['#gw-piece-count', '#gw-ghost-state', '#gw-target-label'], px: 12, base: 'body' },
  { label: '#gw-tray-reason', fg: '#gw-tray-reason', px: 12, base: 'body' },
  { label: '#gw-level-lockline / .gw-level-rules / #gw-replay-tagline / #gw-replay-time', fg: ['.gw-level-lockline', '.gw-level-rules', '#gw-replay-tagline', '#gw-replay-time', '#gw-replay-verify'], px: 11, base: 'body' },
  { label: '#gw-dev-preview badge', fg: '#gw-dev-preview', px: 11, base: 'body', over: ['#gw-dev-preview'] },
  { label: '#gw-sound-toggle (over canvas; paper worst-case)', fg: '#gw-sound-toggle', px: 12, base: 'body', over: ['#gw-sound-toggle'] },
  { label: 'tray/control buttons', fg: '#gw-tray button', px: 13, base: '#gw-tray button' },
  { label: 'tray button aria-pressed', fg: '#gw-tray button', px: 13, base: '#gw-tray button', over: ["#gw-tray button[aria-pressed='true']"] },
  { label: 'tray button used-up (aria-disabled, EXEMPT)', fg: '#gw-tray button', dimSel: "#gw-tray button[aria-disabled='true']", px: 13, base: '#gw-tray button', exempt: true },
  // the ?levels rungs wear no authored face of their own (UA button box on
  // the page); the nearest authored button face in the shell is the tray's,
  // and the row exists only to print the EXEMPT dim number.
  { label: 'level-select locked rung (aria-disabled, EXEMPT)', fg: 'body', dimSel: ".gw-levelselect button[aria-disabled='true']", px: 13, base: '#gw-tray button', exempt: true },
  { label: 'result panel body', fg: '#gw-result', px: 14, base: 'body', over: ['#gw-result'] },
  { label: 'result panel body (worst bg: the canvas behind it)', fg: '#gw-result', px: 14, base: '#gw-stage canvas', over: ['#gw-result'] },
  { label: 'result panel #gw-result-rules (opacity)', fg: '#gw-result', dimSel: '#gw-result-rules', px: 11, base: 'body', over: ['#gw-result'] },
  { label: 'result panel note italic', fg: '#gw-result', px: 14, base: 'body', over: ['#gw-result'] },
  { label: 'result panel buttons', fg: '#gw-result-buttons button', px: 13, base: 'body', over: ['#gw-result', '#gw-result-buttons button'] },
  { label: '#gw-hiccup', fg: '#gw-hiccup', px: 15, base: 'body', over: ['#gw-hiccup'] },
  { label: 'share URL field', fg: '#gw-result-share-url', px: 11, base: '#gw-result-share-url' },
  { label: '#gw-replay-badge', fg: '#gw-replay-badge', px: 12, base: '#gw-replay-badge' },
  { label: 'replay play/speed buttons', fg: '#gw-replay-play', px: 13, base: '#gw-replay-play' },
  { label: 'replay head marker (non-text UI)', fg: '#gw-replay-head', fgProp: 'background', kind: 'ui', base: '#gw-replay-timeline' },
  { label: 'replay event tick (non-text UI)', fg: '.gw-replay-tick', fgProp: 'background', kind: 'ui', base: '#gw-replay-timeline' },
  { label: 'tray/control button border (non-text UI)', fg: '#gw-tray button', fgProp: 'border', kind: 'ui', base: 'body' },
  { label: 'focus ring on paper (non-text)', fg: ':focus-visible', fgProp: 'outline', kind: 'ui', base: 'body' },
  { label: 'focus ring on panel (non-text)', fg: '#gw-result :focus-visible', fgProp: 'outline-color', kind: 'ui', base: 'body', over: ['#gw-result'] },
  { label: 'focus ring on panel, bright canvas behind', fg: '#gw-result :focus-visible', fgProp: 'outline-color', kind: 'ui', base: '#gw-stage canvas', over: ['#gw-result'] },
];

// ------------------------------------------------------------------ compute
const PAPER = colorOf('body', 'background');
if (PAPER.a !== 1) drift('body background must be the opaque page base');
let fails = 0;
console.log('pair'.padEnd(60), 'fg -> bg'.padEnd(28), 'ratio   need  verdict');
for (const r of rows) {
  const fgSels = Array.isArray(r.fg) ? r.fg : [r.fg];
  let fg = colorOf(fgSels[0], r.fgProp ?? 'color');
  for (const s of fgSels.slice(1)) {
    const t = colorOf(s, r.fgProp ?? 'color');
    if (!same(fg, t)) drift(`one visual style split across selectors disagrees: \`${fgSels[0]}\` ${hexOf(fg)} vs \`${s}\` ${hexOf(t)}`);
  }
  // background stack: the base face, then each `over` layer composited on
  // top (a transparent layer adds nothing — the parent shows through).
  const baseTok = colorOf(r.base, 'background');
  if (baseTok === null || baseTok.a !== 1) drift(`base \`${r.base}\` has no opaque background`);
  let bgRgb = baseTok.c;
  for (const layer of r.over ?? []) {
    const t = colorOf(layer, 'background');
    if (t === null) continue;
    bgRgb = over(t.c, t.a, bgRgb);
  }
  let fgRgb = fg.c;
  if (r.dimSel) {
    const dim = opacityOf(r.dimSel);
    // ancestor opacity: the text and its own face BOTH composite over paper
    fgRgb = over(fgRgb, dim, bgRgb);
    bgRgb = over(bgRgb, dim, PAPER.c);
  }
  const rr = ratio(fgRgb, bgRgb);
  const need = r.kind === 'ui' ? 3 : r.px >= 24 ? 3 : 4.5;
  const ok = rr >= need;
  if (!ok && !r.exempt) fails++;
  console.log(
    r.label.slice(0, 60).padEnd(60),
    `${hexOf(fg)} on ${rgbHex(bgRgb)}`.slice(0, 28).padEnd(28),
    rr.toFixed(2).padStart(5),
    ` ${need.toFixed(1)}  ${r.exempt ? 'EXEMPT (disabled)' : ok ? 'pass' : 'FAIL'}`,
  );
}
console.log(fails === 0 ? '\nall non-exempt pairs pass (colors resolved from src/ui/shell.css + src/boot.ts)' : `\n${fails} failing pair(s) to fix`);
process.exit(fails === 0 ? 0 : 1);
