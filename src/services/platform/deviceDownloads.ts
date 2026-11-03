import { Capacitor } from '@capacitor/core'
import { Directory, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { DEVICE_DOWNLOAD_MESSAGE_TYPE } from './webviewFixes'

/**
 * Message type used by the injected download bridge to hand a file to the host.
 *
 * The bridge reads the bytes in the WebView (where the file already lives) and
 * streams them to the host, so the host can save the real file and let the user
 * choose where it goes. This bypasses the InAppBrowser download handler, which
 * "previews" text types inside the WebView instead of saving them.
 */
export { DEVICE_DOWNLOAD_MESSAGE_TYPE }

export type DeviceDownloadMessage =
  | {
      type: typeof DEVICE_DOWNLOAD_MESSAGE_TYPE
      phase: 'start'
      id: string
      fileName: string
      mimeType?: string
      size?: number
    }
  | { type: typeof DEVICE_DOWNLOAD_MESSAGE_TYPE; phase: 'chunk'; id: string; base64: string }
  | { type: typeof DEVICE_DOWNLOAD_MESSAGE_TYPE; phase: 'finish'; id: string }
  | { type: typeof DEVICE_DOWNLOAD_MESSAGE_TYPE; phase: 'error'; id: string; message?: string }

export type DeviceDownloadResult = {
  fileName: string
  /** Whether the native share sheet was shown (the user picks where to save). */
  shared: boolean
}

type PendingDownload = {
  fileName: string
  mimeType: string
  chunks: string[]
  size: number
}

const pending = new Map<string, PendingDownload>()

const DEFAULT_FILE_NAME = 'download'

function asString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

/** Keeps a filename usable inside the app cache while preserving its extension. */
export function sanitizeDownloadFileName(value: unknown): string {
  const name = asString(value)
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_')
    .replace(/^\.+/, '')
    .trim()
  return name || DEFAULT_FILE_NAME
}

/**
 * Reads a download message from a `messageFromWebview` payload.
 *
 * Returns `null` for anything that is not a well-formed bridge message, so the
 * host never acts on unrelated events.
 */
export function parseDeviceDownloadMessage(detail: unknown): DeviceDownloadMessage | null {
  if (!detail || typeof detail !== 'object') return null

  const record = detail as Record<string, unknown>
  if (record.type !== DEVICE_DOWNLOAD_MESSAGE_TYPE) return null

  const id = asString(record.id)
  if (!id) return null

  switch (record.phase) {
    case 'start': {
      const fileName = asString(record.fileName)
      if (!fileName) return null
      const message: Extract<DeviceDownloadMessage, { phase: 'start' }> = {
        type: DEVICE_DOWNLOAD_MESSAGE_TYPE,
        phase: 'start',
        id,
        fileName,
      }
      if (typeof record.mimeType === 'string') message.mimeType = record.mimeType
      if (typeof record.size === 'number' && Number.isFinite(record.size)) message.size = record.size
      return message
    }
    case 'chunk': {
      const base64 = asString(record.base64)
      if (!base64) return null
      return { type: DEVICE_DOWNLOAD_MESSAGE_TYPE, phase: 'chunk', id, base64 }
    }
    case 'finish':
      return { type: DEVICE_DOWNLOAD_MESSAGE_TYPE, phase: 'finish', id }
    case 'error': {
      const message: Extract<DeviceDownloadMessage, { phase: 'error' }> = { type: DEVICE_DOWNLOAD_MESSAGE_TYPE, phase: 'error', id }
      if (typeof record.message === 'string') message.message = record.message
      return message
    }
    default:
      return null
  }
}

/** Drops any half-received download, e.g. when the session closes. */
export function resetDeviceDownloads(): void {
  pending.clear()
}

/**
 * Applies one bridge message. `start`/`chunk` return `null`; `finish` returns the
 * saved file, and `error` throws so the caller can surface a failure toast.
 */
export async function handleDeviceDownloadMessage(
  message: DeviceDownloadMessage,
): Promise<DeviceDownloadResult | null> {
  if (message.phase === 'start') {
    pending.set(message.id, {
      fileName: sanitizeDownloadFileName(message.fileName),
      mimeType: message.mimeType ?? '',
      chunks: [],
      size: message.size ?? 0,
    })
    return null
  }

  if (message.phase === 'chunk') {
    pending.get(message.id)?.chunks.push(message.base64)
    return null
  }

  if (message.phase === 'error') {
    pending.delete(message.id)
    throw new Error(message.message || 'download failed')
  }

  const entry = pending.get(message.id)
  pending.delete(message.id)
  if (!entry) return null

  return saveAndShare(entry)
}

async function saveAndShare(entry: PendingDownload): Promise<DeviceDownloadResult> {
  const base64 = entry.chunks.join('')
  const path = `opencode-downloads/${Date.now()}-${entry.fileName}`

  const written = await Filesystem.writeFile({
    path,
    data: base64,
    directory: Directory.Cache,
    recursive: true,
  })

  if (await canShare()) {
    await Share.share({
      title: entry.fileName,
      files: [written.uri],
      dialogTitle: entry.fileName,
    })
    return { fileName: entry.fileName, shared: true }
  }

  // No share sheet available: the file is still saved in the app cache.
  return { fileName: entry.fileName, shared: false }
}

async function canShare(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false
  try {
    return (await Share.canShare()).value
  } catch {
    return false
  }
}