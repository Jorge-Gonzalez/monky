// Macro content is written in Monky's editor and inserted into somebody else's composer, whose
// theme Monky neither controls nor can predict. Absolute colours travelling with the content are
// therefore a bug waiting for the wrong host: text pasted from a light page disappears into a
// dark Gmail composer, and text pasted from a dark page disappears into a light one.
//
// The answer is to carry no colour at all, so the content inherits the composer's own. That is
// not a compromise, it is strictly better than adapting, for two reasons. The host already chose
// a text colour that reads against its own background, so inheriting borrows a solved problem
// rather than re-deriving it. And inheritance keeps working when the host switches theme after
// the insertion -- which nothing baked in at insert time can do.
//
// Measuring the host and adapting was the alternative, and it is worse on its own terms. It needs
// the effective background, which means walking ancestors through transparency and then giving up
// on gradients and images; and what it produces is precisely the absolute value that breaks on the
// next theme toggle. `light-dark()` and `color-scheme` are the platform's answer for a document
// you own, and this is a fragment in a document Monky does not own: it cannot know whether the
// host opted into a scheme at all.
//
// Nothing intentional is lost, because there is nothing intentional to lose. Monky's editor offers
// no colour control and none of its execCommand calls emit one, so every colour in a stored macro
// arrived by paste, carrying the theme of a page that has nothing to do with where the macro is
// going.
//
// This concerns appearance only. It is NOT a security sanitiser: it does not remove scripts, event
// handler attributes, or anything else that could execute, and must not be mistaken for something
// that does.

/** Attributes that state a colour outright, from the pre-CSS era of pasted markup. */
const APPEARANCE_ATTRIBUTES = ['bgcolor', 'color', 'background']

/**
 * Declarations that carry no colour in their name but encode a theme in their value: a shorthand
 * that can hold one, a shadow, or the filter tricks pages use to build a dark mode.
 */
const APPEARANCE_PROPERTIES = new Set([
  'background',
  'background-image',
  'box-shadow',
  'text-shadow',
  'filter',
  'backdrop-filter',
  'mix-blend-mode',
])

/**
 * Any property whose name ends in `color` is one, which covers the longhands, the vendor-prefixed
 * ones like `-webkit-text-fill-color`, and any the platform adds later.
 */
function isAppearanceProperty(property: string): boolean {
  const name = property.trim().toLowerCase()
  return name.endsWith('color') || APPEARANCE_PROPERTIES.has(name)
}

/**
 * Split a style attribute into declarations on top-level semicolons only. A naive split breaks on
 * `background-image: url(data:image/svg+xml;base64,...)`, whose value contains one -- and that is
 * exactly the kind of declaration this module exists to remove, so mis-splitting it would leave a
 * fragment behind rather than drop it.
 */
function splitDeclarations(styleText: string): string[] {
  const declarations: string[] = []
  let depth = 0
  let quote: string | null = null
  let current = ''

  for (const character of styleText) {
    if (quote) {
      if (character === quote) quote = null
    } else if (character === '"' || character === "'") {
      quote = character
    } else if (character === '(') {
      depth++
    } else if (character === ')') {
      depth = Math.max(0, depth - 1)
    } else if (character === ';' && depth === 0) {
      declarations.push(current)
      current = ''
      continue
    }
    current += character
  }
  declarations.push(current)
  return declarations.filter((declaration) => declaration.trim() !== '')
}

/** Strip theme-bearing declarations and attributes from one element, in place. */
function stripElementAppearance(element: Element): void {
  for (const attribute of APPEARANCE_ATTRIBUTES) {
    element.removeAttribute(attribute)
  }
  // A class from a foreign page is an appearance carrier Monky cannot audit -- it may match a rule
  // in the host and pull a colour back in through the side door. Macro content never carries one
  // of Monky's own, so there is nothing here to keep.
  element.removeAttribute('class')

  const styleText = element.getAttribute('style')
  if (styleText === null) return

  const kept = splitDeclarations(styleText).filter((declaration) => {
    const separator = declaration.indexOf(':')
    // A declaration with no colon is malformed; the browser drops it and so does this.
    return separator > 0 && !isAppearanceProperty(declaration.slice(0, separator))
  })

  if (kept.length === 0) element.removeAttribute('style')
  else element.setAttribute('style', `${kept.map((declaration) => declaration.trim()).join('; ')};`)
}

/**
 * Remove everything from `html` that would pin it to the theme it was written against, so that it
 * takes the colours of wherever it is inserted.
 */
export function stripThemeAppearance(html: string): string {
  if (!html) return html
  const container = document.createElement('div')
  container.innerHTML = html
  for (const element of Array.from(container.querySelectorAll('*'))) {
    stripElementAppearance(element)
  }
  return container.innerHTML
}
