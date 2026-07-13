import { useState, useEffect } from 'react';
import { t } from '../../lib/i18n';
import { useMacroStore } from '../../store/useMacroStore';

export default function SiteToggle() {
  const [hostname, setHostname] = useState<string | null>(null);

  const disabledSites = useMacroStore(state => state.config.disabledSites || [])
  const toggleSiteDisabled = useMacroStore(state => state.toggleSiteDisabled);

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
    <div className="popup-section horizontal padding-snug align-center justify-between ground-subtle rule corner-md ruled">
      <div className="popup-site-copy hidden font-sm">
        <p className="ink font-medium">{t('popup.macrosOnThisSite')}</p>
        <p className="hidden ink-soft font-xs truncate" title={displayHostname}>{displayHostname}</p>
      </div>
      <label className="popup-toggle-label horizontal inline rigid align-center position-relative pressable">
        <input
          type="checkbox"
          className="checkbox rule corner-sm ruled pressable focus:ring"
          checked={isEnabled}
          onChange={() => toggleSiteDisabled(hostname)}
          style={{ position: 'absolute', opacity: 0 }}
        />
        <div style={{
          width: '44px',
          height: '24px',
          borderRadius: '9999px',
          backgroundColor: isEnabled ? 'var(--accent)' : 'var(--harmonic)',
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
            border: '1px solid var(--harmonic)'
          }} />
        </div>
      </label>
    </div>
  );
}
