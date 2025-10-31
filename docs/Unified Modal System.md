# Unified Modal System

A centralized modal architecture that supports multiple views (Search, Settings, Editor) with seamless navigation between them.

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│              ModalCoordinator                    │
│  (Public API - attach/detach, enable/disable)   │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│              ModalManager                        │
│  (Lifecycle, rendering, view switching)         │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│              ModalShell                          │
│  (Backdrop, dialog, navigation, theming)        │
└──────────────────┬──────────────────────────────┘
                   │
      ┌────────────┴────────────┬──────────────┐
      │                         │              │
┌─────▼──────┐    ┌────────────▼───┐   ┌──────▼────────┐
│   Search   │    │   Settings     │   │    Editor     │
│    View    │    │      View      │   │     View      │
└────────────┘    └────────────────┘   └───────────────┘
```

## Key Components

### 1. ModalCoordinator (`src/content/coordinators/ModalCoordinator.ts`)

**Purpose:** Public API for the modal system

**Responsibilities:**
- Enable/disable modal functionality
- Attach/detach event listeners
- Lifecycle management
- Wrapper around ModalManager

**API:**
```typescript
interface ModalCoordinator {
  show(view?: ModalView, x?: number, y?: number): void;
  hide(): void;
  switchView(view: ModalView): void;
  isVisible(): boolean;
  getCurrentView(): ModalView | null;
  setOnMacroSelected(callback): void;
  attach(): void;
  detach(): void;
  enable(): void;
  disable(): void;
  isEnabled(): boolean;
  destroy(): void;
}
```

**Usage:**
```typescript
import { modalCoordinator } from '@/content/overlays';

// Show search view
modalCoordinator.show('search');

// Switch to settings while modal is open
modalCoordinator.switchView('settings');

