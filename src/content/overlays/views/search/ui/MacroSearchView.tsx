import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import type { Macro } from '../../../../../types'
import { t } from '../../../../../lib/i18n'
import { useMacroStore } from '../../../../../store/useMacroStore'
import { deleteMacro } from '../../../../../store/macroCrud'
import { useMacroSearch } from '../../../../../shared/useMacroSearch'
import { useListNavigation } from '../../../hooks/useListNavigation'
import { useKeyboardNavigation } from '../../../hooks/useKeyboardNavigation'
import { useAutoFocus } from '../../../hooks/useAutoFocus'
import { MacroSearchInput } from './MacroSearchInput'
import { MacroSearchResults } from './MacroSearchResults'
import { MacroCommandResults } from './MacroCommandResults'
import { SearchResultsPanel, SEARCH_LISTBOX_ID, searchOptionId } from './SearchResultsPanel'
import { MacroSearchFooter } from './MacroSearchFooter'
import type { BaseModalViewProps } from '../../../modal/types'
import type { ModalCommand } from '../modalCommands'
import { parseModalQuery } from '../modalCommands'

interface MacroSearchViewProps extends BaseModalViewProps {
  onSelectMacro: (macro: Macro) => void
}

export function MacroSearchView({
  onClose,
  onViewChange,
  onNavigateToEditor,
  onSelectMacro,
}: MacroSearchViewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  // The macro armed for deletion: first select arms it, a second select deletes.
  const [pendingDelete, setPendingDelete] = useState<Macro | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const macros = useMacroStore((state) => state.macros)
  const prefixes = useMacroStore((state) => state.config.prefixes)

  const parsed = useMemo(() => parseModalQuery(searchQuery, prefixes), [searchQuery, prefixes])

  // For normal search, filter against the raw query.
  // For parametric mode, filter against the param (e.g. '/no').
  const macroSearchQuery =
    parsed.mode === 'search' ? searchQuery : parsed.mode === 'parametric' ? parsed.param : ''
  const filteredMacros = useMacroSearch(macros, macroSearchQuery)

  const showMacros = parsed.mode === 'search' || parsed.mode === 'parametric'
  const showCommands = parsed.mode === 'discovery'
  const visibleCommands = useMemo(() => (showCommands ? parsed.commands : []), [showCommands, parsed])

  const listLength = showMacros ? filteredMacros.length : visibleCommands.length
  // Destructured rather than held as one object: useListNavigation memoises each
  // callback but returns them in a fresh literal, so depending on the object meant
  // depending on every render. The callbacks themselves are stable.
  const { selectedIndex, navigateNext, navigatePrev, reset, selectIndex } = useListNavigation(listLength, {
    allowEmpty: true,
  })

  // Reset selection on mode switches (e.g. search ↔ command discovery).
  // Disabled pending removal: no path was found where this is observable. The mode only
  // changes when the query or the prefixes change; on a query change the auto-select
  // effect below runs in the same commit and normalises the selection either way, and
  // when the list empties useListNavigation's own clamp already resets to -1. Its own
  // hook effect is declared first, so it also runs before this one. Deleting the call
  // breaks no test, and the prefixes-change case -- the only mode switch that leaves the
  // query untouched -- is covered in MacroSearchView.test.tsx.
  // useEffect(() => { reset() }, [parsed.mode, reset])
  // On mount, clear any stale state
  useEffect(() => {
    setSearchQuery('')
    reset()
  }, [reset])
  // Auto-select first result when query is active; clear selection when query is empty
  useEffect(() => {
    if (searchQuery.trim()) selectIndex(0)
    else reset()
  }, [searchQuery, selectIndex, reset])
  // Disarm a pending delete when the user navigates away or edits the query.
  useEffect(() => {
    setPendingDelete(null)
  }, [selectedIndex, searchQuery])

  // --- Handlers ---

  const handleMacroSelect = useCallback(
    (macro: Macro) => {
      onSelectMacro(macro)
      onClose()
    },
    [onSelectMacro, onClose]
  )

  const handleParametricSelect = useCallback(
    (macro: Macro, command: ModalCommand) => {
      if (command.id === 'edit') {
        setSearchQuery('')
        onNavigateToEditor(macro)
        return
      }
      if (command.id === 'delete') {
        // Two-step: first select arms the row, a second select on it confirms.
        if (pendingDelete?.id === macro.id) {
          void deleteMacro(String(macro.id))
          setPendingDelete(null)
          setSearchQuery('')
        } else {
          setPendingDelete(macro)
        }
      }
    },
    [onNavigateToEditor, pendingDelete]
  )

  const handleCommandSelect = useCallback(
    (command: ModalCommand) => {
      setSearchQuery('')
      switch (command.id) {
        case 'new':
          onNavigateToEditor(undefined)
          break
        case 'settings':
          onViewChange('settings')
          break
        // Parametric commands: selecting from discovery list enters awaiting mode
        case 'edit':
        case 'delete':
          setSearchQuery(command.command)
          break
      }
    },
    [onNavigateToEditor, onViewChange]
  )

  const handleEdit = useCallback(() => {
    if (!showMacros) return
    const macro = filteredMacros[selectedIndex]
    if (macro) onNavigateToEditor(macro)
  }, [showMacros, filteredMacros, selectedIndex, onNavigateToEditor])

  const handleSelect = useCallback(() => {
    if (parsed.mode === 'instant') {
      handleCommandSelect(parsed.command)
    } else if (parsed.mode === 'discovery') {
      const cmd = visibleCommands[selectedIndex]
      if (cmd) handleCommandSelect(cmd)
    } else if (parsed.mode === 'parametric') {
      const macro = filteredMacros[selectedIndex]
      if (macro) handleParametricSelect(macro, parsed.command)
    } else if (parsed.mode === 'search') {
      const macro = filteredMacros[selectedIndex]
      if (macro) handleMacroSelect(macro)
    }
  }, [
    parsed,
    visibleCommands,
    filteredMacros,
    selectedIndex,
    handleCommandSelect,
    handleParametricSelect,
    handleMacroSelect,
  ])

  useAutoFocus(inputRef, true)
  useKeyboardNavigation({
    isActive: true,
    axis: 'vertical',
    onSelect: handleSelect,
    onClose,
    onNavigatePrev: navigatePrev,
    onNavigateNext: navigateNext,
    onTab: showMacros && selectedIndex >= 0 ? handleEdit : undefined,
  })

  // --- Render helpers ---

  const renderResults = () => {
    if (parsed.mode === 'instant') {
      return (
        <MacroCommandResults
          commands={[parsed.command]}
          selectedIndex={0}
          onSelect={handleCommandSelect}
        />
      )
    }
    if (parsed.mode === 'discovery') {
      return (
        <MacroCommandResults
          commands={visibleCommands}
          selectedIndex={selectedIndex}
          onSelect={handleCommandSelect}
        />
      )
    }
    if (parsed.mode === 'awaiting') {
      return (
        <SearchResultsPanel>
          <div
            className="span-all padding-lg
              font-md text-center"
            role="status"
          >
            {t('modalSearch.awaitingHint')}
          </div>
        </SearchResultsPanel>
      )
    }
    // 'search' | 'parametric'
    return (
      <MacroSearchResults
        macros={filteredMacros}
        selectedIndex={selectedIndex}
        searchQuery={macroSearchQuery}
        onSelect={
          parsed.mode === 'parametric' ? (m) => handleParametricSelect(m, parsed.command) : handleMacroSelect
        }
        onEdit={parsed.mode === 'search' ? onNavigateToEditor : undefined}
        confirmingDeleteId={pendingDelete?.id}
      />
    )
  }

  const footerCount = showCommands ? visibleCommands.length : filteredMacros.length
  const isCommandMode = parsed.mode !== 'search'
  const hasSelection = showMacros && selectedIndex >= 0

  // A panel only becomes a listbox once it holds options; 'instant' shows a single
  // pre-selected command, every other mode follows the navigation cursor.
  const optionCount = parsed.mode === 'instant' ? 1 : parsed.mode === 'awaiting' ? 0 : footerCount
  const activeIndex = parsed.mode === 'instant' ? 0 : selectedIndex

  return (
    <div className="vertical fill-block">
      <MacroSearchInput
        value={searchQuery}
        onChange={setSearchQuery}
        inputRef={inputRef}
        listboxId={optionCount > 0 ? SEARCH_LISTBOX_ID : undefined}
        activeOptionId={
          activeIndex >= 0 && activeIndex < optionCount ? searchOptionId(activeIndex) : undefined
        }
      />
      {renderResults()}
      <MacroSearchFooter
        count={footerCount}
        isCommandMode={isCommandMode}
        hasSelection={hasSelection}
      />
    </div>
  )
}
