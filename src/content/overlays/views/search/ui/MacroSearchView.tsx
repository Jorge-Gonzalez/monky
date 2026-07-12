import { useState, useCallback, useRef, useEffect } from 'react';
import { Macro } from '../../../../../types';
import { t } from '../../../../../lib/i18n';
import { useMacroStore } from '../../../../../store/useMacroStore';
import { deleteMacro } from '../../../../../store/macroCrud';
import { useMacroSearch } from '../hooks/useMacroSearch';
import { useListNavigation } from '../hooks/useListNavigation';
import { useKeyboardNavigation } from '../hooks/useKeyboardNavigation';
import { useScrollIntoView } from '../hooks/useScrollIntoView';
import { useAutoFocus } from '../../../hooks/useAutoFocus';
import { MacroSearchInput } from './MacroSearchInput';
import { MacroSearchResults } from './MacroSearchResults';
import { MacroCommandResults } from './MacroCommandResults';
import { MacroSearchFooter } from './MacroSearchFooter';
import { BaseModalViewProps } from '../../../modal/types';
import { parseModalQuery, ModalCommand } from '../modalCommands';

interface MacroSearchViewProps extends BaseModalViewProps {
  onSelectMacro: (macro: Macro) => void;
}

export function MacroSearchView({
  onClose,
  onViewChange,
  onNavigateToEditor,
  onSelectMacro,
}: MacroSearchViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  // The macro armed for deletion: first select arms it, a second select deletes.
  const [pendingDelete, setPendingDelete] = useState<Macro | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const macros = useMacroStore(state => state.macros);
  const prefixes = useMacroStore(state => state.config.prefixes);

  const parsed = parseModalQuery(searchQuery, prefixes);

  // For normal search, filter against the raw query.
  // For parametric mode, filter against the param (e.g. '/no').
  const macroSearchQuery =
    parsed.mode === 'search' ? searchQuery :
    parsed.mode === 'parametric' ? parsed.param :
    '';
  const filteredMacros = useMacroSearch(macros, macroSearchQuery);

  const showMacros = parsed.mode === 'search' || parsed.mode === 'parametric';
  const showCommands = parsed.mode === 'discovery';
  const visibleCommands = showCommands ? parsed.commands : [];

  const listLength = showMacros ? filteredMacros.length : visibleCommands.length;
  const navigation = useListNavigation(listLength);

  // Reset selection on mode switches (e.g. search ↔ command discovery)
  useEffect(() => { navigation.reset(); }, [parsed.mode]);
  // On mount, clear any stale state
  useEffect(() => { setSearchQuery(''); navigation.reset(); }, []);
  // Auto-select first result when query is active; clear selection when query is empty
  useEffect(() => {
    if (searchQuery.trim()) navigation.selectIndex(0);
    else navigation.reset();
  }, [searchQuery]); // eslint-disable-line react-hooks/exhaustive-deps
  // Disarm a pending delete when the user navigates away or edits the query.
  useEffect(() => { setPendingDelete(null); }, [navigation.selectedIndex, searchQuery]);

  // --- Handlers ---

  const handleMacroSelect = useCallback((macro: Macro) => {
    onSelectMacro(macro);
    onClose();
  }, [onSelectMacro, onClose]);

  const handleParametricSelect = useCallback((macro: Macro, command: ModalCommand) => {
    if (command.id === 'edit') {
      setSearchQuery('');
      onNavigateToEditor(macro);
      return;
    }
    if (command.id === 'delete') {
      // Two-step: first select arms the row, a second select on it confirms.
      if (pendingDelete?.id === macro.id) {
        deleteMacro(String(macro.id));
        setPendingDelete(null);
        setSearchQuery('');
      } else {
        setPendingDelete(macro);
      }
    }
  }, [onNavigateToEditor, pendingDelete]);

  const handleCommandSelect = useCallback((command: ModalCommand) => {
    setSearchQuery('');
    switch (command.id) {
      case 'new':      onNavigateToEditor(undefined); break;
      case 'settings': onViewChange('settings'); break;
      // Parametric commands: selecting from discovery list enters awaiting mode
      case 'edit':
      case 'delete':
        setSearchQuery(command.command);
        break;
    }
  }, [onNavigateToEditor, onViewChange]);

  const handleEdit = useCallback(() => {
    if (!showMacros) return;
    const macro = filteredMacros[navigation.selectedIndex];
    if (macro) onNavigateToEditor(macro);
  }, [showMacros, filteredMacros, navigation.selectedIndex, onNavigateToEditor]);

  const handleSelect = useCallback(() => {
    if (parsed.mode === 'instant') {
      handleCommandSelect(parsed.command);
    } else if (parsed.mode === 'discovery') {
      const cmd = visibleCommands[navigation.selectedIndex];
      if (cmd) handleCommandSelect(cmd);
    } else if (parsed.mode === 'parametric') {
      const macro = filteredMacros[navigation.selectedIndex];
      if (macro) handleParametricSelect(macro, parsed.command);
    } else if (parsed.mode === 'search') {
      const macro = filteredMacros[navigation.selectedIndex];
      if (macro) handleMacroSelect(macro);
    }
  }, [parsed, visibleCommands, filteredMacros, navigation.selectedIndex,
      handleCommandSelect, handleParametricSelect, handleMacroSelect]);

  useAutoFocus(inputRef, true);
  useScrollIntoView(resultsRef, navigation.selectedIndex, '.macro-search-item[aria-selected="true"]');
  useKeyboardNavigation({
    isActive: true,
    itemCount: listLength,
    selectedIndex: navigation.selectedIndex,
    onSelect: handleSelect,
    onClose,
    onNavigateUp: navigation.navigateUp,
    onNavigateDown: navigation.navigateDown,
    onEdit: showMacros ? handleEdit : undefined,
  });

  // --- Render helpers ---

  const renderResults = () => {
    if (parsed.mode === 'instant') {
      return (
        <MacroCommandResults
          commands={[parsed.command]}
          selectedIndex={0}
          onSelect={handleCommandSelect}
          resultsRef={resultsRef}
        />
      );
    }
    if (parsed.mode === 'discovery') {
      return (
        <MacroCommandResults
          commands={visibleCommands}
          selectedIndex={navigation.selectedIndex}
          onSelect={handleCommandSelect}
          resultsRef={resultsRef}
        />
      );
    }
    if (parsed.mode === 'awaiting') {
      return (
        <div ref={resultsRef} className="macro-search-results elastic basis-ratio grid scroll-auto">
          <div className="macro-search-empty modal-command-hint span-all padding-relaxed font-md text-center">
            {t('modalSearch.awaitingHint')}
          </div>
        </div>
      );
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
        resultsRef={resultsRef}
      />
    );
  };

  const footerCount = showCommands ? visibleCommands.length : filteredMacros.length;
  const isCommandMode = parsed.mode !== 'search';
  const hasSelection = showMacros && navigation.selectedIndex >= 0;

  return (
    <div className="macro-search-view vertical">
      <MacroSearchInput
        value={searchQuery}
        onChange={setSearchQuery}
        inputRef={inputRef}
      />
      {renderResults()}
      <MacroSearchFooter
        count={footerCount}
        isCommandMode={isCommandMode}
        hasSelection={hasSelection}
      />
    </div>
  );
}
