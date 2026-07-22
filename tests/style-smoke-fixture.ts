import '../src/styles.css'
import { composeShadowBundle } from '../src/styles/baseBundle'

const theme = '--ground: rgb(250, 251, 252); --ground-subtle: rgb(235, 236, 237); --ground-defined: rgb(220, 221, 222); --ink: rgb(20, 21, 22); --ink-soft: rgb(70, 71, 72); --ink-inverse: rgb(254, 254, 254); --accent: rgb(20, 90, 200); --accent-dim: rgb(60, 110, 200); --pass: rgb(30, 140, 80); --rule: rgb(160, 161, 162); --rule-soft: rgb(200, 201, 202); --fail: rgb(180, 0, 0); --fail-faint: rgb(255, 230, 230); --base-tone: var(--ground); --tone: var(--ground-defined); --tone-dim: var(--ground-subtle); --harmonic: var(--rule); --harmonic-minor: var(--rule-soft); --shadow-color: rgba(0, 0, 0, 0.5); --button-bg: rgb(1, 2, 3); --ink-alt: var(--ink-inverse); --button-bg-hover: rgb(4, 5, 6); --kbd-bg: rgb(230, 230, 230); --kbd-border: rgb(100, 100, 100); --status-error-wash: var(--fail-faint); --status-error: var(--fail); --status-success: var(--pass); --size-sm: 140px; --size-2xl: 42rem;'

