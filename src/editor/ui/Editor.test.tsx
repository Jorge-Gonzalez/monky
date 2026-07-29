// @vitest-environment jsdom
import { render, screen, fireEvent, act } from '@testing-library/preact'
import { describe, it, expect, vi } from 'vitest'
import Editor from './Editor'

vi.mock('../../lib/i18n', () => ({ t: (key: string) => key }))

vi.mock('./MacroForm', () => ({
  default: ({ editing, onDone }: any) => (
    <div>
      <span>MacroForm</span>
      <button onClick={onDone}>Done</button>
      <div data-testid="editing-state">{editing ? JSON.stringify(editing) : 'null'}</div>
    </div>
  ),
}))
vi.mock('./Settings', () => ({ default: () => <div>Settings Component</div> }))
vi.mock('./MacroListEditor', () => ({
  default: ({ macros, onEdit }: any) => (
    <div>
      <span>MacroListEditor</span>
      <button onClick={() => onEdit(macros[0])}>Edit</button>
    </div>
  ),
}))
vi.mock('../../store/macroCrud', () => ({ deleteMacros: vi.fn() }))

const mockMacros = [
  { id: 1, command: '/brb', text: 'Be right back' },
  { id: 2, command: ';omw', text: 'On my way' },
]
vi.mock('../../store/useMacroStore', () => ({
  useMacroStore: (selector: any) => selector({ macros: mockMacros }),
}))

describe('Editor page', () => {
  it('renders all main sections', () => {
    render(<Editor />)
    expect(screen.getByText('editor.pageTitle')).toBeInTheDocument()
    expect(screen.getByText('MacroForm')).toBeInTheDocument()
    expect(screen.getByText('Settings Component')).toBeInTheDocument()
    expect(screen.getByText('MacroListEditor')).toBeInTheDocument()
  })

  it('loads a macro for editing on Edit and clears it on Done', async () => {
    render(<Editor />)
    expect(screen.getByTestId('editing-state')).toHaveTextContent('null')

    await act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
    })
    expect(screen.getByTestId('editing-state')).toHaveTextContent(JSON.stringify(mockMacros[0]))

    await act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Done' }))
    })
    expect(screen.getByTestId('editing-state')).toHaveTextContent('null')
  })
})
