import { apiFetch } from './api'
import { getStoreApi } from '../store/useMacroStore'

const LOCAL_KEY = 'macros'
const QUEUE_KEY = 'pendingOps'

async function getLocalMacros(){ const o = await chrome.storage.local.get(LOCAL_KEY); return o[LOCAL_KEY]||[] }
async function setLocalMacros(list){ await chrome.storage.local.set({ [LOCAL_KEY]: list }) }
async function getQueue(){ const o = await chrome.storage.local.get(QUEUE_KEY); return o[QUEUE_KEY]||[] }
async function setQueue(q){ await chrome.storage.local.set({ [QUEUE_KEY]: q }) }

function nowIso(){ return new Date().toISOString() }

function mergeByUpdated(local, remote){
  const map = new Map()
  for (const r of remote) map.set(String(r.id), { ...r })
  for (const l of local) {
    const key = String(l.id ?? l.localId ?? l.command)
    const r = map.get(key)
    if (!r) { map.set(key, { ...l }); continue }
    if (new Date(l.updated_at || 0) > new Date(r.updated_at || 0)) {
      map.set(key, { ...l })
    }
  }
  return Array.from(map.values())
}

export async function flushQueue(){
  let q = await getQueue(); if (!q.length) return
  const remain = []
  for (const item of q){
    try {
      if (item.op === 'create') {
        const res = await apiFetch('/macros', { method:'POST', body: JSON.stringify(item.macro) })
        if (!res.ok) throw new Error('net')
        const js = await res.json(); if (!js.success) throw new Error('server')
      } else if (item.op === 'update') {
        const res = await apiFetch(`/macros/${item.macro.id}`, { method:'PUT', body: JSON.stringify(item.macro) })
        if (!res.ok) throw new Error('net')
        const js = await res.json(); if (!js.success) throw new Error('server')
      } else if (item.op === 'delete') {
        const res = await apiFetch(`/macros/${item.id}`, { method:'DELETE' })
        if (!res.ok) throw new Error('net')
      }
    } catch(e){ remain.push(item) }
  }
  await setQueue(remain)
  chrome.runtime.sendMessage({ type:'pendingCount', count: remain.length }).catch(()=>{})
}

export async function syncMacros(){
  let remote = []
  try {
    const res = await apiFetch('/macros')
    if (res && res.ok) {
      const js = await res.json(); if (js.success) remote = js.data
    }
  } catch {}
  const local = await getLocalMacros()
  const merged = mergeByUpdated(local, remote)
  await setLocalMacros(merged)
  const { setMacros } = getStoreApi()
  setMacros(merged)
  await flushQueue()
  chrome.runtime.sendMessage({ type:'macros-updated' }).catch(()=>{})
}

export async function createMacroLocalFirst(macro){
  const list = await getLocalMacros()
  const localItem = { ...macro, updated_at: nowIso() }
  list.push(localItem); await setLocalMacros(list)
  getStoreApi().setMacros(list)
  try {
    const res = await apiFetch('/macros', { method:'POST', body: JSON.stringify(macro) })
    if (!res.ok) throw new Error('net')
    const js = await res.json(); if (!js.success) throw new Error('server')
    await syncMacros()
  } catch {
    const q = await getQueue(); q.push({ op:'create', macro, ts: Date.now() }); await setQueue(q)
    chrome.runtime.sendMessage({ type:'pendingCount', count: (await getQueue()).length }).catch(()=>{})
  }
}

export async function updateMacroLocalFirst(macro){
  const list = await getLocalMacros(); const idx = list.findIndex(m => String(m.id)===String(macro.id))
  if (idx>=0){ list[idx] = { ...list[idx], ...macro, updated_at: nowIso() }; await setLocalMacros(list); getStoreApi().setMacros(list) }
  try {
    const res = await apiFetch(`/macros/${macro.id}`, { method:'PUT', body: JSON.stringify(macro) })
    if (!res.ok) throw new Error('net')
    const js = await res.json(); if (!js.success) throw new Error('server')
    await syncMacros()
  } catch {
    const q = await getQueue(); q.push({ op:'update', macro, ts: Date.now() }); await setQueue(q)
    chrome.runtime.sendMessage({ type:'pendingCount', count: (await getQueue()).length }).catch(()=>{})
  }
}

export async function deleteMacroLocalFirst(id){
  const list = await getLocalMacros(); const next = list.filter(m => String(m.id)!==String(id))
  await setLocalMacros(next); getStoreApi().setMacros(next)
  try {
    const res = await apiFetch(`/macros/${id}`, { method:'DELETE' })
    if (!res.ok) throw new Error('net')
    await syncMacros()
  } catch {
    const q = await getQueue(); q.push({ op:'delete', id, ts: Date.now() }); await setQueue(q)
    chrome.runtime.sendMessage({ type:'pendingCount', count: (await getQueue()).length }).catch(()=>{})
  }
}
