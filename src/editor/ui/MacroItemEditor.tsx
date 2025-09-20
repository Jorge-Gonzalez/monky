import React from 'react'
import { deleteMacroLocalFirst } from '../../lib/sync'
import { useMacroStore } from '../../store/useMacroStore'
export default function MacroItemEditor({ macro, onEdit }:{ macro:any, onEdit:(m:any)=>void }){
  const removeLocal = useMacroStore(s=>s.deleteMacro)
  async function onDelete(){ removeLocal(macro.id); await deleteMacroLocalFirst(macro.id) }
  return (
    <div className="border rounded p-2 bg-white">
      <div className="text-sm"><span className="font-mono font-semibold">{macro.command}</span><span className="ml-2 text-gray-600">{macro.text.slice(0,80)}{macro.text.length>80?'…':''}</span></div>
      <div className="flex gap-2 mt-2"><button className="text-blue-600 text-sm" onClick={()=>onEdit(macro)}>✏️ Editar</button><button className="text-red-600 text-sm" onClick={onDelete}>🗑 Eliminar</button></div>
    </div>
  )
}
