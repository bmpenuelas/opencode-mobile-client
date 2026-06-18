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
  error?: string
}

export function validateUrl(url: string): ValidationResult {
  if (!url || !url.trim()) {
    return { valid: false, error: 'URL is required' }
  }

  const trimmed = url.trim()

  if (!/^https?:\/\//i.test(trimmed)) {
    return { valid: false, error: 'URL must start with http:// or https://' }
  }

  try {
    const parsed = new URL(trimmed)

    if (!parsed.hostname) {
      return { valid: false, error: 'URL must include a hostname' }
    }

    if (/xxx/i.test(parsed.hostname)) {
      return { valid: false, error: 'Replace the placeholder URL with your server\'s actual address' }
    }

    if (parsed.username || parsed.password) {
      return { valid: false, error: 'Embedded credentials in URL are not allowed. Use the separate auth fields instead.' }
    }

    if (parsed.protocol === 'http:' && parsed.hostname !== 'localhost' && !/^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(parsed.hostname) && !/^192\.168\.\d{1,3}\.\d{1,3}$/.test(parsed.hostname) && !/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(parsed.hostname) && !/^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/.test(parsed.hostname)) {
      return { valid: true, error: 'Using HTTP over the internet is not secure. Use HTTPS or a VPN for remote connections.' }
    }

    return { valid: true }
  } catch {
    return { valid: false, error: 'Invalid URL format' }
  }
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
