import { describe, it, expect, vi } from 'vitest'
import { serializeMacros, parseMacroImport, mergeImport } from './macroIO'
import type { Macro } from '../types'

const plain = (command: string, text: string, id: string | number = '1'): Macro => ({
  id, command, text, contentType: 'text/plain',
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
    const macros: Macro[] = [
      plain('/sig', 'Jorge'),
      { ...plain(':new', ''), isSystemMacro: true },
    ]
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
  it('adds macros not present in existing set', () => {
    const add = vi.fn(() => ({ success: true }))
    const { added } = mergeImport(
      [{ command: '/sig', text: 'Jorge' }],
      new Set(),
      add
    )
    expect(add).toHaveBeenCalledTimes(1)
    expect(added).toBe(1)
  })

  it('skips macros whose command already exists', () => {
    const add = vi.fn(() => ({ success: true }))
    const { added, skipped } = mergeImport(
      [{ command: '/sig', text: 'Jorge' }],
      new Set(['/sig']),
      add
    )
    expect(add).not.toHaveBeenCalled()
    expect(added).toBe(0)
    expect(skipped).toBe(1)
  })

  it('counts add failures as skipped', () => {
    const add = vi.fn(() => ({ success: false }))
    const { added, skipped } = mergeImport(
      [{ command: '/sig', text: 'Jorge' }],
      new Set(),
      add
    )
    expect(added).toBe(0)
    expect(skipped).toBe(1)
  })

  it('assigns a fresh id to each imported macro', () => {
    let captured: Macro | undefined
    const add = vi.fn((m: Macro) => { captured = m; return { success: true }; })
    mergeImport([{ command: '/sig', text: 'Jorge' }], new Set(), add)
    expect(captured?.id).toBeDefined()
    expect(typeof captured?.id).toBe('string')
  })

  it('handles an empty incoming list', () => {
    const add = vi.fn(() => ({ success: true }))
    const result = mergeImport([], new Set(), add)
    expect(add).not.toHaveBeenCalled()
    expect(result).toEqual({ added: 0, skipped: 0 })
  })

  it('correctly tallies mixed added and skipped', () => {
    const add = vi.fn(() => ({ success: true }))
    const result = mergeImport(
      [{ command: '/a', text: '1' }, { command: '/b', text: '2' }, { command: '/c', text: '3' }],
      new Set(['/b']),
      add
    )
    expect(result.added).toBe(2)
    expect(result.skipped).toBe(1)
  })
})
