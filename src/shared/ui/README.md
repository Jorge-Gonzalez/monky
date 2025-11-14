# Infrastructure UI Components

Generic, reusable React components for building interactive user interfaces. These components are **domain-agnostic** and can be composed to create various types of list-based UIs.

## Philosophy

These components follow a **separation of concerns** approach:

- **Components**: Handle presentation, interaction, and behavior
- **Your Code**: Provides data, domain logic, and styling

This allows you to:
- ✅ Reuse components across different features
- ✅ Test interaction logic independently
- ✅ Apply your own styling system
- ✅ Adapt components to different data structures

## Component Levels

This library provides components at different abstraction levels:

**Level 1: Primitives** (use these for custom compositions)
- `MultiSelectList` - Generic list with selection
- `FuzzySearchField` - Search with filtering
- `ActionToolbar` - Context-aware buttons

**Level 2: Composed** (use these for common patterns)
- `SearchableListView` - Search + List + Toolbar coordinator with smart keyboard navigation

**Level 3: Your App** (your domain-specific components)
- MacroListView, UserListView, etc.

## Primitives

### 1. MultiSelectList

A generic list component with selection and keyboard navigation.

**Features:**
- Single and multi-select (Ctrl+Click)
- Keyboard navigation (Up/Down/Enter)
- Double-click activation
- Customizable item rendering
- Accessible (ARIA)

**Example:**
```tsx
import { MultiSelectList } from '@/shared/ui';

<MultiSelectList
  items={macros}
  itemKey="id"
  renderItem={(macro) => <div>{macro.name}</div>}
  onSelect={(keys, items) => setSelected(items)}
  onActivate={(macro) => editMacro(macro)}
  keyboardNav
/>
```

**Props:**
- `items`: Array of items to display
- `itemKey`: Property name or function to extract unique key
- `renderItem`: Function to render each item
- `emptyState`: What to show when list is empty
- `keyboardNav`: Enable keyboard navigation
- `onSelect`: Called when selection changes
- `onActivate`: Called on double-click or Enter
- `onNavigationEscape`: Called when user navigates up from first item

### 2. FuzzySearchField

Search input with fuzzy filtering.

**Features:**
- Fuzzy search using fuzzysort
- Multiple search algorithms (fuzzy, substring, startsWith)
- Debounced input
- Clear button
- Keyboard integration

**Example:**
```tsx
import { FuzzySearchField } from '@/shared/ui';

<FuzzySearchField
  searchKeys={['name', 'content', 'tags']}
  algorithm="fuzzy"
  placeholder="Search..."
  dataSource={macros}
  onSearch={(query, results) => setFiltered(results)}
  onNavigateDown={() => focusList()}
/>
```

**Props:**
- `searchKeys`: Properties to search within items
- `algorithm`: 'fuzzy' | 'substring' | 'startsWith'
- `dataSource`: Static array or async function
- `debounce`: Delay in ms before searching
- `minChars`: Minimum characters to start search
- `onSearch`: Called with filtered results
- `onNavigateDown`: Called when user presses ArrowDown

### 3. ActionToolbar

Button toolbar that reacts to selection state.

**Features:**
- Configurable buttons with icons
- Automatic enable/disable based on selection
- Keyboard shortcuts
- Flexible icon system (emoji, SVG, icon fonts)

**Example:**
```tsx
import { ActionToolbar, ToolbarButton } from '@/shared/ui';

const buttons: ToolbarButton[] = [
  {
    id: 'new',
    icon: 'plus',
    label: 'New',
    enabled: 'always',
    action: () => createNew(),
    shortcut: 'alt+n'  // Supports modifiers: alt+n, ctrl+s, shift+delete, or plain: 'Delete'
  },
  {
    id: 'edit',
    icon: 'edit',
    label: 'Edit',
    enabled: 'single',  // Only when 1 item selected
    action: (items) => edit(items[0]),
    shortcut: 'Enter'
  },
  {
    id: 'delete',
    icon: 'trash',
    label: 'Delete',
    enabled: 'any',  // When 1+ items selected
    action: (items) => deleteItems(items),
    shortcut: 'Delete'
  }
];

<ActionToolbar
  buttons={buttons}
  position="footer"
  selectionCount={selected.length}
  selectedItems={selected}
  enableShortcuts
/>
```

**Enable Conditions:**
- `'always'`: Always enabled
- `'single'`: Enabled when exactly 1 item selected
- `'multiple'`: Enabled when 2+ items selected
- `'any'`: Enabled when 1+ items selected
- `'none'`: Enabled when 0 items selected
- Custom function: `(count) => count > 0 && count < 5`

**Icon Configuration:**
```tsx
// String (emoji or registered icon)
icon: 'plus'  // → ➕

// Raw SVG
icon: '<svg>...</svg>'

// Icon font
icon: { type: 'font', class: 'fa-plus' }

// Custom render function
icon: () => <CustomIcon />
```

## Composed Components

### SearchableListView

A coordinated search + list + toolbar component with smart keyboard navigation.

