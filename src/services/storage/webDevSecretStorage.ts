import type { SecretStorageAdapter } from './secureSecretStorage'

const PREFIX = 'opencode_dev_pw_'

function warnDev(): void {
  console.warn(
    '[OpenCode Mobile Client] Using WEB DEV fallback storage for secrets. ' +
    'Passwords are stored in localStorage (insecure). ' +
    'This is only suitable for development. ' +
    'On native builds, @aparajita/capacitor-secure-storage is used.'
  )
}

function isDevelopment(): boolean {
  return typeof window !== 'undefined' &&
    window.location &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
}

export const webDevSecretStorage: SecretStorageAdapter = {
  async getPassword(profileId: string): Promise<string | null> {
    if (isDevelopment()) {
      warnDev()
    }
    try {
      return localStorage.getItem(`${PREFIX}${profileId}`)
    } catch {
      return null
    }
  },

  async setPassword(profileId: string, password: string): Promise<void> {
    if (isDevelopment()) {
      warnDev()
    }
    try {
      localStorage.setItem(`${PREFIX}${profileId}`, password)
    } catch {
      // storage full or unavailable
    }
  },

  async deletePassword(profileId: string): Promise<void> {
    if (isDevelopment()) {
      warnDev()
    }
    try {
      localStorage.removeItem(`${PREFIX}${profileId}`)
    } catch {
      // ignore
    }
  },
}
