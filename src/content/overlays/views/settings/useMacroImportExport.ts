// Pattern: Store-Hook — macro import/export behavior. Keeps the import/export
// "conversation" out of SettingsView (which is about config settings).
import { useState } from 'react'
import { useMacroStore } from '../../../../store/useMacroStore'
import { serializeMacros, parseMacroImport, mergeImport } from '../../../../lib/macroIO'
import { takeSnapshot } from '../../../../store/macroSnapshots'
import { t } from '../../../../lib/i18n'

export type ImportStatus = { ok: boolean; message: string } | null

export function useMacroImportExport() {
  const macros = useMacroStore((s) => s.macros)
  const addMacro = useMacroStore((s) => s.addMacro)
  const [status, setStatus] = useState<ImportStatus>(null)

  const flash = (ok: boolean, message: string) => {
    setStatus({ ok, message })
    setTimeout(() => setStatus(null), 4000)
  }

  const exportMacros = () => {
    const json = serializeMacros(macros)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'monky-macros.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const importFromFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = parseMacroImport(reader.result as string)
        if (parsed.length === 0) {
          flash(false, t('settings.importExport.status.noValidMacros'))
          return
        }
        // Snapshot the library as it stands before an import changes it, forced past the
        // duplicate check. An import is one of the two operations most likely to want undoing,
        // and the burst of adds that follows would otherwise be the only thing recorded.
        void takeSnapshot(macros, { force: true })
        const existing = new Set(macros.map((m) => m.command))
        const { added, skipped } = mergeImport(parsed, existing, addMacro)
        flash(
          true,
          skipped > 0
            ? t('settings.importExport.status.addedWithSkipped', { added, skipped })
            : t('settings.importExport.status.added', { count: added })
        )
      } catch {
        flash(false, t('settings.importExport.status.invalidFile'))
      }
    }
    reader.readAsText(file)
  }

  return { status, exportMacros, importFromFile }
}
