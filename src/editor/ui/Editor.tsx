import React, { useState } from 'react'
import MacroForm from './MacroForm'
import MacroListEditor from './MacroListEditor'
import { useMacroStore } from '../../store/useMacroStore'

export default function Editor(){
  const macros = useMacroStore(s=>s.macros)
  const [editing, setEditing] = useState<any|null>(null)
  return (
    <div className="p-6 max-w-2xl mx-auto min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <h1 className="text-2xl font-semibold mb-4 dark:text-gray-100">Editor de Macros</h1>
      <MacroForm editing={editing} onDone={()=>setEditing(null)} />
      <hr className="my-6" />
      <MacroListEditor macros={macros} onEdit={(m)=>setEditing(m)} />
    </div>
  )
}
