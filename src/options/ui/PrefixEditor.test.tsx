// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { useMacroStore } from '../../store/useMacroStore'
import { PrefixEditor } from './PrefixEditor'

// Mock the store consistently with other tests
const mockSetPrefixes = vi.fn()
// Mock the store
const mockState = {
  config: { prefixes: ['/'] },
  setPrefixes: mockSetPrefixes,
}

vi.mock('../../store/useMacroStore', () => ({
  // This mock now handles calls with or without a selector.
  useMacroStore: vi.fn().mockImplementation(selector => (selector ? selector(mockState) : mockState)),
}))

describe('PrefixEditor Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    render(<PrefixEditor />)
    expect(screen.getByText('Configurar Prefijos')).toBeInTheDocument()
  })

  it('loads existing prefixes in the input', () => {
    render(<PrefixEditor />)
    const input = screen.getByPlaceholderText('Ejemplo: /,;')
    expect(input).toHaveValue('/')
  })

  it('calls setPrefixes with correctly parsed values', () => {
    render(<PrefixEditor />)

    const input = screen.getByPlaceholderText('Ejemplo: /,;')
    const saveButton = screen.getByText('Guardar Prefijos')

    // Test case 1: Standard input
    fireEvent.change(input, { target: { value: '/,;' } })
    fireEvent.click(saveButton)
    expect(mockSetPrefixes).toHaveBeenCalledWith(['/', ';'])

    // Test case 2: Input with extra spaces
    fireEvent.change(input, { target: { value: ' / , ; ' } })
    fireEvent.click(saveButton)
    expect(mockSetPrefixes).toHaveBeenCalledWith(['/', ';'])

    // Test case 3: Input with empty segments from extra commas
    fireEvent.change(input, { target: { value: ',/,,;' } })
    fireEvent.click(saveButton)
    expect(mockSetPrefixes).toHaveBeenCalledWith(['/', ';'])

    // Test case 4: Single prefix
    fireEvent.change(input, { target: { value: '#' } })
    fireEvent.click(saveButton)
    expect(mockSetPrefixes).toHaveBeenCalledWith(['#'])

    // Test case 5: Empty input
    fireEvent.change(input, { target: { value: '' } })
    fireEvent.click(saveButton)
    expect(mockSetPrefixes).toHaveBeenCalledWith([])
  })
})