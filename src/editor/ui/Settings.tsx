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
    <div className="section vertical gap-comfortable padding-relaxed ground-subtle rule corner-md ruled">
      <h2 className="section-title font-lg">{t('settings.title')}</h2>
      <div className="horizontal gap-comfortable align-center">
        <label htmlFor="language-select" className="boxed ink font-sm font-medium">
          {t('settings.language')}
        </label>
        <select id="language-select" value={language} onChange={handleLanguageChange} className="input padding-block-snug padding-inline-comfortable ground-subtle ink rule corner-3xl ruled font-md focus:rule-accent focus:ring" style={{ width: 'auto' }}>
          <option value="en">English</option>
          <option value="es">Español</option>
        </select>
      </div>
    </div>
  )
}
