import React from 'react'
import { EditorCoordinator } from '../coordinators/editorCoordinator'
import { type MacroConfig } from '../../store/useMacroStore'
import { t } from '../../lib/i18n'

interface SettingsProps {
  coordinator: EditorCoordinator;
  language: MacroConfig['language'];
}

export default function Settings({ coordinator }: SettingsProps) {
  const { language } = coordinator.getState().settings;

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = e.target.value as MacroConfig['language'];
    coordinator.updateSettings({ language: newLanguage });
  }

  return (
    <div className="section">
      <h2 className="section-title">{t('settings.title')}</h2>
      <div className="flex items-center gap-md">
        <label htmlFor="language-select" className="label" style={{ marginBottom: 0 }}>
          {t('settings.language')}
        </label>
        <select id="language-select" value={language ?? 'es'} onChange={handleLanguageChange} className="input" style={{ width: 'auto' }}>
          <option value="en">English</option>
          <option value="es">Español</option>
        </select>
      </div>
    </div>
  )
}