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
    <div className="section">
      <h3 className="section-title">{t('replacementMode.title')}</h3>
      <div className="horizontal fit-content loose">
        <label className="horizontal fit-content align-center snug">
          <input
            type="radio"
            name="behavior"
            checked={!useCommitKeys}
            onChange={() => onChange(false)}
            className="radio rigid"
          />
          <span className="radio-label rigid">{t('replacementMode.auto')}</span>
        </label>
        <label className="horizontal fit-content align-center snug">
          <input
            type="radio"
            name="behavior"
            checked={useCommitKeys}
            onChange={() => onChange(true)}
            className="radio rigid"
          />
          <span className="radio-label rigid">{t('replacementMode.manual')}</span>
        </label>
      </div>
      <p className="section-description">
        {t('replacementMode.description')}
      </p>
    </div>
  );
}
