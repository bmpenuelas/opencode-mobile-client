import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ConnectionState, ServerProfile } from '@/types'
import { checkServerHealth } from '@/services/opencode/health'
import { useServerStore } from './serverStore'

const DEFAULT_TIMEOUT = 3500
const DEFAULT_POLL_INTERVAL = 10000

const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 15000, 30000]

export const useConnectionStore = defineStore('connection', () => {
  const state = ref<ConnectionState>('idle')
  const activeServerId = ref<string | null>(null)
  const reconnectAttempt = ref(0)
  const lastError = ref<string | null>(null)
  const healthCheckTimeout = ref(DEFAULT_TIMEOUT)
  const healthPollInterval = ref(DEFAULT_POLL_INTERVAL)
  const exponentialReconnectEnabled = ref(true)
  const iframeLoadingFailed = ref(false)
  const lastWebviewServerId = ref<string | null>(null)

  let healthPollTimer: ReturnType<typeof setInterval> | null = null
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  let reconnectCanceled = false

  const activeServer = computed<ServerProfile | null>(() => {
    if (!activeServerId.value) return null
    const serverStore = useServerStore()
    return serverStore.profiles.find((p: ServerProfile) => p.id === activeServerId.value) ?? null
  })

  const isConnected = computed(() => state.value === 'connected')
  const isChecking = computed(() => state.value === 'checking')
  const isReconnecting = computed(() => state.value === 'reconnecting')
  const isDisconnected = computed(() =>
    ['unreachable', 'wrong_credentials', 'frame_blocked', 'disconnected'].includes(state.value)
  )

  function setHealthCheckTimeout(ms: number): void {
    healthCheckTimeout.value = ms
  }

  function setHealthPollInterval(ms: number): void {
    healthPollInterval.value = ms
  }

  function setExponentialReconnect(enabled: boolean): void {
    exponentialReconnectEnabled.value = enabled
  }

  async function connect(serverId: string): Promise<boolean> {
    cleanup()

    const serverStore = useServerStore()
    const profile = serverStore.profiles.find((p: ServerProfile) => p.id === serverId)
    if (!profile) {
      state.value = 'unreachable'
      lastError.value = 'Server profile not found'
      return false
    }

    activeServerId.value = serverId
    state.value = 'checking'
    lastError.value = null
    iframeLoadingFailed.value = false

    const password = await serverStore.getPassword(serverId)

    const result = await checkServerHealth({
      baseUrl: profile.baseUrl,
      username: profile.authEnabled ? profile.username : undefined,
      password: profile.authEnabled && password ? password : undefined,
      timeoutMs: healthCheckTimeout.value,
    })

    state.value = result.status

    if (result.status === 'connected') {
      await serverStore.update(serverId, {
        lastStatus: 'connected',
        lastConnectedAt: new Date().toISOString(),
      })
      startHealthPoll(serverId)
      return true
    }

    if (result.status === 'auth_required') {
      state.value = 'auth_required'
      return false
    }

    if (result.status === 'wrong_credentials') {
      state.value = 'wrong_credentials'
      lastError.value = 'The username or password is incorrect.'
      return false
    }

    state.value = 'unreachable'
    lastError.value = `Server at ${profile.baseUrl} is not reachable.`
    return false
  }

  function startHealthPoll(serverId: string): void {
    stopHealthPoll()
    healthPollTimer = setInterval(async () => {
      const serverStore = useServerStore()
      const profile = serverStore.profiles.find((p: ServerProfile) => p.id === serverId)
      if (!profile) {
        disconnect()
        return
      }

      const password = await serverStore.getPassword(serverId)

      const result = await checkServerHealth({
        baseUrl: profile.baseUrl,
        username: profile.authEnabled ? profile.username : undefined,
        password: profile.authEnabled && password ? password : undefined,
        timeoutMs: healthCheckTimeout.value,
      })

      if (result.status === 'connected') {
        if (state.value !== 'connected') {
          state.value = 'connected'
          reconnectAttempt.value = 0
        }
        return
      }

      if (state.value === 'connected') {
        state.value = 'disconnected'
        startReconnect(serverId)
      }
    }, healthPollInterval.value)
  }

  function stopHealthPoll(): void {
    if (healthPollTimer) {
      clearInterval(healthPollTimer)
      healthPollTimer = null
    }
  }

  function startReconnect(serverId: string): void {
    if (!exponentialReconnectEnabled.value) return
    if (reconnectCanceled) return

    state.value = 'reconnecting'
    const delayIndex = Math.min(reconnectAttempt.value, RECONNECT_DELAYS.length - 1)
    const delay = RECONNECT_DELAYS[delayIndex]

    reconnectTimer = setTimeout(async () => {
      if (reconnectCanceled) return

      reconnectAttempt.value++
      const serverStore = useServerStore()
      const profile = serverStore.profiles.find((p: ServerProfile) => p.id === serverId)
      if (!profile) {
        disconnect()
        return
      }

      const password = await serverStore.getPassword(serverId)

      const result = await checkServerHealth({
        baseUrl: profile.baseUrl,
        username: profile.authEnabled ? profile.username : undefined,
        password: profile.authEnabled && password ? password : undefined,
        timeoutMs: healthCheckTimeout.value,
      })

      if (result.status === 'connected') {
        state.value = 'connected'
        reconnectAttempt.value = 0
        startHealthPoll(serverId)
        return
      }

      if (!reconnectCanceled) {
        startReconnect(serverId)
      }
    }, delay)
  }

  function cancelReconnect(): void {
    reconnectCanceled = true
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
    state.value = 'disconnected'
  }

  function disconnect(): void {
    cleanup()
    state.value = 'disconnected'
    lastError.value = null
    activeServerId.value = null
    iframeLoadingFailed.value = false
  }

  function setFrameBlocked(): void {
    state.value = 'frame_blocked'
    iframeLoadingFailed.value = true
  }

  function cleanup(): void {
    reconnectCanceled = true
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
    stopHealthPoll()
    reconnectAttempt.value = 0
  }

  return {
    state,
    activeServerId,
    activeServer,
    reconnectAttempt,
    lastError,
    healthCheckTimeout,
    healthPollInterval,
    exponentialReconnectEnabled,
    iframeLoadingFailed,
    lastWebviewServerId,
    isConnected,
    isChecking,
    isReconnecting,
    isDisconnected,
    setHealthCheckTimeout,
    setHealthPollInterval,
    setExponentialReconnect,
    connect,
    disconnect,
    cancelReconnect,
    setFrameBlocked,
    cleanup,
  }
})
