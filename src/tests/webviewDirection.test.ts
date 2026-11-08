import { describe, it, expect } from 'vitest'
import { buildDirectionScript } from '@/services/platform/webviewDirection'

describe('buildDirectionScript', () => {
  it('sets rtl', () => {
    expect(buildDirectionScript('rtl')).toContain('document.documentElement.dir')
    expect(buildDirectionScript('rtl')).toContain('"rtl"')
  })

  it('sets ltr', () => {
    expect(buildDirectionScript('ltr')).toContain('"ltr"')
  })

  it('wraps the code so it is safe to execute repeatedly', () => {
    expect(buildDirectionScript('rtl').trim().startsWith('(function')).toBe(true)
  })
})
