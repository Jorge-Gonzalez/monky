import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createPlaceholderSession } from './placeholderSession'

describe('createPlaceholderSession — input/textarea', () => {
  let input: HTMLInputElement
  let onExit: ReturnType<typeof vi.fn>

  beforeEach(() => {
    input = document.createElement('input')
    input.type = 'text'
    document.body.appendChild(input)
    onExit = vi.fn()
  })

  afterEach(() => {
    document.body.removeChild(input)
  })

  describe('creation', () => {
    it('is active immediately after creation', () => {
      input.value = 'Dear {{name}}'
      const session = createPlaceholderSession(input, onExit)
      expect(session.isActive()).toBe(true)
    })

    it('selects the first placeholder on creation', () => {
      input.value = 'Dear {{name}}, order {{id}} ready'
      createPlaceholderSession(input, onExit)
      expect(input.selectionStart).toBe(5)
      expect(input.selectionEnd).toBe(13)
    })
  })

  describe('advance()', () => {
    it('moves selection to the next placeholder', () => {
      input.value = 'Dear {{name}}, order {{id}} ready'
      const session = createPlaceholderSession(input, onExit)

      // Simulate user filling in first placeholder
      input.value = 'Dear Alice, order {{id}} ready'
      session.advance()

      const idStart = input.value.indexOf('{{id}}')
      expect(input.selectionStart).toBe(idStart)
      expect(input.selectionEnd).toBe(idStart + '{{id}}'.length)
    })

    it('returns true when more placeholders remain', () => {
      input.value = 'Dear {{name}}, order {{id}} ready'
      const session = createPlaceholderSession(input, onExit)
      input.value = 'Dear Alice, order {{id}} ready'

      expect(session.advance()).toBe(true)
    })

    it('exits and returns false when no more placeholders remain', () => {
      input.value = '{{only}}'
      const session = createPlaceholderSession(input, onExit)
      input.value = 'filled'

      expect(session.advance()).toBe(false)
      expect(session.isActive()).toBe(false)
      expect(onExit).toHaveBeenCalled()
    })
  })

  describe('exit detection via input event', () => {
    it('stays active when user edits within the current placeholder bounds', () => {
      input.value = 'Dear {{name}}, order {{id}} ready'
      const session = createPlaceholderSession(input, onExit)
      // prefix = "Dear ", suffix = ", order {{id}} ready" — second placeholder keeps suffix intact

      input.value = 'Dear Alice, order {{id}} ready'
      input.dispatchEvent(new Event('input', { bubbles: true }))

      expect(session.isActive()).toBe(true)
      expect(onExit).not.toHaveBeenCalled()
    })

    it('exits when user changes text before the current placeholder (prefix broken)', () => {
      input.value = 'Dear {{name}}, thanks'
      const session = createPlaceholderSession(input, onExit)

      input.value = 'Xxxxx {{name}}, thanks'
      input.dispatchEvent(new Event('input', { bubbles: true }))

      expect(session.isActive()).toBe(false)
      expect(onExit).toHaveBeenCalled()
    })

    it('exits when user changes text after the current placeholder (suffix broken)', () => {
      input.value = 'Dear {{name}}, thanks'
      const session = createPlaceholderSession(input, onExit)

      input.value = 'Dear {{name}}, XXXXXX'
      input.dispatchEvent(new Event('input', { bubbles: true }))

      expect(session.isActive()).toBe(false)
      expect(onExit).toHaveBeenCalled()
    })

    it('exits automatically when the last placeholder has been filled', () => {
      input.value = 'Dear {{name}}'
      const session = createPlaceholderSession(input, onExit)

      input.value = 'Dear Alice'
      input.dispatchEvent(new Event('input', { bubbles: true }))

      expect(session.isActive()).toBe(false)
      expect(onExit).toHaveBeenCalled()
    })

    it('does not exit while unfilled placeholders still remain after editing one', () => {
      input.value = '{{greeting}} {{name}}'
      const session = createPlaceholderSession(input, onExit)

      // Fill first placeholder — second still present
      input.value = 'Hello {{name}}'
      input.dispatchEvent(new Event('input', { bubbles: true }))

      expect(session.isActive()).toBe(true)
      expect(onExit).not.toHaveBeenCalled()
    })
  })

  describe('exit()', () => {
    it('sets isActive to false', () => {
      input.value = 'Dear {{name}}'
      const session = createPlaceholderSession(input, onExit)
      session.exit()
      expect(session.isActive()).toBe(false)
    })

    it('calls the onExit callback', () => {
      input.value = 'Dear {{name}}'
      const session = createPlaceholderSession(input, onExit)
      session.exit()
      expect(onExit).toHaveBeenCalledOnce()
    })

    it('strips remaining placeholders from the element value, keeping label text', () => {
      input.value = 'Dear {{name}}, order {{id}} ready'
      const session = createPlaceholderSession(input, onExit)

      // Fill first placeholder, leave second untouched
      input.value = 'Dear Alice, order {{id}} ready'
      session.advance()
      session.exit()

      expect(input.value).toBe('Dear Alice, order id ready')
    })

    it('does not modify value when no placeholders remain at exit', () => {
      input.value = 'Dear {{name}}'
      const session = createPlaceholderSession(input, onExit)
      input.value = 'Dear Alice'
      session.exit()
      expect(input.value).toBe('Dear Alice')
    })

    it('is idempotent — calling exit twice does not call onExit twice', () => {
      input.value = 'Dear {{name}}'
      const session = createPlaceholderSession(input, onExit)
      session.exit()
      session.exit()
      expect(onExit).toHaveBeenCalledOnce()
    })
  })

  describe('blur', () => {
    it('exits when the element loses focus', () => {
      input.value = 'Dear {{name}}'
      const session = createPlaceholderSession(input, onExit)

      input.dispatchEvent(new Event('blur'))

      expect(session.isActive()).toBe(false)
      expect(onExit).toHaveBeenCalled()
    })
  })

  describe('length invariant edge case', () => {
    it('exits when value becomes shorter than prefix + suffix combined', () => {
      input.value = '{{a}}x'
      const session = createPlaceholderSession(input, onExit)
      // prefix = '', suffix = 'x' — value must be at least 1 char
      input.value = ''
      input.dispatchEvent(new Event('input', { bubbles: true }))
      expect(session.isActive()).toBe(false)
    })
  })
})

