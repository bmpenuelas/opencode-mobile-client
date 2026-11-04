import { Capacitor, registerPlugin } from '@capacitor/core'

export type QrScanResult =
  | { type: 'scanned'; text: string }
  | { type: 'cancelled' }
  | { type: 'denied' }
  | { type: 'failed' }

interface BarcodeScannerPlugin {
  scanBarcode(options: Record<string, unknown>): Promise<{ ScanResult: string }>
}

// @capacitor/barcode-scanner is registered by name because importing its JS would put
// a 370 KB web decoder in the startup bundle, and scanning only ever runs natively.
const BarcodeScanner = registerPlugin<BarcodeScannerPlugin>('CapacitorBarcodeScanner')

// The native side requires every option here except `android`.
const SCAN_OPTIONS = {
  hint: 0, // QR_CODE
  scanButton: false,
  scanText: ' ',
  cameraDirection: 1, // BACK
  scanOrientation: 3, // ADAPTIVE
  // ML Kit reports usage to Google, which the privacy policy rules out. See docs/architecture.md.
  android: { scanningLibrary: 'zxing' },
}

// The plugin uses these codes on both Android and iOS.
const SCAN_CANCELLED = 'OS-PLUG-BARC-0006'
const CAMERA_DENIED = 'OS-PLUG-BARC-0007'

export function canScanQrCode(): boolean {
  return Capacitor.isNativePlatform()
}

export async function scanQrCode(instructions: string): Promise<QrScanResult> {
  try {
    const { ScanResult: text } = await BarcodeScanner.scanBarcode({ ...SCAN_OPTIONS, scanInstructions: instructions })
    return text ? { type: 'scanned', text } : { type: 'failed' }
  } catch (err) {
    const code = (err as { code?: unknown } | null)?.code
    if (code === SCAN_CANCELLED) return { type: 'cancelled' }
    if (code === CAMERA_DENIED) return { type: 'denied' }
    return { type: 'failed' }
  }
}
