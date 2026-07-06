import '../src/styles.css'
import '../src/popup/popup.css'
import { composeShadowBundle } from '../src/styles/baseBundle'
import MODAL_STYLES from '../src/content/overlays/modal/modalStyles.css?raw'
import SEARCH_STYLES from '../src/content/overlays/views/search/searchViewStyles.css?raw'
import SETTINGS_STYLES from '../src/content/overlays/views/settings/settingsViewStyles.css?raw'
import EDITOR_STYLES from '../src/content/overlays/views/macroEditor/editorViewStyles.css?raw'
import CONTENT_EDITOR_STYLES from '../src/styles/components/content-editor.css?raw'
import SUGGESTIONS_STYLES from '../src/content/overlays/suggestionsOverlay/suggestionsOverlayStyles.css?raw'
import DELETE_STYLES from '../src/content/overlays/deleteConfirm/deleteConfirmStyles.css?raw'

const theme = '--base-tone: rgb(250, 251, 252); --ink: rgb(20, 21, 22); --ink-soft: rgb(70, 71, 72); --accent: rgb(20, 90, 200); --accent-dim: rgb(60, 110, 200); --tone: rgb(220, 221, 222); --tone-dim: rgb(235, 236, 237); --harmonic: rgb(160, 161, 162); --harmonic-minor: rgb(200, 201, 202); --shadow-color: rgba(0, 0, 0, 0.5); --button-bg: rgb(1, 2, 3); --ink-alt: rgb(254, 254, 254); --button-bg-hover: rgb(4, 5, 6); --kbd-bg: rgb(230, 230, 230); --kbd-border: rgb(100, 100, 100); --status-error-wash: rgb(255, 230, 230); --status-error: rgb(180, 0, 0);'

document.documentElement.setAttribute('style', theme)
document.body.innerHTML = '<div id="page" class="page-container"><div id="row" class="horizontal gap-2"><button id="button" class="btn btn-primary">x</button></div><div id="popup" class="popup-container"></div></div>'

function shadow(css: string, html: string): void {
  const host = document.createElement('div')
  host.setAttribute('style', theme)
  const root = host.attachShadow({ mode: 'open' })
  const style = document.createElement('style')
  style.textContent = css
  root.append(style)
  const content = document.createElement('div')
  content.innerHTML = html
  root.append(...content.childNodes)
  document.body.append(host)
}

shadow(
  composeShadowBundle({ componentStyles: [MODAL_STYLES, SEARCH_STYLES, SETTINGS_STYLES, EDITOR_STYLES, CONTENT_EDITOR_STYLES] }),
  `<div data-probe="modal" class="modal-dialog vertical">
    <div data-probe="search-view" class="macro-search-view vertical">
      <div data-probe="search-input-container" class="macro-search-input-container padding-relaxed">
        <input data-probe="search-input" class="macro-search-input padding-block-snug padding-inline-comfortable">
      </div>
      <div data-probe="search-results" class="macro-search-results elastic basis-ratio grid">
        <div data-probe="search-item" class="macro-search-item grid span-all position-relative" aria-selected="true">
          <span data-probe="search-cell" class="macro-search-item-command padding-comfortable">command</span>
          <button data-probe="search-edit" class="macro-search-item-edit position-absolute horizontal align-center justify-center padding-tight">edit</button>
        </div>
      </div>
      <footer data-probe="search-footer" class="macro-search-footer padding-snug horizontal justify-between">
        <div><span data-probe="search-shortcut" class="macro-search-shortcut horizontal inline align-center gap-snug">
          <kbd data-probe="search-kbd" class="macro-search-kbd position-relative horizontal align-center justify-center">Esc</kbd>
        </span></div>
      </footer>
    </div>
  </div>`,
)
shadow(
  composeShadowBundle({ componentStyles: [SUGGESTIONS_STYLES] }),
  '<div data-probe="suggestions" class="macro-suggestions-container"><div class="macro-suggestions-commands-list"></div></div>',
)
shadow(
  composeShadowBundle({ componentStyles: [SUGGESTIONS_STYLES, DELETE_STYLES] }),
  '<div data-probe="deletion" class="macro-suggestions-container delete-confirm"></div>',
)

document.documentElement.dataset.styleSmokeReady = 'true'
