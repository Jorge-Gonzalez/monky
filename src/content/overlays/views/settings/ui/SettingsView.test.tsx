// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/preact'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SettingsView } from './SettingsView'
import { useOptions } from '../../../../../options'
import { useMacroImportExport } from '../useMacroImportExport'

// The layout components, the segmented controls and the selectable group all render for
// real; this file is about the wiring between them and the two hooks at the edges.
vi.mock('../../../../../lib/i18n', () => ({ t: (key: string) => key }))
vi.mock('../../../../../options', () => ({ useOptions: vi.fn() }))
vi.mock('../useMacroImportExport', () => ({ useMacroImportExport: vi.fn() }))

const options = () => ({
  prefixes: ['/'],
  useCommitKeys: false,
  colorTheme: 'humo' as const,
  theme: 'light' as const,
  language: 'en' as const,
  setPrefixes: vi.fn(),
  setUseCommitKeys: vi.fn(),
  setColorTheme: vi.fn(),
  setTheme: vi.fn(),
  setLanguage: vi.fn(),
})

const io = () => ({ status: undefined, exportMacros: vi.fn(), importFromFile: vi.fn() })

let opts: ReturnType<typeof options>
let port: ReturnType<typeof io>

const props = { onClose: vi.fn(), onViewChange: vi.fn(), onNavigateToEditor: vi.fn() }

const rowLabelled = (label: string) =>
  [...document.querySelectorAll('[data-component="settings-row"]')].find(
    (row) => row.querySelector('[data-component="settings-row-label"]')?.textContent === label
  )!

describe('SettingsView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    opts = options()
    port = io()
    vi.mocked(useOptions).mockReturnValue(opts)
    vi.mocked(useMacroImportExport).mockReturnValue(port)
    window.matchMedia = vi.fn().mockReturnValue({ matches: false }) as unknown as typeof window.matchMedia
  })

  describe('layout', () => {
    it('renders the three sections, each with its label', () => {
      render(<SettingsView {...props} />)
      const labels = [...document.querySelectorAll('[data-component="settings-section-label"]')].map(
        (n) => n.textContent
      )
      expect(labels).toEqual([
        'settings.sections.general',
        'settings.sections.appearance',
        'settings.sections.data',
      ])
    })

    it('puts every control in a labelled row', () => {
      // Naming the labels rather than counting them: a bare count says nothing about which row
      // went missing, and it fails identically whether a row was added or lost.
      render(<SettingsView {...props} />)
      const rows = [...document.querySelectorAll('[data-component="settings-row"]')]
      expect(
        rows.map((row) => row.querySelector('[data-component="settings-row-label"]')?.textContent)
      ).toEqual([
        'options.prefixEditor.title',
        'replacementMode.title',
        'settings.colorTheme',
        'settings.language',
        'settings.importExport.title',
        'settings.snapshots.title',
      ])
    })
  })

  describe('writes through to the options store', () => {
    it('switches replacement mode', () => {
      render(<SettingsView {...props} />)
      fireEvent.click(screen.getByText('replacementMode.manualShort'))
      expect(opts.setUseCommitKeys).toHaveBeenCalledWith(true)
    })

    it('switches colour theme', () => {
      render(<SettingsView {...props} />)
      fireEvent.click(screen.getByText('Mar'))
      expect(opts.setColorTheme).toHaveBeenCalledWith('mar')
    })

    it('switches language', () => {
      render(<SettingsView {...props} />)
      fireEvent.click(screen.getByText('Español'))
      expect(opts.setLanguage).toHaveBeenCalledWith('es')
    })

    it('adds a command prefix', () => {
      render(<SettingsView {...props} />)
      // Index 1 is ';'. Clicking '/' would be refused: it is the only one selected, and
      // SelectableGroup will not drop below minSelected.
      const buttons = rowLabelled('options.prefixEditor.title').querySelectorAll('button')
      fireEvent.click(buttons[1])
      expect(opts.setPrefixes).toHaveBeenCalledWith(['/', ';'])
    })

    it('refuses to remove the last remaining prefix', () => {
      render(<SettingsView {...props} />)
      const buttons = rowLabelled('options.prefixEditor.title').querySelectorAll('button')
      fireEvent.click(buttons[0])
      expect(opts.setPrefixes).not.toHaveBeenCalled()
    })
  })

  describe('import and export', () => {
    it('exports on the export button', () => {
      render(<SettingsView {...props} />)
      fireEvent.click(screen.getByText('settings.importExport.exportButton'))
      expect(port.exportMacros).toHaveBeenCalled()
    })

    it('opens the hidden file input from the import button', () => {
      const { container } = render(<SettingsView {...props} />)
      const file = container.querySelector('input[type="file"]') as HTMLInputElement
      const click = vi.spyOn(file, 'click')
      fireEvent.click(screen.getByText('settings.importExport.importButton'))
      expect(click).toHaveBeenCalled()
    })

    it('hands the chosen file to the importer', () => {
      const { container } = render(<SettingsView {...props} />)
      const input = container.querySelector('input[type="file"]') as HTMLInputElement
      const file = new File(['[]'], 'macros.json', { type: 'application/json' })
      // A native dispatch rather than fireEvent.change, because the two libraries disagree
      // about this one case. preact/compat rewrites onChange to the input event for inputs
      // *except* type file, checkbox and radio (compat/src/render.js, `onChangeInputType`),
      // so a file input's handler really is listening for `change`. But
      // @testing-library/preact renames change -> input whenever compat is detected, with
      // no such exemption (fire-event.js, `renameEventCompat`), so fireEvent.change fires
      // `input` at an element that is not listening for it.
      //
      // The component is correct: a browser fires `change` on a file input, which is what
      // it handles. Only the test helper is wrong, so the test dispatches what the browser
      // would. Verified by bisection -- it fails with no `target` option at all, and a
      // text input in the same file passes, so it is not about `files` being read-only.
      Object.defineProperty(input, 'files', { value: [file], configurable: true })
      input.dispatchEvent(new Event('change', { bubbles: true }))
      expect(port.importFromFile).toHaveBeenCalledWith(file)
    })

    it('reports the import result when there is one', () => {
      vi.mocked(useMacroImportExport).mockReturnValue({ ...port, status: { ok: false, message: 'bad json' } })
      render(<SettingsView {...props} />)
      expect(screen.getByText('bad json')).toBeInTheDocument()
    })
  })
})
