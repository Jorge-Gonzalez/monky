// @vitest-environment jsdom
// The strip is wired at two points, and each covers a case the other cannot: the editor's
// normaliser catches content as it is pasted, and the host insertion catches macros that were
// stored before any of this existed. These are the tests for the wiring rather than the stripper.
import { describe, it, expect } from 'vitest'
import { normalizeEditorHTML } from './content-editor/normalizeHTML'
import { hasRichFormatting, extractPlainText } from './macroContent'
import { replaceWithMarker } from '../content/macroEngine/replacement/richTextReplacement'

// The paste that was reported: a heading and a paragraph lifted from an article, carrying that
// site's whole design on two style attributes.
const ARTICLE_PASTE =
  '<h2 id="opening" style="margin: 3.5rem 0px 1.5rem; padding: 0px 0px 0.5rem; font-family: &quot;DM Serif Display&quot;, Georgia, serif; font-size: clamp(1.4rem, 3vw, 1.9rem); font-weight: 400; color: rgb(26, 23, 18); border-bottom: 1px solid rgb(232, 227, 218); background-color: rgb(245, 242, 237);">Opening</h2>' +
  '<p style="margin: 0px 0px 1.75rem; color: rgb(26, 23, 18); font-family: Lora, Georgia, serif; font-size: 16.8px; background-color: rgb(245, 242, 237);">The first part of this series.</p>'

describe('pasting an article into the editor', () => {
  it('keeps the structure and drops the site', () => {
    expect(normalizeEditorHTML(ARTICLE_PASTE)).toBe('<h2>Opening</h2><p>The first part of this series.</p>')
  })

  it('is recognised as rich, so the structure survives the save', () => {
    // This is what the report caught. `hasRichFormatting` knew only inline tags, so a paste made
    // of headings and paragraphs answered false, was stored as text/plain, and arrived in the
    // host as a flat run of text with the heading gone.
    expect(hasRichFormatting(ARTICLE_PASTE)).toBe(true)
    expect(hasRichFormatting(normalizeEditorHTML(ARTICLE_PASTE))).toBe(true)
  })

  it('still yields the same plain text alongside it', () => {
    expect(extractPlainText(normalizeEditorHTML(ARTICLE_PASTE))).toBe(
      'Opening\nThe first part of this series.'
    )
  })

  it('keeps typed formatting that the editor itself produces', () => {
    expect(normalizeEditorHTML('<p><b>bold</b> and <i>italic</i></p>')).toBe(
      '<p><strong>bold</strong> and <em>italic</em></p>'
    )
  })

  it('converts a styled span to a tag before the style is stripped', () => {
    // Order matters here and the tests would not notice if it were wrong in the other direction:
    // `spanStyleToTag` reads `font-weight: bold` to decide on `<strong>`, so stripping first
    // would throw the bold away with the rest of the page's design.
    expect(normalizeEditorHTML('<p><span style="font-weight: bold; color: #c00;">Both</span></p>')).toBe(
      '<p><strong>Both</strong></p>'
    )
  })

  it('leaves ordinary typed lines as plain content', () => {
    // Chrome wraps each typed line in a div, and those are not formatting -- the plain-text path
    // already carries the breaks.
    expect(hasRichFormatting('<div>one</div><div>two</div>')).toBe(false)
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

  it('strips presentation stored before the editor ever did, so no migration is needed', () => {
    const element = composer('x')
    const result = insert(element, ARTICLE_PASTE)
    expect(result?.markerElement.innerHTML).toBe('<h2>Opening</h2><p>The first part of this series.</p>')
  })

  it('leaves nothing under the marker that pins a colour', () => {
    const element = composer('x')
    insert(element, '<p style="background: #fff;"><span style="color: #000;">Hi</span></p>')
    expect(element.innerHTML).not.toContain('color')
    expect(element.textContent).toContain('Hi')
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
