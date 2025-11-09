// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import Settings from './Settings'
import { EditorCoordinator } from '../coordinators/editorCoordinator'

// Mock the i18n function
vi.mock('../../lib/i18n', () => ({
  t: (key: string) => key,
}))

// Helper to create a mock coordinator
const createMockCoordinator = (initialLanguage: 'en' | 'es' = 'en'): EditorCoordinator => {
  const state = {
    macros: [],
    editingMacro: null,
    settings: { language: initialLanguage },
    error: null,
  }
  return {
    getState: vi.fn(() => state),
    updateSettings: vi.fn(),
    // Add other coordinator methods as mocks if needed for more complex tests
    createMacro: vi.fn(),
    updateMacro: vi.fn(),
    deleteMacro: vi.fn(),
    getEditingMacro: vi.fn(),
    setEditingMacro: vi.fn(),
    resetForm: vi.fn(),
    subscribe: vi.fn(() => () => {}),
    attach: vi.fn(),
    detach: vi.fn(),
    enable: vi.fn(),
    disable: vi.fn(),
    isEnabled: vi.fn(() => true),
    destroy: vi.fn(),
  }
}

describe('Settings Component', () => {
  let mockCoordinator: EditorCoordinator;

  beforeEach(() => {
    vi.clearAllMocks();
    mockCoordinator = createMockCoordinator('en');
  });

  it('renders without crashing', () => {
    render(<Settings coordinator={mockCoordinator} language="en" />)
    expect(screen.getByText('settings.title')).toBeInTheDocument()
  })

  it('renders language settings section', () => {
    render(<Settings coordinator={mockCoordinator} language="en" />)
    
    expect(screen.getByText('settings.language')).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('displays the correct initial language from the manager', () => {
    render(<Settings coordinator={mockCoordinator} language="en" />)
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('en');
  });

  it('calls manager.updateSettings when the language is changed', () => {
    render(<Settings coordinator={mockCoordinator} language="en" />)
    const select = screen.getByRole('combobox');

    fireEvent.change(select, { target: { value: 'es' } });

    expect(mockCoordinator.updateSettings).toHaveBeenCalledWith({ language: 'es' });
  });
})