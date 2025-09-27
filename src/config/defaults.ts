import { MacroConfig, Macro } from "../store/useMacroStore"

export const defaultMacroConfig: MacroConfig = {
  disabledSites: [],
  prefixes: ["/", ";"],
  theme: "light",
  useCommitKeys: false, // Default to auto-commit
}

export const dummyMacros: Macro[] = [
    { id: 1, command: "/brb", text: "Be right back" },
    { id: 2, command: ";omw", text: "On my way" },
    { id: 3, command: ";idk", text: "I don't know" }
  ]
