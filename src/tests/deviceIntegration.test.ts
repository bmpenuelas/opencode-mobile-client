import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: vi.fn(() => true),
    getPlatform: vi.fn(() => 'android'),
  },
}))

vi.mock('@capacitor/preferences', () => ({
  Preferences: {
    get: vi.fn(),
    set: vi.fn(),
  },
}))

import { Preferences } from '@capacitor/preferences'
import {
  isDeviceIntegrationSupported,
  loadDeviceIntegrationSettings,
  saveDeviceIntegrationSettings,
  setDeviceIntegrationEnabled,
  setOpenLinksInBrowserEnabled,
} from '@/services/platform/deviceIntegration'

const defaults = { enabled: true, openLinksInBrowser: true }

describe('device integration settings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(Preferences.get).mockResolvedValue({ value: null })
  })

  it('opens files, copies and opens links on the device by default', async () => {
    await expect(loadDeviceIntegrationSettings()).resolves.toEqual(defaults)
  })

  it('falls back to the default when stored settings are invalid', async () => {
    vi.mocked(Preferences.get).mockResolvedValue({ value: 'not json' })

    await expect(loadDeviceIntegrationSettings()).resolves.toEqual(defaults)
  })

  it('keeps the link setting when stored settings predate it', async () => {
    vi.mocked(Preferences.get).mockResolvedValue({
      value: JSON.stringify({ enabled: false }),
    })

    await expect(loadDeviceIntegrationSettings()).resolves.toEqual({
      enabled: false,
      openLinksInBrowser: true,
    })
  })

  it('persists an explicit disable and reads it back', async () => {
    await setDeviceIntegrationEnabled(false)

    expect(Preferences.set).toHaveBeenCalledWith({
      key: 'opencode_device_integration',
      value: JSON.stringify({ enabled: false, openLinksInBrowser: true }),
    })

    vi.mocked(Preferences.get).mockResolvedValue({
      value: JSON.stringify({ enabled: false, openLinksInBrowser: true }),
    })
    await expect(loadDeviceIntegrationSettings()).resolves.toEqual({
      enabled: false,
      openLinksInBrowser: true,
    })
  })

  it('persists the link toggle without dropping the other settings', async () => {
    vi.mocked(Preferences.get).mockResolvedValue({
      value: JSON.stringify({ enabled: false, openLinksInBrowser: true }),
    })

    await setOpenLinksInBrowserEnabled(false)

    expect(Preferences.set).toHaveBeenCalledWith({
      key: 'opencode_device_integration',
      value: JSON.stringify({ enabled: false, openLinksInBrowser: false }),
    })
  })

  it('persists partial updates', async () => {
    await saveDeviceIntegrationSettings({ openLinksInBrowser: false })

    expect(Preferences.set).toHaveBeenCalledWith({
      key: 'opencode_device_integration',
      value: JSON.stringify({ enabled: true, openLinksInBrowser: false }),
    })
  })

  it('restores an explicit enable', async () => {
    vi.mocked(Preferences.get).mockResolvedValue({
      value: JSON.stringify({ enabled: true, openLinksInBrowser: true }),
    })

    await expect(loadDeviceIntegrationSettings()).resolves.toEqual(defaults)
  })

  it('only enables the integration on a native platform', () => {
    expect(isDeviceIntegrationSupported()).toBe(true)
  })
})
