import React, { useEffect, useState } from 'react'
import { useMacroStore } from '../../store/useMacroStore'
import { createMacroLocalFirst, updateMacroLocalFirst } from '../../lib/sync'
import { getErrorMessage } from '../../lib/errors'
import { t } from '../../lib/i18n'

export default function MacroForm({ editing, onDone }:{ editing:any|null, onDone:()=>void }){
  const addMacro = useMacroStore(s=>s.addMacro)
  const updateMacro = useMacroStore(s=>s.updateMacro)
  const [command, setCommand] = useState('')
  const [text, setText] = useState('')
  const [isSensitive, setSensitive] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(()=>{
    if (editing){ setCommand(editing.command); setText(editing.text); setSensitive(!!editing.is_sensitive) }
    else { setCommand(''); setText(''); setSensitive(false) }
    setError(null)
  }, [editing])

  // Clear error when user starts typing
  useEffect(() => {
    if (error) setError(null)
  }, [command, text])

  async function onSubmit(e:React.FormEvent){
    e.preventDefault()
    setError(null)
    if (!command.trim() || !text.trim()) return

    let result
    if (editing){
      const macroPatch = { command, text, is_sensitive: isSensitive }
      result = updateMacro(editing.id, macroPatch)
      if (result.success) {
        await updateMacroLocalFirst({ id: editing.id, ...macroPatch })
        onDone()
      }
    } else {
      const newMacro = { id: Date.now(), command, text, is_sensitive: isSensitive }
      result = addMacro(newMacro)
      if (result.success) {
        await createMacroLocalFirst(newMacro)
        // Reset form for next entry, onDone() is for finishing an edit.
        setCommand('')
        setText('')
      }
    }

    if (!result.success && result.error) {
      setError(getErrorMessage(result.error, command))
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="macro-command" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('macroForm.triggerLabel')}</label>
        <input
          id="macro-command"
          className="border rounded p-2 w-full bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
          value={command}
          onChange={e=>setCommand(e.target.value)}
          placeholder="/sig"
          maxLength={50}
        />
      </div>
      <div>
        <label htmlFor="macro-text" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('macroForm.textLabel')}</label>
        <textarea
          id="macro-text"
          className="border rounded p-2 w-full bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
          rows={6}
          value={text}
          onChange={e=>setText(e.target.value)}
        />
      </div>
      <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
        <input 
          type="checkbox" 
          checked={isSensitive} 
          onChange={e=>setSensitive(e.target.checked)}
        /> 
        {t('macroForm.sensitiveLabel')}
      </label>
      {error && <p className="text-red-600 dark:text-red-400 text-sm font-medium">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors duration-200">{editing ? t('macroForm.updateButton') : t('macroForm.saveButton')}</button>
        {editing && <button type="button" className="px-4 py-2 border rounded-md bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200" onClick={onDone}>{t('macroForm.cancelButton')}</button>}
      </div>
    </form>
  )
}
