export const DEMO_USERNAME = 'demo_user_1234'
export const DEMO_PASSWORD = 'demo_password_12345678'
export const DEMO_IP = '192.168.1.123'

interface DemoModeOptions {
  baseUrl?: string
  username?: string
  password?: string | null
}

export function isDemoModeCredentials(options: DemoModeOptions): boolean {
  const { username, password } = options
  return username === DEMO_USERNAME && password === DEMO_PASSWORD
}

export function isDemoModeServer(options: DemoModeOptions): boolean {
  return isDemoModeCredentials(options)
}
