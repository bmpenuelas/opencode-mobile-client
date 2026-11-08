import { describe, it, expect, beforeEach, vi } from 'vitest'

const LOCALE_KEY = 'opencode-mobile.locale'

async function loadI18n() {
  vi.resetModules()
  return import('@/i18n')
}

beforeEach(() => {
  localStorage.clear()
  document.documentElement.lang = ''
  document.documentElement.dir = ''
  Object.defineProperty(window.navigator, 'language', { value: 'en-US', configurable: true })
})

describe('catalogues', () => {
  it('Arabic covers every English key', async () => {
    const { catalogKeys } = await loadI18n()
    expect(catalogKeys('ar')).toEqual(catalogKeys('en-US'))
  })

  it('other locales add no unknown keys', async () => {
    const { catalogKeys, supportedLocales } = await loadI18n()
    const english = catalogKeys('en-US')
    for (const { code } of supportedLocales) {
      if (code === 'en-US') continue
      expect(catalogKeys(code).filter((key) => !english.includes(key))).toEqual([])
    }
  })
})

describe('direction', () => {
  it('marks only Arabic as RTL', async () => {
    const { isRtl } = await loadI18n()
    expect(isRtl('ar')).toBe(true)
    expect(isRtl('en-US')).toBe(false)
    expect(isRtl('fr')).toBe(false)
  })

  it('setLocale updates lang and dir', async () => {
    const { setLocale } = await loadI18n()
    setLocale('ar')
    expect(document.documentElement.lang).toBe('ar')
    expect(document.documentElement.dir).toBe('rtl')
    setLocale('en-US')
    expect(document.documentElement.lang).toBe('en-US')
    expect(document.documentElement.dir).toBe('ltr')
  })

  it('applyDocumentLocale works standalone', async () => {
    const { applyDocumentLocale } = await loadI18n()
    applyDocumentLocale('ar')
    expect(document.documentElement.dir).toBe('rtl')
  })
})

describe('detection', () => {
  it('detects Arabic device locales', async () => {
    Object.defineProperty(window.navigator, 'language', { value: 'ar-EG', configurable: true })
    const { useI18n } = await loadI18n()
    expect(useI18n().locale.value).toBe('ar')
  })

  it('prefers the saved locale', async () => {
    localStorage.setItem(LOCALE_KEY, 'ar')
    Object.defineProperty(window.navigator, 'language', { value: 'en-US', configurable: true })
    const { useI18n } = await loadI18n()
    expect(useI18n().locale.value).toBe('ar')
  })

  it('ignores an unknown saved locale', async () => {
    localStorage.setItem(LOCALE_KEY, 'xx')
    Object.defineProperty(window.navigator, 'language', { value: 'fr-FR', configurable: true })
    const { useI18n } = await loadI18n()
    expect(useI18n().locale.value).toBe('fr')
  })
})
