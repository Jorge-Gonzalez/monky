import LAYOUT_SEMANTIC_STYLES from '../../../styles/layout-semantic.css?raw';
import { createStyleInjector } from './styleInjector';

const FONT_FILE = 'fonts/ibm-plex-sans-condensed-v15-latin-300.woff2';

// layout-semantic.css is the single source of truth for the app @font-face, but its
// url() is build-relative and the modal used to own its registration. Extract it,
// point it at the bundled extension resource, and register it at the document level
// so every overlay's shadow tree can use the app font — not just the modal's.
let registered = false;

export function ensureAppFontFace(): void {
  if (registered) return;
  const fontUrl = chrome.runtime.getURL(FONT_FILE);
  const withUrl = LAYOUT_SEMANTIC_STYLES.replace(`url('/${FONT_FILE}')`, `url('${fontUrl}')`);
  const fontFace = withUrl.match(/@font-face[\s\S]*?}\s*/)?.[0] ?? '';
  createStyleInjector('monky-font-face', fontFace).inject();
  registered = true;
}

// layout-semantic.css with the @font-face stripped — for injecting into a shadow root
// whose document-level @font-face is registered separately via ensureAppFontFace().
export const LAYOUT_STYLES_WITHOUT_FONT_FACE = LAYOUT_SEMANTIC_STYLES.replace(/@font-face[\s\S]*?}\s*/, '');
