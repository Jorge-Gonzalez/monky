import { t } from './i18n'

export function getErrorMessage(error: string, command: string): string {
  if (error.includes('ya existe')) {
    return t('errors.duplicateCommand', { command })
  }
  // Fallback for other potential errors
  return t('errors.unexpected')
}