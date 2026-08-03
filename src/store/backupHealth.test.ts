// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { describeError, readBackupHealth, recordBackupHealth } from './backupHealth'

function installStorage() {
  const area = new Map<string, unknown>()
  const local = {
    get: vi.fn((key: string) => Promise.resolve(area.has(key) ? { [key]: area.get(key) } : {})),
    set: vi.fn((items: Record<string, unknown>) => {
      Object.entries(items).forEach(([k, v]) => area.set(k, v))
      return Promise.resolve()
    }),
  }
  ;(globalThis as unknown as { chrome: unknown }).chrome = { storage: { local } }
  return { area }
}

let store: ReturnType<typeof installStorage>
beforeEach(() => {
  store = installStorage()
})

describe('backup health', () => {
  it('reports nothing before a backup has been attempted', async () => {
    expect(await readBackupHealth()).toBeNull()
  })

  it('records success, not only failure', async () => {
    // The line in settings states the condition rather than waiting to be asked, so it needs the
    // good case as much as the bad one.
    await recordBackupHealth({ at: '2026-08-03T12:00:00.000Z', status: 'ok' })
    expect(await readBackupHealth()).toEqual({ at: '2026-08-03T12:00:00.000Z', status: 'ok' })
  })

  it('keeps the size when the library no longer fits', async () => {
    await recordBackupHealth({ at: '2026-08-03T12:00:00.000Z', status: 'too-large', bytes: 51_200 })
    const health = await readBackupHealth()
    expect(health).toMatchObject({ status: 'too-large', bytes: 51_200 })
  })

  it('keeps the message when the platform refused for another reason', async () => {
    await recordBackupHealth({ at: 'x', status: 'failed', detail: 'QUOTA_BYTES quota exceeded' })
    expect(await readBackupHealth()).toMatchObject({ detail: 'QUOTA_BYTES quota exceeded' })
  })

  it('replaces the previous verdict rather than accumulating', async () => {
    await recordBackupHealth({ at: 'a', status: 'failed', detail: 'gone' })
    await recordBackupHealth({ at: 'b', status: 'ok' })
    expect(await readBackupHealth()).toEqual({ at: 'b', status: 'ok' })
  })

  it('tolerates a stored value of the wrong shape', async () => {
    store.area.set('backup-health', 'nonsense')
    expect(await readBackupHealth()).toBeNull()
  })
})

describe('describeError', () => {
  it('takes the message from an Error', () => {
    expect(describeError(new Error('quota exceeded'))).toBe('quota exceeded')
  })

  it('passes a string through', () => {
    expect(describeError('plain')).toBe('plain')
  })

  it('does not print [object Object] for the plain objects chrome.* rejects with', () => {
    // Which is exactly the uninformative text this path exists to keep off the screen.
    const described = describeError({ message: 'odd shape' })
    expect(described).not.toContain('[object Object]')
    expect(described).toContain('odd shape')
  })
})
