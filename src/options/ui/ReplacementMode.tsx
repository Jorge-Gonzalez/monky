import { t } from '../../lib/i18n';

interface ReplacementModeProps {
  useCommitKeys: boolean;
  onChange: (useCommitKeys: boolean) => void;
}

/**
 * ReplacementMode - Configure macro replacement behavior. Presentational.
 */
export default function ReplacementMode({ useCommitKeys, onChange }: ReplacementModeProps) {
  return (
    <div className="section vertical gap-md padding-lg ground-subtle rule corner-md ruled">
      <h3 className="section-title font-lg">{t('replacementMode.title')}</h3>
      <div className="mode-row horizontal hug-inline gap-xl">
        <label className="mode-choice horizontal rigid hug-inline gap-sm align-center">
          <input
            type="radio"
            name="behavior"
            checked={!useCommitKeys}
            onChange={() => onChange(false)}
            className="radio control-size-lg rigid pressable"
          />
          <span className="radio-label rigid ink font-md pressable">{t('replacementMode.auto')}</span>
        </label>
        <label className="mode-choice horizontal rigid hug-inline gap-sm align-center">
          <input
            type="radio"
            name="behavior"
            checked={useCommitKeys}
            onChange={() => onChange(true)}
            className="radio control-size-lg rigid pressable"
          />
          <span className="radio-label rigid ink font-md pressable">{t('replacementMode.manual')}</span>
        </label>
      </div>
      <p className="section-description ink-soft font-md">
        {t('replacementMode.description')}
      </p>
    </div>
  );
}
