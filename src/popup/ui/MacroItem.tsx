import React, { useState } from 'react'
import { useMacroStore } from '../../store/useMacroStore'
import { Macro } from '../../types'

interface MacroItemProps {
  macro: Macro
}

export default function MacroItem({ macro }: MacroItemProps) {
  const [open, setOpen] = useState(false)
  const remove = useMacroStore(s => s.deleteMacro)
  return (
    <div className="bg-white border rounded p-2 shadow-sm">
      <button className="w-full flex justify-between text-left" onClick={()=>setOpen(!open)}>
        <span className="font-mono text-sm">{macro.command}</span>
        <span className="text-gray-500">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="mt-2">
          <pre className="whitespace-pre-wrap text-sm text-gray-800">{macro.text}</pre>
          <div className="flex gap-2 mt-2">
            <button className="px-2 py-1 text-white bg-yellow-600 rounded text-sm" onClick={()=>chrome.runtime.openOptionsPage()}>✏️ Editar</button>
            <button className="px-2 py-1 text-white bg-red-600 rounded text-sm" onClick={()=>remove(macro.id)}>🗑 Eliminar</button>
          </div>
        </div>
      )}
    </div>
  )
}
