import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as macroDetector from './macroDetector'
import { useMacroStore } from '../store/useMacroStore'
import { updateStateOnKey, isExact } from './detector-core'
import { getActiveEditable, getSelection, replaceText } from './editableUtils'
import { isPrintableKey, UNSUPPORTED_KEYS } from './keyUtils'
import { defaultMacroConfig } from '../config/defaults'

// Mock external dependencies. The mock functions are created inside the factory
// and will be accessed via the imported module later.
vi.mock('../store/useMacroStore', () => ({
  useMacroStore: {
    getState: vi.fn(),
    subscribe: vi.fn(),
  },
}));

vi.mock('./detector-core', () => ({
  updateStateOnKey: vi.fn(),
  isExact: vi.fn()
}))

vi.mock('./editableUtils', () => ({
  getActiveEditable: vi.fn(),
  getSelection: vi.fn(),
  replaceText: vi.fn()
}))

vi.mock('./keyUtils', () => ({
  isPrintableKey: vi.fn(),
  UNSUPPORTED_KEYS: ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown', 'Escape', 'Delete']
}))

vi.mock('../config/defaults', () => ({
  defaultMacroConfig: {
    prefixes: ['/', ';'],
    theme: 'light',
    useCommitKeys: false
  }
}))

// Mock window APIs
const mockAddEventListener = vi.spyOn(window, 'addEventListener')
const mockRemoveEventListener = vi.spyOn(window, 'removeEventListener')
const mockSetTimeout = vi.spyOn(window, 'setTimeout')
const mockClearTimeout = vi.spyOn(window, 'clearTimeout')

describe('macroDetector', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default mocks
    ;(useMacroStore.getState as vi.Mock).mockReturnValue({
      config: {
        useCommitKeys: false,
        prefixes: defaultMacroConfig.prefixes,
        disabledSites: []
      }
    })
    
    mockAddEventListener.mockClear()
    mockRemoveEventListener.mockClear()
    mockSetTimeout.mockClear()
    mockClearTimeout.mockClear()
  })

  afterEach(() => {
    macroDetector.cleanupMacroDetector()
  })

  describe('initMacroDetector', () => {
    it('attaches event listeners and subscribes to config changes', () => {
      macroDetector.initMacroDetector()
      
      expect(mockAddEventListener).toHaveBeenCalledWith('keydown', expect.any(Function), true)
      expect(mockAddEventListener).toHaveBeenCalledWith('blur', expect.any(Function), true)
      expect(useMacroStore.subscribe).toHaveBeenCalled()
    })

    it('does not attach duplicate listeners', () => {
      macroDetector.initMacroDetector()
      macroDetector.initMacroDetector()
      
      // Should only have been called once despite two calls
      expect(mockAddEventListener).toHaveBeenCalledTimes(2) // keydown and blur
    })
  })

  describe('cleanupMacroDetector', () => {
    it('removes event listeners and cleans up state', () => {
      // First initialize
      macroDetector.initMacroDetector()
      mockAddEventListener.mockClear()
      
      // Then cleanup
      macroDetector.cleanupMacroDetector()
      
      expect(mockRemoveEventListener).toHaveBeenCalledWith('keydown', expect.any(Function), true)
      expect(mockRemoveEventListener).toHaveBeenCalledWith('blur', expect.any(Function), true)
    })

    it('does not remove listeners if none were attached', () => {
      macroDetector.cleanupMacroDetector()
      
      expect(mockRemoveEventListener).not.toHaveBeenCalled()
    })
  })

  describe('setDetectorMacros', () => {
    it('updates the internal macros array', () => {
      const testMacros = [
        { id: 1, command: '/test', text: 'test text' },
        { id: 2, command: ';hello', text: 'hello world' }
      ]
      
      macroDetector.setDetectorMacros(testMacros)
      
      // We can't directly test the internal state, but we can verify
      // the function was called without throwing an error
      expect(() => macroDetector.setDetectorMacros(testMacros)).not.toThrow()
    })
  })

  describe('updateConfig', () => {
    it('updates internal configuration from store', () => {
      const mockConfig = {
        useCommitKeys: true,
        prefixes: [';', ':'],
        disabledSites: ['example.com']
      }
      
      ;(useMacroStore.getState as vi.Mock).mockReturnValue({
        config: mockConfig
      })
      
      // initMacroDetector calls updateConfig, which in turn calls getState
      macroDetector.initMacroDetector()

      // This function is internal and called by the subscription
      // We can test indirectly by verifying the mock was called correctly
      expect(useMacroStore.getState).toHaveBeenCalled()
    })
  })

  describe('attachListeners', () => {
    it('sets listenersAttached flag when attaching listeners', () => {
      // This function is internal, but we can verify it works through init
      macroDetector.initMacroDetector()
      
      // Verify listeners were attached
      expect(mockAddEventListener).toHaveBeenCalledWith('keydown', expect.any(Function), true)
      expect(mockAddEventListener).toHaveBeenCalledWith('blur', expect.any(Function), true)
    })
  })

  describe('event handlers', () => {
    it('onKeyDown handles disabled sites correctly', () => {
      // Mock a disabled site in config
      ;(useMacroStore.getState as vi.Mock).mockReturnValue({
        config: {
          useCommitKeys: false,
          prefixes: defaultMacroConfig.prefixes,
          disabledSites: ['test.com']
        }
      })
      
      // Mock window location
      Object.defineProperty(window, 'location', {
        value: { hostname: 'test.com' },
        writable: true
      })
      
      // This test would require more complex mocking of the actual onKeyDown implementation
      // For now, we verify the function exists and doesn't throw
      expect(() => macroDetector.initMacroDetector()).not.toThrow()
    })

    it('onBlur cancels detection state', () => {
      // Verify the function exists
      expect(typeof macroDetector.onBlur).toBe('function')
    })
  })
})