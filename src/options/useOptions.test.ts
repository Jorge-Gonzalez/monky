// @vitest-environment jsdom
import { renderHook, act } from '@testing-library/preact'
import { describe, it, expect, beforeEach } from 'vitest'
import { useOptions } from './useOptions'
import { useMacroStore } from '../store/useMacroStore'

describe('useOptions', () => {
  beforeEach(() => {
    const s = useMacroStore.getState()
    s.setPrefixes(['/', ';'])
    s.setUseCommitKeys(false)
    s.setLanguage('en')
    s.setColorTheme('humo')
  })

  it('exposes the current config slice', () => {
    const { result } = renderHook(() => useOptions())
    expect(result.current.prefixes).toEqual(['/', ';'])
    expect(result.current.useCommitKeys).toBe(false)
    expect(result.current.language).toBe('en')
    expect(result.current.colorTheme).toBe('humo')
  })

  it('setters write through to the store', () => {
    const { result } = renderHook(() => useOptions())
    act(() => result.current.setPrefixes(['/']))
    expect(useMacroStore.getState().config.prefixes).toEqual(['/'])
    act(() => result.current.setColorTheme('mar'))
    expect(useMacroStore.getState().config.colorTheme).toBe('mar')
    act(() => result.current.setUseCommitKeys(true))
    expect(useMacroStore.getState().config.useCommitKeys).toBe(true)
    act(() => result.current.setLanguage('es'))
    expect(useMacroStore.getState().config.language).toBe('es')
  })
})
