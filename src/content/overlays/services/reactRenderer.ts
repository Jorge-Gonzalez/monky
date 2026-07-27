import { createElement } from 'react'
import { createRoot } from 'react-dom/client'

type Root = ReturnType<typeof createRoot>

export function createReactRenderer(containerId: string, useShadowDOM = true, hostClassName?: string) {
  let container: HTMLDivElement | null = null
  let shadowRoot: ShadowRoot | null = null
  let root: Root | null = null

  const initialize = (): void => {
    if (container) return

    container = document.createElement('div')
    container.id = containerId
    if (hostClassName) container.className = hostClassName
    document.body.appendChild(container)

    if (useShadowDOM) {
      // Create shadow DOM for style isolation
      shadowRoot = container.attachShadow({ mode: 'open' })
      const shadowContainer = document.createElement('div')
      shadowContainer.id = `${containerId}-shadow-root`
      shadowRoot.appendChild(shadowContainer)
      root = createRoot(shadowContainer)
    } else {
      root = createRoot(container)
    }
  }

  const render = (element: ReturnType<typeof createElement>): void => {
    if (!root) initialize()
    root?.render(element)
  }

  const clear = (): void => {
    root?.render(createElement('div', null))
  }

  const destroy = (): void => {
    clear()
    if (container && document.body.contains(container)) {
      document.body.removeChild(container)
    }
    container = null
    shadowRoot = null
    root = null
  }

  const getShadowRoot = (): ShadowRoot | null => shadowRoot

  return {
    initialize,
    render,
    clear,
    destroy,
    getShadowRoot,
  }
}

export type ReactRenderer = ReturnType<typeof createReactRenderer>
