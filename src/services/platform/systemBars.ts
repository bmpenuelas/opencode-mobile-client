import { Capacitor } from '@capacitor/core'

function isDarkMode(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export async function configureSystemBars(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return

  const style = isDarkMode() ? 'LIGHT' : 'DARK'

  try {
    const { SystemBars } = await import('@capacitor/core')
    if ((SystemBars as any)?.setStatusBar) {
      await (SystemBars as any).setStatusBar({
        style,
        overlaysWebView: false,
      })
    }
    if ((SystemBars as any)?.setNavigationBar) {
      await (SystemBars as any).setNavigationBar({
        style,
      })
    }
  } catch {
    // SystemBars plugin may not be installed or available
  }
}
