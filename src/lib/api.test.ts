import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getTokens, setTokens, apiFetch } from './api'

// Mock chrome APIs
const mockGet = vi.fn()
const mockSet = vi.fn()
const mockFetch = vi.fn()

vi.stubGlobal('chrome', {
  storage: {
    local: {
      get: mockGet,
      set: mockSet
    }
  }
})

vi.stubGlobal('fetch', mockFetch)

describe('api', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getTokens', () => {
    it('retrieves access and refresh tokens from chrome storage', async () => {
      mockGet.mockResolvedValueOnce({ access: 'access-token', refresh: 'refresh-token' })
      
      const result = await getTokens()
      
      expect(result).toEqual({ access: 'access-token', refresh: 'refresh-token' })
      expect(mockGet).toHaveBeenCalledWith(['access', 'refresh'])
    })

    it('handles missing tokens gracefully', async () => {
      mockGet.mockResolvedValueOnce({})
      
      const result = await getTokens()
      
      expect(result).toEqual({ access: undefined, refresh: undefined })
    })
  })

  describe('setTokens', () => {
    it('stores tokens in chrome storage', async () => {
      await setTokens({ access: 'new-access', refresh: 'new-refresh' })
      
      expect(mockSet).toHaveBeenCalledWith({ access: 'new-access', refresh: 'new-refresh' })
    })
  })

  describe('apiFetch', () => {
    const baseUrl = 'http://localhost:3000'

    beforeEach(() => {
      mockGet.mockResolvedValue({ access: 'access-token', refresh: 'refresh-token' })
      mockSet.mockResolvedValue(undefined)
    })

    it('makes a basic GET request with authorization header', async () => {
      const mockResponse = { ok: true, json: vi.fn().mockResolvedValue({ success: true }) }
      mockFetch.mockResolvedValue(mockResponse)
      
      await apiFetch('/test')
      
      expect(mockFetch).toHaveBeenCalledWith(`${baseUrl}/test`, expect.any(Object))
      
      const fetchOptions = mockFetch.mock.calls[0][1]
      const headers = fetchOptions.headers as Headers
      expect(headers).toBeInstanceOf(Headers)
      expect(headers.get('Authorization')).toBe('Bearer access-token')
      expect(headers.get('Content-Type')).toBe('application/json')
    })

    it('includes custom headers in the request', async () => {
      const mockResponse = { ok: true, json: vi.fn().mockResolvedValue({}) }
      mockFetch.mockResolvedValue(mockResponse)
      
      await apiFetch('/test', {
        headers: { 'Custom-Header': 'custom-value' }
      })
      
      expect(mockFetch).toHaveBeenCalledWith(`${baseUrl}/test`, expect.any(Object))

      const fetchOptions = mockFetch.mock.calls[0][1]
      const headers = fetchOptions.headers as Headers
      expect(headers).toBeInstanceOf(Headers)
      expect(headers.get('Authorization')).toBe('Bearer access-token')
      expect(headers.get('Content-Type')).toBe('application/json')
      expect(headers.get('Custom-Header')).toBe('custom-value')
    })

    it('handles network errors gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))
      
      const response = await apiFetch('/test')
      
      expect(response.status).toBe(0)
      expect(response.statusText).toBe('NetworkError')
      expect(response.ok).toBe(false)
    })

    it('does not attempt token refresh when refresh token is missing', async () => {
      mockGet.mockResolvedValueOnce({ access: 'access-token' }) // No refresh token
      const mockUnauthorizedResponse = { 
        status: 401, 
        ok: false,
        json: vi.fn().mockResolvedValue({}) 
      }
      mockFetch.mockResolvedValueOnce(mockUnauthorizedResponse)
      
      const response = await apiFetch('/test')
      
      expect(response.status).toBe(401)
      expect(mockFetch).toHaveBeenCalledTimes(1) // Only the original request
    })

    it('attempts token refresh on 401 responses', async () => {
      const mockUnauthorizedResponse = { 
        status: 401, 
        ok: false,
        json: vi.fn().mockResolvedValue({}) 
      }
      const mockRefreshResponse = { 
        ok: true, 
        json: vi.fn().mockResolvedValue({ success: true, access: 'new-access', refresh: 'new-refresh' }) 
      }
      const mockSuccessResponse = { 
        ok: true, 
        json: vi.fn().mockResolvedValue({ data: 'success' }) 
      }
      
      mockFetch
        .mockResolvedValueOnce(mockUnauthorizedResponse) // Original request
        .mockResolvedValueOnce(mockRefreshResponse)      // Refresh request
        .mockResolvedValueOnce(mockSuccessResponse)     // Retried request
      
      const response = await apiFetch('/test')
      const responseData = await response.json()
      
      expect(responseData).toEqual({ data: 'success' })
      expect(mockFetch).toHaveBeenCalledTimes(3)
      expect(mockSet).toHaveBeenCalledWith({ 
        access: 'new-access', 
        refresh: 'new-refresh' 
      })
    })

    it('preserves original response when refresh fails', async () => {
      const mockUnauthorizedResponse = { 
        status: 401, 
        ok: false,
        json: vi.fn().mockResolvedValue({}) 
      }
      const mockFailedRefreshResponse = { 
        ok: false, 
        json: vi.fn().mockResolvedValue({}) 
      }
      
      mockFetch
        .mockResolvedValueOnce(mockUnauthorizedResponse)   // Original request
        .mockResolvedValueOnce(mockFailedRefreshResponse) // Refresh request
      
      const response = await apiFetch('/test')
      
      expect(response.status).toBe(401)
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })
  })
})