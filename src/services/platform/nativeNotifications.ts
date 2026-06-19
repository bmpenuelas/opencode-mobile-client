import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import { Preferences } from '@capacitor/preferences'

export const WEB_NOTIFICATION_MESSAGE_TYPE = 'opencode:web-notification'

type WebNotificationDetail = {
  type?: unknown
  title?: unknown
  body?: unknown
  tag?: unknown
  icon?: unknown
  silent?: unknown
}

const CHANNEL_ID = 'opencode-web-notifications'
const MAX_ANDROID_NOTIFICATION_ID = 2147483647
const SETTINGS_KEY = 'opencode_native_notifications'

let channelCreated = false
let nextNotificationId = Math.max(1, Date.now() % MAX_ANDROID_NOTIFICATION_ID)

export type NotificationDecision = 'emit' | 'ignore' | 'ask'

export type NativeNotificationSettings = {
  enabled: boolean
  settingsConfigured: boolean
  customPromptAnswered: boolean
}

const DEFAULT_SETTINGS: NativeNotificationSettings = {
  enabled: false,
  settingsConfigured: false,
  customPromptAnswered: false,
}

function asRecord(value: unknown): WebNotificationDetail | null {
  return value && typeof value === 'object' ? value as WebNotificationDetail : null
}

function cleanText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

async function ensureNotificationChannel(): Promise<void> {
  if (channelCreated || Capacitor.getPlatform() !== 'android') return

  await LocalNotifications.createChannel({
    id: CHANNEL_ID,
    name: 'OpenCode web notifications',
    description: 'Notifications emitted by the connected OpenCode web UI.',
    importance: 4,
    visibility: 0,
    vibration: true,
  })
  channelCreated = true
}

async function saveNotificationSettings(settings: NativeNotificationSettings): Promise<void> {
  await Preferences.set({ key: SETTINGS_KEY, value: JSON.stringify(settings) })
}

async function requestNotificationPermission(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false

  const current = await LocalNotifications.checkPermissions()
  const result = current.display === 'granted'
    ? current
    : await LocalNotifications.requestPermissions()

  const granted = result.display === 'granted'
  if (granted) await ensureNotificationChannel()
  return granted
}

async function hasNotificationPermission(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false
  const current = await LocalNotifications.checkPermissions()
  const granted = current.display === 'granted'
  if (granted) await ensureNotificationChannel()
  return granted
}

function getNextNotificationId(): number {
  nextNotificationId = (nextNotificationId % MAX_ANDROID_NOTIFICATION_ID) + 1
  return nextNotificationId
}

export async function loadNativeNotificationSettings(): Promise<NativeNotificationSettings> {
  const { value } = await Preferences.get({ key: SETTINGS_KEY })
  if (!value) return { ...DEFAULT_SETTINGS }

  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(value) }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export async function enableNativeNotificationsFromSettings(): Promise<boolean> {
  const granted = await requestNotificationPermission()
  await saveNotificationSettings({
    ...(await loadNativeNotificationSettings()),
    enabled: granted,
    settingsConfigured: true,
  })
  return granted
}

export async function disableNativeNotificationsFromSettings(): Promise<void> {
  await saveNotificationSettings({
    ...(await loadNativeNotificationSettings()),
    enabled: false,
    settingsConfigured: true,
  })
}

export async function approveNativeNotificationsFromPrompt(): Promise<boolean> {
  const granted = await requestNotificationPermission()
  await saveNotificationSettings({
    ...(await loadNativeNotificationSettings()),
    enabled: granted,
    customPromptAnswered: true,
  })
  return granted
}

export async function denyNativeNotificationsFromPrompt(): Promise<void> {
  await saveNotificationSettings({
    ...(await loadNativeNotificationSettings()),
    enabled: false,
    customPromptAnswered: true,
  })
}

export async function getNativeNotificationDecision(): Promise<NotificationDecision> {
  const settings = await loadNativeNotificationSettings()
  if (settings.enabled) return 'emit'
  if (settings.settingsConfigured || settings.customPromptAnswered) return 'ignore'
  return 'ask'
}

export async function emitNativeNotificationFromWebMessage(
  detail: unknown,
  fallbackTitle = 'OpenCode',
): Promise<void> {
  const message = asRecord(detail)
  if (!message || message.type !== WEB_NOTIFICATION_MESSAGE_TYPE) return

  const title = cleanText(message.title) || fallbackTitle || 'OpenCode'
  const body = cleanText(message.body)
  if (!title && !body) return
  if (!(await hasNotificationPermission())) return

  const tag = cleanText(message.tag)
  const icon = cleanText(message.icon)

  await LocalNotifications.schedule({
    notifications: [{
      id: getNextNotificationId(),
      title,
      body,
      largeBody: body || undefined,
      channelId: CHANNEL_ID,
      extra: {
        source: 'opencode-webview',
        tag: tag || undefined,
        icon: icon || undefined,
        silent: Boolean(message.silent),
      },
    }],
  })
}
