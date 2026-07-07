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
  `<div data-probe="suggestions" class="macro-suggestions-container">
    <div data-probe="suggestions-list" class="macro-suggestions-commands-list horizontal padding-tight gap-tight" role="listbox">
      <button data-probe="suggestions-option" class="macro-suggestions-command-item compressible" role="option" aria-selected="true">/brb</button>
    </div>
    <div data-probe="suggestions-footer" class="macro-suggestions-footer horizontal gap-comfortable"></div>
  </div>`,
)
shadow(
  composeShadowBundle({ componentStyles: [SUGGESTIONS_STYLES, DELETE_STYLES] }),
  `<div data-probe="deletion" class="macro-suggestions-container delete-confirm">
    <div class="macro-suggestions-commands-list horizontal padding-tight gap-tight" role="listbox">
      <button data-probe="delete-option" class="macro-suggestions-command-item delete-confirm-option elastic basis-ratio" role="option" aria-selected="true">Cancel</button>
    </div>
  </div>`,
)
shadow(
  composeShadowBundle({ componentStyles: [SETTINGS_STYLES, EDITOR_STYLES, CONTENT_EDITOR_STYLES] }),
  `<div data-probe="settings-view" class="settings-view vertical">
    <div data-probe="settings-group" class="settings-group grid padding-block-loose padding-inline-separated">
      <div data-probe="settings-row" class="settings-row horizontal align-center justify-between gap-relaxed padding-block-snug">
        <span class="settings-row-label">Theme</span>
        <div data-probe="settings-appearance" class="settings-appearance-controls horizontal align-center gap-comfortable">
          <div data-probe="seg-control" class="seg-control horizontal position-relative">
            <button class="seg-option elastic basis-ratio padding-block-tight padding-inline-comfortable position-relative" aria-checked="true">One</button>
            <button class="seg-option elastic basis-ratio padding-block-tight padding-inline-comfortable position-relative" aria-checked="false">Two</button>
          </div>
          <button data-probe="settings-prefix" class="btn btn-outlined text-mono settings-prefix-btn horizontal align-center justify-center rigid">/</button>
        </div>
      </div>
    </div>
    <div data-probe="editor-view" class="macro-editor-view vertical padding-loose">
      <form data-probe="editor-form" class="editor-form position-relative elastic basis-ratio vertical gap-comfortable">
        <div data-probe="editor-topbar" class="editor-topbar horizontal align-center justify-between gap-relaxed">
          <div data-probe="editor-topbar-lead" class="editor-topbar-lead horizontal align-center gap-snug rigid">
            <button data-probe="editor-popout" class="editor-popout horizontal align-center justify-center padding-tight">↗</button>
          </div>
          <div class="command-suggestion-wrapper editor-command position-relative elastic basis-ratio">
            <div data-probe="command-suggestions" class="command-suggestions position-absolute">
              <div data-probe="command-suggestions-label" class="command-suggestions-label padding-block-tight padding-inline-comfortable">Existing</div>
              <div data-probe="command-suggestion-item" class="command-suggestion-item horizontal align-center gap-comfortable padding-block-snug padding-inline-comfortable" aria-selected="true">
                <span data-probe="command-suggestion-command" class="command-suggestion-command rigid">/sig</span>
                <span class="command-suggestion-text">Signature</span>
                <button data-probe="command-suggestion-action" class="command-suggestion-action delete horizontal align-center justify-center padding-tight">×</button>
              </div>
            </div>
          </div>
        </div>
        <div data-probe="content-editor" class="content-editor vertical editor-content elastic basis-ratio">
          <div data-probe="ce-toolbar" class="ce-toolbar horizontal wrap-allowed align-center gap-tight padding-block-tight padding-inline-snug rigid">
            <button data-probe="ce-toolbar-btn" class="ce-toolbar-btn horizontal align-center justify-center rigid">B</button>
            <div data-probe="ce-style-menu" class="ce-style-menu position-relative">
              <div data-probe="ce-style-dropdown" class="ce-style-dropdown position-absolute vertical padding-tight">
                <button data-probe="ce-style-option" class="ce-style-option horizontal align-center gap-snug padding-block-tight padding-inline-snug">
                  <span class="ce-style-option-short rigid">¶</span>
                  <span class="ce-style-option-label elastic basis-ratio">Paragraph</span>
                </button>
              </div>
            </div>
          </div>
          <div data-probe="content-editor-body" class="content-editor-body"></div>
        </div>
      </form>
    </div>
  </div>`,
)

document.documentElement.dataset.styleSmokeReady = 'true'
