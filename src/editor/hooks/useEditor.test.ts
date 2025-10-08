import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { useEditor } from './useEditor'

describe('useEditor Hook', () => {
  it('should handle editing state (deprecated - returns stub)', () => {
    const { result } = renderHook(() => useEditor())

    // This hook is deprecated and returns stub values
    expect(result.current.editingMacro).toBeNull()
    expect(typeof result.current.handleEdit).toBe('function')
    expect(typeof result.current.handleDone).toBe('function')
    
    // The functions are no-ops, so they don't change state
    act(() => {
      result.current.handleEdit({ id: '1', command: '/test', text: 'Test macro', contentType: 'text/plain' })
    })
    expect(result.current.editingMacro).toBeNull() // Still null because it's deprecated
  })
})
