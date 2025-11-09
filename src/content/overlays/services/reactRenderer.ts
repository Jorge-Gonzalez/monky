import React from 'react';
import ReactDOM from 'react-dom/client';

export function createReactRenderer(containerId: string, useShadowDOM = true) {
  let container: HTMLDivElement | null = null;
  let shadowRoot: ShadowRoot | null = null;
  let root: ReactDOM.Root | null = null;

  const initialize = (): void => {
    if (container) return;

    container = document.createElement('div');
    container.id = containerId;
    document.body.appendChild(container);

    if (useShadowDOM) {
      // Create shadow DOM for style isolation
      shadowRoot = container.attachShadow({ mode: 'open' });
      const shadowContainer = document.createElement('div');
      shadowContainer.id = `${containerId}-shadow-root`;
      shadowRoot.appendChild(shadowContainer);
      root = ReactDOM.createRoot(shadowContainer);
    } else {
      root = ReactDOM.createRoot(container);
    }
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
    shadowRoot = null;
    root = null;
  };

  const getShadowRoot = (): ShadowRoot | null => shadowRoot;

  return {
    initialize,
    render,
    clear,
    destroy,
    getShadowRoot,
  };
}

export type ReactRenderer = ReturnType<typeof createReactRenderer>;
