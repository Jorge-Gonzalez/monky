import { t } from '../../lib/i18n';

export default function NewMacroButton() {
  const handleNewMacro = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('src/editor/index.html') });
  };

  return (
    <button
      onClick={handleNewMacro}
      className="popup-button pressable padding-inline-snug padding-block-tight ground-accent ink-inverse corner-md font-xs font-semibold"
      title={t('popup.newMacro')}
    >
      + {t('popup.newMacro')}
    </button>
  );
}
