/**
 * Example: Macro List View using Infrastructure Components
 *
 * This example demonstrates how to compose the generic UI components
 * (MultiSelectList, FuzzySearchField, ActionToolbar) to create a
 * complete macro management interface.
 */

import React, { useState, useCallback, useRef } from 'react';
import { MultiSelectList } from '../MultiSelectList';
import { FuzzySearchField } from '../FuzzySearchField';
import { ActionToolbar, ToolbarButton } from '../ActionToolbar';

/**
 * Domain types (your macro data structure)
 */
interface Macro {
  id: string;
  name: string;
  shortcut: string;
  content: string;
  tags?: string[];
}

/**
 * Props for the composed macro list view
 */
interface MacroListViewProps {
  /** Initial macros to display */
  macros: Macro[];

  /** Called when user wants to create a new macro */
  onNewMacro: () => void;

  /** Called when user wants to edit a macro */
  onEditMacro: (macro: Macro) => void;

  /** Called when user wants to delete macros */
  onDeleteMacros: (macros: Macro[]) => void;
}

/**
 * MacroListView - Complete macro management interface
 *
 * Demonstrates composition of infrastructure components:
 * - FuzzySearchField for filtering
 * - MultiSelectList for selection and navigation
 * - ActionToolbar for actions
 */
export function MacroListView({
  macros,
  onNewMacro,
  onEditMacro,
  onDeleteMacros
}: MacroListViewProps) {
  // State
  const [filteredMacros, setFilteredMacros] = useState<Macro[]>(macros);
  const [selectedMacros, setSelectedMacros] = useState<Macro[]>([]);
  const listRef = useRef<HTMLDivElement>(null);

  // Handle search results
  const handleSearch = useCallback((query: string, results: Macro[]) => {
    setFilteredMacros(results);
  }, []);

  // Handle selection changes
  const handleSelect = useCallback((keys: (string | number)[], items: Macro[]) => {
    setSelectedMacros(items);
  }, []);

  // Handle macro activation (double-click or Enter)
  const handleActivate = useCallback((macro: Macro) => {
    onEditMacro(macro);
  }, [onEditMacro]);

  // Handle navigation escape (Up from top → focus search)
  const handleNavigationEscape = useCallback(() => {
    // Focus search field when user navigates up from first item
    const searchInput = document.querySelector('.search-input') as HTMLInputElement;
    searchInput?.focus();
  }, []);

  // Handle navigate down from search field
  const handleNavigateDown = useCallback(() => {
    // Focus the list when user presses down in search
    listRef.current?.focus();
  }, []);

  // Toolbar button configuration
  const toolbarButtons: ToolbarButton<Macro>[] = [
    {
      id: 'new',
      icon: 'plus',
      label: 'New Macro',
      enabled: 'always',
      action: () => onNewMacro(),
      shortcut: 'alt+n'
    },
    {
      id: 'edit',
      icon: 'edit',
      label: 'Edit',
      enabled: 'single',
      action: (items) => onEditMacro(items[0]),
      shortcut: 'Enter'
    },
    {
      id: 'delete',
      icon: 'trash',
      label: 'Delete',
      enabled: 'any',
      action: (items) => {
        if (confirm(`Delete ${items.length} macro(s)?`)) {
          onDeleteMacros(items);
        }
      },
      shortcut: 'Delete'
    }
  ];

  // Render individual macro item
  const renderMacroItem = useCallback((macro: Macro, index: number) => {
    return (
      <div className="macro-item-content">
        <div className="macro-header">
          <span className="macro-name">{macro.name}</span>
          <span className="macro-shortcut">{macro.shortcut}</span>
        </div>
        <div className="macro-preview">{macro.content}</div>
        {macro.tags && macro.tags.length > 0 && (
          <div className="macro-tags">
            {macro.tags.map(tag => (
              <span key={tag} className="tag">{tag}</span>
            ))}
          </div>
        )}
      </div>
    );
  }, []);

  return (
    <div className="macro-list-view">
      {/* Search Field */}
      <FuzzySearchField
        searchKeys={['name', 'shortcut', 'content', 'tags']}
        algorithm="fuzzy"
        placeholder="Search macros..."
        dataSource={macros}
        onSearch={handleSearch}
        onNavigateDown={handleNavigateDown}
        autoFocus
        className="macro-search"
      />

      {/* Macro List */}
      <div className="macro-list-container">
        <MultiSelectList
          items={filteredMacros}
          itemKey="id"
          renderItem={renderMacroItem}
          emptyState={
            <div className="empty-state">
              <div className="empty-icon">📝</div>
              <div className="empty-text">No macros found</div>
              <div className="empty-hint">Try adjusting your search or create a new macro</div>
            </div>
          }
          keyboardNav
          onSelect={handleSelect}
          onActivate={handleActivate}
          onNavigationEscape={handleNavigationEscape}
          className="macro-list"
        />
      </div>

      {/* Action Toolbar */}
      <ActionToolbar
        buttons={toolbarButtons}
        position="footer"
        selectionCount={selectedMacros.length}
        selectedItems={selectedMacros}
        enableShortcuts
        className="macro-toolbar"
      />
    </div>
  );
}

