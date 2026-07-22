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
    <div className="vertical gap-md padding-lg
      ground-subtle rule corner-md ruled">
      <h3 className="font-lg">{t('replacementMode.title')}</h3>
      <div className="horizontal gap-xl hug-inline">
        <label className="horizontal rigid gap-sm align-center hug-inline">
          <input
            type="radio"
            name="behavior"
            checked={!useCommitKeys}
            onChange={() => onChange(false)}
            className="rigid control-size-lg
              pressable"
          />
          <span className="rigid
            ink font-md pressable">{t('replacementMode.auto')}</span>
        </label>
        <label className="horizontal rigid gap-sm align-center hug-inline">
          <input
            type="radio"
            name="behavior"
            checked={useCommitKeys}
            onChange={() => onChange(true)}
            className="rigid control-size-lg
              pressable"
          />
          <span className="rigid
            ink font-md pressable">{t('replacementMode.manual')}</span>
        </label>
      </div>
      <p className="ink-soft font-md">
        {t('replacementMode.description')}
      </p>
    </div>
  );
}
