import { beforeEach, describe, expect, it, vi } from 'vitest'

const { capacitorHttpRequest, isNativePlatform } = vi.hoisted(() => ({
  capacitorHttpRequest: vi.fn(),
  isNativePlatform: vi.fn(() => true),
}))

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: () => isNativePlatform(),
  },
  CapacitorHttp: {
    request: capacitorHttpRequest,
  },
}))

import { checkServerHealth } from '@/services/opencode/health'

describe('checkServerHealth', () => {
  beforeEach(() => {
    capacitorHttpRequest.mockReset()
    isNativePlatform.mockReset()
    isNativePlatform.mockReturnValue(true)
  })

  it('falls back to GET on native when HEAD rejects and preserves wrong_credentials', async () => {
    capacitorHttpRequest
      .mockRejectedValueOnce(new Error('HEAD request failed'))
      .mockResolvedValueOnce({ status: 401 })

    const result = await checkServerHealth({
      baseUrl: 'http://localhost:4096',
      username: 'opencode',
      password: 'wrong-password',
      timeoutMs: 3500,
    })

    expect(capacitorHttpRequest).toHaveBeenNthCalledWith(1, expect.objectContaining({
      url: 'http://localhost:4096/',
      method: 'HEAD',
    }))
    expect(capacitorHttpRequest).toHaveBeenNthCalledWith(2, expect.objectContaining({
      url: 'http://localhost:4096/',
      method: 'GET',
    }))
    expect(result).toEqual({
      reachable: true,
      status: 'wrong_credentials',
      statusCode: 401,
    })
  })

  it('falls back to GET on native when HEAD rejects and preserves auth_required', async () => {
    capacitorHttpRequest
      .mockRejectedValueOnce(new Error('HEAD request failed'))
      .mockResolvedValueOnce({ status: 401 })

    const result = await checkServerHealth({
      baseUrl: 'http://localhost:4096',
      timeoutMs: 3500,
    })

    expect(result).toEqual({
      reachable: true,
      status: 'auth_required',
      statusCode: 401,
    })
  })

  describe('on a v2 server', () => {
    const v2 = { baseUrl: 'http://localhost:49374', timeoutMs: 3500, serverVersion: 'v2' as const }
    const info = { version: '2.2.5', pid: 1, urls: [], paths: { tmp: '/tmp' } }

    it('checks /api/info, because / answers 200 even with a wrong password', async () => {
      capacitorHttpRequest.mockResolvedValueOnce({ status: 200, data: info })

      const result = await checkServerHealth({ ...v2, username: 'opencode', password: 'secret' })

      expect(capacitorHttpRequest).toHaveBeenCalledTimes(1)
      expect(capacitorHttpRequest).toHaveBeenCalledWith(expect.objectContaining({
        url: 'http://localhost:49374/api/info',
        method: 'GET',
        headers: expect.objectContaining({ Authorization: expect.stringMatching(/^Basic /) }),
      }))
      expect(result).toEqual({ reachable: true, status: 'connected', statusCode: 200 })
    })

    it('accepts info that arrives as an unparsed string', async () => {
      capacitorHttpRequest.mockResolvedValueOnce({ status: 200, data: JSON.stringify(info) })

      expect((await checkServerHealth(v2)).status).toBe('connected')
    })

    it('reports wrong_credentials for a 401 with credentials', async () => {
      capacitorHttpRequest.mockResolvedValueOnce({ status: 401, data: {} })

      const result = await checkServerHealth({ ...v2, username: 'opencode', password: 'expired.token' })

      expect(result.status).toBe('wrong_credentials')
    })

    it('reports auth_required for a 401 without credentials', async () => {
      capacitorHttpRequest.mockResolvedValueOnce({ status: 401, data: {} })

      expect((await checkServerHealth(v2)).status).toBe('auth_required')
    })

    it.each([
      ['answers 200 with a web page', { status: 200, data: '<!doctype html>' }],
      ['has no /api/info route', { status: 404, data: '' }],
    ])('reports incompatible when the server %s', async (_name, response) => {
      capacitorHttpRequest.mockResolvedValueOnce(response)

      expect(await checkServerHealth(v2)).toEqual({
        reachable: true,
        status: 'incompatible',
        statusCode: response.status,
      })
    })

    it('reports unreachable for a server error', async () => {
      capacitorHttpRequest.mockResolvedValueOnce({ status: 503, data: '' })

      expect((await checkServerHealth(v2)).status).toBe('unreachable')
    })

    it('reports unreachable when the request fails', async () => {
      capacitorHttpRequest.mockRejectedValueOnce(new Error('timeout'))

      expect(await checkServerHealth(v2)).toEqual({ reachable: false, status: 'unreachable' })
    })

    it('still lets the demo account through without a request', async () => {
      const result = await checkServerHealth({ ...v2, username: 'demo_user_1234', password: 'demo_password_12345678' })

      expect(result.status).toBe('connected')
      expect(capacitorHttpRequest).not.toHaveBeenCalled()
    })
  })
})
