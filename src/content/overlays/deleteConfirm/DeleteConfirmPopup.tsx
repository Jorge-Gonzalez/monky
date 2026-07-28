import { useEffect, useRef } from 'react'
import type { Macro } from '../../../types'
import { t } from '../../../lib/i18n'
import { useAppliedTheme } from '../../../theme/hooks/useAppliedTheme'
import { useListNavigation } from '../hooks/useListNavigation'
import { useKeyboardNavigation } from '../hooks/useKeyboardNavigation'
import { Keycap } from '../../../shared/ui/Keycap'

const MESSAGE_ID = 'monky-delete-confirm-message'
const OPTIONS_ID = 'monky-delete-confirm-options'
const optionId = (index: number) => `monky-delete-confirm-option-${index}`

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
  const optionsRef = useRef<HTMLDivElement>(null)
  useAppliedTheme(containerRef, isVisible)

  // A confirmation is a decision, not a hint: the user has stopped typing, so the popup
  // takes focus. Without it nothing is announced -- a screen reader reads what has focus,
  // and focus would otherwise still be in the page's editable. DeleteConfirmManager saves
  // the element and caret before showing and restores them after.
  useEffect(() => {
    if (isVisible) optionsRef.current?.focus()
  }, [isVisible])

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
      role="alertdialog"
      aria-labelledby={MESSAGE_ID}
      className="max-width-popover-2xl min-width-popover-md
        tween-opacity-transform-quick
        ground rule corner-lg ruled font-md elevated-soft"
      style={{ left: position.x, top: position.y, position: 'fixed' }}
    >
      <div data-component="delete-confirm-arrow" className={`sf-callout-arrow height-none center-x position-absolute ${placement === 'top' ? 'sf-callout-arrow-top attach-below' : 'sf-callout-arrow-bottom attach-above'}`} />
      <div id={MESSAGE_ID} data-component="delete-confirm-message" className="padding-block-sm padding-inline-md
        ink rule-soft ruled-bottom font-sm">
        {t('deleteConfirm.message')}{' '}
        <span data-component="delete-confirm-command" className="ink-accent font-semibold font-mono">{macro.command}</span>
      </div>
      <div
        ref={optionsRef}
        id={OPTIONS_ID}
        data-component="delete-confirm-options"
        className="horizontal gap-xs padding-xs
          rule-soft ruled-bottom"
        role="listbox"
        aria-label={t('deleteConfirm.optionsLabel')}
        aria-activedescendant={optionId(nav.selectedIndex)}
        tabIndex={-1}
      >
        <button
          type="button"
          id={optionId(0)}
          tabIndex={-1}
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
          id={optionId(1)}
          tabIndex={-1}
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
        <span><Keycap>Tab</Keycap> {t('deleteConfirm.footer.switch')}</span>
        <span><Keycap>↵</Keycap> {t('deleteConfirm.footer.select')}</span>
        <span><Keycap>Esc</Keycap> {t('deleteConfirm.footer.cancel')}</span>
      </div>
    </div>
  )
}
