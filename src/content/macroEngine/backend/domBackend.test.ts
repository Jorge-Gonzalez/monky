import { describe, it, expect } from 'vitest'
import { domBackend } from './domBackend'
import type { Macro } from '../../../types'

const macro = (over: Partial<Macro> = {}): Macro => ({
  id: 1,
  command: '/sig',
  text: 'Signature',
  contentType: 'text/plain',
  ...over,
})

describe('domBackend', () => {
  describe('shouldIgnoreEvent', () => {
    it('never ignores events on DOM', () => {
      expect(domBackend.shouldIgnoreEvent(new KeyboardEvent('keydown'))).toBe(false)
    })
  })

  describe('defersTriggerChar', () => {
    it('is false — DOM replaces synchronously', () => {
      expect(domBackend.defersTriggerChar()).toBe(false)
    })
  })

  describe('reset / handleKey', () => {
    it('are no-ops (no throw, no state)', () => {
      expect(() => domBackend.reset()).not.toThrow()
      expect(() => domBackend.handleKey(new KeyboardEvent('keydown', { key: 'a' }))).not.toThrow()
    })
  })

  describe('replacementTextFor', () => {
    it('returns raw macro text (DOM keeps {{placeholders}} for in-place navigation)', () => {
      expect(domBackend.replacementTextFor(macro({ text: 'Hi {{name}}' }))).toBe('Hi {{name}}')
    })
  })

  describe('reconstructionSource', () => {
    it('reads value from input elements', () => {
      const el = document.createElement('input')
      el.value = 'hello /sig'
      const r = domBackend.reconstructionSource(el, { start: 10, end: 10 })
      expect(r).toEqual({ text: 'hello /sig', cursorPos: 10 })
    })

    it('reads textContent from contenteditable elements', () => {
      const el = document.createElement('div')
      el.textContent = 'hello /sig'
      const r = domBackend.reconstructionSource(el, { start: 4, end: 4 })
      expect(r).toEqual({ text: 'hello /sig', cursorPos: 4 })
    })

    it('returns empty text for null element', () => {
      expect(domBackend.reconstructionSource(null, { start: 0, end: 0 })).toEqual({ text: '', cursorPos: 0 })
    })
  })

  describe('commitRange', () => {
    const base = {
      buffer: '/sig',
      selectionOnSchedule: null,
      isImmediate: true,
      prefixes: ['/', ';'],
    }

    it('immediate: derives range from live selection', () => {
      // "hello /sig" — cursor at 10, buffer "/sig"
      const r = domBackend.commitRange(null, {
        ...base,
        sel: { start: 10, end: 10 },
        textContent: 'hello /sig',
      })
      // start = 10 - 4 = 6 (the "/"), trimmed to the prefix
      expect(r).toEqual({ start: 6, end: 10, undoStart: 6, undoEnd: 10 })
    })

    it('preserves a leading space: range starts at the prefix, not before it', () => {
      // "hi /sig" with a preceding space at index 2; commandStart pre-trim = 3,
      // the "/" is at 3, so the space at 2 is NOT included.
      const r = domBackend.commitRange(null, {
        ...base,
        sel: { start: 7, end: 7 },
        textContent: 'hi /sig',
      })
      expect(r!.start).toBe(3) // points at "/", space at 2 survives
      expect(r!.end).toBe(7)
    })

    it('scheduled (delayed) commit uses selectionOnSchedule.end + 1', () => {
      const r = domBackend.commitRange(null, {
        ...base,
        isImmediate: false,
        sel: null,
        selectionOnSchedule: { start: 9, end: 9 },
        textContent: 'hello /sig ',
      })
      // endPos = 9 + 1 = 10, start = 10 - 4 = 6
      expect(r).toEqual({ start: 6, end: 10, undoStart: 6, undoEnd: 10 })
    })

    it('macro at start of field does not produce negative commandStart', () => {
      const r = domBackend.commitRange(null, {
        ...base,
        sel: { start: 4, end: 4 },
        textContent: '/sig',
      })
      expect(r!.start).toBe(0)
      expect(r!.start).toBeGreaterThanOrEqual(0)
    })

    it('undo range is the pre-trim range (here equal, no preceding space)', () => {
      const r = domBackend.commitRange(null, {
        ...base,
        sel: { start: 4, end: 4 },
        textContent: '/sig',
      })
      expect(r!.undoStart).toBe(0)
      expect(r!.undoEnd).toBe(4)
    })
  })

  describe('parametricRange', () => {
    it('consumes the whole buffer back from the cursor, no trim', () => {
      const r = domBackend.parametricRange(null, ':edit/note', { start: 14, end: 14 })
      expect(r).toEqual({ start: 4, end: 14 })
    })

    it('clamps to 0 when buffer longer than cursor position', () => {
      const r = domBackend.parametricRange(null, ':edit/note', { start: 3, end: 3 })
      expect(r.start).toBe(0)
    })
  })

  describe('overlayRange', () => {
    it('locates the buffer via lastIndexOf and replaces it', () => {
      const r = domBackend.overlayRange(null, '/sig', 'hello /sig', 10)
      expect(r).toEqual({ start: 6, end: 10 })
    })

    it('returns null when the buffer is not found', () => {
      expect(domBackend.overlayRange(null, '/sig', 'hello world', 11)).toBeNull()
    })
  })

  describe('insertionRange', () => {
    it('is a zero-width range at the cursor (insert, delete nothing)', () => {
      expect(domBackend.insertionRange(null, 7)).toEqual({ start: 7, end: 7 })
    })
  })
})
