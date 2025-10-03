import { Macro } from "../types"

export async function loadMacros(): Promise<Macro[]> {
  const result = await chrome.storage.local.get("macro-storage")
  const state = result['macro-storage']?.state
  return Array.isArray(state?.macros)
    ? state.macros.map((m: any) => ({
        id: m.id,
        command: m.command ?? m.trigger ?? "",
        text: m.text ?? "",
        html: m.html,
        contentType: m.contentType,
        is_sensitive: m.is_sensitive,
      }))
    : []
}

export function listenMacrosChange(callback: (macros: Macro[]) => void) {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes['macro-storage']) {
      const nextState = changes['macro-storage'].newValue?.state
      const nextMacros = nextState?.macros || []
      callback(
        nextMacros.map((m: any) => ({
          id: m.id,
          command: m.command ?? m.trigger ?? "",
          text: m.text ?? "",
          html: m.html,
          contentType: m.contentType,
          is_sensitive: m.is_sensitive,
        }))
      )
    }
  })
}