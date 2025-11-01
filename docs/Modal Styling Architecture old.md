# Modal Styling Architecture

## Overview

The extension's styling system is organized into three distinct layers:

1. **Theme Layer** - Color variables with light/dark mode support
2. **Layout Layer** - Spacing, typography, and reusable component patterns
3. **Context Layer** - Page/view-specific styles

This separation of concerns enables:
- Easy theme switching (light/dark modes)
- Consistent visual design across the application
- Reusable component patterns
- Efficient migration away from Tailwind CSS

---

## 1. Theme Layer

**Location:** `src/theme/`

**Purpose:** Manages color theming with automatic dark/light mode adaptation.

### Files

- `theme.ts` - Defines light and dark color palettes
- `themeUtils.ts` - Theme detection utilities
- `hooks/useThemeColors.ts` - React hook for applying theme colors
- `ui/ThemeManager.tsx` - Theme mode management component
- `ui/renderPageWithTheme.tsx` - Utility for rendering pages with theme support

### Color Variables

All color variables are defined as CSS custom properties and automatically switch based on theme mode:

```css
--bg-primary          /* Primary background */
--bg-secondary        /* Secondary background (slightly different shade) */
--bg-tertiary         /* Tertiary background (for highlights) */
--bg-input            /* Input field backgrounds */
--text-primary        /* Primary text color */
--text-secondary      /* Secondary text (muted) */
--text-accent         /* Accent color (links, highlights) */
--button-bg           /* Button background */
--button-bg-hover     /* Button hover state */
--button-text         /* Button text color */
--border-primary      /* Primary borders */
--border-secondary    /* Secondary borders (lighter) */
--border-input        /* Input field borders */
--kbd-bg              /* Keyboard hint background */
--kbd-border          /* Keyboard hint border */
--scrollbar-thumb     /* Scrollbar thumb color */
--scrollbar-thumb-hover /* Scrollbar thumb hover */
--scrollbar-track     /* Scrollbar track color */
--shadow-color        /* Shadow/overlay colors */
```

### Theme Values

