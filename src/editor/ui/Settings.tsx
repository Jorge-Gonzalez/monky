import React from 'react'
import { EditorManager } from '../managers/createEditorManager'
import { type MacroConfig } from '../../store/useMacroStore'
import { t } from '../../lib/i18n'

interface SettingsProps {
  manager: EditorManager;
  language: MacroConfig['language'];
}

export default function Settings({ manager }: SettingsProps) {
  const { language } = manager.getState().settings;

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = e.target.value as MacroConfig['language'];
    manager.updateSettings({ language: newLanguage });
  }

  return (
    <div className="mt-8 p-4 border rounded-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      <h2 className="text-lg font-semibold mb-3">{t('settings.title')}</h2>
      <div className="flex items-center gap-4">
        <label htmlFor="language-select" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('settings.language')}
        </label>
        <select id="language-select" value={language ?? 'es'} onChange={handleLanguageChange} className="border rounded p-2 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500">
          <option value="en">English</option>
          <option value="es">Español</option>
        </select>
      </div>
    </div>
  )
}