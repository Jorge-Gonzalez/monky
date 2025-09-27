import React, { useEffect, useState } from 'react';
import { useMacroStore } from '../../store/useMacroStore'
import { t } from '../../lib/i18n'
import MacroList from './MacroList'

export default function Popup(){
  const [pending, setPending] = useState(0)
  const [hostname, setHostname] = useState<string | null>(null)

  const macros = useMacroStore(state => state.macros)
  const {
    disabledSites,
    theme,
    toggleSiteDisabled,
    setTheme
  } = useMacroStore(state => ({
    disabledSites: state.config.disabledSites || [],
    theme: state.config.theme ?? 'system',
    toggleSiteDisabled: state.toggleSiteDisabled,
    setTheme: state.setTheme,
  }));

  useEffect(()=>{
    const handler = (msg:any) => {
      if (msg?.type === 'pendingCount') setPending(msg.count)
      if (msg?.type === 'macros-updated') { /* store already updated */ }
    }
    chrome.runtime.onMessage.addListener(handler)

    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      if (tabs[0]?.url) {
        try {
          const url = new URL(tabs[0].url)
          setHostname(url.hostname)
        } catch (e) {
          // Not a valid URL (e.g., chrome://extensions), do nothing
          setHostname(null)
        }
      }
    })

    return () => chrome.runtime.onMessage.removeListener(handler)
  },[])

  const isEnabledOnCurrentSite = hostname ? !disabledSites.includes(hostname) : false

  return (
    <div className="p-3 w-64 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="flex justify-between items-center mb-1">
        <h1 className="text-lg font-semibold">{t('popup.title')}</h1>
        {/* Theme switcher */}
        <div className="flex items-center gap-1 border border-gray-300 dark:border-gray-600 rounded-lg p-1">
          <button onClick={() => setTheme('light')} className={`px-2 py-1 text-sm rounded-md transition-colors ${theme === 'light' ? 'bg-blue-500 text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`} title="Light Theme">☀️</button>
          <button onClick={() => setTheme('dark')} className={`px-2 py-1 text-sm rounded-md transition-colors ${theme === 'dark' ? 'bg-blue-500 text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`} title="Dark Theme">🌙</button>
          <button onClick={() => setTheme('system')} className={`px-2 py-1 text-sm rounded-md transition-colors ${theme === 'system' ? 'bg-blue-500 text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`} title="System Theme">💻</button>
        </div>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{pending ? t('popup.pending', { count: pending }) : t('popup.synced')}</p>

      {hostname && (
        <div className="flex items-center justify-between p-2 my-2 border rounded-md bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <div className="text-sm">
            <p className="font-medium">{t('popup.macrosOnThisSite')}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate" title={hostname}>{hostname}</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={isEnabledOnCurrentSite}
              onChange={() => toggleSiteDisabled(hostname)}
            />
            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>
      )}

      <MacroList macros={macros} />

      <button
        onClick={() => chrome.tabs.create({ url: chrome.runtime.getURL('src/editor/index.html') })}
        className="fixed bottom-3 right-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg"
        title={t('popup.newMacro')}
      ><span className="text-2xl font-bold">+</span></button>
    </div>
  )
}
