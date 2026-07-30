// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { hasRichFormatting } from './macroContent'

describe('hasRichFormatting — block structure', () => {
  // The gap that was reported: a paste made of headings and paragraphs answered false, so the
  // macro was stored as text/plain and its structure was thrown away on the way in. The old test
  // for this did not exist, which is how it stayed wrong.
  it('counts headings, including one sitting beside a paragraph', () => {
    expect(hasRichFormatting('<h2>Opening</h2><p>Body</p>')).toBe(true)
    expect(hasRichFormatting('<h1>x</h1>')).toBe(true)
    expect(hasRichFormatting('<h6>x</h6>')).toBe(true)
  })

  it('counts quotes, preformatted text and rules', () => {
    expect(hasRichFormatting('<blockquote>quoted</blockquote>')).toBe(true)
    expect(hasRichFormatting('<pre>code</pre>')).toBe(true)
    expect(hasRichFormatting('a<hr>b')).toBe(true)
  })

  it('counts lists and tables', () => {
    expect(hasRichFormatting('<ul><li>x</li></ul>')).toBe(true)
    expect(hasRichFormatting('<table><tr><td>x</td></tr></table>')).toBe(true)
  })
})

describe('hasRichFormatting — inline formatting', () => {
  it('counts the tags the editor produces', () => {
    for (const html of ['<strong>x</strong>', '<em>x</em>', '<u>x</u>', '<s>x</s>', '<b>x</b>', '<i>x</i>']) {
      expect(hasRichFormatting(html)).toBe(true)
    }
  })

  it('counts a link with or without attributes', () => {
    // `\b` rather than `\s`, so the bare tag counts too.
    expect(hasRichFormatting('<a href="https://example.com">x</a>')).toBe(true)
    expect(hasRichFormatting('<a>x</a>')).toBe(true)
  })

  it('counts a line break', () => {
    expect(hasRichFormatting('one<br>two')).toBe(true)
    expect(hasRichFormatting('one<br />two')).toBe(true)
  })
})

describe('hasRichFormatting — what stays plain', () => {
  it('does not count bare text', () => {
    expect(hasRichFormatting('Just some text')).toBe(false)
    expect(hasRichFormatting('')).toBe(false)
  })

  it('does not count the generic line wrappers', () => {
    // Chrome wraps every typed line in a div, and an unadorned pasted paragraph is a p. The
    // plain-text path already carries those breaks, and pushing them down the rich path would
    // insert the wrapper into the host along with block spacing nobody asked for.
    expect(hasRichFormatting('<div>one</div><div>two</div>')).toBe(false)
    expect(hasRichFormatting('<p>Just a paragraph</p>')).toBe(false)
    expect(hasRichFormatting('<p>one</p><p>two</p>')).toBe(false)
  })

  it('counts a paragraph that carries emphasis, on the emphasis', () => {
    expect(hasRichFormatting('<p><strong>Bold</strong></p>')).toBe(true)
  })

  it('is not fooled by a tag name that merely starts with a formatting one', () => {
    // `<bdi>` begins with `b`, `<ins>` with `i`, `<summary>` with `s`. The word boundary is what
    // keeps them from reading as bold, italic and strikethrough.
    expect(hasRichFormatting('<bdi>x</bdi>')).toBe(false)
    expect(hasRichFormatting('<ins>x</ins>')).toBe(false)
    expect(hasRichFormatting('<summary>x</summary>')).toBe(false)
  })

  it('does not count text that merely mentions a tag', () => {
    expect(hasRichFormatting('use the p element')).toBe(false)
  })
})
