// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Macro } from '../types'
import type * as EditLogModule from './editLog'
import type * as BackupHealthModule from './backupHealth'

const listeners: ((before: Macro[] | null, after: Macro[]) => void)[] = []
const loadStoredLibrary = vi.fn<() => Promise<{ macros: Macro[]; config?: Record<string, unknown> } | null>>()

vi.mock('../content/storage/macroStorage', () => ({
  listenStoredMacrosDiff: (cb: (before: Macro[] | null, after: Macro[]) => void) => listeners.push(cb),
  loadStoredLibrary: () => loadStoredLibrary(),
}))

vi.mock('../lib/deviceId', () => ({ deviceId: () => Promise.resolve('this-device') }))

const recordBackupHealth = vi.fn()
vi.mock('./backupHealth', async () => {
  const actual = await vi.importActual<typeof BackupHealthModule>('./backupHealth')
  return { ...actual, recordBackupHealth: (h: unknown) => recordBackupHealth(h) }
})

const writeBackup = vi.fn<() => Promise<{ status: string; needed?: number }>>()
vi.mock('./syncBackup', () => ({ writeBackup: (...a: unknown[]) => writeBackup(...(a as [])) }))

const appendEditEvents = vi.fn()
vi.mock('./editLog', async () => {
  const actual = await vi.importActual<typeof EditLogModule>('./editLog')
  return { ...actual, appendEditEvents: (...a: unknown[]) => appendEditEvents(...(a as [])) }
})

import { runSyncBackup, startSyncBackup } from './syncBackupWatcher'

const macro = (id: string, text = 'x'): Macro => ({ id, command: `/${id}`, text })

let alarms: { create: ReturnType<typeof vi.fn>; handlers: ((a: { name: string }) => void)[] }

beforeEach(() => {
  listeners.length = 0
  vi.clearAllMocks()
  writeBackup.mockResolvedValue({ status: 'written' })
  appendEditEvents.mockResolvedValue(null)
  loadStoredLibrary.mockResolvedValue({ macros: [macro('a')] })
  const handlers: ((a: { name: string }) => void)[] = []
  alarms = {
    create: vi.fn().mockResolvedValue(undefined),
    handlers,
  }
  ;(globalThis as unknown as { chrome: unknown }).chrome = {
    alarms: {
      create: alarms.create,
      onAlarm: { addListener: (h: (a: { name: string }) => void) => handlers.push(h) },
    },
  }
})

