// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MacroSearch } from './MacroSearch'
import { Macro } from '../../types'

// Mock the i18n function
vi.mock('../../lib/i18n', () => ({
  t: (key: string) => key,
}))

const mockMacros: Macro[] = [
  { id: '1', command: '/brb', text: 'Be right back', sensitive: false },
  { id: '2', command: '/omw', text: 'On my way', sensitive: false },
  { id: '3', command: '/meeting-notes', text: 'Here are the meeting notes.', sensitive: false },
]

describe('MacroSearch Component', () => {
  it('renders all macros when search query is empty', () => {
    render(<MacroSearch macros={mockMacros} />)
    expect(screen.getByText('/brb')).toBeInTheDocument()
    expect(screen.getByText('/omw')).toBeInTheDocument()
    expect(screen.getByText('/meeting-notes')).toBeInTheDocument()
    expect(screen.getAllByRole('listitem').length).toBe(3)
  })

  it('filters macros based on a fuzzy search query', () => {
    render(<MacroSearch macros={mockMacros} />)
    const searchInput = screen.getByPlaceholderText('popup.searchPlaceholder')

    fireEvent.change(searchInput, { target: { value: 'brb' } })

    expect(screen.getByText(/brb/)).toBeInTheDocument()
    expect(screen.queryByText('/omw')).not.toBeInTheDocument()
    expect(screen.queryByText('/meeting-notes')).not.toBeInTheDocument()
    expect(screen.getAllByRole('listitem').length).toBe(1)
  })

  it('filters based on macro text content', () => {
    render(<MacroSearch macros={mockMacros} />)
    const searchInput = screen.getByPlaceholderText('popup.searchPlaceholder')

    fireEvent.change(searchInput, { target: { value: 'meeting' } })

    expect(screen.getByText('Here are the meeting notes.')).toBeInTheDocument()
    expect(screen.getByText('/meeting-notes')).toBeInTheDocument()
  })

  it('should always show the command even if the query only matches the text', () => {
    // Arrange
    render(<MacroSearch macros={mockMacros} />)
    const searchInput = screen.getByPlaceholderText('popup.searchPlaceholder')
    // Act: Search for "way", which only exists in the text of the '/omw' macro
    fireEvent.change(searchInput, { target: { value: 'way' } })

    // Assert: The command '/omw' should still be visible
    expect(screen.getByText('/omw')).toBeInTheDocument()
    expect(screen.getByText('On my way')).toBeInTheDocument()
  })

  it('shows a "no macros" message when no results are found', () => {
    render(<MacroSearch macros={mockMacros} />)
    const searchInput = screen.getByPlaceholderText('popup.searchPlaceholder')

    fireEvent.change(searchInput, { target: { value: 'xyz' } })

    expect(screen.getByText('macroList.noMacros')).toBeInTheDocument()
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument()
  })

  it('shows a "no macros" message when the initial macro list is empty', () => {
    render(<MacroSearch macros={[]} />)
    expect(screen.getByText('macroList.noMacros')).toBeInTheDocument()
  })
})