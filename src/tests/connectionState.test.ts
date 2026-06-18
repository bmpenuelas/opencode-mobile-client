import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useConnectionStore } from '@/stores/connectionStore'
import { useServerStore } from '@/stores/serverStore'
import * as healthModule from '@/services/opencode/health'

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
      autoConnect: false,
      allowInsecureHttp: true,
      lastStatus: 'unknown',
      lastConnectedAt: null,
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
      autoConnect: false,
      allowInsecureHttp: true,
      lastStatus: 'unknown',
      lastConnectedAt: null,
    })

    const store = useConnectionStore()
    const result = await store.connect(profile.id)

    expect(result).toBe(false)
    expect(store.state).toBe('unreachable')
    expect(store.lastError).toBeDefined()
  })

  it('transitions to wrong_credentials on 401 with auth', async () => {
    vi.spyOn(healthModule, 'checkServerHealth').mockResolvedValue({
      reachable: false,
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
      autoConnect: false,
      allowInsecureHttp: true,
      lastStatus: 'unknown',
      lastConnectedAt: null,
    })

    await serverStore.setPassword(profile.id, 'wrong-password')

    const store = useConnectionStore()
    const result = await store.connect(profile.id)

    expect(result).toBe(false)
    expect(store.state).toBe('wrong_credentials')
  })

  it('transitions to auth_required on 401 without stored credentials', async () => {
    vi.spyOn(healthModule, 'checkServerHealth').mockResolvedValue({
      reachable: false,
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
      autoConnect: false,
      allowInsecureHttp: true,
      lastStatus: 'unknown',
      lastConnectedAt: null,
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
})
