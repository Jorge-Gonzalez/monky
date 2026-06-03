// @vitest-environment jsdom
import { createRef } from 'preact'
import { render, screen, fireEvent, act } from '@testing-library/preact'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ContentEditor } from './ContentEditor'
import type { ContentEditorRef } from './ContentEditor'
import { ContentEditorLinkField } from './ContentEditorLinkField'
import { ContentEditorStyleMenu } from './ContentEditorStyleMenu'
import {
  toggleBold, toggleItalic, toggleUnderline, toggleStrikethrough,
  toggleBulletList, toggleOrderedList, undo, redo, setBlockType,
  insertLink, removeLink, toggleInlineCode,
} from './editorCommands'
import { normalizeEditorHTML } from './normalizeHTML'
import type { BlockType } from './types'

const execCommandSpy = vi.fn(() => false)
const queryCommandStateSpy = vi.fn(() => false)
Object.defineProperty(document, 'execCommand', { value: execCommandSpy, writable: true })
Object.defineProperty(document, 'queryCommandState', { value: queryCommandStateSpy, writable: true })

afterEach(() => {
  window.getSelection()?.removeAllRanges()
})

// Places text in the editor body inside a <p> with the cursor at the end
function setSelectionInEditor(body: HTMLElement, text: string) {
  body.innerHTML = `<p>${text}</p>`
  const textNode = body.querySelector('p')!.firstChild as Text
  const range = document.createRange()
  range.setStart(textNode, text.length)
  range.setEnd(textNode, text.length)
  const sel = window.getSelection()!
  sel.removeAllRanges()
  sel.addRange(range)
}

function getBody() {
  return document.querySelector('.content-editor-body') as HTMLElement
}

// ─── editorCommands ──────────────────────────────────────────────────────────

