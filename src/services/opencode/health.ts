import { Capacitor } from '@capacitor/core'
import type { HealthCheckResult, ServerStatus } from '@/types'
import { normalizeUrl } from './url'
import { buildBasicAuthHeader } from './auth'
import { isDemoModeServer } from './demoMode'

interface HealthCheckOptions {
  baseUrl: string
  username?: string
  password?: string
  timeoutMs?: number
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

export async function checkServerHealth(options: HealthCheckOptions): Promise<HealthCheckResult> {
  const { baseUrl, username, password, timeoutMs = 3500 } = options

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
