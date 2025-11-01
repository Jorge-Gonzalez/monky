import { t } from '../../lib/i18n';
import { OptionsCoordinator } from '../coordinators/optionsCoordinator';

interface ReplacementModeProps {
  coordinator: OptionsCoordinator;
  useCommitKeys: boolean;
}

/**
 * ReplacementMode - Configure macro replacement behavior
 * Uses semantic CSS classes compatible with modal system
 */
export default function ReplacementMode({ coordinator, useCommitKeys }: ReplacementModeProps) {
  return (
    <div className="section">
      <h3 className="section-title">{t('replacementMode.title')}</h3>
      <div className="replacement-mode-options">
        <label className="replacement-mode-option">
          <input
            type="radio"
            name="behavior"
            checked={!useCommitKeys}
            onChange={() => coordinator.setUseCommitKeys(false)}
            className="replacement-mode-radio"
          />
          <span className="replacement-mode-label">{t('replacementMode.auto')}</span>
        </label>
        <label className="replacement-mode-option">
          <input
            type="radio"
            name="behavior"
            checked={useCommitKeys}
            onChange={() => coordinator.setUseCommitKeys(true)}
            className="replacement-mode-radio"
          />
          <span className="replacement-mode-label">{t('replacementMode.manual')}</span>
        </label>
      </div>
      <p className="section-description">
        El modo automático reemplaza el texto tan pronto como sea posible, con una breve pausa si un macro más largo es posible.
      </p>
    </div>
  );
}