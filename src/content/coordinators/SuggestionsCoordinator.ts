import { EditableEl, Macro } from '../../types'
import { SuggestionsOverlayManager } from '../overlays/suggestionsOverlay/SuggestionsOverlayManager'
import { getActiveEditable } from '../macroEngine/replacement/editableUtils'
import { DetectorActions } from '../actions/detectorActions'

export function createSuggestionsCoordinator(
  manager: SuggestionsOverlayManager
): SuggestionsCoordinator {
  let isEnabled = true
  let currentMacros: Macro[] = []

  const setMacros = (macros: Macro[]): void => {
    currentMacros = [...macros]
    manager.updateMacros(macros)
  }

  const detectorActions: DetectorActions = {
    onDetectionStarted(_buffer: string, _position?: { x: number; y: number }) {
    },

    onDetectionUpdated(buffer: string, _position?: { x: number; y: number }) {
      if (manager.isVisible()) {
        manager.updateBuffer(buffer)
      }
    },

    onDetectionCancelled() {
      manager.hide()
    },

    onMacroCommitted(_macroId: string) {
      manager.hide()
    },

    onCommitRequested(buffer: string): boolean {
      if (manager.isVisible()) {
        return true
      }
      const exactMatch = currentMacros.find(m => m.command === buffer)
      return !!exactMatch
    },

    onNavigationRequested(_direction: 'up' | 'down' | 'left' | 'right'): boolean {
      if (manager.isVisible()) {
        return true
      }
      return false
    },

    onCancelRequested(): boolean {
      if (manager.isVisible()) {
        manager.hide()
        return true
      }
      return false
    },

    onShowAllRequested(buffer: string, position?: { x: number; y: number }): void {
      const x = position?.x || 0
      const y = position?.y || 0
      manager.showAll(x, y, buffer)
    },
  }

  const coordinator: SuggestionsCoordinator = {
    ...detectorActions,
    attach: (): void => {
      document.addEventListener('click', handleClickOutside, true)
    },

    detach: (): void => {
      document.removeEventListener('click', handleClickOutside, true)
      manager.hide()
    },

    enable: (): void => {
      isEnabled = true
    },

    disable: (): void => {
      isEnabled = false
      if (manager.isVisible()) {
        manager.hide()
      }
    },

    isEnabled: (): boolean => isEnabled,

    updateConfig: (): void => {},

    setMacros,

    isVisible: (): boolean => manager.isVisible(),

    hide: (): void => {
      manager.hide()
    },

    showAll: (x?: number, y?: number, buffer?: string): void => {
      if (!isEnabled) return
      manager.showAll(x, y, buffer)
    },

    setOnMacroSelected: (callback: (macro: Macro, buffer: string, element: EditableEl) => void): void => {
      manager.setOnMacroSelected(callback)
    },

    destroy: (): void => {
      coordinator.detach()
      manager.destroy()
    },
  }

  return coordinator

  function handleClickOutside(e: MouseEvent): void {
    if (!manager.isVisible()) return
    const target = e.target as Element
    const editableElement = getActiveEditable(target)
    if (!editableElement) {
      manager.hide()
    }
  }
}

export interface SuggestionsCoordinator extends DetectorActions {
  attach: () => void
  detach: () => void
  enable: () => void
  disable: () => void
  isEnabled: () => boolean
  updateConfig: () => void
  setMacros: (macros: Macro[]) => void
  isVisible: () => boolean
  hide: () => void
  showAll: (x?: number, y?: number, buffer?: string) => void
  setOnMacroSelected: (callback: (macro: Macro, buffer: string, element: EditableEl) => void) => void
  destroy: () => void
}
