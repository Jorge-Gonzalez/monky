import React from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeManager } from './ThemeManager';

/**
 * Renders a React component into the DOM's 'root' element,
 * wrapping it with common providers like StrictMode and ThemeManager.
 *
 * @param PageComponent The component to render.
 */
export function renderPage(PageComponent: React.ComponentType) {
  const root = createRoot(document.getElementById('root')!);
  root.render(
    <React.StrictMode>
      <ThemeManager />
      <PageComponent />
    </React.StrictMode>
  );
}