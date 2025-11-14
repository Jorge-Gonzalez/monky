# SearchableListView

Composed infrastructure component that coordinates `MultiSelectList`, `FuzzySearchField`, and `ActionToolbar` with smart keyboard navigation.

## Philosophy

This is a **Level 2** component in our infrastructure:
- **Level 1**: Primitive components (MultiSelectList, FuzzySearchField, ActionToolbar) - agnostic
- **Level 2**: SearchableListView - composed coordinator, still domain-agnostic
- **Level 3**: Your application (MacroListView, etc.) - domain-specific

## Features

### Smart Keyboard Navigation (Context-Aware) - Default Mode

- **Search field starts focused** - type immediately to filter
- **Arrow keys navigate the list visually** without losing search focus
- **Enter activates** the highlighted item
- **Tab** switches focus to the list for traditional navigation
- **Up from first item** stays at first item (no wrap-around)

This creates a keyboard-centric flow where you never need to reach for the mouse.

### Traditional Navigation Mode

You can disable smart navigation for traditional list behavior:
- **Arrow keys only work when list has focus**
- **Use Tab to switch focus** from search to list
- **Navigation wraps around** (up from first goes to last, down from last goes to first)

### State Coordination

The component manages:
- Filtered items (search → list)
- Selected items (list → toolbar)
- Focused index (search arrow keys → visual highlight)
- Focus context (search vs list mode)

### Configuration

Uses a config object pattern for flexibility with good defaults:

```tsx
config={{
  search: {
    algorithm: 'fuzzy' | 'substring' | 'startsWith',
    debounce: 150,
    minChars: 0,
    placeholder: 'Search...',
    clearButton: true
  },
  list: {
    emptyState: React.ReactNode,
    selectionConfig: { multiSelect: true, wrapNavigation: true }
  },
  toolbar: {
    position: 'header' | 'footer',
    enableShortcuts: true
  },
  keyboard: {
    focusOnMount: true,
    wrapNavigation: true,
    smartNavigation: true  // false for traditional mode
  }
}}
```

## Basic Usage

```tsx
import { SearchableListView, ToolbarButton } from '@/shared/ui';

function MyList({ items }) {
  const buttons: ToolbarButton<Item>[] = [
    {
      id: 'new',
      icon: 'plus',
      label: 'New',
      enabled: 'always',
      action: () => createNew()
    },
    {
      id: 'edit',
      icon: 'edit',
      label: 'Edit',
      enabled: 'single',
      action: (items) => edit(items[0])
    }
  ];

  return (
    <SearchableListView
      items={items}
      itemKey="id"
      searchKeys={['name', 'description']}
      renderItem={(item) => <div>{item.name}</div>}
      buttons={buttons}
      onActivate={(item) => edit(item)}
    />
  );
}
```

## Advanced Usage

```tsx
<SearchableListView
  items={macros}
  itemKey="id"
  searchKeys={['name', 'shortcut', 'content', 'tags']}
  renderItem={(macro) => <MacroItem {...macro} />}
  buttons={toolbarButtons}
  onSelect={(keys, items) => console.log('Selected:', items)}
  onActivate={(item) => editMacro(item)}
  onSearchChange={(query, results) => console.log('Filtered:', results)}
  config={{
    search: {
      algorithm: 'fuzzy',
      placeholder: 'Search macros... (↑↓ to navigate)',
      debounce: 100
    },
    list: {
      emptyState: <CustomEmptyState />,
      selectionConfig: { multiSelect: true }
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
  }}
  className="my-custom-list"
/>
```

## Keyboard Behavior

### Smart Mode (smartNavigation: true - default)

#### When Search is Focused

| Key | Action |
|-----|--------|
| Type | Filter the list |
| ↓ | Move highlight down (visual only) |
| ↑ | Move highlight up (stays at first, no wrap) |
| Enter | Activate highlighted item |
| Tab | Switch focus to list |
| Escape | Clear search (if has text) |

