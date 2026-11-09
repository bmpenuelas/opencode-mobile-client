export type WebviewDirection = 'ltr' | 'rtl'

export const WEBVIEW_DIRECTION_KEY = 'opencode-mobile.webviewDirection'

const DEFAULT_DIRECTION: WebviewDirection = 'ltr'

function isWebviewDirection(value: string | null): value is WebviewDirection {
  return value === 'ltr' || value === 'rtl'
}

export function getWebviewDirection(): WebviewDirection {
  const stored = localStorage.getItem(WEBVIEW_DIRECTION_KEY)
  return isWebviewDirection(stored) ? stored : DEFAULT_DIRECTION
}

export function setWebviewDirection(value: WebviewDirection): void {
  localStorage.setItem(WEBVIEW_DIRECTION_KEY, value)
}
