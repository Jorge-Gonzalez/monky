import { createModalManager } from './modal/modalManager'
import { createSuggestionsOverlayManager } from './suggestionsOverlay'
import { createDeleteConfirmManager } from './deleteConfirm/DeleteConfirmManager'
import type { ModalCoordinator } from '../coordinators/ModalCoordinator'
import { createModalCoordinator } from '../coordinators/ModalCoordinator'
import type { SuggestionsCoordinator } from '../coordinators/SuggestionsCoordinator'
import { createSuggestionsCoordinator } from '../coordinators/SuggestionsCoordinator'
import { deleteMacros } from '../../store/macroCrud'
import type { Macro } from '../../types'

// Create managers (private, only used by coordinators)
const modalManager = createModalManager()
const suggestionsOverlayManager = createSuggestionsOverlayManager([])

// Create and export singleton coordinators (public API)
export const modalCoordinator: ModalCoordinator = createModalCoordinator(modalManager)
export const suggestionsCoordinator: SuggestionsCoordinator =
  createSuggestionsCoordinator(suggestionsOverlayManager)

// In-page delete confirmation. Confirming deletes via macroCrud so the change is
// pushed to sync (the same path the search view uses).
export const deleteConfirmManager = createDeleteConfirmManager()
deleteConfirmManager.setOnConfirm((macro) => {
  void deleteMacros([String(macro.id)])
})

// Convenience function for updating macros
export function updateAllMacros(macros: Macro[]): void {
  suggestionsCoordinator.setMacros(macros)
}

// Convenience function for cleanup
export function destroyAllOverlays(): void {
  modalCoordinator.destroy()
  suggestionsCoordinator.destroy()
  deleteConfirmManager.destroy()
}
