import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createMacroDetector } from '../macroDetector'
import { DetectorActions } from '../../actions/detectorActions'
import { Macro, EditableEl } from '../../../types'
import { setCursorInside, typeIn } from '../../../utils/testUtils'
import { useMacroStore } from "../../../store/useMacroStore"

describe('MacroDetector - Undo System', () => {
  let detector: ReturnType<typeof createMacroDetector>
  let mockActions: DetectorActions
  let inputElement: HTMLInputElement
  let textareaElement: HTMLTextAreaElement
  let contentEditableDiv: HTMLDivElement

  const getUndoEvent = () => new KeyboardEvent('keydown', { 
    key: 'z', 
    ctrlKey: true, 
    bubbles: true 
  })

  const getMacUndoEvent = () => new KeyboardEvent('keydown', { 
    key: 'z', 
    metaKey: true, 
    bubbles: true 
  })

  const getCancelableUndoEvent = () => new KeyboardEvent('keydown', { 
    key: 'z', 
    ctrlKey: true, 
    bubbles: true,
    cancelable: true
  })

  const getRedoEvent = () => new KeyboardEvent('keydown', { 
    key: 'z', 
    ctrlKey: true, 
    shiftKey: true,
    bubbles: true 
  })

  const testMacros: Macro[] = [
    {
      id: '1',
      command: '/hello',
      text: 'Hello, World!',
      contentType: 'text/plain'
    },
    {
      id: '2',
      command: '/email',
      text: 'test@example.com',
      contentType: 'text/plain'
    },
    {
      id: '3',
      command: '/sig',
      text: 'Best regards,\nJohn Doe',
      contentType: 'text/plain'
    },
    {
      id: '4',
      command: '/empty',
      text: '',
      contentType: 'text/plain'
    },
    {
      id: '5',
      command: '/fir',
      text: 'John Doe - Software Developer',
      html: '<p><strong>John Doe</strong><br><em>Software Developer</em></p>',
      contentType: 'text/html',
    },
    {
      id: '6',
      command: '/tasks',
      text: 'Review code, Update docs, Test features',
      html: '<ul><li>Review code</li><li>Update docs</li><li>Test features</li></ul>',
      contentType: 'text/html',
    },
    {
      id: '7',
      command: "/tambien",
      text: "Tambien a mi\n\nBlockquote:\n\n> Lo que no se tiene no se perdio, entonces por que se anhela, los anhelos y los miedos dos caras de la misma moneda la alegria y la miseria inalcanzables pero simpre presentes tranparentes.",
      html: "<p><b>Tambien a mi</b></p><p>Blockquote:</p><blockquote>Lo que no se tiene no se perdio, entonces por que se anhela, los anhelos y los miedos dos caras de la misma moneda la alegria y la miseria inalcanzables pero simpre presentes tranparentes.</blockquote>",
      contentType: "text/html",
    }
  ]

  beforeEach(() => {
    useMacroStore.setState(s => ({ config: { ...s.config, useCommitKeys: true } }))
    // Create mock actions
    mockActions = {
      onDetectionStarted: vi.fn(),
      onDetectionUpdated: vi.fn(),
      onDetectionCancelled: vi.fn(),
      onMacroCommitted: vi.fn(),
      onNavigationRequested: vi.fn(),
      onCancelRequested: vi.fn(),
      onCommitRequested: vi.fn(),
      onShowAllRequested: vi.fn()
    }

    // Create test elements
    inputElement = document.createElement('input')
    inputElement.type = 'text'
    document.body.appendChild(inputElement)

    textareaElement = document.createElement('textarea')
    document.body.appendChild(textareaElement)

    contentEditableDiv = document.createElement('div')
    contentEditableDiv.contentEditable = 'true'
    document.body.appendChild(contentEditableDiv)

    // Create detector
    detector = createMacroDetector(mockActions)
    detector.setMacros(testMacros)
    detector.initialize()
  })

  afterEach(() => {
    detector.destroy()
    document.body.removeChild(inputElement)
    document.body.removeChild(textareaElement)
    document.body.removeChild(contentEditableDiv)
  })

  describe('Cursor Position After Undo', () => {

    it('should restore cursor position after undo in input', () => {

      typeIn(inputElement, '/hello ')

      inputElement.dispatchEvent(getUndoEvent())

      // Cursor should be at start (empty field after undo)
      expect(inputElement.selectionStart).toBe(0)
      expect(inputElement.selectionEnd).toBe(0)
    })

    it('should restore cursor position after undo in textarea', () => {
      textareaElement.focus()
      textareaElement.value = 'prefix '
      textareaElement.setSelectionRange(7, 7)

      typeIn(textareaElement, '/email ')

      textareaElement.dispatchEvent(getUndoEvent())

      expect(textareaElement.value).toBe('prefix ')
      expect(textareaElement.selectionStart).toBe(7)
    })
  })

  describe('Integration with Detection System', () => {

    it('should track undo even when detection is cancelled', () => {

      typeIn(inputElement, '/hello ')

      // Detection should be cancelled after commit
      expect(detector.getState().active).toBe(false)

      // But undo history should still exist
      expect(detector.getUndoHistoryLength()).toBe(1)

      inputElement.dispatchEvent(getUndoEvent())

      expect(inputElement.value).toBe('')
    })

    it('should not interfere with native browser undo when no macro history', () => {

      typeIn(inputElement, 'regular typing')
      
      // Should allow default browser behavior
      const result = inputElement.dispatchEvent(getUndoEvent())
      expect(result).toBe(true) // Not prevented
    })
  })

  describe('Event Dispatching', () => {

    it('should dispatch input event after undo', () => {
      const inputListener = vi.fn()
      inputElement.addEventListener('input', inputListener)

      typeIn(inputElement, '/hello ')

      inputListener.mockClear()

      inputElement.dispatchEvent(getUndoEvent())

      // Should have dispatched input event
      expect(inputListener).toHaveBeenCalledTimes(1)
    })

    it('should prevent default when undo is handled', () => {

      typeIn(inputElement, '/hello ')
      
      const result = inputElement.dispatchEvent(getCancelableUndoEvent())
      
      // Should be prevented when undo was handled
      expect(result).toBe(false)
    })
  })

  describe('Basic Undo Functionality', () => {

    it('should undo macro replacement with html content in input element', () => {

      typeIn(inputElement, '/tambien ')

      // Verify replacement happened - input fields normalize multiline text to single line
      // The macro's text property has newlines which get converted to spaces
      expect(inputElement.value).toBe('Tambien a mi Blockquote: > Lo que no se tiene no se perdio, entonces por que se anhela, los anhelos y los miedos dos caras de la misma moneda la alegria y la miseria inalcanzables pero simpre presentes tranparentes.');
      expect(detector.getUndoHistoryLength()).toBe(1);

      // Undo the replacement
      inputElement.dispatchEvent(getUndoEvent());

      // Verify undo worked - should clear the replacement
      expect(inputElement.value).toBe('');
      expect(detector.getUndoHistoryLength()).toBe(0);
    })

    it('should undo macro replacement in input element', () => {

      typeIn(inputElement, '/hello ')

      // Verify replacement happened (no trailing space - trigger was consumed)
      expect(inputElement.value).toBe('Hello, World!')
      expect(detector.getUndoHistoryLength()).toBe(1)

      // Undo the replacement
      inputElement.dispatchEvent(getUndoEvent())

      // Verify undo worked - should clear the replacement
      expect(inputElement.value).toBe('')
      expect(detector.getUndoHistoryLength()).toBe(0)
    })

    it('should undo macro replacement in textarea element', () => {

      typeIn(textareaElement, '/email ')

      expect(textareaElement.value).toBe('test@example.com')
      expect(detector.getUndoHistoryLength()).toBe(1)

      // Undo
      textareaElement.dispatchEvent(getUndoEvent())

      expect(textareaElement.value).toBe('')
      expect(detector.getUndoHistoryLength()).toBe(0)
    })

    it('should undo macro replacement in contentEditable element', () => {
      contentEditableDiv.focus()

      // Set up initial selection
      const selection = window.getSelection()!
      const range = document.createRange()
      range.selectNodeContents(contentEditableDiv)
      range.collapse(false)
      selection.removeAllRanges()
      selection.addRange(range)

      typeIn(contentEditableDiv, '/hello ')

      expect(contentEditableDiv.textContent).toBe('Hello, World!')
      expect(detector.getUndoHistoryLength()).toBe(1)

      // Undo
      contentEditableDiv.dispatchEvent(getUndoEvent())

      expect(contentEditableDiv.textContent).toBe('')
      expect(detector.getUndoHistoryLength()).toBe(0)
    })

    it('should work with Cmd+Z on Mac', () => {
      inputElement.focus()

      typeIn(inputElement, '/hello ')

      // Use metaKey instead of ctrlKey (Mac style)
      inputElement.dispatchEvent(getMacUndoEvent())

      expect(inputElement.value).toBe('')
    })
  })

  describe('Multiple Undo Operations', () => {
    it('should undo multiple macro replacements in order', () => {
      inputElement.focus()

      // First macro
      typeIn(inputElement, '/hello ')

      // Second macro
      typeIn(inputElement, '/email ')

      expect(inputElement.value).toContain('Hello, World!')
      expect(inputElement.value).toContain('test@example.com')
      expect(detector.getUndoHistoryLength()).toBe(2)

      // Undo second macro - removes just the second replacement
      inputElement.dispatchEvent(getUndoEvent())

      expect(inputElement.value).toBe('Hello, World!')
      expect(detector.getUndoHistoryLength()).toBe(1)

      // Undo first macro - removes the first replacement
      inputElement.dispatchEvent(getUndoEvent())

      expect(inputElement.value).toBe('')
      expect(detector.getUndoHistoryLength()).toBe(0)
    })

    it('should not undo when history is empty', () => {

      typeIn(inputElement, 'some text')

      // Should not prevent default when no history
      const isDefaultPrevented = !inputElement.dispatchEvent(getUndoEvent())
      expect(isDefaultPrevented).toBe(false)
      expect(inputElement.value).toBe('some text')
    })
  })

  describe('Undo with Text Modifications', () => {
    it('should undo when user typed after replacement', () => {
      inputElement.focus()

      typeIn(inputElement, '/hello ')

      // User types more text (manually, not through typeIn to avoid triggering detection)
      const currentValue = inputElement.value
      inputElement.value = currentValue + ' extra text'
      inputElement.setSelectionRange(inputElement.value.length, inputElement.value.length)

      // Undo should still work - removes the replacement but keeps the extra text
      inputElement.dispatchEvent(getUndoEvent())

      expect(inputElement.value).toBe(' extra text')
    })

    it('should undo when user typed before replacement', () => {

      // User types at the beginning
      typeIn(inputElement, 'prefix ')

      typeIn(inputElement, '/hello ')

      inputElement.dispatchEvent(getUndoEvent())

      // Should still find and undo the replacement, keeping the prefix
      expect(inputElement.value).toBe('prefix ')
    })

    it('should handle undo when replacement text was partially edited', () => {
      inputElement.focus()
      
      typeIn(inputElement, '/hello ')
      
      // User edits the replacement (removes "World")
      inputElement.value = 'Hello,  !'
      
      // Undo might not work perfectly here, but shouldn't crash
      expect(() => {
        inputElement.dispatchEvent(getUndoEvent())
      }).not.toThrow()
    })
  })

  describe('History Management', () => {
    it('should respect MAX_UNDO_HISTORY limit', () => {
      inputElement.focus()

      // Perform 60 replacements (more than MAX_UNDO_HISTORY of 50)
      for (let i = 0; i < 60; i++) {
        inputElement.value = ''
        inputElement.setSelectionRange(0, 0)
        typeIn(inputElement, '/hello ')
      }

      // Should cap at 50
      expect(detector.getUndoHistoryLength()).toBeLessThanOrEqual(50)
    })

    it('should clear history for specific element', () => {
      // Add replacements to input
      inputElement.focus()
      typeIn(inputElement, '/hello ')

      // Add replacements to textarea
      textareaElement.focus()
      typeIn(textareaElement, '/email ')

      expect(detector.getUndoHistoryLength()).toBe(2)

      // Clear only input history
      detector.clearUndoHistory(inputElement)
      expect(detector.getUndoHistoryLength()).toBe(1)
    })

    it('should clear all history', () => {
      inputElement.focus()
      typeIn(inputElement, '/hello ')

      textareaElement.focus()
      typeIn(textareaElement, '/email ')

      expect(detector.getUndoHistoryLength()).toBe(2)

      detector.clearUndoHistory()
      expect(detector.getUndoHistoryLength()).toBe(0)
    })

    it('should clear history on detector destroy', () => {

      typeIn(inputElement, '/hello ')

      expect(detector.getUndoHistoryLength()).toBe(1)

      detector.destroy()
      
      // Create new detector to verify history was cleared
      const newDetector = createMacroDetector(mockActions)
      newDetector.setMacros(testMacros)
      newDetector.initialize()
      
      expect(newDetector.getUndoHistoryLength()).toBe(0)
      newDetector.destroy()
    })
  })

  describe('Edge Cases', () => {
    it('should not crash when element is removed from DOM', () => {

      typeIn(inputElement, '/hello ')

      // Remove element from DOM
      document.body.removeChild(inputElement)

      // Try to undo - should not crash
      expect(() => {
        window.dispatchEvent(getUndoEvent())
      }).not.toThrow()
      
      // Prevent afterEach from trying to remove it again
      inputElement = document.createElement('input')
      inputElement.type = 'text'
      document.body.appendChild(inputElement)
    })

    it('should not undo if Shift is pressed (Ctrl+Shift+Z is redo)', () => {

      typeIn(inputElement, '/hello ')
      
      inputElement.dispatchEvent(getRedoEvent())

      // Should not undo
      expect(inputElement.value).toBe('Hello, World!')
    })

    it('should handle multiline macro replacements', () => {

      typeIn(textareaElement, '/sig ')

      expect(textareaElement.value).toBe('Best regards,\nJohn Doe')

      textareaElement.dispatchEvent(getUndoEvent())

      expect(textareaElement.value).toBe('')
    })

    it('should handle empty replacement text', () => {

      typeIn(inputElement, '/empty ')

      expect(inputElement.value).toBe('')

      inputElement.dispatchEvent(getUndoEvent())

      // Undo replaces empty string with empty string - still empty
      expect(inputElement.value).toBe('')
    })
  })

  describe('Cursor Position After Undo', () => {
    it('should restore cursor position after undo in input', () => {

      typeIn(inputElement, '/hello ')

      inputElement.dispatchEvent(getUndoEvent())

      // Cursor should be at start (empty field)
      expect(inputElement.selectionStart).toBe(0)
      expect(inputElement.selectionEnd).toBe(0)
    })

    it('should restore cursor position after undo in textarea', () => {

      typeIn(textareaElement, 'prefix /email ')

      textareaElement.dispatchEvent(getUndoEvent())

      expect(textareaElement.value).toBe('prefix ')
      expect(textareaElement.selectionStart).toBe(7)
    })
  })

  describe('Integration with Detection System', () => {
    it('should track undo even when detection is cancelled', () => {

      typeIn(inputElement, '/hello ')

      // Detection should be cancelled after commit
      expect(detector.getState().active).toBe(false)

      // But undo history should still exist
      expect(detector.getUndoHistoryLength()).toBe(1)

      inputElement.dispatchEvent(getUndoEvent())

      expect(inputElement.value).toBe('')
    })

    it('should not interfere with native browser undo when no macro history', () => {

      typeIn(inputElement, 'regular typing')

      // Should allow default browser behavior
      const result = inputElement.dispatchEvent(getUndoEvent())
      expect(result).toBe(true) // Not prevented
    })
  })

  describe('Event Dispatching', () => {
    it('should dispatch input event after undo', () => {
      const inputListener = vi.fn()
      inputElement.addEventListener('input', inputListener)

      typeIn(inputElement, '/hello ')

      inputListener.mockClear()

      inputElement.dispatchEvent(getUndoEvent())

      // Should have dispatched input event
      expect(inputListener).toHaveBeenCalledTimes(1)
    })

    it('should prevent default when undo is handled', () => {

      typeIn(inputElement, '/hello ')

      const result = inputElement.dispatchEvent(getCancelableUndoEvent())

      // Should be prevented when undo was handled
      expect(result).toBe(false)
    })
  })

  describe('HTML Content Undo', () => {

    it('should undo HTML macro replacement in contentEditable element', () => {
      contentEditableDiv.focus()

      // Setup initial content and cursor position
      contentEditableDiv.textContent = ''
      const selection = window.getSelection()!
      const range = document.createRange()
      range.selectNodeContents(contentEditableDiv)
      range.collapse(false)
      selection.removeAllRanges()
      selection.addRange(range)

      // Type the HTML macro command and trigger it
      typeIn(contentEditableDiv, '/fir ')

      // Verify replacement happened with HTML content
      expect(contentEditableDiv.innerHTML).toContain('<strong>John Doe</strong>')
      expect(contentEditableDiv.innerHTML).toContain('<em>Software Developer</em>')
      expect(detector.getUndoHistoryLength()).toBe(1)

      // Try to undo
      const undoEvent = getUndoEvent()
      contentEditableDiv.dispatchEvent(undoEvent)

      // This should clear the replacement
      expect(contentEditableDiv.textContent).toBe('')
    })

    it('should undo HTML list macro replacement in contentEditable element', () => {
      contentEditableDiv.focus()

      // Setup initial content and cursor position
      contentEditableDiv.textContent = ''
      const selection = window.getSelection()!
      const range = document.createRange()
      range.selectNodeContents(contentEditableDiv)
      range.collapse(false)
      selection.removeAllRanges()
      selection.addRange(range)

      // Type the HTML list macro command and trigger it
      typeIn(contentEditableDiv, '/tasks ')

      // Verify replacement happened with HTML list content
      expect(contentEditableDiv.innerHTML).toContain('<ul>')
      expect(contentEditableDiv.innerHTML).toContain('<li>Review code</li>')
      expect(detector.getUndoHistoryLength()).toBe(1)

      // Try to undo
      const undoEvent = getUndoEvent()
      contentEditableDiv.dispatchEvent(undoEvent)

      // This should clear the replacement
      expect(contentEditableDiv.textContent).toBe('')
    })

    it('should handle plain text macros in contentEditable as before', () => {
      contentEditableDiv.focus()

      // Setup initial content and cursor position
      contentEditableDiv.textContent = ''
      const selection = window.getSelection()!
      const range = document.createRange()
      range.selectNodeContents(contentEditableDiv)
      range.collapse(false)
      selection.removeAllRanges()
      selection.addRange(range)

      // Type the plain text macro command and trigger it
      typeIn(contentEditableDiv, '/hello ')

      // Verify replacement happened with plain text content
      expect(contentEditableDiv.textContent).toBe('Hello, World!')
      expect(detector.getUndoHistoryLength()).toBe(1)

      // Try to undo
      const undoEvent = getUndoEvent()
      contentEditableDiv.dispatchEvent(undoEvent)

      // This should clear the replacement
      expect(contentEditableDiv.textContent).toBe('')
    })
  })
})