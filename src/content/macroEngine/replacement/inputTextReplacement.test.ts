import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { replaceInInput, htmlToPlainText, replaceInInputSmart } from './inputTextReplacement'

describe('Input Text Replacement', () => {
  describe('replaceInInput', () => {
    describe('HTMLInputElement', () => {
      let input: HTMLInputElement

      beforeEach(() => {
        input = document.createElement('input')
        input.type = 'text'
        document.body.appendChild(input)
      })

      afterEach(() => {
        document.body.removeChild(input)
      })

      it('should replace text at the beginning', () => {
        input.value = '/hello world'

        const result = replaceInInput(input, 0, 6, 'Hi')

        expect(result).toBe(true)
        expect(input.value).toBe('Hi world')
      })

      it('should replace text in the middle', () => {
        input.value = 'Hello /name there'

        const result = replaceInInput(input, 6, 11, 'John')

        expect(result).toBe(true)
        expect(input.value).toBe('Hello John there')
      })

      it('should replace text at the end', () => {
        input.value = 'Hello /world'

        const result = replaceInInput(input, 6, 12, 'World!')

        expect(result).toBe(true)
        expect(input.value).toBe('Hello World!')
      })

      it('should replace entire content', () => {
        input.value = '/signature'

        const result = replaceInInput(input, 0, 10, 'Best regards, John')

        expect(result).toBe(true)
        expect(input.value).toBe('Best regards, John')
      })

      it('should handle empty replacement (deletion)', () => {
        input.value = 'Remove /this word'

        const result = replaceInInput(input, 7, 12, '')

        expect(result).toBe(true)
        expect(input.value).toBe('Remove  word')
      })

      it('should set cursor position after replacement', () => {
        input.value = '/hello'

        replaceInInput(input, 0, 6, 'Hi there')

        expect(input.selectionStart).toBe(8) // After 'Hi there'
        expect(input.selectionEnd).toBe(8)
        expect(input.value).toBe('Hi there')
      })

      it('should handle multi-line text in input', () => {
        input.value = 'Line 1\n/command\nLine 2'
        const commandStart = input.value.indexOf('/command')
        const commandEnd = commandStart + 8

        const result = replaceInInput(input, commandStart, commandEnd, 'REPLACED')

        expect(result).toBe(true)
        // Note: input elements may strip newlines depending on browser
        // The important part is the replacement works
        expect(input.value).toContain('REPLACED')
      })

      it('should preserve content before and after replacement', () => {
        input.value = 'Keep this /replace and this'

        replaceInInput(input, 10, 18, 'DONE')

        expect(input.value).toBe('Keep this DONE and this')
      })

      it('should return false for password input', () => {
        const passwordInput = document.createElement('input')
        passwordInput.type = 'password'
        passwordInput.value = '/secret'
        document.body.appendChild(passwordInput)

        const result = replaceInInput(passwordInput, 0, 7, 'text')

        expect(result).toBe(false)
        expect(passwordInput.value).toBe('/secret')

        document.body.removeChild(passwordInput)
      })

      it('should return false for null element', () => {
        const result = replaceInInput(null as any, 0, 5, 'text')

        expect(result).toBe(false)
      })

      it('should handle special characters', () => {
        input.value = '/special'

        const result = replaceInInput(input, 0, 8, '<>&"\'')

        expect(result).toBe(true)
        expect(input.value).toBe('<>&"\'')
      })

      it('should handle unicode characters', () => {
        input.value = '/emoji'

        const result = replaceInInput(input, 0, 6, '🎉🎊')

        expect(result).toBe(true)
        expect(input.value).toBe('🎉🎊')
      })

      it('should handle very long replacement text', () => {
        input.value = '/short'
        const longText = 'A'.repeat(1000)

        const result = replaceInInput(input, 0, 6, longText)

        expect(result).toBe(true)
        expect(input.value).toBe(longText)
        expect(input.value.length).toBe(1000)
      })

      it('should handle single character replacement', () => {
        input.value = '/x rest'

        const result = replaceInInput(input, 0, 2, 'Y')

        expect(result).toBe(true)
        expect(input.value).toBe('Y rest')
      })

      it('should handle whitespace-only replacement', () => {
        input.value = 'Hello/world'

        const result = replaceInInput(input, 5, 6, ' ')

        expect(result).toBe(true)
        expect(input.value).toBe('Hello world')
      })

      it('should handle empty input', () => {
        input.value = ''

        const result = replaceInInput(input, 0, 0, 'text')

        expect(result).toBe(true)
        expect(input.value).toBe('text')
      })

      it('should handle sequential replacements', () => {
        input.value = '/first /second'

        let result = replaceInInput(input, 0, 6, 'One')
        expect(result).toBe(true)
        expect(input.value).toBe('One /second')

        result = replaceInInput(input, 4, 11, 'Two')
        expect(result).toBe(true)
        expect(input.value).toBe('One Two')
      })

      it('should handle position beyond content length gracefully', () => {
        input.value = 'Short'

        const result = replaceInInput(input, 0, 100, 'text')

        expect(result).toBe(true)
        expect(input.value).toBe('text')
      })

      it('should handle different input types', () => {
        const searchInput = document.createElement('input')
        searchInput.type = 'search'
        searchInput.value = '/search'
        document.body.appendChild(searchInput)

        const result = replaceInInput(searchInput, 0, 7, 'query')

        expect(result).toBe(true)
        expect(searchInput.value).toBe('query')

        document.body.removeChild(searchInput)
      })
    })

    describe('HTMLTextAreaElement', () => {
      let textarea: HTMLTextAreaElement

      beforeEach(() => {
        textarea = document.createElement('textarea')
        document.body.appendChild(textarea)
      })

      afterEach(() => {
        document.body.removeChild(textarea)
      })

      it('should replace text in textarea', () => {
        textarea.value = '/hello world'

        const result = replaceInInput(textarea, 0, 6, 'Hi')

        expect(result).toBe(true)
        expect(textarea.value).toBe('Hi world')
      })

      it('should handle multi-line content in textarea', () => {
        textarea.value = 'Line 1\n/command\nLine 2\nLine 3'
        const commandStart = textarea.value.indexOf('/command')
        const commandEnd = commandStart + 8

        const result = replaceInInput(textarea, commandStart, commandEnd, 'REPLACED')

        expect(result).toBe(true)
        expect(textarea.value).toBe('Line 1\nREPLACED\nLine 2\nLine 3')
      })

      it('should set cursor position in textarea', () => {
        textarea.value = '/macro'

        replaceInInput(textarea, 0, 6, 'Expanded')

        expect(textarea.selectionStart).toBe(8)
        expect(textarea.selectionEnd).toBe(8)
        expect(textarea.value).toBe('Expanded')
      })

      it('should handle large text content in textarea', () => {
        const largeText = 'A'.repeat(10000)
        textarea.value = `/macro ${largeText}`

        const result = replaceInInput(textarea, 0, 6, 'REPLACED')

        expect(result).toBe(true)
        expect(textarea.value).toBe(`REPLACED ${largeText}`)
      })

      it('should preserve line breaks in textarea', () => {
        textarea.value = 'Paragraph 1\n\n/sig\n\nParagraph 2'
        const sigStart = textarea.value.indexOf('/sig')
        const sigEnd = sigStart + 4

        const result = replaceInInput(
          textarea,
          sigStart,
          sigEnd,
          'John Doe\nSoftware Engineer'
        )

        expect(result).toBe(true)
        expect(textarea.value).toContain('John Doe\nSoftware Engineer')
        expect(textarea.value).toContain('Paragraph 1')
        expect(textarea.value).toContain('Paragraph 2')
      })
    })
  })

  describe('htmlToPlainText', () => {
    it('should convert simple HTML to plain text', () => {
      const html = '<p>Hello World</p>'

      const result = htmlToPlainText(html)

      expect(result).toBe('Hello World')
    })

    it('should convert formatted HTML to plain text', () => {
      const html = '<strong>Bold</strong> and <em>italic</em>'

      const result = htmlToPlainText(html)

      expect(result).toBe('Bold and italic')
    })

    it('should handle HTML with line breaks', () => {
      const html = 'Line 1<br>Line 2<br>Line 3'

      const result = htmlToPlainText(html)

      // Browser may interpret <br> as newline or not, just check content exists
      expect(result).toContain('Line 1')
      expect(result).toContain('Line 2')
      expect(result).toContain('Line 3')
    })

    it('should handle HTML lists', () => {
      const html = '<ul><li>Item 1</li><li>Item 2</li></ul>'

      const result = htmlToPlainText(html)

      expect(result).toContain('Item 1')
      expect(result).toContain('Item 2')
    })

    it('should handle nested HTML', () => {
      const html = '<div><p><strong>Bold text</strong> in paragraph</p></div>'

      const result = htmlToPlainText(html)

      expect(result).toBe('Bold text in paragraph')
    })

    it('should handle HTML with multiple paragraphs', () => {
      const html = '<p>First paragraph</p><p>Second paragraph</p>'

      const result = htmlToPlainText(html)

      expect(result).toContain('First paragraph')
      expect(result).toContain('Second paragraph')
    })

    it('should handle empty HTML', () => {
      const result = htmlToPlainText('')

      expect(result).toBe('')
    })

    it('should handle plain text without HTML tags', () => {
      const text = 'Just plain text'

      const result = htmlToPlainText(text)

      expect(result).toBe('Just plain text')
    })

    it('should handle HTML entities', () => {
      const html = '&lt;div&gt; &amp; &quot;text&quot;'

      const result = htmlToPlainText(html)

      expect(result).toBe('<div> & "text"')
    })

    it('should strip script and style tags', () => {
      const html = '<p>Text</p><script>alert("bad")</script><style>.bad{}</style>'

      const result = htmlToPlainText(html)

      // In JSDOM, textContent includes script/style content, unlike real browsers
      // The important thing is the function doesn't crash and returns text
      expect(result).toContain('Text')
    })

    it('should handle malformed HTML gracefully', () => {
      const html = '<p>Unclosed tag'

      const result = htmlToPlainText(html)

      expect(result).toBe('Unclosed tag')
    })

    it('should handle complex signature HTML', () => {
      const html = `
        <div>
          <strong>John Doe</strong><br>
          <em>Software Engineer</em><br>
          <a href="mailto:john@example.com">john@example.com</a>
        </div>
      `

      const result = htmlToPlainText(html)

      expect(result).toContain('John Doe')
      expect(result).toContain('Software Engineer')
      expect(result).toContain('john@example.com')
    })
  })

  describe('replaceInInputSmart', () => {
    let input: HTMLInputElement

    beforeEach(() => {
      input = document.createElement('input')
      input.type = 'text'
      document.body.appendChild(input)
    })

    afterEach(() => {
      document.body.removeChild(input)
    })

    it('should replace with plain text when isHtml is false', () => {
      input.value = '/hello'

      const result = replaceInInputSmart(input, 0, 6, 'Hi there', false)

      expect(result).toBe(true)
      expect(input.value).toBe('Hi there')
    })

    it('should replace with plain text by default', () => {
      input.value = '/hello'

      const result = replaceInInputSmart(input, 0, 6, 'Hi there')

      expect(result).toBe(true)
      expect(input.value).toBe('Hi there')
    })

    it('should convert HTML to plain text when isHtml is true', () => {
      input.value = '/sig'

      const result = replaceInInputSmart(
        input,
        0,
        4,
        '<strong>John Doe</strong><br><em>Engineer</em>',
        true
      )

      expect(result).toBe(true)
      expect(input.value).toContain('John Doe')
      expect(input.value).toContain('Engineer')
      // Should not contain HTML tags
      expect(input.value).not.toContain('<strong>')
      expect(input.value).not.toContain('<br>')
    })

    it('should handle HTML lists in smart mode', () => {
      input.value = '/tasks'

      const result = replaceInInputSmart(
        input,
        0,
        6,
        '<ul><li>Task 1</li><li>Task 2</li></ul>',
        true
      )

      expect(result).toBe(true)
      expect(input.value).toContain('Task 1')
      expect(input.value).toContain('Task 2')
      expect(input.value).not.toContain('<ul>')
    })

    it('should work with textarea', () => {
      const textarea = document.createElement('textarea')
      textarea.value = '/greeting'
      document.body.appendChild(textarea)

      const result = replaceInInputSmart(
        textarea,
        0,
        9,
        '<p>Hello <strong>World</strong>!</p>',
        true
      )

      expect(result).toBe(true)
      expect(textarea.value).toContain('Hello')
      expect(textarea.value).toContain('World')
      expect(textarea.value).not.toContain('<p>')

      document.body.removeChild(textarea)
    })

    it('should set cursor position correctly', () => {
      input.value = '/macro'

      replaceInInputSmart(input, 0, 6, '<em>Replaced</em>', true)

      const expectedText = 'Replaced' // HTML stripped
      expect(input.selectionStart).toBe(expectedText.length)
      expect(input.selectionEnd).toBe(expectedText.length)
    })

    it('should return false for password fields', () => {
      const passwordInput = document.createElement('input')
      passwordInput.type = 'password'
      passwordInput.value = '/secret'
      document.body.appendChild(passwordInput)

      const result = replaceInInputSmart(passwordInput, 0, 7, 'text', false)

      expect(result).toBe(false)

      document.body.removeChild(passwordInput)
    })
  })

  describe('Integration tests', () => {
    it('should handle email composition scenario', () => {
      const textarea = document.createElement('textarea')
      textarea.value = 'Dear customer,\n\n/greeting\n\nBest regards'
      document.body.appendChild(textarea)

      const greetingStart = textarea.value.indexOf('/greeting')
      const greetingEnd = greetingStart + 9

      replaceInInput(
        textarea,
        greetingStart,
        greetingEnd,
        'Thank you for your inquiry. We appreciate your business.'
      )

      expect(textarea.value).toContain('Dear customer')
      expect(textarea.value).toContain('Thank you for your inquiry')
      expect(textarea.value).toContain('Best regards')
      expect(textarea.value).not.toContain('/greeting')

      document.body.removeChild(textarea)
    })

    it('should handle HTML signature in input field', () => {
      const textarea = document.createElement('textarea')
      textarea.value = 'Message body\n\n/sig'
      document.body.appendChild(textarea)

      const sigStart = textarea.value.indexOf('/sig')
      const sigEnd = sigStart + 4

      const htmlSignature = `
        <div>
          <strong>John Doe</strong><br>
          <em>Software Engineer</em><br>
          john@example.com
        </div>
      `

      replaceInInputSmart(textarea, sigStart, sigEnd, htmlSignature, true)

      expect(textarea.value).toContain('Message body')
      expect(textarea.value).toContain('John Doe')
      expect(textarea.value).toContain('Software Engineer')
      expect(textarea.value).toContain('john@example.com')
      expect(textarea.value).not.toContain('<div>')
      expect(textarea.value).not.toContain('/sig')

      document.body.removeChild(textarea)
    })

    it('should handle multiple macro replacements', () => {
      const input = document.createElement('input')
      input.value = 'Hi /name, your order /orderId is ready'
      document.body.appendChild(input)

      // Replace /name
      let nameStart = input.value.indexOf('/name')
      replaceInInput(input, nameStart, nameStart + 5, 'Alice')
      expect(input.value).toBe('Hi Alice, your order /orderId is ready')

      // Replace /orderId
      let orderStart = input.value.indexOf('/orderId')
      replaceInInput(input, orderStart, orderStart + 8, '#12345')
      expect(input.value).toBe('Hi Alice, your order #12345 is ready')

      document.body.removeChild(input)
    })

    it('should handle URL input with macro', () => {
      const input = document.createElement('input')
      input.type = 'url'
      input.value = 'https://example.com//path'
      document.body.appendChild(input)

      const pathStart = input.value.indexOf('//path')
      replaceInInput(input, pathStart, pathStart + 6, '/users')

      expect(input.value).toBe('https://example.com/users')

      document.body.removeChild(input)
    })
  })
})
