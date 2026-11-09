import { describe, it, expect, beforeEach } from 'vitest'
import {
  buildDirectionScript,
  buildPreShowScript,
  buildWebviewDirectionScript,
} from '@/services/platform/webviewDirection'
import { setWebviewDirection } from '@/services/storage/uiPreferences'

function runScript(code: string): void {
  // eslint-disable-next-line no-new-func
  new Function(code)()
}

describe('buildDirectionScript', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.lang = 'en'
    document.documentElement.dir = 'ltr'
    document.title = 'Initial'
  })

  it('switches documentElement.dir to rtl and leaves lang/title untouched', () => {
    runScript(buildDirectionScript('rtl'))

    expect(document.documentElement.dir).toBe('rtl')
    expect(document.documentElement.lang).toBe('en')
    expect(document.title).toBe('Initial')
  })

  it('switches documentElement.dir back to ltr', () => {
    document.documentElement.dir = 'rtl'
    runScript(buildDirectionScript('ltr'))

    expect(document.documentElement.dir).toBe('ltr')
  })

  it('is safe to run repeatedly without throwing or stacking side effects', () => {
    const code = buildDirectionScript('rtl')
    runScript(code)
    runScript(code)
    expect(document.documentElement.dir).toBe('rtl')
  })
})

describe('direction wiring', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.dir = 'ltr'
  })

  it('assembles a pre-show script that reflects the persisted rtl preference', () => {
    setWebviewDirection('rtl')

    const preShow = buildPreShowScript('window.__bridge=true;')
    expect(preShow).toContain('window.__bridge=true;')
    expect(preShow).toContain('"rtl"')

    runScript(preShow)
    expect(document.documentElement.dir).toBe('rtl')
    expect((window as unknown as { __bridge?: boolean }).__bridge).toBe(true)
  })

  it('assembles a pre-show script that reflects the default ltr preference', () => {
    const preShow = buildPreShowScript('window.__bridge=true;')
    expect(preShow).toContain('"ltr"')

    document.documentElement.dir = 'rtl'
    runScript(preShow)
    expect(document.documentElement.dir).toBe('ltr')
  })

  it('provides a page-loaded direction script tied to the persisted preference', () => {
    setWebviewDirection('rtl')
    runScript(buildWebviewDirectionScript())
    expect(document.documentElement.dir).toBe('rtl')
  })
})
