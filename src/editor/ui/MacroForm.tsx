import React, { useEffect, useState } from 'react'
import { useMacroStore } from '../../store/useMacroStore'
import { createMacroLocalFirst, updateMacroLocalFirst } from '../../lib/sync'

export default function MacroForm({ editing, onDone }:{ editing:any|null, onDone:()=>void }){
  const addLocal = useMacroStore(s=>s.addMacro)
  const updateLocal = useMacroStore(s=>s.updateMacro)
  const [command, setCommand] = useState('')
  const [text, setText] = useState('')
  const [isSensitive, setSensitive] = useState(false)

  useEffect(()=>{
    if (editing){ setCommand(editing.command); setText(editing.text); setSensitive(!!editing.is_sensitive) }
    else { setCommand(''); setText(''); setSensitive(false) }
  }, [editing])

  async function onSubmit(e:React.FormEvent){
    e.preventDefault()
    if (!command.trim() || !text.trim()) return
    if (editing){
      const macro = { id: editing.id, command, text, is_sensitive: isSensitive }
      updateLocal(editing.id, macro)
      await updateMacroLocalFirst(macro)
    } else {
      const macro = { id: Date.now(), command, text, is_sensitive: isSensitive }
      addLocal(macro as any)
      await createMacroLocalFirst(macro)
    }
    onDone()
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div><label className="block text-sm font-medium">Trigger</label><input className="border rounded p-2 w-full" value={command} onChange={e=>setCommand(e.target.value)} placeholder="/sig" maxLength={50}/></div>
      <div><label className="block text-sm font-medium">Texto</label><textarea className="border rounded p-2 w-full" rows={6} value={text} onChange={e=>setText(e.target.value)}/></div>
      <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={isSensitive} onChange={e=>setSensitive(e.target.checked)}/> Marcar como sensible (se encripta)</label>
      <div className="flex gap-2"><button className="bg-green-600 text-white px-3 py-1 rounded">{editing ? 'Actualizar' : 'Guardar'}</button>{editing && <button type="button" className="px-3 py-1 border rounded" onClick={onDone}>Cancelar</button>}</div>
    </form>
  )
}
