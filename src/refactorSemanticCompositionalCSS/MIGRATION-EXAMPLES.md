# Migration Examples: Your Extension

## Example 1: Prefix Selector

### Before (Original)
```html
<div class="prefix-options">
  <button class="prefix-button selected">!</button>
  <button class="prefix-button selected">/</button>
  <button class="prefix-button">.</button>
  <button class="prefix-button">,</button>
</div>
```

```css
.prefix-options {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.prefix-button {
  padding: var(--spacing-sm) var(--spacing-lg);
  border-radius: var(--radius-md);
  font-family: monospace;
  font-size: var(--text-lg);
  cursor: pointer;
  transition: all var(--transition-fast);
  border: 1px solid var(--border-primary);
  background-color: var(--bg-primary);
  color: var(--text-primary);
  outline: none;
}

.prefix-button:hover {
  background-color: var(--bg-tertiary);
}

.prefix-button:focus {
  box-shadow: 0 0 0 2px var(--text-accent);
}

.prefix-button.selected {
  background-color: var(--text-accent);
  color: white;
  border-color: var(--text-accent);
}

.prefix-button.shake {
  animation: prefix-shake 0.4s;
}

@keyframes prefix-shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}
```

### After (Semantic Compositional)
```html
<div class="horizontal blocks equal-square wrap-allowed snug selectable-group min-selected-1">
  <button class="prefix-button is-selected">!</button>
  <button class="prefix-button is-selected">/</button>
  <button class="prefix-button">.</button>
  <button class="prefix-button">,</button>
</div>
```

```css
/* Only button-specific appearance - all layout and interaction handled by semantic classes */
.prefix-button {
  padding: var(--spacing-sm) var(--spacing-lg);
  border-radius: var(--radius-md);
  font-family: monospace;
  font-size: var(--text-lg);
  border: 1px solid var(--border-primary);
  background-color: var(--bg-primary);
  color: var(--text-primary);
  outline: none;
}

.prefix-button:focus {
  box-shadow: 0 0 0 2px var(--text-accent);
}

/* .selected state → handled by .selectable-group > .is-selected in layout.css */
/* .shake animation → handled by .shake in layout.css */
/* :hover state → handled by .selectable-group > *:hover in layout.css */
```

**What changed:**
- ❌ Removed: `.prefix-options` (replaced by semantic classes)
- ❌ Removed: All layout CSS (flex, wrap, gap)
- ❌ Removed: Hover/selection states (now in base system)
- ❌ Removed: Shake animation (now in base system)
- ✅ Added: Semantic classes that describe intent
- ✅ Kept: Only button-specific appearance

**Benefits:**
- 46 lines of CSS → 11 lines
- Layout is now reusable elsewhere
- HTML clearly describes behavior
- Interaction pattern can be used for any selectable group

---

## Example 2: Replacement Mode Options

### Before (Original)
```html
<div class="replacement-mode-options">
  <label class="replacement-mode-option">
    <input type="radio" name="mode" class="replacement-mode-radio" checked>
    <span class="replacement-mode-label">Immediate</span>
  </label>
  <label class="replacement-mode-option">
    <input type="radio" name="mode" class="replacement-mode-radio">
    <span class="replacement-mode-label">Manual</span>
  </label>
</div>
```

```css
.replacement-mode-options {
  display: flex;
  gap: var(--spacing-lg);
}

.replacement-mode-option {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.replacement-mode-radio {
  margin-right: var(--spacing-sm);
  cursor: pointer;
  width: 16px;
  height: 16px;
  accent-color: var(--text-accent);
}

.replacement-mode-label {
  font-size: var(--text-md);
  color: var(--text-primary);
  cursor: pointer;
  user-select: none;
}
```

### After (Semantic Compositional)
```html
<div class="horizontal items fit-content loose">
  <label class="horizontal items fit-content align-center snug">
    <input type="radio" name="mode" class="radio" checked>
    <span class="radio-label">Immediate</span>
  </label>
  <label class="horizontal items fit-content align-center snug">
    <input type="radio" name="mode" class="radio">
    <span class="radio-label">Manual</span>
  </label>
</div>
```

```css
/* All styles now in base system (layout.css) */
/* .radio and .radio-label are universal patterns */
```

**What changed:**
- ❌ Removed: `.replacement-mode-options` (replaced by semantic classes)
- ❌ Removed: `.replacement-mode-option` (replaced by semantic classes)
- ❌ Removed: `.replacement-mode-radio` (replaced by `.radio` from base)
- ❌ Removed: `.replacement-mode-label` (replaced by `.radio-label` from base)
- ✅ Added: Semantic classes that compose naturally
- ✅ Reused: Universal `.radio` and `.radio-label` patterns

**Benefits:**
- 24 lines of CSS → 0 lines
- Pattern now works anywhere in the extension
- More explicit about layout structure
- Easier to modify spacing or alignment

---

## Example 3: Modal Navigation Tabs

### Before (Original)
```html
<nav class="modal-navigation">
  <button class="modal-nav-tab active">
    <span class="modal-nav-icon">📝</span>
    <span class="modal-nav-label">Macros</span>
  </button>
  <button class="modal-nav-tab">
    <span class="modal-nav-icon">⚙️</span>
    <span class="modal-nav-label">Settings</span>
  </button>
</nav>
```

