// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import Settings from './Settings'
import { EditorManager } from '../managers/createEditorManager'

// Mock the i18n function
vi.mock('../../lib/i18n', () => ({
  t: (key: string) => key,
}))

// Helper to create a mock manager
const createMockManager = (initialLanguage: 'en' | 'es' = 'en'): EditorManager => {
  const state = {
    macros: [],
    editingMacro: null,
    settings: { language: initialLanguage },
    error: null,
  }
  return {
    getState: vi.fn(() => state),
    updateSettings: vi.fn(),
    // Add other manager methods as mocks if needed for more complex tests
    createMacro: vi.fn(),
    updateMacro: vi.fn(),
    deleteMacro: vi.fn(),
    getEditingMacro: vi.fn(),
    setEditingMacro: vi.fn(),
    resetForm: vi.fn(),
    subscribe: vi.fn(() => () => {}),
  }
}

describe('Settings Component', () => {
  let mockManager: EditorManager;

  beforeEach(() => {
    vi.clearAllMocks();
    mockManager = createMockManager('en');
  });

  it('renders without crashing', () => {
    render(<Settings manager={mockManager} language="en" />)
    expect(screen.getByText('settings.title')).toBeInTheDocument()
  })

  it('renders language settings section', () => {
    render(<Settings manager={mockManager} language="en" />)
    
    expect(screen.getByText('settings.language')).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('displays the correct initial language from the manager', () => {
    render(<Settings manager={mockManager} language="en" />)
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('en');
  });

  it('calls manager.updateSettings when the language is changed', () => {
    render(<Settings manager={mockManager} language="en" />)
    const select = screen.getByRole('combobox');

    fireEvent.change(select, { target: { value: 'es' } });

    expect(mockManager.updateSettings).toHaveBeenCalledWith({ language: 'es' });
  });
})