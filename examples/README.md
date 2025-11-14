# Examples

This directory contains example pages demonstrating the shared UI components.

## Macro List Example

The `macro-list.html` page demonstrates the complete macro management interface using the actual shared UI components:

- `MultiSelectList` - Generic list with selection and keyboard navigation
- `FuzzySearchField` - Search with fuzzy matching
- `ActionToolbar` - Context-aware action buttons

### Features Demonstrated

1. **Multi-Selection**: Hold Ctrl (or Cmd on Mac) and click items to select multiple items
2. **Keyboard Navigation**: Use arrow keys to navigate, Enter to activate
3. **Fuzzy Search**: Type to filter the list with fuzzy matching
4. **Context Actions**: Toolbar buttons enable/disable based on selection

### Running the Example

#### Development Mode

1. Start the Vite dev server:
   ```bash
   ./node_modules/.bin/vite
   ```

2. Navigate to:
   ```
   http://localhost:5173/examples/macro-list.html
   ```

#### Production Build

1. Build the project:
   ```bash
   ./node_modules/.bin/vite build
   ```

2. The example will be built to `dist/examples/macro-list.html`

### Usage Tips

- **Single Selection**: Click any item to select it (clears previous selection)
- **Multi-Selection**: Ctrl+Click (or Cmd+Click on Mac) to toggle items in the selection
- **Keyboard Navigation**:
  - Arrow Down/Up to navigate through items
  - Enter to activate the focused item
  - Press Up at the top to return focus to the search field
  - Press Down in the search field to focus the list
- **Search**: Type in the search field to fuzzy filter macros by name, shortcut, content, or tags

### Component Integration

The example shows how to properly compose the shared UI components:

```tsx
import { MultiSelectList } from '../src/shared/ui/MultiSelectList';
import { FuzzySearchField } from '../src/shared/ui/FuzzySearchField';
import { ActionToolbar, registerIcons } from '../src/shared/ui/ActionToolbar';

// Register icons for the toolbar
registerIcons({
  plus: { type: 'emoji', content: '➕' },
  edit: { type: 'emoji', content: '✏️' },
  trash: { type: 'emoji', content: '🗑️' }
});

// Use the components in your view
<MultiSelectList
  items={items}
  itemKey="id"
  renderItem={(item) => <div>{item.name}</div>}
  onSelect={(keys, items) => setSelection(items)}
  onActivate={(item) => handleEdit(item)}
/>
```

See the full implementation in [macro-list.tsx](./macro-list.tsx).
