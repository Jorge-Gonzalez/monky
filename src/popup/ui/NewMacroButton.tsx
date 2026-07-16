import { t } from '../../lib/i18n';

export default function NewMacroButton() {
  const handleNewMacro = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('src/editor/index.html') });
  };

  return (
    <button
      onClick={handleNewMacro}
      className="popup-button padding-block-xs padding-inline-sm ground-accent ink-inverse corner-md font-xs font-semibold pressable tween-opacity-ground-quick"
      title={t('popup.newMacro')}
    >
      + {t('popup.newMacro')}
    </button>
  );
}
