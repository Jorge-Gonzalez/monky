import { useState, useEffect } from 'react';
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
    <div className="section flex items-center justify-between">
      <div className="text-sm overflow-hidden">
        <p className="font-medium">{t('popup.macrosOnThisSite')}</p>
        <p className="text-xs truncate text-secondary" title={displayHostname}>{displayHostname}</p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer ml-2 shrink-0">
        <input
          type="checkbox"
          className="checkbox"
          checked={isEnabled}
          onChange={() => toggleSiteDisabled(hostname)}
          style={{ position: 'absolute', opacity: 0 }}
        />
        <div style={{
          width: '44px',
          height: '24px',
          borderRadius: '9999px',
          backgroundColor: isEnabled ? 'var(--text-accent)' : 'var(--border-input)',
          position: 'relative',
          transition: 'background-color 0.15s'
        }}>
          <div style={{
            content: '',
            position: 'absolute',
            top: '2px',
            left: isEnabled ? 'calc(100% - 22px)' : '2px',
            width: '20px',
            height: '20px',
            borderRadius: '9999px',
            backgroundColor: 'white',
            transition: 'left 0.15s',
            border: '1px solid var(--border-primary)'
          }} />
        </div>
      </label>
    </div>
  );
}