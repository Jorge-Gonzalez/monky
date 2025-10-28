# Rich Text Replacement Design

## Overview

This document explains the design and implementation of the marker-based rich text replacement system for handling HTML macro insertions in contenteditable elements with robust undo functionality.

## The Problem

When inserting HTML content (e.g., `<strong>Bold text</strong>`) into contenteditable elements, the existing position-based undo system fails because:

1. **textContent loses structure**: `textContent` returns "Bold text" without HTML tags
2. **Position calculation breaks**: Can't accurately locate HTML nodes using text positions
3. **User edits break positions**: Text before/after the insertion shifts positions

### Example of the Problem

```javascript
// User types: /sig
element.textContent = '/sig'

// Macro expands to HTML:
element.innerHTML = '<strong>John Doe</strong><br><em>Developer</em>'

// Now undo needs to restore '/sig', but:
element.textContent // Returns: "John DoeDeveloper" (no structure!)
// Where is the insertion? Position 0-15? What about the <br>?
```

## Solution: Marker-Based Approach

### Core Concept

Wrap ALL macro insertions (both plain text and HTML) in a **marker element** that:

1. **Survives DOM operations**: Browser maintains the reference
2. **Stores metadata**: Original command, macro ID, timestamp
3. **Is transparent**: `display: contents` makes it invisible to layout
4. **Easy to find**: Simple `querySelector` by data attribute
5. **Easy to undo**: Single `replaceWith()` operation

### Architecture

```
┌─────────────────────────────────────────┐
│   Contenteditable Element               │
│  ┌─────────────────────────────────┐    │
│  │ <span data-macro-marker="true"  │    │
│  │       data-macro-id="sig-123"   │    │
│  │       data-original-command="/sig"  │
│  │       style="display: contents"> │    │
│  │   <strong>John Doe</strong>     │    │
│  │   <br>                           │    │
│  │   <em>Developer</em>             │    │
│  │ </span>                          │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

### Key Design Decisions

#### 1. Why `<span>` with `display: contents`?

- **Semantic**: Generic container, no semantic meaning
- **Transparent**: `display: contents` makes children render as if they were direct children of parent
- **Compatible**: Works with all content types (text, HTML, lists, tables)
- **No visual impact**: Doesn't affect layout, styling, or user experience

#### 2. Why Store Metadata in Data Attributes?

```html
<span data-macro-marker="true"
      data-macro-id="unique-id"
      data-original-command="/sig"
      data-inserted-at="1234567890"
      data-is-html="true">
```

- **Persistent**: Survives copy/paste in many cases
- **Query-able**: Easy to find with `querySelector`
- **Debuggable**: Visible in DevTools
- **Self-contained**: All undo info in one place

#### 3. Approach Comparison

| Approach | Pros | Cons | Verdict |
|----------|------|------|---------|
| **Position-based** | No DOM pollution, simple | ❌ Fails for HTML, breaks with edits | Used for plain text fallback |
| **Node Reference** | Direct access | ❌ WeakRef unreliable, complex for multi-node | Rejected |
| **Marker Element** ✅ | Robust, simple, survives edits | Minimal DOM pollution | **Selected** |

## API Design

### Core Functions

#### `replaceWithMarker()`
The primary function for all macro replacements.

```typescript
function replaceWithMarker(
  element: HTMLElement,
  startPos: number,
  endPos: number,
  contentHtml: string,
  markerData: MacroMarkerData
): InsertionResult | null
```

**Usage:**
```typescript
const result = replaceWithMarker(
  contentEditableDiv,
  0,
  4, // Replace "/sig"
  '<strong>John Doe</strong><em>Developer</em>',
  {
    macroId: 'sig-123',
    originalCommand: '/sig',
    insertedAt: Date.now(),
    isHtml: true
  }
)
```

#### `undoMostRecentInsertion()`
Undo the most recently inserted macro.

```typescript
function undoMostRecentInsertion(element: EditableEl): boolean
```

**Usage:**
```typescript
if (undoMostRecentInsertion(contentEditableDiv)) {
  console.log('Undo successful')
}
```

#### `undoSpecificInsertion()`
Undo a specific macro by ID.

```typescript
function undoSpecificInsertion(element: EditableEl, macroId: string): boolean
```

### Helper Functions

- `findMarkers()`: Get all markers in an element
- `hasMarkers()`: Check if element has any markers
- `getMarkerCount()`: Get number of markers
- `removeAllMarkers()`: Clean up all markers (keeps content)

## Implementation Details

### Insertion Process

1. **Find text nodes** at start/end positions using `findTextNodeForOffset()`
2. **Create a Range** from those positions
3. **Delete range contents** (removes original text like "/sig")
4. **Create marker element** with metadata
5. **Parse and insert content**:
   - HTML: Parse with `innerHTML`, append nodes to marker
   - Text: Create text node, append to marker
6. **Insert marker** at range position
7. **Move cursor** after the marker

### Undo Process

1. **Find most recent marker** (or specific one by ID)
2. **Extract original command** from marker metadata
3. **Create text node** with original command
4. **Replace marker** with text node using `replaceWith()`
5. **Position cursor** after restored text

### Why This Works

#### Survives User Edits
```javascript
// Initial state
<div contenteditable>
  <span data-macro-marker>[HTML content]</span>
