import React from 'react';
import ReactDOM from 'react-dom/client';

export function createReactRenderer(containerId: string) {
  let container: HTMLDivElement | null = null;
  let root: ReactDOM.Root | null = null;

  const initialize = (): void => {
    if (container) return;

    container = document.createElement('div');
    container.id = containerId;
    document.body.appendChild(container);
    root = ReactDOM.createRoot(container);
  };

  const render = (element: React.ReactElement): void => {
    if (!root) initialize();
    root?.render(element);
  };

  const clear = (): void => {
    root?.render(React.createElement('div'));
  };

  const destroy = (): void => {
    clear();
    if (container && document.body.contains(container)) {
      document.body.removeChild(container);
    }
    container = null;
    root = null;
  };

  return {
    initialize,
    render,
    clear,
    destroy,
  };
}

export type ReactRenderer = ReturnType<typeof createReactRenderer>;