#### When List is Focused (after Tab)

| Key | Action |
|-----|--------|
| ↓ | Navigate down (moves focus) |
| ↑ | Navigate up (returns to search from first item) |
| Enter | Activate focused item |
| Tab | Return focus to search |
| Click | Select item (Ctrl+Click for multi) |

### Traditional Mode (smartNavigation: false)

Arrow keys only work when list has focus. Use Tab to switch from search to list.

| Key | Action |
|-----|--------|
| ↓ | Navigate down (wraps to first from last) |
| ↑ | Navigate up (wraps to last from first) |
| Enter | Activate focused item |
| Click | Select item (Ctrl+Click for multi) |

### Toolbar Shortcuts

Global shortcuts (when `enableShortcuts: true`):
- Custom per button (e.g., 'n' for New, 'Delete' for Delete)

## Styling

The component provides semantic CSS classes:

```css
/* Main container */
.searchable-list-view { }

/* Sections */
.searchable-list-search { }
.searchable-list-container { }
.searchable-list-toolbar { }

/* Search-focused item (visual highlight) */
.search-focused-item { }

/* Inherited from primitives */
.list-item { }
.list-item.selected { }
.list-item.focused { }
.toolbar-button { }
```

## Props API

```tsx
interface SearchableListViewProps<T> {
  // Required
  items: T[];
  itemKey: keyof T | ((item: T) => string | number);
  searchKeys: (keyof T)[];
  renderItem: (item: T, index: number) => React.ReactNode;

  // Optional
  buttons?: ToolbarButton<T>[];
  config?: SearchableListConfig;
  className?: string;

  // Events
  onSelect?: (keys: (string | number)[], items: T[]) => void;
  onActivate?: (item: T) => void;
  onSearchChange?: (query: string, results: T[]) => void;
}
```

## When to Use

✅ **Use SearchableListView when:**
- You need search + list + toolbar together
- You want keyboard-centric navigation
- You want to avoid managing focus coordination
- The pattern is consistent across views

❌ **Use primitives directly when:**
- You only need one component (just list, just search)
- You need completely custom keyboard behavior
- You need unusual layouts or interactions
- You're building a different composed component

## Design Philosophy

This component follows the **Composed Infrastructure** pattern:
1. ✅ Coordinates multiple primitives
2. ✅ Manages their interaction (keyboard, focus, state)
3. ✅ Remains domain-agnostic (no Macro, User, etc.)
4. ✅ Provides good defaults but allows configuration
5. ✅ Delegates domain logic to parent (what happens on activate, etc.)

Your application provides:
- Domain types (Macro, User, etc.)
- Business logic (what to do when item activated)
- Styling (colors, spacing, etc.)
- Item rendering (how to display each item)

## Example

See [examples/macro-list.tsx](../../../examples/macro-list.tsx) for a complete working example.

## Testing in Isolation

The example serves as a test bench. To test:

```bash
./node_modules/.bin/vite
# Open http://localhost:5173/examples/macro-list.html
```

Try:
1. Type to search → list filters
2. Arrow down/up → highlight moves
3. Enter → activates item
4. Tab → focus switches to list
5. Ctrl+Click → multi-select
6. Keyboard shortcuts (n, Delete)

## Configuration Examples

### Enable Traditional Mode

For users who prefer explicit focus management:

```tsx
config={{
  keyboard: {
    smartNavigation: false  // Disable smart navigation
  }
}}
```

### Disable Wrap Navigation

Prevent navigation from wrapping around:

```tsx
config={{
  keyboard: {
    wrapNavigation: false  // Applies to smart mode only
  },
  list: {
    selectionConfig: {
      wrapNavigation: false  // Applies to traditional mode
    }
  }
}}
```

## Future Enhancements

Potential additions (currently not implemented):
- Virtual scrolling for large lists
- Drag and drop reordering
- Grouped/nested items
- Custom focus indicators
- Accessibility announcements

Add these only when needed - keep it simple!
