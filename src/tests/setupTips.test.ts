import { describe, expect, it } from 'vitest'
import { serverTip } from '@/services/opencode/setupTips'
import { setLocale, supportedLocales, t } from '@/i18n'

const paired = { paired: true }
const manual = { paired: false }

describe('serverTip', () => {
  it.each(['online', 'connected', 'checking', 'reconnecting', 'unknown', 'idle'])('stays quiet when the status is %s', (status) => {
    expect(serverTip(manual, status)).toBeNull()
  })

  it.each(['offline', 'unreachable'])('points a paired server at the service when %s', (status) => {
    expect(serverTip(paired, status)).toEqual({ textKey: 'tips.offlinePaired', command: 'opencode service status', canEdit: false })
  })

  it('has no service command for a server started by hand', () => {
    expect(serverTip(manual, 'offline')).toEqual({ textKey: 'tips.offline', canEdit: false })
  })

  it('asks to pair again when a session stops working', () => {
    expect(serverTip(paired, 'wrong_credentials')).toEqual({ textKey: 'tips.pairAgain', command: 'opencode pair', canEdit: true })
  })

  it('asks for the password when a typed one stops working', () => {
    expect(serverTip(manual, 'wrong_credentials')).toEqual({ textKey: 'tips.wrongPassword', canEdit: true })
  })

  it.each(['auth_required', 'incompatible'])('leads to the edit screen for %s', (status) => {
    expect(serverTip(manual, status)?.canEdit).toBe(true)
  })

  it.each(['offline', 'auth_required', 'wrong_credentials', 'incompatible'])('uses a real message for %s', (status) => {
    for (const profile of [paired, manual]) {
      const key = serverTip(profile, status)!.textKey
      expect(t(key)).not.toBe(key)
    }
  })
})

describe('setup tip strings', () => {
  const keys = [
    'tips.onComputer', 'tips.pair1', 'tips.pair2', 'tips.pair3', 'tips.pair3Scan', 'tips.chipNetwork', 'tips.chipLink',
    'tips.chipUsername', 'tips.scanDark', 'tips.manualStart', 'tips.manualEnter', 'tips.v1Start', 'tips.v1Password',
    'tips.v1Upgrade', 'tips.linkOk', 'tips.linkInvalid', 'tips.landing', 'tips.offline', 'tips.offlinePaired',
    'tips.authRequired', 'tips.pairAgain', 'tips.wrongPassword', 'tips.incompatible', 'help.serveText', 'help.awayText',
    'help.address', 'help.addressText',
  ]

  it('are translated in every catalog', () => {
    setLocale('en-US')
    const english = keys.map((key) => t(key))
    english.forEach((text, index) => expect(text).not.toBe(keys[index]))

    for (const { code } of supportedLocales.filter((locale) => locale.code !== 'en-US')) {
      setLocale(code)
      keys.forEach((key, index) => expect(t(key), `${key} in ${code}`).not.toBe(english[index]))
    }
    setLocale('en-US')
  })
})
