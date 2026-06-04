import { useState, useRef } from 'react';
import { BaseModalViewProps } from '../../../modal/types';
import { useOptions } from '../../../../../options';
import { useMacroStore } from '../../../../../store/useMacroStore';
import { serializeMacros, parseMacroImport, mergeImport } from '../../../../../lib/macroIO';
import { ColorTheme, Lang } from '../../../../../types';
import { SegmentedControl } from '../../../../../shared/ui/SegmentedControl';
import { t } from '../../../../../lib/i18n';

const ALL_PREFIXES = ['/', ';', ':', '#', '!'];

const REPLACEMENT_OPTIONS = [
  { value: 'auto' as const,   label: () => t('replacementMode.autoShort')   },
  { value: 'manual' as const, label: () => t('replacementMode.manualShort') },
];

const THEME_OPTIONS: { value: ColorTheme; label: string }[] = [
  { value: 'humo',  label: 'Humo'  },
  { value: 'acera', label: 'Acera' },
  { value: 'mar',   label: 'Mar'   },
];

const LANGUAGE_OPTIONS: { value: Lang; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
];

type ImportStatus = { ok: boolean; message: string } | null;

export function SettingsView(_props: BaseModalViewProps) {
  const { prefixes, useCommitKeys, colorTheme, language, togglePrefix, setUseCommitKeys, setColorTheme, setLanguage } = useOptions();
  const [shake, setShake] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<ImportStatus>(null);
  const macros = useMacroStore(s => s.macros);
  const addMacro = useMacroStore(s => s.addMacro);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePrefixClick = (prefix: string) => {
    if (!togglePrefix(prefix)) {
      setShake(prefix);
      setTimeout(() => setShake(null), 400);
    }
  };

  const handleExport = () => {
    const json = serializeMacros(macros);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'monky-macros.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: Event) => {
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    input.value = '';
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = parseMacroImport(reader.result as string);
        if (parsed.length === 0) {
          showImportStatus(false, t('settings.importExport.status.noValidMacros'));
          return;
        }
        const existing = new Set(macros.map(m => m.command));
        const { added, skipped } = mergeImport(parsed, existing, addMacro);
        const message = skipped > 0
          ? t('settings.importExport.status.addedWithSkipped', { added, skipped })
          : t('settings.importExport.status.added', { count: added });
        showImportStatus(true, message);
      } catch {
        showImportStatus(false, t('settings.importExport.status.invalidFile'));
      }
    };
    reader.readAsText(file);
  };

  const showImportStatus = (ok: boolean, message: string) => {
    setImportStatus({ ok, message });
    setTimeout(() => setImportStatus(null), 4000);
  };

  const replacementValue = useCommitKeys ? 'manual' : 'auto';

  return (
    <div className="settings-view">
      <div className="settings-body">

        <div className="settings-group">
          <div className="settings-section-label">{t('settings.sections.general')}</div>
          <div className="settings-rows">
            <div className="settings-row">
              <span className="settings-row-label">{t('options.prefixEditor.title')}</span>
              <div className="horizontal items snug selectable-group">
                {ALL_PREFIXES.map(prefix => {
                  const isSelected = prefixes.includes(prefix);
                  return (
                    <button
                      key={prefix}
                      type="button"
                      role="switch"
                      aria-checked={isSelected}
                      onClick={() => handlePrefixClick(prefix)}
                      className={`btn btn-outlined text-mono settings-prefix-btn ${isSelected ? 'is-selected' : ''} ${shake === prefix ? 'shake' : ''}`}
                    >
                      {prefix}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="settings-row">
              <span className="settings-row-label">{t('replacementMode.title')}</span>
              <SegmentedControl
                options={REPLACEMENT_OPTIONS.map(o => ({ value: o.value, label: o.label() }))}
                value={replacementValue}
                onChange={v => setUseCommitKeys(v === 'manual')}
              />
            </div>
          </div>
        </div>

        <div className="settings-divider" />

        <div className="settings-group">
          <div className="settings-section-label">{t('settings.sections.appearance')}</div>
          <div className="settings-rows">
            <div className="settings-row">
              <span className="settings-row-label">{t('settings.colorTheme')}</span>
              <SegmentedControl
                options={THEME_OPTIONS}
                value={colorTheme}
                onChange={v => setColorTheme(v)}
              />
            </div>
            <div className="settings-row">
              <span className="settings-row-label">{t('settings.language')}</span>
              <SegmentedControl
                options={LANGUAGE_OPTIONS}
                value={language}
                onChange={v => setLanguage(v)}
              />
            </div>
          </div>
        </div>

        <div className="settings-divider" />

        <div className="settings-group">
          <div className="settings-section-label">{t('settings.sections.data')}</div>
          <div className="settings-rows">
            <div className="settings-row">
              <span className="settings-row-label">{t('settings.importExport.title')}</span>
              <div className="horizontal items snug">
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
            </div>
          </div>
        </div>

        {importStatus && (
          <div className={`settings-import-status ${importStatus.ok ? 'import-status--ok' : 'import-status--error'}`}>
            {importStatus.message}
          </div>
        )}

      </div>
    </div>
  );
}
