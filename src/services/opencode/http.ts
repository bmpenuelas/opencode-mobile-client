import { Capacitor } from '@capacitor/core'

export interface JsonRequestOptions {
  method?: 'GET' | 'POST'
  headers?: Record<string, string>
  timeoutMs: number
}

export interface JsonResponse {
  status: number
  /** The parsed body, or undefined when the server did not answer with JSON. */
  data: unknown
}

function parseBody(body: unknown): unknown {
  if (typeof body !== 'string') return body ?? undefined
  try {
    return JSON.parse(body)
  } catch {
    return undefined
  }
}

async function nativeRequest(url: string, method: string, headers: Record<string, string>, timeoutMs: number): Promise<JsonResponse> {
  const { CapacitorHttp } = await import('@capacitor/core')
  const response = await (CapacitorHttp as any).request({
    url,
    method,
    headers,
    connectTimeout: timeoutMs,
    readTimeout: timeoutMs,
  })
  return { status: response.status, data: parseBody(response.data) }
}

async function webRequest(url: string, method: string, headers: Record<string, string>, timeoutMs: number): Promise<JsonResponse> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, { method, headers, signal: controller.signal, mode: 'cors' })
    return { status: response.status, data: parseBody(await response.text()) }
  } finally {
    clearTimeout(timeoutId)
  }
}

/** Rejects when the server cannot be reached; any HTTP answer resolves, whatever its status. */
export async function requestJson(url: string, options: JsonRequestOptions): Promise<JsonResponse> {
  const { method = 'GET', headers = {}, timeoutMs } = options
  // The Accept header is what makes /auth/connect/:code return a token instead of a cookie and redirect.
  const allHeaders = { Accept: 'application/json', ...headers }
  if (Capacitor.isNativePlatform()) {
    return nativeRequest(url, method, allHeaders, timeoutMs)
  }
  return webRequest(url, method, allHeaders, timeoutMs)
}
