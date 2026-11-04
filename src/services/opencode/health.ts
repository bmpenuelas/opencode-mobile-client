import { Capacitor } from '@capacitor/core'
import type { HealthCheckResult, ServerStatus, ServerVersion } from '@/types'
import { normalizeUrl } from './url'
import { buildBasicAuthHeader } from './auth'
import { isDemoModeServer } from './demoMode'
import { requestJson } from './http'

interface HealthCheckOptions {
  baseUrl: string
  username?: string
  password?: string
  timeoutMs?: number
  serverVersion?: ServerVersion
}

async function nativeRequest(url: string, headers: Record<string, string>, timeoutMs: number): Promise<{ status: number }> {
  const { CapacitorHttp } = await import('@capacitor/core')
  const requestOptions = {
    url,
    headers,
    connectTimeout: timeoutMs,
    readTimeout: timeoutMs,
  }

  try {
    const response = await (CapacitorHttp as any).request({
      ...requestOptions,
      method: 'HEAD',
    })
    return { status: response.status }
  } catch {
    // Some native HTTP stacks can reject HEAD 401/403 responses instead of
    // surfacing their status code. Retry with GET so auth failures don't get
    // collapsed into a generic offline/unreachable state.
    const response = await (CapacitorHttp as any).request({
      ...requestOptions,
      method: 'GET',
    })
    return { status: response.status }
  }
}

async function webRequest(url: string, headers: Record<string, string>, timeoutMs: number): Promise<{ status: number }> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      method: 'HEAD',
      headers,
      signal: controller.signal,
      mode: 'cors',
    })
    return { status: response.status }
  } finally {
    clearTimeout(timeoutId)
  }
}

async function makeRequest(url: string, headers: Record<string, string>, timeoutMs: number): Promise<{ status: number }> {
  if (Capacitor.isNativePlatform()) {
    return nativeRequest(url, headers, timeoutMs)
  }
  return webRequest(url, headers, timeoutMs)
}

function classifyStatus(statusCode: number, hadAuth: boolean): ServerStatus {
  if (statusCode >= 200 && statusCode < 400) {
    return 'connected'
  }
  if (statusCode === 401) {
    return hadAuth ? 'wrong_credentials' : 'auth_required'
  }
  if (statusCode === 403) {
    return hadAuth ? 'wrong_credentials' : 'auth_required'
  }
  return 'unreachable'
}

// v2 serves the web shell at / before authenticating, so / answers 200 even with a wrong
// password. /api/info is authenticated, and only a v2 server answers it with JSON.
async function checkV2ServerHealth(baseUrl: string, headers: Record<string, string>, hasAuth: boolean, timeoutMs: number): Promise<HealthCheckResult> {
  const { status, data } = await requestJson(`${baseUrl}/api/info`, { headers, timeoutMs })
  const isV2Info = typeof (data as { version?: unknown } | undefined)?.version === 'string'

  if ((status >= 200 && status < 300 && !isV2Info) || status === 404) {
    return { reachable: true, status: 'incompatible', statusCode: status }
  }

  const statusName = classifyStatus(status, hasAuth)
  return { reachable: statusName !== 'unreachable', status: statusName, statusCode: status }
}

export async function checkServerHealth(options: HealthCheckOptions): Promise<HealthCheckResult> {
  const { baseUrl, username, password, timeoutMs = 3500, serverVersion = 'v1' } = options

  if (isDemoModeServer({ baseUrl, username, password })) {
    return {
      reachable: true,
      status: 'connected',
      statusCode: 200,
    }
  }

  const normalized = normalizeUrl(baseUrl)
  const healthUrl = `${normalized}/`
  const headers: Record<string, string> = {}

  const hasAuth = Boolean(username && password)
  if (hasAuth) {
    headers['Authorization'] = buildBasicAuthHeader(username!, password!)
  }

  try {
    if (serverVersion === 'v2') {
      return await checkV2ServerHealth(normalized, headers, hasAuth, timeoutMs)
    }

    const { status } = await makeRequest(healthUrl, headers, timeoutMs)
    const statusName = classifyStatus(status, hasAuth)

    return {
      reachable: statusName !== 'unreachable',
      status: statusName,
      statusCode: status,
    }
  } catch (error: any) {
    if (error?.name === 'AbortError' || error?.message?.includes?.('timeout') || error?.message?.includes?.('abort')) {
      return { reachable: false, status: 'unreachable' }
    }

    if (error?.message?.includes?.('NetworkError') || error?.message?.includes?.('Failed to fetch') || error?.message?.includes?.('ERR_CONNECTION')) {
      return { reachable: false, status: 'unreachable' }
    }

    return { reachable: false, status: 'unreachable' }
  }
}
