# New Structure: Action Pattern for Popup and Editor Components

## Overview
This document outlines how to restructure the popup and editor components to follow the same action-based architecture as the overlay components.

## Current vs Proposed Structure

### Current Structure
- Direct interaction with global store
- Local state management tightly coupled with UI
- Less separation of concerns

### Proposed Structure
- Action interface contracts
- Managers for encapsulated state
- Separation of UI from business logic
- Composable action handlers

## Detailed Architecture

### 1. Action Interface Definitions

#### Popup Actions
```typescript
interface PopupActions {
  onThemeChanged(theme: 'light' | 'dark' | 'system'): void
  onSiteToggled(hostname: string, isEnabled: boolean): void
  onNewMacroRequested(): void
  onError(error: string): void
}
```

#### Editor Actions  
```typescript
interface EditorActions {
  onMacroCreated(macro: Macro): void
  onMacroUpdated(macro: Macro): void
  onMacroDeleted(macroId: string): void
  onSettingsChanged(settings: Partial<MacroConfig>): void
  onError(error: string): void
}
```

### 2. Action Manager Implementation

#### PopupManager
```typescript
interface PopupManager {
  // Theme management
  setTheme(theme: 'light' | 'dark' | 'system'): void
  getTheme(): 'light' | 'dark' | 'system'
  
  // Site enable/disable
  toggleSite(hostname: string): void
  isSiteEnabled(hostname: string): boolean
  
  // New macro flow
  requestNewMacro(): void
  
  // State management
  getState(): PopupState
  subscribe(callback: (state: PopupState) => void): () => void
}
```

#### EditorManager
```typescript
interface EditorManager {
  // Macro CRUD operations
  createMacro(macro: Omit<Macro, 'id'>): Promise<{success: boolean, error?: string}>
  updateMacro(id: string, macro: Partial<Macro>): Promise<{success: boolean, error?: string}>
  deleteMacro(id: string): Promise<{success: boolean, error?: string}>
  
  // Form state management
  getEditingMacro(): Macro | null
  setEditingMacro(macro: Macro | null): void
  resetForm(): void
  
  // State management
  subscribe(callback: (state: EditorState) => void): () => void
}
```

### 3. Coordinator Pattern Implementation

#### PopupCoordinator
```typescript
function createPopupCoordinator(actions: PopupActions): PopupManager {
  // Handles interaction between UI and store
  // Manages complex popup logic
  // Provides clean API for UI components
}
```

#### EditorCoordinator
```typescript
function createEditorCoordinator(actions: EditorActions): EditorManager {
  // Handles interaction between editor UI and store
  // Manages complex editor state transitions
  // Provides clean API for editor components
}
```

### 4. Implementation Structure

#### Popup Component Structure
```
src/popup/
├── Popup.tsx                    # UI component (now UI-only)
├── actions/                     # Action interfaces and implementations
│   ├── popupActions.ts          # PopupActions interface
│   ├── createDefaultPopupActions.ts  # Default store-based implementation
│   └── createMockPopupActions.ts     # Mock implementation for testing
├── managers/                    # State management
│   ├── createPopupManager.ts    # PopupManager implementation
│   └── usePopupManager.ts       # Hook for React integration
└── services/                    # Business logic
    └── createPopupCoordinator.ts # Coordinator implementation
```

#### Editor Component Structure
```
src/editor/
├── Editor.tsx                   # UI component (now UI-only)
├── actions/                     # Action interfaces and implementations
│   ├── editorActions.ts         # EditorActions interface
│   ├── createDefaultEditorActions.ts  # Default store-based implementation
│   └── createMockEditorActions.ts     # Mock implementation for testing
├── managers/                    # State management
│   ├── createEditorManager.ts   # EditorManager implementation
│   └── useEditorManager.ts      # Hook for React integration
├── services/                    # Business logic
│   └── createEditorCoordinator.ts # Coordinator implementation
└── ui/                          # Presentational components
    ├── MacroForm.tsx
    ├── MacroListEditor.tsx
    └── Settings.tsx
```

### 5. Benefits of New Structure

#### Consistency
- Same action pattern used across all UI components
- Predictable architecture patterns
- Common mental model for developers

#### Testability
- Easy mocking of actions for UI testing
- Isolated testing of business logic
- Clear separation between UI and logic

#### Flexibility
- Multiple action handlers can be composed
- UI components can be easily reused with different backends
- Easier to implement different persistence strategies

#### Maintainability
- Clearer code organization
- Reduced coupling between components
- Easier to understand data flow

### 6. Migration Strategy

#### Phase 1: Define Action Interfaces
- Create action interfaces for popup and editor
- Define clear contracts between UI and business logic

#### Phase 2: Implement Managers
- Create manager classes to encapsulate state
- Implement the core business logic in coordinators

#### Phase 3: Update UI Components
- Remove direct store dependencies from UI components
- Connect UI to managers via hooks

#### Phase 4: Refactor Data Flow
- Ensure all state changes go through action handlers
- Verify proper error handling and user feedback

### 7. Example Component Refactoring

#### Before (Current)
```tsx
// Popup.tsx - Direct store interaction
export default function Popup() {
  const { theme, setTheme } = useMacroStore(state => ({
    theme: state.config.theme ?? 'system',
    setTheme: state.setTheme,
  }));
  
  return (
    <button onClick={() => setTheme('light')}>Light Theme</button>
  );
}
```

#### After (Proposed)
```tsx
// Popup.tsx - UI only
interface PopupProps {
  manager: PopupManager;
}

export default function Popup({ manager }: PopupProps) {
  const [theme, setThemeState] = useState(manager.getTheme());
  
  useEffect(() => {
    return manager.subscribe((state) => {
      setThemeState(state.theme);
    });
  }, [manager]);
  
  return (
    <button onClick={() => manager.setTheme('light')}>
      Light Theme
    </button>
  );
}
```

This structure would align the popup and editor components with the sophisticated action-based architecture already implemented in the overlay components.