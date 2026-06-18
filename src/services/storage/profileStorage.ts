import { Preferences } from '@capacitor/preferences'
import type { ServerProfile } from '@/types'

const PROFILES_KEY = 'opencode_server_profiles'

function generateId(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export interface ProfileStorageAdapter {
  loadProfiles(): Promise<ServerProfile[]>
  saveProfiles(profiles: ServerProfile[]): Promise<void>
  getProfile(id: string): Promise<ServerProfile | undefined>
  createProfile(data: Omit<ServerProfile, 'id'>): Promise<ServerProfile>
  updateProfile(id: string, data: Partial<ServerProfile>): Promise<ServerProfile | undefined>
  deleteProfile(id: string): Promise<boolean>
  getDefaultProfile(): Promise<ServerProfile | undefined>
  setDefaultProfile(id: string): Promise<ServerProfile | undefined>
  duplicateProfile(id: string): Promise<ServerProfile | undefined>
}

export const profileStorage: ProfileStorageAdapter = {
  async loadProfiles(): Promise<ServerProfile[]> {
    const { value } = await Preferences.get({ key: PROFILES_KEY })
    if (!value) return []
    try {
      return JSON.parse(value) as ServerProfile[]
    } catch {
      return []
    }
  },

  async saveProfiles(profiles: ServerProfile[]): Promise<void> {
    await Preferences.set({ key: PROFILES_KEY, value: JSON.stringify(profiles) })
  },

  async getProfile(id: string): Promise<ServerProfile | undefined> {
    const profiles = await this.loadProfiles()
    return profiles.find((p) => p.id === id)
  },

  async createProfile(data: Omit<ServerProfile, 'id'>): Promise<ServerProfile> {
    const profiles = await this.loadProfiles()
    const profile: ServerProfile = { ...data, id: generateId() }
    if (profile.isDefault) {
      profiles.forEach((p) => { p.isDefault = false })
    }
    profiles.push(profile)
    await this.saveProfiles(profiles)
    return profile
  },

  async updateProfile(id: string, data: Partial<ServerProfile>): Promise<ServerProfile | undefined> {
    const profiles = await this.loadProfiles()
    const index = profiles.findIndex((p) => p.id === id)
    if (index === -1) return undefined
    if (data.isDefault) {
      profiles.forEach((p) => { p.isDefault = false })
    }
    profiles[index] = { ...profiles[index], ...data }
    await this.saveProfiles(profiles)
    return profiles[index]
  },

  async deleteProfile(id: string): Promise<boolean> {
    const profiles = await this.loadProfiles()
    const index = profiles.findIndex((p) => p.id === id)
    if (index === -1) return false
    profiles.splice(index, 1)
    await this.saveProfiles(profiles)
    return true
  },

  async getDefaultProfile(): Promise<ServerProfile | undefined> {
    const profiles = await this.loadProfiles()
    return profiles.find((p) => p.isDefault)
  },

  async setDefaultProfile(id: string): Promise<ServerProfile | undefined> {
    return this.updateProfile(id, { isDefault: true })
  },

  async duplicateProfile(id: string): Promise<ServerProfile | undefined> {
    const profiles = await this.loadProfiles()
    const original = profiles.find((p) => p.id === id)
    if (!original) return undefined
    const duplicate: ServerProfile = {
      ...original,
      id: generateId(),
      name: `${original.name} (copy)`,
      isDefault: false,
      lastStatus: 'unknown',
      lastConnectedAt: null,
    }
    profiles.push(duplicate)
    await this.saveProfiles(profiles)
    return duplicate
  },
}
