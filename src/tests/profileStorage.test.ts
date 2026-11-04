import { describe, it, expect, beforeEach, vi } from 'vitest'
import { profileStorage } from '@/services/storage/profileStorage'

vi.mock('@capacitor/preferences', () => ({
  Preferences: {
    get: vi.fn(),
    set: vi.fn(),
  },
}))

import { Preferences } from '@capacitor/preferences'

function createProfile(overrides: Record<string, any> = {}) {
  return {
    id: overrides.id ?? 'test-1',
    name: overrides.name ?? 'Test Server',
    baseUrl: 'http://192.168.1.100:4096',
    authEnabled: false,
    username: 'opencode',
    isDefault: false,
    allowInsecureHttp: true,
    lastStatus: 'unknown' as const,
    lastConnectedAt: null,
    serverVersion: 'v2' as const,
    paired: false,
    ...overrides,
  }
}

describe('profileStorage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('loadProfiles', () => {
    it('returns empty array when no profiles stored', async () => {
      vi.mocked(Preferences.get).mockResolvedValue({ value: null })
      const profiles = await profileStorage.loadProfiles()
      expect(profiles).toEqual([])
    })

    it('parses stored JSON profiles', async () => {
      const data = [createProfile(), createProfile({ id: 'test-2', name: 'Server 2' })]
      vi.mocked(Preferences.get).mockResolvedValue({ value: JSON.stringify(data) })
      const profiles = await profileStorage.loadProfiles()
      expect(profiles).toHaveLength(2)
      expect(profiles[0].name).toBe('Test Server')
      expect(profiles[1].name).toBe('Server 2')
    })

    it('treats profiles saved before v2 support as v1', async () => {
      const { serverVersion: _version, paired: _paired, ...legacy } = createProfile()
      vi.mocked(Preferences.get).mockResolvedValue({ value: JSON.stringify([legacy]) })
      const [profile] = await profileStorage.loadProfiles()
      expect(profile.serverVersion).toBe('v1')
      expect(profile.paired).toBe(false)
    })

    it('keeps the version of newer profiles', async () => {
      const stored = createProfile({ paired: true })
      vi.mocked(Preferences.get).mockResolvedValue({ value: JSON.stringify([stored]) })
      const [profile] = await profileStorage.loadProfiles()
      expect(profile.serverVersion).toBe('v2')
      expect(profile.paired).toBe(true)
    })

    it('returns empty array on parse error', async () => {
      vi.mocked(Preferences.get).mockResolvedValue({ value: 'invalid-json' })
      const profiles = await profileStorage.loadProfiles()
      expect(profiles).toEqual([])
    })
  })

  describe('createProfile', () => {
    it('creates a profile with generated id', async () => {
      vi.mocked(Preferences.get).mockResolvedValue({ value: '[]' })
      const profile = await profileStorage.createProfile(createProfile({ id: undefined }))
      expect(profile.id).toBeDefined()
      expect(profile.id).not.toBe('test-1')
      expect(profile.name).toBe('Test Server')
    })

    it('sets default and unsets others', async () => {
      const existing = [createProfile({ id: 'default-1', isDefault: true })]
      vi.mocked(Preferences.get).mockResolvedValue({ value: JSON.stringify(existing) })
      const profile = await profileStorage.createProfile(createProfile({ id: undefined, isDefault: true }))
      expect(profile.isDefault).toBe(true)

      const savedJson = vi.mocked(Preferences.set).mock.calls[0][0].value
      const saved = JSON.parse(savedJson)
      expect(saved.find((p: any) => p.id === 'default-1').isDefault).toBe(false)
      expect(saved.find((p: any) => p.id === profile.id).isDefault).toBe(true)
    })
  })

  describe('updateProfile', () => {
    it('updates profile fields', async () => {
      const existing = [createProfile()]
      vi.mocked(Preferences.get).mockResolvedValue({ value: JSON.stringify(existing) })
      const updated = await profileStorage.updateProfile('test-1', { name: 'Updated Name' })
      expect(updated?.name).toBe('Updated Name')
    })

    it('returns undefined for non-existent id', async () => {
      vi.mocked(Preferences.get).mockResolvedValue({ value: '[]' })
      const updated = await profileStorage.updateProfile('non-existent', { name: 'Test' })
      expect(updated).toBeUndefined()
    })
  })

  describe('deleteProfile', () => {
    it('deletes existing profile', async () => {
      const existing = [createProfile(), createProfile({ id: 'other' })]
      vi.mocked(Preferences.get).mockResolvedValue({ value: JSON.stringify(existing) })
      const result = await profileStorage.deleteProfile('test-1')
      expect(result).toBe(true)

      const savedJson = vi.mocked(Preferences.set).mock.calls[0][0].value
      const saved = JSON.parse(savedJson)
      expect(saved).toHaveLength(1)
      expect(saved[0].id).toBe('other')
    })

    it('returns false for non-existent', async () => {
      vi.mocked(Preferences.get).mockResolvedValue({ value: '[]' })
      const result = await profileStorage.deleteProfile('non-existent')
      expect(result).toBe(false)
    })
  })

  describe('getDefaultProfile', () => {
    it('finds the default profile', async () => {
      const existing = [
        createProfile({ id: 'a', isDefault: false }),
        createProfile({ id: 'b', isDefault: true }),
      ]
      vi.mocked(Preferences.get).mockResolvedValue({ value: JSON.stringify(existing) })
      const defaultProfile = await profileStorage.getDefaultProfile()
      expect(defaultProfile?.id).toBe('b')
    })

    it('returns undefined when no default', async () => {
      const existing = [createProfile({ id: 'a', isDefault: false })]
      vi.mocked(Preferences.get).mockResolvedValue({ value: JSON.stringify(existing) })
      const defaultProfile = await profileStorage.getDefaultProfile()
      expect(defaultProfile).toBeUndefined()
    })
  })

  describe('setDefaultProfile', () => {
    it('sets profile as default and unsets others', async () => {
      const existing = [
        createProfile({ id: 'a', isDefault: false }),
        createProfile({ id: 'b', isDefault: true }),
      ]
      vi.mocked(Preferences.get).mockResolvedValue({ value: JSON.stringify(existing) })
      const updated = await profileStorage.setDefaultProfile('a')
      expect(updated?.id).toBe('a')
      expect(updated?.isDefault).toBe(true)

      const savedJson = vi.mocked(Preferences.set).mock.calls[0][0].value
      const saved = JSON.parse(savedJson)
      expect(saved.find((p: any) => p.id === 'a').isDefault).toBe(true)
      expect(saved.find((p: any) => p.id === 'b').isDefault).toBe(false)
    })
  })

  describe('duplicateProfile', () => {
    it('duplicates a profile with (copy) suffix', async () => {
      const existing = [createProfile({ id: 'original', name: 'My Server' })]
      vi.mocked(Preferences.get).mockResolvedValue({ value: JSON.stringify(existing) })
      const dup = await profileStorage.duplicateProfile('original')
      expect(dup?.id).not.toBe('original')
      expect(dup?.name).toBe('My Server (copy)')
      expect(dup?.isDefault).toBe(false)
      expect(dup?.lastStatus).toBe('unknown')
    })

    it('returns undefined for non-existent original', async () => {
      vi.mocked(Preferences.get).mockResolvedValue({ value: '[]' })
      const dup = await profileStorage.duplicateProfile('non-existent')
      expect(dup).toBeUndefined()
    })
  })
})