describe('editorCommands', () => {
  beforeEach(() => execCommandSpy.mockClear())

  describe('inline format toggles', () => {
    it.each<[string, () => void, string]>([
      ['toggleBold',          toggleBold,          'bold'],
      ['toggleItalic',        toggleItalic,        'italic'],
      ['toggleUnderline',     toggleUnderline,     'underline'],
      ['toggleStrikethrough', toggleStrikethrough, 'strikeThrough'],
      ['toggleBulletList',    toggleBulletList,    'insertUnorderedList'],
      ['toggleOrderedList',   toggleOrderedList,   'insertOrderedList'],
      ['undo',                undo,                'undo'],
      ['redo',                redo,                'redo'],
    ])('%s calls execCommand(%s)', (_name, fn, command) => {
      fn()
      expect(execCommandSpy).toHaveBeenCalledWith(command)
    })
  })

  describe('setBlockType', () => {
    const cases: Array<[BlockType, string]> = [
      ['paragraph', 'p'],
      ['h1',        'h1'],
      ['h2',        'h2'],
      ['h3',        'h3'],
      ['blockquote','blockquote'],
      ['pre',       'pre'],
    ]
    it.each(cases)('setBlockType(%s) → formatBlock with <%s>', (type, tag) => {
      setBlockType(type)
      expect(execCommandSpy).toHaveBeenCalledWith('formatBlock', false, tag)
    })
  })

  describe('insertLink', () => {
    let host: HTMLDivElement
    beforeEach(() => {
      host = document.createElement('div')
      host.contentEditable = 'true'
      document.body.appendChild(host)
    })
    afterEach(() => {
      document.body.removeChild(host)
      window.getSelection()?.removeAllRanges()
    })

    it('wraps selected text in an anchor with target=_blank', () => {
      host.textContent = 'hello world'
      const textNode = host.firstChild as Text
      const range = document.createRange()
      range.setStart(textNode, 0)
      range.setEnd(textNode, 5)
      const sel = window.getSelection()!
      sel.removeAllRanges()
      sel.addRange(range)

      insertLink('https://example.com')

      const a = host.querySelector('a')!
      expect(a.getAttribute('href')).toBe('https://example.com')
      expect(a.target).toBe('_blank')
      expect(a.rel).toBe('noopener noreferrer')
      expect(a.textContent).toBe('hello')
    })

    it('inserts the URL as link text when selection is collapsed', () => {
      host.innerHTML = '<p></p>'
      const p = host.querySelector('p')!
      const range = document.createRange()
      range.setStart(p, 0)
      range.collapse(true)
      const sel = window.getSelection()!
      sel.removeAllRanges()
      sel.addRange(range)

      insertLink('https://example.com')

      const a = host.querySelector('a')!
      expect(a.getAttribute('href')).toBe('https://example.com')
      expect(a.textContent).toBe('https://example.com')
    })
  })

  describe('removeLink', () => {
    let host: HTMLDivElement
    beforeEach(() => {
      host = document.createElement('div')
      host.contentEditable = 'true'
      document.body.appendChild(host)
    })
    afterEach(() => {
      document.body.removeChild(host)
      window.getSelection()?.removeAllRanges()
    })

    it('removes the anchor and keeps its text when called with a range inside it', () => {
      host.innerHTML = '<p><a href="https://example.com">link text</a></p>'
      const anchor = host.querySelector('a')!
      const range = document.createRange()
      range.setStart(anchor.firstChild!, 2)
      range.collapse(true)

      removeLink(range)

      expect(host.querySelector('a')).toBeNull()
      expect(host.textContent).toBe('link text')
    })

    it('falls back to execCommand unlink when called with no range', () => {
      removeLink()
      expect(execCommandSpy).toHaveBeenCalledWith('unlink')
    })
  })

  describe('toggleInlineCode', () => {
    let host: HTMLDivElement

    beforeEach(() => {
      host = document.createElement('div')
      host.contentEditable = 'true'
      document.body.appendChild(host)
    })

    afterEach(() => document.body.removeChild(host))

    it('wraps selected text in <code>', () => {
      host.textContent = 'hello'
      const textNode = host.firstChild as Text
      const range = document.createRange()
      range.setStart(textNode, 0)
      range.setEnd(textNode, 5)
      const sel = window.getSelection()!
      sel.removeAllRanges()
      sel.addRange(range)

      toggleInlineCode()

      expect(host.querySelector('code')).not.toBeNull()
      expect(host.querySelector('code')!.textContent).toBe('hello')
    })

    it('unwraps <code> when cursor is inside it', () => {
      host.innerHTML = '<code>hello</code>'
      const code = host.querySelector('code')!
      const range = document.createRange()
      range.setStart(code.firstChild!, 2)
      range.setEnd(code.firstChild!, 2)
      const sel = window.getSelection()!
      sel.removeAllRanges()
      sel.addRange(range)

      toggleInlineCode()

      expect(host.querySelector('code')).toBeNull()
      expect(host.textContent).toBe('hello')
    })

    it('does nothing when there is no selection', () => {
      host.textContent = 'hello'
      window.getSelection()!.removeAllRanges()

      toggleInlineCode()

      expect(host.querySelector('code')).toBeNull()
    })
  })
})

// ─── ContentEditor component ─────────────────────────────────────────────────

describe('ContentEditor component', () => {
  beforeEach(() => {
    execCommandSpy.mockClear()
    queryCommandStateSpy.mockClear()
  })

  it('renders a toolbar and a contenteditable body', () => {
    render(<ContentEditor />)
    expect(document.querySelector('.ce-toolbar')).toBeInTheDocument()
    expect(getBody()).toBeInTheDocument()
    expect(getBody()).toHaveAttribute('contenteditable', 'true')
  })

  it('sets data-placeholder on the body', () => {
    render(<ContentEditor placeholder="Write here…" />)
    expect(getBody()).toHaveAttribute('data-placeholder', 'Write here…')
  })

  it('initializes body innerHTML from value prop', () => {
    render(<ContentEditor value="<p>initial</p>" />)
    expect(getBody().innerHTML).toBe('<p>initial</p>')
  })

  it('calls onChange with innerHTML on input', () => {
    const onChange = vi.fn()
    render(<ContentEditor onChange={onChange} />)
    const body = getBody()
    body.innerHTML = '<p>typed</p>'
    fireEvent.input(body)
    expect(onChange).toHaveBeenCalledWith('<p>typed</p>')
  })

  it('syncs updated value prop to DOM', async () => {
    const { rerender } = render(<ContentEditor value="<p>first</p>" />)
    await act(async () => rerender(<ContentEditor value="<p>second</p>" />))
    expect(getBody().innerHTML).toBe('<p>second</p>')
  })

  describe('ref API', () => {
    it('getHTML returns current innerHTML', () => {
      const ref = createRef<ContentEditorRef>()
      render(<ContentEditor ref={ref} value="<p>hello</p>" />)
      expect(ref.current?.getHTML()).toBe('<p>hello</p>')
    })

    it('setHTML updates innerHTML', () => {
      const ref = createRef<ContentEditorRef>()
      render(<ContentEditor ref={ref} />)
      act(() => ref.current?.setHTML('<p>new</p>'))
      expect(getBody().innerHTML).toBe('<p>new</p>')
    })

    it('clear empties the editor', () => {
      const ref = createRef<ContentEditorRef>()
      render(<ContentEditor ref={ref} value="<p>text</p>" />)
      act(() => ref.current?.clear())
      expect(getBody().innerHTML).toBe('')
    })
  })
})

