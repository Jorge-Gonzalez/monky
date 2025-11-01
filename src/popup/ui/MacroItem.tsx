import { useState } from 'react'
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
    <div className="card shadow-sm p-2">
      <button className="w-full flex justify-between text-left" onClick={()=>setOpen(!open)}>
        <span className="text-mono text-sm text-primary">{macro.command}</span>
        <span className="text-secondary">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="mt-2 pt-2 border-t border-primary">
          <pre className="whitespace-pre-wrap text-sm text-primary bg-secondary p-2 rounded">{macro.text}</pre>
          <div className="flex gap-2 mt-2">
            <button className="btn px-2 py-1 text-white rounded text-sm" style={{ backgroundColor: '#ca8a04' }} onClick={()=>chrome.runtime.openOptionsPage()}>{t('macroItem.edit')}</button>
            <button className="btn-danger px-2 py-1 rounded text-sm" onClick={()=>remove(macro.id)}>{t('macroItem.delete')}</button>
          </div>
        </div>
      )}
    </div>
  )
}
