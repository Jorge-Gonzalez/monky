// @vitest-environment jsdom
import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useMacroStore } from '../../store/useMacroStore'
import { PrefixEditor } from './PrefixEditor'

// Mock the i18n function
vi.mock('../../lib/i18n', () => ({
  t: (key: string) => key,
}))

// Mock the store
const mockSetPrefixes = vi.fn()

vi.mock('../../store/useMacroStore', () => ({
  useMacroStore: vi.fn(),
}))

describe('PrefixEditor Component', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    // Set up the mock for each test to ensure isolation
    ;(useMacroStore as vi.Mock).mockImplementation(selector => {
      const state = {
        config: { prefixes: ['/', '#'] },
        setPrefixes: mockSetPrefixes,
      }
      return selector(state)
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders without crashing', () => {
    render(<PrefixEditor />)
    expect(screen.getByText('options.prefixEditor.title')).toBeInTheDocument()
    expect(screen.getByText('options.prefixEditor.description')).toBeInTheDocument()
  })

  it('renders buttons and sets the correct aria-checked state', () => {
    render(<PrefixEditor />)
    const slashButton = screen.getByRole('switch', { name: '/' })
    const hashButton = screen.getByRole('switch', { name: '#' })
    const semicolonButton = screen.getByRole('switch', { name: ';' })

    expect(slashButton).toHaveAttribute('aria-checked', 'true')
    expect(hashButton).toHaveAttribute('aria-checked', 'true')
    expect(semicolonButton).toHaveAttribute('aria-checked', 'false')
  })

  it('calls setPrefixes with the new array when a prefix is added', () => {
    render(<PrefixEditor />)
    const semicolonButton = screen.getByRole('switch', { name: ';' })
    fireEvent.click(semicolonButton)
    expect(mockSetPrefixes).toHaveBeenCalledWith(['/', '#', ';'])
  })
  it('calls setPrefixes with the new array when a prefix is removed', () => {
    render(<PrefixEditor />)
    const slashButton = screen.getByRole('switch', { name: '/' })
    fireEvent.click(slashButton)
    expect(mockSetPrefixes).toHaveBeenCalledWith(['#'])
  })

  it('does not allow removing the last prefix', () => {
    // Arrange: Override the mock to have only one prefix
    ;(useMacroStore as vi.Mock).mockImplementation(selector => {
      const state = {
        config: { prefixes: ['/'] },
        setPrefixes: mockSetPrefixes,
      }
      return selector(state)
    })

    render(<PrefixEditor />)
    const slashButton = screen.getByRole('switch', { name: '/' })
    expect(slashButton).toHaveAttribute('aria-checked', 'true')

    // Act: Try to uncheck the last prefix
    fireEvent.click(slashButton)
    expect(mockSetPrefixes).not.toHaveBeenCalled()
  })

  it('provides visual feedback when trying to remove the last prefix', () => {
    // Arrange: Override the mock to have only one prefix
    ;(useMacroStore as vi.Mock).mockImplementation(selector => {
      const state = {
        config: { prefixes: ['/'] },
        setPrefixes: mockSetPrefixes,
      }
      return selector(state)
    })

    render(<PrefixEditor />)
    const slashButton = screen.getByRole('switch', { name: '/' })

    // Act: Try to uncheck the last prefix
    fireEvent.click(slashButton)

    // Assert: The error class is applied
    expect(slashButton).toHaveClass('animate-shake')
    act(() => {
      vi.advanceTimersByTime(500)
    })
    expect(slashButton).not.toHaveClass('animate-shake')
  })
})