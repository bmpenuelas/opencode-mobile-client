import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useConnectionStore } from '@/stores/connectionStore'
import { useServerStore } from '@/stores/serverStore'
import * as healthModule from '@/services/opencode/health'
import * as pairingModule from '@/services/opencode/pairing'

vi.mock('@capacitor/preferences', () => ({
  Preferences: {
    get: vi.fn().mockResolvedValue({ value: '[]' }),
    set: vi.fn(),
  },
}))

vi.mock('@aparajita/capacitor-secure-storage', () => ({
  SecureStorage: {
    getString: vi.fn().mockResolvedValue({ value: null }),
    setString: vi.fn(),
    remove: vi.fn(),
  },
}))

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: () => false,
  },
}))

describe('connectionStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('starts in idle state', () => {
    const store = useConnectionStore()
    expect(store.state).toBe('idle')
    expect(store.activeServerId).toBeNull()
    expect(store.isConnected).toBe(false)
    expect(store.isChecking).toBe(false)
  })

  it('transitions to checking and then to connected on success', async () => {
    vi.spyOn(healthModule, 'checkServerHealth').mockResolvedValue({
      reachable: true,
      status: 'connected',
      statusCode: 200,
    })

    const serverStore = useServerStore()
    const profile = await serverStore.add({
      name: 'Test',
      baseUrl: 'http://192.168.1.100:4096',
      authEnabled: false,
      username: 'opencode',
      isDefault: false,
      allowInsecureHttp: true,
      lastStatus: 'unknown',
      lastConnectedAt: null,
      serverVersion: 'v1',
      paired: false,
    })

    const store = useConnectionStore()
    const result = await store.connect(profile.id)

    expect(result).toBe(true)
    expect(store.state).toBe('connected')
    expect(store.activeServerId).toBe(profile.id)
  })

  it('transitions to unreachable on network error', async () => {
    vi.spyOn(healthModule, 'checkServerHealth').mockResolvedValue({
      reachable: false,
      status: 'unreachable',
    })

    const serverStore = useServerStore()
    const profile = await serverStore.add({
      name: 'Test',
      baseUrl: 'http://192.168.1.100:4096',
      authEnabled: false,
      username: 'opencode',
      isDefault: false,
      allowInsecureHttp: true,
      lastStatus: 'unknown',
      lastConnectedAt: null,
      serverVersion: 'v1',
      paired: false,
    })

    const store = useConnectionStore()
    const result = await store.connect(profile.id)

    expect(result).toBe(false)
    expect(store.state).toBe('unreachable')
    expect(store.lastError).toBeDefined()
  })

  it('transitions to wrong_credentials on 401 with auth', async () => {
    vi.spyOn(healthModule, 'checkServerHealth').mockResolvedValue({
      reachable: true,
      status: 'wrong_credentials',
      statusCode: 401,
    })

    const serverStore = useServerStore()
    const profile = await serverStore.add({
      name: 'Test',
      baseUrl: 'http://192.168.1.100:4096',
      authEnabled: true,
      username: 'opencode',
      isDefault: false,
      allowInsecureHttp: true,
      lastStatus: 'unknown',
      lastConnectedAt: null,
      serverVersion: 'v1',
      paired: false,
    })

    await serverStore.setPassword(profile.id, 'wrong-password')

    const store = useConnectionStore()
    const result = await store.connect(profile.id)

    expect(result).toBe(false)
    expect(store.state).toBe('wrong_credentials')
  })

  it('transitions to auth_required on 401 without stored credentials', async () => {
    vi.spyOn(healthModule, 'checkServerHealth').mockResolvedValue({
      reachable: true,
      status: 'auth_required',
      statusCode: 401,
    })

    const serverStore = useServerStore()
    const profile = await serverStore.add({
      name: 'Test',
      baseUrl: 'http://192.168.1.100:4096',
      authEnabled: true,
      username: 'opencode',
      isDefault: false,
      allowInsecureHttp: true,
      lastStatus: 'unknown',
      lastConnectedAt: null,
      serverVersion: 'v1',
      paired: false,
    })

    const store = useConnectionStore()
    const result = await store.connect(profile.id)

    expect(result).toBe(false)
    expect(store.state).toBe('auth_required')
  })

  it('disconnect resets state', () => {
    const store = useConnectionStore()
    store.disconnect()
    expect(store.state).toBe('disconnected')
    expect(store.activeServerId).toBeNull()
    expect(store.lastError).toBeNull()
  })

  it('setFrameBlocked updates state', () => {
    const store = useConnectionStore()
    store.setFrameBlocked()
    expect(store.state).toBe('frame_blocked')
    expect(store.iframeLoadingFailed).toBe(true)
  })

  it('cancelReconnect stops reconnection', () => {
    const store = useConnectionStore()
    store.cancelReconnect()
    expect(store.state).toBe('disconnected')
  })

  describe('with a v2 server', () => {
    const DAY_S = 24 * 60 * 60

    async function addPairedServer(paired = true) {
      const serverStore = useServerStore()
      const profile = await serverStore.add({
        name: 'V2 Server',
        baseUrl: 'http://192.168.1.100:49374',
        authEnabled: true,
        username: 'opencode',
        isDefault: false,
        allowInsecureHttp: true,
        lastStatus: 'unknown',
        lastConnectedAt: null,
        serverVersion: 'v2',
        paired,
      })
      return { serverStore, profile }
    }

    function tokenExpiringInDays(days: number): string {
      return `${Math.floor(Date.now() / 1000) + days * DAY_S}.signature`
    }

    function mockHealth(status: 'connected' | 'wrong_credentials' | 'incompatible') {
      return vi.spyOn(healthModule, 'checkServerHealth').mockResolvedValue({ reachable: true, status })
    }

    it('checks the server as v2', async () => {
      const health = mockHealth('connected')
      const { serverStore, profile } = await addPairedServer()
      vi.spyOn(serverStore, 'getPassword').mockResolvedValue(tokenExpiringInDays(30))

      const store = useConnectionStore()
      await store.connect(profile.id)
      store.disconnect()

      expect(health).toHaveBeenCalledWith(expect.objectContaining({ serverVersion: 'v2' }))
    })

    it('renews a session close to expiring and stores the new token', async () => {
      mockHealth('connected')
      const renew = vi.spyOn(pairingModule, 'renewSession').mockResolvedValue('renewed.token')
      const { serverStore, profile } = await addPairedServer()
      vi.spyOn(serverStore, 'getPassword').mockResolvedValue(tokenExpiringInDays(5))
      const setPassword = vi.spyOn(serverStore, 'setPassword').mockResolvedValue()

      const store = useConnectionStore()
      expect(await store.connect(profile.id)).toBe(true)
      store.disconnect()

      expect(renew).toHaveBeenCalled()
      expect(setPassword).toHaveBeenCalledWith(profile.id, 'renewed.token')
    })

    it('still connects when renewal fails, keeping the old token', async () => {
      mockHealth('connected')
      vi.spyOn(pairingModule, 'renewSession').mockResolvedValue(null)
      const { serverStore, profile } = await addPairedServer()
      vi.spyOn(serverStore, 'getPassword').mockResolvedValue(tokenExpiringInDays(5))
      const setPassword = vi.spyOn(serverStore, 'setPassword').mockResolvedValue()

      const store = useConnectionStore()
      expect(await store.connect(profile.id)).toBe(true)
      store.disconnect()

      expect(setPassword).not.toHaveBeenCalled()
    })

    it('leaves a typed password alone, even if it looks like a token', async () => {
      mockHealth('connected')
      const renew = vi.spyOn(pairingModule, 'renewSession').mockResolvedValue('renewed.token')
      const { serverStore, profile } = await addPairedServer(false)
      vi.spyOn(serverStore, 'getPassword').mockResolvedValue(tokenExpiringInDays(5))

      const store = useConnectionStore()
      await store.connect(profile.id)
      store.disconnect()

      expect(renew).not.toHaveBeenCalled()
    })

    it('tells the user to pair again when a session is no longer accepted', async () => {
      mockHealth('wrong_credentials')
      const { serverStore, profile } = await addPairedServer()
      vi.spyOn(serverStore, 'getPassword').mockResolvedValue('expired.token')

      const store = useConnectionStore()
      expect(await store.connect(profile.id)).toBe(false)

      expect(store.state).toBe('wrong_credentials')
      expect(store.lastError).toContain('opencode pair')
    })

    it('points at the v1 option when the server is not v2', async () => {
      mockHealth('incompatible')
      const { serverStore, profile } = await addPairedServer()
      vi.spyOn(serverStore, 'getPassword').mockResolvedValue(null)

      const store = useConnectionStore()
      expect(await store.connect(profile.id)).toBe(false)

      expect(store.state).toBe('incompatible')
      expect(store.isDisconnected).toBe(true)
      expect(store.lastError).toContain('OpenCode v1 server')
    })
  })
})
