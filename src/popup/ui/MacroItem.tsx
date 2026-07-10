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
    <div className="popup-card padding-snug ground rule corner-md">
      <button className="horizontal justify-between popup-item-toggle ink" onClick={()=>setOpen(!open)}>
        <span className="font-sm font-medium ink-accent">{macro.command}</span>
        <span className="ink-soft">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="vertical gap-snug popup-item-detail rule-soft">
          <pre className="popup-macro-text font-sm ink ground-subtle padding-snug corner-md">{macro.text}</pre>
          <div className="horizontal gap-snug">
            <button className="popup-button padding-inline-snug padding-block-tight ground-accent ink-inverse corner-md font-sm" onClick={()=>chrome.runtime.openOptionsPage()}>{t('macroItem.edit')}</button>
            <button className="popup-button padding-inline-snug padding-block-tight ground-fail ink-inverse corner-md font-sm" onClick={()=>deleteMacro(String(macro.id))}>{t('macroItem.delete')}</button>
          </div>
        </div>
      )}
    </div>
  )
}
