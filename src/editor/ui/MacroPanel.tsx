// The editor page's right-hand column: a toolbar over a scrollable list. It owns the
// selection, because the toolbar and the list are the two things that have to agree on it,
// and it owns the pending confirmation, because both of them can arm one.
import { useEffect, useMemo, useState } from 'react'
import type { Macro } from '../../types'
import { deleteMacros } from '../../store/macroCrud'
import { useListSelection } from '../../shared/useListSelection'
import { MacroList } from './MacroList'
import { MacroListToolbar } from './MacroListToolbar'

interface MacroPanelProps {
  macros: Macro[]
  onEdit: (macro: Macro) => void
}

export function MacroPanel({ macros, onEdit }: MacroPanelProps) {
  const ids = useMemo(() => macros.map((m) => m.id), [macros])
  const selection = useListSelection(ids)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const selectedCount = selection.selected.size

  // A confirmation that outlived what it was going to delete would apply to whatever got
  // selected next, so any change to the count stands it down.
  useEffect(() => {
    setConfirmingDelete(false)
  }, [selectedCount])

  const editSelected = () => {
    if (selectedCount !== 1) return
    const [id] = [...selection.selected]
    const macro = macros.find((m) => m.id === id)
    if (macro) onEdit(macro)
  }

  const requestDelete = () => {
    if (selectedCount > 0) setConfirmingDelete(true)
  }

  const confirmDelete = () => {
    void deleteMacros([...selection.selected].map(String))
    setConfirmingDelete(false)
    // The selection needs no clearing: the ids leave the list, and the selection is a subset
    // of the list.
  }

  return (
    <section
      data-component="macro-panel"
      className="vertical grow-1 shrink-1 basis-ratio gap-sm min-width-md"
    >
      <MacroListToolbar
        selectedCount={selectedCount}
        confirmingDelete={confirmingDelete}
        onEdit={editSelected}
        onRequestDelete={requestDelete}
        onConfirmDelete={confirmDelete}
        onCancelDelete={() => setConfirmingDelete(false)}
        onClear={selection.clear}
      />
      <MacroList
        macros={macros}
        selection={selection}
        onEditRequest={editSelected}
        onDeleteRequest={requestDelete}
      />
    </section>
  )
}
