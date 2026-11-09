import { describe, it, expect, beforeEach } from 'vitest'
import { buildToolbarScript } from '@/services/platform/webviewToolbar'
import { setLocale } from '@/i18n'

function runScript(code: string): void {
  // eslint-disable-next-line no-new-func
  new Function(code)()
}

function iconGlyphs(): string[] {
  return Array.from(document.querySelectorAll('#oc-panel-items .oc-ico')).map(
    (node) => node.textContent ?? ''
  )
}

describe('injected toolbar script', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    document.head.innerHTML = ''
    localStorage.clear()
    setLocale('en-US')
  })

  it('keeps the LTR layout by default', () => {
    runScript(buildToolbarScript('connected', 'example.com:4096', false))

    const panel = document.getElementById('oc-panel')
    expect(panel).not.toBeNull()
    expect(panel!.getAttribute('dir')).toBe('ltr')

    const [refresh, back, forward] = iconGlyphs()
    expect(refresh).toBe('↻')
    expect(back).toBe('←')
    expect(forward).toBe('→')
  })

  it('mirrors the panel and swaps navigation glyphs in RTL', () => {
    runScript(buildToolbarScript('connected', 'example.com:4096', true))

    const panel = document.getElementById('oc-panel')
    expect(panel).not.toBeNull()
    expect(panel!.getAttribute('dir')).toBe('rtl')

    const [refresh, back, forward] = iconGlyphs()
    expect(refresh).toBe('↻')
    expect(back).toBe('→')
    expect(forward).toBe('←')

    const style = document.querySelector('style')?.textContent ?? ''
    expect(style).toContain('#oc-panel[dir="rtl"]')
    expect(style).toContain('#oc-panel[dir="rtl"] .oc-lbl{padding-left:0;padding-right:10px}')
    expect(style).toContain('#oc-panel[dir="rtl"] .oc-switch .oc-knob{left:auto;right:2px}')
    expect(style).toContain('translateX(-8px)')
  })

  it('renders the toolbar labels in the app language', () => {
    setLocale('ar')
    runScript(buildToolbarScript('connected', 'example.com:4096', true))

    expect(document.getElementById('oc-tab-label')?.textContent).toContain('الخيارات')
    expect(document.getElementById('oc-panel-url')?.textContent).toBe('example.com:4096')
  })

  it('updates an existing panel dir attribute when re-injected with a new direction', () => {
    runScript(buildToolbarScript('connected', 'example.com:4096', false))
    expect(document.getElementById('oc-panel')?.getAttribute('dir')).toBe('ltr')

    runScript(buildToolbarScript('connected', 'example.com:4096', true))
    expect(document.getElementById('oc-panel')?.getAttribute('dir')).toBe('rtl')
  })
})
