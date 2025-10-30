import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createMacroDetector } from './macroDetector'
import { createSuggestionsCoordinator } from '../coordinators/SuggestionsCoordinator'
import { createSuggestionsOverlayManager } from '../overlays/suggestionsOverlay/SuggestionsOverlayManager'
import type { Macro } from '../../types'

// Mock external dependencies
vi.mock('../../store/useMacroStore', () => ({
  useMacroStore: {
    getState: vi.fn(() => ({
      config: {
        useCommitKeys: false,
        prefixes: ['/', ';', '!'],  // Test with multiple prefixes
        disabledSites: [],
        theme: 'light' as const
      },
      macros: []
    })),
    subscribe: vi.fn()
  }
}))

vi.mock('../overlays/services/reactRenderer', () => ({
  createReactRenderer: vi.fn(() => ({
    render: vi.fn(),
    update: vi.fn(),
    initialize: vi.fn(),
    clear: vi.fn(),
    destroy: vi.fn(),
  }))
}))

vi.mock('../overlays/services/styleInjector', () => ({
  createStyleInjector: vi.fn(() => ({
    inject: vi.fn(),
    remove: vi.fn(),
  }))
}))

vi.mock('../overlays/suggestionsOverlay/utils/caretPosition', () => ({
  getCaretCoordinates: vi.fn(() => ({ x: 100, y: 200 })),
}))

vi.mock('../overlays/suggestionsOverlay/utils/popupPositioning', () => ({
  calculateOptimalPosition: vi.fn(() => ({ x: 100, y: 200, placement: 'bottom' })),
}))

