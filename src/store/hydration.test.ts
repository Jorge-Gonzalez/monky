// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'

// The store is a module singleton created at import time, so each case needs a fresh module
// registry with storage already in the state under test.
function installStorage(seed: Record<string, unknown>) {
  const area = new Map<string, unknown>(Object.entries(seed))
  const local = {
    get: vi.fn((keys: string | string[]) => {
      const list = Array.isArray(keys) ? keys : [keys]
      const out: Record<string, unknown> = {}
      for (const key of list) if (area.has(key)) out[key] = area.get(key)
      return Promise.resolve(out)
    }),
    set: vi.fn((items: Record<string, unknown>) => {
      Object.entries(items).forEach(([k, v]) => area.set(k, v))
      return Promise.resolve()
    }),
    remove: vi.fn(() => Promise.resolve()),
  }
  ;(globalThis as unknown as { chrome: unknown }).chrome = {
    storage: {
      local,
      sync: { get: vi.fn(() => Promise.resolve({})), set: vi.fn(() => Promise.resolve()) },
      onChanged: { addListener: vi.fn() },
    },
  }
  return area
}

/** Import a fresh store, hydrated from whatever storage currently holds. */
async function freshStore() {
  vi.resetModules()
  const { useMacroStore } = await import('./useMacroStore')
  await useMacroStore.persist.rehydrate()
  return useMacroStore
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 20))

const TRUNCATED = '{"state":{"macros":[{"id":1,"command":"/mine","text":"years of work"'

beforeEach(() => {
  vi.resetModules()
})

describe('hydration when the stored library will not parse', () => {
  // This was measured before it was fixed: a single truncated value hydrated seven seeded demo
  // macros, and the next ordinary edit persisted those demos straight over the bytes -- destroying a
  // string a person could very likely have repaired by hand. Total, silent loss from a parse error,
  // and the same shape as the bug useMacroStore was rewritten to fix: something that is not the
  // authority winning, and overwriting what is.

  it('does not seed sample macros over an unreadable library', async () => {
    installStorage({ 'macro-storage': TRUNCATED })
    const store = await freshStore()
    expect(store.getState().macros).toEqual([])
  })

  it('keeps the unreadable bytes instead of discarding them', async () => {
    const area = installStorage({ 'macro-storage': TRUNCATED })
    await freshStore()
    expect((area.get('macro-storage-unreadable') as { raw: string }).raw).toBe(TRUNCATED)
  })

  it('survives the write that used to destroy it', async () => {
    const area = installStorage({ 'macro-storage': TRUNCATED })
    const store = await freshStore()
    store.getState().addMacro({ id: 'new', command: '/new', text: 'x' })
    await settle()
    // macro-storage has legitimately moved on -- the user is working. What matters is that the
    // original is still somewhere, which is what it was not before.
    expect((area.get('macro-storage-unreadable') as { raw: string }).raw).toBe(TRUNCATED)
  })

  it('does not let a second failure overwrite the first quarantine', async () => {
    // The earliest failure is the copy closest to the good data. A later, more damaged one must not
    // replace it.
    const area = installStorage({ 'macro-storage': TRUNCATED })
    await freshStore()
    area.set('macro-storage', '{{{ even worse')
    await freshStore()
    expect((area.get('macro-storage-unreadable') as { raw: string }).raw).toBe(TRUNCATED)
  })

  it('still seeds the samples on a genuinely first run', async () => {
    // Absent is not the same as unreadable, and conflating them would greet every new user with an
    // empty list.
    installStorage({})
    const store = await freshStore()
    expect(store.getState().macros.length).toBeGreaterThan(0)
  })

  it('hydrates a readable library normally', async () => {
    installStorage({
      'macro-storage': JSON.stringify({
        state: { macros: [{ id: 'a', command: '/a', text: 'A' }], config: {} },
        version: 0,
      }),
    })
    const store = await freshStore()
    expect(store.getState().macros).toEqual([{ id: 'a', command: '/a', text: 'A' }])
  })
})
