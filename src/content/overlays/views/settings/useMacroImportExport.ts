// Pattern: Store-Hook — macro import/export behavior. Keeps the import/export
// "conversation" out of SettingsView (which is about config settings).
import { useCallback, useEffect, useState } from 'react'
import { useMacroStore } from '../../../../store/useMacroStore'
import { serializeMacros, parseMacroImport, mergeImport } from '../../../../lib/macroIO'
import { takeSnapshot } from '../../../../store/macroSnapshots'
import { editsSince, readEditLog } from '../../../../store/editLog'
import { hasDivergedFromExport, readLastExport, recordExport, type LastExport } from '../../../../store/exportTracking'
import { t } from '../../../../lib/i18n'

export type ImportStatus = { ok: boolean; message: string } | null

/** What to tell the user about the gap between their library and their last exported file. */
export interface ExportNudge {
  lastExport: LastExport
  /** How many changes are known to have happened since; a floor when `truncated`. */
  n: number
  truncated: boolean
}

export function useMacroImportExport() {
  const macros = useMacroStore((s) => s.macros)
  const addMacro = useMacroStore((s) => s.addMacro)
  const [status, setStatus] = useState<ImportStatus>(null)
  const [nudge, setNudge] = useState<ExportNudge | null>(null)

  const flash = (ok: boolean, message: string) => {
    setStatus({ ok, message })
    setTimeout(() => setStatus(null), 4000)
  }

  // The nudge only ever appears for someone who has exported at least once. Prompting a user who
  // never has would be advertising a feature rather than warning about a gap, and the gap is the
  // only part worth interrupting anyone over.
  const refreshNudge = useCallback(async () => {
    const lastExport = await readLastExport()
    if (lastExport === null || !hasDivergedFromExport(macros, lastExport)) {
      setNudge(null)
      return
    }
    const { n, truncated } = editsSince(await readEditLog(), lastExport.at)
    setNudge({ lastExport, n, truncated })
  }, [macros])

  useEffect(() => {
    void refreshNudge()
  }, [refreshNudge])

  const exportMacros = () => {
    const json = serializeMacros(macros)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'monky-macros.json'
    a.click()
    URL.revokeObjectURL(url)
    // Recorded against the live library rather than the serialized file, because that is what the
    // nudge later compares. serializeMacros drops system macros and ids, so a checksum of its
    // output would differ from the library's on the very next read and nag immediately.
    void recordExport(macros).then(refreshNudge)
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

  return { status, nudge, exportMacros, importFromFile }
}
