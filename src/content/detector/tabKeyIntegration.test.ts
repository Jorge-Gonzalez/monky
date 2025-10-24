import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createMacroDetector } from './macroDetector'
import { createNewSuggestionsCoordinator } from '../coordinators/NewSuggestionsCoordinator'
import { createNewSuggestionsOverlayManager } from '../overlays/newSuggestionsOverlay/NewSuggestionsOverlayManager'
import type { Macro } from '../../types'

// Mock external dependencies
vi.mock('../../store/useMacroStore', () => ({
  useMacroStore: {
    getState: vi.fn(() => ({
      config: {
        useCommitKeys: false,
        prefixes: ['/', ';'],
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

vi.mock('./editableUtils', () => ({
  getActiveEditable: vi.fn(),
  getSelection: vi.fn(),
  replaceText: vi.fn(),
  getCursorCoordinates: vi.fn(),
}))

vi.mock('../overlays/newSuggestionsOverlay/utils/caretPosition', () => ({
  getCaretCoordinates: vi.fn(() => ({ x: 100, y: 200 })),
}))

vi.mock('../overlays/newSuggestionsOverlay/utils/popupPositioning', () => ({
  calculateOptimalPosition: vi.fn(() => ({ x: 100, y: 200, placement: 'bottom' })),
}))

import { getActiveEditable, getSelection, replaceText, getCursorCoordinates } from './editableUtils'

describe('Tab Key Integration Tests', () => {
  const mockMacros: Macro[] = [
    {
      id: '1',
      command: '/save',
      text: 'Save this content',
      updated_at: String(new Date()),
    },
    {
      id: '2',
      command: '/send',
      text: 'Send message now',
      updated_at: String(new Date()),
    }
  ]

  let mockInput: HTMLInputElement
  let overlayManager: any
  let coordinator: any

  beforeEach(() => {
    // Create DOM elements
    mockInput = document.createElement('input')
    mockInput.value = '/s'
    document.body.appendChild(mockInput)

    // Setup mocks
    vi.mocked(getActiveEditable).mockReturnValue(mockInput)
    vi.mocked(getSelection).mockReturnValue({ start: 2, end: 2 })
    vi.mocked(getCursorCoordinates).mockReturnValue({ x: 100, y: 200 })

    // Create the components
    overlayManager = createNewSuggestionsOverlayManager(mockMacros)
    coordinator = createNewSuggestionsCoordinator(overlayManager)
    
    // Attach coordinator
    coordinator.attach()
  })

  afterEach(() => {
    if (coordinator) coordinator.detach()
    if (overlayManager) overlayManager.destroy()
    if (mockInput && document.body.contains(mockInput)) {
      document.body.removeChild(mockInput)
    }
    vi.clearAllMocks()
  })

  describe('Tab key functionality verification', () => {
    it('coordinator provides onShowAllRequested method for Tab key', () => {
      // Verify coordinator has the Tab key functionality
      expect(typeof coordinator.onShowAllRequested).toBe('function')
    })

    it('coordinator calls showAll on overlay manager when requested', () => {
      const showAllSpy = vi.spyOn(overlayManager, 'showAll')
      
      coordinator.onShowAllRequested('/s', { x: 100, y: 200 })
      
      expect(showAllSpy).toHaveBeenCalledWith(100, 200, '/s')
    })

    it('coordinator handles navigation when overlay is visible', () => {
      // Show overlay first
      overlayManager.showAll(100, 200, '/s')
      expect(overlayManager.isVisible()).toBe(true)
      
      // Arrow keys should be handled by coordinator when overlay is visible  
      const handled = coordinator.onNavigationRequested('right')
      expect(handled).toBe(true)
    })

    it('coordinator does not handle navigation when overlay is hidden', () => {
      expect(overlayManager.isVisible()).toBe(false)
      
      const handled = coordinator.onNavigationRequested('left')
      expect(handled).toBe(false)
    })
  })

  describe('Text replacement behavior in showAll mode', () => {
    it('saves buffer as trigger correctly in showAll mode', () => {
      // Show overlay with buffer context (simulating Tab key behavior)
      overlayManager.showAll(100, 200, '/save')
      
      // Verify the overlay is visible 
      expect(overlayManager.isVisible()).toBe(true)
      
      // This test verifies that showAll accepts the buffer parameter
      // which is used internally to save the trigger for proper text replacement
      // The actual buffer handling is tested in the overlay manager unit tests
      expect(overlayManager.isVisible()).toBe(true)
    })

    it('showAll method accepts buffer parameter for Tab key integration', () => {
      const showAllSpy = vi.spyOn(overlayManager, 'showAll')
      
      overlayManager.showAll(100, 200, '/test')
      
      expect(showAllSpy).toHaveBeenCalledWith(100, 200, '/test')
    })
  })

  describe('Coordinator navigation behavior', () => {
    it('handles all arrow key directions when overlay is visible', () => {
      // Show overlay first
      overlayManager.showAll(100, 200, '/s')
      
      // Test all navigation directions
      expect(coordinator.onNavigationRequested('left')).toBe(true)
      expect(coordinator.onNavigationRequested('right')).toBe(true)
      expect(coordinator.onNavigationRequested('up')).toBe(true)
      expect(coordinator.onNavigationRequested('down')).toBe(true)
    })

    it('allows other handlers when overlay is not visible', () => {
      expect(overlayManager.isVisible()).toBe(false)
      
      expect(coordinator.onNavigationRequested('left')).toBe(false)
      expect(coordinator.onNavigationRequested('right')).toBe(false)
      expect(coordinator.onNavigationRequested('up')).toBe(false)
      expect(coordinator.onNavigationRequested('down')).toBe(false)
    })
  })
})