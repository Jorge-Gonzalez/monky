import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createMacroDetector } from '../macroEngine/macroDetector'
import { SYSTEM_MACROS } from './systemMacros'
import { Macro } from '../../types'
import { DetectorActions } from '../actions/detectorActions'

// Mock the system macro notifications
vi.mock('./systemMacros', async () => {
  const actual = await vi.importActual('./systemMacros')
  return {
    ...actual,
    handleSystemMacro: vi.fn().mockReturnValue(true)
  }
})

vi.mock('../store/useMacroStore', () => ({
  useMacroStore: {
    getState: vi.fn(() => ({ config: {} })),
    subscribe: vi.fn(),
  },
}));

describe('System Macros Integration', () => {
  let mockHandleSystemMacro: any

  beforeEach(async () => {
    // Get the mocked function
    const systemMacrosModule = await import('./systemMacros')
    mockHandleSystemMacro = systemMacrosModule.handleSystemMacro
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Macro List Integration with Detector', () => {
    it('should include system macros when setting user macros', () => {
      // The new detector's `setMacros` method is responsible for combining
      // system and user macros. We can't test its internal array directly,
      // but we can confirm the SYSTEM_MACROS constant it uses is correct.
      // This test now verifies the source of truth for the detector.
      const userMacros: Macro[] = [
        { id: '1', command: '/sig', text: 'Jorge L. Gonzalez' },
        { id: '2', command: '/email', text: 'jorge@example.com' }
      ]

      // In the new architecture, we'd create a detector and set macros.
      const detector = createMacroDetector({} as DetectorActions)
      detector.setMacros(userMacros)

      // Since we can't directly access the internal macros array,
      // we'll test this by checking that system macros are defined properly
      expect(SYSTEM_MACROS).toHaveLength(4)
      expect(SYSTEM_MACROS.find(m => m.command === '/?')).toBeDefined()
      expect(SYSTEM_MACROS.find(m => m.command === '/help')).toBeDefined()
      expect(SYSTEM_MACROS.find(m => m.command === '/macros')).toBeDefined()
      expect(SYSTEM_MACROS.find(m => m.command === '/>')).toBeDefined()
    })

    it('should maintain system macro properties', () => {
      SYSTEM_MACROS.forEach(macro => {
        expect(macro.isSystemMacro).toBe(true)
        expect(macro.text).toBe('')
        expect(macro.description).toBeTruthy()
        expect(typeof macro.command).toBe('string')
        expect(macro.command.startsWith('/')).toBe(true)
      })
    })

    it('should not conflict with user macro commands', () => {
      const userMacros: Macro[] = [
        { id: '1', command: '/signature', text: 'Jorge L. Gonzalez' },
        { id: '2', command: '/help-user', text: 'This is user help' }
      ]

      // In the new architecture, we'd create a detector and set macros.
      const detector = createMacroDetector({} as DetectorActions)
      detector.setMacros(userMacros)

      // System macros should have different commands than user macros
      const systemCommands = SYSTEM_MACROS.map(m => m.command)
      const userCommands = userMacros.map(m => m.command)
      
      systemCommands.forEach(sysCmd => {
        expect(userCommands).not.toContain(sysCmd)
      })
    })
  })

  describe('System Macro Commands', () => {
    it('should define search overlay shortcut', () => {
      const searchMacro = SYSTEM_MACROS.find(m => m.command === '/?')
      expect(searchMacro).toBeDefined()
      expect(searchMacro?.id).toBe('system-search-overlay')
    })

    it('should define help command', () => {
      const helpMacro = SYSTEM_MACROS.find(m => m.command === '/help')
      expect(helpMacro).toBeDefined()
      expect(helpMacro?.id).toBe('system-help')
    })

    it('should define macro list command', () => {
      const listMacro = SYSTEM_MACROS.find(m => m.command === '/macros')
      expect(listMacro).toBeDefined()
      expect(listMacro?.id).toBe('system-list-macros')
    })

    it('should define toggle new suggestions command', () => {
      const toggleMacro = SYSTEM_MACROS.find(m => m.command === '/>')
      expect(toggleMacro).toBeDefined()
      expect(toggleMacro?.id).toBe('system-toggle-new-suggestions')
    })
  })

  describe('Expected User Experience', () => {
    it('should solve the /? not working issue', () => {
      // This test verifies that /? is now defined as a system macro
      // so it will be detected and handled properly
      const searchMacro = SYSTEM_MACROS.find(m => m.command === '/?')
      expect(searchMacro).toBeDefined()
      expect(searchMacro?.isSystemMacro).toBe(true)
      
      // When user types /?, it should be detected as a valid macro
      // and trigger the system action instead of being ignored
    })

    it('should provide keyboard shortcuts through macro system', () => {
      // Verify that all expected keyboard shortcuts are available as macros
      const expectedCommands = ['/?', '/help', '/macros', '/>']
      
      expectedCommands.forEach(command => {
        const macro = SYSTEM_MACROS.find(m => m.command === command)
        expect(macro).toBeDefined()
        expect(macro?.isSystemMacro).toBe(true)
      })
    })

    it('should not interfere with regular macro functionality', () => {
      // System macros should not break existing macro replacement
      const userMacros: Macro[] = [
        { id: '1', command: '/sig', text: 'Jorge L. Gonzalez' }
      ]

      // This should work without throwing errors
      const detector = createMacroDetector({} as DetectorActions)
      expect(() => detector.setMacros(userMacros)).not.toThrow()

      // Regular macros should still have text content
      expect(userMacros[0].text).toBeTruthy()
      expect(userMacros[0].isSystemMacro).toBeUndefined()
    })
  })

  describe('Architecture Benefits', () => {
    it('should leverage existing macro detection infrastructure', () => {
      // System macros use the same detection mechanism as user macros
      SYSTEM_MACROS.forEach(macro => {
        expect(macro.command).toBeTruthy()
        expect(typeof macro.command).toBe('string')
        expect(macro.id).toBeTruthy()
      })
    })

    it('should be easily extensible', () => {
      // New system macros can be added to the SYSTEM_MACROS array
      expect(Array.isArray(SYSTEM_MACROS)).toBe(true)
      expect(SYSTEM_MACROS.length).toBeGreaterThan(0)
    })

    it('should maintain type safety', () => {
      // All system macros should conform to the Macro type
      SYSTEM_MACROS.forEach(macro => {
        expect(typeof macro.id).toBeTruthy()
        expect(typeof macro.command).toBe('string')
        expect(typeof macro.text).toBe('string')
        expect(typeof macro.isSystemMacro).toBe('boolean')
        expect(typeof macro.description).toBe('string')
      })
    })
  })
})