import React from 'react'
import { useMacroStore, type MacroConfig } from '../../store/useMacroStore'

export default function Settings() {
  const { language, setLanguage } = useMacroStore(state => ({
    language: state.config.language ?? 'es',
    setLanguage: state.setLanguage,
  }))

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value as MacroConfig['language'])
  }

  return (
    <div className="mt-8 p-4 border rounded-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      <h2 className="text-lg font-semibold mb-3">Settings</h2>
      <div className="flex items-center gap-4">
        <label htmlFor="language-select" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Language
        </label>
        <select id="language-select" value={language} onChange={handleLanguageChange} className="border rounded p-2 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500">
          <option value="en">English</option>
          <option value="es">Español</option>
        </select>
      </div>
    </div>
  )
}