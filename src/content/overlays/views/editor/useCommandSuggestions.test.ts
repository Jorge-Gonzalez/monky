// @vitest-environment jsdom
import { renderHook } from '@testing-library/preact'
import { describe, it, expect, vi } from 'vitest'
import { useCommandSuggestions } from './useCommandSuggestions'

const macros = [
  { id: 1, command: '/sig',  text: 'My signature' },
  { id: 2, command: '/silk', text: 'Silk' },
  { id: 3, command: '/sigh', text: 'Ugh' },
  { id: 4, command: '/slow', text: 'Slow' },
  { id: 5, command: '/br',   text: 'Be right back' },
  { id: 6, command: '/snap', text: 'Snap' },
] as any

vi.mock('../../../../store/useMacroStore', () => ({
  useMacroStore: (selector: any) => selector({ macros }),
}))

describe('useCommandSuggestions', () => {
  it('matches on the command field, not the text', () => {
    // "signature" appears in /sig's text but in no command → no match
    const { result } = renderHook(() => useCommandSuggestions('signature', true, vi.fn(), vi.fn()))
    expect(result.current.suggestions).toEqual([])
  })

  it('matches commands by substring', () => {
    const { result } = renderHook(() => useCommandSuggestions('/sig', true, vi.fn(), vi.fn()))
    // '/sig' is a substring of both '/sig' and '/sigh'
    expect(result.current.suggestions.map((m: any) => m.command)).toEqual(['/sig', '/sigh'])
  })

  it('caps suggestions at 5', () => {
    const { result } = renderHook(() => useCommandSuggestions('/s', true, vi.fn(), vi.fn()))
    expect(result.current.suggestions.length).toBeLessThanOrEqual(5)
  })

  it('returns nothing when disabled (editing an existing macro)', () => {
    const { result } = renderHook(() => useCommandSuggestions('/s', false, vi.fn(), vi.fn()))
    expect(result.current.suggestions).toEqual([])
  })

  it('returns nothing for a blank command', () => {
    const { result } = renderHook(() => useCommandSuggestions('   ', true, vi.fn(), vi.fn()))
    expect(result.current.suggestions).toEqual([])
  })

  it('is hidden until focus enters the widget', () => {
    const { result } = renderHook(() => useCommandSuggestions('/s', true, vi.fn(), vi.fn()))
    expect(result.current.visible).toBe(false)
  })
})
