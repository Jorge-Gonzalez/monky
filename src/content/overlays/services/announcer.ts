// A screen reader reads what has focus. The suggestions overlay must not take focus --
// the user is still typing into the host page's field -- so the highlight moving has no
// natural announcement, and the usual remedy is unavailable: aria-activedescendant is an
// IDREF, and IDREFs do not cross the shadow boundary the overlay renders behind.
//
// A live region does cross it, because it carries text rather than a reference. This one
// lives in the host document beside the overlay, not inside it, and the overlay writes
// what the user would otherwise have to see.

let region: HTMLElement | null = null

// Ermine's grammar is injected into the overlay's shadow root, so it does not reach a node
// in the host document; the offscreen rule has to be written here.
const OFFSCREEN = [
  'position:fixed',
  'width:1px',
  'height:1px',
  'margin:-1px',
  'padding:0',
  'border:0',
  'overflow:hidden',
  'clip:rect(0 0 0 0)',
  'clip-path:inset(50%)',
  'white-space:nowrap',
].join(';')

function ensureRegion(): HTMLElement {
  if (region?.isConnected) return region
  region = document.createElement('div')
  region.setAttribute('data-component', 'monky-announcer')
  region.setAttribute('aria-live', 'polite')
  region.setAttribute('aria-atomic', 'true')
  region.setAttribute('role', 'status')
  region.style.cssText = OFFSCREEN
  document.body.appendChild(region)
  return region
}

/**
 * Speak `message` politely. Passing the empty string clears the region, which matters
 * between openings: a live region does not re-announce text it already holds.
 */
export function announce(message: string): void {
  ensureRegion().textContent = message
}

export function removeAnnouncer(): void {
  region?.remove()
  region = null
}
