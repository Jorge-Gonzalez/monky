# UI Infrastructure Integration Plan

## Context

This document outlines the plan to integrate the new UI infrastructure layer (SearchableListView, MultiSelectList, FuzzySearchField, ActionToolbar) with the macro editor using the **Thick Adapter** approach.

## Current Status

### ✅ Completed

1. **UI Infrastructure Layer (Generic, Reusable)**
   - `SearchableListView` - Coordinator component for search + list + toolbar
   - `MultiSelectList` - Generic list with selection and keyboard navigation
   - `FuzzySearchField` - Generic search input with filtering
   - `ActionToolbar` - Generic button toolbar with shortcuts
   - All components are domain-agnostic and fully tested

2. **Domain Layer (Macro-specific)**
   - `EditorCoordinator` - Public API for macro CRUD operations
   - `EditorManager` - Business logic and state coordination
   - `EditorActions` - Data persistence layer
   - `MacroStore` (Zustand) - State management

3. **Bug Fix**
   - Fixed issue where keyboard navigation from search field wasn't selecting items
   - Added controlled `selection` prop to MultiSelectList
   - Test created and passing: "should move focus to list and select first element when down arrow is pressed from search field"

### 🚧 In Progress

1. **Refining UI Infrastructure**
   - Fine-tuning component behavior
   - Ensuring all edge cases are handled

2. **Creating Editor Components in Layered System**
   - Need to create the actual macro **editor view** (form for creating/editing a single macro)
   - Currently have the **list view** (old implementation)

### ⏳ Pending (This Task)

**Integration of UI Infrastructure with Macro Editor using Thick Adapter Pattern**

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│ VIEW LAYER (Composition)                                    │
│ - MacroEditorView: Main view that composes list + form      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ THICK ADAPTER LAYER (Domain-Specific UI Components)         │
│ - MacroListView: Domain wrapper around SearchableListView   │
│ - useMacroToolbarButtons: Button configuration hook         │
│ - useMacroItemRenderer: Item rendering hook                 │
│ - macroListConfig: Centralized configuration                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ UI INFRASTRUCTURE LAYER (Generic, Reusable)                 │
│ - SearchableListView (UI Coordinator)                       │
│ - MultiSelectList, FuzzySearchField, ActionToolbar          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ DOMAIN LAYER (Business Logic)                               │
│ - EditorCoordinator → EditorManager → Actions → Store       │
└─────────────────────────────────────────────────────────────┘
```

## Two-Phase Macro Editor System

### Phase 1: List View (Macro Management)
**Purpose**: Browse, search, select, and manage macros

**Location**: Modal/Popup where users see all their macros

**Features**:
- Search macros by name, shortcut, content, tags
- Multi-select macros
- Keyboard navigation (up/down arrows, enter to edit)
- Actions: New, Edit, Delete

**Implementation**: Use `MacroListView` (thick adapter around `SearchableListView`)

### Phase 2: Editor View (Macro Creation/Editing)
**Purpose**: Create new macro or edit existing macro

**Location**: Separate view/modal (needs to be created in new layered system)

**Features**:
- Form fields: name, shortcut, content, tags
- Validation
- Save/Cancel actions
- Preview (optional)

**Implementation**: Create `MacroEditorForm` component (to be designed)

## Implementation Plan - Thick Adapter Approach

### Step 1: Create Adapter Hooks

#### File: `src/editor/adapters/useMacroToolbarButtons.ts`

```typescript
import { useCallback } from 'react';
import { ToolbarButton } from '@/shared/ui/ActionToolbar';
import { EditorCoordinator } from '../coordinators/editorCoordinator';
import { Macro } from '@/types';

/**
 * Hook: Provides toolbar button configuration for macro list
 * Encapsulates all button logic for macros
 */
