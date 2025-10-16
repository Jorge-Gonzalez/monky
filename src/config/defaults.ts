import { Config, Macro } from "../types"

export const defaultMacroConfig: Config = {
  disabledSites: [],
  prefixes: ["/", ";"],
  theme: "light",
  useCommitKeys: false, // Default to auto-commit
  language: "en",
  suggestionsPopupPlacement: "bottom",
}

export const dummyMacros: Macro[] = [
  // Plain text macros - inline content
  { id: 1, command: "/brb", text: "Be right back", contentType: "text/plain", is_sensitive: false },
  { id: 2, command: ";omw", text: "On my way", contentType: "text/plain", is_sensitive: false },
  { id: 3, command: ";idk", text: "I don't know", contentType: "text/plain", is_sensitive: false },
  { id: 4, command: "/email", text: "john.doe@example.com", contentType: "text/plain", is_sensitive: false },
  
  // Rich HTML macros - formatted content
  {
    id: 'html-sig',
    command: '/sig',
    text: 'John Doe - Software Developer',
    html: '<p><strong>John Doe</strong><br><em>Software Developer</em></p>',
    contentType: 'text/html',
    is_sensitive: false,
  },
  {
    id: 'html-list',
    command: '/tasks',
    text: 'Review code, Update docs, Test features',
    html: '<ul><li>Review code</li><li>Update docs</li><li>Test features</li></ul>',
    contentType: 'text/html',
    is_sensitive: false,
  },
]
