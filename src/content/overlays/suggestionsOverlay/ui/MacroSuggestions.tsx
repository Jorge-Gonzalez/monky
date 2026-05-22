import { useRef, useCallback, useMemo, useEffect, useState, useLayoutEffect } from 'react';
import fuzzysort from 'fuzzysort';
import { Macro } from '../../../../types';
import { t } from '../../../../lib/i18n';
import { useThemeColors } from '../../../../theme/hooks/useThemeColors';
import { useMacroStore } from '../../../../store/useMacroStore';
import { useKeyboardNavigation } from '../hooks/useKeyboardNavigation';
import { useListNavigation } from '../hooks/useListNavigation';

export interface MacroSuggestionsProps {
  macros: Macro[];
  filterBuffer: string;
  mode: 'filter' | 'showAll';
  position: { x: number; y: number };
  placement: 'top' | 'bottom';
  isVisible: boolean;
  onSelectMacro: (macro: Macro) => void;
  onClose: () => void;
}

export function MacroSuggestions({
  macros,
  filterBuffer,
  mode,
  position,
  placement,
  isVisible,
  onSelectMacro,
  onClose,
}: MacroSuggestionsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [visibleCount, setVisibleCount] = useState(5);
  const prevFilteredRef = useRef<Macro[] | null>(null);

  const theme = useMacroStore(state => state.config.theme);
  const colorTheme = useMacroStore(state => state.config.colorTheme ?? 'humo');
  useThemeColors(containerRef, theme, isVisible, colorTheme);

  const filteredMacros = useMemo(() => {
    if (!macros || macros.length === 0) {
      return [];
    }

    if (mode === 'showAll') {
      if (filterBuffer && filterBuffer.length > 0) {
        try {
          const results = fuzzysort.go(filterBuffer, macros, {
            keys: ['command', 'text'],
            threshold: -10000,
          });
          const fuzzyMatches = results.slice(0, 5).map(r => r.obj);

          if (fuzzyMatches.length > 0) {
            return fuzzyMatches;
          }

          const lowerBuffer = filterBuffer.toLowerCase();
          const simpleMatches = macros
            .filter(macro => {
              const lowerCommand = macro.command.toLowerCase();
              const lowerText = macro.text.toLowerCase();
              return lowerCommand.includes(lowerBuffer) || lowerText.includes(lowerBuffer);
            })
            .slice(0, 5);

          if (simpleMatches.length > 0) {
            return simpleMatches;
          }

          return macros.slice(0, 5);
        } catch (error) {
          console.warn('Fuzzy search failed, falling back to simple filter:', error);
          const lowerBuffer = filterBuffer.toLowerCase();
          const fallbackMatches = macros
            .filter(macro => {
              const lowerCommand = macro.command.toLowerCase();
              const lowerText = macro.text.toLowerCase();
              return lowerCommand.includes(lowerBuffer) || lowerText.includes(lowerBuffer);
            })
            .slice(0, 5);

          return fallbackMatches.length > 0 ? fallbackMatches : macros.slice(0, 5);
        }
      } else {
        return macros.slice(0, 5);
      }
    }

    if (!filterBuffer || filterBuffer.length === 0) {
      return [];
    }

    const lowerBuffer = filterBuffer.toLowerCase();
    return macros
      .filter(macro => {
        const lowerCommand = macro.command.toLowerCase();
        return lowerCommand.startsWith(lowerBuffer) || lowerCommand.includes(lowerBuffer);
      })
      .slice(0, 5);
  }, [macros, filterBuffer, mode, isVisible]);

  // Single layout effect handles both reset (when candidates change) and count reduction
  // (when buttons are squeezed). Using useLayoutEffect for both avoids the loop that
  // would occur if useEffect reset the count after useLayoutEffect had already reduced it.
  useLayoutEffect(() => {
    if (prevFilteredRef.current !== filteredMacros) {
      prevFilteredRef.current = filteredMacros;
      setVisibleCount(filteredMacros.length);
      return;
    }

    const list = listRef.current;
    if (!list) return;
    const buttons = list.querySelectorAll('.macro-suggestions-command-item');
    const anySqueezed = Array.from(buttons).some(btn => {
      if (btn.scrollWidth <= btn.clientWidth) return false;
      const maxWidth = parseFloat(getComputedStyle(btn).maxWidth);
      return btn.clientWidth < maxWidth - 1;
    });
    if (anySqueezed && visibleCount > 1) {
      setVisibleCount(c => c - 1);
    }
  }, [visibleCount, filteredMacros]);

  const visibleMacros = filteredMacros.slice(0, visibleCount);
  const navigation = useListNavigation(visibleMacros.length);

  const handleSelect = useCallback(() => {
    const selectedMacro = visibleMacros[navigation.selectedIndex];
    if (selectedMacro) {
      onSelectMacro(selectedMacro);
    }
  }, [visibleMacros, navigation.selectedIndex, onSelectMacro]);

  useEffect(() => {
    if (visibleMacros.length > 0 && isVisible) {
      if (mode !== 'showAll') {
        const targetIndex = navigation.selectedIndex ?? 0;
        buttonRefs.current[targetIndex]?.focus();
      }
    }
  }, [visibleMacros.length, navigation.selectedIndex, isVisible, mode]);

  useKeyboardNavigation({
    isActive: isVisible,
    onSelect: handleSelect,
    onClose,
    onNavigateLeft: navigation.navigateLeft,
    onNavigateRight: navigation.navigateRight,
    preventTabHandling: false,
  });

  const shouldShow = isVisible && visibleMacros.length > 0;
  const selectedMacro = visibleMacros[navigation.selectedIndex];

  if (!shouldShow) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="macro-suggestions-container"
      style={{
        left: position.x,
        top: position.y,
        position: 'fixed',
      }}
    >
      <div className={`macro-suggestions-arrow ${placement}`} />
      <div ref={listRef} role="listbox" className="macro-suggestions-commands-list">
        {visibleMacros.map((macro, index) => (
          <button
            key={macro.id}
            ref={(el) => { buttonRefs.current[index] = el; }}
            className={`macro-suggestions-command-item ${index === navigation.selectedIndex ? 'selected' : ''}`}
            onMouseDown={(e) => {
              e.preventDefault();
              onSelectMacro(macro);
            }}
            type="button"
            role="option"
            aria-selected={index === navigation.selectedIndex}
          >
            {macro.command}
          </button>
        ))}
      </div>
      {selectedMacro && (
        <div className="macro-suggestions-text-preview">
          {selectedMacro.text}
        </div>
      )}
      <div className="macro-suggestions-footer">
        <span>
          <kbd className="macro-suggestions-kbd">←</kbd>
          <kbd className="macro-suggestions-kbd">→</kbd>/
          <kbd className="macro-suggestions-kbd">Tab</kbd> {t('macroSuggestions.footer.navigate')}
        </span>
        <span>
          <kbd className="macro-suggestions-kbd">↵</kbd> {t('macroSuggestions.footer.select')}
        </span>
        <span>
          <kbd className="macro-suggestions-kbd">Esc</kbd> {t('macroSuggestions.footer.cancel')}
        </span>
      </div>
    </div>
  );
}
