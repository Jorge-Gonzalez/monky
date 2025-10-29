import { describe, it, expect } from 'vitest'
import { isPrintableKey, UNSUPPORTED_KEYS } from './keyUtils'

describe('keyUtils', () => {
  describe('isPrintableKey', () => {
    it('returns true for printable single character keys', () => {
      const event = { ctrlKey: false, metaKey: false, altKey: false, key: 'a' } as KeyboardEvent
      expect(isPrintableKey(event)).toBe(true)
    })

    it('returns false for control keys', () => {
      const event = { ctrlKey: true, metaKey: false, altKey: false, key: 'a' } as KeyboardEvent
      expect(isPrintableKey(event)).toBe(false)
    })

    it('returns false for meta keys', () => {
      const event = { ctrlKey: false, metaKey: true, altKey: false, key: 'a' } as KeyboardEvent
      expect(isPrintableKey(event)).toBe(false)
    })

    it('returns false for alt keys', () => {
      const event = { ctrlKey: false, metaKey: false, altKey: true, key: 'a' } as KeyboardEvent
      expect(isPrintableKey(event)).toBe(false)
    })

    it('returns false for special keys', () => {
      const event = { ctrlKey: false, metaKey: false, altKey: false, key: 'Enter' } as KeyboardEvent
      expect(isPrintableKey(event)).toBe(false)
    })

    it('returns false for multi-character keys', () => {
      const event = { ctrlKey: false, metaKey: false, altKey: false, key: 'Tab' } as KeyboardEvent
      expect(isPrintableKey(event)).toBe(false)
    })
  })

  describe('UNSUPPORTED_KEYS', () => {
    it('contains a list of navigation and special keys', () => {
      expect(UNSUPPORTED_KEYS).toContain('ArrowLeft')
      expect(UNSUPPORTED_KEYS).toContain('ArrowRight')
      expect(UNSUPPORTED_KEYS).toContain('ArrowUp')
      expect(UNSUPPORTED_KEYS).toContain('ArrowDown')
      expect(UNSUPPORTED_KEYS).toContain('Home')
      expect(UNSUPPORTED_KEYS).toContain('End')
      expect(UNSUPPORTED_KEYS).toContain('PageUp')
      expect(UNSUPPORTED_KEYS).toContain('PageDown')
      expect(UNSUPPORTED_KEYS).toContain('Escape')
      expect(UNSUPPORTED_KEYS).toContain('Delete')
    })

    it('has the expected number of unsupported keys', () => {
      expect(UNSUPPORTED_KEYS).toHaveLength(10)
    })
  })
})