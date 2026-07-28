export type Tokens = { access?: string; refresh?: string }

type RefreshResponse = { success?: boolean; access?: string; refresh?: string }

export async function getTokens(): Promise<Tokens> {
  const o = await chrome.storage.local.get(['access', 'refresh'])
  return { access: o.access as string | undefined, refresh: o.refresh as string | undefined }
}

export async function setTokens(tokens: Tokens): Promise<void> {
  await chrome.storage.local.set(tokens)
}

export async function apiFetch(path: string, opts: RequestInit = {}): Promise<Response> {
  const base = 'http://localhost:3000'
  const { access, refresh } = await getTokens()
  const headers = new Headers(opts.headers ?? {})
  if (access) headers.set('Authorization', `Bearer ${access}`)
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  let res: Response
  try {
    res = await fetch(`${base}${path}`, { ...opts, headers })
  } catch {
    // Cannot create a Response with status 0.
    // Return a custom object that mimics a failed response for network errors.
    return {
      ok: false,
      status: 0,
      statusText: 'NetworkError',
      json: () => Promise.resolve({}),
      text: () => Promise.resolve(''),
    } as Response
  }
  if (res.status !== 401) return res
  if (!refresh) return res
  const r = await fetch(`${base}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh }),
  })
  if (!r.ok) return res
  const data = (await r.json()) as RefreshResponse
  if (!data.success) return res
  await setTokens({ access: data.access, refresh: data.refresh })
  const headers2 = new Headers(opts.headers ?? {})
  headers2.set('Authorization', `Bearer ${data.access}`)
  if (!headers2.has('Content-Type')) headers2.set('Content-Type', 'application/json')
  return fetch(`${base}${path}`, { ...opts, headers: headers2 })
}
