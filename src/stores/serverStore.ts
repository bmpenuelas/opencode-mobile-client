import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ServerProfile } from '@/types'
import { profileStorage } from '@/services/storage/profileStorage'
import { getSecretStorage } from '@/services/storage'
import { checkServerHealth } from '@/services/opencode/health'

export const useServerStore = defineStore('server', () => {
  const profiles = ref<ServerProfile[]>([])
  const loading = ref(false)
  const reachable = ref<Record<string, boolean>>({})

  const defaultProfile = computed(() => profiles.value.find((p: ServerProfile) => p.isDefault) ?? null)

  const sortedProfiles = computed(() =>
    [...profiles.value].sort((a: ServerProfile, b: ServerProfile) => {
      if (a.isDefault) return -1
      if (b.isDefault) return 1
      return a.name.localeCompare(b.name)
    })
  )

  async function load(): Promise<void> {
    loading.value = true
    try {
      profiles.value = await profileStorage.loadProfiles()
    } finally {
      loading.value = false
    }
  }

  async function save(): Promise<void> {
    await profileStorage.saveProfiles(profiles.value)
  }

  async function add(data: Omit<ServerProfile, 'id'>): Promise<ServerProfile> {
    const profile = await profileStorage.createProfile(data)
    profiles.value.push(profile)
    return profile
  }

  async function update(id: string, data: Partial<ServerProfile>): Promise<ServerProfile | undefined> {
    const updated = await profileStorage.updateProfile(id, data)
    if (updated) {
      const index = profiles.value.findIndex((p: ServerProfile) => p.id === id)
      if (index !== -1) {
        profiles.value[index] = updated
      }
    }
    return updated
  }

  async function remove(id: string): Promise<boolean> {
    const secretStorage = getSecretStorage()
    await secretStorage.deletePassword(id)
    const result = await profileStorage.deleteProfile(id)
    if (result) {
      const index = profiles.value.findIndex((p: ServerProfile) => p.id === id)
      if (index !== -1) {
        profiles.value.splice(index, 1)
      }
      delete reachable.value[id]
    }
    return result
  }

  async function duplicate(id: string): Promise<ServerProfile | undefined> {
    const dup = await profileStorage.duplicateProfile(id)
    if (dup) {
      profiles.value.push(dup)
    }
    return dup
  }

  async function setDefault(id: string): Promise<ServerProfile | undefined> {
    const updated = await profileStorage.setDefaultProfile(id)
    if (updated) {
      profiles.value.forEach((p: ServerProfile) => { p.isDefault = false })
      const index = profiles.value.findIndex((p: ServerProfile) => p.id === id)
      if (index !== -1) {
        profiles.value[index].isDefault = true
      }
    }
    return updated
  }

  async function getPassword(profileId: string): Promise<string | null> {
    const secretStorage = getSecretStorage()
    return secretStorage.getPassword(profileId)
  }

  async function setPassword(profileId: string, password: string): Promise<void> {
    const secretStorage = getSecretStorage()
    await secretStorage.setPassword(profileId, password)
  }

  async function deletePassword(profileId: string): Promise<void> {
    const secretStorage = getSecretStorage()
    await secretStorage.deletePassword(profileId)
  }

  async function checkAllServers(): Promise<void> {
    const healthResults = await Promise.allSettled(
      profiles.value.map(async (profile) => {
        const password = profile.authEnabled ? await getPassword(profile.id) : null
        return checkServerHealth({
          baseUrl: profile.baseUrl,
          username: profile.authEnabled ? profile.username : undefined,
          password: profile.authEnabled && password ? password : undefined,
          timeoutMs: 3500,
        })
      })
    )

    let changed = false
    for (let i = 0; i < healthResults.length; i++) {
      const profile = profiles.value[i]
      if (!profile) continue

      const result = healthResults[i]
      if (result.status === 'fulfilled') {
        const r = result.value.reachable
        if (reachable.value[profile.id] !== r) {
          reachable.value[profile.id] = r
          changed = true
        }
        const status = result.value.status
        if (profile.lastStatus !== status) {
          profile.lastStatus = status
          changed = true
        }
      } else if (reachable.value[profile.id] !== false) {
        reachable.value[profile.id] = false
        if (profile.lastStatus !== 'unreachable') {
          profile.lastStatus = 'unreachable'
          changed = true
        }
      }
    }

    if (changed) {
      await profileStorage.saveProfiles(profiles.value)
    }
  }

  return {
    profiles,
    loading,
    defaultProfile,
    sortedProfiles,
    reachable,
    load,
    save,
    add,
    update,
    remove,
    duplicate,
    setDefault,
    getPassword,
    setPassword,
    deletePassword,
    checkAllServers,
  }
})
