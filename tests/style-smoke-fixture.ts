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

const theme = '--ground: rgb(250, 251, 252); --ground-subtle: rgb(235, 236, 237); --ground-defined: rgb(220, 221, 222); --ink: rgb(20, 21, 22); --ink-soft: rgb(70, 71, 72); --ink-inverse: rgb(254, 254, 254); --accent: rgb(20, 90, 200); --accent-dim: rgb(60, 110, 200); --rule: rgb(160, 161, 162); --rule-soft: rgb(200, 201, 202); --fail: rgb(180, 0, 0); --fail-faint: rgb(255, 230, 230); --base-tone: var(--ground); --tone: var(--ground-defined); --tone-dim: var(--ground-subtle); --harmonic: var(--rule); --harmonic-minor: var(--rule-soft); --shadow-color: rgba(0, 0, 0, 0.5); --button-bg: rgb(1, 2, 3); --ink-alt: var(--ink-inverse); --button-bg-hover: rgb(4, 5, 6); --kbd-bg: rgb(230, 230, 230); --kbd-border: rgb(100, 100, 100); --status-error-wash: var(--fail-faint); --status-error: var(--fail);'

document.documentElement.setAttribute('style', theme)
document.body.innerHTML = '<div id="page" class="page-container vertical gap-relaxed"><div id="row" class="horizontal gap-snug"><button id="button" class="btn ground-accent ink-inverse corner-md padding-block-tight padding-inline-snug">x</button></div><div id="popup" class="popup-container ground ink"></div></div>'

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
  `<div data-probe="modal" class="modal-dialog vertical ground rule ruled corner-lg hidden">
    <div data-probe="search-view" class="macro-search-view vertical">
      <div data-probe="search-input-container" class="macro-search-input-container padding-relaxed rule ruled-bottom">
        <input data-probe="search-input" class="macro-search-input padding-block-snug padding-inline-comfortable">
      </div>
      <div data-probe="search-results" class="macro-search-results elastic basis-ratio grid scroll-auto">
        <div data-probe="search-item" class="macro-search-item grid span-all position-relative selectable" aria-selected="true">
          <span data-probe="search-cell" class="macro-search-item-command padding-comfortable">command</span>
          <button data-probe="search-edit" class="macro-search-item-edit pressable position-absolute horizontal align-center justify-center padding-tight concealed parent-hover:revealed parent-selected:revealed">edit</button>
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
  `<div data-probe="suggestions" class="macro-suggestions-container ground rule ruled corner-lg font-md hidden" style="left: 24px; top: 24px; position: fixed;">
    <div data-probe="suggestions-list" class="macro-suggestions-commands-list horizontal padding-tight gap-tight rule-soft ruled-bottom" role="listbox">
      <button data-probe="suggestions-option" class="macro-suggestions-command-item pressable compressible min-width-none text-center ground-subtle ink rule-soft ruled corner-md hidden truncate font-sm selectable hover:ground-defined hover:rule selected:ground-defined selected:ink-accent selected:rule-accent" role="option" aria-selected="true">/brb</button>
      <button data-probe="suggestions-option-hover" class="macro-suggestions-command-item pressable compressible min-width-none text-center ground-subtle ink rule-soft ruled corner-md hidden truncate font-sm selectable hover:ground-defined hover:rule selected:ground-defined selected:ink-accent selected:rule-accent" role="option" aria-selected="false">/sig</button>
      <button data-probe="suggestions-option-base" class="macro-suggestions-command-item pressable compressible min-width-none text-center ground-subtle ink rule-soft ruled corner-md hidden truncate font-sm selectable hover:ground-defined hover:rule selected:ground-defined selected:ink-accent selected:rule-accent" role="option" aria-selected="false">/email</button>
    </div>
    <div data-probe="suggestions-footer" class="macro-suggestions-footer horizontal gap-comfortable padding-block-tight padding-inline-comfortable font-xs ink-soft ground rule ruled-top"></div>
  </div>`,
)
shadow(
  composeShadowBundle({ componentStyles: [SUGGESTIONS_STYLES, DELETE_STYLES] }),
  `<div data-probe="deletion" class="macro-suggestions-container delete-confirm ground rule ruled corner-lg font-md">
    <div class="macro-suggestions-commands-list horizontal padding-tight gap-tight rule-soft ruled-bottom" role="listbox">
      <button data-probe="delete-option" class="macro-suggestions-command-item delete-confirm-option pressable elastic basis-ratio min-width-none text-center ground-subtle ink rule-soft ruled corner-md hidden truncate font-sm selectable hover:ground-defined hover:rule selected:ground-defined selected:ink-accent selected:rule-accent" role="option" aria-selected="true">Cancel</button>
    </div>
  </div>`,
)
shadow(
  composeShadowBundle({ componentStyles: [SETTINGS_STYLES, EDITOR_STYLES, CONTENT_EDITOR_STYLES] }),
  `<div data-probe="settings-view" class="settings-view vertical scroll-auto">
    <div data-probe="settings-group" class="settings-group grid padding-block-loose padding-inline-separated">
      <div data-probe="settings-row" class="settings-row horizontal align-center justify-between gap-relaxed padding-block-snug">
        <span class="settings-row-label font-md ink rigid">Theme</span>
        <div data-probe="settings-appearance" class="settings-appearance-controls horizontal align-center gap-comfortable">
          <div data-probe="seg-control" class="seg-control horizontal position-relative ground-subtle rule ruled corner-md hidden">
            <button class="seg-option pressable text-center elastic basis-ratio padding-block-tight padding-inline-comfortable position-relative font-sm ink-soft rule ruled-right selectable hover:ground-defined hover:ink checked:ground-accent checked:ink-inverse" aria-checked="true">One</button>
            <button class="seg-option pressable text-center elastic basis-ratio padding-block-tight padding-inline-comfortable position-relative font-sm ink-soft rule ruled-right selectable hover:ground-defined hover:ink checked:ground-accent checked:ink-inverse" aria-checked="false">Two</button>
          </div>
          <button data-probe="settings-prefix" class="btn btn-outlined font-mono settings-prefix-btn horizontal align-center justify-center rigid position-relative hover:ground-defined">/</button>
        </div>
      </div>
    </div>
    <div data-probe="editor-view" class="macro-editor-view vertical padding-loose ink">
      <form data-probe="editor-form" class="editor-form position-relative elastic basis-ratio vertical gap-comfortable min-height-none">
        <div data-probe="editor-topbar" class="editor-topbar horizontal align-center justify-between gap-relaxed">
          <div data-probe="editor-topbar-lead" class="editor-topbar-lead horizontal align-center gap-snug rigid">
            <button data-probe="editor-popout" class="editor-popout horizontal align-center justify-center padding-tight corner-sm ink-soft">↗</button>
          </div>
          <div class="command-suggestion-wrapper editor-command position-relative elastic basis-ratio">
            <div data-probe="command-suggestions" class="command-suggestions position-absolute ground-subtle rule-accent-soft ruled elevated hidden">
              <div data-probe="command-suggestions-label" class="command-suggestions-label padding-block-tight padding-inline-comfortable font-sm ink-soft rule ruled-bottom">Existing</div>
              <div data-probe="command-suggestion-item" class="command-suggestion-item pressable hidden horizontal align-center gap-comfortable padding-block-snug padding-inline-comfortable selectable hover:ground selected:ground-defined" aria-selected="true">
                <span data-probe="command-suggestion-command" class="command-suggestion-command rigid font-md font-medium ink-accent">/sig</span>
                <span class="command-suggestion-text font-sm ink-soft hidden truncate">Signature</span>
                <button data-probe="command-suggestion-action" class="command-suggestion-action delete pressable horizontal align-center justify-center padding-tight corner-sm ink-soft rigid concealed parent-hover:revealed parent-selected:revealed">×</button>
              </div>
            </div>
          </div>
        </div>
        <div data-probe="content-editor" class="content-editor vertical ground-subtle hidden editor-content elastic basis-ratio">
          <div data-probe="ce-toolbar" class="ce-toolbar horizontal wrap-allowed align-center gap-tight padding-block-tight padding-inline-snug rigid ground">
            <button data-probe="ce-toolbar-btn" class="ce-toolbar-btn pressable horizontal align-center justify-center rigid corner-sm ink-soft hover:ground-defined hover:ink">B</button>
            <div data-probe="ce-style-menu" class="ce-style-menu position-relative">
              <div data-probe="ce-style-dropdown" class="ce-style-dropdown position-absolute vertical padding-tight ground rule ruled corner-md elevated">
                <button data-probe="ce-style-option" class="ce-style-option pressable text-start horizontal align-center gap-snug padding-block-tight padding-inline-snug corner-sm ink font-sm hover:ground-defined">
                  <span class="ce-style-option-short rigid font-xs font-semibold ink-soft">¶</span>
                  <span class="ce-style-option-label elastic basis-ratio">Paragraph</span>
                </button>
              </div>
            </div>
          </div>
          <div data-probe="content-editor-body" class="content-editor-body padding-comfortable ink font-md corner-lg rule ruled scroll-auto focus:rule-accent focus:ring"></div>
        </div>
      </form>
    </div>
  </div>`,
)

document.documentElement.dataset.styleSmokeReady = 'true'
