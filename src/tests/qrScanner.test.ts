import { beforeEach, describe, expect, it, vi } from 'vitest'

const { isNativePlatform, scanBarcode } = vi.hoisted(() => ({
  isNativePlatform: vi.fn(() => true),
  scanBarcode: vi.fn(),
}))

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform },
  registerPlugin: () => ({ scanBarcode }),
}))

import { setLocale, supportedLocales, t } from '@/i18n'
import { parsePairingLink } from '@/services/opencode/pairing'
import { canScanQrCode, scanQrCode } from '@/services/platform/qrScanner'

const QR_TEXT = JSON.stringify({ code: 'abc_DEF-123', urls: ['http://192.168.1.2:49374', 'http://100.64.0.3:49374'] })

describe('qrScanner', () => {
  beforeEach(() => {
    scanBarcode.mockReset()
    isNativePlatform.mockReturnValue(true)
  })

  it('is only offered on native platforms', () => {
    expect(canScanQrCode()).toBe(true)
    isNativePlatform.mockReturnValue(false)
    expect(canScanQrCode()).toBe(false)
  })

  it('returns the text of the QR code, which parsePairingLink accepts', async () => {
    scanBarcode.mockResolvedValue({ ScanResult: QR_TEXT, format: 0 })

    const result = await scanQrCode('Point the camera')

    expect(result).toEqual({ type: 'scanned', text: QR_TEXT })
    expect(parsePairingLink(QR_TEXT)?.urls).toHaveLength(2)
  })

  it('sends every option the native side requires, and never uses ML Kit', async () => {
    scanBarcode.mockResolvedValue({ ScanResult: QR_TEXT, format: 0 })

    await scanQrCode('Point the camera')

    expect(scanBarcode).toHaveBeenCalledWith({
      hint: 0,
      scanInstructions: 'Point the camera',
      scanButton: false,
      scanText: ' ',
      cameraDirection: 1,
      scanOrientation: 3,
      android: { scanningLibrary: 'zxing' },
    })
  })

  it.each([
    ['OS-PLUG-BARC-0006', 'cancelled'],
    ['OS-PLUG-BARC-0007', 'denied'],
    ['OS-PLUG-BARC-0004', 'failed'],
    [undefined, 'failed'],
  ])('maps plugin error %s to %s', async (code, type) => {
    scanBarcode.mockRejectedValue(Object.assign(new Error('scan error'), { code }))

    await expect(scanQrCode('Point the camera')).resolves.toEqual({ type })
  })

  it('treats an empty result as a failure', async () => {
    scanBarcode.mockResolvedValue({ ScanResult: '', format: 0 })

    await expect(scanQrCode('Point the camera')).resolves.toEqual({ type: 'failed' })
  })
})

describe('scan strings', () => {
  const keys = ['tips.pair3Scan', 'form.scanQr', 'form.scanInstructions', 'form.scanDenied', 'form.scanInvalid', 'form.scanFailed']

  it('are translated in every catalog', () => {
    setLocale('en-US')
    const english = keys.map((key) => t(key))
    expect(english).not.toContain(keys[0])

    for (const { code } of supportedLocales.filter((locale) => locale.code !== 'en-US')) {
      setLocale(code)
      keys.forEach((key, index) => {
        expect(t(key), `${key} in ${code}`).not.toBe(key)
        expect(t(key), `${key} in ${code}`).not.toBe(english[index])
      })
    }
    setLocale('en-US')
  })
})