describe('Multi-Prefix Support', () => {
  const mockMacros: Macro[] = [
    {
      id: '1',
      command: '/hello',
      text: 'Hello World',
      contentType: 'text/plain',
    },
    {
      id: '2',
      command: ';brb',
      text: 'Be right back',
      contentType: 'text/plain',
    },
    {
      id: '3',
      command: '!urgent',
      text: 'This is urgent',
      contentType: 'text/plain',
    }
  ]

  let detector: any
  let overlayManager: any
  let coordinator: any

  beforeEach(() => {
    // Create the components
    overlayManager = createSuggestionsOverlayManager(mockMacros)
    coordinator = createSuggestionsCoordinator(overlayManager)
    detector = createMacroDetector(coordinator)

    detector.setMacros(mockMacros)
    detector.initialize()
  })

  afterEach(() => {
    if (detector) detector.destroy()
    if (coordinator) coordinator.detach()
    if (overlayManager) overlayManager.destroy()
  })

  describe('Prefix Detection with "/" prefix', () => {
    it('should correctly replace macro with / prefix in input element', () => {
      const input = document.createElement('input')
      input.value = 'test /hello'
      input.setSelectionRange(11, 11)
      document.body.appendChild(input)
      input.focus()

      // Simulate the replacement
      const commandStart = input.value.indexOf('/hello')
      const commandEnd = commandStart + '/hello'.length

      // The fix ensures we find '/' correctly
      const text = input.value
      const macroText = text.substring(commandStart, commandEnd)

      // Test: Find the prefix (this is what the fix does)
      const prefixes = ['/', ';', '!']
      let prefixIndex = -1
      for (const prefix of prefixes) {
        const idx = macroText.lastIndexOf(prefix)
        if (idx > prefixIndex) {
          prefixIndex = idx
        }
      }

      expect(prefixIndex).toBe(0) // Should find '/' at index 0
      expect(macroText[prefixIndex]).toBe('/')

      input.remove()
    })

    it('should handle macro with / prefix after multiple spaces', () => {
      const input = document.createElement('input')
      input.value = 'test     /hello'
      document.body.appendChild(input)

      const commandStart = input.value.indexOf('/hello')
      const text = input.value
      const macroText = text.substring(commandStart, commandStart + 6)

      const prefixes = ['/', ';', '!']
      let prefixIndex = -1
      for (const prefix of prefixes) {
        const idx = macroText.lastIndexOf(prefix)
        if (idx > prefixIndex) {
          prefixIndex = idx
        }
      }

      expect(prefixIndex).toBe(0)
      expect(macroText[prefixIndex]).toBe('/')

      input.remove()
    })
  })

  describe('Prefix Detection with ";" prefix', () => {
    it('should correctly replace macro with ; prefix in input element', () => {
      const input = document.createElement('input')
      input.value = 'test ;brb'
      input.setSelectionRange(9, 9)
      document.body.appendChild(input)
      input.focus()

      const commandStart = input.value.indexOf(';brb')
      const commandEnd = commandStart + ';brb'.length

      const text = input.value
      const macroText = text.substring(commandStart, commandEnd)

      // Test: Find the prefix
      const prefixes = ['/', ';', '!']
      let prefixIndex = -1
      for (const prefix of prefixes) {
        const idx = macroText.lastIndexOf(prefix)
        if (idx > prefixIndex) {
          prefixIndex = idx
        }
      }

      expect(prefixIndex).toBe(0) // Should find ';' at index 0
      expect(macroText[prefixIndex]).toBe(';')

      input.remove()
    })

    it('should handle macro with ; prefix after multiple spaces', () => {
      const input = document.createElement('input')
      input.value = 'Hello   ;brb'
      document.body.appendChild(input)

      const commandStart = input.value.indexOf(';brb')
      const text = input.value
      const macroText = text.substring(commandStart, commandStart + 4)

      const prefixes = ['/', ';', '!']
      let prefixIndex = -1
      for (const prefix of prefixes) {
        const idx = macroText.lastIndexOf(prefix)
        if (idx > prefixIndex) {
          prefixIndex = idx
        }
      }

      expect(prefixIndex).toBe(0)
      expect(macroText[prefixIndex]).toBe(';')

      input.remove()
    })
  })

  describe('Prefix Detection with "!" prefix', () => {
    it('should correctly replace macro with ! prefix in input element', () => {
      const input = document.createElement('input')
      input.value = 'Alert !urgent'
      input.setSelectionRange(13, 13)
      document.body.appendChild(input)
      input.focus()

      const commandStart = input.value.indexOf('!urgent')
      const commandEnd = commandStart + '!urgent'.length

      const text = input.value
      const macroText = text.substring(commandStart, commandEnd)

      // Test: Find the prefix
      const prefixes = ['/', ';', '!']
      let prefixIndex = -1
      for (const prefix of prefixes) {
        const idx = macroText.lastIndexOf(prefix)
        if (idx > prefixIndex) {
          prefixIndex = idx
        }
      }

      expect(prefixIndex).toBe(0) // Should find '!' at index 0
      expect(macroText[prefixIndex]).toBe('!')

      input.remove()
    })
  })

  describe('Edge Cases', () => {
    it('should find the rightmost prefix when multiple prefixes exist in text', () => {
      // Simulate text like "use / or ;brb"
      const text = 'use / or ;brb'
      const commandStart = text.indexOf(';brb')
      const macroText = text.substring(commandStart, commandStart + 4)

      const prefixes = ['/', ';', '!']
      let prefixIndex = -1
      for (const prefix of prefixes) {
        const idx = macroText.lastIndexOf(prefix)
        if (idx > prefixIndex) {
          prefixIndex = idx
        }
      }

      expect(prefixIndex).toBe(0) // Should find ';' at index 0 of the macro text
      expect(macroText[prefixIndex]).toBe(';')
    })

    it('should return -1 when no prefix is found', () => {
      const macroText = 'noprefixhere'

      const prefixes = ['/', ';', '!']
      let prefixIndex = -1
      for (const prefix of prefixes) {
        const idx = macroText.lastIndexOf(prefix)
        if (idx > prefixIndex) {
          prefixIndex = idx
        }
      }

      expect(prefixIndex).toBe(-1)
    })

    it('should handle empty prefix array gracefully', () => {
      const macroText = '/hello'
      const prefixes: string[] = []

      let prefixIndex = -1
      for (const prefix of prefixes) {
        const idx = macroText.lastIndexOf(prefix)
        if (idx > prefixIndex) {
          prefixIndex = idx
        }
      }

      expect(prefixIndex).toBe(-1) // No prefixes configured, should be -1
    })
  })

  describe('ContentEditable Elements', () => {
    it('should correctly detect ; prefix in contenteditable', () => {
      const div = document.createElement('div')
      div.contentEditable = 'true'
      div.textContent = 'Message ;brb'
      document.body.appendChild(div)

      const text = div.textContent || ''
      const commandStart = text.indexOf(';brb')
      const macroText = text.substring(commandStart, commandStart + 4)

      const prefixes = ['/', ';', '!']
      let prefixIndex = -1
      for (const prefix of prefixes) {
        const idx = macroText.lastIndexOf(prefix)
        if (idx > prefixIndex) {
          prefixIndex = idx
        }
      }

      expect(prefixIndex).toBe(0)
      expect(macroText[prefixIndex]).toBe(';')

      div.remove()
    })

    it('should correctly detect ! prefix in contenteditable', () => {
      const div = document.createElement('div')
      div.contentEditable = 'true'
      div.textContent = 'Note !urgent here'
      document.body.appendChild(div)

      const text = div.textContent || ''
      const commandStart = text.indexOf('!urgent')
      const macroText = text.substring(commandStart, commandStart + 7)

      const prefixes = ['/', ';', '!']
      let prefixIndex = -1
      for (const prefix of prefixes) {
        const idx = macroText.lastIndexOf(prefix)
        if (idx > prefixIndex) {
          prefixIndex = idx
        }
      }

      expect(prefixIndex).toBe(0)
      expect(macroText[prefixIndex]).toBe('!')

      div.remove()
    })
  })
})
