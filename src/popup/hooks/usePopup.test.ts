// @vitest-environment jsdom
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { usePopup } from './usePopup'

describe('usePopup Hook', () => {
  let messageHandler: (message: any) => void

  beforeEach(() => {
    vi.clearAllMocks()

    // Capture the message handler passed to addListener
    vi.mocked(chrome.runtime.onMessage.addListener).mockImplementation(handler => {
      messageHandler = handler
    })
  })

  it('should initialize with 0 pending and add a message listener', () => {
    const { result } = renderHook(() => usePopup())

    expect(result.current.pending).toBe(0)
    expect(chrome.runtime.onMessage.addListener).toHaveBeenCalledTimes(1)
  })

  it('should update pending count when a pendingCount message is received', () => {
    const { result } = renderHook(() => usePopup())

    act(() => {
      messageHandler({ type: 'pendingCount', count: 5 })
    })

    expect(result.current.pending).toBe(5)
  })

  it('should not update pending count for other message types', () => {
    const { result } = renderHook(() => usePopup())

    act(() => {
      messageHandler({ type: 'someOtherEvent', count: 10 })
    })

    expect(result.current.pending).toBe(0)
  })

  it('should remove the message listener on unmount', () => {
    const { unmount } = renderHook(() => usePopup())
    unmount()
    expect(chrome.runtime.onMessage.removeListener).toHaveBeenCalledTimes(1)
    expect(chrome.runtime.onMessage.removeListener).toHaveBeenCalledWith(messageHandler)
  })
})