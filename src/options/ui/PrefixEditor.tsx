import { useMacroStore } from '../../store/useMacroStore'
import { useState } from 'react'

export function PrefixEditor() {
  const { config, setPrefixes } = useMacroStore()
  const [input, setInput] = useState(config.prefixes.join(','))

  const save = () => {
    const prefixes = input.split(',').map(p => p.trim()).filter(Boolean)
    setPrefixes(prefixes)
  }

  return (
    <div className="p-4 border rounded-lg mt-4">
      <h3 className="font-bold mb-2">Configurar Prefijos</h3>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="border p-2 rounded w-full"
        placeholder="Ejemplo: /,;"
      />
      <button
        onClick={save}
        className="mt-2 px-4 py-1 bg-blue-500 text-white rounded"
      >
        Guardar Prefijos
      </button>
    </div>
  )
}
