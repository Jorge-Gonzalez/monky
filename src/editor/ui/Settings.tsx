import React from 'react'
import { useOptions } from '../../options'
import { Lang } from '../../types'
import { t } from '../../lib/i18n'

export default function Settings() {
  const { language, setLanguage } = useOptions()

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.currentTarget.value as Lang)
  }

  return (
    <div className="section">
      <h2 className="section-title">{t('settings.title')}</h2>
      <div className="horizontal align-center gap-comfortable">
        <label htmlFor="language-select" className="label" style={{ marginBottom: 0 }}>
          {t('settings.language')}
        </label>
        <select id="language-select" value={language} onChange={handleLanguageChange} className="input" style={{ width: 'auto' }}>
          <option value="en">English</option>
          <option value="es">Español</option>
        </select>
      </div>
    </div>
  )
}
