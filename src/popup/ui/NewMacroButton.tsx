import { t } from '../../lib/i18n';

export default function NewMacroButton() {
  const handleNewMacro = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('src/editor/index.html') });
  };

  return (
    <button
      onClick={handleNewMacro}
      className="btn-primary padding-inline-snug padding-block-tight text-xs font-semibold ui-rounded transition-colors"
      title={t('popup.newMacro')}
    >
      + {t('popup.newMacro')}
    </button>
  );
}