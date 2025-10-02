import { renderHook, act } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { useEditor } from './useEditor'
import { Macro } from '../../types'

describe('useEditor Hook', () => {
  it('should handle editing state', () => {
    const { result } = renderHook(() => useEditor())

    // Initial state
    expect(result.current.editingMacro).toBeNull()

    const mockMacro: Macro = { id: '1', trigger: '/test', text: 'Test macro' }

    // Set a macro to be edited
    act(() => {
      result.current.handleEdit(mockMacro)
    })
    expect(result.current.editingMacro).toEqual(mockMacro)

    // Finish editing
    act(() => result.current.handleDone())
    expect(result.current.editingMacro).toBeNull()
  })
})
