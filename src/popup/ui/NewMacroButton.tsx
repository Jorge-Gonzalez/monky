import { t } from '../../lib/i18n';

export default function NewMacroButton() {
  const handleNewMacro = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('src/editor/index.html') });
  };

  return (
    <button
      onClick={handleNewMacro}
      className="popup-button padding-block-tight padding-inline-snug ground-accent ink-inverse corner-md font-xs font-semibold pressable"
      title={t('popup.newMacro')}
    >
      + {t('popup.newMacro')}
    </button>
  );
}
