import { describe, it, expect, beforeEach } from 'vitest'
import { getActiveEditable } from './editableUtils'

describe('getActiveEditable - Enhanced ContentEditable Support', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  describe('Direct Element Detection', () => {
    it('should detect input elements', () => {
      const input = document.createElement('input')
      input.type = 'text'
      
      const result = getActiveEditable(input)
      expect(result).toBe(input)
    })

    it('should detect textarea elements', () => {
      const textarea = document.createElement('textarea')
      
      const result = getActiveEditable(textarea)
      expect(result).toBe(textarea)
    })

    it('should reject password inputs', () => {
      const passwordInput = document.createElement('input')
      passwordInput.type = 'password'
      
      const result = getActiveEditable(passwordInput)
      expect(result).toBeNull()
    })

    it('should detect direct contenteditable elements', () => {
      const div = document.createElement('div')
      div.contentEditable = 'true'
      
      const result = getActiveEditable(div)
      expect(result).toBe(div)
    })

    it('should detect elements with isContentEditable property', () => {
      const div = document.createElement('div')
      div.contentEditable = 'true'
      document.body.appendChild(div)
      
      // isContentEditable is computed based on DOM state
      const result = getActiveEditable(div)
      expect(result).toBe(div)
    })
  })

  describe('DOM Tree Traversal for ContentEditable', () => {
    it('should find contenteditable parent from text node', () => {
      const contentEditableDiv = document.createElement('div')
      contentEditableDiv.contentEditable = 'true'
      contentEditableDiv.textContent = 'Some text'
      document.body.appendChild(contentEditableDiv)

      // Get the text node
      const textNode = contentEditableDiv.firstChild
      
      const result = getActiveEditable(textNode)
      expect(result).toBe(contentEditableDiv)
    })

    it('should find contenteditable parent from nested bold element', () => {
      const contentEditableDiv = document.createElement('div')
      contentEditableDiv.contentEditable = 'true'
      
      const paragraph = document.createElement('p')
      const boldElement = document.createElement('b')
      boldElement.textContent = 'Bold text'
      
      paragraph.appendChild(boldElement)
      contentEditableDiv.appendChild(paragraph)
      document.body.appendChild(contentEditableDiv)

      const result = getActiveEditable(boldElement)
      expect(result).toBe(contentEditableDiv)
    })

    it('should find contenteditable parent from nested italic element', () => {
      const contentEditableDiv = document.createElement('div')
      contentEditableDiv.contentEditable = 'true'
      
      const paragraph = document.createElement('p')
      const italicElement = document.createElement('i')
      italicElement.textContent = 'Italic text'
      
      paragraph.appendChild(italicElement)
      contentEditableDiv.appendChild(paragraph)
      document.body.appendChild(contentEditableDiv)

      const result = getActiveEditable(italicElement)
      expect(result).toBe(contentEditableDiv)
    })

    it('should find contenteditable parent from list item', () => {
      const contentEditableDiv = document.createElement('div')
      contentEditableDiv.contentEditable = 'true'
      
      const list = document.createElement('ul')
      const listItem = document.createElement('li')
      listItem.textContent = 'List item'
      
      list.appendChild(listItem)
      contentEditableDiv.appendChild(list)
      document.body.appendChild(contentEditableDiv)

      const result = getActiveEditable(listItem)
      expect(result).toBe(contentEditableDiv)
    })

    it('should find contenteditable parent from deeply nested elements', () => {
      const contentEditableDiv = document.createElement('div')
      contentEditableDiv.contentEditable = 'true'
      
      // Create: div[contenteditable] > p > span > b > text
      const paragraph = document.createElement('p')
      const span = document.createElement('span')
      const bold = document.createElement('b')
      bold.textContent = 'Deeply nested text'
      
      span.appendChild(bold)
      paragraph.appendChild(span)
      contentEditableDiv.appendChild(paragraph)
      document.body.appendChild(contentEditableDiv)

      const result = getActiveEditable(bold)
      expect(result).toBe(contentEditableDiv)
    })

    it('should handle multiple contenteditable ancestors (return closest)', () => {
      const outerContentEditable = document.createElement('div')
      outerContentEditable.contentEditable = 'true'
      outerContentEditable.id = 'outer'
      
      const innerContentEditable = document.createElement('div')
      innerContentEditable.contentEditable = 'true'
      innerContentEditable.id = 'inner'
      
      const targetElement = document.createElement('span')
      targetElement.textContent = 'Target'
      
      innerContentEditable.appendChild(targetElement)
      outerContentEditable.appendChild(innerContentEditable)
      document.body.appendChild(outerContentEditable)

      const result = getActiveEditable(targetElement)
      expect(result).toBe(innerContentEditable) // Should return closest parent
    })
  })

  describe('Edge Cases', () => {
    it('should return null for null target', () => {
      const result = getActiveEditable(null)
      expect(result).toBeNull()
    })

    it('should return null for non-HTMLElement targets', () => {
      const textNode = document.createTextNode('text')
      const result = getActiveEditable(textNode)
      expect(result).toBeNull()
    })

    it('should return null when no contenteditable parent exists', () => {
      const div = document.createElement('div')
      const span = document.createElement('span')
      span.textContent = 'Not editable'
      
      div.appendChild(span)
      document.body.appendChild(div)

      const result = getActiveEditable(span)
      expect(result).toBeNull()
    })

    it('should return null for contenteditable="false"', () => {
      const div = document.createElement('div')
      div.contentEditable = 'false'
      
      const result = getActiveEditable(div)
      expect(result).toBeNull()
    })

    it('should handle contenteditable="inherit" by traversing', () => {
      const parentDiv = document.createElement('div')
      parentDiv.contentEditable = 'true'
      
      const childDiv = document.createElement('div')
      childDiv.contentEditable = 'inherit'
      
      const targetSpan = document.createElement('span')
      
      childDiv.appendChild(targetSpan)
      parentDiv.appendChild(childDiv)
      document.body.appendChild(parentDiv)

      const result = getActiveEditable(targetSpan)
      expect(result).toBe(parentDiv) // Should find the parent with contentEditable="true"
    })
  })

  describe('Real-world Scenarios', () => {
    it('should handle rich text editor structure', () => {
      // Simulate structure like: <div contenteditable><p>Some <b>bold</b> and <i>italic</i> text</p></div>
      const editor = document.createElement('div')
      editor.contentEditable = 'true'
      editor.className = 'rich-text-editor'
      
      const paragraph = document.createElement('p')
      paragraph.appendChild(document.createTextNode('Some '))
      
      const bold = document.createElement('b')
      bold.textContent = 'bold'
      paragraph.appendChild(bold)
      
      paragraph.appendChild(document.createTextNode(' and '))
      
      const italic = document.createElement('i')
      italic.textContent = 'italic'
      paragraph.appendChild(italic)
      
      paragraph.appendChild(document.createTextNode(' text'))
      
      editor.appendChild(paragraph)
      document.body.appendChild(editor)

      // Test clicking on different parts
      expect(getActiveEditable(bold)).toBe(editor)
      expect(getActiveEditable(italic)).toBe(editor)
      expect(getActiveEditable(paragraph)).toBe(editor)
    })

    it('should handle list structure in contenteditable', () => {
      // Simulate: <div contenteditable><ul><li>Item 1</li><li>Item 2</li></ul></div>
      const editor = document.createElement('div')
      editor.contentEditable = 'true'
      
      const list = document.createElement('ul')
      const item1 = document.createElement('li')
      item1.textContent = 'Item 1'
      const item2 = document.createElement('li')
      item2.textContent = 'Item 2'
      
      list.appendChild(item1)
      list.appendChild(item2)
      editor.appendChild(list)
      document.body.appendChild(editor)

      expect(getActiveEditable(item1)).toBe(editor)
      expect(getActiveEditable(item2)).toBe(editor)
      expect(getActiveEditable(list)).toBe(editor)
    })

    it('should handle complex nested structure', () => {
      // Real-world complex structure from test page
      const editor = document.createElement('div')
      editor.contentEditable = 'true'
      editor.innerHTML = `
        <p>This is some <b>bold text</b>. You can try here. Or after this <i>italic text</i>. Even inside a list:</p>
        <ul>
          <li>Item 1</li>
          <li>Try here: </li>
        </ul>
        <p>And some more text to finish.</p>
      `
      document.body.appendChild(editor)

      // Test various nested elements
      const boldElement = editor.querySelector('b')!
      const italicElement = editor.querySelector('i')!
      const listItem = editor.querySelector('li')!
      
      expect(getActiveEditable(boldElement)).toBe(editor)
      expect(getActiveEditable(italicElement)).toBe(editor)
      expect(getActiveEditable(listItem)).toBe(editor)
    })
  })
})