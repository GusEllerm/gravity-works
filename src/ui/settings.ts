/**
 * `src/ui/settings.ts` — the SAVE settings row (T0.3 / R1, Recommendations
 * 2026-10-09 technical §2): the export/import escape hatch that already
 * existed in `src/save/save.ts` (`downloadSaveFile`/`importSaveFile`, both
 * tested) finally gets its ONE UI row, plus the honest face of the
 * quarantine.
 *
 * The law of this file is one line long: the player's damaged bytes are
 * never erased and never hidden. `migrateBlob`'s failure paths stash the
 * raw bytes under `gravity-works.save.corrupt-<n>` (see `src/save/save.ts`);
 * here they become ONE visible sentence — "A damaged save was set aside —
 * recover it here." — with a restore per copy. Every write this UI performs
 * is validated THROUGH the migrate machinery first (`salvageBlob` /
 * `importSaveFile`): a file that cannot be read is rejected with an honest
 * note, it never replaces the live save.
 *
 * Layout law (same as `#gw-sound`): absolutely positioned corner, zero
 * layout flow, `pointer-events:auto` on the controls only — the committed
 * shell baseline is a canvas-element screenshot and nothing here may
 * reflow it.
 */
import {
  downloadSaveFile,
  listQuarantined,
  loadSave,
  replaceSave,
  salvageBlob,
} from '../save/save.ts';

interface SaveWindow extends Window {
  /** e2e seam (debug surface, not UI): the race specs drive the real
   *  write paths through these exact functions. */
  __gwSave?: unknown;
}

const buttonStyle =
  'pointer-events:auto;font:12px system-ui,sans-serif;padding:2px 8px;border-radius:4px;border:1px solid rgba(185,163,124,0.7);background:rgba(255,248,236,0.78);color:#6a5636;cursor:pointer';

export function createSaveSettings(root: HTMLElement, win: Window & typeof globalThis = window): void {
  const wrap = document.createElement('div');
  wrap.id = 'gw-save';
  wrap.style.cssText =
    'position:absolute;bottom:8px;right:12px;z-index:4;display:flex;flex-direction:column;align-items:flex-end;gap:4px;font:12px system-ui,sans-serif';

  const toggle = document.createElement('button');
  toggle.id = 'gw-save-toggle';
  toggle.type = 'button';
  toggle.textContent = 'Save';
  toggle.setAttribute('aria-expanded', 'false');
  toggle.style.cssText = buttonStyle;

  const panel = document.createElement('div');
  panel.id = 'gw-save-panel';
  panel.style.cssText =
    'display:none;flex-direction:column;align-items:flex-end;gap:4px;padding:6px;border-radius:6px;background:rgba(255,248,236,0.92);border:1px solid rgba(185,163,124,0.7);color:#6a5636';

  const exportButton = document.createElement('button');
  exportButton.id = 'gw-save-export';
  exportButton.type = 'button';
  exportButton.textContent = 'Export save file';
  exportButton.style.cssText = buttonStyle;
  exportButton.addEventListener('click', () => downloadSaveFile(loadSave()));

  const importLabel = document.createElement('label');
  importLabel.htmlFor = 'gw-save-import';
  importLabel.textContent = 'Import save file';
  importLabel.style.cssText = 'pointer-events:auto;display:flex;gap:6px;align-items:center';
  const importInput = document.createElement('input');
  importInput.id = 'gw-save-import';
  importInput.type = 'file';
  importInput.accept = 'application/json,.json';
  importInput.style.cssText = 'pointer-events:auto;max-width:170px';
  importLabel.append(importInput);
  importInput.addEventListener('change', async () => {
    const file = importInput.files?.[0];
    if (!file) return;
    try {
      // validate BEFORE accepting — a file the migrade cannot read never
      // touches the live save (see src/save/save.ts importSaveFile)
      replaceSave(await (await import('../save/save.ts')).importSaveFile(file));
      note.textContent = 'Save imported.';
      win.location.reload(); // the boot-time state the imported save describes
    } catch {
      note.textContent = 'Import rejected: that file is not a usable save.';
    }
  });

  const note = document.createElement('div');
  note.id = 'gw-save-note';
  note.textContent = '';

  const quarantineLine = document.createElement('div');
  quarantineLine.id = 'gw-save-quarantine';
  const damaged = listQuarantined();
  if (damaged.length > 0) {
    // THE one honest line (R1): the wipe was renamed, not performed
    quarantineLine.textContent = 'A damaged save was set aside — recover it here.';
    for (const [i, copy] of damaged.entries()) {
      const restore = document.createElement('button');
      restore.id = `gw-save-restore-${i}`;
      restore.type = 'button';
      restore.textContent = `Restore damaged save ${damaged.length > 1 ? `(${i + 1})` : ''}`;
      restore.style.cssText = buttonStyle;
      restore.addEventListener('click', () => {
        const salvaged = salvageBlob(copy.raw);
        if (!salvaged.ok) {
          note.textContent = 'That copy is too damaged to restore — its bytes stay set aside.';
          return;
        }
        replaceSave(salvaged.data);
        win.location.reload();
      });
      quarantineLine.append(' ', restore);
    }
  }

  toggle.addEventListener('click', () => {
    const open = panel.style.display === 'none';
    panel.style.display = open ? 'flex' : 'none';
    toggle.setAttribute('aria-expanded', String(open));
    if (document.activeElement === toggle) toggle.blur(); // playtests P+Q focus policy
  });

  panel.append(exportButton, importLabel, note, quarantineLine);
  wrap.append(panel, toggle);
  root.appendChild(wrap); // page-corner absolute: zero layout flow

  // e2e seam (debug surface, not UI): the cross-tab race spec drives the
  // REAL write paths — a stale-envelope merge is only honest through the
  // functions the game itself uses.
  void import('../save/save.ts').then((save) => {
    (win as SaveWindow).__gwSave = {
      loadSave: save.loadSave,
      saveSave: save.saveSave,
      replaceSave: save.replaceSave,
      migrateBlob: save.migrateBlob,
      salvageBlob: save.salvageBlob,
      listQuarantined: save.listQuarantined,
    };
  });
}