document.documentElement.setAttribute('style', theme)
document.body.innerHTML = '<div id="page" class="vertical gap-lg padding-2xl centered flush-block max-width-2xl fill-viewport"><div id="row" class="horizontal gap-sm"><button id="button" class="padding-block-xs padding-inline-sm ground-accent ink-inverse corner-md">x</button></div><div id="popup" class="width-popover-xl ground ink"></div><div class=""><button id="options-prefix" class="padding-block-sm padding-inline-lg control-box-3xl square position-relative selectable ground ink rule corner-md ruled font-lg font-md font-medium font-mono pressable hover:ground-defined focus:ring active:ground-accent active:ink-inverse disabled:ground-subtle disabled:ink-soft disabled:alpha-60 checked:ground-accent checked:ink-inverse checked:rule-accent" aria-checked="false">/</button><button id="options-prefix-selected" class="is-selected padding-block-sm padding-inline-lg control-box-3xl square position-relative selectable ground ink rule corner-md ruled font-lg font-md font-medium font-mono pressable hover:ground-defined hover:alpha-90 focus:ring active:ground-accent active:ink-inverse disabled:ground-subtle disabled:ink-soft disabled:alpha-60 checked:ground-accent checked:ink-inverse checked:rule-accent" aria-checked="true">;</button></div></div>'

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
  composeShadowBundle(),
  `<div data-probe="modal" class="vertical hidden dialog-measure ground rule corner-3xl ruled elevated-soft">
    <div data-probe="search-view" class="vertical fill-block">
      <div data-probe="search-input-container" class="padding-top-xs padding-bottom-md padding-right-xl padding-left-xl">
        <input data-probe="search-input" class="padding-block-sm padding-inline-lg fill-inline
          recessed-soft">
      </div>
      <div data-probe="search-results" class="grid-fit-sm elastic basis-ratio padding-right-lg padding-left-xl margin-right-xs scroll-auto max-height-results-md">
        <div data-probe="search-item" class="subgrid span-all
          position-relative
          selectable
          corner-md
          hover:ground-subtle
          selected:ground-defined" aria-selected="true">
          <span data-probe="search-cell" class="padding-right-xs padding-top-lg padding-bottom-lg padding-left-none">command</span>
          <button data-probe="search-edit" class="horizontal padding-xs align-center justify-center center-y inset-right-sm
            position-absolute
            pressable concealed
            parent-hover:revealed
            parent-selected:revealed">edit</button>
        </div>
      </div>
      <footer data-probe="search-footer" class="horizontal padding-block-sm padding-inline-xl justify-between">
        <div><span data-probe="search-shortcut" class="horizontal inline gap-sm align-center">
          <kbd data-probe="search-kbd" class="horizontal align-center justify-center
            position-relative">Esc</kbd>
        </span></div>
      </footer>
    </div>
  </div>`,
)
shadow(
  composeShadowBundle(),
  `<div data-probe="suggestions" class="hidden max-width-popover-2xl min-width-popover-sm ground rule corner-lg ruled font-md elevated-soft" style="left: 24px; top: 24px; position: fixed;">
    <div data-probe="suggestions-list" class="horizontal gap-xs padding-xs
      rule-soft ruled-bottom" role="listbox">
      <button data-probe="suggestions-option" class="compressible padding-block-xs padding-inline-sm hidden max-width-command min-width-none
        selectable
        ground-subtle ink rule-soft corner-md ruled font-sm text-center pressable truncate
        hover:ground-defined hover:rule
        selected:ground-defined selected:ink-accent selected:rule-accent" role="option" aria-selected="true">/brb</button>
      <button data-probe="suggestions-option-hover" class="compressible padding-block-xs padding-inline-sm hidden max-width-command min-width-none
        selectable
        ground-subtle ink rule-soft corner-md ruled font-sm text-center pressable truncate
        hover:ground-defined hover:rule
        selected:ground-defined selected:ink-accent selected:rule-accent" role="option" aria-selected="false">/sig</button>
      <button data-probe="suggestions-option-base" class="compressible padding-block-xs padding-inline-sm hidden max-width-command min-width-none
        selectable
        ground-subtle ink rule-soft corner-md ruled font-sm text-center pressable truncate
        hover:ground-defined hover:rule
        selected:ground-defined selected:ink-accent selected:rule-accent" role="option" aria-selected="false">/email</button>
    </div>
    <div data-probe="suggestions-footer" class="horizontal gap-md padding-block-xs padding-inline-md justify-end
      ground ink-soft rule ruled-top font-xs"></div>
  </div>`,
)
shadow(
  composeShadowBundle(),
  `<div data-probe="deletion" class="max-width-popover-2xl min-width-popover-md ground rule corner-lg ruled font-md elevated-soft">
    <div class="horizontal gap-xs padding-xs
      rule-soft ruled-bottom" role="listbox">
      <button data-probe="delete-option" class="elastic basis-ratio padding-block-xs padding-inline-sm hidden min-width-none
        selectable
        ground-subtle ink rule-soft corner-md ruled font-sm text-center pressable truncate
        hover:ground-defined hover:rule
        selected:ground-defined selected:ink-accent selected:rule-accent" role="option" aria-selected="true">Cancel</button>
    </div>
  </div>`,
)
shadow(
  composeShadowBundle(),
  `<div data-probe="settings-view" class="vertical scroll-auto fill-block">
    <div data-probe="settings-group" class="columns-12 padding-block-xl padding-inline-3xl">
      <div data-probe="settings-label" class="quarter padding-right-sm padding-top-md padding-bottom-none padding-left-none
        ink-accent-soft font-xs font-medium overline">General</div>
      <div data-probe="settings-rows" class="three-quarters">
      <div data-probe="settings-row" class="horizontal gap-lg padding-block-sm align-center justify-between">
        <span class="rigid
          ink font-md">Theme</span>
        <div data-probe="settings-appearance" class="horizontal gap-md align-center">
          <div data-probe="seg-control" class="horizontal hidden
            position-relative
            ground-subtle rule corner-md ruled">
            <button class="elastic basis-ratio padding-block-xs padding-inline-md
              position-relative
              selectable
              ink-soft rule font-sm text-center pressable
              hover:ground-defined hover:ink
              checked:ground-accent checked:ink-inverse" aria-checked="true">One</button>
            <button class="elastic basis-ratio padding-block-xs padding-inline-md
              position-relative
              selectable
              ink-soft rule font-sm text-center pressable
              hover:ground-defined hover:ink
              checked:ground-accent checked:ink-inverse" aria-checked="false">Two</button>
          </div>
          <button data-probe="settings-prefix" class="horizontal rigid padding-none align-center justify-center control-box-xl
            position-relative
            ground-subtle ink rule corner-md ruled font-md font-medium font-mono pressable
            hover:ground-defined
            focus:ring
            active:ground-accent active:ink-inverse
            disabled:ground-subtle disabled:ink-soft disabled:alpha-60">/</button>
          <button data-probe="settings-export" class="rigid padding-block-sm padding-inline-lg
            ground-subtle ink rule corner-md ruled font-md font-medium pressable
            hover:ground-defined
            focus:ring
            active:ground-accent active:ink-inverse
            disabled:ground-subtle disabled:ink-soft disabled:alpha-60">Export</button>
        </div>
      </div>
      </div>
    </div>
    <div data-probe="editor-view" class="vertical padding-xl fill-block
      ink">
      <form data-probe="editor-form" class="vertical elastic basis-ratio gap-md min-height-none
        position-relative">
        <div data-probe="editor-topbar" class="horizontal gap-lg align-center justify-between">
          <div data-probe="editor-topbar-lead" class="horizontal rigid gap-sm align-center">
            <button data-probe="editor-popout" class="horizontal padding-xs align-center justify-center
              ink-soft corner-sm">↗</button>
          </div>
          <div class="elastic basis-ratio width-popover-lg
            position-relative">
            <div data-probe="command-suggestions" class="hidden attach-below stretch-inline
              dropdown position-absolute
              ground-subtle rule-accent-soft corner-bottom-md ruled-bottom ruled-left ruled-right elevated">
              <div data-probe="command-suggestions-label" class="padding-block-xs padding-inline-md
                ink-soft rule ruled-bottom font-sm">Existing</div>
              <div data-probe="command-suggestion-item" class="horizontal gap-md padding-block-sm padding-inline-md align-center hidden
                selectable
                pressable
                hover:ground
                selected:ground-defined" aria-selected="true">
                <span data-probe="command-suggestion-command" class="rigid
                  ink-accent font-md font-medium">/sig</span>
                <span class="hidden
                  ink-soft font-sm truncate">Signature</span>
                <button data-probe="command-suggestion-action" class="horizontal rigid padding-xs push align-center justify-center
                  ink-soft corner-sm pressable concealed
                  parent-hover:revealed
                  parent-selected:revealed">×</button>
              </div>
            </div>
          </div>
        </div>
        <div data-probe="content-editor" class="vertical elastic basis-ratio hidden min-height-none
          ground-subtle">
          <div data-probe="ce-toolbar" class="horizontal rigid gap-xs padding-block-xs padding-inline-sm align-center wrap-allowed
            ground">
            <button data-probe="ce-toolbar-btn" class="horizontal rigid padding-none align-center justify-center control-box-lg
              ink-soft corner-sm pressable
              hover:ground-defined hover:ink
              pressed:ground-defined pressed:ink-accent" aria-pressed="true">B</button>
            <div data-probe="ce-style-menu" class="position-relative">
              <div data-probe="ce-style-dropdown" class="vertical gap-xs padding-xs attach-left attach-below-xs
                position-absolute
                ground rule corner-md ruled elevated">
                <button data-probe="ce-style-option" class="horizontal gap-sm padding-block-xs padding-inline-sm align-center fill-inline
                  selectable
                  ink corner-sm font-sm text-start pressable
                  hover:ground-defined
                  selected:ground-defined selected:ink-accent" aria-selected="true">
                  <span class="rigid control-inline-md
                    ink-soft font-xs font-semibold
                    parent-selected:ink-accent">¶</span>
                  <span class="elastic basis-ratio">Paragraph</span>
                </button>
              </div>
            </div>
          </div>
          <div data-probe="content-editor-body" class="elastic basis-ratio padding-md scroll-auto min-height-none
            ink rule corner-lg ruled font-md
            focus:rule-accent focus:ring"></div>
        </div>
        <div data-probe="button-group" class="horizontal inline gap-sm">
          <button data-probe="button-cancel" class="padding-block-sm padding-inline-lg
            ground ink rule corner-md ruled font-md font-medium pressable
            hover:ground-defined
            focus:ring
            active:ground-accent active:ink-inverse
            disabled:ground-subtle disabled:ink-soft disabled:alpha-60">Cancel</button>
          <button data-probe="button-save" class="padding-block-sm padding-inline-lg
            ground-pass ink-inverse rule corner-md ruled font-md font-medium pressable
            hover:ground-pass
            focus:ring
            active:ground-accent active:ink-inverse
            disabled:ground-subtle disabled:ink-soft disabled:alpha-60">Save</button>
        </div>
      </form>
    </div>
  </div>`,
)

document.documentElement.dataset.styleSmokeReady = 'true'
