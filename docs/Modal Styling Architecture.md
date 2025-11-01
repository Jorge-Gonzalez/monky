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

**Locations:**
- `src/content/overlays/modal/modalStyles.ts` - For modal (scoped to `#monky-modal`)
- `src/styles/layout.css` - For options/editor pages (no scope)

**Purpose:** Defines shared spacing, typography scales, and reusable component patterns.

**Note:** Both files contain identical patterns and variables, differing only in scope. The modal version is scoped to `#monky-modal` for content script isolation, while layout.css has no scope for general page usage.

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
- `.label` - Form label (12px, 500 weight, 4px bottom margin)
- `.input` - Text input pattern
  - Full width
  - 8px/12px padding
  - 6px border radius
  - Input background and border colors
  - Focus state: accent border, 2px shadow
- `.input-error` - Error state for inputs (red border, red shadow on focus)
- `.checkbox` - Checkbox input (16px, 3px radius, accent color when checked)
- `.editor-content` - Content editable area (150px min-height, 12px padding, input styling)
- `.btn` - Base button (8px/16px padding, rounded, medium weight)
  - `.btn:focus` - 2px accent shadow
  - `.btn:disabled` - Disabled state (60% opacity, not-allowed cursor)
- `.btn-primary` - Primary action button (accent bg, white text, 0.9 opacity on hover)
- `.btn-secondary` - Secondary action button (secondary bg, primary text, border)
- `.btn-success` - Success button (green bg, white text)
- `.btn-danger` - Danger button (red bg, white text)
- `.btn-link` - Link-style button (no bg, accent color, underline on hover)
- `.btn-link-danger` - Danger link button (no bg, red color, underline on hover)
- `.button-group` - Flex container for buttons (8px gap)

#### Alert/Feedback Patterns
- `.alert` - Base alert (12px padding, 6px radius, 1px border, 16px bottom margin)
- `.alert-error` - Error alert (red background/border/text)
- `.alert-warning` - Warning alert (orange background/border/text)
- `.alert-info` - Info alert (blue background/border/text)
- `.alert-success` - Success alert (green background/border/text)
- `.validation-error` - Inline error message (red text, 11px font size, 4px top margin)
- `.validation-success` - Inline success message (green text, 11px font size, 4px top margin)

#### Card Patterns
- `.card` - Card container (primary bg, 1px border, 6px radius, 12px padding)
- `.card-elevated` - Card with shadow (same as card + drop shadow)

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
- `.divider` - Horizontal divider (1px border-top, 24px vertical margin)
- `.divider-top` / `.divider-bottom` - Visual dividers with border and padding
- `.space-y-xs` / `.space-y-sm` / `.space-y-md` / `.space-y-lg` - Vertical spacing between children
- `.gap-xs` / `.gap-sm` / `.gap-md` / `.gap-lg` - Gap utilities for flex/grid layouts
- `.flex` / `.inline-flex` - Flex display utilities
- `.items-center` - Align items center
- `.text-mono` - Monospace font
- `.font-medium` / `.font-semibold` - Font weight utilities

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

### C. Options Page

**Location:** `src/options/ui/`
**Current State:** Fully migrated to semantic classes
**Styling:** Uses `src/styles/layout.css` (loaded via `src/styles.css`)

**Components Status:**
- ✅ PrefixEditor - Migrated to semantic classes
- ✅ ReplacementMode - Migrated to semantic classes
- ✅ Options.tsx - Migrated to semantic classes (`.page-container`, `.page-title`)

**Pattern Used:**
```tsx
<div className="page-container">
  <h1 className="page-title">{t('options.title')}</h1>
  <PrefixEditor coordinator={coordinator} prefixes={state.prefixes} />
  <ReplacementMode coordinator={coordinator} useCommitKeys={state.useCommitKeys} />
</div>
```

### D. Editor Page

**Location:** `src/editor/ui/`
**Current State:** Fully migrated to semantic classes
**Styling:** Uses `src/styles/layout.css` (loaded via `src/styles.css`)
**Components:** Editor.tsx, MacroForm.tsx, MacroListEditor.tsx, MacroItemEditor.tsx, Settings.tsx

**Components Status:**
- ✅ Editor.tsx - Migrated (`.page-container`, `.page-title`, `.divider`)
- ✅ MacroForm.tsx - Migrated (`.label`, `.input`, `.input-error`, `.btn-success`, `.btn-secondary`, `.alert-error`, `.validation-error`, `.checkbox`, `.editor-content`, `.button-group`, `.space-y-md`)
- ✅ MacroItemEditor.tsx - Migrated (`.card`, `.text-mono`, `.btn-link`, `.btn-link-danger`, `.button-group`)
- ✅ MacroListEditor.tsx - Migrated (`.empty-state`, `.space-y-sm`)
- ✅ Settings.tsx - Migrated (`.section`, `.section-title`, `.label`, `.input`, `.flex`, `.items-center`, `.gap-md`)

