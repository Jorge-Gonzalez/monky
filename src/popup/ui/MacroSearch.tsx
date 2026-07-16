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
    <div className="vertical gap-sm margin-block-sm">
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder={t('popup.searchPlaceholder')}
        className="popup-search-input fill-inline padding-block-sm padding-inline-md ground-subtle ink rule-accent-soft corner-md ruled font-md tween-rule-quick focus:rule-accent focus:ring"
      />
      <ul className="popup-results vertical gap-xs padding-block-sm padding-inline-none margin-none max-height-results-sm scroll-auto scrollbar-subtle">
        {results.length > 0 ? (
          results.map(result => (
            <li key={result.obj.id} className="popup-result-item padding-sm rule-soft ruled-bottom">
              <>
                <div className="ink-accent font-md font-bold">{result.obj.command}</div>
                <p className="hidden ink-soft font-sm truncate">{result.obj.text}</p>
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
