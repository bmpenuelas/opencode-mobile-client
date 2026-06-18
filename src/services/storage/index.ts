import { Capacitor } from '@capacitor/core'
import { secureSecretStorage } from './secureSecretStorage'
import { webDevSecretStorage } from './webDevSecretStorage'
import type { SecretStorageAdapter } from './secureSecretStorage'

export { profileStorage } from './profileStorage'
export type { ProfileStorageAdapter } from './profileStorage'

export function getSecretStorage(): SecretStorageAdapter {
  if (Capacitor.isNativePlatform()) {
    return secureSecretStorage
  }
  return webDevSecretStorage
}
