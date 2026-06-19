import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: vi.fn(() => true),
    getPlatform: vi.fn(() => 'ios'),
  },
}))

vi.mock('@capacitor/preferences', () => ({
  Preferences: {
    get: vi.fn(),
    set: vi.fn(),
  },
}))

vi.mock('@capacitor/local-notifications', () => ({
  LocalNotifications: {
    checkPermissions: vi.fn(),
    requestPermissions: vi.fn(),
    createChannel: vi.fn(),
    schedule: vi.fn(),
  },
}))

import { Preferences } from '@capacitor/preferences'
import { LocalNotifications } from '@capacitor/local-notifications'
import {
  WEB_NOTIFICATION_MESSAGE_TYPE,
  approveNativeNotificationsFromPrompt,
  denyNativeNotificationsFromPrompt,
  disableNativeNotificationsFromSettings,
  emitNativeNotificationFromWebMessage,
  enableNativeNotificationsFromSettings,
  getNativeNotificationDecision,
  loadNativeNotificationSettings,
} from '@/services/platform/nativeNotifications'

function storedSettings() {
  const call = vi.mocked(Preferences.set).mock.calls.at(-1)
  return call ? JSON.parse(call[0].value) : null
}

describe('native notification settings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(Preferences.get).mockResolvedValue({ value: null })
    vi.mocked(LocalNotifications.checkPermissions).mockResolvedValue({ display: 'granted' })
    vi.mocked(LocalNotifications.requestPermissions).mockResolvedValue({ display: 'granted' })
  })

  it('asks on first web notification when nothing has been configured', async () => {
    await expect(getNativeNotificationDecision()).resolves.toBe('ask')
  })

  it('honors a disabled settings switch without asking again', async () => {
    await disableNativeNotificationsFromSettings()

    vi.mocked(Preferences.get).mockResolvedValue({ value: JSON.stringify(storedSettings()) })
    await expect(getNativeNotificationDecision()).resolves.toBe('ignore')
  })

  it('requests system permission when enabled from settings', async () => {
    await expect(enableNativeNotificationsFromSettings()).resolves.toBe(true)

    expect(LocalNotifications.requestPermissions).toHaveBeenCalledTimes(0)
    expect(storedSettings()).toMatchObject({
      enabled: true,
      settingsConfigured: true,
    })
  })

  it('stores an explicit prompt denial', async () => {
    await denyNativeNotificationsFromPrompt()

    expect(storedSettings()).toMatchObject({
      enabled: false,
      customPromptAnswered: true,
    })
  })

  it('stores prompt approval after requesting system permission', async () => {
    vi.mocked(LocalNotifications.checkPermissions).mockResolvedValue({ display: 'prompt' })

    await expect(approveNativeNotificationsFromPrompt()).resolves.toBe(true)

    expect(LocalNotifications.requestPermissions).toHaveBeenCalledTimes(1)
    expect(storedSettings()).toMatchObject({
      enabled: true,
      customPromptAnswered: true,
    })
  })

  it('loads defaults when settings are absent or invalid', async () => {
    await expect(loadNativeNotificationSettings()).resolves.toMatchObject({
      enabled: false,
      settingsConfigured: false,
      customPromptAnswered: false,
    })

    vi.mocked(Preferences.get).mockResolvedValue({ value: 'nope' })
    await expect(loadNativeNotificationSettings()).resolves.toMatchObject({
      enabled: false,
      settingsConfigured: false,
      customPromptAnswered: false,
    })
  })

  it('emits a local notification without triggering a new system prompt', async () => {
    await emitNativeNotificationFromWebMessage({
      type: WEB_NOTIFICATION_MESSAGE_TYPE,
      title: 'Approval needed',
      body: 'Review the shell command.',
    })

    expect(LocalNotifications.requestPermissions).not.toHaveBeenCalled()
    expect(LocalNotifications.schedule).toHaveBeenCalledWith({
      notifications: [expect.objectContaining({
        title: 'Approval needed',
        body: 'Review the shell command.',
      })],
    })
  })

  it('does not emit when native permission has been revoked', async () => {
    vi.mocked(LocalNotifications.checkPermissions).mockResolvedValue({ display: 'denied' })

    await emitNativeNotificationFromWebMessage({
      type: WEB_NOTIFICATION_MESSAGE_TYPE,
      title: 'Done',
    })

    expect(LocalNotifications.schedule).not.toHaveBeenCalled()
  })
})
