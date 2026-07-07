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
    <div className="card shadow-sm padding-snug">
      <button className="horizontal justify-between popup-item-toggle" onClick={()=>setOpen(!open)}>
        <span className="text-mono text-sm text-primary">{macro.command}</span>
        <span className="text-secondary">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="vertical gap-snug border-t border-primary popup-item-detail">
          <pre className="whitespace-pre-wrap text-sm text-primary bg-secondary padding-snug ui-rounded">{macro.text}</pre>
          <div className="horizontal gap-snug">
            <button className="btn padding-inline-snug padding-block-tight text-white ui-rounded text-sm" style={{ backgroundColor: '#ca8a04' }} onClick={()=>chrome.runtime.openOptionsPage()}>{t('macroItem.edit')}</button>
            <button className="btn-danger padding-inline-snug padding-block-tight ui-rounded text-sm" onClick={()=>deleteMacro(String(macro.id))}>{t('macroItem.delete')}</button>
          </div>
        </div>
      )}
    </div>
  )
}
