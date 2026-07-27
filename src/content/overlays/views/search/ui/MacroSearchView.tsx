import { useState, useCallback, useRef, useEffect } from 'react'
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

  const macros = useMacroStore(state => state.macros)
  const prefixes = useMacroStore(state => state.config.prefixes)

  const parsed = parseModalQuery(searchQuery, prefixes)

  // For normal search, filter against the raw query.
  // For parametric mode, filter against the param (e.g. '/no').
  const macroSearchQuery =
    parsed.mode === 'search' ? searchQuery :
    parsed.mode === 'parametric' ? parsed.param :
    ''
  const filteredMacros = useMacroSearch(macros, macroSearchQuery)

  const showMacros = parsed.mode === 'search' || parsed.mode === 'parametric'
  const showCommands = parsed.mode === 'discovery'
  const visibleCommands = showCommands ? parsed.commands : []

  const listLength = showMacros ? filteredMacros.length : visibleCommands.length
  const navigation = useListNavigation(listLength, { allowEmpty: true })

  // Reset selection on mode switches (e.g. search ↔ command discovery)
  useEffect(() => { navigation.reset() }, [parsed.mode])
  // On mount, clear any stale state
  useEffect(() => { setSearchQuery(''); navigation.reset() }, [])
  // Auto-select first result when query is active; clear selection when query is empty
  useEffect(() => {
    if (searchQuery.trim()) navigation.selectIndex(0)
    else navigation.reset()
  // Intentionally keyed on the query alone: navigation is a stable API and including it
  // would re-run this on every selection change, fighting the user's arrow keys.
  }, [searchQuery])
  // Disarm a pending delete when the user navigates away or edits the query.
  useEffect(() => { setPendingDelete(null) }, [navigation.selectedIndex, searchQuery])

  // --- Handlers ---

  const handleMacroSelect = useCallback((macro: Macro) => {
    onSelectMacro(macro)
    onClose()
  }, [onSelectMacro, onClose])

  const handleParametricSelect = useCallback((macro: Macro, command: ModalCommand) => {
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
  }, [onNavigateToEditor, pendingDelete])

  const handleCommandSelect = useCallback((command: ModalCommand) => {
    setSearchQuery('')
    switch (command.id) {
      case 'new':      onNavigateToEditor(undefined); break
      case 'settings': onViewChange('settings'); break
      // Parametric commands: selecting from discovery list enters awaiting mode
      case 'edit':
      case 'delete':
        setSearchQuery(command.command)
        break
    }
  }, [onNavigateToEditor, onViewChange])

  const handleEdit = useCallback(() => {
    if (!showMacros) return
    const macro = filteredMacros[navigation.selectedIndex]
    if (macro) onNavigateToEditor(macro)
  }, [showMacros, filteredMacros, navigation.selectedIndex, onNavigateToEditor])

  const handleSelect = useCallback(() => {
    if (parsed.mode === 'instant') {
      handleCommandSelect(parsed.command)
    } else if (parsed.mode === 'discovery') {
      const cmd = visibleCommands[navigation.selectedIndex]
      if (cmd) handleCommandSelect(cmd)
    } else if (parsed.mode === 'parametric') {
      const macro = filteredMacros[navigation.selectedIndex]
      if (macro) handleParametricSelect(macro, parsed.command)
    } else if (parsed.mode === 'search') {
      const macro = filteredMacros[navigation.selectedIndex]
      if (macro) handleMacroSelect(macro)
    }
  }, [parsed, visibleCommands, filteredMacros, navigation.selectedIndex,
      handleCommandSelect, handleParametricSelect, handleMacroSelect])

  useAutoFocus(inputRef, true)
  useKeyboardNavigation({
    isActive: true,
    axis: 'vertical',
    onSelect: handleSelect,
    onClose,
    onNavigatePrev: navigation.navigatePrev,
    onNavigateNext: navigation.navigateNext,
    onTab: showMacros && navigation.selectedIndex >= 0 ? handleEdit : undefined,
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
          selectedIndex={navigation.selectedIndex}
          onSelect={handleCommandSelect}
        />
      )
    }
    if (parsed.mode === 'awaiting') {
      return (
        <SearchResultsPanel>
          <div className="span-all padding-lg
            font-md text-center" role="status">
            {t('modalSearch.awaitingHint')}
          </div>
        </SearchResultsPanel>
      )
    }
    // 'search' | 'parametric'
    return (
      <MacroSearchResults
        macros={filteredMacros}
        selectedIndex={navigation.selectedIndex}
        searchQuery={macroSearchQuery}
        onSelect={parsed.mode === 'parametric'
          ? (m) => handleParametricSelect(m, parsed.command)
          : handleMacroSelect}
        onEdit={parsed.mode === 'search' ? onNavigateToEditor : undefined}
        confirmingDeleteId={pendingDelete?.id}
      />
    )
  }

  const footerCount = showCommands ? visibleCommands.length : filteredMacros.length
  const isCommandMode = parsed.mode !== 'search'
  const hasSelection = showMacros && navigation.selectedIndex >= 0

  // A panel only becomes a listbox once it holds options; 'instant' shows a single
  // pre-selected command, every other mode follows the navigation cursor.
  const optionCount =
    parsed.mode === 'instant' ? 1 :
    parsed.mode === 'awaiting' ? 0 :
    footerCount
  const activeIndex = parsed.mode === 'instant' ? 0 : navigation.selectedIndex

  return (
    <div className="vertical fill-block">
      <MacroSearchInput
        value={searchQuery}
        onChange={setSearchQuery}
        inputRef={inputRef}
        listboxId={optionCount > 0 ? SEARCH_LISTBOX_ID : undefined}
        activeOptionId={activeIndex >= 0 && activeIndex < optionCount ? searchOptionId(activeIndex) : undefined}
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