```css
.modal-navigation {
  display: flex;
  border-bottom: 1px solid var(--border-primary);
  background-color: var(--bg-primary);
}

.modal-nav-tab {
  flex: 1;
  padding: var(--spacing-md) var(--spacing-lg);
  /* ... 15 more style declarations ... */
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}
```

### After (Semantic Compositional)
```html
<nav class="horizontal blocks equal-sizes align-center justify-center" 
     style="border-bottom: 1px solid var(--border-primary);">
  <button class="modal-nav-tab active">
    <span class="modal-nav-icon">📝</span>
    <span class="modal-nav-label">Macros</span>
  </button>
  <button class="modal-nav-tab">
    <span class="modal-nav-icon">⚙️</span>
    <span class="modal-nav-label">Settings</span>
  </button>
</nav>
```

```css
/* Container layout handled by semantic classes */

.modal-nav-tab {
  padding: var(--spacing-md) var(--spacing-lg);
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: var(--text-base);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
  border-bottom: 2px solid transparent;
  
  /* Inner layout */
  display: flex;
  align-items: center;
  gap: 6px;
}

.modal-nav-tab:hover {
  background-color: var(--bg-secondary);
  color: var(--text-primary);
}

.modal-nav-tab.active {
  color: var(--text-accent);
  border-bottom-color: var(--text-accent);
  background-color: var(--bg-secondary);
}
```

**What changed:**
- ❌ Removed: Container flexbox declarations from `.modal-navigation`
- ✅ Added: Semantic classes describe layout intent
- ✅ Kept: Tab-specific appearance and states
- ✅ Kept: Internal tab layout (icon + label)

**Benefits:**
- Clearer separation: container vs. item styling
- Layout intent visible in HTML
- Tab styling focused on appearance only

---

## Real-World Usage Patterns in Your Extension

### Pattern A: Form with Aligned Labels
**Where:** Settings view, macro editor

```html
<!-- Description: "Vertical rows with two sections, first section sizes to content,
     second fills remaining space, all first sections align to widest" -->
<form class="rows two-sections align-start-max comfortable">
  <div>
    <label class="label">Command</label>
    <input class="input" type="text">
  </div>
  <div>
    <label class="label">Replacement Text</label>
    <textarea class="input"></textarea>
  </div>
  <div>
    <label class="label">Active</label>
    <input class="checkbox" type="checkbox">
  </div>
</form>
```

### Pattern B: Action Bar
**Where:** Modal footer, toolbar areas

```html
<!-- Description: "Horizontal items at edges with space between" -->
<div class="horizontal items fit-content align-center justify-between">
  <button class="btn btn-link-danger">Delete All</button>
  <div class="horizontal items fit-content snug">
    <button class="btn btn-secondary">Cancel</button>
    <button class="btn btn-primary">Save</button>
  </div>
</div>
```

### Pattern C: Grid of Macro Cards
**Where:** Macro list view

```html
<!-- Description: "Grid that fills container, 1-3 columns based on space,
     items minimum 250px, comfortable gaps" -->
<div class="grid blocks fill-container min-1-col max-3-col min-width-250 comfortable">
  <article class="card">
    <h3>Macro 1</h3>
    <p>Command: /email</p>
  </article>
  <article class="card">
    <h3>Macro 2</h3>
    <p>Command: /phone</p>
  </article>
  <!-- ... more cards ... -->
</div>
```

### Pattern D: Settings Section
**Where:** Throughout settings panels

```html
<!-- Description: "Vertical rows with comfortable spacing" -->
<section class="section">
  <h3 class="section-title">Command Prefixes</h3>
  <p class="section-description">
    Select one or more characters to use as command prefixes.
    At least one must remain selected.
  </p>
  
  <div class="horizontal blocks equal-square wrap-allowed snug selectable-group min-selected-1">
    <button class="prefix-button is-selected">!</button>
    <button class="prefix-button is-selected">/</button>
    <button class="prefix-button">.</button>
  </div>
</section>
```

---

## Migration Checklist

### Phase 1: Add New System
- [x] Add `layout-refactored.css` to project
- [ ] Import before existing styles
- [ ] Test that nothing breaks (new classes don't conflict)

### Phase 2: Refactor Major Patterns
- [ ] Prefix selector → `horizontal blocks equal-square...`
- [ ] Replacement mode → `horizontal items fit-content...`
- [ ] Navigation tabs → `horizontal blocks equal-sizes...`
- [ ] Form layouts → `rows two-sections align-start-max...`

### Phase 3: Remove Old Styles
- [ ] Delete component-specific layout CSS
- [ ] Keep only appearance-specific CSS
- [ ] Remove unused classes

### Phase 4: Update Throughout Extension
- [ ] Modal views
- [ ] Settings panels
- [ ] Popup interface
- [ ] Content editor overlays

---

## Key Takeaways

1. **HTML becomes documentation**: Reading classes tells you what the layout does
2. **CSS becomes focused**: Only style appearance, not layout
3. **Patterns become reusable**: Same classes work everywhere
4. **Changes become easier**: Modify spacing system-wide by changing variables
5. **Code becomes maintainable**: New developers understand layout intent immediately

Your extension will have:
- ~60% less CSS
- More consistent patterns
- Easier to extend
- Self-documenting layouts
