// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Macro } from '../types'
import type * as EditLogModule from './editLog'

const listeners: ((before: Macro[] | null, after: Macro[]) => void)[] = []
const loadStoredMacros = vi.fn<() => Promise<Macro[] | null>>()

vi.mock('../content/storage/macroStorage', () => ({
  listenStoredMacrosDiff: (cb: (before: Macro[] | null, after: Macro[]) => void) => listeners.push(cb),
  loadStoredMacros: () => loadStoredMacros(),
}))

vi.mock('../lib/deviceId', () => ({ deviceId: () => Promise.resolve('this-device') }))

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
  loadStoredMacros.mockResolvedValue([macro('a')])
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
  it('backs up what is stored now, not what the change event carried', async () => {
    // By the time the alarm fires the library may have moved on again, and the newest state is the
    // one worth copying.
    loadStoredMacros.mockResolvedValue([macro('newest')])
    await runSyncBackup()
    expect(writeBackup).toHaveBeenCalledWith([macro('newest')], 'this-device')
  })

  it('does nothing when storage holds no readable library', async () => {
    loadStoredMacros.mockResolvedValue(null)
    await runSyncBackup()
    expect(writeBackup).not.toHaveBeenCalled()
  })

  it('reports a library too large for the quota rather than failing silently', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    writeBackup.mockResolvedValue({ status: 'too-large', needed: 9 })
    await runSyncBackup()
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('9 sync chunks'))
    warn.mockRestore()
  })

  it('says nothing when the backup was already up to date', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    writeBackup.mockResolvedValue({ status: 'unchanged' })
    await runSyncBackup()
    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
  })
})
