// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { stripThemeAppearance } from './macroAppearance'

const strip = stripThemeAppearance

describe('stripThemeAppearance — colour', () => {
  it('drops a text colour so the content inherits the host composer', () => {
    expect(strip('<p><span style="color: rgb(32, 33, 36);">Hello</span></p>')).toBe(
      '<p><span>Hello</span></p>'
    )
  })

  it('drops a background as well, whether shorthand or longhand', () => {
    expect(strip('<div style="background-color: #1a1a1a;">x</div>')).toBe('<div>x</div>')
    expect(strip('<div style="background: black;">x</div>')).toBe('<div>x</div>')
  })

  it('drops any property whose name ends in colour, including vendor-prefixed ones', () => {
    // The name test rather than a list, so `-webkit-text-fill-color` -- which overrides `color`
    // outright and is exactly what a dark-themed page uses -- cannot slip through.
    expect(strip('<span style="-webkit-text-fill-color: #fff;">x</span>')).toBe('<span>x</span>')
    expect(strip('<span style="caret-color: red; border-top-color: red;">x</span>')).toBe('<span>x</span>')
  })

  it('drops shadows and filters, which carry a theme without saying colour', () => {
    expect(strip('<p style="text-shadow: 0 1px 0 #000;">x</p>')).toBe('<p>x</p>')
    expect(strip('<p style="filter: invert(1);">x</p>')).toBe('<p>x</p>')
    expect(strip('<p style="mix-blend-mode: difference;">x</p>')).toBe('<p>x</p>')
  })

  it('drops the pre-CSS colour attributes', () => {
    expect(strip('<p bgcolor="#000000">x</p>')).toBe('<p>x</p>')
    expect(strip('<font color="red">x</font>')).toBe('<font>x</font>')
    expect(strip('<p background="dark.png">x</p>')).toBe('<p>x</p>')
  })

  it('drops a foreign class, which can pull a colour back in through the host stylesheet', () => {
    expect(strip('<p class="site-heading dark-theme">x</p>')).toBe('<p>x</p>')
  })
})

describe('stripThemeAppearance — what it leaves alone', () => {
  it('keeps formatting that means the same thing in any theme', () => {
    expect(strip('<p><strong>bold</strong> and <em>italic</em></p>')).toBe(
      '<p><strong>bold</strong> and <em>italic</em></p>'
    )
    expect(strip('<span style="font-weight: bold;">x</span>')).toBe(
      '<span style="font-weight: bold;">x</span>'
    )
    expect(strip('<p style="text-align: center;">x</p>')).toBe('<p style="text-align: center;">x</p>')
  })

  it('keeps the surviving declarations when only some are dropped', () => {
    expect(strip('<span style="font-style: italic; color: red; text-align: left;">x</span>')).toBe(
      '<span style="font-style: italic; text-align: left;">x</span>'
    )
  })

  it('leaves text, structure and links untouched', () => {
    const html = '<ul><li>one</li><li><a href="https://example.com">two</a></li></ul>'
    expect(strip(html)).toBe(html)
  })

  it('returns empty input unchanged', () => {
    expect(strip('')).toBe('')
  })
})

describe('stripThemeAppearance — declaration parsing', () => {
  it('drops a data URI background whose own value contains a semicolon', () => {
    // A naive split on ';' breaks this value in half and leaves `base64,...` behind as a
    // declaration of its own, so the very thing being removed would survive in pieces.
    const html =
      '<div style="background-image: url(data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=); font-weight: bold;">x</div>'
    expect(strip(html)).toBe('<div style="font-weight: bold;">x</div>')
  })

  it('drops an SVG data URI whose value contains both a semicolon and a colon', () => {
    // The sharper version of the case above, and the common one in pasted markup: splitting
    // naively leaves `utf8,<svg xmlns="http` as an orphan, and because that fragment does contain
    // a colon it reads as a declaration of some unknown property -- so it is kept, and a piece of
    // the background survives in the style attribute as garbage.
    const html =
      '<div style="background-image: url(data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\'/>); font-weight: bold;">x</div>'
    expect(strip(html)).toBe('<div style="font-weight: bold;">x</div>')
  })

  it('is not confused by a semicolon inside a quoted value', () => {
    const html = `<p style="font-family: 'Foo;Bar'; color: red;">x</p>`
    expect(strip(html)).toBe(`<p style="font-family: 'Foo;Bar';">x</p>`)
  })

  it('tolerates a trailing semicolon and missing final one', () => {
    expect(strip('<p style="color: red">x</p>')).toBe('<p>x</p>')
    expect(strip('<p style="font-weight: bold">x</p>')).toBe('<p style="font-weight: bold;">x</p>')
  })

  it('drops a malformed declaration that has no colon, as the browser would', () => {
    expect(strip('<p style="font-weight: bold; garbage">x</p>')).toBe('<p style="font-weight: bold;">x</p>')
  })

  it('matches property names case-insensitively and past whitespace', () => {
    expect(strip('<p style="  COLOR : red ; font-weight: bold;">x</p>')).toBe(
      '<p style="font-weight: bold;">x</p>'
    )
  })

  it('reaches elements at any depth', () => {
    expect(
      strip('<div><p><span style="color: red;"><em style="color: blue;">deep</em></span></p></div>')
    ).toBe('<div><p><span><em>deep</em></span></p></div>')
  })
})
