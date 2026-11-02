/**
 * Message type sent by the injected link bridge when the user taps an external
 * link inside the embedded OpenCode Web UI.
 */
export const EXTERNAL_LINK_MESSAGE_TYPE = 'opencode:open-external-link'

function toHttpUrl(value: string): string | null {
  try {
    const url = new URL(value)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    return url.href
  } catch {
    return null
  }
}

/**
 * Reads an external link URL from a `messageFromWebview` payload.
 *
 * Returns `null` for anything that is not a plain HTTP(S) URL, so the host only
 * ever hands the device browser a normal web address.
 */
export function parseExternalLinkUrl(detail: unknown): string | null {
  if (!detail || typeof detail !== 'object') return null

  const record = detail as Record<string, unknown>
  if (record.type !== EXTERNAL_LINK_MESSAGE_TYPE) return null
  if (typeof record.url !== 'string') return null

  return toHttpUrl(record.url)
}
