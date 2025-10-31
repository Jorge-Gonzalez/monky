## Modal Structure

```
ModalShell (new - extracted from MacroSearchOverlay)
├── Backdrop (click-to-close, centered layout, theming)
└── ModalDialog (sizing, scrolling, borders)
    ├── ModalNavigation (new - tabs/buttons to switch views)
    └── ViewContent (one of three views)
        ├── MacroSearchView (refactored from MacroSearchOverlay)
        ├── SettingsView (new)
        └── MacroEditorView (new)
```

## File Structure

```
src/content/overlays/
├── modal/                              # NEW: Shared modal infrastructure
│   ├── ui/
│   │   ├── ModalShell.tsx             # Backdrop + dialog container
│   │   ├── ModalNavigation.tsx        # Tab/button navigation
│   │   └── ModalDialog.tsx            # Dialog box wrapper
│   ├── hooks/
│   │   ├── useModalKeyboard.ts        # Global modal keyboard (Escape, etc.)
│   │   └── useModalView.ts            # View switching state
│   ├── modalManager.ts                # Generic modal manager
│   └── modalStyles.ts                 # Shared modal styles
│
├── views/                              # NEW: View-specific components
│   ├── search/
│   │   ├── ui/
│   │   │   ├── MacroSearchView.tsx    # RENAMED from MacroSearchOverlay
│   │   │   ├── MacroSearchInput.tsx   # MOVED from searchOverlay/ui
│   │   │   ├── MacroSearchResults.tsx # MOVED
│   │   │   └── MacroSearchFooter.tsx  # MOVED
│   │   ├── hooks/
│   │   │   ├── useMacroSearch.ts      # MOVED
│   │   │   ├── useListNavigation.ts   # MOVED
│   │   │   └── useKeyboardNavigation.ts # MOVED (view-specific keys)
│   │   └── searchViewStyles.ts        # View-specific styles
│   │
│   ├── settings/
│   │   ├── ui/
│   │   │   └── SettingsView.tsx       # NEW
│   │   └── settingsViewStyles.ts
│   │
│   └── macroEditor/
│       ├── ui/
│       │   └── MacroEditorView.tsx    # NEW
│       └── editorViewStyles.ts
│
├── searchOverlay/                      # DEPRECATED or remove
│
├── services/                           # Keep as-is
│   ├── reactRenderer.ts
│   ├── focusManager.ts
│   └── styleInjector.ts
│
└── hooks/                              # Keep as-is
    ├── useAutoFocus.ts
    ├── useScrollIntoView.ts
    └── useThemeColors.ts
```