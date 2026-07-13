import { useState } from 'react'
import { deleteMacro } from '../../store/macroCrud'
import { Macro } from '../../types'
import { t } from '../../lib/i18n'

interface MacroItemProps {
  macro: Macro
}

export default function MacroItem({ macro }: MacroItemProps) {
  const [open, setOpen] = useState(false)
  return (
    <div className="popup-card padding-snug ground rule corner-md ruled">
      <button className="popup-item-toggle horizontal justify-between ink text-start pressable" onClick={()=>setOpen(!open)}>
        <span className="ink-accent font-sm font-medium">{macro.command}</span>
        <span className="ink-soft">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="popup-item-detail vertical gap-snug rule-soft ruled-top">
          <pre className="popup-macro-text padding-snug ground-subtle ink corner-md font-sm">{macro.text}</pre>
          <div className="horizontal gap-snug">
            <button className="popup-button padding-block-tight padding-inline-snug ground-accent ink-inverse corner-md font-sm pressable" onClick={()=>chrome.runtime.openOptionsPage()}>{t('macroItem.edit')}</button>
            <button className="popup-button padding-block-tight padding-inline-snug ground-fail ink-inverse corner-md font-sm pressable" onClick={()=>deleteMacro(String(macro.id))}>{t('macroItem.delete')}</button>
          </div>
        </div>
      )}
    </div>
  )
}
