import { describe, it, expect, beforeEach } from 'vitest'
import {
  getWebviewDirection,
  setWebviewDirection,
  WEBVIEW_DIRECTION_KEY,
} from '@/services/storage/uiPreferences'

beforeEach(() => {
  localStorage.clear()
})

describe('webview direction preference', () => {
  it('defaults to ltr', () => {
    expect(getWebviewDirection()).toBe('ltr')
  })

  it('persists rtl', () => {
    setWebviewDirection('rtl')
    expect(localStorage.getItem(WEBVIEW_DIRECTION_KEY)).toBe('rtl')
    expect(getWebviewDirection()).toBe('rtl')
  })

  it('falls back to ltr for an invalid stored value', () => {
    localStorage.setItem(WEBVIEW_DIRECTION_KEY, 'sideways')
    expect(getWebviewDirection()).toBe('ltr')
  })
})
