import { useRef, useState } from 'react';
import { t } from '../../../../../lib/i18n';
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

  function handleImport(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    input.value = '';

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = parseMacroImport(reader.result as string);
        if (parsed.length === 0) {
          showStatus(false, t('settings.importExport.status.noValidMacros'));
          return;
        }
        const existing = new Set(macros.map(m => m.command));
        const { added, skipped } = mergeImport(parsed, existing, addMacro);
        const message = skipped > 0
          ? t('settings.importExport.status.addedWithSkipped', { added, skipped })
          : t('settings.importExport.status.added', { count: added });
        showStatus(true, message);
      } catch {
        showStatus(false, t('settings.importExport.status.invalidFile'));
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="section">
      <h3 className="section-title">{t('settings.importExport.title')}</h3>
      <p className="section-description">
        {t('settings.importExport.description')}
      </p>
      <div className="horizontal blocks snug">
        <button className="btn btn-outlined" type="button" onClick={handleExport}>
          {t('settings.importExport.exportButton')}
        </button>
        <button className="btn btn-outlined" type="button" onClick={() => fileInputRef.current?.click()}>
          {t('settings.importExport.importButton')}
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
