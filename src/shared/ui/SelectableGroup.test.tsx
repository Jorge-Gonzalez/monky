// @vitest-environment jsdom
import { render, screen, fireEvent, act } from '@testing-library/preact'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { SelectableGroup, toggleSelection } from './SelectableGroup'

describe('toggleSelection (pure)', () => {
  it('adds an option that is not selected', () => {
    expect(toggleSelection(['/'], '#', 1)).toEqual(['/', '#'])
  })

  it('removes an option that is selected', () => {
    expect(toggleSelection(['/', '#'], '#', 1)).toEqual(['/'])
  })

  it('refuses to drop below minSelected (returns null)', () => {
    expect(toggleSelection(['/'], '/', 1)).toBeNull()
    expect(toggleSelection(['/', '#'], '#', 2)).toBeNull()
  })
})

describe('SelectableGroup', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
  })
  afterEach(() => { vi.useRealTimers() })

  it('renders an option button per option with aria-checked', () => {
    render(<SelectableGroup options={['/', '#', ';']} selected={['/', '#']} onChange={vi.fn()} minSelected={1} />)
    expect(screen.getByRole('switch', { name: '/' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('switch', { name: '#' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('switch', { name: ';' })).toHaveAttribute('aria-checked', 'false')
  })

  it('calls onChange with the option added', () => {
    const onChange = vi.fn()
    render(<SelectableGroup options={['/', '#', ';']} selected={['/']} onChange={onChange} minSelected={1} />)
    fireEvent.click(screen.getByRole('switch', { name: ';' }))
    expect(onChange).toHaveBeenCalledWith(['/', ';'])
  })

  it('calls onChange with the option removed', () => {
    const onChange = vi.fn()
    render(<SelectableGroup options={['/', '#']} selected={['/', '#']} onChange={onChange} minSelected={1} />)
    fireEvent.click(screen.getByRole('switch', { name: '#' }))
    expect(onChange).toHaveBeenCalledWith(['/'])
  })

  it('refuses to remove the last selected and shakes instead', () => {
    const onChange = vi.fn()
    render(<SelectableGroup options={['/', '#']} selected={['/']} onChange={onChange} minSelected={1} />)
    const slash = screen.getByRole('switch', { name: '/' })

    fireEvent.click(slash)
    expect(onChange).not.toHaveBeenCalled()
    expect(slash).toHaveClass('shake')

    void act(() => { vi.advanceTimersByTime(400) })
    expect(slash).not.toHaveClass('shake')
  })

  it('applies the sf-min-selected-1 fragment when minSelected is 1', () => {
    const { container } = render(<SelectableGroup options={['/']} selected={['/']} onChange={vi.fn()} minSelected={1} />)
    expect(container.querySelector('.sf-selectable-group')).toHaveClass('sf-min-selected-1')
  })
})
