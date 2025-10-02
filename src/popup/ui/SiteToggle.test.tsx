import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import SiteToggle from './SiteToggle'
import { useMacroStore } from '../../store/useMacroStore'
import { t } from '../../lib/i18n'

// Mock chrome APIs
const mockQuery = vi.fn()
vi.stubGlobal('chrome', {
  tabs: {
    query: mockQuery
  }
})

// Mock the store
vi.mock('../../store/useMacroStore', () => ({
  useMacroStore: vi.fn()
}))

// Mock i18n
vi.mock('../../lib/i18n', () => ({
  t: vi.fn((key) => key)
}))

describe('SiteToggle Component', () => {
  const mockToggleSiteDisabled = vi.fn()
  const mockDisabledSites: string[] = []

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default mock store implementation
    ;(useMacroStore as vi.Mock).mockImplementation(selector => 
      selector({
        config: {
          disabledSites: mockDisabledSites
        },
        toggleSiteDisabled: mockToggleSiteDisabled
      })
    )
    
    // Mock default translation
    ;(t as vi.Mock).mockImplementation((key) => key)
  })

  it('does not render when hostname cannot be determined', () => {
    mockQuery.mockImplementationOnce((_, callback) => {
      callback([{ url: null }])
    })
    
    const { container } = render(<SiteToggle />)
    expect(container.firstChild).toBeNull()
  })

  it('renders when valid HTTP URL is detected', () => {
    mockQuery.mockImplementationOnce((_, callback) => {
      callback([{ url: 'https://example.com/page' }])
    })
    
    render(<SiteToggle />)
    
    expect(screen.getByText('popup.macrosOnThisSite')).toBeInTheDocument()
    expect(screen.getByText('example.com')).toBeInTheDocument()
  })

  it('renders localized file text when file protocol is detected', () => {
    mockQuery.mockImplementationOnce((_, callback) => {
      callback([{ url: 'file:///path/to/file.html' }])
    })
    
    ;(t as vi.Mock).mockImplementation((key) => {
      return key === 'popup.localFile' ? 'Local file' : key
    })
    
    render(<SiteToggle />)
    
    // The test is checking for the localized text, but we're providing it in the mock
    // The component should display "Local file" (the localized version)
    expect(screen.getByText('Local file')).toBeInTheDocument()
  })

  it('displays enabled state when site is not disabled', () => {
    mockQuery.mockImplementationOnce((_, callback) => {
      callback([{ url: 'https://example.com/page' }])
    })
    
    render(<SiteToggle />)
    
    const checkbox = screen.getByRole('checkbox') as HTMLInputElement
    expect(checkbox.checked).toBe(true) // Enabled means not disabled
  })

  it('displays disabled state when site is disabled', () => {
    ;(useMacroStore as vi.Mock).mockImplementation(selector => 
      selector({
        config: {
          disabledSites: ['example.com']
        },
        toggleSiteDisabled: mockToggleSiteDisabled
      })
    )
    
    mockQuery.mockImplementationOnce((_, callback) => {
      callback([{ url: 'https://example.com/page' }])
    })
    
    render(<SiteToggle />)
    
    const checkbox = screen.getByRole('checkbox') as HTMLInputElement
    expect(checkbox.checked).toBe(false) // Disabled means it's in the disabled list
  })

  it('calls toggleSiteDisabled when checkbox is toggled', () => {
    mockQuery.mockImplementationOnce((_, callback) => {
      callback([{ url: 'https://example.com/page' }])
    })
    
    render(<SiteToggle />)
    
    const checkbox = screen.getByRole('checkbox')
    fireEvent.click(checkbox)
    
    expect(mockToggleSiteDisabled).toHaveBeenCalledWith('example.com')
  })

  it('handles localhost URLs correctly', () => {
    mockQuery.mockImplementationOnce((_, callback) => {
      callback([{ url: 'http://localhost:3000/app' }])
    })
    
    render(<SiteToggle />)
    
    expect(screen.getByText('localhost')).toBeInTheDocument()
  })

  it('does not render for chrome extension URLs', () => {
    mockQuery.mockImplementationOnce((_, callback) => {
      callback([{ url: 'chrome://extensions/' }])
    })
    
    const { container } = render(<SiteToggle />)
    expect(container.firstChild).toBeNull()
  })
})