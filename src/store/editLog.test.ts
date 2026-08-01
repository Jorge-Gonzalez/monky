// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Macro } from '../types'
import { appendEditEvents, editsSince, readEditLog, summarizeChange, EDIT_LOG_KEEP, type EditEvent } from './editLog'

function installStorage() {
  const area = new Map<string, unknown>()
  const sync = {
    get: vi.fn((key: string) => Promise.resolve(area.has(key) ? { [key]: area.get(key) } : {})),
    set: vi.fn((items: Record<string, unknown>) => {
      Object.entries(items).forEach(([k, v]) => area.set(k, v))
      return Promise.resolve()
    }),
  }
  ;(globalThis as unknown as { chrome: unknown }).chrome = { storage: { sync } }
  return { area, sync }
}

const macro = (id: string, text = 'x'): Macro => ({ id, command: `/${id}`, text })

let store: ReturnType<typeof installStorage>
beforeEach(() => {
  store = installStorage()
})

describe('summarizeChange', () => {
  it('counts a creation', () => {
    expect(summarizeChange([macro('a')], [macro('a'), macro('b')])).toEqual([{ kind: 'create', n: 1 }])
  })

  it('counts a deletion', () => {
    expect(summarizeChange([macro('a'), macro('b')], [macro('a')])).toEqual([{ kind: 'delete', n: 1 }])
  })

  it('counts an edit to a macro that stayed', () => {
    expect(summarizeChange([macro('a', 'one')], [macro('a', 'two')])).toEqual([{ kind: 'update', n: 1 }])
  })

  it('reports every kind in one change rather than collapsing to a dominant one', () => {
    // "3 deleted, 1 edited" is the sentence the restore prompt exists to say, and a single
    // kind-plus-count cannot express it.
    const before = [macro('a'), macro('b'), macro('c'), macro('d')]
    const after = [macro('a', 'changed'), macro('e')]
    expect(summarizeChange(before, after)).toEqual([
      { kind: 'create', n: 1 },
      { kind: 'update', n: 1 },
      { kind: 'delete', n: 3 },
    ])
  })

  it('says nothing about a change that changed nothing', () => {
    expect(summarizeChange([macro('a')], [macro('a')])).toEqual([])
  })

  it('treats a first write as no history rather than as a wholesale creation', () => {
    // Storage held nothing readable. Reporting the seeded library as freshly created would bury
    // every real entry under one meaningless one.
    expect(summarizeChange(null, [macro('a'), macro('b')])).toEqual([])
  })

  it('matches ids across the number/string divide', () => {
    const before = [{ id: 1, command: '/a', text: 'A' }] as Macro[]
    const after = [{ id: '1', command: '/a', text: 'A' }] as Macro[]
    // Same macro, and the id's type is not the user's business. Without coercion this would read
    // as a delete plus a create.
    expect(summarizeChange(before, after)).toEqual([{ kind: 'update', n: 1 }])
  })
})

describe('appendEditEvents', () => {
  it('writes nothing for an empty summary', async () => {
    expect(await appendEditEvents([], 'dev-1')).toBeNull()
    expect(store.sync.set).not.toHaveBeenCalled()
  })

  it('stamps each entry with the device and the time', async () => {
    const log = await appendEditEvents([{ kind: 'delete', n: 3 }], 'laptop', '2026-08-01T10:00:00.000Z')
    expect(log).toEqual([{ at: '2026-08-01T10:00:00.000Z', dev: 'laptop', kind: 'delete', n: 3 }])
  })

  it('appends newest last and keeps only the most recent entries', async () => {
    for (let i = 0; i < EDIT_LOG_KEEP + 5; i++) {
      await appendEditEvents([{ kind: 'create', n: i }], 'dev-1', `2026-08-01T10:00:0${String(i % 10)}.000Z`)
    }
    const log = await readEditLog()
    expect(log).toHaveLength(EDIT_LOG_KEEP)
    // The oldest five fell off the front, so the first survivor is the sixth written.
    expect(log[0].n).toBe(5)
    expect(log[log.length - 1].n).toBe(EDIT_LOG_KEEP + 4)
  })

  it('tolerates a log that is not an array rather than throwing', async () => {
    store.area.set('edit-log', 'nonsense')
    expect(await readEditLog()).toEqual([])
  })
})

describe('editsSince', () => {
  const at = (iso: string, n: number): EditEvent => ({ at: iso, dev: 'd', kind: 'update', n })

  it('sums only the entries after the moment asked about', () => {
    const log = [at('2026-08-01T09:00:00.000Z', 5), at('2026-08-01T11:00:00.000Z', 2)]
    expect(editsSince(log, '2026-08-01T10:00:00.000Z')).toEqual({ n: 2, truncated: false })
  })

  it('reports nothing when there is no export to compare against', () => {
    expect(editsSince([at('2026-08-01T09:00:00.000Z', 5)], null)).toEqual({ n: 0, truncated: false })
  })

  it('flags a floor when the log was trimmed past the moment asked about', () => {
    // The log is full and its oldest surviving entry is already newer than the export, so entries
    // were lost. Saying "more than 12" beats quietly reporting a number known to be wrong.
    const log = Array.from({ length: EDIT_LOG_KEEP }, () => at('2026-08-01T11:00:00.000Z', 1))
    expect(editsSince(log, '2026-08-01T10:00:00.000Z')).toEqual({ n: EDIT_LOG_KEEP, truncated: true })
  })

  it('does not flag a floor when the log still reaches back past the export', () => {
    const log = [at('2026-08-01T09:00:00.000Z', 1), at('2026-08-01T11:00:00.000Z', 4)]
    expect(editsSince(log, '2026-08-01T10:00:00.000Z')).toEqual({ n: 4, truncated: false })
  })

  it('reports nothing for a timestamp it cannot read', () => {
    expect(editsSince([at('2026-08-01T11:00:00.000Z', 4)], 'not a date')).toEqual({ n: 0, truncated: false })
  })
})
