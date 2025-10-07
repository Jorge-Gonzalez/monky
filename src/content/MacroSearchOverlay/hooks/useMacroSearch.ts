import { useMemo } from 'react';
import fuzzysort from 'fuzzysort';
import { Macro } from '../../../types';

const MAX_RESULTS = 8;

export function useMacroSearch(macros: Macro[], query: string) {
  return useMemo(() => {
    if (!query.trim()) {
      return macros.slice(0, MAX_RESULTS);
    }

    const results = fuzzysort.go(query, macros, {
      keys: ['command', 'text'],
    });

    return results.slice(0, MAX_RESULTS).map(r => r.obj);
  }, [query, macros]);
}