**Example Pattern:**
```tsx
<form onSubmit={onSubmit} className="space-y-md">
  <div>
    <label htmlFor="macro-command" className="label">
      {t('macroForm.triggerLabel')}
    </label>
    <input
      id="macro-command"
      className={`input ${command && !isCommandValid ? 'input-error' : ''}`}
      value={command}
      onChange={e=>setCommand(e.target.value)}
    />
    {command && !isCommandValid && (
      <p className="validation-error">Command must start with: {prefixes.join(', ')}</p>
    )}
  </div>
  <div className="button-group">
    <button type="submit" disabled={!isFormValid} className="btn btn-success">
      {editing ? t('macroForm.updateButton') : t('macroForm.saveButton')}
    </button>
  </div>
</form>
```

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
1. Pages load `src/styles.css` via HTML (which imports `src/styles/layout.css`)
2. Components wrapped with `renderPageWithTheme()` utility
3. Theme colors applied via `useThemeColors` hook
4. Layout patterns available globally through layout.css (no scope)

---

## Current State Summary

### ✅ Completed
- **Theme system** with light/dark mode (`src/theme/`)
- **Modal layout abstraction** with complete pattern library (`modalStyles.ts`)
- **General layout CSS** for options/editor pages (`src/styles/layout.css`)
- **SearchView** migrated to use layout variables
- **SettingsView** created with semantic classes
- **Options components** (PrefixEditor, ReplacementMode, Options.tsx) migrated to semantic classes
- **Editor components** (Editor.tsx, MacroForm.tsx, MacroItemEditor.tsx, MacroListEditor.tsx, Settings.tsx) migrated to semantic classes
- **Complete pattern library** including:
  - Form patterns (labels, inputs, checkboxes, editor-content, validation states)
  - Button variants (primary, secondary, success, danger, link, disabled)
  - Alert/feedback patterns (error, warning, info, success, validation messages)
  - Card components (card, card-elevated)
  - Layout utilities (spacing, gaps, flex, dividers, typography)

### 📋 Optional Future Enhancements
- **Deprecate Tailwind** - Remove from production build (currently kept for rapid prototyping)
- **Additional page patterns** - If new pages are added (e.g., `.page-description` for intro text)
- **Component-specific animations** - Beyond the current shake animation
- **Responsive breakpoints** - If desktop/tablet/mobile variations are needed

---

## File Organization

### Styling Files

**Theme Layer:**
- `src/theme/theme.ts` - Color definitions
- `src/theme/themeUtils.ts` - Utilities
- `src/theme/hooks/useThemeColors.ts` - Application hook
- `src/theme/ui/ThemeManager.tsx` - Theme switcher component
- `src/theme/ui/renderPageWithTheme.tsx` - Page wrapper utility

**Layout Layer:**
- `src/content/overlays/modal/modalStyles.ts` - Modal-scoped layout (for content scripts)
- `src/styles/layout.css` - General layout (for HTML pages)
- `src/styles.css` - Main stylesheet (imports layout.css, Tailwind)

**Context Layer:**
- `src/content/overlays/views/search/searchViewStyles.ts` - Search view specific
- `src/content/overlays/views/settings/settingsViewStyles.ts` - Settings view specific
- Future: `editorViewStyles.ts` for editor view in modal

### Component Files (All Migrated)

**Options Components:**
- `src/options/ui/Options.tsx` - Uses `.page-container`, `.page-title`
- `src/options/ui/PrefixEditor.tsx` - Uses `.section`, `.prefix-button`
- `src/options/ui/ReplacementMode.tsx` - Uses `.section`, `.replacement-mode-option`

**Editor Components:**
- `src/editor/ui/Editor.tsx` - Uses `.page-container`, `.page-title`, `.divider`
- `src/editor/ui/MacroForm.tsx` - Uses `.label`, `.input`, `.btn-success`, `.alert-error`
- `src/editor/ui/MacroItemEditor.tsx` - Uses `.card`, `.btn-link`, `.btn-link-danger`
- `src/editor/ui/MacroListEditor.tsx` - Uses `.empty-state`, `.space-y-sm`
- `src/editor/ui/Settings.tsx` - Uses `.section`, `.section-title`, `.label`

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
