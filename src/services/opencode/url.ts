export function normalizeUrl(url: string): string {
  let normalized = url.trim()
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    normalized = `http://${normalized}`
  }
  normalized = normalized.replace(/\/+$/, '')
  return normalized
}

export interface ValidationResult {
  valid: boolean
  /** i18n key of the message to show (error when invalid, warning when valid). */
  messageKey?: string
}

export function validateUrl(url: string): ValidationResult {
  if (!url || !url.trim()) {
    return { valid: false, messageKey: 'form.urlRequired' }
  }

  const trimmed = url.trim()

  if (!/^https?:\/\//i.test(trimmed)) {
    return { valid: false, messageKey: 'form.urlSchemeRequired' }
  }

  try {
    const parsed = new URL(trimmed)

    if (!parsed.hostname) {
      return { valid: false, messageKey: 'form.urlHostnameRequired' }
    }

    if (/xxx/i.test(parsed.hostname)) {
      return { valid: false, messageKey: 'form.urlPlaceholder' }
    }

    if (parsed.username || parsed.password) {
      return { valid: false, messageKey: 'form.urlEmbeddedCredentials' }
    }

    if (parsed.protocol === 'http:' && !isLocalOrPrivateHost(parsed.hostname)) {
      return { valid: true, messageKey: 'form.urlInsecureHttp' }
    }

    return { valid: true }
  } catch {
    return { valid: false, messageKey: 'form.urlInvalid' }
  }
}

function isLocalOrPrivateHost(hostname: string): boolean {
  const host = hostname.toLowerCase()
  return (
    host === 'localhost' ||
    host.endsWith('.local') ||
    /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host) ||
    /^192\.168\.\d{1,3}\.\d{1,3}$/.test(host) ||
    /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/.test(host) ||
    /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.\d{1,3}\.\d{1,3}$/.test(host)
  )
}

export function sanitizeUrlForDisplay(url: string): string {
  try {
    const parsed = new URL(url)
    if (parsed.username) {
      parsed.username = ''
    }
    if (parsed.password) {
      parsed.password = ''
    }
    return parsed.toString().replace(/\/+$/, '')
  } catch {
    return url.replace(/\/\/.*@/, '//[credentials-hidden]@')
  }
}

export function buildIframeUrl(baseUrl: string, username?: string, password?: string): string {
  const normalized = normalizeUrl(baseUrl)
  if (!username || !password) {
    return normalized + '/'
  }
  try {
    const parsed = new URL(normalized)
    parsed.username = encodeURIComponent(username)
    parsed.password = encodeURIComponent(password)
    return parsed.toString().replace(/\/+$/, '') + '/'
  } catch {
    return normalized + '/'
  }
}

export function buildIframeUrlSanitized(baseUrl: string, _username?: string, _password?: string): string {
  return sanitizeUrlForDisplay(buildIframeUrl(baseUrl, _username, _password))
}
