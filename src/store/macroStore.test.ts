import { describe, it, beforeEach, expect } from 'vitest'
import { useMacroStore } from './useMacroStore'

describe('Macro Store', () => {
  beforeEach(() => {
    // reset store between tests
    useMacroStore.setState({ macros: [] })
  })

  it('adds a macro', () => {
    const { addMacro } = useMacroStore.getState()
    addMacro({ id: '1', command: '/test', text: 'This is a test' })
    const macros = useMacroStore.getState().macros
    expect(macros.some((m) => m.command === '/test' && m.text === 'This is a test')).toBe(true)
  })

  it('edits a macro', () => {
    const { addMacro, updateMacro } = useMacroStore.getState()
    addMacro({ id: '2', command: '/bye', text: 'Adiós' })
    updateMacro('2', { text: 'Chao' })
    const macros = useMacroStore.getState().macros
    expect(macros.find((m) => m.id === '2')?.text).toBe('Chao')
  })

  it('removes a macro', () => {
    const { addMacro, deleteMacros } = useMacroStore.getState()
    addMacro({ id: '3', command: '/delete', text: 'To delete' })
    deleteMacros(['3'])
    const macros = useMacroStore.getState().macros
    expect(macros.some((m) => m.command === '/delete')).toBe(false)
  })

  it('removes several macros in one pass, leaving the rest', () => {
    const { setMacros, deleteMacros } = useMacroStore.getState()
    setMacros([
      { id: 'a', command: '/a', text: 'A' },
      { id: 'b', command: '/b', text: 'B' },
      { id: 'c', command: '/c', text: 'C' },
      { id: 'd', command: '/d', text: 'D' },
    ])
    deleteMacros(['b', 'd'])
    expect(useMacroStore.getState().macros.map((m) => m.id)).toEqual(['a', 'c'])
  })

  // `Macro['id']` is `number | string`, and both turn up: a local create stamps a string,
  // the backend can send a number. Matching has to be on the string form of each, which is
  // why every id comparison in the store is coerced.
  it('matches ids across the number/string divide, in either direction', () => {
    const { setMacros, deleteMacros } = useMacroStore.getState()
    setMacros([
      { id: 1, command: '/a', text: 'A' },
      { id: '2', command: '/b', text: 'B' },
      { id: 3, command: '/c', text: 'C' },
    ])
    deleteMacros(['1', 2])
    expect(useMacroStore.getState().macros.map((m) => m.id)).toEqual([3])
  })

  it('ignores ids that are not there rather than removing anything else', () => {
    const { setMacros, deleteMacros } = useMacroStore.getState()
    setMacros([
      { id: 'a', command: '/a', text: 'A' },
      { id: 'b', command: '/b', text: 'B' },
    ])
    deleteMacros(['zzz'])
    expect(useMacroStore.getState().macros.map((m) => m.id)).toEqual(['a', 'b'])
  })
})

// The persist options are read off the store rather than exercised through a mocked storage
// backend: partialize and merge are pure, and what needs pinning is what they decide, not how
// zustand calls them.
describe('what reaches storage', () => {
  const { partialize, merge } = useMacroStore.persist.getOptions()

  it('writes the library and the config, and nothing else', () => {
    // Bytes here are spent against the 8192 chrome.storage.sync allows an item, and this state
    // was measured 221 short of that cap. Anything not restorable has no business in the envelope.
    expect(Object.keys(partialize!(useMacroStore.getState())).sort()).toEqual(['config', 'macros'])
  })

  it('keeps a library the user emptied rather than reseeding the sample macros', () => {
    const merged = merge!({ macros: [], config: {} }, useMacroStore.getState())
    expect(merged.macros).toEqual([])
  })

  it('falls back to the seeded macros only when storage holds none at all', () => {
    const currentState = useMacroStore.getState()
    expect(merge!({ config: {} }, currentState).macros).toBe(currentState.macros)
  })

  it('backfills config fields an older persisted state predates', () => {
    const merged = merge!({ macros: [], config: { theme: 'dark' } }, useMacroStore.getState())
    expect(merged.config.theme).toBe('dark')
    expect(merged.config.prefixes).toEqual(['/', ';'])
  })

  it('drops keys an older envelope carries that the store no longer has', () => {
    // Migration without a version bump: reading the two named fields rather than spreading the
    // persisted object means retired keys are simply not carried across. Profiles on disk still
    // hold `user` and `syncStatus` from the dropped backend, and `syncEnabled` inside config.
    const merged = merge!(
      {
        macros: [],
        config: { theme: 'dark', syncEnabled: true },
        user: { id: 'stale' },
        syncStatus: 'error',
      },
      useMacroStore.getState()
    )
    expect(merged).not.toHaveProperty('user')
    expect(merged).not.toHaveProperty('syncStatus')
    expect(merged.config.theme).toBe('dark')
  })
})
