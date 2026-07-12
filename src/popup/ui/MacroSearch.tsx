import { useState, useMemo } from 'react'
import fuzzysort from 'fuzzysort'
import { Macro } from '../../types'
import { t } from '../../lib/i18n'

interface MacroSearchProps {
  macros: Macro[]
}

export function MacroSearch({ macros }: MacroSearchProps) {
  const [query, setQuery] = useState('')

  const results = useMemo(() => {
    if (!query) {
      return macros.map(macro => ({
        obj: macro,
        score: 0,
        target: macro.command,
      }))
    }
    // `fuzzysort.go` performs the search on the 'command' property.
    return fuzzysort.go(query, macros, {
      // We use `allowTypo: false` because typos in commands are not desirable
      keys: ['command', 'text'], allowTypo: false,
    })
  }, [query, macros])

  return (
    <div className="vertical gap-snug margin-block-snug">
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder={t('popup.searchPlaceholder')}
        className="popup-search-input padding-block-snug padding-inline-comfortable ground-subtle ink rule-accent-soft ruled corner-md font-md focus:rule-accent focus:ring"
      />
      <ul className="popup-results vertical gap-tight scroll-auto scrollbar-subtle">
        {results.length > 0 ? (
          results.map(result => (
            <li key={result.obj.id} className="popup-result-item padding-snug rule-soft ruled-bottom">
              <>
                <div className="font-md font-bold ink-accent">{result.obj.command}</div>
                <p className="hidden truncate font-sm ink-soft">{result.obj.text}</p>
              </>
            </li>
          ))
        ) : (
          <p className="padding-snug font-sm ink-soft">{t('macroList.noMacros')}</p>
        )}
      </ul>
    </div>
  )
}
