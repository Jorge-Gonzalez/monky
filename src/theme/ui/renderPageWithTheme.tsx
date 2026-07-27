import { StrictMode } from 'react';
import type { ComponentType } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeManager } from './ThemeManager';

/**
 * Renders a React component into the DOM's 'root' element,
 * wrapping it with common providers like StrictMode and ThemeManager.
 *
 * @param PageComponent The component to render.
 */
export function renderPageWithTheme(PageComponent: ComponentType) {
  // No ensureAppFontFace() here: on an extension page the CSS-imported face's
  // root-relative /fonts/ URL resolves against the extension origin already.
  // Verified by removing the injected face at runtime — Plex still resolved.
  // The overlay managers still need it, because @font-face is document-scoped
  // and so is ignored inside a shadow root.
  const root = createRoot(document.getElementById('root')!);
  root.render(
    <StrictMode>
      <ThemeManager />
      <PageComponent />
    </StrictMode>
  );
}