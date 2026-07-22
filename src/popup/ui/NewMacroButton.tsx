import { t } from '../../lib/i18n';

export default function NewMacroButton() {
  const handleNewMacro = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('src/editor/index.html') });
  };

  return (
    <button
      onClick={handleNewMacro}
      className="padding-block-xs padding-inline-sm
        tween-opacity-ground-quick
        ground-accent ink-inverse corner-md font-xs font-semibold pressable
        hover:alpha-90"
      title={t('popup.newMacro')}
    >
      + {t('popup.newMacro')}
    </button>
  );
}
