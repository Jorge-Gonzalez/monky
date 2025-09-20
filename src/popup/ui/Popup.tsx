import React, { useEffect, useState } from 'react'
import { useMacroStore } from '../../store/useMacroStore'
import MacroList from './MacroList'

export default function Popup(){
  const [pending, setPending] = useState(0)
  const macros = useMacroStore(s => s.macros)

  useEffect(()=>{
    const handler = (msg:any) => {
      if (msg?.type === 'pendingCount') setPending(msg.count)
      if (msg?.type === 'macros-updated') { /* store already updated */ }
    }
    chrome.runtime.onMessage.addListener(handler)
    return () => chrome.runtime.onMessage.removeListener(handler)
  },[])

  return (
    <div className="p-3">
      <h1 className="text-lg font-semibold">📑 Mis Macros</h1>
      <p className="text-xs text-gray-500 mb-2">{pending ? `🔄 ${pending} pendientes` : '✅ Todo sincronizado'}</p>
      <MacroList macros={macros} />
      <button
        onClick={() => chrome.tabs.create({ url: chrome.runtime.getURL('src/editor/index.html') })}
        className="fixed bottom-3 right-3 bg-blue-600 text-white rounded-full w-10 h-10 shadow"
        title="Nuevo macro"
      ></button>
    </div>
  )
}
