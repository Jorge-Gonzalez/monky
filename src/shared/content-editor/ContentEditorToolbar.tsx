import { RefObject } from 'react'
import { EditorFormatState } from './types'
import {
  toggleBold, toggleItalic, toggleUnderline, toggleStrikethrough,
  toggleBulletList, toggleOrderedList, undo, redo,
} from './editorCommands'
import { ContentEditorStyleMenu } from './ContentEditorStyleMenu'
import { ContentEditorLinkField } from './ContentEditorLinkField'
import { icons } from './icons'

interface ContentEditorToolbarProps {
  formatState: EditorFormatState
  linkMode: boolean
  savedRange: Range | null
  editorRef: RefObject<HTMLDivElement>
  onLinkRequest: () => void
  onLinkClose: () => void
}

interface BtnProps {
  icon: string
  title: string
  active?: boolean
  onAction: () => void
}

function Btn({ icon, title, active, onAction }: BtnProps) {
  return (
    <button
      type="button"
      data-component="ce-toolbar-button"
      className="pressable padding-none horizontal align-center justify-center rigid control-box-lg corner-sm ink-soft tween-ground-ink-quick hover:ground-defined hover:ink pressed:ground-defined pressed:ink-accent"
      onMouseDown={e => { e.preventDefault(); onAction() }}
      title={title}
      aria-label={title}
      aria-pressed={active}
      dangerouslySetInnerHTML={{ __html: icon }}
    />
  )
}

function Sep() {
  return <span className="separator-mark-xs margin-block-none margin-inline-xs rigid rule ruled-left" aria-hidden />
}

export function ContentEditorToolbar({
  formatState,
  linkMode,
  savedRange,
  editorRef,
  onLinkRequest,
  onLinkClose,
}: ContentEditorToolbarProps) {
  if (linkMode) {
    return (
      <div data-region="ce-toolbar" data-component="ce-toolbar" className="horizontal rigid gap-xs padding-block-xs padding-inline-sm align-center wrap-allowed ground">
        <ContentEditorLinkField
          savedRange={savedRange}
          existingHref={formatState.linkHref}
          editorRef={editorRef}
          onClose={onLinkClose}
        />
      </div>
    )
  }

  return (
    <div data-region="ce-toolbar" className="horizontal rigid gap-xs padding-block-xs padding-inline-sm align-center wrap-allowed ground" role="toolbar" aria-label="Formatting">
      <Btn icon={icons.undo} title="Undo (Ctrl+Z)" onAction={undo} />
      <Btn icon={icons.redo} title="Redo (Ctrl+Y)" onAction={redo} />

      <Sep />

      <Btn icon={icons.bold}          title="Bold (Ctrl+B)"          active={formatState.bold}          onAction={toggleBold} />
      <Btn icon={icons.italic}        title="Italic (Ctrl+I)"        active={formatState.italic}        onAction={toggleItalic} />
      <Btn icon={icons.underline}     title="Underline (Ctrl+U)"     active={formatState.underline}     onAction={toggleUnderline} />
      <Btn icon={icons.strikethrough} title="Strikethrough (Ctrl+Shift+X)" active={formatState.strikethrough} onAction={toggleStrikethrough} />

      <Sep />

      <Btn icon={icons.bulletList}  title="Bullet list (Ctrl+Shift+8)"   active={formatState.bulletList}  onAction={toggleBulletList} />
      <Btn icon={icons.orderedList} title="Numbered list (Ctrl+Shift+7)" active={formatState.orderedList} onAction={toggleOrderedList} />

      <Sep />

      <ContentEditorStyleMenu blockType={formatState.blockType} editorRef={editorRef} />

      <Sep />

      <Btn
        icon={icons.link}
        title="Link (Ctrl+K)"
        active={formatState.linkHref !== null}
        onAction={onLinkRequest}
      />
    </div>
  )
}