</div>

// User types before it
<div contenteditable>
  Prefix <span data-macro-marker>[HTML content]</span>
</div>
// ✅ Marker still found, undo works!

// User types inside it
<div contenteditable>
  <span data-macro-marker>Modified [HTML content]</span>
</div>
// ✅ Marker still found, undo works!
```

#### Handles Complex HTML
```javascript
// Lists
replaceWithMarker(el, 0, 6, `
  <ul>
    <li>Item 1</li>
    <li>Item 2</li>
  </ul>
`, data)
// ✅ Entire list wrapped, undoes atomically

// Tables, formatted text, nested structures - all work!
```

## Edge Cases Handled

### 1. Empty Content
```typescript
if (element.childNodes.length === 0) {
  element.textContent = '' // Creates text node
}
```

### 2. JSDOM Environment
```typescript
// JSDOM doesn't set isContentEditable property
if (!element.isContentEditable && element.contentEditable !== 'true') {
  return null
}
```

### 3. Multiple Markers
```typescript
// Sorted by insertion time, newest first
markers.sort((a, b) => getTimestamp(b) - getTimestamp(a))
```

### 4. Marker Cleanup
```typescript
// removeAllMarkers() unwraps content, keeps it intact
removeAllMarkers(element) // Removes markers, preserves content
```

## Integration Example

```typescript
// In your macro replacement system:
import { replaceWithMarker, undoMostRecentInsertion } from './richTextReplacement'

function applyMacro(element: HTMLElement, macro: Macro) {
  const selection = getSelection(element)

  if (macro.contentType === 'text/html') {
    const result = replaceWithMarker(
      element,
      selection.start,
      selection.end,
      macro.html,
      {
        macroId: macro.id,
        originalCommand: macro.command,
        insertedAt: Date.now(),
        isHtml: true
      }
    )

    if (result) {
      // Track for undo...
    }
  } else {
    // Plain text - can still use markers for consistency!
    replaceWithMarker(element, selection.start, selection.end, macro.text, {
      macroId: macro.id,
      originalCommand: macro.command,
      insertedAt: Date.now(),
      isHtml: false
    })
  }
}

// Undo handler
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
    const activeElement = document.activeElement
    if (undoMostRecentInsertion(activeElement)) {
      e.preventDefault() // We handled it
    }
  }
})
```

## Performance Considerations

### Memory
- **Marker elements**: Minimal overhead (~200 bytes each)
- **No memory leaks**: No WeakRef management needed
- **Garbage collected**: Markers cleaned up when element removed

### Speed
- **Insertion**: O(n) where n = text length (same as position-based)
- **Finding marker**: O(1) with querySelector
- **Undo**: O(1) single replaceWith() call

### DOM Size
- One `<span>` per insertion
- For typical usage (5-10 macros per session): negligible impact

## Testing Strategy

### Test Coverage

1. **Basic Replacement**: Plain text, HTML, lists, tables
2. **Undo**: Most recent, specific by ID, no markers
3. **User Edits**: Text before, after, inside marker
4. **Edge Cases**: Empty content, multiple markers, cursor position
5. **Marker Transparency**: Display style, metadata storage

### Example Test
```typescript
it('should undo HTML macro replacement', () => {
  element.textContent = '/sig'

  replaceWithMarker(element, 0, 4, '<strong>John</strong>', {
    macroId: 'test',
    originalCommand: '/sig',
    insertedAt: Date.now(),
    isHtml: true
  })

  expect(element.innerHTML).toContain('<strong>John</strong>')

  undoMostRecentInsertion(element)

  expect(element.textContent).toBe('/sig')
  expect(element.innerHTML).not.toContain('<strong>')
})
```

## Future Enhancements

### Potential Improvements

1. **Redo functionality**: Store removed markers in a redo stack
2. **Marker styling**: Optional visual indicator for debugging mode
3. **Metadata hooks**: Custom data attributes for tracking analytics
4. **Batch operations**: Undo multiple markers at once
5. **Collaborative editing**: Marker IDs include user context

### Migration Path

For existing position-based system:

```typescript
// Gradual migration
function replaceMacro(element, macro, startPos, endPos) {
  if (macro.contentType === 'text/html') {
    // Use new marker-based system
    return replaceWithMarker(element, startPos, endPos, macro.html, {...})
  } else {
    // Keep existing plain text system
    return replaceTextLegacy(element, macro.text, startPos, endPos)
  }
}
```

## Conclusion

The marker-based approach provides:

- ✅ **Robust** HTML undo functionality
- ✅ **Simple** implementation and API
- ✅ **Reliable** across user edits
- ✅ **Performant** with minimal overhead
- ✅ **Maintainable** with clear separation of concerns

It's the optimal solution for rich text macro replacement with undo support.
