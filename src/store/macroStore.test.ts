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
    expect(macros.some(m => m.command === '/test' && m.text === 'This is a test')).toBe(true)
  })

  it('edits a macro', () => {
    const { addMacro, updateMacro } = useMacroStore.getState()
    addMacro({ id: '2', command: '/bye', text: 'Adiós' })
    updateMacro('2', { text: 'Chao' })
    const macros = useMacroStore.getState().macros
    expect(macros.find(m => m.id === '2')?.text).toBe('Chao')
  })

  it('removes a macro', () => {
    const { addMacro, deleteMacro } = useMacroStore.getState()
    addMacro({ id: '3', command: '/delete', text: 'To delete' })
    deleteMacro('3')
    const macros = useMacroStore.getState().macros
    expect(macros.some(m => m.command === '/delete')).toBe(false)
  })
})