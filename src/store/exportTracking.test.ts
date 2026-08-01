// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Macro } from '../types'
import { hasDivergedFromExport, readLastExport, recordExport } from './exportTracking'

function installStorage(seed: Record<string, unknown> = {}) {
  const area = new Map<string, unknown>(Object.entries(seed))
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

describe('recordExport', () => {
  it('records when, what and how many', async () => {
    const record = await recordExport([macro('a'), macro('b')])
    expect(record.count).toBe(2)
    expect(record.at).toEqual(expect.any(String))
    expect(store.area.get('last-export')).toEqual(record)
  })
})

describe('readLastExport', () => {
  it('returns null before anything has been exported', async () => {
    expect(await readLastExport()).toBeNull()
  })

  it('tolerates a stored value of the wrong shape', async () => {
    store.area.set('last-export', 'nonsense')
    expect(await readLastExport()).toBeNull()
  })
})

describe('hasDivergedFromExport', () => {
  it('says no while the library still matches the file', async () => {
    const macros = [macro('a')]
    expect(hasDivergedFromExport(macros, await recordExport(macros))).toBe(false)
  })

  it('notices an added macro', async () => {
    const last = await recordExport([macro('a')])
    expect(hasDivergedFromExport([macro('a'), macro('b')], last)).toBe(true)
  })

  it('notices an edit that leaves the count identical', async () => {
    // The case a count-based comparison misses entirely, and the most common way a library drifts
    // from its last export.
    const last = await recordExport([macro('a', 'one')])
    expect(hasDivergedFromExport([macro('a', 'two')], last)).toBe(true)
  })

  it('says no when nothing has ever been exported', () => {
    // Nothing to be out of date with. Nudging here would be advertising the button rather than
    // warning about a gap.
    expect(hasDivergedFromExport([macro('a')], null)).toBe(false)
  })
})