export function useMacroToolbarButtons(
  coordinator: EditorCoordinator
): ToolbarButton<Macro>[] {

  const handleNew = useCallback(async () => {
    const result = await coordinator.createMacro({
      name: 'New Macro',
      shortcut: '/new',
      content: '',
      tags: []
    });

    if (!result.success) {
      console.error('Failed to create macro:', result.error);
      // TODO: Integrate with toast/notification system
    }
  }, [coordinator]);

  const handleEdit = useCallback((macros: Macro[]) => {
    coordinator.setEditingMacro(macros[0]);
  }, [coordinator]);

  const handleDelete = useCallback(async (macros: Macro[]) => {
    const confirmed = confirm(
      macros.length === 1
        ? `Delete "${macros[0].name}"?`
        : `Delete ${macros.length} macros?`
    );

    if (!confirmed) return;

    for (const macro of macros) {
      const result = await coordinator.deleteMacro(macro.id);
      if (!result.success) {
        console.error('Failed to delete macro:', result.error);
      }
    }
  }, [coordinator]);

  return [
    {
      id: 'new',
      icon: 'plus',
      label: 'New Macro',
      enabled: 'always',
      action: handleNew,
      shortcut: 'n'
    },
    {
      id: 'edit',
      icon: 'edit',
      label: 'Edit',
      enabled: 'single',
      action: handleEdit,
      shortcut: 'Enter'
    },
    {
      id: 'delete',
      icon: 'trash',
      label: 'Delete',
      enabled: 'any',
      action: handleDelete,
      shortcut: 'Delete'
    }
  ];
}
```

#### File: `src/editor/adapters/useMacroItemRenderer.tsx`

```typescript
import { useCallback } from 'react';
import { Macro } from '@/types';

/**
 * Hook: Provides render function for macro items
 * Encapsulates macro item presentation logic
 */
export function useMacroItemRenderer() {
  return useCallback((macro: Macro) => (
    <div className="macro-item-content">
      <div className="macro-header">
        <span className="macro-name">{macro.name}</span>
        <span className="macro-shortcut">{macro.shortcut}</span>
      </div>
      <div className="macro-preview">
        {macro.content.substring(0, 100)}
        {macro.content.length > 100 && '...'}
      </div>
      {macro.tags && macro.tags.length > 0 && (
        <div className="macro-tags">
          {macro.tags.map(tag => (
            <span key={tag} className="tag">{tag}</span>
          ))}
        </div>
      )}
    </div>
  ), []);
}
```

#### File: `src/editor/adapters/macroListConfig.ts`

```typescript
import { SearchableListConfig } from '@/shared/ui/SearchableListView';

/**
 * Configuration for macro list view
 * Centralized configuration makes it easy to adjust behavior
 */
