import { Macro } from "../../types"
import { modalCoordinator } from "../overlays";
import { useMacroStore } from "../../store/useMacroStore";

export const SYSTEM_MACROS: Macro[] = [
  {
    id: 'system-search-overlay',
    command: '/?',
    text: '',
    isSystemMacro: true,
    description: 'Open macro search overlay'
  },
  {
    id: 'system-new-macro',
    command: ':new',
    text: '',
    isSystemMacro: true,
    description: 'Create a new macro'
  },
  {
    id: 'system-edit-macro',
    command: ':edit',
    text: '',
    isSystemMacro: true,
    isParametric: true,
    description: 'Edit a macro — :edit/command'
  },
  {
    id: 'system-delete-macro',
    command: ':delete',
    text: '',
    isSystemMacro: true,
    isParametric: true,
    description: 'Delete a macro — :delete/command'
  },
  {
    id: 'system-settings',
    command: ':settings',
    text: '',
    isSystemMacro: true,
    description: 'Open settings'
  },
]

export function isSystemMacro(macro: Macro): boolean {
  return macro.isSystemMacro === true || SYSTEM_MACROS.some(sm => sm.id === macro.id)
}

export function isParametricSystemMacro(macro: Macro): boolean {
  return !!macro.isParametric
}

/**
 * Handles non-parametric system macros (exact command match).
 */
export function handleSystemMacro(macro: Macro): boolean {
  if (!isSystemMacro(macro)) return false

  switch (macro.id) {
    case 'system-search-overlay':
      modalCoordinator.show('search')
      return true

    case 'system-new-macro':
      modalCoordinator.show('editor')
      modalCoordinator.navigateToEditor(undefined)
      return true

    case 'system-settings':
      modalCoordinator.show('settings')
      return true

    // Parametric macros are handled by handleParametricSystemCommand, not here
    case 'system-edit-macro':
    case 'system-delete-macro':
      return false

    default:
      return false
  }
}

/**
 * Handles parametric system commands: :edit/command or :delete/command.
 * Called by the detector when a full parametric buffer is committed.
 */
export function handleParametricSystemCommand(commandId: string, param: string): boolean {
  const { macros, deleteMacro } = useMacroStore.getState()
  const target = macros.find(m => m.command === param)

  switch (commandId) {
    case 'system-edit-macro':
      if (target) {
        modalCoordinator.show('editor')
        modalCoordinator.navigateToEditor(target)
      }
      return true

    case 'system-delete-macro':
      if (target) {
        deleteMacro(target.id)
      }
      return true

    default:
      return false
  }
}

/**
 * Parses a parametric buffer like ':edit/nota' into { systemMacro, param }.
 * Returns null if the buffer is not a valid parametric system command.
 */
export function parseParametricBuffer(
  buffer: string,
  prefixes: string[]
): { systemMacro: Macro; param: string } | null {
  const parametric = SYSTEM_MACROS.filter(m => m.isParametric)
  for (const sm of parametric) {
    if (!buffer.startsWith(sm.command)) continue
    const rest = buffer.slice(sm.command.length)
    if (rest && prefixes.some(p => rest.startsWith(p))) {
      return { systemMacro: sm, param: rest }
    }
  }
  return null
}
