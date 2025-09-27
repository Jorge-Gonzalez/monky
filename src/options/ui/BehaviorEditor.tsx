import { useMacroStore } from '../../store/useMacroStore'

export function BehaviorEditor() {
  const { config, setUseCommitKeys } = useMacroStore()

  // If useCommitKeys is not defined, default to false (auto-commit)
  const useCommitKeysValue = config.useCommitKeys ?? false

  return (
    <div className="p-4 border rounded-lg mt-4">
      <h3 className="font-bold mb-2">Comportamiento de Reemplazo</h3>
      <div className="flex items-center space-x-4">
        <label className="flex items-center cursor-pointer">
          <input
            type="radio"
            name="behavior"
            checked={!useCommitKeysValue}
            onChange={() => setUseCommitKeys(false)}
            className="mr-2"
          />
          Automático (al coincidir)
        </label>
        <label className="flex items-center cursor-pointer">
          <input
            type="radio"
            name="behavior"
            checked={useCommitKeysValue}
            onChange={() => setUseCommitKeys(true)}
            className="mr-2"
          />
          Manual (con Espacio, Enter, o Tab)
        </label>
      </div>
      <p className="text-sm text-gray-500 mt-2">
        El modo automático reemplaza el texto tan pronto como sea posible, con una breve pausa si un macro más largo es posible.
      </p>
    </div>
  )
}