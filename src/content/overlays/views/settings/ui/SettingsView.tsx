import { useRef } from 'react';
import { BaseModalViewProps } from '../../../modal/types';
import { useOptions } from '../../../../../options';
import { useMacroImportExport } from '../useMacroImportExport';
import { ColorTheme, Lang } from '../../../../../types';
import { SegmentedControl } from '../../../../../shared/ui/SegmentedControl';
import { SelectableGroup } from '../../../../../shared/ui/SelectableGroup';
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

export function SettingsView(_props: BaseModalViewProps) {
  const { prefixes, useCommitKeys, colorTheme, language, setPrefixes, setUseCommitKeys, setColorTheme, setLanguage } = useOptions();
  const { status: importStatus, exportMacros, importFromFile } = useMacroImportExport();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const replacementValue = useCommitKeys ? 'manual' : 'auto';

  return (
    <div className="settings-view">
      <div className="settings-body">

        <div className="settings-group">
          <div className="settings-section-label">{t('settings.sections.general')}</div>
          <div className="settings-rows">
            <div className="settings-row">
              <span className="settings-row-label">{t('options.prefixEditor.title')}</span>
              <SelectableGroup
                options={ALL_PREFIXES}
                selected={prefixes}
                onChange={setPrefixes}
                className="horizontal items snug"
                buttonClassName="btn btn-outlined text-mono settings-prefix-btn"
              />
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
                <button className="btn btn-outlined" type="button" onClick={exportMacros}>
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
                  onChange={e => {
                    const input = e.currentTarget as HTMLInputElement;
                    const file = input.files?.[0];
                    input.value = '';
                    if (file) importFromFile(file);
                  }}
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
