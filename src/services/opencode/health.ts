import { Capacitor } from '@capacitor/core'
import type { HealthCheckResult, ServerStatus } from '@/types'
import { normalizeUrl } from './url'
import { buildBasicAuthHeader } from './auth'

interface HealthCheckOptions {
  baseUrl: string
  username?: string
  password?: string
  timeoutMs?: number
}

async function nativeRequest(url: string, headers: Record<string, string>, timeoutMs: number): Promise<{ status: number }> {
  const { CapacitorHttp } = await import('@capacitor/core')
  const response = await (CapacitorHttp as any).request({
    url,
    method: 'HEAD',
    headers,
    connectTimeout: timeoutMs,
    readTimeout: timeoutMs,
  })
  return { status: response.status }
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
      reachable: statusName === 'connected',
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
