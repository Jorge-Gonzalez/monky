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
    <div className="section vertical gap-comfortable padding-relaxed rule ruled corner-md ground-subtle">
      <h2 className="section-title font-lg">{t('settings.title')}</h2>
      <div className="horizontal align-center gap-comfortable">
        <label htmlFor="language-select" className="boxed font-sm font-medium ink">
          {t('settings.language')}
        </label>
        <select id="language-select" value={language} onChange={handleLanguageChange} className="input padding-block-snug padding-inline-comfortable ruled corner-3xl font-md ground-subtle ink rule focus:rule-accent focus:ring" style={{ width: 'auto' }}>
          <option value="en">English</option>
          <option value="es">Español</option>
        </select>
      </div>
    </div>
  )
}
