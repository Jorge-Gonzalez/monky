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

// Mock the new useEditor hook
const mockHandleEdit = vi.fn()
const mockHandleDone = vi.fn()
let mockEditingMacro: any = null

vi.mock('../hooks/useEditor', () => ({
  useEditor: () => ({
    editingMacro: mockEditingMacro,
    handleEdit: mockHandleEdit,
    handleDone: mockHandleDone,
  }),
}))

const mockMacros = [{ id: 1, command: '/brb', text: 'Be right back' }]

vi.mock('../../store/useMacroStore', () => {
  const mockMacros = [
    { id: 1, command: '/brb', text: 'Be right back' },
    { id: 2, command: ';omw', text: 'On my way' },
  ]
  const mockState = {
    macros: mockMacros,
    config: {},
    addMacro: vi.fn(),
    updateMacro: vi.fn(),
    deleteMacro: vi.fn(),
  }
  const useMacroStore = vi.fn().mockImplementation(selector => selector(mockState))
  return { useMacroStore }
})

describe('Editor Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders all main sections', () => {
    mockEditingMacro = null
    render(<Editor />)
    expect(screen.getByText('editor.title')).toBeInTheDocument()
    expect(screen.getByText('MacroForm')).toBeInTheDocument()
    expect(screen.getByText('Settings Component')).toBeInTheDocument()
    expect(screen.getByText('MacroListEditor')).toBeInTheDocument()
  })

  it('handles the editing state between MacroListEditor and MacroForm', async () => {
    mockEditingMacro = null
    const { rerender } = render(<Editor />)
    // Initially, nothing is being edited
    expect(screen.getByTestId('editing-state')).toHaveTextContent('null')

    // Simulate clicking the "Edit" button in the mocked MacroListEditor
    const editButton = screen.getByRole('button', { name: 'Edit' })
    act(() => {
      fireEvent.click(editButton)
    })

    // The component's onEdit prop should call the hook's handleEdit
    expect(mockHandleEdit).toHaveBeenCalledWith(mockMacros[0])

    // Check that the editing state is passed to MacroForm
    // To simulate this, we'll re-render with the new state
    mockEditingMacro = mockMacros[0]
    rerender(<Editor />)
    expect(screen.getByTestId('editing-state')).toHaveTextContent(JSON.stringify(mockMacros[0]))

    // Simulate the form being "done"
    const doneButton = screen.getByRole('button', { name: 'Done' })
    fireEvent.click(doneButton)
    expect(mockHandleDone).toHaveBeenCalled()
  })
})