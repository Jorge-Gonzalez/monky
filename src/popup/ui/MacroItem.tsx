import React, { useState } from 'react'
import { useMacroStore } from '../../store/useMacroStore'
import { Macro } from '../../types'
import { t } from '../../lib/i18n'

interface MacroItemProps {
  macro: Macro
}

export default function MacroItem({ macro }: MacroItemProps) {
  const [open, setOpen] = useState(false)
  const remove = useMacroStore(s => s.deleteMacro)
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-2 shadow-sm">
      <button className="w-full flex justify-between text-left" onClick={()=>setOpen(!open)}>
        <span className="font-mono text-sm text-gray-800 dark:text-gray-200">{macro.command}</span>
        <span className="text-gray-500 dark:text-gray-400">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
          <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-2 rounded">{macro.text}</pre>
          <div className="flex gap-2 mt-2">
            <button className="px-2 py-1 text-white bg-yellow-600 rounded text-sm" onClick={()=>chrome.runtime.openOptionsPage()}>{t('macroItem.edit')}</button>
            <button className="px-2 py-1 text-white bg-red-600 rounded text-sm" onClick={()=>remove(macro.id)}>{t('macroItem.delete')}</button>
          </div>
        </div>
      )}
    </div>
  )
}
