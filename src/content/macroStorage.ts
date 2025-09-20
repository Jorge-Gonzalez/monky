import { Macro } from "./detector-core"

export async function loadMacros(): Promise<Macro[]> {
  const o = await chrome.storage.local.get("macros")
  return Array.isArray(o.macros)
    ? o.macros.map((m) => ({
        id: m.id,
        command: m.command ?? m.trigger ?? "",
        text: m.text ?? "",
      }))
    : []
}

export function listenMacrosChange(callback: (macros: Macro[]) => void) {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.macros) {
      const next = changes.macros.newValue || []
      callback(
        next.map((m: any) => ({
          id: m.id,
          command: m.command ?? m.trigger ?? "",
          text: m.text ?? "",
        }))
      )
    }
  })
}