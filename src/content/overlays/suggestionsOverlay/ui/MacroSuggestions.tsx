import { useRef, useCallback, useMemo, useEffect, useState, useLayoutEffect } from 'react'
import fuzzysort from 'fuzzysort'
import type { Macro } from '../../../../types'
import { t } from '../../../../lib/i18n'
import { useAppliedTheme } from '../../../../theme/hooks/useAppliedTheme'
import { useKeyboardNavigation } from '../../hooks/useKeyboardNavigation'
import { useListNavigation } from '../../hooks/useListNavigation'
import { Keycap } from '../../../../shared/ui/Keycap'
import { announce } from '../../services/announcer'

/** Options are addressed by position, so a controller can name the active one by index. */
export const SUGGESTIONS_OVERLAY_LISTBOX_ID = 'monky-suggestions-overlay'
export const suggestionsOverlayOptionId = (index: number) =>
  `${SUGGESTIONS_OVERLAY_LISTBOX_ID}-option-${index}`

export interface MacroSuggestionsProps {
  macros: Macro[]
  filterBuffer: string
  mode: 'filter' | 'showAll'
  position: { x: number; y: number }
  placement: 'top' | 'bottom'
  isVisible: boolean
  onSelectMacro: (macro: Macro) => void
  onClose: () => void
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
  const containerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([])
  const [visibleCount, setVisibleCount] = useState(5)
  const prevFilteredRef = useRef<Macro[] | null>(null)

  useAppliedTheme(containerRef, isVisible)

  const filteredMacros = useMemo(() => {
    if (!macros || macros.length === 0) {
      return []
    }

    if (mode === 'showAll') {
      if (filterBuffer && filterBuffer.length > 0) {
        try {
          const results = fuzzysort.go(filterBuffer, macros, {
            keys: ['command', 'text'],
            threshold: -10000,
          })
          const fuzzyMatches = results.slice(0, 5).map((r) => r.obj)

          if (fuzzyMatches.length > 0) {
            return fuzzyMatches
          }

          const lowerBuffer = filterBuffer.toLowerCase()
          const simpleMatches = macros
            .filter((macro) => {
              const lowerCommand = macro.command.toLowerCase()
              const lowerText = macro.text.toLowerCase()
              return lowerCommand.includes(lowerBuffer) || lowerText.includes(lowerBuffer)
            })
            .slice(0, 5)

          if (simpleMatches.length > 0) {
            return simpleMatches
          }

          return macros.slice(0, 5)
        } catch (error) {
          console.warn('Fuzzy search failed, falling back to simple filter:', error)
          const lowerBuffer = filterBuffer.toLowerCase()
          const fallbackMatches = macros
            .filter((macro) => {
              const lowerCommand = macro.command.toLowerCase()
              const lowerText = macro.text.toLowerCase()
              return lowerCommand.includes(lowerBuffer) || lowerText.includes(lowerBuffer)
            })
            .slice(0, 5)

          return fallbackMatches.length > 0 ? fallbackMatches : macros.slice(0, 5)
        }
      } else {
        return macros.slice(0, 5)
      }
    }

    if (!filterBuffer || filterBuffer.length === 0) {
      return []
    }

    const lowerBuffer = filterBuffer.toLowerCase()
    return macros
      .filter((macro) => {
        const lowerCommand = macro.command.toLowerCase()
        return lowerCommand.startsWith(lowerBuffer) || lowerCommand.includes(lowerBuffer)
      })
      .slice(0, 5)
  }, [macros, filterBuffer, mode])

  // Single layout effect handles both reset (when candidates change) and count reduction
  // (when buttons are squeezed). Using useLayoutEffect for both avoids the loop that
  // would occur if useEffect reset the count after useLayoutEffect had already reduced it.
  useLayoutEffect(() => {
    if (prevFilteredRef.current !== filteredMacros) {
      prevFilteredRef.current = filteredMacros
      setVisibleCount(filteredMacros.length)
      return
    }

    const list = listRef.current
    if (!list) return
    const buttons = list.querySelectorAll('[role="option"]')
    const anySqueezed = Array.from(buttons).some((btn) => {
      if (btn.scrollWidth <= btn.clientWidth) return false
      const maxWidth = parseFloat(getComputedStyle(btn).maxWidth)
      return btn.clientWidth < maxWidth - 1
    })
    if (anySqueezed && visibleCount > 1) {
      setVisibleCount((c) => c - 1)
    }
  }, [visibleCount, filteredMacros])

