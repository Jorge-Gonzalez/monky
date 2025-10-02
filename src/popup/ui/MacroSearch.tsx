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
    <div className="my-2">
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder={t('popup.searchPlaceholder')}
        className="border p-2 rounded w-full mb-2 dark:bg-gray-700 dark:border-gray-600"
      />
      <ul className="max-h-64 overflow-y-auto">
        {results.length > 0 ? (
          results.map(result => (
            <li key={result.obj.id} className="p-2 border-b border-gray-200 dark:border-gray-700">
              <>
                <div className="font-bold">{result.obj.command}</div>
                <p className="text-sm text-gray-600 truncate dark:text-gray-400">{result.obj.text}</p>
              </>
            </li>
          ))
        ) : (
          <p className="text-gray-500 p-2">{t('macroList.noMacros')}</p>
        )}
      </ul>
    </div>
  )
}