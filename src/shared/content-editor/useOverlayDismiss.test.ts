// @vitest-environment jsdom
import { renderHook } from '@testing-library/preact'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useOverlayDismiss } from './useOverlayDismiss'

describe('useOverlayDismiss', () => {
  let wrapper: HTMLDivElement
  let onClose: ReturnType<typeof vi.fn>

  beforeEach(() => {
    wrapper = document.createElement('div')
    document.body.appendChild(wrapper)
    onClose = vi.fn()
  })

  afterEach(() => {
    document.body.removeChild(wrapper)
    vi.clearAllMocks()
  })

  function setup(open: boolean) {
    renderHook(() => useOverlayDismiss({ current: wrapper }, open, onClose))
  }

  describe('click-outside (mousedown)', () => {
    it('calls onClose when mousedown fires outside the wrapper', () => {
      setup(true)
      document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, composed: true }))
      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('does not call onClose when mousedown fires inside the wrapper', () => {
      setup(true)
      wrapper.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, composed: true }))
      expect(onClose).not.toHaveBeenCalled()
    })

    it('does not call onClose when closed', () => {
      setup(false)
      document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
      expect(onClose).not.toHaveBeenCalled()
    })
  })

  describe('Escape key', () => {
    it('calls onClose on Escape', () => {
      setup(true)
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('stops propagation on Escape so document-level handlers do not fire', () => {
      setup(true)
      const documentHandler = vi.fn()
      document.addEventListener('keydown', documentHandler)
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
      expect(documentHandler).not.toHaveBeenCalled()
      document.removeEventListener('keydown', documentHandler)
    })

    it('does not call onClose on other keys', () => {
      setup(true)
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
      expect(onClose).not.toHaveBeenCalled()
    })

    it('does not call onClose when closed', () => {
      setup(false)
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
      expect(onClose).not.toHaveBeenCalled()
    })
  })
})
