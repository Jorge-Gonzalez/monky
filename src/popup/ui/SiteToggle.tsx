import React, { useState, useEffect } from 'react';
import { t } from '../../lib/i18n';
import { useMacroStore } from '../../store/useMacroStore';

export default function SiteToggle() {
  const [hostname, setHostname] = useState<string | null>(null);

  const { disabledSites, toggleSiteDisabled } = useMacroStore(state => ({
    disabledSites: state.config.disabledSites || [],
    toggleSiteDisabled: state.toggleSiteDisabled,
  }));

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      // The "tabs" permission is required in the manifest for the url property to be populated.
      if (tabs[0]?.url) {
        const validProtocols = ['http:', 'https:', 'file:'];
        try {
          const url = new URL(tabs[0].url);
          if (validProtocols.includes(url.protocol)) {
            setHostname(url.hostname); // This will be 'localhost' for localhost, '' for file://, and the domain for others.
          }
        } catch (e) {
          // Not a valid URL (e.g., chrome://extensions), do nothing
        }
      }
    });
  }, []);

  // Don't render anything if we couldn't determine a valid hostname.
  if (hostname === null) {
    return null;
  }

  const isEnabled = !disabledSites.includes(hostname);
  const displayHostname = hostname || t('popup.localFile');

  return (
    <div className="flex items-center justify-between p-2 my-2 border rounded-md bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      <div className="text-sm overflow-hidden">
        <p className="font-medium">{t('popup.macrosOnThisSite')}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate" title={displayHostname}>{displayHostname}</p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer ml-2 flex-shrink-0">
        <input
          type="checkbox"
          className="sr-only peer"
          checked={isEnabled}
          onChange={() => toggleSiteDisabled(hostname)}
        />
        <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
      </label>
    </div>
  );
}