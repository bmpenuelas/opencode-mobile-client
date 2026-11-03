import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: vi.fn(() => true),
  },
}))

vi.mock('@capacitor/filesystem', () => ({
  Directory: { Cache: 'CACHE' },
  Filesystem: {
    writeFile: vi.fn(async () => ({ uri: 'file:///cache/opencode-downloads/report.html' })),
  },
}))

vi.mock('@capacitor/share', () => ({
  Share: {
    canShare: vi.fn(async () => ({ value: true })),
    share: vi.fn(async () => ({})),
  },
}))

import { Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import {
  DEVICE_DOWNLOAD_MESSAGE_TYPE,
  handleDeviceDownloadMessage,
  parseDeviceDownloadMessage,
  resetDeviceDownloads,
  sanitizeDownloadFileName,
} from '@/services/platform/deviceDownloads'

const base = { type: DEVICE_DOWNLOAD_MESSAGE_TYPE } as const

describe('parseDeviceDownloadMessage', () => {
  it('accepts a start message', () => {
    expect(parseDeviceDownloadMessage({ ...base, phase: 'start', id: 'a', fileName: 'report.html', mimeType: 'text/html', size: 10 }))
      .toEqual({ ...base, phase: 'start', id: 'a', fileName: 'report.html', mimeType: 'text/html', size: 10 })
  })

  it('accepts chunk, finish and error messages', () => {
    expect(parseDeviceDownloadMessage({ ...base, phase: 'chunk', id: 'a', base64: 'aGk=' })).toEqual({ ...base, phase: 'chunk', id: 'a', base64: 'aGk=' })
    expect(parseDeviceDownloadMessage({ ...base, phase: 'finish', id: 'a' })).toEqual({ ...base, phase: 'finish', id: 'a' })
    expect(parseDeviceDownloadMessage({ ...base, phase: 'error', id: 'a', message: 'nope' })).toEqual({ ...base, phase: 'error', id: 'a', message: 'nope' })
  })

  it('ignores unrelated or malformed payloads', () => {
    expect(parseDeviceDownloadMessage(undefined)).toBeNull()
    expect(parseDeviceDownloadMessage({ type: 'opencode:web-notification' })).toBeNull()
    expect(parseDeviceDownloadMessage({ ...base, phase: 'start', id: 'a' })).toBeNull()
    expect(parseDeviceDownloadMessage({ ...base, phase: 'chunk', id: 'a' })).toBeNull()
    expect(parseDeviceDownloadMessage({ ...base, phase: 'nope', id: 'a' })).toBeNull()
  })
})

describe('sanitizeDownloadFileName', () => {
  it('strips path separators and control characters', () => {
    expect(sanitizeDownloadFileName('../../etc/passwd')).toBe('_.._etc_passwd')
    expect(sanitizeDownloadFileName('a:b*c?.txt')).toBe('a_b_c_.txt')
  })

  it('falls back to a default for empty names', () => {
    expect(sanitizeDownloadFileName('')).toBe('download')
    expect(sanitizeDownloadFileName(undefined)).toBe('download')
  })
})

describe('handleDeviceDownloadMessage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetDeviceDownloads()
    vi.mocked(Share.canShare).mockResolvedValue({ value: true })
  })

  it('writes the received bytes and opens the share sheet', async () => {
    await handleDeviceDownloadMessage({ ...base, phase: 'start', id: 'one', fileName: 'report.html', size: 2 })
    await handleDeviceDownloadMessage({ ...base, phase: 'chunk', id: 'one', base64: 'aGk=' })
    const result = await handleDeviceDownloadMessage({ ...base, phase: 'finish', id: 'one' })

    expect(Filesystem.writeFile).toHaveBeenCalledWith({
      path: expect.stringContaining('report.html'),
      data: 'aGk=',
      directory: 'CACHE',
      recursive: true,
    })
    expect(Share.share).toHaveBeenCalledWith(expect.objectContaining({ files: ['file:///cache/opencode-downloads/report.html'] }))
    expect(result).toEqual({ fileName: 'report.html', shared: true })
  })

  it('throws on an error phase and drops the download', async () => {
    await handleDeviceDownloadMessage({ ...base, phase: 'start', id: 'two', fileName: 'x.bin' })
    await expect(handleDeviceDownloadMessage({ ...base, phase: 'error', id: 'two', message: 'boom' })).rejects.toThrow('boom')
    expect(Filesystem.writeFile).not.toHaveBeenCalled()
  })

  it('saves without sharing when the share sheet is unavailable', async () => {
    vi.mocked(Share.canShare).mockResolvedValue({ value: false })
    await handleDeviceDownloadMessage({ ...base, phase: 'start', id: 'three', fileName: 'notes.md' })
    const result = await handleDeviceDownloadMessage({ ...base, phase: 'finish', id: 'three' })

    expect(Filesystem.writeFile).toHaveBeenCalled()
    expect(Share.share).not.toHaveBeenCalled()
    expect(result).toEqual({ fileName: 'notes.md', shared: false })
  })
})