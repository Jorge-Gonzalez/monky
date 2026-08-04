// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { removeObsoleteCredentials } from './legacyCleanup'

function installStorage(seed: Record<string, unknown> = {}) {
  const area = new Map<string, unknown>(Object.entries(seed))
  const local = {
    get: vi.fn((keys: string | string[]) => {
      const list = Array.isArray(keys) ? keys : [keys]
      const out: Record<string, unknown> = {}
      for (const key of list) if (area.has(key)) out[key] = area.get(key)
      return Promise.resolve(out)
    }),
    set: vi.fn(() => Promise.resolve()),
    remove: vi.fn((keys: string[] | string) => {
      ;(Array.isArray(keys) ? keys : [keys]).forEach((key) => area.delete(key))
      return Promise.resolve()
    }),
  }
  ;(globalThis as unknown as { chrome: unknown }).chrome = { storage: { local } }
  return { area, local }
}

let store: ReturnType<typeof installStorage>
let info: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  info = vi.spyOn(console, 'info').mockImplementation(() => undefined)
})

describe('removeObsoleteCredentials', () => {
  it('removes bearer tokens left by the withdrawn backend', async () => {
    // Credential material has no defensible reason to sit in extension storage once the thing it
    // authenticated against is gone. Expired or not, it is a secret retained by accident.
    store = installStorage({ access: 'tok', refresh: 'ref' })
    await removeObsoleteCredentials()
    expect(store.area.has('access')).toBe(false)
    expect(store.area.has('refresh')).toBe(false)
  })

  it('leaves macro content alone, because deleting that is a decision', async () => {
    // `macros` and `pendingOps` may hold the only surviving copy of something. One policy was once
    // applied to all four keys; only two of them ever deserved it.
    store = installStorage({
      access: 'tok',
      macros: [{ id: 1, command: '/old', text: 'kept' }],
      pendingOps: [{ op: 'create', macro: { id: 2 } }],
    })
    await removeObsoleteCredentials()
    expect(store.area.has('macros')).toBe(true)
    expect(store.area.has('pendingOps')).toBe(true)
  })

  it('removes whichever of the two is present', async () => {
    store = installStorage({ refresh: 'ref' })
    await removeObsoleteCredentials()
    expect(store.area.has('refresh')).toBe(false)
  })

  it('writes nothing on an install that never had them', async () => {
    // Which is every install from here on. An ordinary startup should cost one read and no write.
    store = installStorage({ 'macro-storage': '{}' })
    await removeObsoleteCredentials()
    expect(store.local.remove).not.toHaveBeenCalled()
    expect(info).not.toHaveBeenCalled()
  })

  it('says what it removed and what it deliberately did not', async () => {
    store = installStorage({ access: 'tok', refresh: 'ref' })
    await removeObsoleteCredentials()
    expect(info).toHaveBeenCalledWith(expect.stringContaining('access, refresh'))
    expect(info).toHaveBeenCalledWith(expect.stringContaining('deliberately left in place'))
  })
})
