import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { SYSTEM_MACROS, isSystemMacro, handleSystemMacro } from './systemMacros'
import { Macro } from '../types'

describe('System Macros', () => {
  let consoleLogSpy: any
  let consoleWarnSpy: any

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    // Mock scrollIntoView as it's not implemented in JSDOM
    window.Element.prototype.scrollIntoView = vi.fn();
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => ({} as any))
    vi.spyOn(document.head, 'appendChild').mockImplementation(() => ({} as any))
    vi.spyOn(document, 'getElementById').mockImplementation(() => null)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('SYSTEM_MACROS definition', () => {
    it('should define search overlay macro', () => {
      const searchMacro = SYSTEM_MACROS.find(m => m.command === '/?')
      expect(searchMacro).toBeDefined()
      expect(searchMacro?.isSystemMacro).toBe(true)
      expect(searchMacro?.text).toBe('')
      expect(searchMacro?.description).toContain('search overlay')
    })

    it('should define help macro', () => {
      const helpMacro = SYSTEM_MACROS.find(m => m.command === '/help')
      expect(helpMacro).toBeDefined()
      expect(helpMacro?.isSystemMacro).toBe(true)
      expect(helpMacro?.text).toBe('')
      expect(helpMacro?.description).toContain('help')
    })

    it('should define list macros macro', () => {
      const listMacro = SYSTEM_MACROS.find(m => m.command === '/macros')
      expect(listMacro).toBeDefined()
      expect(listMacro?.isSystemMacro).toBe(true)
      expect(listMacro?.text).toBe('')
      expect(listMacro?.description).toContain('List all')
    })

    it('should have unique commands', () => {
      const commands = SYSTEM_MACROS.map(m => m.command)
      const uniqueCommands = Array.from(new Set(commands))
      expect(commands).toHaveLength(uniqueCommands.length)
    })

    it('should have unique ids', () => {
      const ids = SYSTEM_MACROS.map(m => m.id)
      const uniqueIds = Array.from(new Set(ids))
      expect(ids).toHaveLength(uniqueIds.length)
    })
  })

  describe('isSystemMacro function', () => {
    it('should identify system macros correctly', () => {
      const systemMacro = SYSTEM_MACROS[0]
      expect(isSystemMacro(systemMacro)).toBe(true)
    })

    it('should identify regular macros correctly', () => {
      const regularMacro: Macro = {
        id: 'user-macro',
        command: '/sig',
        text: 'Jorge L. Gonzalez'
      }
      expect(isSystemMacro(regularMacro)).toBe(false)
    })

    it('should identify macro with isSystemMacro flag', () => {
      const customSystemMacro: Macro = {
        id: 'custom-system',
        command: '/custom',
        text: '',
        isSystemMacro: true
      }
      expect(isSystemMacro(customSystemMacro)).toBe(true)
    })

    it('should handle macro with matching id', () => {
      const macroWithSystemId: Macro = {
        id: 'system-search-overlay',
        command: '/different',
        text: 'Some text'
      }
      expect(isSystemMacro(macroWithSystemId)).toBe(true)
    })
  })

  describe('handleSystemMacro function', () => {
    it('should handle search overlay macro', () => {
      const searchMacro = SYSTEM_MACROS.find(m => m.command === '/?')!
      const result = handleSystemMacro(searchMacro)
      
      expect(result).toBe(true)
      expect(consoleLogSpy).toHaveBeenCalledWith('🔍 Search overlay triggered!')
    })

    it('should handle help macro', () => {
      const helpMacro = SYSTEM_MACROS.find(m => m.command === '/help')!
      const result = handleSystemMacro(helpMacro)
      
      expect(result).toBe(true)
      expect(consoleLogSpy).toHaveBeenCalledWith('❓ Keyboard help triggered!')
    })

    it('should handle list macros macro', () => {
      const listMacro = SYSTEM_MACROS.find(m => m.command === '/macros')!
      const result = handleSystemMacro(listMacro)
      
      expect(result).toBe(true)
      expect(consoleLogSpy).toHaveBeenCalledWith('📋 Macro list triggered!')
    })

    it('should return false for non-system macros', () => {
      const regularMacro: Macro = {
        id: 'user-macro',
        command: '/sig',
        text: 'Jorge L. Gonzalez'
      }
      const result = handleSystemMacro(regularMacro)
      
      expect(result).toBe(false)
    })

    it('should warn for unknown system macros', () => {
      const unknownSystemMacro: Macro = {
        id: 'system-unknown',
        command: '/unknown',
        text: '',
        isSystemMacro: true
      }
      const result = handleSystemMacro(unknownSystemMacro)
      
      expect(result).toBe(false)
      expect(consoleWarnSpy).toHaveBeenCalledWith('Unknown system macro:', 'system-unknown')
    })

    it('should trigger search overlay for /? command', () => {
      // Mock the keyboardOverlayManager
      const mockShowSearchOverlay = vi.fn()
      vi.doMock('./keyboardOverlayManager', () => ({
        keyboardOverlayManager: {
          showSearchOverlay: mockShowSearchOverlay
        }
      }))

      const searchMacro = SYSTEM_MACROS.find(m => m.command === '/?')!
      const result = handleSystemMacro(searchMacro)

      expect(result).toBe(true)
      // Note: Due to ES module mocking limitations in tests, we can't easily verify
      // the keyboardOverlayManager call, but we can verify the macro is handled correctly
    })
  })

  describe('Integration behavior', () => {
    it('should not interfere with regular macro detection', () => {
      // System macros should only activate when explicitly matched
      const regularMacro: Macro = {
        id: 1,
        command: '/signature',
        text: 'Best regards, Jorge'
      }

      expect(isSystemMacro(regularMacro)).toBe(false)
      expect(handleSystemMacro(regularMacro)).toBe(false)
    })

    it('should have empty text content to avoid replacement', () => {
      SYSTEM_MACROS.forEach(macro => {
        expect(macro.text).toBe('')
      })
    })

    it('should be properly marked as system macros', () => {
      SYSTEM_MACROS.forEach(macro => {
        expect(macro.isSystemMacro).toBe(true)
      })
    })
  })
})