/**
 * Example usage in a parent component
 */
export function MacroListViewExample() {
  const [macros, setMacros] = useState<Macro[]>([
    {
      id: '1',
      name: 'Greeting',
      shortcut: '/greeting',
      content: 'Hello! Thank you for reaching out.',
      tags: ['common', 'professional']
    },
    {
      id: '2',
      name: 'Signature',
      shortcut: '/sig',
      content: 'Best regards,\nJohn Doe',
      tags: ['signature']
    },
    {
      id: '3',
      name: 'Meeting Request',
      shortcut: '/meeting',
      content: "Let's schedule a meeting to discuss this further.",
      tags: ['scheduling']
    }
  ]);

  const handleNewMacro = useCallback(() => {
    console.log('Create new macro');
    // Navigate to editor view with empty macro
  }, []);

  const handleEditMacro = useCallback((macro: Macro) => {
    console.log('Edit macro:', macro.name);
    // Navigate to editor view with selected macro
  }, []);

  const handleDeleteMacros = useCallback((macrosToDelete: Macro[]) => {
    console.log('Delete macros:', macrosToDelete.map(m => m.name));
    // Update state
    setMacros(prev => prev.filter(m => !macrosToDelete.find(d => d.id === m.id)));
  }, []);

  return (
    <div className="app">
      <MacroListView
        macros={macros}
        onNewMacro={handleNewMacro}
        onEditMacro={handleEditMacro}
        onDeleteMacros={handleDeleteMacros}
      />
    </div>
  );
}

/**
 * Example CSS (using semantic compositional system)
 *
 * You would integrate this with your existing CSS architecture
 */
export const exampleStyles = `
/* Container */
.macro-list-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--surface-primary);
}

/* Search */
.macro-search {
  flex-shrink: 0;
  padding: var(--spacing-md);
  border-bottom: 1px solid var(--border-primary);
}

.search-input-wrapper {
  position: relative;
}

.search-input {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  font-size: var(--font-size-md);
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.clear-button {
  position: absolute;
  right: var(--spacing-sm);
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  font-size: var(--font-size-xl);
  cursor: pointer;
  color: var(--text-secondary);
}

/* List Container */
.macro-list-container {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-md);
  min-height: 0;
}

.macro-list {
  outline: none;
}

/* List Items */
.list-item {
  padding: var(--spacing-md);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-sm);
  background: var(--surface-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.list-item:hover {
  border-color: var(--color-primary);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.list-item.selected {
  background: var(--color-primary-light);
  border-color: var(--color-primary);
  border-left: 4px solid var(--color-primary);
}

.list-item.focused {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

/* Macro Item Content */
.macro-item-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.macro-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.macro-name {
  font-weight: 600;
  color: var(--text-primary);
}

.macro-shortcut {
  font-family: monospace;
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  background: var(--surface-tertiary);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
}

.macro-preview {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.macro-tags {
  display: flex;
  gap: var(--spacing-xs);
  flex-wrap: wrap;
}

.tag {
  font-size: var(--font-size-xs);
  padding: 2px 8px;
  background: var(--surface-tertiary);
  border-radius: var(--radius-sm);
  color: var(--text-tertiary);
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl);
  text-align: center;
  color: var(--text-tertiary);
}

.empty-icon {
  font-size: 64px;
  opacity: 0.3;
  margin-bottom: var(--spacing-md);
}

.empty-text {
  font-size: var(--font-size-lg);
  margin-bottom: var(--spacing-sm);
}

.empty-hint {
  font-size: var(--font-size-sm);
}

/* Toolbar */
.action-toolbar {
  flex-shrink: 0;
  display: flex;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  border-top: 1px solid var(--border-primary);
  background: var(--surface-secondary);
}

.toolbar-button {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  background: var(--surface-primary);
  cursor: pointer;
  transition: all 0.2s;
  font-size: var(--font-size-sm);
  font-weight: 500;
}

.toolbar-button:hover:not(:disabled) {
  background: var(--surface-hover);
  border-color: var(--color-primary);
}

.toolbar-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.icon-text {
  font-size: var(--font-size-lg);
}

.button-label {
  user-select: none;
}
`;