// ─── Keyboard shortcuts ───────────────────────────────────────────────────────

describe('ContentEditor keyboard shortcuts', () => {
  beforeEach(() => {
    execCommandSpy.mockClear()
    queryCommandStateSpy.mockClear()
    render(<ContentEditor />)
    execCommandSpy.mockClear() // ignore defaultParagraphSeparator call from mount
  })

  function keyDown(opts: KeyboardEventInit) {
    fireEvent.keyDown(getBody(), opts)
  }

  describe('inline format shortcuts', () => {
    it.each<[string, KeyboardEventInit, string]>([
      ['Ctrl+Z', { key: 'z', ctrlKey: true },                   'undo'],
      ['Ctrl+Y', { key: 'y', ctrlKey: true },                   'redo'],
      ['Ctrl+B', { key: 'b', ctrlKey: true },                   'bold'],
      ['Ctrl+I', { key: 'i', ctrlKey: true },                   'italic'],
      ['Ctrl+U', { key: 'u', ctrlKey: true },                   'underline'],
      ['Ctrl+Shift+X', { key: 'x', ctrlKey: true, shiftKey: true }, 'strikeThrough'],
      ['Ctrl+Shift+8', { key: '8', ctrlKey: true, shiftKey: true }, 'insertUnorderedList'],
      ['Ctrl+Shift+7', { key: '7', ctrlKey: true, shiftKey: true }, 'insertOrderedList'],
    ])('%s → execCommand(%s)', (_label, event, command) => {
      keyDown(event)
      expect(execCommandSpy).toHaveBeenCalledWith(command)
    })
  })

  describe('block type shortcuts', () => {
    it.each<[string, KeyboardEventInit, string]>([
      ['Ctrl+Shift+9', { key: '9', ctrlKey: true, shiftKey: true }, 'blockquote'],
      ['Ctrl+Alt+1',   { key: '1', ctrlKey: true, altKey: true },   'h1'],
      ['Ctrl+Alt+2',   { key: '2', ctrlKey: true, altKey: true },   'h2'],
      ['Ctrl+Alt+3',   { key: '3', ctrlKey: true, altKey: true },   'h3'],
      ['Ctrl+Alt+6',   { key: '6', ctrlKey: true, altKey: true },   'pre'],
    ])('%s → formatBlock(%s)', (_label, event, tag) => {
      keyDown(event)
      expect(execCommandSpy).toHaveBeenCalledWith('formatBlock', false, tag)
    })
  })

  it('Ctrl+E wraps selected text in <code>', () => {
    const body = getBody()
    body.textContent = 'snippet'
    const textNode = body.firstChild as Text
    const range = document.createRange()
    range.setStart(textNode, 0)
    range.setEnd(textNode, 7)
    const sel = window.getSelection()!
    sel.removeAllRanges()
    sel.addRange(range)

    keyDown({ key: 'e', ctrlKey: true })

    expect(body.querySelector('code')).not.toBeNull()
    sel.removeAllRanges()
  })

  it('Ctrl+K enters link mode (toolbar shows URL input)', () => {
    keyDown({ key: 'k', ctrlKey: true })
    expect(document.querySelector('.ce-link-field')).toBeInTheDocument()
  })
})

// ─── Markdown triggers ───────────────────────────────────────────────────────

