import { describe, it, expect, vi, beforeEach } from 'vitest'

// The adapter touches window.location / the iframe; mock it. focusGoogleDocsEditor
// is asserted via the spy. isGoogleDocs drives shouldIgnoreEvent.
const isGoogleDocs = vi.fn(() => true)
const focusGoogleDocsEditor = vi.fn()
vi.mock('../googledocs/googleDocsAdapter', () => ({
  isGoogleDocs: () => isGoogleDocs(),
  focusGoogleDocsEditor: () => focusGoogleDocsEditor(),
}))

import { googleDocsBackend } from './googleDocsBackend'
import type { Macro } from '../../../types'

const macro = (over: Partial<Macro> = {}): Macro => ({
  id: 1,
  command: '/sig',
  text: 'Signature',
  contentType: 'text/plain',
  ...over,
})

const key = (k: string, init: KeyboardEventInit = {}) => new KeyboardEvent('keydown', { key: k, ...init })

describe('googleDocsBackend', () => {
  beforeEach(() => {
    isGoogleDocs.mockReturnValue(true)
    focusGoogleDocsEditor.mockClear()
    googleDocsBackend.reset() // ensure clean shadow between tests (module singleton)
  })

  describe('shouldIgnoreEvent', () => {
    it('ignores untrusted events while on Google Docs (our own dispatches)', () => {
      // KeyboardEvent constructed in jsdom is untrusted (isTrusted === false)
      expect(googleDocsBackend.shouldIgnoreEvent(key('a'))).toBe(true)
    })

    it('does not ignore when not on Google Docs', () => {
      isGoogleDocs.mockReturnValue(false)
      expect(googleDocsBackend.shouldIgnoreEvent(key('a'))).toBe(false)
    })
  })

  describe('defersTriggerChar', () => {
    it('is true — replacement runs in setTimeout(0), trigger char must remain', () => {
      expect(googleDocsBackend.defersTriggerChar()).toBe(true)
    })
  })

  describe('replacementTextFor', () => {
    it('strips placeholders (GDocs inserts labels only)', () => {
      expect(googleDocsBackend.replacementTextFor(macro({ text: 'Hi {{name}}' }))).toBe('Hi name')
    })

    it('returns raw text when no placeholders', () => {
      expect(googleDocsBackend.replacementTextFor(macro({ text: 'Signature' }))).toBe('Signature')
    })
  })

  describe('focusForInsertion', () => {
    it('delegates to focusGoogleDocsEditor', () => {
      googleDocsBackend.focusForInsertion(null)
      expect(focusGoogleDocsEditor).toHaveBeenCalledOnce()
    })
  })

  describe('range methods collapse to buffer length (no readable cursor)', () => {
    it('commitRange: [0, buffer.length], undo == adjusted', () => {
      const r = googleDocsBackend.commitRange(null, {
        buffer: '/sig',
        sel: { start: 0, end: 0 },
        selectionOnSchedule: null,
        isImmediate: true,
        prefixes: ['/'],
        textContent: '',
      })
      expect(r).toEqual({ start: 0, end: 4, undoStart: 0, undoEnd: 4 })
    })

    it('parametricRange: [0, buffer.length]', () => {
      expect(googleDocsBackend.parametricRange(null, ':edit/n', { start: 0, end: 0 })).toEqual({
        start: 0,
        end: 7,
      })
    })

    it('overlayRange: [0, buffer.length]', () => {
      expect(googleDocsBackend.overlayRange(null, '/sig', '', 0)).toEqual({ start: 0, end: 4 })
    })

    it('insertionRange: [0, 0] (insert, delete nothing)', () => {
      expect(googleDocsBackend.insertionRange(null, 0)).toEqual({ start: 0, end: 0 })
    })
  })

  describe('shadow buffer via handleKey / reconstructionSource', () => {
    const recon = () => googleDocsBackend.reconstructionSource(null, { start: 0, end: 0 })

    it('printable keys accumulate', () => {
      for (const c of ':foo') googleDocsBackend.handleKey(key(c))
      expect(recon()).toEqual({ text: ':foo', cursorPos: 4 })
    })

    it('Backspace trims the last character', () => {
      for (const c of ':foo') googleDocsBackend.handleKey(key(c))
      googleDocsBackend.handleKey(key('Backspace'))
      expect(recon().text).toBe(':fo')
    })

    it('Enter resets (word boundary)', () => {
      for (const c of ':foo') googleDocsBackend.handleKey(key(c))
      googleDocsBackend.handleKey(key('Enter'))
      expect(recon().text).toBe('')
    })

    it('space resets (word boundary)', () => {
      for (const c of ':foo') googleDocsBackend.handleKey(key(c))
      googleDocsBackend.handleKey(key(' '))
      expect(recon().text).toBe('')
    })

    it('round-trip: type, backspace a typo, retype — matches as if typed correctly', () => {
      for (const c of ':fooo') googleDocsBackend.handleKey(key(c)) // typo: extra o
      googleDocsBackend.handleKey(key('Backspace')) // correct it
      expect(recon().text).toBe(':foo')
    })

    it('reset clears the buffer', () => {
      for (const c of ':foo') googleDocsBackend.handleKey(key(c))
      googleDocsBackend.reset()
      expect(recon()).toEqual({ text: '', cursorPos: 0 })
    })

    it('non-printable keys (e.g. Shift) do not accumulate', () => {
      googleDocsBackend.handleKey(key(':'))
      googleDocsBackend.handleKey(key('Shift'))
      expect(recon().text).toBe(':')
    })
  })
})