  const visibleMacros = filteredMacros.slice(0, visibleCount)
  const navigation = useListNavigation(visibleMacros.length)

  const handleSelect = useCallback(() => {
    const selectedMacro = visibleMacros[navigation.selectedIndex]
    if (selectedMacro) {
      onSelectMacro(selectedMacro)
    }
  }, [visibleMacros, navigation.selectedIndex, onSelectMacro])

  useEffect(() => {
    if (visibleMacros.length > 0 && isVisible) {
      if (mode !== 'showAll') {
        const targetIndex = navigation.selectedIndex ?? 0
        buttonRefs.current[targetIndex]?.focus()
      }
    }
  }, [visibleMacros.length, navigation.selectedIndex, isVisible, mode])

  // showAll keeps focus where it was, so nothing announces the highlight moving. filter
  // mode focuses the option button just above, and a focused button announces itself --
  // saying it twice would be worse than not saying it.
  useEffect(() => {
    if (!isVisible || mode !== 'showAll') {
      announce('')
      return
    }
    const active = visibleMacros[navigation.selectedIndex]
    if (!active) return
    announce(
      t('macroSuggestions.activeOption', {
        command: active.command,
        text: active.text,
        index: navigation.selectedIndex + 1,
        total: visibleMacros.length,
      })
    )
  }, [isVisible, mode, navigation.selectedIndex, visibleMacros])

  useKeyboardNavigation({
    isActive: isVisible,
    axis: 'horizontal',
    onSelect: handleSelect,
    onClose,
    onNavigatePrev: navigation.navigatePrev,
    onNavigateNext: navigation.navigateNext,
    onTab: 'cycle',
  })

  const shouldShow = isVisible && visibleMacros.length > 0
  const selectedMacro = visibleMacros[navigation.selectedIndex]

  if (!shouldShow) {
    return null
  }

  return (
    <div
      ref={containerRef}
      data-component="suggestions-container"
      className="hidden max-width-popover-2xl min-width-popover-sm
        tween-opacity-transform-quick
        ground rule corner-lg ruled font-md elevated-soft"
      style={{
        left: position.x,
        top: position.y,
        position: 'fixed',
      }}
    >
      <div
        data-component="suggestions-arrow"
        className={`sf-callout-arrow height-none center-x position-absolute ${placement === 'top' ? 'sf-callout-arrow-top attach-below' : 'sf-callout-arrow-bottom attach-above'}`}
      />
      <div
        ref={listRef}
        id={SUGGESTIONS_OVERLAY_LISTBOX_ID}
        role="listbox"
        aria-label={t('macroSuggestions.listLabel')}
        data-component="suggestions-list"
        className="horizontal gap-xs padding-xs
          rule-soft ruled-bottom"
      >
        {visibleMacros.map((macro, index) => (
          <button
            key={macro.id}
            id={suggestionsOverlayOptionId(index)}
            ref={(el) => {
              buttonRefs.current[index] = el
            }}
            data-component="suggestions-item"
            className="compressible padding-block-xs padding-inline-sm hidden max-width-command min-width-none
              tween-quick
              selectable
              ground-subtle ink rule-soft corner-md ruled font-sm text-center pressable truncate
              hover:ground-defined hover:rule
              selected:ground-defined selected:ink-accent selected:rule-accent"
            onMouseDown={(e) => {
              e.preventDefault()
              onSelectMacro(macro)
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
        <div
          data-component="suggestions-preview"
          className="padding-block-sm padding-inline-md hidden
            ink-soft font-xs clamp-3"
        >
          {selectedMacro.text}
        </div>
      )}
      <div
        data-component="suggestions-footer"
        className="horizontal gap-md padding-block-xs padding-inline-md justify-end
          ground ink-soft rule ruled-top font-xs"
      >
        <span>
          <Keycap>←</Keycap>
          <Keycap>→</Keycap>/<Keycap>Tab</Keycap> {t('macroSuggestions.footer.navigate')}
        </span>
        <span>
          <Keycap>↵</Keycap> {t('macroSuggestions.footer.select')}
        </span>
        <span>
          <Keycap>Esc</Keycap> {t('macroSuggestions.footer.cancel')}
        </span>
      </div>
    </div>
  )
}
