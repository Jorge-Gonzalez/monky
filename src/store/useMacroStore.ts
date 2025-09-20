import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { defaultMacroConfig } from '../config/defaults'

type Macro = { id: number|string; command: string; text: string; updated_at?: string; is_sensitive?: boolean }
type MacroConfig = { prefixes: string[], useCommitKeys?: boolean }

type State = {
  macros: Macro[]
  config: MacroConfig
  user: any
  syncStatus: 'idle'|'syncing'|'error'
  setUser: (u:any)=>void
  setMacros: (m:Macro[])=>void
  addMacro: (m:Macro)=>void
  updateMacro: (id:Macro['id'], patch:Partial<Macro>)=>void
  deleteMacro: (id:Macro['id'])=>void
  setPrefixes: (prefixes: string[])=>void
  setUseCommitKeys: (useCommitKeys: boolean) => void
}

export const useMacroStore = create<State>()(persist((set)=>({
  macros: defaultMacroConfig.macros,
  user: null,
  syncStatus: 'idle',
  config: { ...defaultMacroConfig, useCommitKeys: false }, // Default to auto-commit
  setUser: (user)=> set({ user }),
  setMacros: (macros)=> set({ macros }),
  addMacro: (macro)=> set((s)=> ({ macros: [...s.macros, macro] })),
  updateMacro: (id, patch)=> set((s)=> ({ macros: s.macros.map(m=> String(m.id)===String(id)?{...m,...patch}:m) })),
  deleteMacro: (id)=> set((s)=> ({ macros: s.macros.filter(m=> String(m.id)!==String(id)) })),
  setPrefixes: (prefixes) =>
    set(s => ({ config: { ...s.config, prefixes } })),
  setUseCommitKeys: (useCommitKeys) =>
    set(s => ({ config: { ...s.config, useCommitKeys } })),
}), { name: 'macro-storage' }))

export function getStoreApi(){
  return {
    setMacros: (macros:any[]) => (useMacroStore.setState as any)({ macros }),
  }
}
