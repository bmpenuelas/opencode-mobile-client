import { Capacitor } from '@capacitor/core'

export async function configureSystemBars(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return

  try {
    const { SystemBars } = await import('@capacitor/core')
    if ((SystemBars as any)?.setStatusBar) {
      await (SystemBars as any).setStatusBar({
        style: 'DARK',
        overlaysWebView: false,
      })
    }
    if ((SystemBars as any)?.setNavigationBar) {
      await (SystemBars as any).setNavigationBar({
        style: 'DARK',
      })
    }
  } catch {
    // SystemBars plugin may not be installed or available
  }
}
