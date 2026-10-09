/**
 * THE ERROR BOUNDARY (program T0.4, the engineering evaluation's R2/R3 fix —
 * ONE affordance, the "debug face" rule): no unexpected error anywhere in
 * the shipped pages may land on a frozen canvas, a half-page, or silence.
 *
 * The law is small:
 * - `window` `error` / `unhandledrejection` (registered NON-capture, so
 *   resource-load noise never trips it) → flush the edit autosave FIRST
 *   (the crash must not cost the player the build they were placing), then
 *   show one honest overlay with a Reload affordance, and mark the page
 *   stopped so the frame loops freeze CLEANLY instead of re-throwing every
 *   frame (the R2 "silently stuttering world" shape).
 * - A failed PAGE START (the boot's page starter catches it: a rejected
 *   set-chunk import on a bad network, any throw before the builder
 *   exists) shows the SAME face with Retry instead — never a half-page
 *   with an h1 and no Launch button (R3). Retry re-enters the DOCUMENT:
 *   a failed chunk fetch is cached as an errored module by the browser's
 *   module map, so an in-page re-import of the same URL can only reject
 *   again — re-navigating is the only honest Retry for a boot failure.
 * - The overlay is the only new surface; the `webglcontextlost` hiccup
 *   overlay stays the separate, recoverable face it already is.
 *
 * Nothing here touches the sim, the hashes, or the verdicts; the e2e proof
 * is `tests/e2e/error-boundary.spec.ts`.
 */
let stopped = false;
let shown = false;
let flusher: (() => void) | null = null;

/** Register the listeners; `boot()` calls this once before routing. */
export function installErrorBoundary(): void {
  window.addEventListener('error', () => fatal());
  window.addEventListener('unhandledrejection', () => fatal());
}

/** The game page registers its edit-autosave flush here, so a crash
 *  before the next `pagehide` still writes the latest edit. */
export function registerAutosaveFlush(fn: () => void): void {
  flusher = fn;
}

/** True once the boundary owns the page — the frame loops of the game and
 *  the replay check THIS before scheduling the next rAF (freeze honestly). */
export function boundaryStopped(): boolean {
  return stopped;
}

/** A failed page start: the boot's page starter routes every rejection /
 *  throw from a page boot here — the Retry affordance re-enters the
 *  document (see the header's module-map law); a still-broken network
 *  re-shows this same face, which is the honest loop, not a half-page. */
export function failedToStart(): void {
  show(true);
}

function fatal(): void {
  try {
    flusher?.();
  } catch {
    // storage is already the least of it — the face below is the promise
  }
  show(false);
}

function show(isBootFailure: boolean): void {
  if (shown) return; // one face, no pile-up under a persistent throw
  shown = true;
  stopped = true;
  document.getElementById('gw-error')?.remove();
  const box = document.createElement('div');
  box.id = 'gw-error';
  box.setAttribute('role', 'alert');
  box.style.cssText =
    'position:fixed;inset:0;z-index:100;display:flex;align-items:center;justify-content:center;' +
    'background:rgba(30,24,16,0.6);font:14px system-ui,sans-serif';
  const card = document.createElement('div');
  card.style.cssText =
    'background:#fff8ec;color:#3a2e1c;border:1px solid #b9915a;border-radius:8px;padding:16px 20px;max-width:28em';
  const note = document.createElement('p');
  note.id = 'gw-error-note';
  note.textContent = isBootFailure
    ? 'something broke while opening this page — your save is untouched.'
    : 'something broke. your latest build was saved — reload to try again.';
  card.appendChild(note);
  const row = document.createElement('p');
  row.style.cssText = 'margin:10px 0 0;display:flex;gap:8px';
  if (isBootFailure) {
    const btn = document.createElement('button');
    btn.id = 'gw-error-retry';
    btn.type = 'button';
    btn.textContent = 'Retry';
    // document re-entry, not an in-page re-run: the module map has already
    // cached the failed chunk fetch (header) — a fresh document is the try
    btn.addEventListener('click', () => window.location.reload());
    row.appendChild(btn);
  }
  const reload = document.createElement('button');
  reload.id = 'gw-error-reload';
  reload.type = 'button';
  reload.textContent = 'Reload';
  reload.addEventListener('click', () => window.location.reload());
  row.appendChild(reload);
  card.appendChild(row);
  box.appendChild(card);
  document.body.appendChild(box);
}