export const MACRO_LIST_CONFIG: SearchableListConfig = {
  search: {
    algorithm: 'fuzzy',
    placeholder: 'Search macros... (↑↓ to navigate, Enter to edit)',
    debounce: 150,
    minChars: 0,
    clearButton: true
  },
  list: {
    emptyState: (
      <div className="empty-state">
        <div className="empty-icon">📝</div>
        <div className="empty-text">No macros found</div>
        <div className="empty-hint">
          Try adjusting your search or create a new macro
        </div>
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
    wrapNavigation: true,
    smartNavigation: true
  }
};
```

### Step 2: Create Domain-Specific Wrapper Component

#### File: `src/editor/components/MacroListView.tsx`

```typescript
import { SearchableListView } from '@/shared/ui/SearchableListView';
import { EditorCoordinator } from '../coordinators/editorCoordinator';
import { useMacroToolbarButtons } from '../adapters/useMacroToolbarButtons';
import { useMacroItemRenderer } from '../adapters/useMacroItemRenderer';
import { MACRO_LIST_CONFIG } from '../adapters/macroListConfig';
import { Macro } from '@/types';

interface MacroListViewProps {
  macros: Macro[];
  coordinator: EditorCoordinator;
  onMacroActivate?: (macro: Macro) => void;
  className?: string;
}

/**
 * Domain-specific wrapper around SearchableListView for macros
 * This is the "thick adapter" - encapsulates all macro-specific logic
 *
 * Benefits:
 * - Reusable across different views (modal, popup, sidebar)
 * - Testable independently
 * - Clean separation of concerns
 * - Encapsulates all macro list domain logic
 */
export function MacroListView({
  macros,
  coordinator,
  onMacroActivate,
  className = ''
}: MacroListViewProps) {
  // Use specialized hooks for domain logic
  const buttons = useMacroToolbarButtons(coordinator);
  const renderItem = useMacroItemRenderer();

  const handleActivate = (macro: Macro) => {
    if (onMacroActivate) {
      onMacroActivate(macro);
    } else {
      // Default behavior: set as editing in coordinator
      coordinator.setEditingMacro(macro);
    }
  };

  return (
    <SearchableListView
      items={macros}
      itemKey="id"
      searchKeys={['name', 'shortcut', 'content', 'tags']}
      renderItem={renderItem}
      buttons={buttons}
      onActivate={handleActivate}
      config={MACRO_LIST_CONFIG}
      className={`macro-list-view ${className}`}
    />
  );
}
```

### Step 3: Update MacroEditorView to Use New Component

#### File: `src/content/overlays/views/macroEditor/ui/MacroEditorView.tsx`

```typescript
import { useState, useEffect } from 'react';
import { BaseModalViewProps } from '../../../modal/types';
import { useEditorCoordinator } from '../../../../../editor/hooks/useEditorCoordinator';
import { MacroListView } from '../../../../../editor/components/MacroListView';
import MacroForm from '../../../../../editor/ui/MacroForm';
import { t } from '../../../../../lib/i18n';

/**
 * MacroEditorView - Two-phase macro management
 *
 * Phase 1: List view (browse, search, select macros)
 * Phase 2: Editor view (create/edit individual macro)
 */
export function MacroEditorView({ containerRef }: BaseModalViewProps) {
  const coordinator = useEditorCoordinator();
  const [state, setState] = useState(coordinator.getState());

  useEffect(() => {
    const unsubscribe = coordinator.subscribe(setState);
    return unsubscribe;
  }, [coordinator]);

  return (
    <div className="macro-editor-view">
      <div className="editor-container">
        <h1 className="view-title">{t('editor.title')}</h1>

        {/* Phase 2: Editor Form (when editing/creating) */}
        {state.editingMacro && (
          <MacroForm
            editing={state.editingMacro}
            onDone={() => coordinator.resetForm()}
            coordinator={coordinator}
            containerRef={containerRef}
          />
        )}

        {/* Phase 1: List View (always visible) */}
        <MacroListView
          macros={state.macros}
          coordinator={coordinator}
        />
      </div>
    </div>
  );
}
```

## File Structure

```
src/
├── shared/
│   └── ui/                              # UI Infrastructure Layer
│       ├── SearchableListView.tsx       # ✅ Done
│       ├── SearchableListView.test.tsx  # ✅ Done
│       ├── MultiSelectList.tsx          # ✅ Done
│       ├── FuzzySearchField.tsx         # ✅ Done
│       └── ActionToolbar.tsx            # ✅ Done
│
├── editor/
│   ├── adapters/                        # ⏳ To Create (Thick Adapter)
│   │   ├── useMacroToolbarButtons.ts    # Hook: Button configuration
│   │   ├── useMacroItemRenderer.tsx     # Hook: Item rendering
│   │   └── macroListConfig.ts           # Config: List behavior
│   │
│   ├── components/                      # ⏳ To Create (Domain Components)
│   │   ├── MacroListView.tsx            # Wrapper: Macro-specific list
│   │   └── MacroListView.test.tsx       # Tests for wrapper
│   │
│   ├── coordinators/
│   │   └── editorCoordinator.ts         # ✅ Done
│   │
│   ├── managers/
│   │   └── editorManager.ts             # ✅ Done
│   │
│   └── ui/
│       ├── MacroForm.tsx                # ✅ Done (needs update?)
│       └── MacroListEditor.tsx          # ⏳ To Replace with MacroListView
│
└── content/
    └── overlays/
        └── views/
            └── macroEditor/
                └── ui/
                    └── MacroEditorView.tsx  # ⏳ To Update
```

## Testing Strategy

### Unit Tests (Isolated)

1. **Test adapter hooks independently**
   ```typescript
   // src/editor/adapters/useMacroToolbarButtons.test.ts
   describe('useMacroToolbarButtons', () => {
     it('should create toolbar buttons with correct configuration', () => {
       // Test button structure
     });

     it('should call coordinator.createMacro when new button clicked', () => {
       // Test new action
     });

     it('should call coordinator.setEditingMacro when edit button clicked', () => {
       // Test edit action
     });

     it('should call coordinator.deleteMacro when delete button clicked', () => {
       // Test delete action with confirmation
     });
   });
   ```

2. **Test MacroListView wrapper**
   ```typescript
   // src/editor/components/MacroListView.test.tsx
   describe('MacroListView', () => {
     it('should render SearchableListView with macros', () => {
       // Test rendering
     });

     it('should pass correct props to SearchableListView', () => {
       // Test prop mapping
     });

     it('should handle macro activation', () => {
       // Test onActivate behavior
     });
   });
   ```

### Integration Tests

1. **Test MacroEditorView with MacroListView**
   - Verify coordinator state flows correctly
   - Test transition between list and form views
   - Test full CRUD workflow

## Benefits of Thick Adapter Approach

### ✅ Reusability
- `MacroListView` can be used in:
  - Modal overlay
  - Browser extension popup
  - Sidebar panel
  - Settings page

### ✅ Maintainability
- Each concern in separate file (30-50 lines each)
- Easy to find and fix specific issues
- Clear responsibility for each module

### ✅ Testability
- Test hooks independently
- Test wrapper component independently
- Mock coordinator easily

### ✅ Scalability
- Add new buttons: just update `useMacroToolbarButtons`
- Change rendering: just update `useMacroItemRenderer`
- Adjust behavior: just update `macroListConfig`

### ✅ Separation of Concerns
- UI Infrastructure: Generic, reusable
- Adapter Layer: Domain-specific logic
- View Layer: Composition only

## Migration Path

1. ✅ **Phase 1**: Create UI infrastructure (DONE)
2. ✅ **Phase 2**: Fix bugs and refine behavior (DONE)
3. 🚧 **Phase 3**: Refine UI infrastructure further (IN PROGRESS)
4. 🚧 **Phase 4**: Create editor form in new layered system (IN PROGRESS)
5. ⏳ **Phase 5**: Create thick adapter layer (THIS TASK)
6. ⏳ **Phase 6**: Update MacroEditorView to use new components
7. ⏳ **Phase 7**: Remove old MacroListEditor component
8. ⏳ **Phase 8**: Test full integration
9. ⏳ **Phase 9**: Deploy and monitor

## Important Notes

- **Preferred Approach**: Thick Adapter (confirmed by user)
- **Layer Separation**: UI infrastructure remains generic and domain-agnostic
- **State Management**: EditorCoordinator remains single source of truth
- **Keyboard Navigation**: Already working correctly after bug fix
- **Selection Behavior**: Fixed to properly select items when navigating from search

## Related Files

- Main discussion: Context of this conversation
- Bug fix: `SearchableListView.tsx` line 150, 170-172, 178-180, 356
- Test: `SearchableListView.test.tsx` line 69-86
- Example: `examples/macro-list.tsx` (demonstrates usage)

## Next Steps When Ready

1. Create the adapter layer files (hooks and config)
2. Create `MacroListView` wrapper component
3. Update `MacroEditorView` to use new component
4. Write tests for adapter layer
5. Test full integration
6. Remove old implementation

---

**Status**: Ready for implementation when editor form is complete
**Date Created**: 2025-11-13
**Preferred Approach**: Thick Adapter Pattern
