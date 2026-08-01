import { vi } from 'vitest'
import '@testing-library/jest-dom'

// Mock scrollIntoView - not implemented in jsdom
Element.prototype.scrollIntoView = vi.fn()

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

// Mock the `chrome` global object for browser extension APIs.
vi.stubGlobal('chrome', {
  runtime: {
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
    getURL: (path: string) => `chrome-extension://mock/${path}`,
  },
  tabs: {
    query: vi.fn(),
    create: vi.fn(),
  },
  storage: {
    local: {
      get: vi.fn().mockResolvedValue({}),
      set: vi.fn().mockResolvedValue(undefined),
      remove: vi.fn().mockResolvedValue(undefined),
    },
    // The browser-account backup reads and writes here. Stubbed alongside local so that a component
    // touching it in an effect resolves to "nothing backed up yet" rather than rejecting into an
    // unhandled promise that belongs to no test.
    sync: {
      get: vi.fn().mockResolvedValue({}),
      set: vi.fn().mockResolvedValue(undefined),
      remove: vi.fn().mockResolvedValue(undefined),
      getBytesInUse: vi.fn().mockResolvedValue(0),
    },
    onChanged: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  },
  alarms: {
    create: vi.fn().mockResolvedValue(undefined),
    onAlarm: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  },
});