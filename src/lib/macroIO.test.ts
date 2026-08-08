import { describe, it, expect, vi } from 'vitest'
import { serializeMacros, parseMacroImport, mergeImport } from './macroIO'
import type { Macro } from '../types'

const plain = (command: string, text: string, id: string | number = '1'): Macro => ({
  id,
  command,
  text,
  contentType: 'text/plain',
})

// ─── serializeMacros ─────────────────────────────────────────────────────────

describe('serializeMacros', () => {
  it('produces valid JSON', () => {
    expect(() => JSON.parse(serializeMacros([plain('/sig', 'Jorge')]))).not.toThrow()
  })

  it('strips id from every macro', () => {
    const json = JSON.parse(serializeMacros([plain('/sig', 'Jorge', 42)]))
    expect(json[0]).not.toHaveProperty('id')
  })

  it('strips isSystemMacro and isParametric flags', () => {
    const macro: Macro = { ...plain('/sig', 'Jorge'), isSystemMacro: false, isParametric: false }
    const json = JSON.parse(serializeMacros([macro]))
    expect(json[0]).not.toHaveProperty('isSystemMacro')
    expect(json[0]).not.toHaveProperty('isParametric')
  })

  it('excludes system macros entirely', () => {
    const macros: Macro[] = [plain('/sig', 'Jorge'), { ...plain(':new', ''), isSystemMacro: true }]
    const json = JSON.parse(serializeMacros(macros))
    expect(json).toHaveLength(1)
    expect(json[0].command).toBe('/sig')
  })

  it('preserves command, text, and contentType', () => {
    const macro: Macro = { id: '1', command: '/sig', text: 'Jorge', contentType: 'text/plain' }
    const [out] = JSON.parse(serializeMacros([macro]))
    expect(out.command).toBe('/sig')
    expect(out.text).toBe('Jorge')
    expect(out.contentType).toBe('text/plain')
  })

  it('returns an empty array for an empty macro list', () => {
    expect(JSON.parse(serializeMacros([]))).toEqual([])
  })
})

// ─── parseMacroImport ─────────────────────────────────────────────────────────

describe('parseMacroImport', () => {
  it('parses a valid JSON array of macros', () => {
    const json = JSON.stringify([{ command: '/sig', text: 'Jorge' }])
    expect(parseMacroImport(json)).toHaveLength(1)
  })

  it('throws on invalid JSON', () => {
    expect(() => parseMacroImport('not json')).toThrow()
  })

  it('throws when root is not an array', () => {
    expect(() => parseMacroImport(JSON.stringify({ command: '/sig', text: 'hi' }))).toThrow()
  })

  it('filters out items missing command', () => {
    const json = JSON.stringify([{ text: 'no command here' }])
    expect(parseMacroImport(json)).toHaveLength(0)
  })

  it('filters out items missing text', () => {
    const json = JSON.stringify([{ command: '/sig' }])
    expect(parseMacroImport(json)).toHaveLength(0)
  })

  it('filters out non-object entries', () => {
    const json = JSON.stringify([null, 42, 'string', { command: '/sig', text: 'ok' }])
    const result = parseMacroImport(json)
    expect(result).toHaveLength(1)
    expect(result[0].command).toBe('/sig')
  })

  it('preserves optional fields like contentType', () => {
    const json = JSON.stringify([{ command: '/sig', text: 'Jorge', contentType: 'text/html' }])
    expect(parseMacroImport(json)[0].contentType).toBe('text/html')
  })
})

// ─── mergeImport ──────────────────────────────────────────────────────────────

describe('mergeImport', () => {
  // Collects what actually reached the store, which is where ids become observable.
  const collector = (success = true) => {
    const landed: Macro[] = []
    const add = vi.fn((m: Macro) => {
      landed.push(m)
      return { success }
    })
    return { add, landed }
  }

  it('adds macros not present in the library', () => {
    const { add } = collector()
    const { added } = mergeImport([{ command: '/sig', text: 'Jorge' }], [], add)
    expect(add).toHaveBeenCalledTimes(1)
    expect(added).toBe(1)
  })

  it('skips macros whose command already exists', () => {
    const { add } = collector()
    const { added, skipped } = mergeImport([{ command: '/sig', text: 'Jorge' }], [plain('/sig', 'old')], add)
    expect(add).not.toHaveBeenCalled()
    expect(added).toBe(0)
    expect(skipped).toBe(1)
  })

  it('counts add failures as skipped', () => {
    const { add } = collector(false)
    const { added, skipped } = mergeImport([{ command: '/sig', text: 'Jorge' }], [], add)
    expect(added).toBe(0)
    expect(skipped).toBe(1)
  })

  it('mints an id when the file does not carry one', () => {
    const { add, landed } = collector()
    mergeImport([{ command: '/sig', text: 'Jorge' }], [], add)
    expect(typeof landed[0].id).toBe('string')
    expect(landed[0].id).not.toBe('')
  })

  it('keeps the id the file supplies, so one file loads the same library everywhere', () => {
    // Ids are opaque, so honouring them costs nothing -- and it is the only way two machines fed
    // the same file end up with the same library rather than two that merely look alike.
    const { add, landed } = collector()
    mergeImport([{ command: '/sig', text: 'Jorge', id: 'mfa1x2k' }], [], add)
    expect(landed[0].id).toBe('mfa1x2k')
  })

  it('refuses a supplied id the library is already using', () => {
    // Duplicate ids are what validateLibrary rejects, so accepting one here would write a library
    // that works until the day someone needs to restore it.
    const { add, landed } = collector()
    mergeImport([{ command: '/new', text: 'x', id: '7' }], [plain('/old', 'y', 7)], add)
    expect(String(landed[0].id)).not.toBe('7')
  })

  it('gives every macro in one batch a distinct id', () => {
    // The whole batch is minted inside a single millisecond, which is exactly the case a bare
    // timestamp gets wrong.
    const { add, landed } = collector()
    mergeImport(
      Array.from({ length: 25 }, (_, i) => ({ command: `/m${i}`, text: 'x' })),
      [],
      add
    )
    expect(new Set(landed.map((m) => String(m.id))).size).toBe(25)
  })

  it('mints ids that share a prefix, because that is what makes a library compress', () => {
    // Not cosmetic: every id is written to the browser-account backup against a fixed quota, and
    // random ids are the one input gzip cannot shrink.
    const { add, landed } = collector()
    mergeImport(
      Array.from({ length: 10 }, (_, i) => ({ command: `/m${i}`, text: 'x' })),
      [],
      add
    )
    const ids = landed.map((m) => String(m.id))
    const prefix = Date.now().toString(36).slice(0, 6)
    expect(ids.every((id) => id.startsWith(prefix))).toBe(true)
  })

  it('handles an empty incoming list', () => {
    const { add } = collector()
    const result = mergeImport([], [], add)
    expect(add).not.toHaveBeenCalled()
    expect(result).toEqual({ added: 0, skipped: 0 })
  })

  it('correctly tallies mixed added and skipped', () => {
    const { add } = collector()
    const result = mergeImport(
      [
        { command: '/a', text: '1' },
        { command: '/b', text: '2' },
        { command: '/c', text: '3' },
      ],
      [plain('/b', 'existing')],
      add
    )
    expect(result.added).toBe(2)
    expect(result.skipped).toBe(1)
  })
})
