import type { RefObject } from 'react'
import { useState, useRef } from 'react'
import type { BlockType } from './types'
import { setBlockType } from './editorCommands'
import { icons } from './icons'
import { useOverlayDismiss } from './useOverlayDismiss'
import { t } from '../../lib/i18n'

type StyleOption = { type: BlockType; labelKey: string; shortLabel: string }

const STYLE_OPTIONS: StyleOption[] = [
  { type: 'paragraph', labelKey: 'contentEditor.paragraph', shortLabel: '¶' },
  { type: 'h1', labelKey: 'contentEditor.h1', shortLabel: 'H1' },
  { type: 'h2', labelKey: 'contentEditor.h2', shortLabel: 'H2' },
  { type: 'h3', labelKey: 'contentEditor.h3', shortLabel: 'H3' },
  { type: 'blockquote', labelKey: 'contentEditor.blockquote', shortLabel: '❝' },
  { type: 'pre', labelKey: 'contentEditor.pre', shortLabel: '</>' },
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

  const current = STYLE_OPTIONS.find((o) => o.type === blockType) ?? STYLE_OPTIONS[0]

  return (
    <div
      ref={wrapperRef}
      className="position-relative"
    >
      <button
        type="button"
        data-component="ce-style-trigger"
        className="horizontal rigid gap-xs padding-inline-xs padding-block-none align-center justify-center min-width-control-2xl width-auto control-block-lg
          tween-ground-ink-quick
          ink-soft corner-sm font-sm font-medium pressable
          hover:ground-defined hover:ink
          expanded:ground-defined expanded:ink-accent"
        onMouseDown={(e) => {
          e.preventDefault()
          setOpen((o) => !o)
        }}
        title={t('contentEditor.textStyle')}
        aria-label={t('contentEditor.textStyle')}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span>{current.shortLabel}</span>
        <span
          className="horizontal align-center
            alpha-60"
          dangerouslySetInnerHTML={{ __html: icons.chevronDown }}
        />
      </button>

      {open && (
        <div
          data-component="ce-style-menu"
          className="vertical gap-xs padding-xs attach-left attach-below-xs
            dropdown position-absolute
            ground rule corner-md ruled elevated"
          role="listbox"
        >
          {STYLE_OPTIONS.map((opt) => (
            <button
              key={opt.type}
              type="button"
              role="option"
              aria-selected={blockType === opt.type}
              data-component="ce-style-option"
              className="horizontal gap-sm padding-block-xs padding-inline-sm align-center fill-inline
                tween-ground-quick
                selectable
                ink corner-sm font-sm text-start pressable
                hover:ground-defined
                selected:ground-defined selected:ink-accent"
              onMouseDown={(e) => {
                e.preventDefault()
                handleSelect(opt.type)
              }}
            >
              <span
                className="rigid control-inline-md
                  ink-soft font-xs font-semibold
                  parent-selected:ink-accent"
              >
                {opt.shortLabel}
              </span>
              <span className="elastic basis-ratio">{t(opt.labelKey as Parameters<typeof t>[0])}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
