// @vitest-environment jsdom
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock chrome APIs before importing the hook
const mockAddListener = vi.fn();
const mockRemoveListener = vi.fn();
vi.stubGlobal('chrome', {
  runtime: {
    onMessage: {
      addListener: mockAddListener,
      removeListener: mockRemoveListener,
    },
  },
});

import { usePopup } from './usePopup'

describe('usePopup Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return deprecated stub values', () => {
    const { result } = renderHook(() => usePopup())

    // This hook is deprecated and returns stub values
    expect(result.current.pending).toBe(0)
  })
})