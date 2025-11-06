# Semantic Compositional Grammar for CSS

## Philosophy

Traditional CSS frameworks force you to choose between:
- **High-level components** (Bootstrap): Opinionated, inflexible, hard to customize
- **Atomic utilities** (Tailwind): Verbose, couples HTML to implementation, hard to read

This system provides a **middle ground**: semantic class names that describe **what layouts do** rather than **how they're implemented**, while remaining composable and flexible.

## Core Principles

### 1. Separation of Concerns

Classes are organized into distinct layers:

- **Structure**: What it is (spatial arrangement)
- **Behavior**: What it does (sizing, wrapping, spacing)  
- **Constraints**: Within what bounds (min/max limits)
- **Interaction**: How it responds (states, feedback)

### 2. Compositional Grammar

Classes combine like words in a sentence:

```html
<div class="horizontal blocks fill-container min-1-col max-3-col comfortable">
     ↑          ↑      ↑              ↑         ↑          ↑
     structure  struct behavior       constraint constraint behavior
     (axis)     (type) (sizing)       (min cols) (max cols) (spacing)
```

### 3. Readable Intent

Reading the HTML should communicate **what the layout accomplishes**:

```html
<!-- ❌ Hard to understand intent -->
<div class="d-flex flex-row flex-wrap gap-2 align-items-center">

<!-- ✅ Clear intent -->
<div class="horizontal items wrap-allowed snug align-center">
```

## Vocabulary Reference

### STRUCTURE: Spatial Arrangement

#### Directional Arrangement
```css
.horizontal     /* Items arranged left-to-right */
.vertical       /* Items arranged top-to-bottom */
.rows           /* Collection of horizontal arrangements */
.grid           /* Two-dimensional grid */
```

#### Child Type Semantics
```css
.blocks         /* Substantial, block-like items */
.items          /* Inline-like, flow naturally */
.sections       /* Major divisions */
```

#### Multi-part Layouts
```css
.two-sections           /* Divided into two regions */
.sidebar-main           /* Small + large division */
.rows.two-sections      /* Stacked two-part layouts */
```

### BEHAVIOR: Dynamic Responses

#### Sizing Strategies
```css
.fill-container         /* Items expand to fill available space */
.fill-remaining         /* Single item fills leftover space */
.fit-content           /* Items size to their content */
.equal-sizes           /* All items same size */
.equal-square          /* All items square and equal */
.equal-circle          /* All items circular and equal */
```

#### Spacing Patterns
```css
.tight          /* gap: 4px */
.snug           /* gap: 8px */
.comfortable    /* gap: 12px */
.spaced         /* gap: 16px */
.loose          /* gap: 20px */
.separated      /* gap: 40px */
```

#### Wrapping Behavior
```css
.wrap-allowed   /* Can break to new line */
.wrap-prevent   /* Stay on single line */
```

#### Alignment
```css
.align-start       /* Align to start edge */
.align-center      /* Center alignment */
.align-end         /* Align to end edge */
.align-stretch     /* Stretch to fill */
.align-baseline    /* Align text baselines */

.justify-start     /* Justify to start */
.justify-center    /* Center justify */
.justify-end       /* Justify to end */
.justify-between   /* Space between */
.justify-around    /* Space around */
```

#### Overflow Behavior
```css
.scroll-y       /* Vertical scrolling */
.scroll-x       /* Horizontal scrolling */
.scroll-auto    /* Scroll when needed */
.clip           /* Hide overflow */
```

### CONSTRAINTS: Size Limits

#### Width Constraints
```css
.min-width-150      /* Items min 150px wide */
.min-width-200      /* Items min 200px wide */
.min-width-250      /* Items min 250px wide */
.min-width-300      /* Items min 300px wide */
.max-width-400      /* Items max 400px wide */
.max-width-600      /* Items max 600px wide */
```

#### Column Constraints
```css
.min-1-col          /* Minimum 1 column */
.min-2-col          /* Minimum 2 columns */
.max-2-col          /* Maximum 2 columns */
.max-3-col          /* Maximum 3 columns */
.max-4-col          /* Maximum 4 columns */
.fixed-2-col        /* Exactly 2 columns */
.fixed-3-col        /* Exactly 3 columns */
```

