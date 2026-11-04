import { buildBasicAuthHeader } from './auth'
import { requestJson } from './http'
import { normalizeUrl } from './url'

/** OpenCode v2 only accepts this username, for passwords and session tokens alike. */
export const V2_USERNAME = 'opencode'

const DEFAULT_TIMEOUT_MS = 5000
const DAY_MS = 24 * 60 * 60 * 1000
// Sessions last 30 days, so this renews on any connect in the second half of that window.
const RENEW_WITHIN_MS = 15 * DAY_MS

const CODE = /^[A-Za-z0-9_-]+$/
const CONNECT_PATH = /^\/auth\/connect\/([^/]+)\/?$/

export interface PairingLink {
  urls: string[]
  code: string
}

export type RedeemResult =
  | { type: 'paired'; baseUrl: string; token: string }
  | { type: 'expired' }
  | { type: 'unreachable' }

function serverAddress(value: unknown): string | null {
  if (typeof value !== 'string') return null
  try {
    const url = new URL(normalizeUrl(value))
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    if (url.username || url.password || url.search || url.hash) return null
    return normalizeUrl(url.href)
  } catch {
    return null
  }
}

function parseQrPayload(value: string): PairingLink | null {
  let payload: { code?: unknown; urls?: unknown }
  try {
    payload = JSON.parse(value)
  } catch {
    return null
  }
  if (typeof payload?.code !== 'string' || !CODE.test(payload.code)) return null
  if (!Array.isArray(payload.urls) || payload.urls.length === 0) return null

  const urls = [...new Set(payload.urls.map(serverAddress))]
  if (urls.some((url) => url === null)) return null
  return { urls: urls as string[], code: payload.code }
}

/**
 * Accepts either form `opencode pair` produces: a printed link, or the text of its
 * QR code, which is `{"code","urls"}` JSON listing every address of the server.
 */
export function parsePairingLink(value: string): PairingLink | null {
  const trimmed = value.trim()
  if (trimmed.startsWith('{')) return parseQrPayload(trimmed)

  try {
    const url = new URL(trimmed)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    const code = CONNECT_PATH.exec(url.pathname)?.[1]
    const address = serverAddress(url.origin)
    if (!code || !CODE.test(code) || !address) return null
    return { urls: [address], code }
  } catch {
    return null
  }
}

export function isLoopbackLink(link: PairingLink): boolean {
  return link.urls.every((value) => {
    const { hostname } = new URL(value)
    return hostname === 'localhost' || hostname === '[::1]' || hostname.startsWith('127.')
  })
}

export function buildPairingConnectUrl(baseUrl: string, code: string): string {
  return `${normalizeUrl(baseUrl)}/auth/connect/${code}`
}

/**
 * Tries each address in turn. The code is single-use, so stopping at the first answer
 * avoids spending it on one address while another is still being tried.
 */
export async function redeemPairingLink(link: PairingLink, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<RedeemResult> {
  for (const baseUrl of link.urls) {
    try {
      const { status, data } = await requestJson(buildPairingConnectUrl(baseUrl, link.code), { timeoutMs })
      const token = (data as { token?: unknown } | undefined)?.token
      if (status === 200 && typeof token === 'string' && token) return { type: 'paired', baseUrl, token }
      if (status === 401) return { type: 'expired' }
    } catch {
      // Unreachable from here. Only an answer from the server proves the code is spent.
    }
  }
  return { type: 'unreachable' }
}

interface MintOptions {
  baseUrl: string
  username: string
  password: string
  timeoutMs?: number
}

/** Asks the server for a fresh single-use code, authenticating with a password or session token. */
export async function mintPairingCode(options: MintOptions): Promise<string | null> {
  const { baseUrl, username, password, timeoutMs = DEFAULT_TIMEOUT_MS } = options
  try {
    const { status, data } = await requestJson(`${normalizeUrl(baseUrl)}/api/pair`, {
      method: 'POST',
      headers: { Authorization: buildBasicAuthHeader(username, password) },
      timeoutMs,
    })
    const code = (data as { code?: unknown } | undefined)?.code
    return status === 200 && typeof code === 'string' && CODE.test(code) ? code : null
  } catch {
    return null
  }
}

/** Session tokens look like `<expiry in unix seconds>.<signature>`. */
export function sessionExpiresAt(token: string): number | null {
  const [expires, signature, ...rest] = token.split('.')
  if (!signature || rest.length > 0) return null
  const seconds = Number(expires)
  return Number.isSafeInteger(seconds) && seconds > 0 ? seconds * 1000 : null
}

export function shouldRenewSession(token: string, now = Date.now()): boolean {
  const expiresAt = sessionExpiresAt(token)
  return expiresAt !== null && expiresAt - now < RENEW_WITHIN_MS
}

/** Exchanges a working session token for one with a full lifetime, or null if that fails. */
export async function renewSession(baseUrl: string, token: string, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<string | null> {
  const code = await mintPairingCode({ baseUrl, username: V2_USERNAME, password: token, timeoutMs })
  if (!code) return null
  const result = await redeemPairingLink({ urls: [normalizeUrl(baseUrl)], code }, timeoutMs)
  return result.type === 'paired' ? result.token : null
}
