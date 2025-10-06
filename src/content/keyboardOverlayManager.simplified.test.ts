import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { keyboardOverlayManager } from './keyboardOverlayManager'
import { Macro } from '../types'

// Mock React and ReactDOM with proper structure
vi.mock('react', () => ({
  default: {
    createElement: vi.fn(() => ({}))
  },
  createElement: vi.fn(() => ({}))
}))

vi.mock('react-dom/client', () => ({
  default: {
    createRoot: vi.fn(() => ({
      render: vi.fn(),
      unmount: vi.fn()
    }))
  },
  createRoot: vi.fn(() => ({
    render: vi.fn(),
    unmount: vi.fn()
  }))
}))

// Mock the overlay components
vi.mock('./MacroSearchOverlay', () => ({
  MacroSearchOverlay: vi.fn(() => null)
}))

vi.mock('./MacroSuggestions', () => ({
  MacroSuggestions: vi.fn(() => null)
}))

// Mock editableUtils functions
vi.mock('./editableUtils', () => ({
  getActiveEditable: vi.fn(),
  getSelection: vi.fn(),
  replaceText: vi.fn()
}))

import * as editableUtils from './editableUtils'

describe('KeyboardOverlayManager - Focus and Cursor Management', () => {
  let testMacros: Macro[]
  let mockInput: HTMLInputElement
  let mockContentEditable: HTMLDivElement

  beforeEach(() => {
    // Clear DOM and any previous instances
    document.body.innerHTML = ''
    document.head.innerHTML = ''
    
    // Setup test macros
    testMacros = [
      {
        id: '1',
        command: '/test',
        text: 'Test macro content',
        contentType: 'text/plain'
      },
      {
        id: '2', 
        command: '/html',
        text: 'Rich content',
        html: '<strong>Rich content</strong>',
        contentType: 'text/html'
      }
    ]

    // Create test elements
    mockInput = document.createElement('input')
    mockInput.type = 'text'
    mockInput.id = 'test-input'
    document.body.appendChild(mockInput)

    mockContentEditable = document.createElement('div')
    mockContentEditable.contentEditable = 'true'
    mockContentEditable.id = 'test-contenteditable'
    document.body.appendChild(mockContentEditable)

    // Reset all mocks
    vi.clearAllMocks()
    
    // Update macros
    keyboardOverlayManager.updateMacros(testMacros)
  })

  afterEach(() => {
    // Cleanup - suppress any errors since we're testing
    try {
      keyboardOverlayManager.hideSearchOverlay()
      keyboardOverlayManager.hideSuggestions()
    } catch (e) {
      // Ignore cleanup errors in tests
    }
    vi.clearAllMocks()
  })

  describe('Focus Management Tests', () => {
    it('should track previously focused element when showing search overlay', () => {
      mockInput.focus()
      expect(document.activeElement).toBe(mockInput)

      // Show search overlay - we can't directly test the stored element since it's private
      // but we can test the focus restoration behavior
      keyboardOverlayManager.showSearchOverlay()
      
      // The functionality works if focus is restored later
      expect(document.activeElement).toBe(mockInput) // Focus should still be there initially
    })

    it('should restore focus when hiding search overlay', () => {
      mockInput.focus()
      keyboardOverlayManager.showSearchOverlay()
      
      // Clear focus (simulate overlay interaction)
      mockInput.blur()
      expect(document.activeElement).not.toBe(mockInput)

      // Hide overlay and wait for focus restoration
      keyboardOverlayManager.hideSearchOverlay()
      
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          expect(document.activeElement).toBe(mockInput)
          resolve()
        }, 10) // Wait for the setTimeout in hideSearchOverlay
      })
    })

    it('should handle focus restoration when element is removed', () => {
      mockInput.focus()
      keyboardOverlayManager.showSearchOverlay()
      
      // Remove the element from DOM
      mockInput.remove()
      
      // Hide overlay - should not throw error
      expect(() => {
        keyboardOverlayManager.hideSearchOverlay()
      }).not.toThrow()
    })
  })

  describe('Cursor Position Management Tests', () => {
    it('should save cursor position in input elements', () => {
      mockInput.value = 'Hello world'
      mockInput.setSelectionRange(5, 5) // Position cursor at index 5
      mockInput.focus()

      // Mock getActiveEditable to return the input element
      vi.mocked(editableUtils.getActiveEditable).mockReturnValue(mockInput)
      // Mock getSelection to return the cursor position
      vi.mocked(editableUtils.getSelection).mockReturnValue({ start: 5, end: 5 })

      keyboardOverlayManager.showSearchOverlay()
      
      // Test that getSelection was called - this indirectly tests cursor position saving
      expect(editableUtils.getSelection).toHaveBeenCalledWith(mockInput)
    })

    it('should save cursor position in contenteditable elements', () => {
      mockContentEditable.focus()
      
      // Mock getActiveEditable to return the contenteditable element
      vi.mocked(editableUtils.getActiveEditable).mockReturnValue(mockContentEditable)
      // Mock contenteditable selection
      vi.mocked(editableUtils.getSelection).mockReturnValue({ start: 3, end: 3 })

      keyboardOverlayManager.showSearchOverlay()
      
      // Test that getSelection was called - this indirectly tests cursor position saving
      expect(editableUtils.getSelection).toHaveBeenCalledWith(mockContentEditable)
    })
  })

  describe('Macro Insertion Tests', () => {
    it('should insert macro content using replaceText', () => {
      // Clear any previous mocks
      vi.clearAllMocks()
      
      mockInput.focus()
      mockInput.value = 'Hello world'
      
      // Mock getActiveEditable specifically for this test
      vi.mocked(editableUtils.getActiveEditable).mockReturnValue(mockInput)
      vi.mocked(editableUtils.getSelection).mockReturnValue({ start: 5, end: 5 })
      
      // Show overlay to set up state, then handle macro selection
      keyboardOverlayManager.showSearchOverlay()
      keyboardOverlayManager.handleMacroSelection(testMacros[0])

      // Should call replaceText with correct parameters
      expect(editableUtils.replaceText).toHaveBeenCalledWith(
        mockInput,
        testMacros[0],
        5,
        5
      )
    })

    it('should call replaceText when macro is selected', () => {
      // Test basic macro insertion flow
      mockInput.focus()
      vi.mocked(editableUtils.getActiveEditable).mockReturnValue(mockInput)
      vi.mocked(editableUtils.getSelection).mockReturnValue({ start: 0, end: 0 })
      
      keyboardOverlayManager.showSearchOverlay()
      keyboardOverlayManager.handleMacroSelection(testMacros[0])

      // Should have called replaceText
      expect(editableUtils.replaceText).toHaveBeenCalled()
    })

    it('should handle insertion when no saved element exists', () => {
      // Clear any state and mocks
      vi.clearAllMocks()
      
      // Mock getActiveEditable to return null (no element found)
      vi.mocked(editableUtils.getActiveEditable).mockReturnValue(null)

      // Should not throw error
      expect(() => {
        keyboardOverlayManager.handleMacroSelection(testMacros[0])
      }).not.toThrow()

      // Should not call replaceText when no element is found
      expect(editableUtils.replaceText).not.toHaveBeenCalled()
    })
  })

  describe('Suggestions Management Tests', () => {
    it('should show suggestions without throwing errors', () => {
      mockInput.focus()
      keyboardOverlayManager.showSearchOverlay()

      // Show suggestions - should not throw
      expect(() => {
        keyboardOverlayManager.showSuggestions('test')
      }).not.toThrow()
    })

    it('should hide suggestions without throwing errors', () => {
      mockInput.focus()
      keyboardOverlayManager.showSearchOverlay()
      keyboardOverlayManager.showSuggestions('test')
      
      // Hide suggestions - should not throw
      expect(() => {
        keyboardOverlayManager.hideSuggestions()
      }).not.toThrow()
    })
  })

  describe('Event Dispatching Tests', () => {
    it('should dispatch macro-selected event with correct details', () => {
      const eventSpy = vi.fn()
      document.addEventListener('macro-selected', eventSpy)

      mockInput.focus()
      vi.mocked(editableUtils.getActiveEditable).mockReturnValue(mockInput)
      vi.mocked(editableUtils.getSelection).mockReturnValue({ start: 5, end: 5 })
      
      keyboardOverlayManager.showSearchOverlay()
      keyboardOverlayManager.handleMacroSelection(testMacros[0])

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: expect.objectContaining({
            macro: testMacros[0]
          })
        })
      )

      document.removeEventListener('macro-selected', eventSpy)
    })
  })

  describe('Integration Tests', () => {
    it('should handle complete overlay workflow without errors', () => {
      mockInput.focus()
      vi.mocked(editableUtils.getActiveEditable).mockReturnValue(mockInput)
      vi.mocked(editableUtils.getSelection).mockReturnValue({ start: 0, end: 0 })
      
      // Should not throw during complete workflow
      expect(() => {
        keyboardOverlayManager.showSearchOverlay()
        keyboardOverlayManager.showSuggestions('test')
        keyboardOverlayManager.hideSuggestions()
        keyboardOverlayManager.handleMacroSelection(testMacros[0])
        keyboardOverlayManager.hideSearchOverlay()
      }).not.toThrow()
    })

    it('should call expected functions during macro selection', () => {
      mockInput.focus()
      vi.mocked(editableUtils.getActiveEditable).mockReturnValue(mockInput)
      vi.mocked(editableUtils.getSelection).mockReturnValue({ start: 5, end: 5 })
      
      keyboardOverlayManager.showSearchOverlay()
      keyboardOverlayManager.handleMacroSelection(testMacros[0])
      
      // Should have called the expected utility functions
      expect(editableUtils.getActiveEditable).toHaveBeenCalled()
      expect(editableUtils.getSelection).toHaveBeenCalled()
      expect(editableUtils.replaceText).toHaveBeenCalledWith(
        mockInput,
        testMacros[0],
        5,
        5
      )
    })
  })
})