describe('ContentEditor markdown triggers', () => {
  beforeEach(() => {
    execCommandSpy.mockClear()
    queryCommandStateSpy.mockClear()
    render(<ContentEditor />)
    execCommandSpy.mockClear()
  })

  function triggerMarkdown(text: string) {
    setSelectionInEditor(getBody(), text)
    fireEvent.keyDown(getBody(), { key: ' ' })
  }

  it.each<[string, string]>([
    ['*',  'insertUnorderedList'],
    ['-',  'insertUnorderedList'],
    ['1.', 'insertOrderedList'],
  ])('"%s " triggers list command', (trigger, command) => {
    triggerMarkdown(trigger)
    expect(execCommandSpy).toHaveBeenCalledWith(command)
  })

  it.each<[string, string]>([
    ['#',   'h1'],
    ['##',  'h2'],
    ['###', 'h3'],
    ['>',   'blockquote'],
    ['```', 'pre'],
  ])('"%s " triggers block type', (trigger, tag) => {
    triggerMarkdown(trigger)
    expect(execCommandSpy).toHaveBeenCalledWith('formatBlock', false, tag)
  })

  it('non-matching text does not trigger any format command', () => {
    triggerMarkdown('hello')
    expect(execCommandSpy).not.toHaveBeenCalledWith('insertUnorderedList')
    expect(execCommandSpy).not.toHaveBeenCalledWith('insertOrderedList')
    expect(execCommandSpy).not.toHaveBeenCalledWith('formatBlock', false, expect.any(String))
  })
})

// ─── Link insertion flow ──────────────────────────────────────────────────────

describe('link insertion flow', () => {
  // insertLink uses the Range API directly (surroundContents / insertNode) rather
  // than execCommand('createLink'), so it is not affected by focus or activeElement.
  //
  // In production the editor lives inside a Shadow DOM. Chrome's window.getSelection()
  // returns an "adjusted" range whose startContainer is the shadow host (a body-level
  // element) rather than the actual text node inside the shadow tree. That makes DOM
  // operations land in the wrong place. handleLinkRequest therefore reads the selection
  // via editorRef.current.getRootNode().getSelection() — the shadow root's own
  // getSelection() — which returns a range with correct intra-shadow containers.
  //
  // JSDOM has no Shadow DOM, so getRootNode() returns document and the two APIs are
  // equivalent here. These tests cover the Range API mechanics; the shadow-root fix
  // is in handleLinkRequest in ContentEditor.tsx.

  it('wraps selected text in an anchor when URL is confirmed with Enter', () => {
    render(<ContentEditor />)

    const body = getBody()
    body.textContent = 'select me'
    const textNode = body.firstChild as Text
    const range = document.createRange()
    range.setStart(textNode, 0)
    range.setEnd(textNode, textNode.length)
    const sel = window.getSelection()!
    sel.removeAllRanges()
    sel.addRange(range)

    fireEvent.keyDown(body, { key: 'k', ctrlKey: true })

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'https://example.com' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    const anchor = body.querySelector('a')
    expect(anchor).not.toBeNull()
    expect(anchor?.getAttribute('href')).toBe('https://example.com')
    expect(anchor?.target).toBe('_blank')
    expect(anchor?.textContent).toBe('select me')
  })

  it('wraps selected text when the check button is clicked', () => {
    render(<ContentEditor />)

    const body = getBody()
    body.textContent = 'click me'
    const textNode = body.firstChild as Text
    const range = document.createRange()
    range.setStart(textNode, 0)
    range.setEnd(textNode, textNode.length)
    const sel = window.getSelection()!
    sel.removeAllRanges()
    sel.addRange(range)

    fireEvent.keyDown(body, { key: 'k', ctrlKey: true })

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'https://example.com' } })
    fireEvent.mouseDown(screen.getByRole('button', { name: 'Apply link' }))

    const anchor = body.querySelector('a')
    expect(anchor).not.toBeNull()
    expect(anchor?.getAttribute('href')).toBe('https://example.com')
    expect(anchor?.textContent).toBe('click me')
  })
})

// ─── ContentEditorStyleMenu ───────────────────────────────────────────────────