/** Let the listener's async body settle; it is fire-and-forget by design. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0))

describe('startSyncBackup', () => {
  it('schedules an alarm rather than a timer when macros change', async () => {
    // The load-bearing choice. An MV3 service worker is torn down when idle and takes pending
    // timers with it, so a one-minute setTimeout would simply never fire and the backup would
    // silently not happen. Only an alarm survives suspension.
    startSyncBackup()
    listeners[0](null, [macro('a')])
    await settle()
    expect(alarms.create).toHaveBeenCalledWith('sync-backup', { delayInMinutes: 1 })
  })

  it('reschedules on every change, which is what debounces it', async () => {
    // Creating an alarm with an existing name replaces it, so rescheduling is the whole debounce
    // and there is no bookkeeping to get wrong.
    startSyncBackup()
    listeners[0]([macro('a')], [macro('a', 'b')])
    listeners[0]([macro('a', 'b')], [macro('a', 'c')])
    await settle()
    expect(alarms.create).toHaveBeenCalledTimes(2)
    expect(alarms.create).toHaveBeenLastCalledWith('sync-backup', { delayInMinutes: 1 })
  })

  it('records what changed straight away, not at the alarm', async () => {
    // The diff is only available here: `oldValue` comes off the change event, so nothing has to
    // survive a suspension to produce it. Deferring to the alarm would lose it.
    startSyncBackup()
    listeners[0]([macro('a'), macro('b')], [macro('a')])
    await settle()
    expect(appendEditEvents).toHaveBeenCalledWith([{ kind: 'delete', n: 1 }], 'this-device')
  })

  it('writes no edit entry for a change that changed nothing', async () => {
    startSyncBackup()
    listeners[0]([macro('a')], [macro('a')])
    await settle()
    expect(appendEditEvents).not.toHaveBeenCalled()
  })

  it('still schedules the backup when there is nothing to log', async () => {
    // A first write has no diff to describe, and it is exactly the state most worth backing up.
    startSyncBackup()
    listeners[0](null, [macro('a')])
    await settle()
    expect(alarms.create).toHaveBeenCalled()
  })

  it('schedules the backup even when recording the change fails', async () => {
    // The regression that made this a separate function. Awaiting the edit-log write before
    // creating the alarm let a failed write to sync -- no browser account, over quota, rate
    // limited -- cancel the backup entirely. The log is a label on the backup; it must never be
    // able to prevent one.
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    appendEditEvents.mockRejectedValue(new Error('sync unavailable'))
    startSyncBackup()
    listeners[0]([macro('a'), macro('b')], [macro('a')])
    await settle()
    expect(alarms.create).toHaveBeenCalledWith('sync-backup', { delayInMinutes: 1 })
    warn.mockRestore()
  })

  it('gives up narrowly when the alarms permission is absent', () => {
    // The state an extension is in after the manifest gains a permission but before it is
    // reloaded. Registering the listener would throw at module scope and abort the rest of
    // background/index.ts, so the symptom would be several unrelated features quietly failing.
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    ;(globalThis as unknown as { chrome: Record<string, unknown> }).chrome = {}
    expect(() => startSyncBackup()).not.toThrow()
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('reload the extension'))
    // And it registered nothing, rather than half-wiring itself.
    expect(listeners).toHaveLength(0)
    warn.mockRestore()
  })

  it('backs up when its own alarm fires, and ignores everybody else’s', async () => {
    startSyncBackup()
    alarms.handlers[0]({ name: 'some-other-alarm' })
    await settle()
    expect(writeBackup).not.toHaveBeenCalled()

    alarms.handlers[0]({ name: 'sync-backup' })
    await settle()
    expect(writeBackup).toHaveBeenCalled()
  })
})

describe('runSyncBackup', () => {
  // Every outcome is recorded rather than logged, because nothing here runs where a user could see
  // a console: a rejection in a service worker reaches nobody, which is how a backup that had never
  // once succeeded still said only "not backed up yet". The settings line reads what is recorded.
  it('backs up what is stored now, not what the change event carried', async () => {
    // By the time the alarm fires the library may have moved on again, and the newest state is the
    // one worth copying.
    loadStoredLibrary.mockResolvedValue({ macros: [macro('newest')] })
    await runSyncBackup()
    expect(writeBackup).toHaveBeenCalledWith({ macros: [macro('newest')] }, 'this-device')
  })

  it('does nothing when storage holds no readable library', async () => {
    loadStoredLibrary.mockResolvedValue(null)
    await runSyncBackup()
    expect(writeBackup).not.toHaveBeenCalled()
    expect(recordBackupHealth).not.toHaveBeenCalled()
  })

  it('records a healthy backup, not only a broken one', async () => {
    await runSyncBackup()
    expect(recordBackupHealth).toHaveBeenCalledWith(expect.objectContaining({ status: 'ok' }))
  })

  it('records a library that no longer fits, with its size', async () => {
    writeBackup.mockResolvedValue({ status: 'too-large', needed: 51_200 })
    await runSyncBackup()
    expect(recordBackupHealth).toHaveBeenCalledWith(expect.objectContaining({ status: 'too-large', bytes: 51_200 }))
  })

  it('records a rejection with the message it carried', async () => {
    writeBackup.mockRejectedValue(new Error('QUOTA_BYTES quota exceeded'))
    await runSyncBackup()
    expect(recordBackupHealth).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'failed', detail: 'QUOTA_BYTES quota exceeded' })
    )
  })

  it('counts an unchanged backup as healthy', async () => {
    // Nothing to write because nothing changed is the system working, not a fault.
    writeBackup.mockResolvedValue({ status: 'unchanged' })
    await runSyncBackup()
    expect(recordBackupHealth).toHaveBeenCalledWith(expect.objectContaining({ status: 'ok' }))
  })
})