**Light Theme:** Defined in `lightThemeColors`
- Light gray backgrounds (#ededed, #e8e9e9)
- Dark text (#101624)
- Blue accents (#3679e4)

**Dark Theme:** Defined in `darkThemeColors`
- Dark gray backgrounds (#1f2937, #374151)
- Light text (#f3f4f6)
- Light blue accents (#60a5fa)

### How It Works

1. `useThemeColors` hook applies appropriate color variables based on theme mode (light/dark/system)
2. Colors are injected as CSS custom properties on the target element via `style.setProperty()`
3. `.dark` and `.light` classes are toggled on the element for additional styling needs

---

## 2. Layout Layer

**Location:** `src/content/overlays/modal/modalStyles.ts`

**Purpose:** Defines shared spacing, typography scales, and reusable component patterns.

**Scope:** Currently scoped to `#monky-modal` for content script injection.

### Layout Variables

#### Spacing Scale
```css
--spacing-xs: 4px;
--spacing-sm: 8px;
--spacing-md: 12px;
--spacing-lg: 16px;
--spacing-xl: 20px;
--spacing-2xl: 24px;
--spacing-3xl: 40px;
```

#### Border Radius Scale
```css
--radius-sm: 3px;
--radius-md: 6px;
--radius-lg: 8px;
```

#### Typography Scale
```css
--text-xs: 11px;
--text-sm: 12px;
--text-base: 13px;
--text-md: 14px;
--text-lg: 15px;
--text-xl: 18px;
--text-2xl: 20px;
```

#### Timing
```css
--transition-fast: 0.15s;
```

### Shared Component Patterns

#### Modal Infrastructure
- `.modal-backdrop` - Full screen overlay with centered content
- `.modal-dialog` - Modal container (400-600px width, 85vh max-height)
- `.modal-navigation` - Tab navigation bar
- `.modal-nav-tab` - Individual navigation tab
  - `.modal-nav-tab.active` - Active tab state
- `.modal-nav-icon` - Icon in navigation tab
- `.modal-nav-label` - Label in navigation tab
- `.modal-content` - Main content area

#### View Patterns
- `.view-container` - Standard view wrapper (flex column, full height, 20px padding)
- `.view-title` - View header title (20px, 600 weight, primary text)
- `.view-description` - View header description (14px, secondary text, 24px bottom margin)

#### Section Pattern
- `.section` - Bordered container for grouping content
  - 16px padding
  - 6px border radius
  - 1px border with primary border color
  - Secondary background color
  - 16px bottom margin
- `.section-title` - Section header (15px, 600 weight, 12px bottom margin)
- `.section-description` - Section description text (13px, secondary color, 1.5 line-height)

#### Form Elements
- `.input` - Text input pattern
  - Full width
  - 8px/12px padding
  - 6px border radius
  - Input background and border colors
  - Focus state: accent border, 2px shadow
- `.btn` - Base button (8px/16px padding, rounded, medium weight)
  - `.btn:focus` - 2px accent shadow
- `.btn-primary` - Primary action button (accent bg, white text, 0.9 opacity on hover)
- `.btn-secondary` - Secondary action button (secondary bg, primary text, border)
- `.button-group` - Flex container for buttons (8px gap)

#### Utilities
- `.scrollable` - Scrollbar styling
  - Thin scrollbar (8px width)
  - Themed thumb and track colors
  - 4px border radius
  - Hover state for thumb
- `.kbd` - Keyboard hint badges
  - 2px/4px padding
  - 3px border radius
  - Monospace font
  - KBD background and border colors
  - 11px font size
- `.empty-state` - Empty/placeholder states
  - 16px padding
  - Secondary text color
  - Center aligned
  - 14px font size
- `.divider-top` / `.divider-bottom` - Visual dividers with border and padding

---

## 3. Context-Specific Layers

### A. Search View

**Location:** `src/content/overlays/views/search/searchViewStyles.ts`
**Scope:** `#monky-modal`

#### Classes

**View Structure:**
- `.macro-search-view` - Main view container (flex column, full height)
- `.macro-search-input-container` - Input wrapper (16px padding, bottom border)
- `.macro-search-input` - Search text input (inherits `.input` pattern values)

**Results:**
- `.macro-search-results` - Results list container
  - Flex grow
  - 400px max-height
  - Vertical scroll with custom scrollbar
- `.macro-search-empty` - Empty state message (16px padding, centered, secondary text)
- `.macro-search-item` - Individual result item
  - 12px padding
  - Bottom border (secondary)
  - Cursor pointer
  - Background changes on hover/selected
  - `.macro-search-item.selected` - Selected state (tertiary background)
- `.macro-search-item-command` - Command name (500 weight, accent color, 14px)
- `.macro-search-item-text` - Macro text preview (12px, secondary text, ellipsis)

**Footer:**
- `.macro-search-footer` - Footer with keyboard hints
  - 8px padding
  - Top border
  - Flex with space-between
  - 12px font, secondary text
- `.macro-search-kbd` - Keyboard hint (inherits `.kbd` pattern values)

### B. Settings View

**Location:** `src/content/overlays/views/settings/settingsViewStyles.ts`
**Scope:** `#monky-modal`

#### Classes

**View Structure:**
- `.settings-view` - Main scrollable container (flex column, custom scrollbar)
- `.settings-container` - Content wrapper (20px padding)
- `.settings-title` - Page title (uses `--text-2xl`, 600 weight)
- `.settings-description` - Page description (uses `--text-md`, secondary text)

**PrefixEditor Component:**
- `.prefix-options` - Button grid container (flex wrap, 8px gap)
- `.prefix-button` - Prefix selection button
  - 8px/16px padding
  - 6px border radius
  - Monospace font
  - 15px font size
  - Primary border and background
  - Hover: tertiary background
  - Focus: 2px accent shadow
  - `.prefix-button.selected` - Selected state (accent bg, white text)
  - `.prefix-button.shake` - Shake animation state
- `@keyframes monky-shake` - Validation shake animation (4px horizontal)

**ReplacementMode Component:**
- `.replacement-mode-options` - Radio button container (flex, 16px gap)
- `.replacement-mode-option` - Radio option wrapper (flex, aligned, cursor pointer)
- `.replacement-mode-radio` - Radio input (16px size, accent color)
- `.replacement-mode-label` - Radio label (14px, primary text, cursor pointer)

### C. Options Page (Not Yet Migrated)

**Location:** `src/options/ui/`
**Current State:** Uses Tailwind CSS
**Status:** Components (PrefixEditor, ReplacementMode) migrated to semantic classes, but page wrapper (Options.tsx) still uses Tailwind

**Current Tailwind Pattern:**
```tsx
className="p-6 max-w-2xl mx-auto min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100"
```

**Components Status:**
- ✅ PrefixEditor - Migrated to semantic classes
- ✅ ReplacementMode - Migrated to semantic classes
- ⚠️ Options.tsx - Still uses Tailwind wrapper

### D. Editor Page (Not Yet Migrated)

**Location:** `src/editor/ui/`
**Current State:** Fully Tailwind CSS
**Components:** Editor.tsx, MacroForm.tsx, MacroListEditor.tsx, MacroItemEditor.tsx, Settings.tsx

#### Patterns Identified (for future migration)

**Page Wrapper:** Same as Options
```tsx
className="p-6 max-w-2xl mx-auto min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100"
```

**Form Elements:**
- Labels: `block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1`
- Text inputs: `border rounded p-2 w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:border-transparent border-gray-300 dark:border-gray-700 focus:ring-blue-500`
- Invalid input: `border-red-300 dark:border-red-600 focus:ring-red-500`
- Checkboxes: `rounded border-gray-300 text-blue-600 focus:ring-blue-500`
- Content editable: `border rounded-md bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 focus-within:ring-2 focus-within:ring-blue-500`

**Buttons:**
- Primary (success): `bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium`
- Secondary: `px-4 py-2 border rounded-md bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 font-medium`
- Disabled: `bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed`
- Link style: `text-blue-600 dark:text-blue-400 text-sm hover:underline`
- Danger link: `text-red-600 dark:text-red-400 text-sm hover:underline`

**Cards:**
```tsx
className="border rounded p-3 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm"
```

**Error/Alert Boxes:**
```tsx
className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3"
```
- Error text: `text-red-600 dark:text-red-400 text-sm font-medium`
- Validation error: `text-red-500 text-xs mt-1`

**Layout Utilities:**
- Vertical spacing: `space-y-4`, `space-y-2`
- Horizontal gaps: `gap-2`, `gap-3`
- Flex layouts: `flex gap-2`, `inline-flex items-center gap-2`
- Divider: `hr className="my-6"`

---

## Integration Points

### How Styles Are Applied

#### Modal (Content Script Context)
1. `modalManager.ts` injects styles via `styleInjector`
2. Styles are combined in order:
   - `MODAL_STYLES` (from `modalStyles.ts`)
   - `SEARCH_VIEW_STYLES` (from `searchViewStyles.ts`)
   - `SETTINGS_VIEW_STYLES` (from `settingsViewStyles.ts`)
   - `EDITOR_VIEW_STYLES` (from `editorViewStyles.ts`)
3. Injected into `<style id="monky-modal-styles">` element
4. Theme colors applied via `useThemeColors` hook on modal root element

#### Options/Editor Pages
1. Pages load `src/styles.css` via HTML (includes Tailwind)
2. Components wrapped with `renderPageWithTheme()` utility
3. Theme colors applied via `useThemeColors` hook

---

## Current State Summary

### ✅ Completed
- Theme system with light/dark mode (`src/theme/`)
- Modal layout abstraction with variables (`modalStyles.ts`)
- SearchView migrated to use layout variables
- SettingsView created with semantic classes
- PrefixEditor & ReplacementMode components migrated to semantic classes
- Options system integrated into modal SettingsView

### ⚠️ Needs Migration
- **Options page wrapper** (`Options.tsx`) - Still uses Tailwind classes for page layout
- **Editor page and all components** - Still fully on Tailwind
- **Create general layout CSS** - Need version without `#monky-modal` scope for options/editor pages

### 📋 Missing from Layout Abstraction

Based on editor analysis, these patterns should be added to shared layout:

**Form Patterns:**
- Form labels (`.label`)
- Input validation states (`.input-error`, `.input-valid`)
- Checkbox styling (`.checkbox`)
- Content-editable areas (`.editor-content`)

**Button Variants:**
- Success button (`.btn-success`)
- Danger button (`.btn-danger`)
- Link-style button (`.btn-link`, `.btn-link-danger`)
- Disabled button state (`.btn:disabled`)

**Feedback/Alerts:**
- Error box (`.alert-error`)
- Warning box (`.alert-warning`)
- Info box (`.alert-info`)
- Success box (`.alert-success`)
- Inline validation message (`.validation-error`, `.validation-success`)

**Card Components:**
- Card container (`.card`)
- Card with shadow (`.card-elevated`)

**Layout Utilities:**
- Spacing utilities (`.space-y-sm`, `.space-y-md`, etc.)
- Gap utilities (`.gap-sm`, `.gap-md`, etc.)
- Divider (`.divider`)

---

## Recommended Next Steps

1. **Expand modal layout layer** - Add missing patterns from editor to `modalStyles.ts`
2. **Create general layout CSS** - Version without `#monky-modal` scope for use in options/editor pages
3. **Migrate Options.tsx** - Replace Tailwind wrapper classes with semantic classes
4. **Migrate Editor components** - Systematic migration from Tailwind to semantic classes
5. **Deprecate Tailwind** - Once migration complete, remove Tailwind from production build

---

## Architecture Benefits

### Separation of Concerns
- **Theme:** Only manages colors, easily swappable
- **Layout:** Manages spacing and structure, consistent across contexts
- **Context:** Page-specific styles, minimal and focused

### Maintainability
- Changes to spacing/typography happen in one place
- Easy to find where styles are defined (semantic class names)
- No scattered inline Tailwind utilities

### Performance
- Smaller CSS bundle (no unused Tailwind utilities)
- Consistent CSS variables reduce duplicate rules
- Scoped styles prevent conflicts

### Developer Experience
- Semantic class names are self-documenting
- Reusable patterns speed up development
- Consistent visual design without memorizing Tailwind utilities
