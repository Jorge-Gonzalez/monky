# Keyboard Navigation Changes - SearchableListView

## Summary
Fixed keyboard navigation behavior and added a `smartNavigation` configuration option to support both smart mode and traditional navigation modes.

## Changes Made

### 1. Fixed Wrap-Around Bug (Original Issue)
**Files Modified:**
- `src/shared/ui/SearchableListView.tsx`
- `src/shared/ui/MultiSelectList.tsx`

**Problem:** When using arrow keys to navigate, pressing UP from the first item would wrap around to the last item instead of staying at the first item or returning focus to the search field.

**Solution:**
- **SearchableListView (Smart Mode)**: When at first item and pressing UP, stay at index 0 instead of wrapping to last item ([SearchableListView.tsx:228-236](../src/shared/ui/SearchableListView.tsx#L228-L236))
- **MultiSelectList**: When `onNavigationEscape` is called (user at first item), return index 0 instead of wrapping ([MultiSelectList.tsx:170-175](../src/shared/ui/MultiSelectList.tsx#L170-L175))

### 2. Added Smart Navigation Configuration Option
**File Modified:** `src/shared/ui/SearchableListView.tsx`

**Feature:** Added `smartNavigation` boolean option to keyboard config (default: `true`)

**Interface Changes:**
```typescript
keyboard?: {
  focusOnMount?: boolean;
  wrapNavigation?: boolean;
  smartNavigation?: boolean;  // NEW
}
```

**Behavior:**
- **Smart Mode (`smartNavigation: true` - default):**
  - Arrow keys navigate list visually while search field has focus
  - No wrap-around from first to last item
  - Tab switches between search and list

- **Traditional Mode (`smartNavigation: false`):**
  - Arrow keys only work when list has focus
  - Must use Tab to switch focus from search to list
  - Navigation wraps around (up from first goes to last)

**Code Changes:**
- Line 52: Added `smartNavigation` to interface
- Line 137: Default value set to `true`
- Line 201: Conditional check for smart mode activation
- Line 319: `keyboardNav` prop set based on smart mode
- Line 322: `onNavigationEscape` only passed in smart mode

### 3. Fixed Initial Selection State
**File Modified:** `src/shared/ui/SearchableListView.tsx`

**Problem:** When interface loaded, the first item appeared highlighted/selected before user interacted with it.

**Solution:**
- Initialize `focusedIndex` to `-1` instead of `0` ([SearchableListView.tsx:143](../src/shared/ui/SearchableListView.tsx#L143))
- Handle `-1` state in arrow key handlers:
  - Arrow Down from `-1` → move to index 0 ([SearchableListView.tsx:207-209](../src/shared/ui/SearchableListView.tsx#L207-L209))
  - Arrow Up from `-1` → move to index 0 ([SearchableListView.tsx:224-226](../src/shared/ui/SearchableListView.tsx#L224-L226))
- Reset to `-1` when search changes ([SearchableListView.tsx:161](../src/shared/ui/SearchableListView.tsx#L161))
- Add `focusedIndex >= 0` check to scroll effect ([SearchableListView.tsx:252](../src/shared/ui/SearchableListView.tsx#L252))

### 4. Fixed Navigation Escape Behavior
**File Modified:** `src/shared/ui/SearchableListView.tsx`

**Problem:** When pressing UP from first item to return to search, the first item remained highlighted.

**Solution:**
- Reset `focusedIndex` to `-1` in `handleNavigationEscape` ([SearchableListView.tsx:185](../src/shared/ui/SearchableListView.tsx#L185))

### 5. Updated Documentation
**File Modified:** `src/shared/ui/SearchableListView.md`

**Changes:**
- Added "Traditional Navigation Mode" section
- Updated "Keyboard Behavior" section with separate tables for Smart Mode and Traditional Mode
- Added "Configuration Examples" section with examples for:
  - Enabling traditional mode
  - Disabling wrap navigation
- Updated feature descriptions to reflect both modes
- Removed "Custom keyboard mode" from future enhancements (now implemented)

## Test Cases to Cover

### Initial State
- [ ] When interface loads, no item should be highlighted
- [ ] Search field should have focus (if `focusOnMount: true`)

### Smart Mode Navigation (default)
- [ ] Arrow DOWN from no selection → highlights first item
- [ ] Arrow UP from no selection → highlights first item
- [ ] Arrow DOWN navigates through list
- [ ] Arrow UP navigates back through list
- [ ] Arrow UP from first item → stays at first item (no wrap)
- [ ] Arrow DOWN from last item → wraps to first (if `wrapNavigation: true`)
- [ ] Arrow DOWN from last item → stays at last (if `wrapNavigation: false`)
- [ ] ENTER activates highlighted item
- [ ] TAB switches focus to list
- [ ] Search field retains actual DOM focus during navigation

### Traditional Mode Navigation (`smartNavigation: false`)
- [ ] Arrow keys do nothing when search has focus
- [ ] TAB switches focus to list
- [ ] Arrow DOWN navigates down in list
- [ ] Arrow UP navigates up in list
- [ ] Arrow UP from first item → wraps to last item (if `wrapNavigation: true`)
- [ ] Arrow DOWN from last item → wraps to first item (if `wrapNavigation: true`)
- [ ] ENTER activates focused item

### List Focus Mode (after TAB in Smart Mode)
- [ ] Arrow UP from first item → calls `onNavigationEscape`
- [ ] Focus returns to search field
- [ ] `focusedIndex` resets to `-1` (no highlight)
- [ ] Arrow keys work normally in list

### Search Behavior
- [ ] Typing in search filters list
- [ ] Search results reset `focusedIndex` to `-1`
- [ ] No item highlighted after search until arrow key pressed

### Visual Feedback
- [ ] `search-focused-item` class only applied in smart mode
- [ ] `search-focused-item` class applied to correct item
- [ ] No `search-focused-item` class when `focusedIndex === -1`
- [ ] Scroll behavior only works in smart mode
- [ ] Focused item scrolls into view smoothly

## Breaking Changes
None - all changes are backwards compatible with sensible defaults.

## Migration Guide
No migration needed. Existing code continues to work with smart mode enabled by default.

To enable traditional mode:
```tsx
<SearchableListView
  config={{
    keyboard: {
      smartNavigation: false
    }
  }}
  // ... other props
/>
```
