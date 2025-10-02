import { describe, it, expect, vi } from 'vitest'
import { getErrorMessage } from './errors'
import { t } from './i18n'

// Mock i18n translations
vi.mock('./i18n', () => ({
  t: vi.fn((key, params) => {
    if (key === 'errors.duplicateCommand' && params?.command) {
      return `The command "${params.command}" already exists. Please choose another.`
    }
    return 'An unexpected error occurred. Please try again.'
  })
}))

describe('errors', () => {
  describe('getErrorMessage', () => {
    it('returns localized duplicate command error for existing command errors', () => {
      const result = getErrorMessage('El comando "/test" ya existe.', '/test')
      
      expect(result).toBe('The command "/test" already exists. Please choose another.')
      expect(t).toHaveBeenCalledWith('errors.duplicateCommand', { command: '/test' })
    })

    it('returns localized unexpected error for other errors', () => {
      const result = getErrorMessage('Some other error message', '/test')
      
      expect(result).toBe('An unexpected error occurred. Please try again.')
      expect(t).toHaveBeenCalledWith('errors.unexpected')
    })

    it('handles empty error messages gracefully', () => {
      const result = getErrorMessage('', 'command')
      
      expect(result).toBe('An unexpected error occurred. Please try again.')
    })

    it('handles partial matches for duplicate command errors', () => {
      const result = getErrorMessage('ya existe', 'command')
      
      expect(result).toBe('The command "command" already exists. Please choose another.')
    })

    it('is case-sensitive when checking for duplicate command errors', () => {
      const result = getErrorMessage('YA EXISTE', 'command')
      
      expect(result).toBe('An unexpected error occurred. Please try again.')
    })
  })
})