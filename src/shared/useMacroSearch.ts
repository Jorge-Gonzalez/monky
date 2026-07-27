import { useMemo } from 'react'
import fuzzysort from 'fuzzysort'
import type { Macro } from '../types'

const MAX_RESULTS = 50

export function useMacroSearch(macros: Macro[], query: string) {
  return useMemo(() => {
    // Early return for empty states
    if (!macros.length) return []
    if (!query.trim()) {
      return macros.slice(0, MAX_RESULTS)
    }

    try {
      const results = fuzzysort.go(query, macros, {
        keys: ['command', 'text'],
        threshold: -10000, // Allow more fuzzy matches
      })

      // Stable sort: higher score first; equal scores preserve original array order.
      return results
        .slice()
        .sort((a, b) => b.score !== a.score ? b.score - a.score : macros.indexOf(a.obj) - macros.indexOf(b.obj))
        .slice(0, MAX_RESULTS)
        .map(r => r.obj)
    } catch (error) {
      console.warn('Fuzzy search failed, falling back to simple filter:', error)
      // Fallback to simple string matching
      return macros
        .filter(macro => 
          macro.command.toLowerCase().includes(query.toLowerCase()) ||
          macro.text.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, MAX_RESULTS)
    }
  }, [query, macros])
}