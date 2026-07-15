import { useRef } from 'react';
import { BaseModalViewProps } from '../../../modal/types';
import { useOptions } from '../../../../../options';
import { useMacroImportExport } from '../useMacroImportExport';
import { ColorTheme, Lang } from '../../../../../types';
import { SegmentedControl } from '../../../../../shared/ui/SegmentedControl';
import { SelectableGroup } from '../../../../../shared/ui/SelectableGroup';
import { t } from '../../../../../lib/i18n';

const SunIcon = () => (
  <svg className="boxed-inline" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none">
    <g stroke="currentColor" strokeWidth="1.5">
      <path d="M5 12H1M23 12h-4M7.05 7.05 4.222 4.222M19.778 19.778 16.95 16.95M7.05 16.95l-2.828 2.828M19.778 4.222 16.95 7.05" strokeLinecap="round" />
      <path d="M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
      <path d="M12 19v4M12 1v4" strokeLinecap="round" />
    </g>
  </svg>
);

const MoonIcon = () => (
  <svg className="boxed-inline" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M10.41 13.28C7.332 10.205 6.716 5.693 8.357 2c-1.23.41-2.256 1.23-3.281 2.256a10.399 10.399 0 0 0 0 14.768c4.102 4.102 10.46 3.897 14.562-.205 1.026-1.026 1.846-2.051 2.256-3.282-3.896 1.436-8.409.82-11.486-2.256Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

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
  const { prefixes, useCommitKeys, colorTheme, theme, language, setPrefixes, setUseCommitKeys, setColorTheme, setTheme, setLanguage } = useOptions();
  const { status: importStatus, exportMacros, importFromFile } = useMacroImportExport();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const replacementValue = useCommitKeys ? 'manual' : 'auto';

  // The toggle is light/dark; reflect the resolved mode when the stored value is 'system'.
  const systemDark = window.matchMedia?.('(prefers-color-scheme: dark)')?.matches ?? false;
  const mode = theme === 'dark' || (theme === 'system' && systemDark) ? 'dark' : 'light';
  const MODE_OPTIONS = [
    { value: 'light' as const, label: <SunIcon />,  ariaLabel: t('settings.lightMode') },
    { value: 'dark'  as const, label: <MoonIcon />, ariaLabel: t('settings.darkMode') },
  ];

  return (
    <div className="settings-view fill-block vertical scroll-auto">
      <div className="settings-body">

        <div className="settings-group columns-12 padding-block-xl padding-inline-3xl">
          <div className="settings-section-label quarter overline ink-accent-soft font-xs font-medium">{t('settings.sections.general')}</div>
          <div className="settings-rows three-quarters elastic basis-ratio min-width-none">
            <div className="settings-row horizontal gap-lg padding-block-sm align-center justify-between">
              <span className="settings-row-label rigid ink font-md">{t('options.prefixEditor.title')}</span>
              <SelectableGroup
                options={ALL_PREFIXES}
                selected={prefixes}
                onChange={setPrefixes}
                className="horizontal gap-sm"
                buttonClassName="btn pressable padding-block-sm padding-inline-lg corner-md font-md font-medium focus:ring active:ground-accent active:ink-inverse disabled:ground-subtle disabled:ink-soft ground-subtle ink ruled rule font-mono settings-prefix-btn horizontal align-center justify-center rigid"
              />
            </div>
            <div className="settings-row horizontal gap-lg padding-block-sm align-center justify-between">
              <span className="settings-row-label rigid ink font-md">{t('replacementMode.title')}</span>
              <SegmentedControl
                options={REPLACEMENT_OPTIONS.map(o => ({ value: o.value, label: o.label() }))}
                value={replacementValue}
                onChange={v => setUseCommitKeys(v === 'manual')}
              />
            </div>
          </div>
        </div>

        <div className="settings-divider rule ruled-top" />

        <div className="settings-group columns-12 padding-block-xl padding-inline-3xl">
          <div className="settings-section-label quarter overline ink-accent-soft font-xs font-medium">{t('settings.sections.appearance')}</div>
          <div className="settings-rows three-quarters elastic basis-ratio min-width-none">
            <div className="settings-row horizontal gap-lg padding-block-sm align-center justify-between">
              <span className="settings-row-label rigid ink font-md">{t('settings.colorTheme')}</span>
              <div className="settings-appearance-controls horizontal gap-md align-center">
                <SegmentedControl
                  options={THEME_OPTIONS}
                  value={colorTheme}
                  onChange={v => setColorTheme(v)}
                />
                <SegmentedControl
                  options={MODE_OPTIONS}
                  value={mode}
                  onChange={v => setTheme(v)}
                />
              </div>
            </div>
            <div className="settings-row horizontal gap-lg padding-block-sm align-center justify-between">
              <span className="settings-row-label rigid ink font-md">{t('settings.language')}</span>
              <SegmentedControl
                options={LANGUAGE_OPTIONS}
                value={language}
                onChange={v => setLanguage(v)}
              />
            </div>
          </div>
        </div>

        <div className="settings-divider rule ruled-top" />

        <div className="settings-group columns-12 padding-block-xl padding-inline-3xl">
          <div className="settings-section-label quarter overline ink-accent-soft font-xs font-medium">{t('settings.sections.data')}</div>
          <div className="settings-rows three-quarters elastic basis-ratio min-width-none">
            <div className="settings-row horizontal gap-lg padding-block-sm align-center justify-between">
              <span className="settings-row-label rigid ink font-md">{t('settings.importExport.title')}</span>
              <div className="horizontal gap-sm">
                <button className="btn rigid padding-block-sm padding-inline-lg ground-subtle ink rule corner-md ruled font-md font-medium pressable hover:ground-defined focus:ring active:ground-accent active:ink-inverse disabled:ground-subtle disabled:ink-soft" type="button" onClick={exportMacros}>
                  {t('settings.importExport.exportButton')}
                </button>
                <button className="btn rigid padding-block-sm padding-inline-lg ground-subtle ink rule corner-md ruled font-md font-medium pressable hover:ground-defined focus:ring active:ground-accent active:ink-inverse disabled:ground-subtle disabled:ink-soft" type="button" onClick={() => fileInputRef.current?.click()}>
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
          <div className={`settings-import-status font-sm ${importStatus.ok ? 'import-status--ok ink-accent' : 'import-status--error ink-fail'}`}>
            {importStatus.message}
          </div>
        )}

      </div>
    </div>
  );
}
