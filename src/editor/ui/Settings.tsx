import type { ChangeEvent } from 'react'
import { useOptions } from '../../options'
import type { Lang } from '../../types'
import { t } from '../../lib/i18n'

export default function Settings() {
  const { language, setLanguage } = useOptions()

  const handleLanguageChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.currentTarget.value as Lang)
  }

  return (
    <div
      className="vertical gap-md padding-lg
        ground-subtle rule corner-md ruled"
    >
      <h2 className="font-lg">{t('settings.title')}</h2>
      <div className="horizontal gap-md align-center">
        <label
          htmlFor="language-select"
          className="boxed
            ink font-sm font-medium"
        >
          {t('settings.language')}
        </label>
        <select
          id="language-select"
          value={language}
          onChange={handleLanguageChange}
          className="padding-block-sm padding-inline-md fill-inline
            tween-rule-quick
            ground-subtle ink rule corner-3xl ruled font-md
            focus:rule-accent focus:ring"
          style={{ width: 'auto' }}
        >
          <option value="en">English</option>
          <option value="es">Español</option>
        </select>
      </div>
    </div>
  )
}
