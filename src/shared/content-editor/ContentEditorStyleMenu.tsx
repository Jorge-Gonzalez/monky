import { useState, useRef, RefObject } from 'react'
import { BlockType } from './types'
import { setBlockType } from './editorCommands'
import { icons } from './icons'
import { useOverlayDismiss } from './useOverlayDismiss'
import { t } from '../../lib/i18n'

type StyleOption = { type: BlockType; labelKey: string; shortLabel: string }

const STYLE_OPTIONS: StyleOption[] = [
  { type: 'paragraph', labelKey: 'contentEditor.paragraph',  shortLabel: '¶'    },
  { type: 'h1',        labelKey: 'contentEditor.h1',         shortLabel: 'H1'   },
  { type: 'h2',        labelKey: 'contentEditor.h2',         shortLabel: 'H2'   },
  { type: 'h3',        labelKey: 'contentEditor.h3',         shortLabel: 'H3'   },
  { type: 'blockquote',labelKey: 'contentEditor.blockquote', shortLabel: '❝'    },
  { type: 'pre',       labelKey: 'contentEditor.pre',        shortLabel: '</>'  },
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
    <div ref={wrapperRef} className="ce-style-menu position-relative">
      <button
        type="button"
        className="ce-toolbar-btn ce-style-trigger padding-block-none padding-inline-xs horizontal rigid width-auto min-width-control-2xl control-block-lg align-center justify-center ink-soft corner-sm font-sm font-medium pressable tween-ground-ink-quick hover:ground-defined hover:ink expanded:ground-defined expanded:ink-accent"
        onMouseDown={e => { e.preventDefault(); setOpen(o => !o) }}
        title={t('contentEditor.textStyle')}
        aria-label={t('contentEditor.textStyle')}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span>{current.shortLabel}</span>
        <span className="ce-style-caret horizontal align-center" dangerouslySetInnerHTML={{ __html: icons.chevronDown }} />
      </button>

      {open && (
        <div className="ce-style-dropdown vertical padding-xs position-absolute dropdown min-width-sm ground rule corner-md ruled elevated" role="listbox">
          {STYLE_OPTIONS.map(opt => (
            <button
              key={opt.type}
              type="button"
              role="option"
              aria-selected={blockType === opt.type}
              className="ce-style-option fill-inline horizontal gap-sm padding-block-xs padding-inline-sm align-center selectable ink corner-sm font-sm text-start pressable tween-ground-quick hover:ground-defined selected:ground-defined selected:ink-accent"
              onMouseDown={e => { e.preventDefault(); handleSelect(opt.type) }}
            >
              <span className="ce-style-option-short rigid control-inline-md ink-soft font-xs font-semibold parent-selected:ink-accent">{opt.shortLabel}</span>
              <span className="ce-style-option-label elastic basis-ratio">{t(opt.labelKey as Parameters<typeof t>[0])}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
