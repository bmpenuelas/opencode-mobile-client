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
  setDeviceIntegrationEnabled,
} from '@/services/platform/deviceIntegration'

describe('device integration settings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(Preferences.get).mockResolvedValue({ value: null })
  })

  it('opens files and copies on the device by default', async () => {
    await expect(loadDeviceIntegrationSettings()).resolves.toEqual({ enabled: true })
  })

  it('falls back to the default when stored settings are invalid', async () => {
    vi.mocked(Preferences.get).mockResolvedValue({ value: 'not json' })

    await expect(loadDeviceIntegrationSettings()).resolves.toEqual({ enabled: true })
  })

  it('persists an explicit disable and reads it back', async () => {
    await setDeviceIntegrationEnabled(false)

    expect(Preferences.set).toHaveBeenCalledWith({
      key: 'opencode_device_integration',
      value: JSON.stringify({ enabled: false }),
    })

    vi.mocked(Preferences.get).mockResolvedValue({
      value: JSON.stringify({ enabled: false }),
    })
    await expect(loadDeviceIntegrationSettings()).resolves.toEqual({ enabled: false })
  })

  it('restores an explicit enable', async () => {
    vi.mocked(Preferences.get).mockResolvedValue({
      value: JSON.stringify({ enabled: true }),
    })

    await expect(loadDeviceIntegrationSettings()).resolves.toEqual({ enabled: true })
  })

  it('only enables the integration on a native platform', () => {
    expect(isDeviceIntegrationSupported()).toBe(true)
  })
})