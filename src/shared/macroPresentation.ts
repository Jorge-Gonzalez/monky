// Macro content is written in Monky's editor and inserted into somebody else's composer, whose
// design Monky neither controls nor can predict. Presentation that travels with the content is
// therefore a bug waiting for the wrong host: colour is the sharpest case -- text pasted from a
// light page arrives black on near-black in a dark Gmail composer -- but it is not the only one.
// A blog's `margin: 3.5rem`, its `font-family: Lora`, and a `font-size: clamp(1.4rem, 3vw,
// 1.9rem)` that sizes text against the viewport are all equally out of place in an email.
//
// The rule is an allow-list, and it has to be one because a deny-list was tried first and missed.
// That version dropped every property whose name ended in `color` plus a handful of shorthands,
// and `border-bottom: 1px solid rgb(232, 227, 218)` walked straight through it: the name says
// nothing about colour, and no list of exceptions is ever finished.
//
// What makes the allow-list safe to draw is that Monky's editor writes no `style` attribute at
// all, and the only attributes it produces are `href`, `target` and `rel`. Its whole expressive
// range is semantic tags: bold, italic, underline, strike, lists, headings, links. So inline
// presentation in a stored macro cannot have been authored here. It came from a page whose design
// has no bearing on where the macro is going, and Monky can neither edit it nor preview it
// faithfully.
//
// Colour is excluded deliberately rather than incidentally. The host has already chosen a text
// colour that reads against its own background, so inheriting borrows a solved problem instead of
// re-deriving it -- and inheritance goes on being right when the host switches theme after the
// insertion, which nothing computed at insert time can manage. `color-scheme` and `light-dark()`
// are the platform's answer for a document you own; this is a fragment in a document Monky does
// not own and cannot ask about.
//
// This concerns presentation only. It is NOT a security sanitiser: it does not remove scripts, and
// while it happens to drop unknown attributes, it must not be relied on for that.

/** Attributes worth carrying: the ones the editor produces, plus those that state meaning. */
const KEPT_ATTRIBUTES = new Set(['href', 'target', 'rel', 'dir', 'lang', 'title'])

/**
 * The one declaration that states meaning and has no tag to carry it. Everything else that might
 * have qualified already has one: the editor's normaliser turns `font-weight: bold` into
 * `<strong>` and `font-style: italic` into `<em>` before this runs, so by the time a weight or a
 * slant reaches here it is the leftover of a page's design rather than an emphasis. The article
 * that prompted all this sets `font-weight: 400` on its heading precisely to undo the browser's
 * bold -- carried into a composer, that is someone else's typography, not the author's intent.
 */
const KEPT_DECLARATIONS = new Set(['text-align'])

/** Wrappers that exist only to carry presentation, and are noise once it is gone. */
const PRESENTATION_ONLY_TAGS = new Set(['span', 'font'])

/**
 * A plain split is enough here, and that is a property of the allow-list rather than luck. Values
 * do contain semicolons -- `background-image: url(data:image/svg+xml;utf8,<svg xmlns='http://...')`
 * is the usual offender -- so splitting naively does strand fragments like `utf8,<svg xmlns='http`.
 * But a stranded fragment only survives if it reads as one of three property names, and no real
 * value embeds `font-weight`, `font-style` or `text-align` after a semicolon. The earlier
 * deny-list needed a paren- and quote-aware scanner for exactly this, because there a fragment
 * only had to fail to look like a colour to be kept. Naming what is allowed removed the need.
 */
function keptDeclaration(declaration: string): boolean {
  const [property, ...rest] = declaration.split(':')
  // Both halves have to hold: the name must be one that is allowed, and there must be a value for
  // it. A fragment stranded by the split fails the first, and a bare `text-align` with nothing
  // after it fails the second -- the browser ignores that too.
  return KEPT_DECLARATIONS.has(property.trim().toLowerCase()) && rest.join(':').trim() !== ''
}

function unwrap(element: Element): void {
  const parent = element.parentNode
  if (!parent) return
  while (element.firstChild) parent.insertBefore(element.firstChild, element)
  parent.removeChild(element)
}

/** Reduce one element to structure and meaning, in place. */
function stripElementPresentation(element: Element): void {
  // Read the style before the attribute sweep, which would otherwise take it wholesale -- `style`
  // is not on the attribute allow-list because it is filtered a declaration at a time instead.
  const styleText = element.getAttribute('style')

  for (const attribute of Array.from(element.attributes)) {
    if (!KEPT_ATTRIBUTES.has(attribute.name.toLowerCase())) element.removeAttribute(attribute.name)
  }

  if (styleText !== null) {
    const kept = styleText.split(';').filter(keptDeclaration)
    if (kept.length > 0) {
      element.setAttribute('style', `${kept.map((declaration) => declaration.trim()).join('; ')};`)
    }
  }

  // A span or font that carried nothing but presentation has no reason to survive it.
  if (PRESENTATION_ONLY_TAGS.has(element.tagName.toLowerCase()) && element.attributes.length === 0) {
    unwrap(element)
  }
}

/**
 * Remove everything from `html` that ties it to the page it was written on, so that it takes the
 * typography and colours of wherever it is inserted.
 */
export function stripForeignPresentation(html: string): string {
  if (!html) return html
  const container = document.createElement('div')
  container.innerHTML = html
  for (const element of Array.from(container.querySelectorAll('*'))) {
    stripElementPresentation(element)
  }
  return container.innerHTML
}
