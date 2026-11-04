import { beforeEach, describe, expect, it, vi } from 'vitest'

const { capacitorHttpRequest } = vi.hoisted(() => ({ capacitorHttpRequest: vi.fn() }))

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => true },
  CapacitorHttp: { request: capacitorHttpRequest },
}))

import {
  buildPairingConnectUrl,
  isLoopbackLink,
  mintPairingCode,
  parsePairingLink,
  redeemPairingLink,
  renewSession,
  sessionExpiresAt,
  shouldRenewSession,
} from '@/services/opencode/pairing'
import { buildBasicAuthHeader } from '@/services/opencode/auth'

const DAY_MS = 24 * 60 * 60 * 1000

describe('parsePairingLink', () => {
  it('parses a printed link', () => {
    expect(parsePairingLink('  http://192.168.1.20:49374/auth/connect/abc_DEF-123 \n')).toEqual({
      urls: ['http://192.168.1.20:49374'],
      code: 'abc_DEF-123',
    })
  })

  it('parses the QR payload, which is JSON rather than a link', () => {
    const qr = JSON.stringify({ code: 'abc123', urls: ['http://192.168.1.20:49374', 'http://100.64.0.2:49374/'] })
    expect(parsePairingLink(qr)).toEqual({
      urls: ['http://192.168.1.20:49374', 'http://100.64.0.2:49374'],
      code: 'abc123',
    })
  })

  it('removes duplicate addresses from the QR payload', () => {
    const qr = JSON.stringify({ code: 'abc123', urls: ['http://host:1', 'http://host:1/'] })
    expect(parsePairingLink(qr)?.urls).toEqual(['http://host:1'])
  })

  it.each([
    ['an empty value', ''],
    ['a bare server address', 'http://192.168.1.20:49374'],
    ['a bare code', 'abc123'],
    ['a link cut off before the code', 'http://host:1/auth/connect/'],
    ['another path', 'http://host:1/auth/other/abc123'],
    ['another scheme', 'ftp://host/auth/connect/abc123'],
    ['a malformed code', 'http://host:1/auth/connect/abc%20123'],
    ['malformed JSON', '{"code":"abc"'],
    ['a QR payload with no addresses', '{"code":"abc","urls":[]}'],
    ['a QR payload with a bad code', '{"code":"a b","urls":["http://host:1"]}'],
    ['a QR payload with embedded credentials', '{"code":"abc","urls":["http://u:p@host:1"]}'],
    ['a QR payload with a non-string address', '{"code":"abc","urls":[1]}'],
  ])('rejects %s', (_name, value) => {
    expect(parsePairingLink(value)).toBeNull()
  })
})

describe('isLoopbackLink', () => {
  it('is true only when no address can leave the computer', () => {
    expect(isLoopbackLink({ code: 'a', urls: ['http://127.0.0.1:49374'] })).toBe(true)
    expect(isLoopbackLink({ code: 'a', urls: ['http://localhost:49374', 'http://[::1]:49374'] })).toBe(true)
    expect(isLoopbackLink({ code: 'a', urls: ['http://127.0.0.1:49374', 'http://192.168.1.20:49374'] })).toBe(false)
  })
})

describe('redeemPairingLink', () => {
  beforeEach(() => { capacitorHttpRequest.mockReset() })

  it('asks for JSON, so the server answers with a token instead of a cookie and redirect', async () => {
    capacitorHttpRequest.mockResolvedValueOnce({ status: 200, data: { token: '1800000000.sig' } })

    const result = await redeemPairingLink({ urls: ['http://host:1'], code: 'abc' })

    expect(result).toEqual({ type: 'paired', baseUrl: 'http://host:1', token: '1800000000.sig' })
    expect(capacitorHttpRequest).toHaveBeenCalledWith(expect.objectContaining({
      url: 'http://host:1/auth/connect/abc',
      method: 'GET',
      headers: expect.objectContaining({ Accept: 'application/json' }),
    }))
  })

  it('reports a used or expired code', async () => {
    capacitorHttpRequest.mockResolvedValueOnce({
      status: 401,
      data: { _tag: 'UnauthorizedError', message: 'Pairing link expired or already used' },
    })

    expect(await redeemPairingLink({ urls: ['http://host:1'], code: 'abc' })).toEqual({ type: 'expired' })
  })

  it('moves on to the next address when one cannot be reached', async () => {
    capacitorHttpRequest
      .mockRejectedValueOnce(new Error('timeout'))
      .mockResolvedValueOnce({ status: 200, data: { token: 't.s' } })

    const result = await redeemPairingLink({ urls: ['http://lan:1', 'http://vpn:1'], code: 'abc' })

    expect(result).toEqual({ type: 'paired', baseUrl: 'http://vpn:1', token: 't.s' })
  })

  it('does not try another address once the code is spent', async () => {
    capacitorHttpRequest.mockResolvedValueOnce({ status: 200, data: { token: 't.s' } })

    await redeemPairingLink({ urls: ['http://lan:1', 'http://vpn:1'], code: 'abc' })

    expect(capacitorHttpRequest).toHaveBeenCalledTimes(1)
  })

  it('reports unreachable when no address answers', async () => {
    capacitorHttpRequest.mockRejectedValue(new Error('timeout'))

    expect(await redeemPairingLink({ urls: ['http://a:1', 'http://b:1'], code: 'abc' })).toEqual({ type: 'unreachable' })
  })

  it('does not treat a 200 without a token as paired', async () => {
    capacitorHttpRequest.mockResolvedValueOnce({ status: 200, data: '<html></html>' })

    expect(await redeemPairingLink({ urls: ['http://a:1'], code: 'abc' })).toEqual({ type: 'unreachable' })
  })
})

