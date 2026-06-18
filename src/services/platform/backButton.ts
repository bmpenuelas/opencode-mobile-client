import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'

type BackButtonHandler = () => Promise<boolean>

let registeredHandler: BackButtonHandler | null = null

export function registerBackButton(handler: BackButtonHandler): void {
  registeredHandler = handler

  if (!Capacitor.isNativePlatform()) return

  App.addListener('backButton', async () => {
    if (registeredHandler) {
      const handled = await registeredHandler()
      if (!handled) {
        App.exitApp()
      }
    }
  })
}

export function unregisterBackButton(): void {
  registeredHandler = null
}
