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

const theme = '--ground: rgb(250, 251, 252); --ground-subtle: rgb(235, 236, 237); --ground-defined: rgb(220, 221, 222); --ink: rgb(20, 21, 22); --ink-soft: rgb(70, 71, 72); --ink-inverse: rgb(254, 254, 254); --accent: rgb(20, 90, 200); --accent-dim: rgb(60, 110, 200); --pass: rgb(30, 140, 80); --rule: rgb(160, 161, 162); --rule-soft: rgb(200, 201, 202); --fail: rgb(180, 0, 0); --fail-faint: rgb(255, 230, 230); --base-tone: var(--ground); --tone: var(--ground-defined); --tone-dim: var(--ground-subtle); --harmonic: var(--rule); --harmonic-minor: var(--rule-soft); --shadow-color: rgba(0, 0, 0, 0.5); --button-bg: rgb(1, 2, 3); --ink-alt: var(--ink-inverse); --button-bg-hover: rgb(4, 5, 6); --kbd-bg: rgb(230, 230, 230); --kbd-border: rgb(100, 100, 100); --status-error-wash: var(--fail-faint); --status-error: var(--fail); --status-success: var(--pass); --size-sm: 140px; --size-2xl: 42rem;'

document.documentElement.setAttribute('style', theme)
document.body.innerHTML = '<div id="page" class="page-container fill-viewport vertical gap-lg padding-2xl max-width-2xl centered flush-block"><div id="row" class="horizontal gap-sm"><button id="button" class="btn padding-block-xs padding-inline-sm ground-accent ink-inverse corner-md">x</button></div><div id="popup" class="popup-container ground ink"></div><div class="selectable-group"><button id="options-prefix" class="btn prefix-cell square padding-block-sm padding-inline-lg position-relative ground ink rule corner-md ruled font-lg font-md font-medium font-mono pressable hover:ground-defined focus:ring active:ground-accent active:ink-inverse disabled:ground-subtle disabled:ink-soft">/</button><button id="options-prefix-selected" class="btn prefix-cell square is-selected padding-block-sm padding-inline-lg position-relative ground ink rule corner-md ruled font-lg font-md font-medium font-mono pressable hover:ground-defined focus:ring active:ground-accent active:ink-inverse disabled:ground-subtle disabled:ink-soft">;</button></div></div>'

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
  `<div data-probe="modal" class="modal-dialog vertical hidden ground rule corner-lg ruled">
    <div data-probe="search-view" class="macro-search-view fill-block vertical">
      <div data-probe="search-input-container" class="macro-search-input-container padding-lg rule ruled-bottom">
        <input data-probe="search-input" class="macro-search-input fill-inline padding-block-sm padding-inline-md">
      </div>
      <div data-probe="search-results" class="macro-search-results grid-fit-sm elastic basis-ratio scroll-auto">
        <div data-probe="search-item" class="macro-search-item subgrid span-all position-relative selectable" aria-selected="true">
          <span data-probe="search-cell" class="macro-search-item-command padding-md">command</span>
          <button data-probe="search-edit" class="macro-search-item-edit horizontal padding-xs align-center justify-center position-absolute pressable concealed parent-hover:revealed parent-selected:revealed">edit</button>
        </div>
      </div>
      <footer data-probe="search-footer" class="macro-search-footer horizontal padding-sm justify-between">
        <div><span data-probe="search-shortcut" class="macro-search-shortcut horizontal inline gap-sm align-center">
          <kbd data-probe="search-kbd" class="macro-search-kbd horizontal align-center justify-center position-relative">Esc</kbd>
        </span></div>
      </footer>
    </div>
  </div>`,
)
shadow(
  composeShadowBundle({ componentStyles: [SUGGESTIONS_STYLES] }),
  `<div data-probe="suggestions" class="macro-suggestions-container hidden ground rule corner-lg ruled font-md" style="left: 24px; top: 24px; position: fixed;">
    <div data-probe="suggestions-list" class="macro-suggestions-commands-list horizontal gap-xs padding-xs rule-soft ruled-bottom" role="listbox">
      <button data-probe="suggestions-option" class="macro-suggestions-command-item compressible hidden min-width-none selectable ground-subtle ink rule-soft corner-md ruled font-sm text-center pressable truncate hover:ground-defined hover:rule selected:ground-defined selected:ink-accent selected:rule-accent" role="option" aria-selected="true">/brb</button>
      <button data-probe="suggestions-option-hover" class="macro-suggestions-command-item compressible hidden min-width-none selectable ground-subtle ink rule-soft corner-md ruled font-sm text-center pressable truncate hover:ground-defined hover:rule selected:ground-defined selected:ink-accent selected:rule-accent" role="option" aria-selected="false">/sig</button>
      <button data-probe="suggestions-option-base" class="macro-suggestions-command-item compressible hidden min-width-none selectable ground-subtle ink rule-soft corner-md ruled font-sm text-center pressable truncate hover:ground-defined hover:rule selected:ground-defined selected:ink-accent selected:rule-accent" role="option" aria-selected="false">/email</button>
    </div>
    <div data-probe="suggestions-footer" class="macro-suggestions-footer horizontal gap-md padding-block-xs padding-inline-md ground ink-soft rule ruled-top font-xs"></div>
  </div>`,
)
shadow(
  composeShadowBundle({ componentStyles: [SUGGESTIONS_STYLES, DELETE_STYLES] }),
  `<div data-probe="deletion" class="macro-suggestions-container delete-confirm ground rule corner-lg ruled font-md">
    <div class="macro-suggestions-commands-list horizontal gap-xs padding-xs rule-soft ruled-bottom" role="listbox">
      <button data-probe="delete-option" class="macro-suggestions-command-item delete-confirm-option elastic basis-ratio hidden min-width-none selectable ground-subtle ink rule-soft corner-md ruled font-sm text-center pressable truncate hover:ground-defined hover:rule selected:ground-defined selected:ink-accent selected:rule-accent" role="option" aria-selected="true">Cancel</button>
    </div>
  </div>`,
)
shadow(
  composeShadowBundle({ componentStyles: [SETTINGS_STYLES, EDITOR_STYLES, CONTENT_EDITOR_STYLES] }),
  `<div data-probe="settings-view" class="settings-view fill-block vertical scroll-auto">
    <div data-probe="settings-group" class="settings-group columns-12 padding-block-xl padding-inline-3xl">
      <div data-probe="settings-label" class="settings-section-label quarter overline ink-accent-soft font-xs font-medium">General</div>
      <div data-probe="settings-rows" class="settings-rows three-quarters">
      <div data-probe="settings-row" class="settings-row horizontal gap-lg padding-block-sm align-center justify-between">
        <span class="settings-row-label rigid ink font-md">Theme</span>
        <div data-probe="settings-appearance" class="settings-appearance-controls horizontal gap-md align-center">
          <div data-probe="seg-control" class="seg-control horizontal hidden position-relative ground-subtle rule corner-md ruled">
            <button class="seg-option elastic basis-ratio padding-block-xs padding-inline-md position-relative selectable ink-soft rule ruled-right font-sm text-center pressable hover:ground-defined hover:ink checked:ground-accent checked:ink-inverse" aria-checked="true">One</button>
            <button class="seg-option elastic basis-ratio padding-block-xs padding-inline-md position-relative selectable ink-soft rule ruled-right font-sm text-center pressable hover:ground-defined hover:ink checked:ground-accent checked:ink-inverse" aria-checked="false">Two</button>
          </div>
          <button data-probe="settings-prefix" class="btn settings-prefix-btn horizontal rigid padding-block-sm padding-inline-lg align-center justify-center position-relative ground-subtle ink rule corner-md ruled font-md font-medium font-mono pressable hover:ground-defined focus:ring active:ground-accent active:ink-inverse disabled:ground-subtle disabled:ink-soft">/</button>
          <button data-probe="settings-export" class="btn rigid padding-block-sm padding-inline-lg ground-subtle ink rule corner-md ruled font-md font-medium pressable hover:ground-defined focus:ring active:ground-accent active:ink-inverse disabled:ground-subtle disabled:ink-soft">Export</button>
        </div>
      </div>
      </div>
    </div>
    <div data-probe="editor-view" class="macro-editor-view fill-block vertical padding-xl ink">
      <form data-probe="editor-form" class="editor-form vertical elastic basis-ratio gap-md min-height-none position-relative">
        <div data-probe="editor-topbar" class="editor-topbar horizontal gap-lg align-center justify-between">
          <div data-probe="editor-topbar-lead" class="editor-topbar-lead horizontal rigid gap-sm align-center">
            <button data-probe="editor-popout" class="editor-popout horizontal padding-xs align-center justify-center ink-soft corner-sm">↗</button>
          </div>
          <div class="command-suggestion-wrapper editor-command elastic basis-ratio position-relative">
            <div data-probe="command-suggestions" class="command-suggestions hidden position-absolute ground-subtle rule-accent-soft ruled elevated">
              <div data-probe="command-suggestions-label" class="command-suggestions-label padding-block-xs padding-inline-md ink-soft rule ruled-bottom font-sm">Existing</div>
              <div data-probe="command-suggestion-item" class="command-suggestion-item horizontal gap-md padding-block-sm padding-inline-md align-center hidden selectable pressable hover:ground selected:ground-defined" aria-selected="true">
                <span data-probe="command-suggestion-command" class="command-suggestion-command rigid ink-accent font-md font-medium">/sig</span>
                <span class="command-suggestion-text hidden ink-soft font-sm truncate">Signature</span>
                <button data-probe="command-suggestion-action" class="command-suggestion-action delete horizontal rigid push padding-xs align-center justify-center ink-soft corner-sm pressable concealed parent-hover:revealed parent-selected:revealed">×</button>
              </div>
            </div>
          </div>
        </div>
        <div data-probe="content-editor" class="content-editor editor-content vertical elastic basis-ratio hidden ground-subtle">
          <div data-probe="ce-toolbar" class="ce-toolbar horizontal rigid gap-xs padding-block-xs padding-inline-sm align-center wrap-allowed ground">
            <button data-probe="ce-toolbar-btn" class="ce-toolbar-btn horizontal rigid align-center justify-center ink-soft corner-sm pressable hover:ground-defined hover:ink">B</button>
            <div data-probe="ce-style-menu" class="ce-style-menu position-relative">
              <div data-probe="ce-style-dropdown" class="ce-style-dropdown vertical padding-xs position-absolute min-width-sm ground rule corner-md ruled elevated">
                <button data-probe="ce-style-option" class="ce-style-option fill-inline horizontal gap-sm padding-block-xs padding-inline-sm align-center ink corner-sm font-sm text-start pressable hover:ground-defined">
                  <span class="ce-style-option-short rigid ink-soft font-xs font-semibold">¶</span>
                  <span class="ce-style-option-label elastic basis-ratio">Paragraph</span>
                </button>
              </div>
            </div>
          </div>
          <div data-probe="content-editor-body" class="content-editor-body padding-md scroll-auto ink rule corner-lg ruled font-md focus:rule-accent focus:ring"></div>
        </div>
        <div data-probe="button-group" class="button-group horizontal inline gap-sm">
          <button data-probe="button-cancel" class="btn padding-block-sm padding-inline-lg ground ink rule corner-md ruled font-md font-medium pressable hover:ground-defined focus:ring active:ground-accent active:ink-inverse disabled:ground-subtle disabled:ink-soft">Cancel</button>
          <button data-probe="button-save" class="btn btn-success padding-block-sm padding-inline-lg ground-pass ink-inverse rule corner-md ruled font-md font-medium pressable focus:ring active:ground-accent active:ink-inverse disabled:ground-subtle disabled:ink-soft">Save</button>
        </div>
      </form>
    </div>
  </div>`,
)

document.documentElement.dataset.styleSmokeReady = 'true'
