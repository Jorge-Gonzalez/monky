// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Macro } from '../types'
import { keepPrevious, readPrevious, PREVIOUS_KEEP } from './macroPrevious'

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
  return { area, local }
}

const macro = (id: string, text = 'x'): Macro => ({ id, command: `/${id}`, text })

let store: ReturnType<typeof installStorage>
beforeEach(() => {
  store = installStorage()
})

// There is deliberately no test that ordinary edits leave this alone: nothing in the module observes
// storage, so the property is structural rather than behavioural, and a test for it would assert
// only that a mock nobody called was not called.

describe('keepPrevious', () => {
  it('keeps the library and says why', async () => {
    const entry = await keepPrevious([macro('a'), macro('b')], 'delete')
    expect(entry).toMatchObject({ reason: 'delete', count: 2 })
    expect((await readPrevious())[0].macros).toEqual([macro('a'), macro('b')])
  })

  it('puts the newest first', async () => {
    await keepPrevious([macro('a')], 'delete')
    await keepPrevious([macro('a'), macro('b')], 'import')
    expect((await readPrevious()).map((e) => e.reason)).toEqual(['import', 'delete'])
  })

  it('keeps two, so delete-then-import does not lose the pre-delete state to the import', async () => {
    // The whole reason for a second entry. One slot and the import would have overwritten the
    // library from before the delete, which is the state actually worth having.
    await keepPrevious([macro('a'), macro('b'), macro('c')], 'delete')
    await keepPrevious([macro('a')], 'import')
    const entries = await readPrevious()
    expect(entries).toHaveLength(PREVIOUS_KEEP)
    expect(entries[1].macros).toHaveLength(3)
  })

  it('drops the oldest beyond that', async () => {
    await keepPrevious([macro('a')], 'delete')
    await keepPrevious([macro('a'), macro('b')], 'import')
    await keepPrevious([macro('a'), macro('b'), macro('c')], 'restore')
    const entries = await readPrevious()
    expect(entries).toHaveLength(PREVIOUS_KEEP)
    expect(entries.map((e) => e.count)).toEqual([3, 2])
  })

  it('does not spend both slots on the same library', async () => {
    const macros = [macro('a')]
    await keepPrevious(macros, 'restore')
    expect(await keepPrevious(macros, 'restore')).toBeNull()
    expect(await readPrevious()).toHaveLength(1)
  })

  it('tolerates a stored value of the wrong shape', async () => {
    store.area.set('macro-previous', 'nonsense')
    expect(await readPrevious()).toEqual([])
  })

  it('drops entries whose payload is missing rather than offering an empty restore', async () => {
    store.area.set('macro-previous', { entries: [{ at: 'x', reason: 'delete', count: 3, checksum: 'c' }] })
    expect(await readPrevious()).toEqual([])
  })
})
