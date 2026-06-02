import { describe, it, expect, vi } from 'vitest'

// googleDocsBackend imports the adapter (window.location/iframe); mock it so the
// routing test doesn't depend on the GDocs environment.
vi.mock('../googledocs/googleDocsAdapter', () => ({
  isGoogleDocs: () => false,
  focusGoogleDocsEditor: () => {},
}))

import { getBackend, resetAllBackends } from './editableBackend'
import { domBackend } from './domBackend'
import { googleDocsBackend } from './googleDocsBackend'
import { GOOGLE_DOCS_SENTINEL } from '../replacement/editableUtils'

describe('getBackend routing', () => {
  it('selects googleDocsBackend for the sentinel element', () => {
    expect(getBackend(GOOGLE_DOCS_SENTINEL)).toBe(googleDocsBackend)
  })

  it('selects domBackend for a real input element', () => {
    expect(getBackend(document.createElement('input'))).toBe(domBackend)
  })

  it('selects domBackend for a contenteditable element', () => {
    const el = document.createElement('div')
    el.setAttribute('contenteditable', 'true')
    expect(getBackend(el)).toBe(domBackend)
  })

  it('selects domBackend for null (selection is sentinel-keyed, not page-keyed)', () => {
    expect(getBackend(null)).toBe(domBackend)
  })
})

describe('resetAllBackends', () => {
  it('clears the Google Docs shadow buffer (teardown without an element in scope)', () => {
    const key = (k: string) => new KeyboardEvent('keydown', { key: k })
    for (const c of ':foo') googleDocsBackend.handleKey(key(c))
    expect(googleDocsBackend.reconstructionSource(null, { start: 0, end: 0 }).text).toBe(':foo')

    resetAllBackends()

    expect(googleDocsBackend.reconstructionSource(null, { start: 0, end: 0 }).text).toBe('')
  })

  it('does not throw for the DOM backend (no-op reset)', () => {
    expect(() => resetAllBackends()).not.toThrow()
  })
})
