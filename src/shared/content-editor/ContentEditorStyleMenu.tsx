import { useState, useRef, RefObject } from 'react'
import { BlockType } from './types'
import { setBlockType } from './editorCommands'
import { icons } from './icons'
import { useOverlayDismiss } from './useOverlayDismiss'

type StyleOption = { type: BlockType; label: string; shortLabel: string }

const STYLE_OPTIONS: StyleOption[] = [
  { type: 'paragraph', label: 'Paragraph',   shortLabel: '¶'    },
  { type: 'h1',        label: 'Heading 1',   shortLabel: 'H1'   },
  { type: 'h2',        label: 'Heading 2',   shortLabel: 'H2'   },
  { type: 'h3',        label: 'Heading 3',   shortLabel: 'H3'   },
  { type: 'blockquote',label: 'Blockquote',  shortLabel: '❝'    },
  { type: 'pre',       label: 'Code block',  shortLabel: '</>'  },
]

interface ContentEditorStyleMenuProps {
  blockType: BlockType
  editorRef: RefObject<HTMLDivElement>
}

export function ContentEditorStyleMenu({ blockType, editorRef }: ContentEditorStyleMenuProps) {
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useOverlayDismiss(wrapperRef, open, () => setOpen(false))

  const handleSelect = (type: BlockType) => {
    editorRef.current?.focus()
    setBlockType(blockType === type ? 'paragraph' : type)
    setOpen(false)
  }

  const current = STYLE_OPTIONS.find(o => o.type === blockType) ?? STYLE_OPTIONS[0]

  return (
    <div ref={wrapperRef} className="ce-style-menu">
      <button
        type="button"
        className={`ce-toolbar-btn ce-style-trigger ${open ? 'is-active' : ''}`}
        onMouseDown={e => { e.preventDefault(); setOpen(o => !o) }}
        title="Text style"
        aria-label="Text style"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span>{current.shortLabel}</span>
        <span className="ce-style-caret" dangerouslySetInnerHTML={{ __html: icons.chevronDown }} />
      </button>

      {open && (
        <div className="ce-style-dropdown" role="listbox">
          {STYLE_OPTIONS.map(opt => (
            <button
              key={opt.type}
              type="button"
              role="option"
              aria-selected={blockType === opt.type}
              className={`ce-style-option ${blockType === opt.type ? 'is-active' : ''}`}
              onMouseDown={e => { e.preventDefault(); handleSelect(opt.type) }}
            >
              <span className="ce-style-option-short">{opt.shortLabel}</span>
              <span className="ce-style-option-label">{opt.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
