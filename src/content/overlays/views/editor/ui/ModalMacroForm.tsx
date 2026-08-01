import { useState } from 'react'
import type { FormEvent } from 'react'
import type { Macro } from '../../../../../types'
import { t } from '../../../../../lib/i18n'
import { deleteMacros } from '../../../../../store/macroCrud'
import { ContentEditor } from '../../../../../shared/content-editor'
import { useMacroForm } from '../../../../../shared/useMacroForm'
import { useCommandSuggestions } from '../useCommandSuggestions'
import { CommandSuggestions, SUGGESTIONS_LISTBOX_ID, suggestionOptionId } from './CommandSuggestions'

// How long the success toast shows before the modal closes.
const SAVE_TOAST_MS = 900

const PopoutIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
  >
    <path
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M14 4h6m0 0v6m0-6L10 14M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5"
    />
  </svg>
)

interface ModalMacroFormProps {
  editing: Macro | null
  onDone: () => void
  onLoadMacro: (macro: Macro) => void
}

export function ModalMacroForm({ editing, onDone, onLoadMacro }: ModalMacroFormProps) {
  const {
    prefixes,
    command,
    setCommand,
    text,
    setText,
    isSensitive,
    setSensitive,
    error,
    commandValid,
    isFormValid,
    commandInputRef,
    contentEditorRef,
    submit,
  } = useMacroForm(editing)
  const [savedToast, setSavedToast] = useState<string | null>(null)

  const suggest = useCommandSuggestions(command, !editing, onLoadMacro, (m) => {
    deleteMacros([String(m.id)])
  })
  const commandJoined = Boolean((command && !commandValid) || suggest.visible)

  // Open the full-page editor (a content script can't call chrome.tabs directly;
  // the background opens the tab).
  const openFullEditor = () => {
    void chrome.runtime.sendMessage('open-editor')
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const outcome = submit()
    if (outcome.status === 'created' || outcome.status === 'updated') {
      // Confirm the save, then close the modal. Both create and edit finish the
      // same way — the editor is a task you complete and dismiss.
      setSavedToast(t(outcome.status === 'updated' ? 'macroForm.updatedToast' : 'macroForm.savedToast'))
      window.setTimeout(onDone, SAVE_TOAST_MS)
    }
  }

  return (
    <form
      onSubmit={(e) => {
        void onSubmit(e)
      }}
      data-component="editor-form"
      className="vertical elastic basis-ratio gap-md min-height-none
        position-relative"
    >
      <div
        data-component="editor-form-header"
        className="horizontal gap-lg align-center justify-between"
      >
        <div className="horizontal rigid gap-sm align-center">
          <h1
            data-component="editor-form-title"
            className="ink font-lg font-semibold"
          >
            {editing ? t('editor.title.editShort') : t('editor.title.newShort')}
          </h1>
          <button
            type="button"
            data-component="editor-form-popout"
            className="horizontal padding-xs align-center justify-center
              tween-ground-ink-quick
              ink-soft corner-sm pressable
              hover:ground-defined hover:ink-accent"
            onClick={openFullEditor}
            aria-label={t('editor.openFullEditor')}
            title={t('editor.openFullEditor')}
          >
            <PopoutIcon />
          </button>
        </div>

        <div
          data-component="editor-form-command"
          className="horizontal gap-sm align-center"
        >
          <span>
            <svg
              version="1.1"
              xmlns="http://www.w3.org/2000/svg"
              width="16px"
              height="16px"
              viewBox="0 0 16 16"
            >
              <polygon
                fill="currentColor"
                points="7,9 4,9 10,0 8,7 11,7 5.417,15 "
              />
            </svg>
          </span>
          <div
            ref={suggest.containerRef}
            className="elastic basis-ratio width-popover-lg
              position-relative"
          >
            <input
              id="modal-macro-command"
              ref={commandInputRef}
              data-component="editor-form-command-input"
              className={`padding-block-sm padding-inline-md fill-inline ground-subtle ink rule ${commandJoined ? 'corner-top-3xl corner-bottom-none' : 'corner-3xl'} ruled recessed-soft font-md tween-rule-quick focus:rule-accent-soft focus:ring-accent-soft ${command && !commandValid ? 'rule-fail focus:rule-fail focus:recessed-fail' : ''}`}
              value={command}
              onChange={(e) => setCommand(e.currentTarget.value)}
              placeholder={t('macroForm.commandPlaceholder', { prefix: prefixes[0] })}
              aria-label={t('macroForm.triggerLabel')}
              aria-invalid={command && !commandValid ? true : undefined}
              role="combobox"
              aria-expanded={suggest.visible}
              aria-controls={suggest.visible ? SUGGESTIONS_LISTBOX_ID : undefined}
              aria-activedescendant={
                suggest.visible && suggest.activeIndex >= 0
                  ? suggestionOptionId(suggest.activeIndex)
                  : undefined
              }
              aria-autocomplete="list"
              maxLength={50}
              autoComplete="off"
              {...suggest.inputProps}
            />
            {command && !commandValid && (
              <div
                data-component="editor-form-command-error"
                className={`padding-block-xs padding-inline-sm ${suggest.visible ? 'corner-bottom-none' : 'corner-bottom-md'} ground-fail-faint ink-fail font-xs`}
              >
                {t('macroForm.commandPrefixError', { prefixes: prefixes.join(', ') })}
              </div>
            )}
            {suggest.visible && (
              <CommandSuggestions
                suggestions={suggest.suggestions}
                activeIndex={suggest.activeIndex}
                armedId={suggest.armedId}
                onSelect={suggest.select}
                onArm={suggest.arm}
                onConfirmDelete={suggest.confirmDelete}
                onDisarm={suggest.disarm}
              />
            )}
          </div>
        </div>
      </div>

      <ContentEditor
        ref={contentEditorRef}
        className="elastic basis-ratio min-height-none"
        value={text}
        onChange={setText}
        placeholder={t('macroForm.contentPlaceholder')}
      />

      <div
        data-component="editor-form-footer"
        className="horizontal rigid gap-md align-center justify-between"
      >
        <label
          data-component="editor-form-sensitive"
          className="horizontal gap-sm align-center
            ink font-sm pressable"
        >
          <input
            type="checkbox"
            checked={isSensitive}
            onChange={(e) => setSensitive(e.currentTarget.checked)}
            className="control-size-lg
              rule corner-sm ruled pressable
              focus:ring"
          />
          <span>{t('macroForm.sensitiveLabel')}</span>
        </label>

        <div
          data-component="editor-form-actions"
          className="horizontal inline gap-sm"
        >
          {editing && (
            <button
              type="button"
              data-component="editor-form-cancel"
              className="padding-block-sm padding-inline-lg
                tween-quick
                ground ink rule corner-md ruled font-md font-medium pressable
                hover:ground-defined
                focus:ring
                active:ground-accent active:ink-inverse
                disabled:ground-subtle disabled:ink-soft disabled:blocked disabled:alpha-60"
              onClick={onDone}
            >
              {t('macroForm.cancelButton')}
            </button>
          )}
          <button
            type="submit"
            data-component="editor-form-save"
            disabled={!isFormValid || savedToast !== null}
            className="padding-block-sm padding-inline-lg
              tween-quick
              ground-pass ink-inverse rule corner-md ruled font-md font-medium pressable
              hover:ground-pass
              focus:ring
              active:ground-accent active:ink-inverse
              disabled:ground-subtle disabled:ink-soft disabled:blocked disabled:alpha-60"
          >
            {editing ? t('macroForm.updateButton') : t('macroForm.saveButton')}
          </button>
        </div>
      </div>

      {(error || savedToast) && (
        <div
          data-component="editor-form-toast"
          className={`padding-md center-x inset-bottom-3xl position-absolute corner-md ruled elevated-soft text-nowrap ${error ? 'ground-fail-faint rule-fail ink-fail' : 'ground-pass-faint rule-pass ink-pass'}`}
          role="status"
        >
          <p className="font-medium">{error ?? savedToast}</p>
        </div>
      )}
    </form>
  )
}
