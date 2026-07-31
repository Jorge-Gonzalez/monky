// Turns macro changes into snapshots. Runs in the background service worker, which is the one
// context that sees changes from every surface -- the editor page, the popup, the content script
// -- without any of them having to know backups exist.
//
// The debounce is not about quota; local storage has no write limit worth respecting here. It is
// about bursts: an import adds macros one at a time, so without it a single import would spend
// every one of the five recent retention slots on intermediate states of itself, which is exactly
// the churn the tiering exists to prevent. Ordinary edits arrive far apart and are unaffected.
import type { Macro } from '../types'
import { listenMacrosChange } from '../content/storage/macroStorage'
import { takeSnapshot } from './macroSnapshots'

const DEBOUNCE_MS = 5000

export function startMacroSnapshots({ debounceMs = DEBOUNCE_MS } = {}): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined
  let pending: Macro[] | null = null

  listenMacrosChange((macros) => {
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
