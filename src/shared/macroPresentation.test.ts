// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { stripForeignPresentation } from './macroPresentation'

const strip = stripForeignPresentation

describe('stripForeignPresentation — what goes', () => {
  it('drops colour so the content inherits the host composer', () => {
    expect(strip('<p><span style="color: rgb(32, 33, 36);">Hello</span></p>')).toBe('<p>Hello</p>')
    expect(strip('<div style="background-color: #1a1a1a;">x</div>')).toBe('<div>x</div>')
  })

  it('drops a border, which the earlier deny-list let through', () => {
    // `border-bottom` says nothing about colour in its name, so a rule that dropped properties
    // ending in `color` kept the whole declaration -- colour and all. Naming what is allowed
    // closes that class of gap rather than one instance of it.
    expect(strip('<h2 style="border-bottom: 1px solid rgb(232, 227, 218);">x</h2>')).toBe('<h2>x</h2>')
  })

  it('drops the page typography that has no meaning in a composer', () => {
    expect(strip('<p style="font-family: Lora, Georgia, serif;">x</p>')).toBe('<p>x</p>')
    expect(strip('<p style="font-size: 16.8px;">x</p>')).toBe('<p>x</p>')
    // Viewport-relative sizing inside an email is the clearest case of all.
    expect(strip('<h2 style="font-size: clamp(1.4rem, 3vw, 1.9rem);">x</h2>')).toBe('<h2>x</h2>')
  })

  it('drops the spacing of the layout it was lifted from', () => {
    expect(strip('<p style="margin: 3.5rem 0px 1.5rem; padding: 0px 0px 0.5rem;">x</p>')).toBe('<p>x</p>')
  })

  it('drops shadows, filters and blend modes', () => {
    expect(strip('<p style="text-shadow: 0 1px 0 #000; filter: invert(1);">x</p>')).toBe('<p>x</p>')
  })

  it('drops the pre-CSS presentation attributes', () => {
    expect(strip('<p bgcolor="#000000">x</p>')).toBe('<p>x</p>')
    expect(strip('<p background="dark.png">x</p>')).toBe('<p>x</p>')
    expect(strip('<p align="center" width="600">x</p>')).toBe('<p>x</p>')
  })

  it('drops an id, which can collide with one in the host page', () => {
    expect(strip('<h2 id="opening">x</h2>')).toBe('<h2>x</h2>')
  })

  it('drops a class, which can pull styling back in through the host stylesheet', () => {
    expect(strip('<p class="site-heading dark-theme">x</p>')).toBe('<p>x</p>')
  })

  it('unwraps a span or font left holding nothing', () => {
    expect(strip('<p><span style="color: red;">a</span><font color="red">b</font></p>')).toBe('<p>ab</p>')
  })
})

describe('stripForeignPresentation — what stays', () => {
  it('keeps structure', () => {
    expect(strip('<h2>Opening</h2><p>Body</p>')).toBe('<h2>Opening</h2><p>Body</p>')
    expect(strip('<ul><li>one</li><li>two</li></ul>')).toBe('<ul><li>one</li><li>two</li></ul>')
  })

  it('keeps inline semantics', () => {
    expect(strip('<p><strong>bold</strong> and <em>italic</em> and <u>under</u></p>')).toBe(
      '<p><strong>bold</strong> and <em>italic</em> and <u>under</u></p>'
    )
  })

  it('keeps a link with the attributes the editor writes', () => {
    const html = '<a href="https://example.com" target="_blank" rel="noopener noreferrer">link</a>'
    expect(strip(html)).toBe(html)
  })

  it('keeps alignment, the one declaration with no tag to carry it', () => {
    expect(strip('<p style="text-align: center;">x</p>')).toBe('<p style="text-align: center;">x</p>')
  })

  it('keeps it while dropping its neighbours', () => {
    expect(strip('<p style="text-align: right; color: red; font-family: Lora;">x</p>')).toBe(
      '<p style="text-align: right;">x</p>'
    )
  })

  it('drops a weight, because emphasis has already become a tag by this point', () => {
    // The article that prompted this sets `font-weight: 400` on its heading to cancel the
    // browser's bold. Kept, that would arrive in a composer as somebody else's typography.
    expect(strip('<h2 style="font-weight: 400;">x</h2>')).toBe('<h2>x</h2>')
    expect(strip('<span style="font-weight: bold;">x</span>')).toBe('x')
  })

  it('keeps direction and language, which change what the text means', () => {
    expect(strip('<p dir="rtl" lang="he">x</p>')).toBe('<p dir="rtl" lang="he">x</p>')
  })

  it('returns empty input unchanged', () => {
    expect(strip('')).toBe('')
  })
})

describe('stripForeignPresentation — declaration parsing', () => {
  it('drops a data URI value whose own semicolon strands a fragment', () => {
    // Splitting on every semicolon strands `base64,...`, and stranding is harmless: it names no
    // allowed property, so it goes the same way as the declaration it came from.
    const html =
      '<div style="background-image: url(data:image/svg+xml;base64,PHN2Zz4=); text-align: center;">x</div>'
    expect(strip(html)).toBe('<div style="text-align: center;">x</div>')
  })

  it('drops one whose stranded fragment carries a colon of its own', () => {
    // `utf8,<svg xmlns='http://...'` reads as a declaration because of the colon in the URL. It
    // still names no allowed property, so it is still dropped -- which is the property the
    // allow-list has and the deny-list did not.
    const html =
      '<div style="background-image: url(data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\'/>); text-align: center;">x</div>'
    expect(strip(html)).toBe('<div style="text-align: center;">x</div>')
  })

  it('tolerates a missing final semicolon and a malformed declaration', () => {
    expect(strip('<p style="text-align: center">x</p>')).toBe('<p style="text-align: center;">x</p>')
    expect(strip('<p style="text-align: left; garbage">x</p>')).toBe('<p style="text-align: left;">x</p>')
  })

  it('drops an allowed property that has no value', () => {
    expect(strip('<p style="text-align">x</p>')).toBe('<p>x</p>')
    expect(strip('<p style="text-align:   ">x</p>')).toBe('<p>x</p>')
  })

  it('keeps a value that contains a colon of its own', () => {
    expect(strip('<p style="text-align: unset">x</p>')).toBe('<p style="text-align: unset;">x</p>')
  })

  it('matches property names case-insensitively and past whitespace', () => {
    expect(strip('<p style="  TEXT-ALIGN : center ; color: red;">x</p>')).toBe(
      '<p style="TEXT-ALIGN : center;">x</p>'
    )
  })

  it('reaches elements at any depth', () => {
    expect(
      strip('<div><p><span style="color: red;"><em style="color: blue;">deep</em></span></p></div>')
    ).toBe('<div><p><em>deep</em></p></div>')
  })
})
