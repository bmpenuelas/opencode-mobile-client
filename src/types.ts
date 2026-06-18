export interface ServerProfile {
  id: string
  name: string
  baseUrl: string
  authEnabled: boolean
  username: string
  isDefault: boolean
  autoConnect: boolean
  allowInsecureHttp: boolean
  lastStatus: ServerStatus
  lastConnectedAt: string | null
}

export type ServerStatus =
  | 'unknown'
  | 'checking'
  | 'connected'
  | 'auth_required'
  | 'wrong_credentials'
  | 'unreachable'
  | 'frame_blocked'

export type ConnectionState = ServerStatus | 'idle' | 'reconnecting' | 'disconnected'

export interface HealthCheckResult {
  reachable: boolean
  status: ServerStatus
  statusCode?: number
}

export interface ConnectionConfig {
  healthCheckTimeoutMs: number
  healthPollIntervalMs: number
  exponentialReconnect: boolean
}
