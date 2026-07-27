import { useState, useEffect } from 'react'
import { t } from '../../lib/i18n'
import { useMacroStore } from '../../store/useMacroStore'

export default function SiteToggle() {
  const [hostname, setHostname] = useState<string | null>(null)

  const disabledSites = useMacroStore(state => state.config.disabledSites || [])
  const toggleSiteDisabled = useMacroStore(state => state.toggleSiteDisabled)

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      // The "tabs" permission is required in the manifest for the url property to be populated.
      if (tabs[0]?.url) {
        const validProtocols = ['http:', 'https:', 'file:']
        try {
          const url = new URL(tabs[0].url)
          if (validProtocols.includes(url.protocol)) {
            setHostname(url.hostname) // This will be 'localhost' for localhost, '' for file://, and the domain for others.
          }
        } catch (e) {
          // Not a valid URL (e.g., chrome://extensions), do nothing
        }
      }
    })
  }, [])

  // Don't render anything if we couldn't determine a valid hostname.
  if (hostname === null) {
    return null
  }

  const isEnabled = !disabledSites.includes(hostname)
  const displayHostname = hostname || t('popup.localFile')

  return (
    <div className="horizontal padding-sm align-center justify-between
      ground-subtle rule corner-md ruled">
      <div className="hidden
        font-sm">
        <p className="ink font-medium">{t('popup.macrosOnThisSite')}</p>
        <p className="hidden
          ink-soft font-xs truncate" title={displayHostname}>{displayHostname}</p>
      </div>
      <label className="horizontal inline rigid gap-xs align-center
        pressable">
        <input
          type="checkbox"
          className="control-size-lg
            rule corner-sm ruled pressable
            focus:ring"
          checked={isEnabled}
          onChange={() => toggleSiteDisabled(hostname)}
        />
      </label>
    </div>
  )
}