describe('createPlaceholderSession — contenteditable', () => {
  let div: HTMLDivElement
  let onExit: ReturnType<typeof vi.fn>

  beforeEach(() => {
    div = document.createElement('div')
    div.contentEditable = 'true'
    document.body.appendChild(div)
    onExit = vi.fn()
  })

  afterEach(() => {
    document.body.removeChild(div)
  })

  it('is active after creation with a placeholder in textContent', () => {
    div.textContent = 'Hello {{name}}'
    const session = createPlaceholderSession(div, onExit)
    expect(session.isActive()).toBe(true)
  })

  it('exits when the text outside the placeholder changes', () => {
    div.textContent = 'Hello {{name}}'
    const session = createPlaceholderSession(div, onExit)

    div.textContent = 'Xxxxx {{name}}'
    div.dispatchEvent(new Event('input', { bubbles: true }))

    expect(session.isActive()).toBe(false)
    expect(onExit).toHaveBeenCalled()
  })

  it('strips remaining placeholders on exit, keeping label text', () => {
    div.textContent = 'Hello {{name}}'
    const session = createPlaceholderSession(div, onExit)
    session.exit()
    expect(div.textContent).toBe('Hello name')
  })

  it('exits automatically when last placeholder is filled', () => {
    div.textContent = 'Hello {{name}}'
    const session = createPlaceholderSession(div, onExit)

    div.textContent = 'Hello Alice'
    div.dispatchEvent(new Event('input', { bubbles: true }))

    expect(session.isActive()).toBe(false)
    expect(onExit).toHaveBeenCalled()
  })
})