// Close modal
modalCoordinator.hide();
```

### 2. ModalManager (`modal/modalManager.ts`)

**Purpose:** Core modal lifecycle and rendering logic

**Responsibilities:**
- React rendering via `reactRenderer`
- Focus management via `focusManager`
- Style injection via `styleInjector`
- View switching logic
- Macro selection handling

**Internal API:**
```typescript
interface ModalManager {
  show(view?: ModalView, x?: number, y?: number): void;
  hide(): void;
  switchView(view: ModalView): void;
  isVisible(): boolean;
  getCurrentView(): ModalView | null;
  destroy(): void;
  setOnMacroSelected(callback): void;
}
```

### 3. ModalShell (`modal/ui/ModalShell.tsx`)

**Purpose:** Shared modal UI wrapper

**Responsibilities:**
- Backdrop rendering with click-to-close
- Dialog container with centering
- Theme integration via `useThemeColors`
- Global keyboard handling (Escape) via `useModalKeyboard`
- Navigation tabs via `ModalNavigation`

**Props:**
```typescript
interface ModalShellProps {
  isVisible: boolean;
  onClose: () => void;
  currentView: ModalView;
  onViewChange: (view: ModalView) => void;
  children: React.ReactNode;
}
```

### 4. ModalNavigation (`modal/ui/ModalNavigation.tsx`)

**Purpose:** Tab-based view switcher

**Features:**
- Three tabs: Search, Editor, Settings
- Active tab highlighting
- Icons + labels
- Accessible (aria-current)

### 5. Views

Each view implements `BaseModalViewProps`:

```typescript
interface BaseModalViewProps {
  onClose: () => void;
  onViewChange: (view: ModalView) => void;
}
```

#### MacroSearchView (`views/search/ui/MacroSearchView.tsx`)
- Search macros by command or text
- Fuzzy search with fuzzysort
- Keyboard navigation (↑↓)
- Enter to select
- Components: `MacroSearchInput`, `MacroSearchResults`, `MacroSearchFooter`

#### SettingsView (`views/settings/ui/SettingsView.tsx`)
- Placeholder for extension settings
- To be implemented

#### MacroEditorView (`views/macroEditor/ui/MacroEditorView.tsx`)
- Placeholder for macro creation/editing
- To be implemented

## Styling

### Modal Styles (`modal/modalStyles.ts`)
Shared styles for all views:
- Backdrop and dialog container
- Navigation tabs
- Common input styles
- Scrollbar styles
- Keyboard hint styles

### View-Specific Styles
Each view has its own stylesheet:
- `views/search/searchViewStyles.ts`
- `views/settings/settingsViewStyles.ts`
- `views/macroEditor/editorViewStyles.ts`

All styles use CSS variables for theming:
- `--bg-primary`, `--bg-secondary`, `--bg-tertiary`
- `--text-primary`, `--text-secondary`, `--text-accent`
- `--border-primary`, `--border-secondary`
- `--scrollbar-thumb`, `--scrollbar-track`

## Hooks

### useModalKeyboard (`modal/hooks/useModalKeyboard.ts`)
Global keyboard handler for modal:
- Escape key closes modal
- Uses capture phase for priority
- Auto cleanup on unmount

## Backward Compatibility

The old `searchCoordinator` API is preserved via an adapter in `src/content/overlays/index.ts`:

```typescript
export const searchCoordinator = {
  show: (x?: number, y?: number) => modalCoordinator.show('search', x, y),
  hide: () => modalCoordinator.hide(),
  isVisible: () => modalCoordinator.isVisible() && modalCoordinator.getCurrentView() === 'search',
  // ... other methods
};
```

This ensures existing code continues to work without changes.

## Adding a New View

1. **Create the view component:**
   ```typescript
   // views/myview/ui/MyView.tsx
   export function MyView({ onClose, onViewChange }: BaseModalViewProps) {
     return <div>My view content</div>;
   }
   ```

2. **Create view styles:**
   ```typescript
   // views/myview/myViewStyles.ts
   export const MY_VIEW_STYLES = `...`;
   ```

3. **Update ModalView type:**
   ```typescript
   // modal/types.ts
   export type ModalView = 'search' | 'settings' | 'editor' | 'myview';
   ```

4. **Add to ModalManager:**
   ```typescript
   // modal/modalManager.ts
   import { MY_VIEW_STYLES } from '../views/myview/myViewStyles';

   const allStyles = [..., MY_VIEW_STYLES].join('\n');

   const renderView = () => {
     // ...
     case 'myview':
       return React.createElement(MyView, viewProps);
   };
   ```

5. **Add to ModalNavigation:**
   ```typescript
   // modal/ui/ModalNavigation.tsx
   const tabs = [
     // ...
     { view: 'myview', label: 'My View', icon: '🎨' },
   ];
   ```

## Testing

Use `test-modal.html` to test the modal system:

1. Build the extension
2. Inject the bundle into `test-modal.html`
3. Test:
   - Opening each view
   - Switching between views
   - Closing modal
   - Focus restoration
   - Keyboard navigation (Escape, arrows, Enter)
   - Click outside to close

## Migration Notes

### Old Architecture (searchOverlay)
```
searchOverlay/
├── ui/MacroSearchOverlay.tsx (included backdrop + modal + search)
├── searchOverlayManager.ts
└── hooks/
```

### New Architecture (modal)
```
modal/
├── ui/
│   ├── ModalShell.tsx (backdrop + dialog + nav)
│   └── ModalNavigation.tsx
├── modalManager.ts
└── hooks/

views/
├── search/
│   └── ui/MacroSearchView.tsx (search only)
├── settings/
└── macroEditor/
```

**Benefits:**
- ✅ Single modal container for all views
- ✅ Easy navigation between views (tabs)
- ✅ Shared infrastructure (keyboard, focus, theming)
- ✅ Scales well for new views
- ✅ Better separation of concerns
- ✅ Backward compatible

## Future Enhancements

1. **View State Persistence:** Remember form state when switching views
2. **Modal Positioning:** Use the `position` parameter for context-aware placement
3. **Animations:** Add smooth transitions when switching views
4. **Keyboard Shortcuts:** Add shortcuts to quickly switch views (e.g., Cmd+1, Cmd+2)
5. **View History:** Back/forward navigation between views
6. **Deep Linking:** Open modal to specific view from URL or command
