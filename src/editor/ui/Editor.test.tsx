// @vitest-environment jsdom
import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import Editor from './Editor'

// Mock child components to isolate the Editor component's logic.
vi.mock('./MacroForm', () => ({
  default: ({ editing, onDone }: { editing: any, onDone: () => void }) => (
    <div>
      <span>MacroForm</span>
      {/* Mock behavior for interaction testing */}
      <button onClick={onDone}>Done</button>
      <div data-testid="editing-state">{editing ? JSON.stringify(editing) : 'null'}</div>
    </div>
  ),
}))
vi.mock('./Settings', () => ({ default: () => <div>Settings Component</div> }))
vi.mock('./MacroListEditor', () => ({
  default: ({ macros, onEdit }: { macros: any[], onEdit: (m: any) => void }) => (
    <div>
      <span>MacroListEditor</span>
      {/* Mock behavior for interaction testing */}
      <button onClick={() => onEdit(macros[0])}>Edit</button>
    </div>
  ),
}))

// Mock dependencies
vi.mock('../../lib/i18n', () => ({
  t: (key: string) => key,
}))

// Mock the new useEditorManager hook
let mockManager: any;

vi.mock('../managers/useEditorManager', () => ({
  // This mock now returns a stable 'mockManager' instance.
  useEditorManager: () => mockManager,
}))

vi.mock('../../store/useMacroStore', () => {
  const mockMacros = [
    { id: 1, command: '/brb', text: 'Be right back' },
    { id: 2, command: ';omw', text: 'On my way' },
  ]
  const mockState = {
    macros: mockMacros,
    config: { language: 'es' }, // Add default config
    addMacro: vi.fn(),
    updateMacro: vi.fn(),
    deleteMacro: vi.fn(),
    setLanguage: vi.fn(),
  }
  
  // Mock store with the methods that zustand provides
  const mockSubscribe = vi.fn()
  const mockGetState = vi.fn(() => mockState)
  
  const useMacroStore = vi.fn().mockImplementation(selector => selector(mockState))
  useMacroStore.subscribe = mockSubscribe
  useMacroStore.getState = mockGetState
  
  return { useMacroStore }
})

describe('Editor Component', () => {
  beforeEach(() => {
    let subscribers: any[] = [];
    vi.clearAllMocks();

    // Create a fresh, stable mock manager for each test.
    const state = {
      editingMacro: null,
      macros: [
        { id: 1, command: '/brb', text: 'Be right back' },
        { id: 2, command: ';omw', text: 'On my way' },
      ],
      settings: { language: 'es' },
      error: null,
    };

    mockManager = {
      setEditingMacro: vi.fn((macro) => { 
        state.editingMacro = macro;
        subscribers.forEach(cb => cb({ ...state })); // Notify subscribers with a new object
      }),
      resetForm: vi.fn(() => { 
        state.editingMacro = null; 
        subscribers.forEach(cb => cb({ ...state })); // Notify subscribers with a new object
      }),
      updateSettings: vi.fn(),
      getState: vi.fn(() => state),
      subscribe: vi.fn((callback) => {
        subscribers.push(callback);
        // Return an unsubscribe function
        return () => { subscribers = subscribers.filter(sub => sub !== callback); };
      }),
    };
  })

  it('renders all main sections', () => {
    render(<Editor />)
    expect(screen.getByText('editor.title')).toBeInTheDocument()
    expect(screen.getByText('MacroForm')).toBeInTheDocument()
    expect(screen.getByText('Settings Component')).toBeInTheDocument()
    expect(screen.getByText('MacroListEditor')).toBeInTheDocument()
  })

  it('updates the form when an item is selected for editing and resets it when done', async () => {
    // 1. Initial Render
    render(<Editor />)

    // Assert initial state: The mock MacroForm should display 'null' as there is no macro being edited.
    expect(screen.getByTestId('editing-state')).toHaveTextContent('null')

    // 2. User clicks "Edit"
    const editButton = screen.getByRole('button', { name: 'Edit' })
    // Use `act` to ensure all state updates from the click event are processed
    await act(async () => {
      fireEvent.click(editButton)
    })

    // Assert that the manager was called correctly
    expect(mockManager.setEditingMacro).toHaveBeenCalledWith(mockManager.getState().macros[0])

    // Assert UI update: The mock MacroForm should now display the JSON of the macro being edited.
    expect(screen.getByTestId('editing-state')).toHaveTextContent(JSON.stringify(mockManager.getState().editingMacro))

    // 3. User clicks "Done"
    const doneButton = screen.getByRole('button', { name: 'Done' })
    await act(async () => {
      fireEvent.click(doneButton)
    })

    // Assert that the manager was called to reset the form
    expect(mockManager.resetForm).toHaveBeenCalled()

    // Assert UI update: The mock MacroForm should have reverted to displaying 'null'.
    expect(screen.getByTestId('editing-state')).toHaveTextContent('null')
  })
})