**Features:**
- Search-focused keyboard mode (type to filter, arrows to navigate)
- Automatic state coordination (filtered items, selection, focus)
- Tab to switch between search and list modes
- Configurable via config object
- Remains domain-agnostic

**Quick Example:**
```tsx
import { SearchableListView, ToolbarButton } from '@/shared/ui';

const buttons: ToolbarButton<Macro>[] = [
  { id: 'new', icon: 'plus', label: 'New', enabled: 'always', action: () => create() },
  { id: 'edit', icon: 'edit', label: 'Edit', enabled: 'single', action: (items) => edit(items[0]) }
];

<SearchableListView
  items={macros}
  itemKey="id"
  searchKeys={['name', 'content']}
  renderItem={(macro) => <MacroItem {...macro} />}
  buttons={buttons}
  onActivate={(item) => edit(item)}
  config={{
    keyboard: { focusOnMount: true },
    search: { placeholder: 'Search macros...' }
  }}
/>
```

**Keyboard Flow:**
1. Search field starts focused
2. Type → filters list
3. ↑↓ → navigate list visually (without losing focus)
4. Enter → activates highlighted item
5. Tab → switch to traditional list navigation

See [SearchableListView.md](./SearchableListView.md) for complete documentation.

---

## Composition Pattern (Using Primitives)

If SearchableListView doesn't fit your needs, compose primitives directly:

```tsx
import {
  MultiSelectList,
  FuzzySearchField,
  ActionToolbar
} from '@/shared/ui';

function MacroList({ macros }) {
  const [filtered, setFiltered] = useState(macros);
  const [selected, setSelected] = useState([]);

  return (
    <div className="macro-list-view">
      {/* Search */}
      <FuzzySearchField
        searchKeys={['name', 'content']}
        dataSource={macros}
        onSearch={(q, results) => setFiltered(results)}
      />

      {/* List */}
      <MultiSelectList
        items={filtered}
        itemKey="id"
        renderItem={(m) => <MacroItem {...m} />}
        onSelect={(keys, items) => setSelected(items)}
      />

      {/* Actions */}
      <ActionToolbar
        buttons={toolbarButtons}
        selectionCount={selected.length}
        selectedItems={selected}
      />
    </div>
  );
}
```

## Styling

Components provide **semantic CSS classes** but no styling. This allows you to integrate them with any CSS system:

```css
/* List */
.multi-select-list { }
.list-item { }
.list-item.selected { }
.list-item.focused { }

/* Search */
.fuzzy-search-field { }
.search-input { }
.clear-button { }

/* Toolbar */
.action-toolbar { }
.toolbar-button { }
.toolbar-button:disabled { }
```

See [examples/MacroListExample.tsx](./examples/MacroListExample.tsx) for a complete styled example.

## Keyboard Navigation

The components integrate keyboard navigation seamlessly:

**In Search Field:**
- Type → Filter results
- `ArrowDown` → Move focus to list
- `Escape` → Clear search

**In List:**
- `ArrowUp/Down` → Navigate items
- `Enter` → Activate selected item
- `Ctrl+Click` → Multi-select
- Double-click → Activate item
- `ArrowUp` at top → Focus search field

**Global (when toolbar has shortcuts):**
- `Alt+N` → New (avoids conflicts with browser shortcuts)
- `Delete` → Delete selected
- `Enter` → Edit/activate selected
- Custom shortcuts per button (supports modifiers: `ctrl+key`, `alt+key`, `shift+key`)

## Accessibility

All components include proper ARIA attributes:

- `role="listbox"` and `role="option"` for lists
- `aria-selected`, `aria-disabled` states
- `aria-label` for buttons and inputs
- Keyboard navigation support
- Screen reader announcements

## TypeScript Support

All components are fully typed with generics:

```tsx
interface MyItem {
  id: string;
  name: string;
}

// Type-safe!
<MultiSelectList<MyItem>
  items={items}
  itemKey="id"
  renderItem={(item) => item.name}  // item is MyItem
  onSelect={(keys, items) => {
    // items is MyItem[]
  }}
/>
```

## Examples

### Live Interactive Example

Run the live interactive example to see all components in action:

1. Start the dev server: `./node_modules/.bin/vite`
2. Open: `http://localhost:5173/examples/macro-list.html`

The example demonstrates:
- All three components composed together
- Multi-selection with Ctrl+Click
- Keyboard navigation
- Fuzzy search filtering
- Context-aware toolbar actions

See the [examples directory](../../examples/) for the full source code.

### Code Example

See [examples/MacroListExample.tsx](./examples/MacroListExample.tsx) for the TypeScript implementation with:
- All three components composed
- Domain-specific types (Macro)
- Event handlers
- Example CSS

## Migration to Preact

These components are written in **Preact-compatible React**. To migrate to Preact later:

1. Add Preact compat alias in your bundler
2. No code changes needed
3. Enjoy smaller bundle size

See main README for migration details.

## Contributing

When adding features to these components:
- Keep them domain-agnostic
- Add TypeScript types
- Include examples
- Document props
- Test with keyboard and screen readers
