/**
 * The shell's live-region builder (program T0.2 move-out of `src.boot.ts`):
 * one `<p role=status aria-live=polite>` factory shared by the game page's
 * status/callout lines and the shared-run page's verdict lines — one
 * implementation, one a11y contract.
 */
export function paragraph(id: string, parent: HTMLElement, role = 'status'): HTMLParagraphElement {
  const p = document.createElement('p');
  p.id = id;
  p.setAttribute('role', role);
  p.setAttribute('aria-live', 'polite');
  parent.appendChild(p);
  return p;
}