describe('ContentEditorStyleMenu', () => {
  const editorRef = { current: document.createElement('div') }

  beforeEach(() => execCommandSpy.mockClear())

  it('renders the trigger button with the current block label', () => {
    render(<ContentEditorStyleMenu blockType="paragraph" editorRef={editorRef} />)
    expect(screen.getByRole('button', { name: 'Text style' })).toBeInTheDocument()
  })

  it('opens the dropdown when the trigger is pressed', () => {
    render(<ContentEditorStyleMenu blockType="paragraph" editorRef={editorRef} />)
    fireEvent.mouseDown(screen.getByRole('button', { name: 'Text style' }))
    expect(screen.getByRole('listbox')).toBeInTheDocument()
  })

  it('dropdown lists all style options', () => {
    render(<ContentEditorStyleMenu blockType="paragraph" editorRef={editorRef} />)
    fireEvent.mouseDown(screen.getByRole('button', { name: 'Text style' }))
    const options = screen.getAllByRole('option')
    expect(options).toHaveLength(6)
    expect(screen.getByRole('option', { name: /Paragraph/ })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /Heading 1/ })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /Code block/ })).toBeInTheDocument()
  })

  it('selecting an option calls formatBlock', () => {
    render(<ContentEditorStyleMenu blockType="paragraph" editorRef={editorRef} />)
    fireEvent.mouseDown(screen.getByRole('button', { name: 'Text style' }))
    fireEvent.mouseDown(screen.getByRole('option', { name: /Heading 1/ }))
    expect(execCommandSpy).toHaveBeenCalledWith('formatBlock', false, 'h1')
  })

  it('selecting the active type toggles back to paragraph', () => {
    render(<ContentEditorStyleMenu blockType="h2" editorRef={editorRef} />)
    fireEvent.mouseDown(screen.getByRole('button', { name: 'Text style' }))
    fireEvent.mouseDown(screen.getByRole('option', { name: /Heading 2/ }))
    expect(execCommandSpy).toHaveBeenCalledWith('formatBlock', false, 'p')
  })

  it('closes the dropdown after selecting an option', async () => {
    render(<ContentEditorStyleMenu blockType="paragraph" editorRef={editorRef} />)
    fireEvent.mouseDown(screen.getByRole('button', { name: 'Text style' }))
    fireEvent.mouseDown(screen.getByRole('option', { name: /Heading 1/ }))
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('closes when mousedown fires outside the component in the regular DOM', () => {
    render(<ContentEditorStyleMenu blockType="paragraph" editorRef={editorRef} />)
    fireEvent.mouseDown(screen.getByRole('button', { name: 'Text style' }))
    expect(screen.getByRole('listbox')).toBeInTheDocument()

    fireEvent.mouseDown(document.body)
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('does not close when mousedown fires inside the dropdown', () => {
    render(<ContentEditorStyleMenu blockType="paragraph" editorRef={editorRef} />)
    fireEvent.mouseDown(screen.getByRole('button', { name: 'Text style' }))
    const listbox = screen.getByRole('listbox')

    fireEvent.mouseDown(listbox)
    expect(screen.queryByRole('listbox')).toBeInTheDocument()
  })

  it('closes on Escape and stops propagation so the modal does not also close', () => {
    render(<ContentEditorStyleMenu blockType="paragraph" editorRef={editorRef} />)

    fireEvent.mouseDown(screen.getByRole('button', { name: 'Text style' }))
    expect(screen.getByRole('listbox')).toBeInTheDocument()

    // Register a bubble-phase listener on document — this is where useModalKeyboard
    // lives. It must NOT fire when Escape closes the dropdown.
    const modalHandler = vi.fn()
    document.addEventListener('keydown', modalHandler)

    // The capture-phase listener intercepts Escape at document level before
    // anything else (including the bubble-phase modal handler) fires.
    fireEvent.keyDown(document, { key: 'Escape' })

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(modalHandler).not.toHaveBeenCalled()

    document.removeEventListener('keydown', modalHandler)
  })

  // Note: the shadow DOM case (e.target retargeted to shadow host) is not
  // testable in jsdom because composed events don't propagate from shadow DOM
  // to the outer document in jsdom. The fix — using e.composedPath() instead
  // of e.target — is verified by the two behavioral tests above: they exercise
  // the composedPath() code path in normal DOM, which is sufficient to confirm
  // the logic is correct.
})

// ─── ContentEditorLinkField ───────────────────────────────────────────────────

describe('ContentEditorLinkField', () => {
  const noopRef = { current: null as HTMLDivElement | null }

  beforeEach(() => execCommandSpy.mockClear())

  function renderLinkField(props: Partial<Parameters<typeof ContentEditorLinkField>[0]> = {}) {
    return render(
      <ContentEditorLinkField
        savedRange={null}
        existingHref={null}
        editorRef={noopRef}
        onClose={vi.fn()}
        {...props}
      />
    )
  }

  it('renders a URL input', () => {
    renderLinkField()
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('pre-fills the input with existingHref', () => {
    renderLinkField({ existingHref: 'https://existing.com' })
    expect(screen.getByRole('textbox')).toHaveValue('https://existing.com')
  })

  it('Enter with a URL calls onClose', () => {
    const onClose = vi.fn()
    renderLinkField({ onClose })
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'https://example.com' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onClose).toHaveBeenCalled()
  })

  it('Enter with empty URL and existingHref calls removeLink', () => {
    const onClose = vi.fn()
    renderLinkField({ existingHref: 'https://old.com', onClose })
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: '' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(execCommandSpy).toHaveBeenCalledWith('unlink')
    expect(onClose).toHaveBeenCalled()
  })

  it('Escape calls onClose without inserting a link', () => {
    const onClose = vi.fn()
    renderLinkField({ onClose })
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'https://example.com' } })
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })

  it('check button calls onClose on mousedown', () => {
    const onClose = vi.fn()
    renderLinkField({ onClose })
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'https://example.com' } })
    fireEvent.mouseDown(screen.getByRole('button', { name: 'Apply link' }))
    expect(onClose).toHaveBeenCalled()
  })

  it('cancel button closes on mousedown', () => {
    const onClose = vi.fn()
    renderLinkField({ onClose })
    fireEvent.mouseDown(screen.getByRole('button', { name: 'Cancel' }))
    expect(onClose).toHaveBeenCalled()
  })
})

