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
    <div className="section padding-relaxed rule corner-md ground-subtle">
      <h2 className="section-title font-lg ink">{t('settings.title')}</h2>
      <div className="horizontal align-center gap-comfortable">
        <label htmlFor="language-select" className="label boxed font-sm font-medium ink" style={{ marginBottom: 0 }}>
          {t('settings.language')}
        </label>
        <select id="language-select" value={language} onChange={handleLanguageChange} className="input corner-3xl font-md ground-subtle ink rule" style={{ width: 'auto' }}>
          <option value="en">English</option>
          <option value="es">Español</option>
        </select>
      </div>
    </div>
  )
}
