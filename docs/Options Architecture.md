# Options Architecture

Refactored options system following the Coordinator + Manager pattern used in the modal system.

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│           OptionsCoordinator                     │
│  (Public API - lifecycle, enable/disable)       │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│           OptionsManager                         │
│  (Core logic - state, validation, sync)         │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│           useMacroStore                          │
│  (Persistent storage via Zustand)               │
└──────────────────────────────────────────────────┘
```

## File Structure

```
src/options/
├── coordinators/
│   └── optionsCoordinator.ts       # Public API wrapper
├── managers/
│   └── optionsManager.ts           # Core state management
├── hooks/
│   └── useOptionsCoordinator.ts    # React hook for coordinator
├── ui/
│   ├── Options.tsx                 # Main options component
│   ├── PrefixEditor.tsx           # Prefix selection UI
│   └── ReplacementMode.tsx        # Commit keys toggle
├── index.ts                        # Public exports
└── main.tsx                        # Entry point for options page
```

## Key Components

### 1. OptionsCoordinator (`coordinators/optionsCoordinator.ts`)

**Purpose:** Public API for the options system

**Responsibilities:**
- Enable/disable options functionality
- Attach/detach lifecycle hooks
- Provide clean public API
- Wrapper around OptionsManager

**API:**
```typescript
interface OptionsCoordinator {
  // State management
  getState(): OptionsState;
  setPrefixes(prefixes: string[]): void;
  setUseCommitKeys(enabled: boolean): void;
  resetToDefaults(): void;

  // Subscriptions
  subscribe(callback: (state: OptionsState) => void): () => void;

  // Lifecycle
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
import { createOptionsManager, createOptionsCoordinator } from '@/options';

const manager = createOptionsManager();
const coordinator = createOptionsCoordinator(manager);

// Get current state
const state = coordinator.getState();

// Update settings
coordinator.setPrefixes(['/', '::', ';']);
coordinator.setUseCommitKeys(true);

// Reset to defaults
coordinator.resetToDefaults();

// Subscribe to changes
const unsubscribe = coordinator.subscribe((state) => {
  console.log('Options changed:', state);
});
```

### 2. OptionsManager (`managers/optionsManager.ts`)

**Purpose:** Core state management logic

**Responsibilities:**
- Manage internal state
- Validate option values
- Sync with macro store (Zustand)
- Notify subscribers of changes
- Pure business logic (no UI coupling)

**API:**
```typescript
interface OptionsManager {
  getState(): OptionsState;
  setState(state: Partial<OptionsState>): void;
  setPrefixes(prefixes: string[]): void;
  setUseCommitKeys(useCommitKeys: boolean): void;
  validate(state: Partial<OptionsState>): boolean;
  syncToStore(): void;
  syncFromStore(): void;
  subscribe(callback: (state: OptionsState) => void): () => void;
  destroy(): void;
}
```

**State:**
```typescript
interface OptionsState {
  prefixes: string[];        // Macro trigger prefixes (e.g., ['/', '::'])
  useCommitKeys: boolean;    // Whether to use commit keys for macro expansion
}
```

**Validation:**
- Prefixes must be non-empty strings
- At least one prefix must be selected
- useCommitKeys must be a boolean

### 3. useOptionsCoordinator Hook (`hooks/useOptionsCoordinator.ts`)

**Purpose:** React hook to access the options coordinator

**Usage:**
```typescript
import { useOptionsCoordinator } from '@/options';

function OptionsPage() {
  const coordinator = useOptionsCoordinator();
  const [state, setState] = useState(coordinator.getState());

  useEffect(() => {
    return coordinator.subscribe(setState);
  }, [coordinator]);

  return (
    <div>
      <button onClick={() => coordinator.setPrefixes(['/', '::'])}>
        Update Prefixes
      </button>
    </div>
  );
}
```

## Migration from Old Architecture

### Old Architecture (Manager + Actions)

```
OptionsManager
├── Delegates to OptionsActions
└── Subscribes to useMacroStore

OptionsActions
└── Interface with callbacks
```

**Issues:**
- Tight coupling between manager and store
- Actions abstraction was too thin
- No clear public API boundary
- Difficult to test in isolation

### New Architecture (Coordinator + Manager)

```
OptionsCoordinator (Public API)
└── OptionsManager (Core Logic)
    └── useMacroStore (Persistence)
```

**Benefits:**
- ✅ Clear separation of concerns
- ✅ Coordinator handles public API + lifecycle
- ✅ Manager handles pure business logic
- ✅ Consistent with modal architecture
- ✅ Better testability
- ✅ Easier to extend with new features

## Comparison with Modal Architecture

Both systems now follow the same pattern:

| Aspect | Modal System | Options System |
|--------|-------------|----------------|
| **Coordinator** | ModalCoordinator | OptionsCoordinator |
| **Manager** | ModalManager | OptionsManager |
| **Hook** | N/A (direct import) | useOptionsCoordinator |
| **UI** | ModalShell + Views | Options + Components |
| **State** | React state in Manager | Zustand store |

## Default Values

```typescript
const DEFAULT_OPTIONS: OptionsState = {
  prefixes: ['::'],
  useCommitKeys: false,
};
```

## Future Enhancements

1. **Import/Export:** Add methods to import/export options as JSON
2. **Validation Messages:** Return detailed validation errors
3. **Undo/Redo:** Track option changes with history
4. **Keyboard Shortcuts:** Add shortcuts via coordinator.attach()
5. **Remote Sync:** Sync options across browser instances
6. **Options Presets:** Save and load different option configurations
7. **Integration with Modal:** Add options as a view in the unified modal system

## Integration with Modal System

When adding options to the unified modal system:

```typescript
// In modalCoordinator
modalCoordinator.show('settings');

// In SettingsView.tsx
import { useOptionsCoordinator } from '@/options';

function SettingsView({ onClose }: BaseModalViewProps) {
  const coordinator = useOptionsCoordinator();
  const [state, setState] = useState(coordinator.getState());

  useEffect(() => {
    return coordinator.subscribe(setState);
  }, [coordinator]);

  return (
    <div>
      <PrefixEditor coordinator={coordinator} prefixes={state.prefixes} />
      <ReplacementMode coordinator={coordinator} useCommitKeys={state.useCommitKeys} />
    </div>
  );
}
```

This maintains consistency across the entire application architecture.
