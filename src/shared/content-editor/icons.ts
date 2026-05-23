const p = `width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`

export const icons = {
  undo: `<svg ${p}><path d="M3 7v6h6"/><path d="M3 13C5.2 8.4 10 6 15 6c4 0 7.4 2.2 9 5.5"/></svg>`,
  redo: `<svg ${p}><path d="M21 7v6h-6"/><path d="M21 13C18.8 8.4 14 6 9 6c-4 0-7.4 2.2-9 5.5"/></svg>`,
  bold: `<svg ${p}><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/></svg>`,
  italic: `<svg ${p}><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg>`,
  underline: `<svg ${p}><path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"/><line x1="4" y1="21" x2="20" y2="21"/></svg>`,
  strikethrough: `<svg ${p}><path d="M17.3 12H6.7"/><path d="M10 8.5C10 7.1 11.1 6 12.5 6c1.1 0 2 .6 2.4 1.5"/><path d="M6.6 16c.5 1.4 1.9 2.5 3.9 2.5 2.2 0 3.5-1.2 3.5-2.8 0-.4-.1-.8-.2-1.2"/></svg>`,
  bulletList: `<svg ${p}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>`,
  orderedList: `<svg ${p}><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4l2-2h-2"/></svg>`,
  link: `<svg ${p}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72"/></svg>`,
  unlink: `<svg ${p}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72"/><line x1="2" y1="2" x2="22" y2="22"/></svg>`,
  check: `<svg ${p}><polyline points="20 6 9 17 4 12"/></svg>`,
  x: `<svg ${p}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  chevronDown: `<svg ${p}><polyline points="6 9 12 15 18 9"/></svg>`,
}