### INTERACTION: User Response

#### Selectable Groups
```css
.selectable-group       /* Group where items can be selected */
.min-selected-1         /* At least 1 must be selected */
```

**States:**
```css
.is-selected            /* Item is currently selected */
```

#### Feedback Animations
```css
.shake              /* Shake animation */
.pulse              /* Pulse animation */
.flash              /* Flash animation */
```

### RESPONSIVE: Adaptive Behavior
```css
.stack-small        /* Become vertical on small screens */
.hide-small         /* Hidden on small screens */
.collapse-small     /* Full width on small screens */
```

## Usage Patterns

### Pattern 1: Command Prefix Selector
**Description**: "Horizontal row of equal square blocks, wrapping allowed, snugly spaced, forming a selectable group with minimum 1 selected"

```html
<div class="horizontal blocks equal-square wrap-allowed snug selectable-group min-selected-1">
  <button class="prefix-button is-selected">!</button>
  <button class="prefix-button is-selected">/</button>
  <button class="prefix-button">.</button>
  <button class="prefix-button">,</button>
</div>
```

**Behavior**:
- Visual feedback (shake) when trying to deselect the last item
- Multiple items can be selected
- At least one must remain selected

### Pattern 2: Settings Form with Aligned Labels
**Description**: "Vertical rows with two sections each, aligning start to the max width of first section, comfortably spaced"

```html
<form class="rows two-sections align-start-max comfortable">
  <div>
    <label class="label">Name</label>
    <input type="text" class="input">
  </div>
  <div>
    <label class="label">Email Address</label>
    <input type="email" class="input">
  </div>
</form>
```

**Effect**: All labels align to the width of the longest label across all rows

### Pattern 3: Responsive Card Grid
**Description**: "Grid of blocks that fill container, minimum 1 column, maximum 3 columns, minimum item width 250px, comfortably spaced"

```html
<div class="grid blocks fill-container min-1-col max-3-col min-width-250 comfortable">
  <article class="card">Card 1</article>
  <article class="card">Card 2</article>
  <article class="card">Card 3</article>
</div>
```

**Behavior**: 
- Automatically fits 1-3 columns based on available space
- Never creates items narrower than 250px
- Gracefully degrades to single column on small screens

### Pattern 4: Action Bar
**Description**: "Horizontal items fitting content, aligned center, justified between edges"

```html
<div class="horizontal items fit-content align-center justify-between">
  <div class="horizontal items fit-content snug">
    <button class="btn btn-secondary">Cancel</button>
    <button class="btn btn-secondary">Reset</button>
  </div>
  <div class="horizontal items fit-content snug">
    <button class="btn btn-primary">Save</button>
  </div>
</div>
```

### Pattern 5: Responsive Sidebar
**Description**: "Horizontal sidebar-main layout, comfortable spacing, stacks on small screens"

```html
<div class="horizontal sidebar-main comfortable stack-small">
  <aside class="card">Navigation</aside>
  <main class="card fill-remaining">Content</main>
</div>
```

**Behavior**:
- Side-by-side on desktop
- Stacks vertically on mobile
- Main content always fills available space

### Pattern 6: Toolbar with Separated Groups
**Description**: "Horizontal items fitting content, wrapping prevented, with groups separated"

```html
<div class="horizontal items fit-content wrap-prevent" style="gap: var(--spacing-3xl);">
  <div class="horizontal items fit-content tight">
    <button class="btn">Cut</button>
    <button class="btn">Copy</button>
    <button class="btn">Paste</button>
  </div>
  <div class="horizontal items fit-content tight">
    <button class="btn">Undo</button>
    <button class="btn">Redo</button>
  </div>
</div>
```

## Creating New Patterns

### Step 1: Describe in Plain English
"I want a vertical list of items where each item has an icon on the left and text on the right, with the icons all aligned to the same width"

### Step 2: Break Down Components
- **Structure**: Vertical rows, each row is two sections
- **Behavior**: First section fits content (icon), second fills remaining (text)
- **Constraint**: First sections align to max width across rows
- **Spacing**: Comfortable

