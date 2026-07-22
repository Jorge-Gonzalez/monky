import { useRef } from 'react'
import { Macro } from '../../../types'
import { t } from '../../../lib/i18n'
import { useAppliedTheme } from '../../../theme/hooks/useAppliedTheme'
import { useListNavigation } from '../hooks/useListNavigation'
import { useKeyboardNavigation } from '../hooks/useKeyboardNavigation'

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
    axis: 'horizontal',
    onSelect: activate,
    onClose: onCancel,
    onNavigatePrev: nav.navigatePrev,
    onNavigateNext: nav.navigateNext,
    onTab: 'cycle',
  })

  if (!isVisible) return null

  return (
    <div
      ref={containerRef}
      data-component="delete-confirm-container"
      className="max-width-popover-2xl min-width-popover-md
        tween-opacity-transform-quick
        ground rule corner-lg ruled font-md elevated-soft"
      style={{ left: position.x, top: position.y, position: 'fixed' }}
    >
      <div data-component="delete-confirm-arrow" className={`sf-callout-arrow height-none center-x position-absolute ${placement === 'top' ? 'sf-callout-arrow-top attach-below' : 'sf-callout-arrow-bottom attach-above'}`} />
      <div data-component="delete-confirm-message" className="padding-block-sm padding-inline-md
        ink rule-soft ruled-bottom font-sm">
        {t('deleteConfirm.message')}{' '}
        <span data-component="delete-confirm-command" className="ink-accent font-semibold font-mono">{macro.command}</span>
      </div>
      <div data-component="delete-confirm-options" className="horizontal gap-xs padding-xs
        rule-soft ruled-bottom" role="listbox">
        <button
          type="button"
          data-component="delete-confirm-cancel"
          className="elastic basis-ratio padding-block-xs padding-inline-sm hidden max-width-none min-width-none
            tween-quick
            selectable
            ground-subtle ink rule-soft corner-md ruled font-sm text-center pressable truncate
            hover:ground-defined hover:rule
            selected:ground-defined selected:ink-accent selected:rule-accent"
          role="option"
          aria-selected={nav.selectedIndex === 0}
          onMouseDown={e => { e.preventDefault(); onCancel() }}
        >
          {t('deleteConfirm.cancel')}
        </button>
        <button
          type="button"
          data-component="delete-confirm-delete"
          className="elastic basis-ratio padding-block-xs padding-inline-sm hidden max-width-none min-width-none
            tween-quick
            selectable
            ground-subtle ink rule-soft corner-md ruled font-sm text-center pressable truncate
            hover:ground-fail-faint hover:rule-fail
            selected:ground-fail-faint selected:ink-fail selected:rule-fail"
          role="option"
          aria-selected={nav.selectedIndex === 1}
          onMouseDown={e => { e.preventDefault(); onConfirm() }}
        >
          {t('deleteConfirm.delete')}
        </button>
      </div>
      <div data-component="delete-confirm-footer" className="horizontal gap-md padding-block-xs padding-inline-md justify-end
        ground ink-soft rule font-xs">
        <span><kbd className="sf-keycap
          ground-subtle ink rule corner-sm ruled font-xs font-mono">Tab</kbd> {t('deleteConfirm.footer.switch')}</span>
        <span><kbd className="sf-keycap
          ground-subtle ink rule corner-sm ruled font-xs font-mono">↵</kbd> {t('deleteConfirm.footer.select')}</span>
        <span><kbd className="sf-keycap
          ground-subtle ink rule corner-sm ruled font-xs font-mono">Esc</kbd> {t('deleteConfirm.footer.cancel')}</span>
      </div>
    </div>
  )
}
