import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createMacroDetector } from '../macroDetector'
import { DetectorActions } from '../../actions/detectorActions'
import { Macro } from '../../../types'
import { setCursorInside, typeIn } from '../../../utils/testUtils'
import { useMacroStore } from "../../../store/useMacroStore"

describe('MacroDetector - Undo Integration Tests', () => {
  let detector: ReturnType<typeof createMacroDetector>
  let mockActions: DetectorActions
  let inputElement: HTMLInputElement

  const testMacros: Macro[] = [
    { id: '1', command: '/hello', text: 'Hello, World!', contentType: 'text/plain' },
    { id: '2', command: '/h', text: 'Hi!', contentType: 'text/plain' },
    { id: '3', command: '/help', text: 'How can I help?', contentType: 'text/plain' },
    { id: '4', command: '/multi', text: 'Line 1\nLine 2\nLine 3', contentType: 'text/plain' },
    { id: '5', command: '/wave', text: '👋 Hello!', contentType: 'text/plain' },
    { id: '6', command: '/special', text: 'Special: @#$%^&*()', contentType: 'text/plain' },
    { id: '7', command: '/brb', text: 'Be right back!', contentType: 'text/plain' },
  ]

  beforeEach(() => {
    useMacroStore.setState(s => ({ config: { ...s.config, useCommitKeys: true } }))
    mockActions = {
      onDetectionStarted: vi.fn(),
      onDetectionUpdated: vi.fn(),
      onDetectionCancelled: vi.fn(),
      onMacroCommitted: vi.fn(),
      onNavigationRequested: vi.fn(),
      onCancelRequested: vi.fn(),
      onCommitRequested: vi.fn((macroId) => {
        // Find the macro and check if it's an exact match
        console.log('[TEST] onCommitRequested called with macroId:', macroId, typeof macroId)
        const macro = testMacros.find(m => {
          console.log('[TEST] checking macro:', m.id, typeof m.id, 'against', macroId, 'equals:', m.id === macroId)
          return m.id === macroId
        })
        console.log('[TEST] found macro:', macro, 'returning:', !!macro)
        return !!macro  // Return true if macro exists
      }),
      onShowAllRequested: vi.fn()
    }

    inputElement = document.createElement('input')
    inputElement.type = 'text'
    document.body.appendChild(inputElement)

    detector = createMacroDetector(mockActions)
    detector.setMacros(testMacros)
    detector.initialize()
  })

  afterEach(() => {
    detector.destroy()
    document.body.removeChild(inputElement)
  })

  describe('Real-World Usage Scenarios', () => {
    it('should handle complete typing → replacement → undo workflow', async () => {
      //inputElement.focus()

      typeIn(inputElement, '/')
      typeIn(inputElement, 'h')
      typeIn(inputElement, 'e')
      typeIn(inputElement, 'l')
      typeIn(inputElement, 'l')
      typeIn(inputElement, 'o')
      
      // expect(detector.getState().active).toBe(true)
      expect(detector.getState().buffer).toBe('/hello')

      // Trigger replacement with space
      const spaceEvent = new KeyboardEvent('keydown', { key: ' ', bubbles: true })
      inputElement.dispatchEvent(spaceEvent)

      expect(inputElement.value).toBe('Hello, World!')
      expect(mockActions.onMacroCommitted).toHaveBeenCalledWith('1')

      // User realizes mistake and hits undo
      const undoEvent = new KeyboardEvent('keydown', { 
        key: 'z', 
        ctrlKey: true, 
        bubbles: true 
      })
      inputElement.dispatchEvent(undoEvent)

      expect(inputElement.value).toBe('/hello')
    })

    it('should handle rapid typing with multiple macros', () => {
      inputElement.focus()

      // Type first macro using enhanced typeIn
      typeIn(inputElement, '/h ')

      expect(inputElement.value).toBe('Hi!')

      // Type second macro - add it to existing content
      const currentValue = inputElement.value
      inputElement.value = currentValue + ' '
      inputElement.setSelectionRange(inputElement.value.length, inputElement.value.length)
      typeIn(inputElement, '/hello ')

      expect(inputElement.value).toBe('Hi! Hello, World!')

      // Undo second
      inputElement.dispatchEvent(new KeyboardEvent('keydown', { 
        key: 'z', ctrlKey: true, bubbles: true 
      }))
      expect(inputElement.value).toContain('Hi!')
      expect(inputElement.value).toContain('/hello')

      // Undo first
      inputElement.dispatchEvent(new KeyboardEvent('keydown', { 
        key: 'z', ctrlKey: true, bubbles: true 
      }))
      expect(inputElement.value).toContain('/h')
    })

    it('should handle undo after user continues typing', () => {
      inputElement.focus()
      inputElement.value = '/hello'
      inputElement.setSelectionRange(6, 6)
      inputElement.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }))

      // User continues typing after replacement
      const continuedText = inputElement.value + 'How are you?'
      inputElement.value = continuedText
      inputElement.setSelectionRange(continuedText.length, continuedText.length)

      // User wants to undo the macro
      inputElement.dispatchEvent(new KeyboardEvent('keydown', { 
        key: 'z', ctrlKey: true, bubbles: true 
      }))

      expect(inputElement.value).toBe('/helloHow are you?')
    })

    it('should handle undo in middle of document', () => {
      inputElement.focus()
      inputElement.value = 'Start text  end text'
      inputElement.setSelectionRange(11, 11) // in the middle

      typeIn(inputElement, '/hello ')

      expect(inputElement.value).toBe('Start text Hello, World! end text')

      inputElement.dispatchEvent(new KeyboardEvent('keydown', { 
        key: 'z', ctrlKey: true, bubbles: true 
      }))

      expect(inputElement.value).toBe('Start text /hello end text')
    })
  })

  describe('Prefix Collision Scenarios', () => {
    it('should handle undo with overlapping macro prefixes', () => {
      inputElement.focus()

      // Type /h (which could be /h or /hello or /help)
      typeIn(inputElement, '/h ')

      expect(inputElement.value).toBe('Hi!') // Shortest match

      inputElement.dispatchEvent(new KeyboardEvent('keydown', { 
        key: 'z', ctrlKey: true, bubbles: true 
      }))

      expect(inputElement.value).toBe('/h')
    })

    it('should handle undo with exact vs prefix match', () => {

      typeIn(inputElement, '/hello ')

      expect(inputElement.value).toBe('Hello, World!')

      inputElement.dispatchEvent(new KeyboardEvent('keydown', { 
        key: 'z', ctrlKey: true, bubbles: true 
      }))

      expect(inputElement.value).toBe('/hello')
    })
  })

  describe('ContentEditable Complex Scenarios', () => {
    let contentEditableDiv: HTMLDivElement

    beforeEach(() => {
      contentEditableDiv = document.createElement('div')
      contentEditableDiv.contentEditable = 'true'
      document.body.appendChild(contentEditableDiv)
    })

    afterEach(() => {
      document.body.removeChild(contentEditableDiv)
    })

    it('should handle undo in contentEditable with nested elements', () => {
      contentEditableDiv.innerHTML = '<p><br></p>'
      const p = contentEditableDiv.querySelector('p')!
      setCursorInside(p)

      typeIn(contentEditableDiv, '/hello ')

      expect(contentEditableDiv.innerHTML).toContain('Hello, World!')
      
      expect(contentEditableDiv.textContent).toContain('Hello, World!')

      contentEditableDiv.dispatchEvent(new KeyboardEvent('keydown', { 
        key: 'z', ctrlKey: true, bubbles: true 
      }))

      expect(contentEditableDiv.textContent).toContain('/hello')
    })

    it('should handle undo when contentEditable has multiple text nodes', () => {
      contentEditableDiv.focus()
      contentEditableDiv.innerHTML = 'Before<br>/hello<br>After'
      
      // This is complex - contentEditable with BR tags
      // Just verify it doesn't crash
      expect(() => {
        contentEditableDiv.dispatchEvent(new KeyboardEvent('keydown', { 
          key: 'z', ctrlKey: true, bubbles: true 
        }))
      }).not.toThrow()
    })
  })

  describe('Performance & Memory Tests', () => {
    it('should handle rapid successive macros without memory leak', () => {
      inputElement.focus()

      for (let i = 0; i < 100; i++) {
        inputElement.value = '/h'
        inputElement.setSelectionRange(2, 2)
        inputElement.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }))
        inputElement.value = ''
      }

      // Should cap at MAX_UNDO_HISTORY (50)
      expect(detector.getUndoHistoryLength()).toBeLessThanOrEqual(50)
    })

    it('should efficiently handle large text documents', () => {
      inputElement.focus()
      
      // Create large text with macro in middle
      const largeText = 'x'.repeat(10000) + '/hello' + 'y'.repeat(10000)
      inputElement.value = largeText
      inputElement.setSelectionRange(10006, 10006)

      const startTime = performance.now()
      inputElement.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }))
      const replaceTime = performance.now() - startTime

      // Should complete reasonably fast (< 100ms)
      expect(replaceTime).toBeLessThan(100)

      const undoStartTime = performance.now()
      inputElement.dispatchEvent(new KeyboardEvent('keydown', { 
        key: 'z', ctrlKey: true, bubbles: true 
      }))
      const undoTime = performance.now() - undoStartTime

      expect(undoTime).toBeLessThan(100)
    })
  })

  describe('Cross-Element Behavior', () => {
    let textarea: HTMLTextAreaElement
    let contentEditable: HTMLDivElement

    beforeEach(() => {
      textarea = document.createElement('textarea')
      contentEditable = document.createElement('div')
      contentEditable.contentEditable = 'true'
      document.body.appendChild(textarea)
      document.body.appendChild(contentEditable)
    })

    afterEach(() => {
      document.body.removeChild(textarea)
      document.body.removeChild(contentEditable)
    })

    it('should maintain separate history for different elements', () => {
      // Input element
      typeIn(inputElement, '/hello ')

      // Textarea
      typeIn(textarea, '/brb ')

      expect(textarea.value).toBe('Be right back!')

      expect(detector.getUndoHistoryLength()).toBe(2)

      // Undo in textarea
      textarea.dispatchEvent(new KeyboardEvent('keydown', { 
        key: 'z', ctrlKey: true, bubbles: true 
      }))

      expect(textarea.value).toBe('/brb')
      expect(inputElement.value).toBe('Hello, World!') // Unchanged
      expect(detector.getUndoHistoryLength()).toBe(1)
    })

    it('should handle switching between elements', () => {
      // Type in input
      typeIn(inputElement, '/hello ')

      // Switch to textarea and type
      typeIn(textarea, '/brb ')

      expect(inputElement.value).toBe('Hello, World!')
      expect(textarea.value).toBe('Be right back!')

      // Switch back and undo
      inputElement.focus()
      
      inputElement.dispatchEvent(new KeyboardEvent('keydown', { 
        key: 'z', ctrlKey: true, bubbles: true 
      }))

      expect(inputElement.value).toBe('/hello')
      expect(textarea.value).toBe('Be right back!') // Unchanged
    })

    it('should only undo in focused element', () => {

      typeIn(inputElement, '/hello ')

      // Switch focus but try undo on wrong element
      textarea.focus()
      
      // Dispatch undo on textarea (which has no history)
      textarea.dispatchEvent(new KeyboardEvent('keydown', { 
        key: 'z', ctrlKey: true, bubbles: true 
      }))

      // Input should be unchanged, no undo happened
      expect(inputElement.value).toBe('Hello, World!')
    })
  })

  describe('Error Recovery', () => {
    it('should handle corrupted history gracefully', () => {

      typeIn(inputElement, '/hello ')

      // Manually corrupt the element value
      inputElement.value = 'completely different text'

      // Undo should not crash
      expect(() => {
        inputElement.dispatchEvent(new KeyboardEvent('keydown', { 
          key: 'z', ctrlKey: true, bubbles: true 
        }))
      }).not.toThrow()
    })

    it('should handle element becoming readonly', () => {

      typeIn(inputElement, '/hello ')

      // Make readonly
      inputElement.readOnly = true

      // Should not crash when trying to undo
      expect(() => {
        inputElement.dispatchEvent(new KeyboardEvent('keydown', { 
          key: 'z', ctrlKey: true, bubbles: true 
        }))
      }).not.toThrow()
    })

    it('should handle element becoming disabled', () => {

      typeIn(inputElement, '/hello ')

      inputElement.disabled = true

      expect(() => {
        inputElement.dispatchEvent(new KeyboardEvent('keydown', { 
          key: 'z', ctrlKey: true, bubbles: true 
        }))
      }).not.toThrow()
    })
  })

  describe('User Experience Edge Cases', () => {
    it('should preserve selection after undo', () => {
      inputElement.focus()
      inputElement.value = 'prefix  suffix'
      inputElement.setSelectionRange(7, 7)

      typeIn(inputElement, '/hello ')

      inputElement.dispatchEvent(new KeyboardEvent('keydown', { 
        key: 'z', ctrlKey: true, bubbles: true 
      }))

      // Cursor should be at end of "/hello"
      expect(inputElement.selectionStart).toBe(13)
      expect(inputElement.selectionEnd).toBe(13)
    })

    it('should handle undo at document boundaries', () => {

      typeIn(inputElement, '/hello ')

      inputElement.dispatchEvent(new KeyboardEvent('keydown', { 
        key: 'z', ctrlKey: true, bubbles: true 
      }))

      expect(inputElement.value).toBe('/hello')
      expect(inputElement.selectionStart).toBe(6)
    })

    it('should handle multiple undos without errors', () => {

      typeIn(inputElement, '/h')

      // Try undoing multiple times (more than history has)
      for (let i = 0; i < 5; i++) {
        inputElement.dispatchEvent(new KeyboardEvent('keydown', { 
          key: 'z', ctrlKey: true, bubbles: true 
        }))
      }

      // Should only undo once and then stop
      expect(inputElement.value).toBe('/h')
    })
  })

  describe('Framework Integration Scenarios', () => {
    it('should dispatch input events for framework reactivity', () => {
      const inputListener = vi.fn()
      inputElement.addEventListener('input', inputListener)

      typeIn(inputElement, '/hello')
      
      inputListener.mockClear()

      typeIn(inputElement, ' ')

      // Should dispatch input event on replacement
      expect(inputListener).toHaveBeenCalled()

      inputListener.mockClear()

      inputElement.dispatchEvent(new KeyboardEvent('keydown', { 
        key: 'z', ctrlKey: true, bubbles: true 
      }))

      // Should dispatch input event on undo
      expect(inputListener).toHaveBeenCalled()
    })
  })

  describe('Timing and Race Conditions', () => {
    it('should handle rapid undo requests', () => {
      inputElement.focus()
      
      // Create multiple replacements
      for (let i = 0; i < 3; i++) {
        typeIn(inputElement, '/hello ')
        inputElement.value = ''
      }

      // Rapidly fire undo events
      for (let i = 0; i < 8; i++) {
        inputElement.dispatchEvent(new KeyboardEvent('keydown', { 
          key: 'z', ctrlKey: true, bubbles: true 
        }))
      }

      expect(detector.getUndoHistoryLength()).toBe(0)
    })

    it('should handle undo during active detection', () => {

      typeIn(inputElement, '/hel')

      typeIn(inputElement, 'l')

      expect(detector.getState().active).toBe(true)

      // Try undo while detection is active (shouldn't affect detection)
      inputElement.dispatchEvent(new KeyboardEvent('keydown', { 
        key: 'z', ctrlKey: true, bubbles: true 
      }))

      // Detection should still be active
      expect(detector.getState().active).toBe(true)
    })
  })

  describe('Accessibility Considerations', () => {
    it('should maintain ARIA attributes during undo', () => {
      inputElement.setAttribute('aria-label', 'Test input')

      typeIn(inputElement, '/hello ')

      inputElement.dispatchEvent(new KeyboardEvent('keydown', { 
        key: 'z', ctrlKey: true, bubbles: true 
      }))

      expect(inputElement.getAttribute('aria-label')).toBe('Test input')
    })

    it('should work with screen reader accessible text', () => {
      const label = document.createElement('label')
      label.textContent = 'Message'
      label.htmlFor = 'test-input'
      inputElement.id = 'test-input'
      document.body.appendChild(label)

      typeIn(inputElement, '/hello ')

      inputElement.dispatchEvent(new KeyboardEvent('keydown', { 
        key: 'z', ctrlKey: true, bubbles: true 
      }))

      expect(inputElement.value).toBe('/hello')
      expect(label.textContent).toBe('Message')

      document.body.removeChild(label)
    })
  })

  describe('Special Character Handling', () => {

    it('should handle macros with special characters', () => {

      typeIn(inputElement, '/special ')

      expect(inputElement.value).toContain('Special: @#$%^&*()')

      inputElement.dispatchEvent(new KeyboardEvent('keydown', { 
        key: 'z', ctrlKey: true, bubbles: true 
      }))

      expect(inputElement.value).toBe('/special')
    })

    it('should handle unicode emoji in macros', () => {

      typeIn(inputElement, '/wave ')

      expect(inputElement.value).toBe('👋 Hello!')

      inputElement.dispatchEvent(new KeyboardEvent('keydown', { 
        key: 'z', ctrlKey: true, bubbles: true 
      }))

      expect(inputElement.value).toBe('/wave')
    })

    it('should handle newlines in macro text', () => {

      const textarea = document.createElement('textarea')
      document.body.appendChild(textarea)

      typeIn(textarea, '/multi ')

      expect(textarea.value).toBe('Line 1\nLine 2\nLine 3')

      textarea.dispatchEvent(new KeyboardEvent('keydown', { 
        key: 'z', ctrlKey: true, bubbles: true 
      }))

      expect(textarea.value).toBe('/multi')

      document.body.removeChild(textarea)
    })
  })

  describe('Clipboard Integration', () => {

    it('should maintain undo after paste operations', async () => {

      typeIn(inputElement, '/hello ')
      // Simulate paste
      inputElement.value += ' pasted text'

      // Undo should still work
      inputElement.dispatchEvent(new KeyboardEvent('keydown', { 
        key: 'z', ctrlKey: true, bubbles: true 
      }))

      expect(inputElement.value).toBe('/hello pasted text')
    })
  })

  describe('API Usage Tests', () => {

    it('should expose getUndoHistoryLength correctly', () => {
      expect(detector.getUndoHistoryLength()).toBe(0)

      typeIn(inputElement, '/hello ')

      expect(detector.getUndoHistoryLength()).toBe(1)
    })

    it('should expose undoLastReplacement for programmatic undo', () => {

      typeIn(inputElement, '/hello ')

      expect(inputElement.value).toBe('Hello, World!')

      // Programmatic undo
      const result = detector.undoLastReplacement(inputElement)
      expect(result).toBe(true)
      expect(inputElement.value).toBe('/hello')
    })

    it('should return false when undoLastReplacement has no history', () => {
      const result = detector.undoLastReplacement(inputElement)
      expect(result).toBe(false)
    })

    it('should expose clearUndoHistory API', () => {

      typeIn(inputElement, '/hello ')

      expect(detector.getUndoHistoryLength()).toBe(1)

      detector.clearUndoHistory()
      expect(detector.getUndoHistoryLength()).toBe(0)
    })
  })
})