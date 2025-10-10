// store/useMacroStore.ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

const isDev = import.meta.env.DEV

export const useMacroStore = create<MacroStore>()(
  persist(
    (set) => ({
      macros: [],
      config: defaultMacroConfig,
      
      setMacros: (macros) => {
        if (isDev) console.log('📝 setMacros:', macros.length, 'macros')
        set({ macros })
      },
      
      updateConfig: (config) => {
        if (isDev) console.log('⚙️ updateConfig:', config)
        set({ config })
      },
    }),
    {
      name: 'macro-storage',
      storage: createJSONStorage(() => chrome.storage.local)
    }
  )
)

// Debug helper (only in dev)
if (isDev) {
  (window as any).getMacroStore = () => useMacroStore.getState()
  console.log('💡 Debug: Type getMacroStore() in console')
}