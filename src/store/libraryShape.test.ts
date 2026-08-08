import { describe, it, expect } from 'vitest'
import { LIBRARY_SCHEMA, validateLibrary } from './libraryShape'

const macro = (id: string | number, command = `/m${String(id)}`) => ({ id, command, text: 'x' })

describe('validateLibrary', () => {
  // A checksum proves the bytes are the bytes that were written. It says nothing about whether what
  // was written is usable, and a payload can pass every integrity check and still be a library the
  // rest of the code cannot address.

  it('accepts an ordinary library', () => {
    const macros = [macro('a'), macro(2)]
    expect(validateLibrary(macros)).toEqual({ status: 'valid', macros })
  })

  it('accepts an empty library, which is a real state', () => {
    expect(validateLibrary([])).toEqual({ status: 'valid', macros: [] })
  })

  it('accepts a macro with empty text', () => {
    // Absent and empty are different things. A macro mid-composition, or one whose content was
    // deliberately left out of a copy, is empty rather than malformed.
    expect(validateLibrary([{ id: 'a', command: '/a', text: '' }]).status).toBe('valid')
  })

  it.each([
    ['a bare string', 'macros'],
    ['a number', 7],
    ['null', null],
    ['an object with no macros in it', { config: { language: 'es' } }],
    ['an object whose macros are not a list', { macros: 'lots' }],
  ])('rejects %s', (_what, value) => {
    expect(validateLibrary(value)).toEqual({ status: 'malformed', why: 'not a macro library' })
  })

  it('accepts the envelope shape as readily as a bare array', () => {
    // Two shapes on purpose: every copy written before schema 2 is a bare array, and those have to
    // keep restoring -- a backup is the one thing that cannot have a flag day.
    const macros = [{ id: 'a', command: '/a', text: 'x' }]
    expect(validateLibrary({ macros })).toEqual({ status: 'valid', macros, config: undefined })
    expect(validateLibrary(macros)).toEqual({ status: 'valid', macros, config: undefined })
  })

  it('carries settings out when a copy holds them', () => {
    const macros = [{ id: 'a', command: '/a', text: 'x' }]
    const check = validateLibrary({ macros, config: { language: 'es', prefixes: ['!'] } })
    expect(check).toMatchObject({ status: 'valid', config: { language: 'es', prefixes: ['!'] } })
  })

  it('drops unusable prefixes rather than refusing the library', () => {
    // The one preference that can leave a restore present but inert -- every macro back, none of
    // them triggering. Dropping it falls back to the default; refusing the copy would cost someone
    // their macros over a setting.
    const macros = [{ id: 'a', command: '/a', text: 'x' }]
    for (const prefixes of ['/', [], [''], [1, 2], null]) {
      const check = validateLibrary({ macros, config: { language: 'es', prefixes } })
      expect(check.status).toBe('valid')
      expect(check.status === 'valid' && check.config).toEqual({ language: 'es' })
    }
  })

  it('ignores settings that are not an object, and keeps the macros', () => {
    const macros = [{ id: 'a', command: '/a', text: 'x' }]
    expect(validateLibrary({ macros, config: 'dark' })).toEqual({ status: 'valid', macros, config: undefined })
  })

  it.each([
    ['a missing command', [{ id: 'a', text: 'x' }]],
    ['an empty command', [{ id: 'a', command: '', text: 'x' }]],
    ['a missing id', [{ command: '/a', text: 'x' }]],
    ['a missing text', [{ id: 'a', command: '/a' }]],
    ['a null entry', [null]],
    ['a non-object entry', ['/a']],
  ])('rejects %s', (_label, value) => {
    expect(validateLibrary(value).status).toBe('malformed')
  })

  it('rejects duplicate ids, because every other operation addresses a macro by one', () => {
    // update and delete both key on id, so two records sharing one is a library where those
    // operations are undefined rather than merely untidy.
    const check = validateLibrary([macro('a'), macro('a', '/other')])
    expect(check).toEqual({ status: 'malformed', why: 'duplicate id a' })
  })

  it('treats numeric and string ids as the same identity', () => {
    expect(validateLibrary([macro(1), macro('1', '/other')]).status).toBe('malformed')
  })

  it('tolerates duplicate commands', () => {
    // They degrade matching, which the editor surfaces and the user can fix. Refusing an entire
    // recovery over one is the wrong trade at the moment somebody is trying to get their work back.
    expect(validateLibrary([macro('a', '/same'), macro('b', '/same')]).status).toBe('valid')
  })

  it('refuses a library written by a newer version rather than guessing at it', () => {
    expect(validateLibrary([macro('a')], LIBRARY_SCHEMA + 1)).toEqual({
      status: 'too-new',
      schema: LIBRARY_SCHEMA + 1,
    })
  })

  it('checks the schema before the shape, since a newer shape may legitimately look malformed', () => {
    expect(validateLibrary([{ whatever: true }], LIBRARY_SCHEMA + 1).status).toBe('too-new')
  })

  it('accepts a copy that predates versioning', () => {
    expect(validateLibrary([macro('a')], 1).status).toBe('valid')
  })
})
