# Monky - Text Macro Expansion Extension

Version 0.4.1

Monky is a browser extension that boosts your productivity by allowing you to define and use text macros (snippets) that expand automatically as you type. It supports both plain and rich text, giving you the power to insert anything from a simple signature to a formatted list with a few keystrokes.

## ✨ Features

-   **Rich Text Macros:** Create macros with bold, italics, lists, and links using a WYSIWYG editor.
-   **Configurable Triggers:** Customize which prefix characters (like `/` or `;`) trigger macro expansion.
-   **Smart Replacement Modes:** Choose between automatic replacement on space/enter or manual replacement with a commit key.
-   **Per-Site Control:** Easily enable or disable the extension for specific websites.
-   **Theme Support:** Switch between light, dark, and system themes for a comfortable experience.
-   **Fuzzy Search:** Quickly find the macro you need in the popup search.

## 🛠️ Tech Stack

-   **Framework:** React with Vite
-   **Language:** TypeScript
-   **State Management:** Zustand
-   **Styling:** Tailwind CSS
-   **Testing:** Vitest & React Testing Library
-   **Rich Text Editor:** MediumEditor

## 🚀 Getting Started

### Prerequisites

-   Node.js (v18 or higher)
-   npm

### Development

For the best development experience with live reloading for the extension, follow these steps:

1.  **Install dependencies:**
    ```bash
    npm install
    ```

2.  **Start the development servers:**
    This command starts both the Vite HMR server and a custom live-reload server.
    ```bash
    npm run dev:full
    ```

3.  **Load the extension in your browser:**
    -   Open Chrome/Brave and navigate to `chrome://extensions`.
    -   Enable "Developer mode".
    -   Click "Load unpacked" and select the `dist` folder from this project.

The extension will now automatically reload when you make changes to the source code.

### Production Build

To create an optimized production build of the extension, run:

```bash
npm run build
```

This will generate the final files in the `dist` directory, ready for packaging or loading into the browser.

##  NPM Scripts

-   `npm run dev:full`: Starts the development server with live reload.
-   `npm run dev:stop`: Stops all development servers gracefully.
-   `npm run build`: Creates a production-ready build in the `dist/` folder.
-   `npm run test`: Runs the full test suite using Vitest.
-   `npm run lint`: Lints the codebase using ESLint.
-   `npm run format`: Formats all files using Prettier.
