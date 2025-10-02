import React from 'react';
import { useMacroStore } from '../../store/useMacroStore'
import { t } from '../../lib/i18n'
import SiteToggle from './SiteToggle'
import { MacroSearch } from './MacroSearch';
import { usePopup } from '../hooks/usePopup';

export default function Popup(){
  const { pending } = usePopup()
  const macros = useMacroStore(state => state.macros)
  const {
    theme,
    setTheme
  } = useMacroStore(state => ({
    theme: state.config.theme ?? 'system',
    setTheme: state.setTheme,
  }));

  return (
    <div className="p-3 w-64 text-gray-900 dark:text-gray-100">
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

      <SiteToggle />

      <MacroSearch macros={macros} />

      <button
        onClick={() => chrome.tabs.create({ url: chrome.runtime.getURL('src/editor/index.html') })}
        className="fixed bottom-3 right-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg"
        title={t('popup.newMacro')}
      ><span className="text-2xl font-bold">+</span></button>
    </div>
  )
}
