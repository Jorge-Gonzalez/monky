// The macro list's toolbar. It states what applies to the current selection, which is the
// job Material gives an always-visible toolbar and the reason this page needs no selection
// mode: there is nothing to enter or leave, and a row's tap has no competing meaning because
// the actions live up here rather than on the row.
//
// It holds no state. Whether a delete is awaiting confirmation belongs to the panel, because
// the list's Delete key has to arm the same confirmation this button does.
import { t } from '../../lib/i18n'

// One shape, three skins. The skins are swapped rather than appended: the grammar allows one
// word per axis, so adding `ink-fail` to a paragraph that already says `ink` is an error, and
// the compiler says so. Splitting the paragraph along that seam is what makes the variants
// composable at all.
const SHAPE =
  'padding-block-xs padding-inline-md corner-md ruled font-sm font-medium pressable tween-quick focus:ring'
const DISABLED = 'disabled:ground-subtle disabled:ink-soft disabled:blocked disabled:alpha-60'
const NEUTRAL = 'ground ink rule hover:ground-defined'
const DESTRUCTIVE = 'ground ink-fail rule hover:ground-fail-faint'
const CONFIRM = 'ground-fail ink-inverse rule hover:ground-fail'

const action = (skin: string) => `${SHAPE} ${skin} ${DISABLED}`

interface MacroListToolbarProps {
  selectedCount: number
  confirmingDelete: boolean
  onEdit: () => void
  onRequestDelete: () => void
  onConfirmDelete: () => void
  onCancelDelete: () => void
  onClear: () => void
}

export function MacroListToolbar({
  selectedCount,
  confirmingDelete,
  onEdit,
  onRequestDelete,
  onConfirmDelete,
  onCancelDelete,
  onClear,
}: MacroListToolbarProps) {
  const canEdit = selectedCount === 1
  const canDelete = selectedCount > 0

  return (
    <div
      data-component="macro-list-toolbar"
      className="horizontal rigid gap-sm align-center justify-between min-height-control-3xl"
      role="toolbar"
      aria-label={t('macroPanel.toolbarLabel')}
    >
      <span
        data-component="macro-list-count"
        className="ink-soft font-sm tabular"
        role="status"
      >
        {selectedCount > 0
          ? t('macroPanel.selectedCount', { count: String(selectedCount) })
          : t('macroPanel.label')}
      </span>

      {confirmingDelete ? (
        <div className="horizontal inline gap-sm">
          <button
            type="button"
            data-component="macro-list-cancel-delete"
            className={action(NEUTRAL)}
            onClick={onCancelDelete}
          >
            {t('macroPanel.cancelDelete')}
          </button>
          <button
            type="button"
            data-component="macro-list-confirm-delete"
            className={action(CONFIRM)}
            onClick={onConfirmDelete}
          >
            {t('macroPanel.confirmDelete', { count: String(selectedCount) })}
          </button>
        </div>
      ) : (
        <div className="horizontal inline gap-sm">
          {canDelete && (
            <button
              type="button"
              data-component="macro-list-clear"
              className={action(NEUTRAL)}
              onClick={onClear}
            >
              {t('macroPanel.clearSelection')}
            </button>
          )}
          <button
            type="button"
            data-component="macro-list-edit"
            className={action(NEUTRAL)}
            // Editing several macros at once has no meaning -- the form holds one -- so more
            // than one selected disables this rather than picking one of them.
            disabled={!canEdit}
            onClick={onEdit}
          >
            {t('macroPanel.edit')}
          </button>
          <button
            type="button"
            data-component="macro-list-delete"
            className={action(DESTRUCTIVE)}
            disabled={!canDelete}
            onClick={onRequestDelete}
          >
            {t('macroPanel.delete')}
          </button>
        </div>
      )}
    </div>
  )
}
