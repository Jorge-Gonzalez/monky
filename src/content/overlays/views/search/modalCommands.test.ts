import { describe, it, expect } from 'vitest'
import { parseModalQuery, MODAL_COMMANDS } from './modalCommands'

const PREFIXES = ['/']

describe('MODAL_COMMANDS', () => {
  it('defines :new as non-parametric', () => {
    const cmd = MODAL_COMMANDS.find(c => c.id === 'new')!
    expect(cmd.command).toBe(':new')
    expect(cmd.isParametric).toBe(false)
  })

  it('defines :edit as parametric', () => {
    const cmd = MODAL_COMMANDS.find(c => c.id === 'edit')!
    expect(cmd.command).toBe(':edit')
    expect(cmd.isParametric).toBe(true)
  })

  it('defines :delete as parametric', () => {
    const cmd = MODAL_COMMANDS.find(c => c.id === 'delete')!
    expect(cmd.command).toBe(':delete')
    expect(cmd.isParametric).toBe(true)
  })

  it('defines :settings as non-parametric', () => {
    const cmd = MODAL_COMMANDS.find(c => c.id === 'settings')!
    expect(cmd.command).toBe(':settings')
    expect(cmd.isParametric).toBe(false)
  })
})

describe('parseModalQuery — search mode', () => {
  it('returns search for empty string', () => {
    expect(parseModalQuery('', PREFIXES)).toEqual({ mode: 'search' })
  })

  it('returns search for regular text not starting with :', () => {
    expect(parseModalQuery('hello world', PREFIXES)).toEqual({ mode: 'search' })
  })

  it('returns search for macro prefix text like /sig', () => {
    expect(parseModalQuery('/sig', PREFIXES)).toEqual({ mode: 'search' })
  })
})

describe('parseModalQuery — discovery mode', () => {
  it('returns all commands for ":" alone', () => {
    const result = parseModalQuery(':', PREFIXES)
    expect(result.mode).toBe('discovery')
    if (result.mode === 'discovery') {
      expect(result.commands).toHaveLength(MODAL_COMMANDS.length)
    }
  })

  it('filters by partial prefix ":n" → only :new', () => {
    const result = parseModalQuery(':n', PREFIXES)
    expect(result.mode).toBe('discovery')
    if (result.mode === 'discovery') {
      expect(result.commands).toHaveLength(1)
      expect(result.commands[0].id).toBe('new')
    }
  })

  it('filters by partial prefix ":e" → only :edit', () => {
    const result = parseModalQuery(':e', PREFIXES)
    expect(result.mode).toBe('discovery')
    if (result.mode === 'discovery') {
      expect(result.commands).toHaveLength(1)
      expect(result.commands[0].id).toBe('edit')
    }
  })

  it('returns empty discovery for unknown :xyz', () => {
    const result = parseModalQuery(':xyz', PREFIXES)
    expect(result.mode).toBe('discovery')
    if (result.mode === 'discovery') {
      expect(result.commands).toHaveLength(0)
    }
  })
})

describe('parseModalQuery — instant mode', () => {
  it(':new is instant', () => {
    const result = parseModalQuery(':new', PREFIXES)
    expect(result.mode).toBe('instant')
    if (result.mode === 'instant') expect(result.command.id).toBe('new')
  })

  it(':settings is instant', () => {
    const result = parseModalQuery(':settings', PREFIXES)
    expect(result.mode).toBe('instant')
    if (result.mode === 'instant') expect(result.command.id).toBe('settings')
  })
})

describe('parseModalQuery — awaiting mode', () => {
  it(':edit without param is awaiting', () => {
    const result = parseModalQuery(':edit', PREFIXES)
    expect(result.mode).toBe('awaiting')
    if (result.mode === 'awaiting') expect(result.command.id).toBe('edit')
  })

  it(':delete without param is awaiting', () => {
    const result = parseModalQuery(':delete', PREFIXES)
    expect(result.mode).toBe('awaiting')
    if (result.mode === 'awaiting') expect(result.command.id).toBe('delete')
  })

  it(':edit followed by non-prefix char is still awaiting', () => {
    const result = parseModalQuery(':editx', PREFIXES)
    expect(result.mode).toBe('awaiting')
  })

  it(':delete followed by non-prefix char is still awaiting', () => {
    const result = parseModalQuery(':deletex', PREFIXES)
    expect(result.mode).toBe('awaiting')
  })
})

describe('parseModalQuery — parametric mode', () => {
  it(':edit/nota → parametric with param /nota', () => {
    const result = parseModalQuery(':edit/nota', PREFIXES)
    expect(result.mode).toBe('parametric')
    if (result.mode === 'parametric') {
      expect(result.command.id).toBe('edit')
      expect(result.param).toBe('/nota')
    }
  })

  it(':delete/nota → parametric with param /nota', () => {
    const result = parseModalQuery(':delete/nota', PREFIXES)
    expect(result.mode).toBe('parametric')
    if (result.mode === 'parametric') {
      expect(result.command.id).toBe('delete')
      expect(result.param).toBe('/nota')
    }
  })

  it('param includes the prefix character', () => {
    const result = parseModalQuery(':edit/sig', PREFIXES)
    if (result.mode === 'parametric') {
      expect(result.param.startsWith('/')).toBe(true)
    }
  })

  it('works with semicolon prefix', () => {
    const result = parseModalQuery(':edit;cmd', [';'])
    expect(result.mode).toBe('parametric')
    if (result.mode === 'parametric') {
      expect(result.param).toBe(';cmd')
    }
  })

  it('partial param is still parametric', () => {
    const result = parseModalQuery(':edit/no', PREFIXES)
    expect(result.mode).toBe('parametric')
    if (result.mode === 'parametric') {
      expect(result.param).toBe('/no')
    }
  })
})
