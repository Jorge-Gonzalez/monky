import { createElement } from 'react'
import type { Macro } from '../../../types'
import { DeleteConfirmPopup } from './DeleteConfirmPopup'
import { createReactRenderer } from '../services/reactRenderer'
import { createStyleInjector } from '../services/styleInjector'
import { ensureAppFontFace } from '../services/appFont'
import { composeShadowBundle } from '../../../styles/baseBundle'
import { getActiveEditable } from '../../macroEngine/replacement/editableUtils'
import { getCaretCoordinates } from '../suggestionsOverlay/utils/caretPosition'
import { calculateOptimalPosition } from '../suggestionsOverlay/utils/popupPositioning'

const POPUP_ESTIMATED_WIDTH = 260
const POPUP_ESTIMATED_HEIGHT = 110

const DELETE_CONFIRM_BUNDLE = composeShadowBundle()

// Cursor-anchored confirmation for the in-page :delete/macro command. Reuses the
// suggestions overlay's renderer, styles and caret positioning; the actual delete
// is supplied by the caller via setOnConfirm so this stays UI-only.
export function createDeleteConfirmManager() {
  const renderer = createReactRenderer('macro-delete-confirm', true, 'sf-foreign-overlay-host')
  let styleInjector: ReturnType<typeof createStyleInjector>
  let onConfirm: ((macro: Macro) => void) | null = null
  let pending: Macro | null = null
  let visible = false

  const initialize = (): void => {
    renderer.initialize()
    const shadowRoot = renderer.getShadowRoot()
    ensureAppFontFace()
    styleInjector = createStyleInjector(
      'macro-delete-confirm-styles',
      DELETE_CONFIRM_BUNDLE,
      shadowRoot
    )
    styleInjector.inject()
  }

  const renderPopup = (macro: Macro, position: { x: number; y: number }, placement: 'top' | 'bottom'): void => {
    renderer.render(
      createElement(DeleteConfirmPopup, {
        macro,
        position,
        placement,
        isVisible: true,
        onConfirm: () => { const m = pending; hide(); if (onConfirm && m) onConfirm(m) },
        onCancel: hide,
      })
    )
  }

  // A mousedown outside the popup dismisses it. composedPath() crosses the shadow
  // boundary, so clicks on the popup's own buttons (path includes the host) are kept.
  const handleOutsideMouseDown = (e: MouseEvent): void => {
    const host = renderer.getShadowRoot()?.host
    if (host && !e.composedPath().includes(host)) hide()
  }

  const show = (macro: Macro): void => {
    const el = getActiveEditable(document.activeElement)
    const caret = el ? getCaretCoordinates(el) : null
    const coords = caret ?? { x: window.innerWidth / 2, y: window.innerHeight / 2 }
    const optimal = calculateOptimalPosition(
      coords,
      { width: window.innerWidth, height: window.innerHeight },
      { width: POPUP_ESTIMATED_WIDTH, height: POPUP_ESTIMATED_HEIGHT },
      { margin: 10 }
    )
    pending = macro
    visible = true
    renderPopup(macro, { x: optimal.x, y: optimal.y }, optimal.placement)
    document.addEventListener('mousedown', handleOutsideMouseDown, true)
  }

  const hide = (): void => {
    if (!visible) return
    visible = false
    pending = null
    document.removeEventListener('mousedown', handleOutsideMouseDown, true)
    renderer.clear()
  }

  const setOnConfirm = (cb: (macro: Macro) => void): void => { onConfirm = cb }
  const isVisible = (): boolean => visible
  const destroy = (): void => { hide(); renderer.destroy(); styleInjector?.remove() }

  initialize()

  return { show, hide, isVisible, setOnConfirm, destroy }
}

export type DeleteConfirmManager = ReturnType<typeof createDeleteConfirmManager>
