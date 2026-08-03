// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Macro } from '../types'
import type { BackupManifest, BackupReadResult } from './syncBackup'
import type { PreviousState } from './macroPrevious'
import type { EditEvent } from './editLog'

const readPrevious = vi.fn<() => Promise<PreviousState[]>>()
vi.mock('./macroPrevious', () => ({ readPrevious: () => readPrevious() }))

const backupStatus = vi.fn<() => Promise<BackupManifest | null>>()
const readBackup = vi.fn<() => Promise<BackupReadResult>>()
vi.mock('./syncBackup', () => ({
  backupStatus: () => backupStatus(),
  readBackup: () => readBackup(),
}))

const readEditLog = vi.fn<() => Promise<EditEvent[]>>()
vi.mock('./editLog', () => ({ readEditLog: () => readEditLog() }))

vi.mock('../lib/deviceId', () => ({ deviceId: () => Promise.resolve('this-device') }))

import { listRestorePoints } from './restorePoints'

const macro = (id: string): Macro => ({ id, command: `/${id}`, text: 'x' })

const previous = (over: Partial<PreviousState> = {}): PreviousState => ({
  at: '2026-08-03T10:00:00.000Z',
  reason: 'delete',
  count: 2,
  checksum: 'prev',
  macros: [macro('a'), macro('b')],
  ...over,
})

const manifest = (over: Partial<BackupManifest> = {}): BackupManifest => ({
  slot: 'A',
  rev: 4,
  chunks: 1,
  checksum: 'backup',
  count: 3,
  takenAt: '2026-08-03T12:00:00.000Z',
  device: 'this-device',
  ...over,
})

beforeEach(() => {
  vi.clearAllMocks()
  readPrevious.mockResolvedValue([])
  backupStatus.mockResolvedValue(null)
  readBackup.mockResolvedValue({ status: 'none' })
  readEditLog.mockResolvedValue([])
})

describe('listRestorePoints', () => {
  it('offers nothing before anything has been kept or backed up', async () => {
    expect(await listRestorePoints()).toEqual([])
  })

  it('puts the newest first regardless of which source it came from', async () => {
    readPrevious.mockResolvedValue([
      previous({ at: '2026-08-03T14:00:00.000Z', checksum: 'p1' }),
      previous({ at: '2026-08-03T08:00:00.000Z', checksum: 'p2' }),
    ])
    backupStatus.mockResolvedValue(manifest({ takenAt: '2026-08-03T12:00:00.000Z' }))
    const points = await listRestorePoints()
    expect(points.map((p) => p.at)).toEqual([
      '2026-08-03T14:00:00.000Z',
      '2026-08-03T12:00:00.000Z',
      '2026-08-03T08:00:00.000Z',
    ])
  })

  it('describes each point by why it exists, never by where it lives', async () => {
    readPrevious.mockResolvedValue([previous({ reason: 'import' })])
    backupStatus.mockResolvedValue(manifest())
    const points = await listRestorePoints()
    expect(points.map((p) => p.reason)).toEqual(['automatic', 'import'])
    // Nothing on a point names a slot, a key or a storage area.
    expect(JSON.stringify(points.map(({ read: _read, ...rest }) => rest))).not.toMatch(/slot|chunk|sync|storage/i)
  })

  it('still offers the browser copy when it matches the library already loaded', async () => {
    // An earlier draft hid it whenever it matched the current state -- which is nearly always -- and
    // the result was a backup with no visible way to restore from it and no way to check it works.
    // A backup you cannot exercise is a promise rather than a fact.
    backupStatus.mockResolvedValue(manifest())
    const points = await listRestorePoints()
    expect(points).toHaveLength(1)
    expect(points[0].reason).toBe('automatic')
  })

  it('shows one row when two sources hold the same library', async () => {
    readPrevious.mockResolvedValue([previous({ checksum: 'same', at: '2026-08-03T13:00:00.000Z' })])
    backupStatus.mockResolvedValue(manifest({ checksum: 'same' }))
    const points = await listRestorePoints()
    expect(points).toHaveLength(1)
    // The newer of the two survives, so the timestamp shown is the truthful one.
    expect(points[0].at).toBe('2026-08-03T13:00:00.000Z')
  })

  it('flags a backup written by another device', async () => {
    backupStatus.mockResolvedValue(manifest({ device: 'work-laptop' }))
    expect((await listRestorePoints())[0].fromAnotherDevice).toBe(true)
  })

  it('flags it when the newest recorded change came from elsewhere', async () => {
    backupStatus.mockResolvedValue(manifest({ device: 'this-device' }))
    readEditLog.mockResolvedValue([
      { at: '2026-08-03T11:00:00.000Z', dev: 'this-device', kind: 'update', n: 1 },
      { at: '2026-08-03T12:00:00.000Z', dev: 'work-laptop', kind: 'update', n: 1 },
    ])
    expect((await listRestorePoints())[0].fromAnotherDevice).toBe(true)
  })

  it('does not flag a library this device produced', async () => {
    backupStatus.mockResolvedValue(manifest())
    readEditLog.mockResolvedValue([
      { at: '2026-08-03T11:00:00.000Z', dev: 'work-laptop', kind: 'update', n: 1 },
      { at: '2026-08-03T12:00:00.000Z', dev: 'this-device', kind: 'update', n: 1 },
    ])
    expect((await listRestorePoints())[0].fromAnotherDevice).toBe(false)
  })

  it('never flags a locally kept state, which was produced here by definition', async () => {
    readPrevious.mockResolvedValue([previous()])
    readEditLog.mockResolvedValue([{ at: '2026-08-03T12:00:00.000Z', dev: 'work-laptop', kind: 'update', n: 1 }])
    expect((await listRestorePoints())[0].fromAnotherDevice).toBe(false)
  })

  it('reads a local point without touching the browser account', async () => {
    readPrevious.mockResolvedValue([previous()])
    const result = await (await listRestorePoints())[0].read()
    expect(result).toEqual({ status: 'read', macros: [macro('a'), macro('b')] })
    expect(readBackup).not.toHaveBeenCalled()
  })

  it('passes the browser copy its own failure through untouched', async () => {
    // 'incomplete' is worth retrying and 'corrupt' is not, so the distinction has to survive being
    // wrapped in a uniform list.
    backupStatus.mockResolvedValue(manifest())
    readBackup.mockResolvedValue({ status: 'incomplete' })
    expect(await (await listRestorePoints())[0].read()).toEqual({ status: 'incomplete' })
  })

  it('gives every point a stable id, so arming one does not arm another', async () => {
    readPrevious.mockResolvedValue([
      previous({ checksum: 'p1', at: '2026-08-03T14:00:00.000Z' }),
      previous({ checksum: 'p2', at: '2026-08-03T08:00:00.000Z' }),
    ])
    backupStatus.mockResolvedValue(manifest())
    const ids = (await listRestorePoints()).map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
