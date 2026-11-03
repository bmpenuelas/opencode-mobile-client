import { Capacitor } from '@capacitor/core'
import { Preferences } from '@capacitor/preferences'

const SETTINGS_KEY = 'opencode_device_integration'

export type DeviceIntegrationSettings = {
  /**
   * When enabled, the embedded OpenCode Web UI uses the phone for file
   * downloads and clipboard writes instead of leaving them inside the WebView.
   */
  enabled: boolean
  /**
   * When enabled, links tapped in the embedded OpenCode Web UI that point to
   * another origin open in the phone's browser instead of navigating inside
   * the WebView.
   */
  openLinksInBrowser: boolean
}

export const DEFAULT_DEVICE_INTEGRATION_SETTINGS: DeviceIntegrationSettings = {
  enabled: true,
  openLinksInBrowser: true,
}

export function isDeviceIntegrationSupported(): boolean {
  return Capacitor.isNativePlatform()
}

export async function loadDeviceIntegrationSettings(): Promise<DeviceIntegrationSettings> {
  const { value } = await Preferences.get({ key: SETTINGS_KEY })
  if (!value) return { ...DEFAULT_DEVICE_INTEGRATION_SETTINGS }

  try {
    const parsed = JSON.parse(value) as Partial<DeviceIntegrationSettings>
    return {
      ...DEFAULT_DEVICE_INTEGRATION_SETTINGS,
      enabled: parsed.enabled !== false,
      openLinksInBrowser: parsed.openLinksInBrowser !== false,
    }
  } catch {
    return { ...DEFAULT_DEVICE_INTEGRATION_SETTINGS }
  }
}

export async function saveDeviceIntegrationSettings(
  patch: Partial<DeviceIntegrationSettings>,
): Promise<void> {
  const current = await loadDeviceIntegrationSettings()
  await Preferences.set({
    key: SETTINGS_KEY,
    value: JSON.stringify({ ...current, ...patch }),
  })
}

export async function setDeviceIntegrationEnabled(enabled: boolean): Promise<void> {
  await saveDeviceIntegrationSettings({ enabled })
}

export async function setOpenLinksInBrowserEnabled(openLinksInBrowser: boolean): Promise<void> {
  await saveDeviceIntegrationSettings({ openLinksInBrowser })
}
