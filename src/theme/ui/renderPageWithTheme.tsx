import React from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeManager } from './ThemeManager';
import { ensureAppFontFace } from '../../content/overlays/services/appFont';

/**
 * Renders a React component into the DOM's 'root' element,
 * wrapping it with common providers like StrictMode and ThemeManager.
 *
 * @param PageComponent The component to render.
 */
export function renderPageWithTheme(PageComponent: React.ComponentType) {
  // Register the app @font-face with an extension-resolved URL. The CSS-imported
  // face uses a root-relative /fonts/ path that doesn't resolve on extension pages;
  // this is the same reliable getURL injection the shadow-DOM overlays use.
  ensureAppFontFace();
  const root = createRoot(document.getElementById('root')!);
  root.render(
    <React.StrictMode>
      <ThemeManager />
      <PageComponent />
    </React.StrictMode>
  );
}