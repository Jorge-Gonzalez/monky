import { vi } from 'vitest'

// Mock `window.matchMedia` for the `useTheme` hook.
// This is necessary because JSDOM, the test environment, doesn't implement it.
vi.stubGlobal(
  'matchMedia',
  vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
)