// Turns macro changes into snapshots. Runs in the background service worker, which is the one
// context that sees changes from every surface -- the editor page, the popup, the content script
// -- without any of them having to know backups exist.
//
// The debounce is not about quota; local storage has no write limit worth respecting here. It is
// about bursts: an import adds macros one at a time, so without it a single import would spend
// every one of the five recent retention slots on intermediate states of itself, which is exactly
// the churn the tiering exists to prevent. Ordinary edits arrive far apart and are unaffected.
//
// It reads the stored array verbatim rather than through the detector's narrowing view, because a
// backup that reshapes what it stores cannot restore what it was given.
import type { Macro } from '../types'
import { listenStoredMacrosChange, loadStoredMacros } from '../content/storage/macroStorage'
import { listSnapshots, takeSnapshot } from './macroSnapshots'

const DEBOUNCE_MS = 5000

/**
 * Record the library as found, once, when nothing has been recorded yet.
 *
 * Without this the first snapshot is the state *after* the first change, so the first mistake on
 * any install is the one thing not protected -- backups that begin at the first change protect
 * everything except the first change. Found by looking at a real profile whose index was still at
 * revision 1, holding the library as it was after a macro was added and not as it was before.
 */
async function recordBaseline(): Promise<void> {
  if ((await listSnapshots()).length > 0) return
  const macros = await loadStoredMacros()
  if (macros === null) return
  await takeSnapshot(macros)
}

export function startMacroSnapshots({ debounceMs = DEBOUNCE_MS } = {}): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined
  let pending: Macro[] | null = null

  void recordBaseline().catch((error: unknown) => {
    console.warn('[MONKY] could not record a baseline macro snapshot:', error)
  })

  listenStoredMacrosChange((macros) => {
    pending = macros
    if (timer !== undefined) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = undefined
      const macrosToSnapshot = pending
      pending = null
      if (macrosToSnapshot === null) return
      // A duplicate is skipped inside takeSnapshot, so a change that ended where it started --
      // an edit typed and undone, a config write that touched nothing here -- costs nothing.
      takeSnapshot(macrosToSnapshot).catch((error: unknown) => {
        // No UI to surface this from, and a failed snapshot must never interrupt the write that
        // triggered it: the library itself is already safely stored.
        console.warn('[MONKY] could not write a macro snapshot:', error)
      })
    }, debounceMs)
  })

  return () => {
    if (timer !== undefined) clearTimeout(timer)
    timer = undefined
    pending = null
  }
}
