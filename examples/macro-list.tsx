/**
 * Macro List Example - Using actual shared UI components
 *
 * This example demonstrates the MultiSelectList, FuzzySearchField,
 * and ActionToolbar components imported directly from the shared library.
 */

import React, { useState, useCallback } from 'react';

// Suppress CRX HMR errors in development (this is not a real extension page)
const originalError = console.error;
console.error = (...args: any[]) => {
  const message = args[0]?.toString() || '';
  if (message.includes('Attempting to use a disconnected port object') ||
      message.includes('Extension context invalidated')) {
    return; // Suppress extension-related errors in example pages
  }
  originalError.apply(console, args);
};

import { createRoot } from 'react-dom/client';
import { SearchableListView } from '../src/shared/ui/SearchableListView';
import { ToolbarButton, registerIcons } from '../src/shared/ui/ActionToolbar';

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
 * Dummy macros data for testing
 */
const DUMMY_MACROS: Macro[] = [
  {
    id: '1',
    name: 'Professional Greeting',
    shortcut: '/greet',
    content: 'Hello! Thank you for reaching out. How can I assist you today?',
    tags: ['common', 'professional', 'greeting']
  },
  {
    id: '2',
    name: 'Email Signature',
    shortcut: '/sig',
    content: 'Best regards,\nJohn Doe\nSenior Developer\njohn.doe@example.com',
    tags: ['signature', 'email']
  },
  {
    id: '3',
    name: 'Meeting Request',
    shortcut: '/meeting',
    content: "Let's schedule a meeting to discuss this further. Would any time this week work for you?",
    tags: ['scheduling', 'meeting']
  },
  {
    id: '4',
    name: 'Follow Up',
    shortcut: '/followup',
    content: "Just following up on my previous message. Have you had a chance to review it?",
    tags: ['common', 'follow-up']
  },
  {
    id: '5',
    name: 'Thank You',
    shortcut: '/thanks',
    content: "Thank you so much for your help with this! I really appreciate it.",
    tags: ['common', 'gratitude']
  },
  {
    id: '6',
    name: 'Code Review Comment',
    shortcut: '/lgtm',
    content: 'LGTM! Great work on this implementation. Just a few minor suggestions:\n\n- ',
    tags: ['development', 'review']
  },
  {
    id: '7',
    name: 'Bug Report Template',
    shortcut: '/bug',
    content: '**Bug Description:**\n\n**Steps to Reproduce:**\n1. \n\n**Expected Behavior:**\n\n**Actual Behavior:**\n\n**Environment:**',
    tags: ['development', 'template']
  },
  {
    id: '8',
    name: 'Out of Office',
    shortcut: '/ooo',
    content: "I'm currently out of office and will return on [DATE]. For urgent matters, please contact [NAME] at [EMAIL].",
    tags: ['email', 'auto-reply']
  },
  {
    id: '9',
    name: 'Project Status Update',
    shortcut: '/status',
    content: '**Project Status Update**\n\n✅ Completed:\n- \n\n🔄 In Progress:\n- \n\n📋 Next Steps:\n- ',
    tags: ['project', 'update']
  },
  {
    id: '10',
    name: 'Apology',
    shortcut: '/sorry',
    content: "I apologize for the delay in getting back to you. I'll make this a priority and get you an update shortly.",
    tags: ['common', 'professional']
  },
  {
    id: '11',
    name: 'Quick Question',
    shortcut: '/qq',
    content: "Quick question - do you have a moment to discuss [TOPIC]?",
    tags: ['common', 'question']
  },
  {
    id: '12',
    name: 'Documentation Link',
    shortcut: '/docs',
    content: "You can find more information about this in our documentation: [LINK]",
    tags: ['reference', 'documentation']
  }
];

/**
 * Main MacroListView component
 *
 * Now using the SearchableListView composed component which handles
 * keyboard coordination between search, list, and toolbar.
 */
function MacroListView({
  macros,
  onNewMacro,
  onEditMacro,
  onDeleteMacros
}: {
  macros: Macro[];
  onNewMacro: () => void;
  onEditMacro: (macro: Macro) => void;
  onDeleteMacros: (macros: Macro[]) => void;
}) {
  // Toolbar button configuration
  const toolbarButtons: ToolbarButton<Macro>[] = [
    {
      id: 'new',
      icon: 'plus',
      label: 'New Macro',
      enabled: 'always',
      action: () => onNewMacro(),
      shortcut: 'n'
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
  const renderMacroItem = useCallback((macro: Macro) => {
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
      <SearchableListView
        items={macros}
        itemKey="id"
        searchKeys={['name', 'shortcut', 'content', 'tags']}
        renderItem={renderMacroItem}
        buttons={toolbarButtons}
        onActivate={onEditMacro}
        config={{
          search: {
            algorithm: 'fuzzy',
            placeholder: 'Search macros... (↑↓ to navigate, Enter to open)',
            debounce: 150
          },
          list: {
            emptyState: (
              <div className="empty-state">
                <div className="empty-icon">📝</div>
                <div className="empty-text">No macros found</div>
                <div className="empty-hint">Try adjusting your search or create a new macro</div>
              </div>
            ),
            selectionConfig: {
              multiSelect: true,
              wrapNavigation: true
            }
          },
          toolbar: {
            position: 'footer',
            enableShortcuts: true
          },
          keyboard: {
            focusOnMount: true,
            wrapNavigation: true
          }
        }}
        className="macro-searchable-list"
      />
    </div>
  );
}

/**
 * App component
 */
function App() {
  const [macros, setMacros] = useState<Macro[]>(DUMMY_MACROS);

  const handleNewMacro = useCallback(() => {
    const newMacro: Macro = {
      id: String(Date.now()),
      name: 'New Macro',
      shortcut: '/new',
      content: 'Enter your macro content here...',
      tags: ['new']
    };
    setMacros(prev => [...prev, newMacro]);
    alert('New macro created! (This is a demo - in a real app, you would navigate to an editor)');
  }, []);

  const handleEditMacro = useCallback((macro: Macro) => {
    alert(`Edit macro: ${macro.name}\n\n${macro.content}\n\n(This is a demo - in a real app, you would navigate to an editor)`);
  }, []);

  const handleDeleteMacros = useCallback((macrosToDelete: Macro[]) => {
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

// Register icons for the toolbar
registerIcons({
  plus: { type: 'emoji', content: '➕' },
  edit: { type: 'emoji', content: '✏️' },
  trash: { type: 'emoji', content: '🗑️' }
});

// Render the app
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
