import React from 'react';
import { t } from '../../lib/i18n';

export default function NewMacroButton() {
  const handleNewMacro = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('src/editor/index.html') });
  };

  return (
    <button
      onClick={handleNewMacro}
      className="px-2 py-1 text-xs font-semibold rounded transition-colors popup-button-primary"
      title={t('popup.newMacro')}
    >
      + {t('popup.newMacro')}
    </button>
  );
}