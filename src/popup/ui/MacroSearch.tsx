import { useState } from 'react'
import { Macro } from '../../types'
import { t } from '../../lib/i18n'
import { useMacroSearch } from '../../shared/useMacroSearch'

interface MacroSearchProps {
  macros: Macro[]
}

export function MacroSearch({ macros }: MacroSearchProps) {
  const [query, setQuery] = useState('')
  const results = useMacroSearch(macros, query)

  return (
    <div className="vertical gap-sm margin-block-sm">
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.currentTarget.value)}
        placeholder={t('popup.searchPlaceholder')}
        className="fill-inline padding-block-sm padding-inline-md ground-subtle ink rule-accent-soft corner-md ruled font-md tween-rule-quick focus:rule-accent focus:ring"
      />
      <ul className="vertical gap-xs padding-block-sm padding-inline-none margin-none max-height-results-sm scroll-auto scrollbar-subtle">
        {results.length > 0 ? (
          results.map(macro => (
            <li key={macro.id} className="padding-sm rule-soft ruled-bottom">
              <>
                <div className="ink-accent font-md font-bold">{macro.command}</div>
                <p className="hidden ink-soft font-sm truncate">{macro.text}</p>
              </>
            </li>
          ))
        ) : (
          <p className="padding-sm ink-soft font-sm">{t('macroList.noMacros')}</p>
        )}
      </ul>
    </div>
  )
}
