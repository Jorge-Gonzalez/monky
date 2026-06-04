// @vitest-environment jsdom
import { render, screen, fireEvent, act } from '@testing-library/preact'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import PrefixEditor from './PrefixEditor'

vi.mock('../../lib/i18n', () => ({ t: (key: string) => key }))

describe('PrefixEditor', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
  })
  afterEach(() => { vi.useRealTimers() })

  it('renders title and description', () => {
    render(<PrefixEditor prefixes={['/', '#']} onToggle={vi.fn(() => true)} />)
    expect(screen.getByText('options.prefixEditor.title')).toBeInTheDocument()
    expect(screen.getByText('options.prefixEditor.description')).toBeInTheDocument()
  })

  it('reflects selected prefixes via aria-checked', () => {
    render(<PrefixEditor prefixes={['/', '#']} onToggle={vi.fn(() => true)} />)
    expect(screen.getByRole('switch', { name: '/' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('switch', { name: '#' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('switch', { name: ';' })).toHaveAttribute('aria-checked', 'false')
  })

  it('calls onToggle with the clicked prefix', () => {
    const onToggle = vi.fn(() => true)
    render(<PrefixEditor prefixes={['/', '#']} onToggle={onToggle} />)
    fireEvent.click(screen.getByRole('switch', { name: ';' }))
    expect(onToggle).toHaveBeenCalledWith(';')
  })

  it('shakes when onToggle rejects the change, then clears it', () => {
    const onToggle = vi.fn(() => false)
    render(<PrefixEditor prefixes={['/']} onToggle={onToggle} />)
    const slash = screen.getByRole('switch', { name: '/' })

    fireEvent.click(slash)
    expect(onToggle).toHaveBeenCalledWith('/')
    expect(slash).toHaveClass('shake')

    act(() => { vi.advanceTimersByTime(400) })
    expect(slash).not.toHaveClass('shake')
  })
})
