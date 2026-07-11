import { useRef } from 'react'
import { Macro } from '../../../types'
import { t } from '../../../lib/i18n'
import { useAppliedTheme } from '../../../theme/hooks/useAppliedTheme'
import { useListNavigation } from '../suggestionsOverlay/hooks/useListNavigation'
import { useKeyboardNavigation } from '../suggestionsOverlay/hooks/useKeyboardNavigation'

export interface DeleteConfirmPopupProps {
  macro: Macro
  position: { x: number; y: number }
  placement: 'top' | 'bottom'
  isVisible: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function DeleteConfirmPopup({
  macro,
  position,
  placement,
  isVisible,
  onConfirm,
  onCancel,
}: DeleteConfirmPopupProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  useAppliedTheme(containerRef, isVisible)

  // Two options: Cancel (index 0, the safe default) and Delete (index 1). An
  // accidental Enter therefore cancels; reaching Delete takes a deliberate Tab.
  const nav = useListNavigation(2)
  const activate = () => (nav.selectedIndex === 1 ? onConfirm() : onCancel())

  useKeyboardNavigation({
    isActive: isVisible,
    onSelect: activate,
    onClose: onCancel,
    onNavigateLeft: nav.navigateLeft,
    onNavigateRight: nav.navigateRight,
  })

  if (!isVisible) return null

  return (
    <div
      ref={containerRef}
      className="macro-suggestions-container delete-confirm ground rule corner-lg font-md"
      style={{ left: position.x, top: position.y, position: 'fixed' }}
    >
      <div className={`macro-suggestions-arrow position-absolute ${placement}`} />
      <div className="delete-confirm-message padding-block-snug padding-inline-comfortable font-sm ink rule-soft">
        {t('deleteConfirm.message')}{' '}
        <span className="delete-confirm-command font-semibold ink-accent font-mono">{macro.command}</span>
      </div>
      <div className="macro-suggestions-commands-list horizontal padding-tight gap-tight rule-soft" role="listbox">
        <button
          type="button"
          className="macro-suggestions-command-item delete-confirm-option elastic basis-ratio ground-subtle ink rule-soft corner-md font-sm selectable hover:ground-defined hover:rule selected:ground-defined selected:ink-accent selected:rule-accent"
          role="option"
          aria-selected={nav.selectedIndex === 0}
          onMouseDown={e => { e.preventDefault(); onCancel() }}
        >
          {t('deleteConfirm.cancel')}
        </button>
        <button
          type="button"
          className="macro-suggestions-command-item delete-confirm-option delete-confirm-danger elastic basis-ratio ground-subtle ink rule-soft corner-md font-sm selectable hover:ground-fail-faint hover:rule-fail selected:ground-fail-faint selected:ink-fail selected:rule-fail"
          role="option"
          aria-selected={nav.selectedIndex === 1}
          onMouseDown={e => { e.preventDefault(); onConfirm() }}
        >
          {t('deleteConfirm.delete')}
        </button>
      </div>
      <div className="macro-suggestions-footer horizontal gap-comfortable padding-block-tight padding-inline-comfortable font-xs ink-soft ground rule">
        <span><kbd className="macro-suggestions-kbd corner-sm font-xs ink ground-subtle rule font-mono">Tab</kbd> {t('deleteConfirm.footer.switch')}</span>
        <span><kbd className="macro-suggestions-kbd corner-sm font-xs ink ground-subtle rule font-mono">↵</kbd> {t('deleteConfirm.footer.select')}</span>
        <span><kbd className="macro-suggestions-kbd corner-sm font-xs ink ground-subtle rule font-mono">Esc</kbd> {t('deleteConfirm.footer.cancel')}</span>
      </div>
    </div>
  )
}
