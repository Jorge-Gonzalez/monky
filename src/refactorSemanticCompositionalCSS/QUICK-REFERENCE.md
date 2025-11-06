# Semantic CSS Quick Reference

## The Formula

```
[structure] [child-type] [sizing] [constraints] [spacing] [alignment] [wrapping] [interaction] [responsive]
```

## Structure (What it is)
```css
.horizontal         /* Left-to-right */
.vertical           /* Top-to-bottom */
.rows               /* Stacked rows */
.grid               /* 2D grid */
.two-sections       /* Two-part layout */
.sidebar-main       /* Sidebar + content */
```

## Child Types (What items are)
```css
.blocks             /* Substantial items */
.items              /* Inline-like items */
.sections           /* Major divisions */
```

## Sizing (How space is used)
```css
.fill-container     /* Expand to fill */
.fill-remaining     /* Fill leftover space */
.fit-content        /* Size to content */
.equal-sizes        /* All same size */
.equal-square       /* Square and equal */
.equal-circle       /* Circular and equal */
```

## Constraints (Size limits)
```css
/* Columns */
.min-1-col          .max-2-col          .fixed-3-col

/* Width */
.min-width-200      .max-width-400
```

## Spacing (Gaps between items)
```css
.tight              /* 4px */
.snug               /* 8px */
.comfortable        /* 12px */
.spaced             /* 16px */
.loose              /* 20px */
.separated          /* 40px */
```

## Alignment
```css
.align-start        .align-center       .align-end
.align-stretch      .align-baseline

.justify-start      .justify-center     .justify-end
.justify-between    .justify-around
```

## Wrapping
```css
.wrap-allowed       /* Can wrap */
.wrap-prevent       /* No wrapping */
```

## Interaction
```css
.selectable-group       /* Items can be selected */
.min-selected-1         /* At least 1 selected */

/* States */
.is-selected            /* Currently selected */

/* Feedback */
.shake                  /* Shake animation */
.pulse                  /* Pulse animation */
.flash                  /* Flash animation */
```

## Responsive
```css
.stack-small            /* Vertical on mobile */
.hide-small             /* Hidden on mobile */
.collapse-small         /* Full width on mobile */
```

## Common Patterns

### Prefix Selector
```html
<div class="horizontal blocks equal-square wrap-allowed snug 
            selectable-group min-selected-1">
  <button class="is-selected">!</button>
  <button>/</button>
</div>
```

### Form with Aligned Labels
```html
<form class="rows two-sections align-start-max comfortable">
  <div>
    <label>Name</label>
    <input type="text">
  </div>
</form>
```

### Responsive Card Grid
```html
<div class="grid blocks fill-container 
            min-1-col max-3-col min-width-250 comfortable">
  <article class="card">Card 1</article>
  <article class="card">Card 2</article>
</div>
```

### Action Bar
```html
<div class="horizontal items fit-content 
            align-center justify-between">
  <button>Cancel</button>
  <button>Save</button>
</div>
```

### Toolbar with Groups
```html
<div class="horizontal items fit-content wrap-prevent">
  <div class="horizontal items tight">
    <button>Cut</button>
    <button>Copy</button>
  </div>
  <div class="horizontal items tight">
    <button>Undo</button>
    <button>Redo</button>
  </div>
</div>
```

### Sidebar Layout
```html
<div class="horizontal sidebar-main comfortable stack-small">
  <aside>Nav</aside>
  <main class="fill-remaining">Content</main>
</div>
```

## Thinking Process

1. **Describe in English**
   "A horizontal row of blocks that fill the container"

2. **Identify Components**
   - Structure: horizontal
   - Type: blocks
   - Sizing: fill-container

3. **Add Details**
   - Spacing: comfortable
   - Constraints: max-3-col
   - Responsive: stack-small

4. **Write HTML**
   ```html
   <div class="horizontal blocks fill-container 
               comfortable max-3-col stack-small">
   ```

## Tips

✅ **DO**: Describe what it does
```html
<div class="horizontal blocks fill-container comfortable">
```

❌ **DON'T**: Describe how it works
```html
<div class="flex flex-row gap-4">
```

✅ **DO**: Compose from orthogonal concerns
```html
<div class="horizontal comfortable wrap-allowed">
     ↑ direction  ↑ spacing    ↑ wrapping
```

❌ **DON'T**: Mix levels of abstraction
```html
<div class="horizontal gap-4 flex-wrap">
     ↑ semantic   ↑ impl ↑ implementation
```

✅ **DO**: Read your HTML to understand layout
"Horizontal blocks filling container with comfortable gaps"

❌ **DON'T**: Require mental translation
"flex flex-row gap-4 flex-1" = ???

## Component Patterns (from layout.css)

```css
/* Forms */
.label              .input              .input-error
.radio              .radio-label
.checkbox           .editor-content

/* Buttons */
.btn                .btn-primary        .btn-secondary
.btn-success        .btn-danger
.btn-link           .btn-link-danger

/* Alerts */
.alert              .alert-error        .alert-warning
.alert-info         .alert-success

/* Cards */
.card               .card-elevated

/* Views */
.view-container     .view-title         .view-description
.section            .section-title      .section-description

/* Utilities */
.kbd                .empty-state        .divider
.text-mono          .font-medium        .font-semibold
```

## Design Tokens

```css
/* Spacing */
--spacing-xs: 4px      --spacing-sm: 8px
--spacing-md: 12px     --spacing-lg: 16px
--spacing-xl: 20px     --spacing-2xl: 24px
--spacing-3xl: 40px

/* Radius */
--radius-sm: 3px       --radius-md: 6px       --radius-lg: 8px

/* Typography */
--text-xs: 11px        --text-sm: 12px        --text-base: 13px
--text-md: 14px        --text-lg: 15px        --text-xl: 18px
--text-2xl: 20px       --text-3xl: 24px

/* Timing */
--transition-fast: 0.15s
```

## Remember

- Classes compose like words in a sentence
- Structure + Behavior + Constraints = Complete layout
- Read HTML to understand intent
- Write CSS only for appearance
- Patterns are reusable everywhere
