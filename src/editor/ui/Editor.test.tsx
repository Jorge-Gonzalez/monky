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
vi.mock('./MacroPanel', () => ({
  MacroPanel: ({ macros, onEdit }: any) => (
    <div>
      <span>MacroPanel</span>
      <button onClick={() => onEdit(macros[0])}>Edit</button>
    </div>
  ),
}))

const mockMacros = [
  { id: 1, command: '/brb', text: 'Be right back' },
  { id: 2, command: ';omw', text: 'On my way' },
]
vi.mock('../../store/useMacroStore', () => ({
  useMacroStore: (selector: any) => selector({ macros: mockMacros }),
}))

describe('Editor page', () => {
  it('renders the title, the form and the macro panel', () => {
    render(<Editor />)
    expect(screen.getByText('editor.pageTitle')).toBeInTheDocument()
    expect(screen.getByText('MacroForm')).toBeInTheDocument()
    expect(screen.getByText('MacroPanel')).toBeInTheDocument()
  })

  it('carries no settings', () => {
    // Settings live on the options page. A page that both edits a macro and configures the
    // extension is two pages, and this one is the editor.
    render(<Editor />)
    expect(screen.queryByText(/[Ss]ettings/)).not.toBeInTheDocument()
  })

  it('lays the form and the panel out as two columns that are allowed to wrap', () => {
    // The stacking is intrinsic: each column has a minimum inline size and the row may wrap,
    // so no breakpoint is named anywhere. Losing `wrap-allowed` would leave the columns
    // squeezing past their minimums rather than stacking, and jsdom computes no layout, so
    // this is the only place that failure is visible to a test.
    const { container } = render(<Editor />)
    const columns = container.querySelector('[data-component="editor-columns"]')
    expect(columns?.className).toContain('horizontal')
    expect(columns?.className).toContain('wrap-allowed')
    expect(container.querySelector('[data-component="editor-form-column"]')?.className).toContain(
      'min-width-lg'
    )
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
