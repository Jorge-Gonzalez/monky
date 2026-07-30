// @vitest-environment jsdom
// The colour strip is wired at two points, and each covers a case the other cannot: the editor's
// normaliser catches content as it is pasted, and the host insertion catches macros that were
// stored before any of this existed. These are the tests for the wiring rather than the stripper.
import { describe, it, expect } from 'vitest'
import { normalizeEditorHTML } from './content-editor/normalizeHTML'
import { replaceWithMarker } from '../content/macroEngine/replacement/richTextReplacement'

describe('pasting into the editor', () => {
  it('keeps a colour out of the stored macro', () => {
    // Paste fires `input`, and the editor normalises on every `input`, so this is the path a
    // pasted fragment actually takes on its way to the store.
    expect(normalizeEditorHTML('<p><span style="color: rgb(255, 255, 255);">Note</span></p>')).toBe(
      '<p>Note</p>'
    )
  })

  it('collapses a colour-only span rather than leaving an empty wrapper', () => {
    expect(normalizeEditorHTML('<div><span style="color: #fff;">a</span><span>b</span></div>')).toBe(
      '<div>ab</div>'
    )
  })

  it('keeps the bold and drops the colour when a pasted span carries both', () => {
    // Previously this depended on which branch ran: a span with bold *and* colour became <strong>
    // and lost the colour, while a colour-only span kept it. Same policy either way now.
    expect(normalizeEditorHTML('<p><span style="font-weight: bold; color: #c00;">Both</span></p>')).toBe(
      '<p><strong>Both</strong></p>'
    )
    expect(normalizeEditorHTML('<p><span style="color: #c00;">Plain</span></p>')).toBe('<p>Plain</p>')
  })

  it('still strips a dark page’s background and text colour together', () => {
    expect(normalizeEditorHTML('<div style="color: #eee; background-color: #111;">Dark</div>')).toBe(
      '<div>Dark</div>'
    )
  })
})

describe('inserting into a host composer', () => {
  const composer = (html = '') => {
    const element = document.createElement('div')
    element.contentEditable = 'true'
    Object.defineProperty(element, 'isContentEditable', { value: true, configurable: true })
    element.innerHTML = html
    document.body.appendChild(element)
    return element
  }

  const insert = (element: HTMLElement, contentHtml: string) =>
    replaceWithMarker(element, 0, 0, contentHtml, {
      macroId: 'm1',
      originalCommand: '/sig',
      insertedAt: 1,
      isHtml: true,
    })

  it('strips a colour stored before the editor ever did, so no migration is needed', () => {
    // This is the case that matters most: the macro is already in the store with a colour baked
    // in from whenever it was pasted, and the composer it is going into may be dark.
    const element = composer('x')
    insert(element, '<span style="color: rgb(0, 0, 0);">Regards</span>')
    expect(element.innerHTML).not.toContain('color')
    expect(element.textContent).toContain('Regards')
  })

  it('leaves the inserted content inheriting, with no colour anywhere under the marker', () => {
    const element = composer('x')
    const result = insert(element, '<p style="background: #fff;"><span style="color: #000;">Hi</span></p>')
    expect(result).not.toBeNull()
    expect(result?.markerElement.innerHTML).toBe('<p><span>Hi</span></p>')
  })

  it('keeps formatting and links through the insertion', () => {
    const element = composer('x')
    insert(element, '<strong>bold</strong> <a href="https://example.com">link</a>')
    expect(element.innerHTML).toContain('<strong>bold</strong>')
    expect(element.innerHTML).toContain('href="https://example.com"')
  })

  it('does not touch plain text content', () => {
    const element = composer('x')
    const result = replaceWithMarker(element, 0, 0, 'color: red is just text', {
      macroId: 'm2',
      originalCommand: '/plain',
      insertedAt: 2,
      isHtml: false,
    })
    expect(result?.markerElement.textContent).toBe('color: red is just text')
  })
})
