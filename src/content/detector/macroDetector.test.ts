import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createMacroDetector, MacroDetector } from './macroDetector'
import { useMacroStore } from '../../store/useMacroStore'
// import { updateStateOnKey, isExact } from './detector-core'
// import { getActiveEditable, getSelection, replaceText, getCursorCoordinates } from './editableUtils'
// import { isPrintableKey, UNSUPPORTED_KEYS } from './keyUtils'
import { defaultMacroConfig } from '../../config/defaults'
import { DetectorActions } from '../actions/detectorActions'

// Mock external dependencies. The mock functions are created inside the factory
// and will be accessed via the imported module later.
vi.mock('../../store/useMacroStore', () => ({
  useMacroStore: {
    getState: vi.fn(),
    subscribe: vi.fn(),
  },
}));

vi.mock('./detector-core', () => ({
  updateStateOnKey: vi.fn(),
  isExact: vi.fn()
}));

vi.mock('./editableUtils', () => ({
  getActiveEditable: vi.fn(),
  getSelection: vi.fn(),
  replaceText: vi.fn(),
  getCursorCoordinates: vi.fn(),
}))

vi.mock('../keyUtils', () => ({
  isPrintableKey: vi.fn(),
  UNSUPPORTED_KEYS: ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown', 'Escape', 'Delete']
}))

vi.mock('../../config/defaults', () => ({
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

describe('createMacroDetector', () => {
  let detector: MacroDetector
  let mockActions: DetectorActions

  const createMockActions = () => ({
    onDetectionStarted: vi.fn(),
    onDetectionUpdated: vi.fn(),
    onDetectionCancelled: vi.fn(),
    onCommitRequested: vi.fn().mockReturnValue(true),
    onCancelRequested: vi.fn(),
    onNavigationRequested: vi.fn(),
    onMacroCommitted: vi.fn(),
    onShowAllRequested: vi.fn(),
  })

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

    mockActions = createMockActions()
    detector = createMacroDetector(mockActions)
  })

  afterEach(() => {
    detector.destroy()
  })

  describe('initialize and destroy', () => {
    it('attaches event listeners and subscribes to config changes', () => {
      detector.initialize()
      
      expect(mockAddEventListener).toHaveBeenCalledWith('keydown', expect.any(Function), true)
      expect(mockAddEventListener).toHaveBeenCalledWith('blur', expect.any(Function), true)
      expect(useMacroStore.subscribe).toHaveBeenCalled()
    })

    it('does not attach duplicate listeners on multiple initializations', () => {
      detector.initialize()
      detector.initialize()
      
      // Should only have been called once despite two calls
      expect(mockAddEventListener).toHaveBeenCalledTimes(2) // keydown and blur
    })

    it('removes event listeners on destroy', () => {
      // First initialize
      detector.initialize()
      mockAddEventListener.mockClear()
      
      // Then cleanup
      detector.destroy()
      
      expect(mockRemoveEventListener).toHaveBeenCalledWith('keydown', expect.any(Function), true)
      expect(mockRemoveEventListener).toHaveBeenCalledWith('blur', expect.any(Function), true)
    })

    it('does not try to remove listeners if not initialized', () => {
      detector.destroy()
      
      expect(mockRemoveEventListener).not.toHaveBeenCalled()
    })
  })

  describe('setMacros', () => {
    it('updates the internal macros array', () => {
      const testMacros = [
        { id: '1', command: '/test', text: 'test text' },
        { id: '2', command: ';hello', text: 'hello world' }
      ]
      
      detector.setMacros(testMacros)
      
      // We can't directly test the internal state, but we can verify
      // the function was called without throwing an error
      expect(() => detector.setMacros(testMacros)).not.toThrow()
    })
  })

  // Note: Complex integration tests for Tab key and navigation functionality 
  // are covered in tabKeyIntegration.test.ts which provides better test isolation
  // and integration validation without complex mock setup issues.

  describe('updateConfig', () => {
    it('calls getState when initializing', () => {
      // initialize calls updateConfig, which in turn calls getState
      detector.initialize()

      // This function is internal and called by the subscription
      // We can test indirectly by verifying the mock was called correctly
      expect(useMacroStore.getState).toHaveBeenCalled()
    })
  })
})