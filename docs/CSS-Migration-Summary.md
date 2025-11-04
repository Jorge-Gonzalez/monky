# CSS Migration Summary

## Overview

Successfully migrated from CSS-in-JS template literals to standalone CSS files with proper linting support.

## Changes Made

### 1. Created Type Definitions

**File:** `src/vite-env.d.ts`

Added TypeScript declarations for Vite's `?raw` import syntax:

```typescript
declare module '*.css?raw' {
  const content: string;
  export default content;
}
```

### 2. Converted Style Files

All style files were converted from TypeScript template literals to standalone CSS files:

| Original TS File | New CSS File | Export Name |
|-----------------|-------------|-------------|
| `src/content/overlays/modal/modalStyles.ts` | `modalStyles.css` | `MODAL_STYLES` |
| `src/content/overlays/views/search/searchViewStyles.ts` | `searchViewStyles.css` | `SEARCH_VIEW_STYLES` |
| `src/content/overlays/views/settings/settingsViewStyles.ts` | `settingsViewStyles.css` | `SETTINGS_VIEW_STYLES` |
| `src/content/overlays/views/macroEditor/editorViewStyles.ts` | `editorViewStyles.css` | `EDITOR_VIEW_STYLES` |
| `src/content/overlays/searchOverlay/searchOverlayStyles.ts` | `searchOverlayStyles.css` | `SEARCH_OVERLAY_STYLES` |
| `src/content/overlays/suggestionsOverlay/SuggestionsOverlayStyles.ts` | `suggestionsOverlayStyles.css` | `SUGGESTIONS_OVERLAY_STYLES` |

### 3. Updated TypeScript Files

Each `.ts` file now imports and re-exports the CSS:

```typescript
/**
 * Original JSDoc comments preserved
 */
import styles from './styleName.css?raw';

export const STYLE_NAME = styles;
```

### 4. Added CSS Linting

**File:** `.stylelintrc.json`

Configured Stylelint with:
- Standard CSS rules
- 2-space indentation
- Custom patterns allowed for flexibility
- Appropriate empty line rules

**Package Scripts Added:**
- `npm run lint:css` - Lint all CSS files
- `npm run lint:css:fix` - Auto-fix CSS issues

### 5. Created Conversion Script

**File:** `scripts/convert-styles-to-css.js`

Automated script that:
- Extracts CSS from template literals
- Removes extra indentation
- Preserves JSDoc comments
- Creates `.css` files
- Updates `.ts` files with imports

## Benefits

1. **Better IDE Support**: Full CSS syntax highlighting and autocomplete
2. **CSS Linting**: Stylelint can now check CSS for errors and style issues
3. **Better DX**: Easier to spot CSS errors during development
4. **No Runtime Change**: Files still export the same string constants
5. **Vite Native**: Uses Vite's built-in `?raw` import feature (no plugins needed)

## How It Works

1. Vite's `?raw` suffix imports file contents as a string
2. The TypeScript files re-export the CSS string with the original constant name
3. All consuming code remains unchanged (still imports from `.ts` files)
4. Build process handles CSS imports automatically

## Testing

The migration maintains backward compatibility:
- All imports still work (`import { MODAL_STYLES } from './modalStyles'`)
- StyleInjector receives the same string content
- No changes needed to consuming code

## Usage

### Linting CSS

```bash
# Check CSS files for errors
npm run lint:css

# Auto-fix CSS issues
npm run lint:css:fix
```

### VSCode Integration

For real-time CSS validation in VSCode, install the **Stylelint** extension:
- Extension ID: `stylelint.vscode-stylelint`

## Notes

- The `?raw` import syntax is Vite-specific
- TypeScript types are defined in `src/vite-env.d.ts`
- Original formatting and comments are preserved
- No changes to build configuration required (Vite handles it natively)
