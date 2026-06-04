// Pattern: Store-Hook — the command-autocomplete behavior for the macro editor:
// "while typing a new command, find existing macros to load for editing." Kept
// out of ModalMacroForm so the form speaks only about editing a macro.
import React, { useEffect, useMemo, useState } from 'react';
import { Macro } from '../../../../types';
import { useMacroStore } from '../../../../store/useMacroStore';

const MAX_SUGGESTIONS = 5;

export function useCommandSuggestions(
  command: string,
  enabled: boolean,
  onLoad: (macro: Macro) => void,
) {
  const macros = useMacroStore(s => s.macros);
  const [focused, setFocused] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const suggestions = useMemo(() => {
    if (!enabled || !command.trim()) return [];
    const q = command.toLowerCase();
    return macros.filter(m => m.command.toLowerCase().includes(q)).slice(0, MAX_SUGGESTIONS);
  }, [macros, command, enabled]);

  const visible = focused && !dismissed && suggestions.length > 0;

  // Re-open and reset the highlight whenever the command changes.
  useEffect(() => {
    setDismissed(false);
    setSelectedIndex(-1);
  }, [command]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape' && visible) {
      e.stopPropagation();
      setDismissed(true);
      return;
    }
    if (!visible) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, -1));
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0) {
        e.preventDefault();
        onLoad(suggestions[selectedIndex]);
      } else {
        const exact = suggestions.find(m => m.command.toLowerCase() === command.toLowerCase());
        if (exact) {
          e.preventDefault();
          onLoad(exact);
        } else {
          // No match: dismiss and let Enter submit the form.
          setDismissed(true);
        }
      }
    }
  };

  return {
    suggestions,
    visible,
    selectedIndex,
    select: onLoad,
    inputProps: {
      onFocus: () => setFocused(true),
      onBlur: () => setFocused(false),
      onKeyDown,
    },
  };
}
