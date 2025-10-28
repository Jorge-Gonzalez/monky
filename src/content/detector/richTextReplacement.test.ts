import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  replaceWithMarker,
  undoMostRecentInsertion,
  undoSpecificInsertion,
  removeAllMarkers,
  hasMarkers,
  getMarkerCount,
  type MacroMarkerData
} from './richTextReplacement'

describe('Rich Text Replacement', () => {
  let contentEditableDiv: HTMLDivElement

  beforeEach(() => {
    contentEditableDiv = document.createElement('div')
    contentEditableDiv.contentEditable = 'true'
    document.body.appendChild(contentEditableDiv)
  })

  afterEach(() => {
    document.body.removeChild(contentEditableDiv)
  })

  describe('replaceWithMarker', () => {
    it('should replace plain text with marker-wrapped content', () => {
      contentEditableDiv.textContent = '/hello world'

      const markerData: MacroMarkerData = {
        macroId: 'test-1',
        originalCommand: '/hello',
        insertedAt: Date.now(),
        isHtml: false
      }

      const result = replaceWithMarker(
        contentEditableDiv,
        0,
        6, // '/hello'
        'Hello, World!',
        markerData
      )

      expect(result).not.toBeNull()
      expect(contentEditableDiv.textContent).toBe('Hello, World! world')
      expect(hasMarkers(contentEditableDiv)).toBe(true)
      expect(getMarkerCount(contentEditableDiv)).toBe(1)
    })

    it('should replace text with HTML content wrapped in marker', () => {
      contentEditableDiv.textContent = '/sig'

      const markerData: MacroMarkerData = {
        macroId: 'test-html',
        originalCommand: '/sig',
        insertedAt: Date.now(),
        isHtml: true
      }

      const result = replaceWithMarker(
        contentEditableDiv,
        0,
        4, // '/sig'
        '<strong>John Doe</strong><br><em>Developer</em>',
        markerData
      )

      expect(result).not.toBeNull()
      expect(contentEditableDiv.innerHTML).toContain('<strong>John Doe</strong>')
      expect(contentEditableDiv.innerHTML).toContain('<em>Developer</em>')
      expect(contentEditableDiv.textContent).toContain('John Doe')
      expect(contentEditableDiv.textContent).toContain('Developer')
      expect(hasMarkers(contentEditableDiv)).toBe(true)
    })

    it('should handle HTML lists', () => {
      contentEditableDiv.textContent = '/tasks'

      const markerData: MacroMarkerData = {
        macroId: 'test-list',
        originalCommand: '/tasks',
        insertedAt: Date.now(),
        isHtml: true
      }

      const result = replaceWithMarker(
        contentEditableDiv,
        0,
        6, // '/tasks'
        '<ul><li>Task 1</li><li>Task 2</li></ul>',
        markerData
      )

      expect(result).not.toBeNull()
      expect(contentEditableDiv.innerHTML).toContain('<ul>')
      expect(contentEditableDiv.innerHTML).toContain('<li>Task 1</li>')
      expect(contentEditableDiv.textContent).toContain('Task 1')
      expect(hasMarkers(contentEditableDiv)).toBe(true)
    })

    it('should replace text in the middle of content', () => {
      contentEditableDiv.textContent = 'Hello /name there'

      const markerData: MacroMarkerData = {
        macroId: 'test-middle',
        originalCommand: '/name',
        insertedAt: Date.now(),
        isHtml: false
      }

      const result = replaceWithMarker(
        contentEditableDiv,
        6,
        11, // '/name'
        'John',
        markerData
      )

      expect(result).not.toBeNull()
      expect(contentEditableDiv.textContent).toBe('Hello John there')
      expect(hasMarkers(contentEditableDiv)).toBe(true)
    })

    it('should return null for non-contenteditable elements', () => {
      const regularDiv = document.createElement('div')
      regularDiv.textContent = '/hello'

      const markerData: MacroMarkerData = {
        macroId: 'test-fail',
        originalCommand: '/hello',
        insertedAt: Date.now(),
        isHtml: false
      }

      const result = replaceWithMarker(
        regularDiv,
        0,
        6,
        'Hello',
        markerData
      )

      expect(result).toBeNull()
    })
  })

  describe('undoMostRecentInsertion', () => {
    it('should undo plain text replacement', () => {
      contentEditableDiv.textContent = '/hello'

      const markerData: MacroMarkerData = {
        macroId: 'test-undo-1',
        originalCommand: '/hello',
        insertedAt: Date.now(),
        isHtml: false
      }

      replaceWithMarker(contentEditableDiv, 0, 6, 'Hello, World!', markerData)
      expect(contentEditableDiv.textContent).toBe('Hello, World!')

      const undone = undoMostRecentInsertion(contentEditableDiv)
      expect(undone).toBe(true)
      expect(contentEditableDiv.textContent).toBe('/hello')
      expect(hasMarkers(contentEditableDiv)).toBe(false)
    })

    it('should undo HTML replacement', () => {
      contentEditableDiv.textContent = '/sig'

      const markerData: MacroMarkerData = {
        macroId: 'test-undo-html',
        originalCommand: '/sig',
        insertedAt: Date.now(),
        isHtml: true
      }

      replaceWithMarker(
        contentEditableDiv,
        0,
        4,
        '<strong>John Doe</strong>',
        markerData
      )

      expect(contentEditableDiv.innerHTML).toContain('<strong>John Doe</strong>')

      const undone = undoMostRecentInsertion(contentEditableDiv)
      expect(undone).toBe(true)
      expect(contentEditableDiv.textContent).toBe('/sig')
      expect(contentEditableDiv.innerHTML).not.toContain('<strong>')
      expect(hasMarkers(contentEditableDiv)).toBe(false)
    })

    it('should undo the most recent insertion when multiple exist', () => {
      contentEditableDiv.textContent = '/hello /world'

      // First insertion
      const marker1: MacroMarkerData = {
        macroId: 'first',
        originalCommand: '/hello',
        insertedAt: 1000,
        isHtml: false
      }
      replaceWithMarker(contentEditableDiv, 0, 6, 'Hello', marker1)

      // Wait a bit to ensure different timestamp
      const marker2: MacroMarkerData = {
        macroId: 'second',
        originalCommand: '/world',
        insertedAt: 2000,
        isHtml: false
      }
      replaceWithMarker(contentEditableDiv, 6, 12, 'World', marker2)

      expect(getMarkerCount(contentEditableDiv)).toBe(2)

      // Undo should remove the most recent one (second)
      const undone = undoMostRecentInsertion(contentEditableDiv)
      expect(undone).toBe(true)
      expect(contentEditableDiv.textContent).toContain('/world')
      expect(contentEditableDiv.textContent).toContain('Hello')
      expect(getMarkerCount(contentEditableDiv)).toBe(1)
    })

    it('should handle undo even after user edits around the marker', () => {
      contentEditableDiv.textContent = '/hello'

      const markerData: MacroMarkerData = {
        macroId: 'test-edit',
        originalCommand: '/hello',
        insertedAt: Date.now(),
        isHtml: false
      }

      replaceWithMarker(contentEditableDiv, 0, 6, 'Hello', markerData)

      // Simulate user adding text before and after (realistically, by inserting text nodes)
      // NOT by setting textContent which would destroy the marker
      const prefixText = document.createTextNode('Prefix ')
      const suffixText = document.createTextNode(' Suffix')
      const marker = contentEditableDiv.querySelector('[data-macro-marker="true"]')!

      contentEditableDiv.insertBefore(prefixText, marker)
      contentEditableDiv.appendChild(suffixText)

      expect(contentEditableDiv.textContent).toBe('Prefix Hello Suffix')

      const undone = undoMostRecentInsertion(contentEditableDiv)
      expect(undone).toBe(true)
      expect(contentEditableDiv.textContent).toContain('/hello')
      expect(contentEditableDiv.textContent).toContain('Prefix')
      expect(contentEditableDiv.textContent).toContain('Suffix')
    })

    it('should return false when no markers exist', () => {
      contentEditableDiv.textContent = 'No markers here'

      const undone = undoMostRecentInsertion(contentEditableDiv)
      expect(undone).toBe(false)
    })
  })

  describe('undoSpecificInsertion', () => {
    it('should undo a specific marker by ID', () => {
      contentEditableDiv.textContent = '/hello /world'

      const marker1: MacroMarkerData = {
        macroId: 'first',
        originalCommand: '/hello',
        insertedAt: Date.now(),
        isHtml: false
      }
      replaceWithMarker(contentEditableDiv, 0, 6, 'Hello', marker1)

      const marker2: MacroMarkerData = {
        macroId: 'second',
        originalCommand: '/world',
        insertedAt: Date.now(),
        isHtml: false
      }
      replaceWithMarker(contentEditableDiv, 6, 12, 'World', marker2)

      // Undo the first one specifically
      const undone = undoSpecificInsertion(contentEditableDiv, 'first')
      expect(undone).toBe(true)
      expect(contentEditableDiv.textContent).toContain('/hello')
      expect(contentEditableDiv.textContent).toContain('World')
      expect(getMarkerCount(contentEditableDiv)).toBe(1)
    })

    it('should return false for non-existent macro ID', () => {
      contentEditableDiv.textContent = '/hello'

      const markerData: MacroMarkerData = {
        macroId: 'exists',
        originalCommand: '/hello',
        insertedAt: Date.now(),
        isHtml: false
      }

      replaceWithMarker(contentEditableDiv, 0, 6, 'Hello', markerData)

      const undone = undoSpecificInsertion(contentEditableDiv, 'does-not-exist')
      expect(undone).toBe(false)
      expect(getMarkerCount(contentEditableDiv)).toBe(1)
    })
  })

  describe('removeAllMarkers', () => {
    it('should remove all markers but keep content', () => {
      contentEditableDiv.textContent = '/hello /world'

      const marker1: MacroMarkerData = {
        macroId: 'first',
        originalCommand: '/hello',
        insertedAt: Date.now(),
        isHtml: false
      }
      replaceWithMarker(contentEditableDiv, 0, 6, 'Hello', marker1)

      const marker2: MacroMarkerData = {
        macroId: 'second',
        originalCommand: '/world',
        insertedAt: Date.now(),
        isHtml: false
      }
      replaceWithMarker(contentEditableDiv, 6, 12, 'World', marker2)

      expect(getMarkerCount(contentEditableDiv)).toBe(2)

      removeAllMarkers(contentEditableDiv)

      expect(hasMarkers(contentEditableDiv)).toBe(false)
      expect(contentEditableDiv.textContent).toContain('Hello')
      expect(contentEditableDiv.textContent).toContain('World')
    })

    it('should handle HTML content when removing markers', () => {
      contentEditableDiv.textContent = '/sig'

      const markerData: MacroMarkerData = {
        macroId: 'html-remove',
        originalCommand: '/sig',
        insertedAt: Date.now(),
        isHtml: true
      }

      replaceWithMarker(
        contentEditableDiv,
        0,
        4,
        '<strong>Bold Text</strong>',
        markerData
      )

      expect(hasMarkers(contentEditableDiv)).toBe(true)

      removeAllMarkers(contentEditableDiv)

      expect(hasMarkers(contentEditableDiv)).toBe(false)
      // Content should still be there
      expect(contentEditableDiv.innerHTML).toContain('<strong>Bold Text</strong>')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty content', () => {
      contentEditableDiv.textContent = ''

      expect(hasMarkers(contentEditableDiv)).toBe(false)
      expect(getMarkerCount(contentEditableDiv)).toBe(0)
      expect(undoMostRecentInsertion(contentEditableDiv)).toBe(false)
    })

    it('should handle complex HTML structures', () => {
      contentEditableDiv.textContent = '/table'

      const markerData: MacroMarkerData = {
        macroId: 'complex',
        originalCommand: '/table',
        insertedAt: Date.now(),
        isHtml: true
      }

      const complexHtml = `
        <table>
          <tr><td>Cell 1</td><td>Cell 2</td></tr>
          <tr><td>Cell 3</td><td>Cell 4</td></tr>
        </table>
      `

      const result = replaceWithMarker(
        contentEditableDiv,
        0,
        6,
        complexHtml,
        markerData
      )

      expect(result).not.toBeNull()
      expect(contentEditableDiv.innerHTML).toContain('<table>')
      expect(contentEditableDiv.textContent).toContain('Cell 1')

      const undone = undoMostRecentInsertion(contentEditableDiv)
      expect(undone).toBe(true)
      expect(contentEditableDiv.textContent).toBe('/table')
    })

    it('should maintain cursor position after insertion', () => {
      contentEditableDiv.textContent = '/hello'
      contentEditableDiv.focus()

      const selection = window.getSelection()!
      const range = document.createRange()
      range.selectNodeContents(contentEditableDiv)
      range.collapse(false)
      selection.removeAllRanges()
      selection.addRange(range)

      const markerData: MacroMarkerData = {
        macroId: 'cursor-test',
        originalCommand: '/hello',
        insertedAt: Date.now(),
        isHtml: false
      }

      replaceWithMarker(contentEditableDiv, 0, 6, 'Hello, World!', markerData)

      // Cursor should be after the inserted content
      const newRange = selection.getRangeAt(0)
      expect(newRange.collapsed).toBe(true)
      // The cursor should be at the end
      expect(newRange.endOffset).toBeGreaterThan(0)
    })
  })

  describe('Marker Transparency', () => {
    it('should not affect visual rendering (display: contents)', () => {
      contentEditableDiv.textContent = '/hello'

      const markerData: MacroMarkerData = {
        macroId: 'transparent',
        originalCommand: '/hello',
        insertedAt: Date.now(),
        isHtml: false
      }

      replaceWithMarker(contentEditableDiv, 0, 6, 'Hello', markerData)

      const marker = contentEditableDiv.querySelector('[data-macro-marker="true"]') as HTMLElement
      expect(marker).not.toBeNull()
      expect(marker.style.display).toBe('contents')
    })

    it('should store metadata in marker attributes', () => {
      contentEditableDiv.textContent = '/test'

      const markerData: MacroMarkerData = {
        macroId: 'meta-test',
        originalCommand: '/test',
        insertedAt: 12345,
        isHtml: true
      }

      replaceWithMarker(contentEditableDiv, 0, 5, 'Test Content', markerData)

      const marker = contentEditableDiv.querySelector('[data-macro-id="meta-test"]') as HTMLElement
      expect(marker).not.toBeNull()
      expect(marker.dataset.originalCommand).toBe('/test')
      expect(marker.dataset.insertedAt).toBe('12345')
      expect(marker.dataset.isHtml).toBe('true')
    })
  })
})