// ─── normalizeEditorHTML ──────────────────────────────────────────────────────

describe('normalizeEditorHTML', () => {
  it.each<[string, string, string]>([
    ['<b>',      '<p><b>text</b></p>',      '<p><strong>text</strong></p>'],
    ['<i>',      '<p><i>text</i></p>',      '<p><em>text</em></p>'],
    ['<strike>', '<p><strike>text</strike></p>', '<p><s>text</s></p>'],
  ])('replaces %s with semantic equivalent', (_tag, input, expected) => {
    expect(normalizeEditorHTML(input)).toBe(expected)
  })

  it.each<[string, string, string]>([
    ['font-weight:bold',              '<p><span style="font-weight: bold">text</span></p>',              '<p><strong>text</strong></p>'],
    ['font-style:italic',             '<p><span style="font-style: italic">text</span></p>',             '<p><em>text</em></p>'],
    ['text-decoration:underline',     '<p><span style="text-decoration: underline">text</span></p>',     '<p><u>text</u></p>'],
    ['text-decoration:line-through',  '<p><span style="text-decoration: line-through">text</span></p>', '<p><s>text</s></p>'],
  ])('converts span with %s to semantic tag', (_style, input, expected) => {
    expect(normalizeEditorHTML(input)).toBe(expected)
  })

  it('unwraps <font> tags', () => {
    expect(normalizeEditorHTML('<p><font color="red">text</font></p>')).toBe('<p>text</p>')
  })

  it('unwraps bare <span> with no attributes', () => {
    expect(normalizeEditorHTML('<p><span>text</span></p>')).toBe('<p>text</p>')
  })

  it('unwraps <span> with empty style attribute', () => {
    expect(normalizeEditorHTML('<p><span style="">text</span></p>')).toBe('<p>text</p>')
  })

  it('removes empty style attributes from other elements', () => {
    expect(normalizeEditorHTML('<p style="">text</p>')).toBe('<p>text</p>')
  })

  it('handles nested replacements', () => {
    expect(normalizeEditorHTML('<p><b><i>text</i></b></p>')).toBe('<p><strong><em>text</em></strong></p>')
  })

  it('returns empty string unchanged', () => {
    expect(normalizeEditorHTML('')).toBe('')
  })

  it('leaves already-semantic HTML unchanged', () => {
    const html = '<p><strong>bold</strong> and <em>italic</em></p>'
    expect(normalizeEditorHTML(html)).toBe(html)
  })
})
