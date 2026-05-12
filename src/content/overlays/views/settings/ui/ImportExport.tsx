import { useRef, useState } from 'react';
import { useMacroStore } from '../../../../../store/useMacroStore';
import { serializeMacros, parseMacroImport, mergeImport } from '../../../../../lib/macroIO';

type Status = { ok: boolean; message: string } | null;

export function ImportExport() {
  const macros = useMacroStore(s => s.macros);
  const addMacro = useMacroStore(s => s.addMacro);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>(null);

  function showStatus(ok: boolean, message: string) {
    setStatus({ ok, message });
    setTimeout(() => setStatus(null), 4000);
  }

  function handleExport() {
    const json = serializeMacros(macros);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'monky-macros.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = parseMacroImport(reader.result as string);
        if (parsed.length === 0) {
          showStatus(false, 'No valid macros found in file');
          return;
        }
        const existing = new Set(macros.map(m => m.command));
        const { added, skipped } = mergeImport(parsed, existing, addMacro);
        const parts = [`${added} added`];
        if (skipped > 0) parts.push(`${skipped} skipped (duplicate command)`);
        showStatus(true, parts.join(', '));
      } catch {
        showStatus(false, 'Invalid file — expected a JSON array');
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="section">
      <h3 className="section-title">Import / Export</h3>
      <p className="section-description">
        Export your macros as JSON to back them up or move them to another device.
        Importing merges macros — duplicates (same command) are skipped.
      </p>
      <div className="horizontal blocks snug">
        <button className="btn btn-outlined" type="button" onClick={handleExport}>
          Export
        </button>
        <button className="btn btn-outlined" type="button" onClick={() => fileInputRef.current?.click()}>
          Import
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          style={{ display: 'none' }}
          onChange={handleImport}
        />
      </div>
      {status && (
        <p className={`section-description import-status ${status.ok ? 'import-status--ok' : 'import-status--error'}`}>
          {status.message}
        </p>
      )}
    </div>
  );
}
