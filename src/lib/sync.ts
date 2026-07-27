import { apiFetch } from './api'
import { useMacroStore } from '../store/useMacroStore'

// The Zustand store (persisted to chrome.storage under 'macro-storage') is the
// single source of truth for macros. This module's only job is to reconcile that
// truth with the remote backend: push local changes, pull/merge on sync, and hold
// an offline queue for changes that couldn't reach the network.

const QUEUE_KEY = 'pendingOps'

// Hosted-backend sync is opt-in. Until it's enabled, these functions are no-ops —
// macros still persist locally and via chrome.storage browser-sync.
function syncEnabled(): boolean {
  return useMacroStore.getState().config.syncEnabled === true
}

async function getQueue(){ const o = await chrome.storage.local.get(QUEUE_KEY); return o[QUEUE_KEY]||[] }
async function setQueue(q){ await chrome.storage.local.set({ [QUEUE_KEY]: q }) }

async function enqueue(op){
  const q = await getQueue(); q.push(op); await setQueue(q)
  chrome.runtime.sendMessage({ type:'pendingCount', count: q.length }).catch(()=>{})
}

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
  if (!syncEnabled()) return
  const q = await getQueue(); if (!q.length) return
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
  if (!syncEnabled()) return
  let remote = []
  try {
    const res = await apiFetch('/macros')
    if (res && res.ok) {
      const js = await res.json(); if (js.success) remote = js.data
    }
  } catch {}
  const local = useMacroStore.getState().macros
  const merged = mergeByUpdated(local, remote)
  useMacroStore.getState().setMacros(merged)
  await flushQueue()
  chrome.runtime.sendMessage({ type:'macros-updated' }).catch(()=>{})
}

// --- Remote push helpers ---
// The caller updates the store first (the local source of truth); these only push
// the change to the backend, queueing it for later if the network is unavailable.

export async function pushCreate(macro){
  if (!syncEnabled()) return
  try {
    const res = await apiFetch('/macros', { method:'POST', body: JSON.stringify(macro) })
    if (!res.ok) throw new Error('net')
    const js = await res.json(); if (!js.success) throw new Error('server')
  } catch {
    await enqueue({ op:'create', macro, ts: Date.now() })
  }
}

export async function pushUpdate(macro){
  if (!syncEnabled()) return
  try {
    const res = await apiFetch(`/macros/${macro.id}`, { method:'PUT', body: JSON.stringify(macro) })
    if (!res.ok) throw new Error('net')
    const js = await res.json(); if (!js.success) throw new Error('server')
  } catch {
    await enqueue({ op:'update', macro, ts: Date.now() })
  }
}

export async function pushDelete(id){
  if (!syncEnabled()) return
  try {
    const res = await apiFetch(`/macros/${id}`, { method:'DELETE' })
    if (!res.ok) throw new Error('net')
  } catch {
    await enqueue({ op:'delete', id, ts: Date.now() })
  }
}
