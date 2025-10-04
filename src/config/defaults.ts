import { MacroConfig, Macro } from "../types"

export const defaultMacroConfig: MacroConfig = {
  disabledSites: [],
  prefixes: ["/", ";"],
  theme: "light",
  useCommitKeys: false, // Default to auto-commit
}

export const dummyMacros: Macro[] = [
  { id: 1, command: "/brb", text: "Be right back", contentType: "text/plain", is_sensitive: false },
  { id: 2, command: ";omw", text: "On my way", contentType: "text/plain", is_sensitive: false },
  { id: 3, command: ";idk", text: "I don't know", contentType: "text/plain", is_sensitive: false },
  {
    id: 'html-sig',
    command: '/sig',
    text: 'John Doe - Software Developer',
    html: '<b>John Doe</b><br><i>Software Developer</i>',
    contentType: 'text/html',
    is_sensitive: false,
  },
  {
    id: 'html-list',
    command: '/list',
    text: 'Item 1, Item 2',
    html: '<ul><li>Item 1</li><li>Item 2</li></ul>',
    contentType: 'text/html',
    is_sensitive: false,
  },
]
