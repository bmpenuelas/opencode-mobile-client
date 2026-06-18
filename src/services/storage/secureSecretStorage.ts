import { SecureStorage } from '@aparajita/capacitor-secure-storage'

export interface SecretStorageAdapter {
  getPassword(profileId: string): Promise<string | null>
  setPassword(profileId: string, password: string): Promise<void>
  deletePassword(profileId: string): Promise<void>
}

export const secureSecretStorage: SecretStorageAdapter = {
  async getPassword(profileId: string): Promise<string | null> {
    try {
      return await SecureStorage.getItem(`opencode_pw_${profileId}`)
    } catch {
      return null
    }
  },

  async setPassword(profileId: string, password: string): Promise<void> {
    await SecureStorage.setItem(`opencode_pw_${profileId}`, password)
  },

  async deletePassword(profileId: string): Promise<void> {
    await SecureStorage.remove(`opencode_pw_${profileId}`)
  },
}