### Step 3: Compose Classes
```html
<div class="rows two-sections align-start-max comfortable">
  <div>
    <span class="icon">🏠</span>
    <span>Home</span>
  </div>
  <div>
    <span class="icon">⚙️</span>
    <span>Settings</span>
  </div>
</div>
```

### Step 4: Extract Pattern (Optional)
If you use this pattern frequently, document it:

```css
/* Icon List Pattern
 * Structure: rows.two-sections.align-start-max.comfortable
 * Use: Vertical list with aligned icons
 */
```

## Benefits

### 1. Readable HTML
```html
<!-- You can understand the layout by reading it -->
<div class="horizontal blocks fill-container min-1-col max-3-col comfortable">
```

### 2. Maintainable
```css
/* Change implementation without touching HTML */
.comfortable {
  gap: var(--spacing-md); /* Was 12px, now 16px */
}
```

### 3. Portable
Same concepts work everywhere:
- Modal dialogs
- Page layouts
- Content editors
- Extension popups

### 4. Composable
```html
<!-- Combine orthogonal concerns -->
<div class="horizontal blocks fill-container tight wrap-allowed align-center">
     ↑ axis    ↑ type ↑ sizing       ↑ gap  ↑ wrapping   ↑ alignment
```

### 5. Learnable
New developers learn **layout vocabulary**, not framework specifics

## Migration Guide

### From Existing Styles

**Before:**
```html
<div class="prefix-options">
  <button class="prefix-button selected">!</button>
  <button class="prefix-button">/</button>
</div>
```

```css
.prefix-options {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.prefix-button {
  /* ... */
}

.prefix-button.selected {
  background-color: var(--text-accent);
  /* ... */
}
```

**After:**
```html
<div class="horizontal blocks equal-square wrap-allowed snug selectable-group min-selected-1">
  <button class="prefix-button is-selected">!</button>
  <button class="prefix-button">/</button>
</div>
```

```css
/* Only button appearance - layout handled by semantic classes */
.prefix-button {
  padding: var(--spacing-sm) var(--spacing-lg);
  border-radius: var(--radius-md);
  font-family: monospace;
  font-size: var(--text-lg);
  border: 1px solid var(--border-primary);
  background-color: var(--bg-primary);
  color: var(--text-primary);
}

/* Selection and interaction handled by .selectable-group */
```

## Extending the System

### Adding New Structure
```css
.masonry {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  grid-auto-rows: 20px;
}

.masonry > * {
  grid-row: span var(--row-span, 10);
}
```

### Adding New Behavior
```css
.staggered {
  /* Children offset in a cascade */
}

.staggered > * {
  transform: translateY(calc(var(--stagger-offset, 10px) * var(--item-index, 0)));
}
```

### Adding New Constraints
```css
.max-items-6 {
  --max-items: 6;
}

.max-items-6 > *:nth-child(n + 7) {
  display: none;
}
```

## Common Questions

**Q: Isn't this just Tailwind with longer names?**  
A: No. Tailwind classes describe *implementation* (`flex`, `gap-4`). These describe *intent* (`horizontal`, `comfortable`). When you change implementation, Tailwind HTML changes. This HTML stays the same.

**Q: What about specificity conflicts?**  
A: Classes are designed to be orthogonal (non-overlapping). `.horizontal` sets direction, `.comfortable` sets gap. They don't conflict.

**Q: How do I know which classes to use?**  
A: Describe your layout in plain English first, then translate. "Horizontal blocks that fill space with comfortable gaps" → `horizontal blocks fill-container comfortable`

**Q: Can I still use custom CSS?**  
A: Absolutely. Use semantic classes for common patterns, custom CSS for unique needs.

## Resources

- `layout-refactored.css` - Full system implementation
- `examples.html` - Living examples of all patterns
- `modalStyles-refactored.css` - Modal-specific usage

## Summary

This system gives you:
- ✅ Semantic, readable HTML
- ✅ Flexible, composable classes  
- ✅ Separation of structure and behavior
- ✅ Consistent vocabulary across your project
- ✅ Easy to extend and customize

Instead of describing *how* layouts work (Tailwind) or providing *complete* components (Bootstrap), this describes *what layouts do* - giving you the perfect balance of expressiveness and flexibility.