describe('mintPairingCode', () => {
  beforeEach(() => { capacitorHttpRequest.mockReset() })

  it('posts to /api/pair with Basic auth', async () => {
    capacitorHttpRequest.mockResolvedValueOnce({ status: 200, data: { code: 'fresh', expires_in: 300 } })

    const code = await mintPairingCode({ baseUrl: 'http://host:1/', username: 'opencode', password: 'secret' })

    expect(code).toBe('fresh')
    expect(capacitorHttpRequest).toHaveBeenCalledWith(expect.objectContaining({
      url: 'http://host:1/api/pair',
      method: 'POST',
      headers: expect.objectContaining({ Authorization: buildBasicAuthHeader('opencode', 'secret') }),
    }))
  })

  it('returns null when the server refuses or cannot be reached', async () => {
    capacitorHttpRequest.mockResolvedValueOnce({ status: 401, data: {} })
    expect(await mintPairingCode({ baseUrl: 'http://host:1', username: 'opencode', password: 'x' })).toBeNull()

    capacitorHttpRequest.mockRejectedValueOnce(new Error('timeout'))
    expect(await mintPairingCode({ baseUrl: 'http://host:1', username: 'opencode', password: 'x' })).toBeNull()
  })
})

describe('session tokens', () => {
  it('reads the expiry from a token', () => {
    expect(sessionExpiresAt('1800000000.abc-_')).toBe(1800000000 * 1000)
  })

  it.each(['password', 'not.a.token', 'abc.def', '.sig', '123.'])('finds no expiry in %s', (value) => {
    expect(sessionExpiresAt(value)).toBeNull()
  })

  it('renews only in the second half of the 30 day lifetime', () => {
    const now = 1_800_000_000_000
    const token = (days: number) => `${(now + days * DAY_MS) / 1000}.sig`

    expect(shouldRenewSession(token(30), now)).toBe(false)
    expect(shouldRenewSession(token(16), now)).toBe(false)
    expect(shouldRenewSession(token(14), now)).toBe(true)
    expect(shouldRenewSession('not-a-token', now)).toBe(false)
  })

  it('exchanges a token for a new one', async () => {
    capacitorHttpRequest.mockReset()
    capacitorHttpRequest
      .mockResolvedValueOnce({ status: 200, data: { code: 'fresh', expires_in: 300 } })
      .mockResolvedValueOnce({ status: 200, data: { token: 'new.token' } })

    expect(await renewSession('http://host:1', 'old.token')).toBe('new.token')
    expect(capacitorHttpRequest).toHaveBeenNthCalledWith(1, expect.objectContaining({
      headers: expect.objectContaining({ Authorization: buildBasicAuthHeader('opencode', 'old.token') }),
    }))
    expect(capacitorHttpRequest).toHaveBeenNthCalledWith(2, expect.objectContaining({
      url: 'http://host:1/auth/connect/fresh',
    }))
  })

  it('keeps the old token when renewal fails', async () => {
    capacitorHttpRequest.mockReset()
    capacitorHttpRequest.mockRejectedValue(new Error('timeout'))

    expect(await renewSession('http://host:1', 'old.token')).toBeNull()
  })
})

describe('buildPairingConnectUrl', () => {
  it('builds the link a webview opens to sign in', () => {
    expect(buildPairingConnectUrl('http://host:1/', 'abc')).toBe('http://host:1/auth/connect/abc')
  })
})
