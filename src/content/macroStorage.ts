import { Macro } from "../types"

export async function loadMacros(): Promise<Macro[]> {
  const result = await chrome.storage.local.get("macro-storage")
  
  let state: any = null
  let macros: any[] = []
  
  // The macro-storage value might be a JSON string, so parse it
  try {
    const rawStorage = result['macro-storage']
    if (typeof rawStorage === 'string') {
      const parsed = JSON.parse(rawStorage)
      state = parsed.state
    } else if (rawStorage?.state) {
      state = rawStorage.state
    }
  } catch (error) {
    console.warn('[MONKY] Error parsing storage:', error)
  }
  
  if (Array.isArray(state?.macros)) {
    macros = state.macros
  }
  
  return macros.map((m: any) => ({
    id: m.id,
    command: m.command ?? m.trigger ?? "",
    text: m.text ?? "",
    html: m.html,
    contentType: m.contentType,
    is_sensitive: m.is_sensitive,
  }))
}

export function listenMacrosChange(callback: (macros: Macro[]) => void) {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes['macro-storage']) {
      let nextState: any = null
      try {
        const newValue = changes['macro-storage'].newValue
        if (typeof newValue === 'string') {
          const parsed = JSON.parse(newValue)
          nextState = parsed.state
        } else if (newValue?.state) {
          nextState = newValue.state
        }
      } catch (error) {
        console.warn('[MONKY] Error parsing changed storage:', error)
      }
      
      const nextMacros = nextState?.macros || []
      const processedMacros = nextMacros.map((m: any) => ({
        id: m.id,
        command: m.command ?? m.trigger ?? "",
        text: m.text ?? "",
        html: m.html,
        contentType: m.contentType,
        is_sensitive: m.is_sensitive,
      }))
      
      callback(processedMacros)
    }
  })
}