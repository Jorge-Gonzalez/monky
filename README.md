# Monky — Text Macro Expansion Extension

> Version 0.4.1

Monky is a browser extension that boosts productivity by letting you define text macros that expand automatically as you type. It supports plain and rich text, works across any editable field on the web, and is built around a keyboard-centric interface.

---

## Features

- **Rich text macros** — create macros with bold, italics, lists, and links using a WYSIWYG editor
- **Configurable triggers** — customize which prefix characters (like `/` or `;`) activate expansion
- **Smart replacement modes** — automatic expansion on space/enter, or manual commit with a key
- **Fuzzy search** — Tab triggers a full macro search overlay with fuzzy filtering, positioned at the cursor
- **Marker-based undo** — Ctrl+Z restores the original command; undo metadata survives DOM operations
- **Per-site control** — enable or disable the extension for specific websites
- **Theme support** — light, dark, and system themes

---

## Tech stack

```
Framework       React + Vite
Language        TypeScript
State           Zustand
Styling         Custom semantic CSS (replaced Tailwind)
Testing         Vitest + React Testing Library · 430+ tests
Rich text       MediumEditor + TipTap (macro editor)
```

---

## Architecture

The codebase follows a coordinator/manager pattern with strict separation of concerns:

- **macroDetector** — detection logic only
- **macroReplacement** — text replacement and undo tracking
- **macroCore** — composes detection and replacement into a unified interface
- **SuggestionsCoordinator / SearchCoordinator** — overlay lifecycle and keyboard interaction
- **optionsManager + optionsCoordinator** — Zustand state wrapped in a public API

Undo is handled by a marker-based system: every macro insertion wraps content in a transparent `<span>` with metadata in data attributes. This survives DOM operations and enables reliable undo even after the user edits around inserted content.

The CSS system (`layout-semantic.css`) is a custom architecture built as a replacement for Tailwind. Classes describe layout intent rather than implementation — for example: `"horizontal blocks equal-square wrap-allowed snug selectable-group"`. It is being developed as a standalone concept.

---

## Getting started

### Prerequisites

- Node.js v18 or higher
- npm

### Development

```bash
npm install
npm run dev:full
```

Then load the `dist/` folder as an unpacked extension in `chrome://extensions`.

### Production build

```bash
npm run build
```

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev:full` | Development server with live reload |
| `npm run dev:stop` | Stop all development servers |
| `npm run build` | Production build in `dist/` |
| `npm run test` | Full test suite |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |

---

## Status

Active development. Core expansion, undo, fuzzy search, rich text editor, and per-site control complete.

---

## License

MIT