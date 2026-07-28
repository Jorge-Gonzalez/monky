export function createStyleInjector(styleId: string, styles: string, shadowRoot?: ShadowRoot | null) {
  const inject = (): void => {
    const targetRoot = shadowRoot || document

    // Check if style already exists
    if (targetRoot.getElementById?.(styleId)) return
    if (shadowRoot?.querySelector(`#${styleId}`)) return

    const style = document.createElement('style')
    style.id = styleId
    style.textContent = styles

    if (shadowRoot) {
      // Inject into shadow DOM
      shadowRoot.appendChild(style)
    } else {
      // Inject into document head (fallback)
      document.head.appendChild(style)
    }
  }

  const remove = (): void => {
    if (shadowRoot) {
      const style = shadowRoot.querySelector(`#${styleId}`)
      if (style) {
        shadowRoot.removeChild(style)
      }
    } else {
      const style = document.getElementById(styleId)
      if (style) {
        document.head.removeChild(style)
      }
    }
  }

  return { inject, remove }
}

export type StyleInjector = ReturnType<typeof createStyleInjector>
